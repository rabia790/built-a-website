export function getStatsBlock() {
  return `      <section className="stats-section" data-edit-id="stats-section">
        {[
          ["92%", "customer satisfaction"],
          ["48 hr", "average response time"],
          ["3x", "clearer path to action"]
        ].map(([value, label]) => (
          <article className="stat-card" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>`;
}

export const statsCss = `
/* Nexus stats block */
.stats-section {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  padding: clamp(2rem, 5vw, 4rem) 0;
}

.stat-card {
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.78);
  padding: 1.5rem;
  box-shadow: 0 18px 45px rgba(17, 24, 39, 0.06);
}

.stat-card strong {
  display: block;
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1;
}

.stat-card span {
  color: var(--muted, #667085);
}

@media (max-width: 900px) {
  .stats-section {
    grid-template-columns: 1fr;
  }
}`;
