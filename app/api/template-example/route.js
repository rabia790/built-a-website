import { z } from "zod";
import { detectWebsiteCategory } from "@/lib/detectWebsiteCategory";
import { serverSupabase } from "@/lib/serverSupabase";

const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string().min(1),
});

const requestSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  category: z.string().optional(),
  templateVariant: z.string().optional(),
  editInstruction: z.string().optional(),
  resultLabel: z.string().optional(),
  files: z.array(fileSchema).min(1),
});

function getFile(files, path) {
  return files.find((file) => file.path === path)?.content || "";
}

export async function POST(request) {
  if (!serverSupabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const rawBody = await request.json();
    const body = requestSchema.parse(rawBody);
    const category =
      body.category && body.category !== "ai_generated"
        ? body.category
        : detectWebsiteCategory(body.prompt);

    const { error } = await serverSupabase.from("template_examples").insert({
      category,
      template_variant: body.templateVariant || null,
      original_prompt: body.prompt,
      edit_instruction: body.editInstruction || null,
      result_label: body.resultLabel || "featured",
      title: body.title,
      prompt: body.prompt,
      app_code: getFile(body.files, "/App.js"),
      css_code: getFile(body.files, "/styles.css"),
      rating: 5,
      is_featured: true,
    });

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }

    return Response.json(
      { error: error.message || "Could not save template example." },
      { status: 500 },
    );
  }
}
