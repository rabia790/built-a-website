export function normalizeDomain(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\.\./, "www.")
    .split("/")[0]
    .split(":")[0]
    .replace(/\.$/, "");
}

export function isValidDomain(value = "") {
  const domain = normalizeDomain(value);

  if (!domain || domain.length > 253) return false;
  if (domain === "localhost") return false;
  if (!domain.includes(".")) return false;

  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
    domain,
  );
}

export function isWwwDomain(domain = "") {
  return normalizeDomain(domain).startsWith("www.");
}

export function getDnsInstructions(domain = "") {
  const normalized = normalizeDomain(domain);
  const www = isWwwDomain(normalized);

  return {
    domain: normalized,
    type: www ? "CNAME" : "A",
    name: www ? "www" : "@",
    value: www ? "cname.vercel-dns.com" : "76.76.21.21",
    note: "DNS changes can take a few minutes to several hours.",
  };
}

export function getVercelTeamQuery() {
  return process.env.VERCEL_TEAM_ID
    ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}`
    : "";
}

export function getVercelHeaders() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export function assertVercelConfigured() {
  if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) {
    throw new Error(
      "Vercel domain publishing is not configured. Add VERCEL_TOKEN and VERCEL_PROJECT_ID to your environment.",
    );
  }
}
