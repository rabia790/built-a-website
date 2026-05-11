"use client";

import { useMemo, useState } from "react";
import { Code2, Sparkles } from "lucide-react";
import BuilderPanel from "@/components/BuilderPanel";
import EmptyState from "@/components/EmptyState";
import WebsitePreview from "@/components/WebsitePreview";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [instruction, setInstruction] = useState("");
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  const hasFiles = useMemo(() => {
    return Array.isArray(project?.files) && project.files.length > 0;
  }, [project]);

  async function requestJson(url, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let response;
    const requestUrl = `${url}?payload=${encodeURIComponent(
      JSON.stringify(body),
    )}`;

    try {
      response = await fetch(requestUrl, {
        method: "POST",
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("The AI request timed out. Please try again.");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || "Something went wrong. Please try again.");
    }

    return payload;
  }

  async function handleGenerate() {
    setError("");
    setNotice("");

    if (!prompt.trim()) {
      setError("Enter a website idea before generating.");
      return;
    }

    setLoadingAction("generate");
    try {
      const nextProject = await requestJson("/api/generate-website", {
        prompt: prompt.trim(),
      });
      setProject(nextProject);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction("");
    }
  }

  async function handleEdit() {
    setError("");
    setNotice("");

    if (!instruction.trim()) {
      setError("Enter an edit instruction before applying changes.");
      return;
    }

    if (!hasFiles) {
      setError("Generate a website before requesting edits.");
      return;
    }

    setLoadingAction("edit");
    try {
      const updatedProject = await requestJson("/api/edit-website", {
        instruction: instruction.trim(),
        currentFiles: project.files,
      });
      setProject(updatedProject);
      setInstruction("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction("");
    }
  }

  async function handleSave() {
    setError("");
    setNotice("");

    if (!hasFiles) {
      setError("Generate a website before saving a project.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase is not configured yet. Add your keys in .env.local.");
      return;
    }

    setLoadingAction("save");
    try {
      const now = new Date().toISOString();
      const { data: savedProject, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: project.title || "Untitled website",
          original_prompt: prompt.trim(),
          updated_at: now,
        })
        .select("id")
        .single();

      if (projectError) {
        throw projectError;
      }

      const files = project.files.map((file) => ({
        project_id: savedProject.id,
        file_path: file.path,
        file_content: file.content,
        updated_at: now,
      }));

      const { error: filesError } = await supabase
        .from("project_files")
        .insert(files);

      if (filesError) {
        throw filesError;
      }

      setNotice("Project saved to Supabase.");
    } catch (err) {
      setError(err.message || "Supabase could not save this project.");
    } finally {
      setLoadingAction("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-sm font-medium text-indigo-700 shadow-sm">
              <Sparkles className="size-4" />
              Prompt to production-ready starter
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              AI Website Builder
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Generate a React and Tailwind website, iterate with AI prompts,
              preview it live, and save the project files to Supabase.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
            <Code2 className="size-4 text-indigo-600" />
            Next.js + iframe preview
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          <BuilderPanel
            prompt={prompt}
            instruction={instruction}
            loadingAction={loadingAction}
            hasFiles={hasFiles}
            error={error}
            notice={notice}
            onPromptChange={setPrompt}
            onInstructionChange={setInstruction}
            onGenerate={handleGenerate}
            onEdit={handleEdit}
            onSave={handleSave}
          />

          {hasFiles ? (
            <WebsitePreview files={project.files} title={project.title} />
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </main>
  );
}
