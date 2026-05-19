import {
  assertVercelConfigured,
  getDnsInstructions,
  getVercelHeaders,
  getVercelTeamQuery,
  isValidDomain,
  normalizeDomain,
} from "@/lib/domains";
import { serverSupabase } from "@/lib/serverSupabase";

async function addDomainToVercel(domain) {
  assertVercelConfigured();

  const response = await fetch(
    `https://api.vercel.com/v10/projects/${encodeURIComponent(
      process.env.VERCEL_PROJECT_ID,
    )}/domains${getVercelTeamQuery()}`,
    {
      method: "POST",
      headers: getVercelHeaders(),
      body: JSON.stringify({ name: domain }),
    },
  );
  const data = await response.json().catch(() => ({}));

  if (!response.ok && response.status !== 409) {
    throw new Error(data.error?.message || data.message || "Vercel could not add this domain.");
  }

  return data;
}

export async function POST(request) {
  if (!serverSupabase) {
    return Response.json(
      { error: "Supabase is not configured yet. Add your keys in .env.local." },
      { status: 500 },
    );
  }

  try {
    const { projectId, domain } = await request.json();
    const normalizedDomain = normalizeDomain(domain);

    if (!projectId?.trim()) {
      return Response.json({ error: "Project id is required." }, { status: 400 });
    }

    if (!isValidDomain(normalizedDomain)) {
      return Response.json({ error: "Enter a valid domain name." }, { status: 400 });
    }

    const { data: project, error: projectError } = await serverSupabase
      .from("projects")
      .select("id,title,status")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return Response.json({ error: "Project was not found." }, { status: 404 });
    }

    if (project.status !== "published") {
      return Response.json(
        { error: "Publish this website before connecting a custom domain." },
        { status: 400 },
      );
    }

    await addDomainToVercel(normalizedDomain);

    const dnsInstructions = getDnsInstructions(normalizedDomain);
    const { data: customDomain, error: domainError } = await serverSupabase
      .from("custom_domains")
      .upsert(
        {
          project_id: project.id,
          domain: normalizedDomain,
          status: "active",
          verification_status: "pending",
          dns_instructions: dnsInstructions,
        },
        { onConflict: "domain" },
      )
      .select("*")
      .single();

    if (domainError) {
      throw new Error(domainError.message);
    }

    return Response.json({
      success: true,
      domain: customDomain.domain,
      status: customDomain.status,
      verificationStatus: customDomain.verification_status,
      dnsInstructions,
      message: "Domain connected. Add the DNS record below, then verify DNS.",
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Could not connect this domain." },
      { status: 500 },
    );
  }
}
