"use client";

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

export default function WebsitePreview({ files, title }) {
  const [activeTab, setActiveTab] = useState("app");
  const { appCode, cssCode } = useMemo(() => getGeneratedCode(files), [files]);
  const srcDoc = useMemo(() => buildSrcDoc(appCode, cssCode), [appCode, cssCode]);
  const activeCode = activeTab === "app" ? appCode : cssCode;

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Live project
          </p>
          <h2 className="truncate text-lg font-semibold text-slate-950">
            {title || "Generated website"}
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Preview and code update after each AI response.
        </p>
      </div>

      <div className="grid overflow-hidden rounded-lg border border-slate-200 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <div className="min-h-[680px] border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <iframe
            title="Generated website preview"
            srcDoc={srcDoc}
            sandbox="allow-scripts allow-same-origin"
            className="h-full min-h-[680px] w-full bg-white"
          />
        </div>

        <div className="flex min-h-[680px] flex-col bg-slate-950 text-slate-100">
          <div className="flex border-b border-slate-800 bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab("app")}
              className={`px-4 py-3 text-sm font-semibold transition ${
                activeTab === "app"
                  ? "bg-slate-950 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              App.js
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("css")}
              className={`px-4 py-3 text-sm font-semibold transition ${
                activeTab === "css"
                  ? "bg-slate-950 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              styles.css
            </button>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto p-4 text-xs leading-5">
            <code>{activeCode}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
