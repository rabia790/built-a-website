import { z } from "zod";
import { serverSupabase } from "@/lib/serverSupabase";

const requestSchema = z.object({
  logType: z.enum(["generation", "edit"]),
  logId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().min(1),
});

export async function POST(request) {
  if (!serverSupabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  try {
    const queryPayload = new URL(request.url).searchParams.get("payload");
    const rawBody = queryPayload ? JSON.parse(queryPayload) : await request.json();
    const body = requestSchema.parse(rawBody);
    const table = body.logType === "generation" ? "generation_logs" : "edit_logs";

    const updatePayload =
      body.logType === "generation"
        ? { user_rating: body.rating, user_feedback: body.feedback }
        : { user_rating: body.rating };

    const { error } = await serverSupabase
      .from(table)
      .update(updatePayload)
      .eq("id", body.logId);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }

    return Response.json(
      { error: error.message || "Could not save feedback." },
      { status: 500 },
    );
  }
}
