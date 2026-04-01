import { FormEvent, useMemo, useState } from "react";
import { CreateSportPayload } from "@/services/api";

type SportFormCardProps = {
  onSubmit: (payload: CreateSportPayload) => Promise<void>;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function SportFormCard({ onSubmit }: SportFormCardProps) {
  const [form, setForm] = useState<CreateSportPayload>({
    key: "",
    name: "",
    uses_draft: true,
  });
  const [autoKey, setAutoKey] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const suggestedKey = useMemo(() => slugify(form.name), [form.name]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload: CreateSportPayload = {
      key: autoKey ? suggestedKey : form.key.trim(),
      name: form.name.trim(),
      uses_draft: form.uses_draft,
    };

    if (!payload.name) {
      setError("Sport name required.");
      return;
    }

    if (!payload.key) {
      setError("Sport key required.");
      return;
    }

    setLoading(true);

    try {
      await onSubmit(payload);
      setSuccess("Sport created successfully.");
      setForm({
        key: "",
        name: "",
        uses_draft: true,
      });
      setAutoKey(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sport.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5">
        <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
          Admin Action
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">Create Sport</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Draft ашиглах эсэхийг sport бүр дээр тусад нь тохируулна.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Chess"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none"
            required
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-200">Auto Key</label>
            <input
              type="checkbox"
              checked={autoKey}
              onChange={(e) => setAutoKey(e.target.checked)}
            />
          </div>

          <input
            type="text"
            value={autoKey ? suggestedKey : form.key}
            onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
            disabled={autoKey}
            placeholder="e.g. chess"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none disabled:opacity-60"
            required
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-200">Uses Draft</div>
              <div className="mt-1 text-xs text-slate-400">
                Draft sport бол pool, choose, confirm ашиглана.
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, uses_draft: !prev.uses_draft }))
              }
              className={`rounded-full px-4 py-2 text-xs font-bold ${
                form.uses_draft
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-700 text-slate-200"
              }`}
            >
              {form.uses_draft ? "✅ Draft" : "❌ Non-draft"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 px-4 py-3.5 text-sm font-bold text-white transition disabled:opacity-70"
        >
          {loading ? "Creating..." : "Create Sport"}
        </button>
      </form>
    </div>
  );
}