function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function getColorTarget(text) {
  const colors = [
    "black",
    "white",
    "blue",
    "indigo",
    "purple",
    "green",
    "emerald",
    "red",
    "orange",
    "yellow",
    "beige",
    "cream",
    "ivory",
    "charcoal",
    "gray",
    "grey",
  ];

  return colors.find((color) => text.includes(color)) || "";
}

export function normalizeEditInstruction(instruction = "", context = {}) {
  const rawInstruction = String(instruction || "").trim();
  const text = rawInstruction.toLowerCase();
  const constraints = [
    "keep existing design style",
    "preserve navigation",
    "preserve footer",
    "preserve existing pages",
    "preserve current template variant",
  ];
  const defaults = {};

  const mentionsLogo = includesAny(text, [
    "logo",
    "icon",
    "brand mark",
    "navbar brand",
    "monogram",
  ]);
  const mentionsLogoProblem = includesAny(text, [
    "logo overlap",
    "overlapping",
    "brand name hidden",
    "brand name unreadable",
    "fix logo",
    "fix navbar brand",
  ]);

  if (mentionsLogo || mentionsLogoProblem) {
    return {
      rawInstruction,
      normalizedInstruction:
        "Add a clean premium monogram logo next to the brand name in the navbar. Keep everything else unchanged.",
      editType: "simple",
      target: "navbar brand",
      action: mentionsLogoProblem ? "fix logo mark" : "add logo mark",
      constraints,
      defaults,
      needsAI: false,
    };
  }

  const mentionsHeading = includesAny(text, ["heading", "headline", "hero title", "title"]);
  const mentionsFontSize = includesAny(text, ["big", "bigger", "larger", "font size", "increase"]);

  if (mentionsHeading && mentionsFontSize) {
    return {
      rawInstruction,
      normalizedInstruction:
        "Make the hero headline larger while keeping the design responsive.",
      editType: "simple",
      target: "hero headline",
      action: "increase font size",
      constraints,
      defaults,
      needsAI: false,
    };
  }

  const color = getColorTarget(text);
  if (color && includesAny(text, ["color", "colour"])) {
    const target = mentionsHeading || text.includes("hero") ? "hero headline" : "hero headline";
    return {
      rawInstruction,
      normalizedInstruction: `Change the ${target} text color to ${color}. Keep everything else unchanged.`,
      editType: "simple",
      target,
      action: "change text color",
      constraints,
      defaults: { color },
      needsAI: false,
    };
  }

  const mentionsButton = includesAny(text, ["button", "cta"]);
  const hasQuotedReplacement = /"[^"]+"\s+(?:to|with)\s+"[^"]+"/i.test(rawInstruction);
  if (hasQuotedReplacement) {
    return {
      rawInstruction,
      normalizedInstruction: rawInstruction,
      editType: "simple",
      target: mentionsButton ? "button text" : "text",
      action: "replace text",
      constraints,
      defaults,
      needsAI: false,
    };
  }

  const mentionsBackground = text.includes("background");
  if (mentionsBackground && color) {
    return {
      rawInstruction,
      normalizedInstruction: `Change the website background color to ${color}. Keep the current design style.`,
      editType: "simple",
      target: "background",
      action: "change background color",
      constraints,
      defaults: { color },
      needsAI: false,
    };
  }

  const mentionsServices = includesAny(text, ["service", "services"]);
  const mentionsPricing = includesAny(text, ["pricing", "packages", "prices", "price"]);
  const mentionsRedesign = includesAny(text, ["redesign", "improve", "fix", "upgrade", "better"]);

  if (mentionsServices && mentionsPricing) {
    defaults.packages = ["Starter", "Growth", "Premium"];
    return {
      rawInstruction,
      normalizedInstruction:
        "Update only the Services page. Add a pricing section with three packages: Starter, Growth, and Premium. Keep the existing website style. Do not redesign the whole website.",
      editType: "section",
      target: "services",
      action: "add pricing to services page",
      constraints: [...constraints, "do not redesign whole website", "preserve other pages"],
      defaults,
      needsAI: false,
    };
  }

  if (mentionsPricing) {
    defaults.packages = ["Starter", "Growth", "Premium"];
    return {
      rawInstruction,
      normalizedInstruction:
        "Add a pricing/packages section using three packages: Starter, Growth, and Premium. Keep the current design style. Preserve the existing navigation, footer, pages, and template variant.",
      editType: "section",
      target: "pricing/services",
      action: "add pricing packages",
      constraints,
      defaults,
      needsAI: false,
    };
  }

  if (mentionsServices && mentionsRedesign) {
    return {
      rawInstruction,
      normalizedInstruction:
        "Update only the Services page or services section. Improve the layout, copy, visual hierarchy, and cards while keeping the existing design style. Do not redesign the whole website.",
      editType: "section",
      target: "services",
      action: "improve services section",
      constraints: [...constraints, "do not redesign whole website", "preserve other pages"],
      defaults,
      needsAI: true,
    };
  }

  if (includesAny(text, ["luxury", "premium", "more refined", "make it luxe"])) {
    return {
      rawInstruction,
      normalizedInstruction:
        "Make the website feel more premium and refined by improving typography, spacing, colors, card styling, and CTA polish while preserving the current structure, pages, navbar, footer, and template variant.",
      editType: "section",
      target: context?.category || "visual style",
      action: "make design more premium",
      constraints,
      defaults,
      needsAI: true,
    };
  }

  const fullRedesign = includesAny(text, ["redesign whole", "redesign all", "full redesign", "start over"]);

  return {
    rawInstruction,
    normalizedInstruction: fullRedesign
      ? `${rawInstruction}. Preserve all required React file rules and current project content where useful.`
      : `${rawInstruction}. Keep the existing design style, navbar, footer, pages, and current template variant unless the instruction explicitly requires changing them.`,
    editType: fullRedesign ? "full" : "section",
    target: fullRedesign ? "full website" : "requested section",
    action: rawInstruction || "apply edit",
    constraints: fullRedesign ? ["preserve React validity"] : constraints,
    defaults,
    needsAI: true,
  };
}
