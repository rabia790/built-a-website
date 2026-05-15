export function detectWebsiteCategory(prompt = "") {
  const text = String(prompt || "").toLowerCase();

  if (
    /(staging|home staging|real estate|luxury real estate|interiors|property sellers|realtor)/.test(
      text,
    )
  ) {
    return "home_staging";
  }

  if (
    /(portfolio|brand designer|designer|creative studio|branding|graphic designer|art director|visual identity|design studio)/.test(
      text,
    )
  ) {
    return "portfolio";
  }

  return "ai_generated";
}
