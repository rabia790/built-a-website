export function findPageComponent(appCode = "", pageName = "") {
  const normalized = String(pageName || "").toLowerCase();
  const candidates = {
    home: ["HomePage", "Hero", "LandingPage"],
    services: ["ServicesPage", "Services", "ServicePage", "AudienceSplit"],
    packages: ["PackagesPage", "PricingPage", "PackagePage"],
    pricing: ["PackagesPage", "PricingPage", "PackagePage", "ServicesPage"],
    contact: ["ContactPage", "Contact"],
    portfolio: ["PortfolioPage", "WorkPage", "GalleryPage"],
    gallery: ["GalleryPage", "PortfolioPage", "WorkPage", "HomePage"],
    about: ["AboutPage", "About"],
    faq: ["FaqPage", "FAQPage", "HomePage"],
    testimonials: ["TestimonialsPage", "HomePage"],
  };
  const names = candidates[normalized] || [
    `${pageName.charAt(0).toUpperCase()}${pageName.slice(1)}Page`,
    "HomePage",
  ];

  for (const name of names) {
    const start = appCode.search(new RegExp(`function\\s+${name}\\s*\\(`));
    if (start < 0) continue;

    const paramsStart = appCode.indexOf("(", start);
    let parenDepth = 0;
    let paramsEnd = -1;

    for (let index = paramsStart; index < appCode.length; index += 1) {
      if (appCode[index] === "(") parenDepth += 1;
      if (appCode[index] === ")") parenDepth -= 1;
      if (parenDepth === 0) {
        paramsEnd = index;
        break;
      }
    }

    const braceStart = appCode.indexOf("{", paramsEnd);
    if (braceStart < 0) continue;

    let depth = 0;
    for (let index = braceStart; index < appCode.length; index += 1) {
      if (appCode[index] === "{") depth += 1;
      if (appCode[index] === "}") depth -= 1;
      if (depth === 0) {
        return {
          name,
          start,
          end: index + 1,
          content: appCode.slice(start, index + 1),
        };
      }
    }
  }

  return null;
}

export function replacePageComponent(appCode = "", component, newCode = "") {
  if (!component) return appCode;
  return `${appCode.slice(0, component.start)}${newCode}${appCode.slice(component.end)}`;
}

export function insertSectionIntoPage(appCode = "", pageName = "home", sectionCode = "", position = "end") {
  const component = findPageComponent(appCode, pageName);
  if (!component) {
    return { changed: false, appCode, error: `${pageName} page was not found.` };
  }

  if (component.content.includes(sectionCode.slice(0, 80).trim())) {
    return { changed: false, appCode, error: "That section already exists." };
  }

  let updated = component.content;
  if (position === "start") {
    updated = updated.replace(/(<main\b[^>]*>)/i, `$1\n${sectionCode}`);
  } else {
    const mainClose = updated.lastIndexOf("</main>");
    const insertAt = mainClose >= 0 ? mainClose : updated.lastIndexOf(");");
    if (insertAt < 0) {
      return { changed: false, appCode, error: `Could not find where to insert section in ${pageName}.` };
    }
    updated = `${updated.slice(0, insertAt)}\n${sectionCode}\n${updated.slice(insertAt)}`;
  }

  return {
    changed: updated !== component.content,
    appCode: replacePageComponent(appCode, component, updated),
  };
}

export function removeSectionFromPage(appCode = "", pageName = "home", sectionId = "") {
  const component = findPageComponent(appCode, pageName);
  if (!component) {
    return { changed: false, appCode, error: `${pageName} page was not found.` };
  }

  const sectionPatterns = [
    new RegExp(`\\s*<section\\b[^>]*data-edit-id=["']${sectionId}["'][^>]*>[\\s\\S]*?<\\/section>`, "i"),
    new RegExp(`\\s*<section\\b[^>]*className=["'][^"']*${sectionId.replace("-section", "")}[^"']*["'][^>]*>[\\s\\S]*?<\\/section>`, "i"),
  ];
  let updated = component.content;

  for (const pattern of sectionPatterns) {
    updated = updated.replace(pattern, "");
  }

  return {
    changed: updated !== component.content,
    appCode: replacePageComponent(appCode, component, updated),
    error: updated === component.content ? `${sectionId} was not found on ${pageName}.` : "",
  };
}

export function appendCssIfMissing(cssCode = "", cssBlock = "", marker = "") {
  if (marker && cssCode.includes(marker)) return cssCode;
  return `${cssCode.trimEnd()}\n\n${cssBlock.trim()}\n`;
}
