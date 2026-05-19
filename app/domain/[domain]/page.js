import PublicWebsitePreview from "@/components/PublicWebsitePreview";
import { normalizeDomain } from "@/lib/domains";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

function DomainNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6 text-[#111827]">
      <div className="max-w-md rounded-3xl border border-black/5 bg-[#f6f2ea] p-8 text-center">
        <h1 className="text-2xl font-semibold">Website not found.</h1>
        <p className="mt-3 text-sm leading-6 text-[#6b7280]">
          This domain is not connected to a published Nexus Builder website.
        </p>
      </div>
    </main>
  );
}

export default async function CustomDomainPage({ params }) {
  const { domain } = await params;
  const normalizedDomain = normalizeDomain(decodeURIComponent(domain));

  if (!isSupabaseConfigured || !supabase) {
    return <DomainNotFound />;
  }

  const { data: customDomain, error: domainError } = await supabase
    .from("custom_domains")
    .select("project_id,domain,status")
    .eq("domain", normalizedDomain)
    .neq("status", "removed")
    .single();

  if (domainError || !customDomain) {
    return <DomainNotFound />;
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,title,status")
    .eq("id", customDomain.project_id)
    .eq("status", "published")
    .single();

  if (projectError || !project) {
    return <DomainNotFound />;
  }

  const { data: files, error: filesError } = await supabase
    .from("project_files")
    .select("file_path,file_content")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  if (filesError || !files?.length) {
    return <DomainNotFound />;
  }

  const generatedFiles = files.map((file) => ({
    path: file.file_path,
    content: file.file_content,
  }));

  return (
    <main className="flex h-screen min-h-screen flex-col overflow-hidden bg-white">
      <PublicWebsitePreview title={project.title} files={generatedFiles} />
    </main>
  );
}
