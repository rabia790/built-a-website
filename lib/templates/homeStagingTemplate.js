const images = {
  hero:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
  lounge:
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85",
  kitchen:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85",
  bedroom:
    "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=85",
};

function escapeText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

export function buildHomeStagingWebsite({
  brandName = "Eleve Staging Co.",
  headline = "Stage homes that sell faster, photograph better, and feel unforgettable",
  subheadline = "Luxury home staging for real estate sellers, agents, and developers who want every listing to feel move-in ready.",
} = {}) {
  const safeBrand = escapeText(brandName);
  const safeHeadline = escapeText(headline);
  const safeSubheadline = escapeText(subheadline);

  const appCode = `const brandName = "${safeBrand}";
const heroHeadline = "${safeHeadline}";
const heroSubheadline = "${safeSubheadline}";

const navItems = [
  ["home", "Home"],
  ["services", "Services"],
  ["portfolio", "Portfolio"],
  ["process", "Process"],
  ["packages", "Packages"],
  ["about", "About"],
  ["contact", "Contact"],
];

const imageSet = {
  hero: "${images.hero}",
  lounge: "${images.lounge}",
  kitchen: "${images.kitchen}",
  bedroom: "${images.bedroom}",
};

function Navbar({ currentPage, setCurrentPage }) {
  return (
    <header className="site-header">
      <button className="brand-mark" onClick={() => setCurrentPage("home")}>
        <span className="brand-symbol">E</span>
        <span>{brandName}</span>
      </button>
      <nav className="nav-links" aria-label="Primary navigation">
        {navItems.map(([id, label]) => (
          <button
            key={id}
            className={currentPage === id ? "nav-link active" : "nav-link"}
            onClick={() => setCurrentPage(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <button className="nav-cta" onClick={() => setCurrentPage("contact")}>
        Book Consultation
      </button>
    </header>
  );
}

function Hero({ setCurrentPage }) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Luxury home staging for elevated listings</p>
        <h1>{heroHeadline}</h1>
        <p className="hero-subheadline">{heroSubheadline}</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => setCurrentPage("contact")}>
            Book a Consultation
          </button>
          <button className="secondary-button" onClick={() => setCurrentPage("portfolio")}>
            View Portfolio
          </button>
        </div>
        <div className="hero-stats" aria-label="Home staging results">
          {[
            ["180+", "Homes Staged"],
            ["27%", "Faster Sales"],
            ["$2.4M+", "Added Value"],
          ].map(([value, label]) => (
            <div className="stat-card" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="hero-collage" aria-label="Luxury staged interiors">
        <img src={imageSet.hero} alt="Sunlit luxury staged living room" className="hero-image hero-image-large" loading="lazy" />
        <img src={imageSet.lounge} alt="Elegant neutral lounge staged for sale" className="hero-image hero-image-small top" loading="lazy" />
        <img src={imageSet.kitchen} alt="Refined kitchen and dining styling" className="hero-image hero-image-small bottom" loading="lazy" />
        <div className="collage-note">
          <span>Editorial styling</span>
          <strong>Photography-ready in days</strong>
        </div>
      </div>
    </section>
  );
}

function SectionIntro({ eyebrow, title, body }) {
  return (
    <div className="section-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}

const services = [
  ["Luxury Staging", "Full-home styling with elevated furniture, art, textiles, and accessories for premium listings."],
  ["Vacant Home Staging", "Transform empty rooms into memorable spaces buyers can emotionally understand and desire."],
  ["Occupied Home Styling", "Curate, edit, and enhance existing furnishings for a polished market-ready presentation."],
  ["Furniture Rental", "Access refined inventory scaled for condos, family homes, estates, and developer suites."],
  ["Realtor Packages", "Fast-turn staging systems for agents who need predictable timelines and listing-day polish."],
];

const portfolio = [
  ["Forest Hill Residence", imageSet.hero, "Sold 31% faster after a warm editorial refresh."],
  ["Yorkville Penthouse", imageSet.lounge, "Luxury furnishings helped anchor a $4.2M listing story."],
  ["Rosedale Family Home", imageSet.kitchen, "Received multiple offers in the first week on market."],
  ["King West Suite", imageSet.bedroom, "Compact layout styled to feel serene, spacious, and premium."],
  ["Lawrence Park Estate", imageSet.hero, "Full-property staging created a cohesive lifestyle narrative."],
  ["Summerhill Townhome", imageSet.lounge, "Neutral styling improved photography and buyer flow."],
];

const processSteps = [
  ["01", "Consultation", "We tour the property, review buyer profile, listing goals, timeline, and rooms with the highest return."],
  ["02", "Design Plan", "Your staging plan includes palette, furniture direction, focal moments, install scope, and logistics."],
  ["03", "Install & Styling", "Our team delivers, places, styles, edits, and finishes every room for a cohesive editorial feel."],
  ["04", "Photography-Ready Reveal", "We complete final details so the listing is ready for photography, showings, and launch."],
];

const packages = [
  ["Essential", "Focused rooms", "For condos and smaller listings that need elevated first impressions.", "$2,800+"],
  ["Signature", "Whole-home story", "Our most popular package for sellers and agents preparing premium family homes.", "$5,600+"],
  ["Estate", "White-glove staging", "Layered, high-touch staging for luxury properties, estates, and developer showcases.", "Custom"],
];

function ServicesPage() {
  return (
    <main className="page-shell">
      <SectionIntro
        eyebrow="Services"
        title="White-glove staging for listings that need to feel considered, not decorated."
        body="Each service is built around buyer psychology, photography, and the exact lifestyle your property should communicate."
      />
      <div className="service-grid">
        {services.map(([title, body]) => (
          <article className="luxury-card" key={title}>
            <span className="card-kicker">Staging</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

function PortfolioPage() {
  return (
    <main className="page-shell">
      <SectionIntro
        eyebrow="Portfolio"
        title="Before the offer, buyers need to feel the life waiting inside."
        body="A selection of recent transformations designed for photography, showings, and confident offers."
      />
      <div className="portfolio-grid">
        {portfolio.map(([title, image, result]) => (
          <article className="portfolio-card" key={title}>
            <img src={image} alt={title + " staged interior"} loading="lazy" />
            <div>
              <h3>{title}</h3>
              <p>{result}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function ProcessPage() {
  return (
    <main className="page-shell">
      <SectionIntro
        eyebrow="Process"
        title="A calm, precise staging process from first walk-through to listing launch."
        body="We keep timelines clear, decisions curated, and the final reveal aligned with your selling strategy."
      />
      <div className="timeline">
        {processSteps.map(([number, title, body]) => (
          <article className="timeline-item" key={title}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

function PackagesPage() {
  return (
    <main className="page-shell">
      <SectionIntro
        eyebrow="Packages"
        title="Tailored staging packages for every premium listing moment."
        body="Choose the level of support that matches the property, market position, and listing timeline."
      />
      <div className="package-grid">
        {packages.map(([name, label, body, price]) => (
          <article className="package-card" key={name}>
            <p className="eyebrow">{label}</p>
            <h3>{name}</h3>
            <p>{body}</p>
            <strong>{price}</strong>
            <button>Request Package</button>
          </article>
        ))}
      </div>
    </main>
  );
}

function AboutPage() {
  return (
    <main className="page-shell split-page">
      <div>
        <p className="eyebrow">About</p>
        <h2>Staging with the eye of an editor and the discipline of a listing strategist.</h2>
        <p>
          {brandName} was built for sellers, realtors, and developers who understand that premium homes need more than furniture. They need a story buyers can feel immediately.
        </p>
        <div className="values-grid">
          {["Editorial restraint", "Buyer psychology", "Listing-day reliability", "Warm luxury"].map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
      </div>
      <img src={imageSet.bedroom} alt="Serene staged bedroom with luxury details" loading="lazy" />
    </main>
  );
}

function ContactPage() {
  return (
    <main className="page-shell contact-layout">
      <div>
        <p className="eyebrow">Contact</p>
        <h2>Book a staging consultation for your next listing.</h2>
        <p>Serving luxury sellers, agents, investors, and developers across Toronto and surrounding premium markets.</p>
        <div className="contact-details">
          <span>hello@elevestaging.co</span>
          <span>Toronto, Ontario</span>
          <span>Consultations available this week</span>
        </div>
      </div>
      <form className="contact-form">
        <input placeholder="Name" />
        <input placeholder="Email" />
        <input placeholder="Property address" />
        <select>
          <option>Luxury staging</option>
          <option>Vacant home staging</option>
          <option>Occupied home styling</option>
          <option>Realtor package</option>
        </select>
        <textarea placeholder="Tell us about your listing timeline" />
        <button type="button">Book a Staging Consultation</button>
      </form>
    </main>
  );
}

function HomePage({ setCurrentPage }) {
  return (
    <main>
      <Hero setCurrentPage={setCurrentPage} />
      <section className="content-section">
        <SectionIntro
          eyebrow="Signature services"
          title="Every room is composed to elevate perceived value."
          body="From vacant homes to full estate presentations, our staging creates a visual language buyers remember."
        />
        <div className="service-grid three">
          {services.slice(0, 3).map(([title, body]) => (
            <article className="luxury-card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="content-section warm-panel">
        <SectionIntro
          eyebrow="Portfolio preview"
          title="A warmer, more memorable listing presence."
          body="Different properties require different emotional cues. We layer furniture, art, scale, light, and texture so each home feels complete."
        />
        <div className="portfolio-grid preview">
          {portfolio.slice(0, 3).map(([title, image, result]) => (
            <article className="portfolio-card" key={title}>
              <img src={image} alt={title + " staged interior"} loading="lazy" />
              <div>
                <h3>{title}</h3>
                <p>{result}</p>
              </div>
            </article>
          ))}
        </div>
        <button className="secondary-button centered" onClick={() => setCurrentPage("portfolio")}>
          Explore Portfolio
        </button>
      </section>
      <section className="content-section">
        <SectionIntro
          eyebrow="Our process"
          title="Designed for sellers who need confidence and speed."
          body="A clear timeline, elevated inventory, and meticulous styling make your listing launch feel controlled."
        />
        <div className="timeline compact">
          {processSteps.map(([number, title, body]) => (
            <article className="timeline-item" key={title}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="testimonial-section">
        <blockquote>
          "The staging changed how buyers moved through the home. It photographed beautifully, felt luxurious in person, and helped us sell above expectation."
        </blockquote>
        <p>Marina L., Luxury Realtor</p>
      </section>
      <section className="final-cta">
        <p className="eyebrow">Ready for a stronger listing launch?</p>
        <h2>Book a Staging Consultation</h2>
        <p>Bring warmth, scale, and premium buyer appeal to your next property.</p>
        <button className="primary-button" onClick={() => setCurrentPage("contact")}>
          Start the Conversation
        </button>
      </section>
    </main>
  );
}

function Footer({ setCurrentPage }) {
  return (
    <footer className="site-footer">
      <div>
        <strong>{brandName}</strong>
        <p>Luxury staging for memorable listings.</p>
      </div>
      <button onClick={() => setCurrentPage("contact")}>Book a Consultation</button>
    </footer>
  );
}

function App() {
  const [currentPage, setCurrentPage] = React.useState("home");

  const pages = {
    home: <HomePage setCurrentPage={setCurrentPage} />,
    services: <ServicesPage />,
    portfolio: <PortfolioPage />,
    process: <ProcessPage />,
    packages: <PackagesPage />,
    about: <AboutPage />,
    contact: <ContactPage />,
  };

  return (
    <div className="site-shell">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {pages[currentPage]}
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default App;`;

  const cssCode = `:root {
  --ivory: #f8f4ee;
  --beige: #eadfce;
  --taupe: #b99a72;
  --charcoal: #1f2933;
  --brown: #7c5f45;
  --white: #fffaf3;
  --line: rgba(31, 41, 51, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--ivory);
  color: var(--charcoal);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.site-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 0%, rgba(185, 154, 114, 0.22), transparent 28rem),
    linear-gradient(180deg, #fffaf3 0%, var(--ivory) 42%, #f2eadf 100%);
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 5vw;
  background: rgba(248, 244, 238, 0.88);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(18px);
}

.brand-mark,
.nav-link,
.nav-cta,
.site-footer button {
  border: 0;
  background: transparent;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  color: var(--charcoal);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.brand-symbol {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  background: var(--charcoal);
  color: var(--ivory);
  font-family: Georgia, serif;
  font-size: 1.2rem;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem;
}

.nav-link {
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  color: rgba(31, 41, 51, 0.68);
  font-size: 0.9rem;
}

.nav-link.active,
.nav-link:hover {
  background: rgba(185, 154, 114, 0.16);
  color: var(--charcoal);
}

.nav-cta,
.primary-button,
.contact-form button,
.package-card button {
  border: 0;
  border-radius: 999px;
  background: var(--charcoal);
  color: var(--ivory);
  padding: 0.9rem 1.35rem;
  font-weight: 700;
  box-shadow: 0 18px 35px rgba(31, 41, 51, 0.18);
}

.secondary-button {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 250, 243, 0.82);
  color: var(--charcoal);
  padding: 0.9rem 1.35rem;
  font-weight: 700;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
  gap: clamp(2rem, 5vw, 5.5rem);
  align-items: center;
  padding: clamp(4rem, 8vw, 8rem) 5vw clamp(3rem, 6vw, 6rem);
}

.eyebrow {
  margin: 0 0 0.9rem;
  color: var(--brown);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
  color: var(--charcoal);
}

h1,
h2 {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 500;
  letter-spacing: -0.055em;
}

h1 {
  max-width: 12ch;
  font-size: clamp(4rem, 8.8vw, 8.8rem);
  line-height: 0.88;
}

h2 {
  font-size: clamp(2.5rem, 5vw, 5.4rem);
  line-height: 0.95;
}

h3 {
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}

p {
  color: rgba(31, 41, 51, 0.72);
  line-height: 1.75;
}

.hero-subheadline {
  max-width: 40rem;
  margin: 1.65rem 0 0;
  font-size: clamp(1.1rem, 1.5vw, 1.35rem);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 2rem;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 2.2rem;
}

.stat-card,
.luxury-card,
.package-card,
.timeline-item,
.contact-form {
  border: 1px solid var(--line);
  border-radius: 1.6rem;
  background: rgba(255, 250, 243, 0.72);
  box-shadow: 0 24px 60px rgba(89, 68, 47, 0.1);
}

.stat-card {
  padding: 1rem;
}

.stat-card strong {
  display: block;
  font-family: Georgia, serif;
  font-size: 2rem;
}

.stat-card span {
  color: rgba(31, 41, 51, 0.58);
  font-size: 0.85rem;
}

.hero-collage {
  position: relative;
  min-height: 650px;
}

.hero-image {
  position: absolute;
  display: block;
  width: 100%;
  object-fit: cover;
  border: 10px solid rgba(255, 250, 243, 0.76);
  border-radius: 2rem;
  box-shadow: 0 35px 90px rgba(31, 41, 51, 0.2);
}

.hero-image-large {
  right: 8%;
  top: 4%;
  width: 72%;
  height: 78%;
}

.hero-image-small {
  width: 42%;
  height: 36%;
}

.hero-image-small.top {
  left: 0;
  top: 0;
}

.hero-image-small.bottom {
  right: 0;
  bottom: 0;
}

.collage-note {
  position: absolute;
  left: 6%;
  bottom: 13%;
  max-width: 15rem;
  padding: 1rem;
  border-radius: 1.25rem;
  background: rgba(31, 41, 51, 0.9);
  color: var(--ivory);
  box-shadow: 0 24px 60px rgba(31, 41, 51, 0.24);
}

.collage-note span,
.card-kicker {
  display: block;
  color: var(--taupe);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.content-section,
.page-shell {
  padding: clamp(4rem, 7vw, 7rem) 5vw;
}

.section-intro {
  max-width: 58rem;
  margin-bottom: 2.4rem;
}

.section-intro p:last-child {
  max-width: 44rem;
  font-size: 1.05rem;
}

.service-grid,
.package-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.service-grid:not(.three) {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.luxury-card,
.package-card {
  padding: 1.35rem;
}

.luxury-card p,
.package-card p,
.timeline-item p {
  margin-bottom: 0;
}

.warm-panel {
  margin: 0 5vw;
  padding-left: clamp(2rem, 5vw, 4rem);
  padding-right: clamp(2rem, 5vw, 4rem);
  border-radius: 2.5rem;
  background: linear-gradient(135deg, rgba(234, 223, 206, 0.78), rgba(255, 250, 243, 0.76));
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.portfolio-card {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 1.7rem;
  background: rgba(255, 250, 243, 0.84);
  box-shadow: 0 24px 65px rgba(89, 68, 47, 0.12);
}

.portfolio-card img,
.split-page img {
  display: block;
  width: 100%;
  height: 310px;
  object-fit: cover;
}

.portfolio-card div {
  padding: 1.15rem;
}

.centered {
  display: block;
  margin: 2rem auto 0;
}

.timeline {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.timeline-item {
  padding: 1.35rem;
}

.timeline-item span {
  display: inline-grid;
  place-items: center;
  width: 2.7rem;
  height: 2.7rem;
  margin-bottom: 1rem;
  border-radius: 999px;
  background: var(--beige);
  color: var(--brown);
  font-weight: 800;
}

.testimonial-section,
.final-cta {
  margin: clamp(3rem, 6vw, 6rem) 5vw;
  padding: clamp(2rem, 5vw, 4rem);
  border-radius: 2.5rem;
  background: var(--charcoal);
  color: var(--ivory);
  text-align: center;
}

.testimonial-section blockquote,
.final-cta h2 {
  max-width: 60rem;
  margin: 0 auto;
  color: var(--ivory);
  font-family: Georgia, serif;
  font-size: clamp(2rem, 4vw, 4rem);
  line-height: 1.04;
}

.testimonial-section p,
.final-cta p {
  color: rgba(248, 244, 238, 0.72);
}

.final-cta .primary-button {
  margin-top: 1.4rem;
  background: var(--ivory);
  color: var(--charcoal);
}

.split-page,
.contact-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(320px, 1.05fr);
  gap: 3rem;
  align-items: center;
}

.split-page img {
  height: 620px;
  border-radius: 2rem;
  box-shadow: 0 35px 90px rgba(31, 41, 51, 0.16);
}

.values-grid,
.contact-details {
  display: grid;
  gap: 0.75rem;
  margin-top: 2rem;
}

.values-grid span,
.contact-details span {
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: rgba(255, 250, 243, 0.72);
}

.package-card strong {
  display: block;
  margin: 1.4rem 0;
  font-family: Georgia, serif;
  font-size: 2.5rem;
}

.contact-form {
  display: grid;
  gap: 0.85rem;
  padding: 1.35rem;
}

.contact-form input,
.contact-form select,
.contact-form textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: rgba(255, 250, 243, 0.9);
  color: var(--charcoal);
  padding: 1rem;
}

.contact-form textarea {
  min-height: 9rem;
  resize: vertical;
}

.site-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem 5vw;
  border-top: 1px solid var(--line);
}

.site-footer strong {
  font-family: Georgia, serif;
  font-size: 1.5rem;
}

@media (max-width: 1100px) {
  .hero-section,
  .split-page,
  .contact-layout {
    grid-template-columns: 1fr;
  }

  .hero-collage {
    min-height: 560px;
  }

  .service-grid,
  .service-grid:not(.three),
  .portfolio-grid,
  .package-grid,
  .timeline {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .site-header,
  .site-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .nav-links {
    justify-content: flex-start;
  }

  h1 {
    font-size: clamp(3.25rem, 17vw, 5rem);
  }

  .hero-stats,
  .service-grid,
  .service-grid:not(.three),
  .portfolio-grid,
  .package-grid,
  .timeline {
    grid-template-columns: 1fr;
  }

  .hero-collage {
    min-height: 460px;
  }

  .hero-image-large {
    right: 0;
    width: 84%;
  }

  .hero-image-small {
    width: 52%;
  }
}`;

  return {
    title: `${brandName} - Luxury Home Staging`,
    files: [
      { path: "/App.js", content: appCode },
      { path: "/styles.css", content: cssCode },
    ],
  };
}
