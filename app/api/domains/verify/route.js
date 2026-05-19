import {
  assertVercelConfigured,
  getVercelHeaders,
  getVercelTeamQuery,
  isValidDomain,
  normalizeDomain,
} from "@/lib/domains";
import { serverSupabase } from "@/lib/serverSupabase";

async function verifyDomainWithVercel(domain) {
  assertVercelConfigured();

  const response = await fetch(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(
      process.env.VERCEL_PROJECT_ID,
    )}/domains/${encodeURIComponent(domain)}/verify${getVercelTeamQuery()}`,
    {
      method: "POST",
      headers: getVercelHeaders(),
    },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      verified: false,
      data,
      message: data.error?.message || data.message || "Domain is not verified yet.",
    };
  }

  return {
    verified: Boolean(data.verified || data.configuredBy || data.name),
    data,
    message: "Domain verified.",
  };
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

    const result = await verifyDomainWithVercel(normalizedDomain);
    const verificationStatus = result.verified ? "verified" : "pending";

    const { error: updateError } = await serverSupabase
      .from("custom_domains")
      .update({ verification_status: verificationStatus })
      .eq("domain", normalizedDomain);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return Response.json({
      success: true,
      domain: normalizedDomain,
      verified: result.verified,
      verificationStatus,
      message: result.message,
      vercel: result.data,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not verify this domain." },
      { status: 500 },
    );
  }
}
