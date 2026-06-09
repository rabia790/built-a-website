export function getPricingPlans(category = "") {
  const type = String(category || "").toLowerCase();

  if (type.includes("home_staging") || type.includes("staging")) {
    return [
      ["Essential Styling", "From $1,800", "For occupied listings that need a refined, photo-ready finish."],
      ["Signature Staging", "From $4,200", "For vacant homes that need full buyer-ready presentation.", true],
      ["Estate Presentation", "Custom", "For luxury properties, estates, and multi-room transformations."],
    ];
  }

  if (type.includes("staffing")) {
    return [
      ["Starter Hiring", "From $899", "For urgent roles, seasonal support, and focused shortlists."],
      ["Growth Staffing", "From $2,400", "For growing teams filling multiple roles quickly.", true],
      ["Premium Workforce", "Custom", "For ongoing hiring partnerships and workforce planning."],
    ];
  }

  if (type.includes("portfolio")) {
    return [
      ["Brand Foundation", "From $2,500", "For founders who need strategy, identity, and launch essentials."],
      ["Signature Identity", "From $6,500", "For brands ready for a complete visual system.", true],
      ["Creative Direction", "Custom", "For campaigns, art direction, and ongoing creative partnership."],
    ];
  }

  if (type.includes("saas")) {
    return [
      ["Starter", "$29/mo", "For small teams validating a focused workflow."],
      ["Pro", "$79/mo", "For growing teams that need automation and reporting.", true],
      ["Enterprise", "Custom", "For organizations with security, onboarding, and scale needs."],
    ];
  }

  if (type.includes("restaurant")) {
    return [
      ["Tasting", "From $85", "A curated dining experience for intimate evenings."],
      ["Private Dining", "From $1,200", "A hosted experience for gatherings and celebrations.", true],
      ["Events", "Custom", "Full-service menus, staffing, and planning for larger occasions."],
    ];
  }

  return [
    ["Starter", "From $999", "For focused launches and smaller teams."],
    ["Growth", "From $2,499", "For growing brands that need a polished service experience.", true],
    ["Premium", "Custom", "For full-service teams that want strategy, design, and support."],
  ];
}

export function getPricingBlock({ category = "", sectionClass = "pricing-section" } = {}) {
  const plans = getPricingPlans(category);

  return `      <section className="${sectionClass}" data-edit-id="pricing-section">
        <div className="section-intro">
          <p className="eyebrow">Packages</p>
          <h2>Clear options for the next step</h2>
          <p>Choose the level of support that fits the timeline, goals, and customer experience.</p>
        </div>
        <div className="pricing-grid">
          {${JSON.stringify(plans)}.map(([name, price, description, featured]) => (
            <article key={name} className={"pricing-card" + (featured ? " featured" : "")}>
              {featured && <span className="package-badge">Best value</span>}
              <h3>{name}</h3>
              <strong className="pricing-price">{price}</strong>
              <p>{description}</p>
              <ul className="pricing-features">
                <li>Focused strategy and setup</li>
                <li>Premium customer-facing polish</li>
                <li>Clear next-step guidance</li>
              </ul>
              <button className="pricing-cta" type="button">Choose {name}</button>
            </article>
          ))}
        </div>
      </section>`;
}

export const pricingCss = `
/* Nexus pricing block */
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
  gap: 1.25rem;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.86);
  padding: clamp(1.25rem, 3vw, 2rem);
  box-shadow: 0 20px 55px rgba(17, 24, 39, 0.08);
}

.pricing-card.featured {
  box-shadow: 0 26px 70px rgba(17, 24, 39, 0.13);
  transform: translateY(-0.35rem);
}

.pricing-price {
  display: block;
  color: var(--ink, #111827);
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1;
}

.pricing-features {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
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
