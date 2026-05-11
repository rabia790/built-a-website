import { LayoutTemplate } from "lucide-react";

export default function EmptyState() {
  return (
    <section className="flex min-h-[620px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
      <div className="max-w-md">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <LayoutTemplate className="size-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-950">
          Your generated website will appear here
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Start with a specific prompt, then use edit instructions to refine the
          generated files and preview.
        </p>
      </div>
    </section>
  );
}
