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
  const match = String(instruction).match(/change\s+"([^"]+)"\s+to\s+"([^"]+)"/i);

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

export function applySimpleEdit(appCode = "", cssCode = "", instruction = "") {
  const text = String(instruction || "").toLowerCase();
  const targetText = extractLikelyTargetText(appCode, instruction);
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
  const wantsBlackHeadline =
    hasHeadlineTarget &&
    text.includes("black") &&
    (text.includes("color") || text.includes("text"));
  const wantsHeadlineSize = hasHeadlineTarget && wantsBiggerText;
  const textReplacement = replaceQuotedTextSafe(appCode, instruction);

  let nextAppCode = textReplacement.appCode;
  let nextCssCode = cssCode;
  let changed = textReplacement.changed;
  let message = textReplacement.changed ? "Edit applied." : "";

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
    const size = getSafeHeadlineSize(instruction);
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
