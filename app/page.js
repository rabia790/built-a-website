"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import {
  Code2,
  ExternalLink,
  Eye,
  History,
  Link as LinkIcon,
  Loader2,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Smartphone,
  Tablet,
  Undo2,
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

const previewDevices = [
  { label: "Desktop", value: "desktop", icon: Monitor },
  { label: "Tablet", value: "tablet", icon: Tablet },
  { label: "Mobile", value: "mobile", icon: Smartphone },
];

const zoomOptions = ["Fit", "100%", "75%"];

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

function createVersionSnapshot(project, label) {
  return {
    id: crypto.randomUUID(),
    label,
    title: project?.title || "Untitled website",
    files: project?.files || [],
    category: project?.category || "",
    templateVariant: project?.templateVariant || "",
    designSeed: project?.designSeed || "",
    imageSetUsed: project?.imageSetUsed || [],
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

function getFileContent(files = [], acceptedPaths = []) {
  return files.find((file) => acceptedPaths.includes(file.path))?.content || "";
}

function extractImageSources(files = []) {
  const appCode = getFileContent(files, ["/App.js", "App.js", "/App.jsx"]);
  const cssCode = getFileContent(files, ["/styles.css", "styles.css", "/src/styles.css"]);
  const combined = `${appCode}\n${cssCode}`;
  const sources = new Set();
  const patterns = [
    /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
    /src\s*:\s*["']([^"']+)["']/gi,
    /backgroundImage\s*:\s*["']url\(([^)]+)\)["']/gi,
    /backgroundImage\s*:\s*\{\s*["'`]url\(([^)]+)\)["'`]\s*\}/gi,
    /background-image\s*:\s*url\((['"]?)([^'")]+)\1\)/gi,
    /url\((['"]?)([^'")]+)\1\)/gi,
    /(https?:\/\/images\.unsplash\.com\/[^"'`\s)]+)/gi,
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(combined);
    while (match) {
      const value = (match[2] || match[1] || "").trim().replace(/^['"`]|['"`]$/g, "");
      const isLikelyImage =
        /^https?:\/\/images\.unsplash\.com\//i.test(value) ||
        /\.(jpg|jpeg|png|webp|avif|svg)(\?|$)/i.test(value) ||
        value.startsWith("/");

      if (value && isLikelyImage) {
        sources.add(value);
      }
      match = pattern.exec(combined);
    }
  }

  return [...sources].map((src) => ({
    src,
    isRemote: /^https?:\/\//i.test(src),
    isLocal: src.startsWith("/"),
  }));
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
  const [sidePanelTab, setSidePanelTab] = useState("links");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [previewZoom, setPreviewZoom] = useState("Fit");
  const [versionHistory, setVersionHistory] = useState([]);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [isCommandExpanded, setIsCommandExpanded] = useState(false);

  const hasFiles = useMemo(() => {
    return Array.isArray(project?.files) && project.files.length > 0;
  }, [project]);

  const imageSources = useMemo(
    () => extractImageSources(project?.files || []),
    [project?.files],
  );
  const currentCodeSize = useMemo(
    () =>
      (project?.files || []).reduce(
        (total, file) => total + String(file.content || "").length,
        0,
      ),
    [project?.files],
  );
  const showLargeEditWarning = hasFiles && currentCodeSize > 45000;
  const filteredHistory = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    if (!query) return history;

    return history.filter((item) =>
      `${item.title || ""} ${item.prompt || ""}`.toLowerCase().includes(query),
    );
  }, [history, projectSearch]);

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
  const projectStatus = domainConnection?.verified
    ? "Custom domain verified"
    : domainConnection?.domain
      ? "Custom domain pending"
      : effectiveLiveUrl
        ? "Published"
        : currentProjectId || effectivePreviewUrl
          ? "Saved"
          : hasFiles
            ? "Draft"
            : "Draft";

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

  function pushVersionSnapshot(nextProject, label) {
    if (!nextProject?.files?.length) return;

    const snapshot = createVersionSnapshot(nextProject, label);
    setVersionHistory((current) => [snapshot, ...current].slice(0, 15));
  }

  function restoreVersion(version) {
    if (!version?.files?.length) {
      setError("That version does not include website files.");
      return;
    }

    const restoredProject = {
      ...(project || {}),
      title: version.title,
      files: version.files,
      category: version.category,
      templateVariant: version.templateVariant,
      designSeed: version.designSeed,
      imageSetUsed: version.imageSetUsed,
      status: "draft",
      slug: "",
      publishedAt: "",
    };

    setProject(restoredProject);
    setPreviewUrl("");
    setLiveUrl("");
    setDomainConnection(null);
    setPreviewVersion((value) => value + 1);
    pushVersionSnapshot(restoredProject, `Restored ${version.label}`);
    setNotice(`Restored version: ${version.label}.`);
  }

  function handleUndo() {
    if (versionHistory.length < 2) {
      setError("No earlier version is available yet.");
      return;
    }

    restoreVersion(versionHistory[1]);
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
      setVersionHistory([createVersionSnapshot(nextProject, "Generated website")]);
      setIsCommandExpanded(false);
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

  async function handleEdit(instructionOverride = "") {
    console.log("Apply Edit clicked");
    setError("");
    setNotice("");
    const requestedInstruction = instructionOverride || instruction;

    if (!requestedInstruction.trim()) {
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
    const editInstruction = requestedInstruction.trim();

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
      setIsCommandExpanded(false);
      pushVersionSnapshot(updatedProject, "AI edit");
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

  function handleRegenerateSection() {
    if (!hasFiles) {
      setError("Generate a website before regenerating a section.");
      return;
    }

    handleEdit(
      instruction.trim() ||
        "Regenerate the weakest visible section with a more premium layout, stronger copy, and better spacing while preserving the current design style.",
    );
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
      const saveResponse = await fetch("/api/save-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: project.title || "Untitled website",
          originalPrompt: prompt.trim(),
          category: project.category || null,
          templateVariant: project.templateVariant || null,
          designSeed: project.designSeed || null,
          generationLogId: project.generationLogId || null,
          files: project.files,
        }),
      });

      const savePayload = await saveResponse.json().catch(() => ({}));

      if (!saveResponse.ok) {
        throw new Error(
          savePayload.error ||
            `Save failed with status ${saveResponse.status} ${saveResponse.statusText}`.trim(),
        );
      }

      const savedProject = savePayload.project;

      if (!savedProject?.id) {
        throw new Error("Save response did not include a project id.");
      }

      console.log("Saved Supabase project:", savedProject);
      console.log("Setting currentProjectId:", savedProject.id);

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
      setError(err.message || "Save failed. Supabase could not save this project.");
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
    setPreviewDevice("desktop");
    setPreviewZoom("Fit");
    setVersionHistory([]);
    setIsControlsCollapsed(true);
    setIsCommandExpanded(false);
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
        setVersionHistory([createVersionSnapshot(loadedProject, "Loaded saved project")]);
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
    const selectedProject = {
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
    };
    setProject(selectedProject);
    setVersionHistory([createVersionSnapshot(selectedProject, "Selected project")]);
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
  const statusBadgeClass =
    projectStatus === "Published" || projectStatus === "Custom domain verified"
      ? "bg-emerald-50 text-emerald-700"
      : projectStatus === "Saved"
        ? "bg-blue-50 text-[#2563eb]"
        : projectStatus === "Custom domain pending"
          ? "bg-amber-50 text-amber-700"
          : "bg-[#f7f4ef] text-[#6b7280]";

  return (
    <main className="h-screen overflow-hidden bg-[#f6f3ee] font-sans text-[#111827]">
      <div className="flex h-full">
        <aside className={`hidden shrink-0 border-r border-[#e4ded4] bg-[#fbfaf7] p-3 transition-[width] duration-150 lg:flex lg:flex-col ${isSidebarCollapsed ? "w-[56px]" : "w-[220px]"}`}>
          <div className="mb-4 flex items-center gap-2 px-1">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#111827] text-white">
              <Sparkles className="size-3.5" />
            </div>
            {!isSidebarCollapsed && <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight">Nexus Builder</h1>
              <p className="text-[11px] text-[#6b7280]">AI website studio</p>
            </div>}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((value) => !value)}
              className="ml-auto inline-flex size-7 items-center justify-center rounded-md text-[#6b7280] transition-colors duration-150 hover:bg-white hover:text-[#111827]"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mb-3 inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-[#111827] px-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-black"
            title="New Site"
          >
            <Plus className="size-3.5" />
            {!isSidebarCollapsed && "New Site"}
          </button>

          {!isSidebarCollapsed && <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a8178]">
            Recent
          </div>}

          {!isSidebarCollapsed && (
            <label className="mb-2 flex h-8 items-center gap-2 rounded-lg border border-[#e4ded4] bg-white/75 px-2 text-[#8a8178]">
              <Search className="size-3.5" />
              <input
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs text-[#111827] outline-none placeholder:text-[#9a9289]"
                placeholder="Search projects"
              />
            </label>
          )}

          <div className="min-h-0 flex-1 overflow-auto">
            {mounted && filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectHistoryItem(item)}
                  className={`group mb-0.5 flex w-full items-center gap-2 rounded-lg border-l-2 text-left transition-colors duration-150 ${isSidebarCollapsed ? "justify-center px-1 py-2" : "px-2 py-1.5"} ${
                    activeHistoryId === item.id
                      ? "border-l-[#2563eb] bg-[#f0f6ff]"
                      : "border-l-transparent hover:bg-white/80"
                  }`}
                  title={item.title}
                >
                  <span className={`size-1.5 shrink-0 rounded-full ${activeHistoryId === item.id ? "bg-[#2563eb]" : "bg-[#d8d0c5] group-hover:bg-[#9ca3af]"}`} />
                  {!isSidebarCollapsed && <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-[#111827]">
                      {item.title}
                    </span>
                    <span className="block truncate text-[10px] text-[#8a8178]">
                      {formatProjectDate(item.createdAt)}
                    </span>
                  </span>}
                </button>
              ))
            ) : (
              !isSidebarCollapsed && <p className="rounded-lg border border-dashed border-[#e4ded4] bg-white/60 p-3 text-xs leading-5 text-[#6b7280]">
                Generated projects appear here.
              </p>
            )}
          </div>
        </aside>

        <section className="flex h-full min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#e4ded4] bg-white/78 px-3 backdrop-blur md:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e4ded4] bg-white text-[#111827] lg:hidden"
                title="New site"
              >
                <Plus className="size-4" />
              </button>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="truncate text-sm font-semibold text-[#111827]">
                    {project?.title || "Untitled project"}
                  </h2>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass}`}>
                    {projectStatus}
                  </span>
                </div>
                <div className="mt-0.5 hidden items-center gap-1.5 text-[11px] text-[#8a8178] sm:flex">
                  {showDesignDebug && project?.category && (
                    <span>{project.category.replaceAll("_", " ")}</span>
                  )}
                  {showDesignDebug && project?.templateVariant && (
                    <>
                      <span>/</span>
                      <span className="truncate">{project.templateVariant.replaceAll("_", " ")}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              <div className="inline-flex rounded-lg border border-[#e4ded4] bg-[#f7f4ef] p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors duration-150 ${
                    viewMode === "preview"
                      ? "bg-white text-[#111827] shadow-sm"
                      : "text-[#6b7280] hover:text-[#111827]"
                  }`}
                >
                  <Eye className="size-3.5" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("code")}
                  className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors duration-150 ${
                    viewMode === "code"
                      ? "bg-white text-[#111827] shadow-sm"
                      : "text-[#6b7280] hover:text-[#111827]"
                  }`}
                >
                  <Code2 className="size-3.5" />
                  Code
                </button>
              </div>

              {viewMode === "preview" && (
                <div className="inline-flex rounded-lg border border-[#e4ded4] bg-[#f7f4ef] p-0.5">
                  {previewDevices.map((device) => {
                    const Icon = device.icon;
                    return (
                      <button
                        key={device.value}
                        type="button"
                        onClick={() => setPreviewDevice(device.value)}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors duration-150 ${
                          previewDevice === device.value
                            ? "bg-white text-[#111827] shadow-sm"
                            : "text-[#6b7280] hover:text-[#111827]"
                        }`}
                        title={device.label}
                      >
                        <Icon className="size-3.5" />
                      </button>
                    );
                  })}
                </div>
              )}

              {viewMode === "preview" && (
                <div className="inline-flex rounded-lg border border-[#e4ded4] bg-[#f7f4ef] p-0.5">
                  {zoomOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPreviewZoom(option)}
                      className={`h-7 rounded-md px-2 text-xs font-semibold transition-colors duration-150 ${
                        previewZoom === option
                          ? "bg-white text-[#111827] shadow-sm"
                          : "text-[#6b7280] hover:text-[#111827]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {hasFiles && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isBusy}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e4ded4] bg-white px-2.5 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingAction === "save" ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  <span className="hidden sm:inline">{projectStatus === "Saved" || projectStatus === "Published" ? "Save Again" : "Save"}</span>
                </button>
              )}
              {hasFiles && (
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  disabled={!effectivePreviewUrl}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e4ded4] bg-white px-2.5 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ExternalLink className="size-3.5" />
                  <span className="hidden xl:inline">Preview</span>
                </button>
              )}
              {hasFiles && (
                <button
                  type="button"
                  onClick={effectiveLiveUrl ? handleOpenLiveWebsite : handlePublish}
                  disabled={isBusy || (!effectiveLiveUrl && !currentProjectId)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#111827] px-2.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingAction === "publish" ? <Loader2 className="size-3.5 animate-spin" /> : <ExternalLink className="size-3.5" />}
                  <span className="hidden sm:inline">{effectiveLiveUrl ? "Live" : "Publish"}</span>
                </button>
              )}
              {hasFiles && (
                <button
                  type="button"
                  onClick={() => setIsControlsCollapsed(false)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e4ded4] bg-white px-2.5 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#f7f4ef]"
                >
                  <PanelRightOpen className="size-3.5" />
                  <span className="hidden sm:inline">Inspector</span>
                </button>
              )}
            </div>
          </header>

          <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-[#e4ded4] bg-[#faf8f4] px-3 md:hidden">
            <div className="inline-flex rounded-lg border border-[#e4ded4] bg-white p-0.5">
              <button type="button" onClick={() => setViewMode("preview")} className={`h-7 rounded-md px-2 text-xs font-semibold ${viewMode === "preview" ? "bg-[#111827] text-white" : "text-[#6b7280]"}`}>Preview</button>
              <button type="button" onClick={() => setViewMode("code")} className={`h-7 rounded-md px-2 text-xs font-semibold ${viewMode === "code" ? "bg-[#111827] text-white" : "text-[#6b7280]"}`}>Code</button>
            </div>
            {viewMode === "preview" && (
              <div className="inline-flex rounded-lg border border-[#e4ded4] bg-white p-0.5">
                {previewDevices.map((device) => {
                  const Icon = device.icon;
                  return (
                    <button key={device.value} type="button" onClick={() => setPreviewDevice(device.value)} className={`h-7 rounded-md px-2 ${previewDevice === device.value ? "bg-[#111827] text-white" : "text-[#6b7280]"}`}>
                      <Icon className="size-3.5" />
                    </button>
                  );
                })}
              </div>
            )}
            {viewMode === "preview" && (
              <div className="inline-flex rounded-lg border border-[#e4ded4] bg-white p-0.5">
                {zoomOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPreviewZoom(option)}
                    className={`h-7 rounded-md px-2 text-[11px] font-semibold ${previewZoom === option ? "bg-[#111827] text-white" : "text-[#6b7280]"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_18%_6%,rgba(249,115,22,0.07),transparent_24%),radial-gradient(circle_at_86%_12%,rgba(37,99,235,0.06),transparent_24%)]">
            <div className={`absolute inset-0 flex flex-col p-3 ${hasFiles && !isCommandExpanded ? "pb-16" : "pb-24"}`}>
              <div className="min-h-0 flex-1">
                {loadingAction === "generate" || loadingAction === "load" ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-[#e4ded4] bg-white/88">
                    <div className="max-w-sm text-center">
                      <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-xl bg-[#111827] text-white">
                        <Loader2 className="size-4 animate-spin" />
                      </div>
                      <h3 className="text-base font-semibold text-[#111827]">
                        {loadingAction === "load" ? "Loading saved project..." : "Designing your website..."}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                        Creating layout, copy, and responsive React code.
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
                    device={previewDevice}
                    zoom={previewZoom}
                    fill
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <EmptyState
                      examples={promptExamples}
                      onSelect={(example) => setPrompt(examplePrompts[example] || example)}
                    />
                  </div>
                )}
              </div>

              {(error || notice) && (
                <div className={`pointer-events-none absolute inset-x-3 z-30 flex justify-center ${hasFiles && !isCommandExpanded ? "bottom-[64px]" : "bottom-[118px]"}`}>
                  <div className={`pointer-events-auto max-w-xl rounded-lg border px-3 py-2 text-xs font-medium shadow-sm ${
                      error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}>
                    {error || notice}
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex justify-center">
                <div className={`pointer-events-auto w-full border border-[#ded8ce] bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,0.12)] backdrop-blur transition-all duration-150 ${
                  hasFiles && !isCommandExpanded
                    ? "max-w-xl rounded-full p-1.5"
                    : "max-w-4xl rounded-xl p-2"
                }`}>
                  {hasFiles && !isCommandExpanded ? (
                    <button
                      type="button"
                      onClick={() => setIsCommandExpanded(true)}
                      className="flex h-10 w-full items-center justify-between gap-3 rounded-full px-3 text-left text-sm text-[#6b7280] transition-colors duration-150 hover:bg-[#faf8f4]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Wand2 className="size-4 shrink-0 text-[#111827]" />
                        <span className="truncate">Ask AI to edit...</span>
                      </span>
                      <span className="rounded-full bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white">
                        Open
                      </span>
                    </button>
                  ) : (
                    <>
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="website-command" className="sr-only">
                        AI command
                      </label>
                      <textarea
                        id="website-command"
                        value={hasFiles ? instruction : prompt}
                        onChange={(event) =>
                          hasFiles
                            ? setInstruction(event.target.value)
                            : setPrompt(event.target.value)
                        }
                        onFocus={() => setIsCommandExpanded(true)}
                        rows={hasFiles ? 1 : 2}
                        className="min-h-10 w-full resize-none rounded-lg border border-[#e4ded4] bg-[#fbfaf8] px-3 py-2 text-sm leading-5 text-[#111827] outline-none transition-shadow duration-150 placeholder:text-[#9ca3af] focus:bg-white focus:shadow-[0_0_0_4px_rgba(37,99,235,0.10)]"
                        placeholder="Ask AI to build or change this site..."
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={forcedVariant}
                        onChange={(event) => setForcedVariant(event.target.value)}
                        className="h-9 rounded-lg border border-[#e4ded4] bg-white px-2.5 text-xs font-medium text-[#111827] outline-none"
                        aria-label="Design style"
                      >
                        {designStyleOptions.map((option) => (
                          <option key={option.label} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {hasFiles && (
                        <button
                          type="button"
                          onClick={() => handleEdit()}
                          disabled={isBusy || !instruction.trim()}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#111827] px-3 text-xs font-semibold text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loadingAction === "edit" ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
                          Apply Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isBusy || !prompt.trim()}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#e4ded4] bg-white px-3 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingAction === "generate" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                        Generate
                      </button>
                      {hasFiles && (
                        <button
                          type="button"
                          onClick={handleRegenerateVariation}
                          disabled={isBusy || !prompt.trim()}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-[#e4ded4] bg-white px-3 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Regenerate
                        </button>
                      )}
                      {hasFiles && (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsCommandExpanded(false)}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#e4ded4] bg-white px-2.5 text-xs font-semibold text-[#6b7280] transition-colors duration-150 hover:bg-[#f7f4ef]"
                          >
                            Collapse
                          </button>
                          <button
                            type="button"
                            onClick={handleUndo}
                            disabled={isBusy || versionHistory.length < 2}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#e4ded4] bg-white px-2.5 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-50"
                            title="Undo"
                          >
                            <Undo2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRegenerateSection}
                            disabled={isBusy}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#e4ded4] bg-white px-2.5 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-50"
                            title="Regenerate section"
                          >
                            <Sparkles className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {showLargeEditWarning && (
                    <p className="mt-1.5 text-[11px] leading-4 text-[#6b7280]">
                      Large edits may use more AI credits. Small style, logo, button, and text edits run instantly.
                    </p>
                  )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {hasFiles && !isControlsCollapsed && (
              <aside className="absolute bottom-3 right-3 top-3 z-30 w-[min(360px,calc(100vw-24px))] overflow-auto rounded-xl border border-[#ded8ce] bg-white/97 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">Project controls</p>
                        <p className="text-xs text-[#6b7280]">Links, publish, domains, feedback, assets.</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsControlsCollapsed(true)}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8e2d8] bg-white text-[#6b7280] transition-colors duration-150 hover:bg-[#faf8f4] hover:text-[#111827]"
                          title="Collapse controls"
                        >
                          <PanelRightClose className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8e2d8] bg-white text-[#6b7280] transition-colors duration-150 hover:bg-[#faf8f4] hover:text-[#111827]"
                          title="Reset project"
                        >
                          <RotateCcw className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-1 rounded-xl bg-[#f7f4ef] p-1 text-xs">
                      {["links", "publish", "domain", "versions", "feedback", "assets"].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setSidePanelTab(tab)}
                          className={`flex-1 rounded-lg px-2 py-1.5 font-semibold capitalize transition-colors duration-150 ${
                            sidePanelTab === tab
                              ? "bg-white text-[#111827] shadow-sm"
                              : "text-[#6b7280] hover:text-[#111827]"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {sidePanelTab === "links" && (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#e8e2d8] bg-[#fbfaf8] p-3">
                          <p className="text-sm font-semibold text-[#111827]">Preview link</p>
                          {effectivePreviewUrl ? (
                            <>
                              <code className="mt-2 block truncate rounded-lg bg-white px-3 py-2 text-xs text-[#6b7280] ring-1 ring-[#e8e2d8]">
                                {effectivePreviewUrl}
                              </code>
                              <div className="mt-3 flex gap-2">
                                <button type="button" onClick={handleOpenPreview} className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-lg bg-[#111827] px-3 text-xs font-semibold text-white transition-colors duration-150 hover:bg-black">
                                  <ExternalLink className="size-3.5" />
                                  Open Preview
                                </button>
                                <button type="button" onClick={handleCopyPreviewLink} className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-lg border border-[#e8e2d8] bg-white px-3 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#faf8f4]">
                                  <LinkIcon className="size-3.5" />
                                  Copy
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                              Save first to get a public preview URL.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {sidePanelTab === "publish" && (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#e8e2d8] bg-[#fbfaf8] p-3">
                          <p className="text-sm font-semibold text-[#111827]">Live website</p>
                          {effectiveLiveUrl ? (
                            <>
                              <code className="mt-2 block truncate rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-emerald-100">
                                {effectiveLiveUrl}
                              </code>
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <button type="button" onClick={handleOpenLiveWebsite} className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-[#111827] px-3 text-xs font-semibold text-white transition-colors duration-150 hover:bg-black">
                                  <ExternalLink className="size-3.5" />
                                  View Site
                                </button>
                                <button type="button" onClick={handleCopyLiveLink} className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-[#e8e2d8] bg-white px-3 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#faf8f4]">
                                  <LinkIcon className="size-3.5" />
                                  Copy
                                </button>
                                <button type="button" onClick={handleUnpublish} disabled={isBusy} className="col-span-2 inline-flex h-8 items-center justify-center rounded-lg border border-[#e8e2d8] bg-white px-3 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#faf8f4] disabled:cursor-not-allowed disabled:opacity-50">
                                  Unpublish
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="mt-2 text-xs leading-5 text-[#6b7280]">
                                Save first, then publish to create a real website URL.
                              </p>
                              <button type="button" onClick={currentProjectId ? handlePublish : handleSave} disabled={isBusy} className="mt-3 inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-[#111827] px-3 text-xs font-semibold text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">
                                {loadingAction === "publish" || loadingAction === "save" ? <Loader2 className="size-3.5 animate-spin" /> : <ExternalLink className="size-3.5" />}
                                {currentProjectId ? "Publish Website" : "Save Project"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {sidePanelTab === "domain" && (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#e8e2d8] bg-[#fbfaf8] p-3">
                          <p className="text-sm font-semibold text-[#111827]">Connect custom domain</p>
                          <p className="mt-1 text-xs leading-5 text-[#6b7280]">
                            Custom domains connect to published websites only.
                          </p>
                          <input value={domainInput} onChange={(event) => setDomainInput(event.target.value)} className="mt-3 h-9 w-full rounded-lg border border-[#e8e2d8] bg-white px-3 text-sm text-[#111827] outline-none transition-shadow duration-150 placeholder:text-[#9ca3af] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.10)]" placeholder="example.com" />
                          <div className="mt-2 grid gap-2">
                            <button type="button" onClick={handleConnectDomain} disabled={isBusy || !effectiveLiveUrl} className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-[#111827] px-3 text-xs font-semibold text-white transition-colors duration-150 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">
                              {loadingAction === "connectDomain" ? <Loader2 className="size-3.5 animate-spin" /> : <LinkIcon className="size-3.5" />}
                              Connect Domain
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button type="button" onClick={handleVerifyDomain} disabled={isBusy || !domainInput.trim()} className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-[#e8e2d8] bg-white px-3 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#faf8f4] disabled:cursor-not-allowed disabled:opacity-50">
                                Verify DNS
                              </button>
                              <button type="button" onClick={handleRemoveDomain} disabled={isBusy || !domainInput.trim()} className="inline-flex h-8 items-center justify-center rounded-lg border border-[#e8e2d8] bg-white px-3 text-xs font-semibold text-[#111827] transition-colors duration-150 hover:bg-[#faf8f4] disabled:cursor-not-allowed disabled:opacity-50">
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                        {domainConnection?.dnsInstructions && (
                          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-[#111827]">DNS instructions</p>
                              <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-[#2563eb] ring-1 ring-blue-100">
                                {domainConnection.verificationStatus || "pending"}
                              </span>
                            </div>
                            {["type", "name", "value"].map((key) => (
                              <div key={key} className="mt-2 rounded-lg bg-white p-3 text-xs">
                                <p className="capitalize text-[#6b7280]">{key}</p>
                                <p className="mt-1 break-all font-semibold text-[#111827]">
                                  {domainConnection.dnsInstructions[key]}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {sidePanelTab === "versions" && (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#e8e2d8] bg-[#fbfaf8] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-[#111827]">Version history</p>
                              <p className="mt-1 text-xs text-[#6b7280]">Local snapshots for this session.</p>
                            </div>
                            <History className="size-4 text-[#6b7280]" />
                          </div>
                          {versionHistory.length ? (
                            <div className="mt-3 space-y-2">
                              {versionHistory.map((version, index) => (
                                <button
                                  key={version.id}
                                  type="button"
                                  onClick={() => restoreVersion(version)}
                                  disabled={isBusy || index === 0}
                                  className="w-full rounded-lg border border-[#e8e2d8] bg-white p-3 text-left transition-colors duration-150 hover:bg-[#faf8f4] disabled:cursor-default disabled:opacity-70"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-xs font-semibold text-[#111827]">
                                      {version.label}
                                    </span>
                                    {index === 0 && (
                                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#2563eb]">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 truncate text-xs text-[#6b7280]">
                                    {version.title}
                                  </p>
                                  <p className="mt-1 text-[11px] text-[#9ca3af]">
                                    {formatProjectDate(version.createdAt)}
                                  </p>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm leading-6 text-[#6b7280]">
                              Generate or edit a website to create local versions.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {sidePanelTab === "feedback" && (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#e8e2d8] bg-[#fbfaf8] p-3">
                          <p className="text-sm font-semibold text-[#111827]">How is this result?</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {[
                              ["Looks good", 5],
                              ["Too basic", 2],
                              ["Wrong images", 2],
                              ["Bad colors", 2],
                              ["Not premium", 2],
                              ["Edit did not work", 1],
                            ].map(([label, rating]) => (
                              <button key={label} type="button" onClick={() => handleFeedback(label, rating)} className="rounded-lg border border-[#e8e2d8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#6b7280] transition-colors duration-150 hover:bg-[#faf8f4] hover:text-[#111827]">
                                {label}
                              </button>
                            ))}
                          </div>
                          <button type="button" onClick={handleSaveAsTemplateExample} className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg bg-[#111827] px-3 text-xs font-semibold text-white transition-colors duration-150 hover:bg-black">
                            Save as template example
                          </button>
                        </div>
                      </div>
                    )}

                    {sidePanelTab === "assets" && (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#e8e2d8] bg-[#fbfaf8] p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#111827]">Images used</p>
                            <span className="text-xs text-[#6b7280]">{imageSources.length} found</span>
                          </div>
                          {imageSources.length ? (
                            <div className="mt-3 space-y-2">
                              {imageSources.map((image) => (
                                <div key={image.src} className="flex gap-3 rounded-lg bg-white p-2 ring-1 ring-[#e8e2d8]">
                                  {image.isRemote ? (
                                    <img src={image.src} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                                  ) : (
                                    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[11px] text-red-700">
                                      Missing
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className={`text-xs font-semibold ${image.isRemote ? "text-emerald-700" : "text-red-700"}`}>
                                      {image.isRemote ? "Remote image" : "Missing local image"}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-[#6b7280]">{image.src}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm leading-6 text-[#6b7280]">
                              No image URLs found in App.js or styles.css.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </aside>
                )}
              </div>
        </section>
          </div>
    </main>
  );
}
