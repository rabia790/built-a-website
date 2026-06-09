export function getGalleryBlock({ category = "" } = {}) {
  const type = String(category || "").toLowerCase();
  const images = type.includes("staging")
    ? [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      ]
    : [
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1200&q=80",
      ];

  return `      <section className="gallery-section" data-edit-id="portfolio-section">
        <div className="section-intro">
          <p className="eyebrow">Gallery</p>
          <h2>A stronger visual story for visitors</h2>
          <p>Curated imagery gives the page more proof, depth, and customer confidence.</p>
        </div>
        <div className="gallery-grid">
          {${JSON.stringify(images)}.map((image, index) => (
            <figure className="gallery-card" key={image}>
              <img src={image} alt={"Gallery visual " + (index + 1)} loading="lazy" />
            </figure>
          ))}
        </div>
      </section>`;
}

export const galleryCss = `
/* Nexus gallery block */
.gallery-section {
  padding: clamp(3rem, 7vw, 6rem) 0;
}

.gallery-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr;
  gap: 1rem;
  margin-top: 2rem;
}

.gallery-card {
  min-height: 280px;
  overflow: hidden;
  border-radius: 1.5rem;
  box-shadow: 0 24px 65px rgba(17, 24, 39, 0.1);
}

.gallery-card img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

@media (max-width: 900px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}`;
