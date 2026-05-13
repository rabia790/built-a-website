"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Code2,
  Copy,
  ExternalLink,
  Eye,
  Link as LinkIcon,
  Loader2,
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
  "Staffing agency",
  "Home staging",
  "SaaS landing page",
  "Portfolio",
];

const examplePrompts = {
  "Staffing agency":
    "Build a modern staffing agency website for employers and job seekers",
  "Home staging":
    "Build a premium home staging agency website for luxury real estate sellers",
  "SaaS landing page":
    "Build a SaaS landing page for an AI productivity tool",
  Portfolio: "Build a refined portfolio website for a brand designer",
};

function createHistoryItem(project, originalPrompt) {
  return {
    id: project.id || crypto.randomUUID(),
    projectId: project.id || "",
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
  const [previewUrl, setPreviewUrl] = useState("");

  const hasFiles = useMemo(() => {
    return Array.isArray(project?.files) && project.files.length > 0;
  }, [project]);

  const effectivePreviewUrl =
    previewUrl ||
    (mounted && project?.id ? `${window.location.origin}/preview/${project.id}` : "");

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
            projectId: item.id,
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
    setHistory((current) => [
      item,
      ...current.filter((entry) => entry.id !== item.id),
    ].slice(0, 12));
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
    setPreviewUrl("");
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
    setPreviewUrl("");
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

      const savedWithId = {
        ...project,
        id: savedProject.id,
        files: project.files,
      };
      const nextPreviewUrl = `${window.location.origin}/preview/${savedProject.id}`;
      setProject(savedWithId);
      setPreviewUrl(nextPreviewUrl);
      upsertHistory(savedWithId, prompt.trim() || project.title || "Saved project");
      setNotice("Project saved. Preview link is ready.");
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

  async function handleCopyPreviewLink() {
    if (!effectivePreviewUrl) {
      setError("Save the project before copying a preview link.");
      return;
    }

    await navigator.clipboard.writeText(effectivePreviewUrl);
    setNotice("Preview link copied.");
  }

  function handleOpenPreview() {
    if (!effectivePreviewUrl) {
      setError("Save the project before opening a preview link.");
      return;
    }

    window.open(effectivePreviewUrl, "_blank", "noopener,noreferrer");
  }

  function handleReset() {
    setProject(null);
    setPrompt("");
    setInstruction("");
    setActiveHistoryId("");
    setError("");
    setNotice("");
    setPreviewUrl("");
    setViewMode("preview");
  }

  async function selectHistoryItem(item) {
    if (item.savedOnly) {
      setError("");
      setNotice("");
      setLoadingAction("load");

      try {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error("Supabase is not configured yet. Add your keys in .env.local.");
        }

        const { data: files, error: filesError } = await supabase
          .from("project_files")
          .select("file_path,file_content")
          .eq("project_id", item.id)
          .order("created_at", { ascending: true });

        if (filesError) {
          throw filesError;
        }

        if (!files?.length) {
          throw new Error("No generated files were found for this project.");
        }

        const loadedProject = {
          id: item.projectId || item.id,
          title: item.title,
          files: files.map((file) => ({
            path: file.file_path,
            content: file.file_content,
          })),
        };

        setProject(loadedProject);
        setPreviewUrl(`${window.location.origin}/preview/${loadedProject.id}`);
        setPrompt(item.prompt);
        setActiveHistoryId(item.id);
        setViewMode("preview");
        setHistory((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? { ...entry, files: loadedProject.files, savedOnly: false }
              : entry,
          ),
        );
      } catch (err) {
        setError(err.message || "Could not load this saved project.");
      } finally {
        setLoadingAction("");
      }
      return;
    }

    const nextProjectId = item.projectId || "";
    setProject({ id: nextProjectId, title: item.title, files: item.files });
    setPreviewUrl(
      nextProjectId ? `${window.location.origin}/preview/${nextProjectId}` : "",
    );
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
    <main className="min-h-screen overflow-hidden bg-[#f6f2ea] font-sans text-[#111827]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-black/5 bg-white/82 p-5 shadow-[12px_0_40px_rgba(42,31,18,0.04)] backdrop-blur-xl lg:flex lg:flex-col">
          <div className="mb-7">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[#111827] text-white shadow-lg shadow-slate-300/70">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight">
                  Nexus Builder
                </h1>
                <p className="text-sm text-[#6b7280]">AI website studio</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#111827] px-4 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-black"
            >
              <Plus className="size-4" />
              New Site
            </button>
          </div>

          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
            Recent projects
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
            {mounted && history.length > 0 ? (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectHistoryItem(item)}
                  className={`w-full rounded-xl border-l-[3px] px-3 py-2.5 text-left transition-colors duration-150 ${
                    activeHistoryId === item.id
                      ? "border-l-[#2563eb] border-y-transparent border-r-transparent bg-blue-50/60 shadow-sm"
                      : "border-l-transparent border-y-transparent border-r-transparent bg-transparent hover:bg-[#f7f4ef]"
                  }`}
                >
                  <div className="truncate text-sm font-semibold text-[#111827]">
                    {item.title}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6b7280]">
                    {item.prompt}
                  </p>
                  <p className="mt-2 text-[11px] text-[#6b7280]">
                    {formatProjectDate(item.createdAt)}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-black/10 bg-[#fbfaf8] p-4 text-sm leading-6 text-[#6b7280]">
                Your generated projects will appear here.
              </div>
            )}
          </div>
        </aside>

        <section className="flex h-screen min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_22%_8%,rgba(249,115,22,0.12),transparent_25%),radial-gradient(circle_at_88%_18%,rgba(37,99,235,0.08),transparent_28%)] px-4 pb-24 pt-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-full max-w-[1540px] flex-col gap-4">
              <div className="flex items-center justify-between gap-3 lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[#111827] text-white">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">Nexus Builder</p>
                    <p className="text-sm text-[#6b7280]">AI website studio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-[#111827] shadow-sm transition-shadow duration-150 hover:shadow-md"
                >
                  <Plus className="size-3.5" />
                  New
                </button>
              </div>

              <section className="rounded-[1.35rem] border border-black/5 bg-white/88 p-4 shadow-[0_16px_46px_rgba(42,31,18,0.08)] ring-1 ring-white/70 backdrop-blur sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <label
                      htmlFor="website-prompt"
                      className="text-xl font-semibold tracking-tight text-[#111827]"
                    >
                      What should we build today?
                    </label>
                    <p className="mt-1 text-sm text-[#6b7280]">
                      Describe the business, audience, pages, and visual style.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isBusy}
                    className="hidden h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#111827] px-5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
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

                <div className="flex flex-col gap-3 sm:flex-row">
                  <textarea
                    id="website-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={2}
                    className="min-h-16 flex-1 resize-none rounded-[1.1rem] border border-black/5 bg-white px-4 py-3 text-sm leading-6 text-[#111827] shadow-inner shadow-slate-100 outline-none transition-shadow duration-150 placeholder:text-[#9ca3af] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.10)]"
                    placeholder="Describe your website, business, audience, and style..."
                  />
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isBusy}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#111827] px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
                  >
                    {loadingAction === "generate" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    Generate Website
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {promptExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setPrompt(examplePrompts[example])}
                      className="rounded-full border border-black/5 bg-white px-3.5 py-1.5 text-xs font-medium text-[#6b7280] shadow-sm transition-shadow duration-150 hover:text-[#111827] hover:shadow-md"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                {(error || notice) && (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                      error
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {error || notice}
                  </div>
                )}
              </section>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-[#111827]">
                      {project?.title || "Untitled project"}
                    </h2>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#2563eb]">
                      Live preview
                    </span>
                    {effectivePreviewUrl && (
                      <button
                        type="button"
                        onClick={handleOpenPreview}
                        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-[#111827] shadow-sm transition-shadow duration-150 hover:shadow-md"
                      >
                        <ExternalLink className="size-3.5" />
                        Open Preview
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Generated React landing page.
                  </p>
                </div>
                <div className="inline-flex rounded-full border border-black/5 bg-white/85 p-1 shadow-sm backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setViewMode("preview")}
                    className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ${
                      viewMode === "preview"
                        ? "bg-[#111827] text-white"
                        : "text-[#6b7280] hover:bg-[#f7f4ef] hover:text-[#111827]"
                    }`}
                  >
                    <Eye className="size-4" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("code")}
                    className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ${
                      viewMode === "code"
                        ? "bg-[#111827] text-white"
                        : "text-[#6b7280] hover:bg-[#f7f4ef] hover:text-[#111827]"
                    }`}
                  >
                    <Code2 className="size-4" />
                    Code
                  </button>
                </div>
              </div>

              {effectivePreviewUrl && (
                <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 shadow-sm sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111827]">
                      Preview link
                    </p>
                    <p className="mt-1 truncate text-xs text-[#2563eb]">
                      {effectivePreviewUrl}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleOpenPreview}
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-[#111827] px-4 text-xs font-medium text-white transition-colors duration-150 hover:bg-black"
                    >
                      <ExternalLink className="size-3.5" />
                      Open Preview
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPreviewLink}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-black/5 bg-white px-4 text-xs font-medium text-[#111827] shadow-sm transition-shadow duration-150 hover:shadow-md"
                    >
                      <LinkIcon className="size-3.5" />
                      Copy Link
                    </button>
                  </div>
                </div>
              )}

              {isBusy ? (
                <div className="flex h-[calc(100vh-285px)] min-h-[520px] items-center justify-center rounded-[1.5rem] border border-black/5 bg-white/86 p-6 shadow-[0_24px_70px_rgba(42,31,18,0.09)] ring-1 ring-white/70 backdrop-blur">
                  <div className="max-w-sm text-center">
                    <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#111827] text-white shadow-lg shadow-slate-300/70">
                      <Loader2 className="size-5 animate-spin" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#111827]">
                      {loadingAction === "load"
                        ? "Loading saved project..."
                        : "Designing your website..."}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                      Creating brand direction, copy, layout, and React code.
                    </p>
                  </div>
                </div>
              ) : hasFiles ? (
                <WebsitePreview
                  files={project.files}
                  title={project.title}
                  viewMode={viewMode}
                  onCopyCode={handleCopyCode}
                />
              ) : (
                <EmptyState
                  examples={promptExamples}
                  onSelect={(example) => setPrompt(examplePrompts[example] || example)}
                />
              )}
            </div>
          </div>

          {hasFiles && (
            <div className="bg-transparent px-4 pb-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1540px] rounded-[1.35rem] border border-black/5 bg-white/90 p-3 shadow-[0_18px_55px_rgba(42,31,18,0.11)] backdrop-blur">
                {effectivePreviewUrl && (
                  <div className="mb-3 flex flex-col gap-2 border-b border-black/5 pb-3 text-sm text-[#6b7280] lg:flex-row lg:items-center">
                    <span className="font-medium text-[#111827]">
                      Preview link
                    </span>
                    <code className="min-w-0 flex-1 truncate rounded-full bg-[#fbfaf8] px-3 py-1 text-xs text-[#6b7280]">
                      {effectivePreviewUrl}
                    </code>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleOpenPreview}
                        className="inline-flex h-8 items-center gap-2 rounded-full bg-[#111827] px-3 text-xs font-medium text-white transition-colors duration-150 hover:bg-black"
                      >
                        <ExternalLink className="size-3.5" />
                        Open Preview
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyPreviewLink}
                        className="inline-flex h-8 items-center gap-2 rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-[#111827] transition-shadow duration-150 hover:shadow-md"
                      >
                        <LinkIcon className="size-3.5" />
                        Copy Link
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <input
                    value={instruction}
                    onChange={(event) => setInstruction(event.target.value)}
                    className="h-10 flex-1 rounded-full border border-black/5 bg-[#fbfaf8] px-5 text-sm text-[#111827] outline-none transition-shadow duration-150 placeholder:text-[#9ca3af] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,99,235,0.10)]"
                    placeholder="Ask AI to refine this website..."
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleEdit}
                      disabled={isBusy}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111827] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Wand2 className="size-4" />
                      Apply Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isBusy}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-black/5 bg-white px-4 text-sm font-medium text-[#111827] transition-shadow duration-150 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="size-4" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-black/5 bg-white px-4 text-sm font-medium text-[#111827] transition-shadow duration-150 hover:shadow-md"
                    >
                      <Copy className="size-4" />
                      Copy Code
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-black/5 bg-white px-4 text-sm font-medium text-[#111827] transition-shadow duration-150 hover:shadow-md"
                    >
                      <RotateCcw className="size-4" />
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
