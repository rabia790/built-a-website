"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Code2,
  Copy,
  Eye,
  Loader2,
  PanelLeft,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import WebsitePreview from "@/components/WebsitePreview";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

const promptExamples = [
  "Build a premium home staging agency website for luxury real estate sellers",
  "Build a modern staffing agency website for employers and job seekers",
  "Build a SaaS landing page for an AI productivity tool",
  "Build a luxury wedding photography website in Toronto",
  "Build a clean restaurant website with menu, gallery, and reservations",
  "Build a refined portfolio website for a brand designer",
];

const loadingSteps = [
  "Understanding business",
  "Creating brand direction",
  "Building layout",
  "Writing code",
];

function createHistoryItem(project, originalPrompt) {
  return {
    id: crypto.randomUUID(),
    title: project.title || "Untitled website",
    prompt: originalPrompt,
    files: project.files || [],
    createdAt: new Date().toISOString(),
  };
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [instruction, setInstruction] = useState("");
  const [project, setProject] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState("");
  const [viewMode, setViewMode] = useState("preview");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  const hasFiles = useMemo(() => {
    return Array.isArray(project?.files) && project.files.length > 0;
  }, [project]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);

      try {
        const saved = localStorage.getItem("ai-builder-history");
        if (saved) {
          setHistory(JSON.parse(saved));
        }
      } catch {
        setHistory([]);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("ai-builder-history", JSON.stringify(history));
    }
  }, [history, mounted]);

  useEffect(() => {
    async function loadSupabaseProjects() {
      if (!isSupabaseConfigured || !supabase) {
        return;
      }

      const { data, error: loadError } = await supabase
        .from("projects")
        .select("id,title,original_prompt,created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      if (loadError || !data?.length) {
        return;
      }

      setHistory((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const saved = data
          .filter((item) => !existingIds.has(item.id))
          .map((item) => ({
            id: item.id,
            title: item.title,
            prompt: item.original_prompt || "Saved project",
            files: [],
            createdAt: item.created_at,
            savedOnly: true,
          }));
        return [...saved, ...current].slice(0, 12);
      });
    }

    loadSupabaseProjects();
  }, []);

  async function requestJson(url, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
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

  function upsertHistory(nextProject, originalPrompt) {
    const item = createHistoryItem(nextProject, originalPrompt);
    setActiveHistoryId(item.id);
    setHistory((current) => [item, ...current].slice(0, 12));
  }

  async function handleGenerate() {
    setError("");
    setNotice("");

    if (!prompt.trim()) {
      setError("Describe the website you want to build.");
      return;
    }

    setLoadingAction("generate");
    setViewMode("preview");
    try {
      const nextProject = await requestJson("/api/generate-website", {
        prompt: prompt.trim(),
      });
      setProject(nextProject);
      upsertHistory(nextProject, prompt.trim());
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
      upsertHistory(updatedProject, prompt.trim() || "AI edit");
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

  async function handleCopyCode() {
    if (!hasFiles) {
      setError("Generate a website before copying code.");
      return;
    }

    const text = project.files
      .map((file) => `${file.path}\n\n${file.content}`)
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(text);
    setNotice("Code copied to clipboard.");
  }

  function handleReset() {
    setProject(null);
    setPrompt("");
    setInstruction("");
    setActiveHistoryId("");
    setError("");
    setNotice("");
    setViewMode("preview");
  }

  function selectHistoryItem(item) {
    if (item.savedOnly) {
      setNotice("Saved project metadata loaded. File loading is not wired for saved projects yet.");
      return;
    }

    setProject({ title: item.title, files: item.files });
    setPrompt(item.prompt);
    setActiveHistoryId(item.id);
    setViewMode("preview");
    setError("");
    setNotice("");
  }

  function formatProjectDate(value) {
    if (!mounted || !value) {
      return "";
    }

    return formatTime(value);
  }

  const isBusy = Boolean(loadingAction);

  return (
    <main className="min-h-screen bg-[#090b16] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/80 p-4 lg:flex lg:flex-col">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Nexus Builder
              </h1>
              <p className="text-xs text-slate-400">AI website studio</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mb-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-slate-950 transition hover:bg-indigo-50"
          >
            <Plus className="size-4" />
            New Project
          </button>

          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <PanelLeft className="size-4" />
            History
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
            {mounted && history.length > 0 ? (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectHistoryItem(item)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    activeHistoryId === item.id
                      ? "border-indigo-400 bg-indigo-500/15"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="truncate text-sm font-semibold text-white">
                    {item.title}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                    {item.prompt}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {formatProjectDate(item.createdAt)}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm leading-6 text-slate-500">
                Your generated projects will appear here.
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-white/10 bg-[#0d1020]/95 px-4 py-4 shadow-2xl shadow-black/20 sm:px-6">
            <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 pr-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/15"
                    placeholder="Describe the website you want to build..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isBusy}
                  className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingAction === "generate" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {loadingAction === "generate"
                    ? "Designing..."
                    : "Generate Website"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {promptExamples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-indigo-400/60 hover:bg-indigo-500/10 hover:text-white"
                  >
                    {example.replace("Build a ", "")}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4 xl:flex-row xl:items-center">
                <input
                  value={instruction}
                  onChange={(event) => setInstruction(event.target.value)}
                  className="h-11 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
                  placeholder="Ask AI to change this website..."
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleEdit}
                    disabled={isBusy || !hasFiles}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Wand2 className="size-4" />
                    Apply Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isBusy || !hasFiles}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save className="size-4" />
                    Save Project
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    disabled={!hasFiles}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Copy className="size-4" />
                    Copy Code
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
                  >
                    <RotateCcw className="size-4" />
                    Reset
                  </button>
                </div>
              </div>

              {(error || notice) && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    error
                      ? "border-red-400/30 bg-red-500/10 text-red-200"
                      : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {error || notice}
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto px-4 py-5 sm:px-6">
            <div className="mx-auto max-w-[1500px]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {project?.title || "Untitled project"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Preview-first builder with editable AI commands.
                  </p>
                </div>
                <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("preview")}
                    className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                      viewMode === "preview"
                        ? "bg-white text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Eye className="size-4" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("code")}
                    className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                      viewMode === "code"
                        ? "bg-white text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Code2 className="size-4" />
                    Code
                  </button>
                </div>
              </div>

              {isBusy ? (
                <div className="flex h-[calc(100vh-270px)] min-h-[560px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04]">
                  <div className="max-w-md text-center">
                    <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/30">
                      <Loader2 className="size-7 animate-spin" />
                    </div>
                    <h3 className="text-2xl font-semibold">
                      Designing your website...
                    </h3>
                    <div className="mt-6 grid gap-3 text-left">
                      {loadingSteps.map((step, index) => (
                        <div
                          key={step}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300"
                        >
                          <span className="flex size-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs text-indigo-200">
                            {index + 1}
                          </span>
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : hasFiles ? (
                <WebsitePreview
                  files={project.files}
                  title={project.title}
                  viewMode={viewMode}
                />
              ) : (
                <EmptyState examples={promptExamples} onSelect={setPrompt} />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
