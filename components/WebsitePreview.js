"use client";

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

export default function WebsitePreview({
  files,
  title,
  viewMode = "preview",
  onCopyCode,
  previewVersion = 0,
  device = "desktop",
  fill = false,
  zoom = "Fit",
}) {
  const [activeTab, setActiveTab] = useState("app");
  const { appCode, cssCode } = useMemo(() => getGeneratedCode(files), [files]);
  const srcDoc = useMemo(() => buildSrcDoc(appCode, cssCode), [appCode, cssCode]);
  const activeCode = activeTab === "app" ? appCode : cssCode;
  const iframeRef = useRef(null);
  const previewKey = useMemo(
    () =>
      `${title || "preview"}-${previewVersion}-${appCode.length}-${cssCode.length}`,
    [appCode, cssCode, previewVersion, title],
  );
  const previewWidthClass =
    device === "mobile"
      ? "max-w-[390px]"
      : device === "tablet"
        ? "max-w-[820px]"
        : "max-w-[1440px]";
  const zoomScale = zoom === "75%" ? 0.75 : 1;
  const frameStyle =
    zoomScale === 1
      ? undefined
      : {
          transform: `scale(${zoomScale})`,
          transformOrigin: "top center",
          width: `${100 / zoomScale}%`,
          height: `${100 / zoomScale}%`,
        };

  function handlePreviewLoad() {
    try {
      iframeRef.current?.contentWindow?.scrollTo(0, 0);
    } catch {
      // Cross-origin protection can block access in some browsers.
    }
  }

  return (
    <section className={fill ? "flex h-full min-h-0 min-w-0 overflow-auto" : "min-w-0"}>
      {viewMode === "preview" ? (
        <div
          style={frameStyle}
          className={`mx-auto ${previewWidthClass} ${fill ? "flex h-full min-h-0 flex-1 flex-col" : ""} overflow-hidden rounded-xl border border-[#e1ddd4] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.09)] transition-all duration-200`}
        >
            <div className="flex h-7 items-center justify-between border-b border-[#ece7df] bg-[#fbfaf7] px-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#ef4444]" />
                <span className="size-2 rounded-full bg-[#f59e0b]" />
                <span className="size-2 rounded-full bg-[#10b981]" />
              </div>
              <div className="max-w-[55%] truncate rounded-md border border-[#ece7df] bg-white px-3 py-0.5 text-center text-[10px] font-medium text-[#6b7280]">
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
              className={`${fill ? "min-h-0 flex-1" : "h-[calc(100vh-214px)] min-h-[540px]"} w-full bg-white opacity-100 transition-opacity duration-150`}
            />
        </div>
      ) : (
        <div className={`${fill ? "flex h-full min-h-0 flex-1 flex-col" : ""} overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] shadow-[0_18px_50px_rgba(15,23,42,0.18)]`}>
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
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
          <pre className={`${fill ? "min-h-0 flex-1" : "h-[calc(100vh-214px)] min-h-[540px]"} overflow-auto p-5 text-sm leading-6 text-slate-100`}>
            <code>{activeCode}</code>
          </pre>
        </div>
      )}
    </section>
  );
}
