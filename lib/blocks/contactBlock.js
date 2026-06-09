export function getContactBlock() {
  return `      <section className="contact-section" data-edit-id="contact-section">
        <div className="contact-panel">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>Tell us what you are building next</h2>
            <p>Share a few details and we will recommend the clearest next step.</p>
          </div>
          <form className="contact-form">
            <input aria-label="Name" placeholder="Name" />
            <input aria-label="Email" placeholder="Email" />
            <textarea aria-label="Project details" placeholder="What do you need help with?" />
            <button type="button">Send inquiry</button>
          </form>
        </div>
      </section>`;
}

export const contactCss = `
/* Nexus contact block */
.contact-section {
  padding: clamp(3rem, 7vw, 6rem) 0;
}

.contact-panel {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 2rem;
  border-radius: 2rem;
  background: rgba(255, 255, 255, 0.82);
  padding: clamp(1.5rem, 4vw, 3rem);
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.08);
}

.contact-form {
  display: grid;
  gap: 0.85rem;
}

.contact-form input,
.contact-form textarea {
  width: 100%;
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 1rem;
  padding: 0.95rem 1rem;
  font: inherit;
}

.contact-form textarea {
  min-height: 130px;
  resize: vertical;
}

.contact-form button {
  border: 0;
  border-radius: 999px;
  background: var(--ink, #111827);
  color: white;
  padding: 0.95rem 1.2rem;
  font-weight: 800;
}

@media (max-width: 900px) {
  .contact-panel {
    grid-template-columns: 1fr;
  }
}`;
