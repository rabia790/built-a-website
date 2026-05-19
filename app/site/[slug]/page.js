import Link from "next/link";
import PublicWebsitePreview from "@/components/PublicWebsitePreview";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

function SiteNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f2ea] p-6 text-[#111827]">
      <div className="max-w-md rounded-3xl border border-black/5 bg-white p-8 text-center shadow-[0_24px_70px_rgba(42,31,18,0.12)]">
        <h1 className="text-2xl font-semibold">Website not found or unpublished.</h1>
        <p className="mt-3 text-sm leading-6 text-[#6b7280]">
          This live website is unavailable. It may not be published yet, or it
          may have been unpublished by the owner.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-full bg-[#111827] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-black"
        >
          Back to Builder
        </Link>
      </div>
    </main>
  );
}

export default async function LiveSitePage({ params }) {
  const { slug } = await params;

  if (!isSupabaseConfigured || !supabase) {
    return <SiteNotFound />;
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,title,slug,status")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (projectError || !project) {
    return <SiteNotFound />;
  }

  const { data: files, error: filesError } = await supabase
    .from("project_files")
    .select("file_path,file_content")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  if (filesError || !files?.length) {
    return <SiteNotFound />;
  }

  const generatedFiles = files.map((file) => ({
    path: file.file_path,
    content: file.file_content,
  }));

  return (
    <main className="flex h-screen min-h-screen flex-col overflow-hidden bg-white">
      <header className="flex h-9 shrink-0 items-center justify-end border-b border-black/5 bg-white/95 px-4 text-xs text-[#6b7280] backdrop-blur">
        Built with Nexus Builder
      </header>
      <PublicWebsitePreview title={project.title} files={generatedFiles} />
    </main>
  );
}
