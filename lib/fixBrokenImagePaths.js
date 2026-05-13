const imageMap = {
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  office:
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  technology:
    "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80",
  interior:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  wedding:
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  portfolio:
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
};

function pickImageUrl(prompt = "") {
  const text = prompt.toLowerCase();

  if (/(restaurant|menu|reservation|chef|cafe|dining|food)/.test(text)) {
    return imageMap.restaurant;
  }

  if (/(staffing|recruit|hiring|company|office|agency|career|jobs)/.test(text)) {
    return imageMap.office;
  }

  if (/(saas|software|technology|tech|ai|productivity|platform|app)/.test(text)) {
    return imageMap.technology;
  }

  if (/(staging|interior|home|real estate|realtor|property|decor)/.test(text)) {
    return imageMap.interior;
  }

  if (/(wedding|photography|photographer|bridal|couple|portrait)/.test(text)) {
    return imageMap.wedding;
  }

  if (/(portfolio|designer|brand|creative|studio)/.test(text)) {
    return imageMap.portfolio;
  }

  return imageMap.technology;
}

export function shouldIncludeImages(prompt = "") {
  return !/(no images|without images|text only|no photos|without photos)/i.test(
    prompt,
  );
}

export function hasRemoteImageReference(code = "") {
  return /<img\b/i.test(code) && /https?:\/\/[^"']+/i.test(code);
}

export function fixBrokenImagePaths(code, prompt) {
  const imageUrl = pickImageUrl(prompt);
  const localImagePattern =
    /(src\s*=\s*["'])(\/(?:image\d+|hero|gallery|restaurant|office|photo|photos|banner|cover|interior|staging|wedding|team|about|service|services|portfolio|project|placeholder)\.(?:jpg|jpeg|png|webp|avif|svg))(["'])/gi;

  return String(code || "").replace(
    localImagePattern,
    `${"$1"}${imageUrl}${"$3"}`,
  );
}

export function ensureImagesInGeneratedCode(appCode, prompt) {
  const code = fixBrokenImagePaths(appCode, prompt);

  if (!shouldIncludeImages(prompt) || hasRemoteImageReference(code)) {
    return code;
  }

  const imageUrl = pickImageUrl(prompt);
  const altText = /(staffing|recruit|hiring|company|office|agency|career|jobs)/i.test(
    prompt,
  )
    ? "Professional team working in a modern office"
    : /(restaurant|menu|reservation|chef|cafe|dining|food)/i.test(prompt)
      ? "Warm restaurant dining room"
      : /(staging|interior|home|real estate|realtor|property|decor)/i.test(
            prompt,
          )
        ? "Beautiful staged living room interior"
        : /(wedding|photography|photographer|bridal|couple|portrait)/i.test(
              prompt,
            )
          ? "Elegant wedding photography moment"
          : /(portfolio|designer|brand|creative|studio)/i.test(prompt)
            ? "Creative studio workspace"
            : "Modern technology team workspace";

  const imageCard = `
        <div className="mt-10 overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-200/70 ring-1 ring-black/5 lg:mt-0">
          <img
            src="${imageUrl}"
            alt="${altText}"
            className="h-80 w-full object-cover sm:h-96 lg:h-full"
            loading="lazy"
          />
        </div>`;

  if (/<section\b[^>]*>/i.test(code)) {
    return code.replace(/(<section\b[^>]*>)/i, `$1${imageCard}`);
  }

  if (/<main\b[^>]*>/i.test(code)) {
    return code.replace(/(<main\b[^>]*>)/i, `$1${imageCard}`);
  }

  return code.replace(/(<div\b[^>]*>)/i, `$1${imageCard}`);
}
