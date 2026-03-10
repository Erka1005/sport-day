// components/admin/sport-form-card.tsx

import { FormEvent, useState } from "react";
import { CreateSportPayload } from "@/services/api";

type SportFormCardProps = {
  onSubmit: (payload: CreateSportPayload) => Promise<void>;
};

const scoringTypes = [
  { value: "win_loss", label: "Win / Loss" },
  { value: "score", label: "Score" },
  { value: "time", label: "Time" },
  { value: "points", label: "Points" },
];

export default function SportFormCard({ onSubmit }: SportFormCardProps) {
  const [form, setForm] = useState<CreateSportPayload>({
    key: "",
    name: "",
    scoring_type: "win_loss",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await onSubmit({
        key: form.key.trim(),
        name: form.name.trim(),
        scoring_type: form.scoring_type,
      });

      setSuccess("Sport created successfully.");
      setForm({
        key: "",
        name: "",
        scoring_type: "win_loss",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create sport.";
      setError(message);
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
          Add a new sport category for MMS Sports Day.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Key
          </label>
          <input
            type="text"
            value={form.key}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, key: e.target.value }))
            }
            placeholder="e.g. football"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Football"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Scoring Type
          </label>
          <select
            value={form.scoring_type}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                scoring_type: e.target.value,
              }))
            }
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/60 focus:bg-white/15"
          >
            {scoringTypes.map((item) => (
              <option
                key={item.value}
                value={item.value}
                className="bg-slate-900 text-white"
              >
                {item.label}
              </option>
            ))}
          </select>
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
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(6,182,212,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating..." : "Create Sport"}
        </button>
      </form>
    </div>
  );
}