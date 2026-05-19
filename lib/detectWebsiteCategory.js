export function detectWebsiteCategory(prompt = "") {
  const text = String(prompt || "").toLowerCase();

  if (
    /(staging|home staging|real estate|luxury real estate|interiors|property sellers|realtor)/.test(
      text,
    )
  ) {
    return "home_staging";
  }

  if (/(staffing|recruitment|recruiting|hiring|talent|job|jobs|candidate|candidates|employment|workforce)/.test(text)) {
    return "staffing";
  }

  if (/(saas|software|ai tool|productivity|platform|dashboard|app|b2b|startup|tech)/.test(text)) {
    return "saas";
  }

  if (/(restaurant|menu|reservation|food|cafe|chef|dining|bistro|bar)/.test(text)) {
    return "restaurant";
  }

  if (
    /(portfolio|brand designer|designer|creative studio|branding|graphic designer|art director|visual identity|design studio)/.test(
      text,
    )
  ) {
    return "portfolio";
  }

  if (/(wedding|photographer|photography|bridal|bride|groom|couple)/.test(text)) {
    return "wedding";
  }

  if (/(kids|children|toys|learning|explorer|education|school|adventure|play)/.test(text)) {
    return "kids";
  }

  return "ai_generated";
}
