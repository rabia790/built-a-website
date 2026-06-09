import { generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { applySectionEdit } from "@/lib/applySectionEdit";
import { applySimpleEdit, hasSimpleEditSignal } from "@/lib/applySimpleEdit";
import { ensureImagesInGeneratedCode } from "@/lib/fixBrokenImagePaths";
import { normalizeEditInstruction } from "@/lib/normalizeEditInstruction";
import { parseWebsiteResponse } from "@/lib/parseWebsiteResponse";
import { safeInsert } from "@/lib/serverSupabase";
import { validateWebsiteQuality } from "@/lib/validateWebsiteQuality";

const AI_TIMEOUT_MS = 25000;
const SIMPLE_EDIT_MODEL = "llama-3.1-8b-instant";

function findFile(files, acceptedPaths) {
  return files.find((file) => acceptedPaths.includes(file.path));
}

function getFileContent(files, acceptedPaths) {
  return findFile(files, acceptedPaths)?.content || "";
}

function getWebsiteCode(website) {
  return {
    appCode: getFileContent(website.files || [], ["/App.js", "App.js", "/App.jsx"]),
    cssCode: getFileContent(website.files || [], ["/styles.css", "styles.css"]),
  };
}

function extractRemoteImages(code = "") {
  return String(code).match(/https?:\/\/[^"')\s]+/g)?.filter((url) =>
    /images\.unsplash\.com|\.jpg|\.jpeg|\.png|\.webp|\.avif|\.svg/i.test(url),
  ) || [];
}

function extractPageNames(code = "") {
  const matches = String(code).match(/function\s+([A-Z][A-Za-z0-9]*Page)\s*\(/g) || [];
  return matches.map((match) =>
    match.replace(/^function\s+/, "").replace(/\s*\($/, ""),
  );
}

function isHeroHeadlineBlackEdit(instruction = "") {
  const text = String(instruction || "").toLowerCase();
  return (
    text.includes("hero") &&
    text.includes("headline") &&
    text.includes("color") &&
    text.includes("black")
  );
}

function isHeroHeadlineFontSizeEdit(instruction = "") {
  const text = String(instruction || "").toLowerCase();
  const mentionsHeadline =
    text.includes("hero") ||
    text.includes("headline") ||
    text.includes("connect growing companies");

  return (
    mentionsHeadline &&
    (text.includes("font size") ||
      text.includes("bigger") ||
      text.includes("larger") ||
      /\d{2,4}\s*px/i.test(text))
  );
}

function isLogoEdit(instruction = "") {
  const text = String(instruction || "").toLowerCase();
  return (
    /(logo|icon|brand mark|brand name|navbar brand|mark)/i.test(text) &&
    /(make|add|create|include|show|fix|repair|logo|icon|overlap|overlapping|unreadable)/i.test(
      text,
    )
  );
}

function countMatches(value = "", pattern) {
  return String(value).match(pattern)?.length || 0;
}

function getRetryAfterMinutes(error) {
  const retryAfter =
    error?.response?.headers?.get?.("retry-after") ||
    error?.headers?.get?.("retry-after") ||
    error?.retryAfter ||
    "";
  const seconds = Number(retryAfter);

  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.max(1, Math.ceil(seconds / 60));
  }

  const text = `${error?.message || ""} ${error?.cause?.message || ""}`;
  const minuteMatch = text.match(/try again in\s+(\d+(?:\.\d+)?)\s*m/i);
  if (minuteMatch) {
    return Math.max(1, Math.ceil(Number(minuteMatch[1])));
  }

  const secondMatch = text.match(/try again in\s+(\d+(?:\.\d+)?)\s*s/i);
  if (secondMatch) {
    return Math.max(1, Math.ceil(Number(secondMatch[1]) / 60));
  }

  return 0;
}

function isRateLimitError(error) {
  const text = `${error?.message || ""} ${error?.cause?.message || ""}`.toLowerCase();
  return error?.statusCode === 429 || error?.status === 429 || text.includes("rate limit");
}

function buildRateLimitMessage(error) {
  const minutes = getRetryAfterMinutes(error);
  return `AI edit limit reached. Your previous design was kept. Try again later or use a smaller edit.${
    minutes ? ` Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` : ""
  }`;
}

function buildWebsiteFromCode(baseWebsite, appCode, cssCode) {
  return {
    ...baseWebsite,
    files: [
      { path: "/App.js", content: appCode },
      { path: "/styles.css", content: cssCode },
    ],
  };
}

function buildEditPrompt({
  currentTitle,
  instruction,
  appCode,
  cssCode,
  prompt,
  category,
  websiteType,
  templateVariant,
  designSeed,
  imageSetUsed,
  editPlan,
  editContext,
  validationErrors = [],
}) {
  const validationBlock = validationErrors.length
    ? `\nThe previous output failed validation. Fix these issues:\n${validationErrors
        .map((issue) => `- ${issue}`)
        .join("\n")}\n`
    : "";

  return `You are editing an existing premium website.

Do not create a new website.
Do not regenerate from scratch.
This is a targeted edit.
Preserve the current layout, pages, navbar, footer, images, colors, typography, and design system.
Apply only the requested edit.
If the user asks to change a color, update the relevant className or CSS rule.
If the user asks to change font size, update the relevant className or CSS rule.
If the instruction says hero headline, find the main hero h1 text and update its color.
If the user asks for a logo icon, add a premium inline SVG mark or styled monogram next to the brand name in the navbar. Do not generate image files.
Prefer stable editable targets such as data-edit-id="hero-headline" and CSS variables such as --hero-headline-size and --hero-headline-color.

Current title:
${currentTitle || "Untitled website"}

Original user prompt:
${prompt || "Not provided"}

Website type:
${category || websiteType || "Not provided"}

Current template variant:
${templateVariant || "Not provided"}

Current design seed:
${designSeed || "Not provided"}

Current image set:
${Array.isArray(imageSetUsed) && imageSetUsed.length ? imageSetUsed.join("\n") : "Not provided"}

User edit instruction:
${instruction}

Normalized edit plan:
Type: ${editPlan?.editType || "unknown"}
Target: ${editPlan?.target || "unknown"}
Action: ${editPlan?.action || "unknown"}
Constraints:
${Array.isArray(editPlan?.constraints) ? editPlan.constraints.map((item) => `- ${item}`).join("\n") : "- Keep existing design style"}

${editContext?.mode === "focused" ? `Focused App.js snippets:
${editContext.appCode}

Focused styles.css snippets:
${editContext.cssCode}

Only the most relevant snippets were included to reduce token usage. Preserve the existing website structure and return the full updated files using the same component names and design system.` : `Current App.js:
${appCode}

Current styles.css:
${cssCode}`}
${validationBlock}
Return the FULL updated website, not a patch.
Return the full updated App.js and styles.css.

Output format must be exactly:

TITLE:
Updated title

---APP_JS---
Full updated App.js code

---STYLES_CSS---
Full updated styles.css code

Rules:
- Do not return markdown
- Do not explain anything
- Do not return JSON
- Keep all existing pages unless user asks to remove them
- For section/page edits, update only the target section/page named in the normalized edit plan
- Preserve the current template variant and design structure unless the user asks for a major redesign
- Do not collapse the website back into a simple generic about/services template
- Do not replace the premium template/layout with a new basic website
- Preserve current colors, typography, spacing scale, section rhythm, navbar, footer, page components, and image strategy
- For targeted style changes, make the smallest possible App.js or styles.css change
- Preserve React.useState multi-page navigation if it exists
- Preserve navbar and footer
- Apply the requested edit across the full website
- If the user asks for pricing/packages, add or improve pricing/packages
- If the user asks for more luxury, strengthen typography, spacing, visual hierarchy, color palette, and premium design language
- Do not use imports
- Do not use next/image
- Do not use next/link
- Do not use external packages
- Do not import lucide-react
- Do not import local files or local components
- Use full remote image URLs only
- No fake local images
- Must define function App()
- End App.js with export default App`;
}

function extractFunctionBlock(code = "", functionName = "") {
  const start = code.search(new RegExp(`function\\s+${functionName}\\s*\\(`));
  if (start < 0) return "";

  const paramsStart = code.indexOf("(", start);
  let parenDepth = 0;
  let paramsEnd = -1;

  for (let index = paramsStart; index < code.length; index += 1) {
    if (code[index] === "(") parenDepth += 1;
    if (code[index] === ")") parenDepth -= 1;
    if (parenDepth === 0) {
      paramsEnd = index;
      break;
    }
  }

  const braceStart = code.indexOf("{", paramsEnd);
  if (braceStart < 0) return "";

  let depth = 0;
  for (let index = braceStart; index < code.length; index += 1) {
    const char = code[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      return code.slice(start, index + 1);
    }
  }

  return code.slice(start, Math.min(code.length, start + 5000));
}

function extractCssBlocks(cssCode = "", keywords = []) {
  const blocks = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match = pattern.exec(cssCode);

  while (match) {
    const block = `${match[1].trim()} {\n${match[2].trim()}\n}`;
    const lower = block.toLowerCase();
    if (keywords.some((keyword) => lower.includes(keyword))) {
      blocks.push(block);
    }
    match = pattern.exec(cssCode);
  }

  return blocks.join("\n\n").slice(0, 9000);
}

function buildFocusedEditContext(appCode = "", cssCode = "", instruction = "", editPlan = null) {
  const text = String(instruction || "").toLowerCase();
  const targets = [
    ["navbar", ["Navbar"], ["brand", "nav", "header", "site-header"]],
    ["nav", ["Navbar"], ["brand", "nav", "header", "site-header"]],
    ["hero", ["Hero"], ["hero", "eyebrow", "primary-button", "secondary-button", "stats"]],
    ["footer", ["Footer"], ["footer", "site-footer"]],
    ["pricing", ["PackagesPage", "PricingPage"], ["pricing", "package", "price"]],
    ["packages", ["PackagesPage", "PricingPage"], ["pricing", "package", "price"]],
    ["contact", ["ContactPage"], ["contact", "form"]],
    ["services", ["ServicesPage"], ["services", "service-card"]],
  ];
  const planTarget = String(editPlan?.target || "").toLowerCase();
  const planAction = String(editPlan?.action || "").toLowerCase();
  const selected = targets.filter(
    ([keyword]) =>
      text.includes(keyword) || planTarget.includes(keyword) || planAction.includes(keyword),
  );

  if (!selected.length) {
    return { mode: "full", appCode, cssCode };
  }

  const componentNames = [...new Set(selected.flatMap(([, components]) => components))];
  const cssKeywords = [...new Set(selected.flatMap(([, , keywords]) => keywords))];
  const snippets = componentNames
    .map((name) => extractFunctionBlock(appCode, name))
    .filter(Boolean);

  if (!snippets.length) {
    return { mode: "full", appCode, cssCode };
  }

  const globals = appCode
    .slice(0, Math.min(appCode.indexOf("function App"), 4500))
    .trim();
  const appShell = extractFunctionBlock(appCode, "App");

  return {
    mode: "focused",
    appCode: [globals, ...snippets, appShell].filter(Boolean).join("\n\n").slice(0, 14000),
    cssCode: extractCssBlocks(cssCode, cssKeywords) || cssCode.slice(0, 9000),
  };
}

function normalizeEditedWebsite(website, promptContext) {
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

function validateEditedWebsite(website, originalAppCode, originalCssCode, instruction = "") {
  const { appCode, cssCode } = getWebsiteCode(website);
  const errors = [];
  const originalPages = new Set(extractPageNames(originalAppCode));
  const editedPages = new Set(extractPageNames(appCode));
  const beforeImages = extractRemoteImages(originalAppCode);
  const afterImages = extractRemoteImages(appCode);
  const allowsImageRemoval = /(remove|delete|no|without)\s+(image|images|photo|photos|picture|pictures)/i.test(
    instruction,
  );

  if (!findFile(website.files || [], ["/App.js"])) {
    errors.push("Updated files must include /App.js.");
  }

  if (!findFile(website.files || [], ["/styles.css"])) {
    errors.push("Updated files must include /styles.css.");
  }

  if (!/function\s+App\s*\(/.test(appCode)) {
    errors.push("App.js must define function App().");
  }

  if (!/export\s+default\s+App\s*;?/.test(appCode)) {
    errors.push("App.js must end with export default App.");
  }

  if (/React\.useState\s*\(/.test(originalAppCode) && !/React\.useState\s*\(/.test(appCode)) {
    errors.push("Preserve React.useState multi-page navigation.");
  }

  if (!cssCode.trim()) {
    errors.push("Updated files must include styles.css content.");
  }

  if (appCode.length < Math.max(1000, originalAppCode.length * 0.65)) {
    errors.push("Edited App.js is much shorter than the current premium website.");
  }

  if (cssCode.length < Math.max(500, originalCssCode.length * 0.65)) {
    errors.push("Edited styles.css is much shorter than the current design system.");
  }

  if (/function\s+Navbar\s*\(/.test(originalAppCode) && !/function\s+Navbar\s*\(/.test(appCode)) {
    errors.push("Preserve the navbar component.");
  }

  if (/function\s+Footer\s*\(/.test(originalAppCode) && !/function\s+Footer\s*\(/.test(appCode)) {
    errors.push("Preserve the footer component.");
  }

  for (const page of originalPages) {
    if (!editedPages.has(page)) {
      errors.push(`Preserve existing page component ${page}.`);
    }
  }

  if (beforeImages.length > 0 && afterImages.length === 0 && !allowsImageRemoval) {
    errors.push("Preserve existing remote images unless the user asked to remove images.");
  }

  if (/welcome to|blog post 1|case study 1|company x|lorem ipsum/i.test(appCode)) {
    errors.push("Edited App.js contains generic placeholder text.");
  }

  if (/(src\s*=\s*["']\/|url\(["']?\/(?:image|hero|gallery|office|restaurant))/i.test(appCode)) {
    errors.push("Edited App.js uses fake local image paths.");
  }

  if (
    isHeroHeadlineBlackEdit(instruction) &&
    !hasSimpleEditSignal(appCode, cssCode, instruction)
  ) {
    errors.push("The requested hero headline color change to black was not applied.");
  }

  if (isHeroHeadlineFontSizeEdit(instruction)) {
    if (!hasSimpleEditSignal(appCode, cssCode, instruction)) {
      errors.push("The requested hero headline font size change was not applied.");
    }
  }

  if (isLogoEdit(instruction)) {
    const logoCount = countMatches(appCode, /data-edit-id="brand-logo"/g);
    const brandNameCount = countMatches(appCode, /data-edit-id="brand-name"/g);
    const logoClassCount = countMatches(
      appCode,
      /className="[^"]*\bbrand-logo-mark\b[^"]*"/g,
    );

    if (logoCount !== 1) {
      errors.push("Navbar brand must contain exactly one logo mark.");
    }

    if (brandNameCount !== 1) {
      errors.push("Navbar brand must contain exactly one brand name.");
    }

    if (logoClassCount !== 1) {
      errors.push("Navbar brand logo must use one .brand-logo-mark element.");
    }

    if (!/className="[^"]*\bbrand-name\b[^"]*"/.test(appCode)) {
      errors.push("Navbar brand name must keep the .brand-name class.");
    }
  }

  return errors;
}

async function runEditGeneration(prompt, modelName = SIMPLE_EDIT_MODEL) {
  const estimatedTokens = Math.ceil(String(prompt || "").length / 4);

  if (estimatedTokens > 5000) {
    const error = new Error(
      "This edit needs AI but the request is too large. Break it into smaller edits or ask for a full redesign.",
    );
    error.code = "TOKEN_GUARD";
    throw error;
  }

  return generateText({
    model: groq(modelName),
    prompt,
    temperature: 0.25,
    abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
    maxRetries: 0,
  });
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
    before_app_code: getFileContent(currentFiles, ["/App.js", "App.js", "/App.jsx"]),
    before_css_code: getFileContent(currentFiles, ["/styles.css", "styles.css"]),
    after_app_code: appCode,
    after_css_code: cssCode,
    edit_success: success,
    validation_errors: validation.errors,
  });

  return log?.id || "";
}

export async function POST(request) {
  try {
    const {
      instruction,
      currentFiles,
      currentTitle,
      originalPrompt,
      prompt,
      category,
      websiteType,
      templateVariant,
      designSeed,
      imageSetUsed,
      projectId,
    } = await request.json();

    if (!instruction?.trim()) {
      return Response.json({ error: "Edit instruction is required." }, { status: 400 });
    }

    if (!Array.isArray(currentFiles) || currentFiles.length === 0) {
      return Response.json(
        { error: "Current website files are required." },
        { status: 400 },
      );
    }

    const appFile = findFile(currentFiles, ["/App.js", "App.js", "/App.jsx"]);
    const cssFile = findFile(currentFiles, ["/styles.css", "styles.css"]);

    if (!appFile || !cssFile) {
      return Response.json(
        { error: "Current files must include /App.js and /styles.css." },
        { status: 400 },
      );
    }

    const appCode = appFile.content || "";
    const cssCode = cssFile.content || "";

    console.log("Edit instruction:", instruction);
    console.log("Current files count:", currentFiles?.length);
    console.log("Before App length:", appCode.length);
    console.log("Before CSS length:", cssCode.length);

    const currentCategory = category || websiteType || "";
    const sourcePrompt = originalPrompt || prompt || "";
    const editPlan = normalizeEditInstruction(instruction, {
      category: currentCategory,
      templateVariant,
      designSeed,
      currentTitle,
    });
    console.log("Raw instruction:", instruction);
    console.log("Normalized edit plan:", editPlan);
    const normalizedInstruction = editPlan.normalizedInstruction || instruction;
    const promptContext = `${sourcePrompt}\n${currentCategory}\n${templateVariant || ""}\n${designSeed || ""}\n${normalizedInstruction}`;
    const simpleEdit = applySimpleEdit(appCode, cssCode, normalizedInstruction);
    console.log("Simple edit result:", simpleEdit);
    console.log(
      "Target text found:",
      simpleEdit.targetText ? appCode.includes(simpleEdit.targetText) : "",
    );

    if (simpleEdit.failed) {
      return Response.json(
        {
          error: simpleEdit.error || "I couldn't apply that edit locally.",
          message: simpleEdit.error || "I couldn't apply that edit locally.",
          details: simpleEdit.details || [simpleEdit.error].filter(Boolean),
          editPlan,
        },
        { status: 400 },
      );
    }

    if (simpleEdit.changed) {
      let website = buildWebsiteFromCode(
        { title: currentTitle || "Updated website" },
        simpleEdit.appCode,
        simpleEdit.cssCode,
      );
      website = normalizeEditedWebsite(website, promptContext);
      const structureErrors = validateEditedWebsite(
        website,
        appCode,
        cssCode,
        normalizedInstruction,
      );
      const quality = validateWebsiteQuality({
        ...getWebsiteCode(website),
        category: currentCategory,
        instruction: promptContext,
      });

      if (!structureErrors.length) {
        const validation = {
          score: quality.score,
          errors: quality.errors,
        };
        const editLogId = await logEdit({
          projectId,
          instruction: `${instruction.trim()}\n\nNormalized: ${normalizedInstruction}`,
          currentFiles,
          website,
          validation,
          success: true,
        });

        return Response.json({
          ...website,
          message:
            simpleEdit.message ||
            `Applied: ${editPlan.action || normalizedInstruction}.`,
          editPlan,
          editLogId,
          qualityScore: validation.score,
          validationErrors: validation.errors,
          category: currentCategory,
          templateVariant: templateVariant || "",
          designSeed: designSeed || "",
          imageSetUsed: Array.isArray(imageSetUsed) ? imageSetUsed : [],
        });
      }
    }

    const sectionEdit = applySectionEdit(appCode, cssCode, {
      ...editPlan,
      category: currentCategory,
      websiteType,
      templateVariant,
    });

    if (sectionEdit.failed) {
      return Response.json(
        {
          error: sectionEdit.message || "I couldn't apply that section edit locally.",
          message: sectionEdit.message || "I couldn't apply that section edit locally.",
          details: [sectionEdit.message || "The deterministic section edit failed."],
          editPlan,
        },
        { status: 400 },
      );
    }

    if (sectionEdit.changed) {
      let website = buildWebsiteFromCode(
        { title: currentTitle || "Updated website" },
        sectionEdit.appCode,
        sectionEdit.cssCode,
      );
      website = normalizeEditedWebsite(website, promptContext);
      const structureErrors = validateEditedWebsite(
        website,
        appCode,
        cssCode,
        normalizedInstruction,
      );
      const { appCode: sectionAppCode, cssCode: sectionCssCode } = getWebsiteCode(website);
      const sectionErrors = [];

      if (!/function\s+App\s*\(/.test(sectionAppCode)) {
        sectionErrors.push("App.js must define function App().");
      }

      if (!/export\s+default\s+App\s*;?/.test(sectionAppCode)) {
        sectionErrors.push("App.js must end with export default App.");
      }

      for (const packageName of sectionEdit.requiredTerms || []) {
        if (!sectionAppCode.includes(packageName)) {
          sectionErrors.push(`Pricing package ${packageName} is missing.`);
        }
      }

      if (
        (sectionEdit.requiredTerms || []).length > 0 &&
        !/(\.pricing-section\b|\.packages-page\b|\.package-card\b)/.test(sectionCssCode)
      ) {
        sectionErrors.push("Pricing CSS classes are missing.");
      }

      if (![...structureErrors, ...sectionErrors].length) {
        const validation = {
          score: 95,
          errors: [],
        };
        const editLogId = await logEdit({
          projectId,
          instruction: `${instruction.trim()}\n\nNormalized: ${normalizedInstruction}`,
          currentFiles,
          website,
          validation,
          success: true,
        });

        return Response.json({
          ...website,
          message: sectionEdit.message || "Pricing added to Services page.",
          editPlan,
          editLogId,
          qualityScore: validation.score,
          validationErrors: validation.errors,
          category: currentCategory,
          templateVariant: templateVariant || "",
          designSeed: designSeed || "",
          imageSetUsed: Array.isArray(imageSetUsed) ? imageSetUsed : [],
        });
      }
    }

    if (!process.env.GROQ_API_KEY?.trim()) {
      return Response.json(
        {
          error:
            "Groq is not configured yet. Add GROQ_API_KEY to .env.local. Simple deterministic edits were attempted first but this instruction needs AI.",
          message:
            "I couldn't apply that edit locally. Try a smaller edit or choose a specific section.",
        },
        { status: 500 },
      );
    }

    const focusedContext = buildFocusedEditContext(
      appCode,
      cssCode,
      normalizedInstruction,
      editPlan,
    );
    const firstPrompt = buildEditPrompt({
      currentTitle,
      instruction: normalizedInstruction,
      appCode,
      cssCode,
      prompt: sourcePrompt,
      category: currentCategory,
      websiteType,
      templateVariant,
      designSeed,
      imageSetUsed,
      editPlan,
      editContext: focusedContext,
    });

    let result = await runEditGeneration(firstPrompt, SIMPLE_EDIT_MODEL);
    console.log("Raw edit response:", result.text);
    let website = parseWebsiteResponse(result.text);

    if (!website) {
      console.error("Raw edit AI response:", result.text);

      result = await runEditGeneration(
        buildEditPrompt({
          currentTitle,
          instruction: normalizedInstruction,
          appCode,
          cssCode,
          prompt: sourcePrompt,
          category: currentCategory,
          websiteType,
          templateVariant,
          designSeed,
          imageSetUsed,
          editPlan,
          editContext:
            focusedContext.mode === "focused"
              ? { mode: "full", appCode, cssCode }
              : focusedContext,
          validationErrors: [
          "The response could not be parsed. Return only TITLE, ---APP_JS---, and ---STYLES_CSS--- separators.",
          ],
        }),
        SIMPLE_EDIT_MODEL,
      );
      console.log("Raw edit response:", result.text);
      website = parseWebsiteResponse(result.text);
    }

    if (!website) {
      console.error("Raw edit AI response:", result.text);
      return Response.json(
        { error: "AI response could not be parsed. Please try again." },
        { status: 502 },
      );
    }

    website = normalizeEditedWebsite(website, promptContext);
    let structureErrors = validateEditedWebsite(
      website,
      appCode,
      cssCode,
      normalizedInstruction,
    );
    let quality = validateWebsiteQuality({
      ...getWebsiteCode(website),
      category: currentCategory,
      instruction: promptContext,
    });
    let parsedCode = getWebsiteCode(website);
    console.log("After App length:", parsedCode.appCode.length);
    console.log("After CSS length:", parsedCode.cssCode.length);
    console.log("Validation errors:", [...structureErrors, ...quality.errors]);

    if (structureErrors.length || quality.score < 75) {
      const retryIssues = [...structureErrors, ...quality.errors];
      result = await runEditGeneration(
        buildEditPrompt({
          currentTitle,
          instruction: normalizedInstruction,
          appCode,
          cssCode,
          prompt: sourcePrompt,
          category: currentCategory,
          websiteType,
          templateVariant,
          designSeed,
          imageSetUsed,
          editPlan,
          editContext: { mode: "full", appCode, cssCode },
          validationErrors: retryIssues,
        }),
        SIMPLE_EDIT_MODEL,
      );
      console.log("Raw edit response:", result.text);

      const retryWebsite = parseWebsiteResponse(result.text);

      if (retryWebsite) {
        website = normalizeEditedWebsite(retryWebsite, promptContext);
        structureErrors = validateEditedWebsite(
          website,
          appCode,
          cssCode,
          normalizedInstruction,
        );
        quality = validateWebsiteQuality({
          ...getWebsiteCode(website),
          category: currentCategory,
          instruction: promptContext,
        });
        parsedCode = getWebsiteCode(website);
        console.log("After App length:", parsedCode.appCode.length);
        console.log("After CSS length:", parsedCode.cssCode.length);
        console.log("Validation errors:", [...structureErrors, ...quality.errors]);
      } else {
        console.error("Raw edit AI response:", result.text);
      }
    }

    if (
      (isHeroHeadlineBlackEdit(normalizedInstruction) ||
        isHeroHeadlineFontSizeEdit(normalizedInstruction)) &&
      !hasSimpleEditSignal(
        getWebsiteCode(website).appCode,
        getWebsiteCode(website).cssCode,
        normalizedInstruction,
      )
    ) {
      const patchedCode = applySimpleEdit(
        getWebsiteCode(website).appCode,
        getWebsiteCode(website).cssCode,
        normalizedInstruction,
      );

      if (patchedCode.changed) {
        website = buildWebsiteFromCode(
          website,
          patchedCode.appCode,
          patchedCode.cssCode,
        );
        structureErrors = validateEditedWebsite(
          website,
          appCode,
          cssCode,
          normalizedInstruction,
        );
        quality = validateWebsiteQuality({
          ...getWebsiteCode(website),
          category: currentCategory,
          instruction: promptContext,
        });
      }
    }

    if (structureErrors.length || quality.score < 75) {
      const validationErrors = [...structureErrors, ...quality.errors];
      return Response.json(
        {
          error: "Edit failed validation",
          details: validationErrors,
          message:
            validationErrors[0] ||
            "I couldn't apply that edit. Try a smaller edit or choose a specific section.",
        },
        { status: 502 },
      );
    }

    const validation = {
      score: quality.score,
      errors: quality.errors,
    };
    const editLogId = await logEdit({
      projectId,
      instruction: `${instruction.trim()}\n\nNormalized: ${normalizedInstruction}`,
      currentFiles,
      website,
      validation,
      success: true,
    });

    return Response.json({
      ...website,
      editLogId,
      qualityScore: validation.score,
      validationErrors: validation.errors,
      message: `Applied: ${editPlan.action || normalizedInstruction}.`,
      editPlan,
      category: currentCategory,
      templateVariant: templateVariant || "",
      designSeed: designSeed || "",
      imageSetUsed: Array.isArray(imageSetUsed) ? imageSetUsed : [],
    });
  } catch (error) {
    if (isRateLimitError(error)) {
      return Response.json(
        {
          error: buildRateLimitMessage(error),
          message: buildRateLimitMessage(error),
          retryAfterMinutes: getRetryAfterMinutes(error),
        },
        { status: 429 },
      );
    }

    if (error.code === "TOKEN_GUARD") {
      return Response.json(
        {
          error: error.message,
          message: error.message,
          details: [error.message],
        },
        { status: 413 },
      );
    }

    return Response.json(
      {
        error:
          error.name === "TimeoutError"
            ? "This edit is too large for AI right now. I kept your previous design. Try editing one section at a time."
            : error.message?.includes("Cannot connect to API")
              ? "I could not connect to the AI editor. Your previous design was kept. Please try again shortly."
              : "I couldn't apply that edit. Try a smaller edit or choose a specific section.",
      },
      { status: 500 },
    );
  }
}
