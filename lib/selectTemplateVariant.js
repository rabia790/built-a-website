export const templateVariantMap = {
  staffing: [
    "staffing_modern_split",
    "staffing_enterprise",
    "staffing_candidate_employer_dual",
  ],
  home_staging: [
    "staging_editorial_luxury",
    "staging_portfolio_gallery",
    "staging_realtor_conversion",
    "staging_minimal_boutique",
  ],
  portfolio: [
    "portfolio_editorial",
    "portfolio_case_study_grid",
    "portfolio_minimal_creative",
  ],
  saas: [
    "saas_product_dashboard",
    "saas_gradient_startup",
    "saas_enterprise_b2b",
  ],
  restaurant: [
    "restaurant_editorial",
    "restaurant_menu_first",
    "restaurant_reservation_luxury",
  ],
  kids: [
    "kids_playful_shop",
    "kids_learning_adventure",
    "kids_parent_friendly",
  ],
  generic_business: [
    "business_modern",
    "business_premium_service",
    "business_local_company",
  ],
};

function hashPrompt(text) {
  let hash = 0;
  const value = String(text || "");

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function selectTemplateVariant(
  category,
  prompt = "",
  forcedVariant = "",
  designSeed = "",
) {
  const list = templateVariantMap[category] || templateVariantMap.generic_business;
  const lower = String(prompt || "").toLowerCase();

  if (forcedVariant && list.includes(forcedVariant)) {
    return forcedVariant;
  }

  if (category === "home_staging") {
    if (/portfolio|gallery|before[-\s]?after|case stud|visual proof/.test(lower)) {
      return "staging_portfolio_gallery";
    }

    if (/realtor|lead|leads|seller|sellers|conversion|agent|listing/.test(lower)) {
      return "staging_realtor_conversion";
    }

    if (/minimal|boutique|simple|refined|calm|quiet/.test(lower)) {
      return "staging_minimal_boutique";
    }

    if (/luxury|premium|editorial|high[-\s]?end/.test(lower)) {
      return "staging_editorial_luxury";
    }
  }

  if (
    lower.includes("luxury") ||
    lower.includes("premium") ||
    lower.includes("refined")
  ) {
    return (
      list.find(
        (variant) =>
          variant.includes("luxury") ||
          variant.includes("editorial") ||
          variant.includes("premium"),
      ) || list[0]
    );
  }

  if (
    lower.includes("enterprise") ||
    lower.includes("corporate") ||
    lower.includes("b2b")
  ) {
    return list.find((variant) => variant.includes("enterprise")) || list[0];
  }

  if (lower.includes("portfolio") || lower.includes("case stud")) {
    return (
      list.find(
        (variant) =>
          variant.includes("portfolio") || variant.includes("case"),
      ) || list[0]
    );
  }

  if (
    lower.includes("candidate") ||
    lower.includes("candidates") ||
    lower.includes("jobs") ||
    lower.includes("job seeker") ||
    lower.includes("find work")
  ) {
    return (
      list.find(
        (variant) =>
          variant.includes("candidate") || variant.includes("dual"),
      ) || list[0]
    );
  }

  const index = hashPrompt(`${prompt}:${designSeed}`) % list.length;
  return list[index];
}
