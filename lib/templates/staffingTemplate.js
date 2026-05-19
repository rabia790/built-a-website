const staffingImages = {
  team:
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85",
  collaboration:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=85",
  interview:
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=85",
};

const variantCopy = {
  staffing_modern_split: {
    brandName: "Northbridge Talent",
    title: "Modern Staffing Agency",
    headline: "Hire reliable talent without slowing down your business",
    subheadline:
      "Flexible staffing solutions for growing teams, busy warehouses, offices, healthcare groups, and service businesses.",
    accent: "#2563eb",
    themeClass: "variant-modern",
  },
  staffing_enterprise: {
    brandName: "Apex Workforce Partners",
    title: "Enterprise Staffing Partner",
    headline: "Workforce support built for complex teams and critical roles",
    subheadline:
      "Enterprise-grade staffing, compliance, and account management for organizations that need dependable people at scale.",
    accent: "#0f766e",
    themeClass: "variant-enterprise",
  },
  staffing_candidate_employer_dual: {
    brandName: "BridgeHire Collective",
    title: "Employer and Candidate Staffing",
    headline: "Connect growing companies with people ready to do great work",
    subheadline:
      "One staffing partner for employers who need dependable shortlists and candidates who want clear, respectful opportunities.",
    accent: "#7c3aed",
    themeClass: "variant-dual",
  },
};

function escapeText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

export function buildStaffingWebsite({
  prompt = "",
  variant = "staffing_modern_split",
} = {}) {
  const copy = variantCopy[variant] || variantCopy.staffing_modern_split;
  const promptTone = /health|medical|clinic|care/i.test(prompt)
    ? "healthcare groups"
    : /warehouse|logistics|industrial/i.test(prompt)
      ? "warehouse and logistics teams"
      : "growing teams";
  const brandName = escapeText(copy.brandName);
  const headline = escapeText(copy.headline);
  const subheadline = escapeText(
    copy.subheadline.replace("growing teams", promptTone),
  );
  const homeAfterHero =
    variant === "staffing_enterprise"
      ? "industries"
      : variant === "staffing_candidate_employer_dual"
        ? "audience"
        : "audience";

  const appCode = `const brandName = "${brandName}";
const templateVariant = "${variant}";
const heroHeadline = "${headline}";
const heroSubheadline = "${subheadline}";

const navItems = [
  ["home", "Home"],
  ["employers", "Employers"],
  ["candidates", "Candidates"],
  ["industries", "Industries"],
  ["process", "Process"],
  ["about", "About"],
  ["contact", "Contact"],
];

const imageSet = {
  team: "${staffingImages.team}",
  collaboration: "${staffingImages.collaboration}",
  interview: "${staffingImages.interview}",
};

const stats = [
  ["500+", "roles filled"],
  ["48 hr", "average shortlist"],
  ["92%", "client retention"],
];

const industries = [
  ["Warehouse & logistics", "Reliable associates for peak seasons, shift coverage, and fast-moving fulfillment teams."],
  ["Office & admin", "Reception, coordinators, data entry, operations support, and back-office professionals."],
  ["Healthcare support", "Screened support staff for clinics, care groups, and high-touch service environments."],
  ["Hospitality & service", "Flexible people for guest-facing teams, events, facilities, and customer support."],
  ["Light industrial", "Production, packaging, quality control, inventory, and dependable line support."],
  ["Professional services", "Contract, temp-to-hire, and permanent talent for growing business teams."],
];

const processSteps = [
  ["01", "Clarify the role", "We map schedule, skills, environment, pay range, and success markers before sourcing starts."],
  ["02", "Screen with care", "Candidates are assessed for reliability, communication, fit, and role-specific requirements."],
  ["03", "Shortlist quickly", "Hiring teams receive a focused shortlist with context, availability, and next-step guidance."],
  ["04", "Support after start", "We monitor onboarding, attendance, fit, and replacement needs so momentum stays intact."],
];

const testimonials = [
  ["Northbridge understands urgency without sending us the wrong people. Their shortlists are thoughtful and fast.", "Operations Director, regional logistics group"],
  ["They treated me like a person, not a resume. I found steady work and clear communication from day one.", "Placed candidate, admin support"],
];

function Navbar({ currentPage, setCurrentPage }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => setCurrentPage("home")}>
        <span>NB</span>
        {brandName}
      </button>
      <nav className="nav-links" aria-label="Primary navigation">
        {navItems.map(([id, label]) => (
          <button key={id} className={currentPage === id ? "active" : ""} onClick={() => setCurrentPage(id)}>
            {label}
          </button>
        ))}
      </nav>
      <button className="header-cta" onClick={() => setCurrentPage("contact")}>Request Staff</button>
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

function Hero({ setCurrentPage }) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <p data-edit-id="hero-eyebrow" className="eyebrow">Staffing for teams that cannot afford slow hiring</p>
        <h1 data-edit-id="hero-headline" className="hero-title">{heroHeadline}</h1>
        <p data-edit-id="hero-subheadline" className="hero-subtitle">{heroSubheadline}</p>
        <div className="hero-actions">
          <button data-edit-id="primary-cta" className="primary-button" onClick={() => setCurrentPage("contact")}>Request Staff</button>
          <button data-edit-id="secondary-cta" className="secondary-button" onClick={() => setCurrentPage("candidates")}>Find Work</button>
        </div>
        <div className="stats-grid">
          {stats.map(([value, label], index) => (
            <article className="stat-card" data-edit-id={"stat-card-" + (index + 1)} key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </div>
      <div className="hero-panel">
        <div data-edit-id="hero-image" className="image-card">
          <img src={imageSet.team} alt="Professional team reviewing staffing plans" className="hero-image" loading="lazy" />
        </div>
        <div className="talent-card shortlist">
          <span>Shortlist ready</span>
          <strong>12 qualified candidates</strong>
          <p>Availability, fit notes, and screening context included.</p>
        </div>
        <div className="talent-card match">
          <span>Role match</span>
          <strong>Warehouse lead / Day shift</strong>
          <p>Reliable, certified, available this week.</p>
        </div>
      </div>
    </section>
  );
}

function AudienceSplit({ setCurrentPage }) {
  return (
    <section data-edit-id="services-section" className="content-section split-cards">
      <article data-edit-id="service-card-1">
        <p className="eyebrow">For employers</p>
        <h3>Staff up without losing operational focus.</h3>
        <p>Get dependable shortlists for temporary, permanent, contract, and temp-to-hire roles with clear communication at every step.</p>
        <button className="text-button" onClick={() => setCurrentPage("employers")}>Explore employer solutions</button>
      </article>
      <article data-edit-id="service-card-2">
        <p className="eyebrow">For candidates</p>
        <h3>Find work that respects your goals and availability.</h3>
        <p>Access flexible roles, transparent expectations, supportive recruiters, and employers looking for committed people.</p>
        <button className="text-button" onClick={() => setCurrentPage("candidates")}>Explore candidate support</button>
      </article>
    </section>
  );
}

function HomePage({ setCurrentPage }) {
  return (
    <main>
      <Hero setCurrentPage={setCurrentPage} />
      {templateVariant === "staffing_enterprise" && (
        <section className="enterprise-proof">
          <p className="eyebrow">Enterprise readiness</p>
          <div>
            {["Dedicated account team", "Compliance-aware screening", "Multi-location coverage", "Retention reporting"].map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>
      )}
      {templateVariant === "staffing_candidate_employer_dual" && <AudienceSplit setCurrentPage={setCurrentPage} />}
      <section data-edit-id="portfolio-section" className={"content-section " + "${homeAfterHero}"}>
        <SectionIntro eyebrow="Industries served" title="Focused staffing for the teams that keep business moving." body="Our recruiters understand high-volume environments, service standards, shift needs, and the difference between available and dependable." />
        <div className="industry-grid">
          {industries.slice(0, 6).map(([title, body]) => (
            <article className="industry-card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      {templateVariant !== "staffing_candidate_employer_dual" && <AudienceSplit setCurrentPage={setCurrentPage} />}
      <section data-edit-id="process-section" className="content-section process-band">
        <SectionIntro eyebrow="Hiring process" title="A clear path from open role to reliable start." body="Every request moves through a structured workflow so your team knows exactly what is happening and when." />
        <div className="process-grid">
          {processSteps.map(([number, title, body]) => (
            <article className="process-card" key={title}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section data-edit-id="testimonial-section" className="proof-section">
        {testimonials.map(([quote, person]) => (
          <blockquote key={person}>
            <p>"{quote}"</p>
            <cite>{person}</cite>
          </blockquote>
        ))}
      </section>
      <section data-edit-id="contact-section" className="final-cta">
        <h2>Need reliable people on your next shift, launch, or growth push?</h2>
        <p>Tell us what you need. We will help you build a shortlist that fits the work, the schedule, and the team.</p>
        <button className="primary-button" onClick={() => setCurrentPage("contact")}>Request Staff</button>
      </section>
    </main>
  );
}

function EmployersPage() {
  return (
    <main className="page-shell two-column">
      <div>
        <p className="eyebrow">Employers</p>
        <h2>Hiring support for busy teams that need dependable coverage.</h2>
        <p>From urgent shift coverage to permanent placements, we help employers reduce hiring friction without lowering standards.</p>
        <div className="feature-list">
          {["Temporary and temp-to-hire staffing", "Permanent recruitment", "High-volume shortlist support", "Attendance and onboarding check-ins"].map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
      <img src={imageSet.collaboration} alt="Hiring team collaborating in a modern office" loading="lazy" />
    </main>
  );
}

function CandidatesPage() {
  return (
    <main className="page-shell two-column reverse">
      <img src={imageSet.interview} alt="Candidate interview with recruiter" loading="lazy" />
      <div>
        <p className="eyebrow">Candidates</p>
        <h2>Work opportunities with clear expectations and real recruiter support.</h2>
        <p>We connect candidates with employers who need motivated people, then keep communication clear from application to first day.</p>
        <div className="feature-list">
          {["Flexible shifts and steady roles", "Resume and interview support", "Clear pay and schedule expectations", "Temp, contract, and permanent options"].map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
    </main>
  );
}

function IndustriesPage() {
  return (
    <main className="page-shell">
      <SectionIntro eyebrow="Industries" title="Staffing designed around the realities of each workplace." body="Different roles require different screening signals. We tailor sourcing and evaluation around environment, pace, compliance, and team culture." />
      <div className="industry-grid">
        {industries.map(([title, body]) => (
          <article className="industry-card" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

function ProcessPage() {
  return (
    <main className="page-shell">
      <SectionIntro eyebrow="Process" title="Fast does not have to mean careless." body="Our workflow protects speed and quality by making every handoff clear." />
      <div className="process-grid large">
        {processSteps.map(([number, title, body]) => (
          <article className="process-card" key={title}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </main>
  );
}

function AboutPage() {
  return (
    <main className="page-shell two-column">
      <div>
        <p className="eyebrow">About</p>
        <h2>A staffing partner built around responsiveness, respect, and fit.</h2>
        <p>{brandName} helps employers and candidates move faster with better context. We combine human recruiting judgment with a structured process so every placement has a clearer path to success.</p>
        <div className="feature-list">
          {["Human-first recruiting", "Transparent communication", "Reliable shortlist discipline", "Long-term client partnerships"].map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
      <img src={imageSet.team} alt="Recruiting team planning workforce needs" loading="lazy" />
    </main>
  );
}

function ContactPage() {
  return (
    <main className="page-shell contact-layout">
      <div>
        <p className="eyebrow">Contact</p>
        <h2>Tell us what kind of staffing support you need.</h2>
        <p>Request staff, ask about hiring plans, or connect with a recruiter about open roles.</p>
        <div className="contact-details">
          <span>hello@northbridgetalent.com</span>
          <span>Average response: same business day</span>
          <span>Temporary, contract, and permanent hiring</span>
        </div>
      </div>
      <form className="contact-form">
        <input placeholder="Name" />
        <input placeholder="Email" />
        <select>
          <option>I need to hire staff</option>
          <option>I am looking for work</option>
          <option>I want to discuss workforce planning</option>
        </select>
        <textarea placeholder="Tell us about roles, timing, locations, or goals" />
        <button type="button">Send Request</button>
      </form>
    </main>
  );
}

function Footer({ setCurrentPage }) {
  return (
    <footer className="site-footer">
      <div>
        <strong>{brandName}</strong>
        <p>Flexible staffing solutions for growing teams.</p>
      </div>
      <div>
        <button onClick={() => setCurrentPage("contact")}>Request Staff</button>
        <button onClick={() => setCurrentPage("candidates")}>Find Work</button>
      </div>
    </footer>
  );
}

function App() {
  const [currentPage, setCurrentPage] = React.useState("home");

  const pages = {
    home: <HomePage setCurrentPage={setCurrentPage} />,
    employers: <EmployersPage />,
    candidates: <CandidatesPage />,
    industries: <IndustriesPage />,
    process: <ProcessPage />,
    about: <AboutPage />,
    contact: <ContactPage />,
  };

  return (
    <div className={"site-shell ${copy.themeClass}"}>
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {pages[currentPage]}
      <Footer setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default App;`;

  const cssCode = `:root {
  --bg: #f5f7fb;
  --surface: #ffffff;
  --ink: #111827;
  --muted: #667085;
  --line: #e5e7eb;
  --accent: ${copy.accent};
  --accent-soft: color-mix(in srgb, var(--accent) 12%, white);
  --dark: #0f172a;
  --hero-headline-size: clamp(3.8rem, 7.7vw, 7.5rem);
  --hero-headline-color: var(--ink);
  --hero-subheadline-size: clamp(1.08rem, 1.5vw, 1.35rem);
  --primary-color: var(--ink);
  --accent-color: var(--accent);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button, input, select, textarea { font: inherit; }
button { cursor: pointer; }

.site-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 28rem),
    linear-gradient(180deg, #fff 0%, var(--bg) 45%, #eef2f7 100%);
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
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(18px);
}

.brand, .nav-links button, .header-cta, .text-button, .site-footer button {
  border: 0;
  background: transparent;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--ink);
  font-weight: 800;
}

.brand span {
  display: grid;
  place-items: center;
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 0.85rem;
  background: var(--ink);
  color: white;
  font-size: 0.8rem;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem;
}

.nav-links button {
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.9rem;
}

.nav-links button.active,
.nav-links button:hover {
  background: var(--accent-soft);
  color: var(--ink);
}

.header-cta, .primary-button, .contact-form button {
  border-radius: 999px;
  background: var(--ink);
  color: white;
  padding: 0.9rem 1.35rem;
  font-weight: 800;
  box-shadow: 0 18px 40px rgba(17, 24, 39, 0.16);
}

.secondary-button {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: white;
  color: var(--ink);
  padding: 0.9rem 1.35rem;
  font-weight: 800;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 0.94fr) minmax(360px, 1.06fr);
  gap: clamp(2rem, 6vw, 6rem);
  align-items: center;
  padding: clamp(4rem, 8vw, 7.5rem) 5vw clamp(3rem, 6vw, 5rem);
}

.eyebrow {
  margin: 0 0 0.85rem;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1, h2, h3 { margin: 0; color: var(--ink); }
h1, h2 { letter-spacing: -0.06em; line-height: 0.96; }
h1 { max-width: 12ch; font-size: clamp(3.8rem, 7.7vw, 7.5rem); }
.hero-title {
  font-size: var(--hero-headline-size);
  color: var(--hero-headline-color);
}
h2 { font-size: clamp(2.5rem, 5vw, 5rem); }
h3 { font-size: 1.25rem; letter-spacing: -0.03em; }
p { color: var(--muted); line-height: 1.75; }

.hero-subtitle {
  max-width: 43rem;
  margin-top: 1.5rem;
  font-size: var(--hero-subheadline-size);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 2rem;
}

.stat-card, .industry-card, .process-card, .split-cards article, .contact-form {
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 1.35rem;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.08);
}

.stat-card { padding: 1rem; }
.stat-card strong { display: block; font-size: 2rem; letter-spacing: -0.05em; }
.stat-card span { color: var(--muted); font-size: 0.85rem; }

.hero-panel {
  position: relative;
  min-height: 610px;
}

.image-card {
  position: absolute;
  inset: 3% 8% 14% 8%;
  overflow: hidden;
  border: 10px solid white;
  border-radius: 2rem;
  box-shadow: 0 35px 95px rgba(17, 24, 39, 0.18);
}

.hero-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.talent-card {
  position: absolute;
  max-width: 17rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 22px 60px rgba(17, 24, 39, 0.16);
  backdrop-filter: blur(16px);
}

.talent-card span { color: var(--accent); font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; }
.talent-card strong { display: block; margin-top: 0.45rem; font-size: 1.1rem; }
.talent-card p { margin-bottom: 0; font-size: 0.9rem; }
.shortlist { left: 0; bottom: 7%; }
.match { right: 0; top: 7%; }

.content-section, .page-shell {
  padding: clamp(4rem, 7vw, 7rem) 5vw;
}

.section-intro {
  max-width: 58rem;
  margin-bottom: 2.4rem;
}

.section-intro > p:last-child {
  max-width: 44rem;
  font-size: 1.05rem;
}

.split-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.split-cards article, .industry-card, .process-card {
  padding: 1.35rem;
}

.text-button {
  margin-top: 1rem;
  color: var(--accent);
  font-weight: 800;
}

.industry-grid, .process-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.process-band {
  margin-inline: 5vw;
  border-radius: 2rem;
  background: var(--dark);
}

.process-band h2, .process-band h3 { color: white; }
.process-band p { color: rgba(255, 255, 255, 0.7); }
.process-card span { color: var(--accent); font-weight: 900; }
.process-grid.large { grid-template-columns: repeat(4, minmax(0, 1fr)); }

.proof-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 0 5vw clamp(3rem, 6vw, 6rem);
}

.proof-section blockquote {
  margin: 0;
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: white;
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.08);
}

.proof-section p {
  color: var(--ink);
  font-size: 1.25rem;
  line-height: 1.45;
}

.proof-section cite { color: var(--muted); font-style: normal; }

.final-cta {
  margin: 0 5vw clamp(4rem, 7vw, 7rem);
  padding: clamp(2rem, 5vw, 4.5rem);
  border-radius: 2rem;
  background: white;
  text-align: center;
  box-shadow: 0 28px 90px rgba(17, 24, 39, 0.1);
}

.final-cta h2 {
  max-width: 58rem;
  margin: 0 auto;
}

.final-cta p {
  max-width: 42rem;
  margin: 1rem auto 1.5rem;
}

.two-column, .contact-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(340px, 1.05fr);
  gap: 3rem;
  align-items: center;
}

.two-column.reverse {
  grid-template-columns: minmax(340px, 1.05fr) minmax(0, 0.95fr);
}

.two-column img {
  width: 100%;
  height: 560px;
  object-fit: cover;
  border-radius: 2rem;
  box-shadow: 0 28px 90px rgba(17, 24, 39, 0.12);
}

.feature-list, .contact-details {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.8rem;
}

.feature-list span, .contact-details span {
  padding: 0.95rem 1rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: white;
}

.contact-form {
  display: grid;
  gap: 0.85rem;
  padding: 1.25rem;
}

.contact-form input, .contact-form select, .contact-form textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: white;
  color: var(--ink);
  padding: 1rem;
}

.contact-form textarea { min-height: 10rem; resize: vertical; }

.site-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem 5vw;
  border-top: 1px solid var(--line);
}

.site-footer strong { font-size: 1.35rem; letter-spacing: -0.04em; }
.site-footer div:last-child { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.site-footer button { color: var(--accent); font-weight: 800; }

.variant-enterprise h1 { max-width: 13ch; }
.variant-enterprise .hero-panel::before {
  content: "Compliance ready";
  position: absolute;
  left: 4%;
  top: 2%;
  z-index: 2;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  background: var(--dark);
  color: white;
  font-weight: 800;
}

.variant-dual .split-cards {
  margin-top: -2rem;
}

.enterprise-proof {
  margin: -2rem 5vw 3rem;
  padding: 1rem;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 1.5rem;
  background: white;
  box-shadow: 0 24px 70px rgba(17, 24, 39, 0.08);
}

.enterprise-proof div {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.enterprise-proof span {
  padding: 1rem;
  border-radius: 1rem;
  background: var(--accent-soft);
  color: var(--ink);
  font-weight: 800;
}

.variant-dual .hero-section {
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.8fr);
}

.variant-dual .hero-panel {
  min-height: 540px;
}

@media (max-width: 1050px) {
  .hero-section, .two-column, .two-column.reverse, .contact-layout {
    grid-template-columns: 1fr;
  }

  .hero-panel { min-height: 520px; }
  .industry-grid, .process-grid, .process-grid.large, .split-cards, .proof-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .site-header, .site-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .nav-links { justify-content: flex-start; }
  h1 { font-size: clamp(3.1rem, 15vw, 5rem); }
  .stats-grid, .industry-grid, .process-grid, .process-grid.large, .split-cards, .proof-section {
    grid-template-columns: 1fr;
  }

  .hero-panel { min-height: 440px; }
  .image-card { inset: 7% 0 12% 0; }
  .talent-card { position: relative; inset: auto; margin-top: 0.75rem; max-width: none; }
}`;

  return {
    title: `${copy.brandName} - ${copy.title}`,
    files: [
      { path: "/App.js", content: appCode },
      { path: "/styles.css", content: cssCode },
    ],
    templateVariant: variant,
    imageSetUsed: Object.values(staffingImages),
  };
}
