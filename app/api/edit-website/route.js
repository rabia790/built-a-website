import { z } from "zod";
import { parseWebsiteResponse } from "@/lib/parseWebsiteResponse";

const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string().min(1),
});

const requestSchema = z.object({
  instruction: z.string().trim().min(1, "Edit instruction is required."),
  currentFiles: z.array(fileSchema).min(1, "Current website files are required."),
});

const AI_TIMEOUT_MS = 45000;

const systemPrompt = `You edit existing React/Tailwind websites for an iframe React preview.

Return the full updated website using exactly this separator format and nothing else:

TITLE:
Website title here

---APP_JS---
React code here

---STYLES_CSS---
CSS code here

Rules:
- Do not return JSON.
- Do not return markdown.
- Do not wrap code in triple backticks.
- Do not explain anything.
- Return only the separator format.
- Put all React code inside APP_JS.
- Put all CSS inside STYLES_CSS.
- Preserve the current website unless the instruction requires changes.
- Do not use imports.
- Do not use export default inline anonymous function.
- Must define function App().
- End with export default App.
- Keep all components in /App.js.
- Keep CSS in /styles.css.
- Do not import external packages.
- Do not import lucide-react.
- Do not import next/image.
- Do not import next/link.
- Do not import local components.
- Do not import local files, assets, or CSS from /App.js.
- Do not use external libraries.
- Use normal JSX.
- Use inline SVG icons if icons are needed.
- Tailwind classes are allowed.
- Keep the website responsive and modern.`;

async function readRequestPayload(request) {
  const queryPayload = new URL(request.url).searchParams.get("payload");

  if (queryPayload) {
    return JSON.parse(queryPayload);
  }

  return JSON.parse(await request.text());
}

export async function POST(request) {
  if (!process.env.GROQ_API_KEY?.trim()) {
    return Response.json(
      {
        error: "Groq is not configured yet. Add GROQ_API_KEY to .env.local.",
      },
      { status: 500 },
    );
  }

  try {
    const body = await readRequestPayload(request);
    const { instruction, currentFiles } = requestSchema.parse(body);
    const [{ generateText }, { groq }] = await Promise.all([
      import("ai"),
      import("@ai-sdk/groq"),
    ]);

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: `Edit instruction: ${instruction}

Current files:
${JSON.stringify(currentFiles, null, 2)}`,
      temperature: 0.25,
      abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
      maxRetries: 0,
    });

    const website = parseWebsiteResponse(text);

    if (!website) {
      console.error("AI response could not be parsed:", text);
      return Response.json(
        { error: "AI response could not be parsed. Please try again." },
        { status: 502 },
      );
    }

    return Response.json(website);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }

    return Response.json(
      {
        error:
          error.name === "TimeoutError"
            ? "Groq took too long to respond. Please try a smaller edit."
            : error.message?.includes("Cannot connect to API")
              ? "Could not connect to the Groq API. Check your internet connection, API key, and Groq API access."
            : error.message || "Groq could not edit the website.",
      },
      { status: 500 },
    );
  }
}
