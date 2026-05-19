const images = {
  studio:
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=85",
  forms:
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1400&q=85",
  landscape:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85",
  desk:
    "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1400&q=85",
  meeting:
    "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?auto=format&fit=crop&w=1400&q=85",
  interface:
    "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1400&q=85",
};

function escapeText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

export function buildPortfolioWebsite({
  prompt = "",
  brandName = "Aurora Brand Studio",
  headline = "Brand identities with strategy, soul, and staying power",
  subheadline = "A refined design studio crafting visual systems, websites, and launch-ready brand worlds for founders and growing companies.",
  variant = "portfolio_editorial",
} = {}) {
  const promptBrand = /minimal|solo|freelance/i.test(prompt)
    ? "Vale Creative Office"
    : brandName;
  const safeBrand = escapeText(promptBrand);
  const safeHeadline = escapeText(headline);
  const safeSubheadline = escapeText(subheadline);

  const appCode = `const brandName = "${safeBrand}";
const heroHeadline = "${safeHeadline}";
const heroSubheadline = "${safeSubheadline}";

const navItems = [
  ["home", "Home"],
  ["work", "Work"],
  ["services", "Services"],
  ["about", "About"],
  ["caseStudies", "Case Studies"],
  ["journal", "Journal"],
  ["contact", "Contact"],
];

const imageSet = {
  studio: "${images.studio}",
  forms: "${images.forms}",
  landscape: "${images.landscape}",
  desk: "${images.desk}",
  meeting: "${images.meeting}",
  interface: "${images.interface}",
};

const projects = [
  ["Luma Skin Studio", "Skincare", "Identity, packaging, website", imageSet.forms, "Repositioned a clinical skincare studio into a warm premium ritual brand."],
  ["Maison Vale", "Home goods", "Visual identity, art direction", imageSet.landscape, "Created a refined retail identity with quieter luxury and stronger shelf presence."],
  ["Northline Coffee", "Hospitality", "Packaging, brand system", imageSet.desk, "Built a flexible packaging language that increased wholesale interest."],
  ["Solara Wellness", "Wellness", "Strategy, identity, launch collateral", imageSet.interface, "Clarified a modern wellness offer with a calm, confident visual system."],
  ["Atelier Bloom", "Floral studio", "Identity, campaign direction", imageSet.studio, "Translated seasonal arrangements into a romantic editorial brand world."],
  ["Haven Interiors", "Interior design", "Website, identity refresh", imageSet.meeting, "Elevated a boutique studio with a more considered digital presence."],
];

const services = [
  ["Brand Strategy", "Positioning, audience definition, brand voice, offer architecture, and a strategic foundation for visual decisions.", "Discovery workshop, positioning map, messaging pillars"],
  ["Visual Identity", "A complete identity system that gives your brand a recognizable point of view across every touchpoint.", "Logo suite, color, typography, art direction"],
  ["Logo Systems", "Elegant marks, wordmarks, alternates, and usage rules designed to scale from packaging to web.", "Primary logo, secondary marks, icon set"],
  ["Art Direction", "Photography, composition, campaign mood, and image direction for a cohesive brand world.", "Moodboards, shot lists, campaign guidance"],
  ["Website Design", "Conversion-aware web design with editorial flow, premium hierarchy, and brand consistency.", "Sitemap, wireframes, page designs"],
  ["Launch Collateral", "Templates and launch assets that help the brand arrive with polish and consistency.", "Social templates, pitch decks, packaging basics"],
];

const caseStudies = [
  ["Luma Skin Studio", imageSet.forms, "A clinical skincare studio needed to feel premium without losing trust.", "We softened the voice, built a tactile visual identity, and designed a digital experience around rituals and results.", "38% inquiry lift after launch", "Strategy, identity, packaging, website"],
  ["Maison Vale", imageSet.landscape, "A luxury home goods line had strong products but an inconsistent retail presence.", "We created a restrained identity, earthy palette, art direction system, and packaging rhythm.", "Stronger retail presence across boutique partners", "Identity, packaging, art direction"],
  ["Northline Coffee", imageSet.desk, "A regional roaster needed packaging that could scale across blends and wholesale channels.", "We designed a modular label system, expressive color logic, and clear product hierarchy.", "Increased wholesale interest after launch", "Packaging, identity system, collateral"],
];

function Navbar({ currentPage, setCurrentPage }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => setCurrentPage("home")}>{brandName}</button>
      <nav className="nav-links" aria-label="Primary navigation">
        {navItems.map(([id, label]) => (
          <button key={id} onClick={() => setCurrentPage(id)} className={currentPage === id ? "active" : ""}>
            {label}
          </button>
        ))}
      </nav>
      <button className="header-cta" onClick={() => setCurrentPage("contact")}>Start a Project</button>
    </header>
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

function HomePage({ setCurrentPage }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p data-edit-id="hero-eyebrow" className="eyebrow">Independent brand design studio</p>
          <h1 data-edit-id="hero-headline" className="hero-title">{heroHeadline}</h1>
          <p data-edit-id="hero-subheadline">{heroSubheadline}</p>
          <div className="hero-actions">
            <button data-edit-id="primary-cta" className="primary-button" onClick={() => setCurrentPage("work")}>View Selected Work</button>
            <button data-edit-id="secondary-cta" className="secondary-button" onClick={() => setCurrentPage("contact")}>Start a Project</button>
          </div>
        </div>
        <div data-edit-id="hero-image" className="hero-visual">
          <img src={imageSet.forms} alt="Abstract brand identity shapes" loading="lazy" className="visual-main" />
          <img src={imageSet.desk} alt="Brand design workspace with sketches" loading="lazy" className="visual-float one" />
          <div className="studio-note">
            <span>Selected for founders</span>
            <strong>Strategy first. Visuals with restraint.</strong>
          </div>
        </div>
      </section>
      <section className="trust-strip">
        {["Luma", "Maison Vale", "Northline", "Solara", "Haven"].map((client) => <span key={client}>{client}</span>)}
      </section>
      <section data-edit-id="portfolio-section" className="content-section">
        <SectionIntro eyebrow="Selected work" title="Brand worlds with texture, clarity, and commercial intent." body="Every project is built to move beyond a logo into a system that can launch, scale, and stay recognizable." />
        <div className="work-grid preview">
          {projects.slice(0, 3).map(([name, industry, service, image, result]) => (
            <article className="project-card" key={name}>
              <img src={image} alt={name + " brand project"} loading="lazy" />
              <div>
                <p>{industry} / {service}</p>
                <h3>{name}</h3>
                <span>{result}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section data-edit-id="services-section" className="content-section service-preview">
        <SectionIntro eyebrow="Studio services" title="From positioning to launch-ready brand systems." body="A focused creative process for founders, boutiques, and growing brands ready to look as considered as their work feels." />
        <div className="service-grid">
          {services.slice(0, 3).map(([title, body], index) => (
            <article data-edit-id={"service-card-" + (index + 1)} className="service-card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="process-band">
        <p className="eyebrow">Process</p>
        <div className="process-grid">
          {["Define the point of view", "Build the visual language", "Prepare every launch touchpoint"].map((step, index) => (
            <article key={step}>
              <span>0{index + 1}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>
      <section className="quote-section">
        <blockquote>"Aurora gave us a visual system that finally matched the quality of the work. It felt premium, clear, and completely ownable."</blockquote>
        <p>Elena M., Founder of Luma Skin Studio</p>
      </section>
      <section className="final-cta">
        <h2>Ready for a brand that feels unmistakably yours?</h2>
        <button className="primary-button" onClick={() => setCurrentPage("contact")}>Start a Project</button>
      </section>
    </main>
  );
}

function WorkPage() {
  return (
    <main className="page-shell">
      <SectionIntro eyebrow="Work" title="Selected identities, websites, packaging, and brand systems." body="Six recent projects shaped around clarity, emotion, and long-term brand recognition." />
      <div className="work-grid">
        {projects.map(([name, industry, service, image, result]) => (
          <article className="project-card" key={name}>
            <img src={image} alt={name + " brand design case"} loading="lazy" />
            <div>
              <p>{industry} / {service}</p>
              <h3>{name}</h3>
              <span>{result}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function ServicesPage() {
  return (
    <main className="page-shell">
      <SectionIntro eyebrow="Services" title="Strategic identity work with enough depth to carry a full brand world." body="Each engagement is intentionally scoped around what the brand needs to communicate, sell, and repeat." />
      <div className="service-grid full">
        {services.map(([title, body, deliverables]) => (
          <article className="service-card" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
            <strong>{deliverables}</strong>
          </article>
        ))}
      </div>
    </main>
  );
}

function AboutPage({ setCurrentPage }) {
  return (
    <main className="page-shell about-layout">
      <div>
        <p className="eyebrow">About the studio</p>
        <h2>Design for brands that would rather be remembered than louder.</h2>
        <p>Aurora Brand Studio is led by a brand designer and art director obsessed with restraint, rhythm, and systems that feel inevitable. We partner with founders who care about how every detail compounds.</p>
        <div className="stats-row">
          <span><strong>42</strong> brands launched</span>
          <span><strong>8</strong> years in identity</span>
          <span><strong>3</strong> week sprint options</span>
        </div>
        <div className="values">
          {["Strategic before stylish", "Editorial restraint", "Systems over one-offs", "Launch-ready detail"].map((value) => <span key={value}>{value}</span>)}
        </div>
        <button className="primary-button" onClick={() => setCurrentPage("contact")}>Start a Project</button>
      </div>
      <img src={imageSet.meeting} alt="Creative direction table with brand materials" loading="lazy" />
    </main>
  );
}

function CaseStudiesPage() {
  return (
    <main className="page-shell">
      <SectionIntro eyebrow="Case studies" title="Three brand transformations with measurable momentum." body="A look at how strategy, identity, and art direction shifted perception and performance." />
      <div className="case-grid">
        {caseStudies.map(([name, image, challenge, solution, result, servicesUsed]) => (
          <article className="case-card" key={name}>
            <img src={image} alt={name + " case study"} loading="lazy" />
            <div>
              <p className="eyebrow">{servicesUsed}</p>
              <h3>{name}</h3>
              <p><strong>Challenge:</strong> {challenge}</p>
              <p><strong>Solution:</strong> {solution}</p>
              <span>{result}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function JournalPage() {
  const articles = [
    ["How to know when your brand has outgrown its identity", "Signals that your visuals, message, and customer experience are no longer telling the same story."],
    ["Why premium brands need restraint, not more decoration", "A practical look at whitespace, hierarchy, and the quiet cues that create trust."],
    ["Building a visual system that works beyond a logo", "How typography, color, imagery, layout, and voice make a brand easier to remember."],
  ];
  return (
    <main className="page-shell">
      <SectionIntro eyebrow="Journal" title="Notes on identity, restraint, and building brands that last." body="Short editorial essays for founders thinking seriously about perception and growth." />
      <div className="journal-grid">
        {articles.map(([title, body]) => (
          <article className="journal-card" key={title}>
            <p className="eyebrow">Brand thinking</p>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

function ContactPage() {
  return (
    <main className="page-shell contact-layout">
      <div>
        <p className="eyebrow">Contact</p>
        <h2>Tell us what your brand needs to become.</h2>
        <p>Currently booking identity and website projects for founders, boutiques, and growing teams ready for a more refined market presence.</p>
        <div className="contact-notes">
          <span>hello@aurorabrand.studio</span>
          <span>Booking new projects for next month</span>
          <span>Brand identity, website design, launch systems</span>
        </div>
      </div>
      <form className="inquiry-form">
        <input placeholder="Name" />
        <input placeholder="Email" />
        <select>
          <option>Brand identity</option>
          <option>Website design</option>
          <option>Brand and website</option>
          <option>Art direction</option>
        </select>
        <textarea placeholder="What are you building, changing, or launching?" />
        <button type="button">Send Inquiry</button>
      </form>
    </main>
  );
}

function Footer({ setCurrentPage }) {
  return (
    <footer className="site-footer">
      <strong>{brandName}</strong>
      <button onClick={() => setCurrentPage("contact")}>Start a Project</button>
    </footer>
  );
}

function App() {
  const [currentPage, setCurrentPage] = React.useState("home");

  const pages = {
    home: <HomePage setCurrentPage={setCurrentPage} />,
    work: <WorkPage />,
    services: <ServicesPage />,
    about: <AboutPage setCurrentPage={setCurrentPage} />,
    caseStudies: <CaseStudiesPage />,
    journal: <JournalPage />,
    contact: <ContactPage />,
  };

  return (
    <div className={"site-shell " + "${variant}"}>
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {pages[currentPage]}
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default App;`;

  const cssCode = `:root {
  --bg: #f7f3ed;
  --cream: #fffaf3;
  --charcoal: #171717;
  --muted: #6b6259;
  --taupe: #b89b72;
  --clay: #c96f4a;
  --border: #e7ded2;
  --hero-headline-size: clamp(4.25rem, 8vw, 7.8rem);
  --hero-headline-color: var(--charcoal);
  --hero-subheadline-size: clamp(1.08rem, 1.5vw, 1.35rem);
  --primary-color: var(--charcoal);
  --accent-color: var(--clay);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
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
    radial-gradient(circle at 12% -10%, rgba(201, 111, 74, 0.14), transparent 28rem),
    radial-gradient(circle at 85% 8%, rgba(184, 155, 114, 0.16), transparent 26rem),
    var(--bg);
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
  border-bottom: 1px solid rgba(23, 23, 23, 0.08);
  background: rgba(247, 243, 237, 0.88);
  backdrop-filter: blur(18px);
}

.brand,
.nav-links button,
.header-cta,
.site-footer button {
  border: 0;
  background: transparent;
}

.brand {
  color: var(--charcoal);
  font-family: Georgia, serif;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.2rem;
}

.nav-links button {
  padding: 0.65rem 0.85rem;
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.9rem;
}

.nav-links button.active,
.nav-links button:hover {
  background: var(--cream);
  color: var(--charcoal);
}

.header-cta,
.primary-button,
.inquiry-form button {
  border: 0;
  border-radius: 999px;
  background: var(--charcoal);
  color: var(--cream);
  padding: 0.9rem 1.35rem;
  font-weight: 700;
  box-shadow: 0 18px 40px rgba(23, 23, 23, 0.14);
}

.secondary-button {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--cream);
  color: var(--charcoal);
  padding: 0.9rem 1.35rem;
  font-weight: 700;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
  gap: clamp(2rem, 6vw, 6rem);
  align-items: center;
  padding: clamp(4rem, 8vw, 8rem) 5vw;
}

.eyebrow {
  margin: 0 0 0.85rem;
  color: var(--clay);
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
  font-size: clamp(4.25rem, 8vw, 7.8rem);
  line-height: 0.9;
}

.hero-title {
  font-size: var(--hero-headline-size);
  color: var(--hero-headline-color);
}

h2 {
  font-size: clamp(2.7rem, 5.5vw, 5.8rem);
  line-height: 0.96;
}

h3 {
  font-size: 1.35rem;
  letter-spacing: -0.03em;
}

p {
  color: var(--muted);
  line-height: 1.75;
}

.hero-copy > p:not(.eyebrow) {
  max-width: 42rem;
  margin-top: 1.5rem;
  font-size: var(--hero-subheadline-size);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 2rem;
}

.hero-visual {
  position: relative;
  min-height: 620px;
}

.hero-visual img {
  position: absolute;
  object-fit: cover;
  border-radius: 2rem;
  box-shadow: 0 28px 80px rgba(23, 23, 23, 0.16);
}

.visual-main {
  right: 4%;
  top: 8%;
  width: 74%;
  height: 78%;
}

.visual-float {
  left: 0;
  bottom: 4%;
  width: 46%;
  height: 42%;
  border: 10px solid var(--bg);
}

.studio-note {
  position: absolute;
  left: 6%;
  top: 8%;
  max-width: 16rem;
  padding: 1rem;
  border-radius: 1.25rem;
  background: rgba(255, 250, 243, 0.92);
  box-shadow: 0 22px 60px rgba(23, 23, 23, 0.12);
}

.studio-note span {
  color: var(--clay);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.studio-note strong {
  display: block;
  margin-top: 0.5rem;
  font-family: Georgia, serif;
  font-size: 1.3rem;
  line-height: 1.1;
}

.trust-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin: 0 5vw;
  padding: 1.2rem;
  border-block: 1px solid var(--border);
  color: var(--muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.content-section,
.page-shell {
  padding: clamp(4rem, 7vw, 7rem) 5vw;
}

.section-intro {
  max-width: 62rem;
  margin-bottom: 2.5rem;
}

.section-intro > p:last-child {
  max-width: 44rem;
  font-size: 1.05rem;
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.project-card,
.service-card,
.case-card,
.journal-card,
.inquiry-form {
  border: 1px solid var(--border);
  border-radius: 1.6rem;
  background: rgba(255, 250, 243, 0.72);
  box-shadow: 0 24px 70px rgba(23, 23, 23, 0.08);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.project-card:hover,
.service-card:hover,
.case-card:hover,
.journal-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 30px 90px rgba(23, 23, 23, 0.12);
}

.project-card {
  overflow: hidden;
}

.project-card img,
.case-card img,
.about-layout img {
  display: block;
  width: 100%;
  height: 330px;
  object-fit: cover;
}

.project-card div {
  padding: 1.2rem;
}

.project-card div p {
  margin: 0 0 0.5rem;
  font-size: 0.82rem;
}

.project-card span,
.case-card span {
  display: block;
  margin-top: 0.7rem;
  color: var(--clay);
  font-weight: 700;
}

.service-preview {
  margin: 0 5vw;
  border-radius: 2.5rem;
  background: linear-gradient(135deg, rgba(255, 250, 243, 0.86), rgba(231, 222, 210, 0.62));
}

.service-grid,
.journal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.service-grid.full {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.service-card,
.journal-card {
  padding: 1.4rem;
}

.service-card strong {
  display: block;
  margin-top: 1.1rem;
  color: var(--charcoal);
}

.process-band,
.quote-section,
.final-cta {
  margin: clamp(3rem, 6vw, 6rem) 5vw;
  padding: clamp(2rem, 5vw, 4rem);
  border-radius: 2.5rem;
}

.process-band {
  background: var(--charcoal);
  color: var(--cream);
}

.process-band h3,
.process-band .eyebrow {
  color: var(--cream);
}

.process-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.process-grid article {
  padding: 1.3rem;
  border: 1px solid rgba(255, 250, 243, 0.16);
  border-radius: 1.4rem;
}

.process-grid span {
  color: var(--taupe);
  font-weight: 800;
}

.quote-section,
.final-cta {
  background: var(--cream);
  text-align: center;
  box-shadow: 0 24px 80px rgba(23, 23, 23, 0.08);
}

.quote-section blockquote,
.final-cta h2 {
  max-width: 62rem;
  margin: 0 auto;
  font-family: Georgia, serif;
  font-size: clamp(2rem, 4.5vw, 4.6rem);
  line-height: 1.02;
  letter-spacing: -0.045em;
}

.about-layout,
.contact-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(330px, 1.1fr);
  gap: 3rem;
  align-items: center;
}

.about-layout img {
  height: 650px;
  border-radius: 2rem;
  box-shadow: 0 30px 90px rgba(23, 23, 23, 0.12);
}

.stats-row,
.values,
.contact-notes {
  display: grid;
  gap: 0.8rem;
  margin: 2rem 0;
}

.stats-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.stats-row span,
.values span,
.contact-notes span {
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 1rem;
  background: var(--cream);
}

.stats-row strong {
  display: block;
  font-family: Georgia, serif;
  font-size: 2rem;
}

.case-grid {
  display: grid;
  gap: 1.2rem;
}

.case-card {
  display: grid;
  grid-template-columns: 0.72fr 1fr;
  overflow: hidden;
}

.case-card img {
  height: 100%;
  min-height: 360px;
}

.case-card div {
  padding: 1.5rem;
}

.inquiry-form {
  display: grid;
  gap: 0.85rem;
  padding: 1.35rem;
}

.inquiry-form input,
.inquiry-form select,
.inquiry-form textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 1rem;
  background: var(--cream);
  color: var(--charcoal);
  padding: 1rem;
}

.inquiry-form textarea {
  min-height: 10rem;
  resize: vertical;
}

.site-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem 5vw;
  border-top: 1px solid var(--border);
}

.site-footer strong {
  font-family: Georgia, serif;
  font-size: 1.5rem;
}

@media (max-width: 1050px) {
  .hero,
  .about-layout,
  .contact-layout,
  .case-card {
    grid-template-columns: 1fr;
  }

  .work-grid,
  .service-grid,
  .service-grid.full,
  .journal-grid,
  .process-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-visual {
    min-height: 520px;
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
    font-size: clamp(3.2rem, 16vw, 5rem);
  }

  .work-grid,
  .service-grid,
  .service-grid.full,
  .journal-grid,
  .process-grid,
  .stats-row {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 440px;
  }

  .visual-main {
    width: 86%;
  }

  .visual-float {
    width: 56%;
  }
}

.portfolio_case_study_grid .hero {
  grid-template-columns: 1fr;
  padding-bottom: 2rem;
}

.portfolio_case_study_grid .hero-copy {
  max-width: 70rem;
}

.portfolio_case_study_grid h1 {
  max-width: 15ch;
}

.portfolio_case_study_grid .work-grid.preview {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.portfolio_minimal_creative {
  --bg: #fbfaf7;
  --cream: #ffffff;
  --clay: #171717;
}

.portfolio_minimal_creative .hero {
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
}

.portfolio_minimal_creative .project-card,
.portfolio_minimal_creative .service-card,
.portfolio_minimal_creative .case-card,
.portfolio_minimal_creative .journal-card {
  box-shadow: none;
}`;

  return {
    title: `${brandName} - Brand Designer Portfolio`,
    files: [
      { path: "/App.js", content: appCode },
      { path: "/styles.css", content: cssCode },
    ],
    templateVariant: variant,
    imageSetUsed: Object.values(images),
  };
}
