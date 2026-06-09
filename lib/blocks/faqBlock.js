export function getFaqBlock() {
  return `      <section className="faq-section" data-edit-id="faq-section">
        <div className="section-intro">
          <p className="eyebrow">FAQ</p>
          <h2>Questions customers ask before getting started</h2>
          <p>Clear answers remove friction and help visitors feel confident taking the next step.</p>
        </div>
        <div className="faq-grid">
          {[
            ["How quickly can we begin?", "Most projects start with a short discovery call, then move into a clear plan and timeline."],
            ["Can the scope be customized?", "Yes. The final scope is shaped around your goals, budget, timeline, and level of support."],
            ["What happens after I inquire?", "You will receive next steps, recommended options, and a simple path to move forward."]
          ].map(([question, answer]) => (
            <article className="faq-card" key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </section>`;
}

export const faqCss = `
/* Nexus FAQ block */
.faq-section {
  padding: clamp(3rem, 7vw, 6rem) 0;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.faq-card {
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.78);
  padding: 1.5rem;
  box-shadow: 0 18px 45px rgba(17, 24, 39, 0.06);
}

@media (max-width: 900px) {
  .faq-grid {
    grid-template-columns: 1fr;
  }
}`;
