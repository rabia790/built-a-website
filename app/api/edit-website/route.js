import { z } from "zod";
import {
  ensureImagesInGeneratedCode,
  hasRemoteImageReference,
  shouldIncludeImages,
} from "@/lib/fixBrokenImagePaths";
import { parseWebsiteResponse } from "@/lib/parseWebsiteResponse";
import { safeInsert } from "@/lib/serverSupabase";
import { validateWebsiteQuality } from "@/lib/validateWebsiteQuality";

const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string().min(1),
});

const requestSchema = z.object({
  instruction: z.string().trim().min(1, "Edit instruction is required."),
  currentFiles: z.array(fileSchema).min(1, "Current website files are required."),
  projectId: z.string().optional(),
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
- Never make the website more generic.
- Preserve or improve the brand specificity, realistic copy, visual hierarchy, navigation, sections, CTA buttons, cards, stats, testimonials, and contact section.
- The hero section must be visually strong and appear first.
- Do not start the page with Services, About, Features, or pricing.
- Always include a modern hero with headline, subheadline, CTA, trust signal, and visual element.
- Hero must look premium and visually interesting.
- Do not generate plain centered hero text only.
- Add visual cards, stats, trust badges, and a stronger CTA section.
- Every generated website must include at least one strong visual image in the hero section unless the user specifically says no images.
- Hero section should usually be a split layout: left side headline, subheadline, CTAs, and stats; right side large image card or visual image collage.
- Use proper img attributes: src, alt, className, and loading="lazy".
- Use only full remote image URLs.
- Do not use local image paths like /image1.jpg, /hero.jpg, /gallery.jpg, or /office.jpg.
- Use curated Unsplash image URLs based on business type.
- For staffing/company/office use: https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80
- For SaaS/tech use: https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80
- For restaurant use: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80
- For home staging/interior use: https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80
- For wedding/photography use: https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80
- For portfolio/brand designer use: https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80
- Use polished spacing and layout.
- Generated website must look like a premium modern landing page.
- Avoid old-looking centered heroes with plain gray blocks.
- Avoid plain centered gray blocks anywhere in the page.
- Avoid generic navigation labels and generic headings.
- Avoid "Welcome to..." copy.
- Use strong business-specific copy.
- Use elegant section spacing.
- Use modern cards, stats, testimonials, CTAs, and proof points.
- Use good visual hierarchy with clear content rhythm.
- Use refined colors based on the business type.
- Use CSS gradients only subtly.
- Use modern font sizing and generous line height.
- Make the design look like a real agency, SaaS, service, or portfolio website.
- Make the design look like a real premium website, not a beginner template.
- For staffing websites, include an employer/candidate split, industries served, hiring stats, and process cards.
- For staffing websites, avoid generic headings like "Find the Right Fit".
- For staffing websites, use stronger copy such as "Hire reliable talent without slowing down your business" or "Flexible staffing solutions for growing teams".
- Prefer polished layout over too many sections.
- Use responsive design.
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
- Do not use local image paths like /image1.jpg, /image2.jpg, /hero.jpg, /gallery.jpg, /restaurant.jpg, or /office.jpg.
- Do not reference images from the public folder unless they already exist.
- Use full remote image URLs only.
- Use images.unsplash.com URLs when images are needed.
- If no image is needed, use gradient blocks, cards, SVG icons, and styled placeholders.
- Never generate broken local image paths.
- Do not import lucide-react.
- Do not import next/image.
- Do not import next/link.
- Do not import local components.
- Do not import local files, assets, or CSS from /App.js.
- Do not use external libraries.
- Use normal JSX.
- Use inline SVG icons if icons are needed.
- Tailwind classes are allowed.
- Use custom CSS if needed.
- Keep the website responsive and modern.

Before writing code, silently check:
- Is the design specific to the business?
- Is the copy realistic?
- Does the page look premium?
- Does it have enough sections?
- Is it better than a generic template?

Do not output this thinking. Only output the separator format.`;

async function readRequestPayload(request) {
  const queryPayload = new URL(request.url).searchParams.get("payload");

  if (queryPayload) {
    return JSON.parse(queryPayload);
  }

  return JSON.parse(await request.text());
}

function postProcessWebsiteImages(website, promptContext) {
  return {
    ...website,
    files: website.files.map((file) =>
      file.path === "/App.js"
        ? {
            ...file,
            content: ensureImagesInGeneratedCode(file.content, promptContext),
          }
        : file,
    ),
  };
}

function appCodeHasRequiredImage(website, promptContext) {
  if (!shouldIncludeImages(promptContext)) {
    return true;
  }

  const appFile = website.files.find((file) => file.path === "/App.js");
  return hasRemoteImageReference(appFile?.content || "");
}

function getFileContent(files, path) {
  return files.find((file) => file.path === path)?.content || "";
}

function getWebsiteCode(website) {
  return {
    appCode: getFileContent(website.files || [], "/App.js"),
    cssCode: getFileContent(website.files || [], "/styles.css"),
  };
}

async function logEdit({
  projectId,
  instruction,
  currentFiles,
  website,
  validation,
  success,
}) {
  const { appCode, cssCode } = getWebsiteCode(website);

  const log = await safeInsert("edit_logs", {
    project_id: projectId || null,
    instruction,
    before_app_code: getFileContent(currentFiles, "/App.js"),
    before_css_code: getFileContent(currentFiles, "/styles.css"),
    after_app_code: appCode,
    after_css_code: cssCode,
    edit_success: success,
    validation_errors: validation.errors,
  });

  return log?.id || "";
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
    const { instruction, currentFiles, projectId } = requestSchema.parse(body);
    const [{ generateText }, { groq }] = await Promise.all([
      import("ai"),
      import("@ai-sdk/groq"),
    ]);

    const editPrompt = `Edit instruction: ${instruction}

Current files:
${JSON.stringify(currentFiles, null, 2)}`;

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: editPrompt,
      temperature: 0.25,
      abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
      maxRetries: 0,
    });

    let website = parseWebsiteResponse(text);

    if (!website) {
      console.error("AI response could not be parsed:", text);
      return Response.json(
        { error: "AI response could not be parsed. Please try again." },
        { status: 502 },
      );
    }

    const promptContext = `${instruction}\n${JSON.stringify(currentFiles)}`;
    website = postProcessWebsiteImages(website, promptContext);
    let validation = validateWebsiteQuality({
      ...getWebsiteCode(website),
      instruction,
    });

    if (!appCodeHasRequiredImage(website, promptContext) || validation.score < 75) {
      const { text: retryText } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        system: systemPrompt,
        prompt: `${editPrompt}

The edit result failed validation. Regenerate the full updated website and preserve the important structure while fixing these issues:
${validation.errors.map((issue) => `- ${issue}`).join("\n")}

If the user asked for pricing/packages, include pricing/packages. If they asked for more luxury, strengthen typography, spacing, visual hierarchy, colors, and premium design language. Include a real remote hero image when images are expected.`,
        temperature: 0.25,
        abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
        maxRetries: 0,
      });

      const retryWebsite = parseWebsiteResponse(retryText);

      if (retryWebsite) {
        website = postProcessWebsiteImages(retryWebsite, promptContext);
        validation = validateWebsiteQuality({
          ...getWebsiteCode(website),
          instruction,
        });
      }
    }

    const editLogId = await logEdit({
      projectId,
      instruction,
      currentFiles,
      website,
      validation,
      success: validation.score >= 75,
    });

    return Response.json({
      ...website,
      editLogId,
      qualityScore: validation.score,
      validationErrors: validation.errors,
    });
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
