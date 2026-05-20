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
  if (!hasPricingIntent(editPlan)) {
    return { changed: false, appCode, cssCode, message: "" };
  }

  const target = String(editPlan.target || "").toLowerCase();
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
  };
}
