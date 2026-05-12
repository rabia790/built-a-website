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

  return imageMap.technology;
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
