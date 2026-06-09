import { getCtaBlock, ctaCss } from "./blocks/ctaBlock.js";
import { getContactBlock, contactCss } from "./blocks/contactBlock.js";
import { getFaqBlock, faqCss } from "./blocks/faqBlock.js";
import { getGalleryBlock, galleryCss } from "./blocks/galleryBlock.js";
import { getPricingBlock, pricingCss } from "./blocks/pricingBlock.js";
import { getStatsBlock, statsCss } from "./blocks/statsBlock.js";
import { getTestimonialBlock, testimonialCss } from "./blocks/testimonialBlock.js";
import {
  appendCssIfMissing,
  insertSectionIntoPage,
  removeSectionFromPage,
} from "./editDomHelpers.js";

function hasPricingIntent(editPlan = {}) {
  const text = `${editPlan.target || ""} ${editPlan.action || ""} ${editPlan.normalizedInstruction || ""}`.toLowerCase();
  return (
    text.includes("pricing") ||
    text.includes("packages") ||
    text.includes("prices") ||
    text.includes("price")
  );
}

function findFunctionBlock(code = "", names = []) {
  for (const name of names) {
    const start = code.search(new RegExp(`function\\s+${name}\\s*\\(`));
    if (start < 0) continue;

    const paramsStart = code.indexOf("(", start);
    let parenDepth = 0;
    let paramsEnd = -1;

    for (let index = paramsStart; index < code.length; index += 1) {
      if (code[index] === "(") parenDepth += 1;
      if (code[index] === ")") parenDepth -= 1;
      if (parenDepth === 0) {
        paramsEnd = index;
        break;
      }
    }

    const braceStart = code.indexOf("{", paramsEnd);
    if (braceStart < 0) continue;

    let depth = 0;
    for (let index = braceStart; index < code.length; index += 1) {
      if (code[index] === "{") depth += 1;
      if (code[index] === "}") depth -= 1;
      if (depth === 0) {
        return {
          name,
          start,
          end: index + 1,
          content: code.slice(start, index + 1),
        };
      }
    }
  }

  return null;
}

function getCategory(editPlan = {}) {
  return String(editPlan.category || editPlan.websiteType || "").toLowerCase();
}

function getPackageContent(editPlan = {}) {
  const category = getCategory(editPlan);

  if (category.includes("home_staging") || category.includes("staging")) {
    return {
      eyebrow: "Seller-ready packages",
      heading: "Choose the staging support that fits the listing",
      intro:
        "Clear packages help sellers, realtors, and developers move from consultation to market-ready rooms with confidence.",
      plans: [
        {
          name: "Essential Styling",
          price: "From $1,800",
          description: "For occupied homes that need refined styling before photography.",
          features: ["Room-by-room styling plan", "Art and accessory refresh", "Photo-ready final walkthrough"],
          cta: "Start Essential",
        },
        {
          name: "Signature Staging",
          price: "From $4,200",
          description: "For vacant or priority listings that need a complete buyer-ready presentation.",
          features: ["Furniture and decor installation", "Listing-day styling support", "Realtor-ready marketing notes"],
          cta: "Choose Signature",
          featured: true,
        },
        {
          name: "Estate Presentation",
          price: "Custom",
          description: "For luxury homes, estates, and multi-room transformations with a concierge process.",
          features: ["Full-home creative direction", "Premium furnishing plan", "White-glove install and removal"],
          cta: "Plan Estate",
        },
      ],
    };
  }

  if (category.includes("staffing")) {
    return {
      eyebrow: "Flexible hiring packages",
      heading: "Staffing support that scales with your hiring goals",
      intro:
        "Give employers a clear path from urgent coverage to long-term workforce planning with packages built around speed, fit, and retention.",
      plans: [
        {
          name: "Starter Hiring",
          price: "From $899",
          description: "For urgent roles, seasonal support, or a focused shortlist.",
          features: ["Intake call and role profile", "Qualified candidate shortlist", "Basic onboarding guidance"],
          cta: "Request Staff",
        },
        {
          name: "Growth Staffing",
          price: "From $2,400",
          description: "For teams filling multiple roles across departments or locations.",
          features: ["Multi-role recruiting plan", "Interview coordination", "Retention check-ins"],
          cta: "Build My Team",
          featured: true,
        },
        {
          name: "Premium Workforce",
          price: "Custom",
          description: "For ongoing hiring partnerships with workforce strategy and dedicated support.",
          features: ["Dedicated staffing partner", "Workforce planning", "Priority replacement support"],
          cta: "Talk to an Expert",
        },
      ],
    };
  }

  return {
    eyebrow: "Customer-ready packages",
    heading: "Simple packages with clear value at every level",
    intro:
      "Help customers choose with confidence using clearer benefits, stronger CTAs, and a more polished buying experience.",
    plans: [
      {
        name: "Starter",
        price: "From $999",
        description: "For focused launches and smaller teams.",
        features: ["Core setup", "Focused recommendations", "Launch-ready support"],
        cta: "Start with Starter",
      },
      {
        name: "Growth",
        price: "From $2,499",
        description: "For growing brands that need a more polished service experience.",
        features: ["Expanded strategy", "Premium content polish", "Conversion-focused improvements"],
        cta: "Choose Growth",
        featured: true,
      },
      {
        name: "Premium",
        price: "Custom",
        description: "For full-service teams that want strategy, design, and ongoing support.",
        features: ["Complete service system", "Priority support", "Ongoing optimization"],
        cta: "Plan Premium",
      },
    ],
  };
}

function getPricingMarkup() {
  return `      <section className="pricing-section" data-edit-id="pricing-section">
        <div className="section-intro">
          <p className="eyebrow">Pricing</p>
          <h2>Packages built for clear next steps</h2>
          <p>Choose a simple starting point, then shape the scope around your goals, timeline, and level of support.</p>
        </div>
        <div className="pricing-grid">
          {[
            {
              name: "Starter",
              price: "From $999",
              description: "For focused launches and smaller teams.",
              features: ["Focused service setup", "Core messaging refresh", "One-page experience polish"],
              cta: "Start with Starter",
            },
            {
              name: "Growth",
              price: "From $2,499",
              description: "For growing brands that need a polished service experience.",
              features: ["Expanded service strategy", "Conversion-focused sections", "Premium content and CTA polish"],
              cta: "Choose Growth",
              featured: true,
            },
            {
              name: "Premium",
              price: "Custom",
              description: "For full-service teams that want strategy, design, and ongoing support.",
              features: ["Complete service system", "Priority creative direction", "Ongoing optimization support"],
              cta: "Plan Premium",
            },
          ].map((plan) => (
            <article key={plan.name} className={"pricing-card" + (plan.featured ? " featured" : "")}>
              <div>
                <p className="eyebrow">{plan.name}</p>
                <strong className="pricing-price">{plan.price}</strong>
                <p>{plan.description}</p>
              </div>
              <ul className="pricing-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button className="pricing-cta" type="button">{plan.cta}</button>
            </article>
          ))}
        </div>
      </section>`;
}

function getPremiumPackagesPage(editPlan = {}) {
  const content = getPackageContent(editPlan);
  const plans = JSON.stringify(content.plans, null, 10)
    .replace(/"([^"]+)":/g, "$1:")
    .replace(/"([^"]*)"/g, '"$1"');

  return `function PackagesPage() {
  const packages = ${plans};

  return (
    <main className="page-shell packages-page" data-edit-id="pricing-section">
      <section className="packages-hero">
        <p className="eyebrow">${content.eyebrow}</p>
        <h1>${content.heading}</h1>
        <p>${content.intro}</p>
      </section>

      <section className="package-grid" aria-label="Package options">
        {packages.map((plan) => (
          <article key={plan.name} className={"package-card" + (plan.featured ? " featured" : "")}>
            {plan.featured && <span className="package-badge">Best value</span>}
            <div>
              <h2>{plan.name}</h2>
              <p>{plan.description}</p>
              <strong className="package-price">{plan.price}</strong>
            </div>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button type="button">{plan.cta}</button>
          </article>
        ))}
      </section>

      <section className="package-trust-note">
        <p>Every package starts with a focused consultation so the final scope fits the customer, timeline, and goals.</p>
      </section>
    </main>
  );
}`;
}

function ensurePackagesCss(cssCode = "") {
  if (/\.packages-page\b/.test(cssCode) && /\.package-card\b/.test(cssCode)) {
    return cssCode;
  }

  return `${cssCode}

.packages-page {
  padding: 5rem 0;
}

.packages-hero {
  max-width: 760px;
  margin-bottom: 3rem;
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}

.package-card {
  position: relative;
  padding: 2rem;
  border-radius: 1.75rem;
  background: rgba(255,255,255,0.82);
  border: 1px solid rgba(17,24,39,0.08);
  box-shadow: 0 24px 70px rgba(17,24,39,0.08);
}

.package-card.featured {
  background: #111827;
  color: #fff;
  transform: translateY(-0.5rem);
}

.package-badge {
  display: inline-flex;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
  background: rgba(124, 58, 237, 0.12);
  color: #7c3aed;
}

.package-price {
  display: block;
  font-size: 2rem;
  font-weight: 900;
  margin: 1rem 0;
}

.package-card ul {
  margin: 1.25rem 0;
  padding-left: 1.2rem;
}

.package-card li {
  margin: 0.6rem 0;
}

.package-card button {
  width: 100%;
  border: 0;
  border-radius: 999px;
  padding: 0.95rem 1.2rem;
  font-weight: 800;
  cursor: pointer;
}

.package-card.featured button {
  background: #ffffff;
  color: #111827;
}

.package-trust-note {
  margin-top: 2rem;
  max-width: 760px;
  color: var(--muted, #667085);
}

@media (max-width: 900px) {
  .package-grid {
    grid-template-columns: 1fr;
  }

  .package-card.featured {
    transform: none;
  }
}`;
}

function removePricingFromServicesPage(appCode = "") {
  const block = findFunctionBlock(appCode, [
    "ServicesPage",
    "Services",
    "ServicePage",
  ]);

  if (!block) {
    return { changed: false, appCode, error: "Could not find the Services page." };
  }

  let updatedBlock = block.content;
  updatedBlock = updatedBlock.replace(
    /\s*<section\b[^>]*(?:data-edit-id=["']pricing-section["']|className=["'][^"']*pricing-section[^"']*["'])[^>]*>[\s\S]*?<\/section>/gi,
    "",
  );
  updatedBlock = updatedBlock.replace(
    /\s*<section\b[^>]*>[\s\S]*?(?:<h[1-3][^>]*>\s*(?:Pricing|Packages|Package options)\s*<\/h[1-3]>|pricing-grid|pricing-card)[\s\S]*?<\/section>/gi,
    "",
  );

  if (updatedBlock === block.content) {
    return { changed: true, appCode, message: "No pricing section was found on the Services page." };
  }

  return {
    changed: true,
    appCode: `${appCode.slice(0, block.start)}${updatedBlock}${appCode.slice(block.end)}`,
    message: "Pricing removed from Services page.",
  };
}

function improvePackagesPage(appCode = "", cssCode = "", editPlan = {}) {
  const block = findFunctionBlock(appCode, [
    "PackagesPage",
    "PricingPage",
    "PackagePage",
  ]);

  if (!block) {
    return {
      changed: false,
      appCode,
      cssCode,
      error: "Could not find the Packages page.",
    };
  }

  const updatedBlock = getPremiumPackagesPage(editPlan);

  return {
    changed: true,
    appCode: `${appCode.slice(0, block.start)}${updatedBlock}${appCode.slice(block.end)}`,
    cssCode: ensurePackagesCss(cssCode),
    message: "Packages page improved.",
    requiredTerms: getPackageContent(editPlan).plans.map((plan) => plan.name),
  };
}

function getLocalBlock(action = {}, editPlan = {}) {
  const section = String(action.targetSection || "").toLowerCase();
  const category = getCategory(editPlan);

  if (section === "pricing") {
    return {
      sectionCode: getPricingBlock({ category }),
      cssBlock: pricingCss,
      marker: "/* Nexus pricing block */",
      defaultPage: action.targetPage || "home",
      message: "Pricing block added.",
    };
  }

  if (section === "faq") {
    return {
      sectionCode: getFaqBlock({ category }),
      cssBlock: faqCss,
      marker: "/* Nexus FAQ block */",
      defaultPage: action.targetPage || "home",
      message: "FAQ section added.",
    };
  }

  if (section === "contact") {
    return {
      sectionCode: getContactBlock({ category }),
      cssBlock: contactCss,
      marker: "/* Nexus contact block */",
      defaultPage: action.targetPage || "contact",
      message: "Contact form added.",
    };
  }

  if (section === "gallery") {
    return {
      sectionCode: getGalleryBlock({ category }),
      cssBlock: galleryCss,
      marker: "/* Nexus gallery block */",
      defaultPage: action.targetPage || "home",
      message: "Gallery section added.",
    };
  }

  if (section === "testimonials") {
    return {
      sectionCode: getTestimonialBlock({ category }),
      cssBlock: testimonialCss,
      marker: "/* Nexus testimonial block */",
      defaultPage: action.targetPage || "home",
      message: "Testimonials section added.",
    };
  }

  if (section === "stats") {
    return {
      sectionCode: getStatsBlock({ category }),
      cssBlock: statsCss,
      marker: "/* Nexus stats block */",
      defaultPage: action.targetPage || "home",
      message: "Stats section added.",
    };
  }

  if (section === "cta") {
    return {
      sectionCode: getCtaBlock({ category }),
      cssBlock: ctaCss,
      marker: "/* Nexus CTA block */",
      defaultPage: action.targetPage || "home",
      message: "CTA section added.",
    };
  }

  return null;
}

function getSectionId(section = "") {
  const normalized = String(section || "").toLowerCase();
  const ids = {
    pricing: "pricing-section",
    faq: "faq-section",
    testimonials: "testimonials-section",
    testimonial: "testimonials-section",
    contact: "contact-section",
    gallery: "portfolio-section",
    cta: "cta-section",
    stats: "stats-section",
  };

  return ids[normalized] || `${normalized}-section`;
}

function applyStyleAction(appCode = "", cssCode = "", action = {}) {
  const section = String(action.targetSection || "").toLowerCase();
  const instruction = String(action.normalizedInstruction || "").toLowerCase();
  let nextCss = cssCode;

  if (section.includes("color palette")) {
    const wantsGold = instruction.includes("gold");
    const primary = instruction.includes("black") ? "#111827" : "#2563eb";
    const accent = wantsGold ? "#b88a2e" : "#2563eb";
    nextCss = `${nextCss.trimEnd()}

/* Nexus palette edit */
:root {
  --ink: ${primary};
  --primary-color: ${primary};
  --accent: ${accent};
  --accent-color: ${accent};
}

.primary-button,
.pricing-cta,
.contact-form button {
  background: ${primary} !important;
  color: #ffffff !important;
}
`;
    return { changed: true, appCode, cssCode: nextCss, message: "Color palette updated." };
  }

  if (section.includes("mobile")) {
    nextCss = appendCssIfMissing(
      nextCss,
      `/* Nexus mobile polish */
@media (max-width: 760px) {
  section,
  .page-shell {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .hero,
  .hero-grid,
  .split-hero,
  .package-grid,
  .pricing-grid {
    grid-template-columns: 1fr !important;
  }

  h1,
  .hero-title {
    max-width: 100%;
    overflow-wrap: anywhere;
  }
}`,
      "/* Nexus mobile polish */",
    );
    return { changed: true, appCode, cssCode: nextCss, message: "Mobile responsiveness improved." };
  }

  if (section.includes("spacing")) {
    nextCss = appendCssIfMissing(
      nextCss,
      `/* Nexus spacing polish */
.page-shell > section,
main > section {
  margin-bottom: clamp(2.5rem, 6vw, 5rem);
}

.hero,
.hero-section {
  padding-top: clamp(3rem, 7vw, 6rem);
  padding-bottom: clamp(3rem, 7vw, 6rem);
}`,
      "/* Nexus spacing polish */",
    );
    return { changed: true, appCode, cssCode: nextCss, message: "Homepage spacing improved." };
  }

  if (section.includes("premium")) {
    nextCss = appendCssIfMissing(
      nextCss,
      `/* Nexus premium polish */
h1,
h2,
.hero-title {
  letter-spacing: -0.045em;
}

.card,
.service-card,
.package-card,
.pricing-card,
.testimonial-card,
.faq-card {
  border-color: rgba(17, 24, 39, 0.08);
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.08);
}

button,
.primary-button,
.secondary-button {
  transition: transform 160ms ease, box-shadow 160ms ease;
}

button:hover,
.primary-button:hover,
.secondary-button:hover {
  transform: translateY(-1px);
}`,
      "/* Nexus premium polish */",
    );
    return { changed: true, appCode, cssCode: nextCss, message: "Premium visual polish applied." };
  }

  return { changed: false, appCode, cssCode, message: "" };
}

function applyCompoundEdit(appCode = "", cssCode = "", editPlan = {}) {
  if (!Array.isArray(editPlan.actions) || editPlan.actions.length === 0) {
    return { changed: false, appCode, cssCode, message: "" };
  }

  let nextAppCode = appCode;
  let nextCssCode = cssCode;
  const messages = [];
  const requiredTerms = [];

  for (const action of editPlan.actions) {
    if (action.type === "add_section") {
      const block = getLocalBlock(action, editPlan);
      if (!block) continue;
      const insertion = insertSectionIntoPage(nextAppCode, block.defaultPage, block.sectionCode, "end");
      if (!insertion.changed) {
        return { changed: false, failed: true, appCode, cssCode, message: insertion.error };
      }
      nextAppCode = insertion.appCode;
      nextCssCode = appendCssIfMissing(nextCssCode, block.cssBlock, block.marker);
      messages.push(block.message);
      continue;
    }

    if (action.type === "remove_section") {
      const sectionId = getSectionId(action.targetSection);
      const removal = removeSectionFromPage(nextAppCode, action.targetPage || "home", sectionId);
      if (!removal.changed) {
        return { changed: false, failed: true, appCode, cssCode, message: removal.error };
      }
      nextAppCode = removal.appCode;
      messages.push(`${action.targetSection} removed.`);
      continue;
    }

    if (action.type === "move_section" && action.targetSection === "pricing") {
      const removal = removePricingFromServicesPage(nextAppCode);
      nextAppCode = removal.appCode;
      const block = getLocalBlock({ ...action, type: "add_section", targetPage: "packages" }, editPlan);
      const insertion = insertSectionIntoPage(nextAppCode, "packages", block.sectionCode, "end");
      if (!insertion.changed) {
        const improved = improvePackagesPage(nextAppCode, nextCssCode, editPlan);
        nextAppCode = improved.appCode;
        nextCssCode = improved.cssCode;
      } else {
        nextAppCode = insertion.appCode;
        nextCssCode = appendCssIfMissing(nextCssCode, block.cssBlock, block.marker);
      }
      messages.push("Pricing moved to Packages page.");
      continue;
    }

    if (action.type === "update_style") {
      const styleEdit = applyStyleAction(nextAppCode, nextCssCode, action);
      if (styleEdit.changed) {
        nextAppCode = styleEdit.appCode;
        nextCssCode = styleEdit.cssCode;
        messages.push(styleEdit.message);
      }
      continue;
    }

    if (action.type === "remove_section" && action.targetPage === "services" && action.targetSection === "pricing") {
      const removal = removePricingFromServicesPage(nextAppCode);
      if (!removal.changed) {
        return { changed: false, failed: true, appCode, cssCode, message: removal.error };
      }
      nextAppCode = removal.appCode;
      messages.push(removal.message);
      continue;
    }

    if (action.type === "improve_page" && action.targetPage === "packages") {
      const improved = improvePackagesPage(nextAppCode, nextCssCode, editPlan);
      if (!improved.changed) {
        return { changed: false, failed: true, appCode, cssCode, message: improved.error };
      }
      nextAppCode = improved.appCode;
      nextCssCode = improved.cssCode;
      messages.push(improved.message);
      requiredTerms.push(...(improved.requiredTerms || []));
      continue;
    }
  }

  return {
    changed: nextAppCode !== appCode || nextCssCode !== cssCode,
    appCode: nextAppCode,
    cssCode: nextCssCode,
    message: messages.filter(Boolean).join(" "),
    requiredTerms,
  };
}

function insertPricingIntoComponent(component = "") {
  if (/pricing-section|Starter|Growth|Premium/.test(component)) {
    return component;
  }

  const pricingMarkup = getPricingMarkup();
  const lastSectionIndex = component.lastIndexOf("</section>");

  if (lastSectionIndex >= 0) {
    return `${component.slice(0, lastSectionIndex + "</section>".length)}

${pricingMarkup}${component.slice(lastSectionIndex + "</section>".length)}`;
  }

  const returnCloseIndex = component.lastIndexOf("</main>");
  if (returnCloseIndex >= 0) {
    return `${component.slice(0, returnCloseIndex)}
${pricingMarkup}
${component.slice(returnCloseIndex)}`;
  }

  return component;
}

function ensurePricingCss(cssCode = "") {
  if (/\.pricing-section\b/.test(cssCode)) {
    return cssCode;
  }

  return `${cssCode}

.pricing-section {
  padding: clamp(3rem, 7vw, 6rem) 0;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1rem, 2.5vw, 1.5rem);
  margin-top: clamp(1.5rem, 4vw, 3rem);
}

.pricing-card {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 1.5rem;
  background: color-mix(in srgb, var(--surface, #ffffff) 94%, var(--accent, #2563eb) 6%);
  padding: clamp(1.25rem, 3vw, 2rem);
  box-shadow: 0 20px 55px rgba(17, 24, 39, 0.08);
}

.pricing-card.featured {
  border-color: color-mix(in srgb, var(--accent, #2563eb) 42%, white);
  box-shadow: 0 26px 70px rgba(17, 24, 39, 0.13);
  transform: translateY(-0.35rem);
}

.pricing-price {
  display: block;
  margin: 0.75rem 0;
  color: var(--ink, #111827);
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1;
  letter-spacing: -0.05em;
}

.pricing-features {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pricing-features li {
  color: var(--muted, #667085);
  line-height: 1.55;
}

.pricing-features li::before {
  content: "✓";
  margin-right: 0.55rem;
  color: var(--accent, #2563eb);
  font-weight: 900;
}

.pricing-cta {
  border: 0;
  border-radius: 999px;
  background: var(--ink, #111827);
  color: white;
  padding: 0.9rem 1.2rem;
  font-weight: 800;
}

@media (max-width: 900px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .pricing-card.featured {
    transform: none;
  }
}`;
}

export function applySectionEdit(appCode = "", cssCode = "", editPlan = {}) {
  const compoundEdit = applyCompoundEdit(appCode, cssCode, editPlan);

  if (compoundEdit.changed || compoundEdit.failed) {
    return compoundEdit;
  }

  const target = String(editPlan.target || "").toLowerCase();
  const action = String(editPlan.action || "").toLowerCase();

  if (target.includes("packages") && /improve|attractive|better|customer/.test(action)) {
    return improvePackagesPage(appCode, cssCode, editPlan);
  }

  if (!hasPricingIntent(editPlan)) {
    return { changed: false, appCode, cssCode, message: "" };
  }

  if (!target.includes("services") && !target.includes("pricing")) {
    return { changed: false, appCode, cssCode, message: "" };
  }

  const block = findFunctionBlock(appCode, [
    "ServicesPage",
    "Services",
    "AudienceSplit",
    "ServicePage",
    "HomePage",
  ]);

  if (!block) {
    return { changed: false, appCode, cssCode, message: "" };
  }

  const updatedBlock = insertPricingIntoComponent(block.content);
  const updatedCss = ensurePricingCss(cssCode);

  if (updatedBlock === block.content) {
    return { changed: false, appCode, cssCode, message: "" };
  }

  return {
    changed: true,
    appCode: `${appCode.slice(0, block.start)}${updatedBlock}${appCode.slice(block.end)}`,
    cssCode: updatedCss,
    message: "Pricing added to Services page.",
    requiredTerms: ["Starter", "Growth", "Premium"],
  };
}
