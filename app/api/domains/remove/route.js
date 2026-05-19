import {
  assertVercelConfigured,
  getVercelHeaders,
  getVercelTeamQuery,
  isValidDomain,
  normalizeDomain,
} from "@/lib/domains";
import { serverSupabase } from "@/lib/serverSupabase";

async function removeDomainFromVercel(domain) {
  assertVercelConfigured();

  const response = await fetch(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(
      process.env.VERCEL_PROJECT_ID,
    )}/domains/${encodeURIComponent(domain)}${getVercelTeamQuery()}`,
    {
      method: "DELETE",
      headers: getVercelHeaders(),
    },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok && response.status !== 404) {
    throw new Error(data.error?.message || data.message || "Vercel could not remove this domain.");
  }
}

export async function POST(request) {
  if (!serverSupabase) {
    return Response.json(
      { error: "Supabase is not configured yet. Add your keys in .env.local." },
      { status: 500 },
    );
  }

  try {
    const { domain } = await request.json();
    const normalizedDomain = normalizeDomain(domain);

    if (!isValidDomain(normalizedDomain)) {
      return Response.json({ error: "Enter a valid domain name." }, { status: 400 });
    }

    await removeDomainFromVercel(normalizedDomain);

    const { error: updateError } = await serverSupabase
      .from("custom_domains")
      .update({ status: "removed", verification_status: "removed" })
      .eq("domain", normalizedDomain);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return Response.json({
      success: true,
      domain: normalizedDomain,
      status: "removed",
      verificationStatus: "removed",
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not remove this domain." },
      { status: 500 },
    );
  }
}
