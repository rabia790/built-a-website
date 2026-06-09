import assert from "node:assert/strict";
import { applySectionEdit } from "../lib/applySectionEdit.js";
import { applySimpleEdit } from "../lib/applySimpleEdit.js";
import { normalizeEditInstruction } from "../lib/normalizeEditInstruction.js";

const baseApp = `const brandName = "BridgeHire Collective";

function Navbar() {
  return <nav><button className="brand"><span>{brandName}</span></button></nav>;
}

function Footer() {
  return <footer>Footer</footer>;
}

function HomePage() {
  return (
    <main className="page-shell">
      <section data-edit-id="hero-section">
        <h1 data-edit-id="hero-headline" className="hero-title">Connect growing companies with people ready to do great work</h1>
        <button>Request Staff</button>
      </section>
      <section data-edit-id="testimonials-section"><h2>Testimonials</h2><p>Great work.</p></section>
    </main>
  );
}

function ServicesPage() {
  return (
    <main className="page-shell">
      <section data-edit-id="services-section"><h1>Services</h1></section>
      <section className="pricing-section" data-edit-id="pricing-section"><h2>Pricing</h2><p>Starter</p></section>
    </main>
  );
}

function PackagesPage() {
  return <main className="page-shell"><h1>Packages</h1><p>Simple package text.</p></main>;
}

function ContactPage() {
  return <main className="page-shell"><h1>Contact</h1></main>;
}

function App() {
  const [currentPage, setCurrentPage] = React.useState("home");
  return <><Navbar />{currentPage === "home" && <HomePage />}{currentPage === "services" && <ServicesPage />}{currentPage === "packages" && <PackagesPage />}{currentPage === "contact" && <ContactPage />}<Footer /></>;
}

export default App;`;

const baseCss = `.hero-title { font-size: 6rem; }`;

function applyEdit(instruction, appCode = baseApp, cssCode = baseCss, category = "staffing") {
  const plan = normalizeEditInstruction(instruction, { category });
  const simple = applySimpleEdit(appCode, cssCode, plan.normalizedInstruction || instruction);
  if (simple.changed) return { ...simple, plan, usedAI: false };
  const section = applySectionEdit(appCode, cssCode, { ...plan, category });
  return { ...section, plan, usedAI: false };
}

function assertValidApp(appCode) {
  assert.match(appCode, /function\s+App\s*\(/);
  assert.match(appCode, /export\s+default\s+App/);
  assert.match(appCode, /function\s+Navbar\s*\(/);
  assert.match(appCode, /function\s+Footer\s*\(/);
}

const cases = [
  ["make logo icon", (result) => assert.match(result.appCode, /brand-logo/)],
  ["fix logo overlap", (result) => assert.match(result.appCode, /brand-logo/)],
  ["make hero headline smaller", (result) => assert.match(result.cssCode, /hero-headline-size|editable-heading/)],
  ['change "Connect growing companies with people ready to do great work" color to black', (result) => assert.match(result.appCode, /color:\s*"#111827"|color:\s*"#000|color:\s*"black/)],
  ["add pricing", (result) => assert.match(result.appCode, /pricing-section|Starter Hiring|Growth Staffing/)],
  ["remove pricing from services", (result) => assert.doesNotMatch(result.appCode.match(/function ServicesPage[\s\S]*?function PackagesPage/)?.[0] || "", /pricing-section/)],
  ["make packages page more attractive", (result) => assert.match(result.appCode, /Premium Workforce|Growth Staffing|package-card/)],
  ["add FAQ", (result) => assert.match(result.appCode, /faq-section/)],
  ["add contact form", (result) => assert.match(result.appCode, /contact-form/)],
  ["remove testimonials", (result) => assert.doesNotMatch(result.appCode, /testimonials-section/)],
  ["change colors to black and gold", (result) => assert.match(result.cssCode, /#b88a2e/)],
  ["add gallery", (result) => assert.match(result.appCode, /gallery-section/)],
  ["move pricing from services to packages", (result) => assert.match(result.appCode, /pricing-section|package-card/)],
];

for (const [instruction, check] of cases) {
  const result = applyEdit(instruction);
  assert.equal(result.usedAI, false, `${instruction} should not call AI`);
  assert.equal(result.changed, true, `${instruction} should change code`);
  assertValidApp(result.appCode);
  check(result);
}

console.log(`Edit engine tests passed: ${cases.length}`);
