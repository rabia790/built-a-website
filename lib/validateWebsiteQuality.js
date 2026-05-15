function getFile(files = [], path) {
  return files.find((file) => file.path === path)?.content || "";
}

function countRepeatedImages(appCode) {
  const urls = appCode.match(/https?:\/\/[^"')\s]+/g) || [];
  const counts = new Map();

  for (const url of urls) {
    if (!/images\.unsplash\.com|\.jpg|\.jpeg|\.png|\.webp|\.avif|\.svg/i.test(url)) {
      continue;
    }
    counts.set(url, (counts.get(url) || 0) + 1);
  }

  return [...counts.entries()].filter(([, count]) => count > 2);
}

export function validateWebsiteQuality({ files = [], appCode, cssCode, category = "", instruction = "" }) {
  const app = String(appCode || getFile(files, "/App.js") || "");
  const css = String(cssCode || getFile(files, "/styles.css") || "");
  const errors = [];

  if (/welcome to/i.test(app)) errors.push('Avoid generic "Welcome to" copy.');
  if (/blog post 1/i.test(app)) errors.push('Replace placeholder "Blog Post 1" content.');
  if (/case study 1/i.test(app)) errors.push('Replace placeholder "Case Study 1" content.');
  if (/company x/i.test(app)) errors.push('Replace placeholder "Company X" content.');
  if (/(src\s*=\s*["']\/|url\(["']?\/(?:image|hero|gallery|office|restaurant))/i.test(app)) {
    errors.push("Use full remote image URLs instead of fake local image paths.");
  }

  if (!/React\.useState\s*\(/.test(app)) {
    errors.push("Multi-page websites must use React.useState navigation.");
  }

  const labels = app.match(/\b(Home|About|Services|Shop|Work|Portfolio|Case Studies|Journal|Blog|Categories|Brands|Gallery|Industries|Process|Pricing|Packages|Contact)\b/g) || [];
  if (new Set(labels).size < 5) {
    errors.push("Include at least 5 nav/page labels.");
  }

  const imageUrls = app.match(/https?:\/\/[^"')\s]+/g)?.filter((url) =>
    /images\.unsplash\.com|\.jpg|\.jpeg|\.png|\.webp|\.avif|\.svg/i.test(url),
  ) || [];
  if (!/(no images|without images|text only|no photos|without photos)/i.test(instruction) && imageUrls.length < 2) {
    errors.push("Include at least 2 image URLs for visual categories.");
  }

  if (countRepeatedImages(app).length) {
    errors.push("Do not repeat the same image more than twice.");
  }

  if (app.length < 6500) errors.push("App.js is too short for a premium multi-page website.");
  if (css.length < 1200) errors.push("CSS is too short for a premium responsive design.");
  if (/our services/i.test(app) && !/(deliverable|strategy|identity|package|process|premium|luxury|tailored|editorial)/i.test(app)) {
    errors.push('Avoid plain "Our Services" sections without premium, specific content.');
  }
  if (!/(testimonial|review|client|quote)/i.test(app)) errors.push("Include testimonials or client proof.");
  if (!/(cta|contact|book|start|get started|inquiry|consultation)/i.test(app)) errors.push("Include a strong CTA.");

  if (/pricing|packages/i.test(instruction) && !/(pricing|package|packages|plan)/i.test(app)) {
    errors.push("The edit asked for pricing/packages, but output does not include them.");
  }
  if (/luxury|premium/i.test(instruction) && !/(luxury|premium|editorial|elegant|refined|bespoke|curated)/i.test(app + css)) {
    errors.push("The edit asked for more luxury/premium styling, but design language did not change enough.");
  }

  if (category === "home_staging" && imageUrls.filter((url) => /1600607687939|1600566753190|1600585154340|1600210492493/.test(url)).length < 2) {
    errors.push("Home staging output should use at least 2 approved interior images.");
  }

  const score = Math.max(0, 100 - errors.length * 12);

  return { score, errors };
}
