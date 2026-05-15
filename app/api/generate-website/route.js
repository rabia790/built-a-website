import { z } from "zod";
import {
  ensureImagesInGeneratedCode,
  hasRemoteImageReference,
  shouldIncludeImages,
} from "@/lib/fixBrokenImagePaths";
import { detectWebsiteCategory as detectTemplateCategory } from "@/lib/detectWebsiteCategory";
import { parseWebsiteResponse } from "@/lib/parseWebsiteResponse";
import { buildHomeStagingWebsite } from "@/lib/templates/homeStagingTemplate";
import { buildPortfolioWebsite } from "@/lib/templates/portfolioTemplate";
import { safeInsert, serverSupabase } from "@/lib/serverSupabase";
import { validateWebsiteQuality as scoreWebsiteQuality } from "@/lib/validateWebsiteQuality";

const requestSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required."),
});

const AI_TIMEOUT_MS = 45000;

const imageGuidance = {
  home_staging: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=85",
  ],
  kids: [
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1491013516836-7db643ee125a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?auto=format&fit=crop&w=1200&q=80",
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  ],
  staffing: [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  ],
  interior: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  ],
  saas: [
    "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80",
  ],
  wedding: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  ],
  portfolio: [
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
  ],
};

function detectWebsiteCategory(prompt = "") {
  const templateCategory = detectTemplateCategory(prompt);

  if (templateCategory === "home_staging" || templateCategory === "portfolio") {
    return templateCategory;
  }

  const text = prompt.toLowerCase();

  if (/(staging|real estate|interior|home|property)/.test(text)) {
    return "home_staging";
  }

  if (/(kids|children|child|explorer|learning|education|educational|toys|toy|adventure|play|books|school|preschool)/.test(text)) {
    return "kids";
  }

  if (/(restaurant|menu|reservation|chef|cafe|dining|food)/.test(text)) {
    return "restaurant";
  }

  if (/(staffing|recruit|hiring|company|office|agency|career|jobs)/.test(text)) {
    return "staffing";
  }

  if (/(saas|software|technology|tech|ai|productivity|platform|app)/.test(text)) {
    return "saas";
  }

  if (/(wedding|photography|photographer|bridal|couple|portrait)/.test(text)) {
    return "wedding";
  }

  if (/(portfolio|designer|brand|creative|studio)/.test(text)) {
    return "portfolio";
  }

  return "generic_business";
}

function detectWebsiteType(prompt = "") {
  const category = detectWebsiteCategory(prompt);

  if (category === "home_staging") {
    return "home_staging";
  }

  if (category === "generic_business") {
    return "saas";
  }

  return category;
}

function getImageGuidance(prompt, brief = "") {
  const websiteType = detectWebsiteCategory(`${prompt}\n${brief}`);
  const urls = imageGuidance[websiteType] || imageGuidance.saas;

  const direction = {
    home_staging:
      "Use only luxury interior, staging, living room, real estate, decor, and premium home imagery. Avoid restaurant food, corporate offices, kids, and wedding imagery.",
    kids:
      "Use kids learning, toys, books, outdoor play, discovery, and educational product imagery. Avoid restaurants, offices, corporate teams, luxury interiors, and wedding photos.",
    restaurant:
      "Use food, chef, dining, and warm restaurant interior imagery. Avoid office, kids, wedding, and SaaS imagery.",
    staffing:
      "Use professional teams, office collaboration, hiring, and interview imagery. Avoid restaurants, kids toys, wedding, and real estate interiors.",
    saas:
      "Use product UI, dashboards, abstract tech cards, modern teams, and software workspace imagery. Avoid restaurants, kids toys, weddings, and real estate interiors.",
    wedding:
      "Use wedding photography, couples, bridal moments, and elegant celebration imagery. Avoid offices, restaurants, and kids toys.",
    portfolio:
      "Use creative studio, brand design, workspace, and visual design imagery. Avoid restaurant food and unrelated corporate stock imagery.",
    generic_business:
      "Use polished business imagery or abstract premium visual cards that match the inferred business. Avoid unrelated restaurant, wedding, kids, or real estate imagery.",
  }[websiteType];

  return `Detected website type: ${websiteType}
Image direction: ${direction}
Allowed image URLs:
${urls.map((url) => `- ${url}`).join("\n")}`;
}

function getPremiumDesignSystem(category, prompt) {
  if (category === "home_staging") {
    return `Category: Premium home staging agency
Audience: luxury real estate sellers, realtors, property investors
Brand feeling: elegant, warm, editorial, high-end interiors
Color palette:
- ivory #f8f4ee
- warm taupe #c7aa86
- charcoal #1f2933
- soft beige #eadfce
- muted olive #6f7b63
Typography mood:
- Large elegant serif-style headings using CSS font-family Georgia, serif
- Clean sans body text
Template style: luxury editorial agency website with layered interior imagery, refined whitespace, warm neutral surfaces, large hero type, and high-touch consultation copy.
Required multi-page SPA pages: Home, Services, Portfolio, Process, Packages, About, Contact
Home structure:
- Large editorial split hero with luxury interior image collage
- Trust badges for realtors, sellers, investors
- Stats cards: homes staged, faster sales, average offer lift
- Services cards with elegant spacing
- Portfolio/before-after style gallery using 3 different interior images
- Process timeline
- Package cards
- Testimonials
- Consultation CTA
- Contact form
Image direction:
Use only luxury interior/home staging images. Use these URLs and do not repeat the same URL more than twice:
- https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85
- https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85
- https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85
- https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=85
Primary CTA: Book a Staging Consultation
Copy angle: target luxury real estate sellers and realtors; emphasize faster sales, elevated perceived value, editorial presentation, and white-glove service.
Avoid: tiny hero, plain gray blocks, repeated same image, generic copy, restaurant images, "Welcome to", basic cards only, beginner layout.`;
  }

  const templates = {
    staffing:
      "Category: Premium staffing/recruitment agency. Use a modern trust-forward agency layout with employer/candidate split, industries served, hiring stats, process cards, testimonials, and CTAs for requesting staff or applying for jobs.",
    saas:
      "Category: Premium SaaS/product website. Use dashboard-style visuals, product UI cards, feature grids, metrics, pricing, testimonials, and a conversion-focused product story.",
    restaurant:
      "Category: Premium restaurant website. Use warm dining imagery, menu highlights, reservation CTA, chef/story sections, gallery, reviews, and location/contact.",
    portfolio:
      "Category: Premium creative portfolio. Use editorial project grids, case-study style sections, services, process, testimonials, and a refined contact CTA.",
    wedding:
      "Category: Luxury wedding photography website. Use romantic editorial imagery, galleries, packages, testimonials, process, about, and inquiry CTA.",
    kids:
      "Category: Premium kids learning/adventure/ecommerce site. Use playful polished design, Home, Shop, Categories, Brands, Blog, About, Contact, parent trust, educational benefits, featured products/adventures, testimonials, and warm yellow/blue/green/coral accents.",
    generic_business:
      "Category: Premium business website. Infer a specific brand and use a polished agency/SaaS style with multi-page SPA navigation, premium hero, proof, services, process, testimonials, and contact CTA.",
  };

  return `${templates[category] || templates.generic_business}
Prompt: ${prompt}
The website must look like a professional agency/designer built it. Do not create a simple beginner landing page.`;
}

const briefPrompt = `You are a senior product strategist and web creative director.
Turn the user's website request into a detailed website brief.

If the prompt is vague, make smart premium assumptions. Do not ask follow-up questions.

Examples:
- "staging website" means a premium home staging agency for realtors, homeowners, and property investors with luxury editorial styling.
- "modern website" means a modern SaaS/product landing page unless another business is specified.
- "staffing website" means a staffing/recruitment agency for employers and job seekers.
- Prompts with kids, children, explorer, learning, toys, adventure, books, or school mean a playful premium kids/education/adventure brand for parents and children. Images must be kids learning, toys, books, outdoor play, or educational products. Avoid restaurants, offices, and corporate images.

Return a plain text brief only. No markdown headings are required, but include:
- Business type
- Target audience
- Brand name
- Visual style
- Color palette
- Typography mood
- Sitemap/pages
- Section plan
- Image direction
- CTA strategy
- Content tone
- Things to avoid

For kids/adventure/ecommerce sites, include pages: Home, Shop, Categories, Brands, Blog, About, Contact.`;

const systemPrompt = `You generate complete React/Tailwind websites for an iframe React preview.

Return exactly this separator format and nothing else:

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
- You must generate a premium custom website using the category-specific design system provided in the prompt.
- The website must look like a professional agency/designer built it.
- Do not let the layout feel invented casually from scratch; follow the selected premium template direction.
- Do not create a simple beginner landing page.
- Generate a premium multi-page website, not a one-page template.
- Never create generic text like "Welcome to Modern Website".
- Never use generic "Welcome to..." headings.
- Never repeat the raw user prompt as the headline.
- Never use lorem ipsum.
- Never use images unrelated to the business.
- Never use restaurant images unless the business is restaurant, dining, cafe, chef, menu, or food.
- Always create a real brand name.
- Always create realistic business copy.
- Always create a strong hero headline.
- The hero section must be visually strong and appear first.
- Do not start the page with Services, About, Features, or pricing.
- Always include a modern hero with headline, subheadline, CTA, trust signal, and visual element.
- Hero must look premium and visually interesting.
- Use large, confident hero typography. Avoid tiny headings and cramped layouts.
- Do not generate plain centered hero text only.
- Do not create a basic gray centered hero.
- Add visual cards, stats, trust badges, and a stronger CTA section.
- Every generated website must include at least one strong visual image in the hero section unless the user specifically says no images.
- Hero section should usually be a split layout: left side headline, subheadline, CTAs, and stats; right side large image card or visual image collage.
- Use proper img attributes: src, alt, className, and loading="lazy".
- Use only full remote image URLs.
- Do not use local image paths like /image1.jpg, /hero.jpg, /gallery.jpg, or /office.jpg.
- Use curated Unsplash image URLs based on business type.
- Use only the image URLs provided in the prompt image guidance when possible.
- Never use the same image URL more than twice. Use different image URLs for hero, portfolio, and services.
- For staffing/company/office use: https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80
- For SaaS/tech use: https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80
- For restaurant use: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80
- For home staging/interior use: https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80
- For wedding/photography use: https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80
- For portfolio/brand designer use: https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80
- Always create modern visual hierarchy.
- Always include navigation.
- Navigation must switch pages using React.useState.
- App must include: const [currentPage, setCurrentPage] = React.useState("home").
- Each navigation item must update currentPage without page reloads.
- Each page must have unique content.
- Multi-page websites must include at least 5 pages.
- Required pages by default: Home, About, Services or Shop, Gallery/Categories/Industries, Process/Pricing/Packages, Contact.
- Always include multiple sections.
- Always include CTA buttons.
- Always include cards, stats, testimonials, and a contact section when relevant.
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
- For kids ecommerce/adventure sites, pages should be Home, Shop, Categories, Brands, Blog, About, Contact.
- For kids ecommerce/adventure sites, use a soft playful palette with warm yellow, sky blue, green, and coral accents.
- For kids ecommerce/adventure sites, use rounded cards, parent trust sections, educational benefits, featured products/adventures, testimonials, and a final CTA.
- For kids ecommerce/adventure sites, never use restaurant, office, corporate, wedding, or luxury interior imagery.
- For home staging specifically: hero must be visually luxurious, use large typography, warm neutral background, interior images, layered image cards, stats and trust badges, service/package cards with elegant spacing, a portfolio gallery with 3 different images, CTA "Book a Staging Consultation", and copy for luxury real estate sellers and realtors.
- Prefer polished layout over too many sections.
- Use responsive design.
- Put all React code inside APP_JS.
- Put all CSS inside STYLES_CSS.
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
- Use function App() with currentPage state.
- Include components/pages inside /App.js: Navbar, HomePage, AboutPage, ServicesPage or ShopPage, Categories/Gallery/Industries page, Process/Pricing/Packages page, ContactPage, Footer.
- Include useful home sections based on the brief: premium Hero, category/service cards, featured offers, trust proof, benefits, testimonials, and final CTA.
- CSS must create premium modern spacing, strong hero layout, responsive grids, refined buttons, card shadows, rounded sections, business-specific colors, and mobile responsive design.
- For home staging, CSS should feel editorial and luxury with Georgia serif headings, warm neutral backgrounds, elegant navigation, premium buttons, rounded image cards, card shadows, generous section padding, and mobile responsive styles.
- No tiny default browser style.

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

async function createWebsiteBrief(userPrompt, generateText, groq) {
  const websiteType = detectWebsiteType(userPrompt);
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: briefPrompt,
    prompt: `User request: ${userPrompt}
Detected website type: ${websiteType}`,
    temperature: 0.45,
    abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
    maxRetries: 0,
  });

  return text.trim();
}

function extractTitle(website) {
  return String(website?.title || "").trim();
}

function countRepeatedImageUrls(appCode) {
  const matches = appCode.match(/https:\/\/images\.unsplash\.com\/[^"')\s]+/g) || [];
  const counts = new Map();

  for (const url of matches) {
    counts.set(url, (counts.get(url) || 0) + 1);
  }

  return [...counts.entries()].filter(([, count]) => count > 2);
}

function validateWebsiteQuality(website, prompt, brief, category) {
  const appCode = String(
    website?.files?.find((file) => file.path === "/App.js")?.content || "",
  );
  const cssCode = String(
    website?.files?.find((file) => file.path === "/styles.css")?.content || "",
  );
  const promptContext = `${prompt}\n${brief}`;
  const websiteType = category || detectWebsiteCategory(promptContext);
  const issues = [];
  const lowerPrompt = promptContext.toLowerCase();
  const lowerApp = appCode.toLowerCase();
  const title = extractTitle(website);

  if (/welcome to/i.test(appCode)) {
    issues.push('Uses generic "Welcome to" copy.');
  }

  if (/blog post 1|case study 1|company x/i.test(appCode)) {
    issues.push("Uses placeholder blog, case study, or company names.");
  }

  if (/^(modern website|landing page|generated website|website)$/i.test(title)) {
    issues.push("Title is too generic.");
  }

  if (/(src\s*=\s*["']\/|url\(["']?\/)/i.test(appCode)) {
    issues.push("Uses local image paths instead of full remote URLs.");
  }

  const imageUrls = appCode.match(/https:\/\/images\.unsplash\.com\/[^"')\s]+/g) || [];
  if (imageUrls.length < 3) {
    issues.push("Uses fewer than 3 image URLs.");
  }

  const repeatedImages = countRepeatedImageUrls(appCode);
  if (repeatedImages.length) {
    issues.push("Repeats the same image URL more than twice.");
  }

  const restaurantImage =
    /1517248135467-4c7edcad34c4|restaurant|dining room|chef|menu/i.test(
      appCode,
    );
  const isRestaurantPrompt =
    /(restaurant|menu|reservation|chef|cafe|dining|food)/i.test(lowerPrompt);

  if (!isRestaurantPrompt && restaurantImage) {
    issues.push("Uses restaurant or dining imagery for a non-restaurant prompt.");
  }

  if (websiteType === "home_staging") {
    const homeStagingImages =
      appCode.match(
        /1600607687939-ce8a6c25118c|1600566753190-17f0baa2a6c3|1600585154340-be6161a56a0c|1600210492493-0946911123ea/g,
      ) || [];

    if (new Set(homeStagingImages).size < 2) {
      issues.push("Home staging site uses fewer than 2 approved interior image URLs.");
    }

    if (!/(luxury|staging|realtor|real estate|seller|interior|consultation)/i.test(appCode)) {
      issues.push("Home staging copy is not specific enough to luxury sellers and realtors.");
    }
  }

  if (websiteType === "kids") {
    if (
      !/1503454537195-1dcabb73ffb9|1491013516836-7db643ee125a|1484820540004-14229fe36ca4/.test(
        appCode,
      )
    ) {
      issues.push("Kids site does not use allowed kids/education imagery.");
    }

    if (/(office|corporate|restaurant|dining|chef|wedding|bridal)/i.test(appCode)) {
      issues.push("Kids site includes imagery or copy from the wrong industry.");
    }
  }

  if (!/React\.useState\s*\(/.test(appCode)) {
    issues.push("Multi-page navigation does not use React.useState.");
  }

  const pageNameMatches = appCode.match(
    /\b(Home|About|Services|Shop|Categories|Brands|Blog|Gallery|Industries|Process|Pricing|Packages|Contact)Page\b/g,
  );
  const uniquePageNames = new Set(pageNameMatches || []);
  if (uniquePageNames.size < 5) {
    issues.push("Has fewer than 5 distinct page components.");
  }

  if (appCode.length < 9500 || cssCode.length < 2200) {
    issues.push("Generated code is too short to feel premium or complete.");
  }

  if (!/<img\b/i.test(appCode) && !/(visual|mockup|card|hero-card|image)/i.test(lowerApp)) {
    issues.push("Hero has no image, card, or visual element.");
  }

  if (!/(shadow|rounded|grid|hero|card|testimonial|stat|cta)/i.test(appCode + cssCode)) {
    issues.push("Design lacks modern cards, spacing, stats, testimonials, or CTA structure.");
  }

  if (/our services/i.test(appCode) && !/(white-glove|luxury|premium|consultation|tailored|editorial|signature|curated)/i.test(appCode)) {
    issues.push('Uses generic "Our Services" headings without premium, business-specific copy.');
  }

  if (/our services/i.test(appCode) && !/(<article|<li|deliverable|strategy|identity|package|process|card)/i.test(appCode)) {
    issues.push('Uses "Our Services" with only plain text.');
  }

  if (!/(testimonial|client|review|seller|realtor)/i.test(appCode)) {
    issues.push("Missing testimonials or trust proof.");
  }

  if (!/(stat|homes staged|faster|offer|sold|%|\d+\+)/i.test(appCode)) {
    issues.push("Missing stats or measurable proof.");
  }

  if (!/(cta|book|schedule|consultation|get started|request|contact)/i.test(appCode)) {
    issues.push("Missing a strong CTA section.");
  }

  return issues;
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

function getWebsiteCode(website) {
  return {
    appCode: website.files.find((file) => file.path === "/App.js")?.content || "",
    cssCode:
      website.files.find((file) => file.path === "/styles.css")?.content || "",
  };
}

async function logGeneration({ website, prompt, category, websiteType, validation }) {
  const { appCode, cssCode } = getWebsiteCode(website);
  const log = await safeInsert("generation_logs", {
    prompt,
    category,
    website_type: websiteType,
    generated_title: website.title,
    app_code: appCode,
    css_code: cssCode,
    quality_score: validation.score,
    validation_errors: validation.errors,
  });

  return log?.id || "";
}

async function getTemplateExamples(category) {
  if (!serverSupabase) return "";

  try {
    const { data, error } = await serverSupabase
      .from("template_examples")
      .select("title,prompt,app_code,css_code,rating,is_featured")
      .eq("category", category)
      .or("rating.gte.4,is_featured.eq.true")
      .order("is_featured", { ascending: false })
      .order("rating", { ascending: false })
      .limit(3);

    if (error || !data?.length) return "";

    return data
      .map(
        (example, index) => `Reference ${index + 1}: ${example.title}
Prompt: ${example.prompt}
App.js excerpt:
${String(example.app_code || "").slice(0, 1800)}
styles.css excerpt:
${String(example.css_code || "").slice(0, 900)}`,
      )
      .join("\n\n");
  } catch (error) {
    console.error("Could not retrieve template examples:", error);
    return "";
  }
}

async function finalizeWebsite({ website, prompt, category, websiteType }) {
  const { appCode, cssCode } = getWebsiteCode(website);
  const validation = scoreWebsiteQuality({
    appCode,
    cssCode,
    category,
    instruction: prompt,
  });
  const generationLogId = await logGeneration({
    website,
    prompt,
    category,
    websiteType,
    validation,
  });

  return {
    ...website,
    generationLogId,
    qualityScore: validation.score,
    validationErrors: validation.errors,
    category,
  };
}

export async function POST(request) {
  try {
    const body = await readRequestPayload(request);
    const { prompt } = requestSchema.parse(body);

    if (detectTemplateCategory(prompt) === "home_staging") {
      return Response.json(
        await finalizeWebsite({
          website: buildHomeStagingWebsite({
            brandName: "Eleve Staging Co.",
            headline:
              "Stage homes that sell faster, photograph better, and feel unforgettable",
            subheadline:
              "Luxury home staging for real estate sellers, agents, and developers who want every listing to feel move-in ready.",
          }),
          prompt,
          category: "home_staging",
          websiteType: "template",
        }),
      );
    }

    if (detectTemplateCategory(prompt) === "portfolio") {
      return Response.json(
        await finalizeWebsite({
          website: buildPortfolioWebsite({
            brandName: "Aurora Brand Studio",
            headline: "Brand identities with strategy, soul, and staying power",
            subheadline:
              "A refined design studio crafting visual systems, websites, and launch-ready brand worlds for founders and growing companies.",
          }),
          prompt,
          category: "portfolio",
          websiteType: "template",
        }),
      );
    }

    if (!process.env.GROQ_API_KEY?.trim()) {
      return Response.json(
        {
          error: "Groq is not configured yet. Add GROQ_API_KEY to .env.local.",
        },
        { status: 500 },
      );
    }

    const [{ generateText }, { groq }] = await Promise.all([
      import("ai"),
      import("@ai-sdk/groq"),
    ]);
    const websiteCategory = detectWebsiteCategory(prompt);
    const websiteBrief = await createWebsiteBrief(prompt, generateText, groq);
    const imageRules = getImageGuidance(prompt, websiteBrief);
    const premiumDesignSystem = getPremiumDesignSystem(websiteCategory, prompt);
    const examples = await getTemplateExamples(websiteCategory);

    const generationPrompt = `Original user request:
${prompt}

Detected category:
${websiteCategory}

Website brief to implement:
${websiteBrief}

Category-specific premium design system:
${premiumDesignSystem}

Image guidance:
${imageRules}

Quality references:
${examples || "No saved examples yet. Use the category design system as the quality reference."}

Use these references as quality inspiration. Do not copy exactly.`;

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: generationPrompt,
      temperature: 0.35,
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

    website = postProcessWebsiteImages(website, `${prompt}\n${websiteBrief}`);
    let qualityIssues = validateWebsiteQuality(
      website,
      prompt,
      websiteBrief,
      websiteCategory,
    );

    if (!appCodeHasRequiredImage(website, `${prompt}\n${websiteBrief}`)) {
      qualityIssues = [...qualityIssues, "Missing required remote hero image."];
    }

    let scoredQuality = scoreWebsiteQuality({
      ...getWebsiteCode(website),
      category: websiteCategory,
      instruction: prompt,
    });

    if (qualityIssues.length || scoredQuality.score < 75) {
      const { text: retryText } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        system: systemPrompt,
        prompt: `${generationPrompt}

The previous output was too basic. Regenerate a premium, polished, multi-page website using the category-specific design system. Fix these issues:
${[...qualityIssues, ...scoredQuality.errors].map((issue) => `- ${issue}`).join("\n")}

Do not reuse incorrect imagery. Follow the image guidance exactly. Never repeat the same image URL more than twice. For home staging, create an editorial luxury agency website with large serif hero typography, layered interior image cards, multiple different interior images, stats, testimonials, package cards, portfolio gallery, and CTA "Book a Staging Consultation". For kids/adventure/education prompts, use kids learning, toys, books, outdoor play, or educational product imagery only.`,
        temperature: 0.3,
        abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
        maxRetries: 0,
      });

      const retryWebsite = parseWebsiteResponse(retryText);

      if (retryWebsite) {
        website = postProcessWebsiteImages(
          retryWebsite,
          `${prompt}\n${websiteBrief}`,
        );
        scoredQuality = scoreWebsiteQuality({
          ...getWebsiteCode(website),
          category: websiteCategory,
          instruction: prompt,
        });
      }
    }

    return Response.json(
      await finalizeWebsite({
        website,
        prompt,
        category: websiteCategory,
        websiteType: "ai_generated",
      }),
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0].message }, { status: 400 });
    }

    return Response.json(
      {
        error:
          error.name === "TimeoutError"
            ? "Groq took too long to respond. Please try a shorter prompt."
            : error.message?.includes("Cannot connect to API")
              ? "Could not connect to the Groq API. Check your internet connection, API key, and Groq API access."
            : error.message || "Groq could not generate the website.",
      },
      { status: 500 },
    );
  }
}
