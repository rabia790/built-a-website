import { Loader2, Save, Sparkles, Wand2 } from "lucide-react";

function ActionButton({
  disabled,
  icon,
  label,
  loading,
  loadingLabel,
  onClick,
  variant = "primary",
}) {
  const classes =
    variant === "secondary"
      ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${classes}`}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {loading ? loadingLabel : label}
    </button>
  );
}

export default function BuilderPanel({
  prompt,
  instruction,
  loadingAction,
  hasFiles,
  error,
  notice,
  onPromptChange,
  onInstructionChange,
  onGenerate,
  onEdit,
  onSave,
}) {
  const isBusy = Boolean(loadingAction);

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="space-y-5">
        <div>
          <label
            htmlFor="website-prompt"
            className="text-sm font-semibold text-slate-900"
          >
            Website prompt
          </label>
          <textarea
            id="website-prompt"
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            rows={7}
            className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            placeholder="Build a modern landing page for a wedding photographer in Toronto"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Include the business type, audience, style, location, and sections
            you want.
          </p>
        </div>

        <ActionButton
          onClick={onGenerate}
          disabled={isBusy}
          loading={loadingAction === "generate"}
          icon={<Sparkles className="size-4" />}
          label="Generate Website"
          loadingLabel="Generating website..."
        />

        <div className="border-t border-slate-200 pt-5">
          <label
            htmlFor="edit-instruction"
            className="text-sm font-semibold text-slate-900"
          >
            Edit instruction
          </label>
          <textarea
            id="edit-instruction"
            value={instruction}
            onChange={(event) => onInstructionChange(event.target.value)}
            rows={5}
            className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            placeholder="Make the hero more luxury and add three premium packages"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <ActionButton
          onClick={onEdit}
          disabled={isBusy || !hasFiles}
          loading={loadingAction === "edit"}
          variant="secondary"
          icon={<Wand2 className="size-4 text-indigo-600" />}
          label="Apply Edit"
          loadingLabel="Applying edit..."
        />

        <ActionButton
          onClick={onSave}
          disabled={isBusy || !hasFiles}
          loading={loadingAction === "save"}
          variant="secondary"
          icon={<Save className="size-4 text-indigo-600" />}
          label="Save Project"
          loadingLabel="Saving project..."
        />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-700">
            {notice}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
