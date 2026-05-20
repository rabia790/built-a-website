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

const designStyleOptions = [
  { label: "Auto", value: "" },
  { label: "Editorial Luxury", value: "staging_editorial_luxury" },
  { label: "Portfolio Gallery", value: "staging_portfolio_gallery" },
  { label: "Realtor Conversion", value: "staging_realtor_conversion" },
  { label: "Minimal Boutique", value: "staging_minimal_boutique" },
];

const homeStagingVariants = designStyleOptions
  .map((option) => option.value)
  .filter(Boolean);

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
    category: project.category || "",
    templateVariant: project.templateVariant || "",
    designSeed: project.designSeed || "",
    imageSetUsed: project.imageSetUsed || [],
    slug: project.slug || "",
    status: project.status || "draft",
    publishedAt: project.publishedAt || "",
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
  const [liveUrl, setLiveUrl] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState("");
  const [domainInput, setDomainInput] = useState("");
  const [domainConnection, setDomainConnection] = useState(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [forcedVariant, setForcedVariant] = useState("");

  const hasFiles = useMemo(() => {
    return Array.isArray(project?.files) && project.files.length > 0;
  }, [project]);

  const effectivePreviewUrl =
    previewUrl ||
    (mounted && currentProjectId
      ? `${window.location.origin}/preview/${currentProjectId}`
      : "");
  const effectiveLiveUrl =
    liveUrl ||
    (mounted && project?.slug && project?.status === "published"
      ? `${window.location.origin}/site/${project.slug}`
      : "");

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
            category: "",
            templateVariant: "",
            designSeed: "",
            imageSetUsed: [],
            slug: "",
            status: "draft",
            publishedAt: "",
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

    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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

  async function handleGenerate(options = {}) {
    setError("");
    setNotice("");

    if (!prompt.trim()) {
      setError("Describe the website you want to build.");
      return;
    }

    setLoadingAction("generate");
    setViewMode("preview");
    setPreviewUrl("");
    setLiveUrl("");
    setCurrentProjectId("");
    setDomainConnection(null);
    try {
      const designSeed = crypto.randomUUID();
      const requestedVariant =
        options.forcedVariant === undefined ? forcedVariant : options.forcedVariant;
      const nextProject = await requestJson("/api/generate-website", {
        prompt: prompt.trim(),
        websiteType: "home_staging",
        designSeed,
        forcedVariant: requestedVariant,
      });
      setProject(nextProject);
      setPreviewVersion((value) => value + 1);
      upsertHistory(nextProject, prompt.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAction("");
    }
  }

  function handleRegenerateVariation() {
    if (!prompt.trim()) {
      setError("Describe the website you want to build before regenerating a variation.");
      return;
    }

    const currentVariant = project?.templateVariant || "";
    const currentIndex = homeStagingVariants.indexOf(currentVariant);
    const nextVariant =
      project?.category === "home_staging" && currentIndex >= 0
        ? homeStagingVariants[(currentIndex + 1) % homeStagingVariants.length]
        : "";

    handleGenerate({ forcedVariant: nextVariant });
  }

  async function handleEdit() {
    console.log("Apply Edit clicked");
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

    const appFile = project.files.find(
      (file) =>
        file.path === "/App.js" ||
        file.path === "App.js" ||
        file.path === "/App.jsx",
    );
    const cssFile = project.files.find(
      (file) => file.path === "/styles.css" || file.path === "styles.css",
    );

    if (!appFile || !cssFile) {
      setError("Current website files must include /App.js and /styles.css.");
      return;
    }

    const previousProject = project;
    const previousTitle = project.title;
    const previousFiles = project.files;
    const editInstruction = instruction.trim();

    console.log("Instruction:", editInstruction);
    console.log("Files before edit:", previousFiles);

    setLoadingAction("edit");
    setPreviewUrl("");
    setLiveUrl("");
    setDomainConnection(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      let response;

      try {
        response = await fetch("/api/edit-website", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instruction: editInstruction,
            currentTitle: previousTitle,
            currentFiles: previousFiles,
            originalPrompt: prompt,
            prompt,
            websiteType: project.category,
            category: project.category,
            templateVariant: project.templateVariant,
            designSeed: project.designSeed,
            imageSetUsed: project.imageSetUsed,
            projectId: project.id,
          }),
          signal: controller.signal,
        });
      } catch (err) {
        if (err.name === "AbortError") {
          throw new Error("The AI edit request timed out. Please try again.");
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }

      const data = await response.json().catch(() => ({}));
      console.log("Edit API response:", data);

      if (!response.ok) {
        const details = Array.isArray(data.details) ? data.details.join(" ") : "";
        throw new Error(
          [data.message, data.error, details, "Your previous design was kept."]
            .filter(Boolean)
            .join(" "),
        );
      }

      const nextFiles = Array.isArray(data.files) ? data.files : [];
      const nextAppFile = nextFiles.find(
        (file) =>
          file.path === "/App.js" ||
          file.path === "App.js" ||
          file.path === "/App.jsx",
      );
      const nextCssFile = nextFiles.find(
        (file) => file.path === "/styles.css" || file.path === "styles.css",
      );

      if (!data.title || !nextAppFile?.content || !nextCssFile?.content) {
        throw new Error("Edit response did not include complete website files.");
      }

      const updatedProject = {
        ...project,
        ...data,
        id: project.id,
        title: data.title,
        files: nextFiles,
        category: data.category || project.category,
        templateVariant: data.templateVariant || project.templateVariant,
        designSeed: data.designSeed || project.designSeed,
        imageSetUsed: data.imageSetUsed || project.imageSetUsed,
        slug: "",
        status: "draft",
        publishedAt: "",
        generationLogId: project.generationLogId,
        editLogId: data.editLogId || project.editLogId,
      };

      setProject(updatedProject);
      setInstruction("");
      setPreviewVersion((value) => value + 1);
      setNotice(data.message || "Edit applied.");
      upsertHistory(updatedProject, prompt.trim() || "AI edit");
    } catch (err) {
      setProject(previousProject);
      setPreviewVersion((value) => value + 1);
      setError(
        err.message
          ? `Edit failed. ${err.message}`
          : "Edit failed. Your previous design was kept.",
      );
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
          status: "draft",
          category: project.category || null,
          template_variant: project.templateVariant || null,
          design_seed: project.designSeed || null,
          updated_at: now,
        })
        .select("*")
        .single();

      if (projectError) {
        throw projectError;
      }

      console.log("Saved Supabase project:", savedProject);
      console.log("Setting currentProjectId:", savedProject.id);

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

      if (project.generationLogId) {
        await supabase
          .from("generation_logs")
          .update({ project_id: savedProject.id })
          .eq("id", project.generationLogId);
      }

      const savedWithId = {
        ...project,
        id: savedProject.id,
        files: project.files,
        slug: savedProject.slug || "",
        status: savedProject.status || "draft",
        publishedAt: savedProject.published_at || "",
      };
      const nextPreviewUrl = `${window.location.origin}/preview/${savedProject.id}`;
      setError("");
      setProject(savedWithId);
      setCurrentProjectId(savedProject.id);
      setPreviewUrl(nextPreviewUrl);
      setLiveUrl("");
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
      setError("Please save the project first to create a preview link.");
      return;
    }

    await navigator.clipboard.writeText(effectivePreviewUrl);
    setNotice("Preview link copied.");
  }

  function handleOpenPreview() {
    if (!effectivePreviewUrl) {
      setError("Please save the project first to create a preview link.");
      return;
    }

    window.open(effectivePreviewUrl, "_blank", "noopener,noreferrer");
  }

  async function handlePublish() {
    setError("");
    setNotice("");

    const publishProjectId = currentProjectId || project?.id || "";
    console.log("Publishing projectId:", publishProjectId);

    if (!publishProjectId) {
      setError("Save first, then publish to create a live website URL.");
      return;
    }

    setLoadingAction("publish");

    try {
      const data = await requestJson("/api/publish-project", {
        projectId: publishProjectId,
      });
      const publishedProject = {
        ...project,
        slug: data.slug,
        status: data.status || "published",
        publishedAt: data.publishedAt || "",
      };

      setProject(publishedProject);
      setLiveUrl(data.liveUrl || `${window.location.origin}/site/${data.slug}`);
      upsertHistory(publishedProject, prompt.trim() || project.title || "Published project");
      setNotice("Your website is live.");
    } catch (err) {
      setError(err.message || "Could not publish this project.");
    } finally {
      setLoadingAction("");
    }
  }

  async function handleUnpublish() {
    setError("");
    setNotice("");

    const publishProjectId = currentProjectId || project?.id || "";

    if (!publishProjectId) {
      setError("Save the project before changing publish status.");
      return;
    }

    setLoadingAction("unpublish");

    try {
      const data = await requestJson("/api/unpublish-project", {
        projectId: publishProjectId,
      });
      const unpublishedProject = {
        ...project,
        status: data.status || "unpublished",
      };

      setProject(unpublishedProject);
      setLiveUrl("");
      setDomainConnection(null);
      upsertHistory(unpublishedProject, prompt.trim() || project.title || "Unpublished project");
      setNotice("Website unpublished.");
    } catch (err) {
      setError(err.message || "Could not unpublish this project.");
    } finally {
      setLoadingAction("");
    }
  }

  async function handleCopyLiveLink() {
    if (!effectiveLiveUrl) {
      setError("Publish the website first to create a live URL.");
      return;
    }

    await navigator.clipboard.writeText(effectiveLiveUrl);
    setNotice("Live link copied.");
  }

  function handleOpenLiveWebsite() {
    if (!effectiveLiveUrl) {
      setError("Publish the website first to create a live URL.");
      return;
    }

    window.open(effectiveLiveUrl, "_blank", "noopener,noreferrer");
  }

  async function handleConnectDomain() {
    setError("");
    setNotice("");

    const publishProjectId = currentProjectId || project?.id || "";

    if (!publishProjectId || !effectiveLiveUrl) {
      setError("Publish this website before connecting a custom domain.");
      return;
    }

    if (!domainInput.trim()) {
      setError("Enter a domain to connect.");
      return;
    }

    setLoadingAction("connectDomain");

    try {
      const data = await requestJson("/api/domains/connect", {
        projectId: publishProjectId,
        domain: domainInput.trim(),
      });
      setDomainConnection(data);
      setDomainInput(data.domain || domainInput.trim());
      setNotice(data.message || "Domain connected. Add the DNS record, then verify DNS.");
    } catch (err) {
      setError(err.message || "Could not connect this domain.");
    } finally {
      setLoadingAction("");
    }
  }

  async function handleVerifyDomain() {
    setError("");
    setNotice("");

    const domain = domainConnection?.domain || domainInput.trim();

    if (!domain) {
      setError("Connect a domain before verifying DNS.");
      return;
    }

    setLoadingAction("verifyDomain");

    try {
      const data = await requestJson("/api/domains/verify", { domain });
      setDomainConnection((current) => ({
        ...(current || {}),
        domain,
        verified: data.verified,
        verificationStatus: data.verificationStatus,
      }));
      setNotice(
        data.verified
          ? "Domain verified. Your published website can now use this domain."
          : "DNS is not verified yet. DNS changes can take a few minutes to several hours.",
      );
    } catch (err) {
      setError(err.message || "Could not verify this domain.");
    } finally {
      setLoadingAction("");
    }
  }

  async function handleRemoveDomain() {
    setError("");
    setNotice("");

    const domain = domainConnection?.domain || domainInput.trim();

    if (!domain) {
      setError("No custom domain is connected yet.");
      return;
    }

    setLoadingAction("removeDomain");

    try {
      await requestJson("/api/domains/remove", { domain });
      setDomainConnection(null);
      setDomainInput("");
      setNotice("Domain removed from this published website.");
    } catch (err) {
      setError(err.message || "Could not remove this domain.");
    } finally {
      setLoadingAction("");
    }
  }

  async function handleFeedback(feedback, rating = 3) {
    setError("");
    setNotice("");

    const logId = project?.generationLogId || project?.editLogId;

    if (!logId) {
      setError("Feedback is available after a new generation or edit is logged.");
      return;
    }

    try {
      await requestJson("/api/feedback", {
        logType: project?.editLogId ? "edit" : "generation",
        logId,
        rating,
        feedback,
      });
      setNotice("Feedback saved. Thank you.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveAsTemplateExample() {
    setError("");
    setNotice("");

    if (!hasFiles) {
      setError("Generate a website before saving an example.");
      return;
    }

    try {
      await requestJson("/api/template-example", {
        title: project.title || "Template example",
        prompt: prompt.trim() || project.title || "Saved example",
        category: project.category,
        files: project.files,
      });
      setNotice("Saved as a featured template example.");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleReset() {
    setProject(null);
    setPrompt("");
    setInstruction("");
    setActiveHistoryId("");
    setError("");
    setNotice("");
    setPreviewUrl("");
    setLiveUrl("");
    setCurrentProjectId("");
    setDomainInput("");
    setDomainConnection(null);
    setViewMode("preview");
    setPreviewVersion((value) => value + 1);
    setForcedVariant("");
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
          category: item.category || "",
          templateVariant: item.templateVariant || "",
          designSeed: item.designSeed || "",
          imageSetUsed: item.imageSetUsed || [],
          slug: item.slug || "",
          status: item.status || "draft",
          publishedAt: item.publishedAt || "",
        };

        setProject(loadedProject);
        setCurrentProjectId(loadedProject.id);
        setPreviewUrl(`${window.location.origin}/preview/${loadedProject.id}`);
        setLiveUrl(
          loadedProject.slug && loadedProject.status === "published"
            ? `${window.location.origin}/site/${loadedProject.slug}`
            : "",
        );
        setPrompt(item.prompt);
        setActiveHistoryId(item.id);
        setViewMode("preview");
        setPreviewVersion((value) => value + 1);
        setHistory((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  files: loadedProject.files,
                  category: loadedProject.category,
                  templateVariant: loadedProject.templateVariant,
                  designSeed: loadedProject.designSeed,
                  imageSetUsed: loadedProject.imageSetUsed,
                  slug: loadedProject.slug,
                  status: loadedProject.status,
                  publishedAt: loadedProject.publishedAt,
                  savedOnly: false,
                }
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
    setCurrentProjectId(nextProjectId);
    setProject({
      id: nextProjectId,
      title: item.title,
      files: item.files,
      category: item.category || "",
      templateVariant: item.templateVariant || "",
      designSeed: item.designSeed || "",
      imageSetUsed: item.imageSetUsed || [],
      slug: item.slug || "",
      status: item.status || "draft",
      publishedAt: item.publishedAt || "",
    });
    setPreviewUrl(
      nextProjectId ? `${window.location.origin}/preview/${nextProjectId}` : "",
    );
    setLiveUrl(
      item.slug && item.status === "published"
        ? `${window.location.origin}/site/${item.slug}`
        : "",
    );
    setPrompt(item.prompt);
    setActiveHistoryId(item.id);
    setViewMode("preview");
    setError("");
    setNotice("");
    setPreviewVersion((value) => value + 1);
  }

  function formatProjectDate(value) {
    if (!mounted || !value) {
      return "";
    }

    return formatTime(value);
  }

  const isBusy = Boolean(loadingAction);
  const showDesignDebug = process.env.NODE_ENV === "development";

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

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-[#6b7280]">
                    Design style
                    <select
                      value={forcedVariant}
                      onChange={(event) => setForcedVariant(event.target.value)}
                      className="h-8 rounded-full border border-black/5 bg-white px-3 text-xs text-[#111827] outline-none transition-shadow duration-150 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.10)]"
                    >
                      {designStyleOptions.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateVariation}
                    disabled={isBusy || !prompt.trim()}
                    className="inline-flex h-8 items-center justify-center rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-[#111827] shadow-sm transition-shadow duration-150 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Regenerate Variation
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
                    {effectiveLiveUrl && (
                      <button
                        type="button"
                        onClick={handleOpenLiveWebsite}
                        className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#111827] px-3 text-xs font-medium text-white shadow-sm transition-colors duration-150 hover:bg-black"
                      >
                        <ExternalLink className="size-3.5" />
                        View Published Site
                      </button>
                    )}
                    {showDesignDebug && project?.category && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#6b7280] ring-1 ring-black/5">
                        {project.category.replaceAll("_", " ")}
                      </span>
                    )}
                    {showDesignDebug && project?.templateVariant && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#6b7280] ring-1 ring-black/5">
                        {project.templateVariant.replaceAll("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Generated React landing page.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {hasFiles && (
                    effectiveLiveUrl ? (
                      <button
                        type="button"
                        onClick={handleOpenLiveWebsite}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111827] px-4 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-black"
                      >
                        <ExternalLink className="size-4" />
                        View Published Site
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={currentProjectId ? handlePublish : handleSave}
                        disabled={isBusy}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111827] px-4 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingAction === "publish" || loadingAction === "save" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ExternalLink className="size-4" />
                        )}
                        {currentProjectId ? "Publish Website" : "Save Project First"}
                      </button>
                    )
                  )}
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

              {hasFiles && effectivePreviewUrl && !effectiveLiveUrl && (
                <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white/80 p-3 shadow-sm sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111827]">
                      Save first, then publish to create a live website URL.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                      Preview links are for testing. Published sites live at
                      /site/website-slug.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isBusy || !currentProjectId}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#111827] px-4 text-xs font-medium text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingAction === "publish" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="size-3.5" />
                    )}
                    Publish Website
                  </button>
                </div>
              )}

              {effectiveLiveUrl && (
                <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 shadow-sm sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111827]">
                      Your website is live
                    </p>
                    <p className="mt-1 truncate text-xs text-emerald-700">
                      {effectiveLiveUrl}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleOpenLiveWebsite}
                      className="inline-flex h-9 items-center gap-2 rounded-full bg-[#111827] px-4 text-xs font-medium text-white transition-colors duration-150 hover:bg-black"
                    >
                      <ExternalLink className="size-3.5" />
                      View Published Site
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLiveLink}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-black/5 bg-white px-4 text-xs font-medium text-[#111827] shadow-sm transition-shadow duration-150 hover:shadow-md"
                    >
                      <LinkIcon className="size-3.5" />
                      Copy Live Link
                    </button>
                    <button
                      type="button"
                      onClick={handleUnpublish}
                      disabled={isBusy}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-black/5 bg-white px-4 text-xs font-medium text-[#111827] shadow-sm transition-shadow duration-150 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Unpublish
                    </button>
                  </div>
                </div>
              )}

              {effectiveLiveUrl && (
                <div className="rounded-2xl border border-black/5 bg-white/85 p-4 shadow-sm backdrop-blur">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-xl">
                      <p className="text-sm font-semibold text-[#111827]">
                        Connect Custom Domain
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                        Already own a domain? Connect it to this published
                        website. Custom domains connect to live sites only, not
                        preview links.
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 lg:max-w-xl">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={domainInput}
                          onChange={(event) => setDomainInput(event.target.value)}
                          className="h-10 min-w-0 flex-1 rounded-full border border-black/5 bg-[#fbfaf8] px-4 text-sm text-[#111827] outline-none transition-shadow duration-150 placeholder:text-[#9ca3af] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,99,235,0.10)]"
                          placeholder="example.com"
                        />
                        <button
                          type="button"
                          onClick={handleConnectDomain}
                          disabled={isBusy}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#111827] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loadingAction === "connectDomain" ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <LinkIcon className="size-4" />
                          )}
                          Connect Domain
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleVerifyDomain}
                          disabled={isBusy || !domainInput.trim()}
                          className="inline-flex h-9 items-center gap-2 rounded-full border border-black/5 bg-white px-4 text-xs font-medium text-[#111827] shadow-sm transition-shadow duration-150 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loadingAction === "verifyDomain" ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <ExternalLink className="size-3.5" />
                          )}
                          Verify DNS
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveDomain}
                          disabled={isBusy || !domainInput.trim()}
                          className="inline-flex h-9 items-center gap-2 rounded-full border border-black/5 bg-white px-4 text-xs font-medium text-[#111827] shadow-sm transition-shadow duration-150 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove Domain
                        </button>
                      </div>
                    </div>
                  </div>

                  {domainConnection?.dnsInstructions && (
                    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">
                            DNS instructions for {domainConnection.domain}
                          </p>
                          <p className="mt-1 text-xs text-[#6b7280]">
                            DNS changes can take a few minutes to several hours.
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#2563eb] ring-1 ring-blue-100">
                          {domainConnection.verificationStatus || "pending"}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs text-[#6b7280]">Type</p>
                          <p className="mt-1 font-semibold text-[#111827]">
                            {domainConnection.dnsInstructions.type}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs text-[#6b7280]">Name</p>
                          <p className="mt-1 font-semibold text-[#111827]">
                            {domainConnection.dnsInstructions.name}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs text-[#6b7280]">Value</p>
                          <p className="mt-1 break-all font-semibold text-[#111827]">
                            {domainConnection.dnsInstructions.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {hasFiles && !effectivePreviewUrl && (
                <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-3 shadow-sm sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111827]">
                      Save your project to generate a shareable preview link.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                      Preview links are created only after your website files
                      are saved.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isBusy}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#111827] px-4 text-xs font-medium text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="size-3.5" />
                    Save Project
                  </button>
                </div>
              )}

              {hasFiles && (
                <div className="rounded-2xl border border-black/5 bg-white/80 p-3 shadow-sm backdrop-blur">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">
                        How is this result?
                      </p>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        Your feedback improves future generations and template
                        examples.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ["Looks good", 5],
                        ["Too basic", 2],
                        ["Wrong images", 2],
                        ["Bad colors", 2],
                        ["Not premium", 2],
                        ["Edit did not work", 1],
                      ].map(([label, rating]) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => handleFeedback(label, rating)}
                          className="rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs font-medium text-[#6b7280] shadow-sm transition-shadow duration-150 hover:text-[#111827] hover:shadow-md"
                        >
                          {label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleSaveAsTemplateExample}
                        className="rounded-full bg-[#111827] px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-black"
                      >
                        Save as template example
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingAction === "generate" || loadingAction === "load" ? (
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
                  previewVersion={previewVersion}
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

                {effectiveLiveUrl && (
                  <div className="mb-3 flex flex-col gap-2 border-b border-black/5 pb-3 text-sm text-[#6b7280] lg:flex-row lg:items-center">
                    <span className="font-medium text-[#111827]">
                      Live website
                    </span>
                    <code className="min-w-0 flex-1 truncate rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                      {effectiveLiveUrl}
                    </code>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleOpenLiveWebsite}
                        className="inline-flex h-8 items-center gap-2 rounded-full bg-[#111827] px-3 text-xs font-medium text-white transition-colors duration-150 hover:bg-black"
                      >
                        <ExternalLink className="size-3.5" />
                        View Published Site
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyLiveLink}
                        className="inline-flex h-8 items-center gap-2 rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-[#111827] transition-shadow duration-150 hover:shadow-md"
                      >
                        <LinkIcon className="size-3.5" />
                        Copy Live Link
                      </button>
                      <button
                        type="button"
                        onClick={handleUnpublish}
                        disabled={isBusy}
                        className="inline-flex h-8 items-center gap-2 rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-[#111827] transition-shadow duration-150 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Unpublish
                      </button>
                    </div>
                  </div>
                )}

                {effectivePreviewUrl && !effectiveLiveUrl && (
                  <div className="mb-3 flex flex-col gap-2 rounded-2xl bg-[#fbfaf8] px-4 py-3 text-sm text-[#6b7280] lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium text-[#111827]">
                        Publish to create a real live website URL.
                      </p>
                      <p className="mt-1 text-xs">
                        Preview stays at /preview/projectId. Published sites use /site/website-slug.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isBusy || !currentProjectId}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-[#111827] px-4 text-xs font-medium text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingAction === "publish" ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="size-3.5" />
                      )}
                      Publish Website
                    </button>
                  </div>
                )}

                {!effectivePreviewUrl && (
                  <div className="mb-3 flex flex-col gap-2 rounded-2xl bg-[#fbfaf8] px-4 py-3 text-sm text-[#6b7280] lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium text-[#111827]">
                        Save first to get a public preview URL.
                      </p>
                      <p className="mt-1 text-xs">
                        Preview links are created only after your website files
                        are saved.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isBusy}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-[#111827] px-4 text-xs font-medium text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="size-3.5" />
                      Save Project
                    </button>
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
                      onClick={handleOpenLiveWebsite}
                      disabled={!effectiveLiveUrl}
                      title={
                        effectiveLiveUrl
                          ? "Open the published website"
                          : "Publish the website first"
                      }
                      className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-shadow duration-150 ${
                        effectiveLiveUrl
                          ? "bg-[#111827] text-white hover:bg-black"
                          : "cursor-not-allowed border border-black/5 bg-white text-[#9ca3af]"
                      }`}
                    >
                      <ExternalLink className="size-4" />
                      View Published Site
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
