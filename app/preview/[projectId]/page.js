import Link from "next/link";
import PublicWebsitePreview from "@/components/PublicWebsitePreview";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

function PreviewNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f2ea] p-6 text-[#111827]">
      <div className="max-w-md rounded-3xl border border-black/5 bg-white p-8 text-center shadow-[0_24px_70px_rgba(42,31,18,0.12)]">
        <h1 className="text-2xl font-semibold">Preview not found</h1>
        <p className="mt-3 text-sm leading-6 text-[#6b7280]">
          This project could not be loaded. It may have been deleted or
          Supabase is not configured for public reads.
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

export default async function PublicPreviewPage({ params }) {
  const { projectId } = await params;

  if (!isSupabaseConfigured || !supabase) {
    return <PreviewNotFound />;
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,title,original_prompt")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return <PreviewNotFound />;
  }

  const { data: files, error: filesError } = await supabase
    .from("project_files")
    .select("file_path,file_content")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  if (filesError || !files?.length) {
    return <PreviewNotFound />;
  }

  const generatedFiles = files.map((file) => ({
    path: file.file_path,
    content: file.file_content,
  }));

  return (
    <main className="flex h-screen min-h-screen flex-col overflow-hidden bg-white">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-black/5 bg-white/95 px-4 text-sm backdrop-blur">
        <div className="min-w-0">
          <p className="truncate font-medium text-[#111827]">{project.title}</p>
          <p className="hidden text-xs text-[#6b7280] sm:block">
            Built with Nexus Builder
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-8 items-center rounded-full border border-black/5 bg-[#f6f2ea] px-3 text-xs font-medium text-[#111827] transition-shadow duration-150 hover:shadow-md"
        >
          Back to Builder
        </Link>
      </header>
      <PublicWebsitePreview title={project.title} files={generatedFiles} />
    </main>
  );
}
