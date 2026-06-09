function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRequestedPixelSize(instruction = "") {
  const match = String(instruction).match(/(\d{2,4})\s*px/i);
  return match ? Number(match[1]) : 0;
}

function extractLikelyTargetText(appCode = "", instruction = "") {
  const prefix = String(instruction || "")
    .trim()
    .split(/\b(make|change|set|increase|decrease|bigger|larger|smaller|font|color)\b/i)[0]
    ?.trim();

  if (prefix && prefix.length > 12 && appCode.includes(prefix)) {
    return prefix;
  }

  return "";
}

function setCssVariable(cssCode = "", name, value) {
  const variableRegex = new RegExp(`(${escapeRegExp(name)}\\s*:\\s*)([^;]+)(;)`, "i");

  if (variableRegex.test(cssCode)) {
    return cssCode.replace(variableRegex, `$1${value}$3`);
  }

  if (/:root\s*\{/.test(cssCode)) {
    return cssCode.replace(/:root\s*\{/, `:root {\n  ${name}: ${value};`);
  }

  return `:root {\n  ${name}: ${value};\n}\n\n${cssCode}`;
}

function ensureHeroTitleCss(cssCode = "") {
  let nextCss = cssCode;

  nextCss = setCssVariable(nextCss, "--hero-headline-size", "clamp(3.5rem, 7vw, 7rem)");
  nextCss = setCssVariable(nextCss, "--hero-headline-color", "#111827");
  nextCss = setCssVariable(nextCss, "--hero-subheadline-size", "1.35rem");

  if (!/\.hero-title\s*\{/.test(nextCss)) {
    return `${nextCss}\n\n.hero-title {\n  font-size: var(--hero-headline-size);\n  color: var(--hero-headline-color);\n}\n`;
  }

  if (!/\.hero-title\s*\{[^}]*font-size\s*:/s.test(nextCss)) {
    nextCss = nextCss.replace(
      /\.hero-title\s*\{/,
      ".hero-title {\n  font-size: var(--hero-headline-size);",
    );
  }

  if (!/\.hero-title\s*\{[^}]*color\s*:/s.test(nextCss)) {
    nextCss = nextCss.replace(
      /\.hero-title\s*\{/,
      ".hero-title {\n  color: var(--hero-headline-color);",
    );
  }

  return nextCss;
}

function ensureLogoCss(cssCode = "") {
  const existingMarker =
    cssCode.indexOf("/* Nexus editable brand layout */") >= 0
      ? cssCode.indexOf("/* Nexus editable brand layout */")
      : cssCode.indexOf("/* Nexus normalized brand layout */");
  const baseCss = (existingMarker >= 0 ? cssCode.slice(0, existingMarker) : cssCode)
    .replace(/\[data-edit-id=["']brand-logo["'][^\{]*\{[^}]*\}/g, "")
    .trimEnd();

  return `${baseCss}

/* Nexus normalized brand layout */
.brand,
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-width: max-content;
  white-space: nowrap;
  flex-shrink: 0;
  color: #111827;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  padding: 0;
  text-decoration: none;
  cursor: pointer;
  font: inherit;
}

.brand .brand-logo-mark,
.brand-mark .brand-logo-mark {
  width: 42px;
  height: 42px;
  min-width: 42px;
  flex: 0 0 42px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #111827;
  color: #ffffff;
  font-family: Georgia, serif;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1;
}

.brand .brand-name,
.brand-mark .brand-name {
  display: inline-block;
  color: #111827;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
  opacity: 1;
  visibility: visible;
  width: auto;
  height: auto;
  min-width: 0;
  flex: 0 1 auto;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  padding: 0;
  text-align: left;
}

@media (max-width: 640px) {
  .brand,
  .brand-mark {
    gap: 0.6rem;
  }

  .brand .brand-logo-mark,
  .brand-mark .brand-logo-mark {
    width: 36px;
    height: 36px;
    min-width: 36px;
    flex-basis: 36px;
    font-size: 0.8rem;
  }

  .brand .brand-name,
  .brand-mark .brand-name {
    font-size: 0.95rem;
  }
}`;
}

function addClassNameValue(openingTag, className) {
  if (/className="/.test(openingTag)) {
    return openingTag.replace(/className="([^"]*)"/, (match, existing) => {
      const classes = existing.split(/\s+/).filter(Boolean);
      if (!classes.includes(className)) classes.push(className);
      return `className="${classes.join(" ")}"`;
    });
  }

  return openingTag.replace(/>$/, ` className="${className}">`);
}

function normalizeText(value = "") {
  return String(value || "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?,;:]+$/g, "")
    .trim()
    .toLowerCase();
}

function normalizeTextForSearch(value = "") {
  return normalizeText(value);
}

function extractQuotedTargetText(instruction = "") {
  const match = String(instruction || "").match(/["“]([^"”]+)["”]/);
  return normalizeTextForSearch(match?.[1] || "");
}

function stripJsxForSearch(value = "") {
  return normalizeTextForSearch(
    String(value || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/\{["'`]([^"'`]+)["'`]\}/g, "$1")
      .replace(/\{[^}]+\}/g, " "),
  );
}

function getImportantWords(value = "") {
  const stopWords = new Set([
    "the",
    "and",
    "with",
    "that",
    "this",
    "ready",
    "into",
    "your",
    "you",
    "for",
    "from",
    "are",
    "our",
    "their",
    "have",
    "has",
    "work",
  ]);

  return normalizeText(value)
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));
}

function getPhraseMatchScore(content = "", target = "") {
  const normalizedContent = normalizeText(content);
  const normalizedTarget = normalizeText(target);

  if (!normalizedContent || !normalizedTarget) return 0;
  if (normalizedContent === normalizedTarget) return 100;
  if (normalizedContent.includes(normalizedTarget)) return 95;
  if (normalizedTarget.includes(normalizedContent) && normalizedContent.length > 18) return 85;

  const targetWords = getImportantWords(normalizedTarget);
  if (!targetWords.length) return 0;

  const matchedWords = targetWords.filter((word) => normalizedContent.includes(word));
  const wordScore = (matchedWords.length / targetWords.length) * 80;
  const targetParts = normalizedTarget.split(/\s+/);
  const chunks = [];

  for (let index = 0; index < targetParts.length - 2; index += 1) {
    chunks.push(targetParts.slice(index, index + 3).join(" "));
  }

  const chunkScore = chunks.some((chunk) => normalizedContent.includes(chunk)) ? 10 : 0;
  return Math.round(wordScore + chunkScore);
}

function getElementPriority(tagName = "", attrs = "") {
  const attrText = String(attrs || "").toLowerCase();

  if (/data-edit-id=["']hero-headline["']/.test(attrText)) return 0;
  if (/\b(hero-title|headline|title)\b/.test(attrText)) return 1;
  if (tagName === "h1") return 2;
  if (tagName === "h2") return 3;
  if (tagName === "h3") return 4;
  return 5;
}

function findElementContainingQuotedText(appCode = "", targetText = "") {
  const normalizedTarget = normalizeTextForSearch(targetText);

  if (!normalizedTarget) {
    return null;
  }

  const candidates = [];
  const tags = ["h1", "h2", "h3", "p", "span", "div"];

  for (const tagName of tags) {
    const elementRegex = new RegExp(`<(${tagName})\\b([^>]*)>([\\s\\S]*?)<\\/\\1>`, "gi");
    let match = elementRegex.exec(appCode);

    while (match) {
      const [fullMatch, matchedTagName, attrs, innerContent] = match;
      const normalizedContent = stripJsxForSearch(innerContent);
      const score = getPhraseMatchScore(normalizedContent, normalizedTarget);

      if (score >= 55) {
        candidates.push({
          fullMatch,
          tagName: matchedTagName.toLowerCase(),
          attrs,
          innerContent,
          openingTag: `<${matchedTagName}${attrs}>`,
          exact: normalizedContent === normalizedTarget,
          score,
          visibleText: normalizedContent,
          priority: getElementPriority(matchedTagName.toLowerCase(), attrs),
        });
      }

      match = elementRegex.exec(appCode);
    }
  }

  return (
    candidates
      .sort((a, b) => {
        if (a.exact !== b.exact) return a.exact ? -1 : 1;
        if (a.score !== b.score) return b.score - a.score;
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.fullMatch.length - b.fullMatch.length;
      })[0] || null
  );
}

function findHeroHeadlineElement(appCode = "") {
  const heroRegexes = [
    /<h1\b([^>]*)data-edit-id=["']hero-headline["']([^>]*)>([\s\S]*?)<\/h1>/i,
    /<h1\b([^>]*)className=["'][^"']*(?:hero-title|headline|title)[^"']*["']([^>]*)>([\s\S]*?)<\/h1>/i,
    /<h1\b([^>]*)>([\s\S]*?)<\/h1>/i,
  ];

  for (const regex of heroRegexes) {
    const match = appCode.match(regex);

    if (match) {
      const fullMatch = match[0];
      const openingTag = fullMatch.match(/<h1\b[^>]*>/i)?.[0] || "";
      return {
        fullMatch,
        tagName: "h1",
        attrs: openingTag.replace(/^<h1/i, "").replace(/>$/, ""),
        innerContent: fullMatch.replace(/^<h1\b[^>]*>/i, "").replace(/<\/h1>$/i, ""),
        openingTag,
        usedFallback: true,
        visibleText: stripJsxForSearch(fullMatch),
      };
    }
  }

  return null;
}

function ensureEditableTextCss(cssCode = "") {
  let nextCss = cssCode;

  if (!/\.editable-heading-smaller\s*\{/.test(nextCss)) {
    nextCss = `${nextCss.trimEnd()}

.editable-heading-smaller {
  font-size: clamp(2rem, 4vw, 4rem) !important;
  line-height: 0.95 !important;
}
`;
  }

  if (!/\.editable-text-smaller\s*\{/.test(nextCss)) {
    nextCss = `${nextCss.trimEnd()}

.editable-text-smaller {
  font-size: clamp(1rem, 2vw, 1.5rem) !important;
  line-height: 1.25 !important;
}
`;
  }

  return nextCss;
}

function ensureEditableTextBiggerCss(cssCode = "") {
  if (/\.editable-text-larger\s*\{/.test(cssCode)) {
    return cssCode;
  }

  return `${cssCode.trimEnd()}

.editable-heading-larger {
  font-size: clamp(4rem, 8vw, 8rem) !important;
  line-height: 0.9 !important;
}

.editable-text-larger {
  font-size: clamp(1.5rem, 3vw, 2.25rem) !important;
  line-height: 1.2 !important;
}
`;
}

function applyQuotedTextStyleEdit(appCode = "", cssCode = "", instruction = "") {
  const text = String(instruction || "").toLowerCase();
  const targetText = extractQuotedTargetText(instruction);

  if (!targetText) {
    return { changed: false, appCode, cssCode };
  }

  const wantsSmaller =
    text.includes("smaller") ||
    text.includes("decrease") ||
    text.includes("reduce") ||
    text.includes("less big");
  const wantsBigger =
    text.includes("bigger") ||
    text.includes("larger") ||
    text.includes("increase") ||
    text.includes("make big");
  const wantsColor = text.includes("color") || text.includes("colour");

  if (!wantsSmaller && !wantsBigger && !wantsColor) {
    return { changed: false, appCode, cssCode, targetText };
  }

  const mentionsSizing = wantsSmaller || wantsBigger;
  const element =
    findElementContainingQuotedText(appCode, targetText) ||
    (mentionsSizing ? findHeroHeadlineElement(appCode) : null);
  const usedFallback = Boolean(element?.usedFallback);

  console.log("Quoted target text:", targetText);
  console.log("Normalized target text:", normalizeText(targetText));
  console.log("Closest matched element:", element?.tagName || "");
  console.log("Used fallback hero headline:", usedFallback);

  if (!element) {
    return {
      changed: false,
      failed: true,
      appCode,
      cssCode,
      targetText,
      error:
        "I could not find that text in the current website. Try selecting/copying the exact text from the Code tab.",
      details: [
        `I could not find that text in the current website: "${targetText}". Try selecting/copying the exact text from the Code tab.`,
      ],
    };
  }

  let className = "";
  let nextCssCode = cssCode;

  if (wantsSmaller) {
    className = ["h1", "h2"].includes(element.tagName)
      ? "editable-heading-smaller"
      : "editable-text-smaller";
    nextCssCode = ensureEditableTextCss(nextCssCode);
  } else if (wantsBigger) {
    className = ["h1", "h2"].includes(element.tagName)
      ? "editable-heading-larger"
      : "editable-text-larger";
    nextCssCode = ensureEditableTextBiggerCss(nextCssCode);
  }

  let nextOpeningTag = element.openingTag;

  if (className) {
    nextOpeningTag = addClassNameValue(nextOpeningTag, className);
  }

  if (wantsColor) {
    const color = getRequestedColor(instruction);

    if (!color) {
      return {
        changed: false,
        failed: true,
        appCode,
        cssCode,
        targetText,
        error: "I understood the text target, but not the requested color.",
        details: ["Please include a color name or hex value."],
      };
    }

    if (/style=\{\{/.test(nextOpeningTag)) {
      nextOpeningTag = nextOpeningTag.replace(/style=\{\{([^}]*)\}\}/, (match, styles) => {
        const cleaned = styles.replace(/color\s*:\s*["'][^"']+["']\s*,?\s*/i, "");
        return `style={{ color: "${color}", ${cleaned.trim()} }}`;
      });
    } else {
      nextOpeningTag = nextOpeningTag.replace(/>$/, ` style={{ color: "${color}" }}>`);
    }
  }

  const updatedElement = element.fullMatch.replace(element.openingTag, nextOpeningTag);

  return {
    changed: updatedElement !== element.fullMatch || nextCssCode !== cssCode,
    appCode: appCode.replace(element.fullMatch, updatedElement),
    cssCode: nextCssCode,
    targetText,
    message: usedFallback
      ? "I could not find that exact text. I applied the edit to the closest hero headline instead."
      : wantsSmaller
        ? "Text size reduced."
        : wantsBigger
          ? "Text size increased."
          : "Text color updated.",
  };
}

function addAttribute(openingTag, attribute, value) {
  if (new RegExp(`${escapeRegExp(attribute)}=`).test(openingTag)) {
    return openingTag;
  }

  return openingTag.replace(/>$/, ` ${attribute}="${value}">`);
}

function addDataEditId(openingTag, editId) {
  return addAttribute(openingTag, "data-edit-id", editId);
}

function ensureGetInitialsHelper(appCode = "") {
  if (/function\s+getInitials\s*\(/.test(appCode)) {
    return appCode;
  }

  const helper = `
function getInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
`;

  if (/const\s+brandName\s*=/.test(appCode)) {
    return appCode.replace(/(const\s+brandName\s*=\s*["'][^"']+["'];?)/, `$1\n${helper}`);
  }

  return `${helper}\n${appCode}`;
}

function countMatches(value = "", pattern) {
  return String(value).match(pattern)?.length || 0;
}

function getLiteralBrandName(appCode = "") {
  const match = appCode.match(/const\s+brandName\s*=\s*["']([^"']+)["'];?/);
  return match?.[1] || "";
}

function getInitialsFromText(name = "") {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getBrandNameMarkup(appCode = "", innerContent = "") {
  if (innerContent.includes("{brandName}") || /const\s+brandName\s*=/.test(appCode)) {
    return {
      logoText: "{getInitials(brandName)}",
      brandText: "{brandName}",
      needsInitialsHelper: true,
    };
  }

  const explicitName =
    innerContent
      .replace(/<[^>]+>/g, " ")
      .replace(/\{[^}]+\}/g, " ")
      .replace(/\s+/g, " ")
      .trim() || getLiteralBrandName(appCode) || "Brand";

  return {
    logoText: getInitialsFromText(explicitName) || "B",
    brandText: explicitName,
    needsInitialsHelper: false,
  };
}

function getOnClickAttribute(attrs = "") {
  const match = String(attrs).match(/\s+onClick=\{[\s\S]*?\}/);
  return match?.[0] || ' onClick={() => setCurrentPage("home")}';
}

function normalizeBrandMarkup(appCode = "") {
  let changed = false;
  let needsInitialsHelper = false;
  let nextApp = appCode.replace(
    /<(button|a|div)((?:=>|[^>])*className="[^"]*\bbrand\b[^"]*"(?:=>|[^>])*)>([\s\S]*?)<\/\1>/,
    (match, tagName, attrs, innerContent) => {
      if (
        !innerContent.includes("{brandName}") &&
        !/data-edit-id="brand-logo"|data-edit-id="brand-name"|brand-logo-mark|brand-symbol/i.test(
          innerContent,
        )
      ) {
        return match;
      }

      const brand = getBrandNameMarkup(appCode, innerContent);
      needsInitialsHelper = needsInitialsHelper || brand.needsInitialsHelper;
      changed = true;
      const onClick = getOnClickAttribute(attrs);

      return `<button type="button" className="brand"${onClick}>
        <span data-edit-id="brand-logo" className="brand-logo-mark">${brand.logoText}</span>
        <span data-edit-id="brand-name" className="brand-name">${brand.brandText}</span>
      </button>`;
    },
  );

  if (!changed) {
    return appCode;
  }

  if (needsInitialsHelper) {
    nextApp = ensureGetInitialsHelper(nextApp);
  }

  return nextApp;
}

function ensureBrandLogo(appCode = "") {
  return normalizeBrandMarkup(appCode);
}

function isValidBrandMarkup(appCode = "") {
  return (
    countMatches(appCode, /data-edit-id="brand-logo"/g) === 1 &&
    countMatches(appCode, /data-edit-id="brand-name"/g) === 1 &&
    countMatches(appCode, /className="[^"]*\bbrand-logo-mark\b[^"]*"/g) === 1
  );
}

function ensureHeroHeadlineTarget(appCode = "", targetText = "") {
  if (/data-edit-id="hero-headline"/.test(appCode)) {
    return appCode.replace(/<h1\b[^>]*data-edit-id="hero-headline"[^>]*>/, (tag) =>
      addClassNameValue(tag, "hero-title"),
    );
  }

  if (targetText) {
    const targetRegex = new RegExp(
      `<h1\\b([^>]*)>\\s*${escapeRegExp(targetText)}\\s*</h1>`,
      "i",
    );

    if (targetRegex.test(appCode)) {
      return appCode.replace(targetRegex, (match) =>
        match.replace(/<h1\b[^>]*>/, (tag) =>
          addClassNameValue(addDataEditId(tag, "hero-headline"), "hero-title"),
        ),
      );
    }
  }

  return appCode.replace(/<h1\b[^>]*>/, (tag) =>
    addClassNameValue(addDataEditId(tag, "hero-headline"), "hero-title"),
  );
}

function getSafeHeadlineSize(instruction = "") {
  const requestedPixels = getRequestedPixelSize(instruction);

  if (requestedPixels >= 180) {
    return {
      value: "clamp(5rem, 12vw, 10rem)",
      message: `Applied a large responsive headline size instead of ${requestedPixels}px to keep the design usable.`,
    };
  }

  if (requestedPixels >= 48) {
    return { value: `${requestedPixels}px`, message: "Edit applied." };
  }

  return { value: "clamp(4.5rem, 9vw, 9rem)", message: "Edit applied." };
}

function replaceQuotedTextSafe(appCode = "", instruction = "") {
  const match = String(instruction).match(
    /(?:change|replace|set)\s+"([^"]+)"\s+(?:to|with)\s+"([^"]+)"/i,
  );

  if (!match) {
    return { appCode, changed: false };
  }

  const [, oldText, newText] = match;

  if (!appCode.includes(oldText)) {
    return { appCode, changed: false };
  }

  return {
    appCode: appCode.replace(oldText, newText),
    changed: true,
  };
}

function replaceButtonTextSafe(appCode = "", instruction = "") {
  const text = String(instruction || "");

  if (!/(button|cta)/i.test(text)) {
    return { appCode, changed: false };
  }

  const match = text.match(/"([^"]+)"\s+(?:to|with)\s+"([^"]+)"/i);

  if (!match) {
    return { appCode, changed: false };
  }

  const [, oldText, newText] = match;
  const buttonTextRegex = new RegExp(
    `(<button\\b[^>]*>)\\s*${escapeRegExp(oldText)}\\s*(<\\/button>)`,
    "i",
  );

  if (!buttonTextRegex.test(appCode)) {
    if (appCode.includes(oldText)) {
      return {
        appCode: appCode.replace(oldText, newText),
        changed: true,
      };
    }

    return { appCode, changed: false };
  }

  return {
    appCode: appCode.replace(buttonTextRegex, `$1${newText}$2`),
    changed: true,
  };
}

function getRequestedColor(instruction = "") {
  const text = String(instruction || "").toLowerCase();
  const hex = text.match(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i)?.[0];

  if (hex) return hex;

  const colors = {
    black: "#111827",
    white: "#ffffff",
    blue: "#2563eb",
    indigo: "#4f46e5",
    purple: "#7c3aed",
    green: "#16a34a",
    emerald: "#059669",
    red: "#dc2626",
    orange: "#f97316",
    yellow: "#f59e0b",
    beige: "#f6f2ea",
    cream: "#fffaf3",
    ivory: "#f8f4ee",
    charcoal: "#111827",
    gray: "#f3f4f6",
    grey: "#f3f4f6",
  };

  return Object.entries(colors).find(([name]) => text.includes(name))?.[1] || "";
}

function applyBackgroundColorEdit(cssCode = "", instruction = "") {
  const color = getRequestedColor(instruction);

  if (!color) {
    return { cssCode, changed: false };
  }

  let nextCss = cssCode;
  nextCss = setCssVariable(nextCss, "--bg", color);

  if (/body\s*\{[^}]*background\s*:/s.test(nextCss)) {
    nextCss = nextCss.replace(/(body\s*\{[^}]*background\s*:\s*)([^;]+)(;)/s, `$1${color}$3`);
  } else if (/body\s*\{/.test(nextCss)) {
    nextCss = nextCss.replace(/body\s*\{/, `body {\n  background: ${color};`);
  }

  return {
    cssCode: nextCss,
    changed: nextCss !== cssCode,
  };
}

export function applySimpleEdit(appCode = "", cssCode = "", instruction = "") {
  const text = String(instruction || "").toLowerCase();
  const targetText = extractLikelyTargetText(appCode, instruction);
  const quotedTextStyleEdit = applyQuotedTextStyleEdit(appCode, cssCode, instruction);

  if (quotedTextStyleEdit.changed || quotedTextStyleEdit.failed) {
    return {
      changed: quotedTextStyleEdit.changed,
      failed: Boolean(quotedTextStyleEdit.failed),
      appCode: quotedTextStyleEdit.appCode,
      cssCode: quotedTextStyleEdit.cssCode,
      message: quotedTextStyleEdit.message || "Edit applied.",
      error: quotedTextStyleEdit.error,
      details: quotedTextStyleEdit.details,
      targetText: quotedTextStyleEdit.targetText,
    };
  }

  const wantsLogo =
    /(logo|icon|brand mark|brand name|navbar brand|mark)/i.test(text) &&
    /(make|add|create|include|show|fix|repair|logo|icon|overlap|overlapping|unreadable)/i.test(
      text,
    );
  const hasHeadlineTarget =
    text.includes("hero") ||
    text.includes("headline") ||
    (text.includes("text") &&
      (text.includes("bigger") ||
        text.includes("larger") ||
        text.includes("black") ||
        text.includes("color"))) ||
    Boolean(targetText);
  const wantsBiggerText =
    text.includes("font size") ||
    text.includes("bigger") ||
    text.includes("larger") ||
    /\d{2,4}\s*px/i.test(text);
  const wantsSmallerText =
    text.includes("smaller") ||
    text.includes("decrease") ||
    text.includes("reduce") ||
    text.includes("make small");
  const wantsBlackHeadline =
    hasHeadlineTarget &&
    text.includes("black") &&
    (text.includes("color") || text.includes("text"));
  const wantsHeadlineSize = hasHeadlineTarget && (wantsBiggerText || wantsSmallerText);
  const textReplacement = replaceQuotedTextSafe(appCode, instruction);
  const buttonTextReplacement = replaceButtonTextSafe(
    textReplacement.appCode,
    instruction,
  );
  const wantsBackgroundColor =
    text.includes("background") &&
    (text.includes("color") ||
      text.includes("make") ||
      text.includes("change") ||
      text.includes("set"));

  let nextAppCode = buttonTextReplacement.appCode;
  let nextCssCode = cssCode;
  let changed = textReplacement.changed || buttonTextReplacement.changed;
  let message = changed ? "Edit applied." : "";

  if (wantsLogo) {
    const logoAppCode = ensureBrandLogo(nextAppCode);
    const logoCssCode = ensureLogoCss(nextCssCode);

    if (logoAppCode !== nextAppCode || isValidBrandMarkup(logoAppCode)) {
      nextAppCode = logoAppCode;
      nextCssCode = logoCssCode;
      changed = true;
      message = "Navbar logo cleaned up.";
    }
  }

  if (wantsHeadlineSize) {
    const size = wantsSmallerText
      ? { value: "clamp(2rem, 4vw, 4rem)", message: "Hero headline size reduced." }
      : getSafeHeadlineSize(instruction);
    nextAppCode = ensureHeroHeadlineTarget(nextAppCode, targetText);
    nextCssCode = ensureHeroTitleCss(nextCssCode);
    nextCssCode = setCssVariable(nextCssCode, "--hero-headline-size", size.value);
    changed = true;
    message = size.message;
  }

  if (wantsBlackHeadline) {
    nextAppCode = ensureHeroHeadlineTarget(nextAppCode, targetText);
    nextCssCode = ensureHeroTitleCss(nextCssCode);
    nextCssCode = setCssVariable(nextCssCode, "--hero-headline-color", "#111827");
    changed = true;
    message = "Edit applied.";
  }

  if (wantsBackgroundColor) {
    const backgroundEdit = applyBackgroundColorEdit(nextCssCode, instruction);

    if (backgroundEdit.changed) {
      nextCssCode = backgroundEdit.cssCode;
      changed = true;
      message = "Background color updated.";
    }
  }

  return {
    changed,
    appCode: nextAppCode,
    cssCode: nextCssCode,
    message: message || "Edit applied.",
  };
}

export function hasSimpleEditSignal(appCode = "", cssCode = "", instruction = "") {
  const text = String(instruction || "").toLowerCase();

  if (
    /(logo|icon|brand mark|brand name|navbar brand|mark|overlap|overlapping|unreadable)/i.test(
      text,
    ) &&
    isValidBrandMarkup(appCode)
  ) {
    return true;
  }

  if (/black/i.test(text) && /--hero-headline-color:\s*#111827/i.test(cssCode)) {
    return true;
  }

  if (
    /(font size|bigger|larger|\d{2,4}\s*px)/i.test(text) &&
    /--hero-headline-size:\s*(clamp\(5rem,\s*12vw,\s*10rem\)|clamp\(4\.5rem,\s*9vw,\s*9rem\)|\d+px)/i.test(
      cssCode,
    )
  ) {
    return true;
  }

  const targetText = extractLikelyTargetText(appCode, instruction);
  return Boolean(targetText && appCode.includes(targetText));
}
