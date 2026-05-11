import "./globals.css";

export const metadata = {
  title: "AI Website Builder",
  description: "Generate, edit, preview, and save React websites with AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
