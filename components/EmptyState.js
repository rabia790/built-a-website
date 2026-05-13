import { Code2, Layers, Palette } from "lucide-react";

export default function EmptyState({ examples = [], onSelect }) {
  return (
    <section className="flex h-[calc(100vh-285px)] min-h-[520px] items-center justify-center rounded-[1.5rem] border border-black/5 bg-[radial-gradient(circle_at_20%_10%,rgba(249,115,22,0.09),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.46))] p-6 shadow-[0_24px_70px_rgba(42,31,18,0.09)] ring-1 ring-white/70">
      <div className="w-full max-w-4xl rounded-[1.5rem] border border-black/5 bg-white/88 p-7 text-center shadow-[0_18px_50px_rgba(42,31,18,0.10)] backdrop-blur sm:p-10">
        <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#111827] text-white shadow-lg shadow-slate-300/60">
          <Palette className="size-5" />
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
          Start with a prompt
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#6b7280]">
          Nexus turns ideas into polished React websites with copy, layout, and
          live preview.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ["Brand strategy", "Audience, positioning, and tone"],
            ["Premium UI", "Hero, proof, cards, and CTAs"],
            ["React code", "Clean App.js and styles.css"],
          ].map(([title, body], index) => (
            <div
              key={title}
              className="rounded-2xl border border-black/5 bg-[#fbfaf8] p-5 text-left shadow-sm transition-shadow duration-150 hover:shadow-md"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white text-[#111827] shadow-sm">
                {index === 0 ? (
                  <Layers className="size-4" />
                ) : index === 1 ? (
                  <Palette className="size-4" />
                ) : (
                  <Code2 className="size-4" />
                )}
              </div>
              <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-[#6b7280]">{body}</p>
            </div>
          ))}
        </div>

        {examples.length > 0 && (
          <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
            {examples.slice(0, 4).map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onSelect?.(example)}
                className="rounded-full border border-black/5 bg-white px-3.5 py-2 text-xs font-medium text-[#6b7280] shadow-sm transition-shadow duration-150 hover:text-[#111827] hover:shadow-md"
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
