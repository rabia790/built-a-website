import { z } from "zod";
import { isServerSupabaseConfigured, serverSupabase } from "@/lib/serverSupabase";

const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string().min(1),
});

const requestSchema = z.object({
  title: z.string().optional(),
  originalPrompt: z.string().optional(),
  category: z.string().optional().nullable(),
  templateVariant: z.string().optional().nullable(),
  designSeed: z.string().optional().nullable(),
  generationLogId: z.string().optional().nullable(),
  files: z.array(fileSchema).min(1),
});

function getErrorMessage(error) {
  if (!error) return "Unknown save error.";

  const details = [
    error.message,
    error.details,
    error.hint,
    error.code ? `Code: ${error.code}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return details || String(error);
}

export async function POST(request) {
  if (!isServerSupabaseConfigured || !serverSupabase) {
    return Response.json(
      {
        error: "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
      },
      { status: 500 },
    );
  }

  try {
    const body = requestSchema.parse(await request.json());
    const now = new Date().toISOString();

    const { data: savedProject, error: projectError } = await serverSupabase
      .from("projects")
      .insert({
        title: body.title?.trim() || "Untitled website",
        original_prompt: body.originalPrompt?.trim() || "",
        status: "draft",
        category: body.category || null,
        template_variant: body.templateVariant || null,
        design_seed: body.designSeed || null,
        updated_at: now,
      })
      .select("*")
      .single();

    if (projectError) {
      return Response.json(
        { error: `Could not save project metadata. ${getErrorMessage(projectError)}` },
        { status: 500 },
      );
    }

    const fileRows = body.files.map((file) => ({
      project_id: savedProject.id,
      file_path: file.path,
      file_content: file.content,
      updated_at: now,
    }));

    const { error: filesError } = await serverSupabase
      .from("project_files")
      .insert(fileRows);

    if (filesError) {
      return Response.json(
        { error: `Could not save project files. ${getErrorMessage(filesError)}` },
        { status: 500 },
      );
    }

    if (body.generationLogId) {
      const { error: logError } = await serverSupabase
        .from("generation_logs")
        .update({ project_id: savedProject.id })
        .eq("id", body.generationLogId);

      if (logError) {
        console.error("Could not link generation log:", getErrorMessage(logError));
      }
    }

    return Response.json({ project: savedProject });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message || "Invalid save request." },
        { status: 400 },
      );
    }

    return Response.json(
      {
        error:
          error instanceof TypeError
            ? `Could not reach Supabase from the save API. ${error.message}`
            : error.message || "Could not save this project.",
      },
      { status: 500 },
    );
  }
}
