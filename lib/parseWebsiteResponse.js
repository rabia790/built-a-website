function sanitizeCode(code) {
  return String(code || "")
    .replace(/\u0000/g, "")
    .replace(/```jsx/g, "")
    .replace(/```js/g, "")
    .replace(/```css/g, "")
    .replace(/```/g, "")
    .replace(/^\s*jsx\s*/i, "")
    .replace(/^\s*javascript\s*/i, "")
    .replace(/^\s*css\s*/i, "")
    .trim();
}

export function parseWebsiteResponse(rawResponse) {
  const cleaned = sanitizeCode(rawResponse);
  const titleMatch = cleaned.match(/TITLE:\s*([\s\S]*?)---APP_JS---/);
  const appMatch = cleaned.match(/---APP_JS---\s*([\s\S]*?)---STYLES_CSS---/);
  const cssMatch = cleaned.match(/---STYLES_CSS---\s*([\s\S]*)$/);

  const title = titleMatch?.[1]?.trim();
  const appCode = sanitizeCode(appMatch?.[1]);
  const cssCode = sanitizeCode(cssMatch?.[1]);

  if (!title || !appCode || !cssCode) {
    return null;
  }

  return {
    title,
    files: [
      {
        path: "/App.js",
        content: appCode,
      },
      {
        path: "/styles.css",
        content: cssCode,
      },
    ],
  };
}
