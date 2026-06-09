export function getTestimonialBlock() {
  return `      <section className="testimonial-section" data-edit-id="testimonials-section">
        <div className="section-intro">
          <p className="eyebrow">Customer proof</p>
          <h2>Trusted by people who care about the details</h2>
        </div>
        <div className="testimonial-grid">
          {[
            ["The process felt polished, clear, and genuinely helpful from the first call.", "Maya R."],
            ["They made the offer easy to understand and the final result looked premium.", "Daniel K."],
            ["Exactly the kind of calm, professional experience our team needed.", "Ari S."]
          ].map(([quote, name]) => (
            <blockquote className="testimonial-card" key={name}>
              <p>{quote}</p>
              <cite>{name}</cite>
            </blockquote>
          ))}
        </div>
      </section>`;
}

export const testimonialCss = `
/* Nexus testimonial block */
.testimonial-section {
  padding: clamp(3rem, 7vw, 6rem) 0;
}

.testimonial-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.testimonial-card {
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.82);
  padding: 1.5rem;
  box-shadow: 0 18px 45px rgba(17, 24, 39, 0.06);
}

.testimonial-card cite {
  display: block;
  margin-top: 1rem;
  font-weight: 800;
  font-style: normal;
}

@media (max-width: 900px) {
  .testimonial-grid {
    grid-template-columns: 1fr;
  }
}`;
