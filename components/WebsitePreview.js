"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useRef, useState } from "react";
import { Copy } from "lucide-react";

function sanitizeCode(content = "") {
  return String(content || "")
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/```jsx/g, "")
    .replace(/```js/g, "")
    .replace(/```javascript/g, "")
    .replace(/```css/g, "")
    .replace(/```/g, "")
    .replace(/^\s*jsx\s*/i, "")
    .replace(/^\s*javascript\s*/i, "")
    .replace(/^\s*css\s*/i, "")
    .trim();
}

function stripUnsupportedAppSyntax(content = "") {
  return sanitizeCode(content)
    .replace(/^import\s+.*?;?\s*$/gm, "")
    .replace(/export\s+default\s+App\s*;?/g, "")
    .replace(/export\s+default\s+function\s+App\s*\(/g, "function App(")
    .replace(/export\s+default\s+function\s*\(/g, "function App(")
    .trim();
}

function getGeneratedCode(files) {
  const appFile =
    files.find((file) => file.path === "/App.js") ||
    files.find((file) => file.path === "/App.jsx") ||
    files.find((file) => file.path === "/src/App.jsx");
  const stylesFile =
    files.find((file) => file.path === "/styles.css") ||
    files.find((file) => file.path === "styles.css") ||
    files.find((file) => file.path === "/src/styles.css");

  return {
    appCode:
      stripUnsupportedAppSyntax(appFile?.content) ||
      "function App() { return <main className=\"p-8\">No website generated yet.</main>; }",
    cssCode:
      sanitizeCode(stylesFile?.content) ||
      "body { margin: 0; font-family: Inter, system-ui, sans-serif; }",
  };
}

function buildSrcDoc(appCode, cssCode) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>${cssCode}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      window.addEventListener("error", function(event) {
        const root = document.getElementById("root");
        root.innerHTML = '<pre style="white-space:pre-wrap;margin:0;padding:24px;color:#991b1b;background:#fef2f2;font-family:ui-monospace,Menlo,monospace;">' + event.message + '</pre>';
      });

      try {
${appCode}

        if (typeof App !== "function") {
          throw new Error("Generated code must define function App().");
        }

        ReactDOM.createRoot(document.getElementById("root")).render(<App />);
      } catch (error) {
        document.getElementById("root").innerHTML =
          '<pre style="white-space:pre-wrap;margin:0;padding:24px;color:#991b1b;background:#fef2f2;font-family:ui-monospace,Menlo,monospace;">' +
          (error && error.stack ? error.stack : error.message) +
          '</pre>';
      }
    </script>
  </body>
</html>`;
}

function extractImageSources(appCode) {
  const sources = new Set();
  const patterns = [
    /src\s*=\s*["']([^"']+)["']/gi,
    /backgroundImage\s*:\s*["']url\(([^)]+)\)["']/gi,
    /url\((['"]?)([^'")]+)\1\)/gi,
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(appCode);
    while (match) {
      const value = (match[2] || match[1] || "").trim().replace(/^['"]|['"]$/g, "");
      const isLikelyImage =
        /^https?:\/\/images\.unsplash\.com\//i.test(value) ||
        /\.(jpg|jpeg|png|webp|avif|svg)(\?|$)/i.test(value) ||
        value.startsWith("/");

      if (value && isLikelyImage) {
        sources.add(value);
      }
      match = pattern.exec(appCode);
    }
  }

  return [...sources].map((src) => ({
    src,
    isRemote: /^https?:\/\//i.test(src),
    isLocal: src.startsWith("/"),
  }));
}

export default function WebsitePreview({
  files,
  title,
  viewMode = "preview",
  onCopyCode,
  previewVersion = 0,
}) {
  const [activeTab, setActiveTab] = useState("app");
  const { appCode, cssCode } = useMemo(() => getGeneratedCode(files), [files]);
  const srcDoc = useMemo(() => buildSrcDoc(appCode, cssCode), [appCode, cssCode]);
  const imageSources = useMemo(() => extractImageSources(appCode), [appCode]);
  const activeCode = activeTab === "app" ? appCode : cssCode;
  const iframeRef = useRef(null);
  const previewKey = useMemo(
    () =>
      `${title || "preview"}-${previewVersion}-${appCode.length}-${cssCode.length}`,
    [appCode, cssCode, previewVersion, title],
  );

  function handlePreviewLoad() {
    try {
      iframeRef.current?.contentWindow?.scrollTo(0, 0);
    } catch {
      // Cross-origin protection can block access in some browsers.
    }
  }

  return (
    <section className="min-w-0">
      {viewMode === "preview" ? (
        <div className="space-y-4">
          <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[1.35rem] border border-black/5 bg-white/85 shadow-[0_24px_70px_rgba(42,31,18,0.14)] ring-1 ring-white/70 backdrop-blur">
            <div className="flex h-9 items-center justify-between border-b border-black/5 bg-[#fbfaf8] px-4">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#ef4444]" />
                <span className="size-2.5 rounded-full bg-[#f59e0b]" />
                <span className="size-2.5 rounded-full bg-[#10b981]" />
              </div>
              <div className="max-w-[55%] truncate rounded-full border border-black/5 bg-white/90 px-3 py-1 text-center text-[11px] text-[#6b7280] shadow-sm">
                {title || "Generated website"}
              </div>
              <div className="w-16" />
            </div>
            <iframe
              key={previewKey}
              ref={iframeRef}
              title="Generated website preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-same-origin"
              onLoad={handlePreviewLoad}
              className="h-[calc(100vh-285px)] min-h-[520px] w-full bg-white opacity-100 transition-opacity duration-150"
            />
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111827]">
                Images used
              </h3>
              <span className="text-xs text-[#6b7280]">
                {imageSources.length || "No"} image
                {imageSources.length === 1 ? "" : "s"}
              </span>
            </div>
            {imageSources.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {imageSources.map((image) => (
                  <div
                    key={image.src}
                    className="flex gap-3 rounded-xl border border-black/5 bg-[#fbfaf8] p-3"
                  >
                    {image.isRemote ? (
                      <img
                        src={image.src}
                        alt=""
                        className="size-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs text-red-700">
                        Missing
                      </div>
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold ${
                          image.isRemote ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {image.isRemote
                          ? "Remote image"
                          : "Missing local image"}
                      </p>
                      <p className="mt-1 truncate text-xs text-[#6b7280]">
                        {image.src}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6b7280]">
                No image URLs found in generated code.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-[#0f172a] shadow-[0_24px_70px_rgba(42,31,18,0.14)]">
          <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab("app")}
                className={`px-4 py-4 text-sm font-semibold transition ${
                  activeTab === "app"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                App.js
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("css")}
                className={`px-4 py-4 text-sm font-semibold transition ${
                  activeTab === "css"
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                styles.css
              </button>
            </div>
            <button
              type="button"
              onClick={onCopyCode}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-200 transition-colors duration-150 hover:bg-slate-700"
            >
              <Copy className="size-3.5" />
              Copy code
            </button>
          </div>
          <pre className="h-[calc(100vh-285px)] min-h-[520px] overflow-auto p-5 text-sm leading-6 text-slate-100">
            <code>{activeCode}</code>
          </pre>
        </div>
      )}
    </section>
  );
}
