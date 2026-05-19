import { serverSupabase } from "@/lib/serverSupabase";

function slugify(value = "") {
  return String(value || "website")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "website";
}

async function createUniqueSlug(projectId, title) {
  const baseSlug = slugify(title);
  let candidate = baseSlug;
  let suffix = 2;

  while (suffix < 200) {
    const { data, error } = await serverSupabase
      .from("projects")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.id === projectId) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return `${baseSlug}-${projectId.slice(0, 8)}`;
}

export async function POST(request) {
  if (!serverSupabase) {
    return Response.json(
      { error: "Supabase is not configured yet. Add your keys in .env.local." },
      { status: 500 },
    );
  }

  try {
    const { projectId } = await request.json();
    console.log("Publish request projectId:", projectId);

    if (!projectId?.trim()) {
      return Response.json({ error: "Project id is required." }, { status: 400 });
    }

    const { data: project, error: projectError } = await serverSupabase
      .from("projects")
      .select("id,title,slug,status")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("Publish project lookup failed:", projectError?.message);
      return Response.json({ error: "Project was not found." }, { status: 404 });
    }

    const { data: files, error: filesError } = await serverSupabase
      .from("project_files")
      .select("id")
      .eq("project_id", project.id)
      .limit(1);

    if (filesError) {
      throw new Error(filesError.message);
    }

    if (!files?.length) {
      return Response.json(
        { error: "Save project files before publishing." },
        { status: 400 },
      );
    }

    const slug = project.slug || (await createUniqueSlug(project.id, project.title));
    const publishedAt = new Date().toISOString();

    const { error: updateError } = await serverSupabase
      .from("projects")
      .update({
        slug,
        status: "published",
        published_at: publishedAt,
      })
      .eq("id", project.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const origin = request.headers.get("origin") || new URL(request.url).origin;

    return Response.json({
      success: true,
      slug,
      liveUrl: `${origin}/site/${slug}`,
      status: "published",
      publishedAt,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not publish this project." },
      { status: 500 },
    );
  }
}
