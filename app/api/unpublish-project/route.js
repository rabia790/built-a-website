import { serverSupabase } from "@/lib/serverSupabase";

export async function POST(request) {
  if (!serverSupabase) {
    return Response.json(
      { error: "Supabase is not configured yet. Add your keys in .env.local." },
      { status: 500 },
    );
  }

  try {
    const { projectId } = await request.json();

    if (!projectId?.trim()) {
      return Response.json({ error: "Project id is required." }, { status: 400 });
    }

    const { data: project, error: projectError } = await serverSupabase
      .from("projects")
      .select("id,slug")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return Response.json({ error: "Project was not found." }, { status: 404 });
    }

    const { error: updateError } = await serverSupabase
      .from("projects")
      .update({ status: "unpublished" })
      .eq("id", project.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return Response.json({
      success: true,
      slug: project.slug || "",
      status: "unpublished",
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not unpublish this project." },
      { status: 500 },
    );
  }
}
