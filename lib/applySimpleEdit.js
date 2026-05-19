function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRequestedPixelSize(instruction = "") {
  const match = String(instruction).match(/(\d{2,4})\s*px/i);
  return match ? Number(match[1]) : 0;
}

function extractLikelyTargetText(appCode = "", instruction = "") {
  const text = String(instruction || "").trim();
  const split = text.split(
    /\b(make|change|set|increase|decrease|bigger|larger|smaller|font|color)\b/i,
  )[0]?.trim();

  if (split && split.length > 12 && appCode.includes(split)) {
    return split;
  }

  return "";
}

function setCssVariable(cssCode = "", name, value) {
  const variableLine = `  ${name}: ${value};`;
  const variableRegex = new RegExp(`(${escapeRegExp(name)}\\s*:\\s*)([^;]+)(;)`, "i");

  if (variableRegex.test(cssCode)) {
    return cssCode.replace(variableRegex, `$1${value}$3`);
  }

  if (/:root\s*\{/.test(cssCode)) {
    return cssCode.replace(/:root\s*\{/, `:root {\n${variableLine}`);
  }

  return `:root {\n${variableLine}\n}\n\n${cssCode}`;
}

function ensureHeroTitleCss(cssCode = "") {
  let nextCss = cssCode;

  nextCss = setCssVariable(
    nextCss,
    "--hero-headline-size",
    "clamp(3.5rem, 7vw, 7rem)",
  );
  nextCss = setCssVariable(nextCss, "--hero-headline-color", "#111827");
  nextCss = setCssVariable(nextCss, "--hero-subheadline-size", "1.35rem");

  if (!/\.hero-title\s*\{/.test(nextCss)) {
    nextCss += `\n\n.hero-title {\n  font-size: var(--hero-headline-size);\n  color: var(--hero-headline-color);\n}\n`;
  } else {
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
  }

  return nextCss;
}

function addClassNameValue(openingTag, className) {
  if (/className="/.test(openingTag)) {
    return openingTag.replace(/className="([^"]*)"/, (match, existing) => {
      const classes = existing.split(/\s+/).filter(Boolean);

      if (!classes.includes(className)) {
        classes.push(className);
      }

      return `className="${classes.join(" ")}"`;
    });
  }

  return openingTag.replace(/>$/, ` className="${className}">`);
}

function addDataEditId(openingTag, editId) {
  if (/data-edit-id=/.test(openingTag)) {
    return openingTag;
  }

  return openingTag.replace(/>$/, ` data-edit-id="${editId}">`);
}

function ensureHeroHeadlineTarget(appCode = "", targetText = "") {
  let nextApp = appCode;

  if (/data-edit-id="hero-headline"/.test(nextApp)) {
    return nextApp.replace(/<h1\b[^>]*data-edit-id="hero-headline"[^>]*>/, (tag) =>
      addClassNameValue(tag, "hero-title"),
    );
  }

  if (targetText) {
    const targetRegex = new RegExp(
      `<h1\\b([^>]*)>\\s*${escapeRegExp(targetText)}\\s*</h1>`,
      "i",
    );

    if (targetRegex.test(nextApp)) {
      return nextApp.replace(targetRegex, (match) =>
        match.replace(/<h1\b[^>]*>/, (tag) =>
          addClassNameValue(addDataEditId(tag, "hero-headline"), "hero-title"),
        ),
      );
    }
  }

  return nextApp.replace(/<h1\b[^>]*>/, (tag) =>
    addClassNameValue(addDataEditId(tag, "hero-headline"), "hero-title"),
  );
}

function getSafeHeadlineSize(instruction = "") {
  const requestedPixels = getRequestedPixelSize(instruction);

  if (requestedPixels >= 180) {
    return {
      value: "clamp(5rem, 12vw, 10rem)",
      message:
        `Applied a large responsive headline size instead of ${requestedPixels}px to keep the design usable.`,
    };
  }

  if (requestedPixels >= 48) {
    return {
      value: `${requestedPixels}px`,
      message: "Edit applied.",
    };
  }

  return {
    value: "clamp(4.5rem, 9vw, 9rem)",
    message: "Edit applied.",
  };
}

function replaceQuotedText(appCode = "", instruction = "") {
  const match = String(instruction).match(/change\s+["“]([^"”]+)["”]\s+to\s+["“]([^"”]+)["”]/i);

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
  const hasHeadlineTarget =
    text.includes("hero") ||
    text.includes("headline") ||
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
  const textReplacement = replaceQuotedText(appCode, instruction);

  let nextAppCode = textReplacement.appCode;
  let nextCssCode = cssCode;
  let changed = textReplacement.changed;
  let message = textReplacement.changed ? "Edit applied." : "";

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
