// components/admin/match-form-card.tsx

import { FormEvent, useState } from "react";
import { CreateMatchPayload, SportItem } from "@/services/api";

type MatchFormCardProps = {
  sports: SportItem[];
  onSubmit: (payload: CreateMatchPayload) => Promise<void>;
};

export default function MatchFormCard({
  sports,
  onSubmit,
}: MatchFormCardProps) {
  const [form, setForm] = useState<CreateMatchPayload>({
    sport_id: 0,
    start_at: "",
    venue: "",
    team_a_id: 0,
    team_b_id: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.sport_id) {
      setError("Please select a sport.");
      return;
    }

    if (!form.team_a_id || !form.team_b_id) {
      setError("Please enter both team IDs.");
      return;
    }

    if (form.team_a_id === form.team_b_id) {
      setError("Team A and Team B cannot be the same.");
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        sport_id: form.sport_id,
        start_at: form.start_at,
        venue: form.venue.trim(),
        team_a_id: form.team_a_id,
        team_b_id: form.team_b_id,
      });

      setSuccess("Match created successfully.");
      setForm({
        sport_id: sports[0]?.id ?? 0,
        start_at: "",
        venue: "",
        team_a_id: 0,
        team_b_id: 0,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create match.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5">
        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
          Admin Action
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">Create Match</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Schedule a new match for the selected sport.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Sport
          </label>
          <select
            value={form.sport_id}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                sport_id: Number(e.target.value),
              }))
            }
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            required
          >
            <option value={0} className="bg-slate-900 text-white">
              Select sport
            </option>
            {sports.map((sport) => (
              <option
                key={sport.id}
                value={sport.id}
                className="bg-slate-900 text-white"
              >
                {sport.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Start At
          </label>
          <input
            type="datetime-local"
            value={form.start_at}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, start_at: e.target.value }))
            }
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Venue
          </label>
          <input
            type="text"
            value={form.venue}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, venue: e.target.value }))
            }
            placeholder="e.g. Main Arena"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Team A ID
            </label>
            <input
              type="number"
              min={1}
              value={form.team_a_id || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  team_a_id: Number(e.target.value),
                }))
              }
              placeholder="e.g. 1"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-emerald-400/60 focus:bg-white/15"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Team B ID
            </label>
            <input
              type="number"
              min={1}
              value={form.team_b_id || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  team_b_id: Number(e.target.value),
                }))
              }
              placeholder="e.g. 2"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-emerald-400/60 focus:bg-white/15"
              required
            />
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
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(16,185,129,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating..." : "Create Match"}
        </button>
      </form>
    </div>
  );
}