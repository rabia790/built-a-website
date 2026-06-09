export function getCtaBlock() {
  return `      <section className="cta-section" data-edit-id="cta-section">
        <div>
          <p className="eyebrow">Ready when you are</p>
          <h2>Give customers one clear reason to take the next step</h2>
          <p>A focused CTA section helps visitors move from interest to action without adding clutter.</p>
        </div>
        <button type="button">Book a consultation</button>
      </section>`;
}

export const ctaCss = `
/* Nexus CTA block */
.cta-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin: clamp(3rem, 7vw, 6rem) 0;
  border-radius: 2rem;
  background: #111827;
  color: white;
  padding: clamp(1.5rem, 4vw, 3rem);
}

.cta-section p {
  color: rgba(255, 255, 255, 0.72);
}

.cta-section button {
  border: 0;
  border-radius: 999px;
  background: white;
  color: #111827;
  padding: 1rem 1.25rem;
  font-weight: 900;
}

@media (max-width: 900px) {
  .cta-section {
    display: grid;
  }
}`;
