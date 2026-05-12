"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";

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
      if (value && /\.(jpg|jpeg|png|webp|avif|svg)(\?|$)/i.test(value)) {
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

export default function WebsitePreview({ files, title, viewMode = "preview" }) {
  const [activeTab, setActiveTab] = useState("app");
  const { appCode, cssCode } = useMemo(() => getGeneratedCode(files), [files]);
  const srcDoc = useMemo(() => buildSrcDoc(appCode, cssCode), [appCode, cssCode]);
  const imageSources = useMemo(() => extractImageSources(appCode), [appCode]);
  const activeCode = activeTab === "app" ? appCode : cssCode;

  return (
    <section className="min-w-0">
      {viewMode === "preview" ? (
        <div className="space-y-4">
          <div className="mx-auto max-w-[1400px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
            <div className="flex h-12 items-center justify-between border-b border-white/10 bg-slate-900/90 px-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-400" />
                <span className="size-3 rounded-full bg-amber-400" />
                <span className="size-3 rounded-full bg-emerald-400" />
              </div>
              <div className="max-w-[55%] truncate rounded-full border border-white/10 bg-black/25 px-4 py-1.5 text-center text-xs text-slate-400">
                {title || "Generated website"}
              </div>
              <div className="w-16" />
            </div>
            <iframe
              title="Generated website preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-same-origin"
              className="h-[calc(100vh-300px)] min-h-[560px] w-full bg-white"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Images used</h3>
              <span className="text-xs text-slate-500">
                {imageSources.length || "No"} image
                {imageSources.length === 1 ? "" : "s"}
              </span>
            </div>
            {imageSources.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {imageSources.map((image) => (
                  <div
                    key={image.src}
                    className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    {image.isRemote ? (
                      <img
                        src={image.src}
                        alt=""
                        className="size-16 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-xs text-red-200">
                        Missing
                      </div>
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold ${
                          image.isRemote ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {image.isRemote
                          ? "Remote image"
                          : "Missing local image"}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {image.src}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                This generation uses gradients, cards, SVG icons, or styled
                placeholders instead of images.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/90 px-4">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab("app")}
                className={`px-4 py-4 text-sm font-semibold transition ${
                  activeTab === "app"
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-200"
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
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                styles.css
              </button>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              Read-only generated source
            </p>
          </div>
          <pre className="h-[calc(100vh-240px)] min-h-[620px] overflow-auto p-5 text-sm leading-6 text-slate-100">
            <code>{activeCode}</code>
          </pre>
        </div>
      )}
    </section>
  );
}
