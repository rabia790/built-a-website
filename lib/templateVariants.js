import { templateVariantMap as templateVariants } from "@/lib/selectTemplateVariant";

export { templateVariants };

export const variantImageSets = {
  staffing: [
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=85",
  ],
  home_staging: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=85",
  ],
  portfolio: [
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1400&q=85",
  ],
};

export function getVariantDesignDirection(category, variant) {
  const directions = {
    staffing_modern_split:
      "Modern split staffing agency layout: left hero copy and stats, right designed talent pipeline card stack, employer/candidate pathways, industries, process, testimonials, final CTA.",
    staffing_enterprise:
      "Enterprise staffing layout: trust-forward executive hero, compliance/reliability proof, operations dashboard cards, industry coverage, account team process, retention stats.",
    staffing_candidate_employer_dual:
      "Dual-audience staffing layout: balanced employer and candidate journeys, two clear CTAs, role matching cards, job seeker benefits, employer shortlist workflow.",
    staging_editorial_luxury:
      "Luxury editorial staging layout with oversized serif hero, layered interior image collage, warm neutrals, refined package cards, testimonials, and consultation CTA.",
    staging_portfolio_gallery:
      "Portfolio-first staging layout with gallery-led hero, before/after result cards, property stories, process timeline, and visual proof throughout.",
    staging_realtor_conversion:
      "Realtor-focused staging layout with listing launch workflow, agent packages, sales stats, fast-turn process, and trust badges for real estate teams.",
    staging_minimal_boutique:
      "Minimal boutique staging layout with calm whitespace, smaller image moments, quiet neutral palette, restrained typography, and consultation-focused flow.",
    portfolio_editorial:
      "Editorial creative portfolio with oversized typography, asymmetric hero collage, refined services, client strip, and elegant creative direction language.",
    portfolio_case_study_grid:
      "Case-study-first portfolio with project grid, deep result cards, challenge/solution/result storytelling, and premium inquiry funnel.",
    portfolio_minimal_creative:
      "Minimal creative portfolio with restrained palette, generous whitespace, typographic hero, curated project cards, and clean studio positioning.",
    saas_product_dashboard:
      "Product-dashboard SaaS layout with UI mockup hero, feature modules, metrics, workflow cards, pricing, integrations, testimonials.",
    saas_gradient_startup:
      "Modern startup SaaS layout with subtle gradients, benefit-led hero, feature cards, customer proof, pricing, and product-led CTA.",
    saas_enterprise_b2b:
      "Enterprise B2B SaaS layout with security/trust proof, ROI stats, solution pillars, workflow diagrams, case proof, demo CTA.",
    restaurant_editorial:
      "Editorial restaurant layout with atmosphere-led hero, chef story, menu highlights, gallery, reviews, and reservation CTA.",
    restaurant_menu_first:
      "Menu-first restaurant layout with dishes and categories upfront, specials, ordering/reservation CTAs, location, and reviews.",
    restaurant_reservation_luxury:
      "Luxury reservation-driven restaurant layout with refined dining imagery, private events, tasting menu, reviews, and booking CTA.",
    kids_playful_shop:
      "Playful premium kids shop layout with product/category cards, parent trust proof, colorful rounded visuals, and shop CTA.",
    kids_learning_adventure:
      "Learning adventure layout with story-led hero, education benefits, activity cards, parent proof, and discovery CTA.",
    kids_parent_friendly:
      "Parent-friendly kids brand layout with safety/trust first, age categories, testimonials, learning benefits, and calm playful visuals.",
    business_modern:
      "Modern business website layout with bold hero, proof stats, service cards, process, testimonials, and contact CTA.",
    business_premium_service:
      "Premium service business layout with refined hero, packages, trust proof, detailed service sections, and consultation CTA.",
    business_local_company:
      "Local company layout with service area, reviews, practical CTAs, team proof, gallery/cards, and contact-first flow.",
  };

  return directions[variant] || "Premium category-specific website variant with distinct layout rhythm and business-specific copy.";
}

export function getVariantImageSet(category) {
  return variantImageSets[category] || [];
}
