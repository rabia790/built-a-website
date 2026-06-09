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

function getQuotedText(value = "") {
  const match = String(value).match(/["“]([^"”]+)["”]/);
  return match?.[1]?.trim() || "";
}

function getSectionAction(text, section) {
  if (!text.includes(section)) return null;

  if (includesAny(text, ["remove", "delete", "take out", "hide"])) {
    return {
      type: "remove_section",
      targetPage: text.includes("services") ? "services" : "home",
      targetSection: section,
      normalizedInstruction: `Remove the ${section} section only.`,
      needsAI: false,
    };
  }

  if (includesAny(text, ["add", "include", "create", "put"])) {
    return {
      type: "add_section",
      targetPage: text.includes("contact") ? "contact" : "home",
      targetSection: section,
      normalizedInstruction: `Add a polished ${section} section while preserving the current design style.`,
      needsAI: false,
    };
  }

  return null;
}

function buildActionsFromText(text, rawInstruction, color = "") {
  const actions = [];
  const sectionNames = [
    "faq",
    "testimonials",
    "contact",
    "gallery",
    "pricing",
    "packages",
    "cta",
    "stats",
  ];

  for (const section of sectionNames) {
    const action = getSectionAction(text, section);
    if (action) {
      const normalizedSection =
        section === "testimonial" ? "testimonials" : section === "packages" ? "pricing" : section;
      actions.push({ ...action, targetSection: normalizedSection });
    }
  }

  if (text.includes("move pricing") && text.includes("packages")) {
    actions.push({
      type: "move_section",
      sourcePage: text.includes("services") ? "services" : "home",
      targetPage: "packages",
      targetSection: "pricing",
      normalizedInstruction: "Move pricing to the Packages page and remove it from the source page.",
      needsAI: false,
    });
  }

  if (color && includesAny(text, ["colors", "palette", "color", "colour"])) {
    actions.push({
      type: "update_style",
      targetPage: "global",
      targetSection: "color palette",
      normalizedInstruction: `Change the color palette to ${color}${text.includes("gold") ? " and gold" : ""}.`,
      needsAI: false,
    });
  }

  if (text.includes("booking button") || text.includes("book button")) {
    actions.push({
      type: "add_section",
      targetPage: "home",
      targetSection: "cta",
      normalizedInstruction: "Add a clear booking CTA button while preserving the current design style.",
      needsAI: false,
    });
  }

  if (text.includes("mobile") && includesAny(text, ["better", "fix", "improve"])) {
    actions.push({
      type: "update_style",
      targetPage: "global",
      targetSection: "mobile responsiveness",
      normalizedInstruction: "Improve mobile spacing and responsive grids without changing the desktop design.",
      needsAI: false,
    });
  }

  if (text.includes("homepage") && includesAny(text, ["less crowded", "simpler", "more space"])) {
    actions.push({
      type: "update_style",
      targetPage: "home",
      targetSection: "spacing",
      normalizedInstruction: "Make the homepage feel less crowded with more spacing and calmer section rhythm.",
      needsAI: false,
    });
  }

  if (includesAny(text, ["luxury", "premium", "more refined", "make it luxe"])) {
    actions.push({
      type: "update_style",
      targetPage: "global",
      targetSection: "premium polish",
      normalizedInstruction:
        "Make the website feel more premium with refined spacing, softer cards, stronger typography, and more elegant CTAs.",
      needsAI: false,
    });
  }

  if (text.includes("images") && includesAny(text, ["change", "replace", "better"])) {
    actions.push({
      type: "replace_image",
      targetPage: "home",
      targetSection: "images",
      normalizedInstruction: rawInstruction,
      needsAI: true,
    });
  }

  return actions;
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

  const quotedTarget = getQuotedText(rawInstruction);
  const mentionsTextSizing = includesAny(text, [
    "text size",
    "font size",
    "smaller",
    "bigger",
    "larger",
    "make big",
    "make small",
  ]);
  const color = getColorTarget(text);

  if (quotedTarget && (mentionsTextSizing || color)) {
    return {
      rawInstruction,
      normalizedInstruction: rawInstruction,
      editType: "simple",
      target: "quoted text",
      action: mentionsTextSizing ? "change quoted text size" : "change quoted text color",
      constraints,
      defaults: color ? { color } : defaults,
      needsAI: false,
    };
  }

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
    const smaller = text.includes("small") || text.includes("smaller") || text.includes("reduce");
    return {
      rawInstruction,
      normalizedInstruction: smaller
        ? "Make the hero headline smaller while keeping the design responsive."
        : "Make the hero headline larger while keeping the design responsive.",
      editType: "simple",
      target: "hero headline",
      action: smaller ? "decrease font size" : "increase font size",
      constraints,
      defaults,
      needsAI: false,
    };
  }

  if (
    color &&
    includesAny(text, ["color", "colour"]) &&
    !includesAny(text, ["colors", "palette", "gold"])
  ) {
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
  const mentionsRemove = includesAny(text, ["remove", "delete", "take out"]);
  const mentionsPackagesPage = text.includes("packages page") || text.includes("package page");
  const mentionsAttractive = includesAny(text, [
    "attractive",
    "better",
    "improve",
    "customer",
    "customers",
    "premium",
    "polished",
  ]);
  const mentionsRedesign = includesAny(text, ["redesign", "improve", "fix", "upgrade", "better"]);

  if (mentionsRemove && mentionsServices && mentionsPricing && mentionsPackagesPage) {
    return {
      rawInstruction,
      normalizedInstruction:
        "Remove the pricing section from the Services page only. Make the Packages page more attractive to customers with better package cards, stronger benefits, clearer CTAs, and premium spacing while preserving the current design style.",
      editType: "compound",
      target: "services and packages",
      action: "remove pricing from services and improve packages page",
      actions: [
        {
          type: "remove_section",
          targetPage: "services",
          targetSection: "pricing",
          normalizedInstruction: "Remove the pricing section from the Services page only.",
        },
        {
          type: "improve_page",
          targetPage: "packages",
          normalizedInstruction:
            "Make the Packages page more attractive to customers with better package cards, stronger benefits, clearer CTAs, and premium spacing while preserving the current design style.",
        },
      ],
      constraints: [
        ...constraints,
        "do not redesign whole website",
        "preserve navbar and footer",
        "preserve all other pages",
      ],
      defaults,
      needsAI: false,
    };
  }

  const parsedActions = buildActionsFromText(text, rawInstruction, color);

  if (parsedActions.length > 1) {
    return {
      rawInstruction,
      normalizedInstruction: parsedActions.map((action) => action.normalizedInstruction).join(" "),
      editType: "compound",
      target: "multiple targets",
      action: "apply multiple safe edits",
      actions: parsedActions,
      constraints: [
        ...constraints,
        "do not redesign whole website unless requested",
        "preserve other pages",
      ],
      defaults,
      needsAI: parsedActions.some((action) => action.needsAI),
    };
  }

  if (parsedActions.length === 1) {
    const [onlyAction] = parsedActions;
    return {
      rawInstruction,
      normalizedInstruction: onlyAction.normalizedInstruction,
      editType: onlyAction.type === "update_style" ? "simple" : "section",
      target: onlyAction.targetSection,
      action: onlyAction.normalizedInstruction,
      actions: parsedActions,
      constraints,
      defaults,
      needsAI: Boolean(onlyAction.needsAI),
    };
  }

  if (mentionsRemove && mentionsServices && mentionsPricing && mentionsPackagesPage) {
    return {
      rawInstruction,
      normalizedInstruction:
        "Remove the pricing section from the Services page only. Make the Packages page more attractive to customers with better package cards, stronger benefits, clearer CTAs, and premium spacing while preserving the current design style.",
      editType: "compound",
      target: "services and packages",
      action: "remove pricing from services and improve packages page",
      actions: [
        {
          type: "remove_section",
          targetPage: "services",
          targetSection: "pricing",
          normalizedInstruction: "Remove the pricing section from the Services page only.",
        },
        {
          type: "improve_page",
          targetPage: "packages",
          normalizedInstruction:
            "Make the Packages page more attractive to customers with better package cards, stronger benefits, clearer CTAs, and premium spacing while preserving the current design style.",
        },
      ],
      constraints: [
        ...constraints,
        "do not redesign whole website",
        "preserve navbar and footer",
        "preserve all other pages",
      ],
      defaults,
      needsAI: false,
    };
  }

  if (mentionsPackagesPage && mentionsAttractive) {
    return {
      rawInstruction,
      normalizedInstruction:
        "Make the Packages page more attractive to customers with better package cards, stronger benefits, clearer CTAs, and premium spacing while preserving the current design style.",
      editType: "section",
      target: "packages",
      action: "improve packages page",
      constraints,
      defaults,
      needsAI: false,
    };
  }

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
