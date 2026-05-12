import { Layers, LayoutTemplate, Sparkles } from "lucide-react";

export default function EmptyState({ examples = [], onSelect }) {
  return (
    <section className="flex h-[calc(100vh-270px)] min-h-[560px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.28),transparent_34%),rgba(255,255,255,0.04)] p-6">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3 py-1.5 text-sm font-medium text-indigo-100">
            <Sparkles className="size-4" />
            AI design canvas
          </div>
          <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Describe a website and watch it appear here
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
            Start vague or specific. The builder will infer a brand, audience,
            sections, copy direction, and a polished responsive layout.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {examples.slice(0, 5).map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onSelect?.(example)}
                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-300/50 hover:bg-indigo-500/15"
              >
                {example.replace("Build a ", "")}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          {[
            ["Brand strategy", "Names, audience, copy angle"],
            ["Premium layout", "Hero, cards, stats, testimonials"],
            ["Live preview", "React, Tailwind, iframe rendering"],
          ].map(([title, body], index) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-xl shadow-black/20"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white text-slate-950">
                {index === 0 ? (
                  <Layers className="size-5" />
                ) : (
                  <LayoutTemplate className="size-5" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
