// components/admin/result-form-card.tsx

import { FormEvent, useState } from "react";
import { SetMatchResultPayload } from "@/services/api";

type ResultFormCardProps = {
  onSubmit: (
    matchId: number,
    payload: SetMatchResultPayload
  ) => Promise<string>;
};

export default function ResultFormCard({ onSubmit }: ResultFormCardProps) {
  const [matchId, setMatchId] = useState<number | "">("");
  const [scoreA, setScoreA] = useState<number | "">("");
  const [scoreB, setScoreB] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!matchId || matchId <= 0) {
      setError("Please enter a valid match ID.");
      return;
    }

    if (scoreA === "" || scoreB === "") {
      setError("Please enter both scores.");
      return;
    }

    if (Number(scoreA) < 0 || Number(scoreB) < 0) {
      setError("Scores cannot be negative.");
      return;
    }

    setLoading(true);

    try {
      const message = await onSubmit(Number(matchId), {
        score_a: Number(scoreA),
        score_b: Number(scoreB),
      });

      setSuccess(message || "Result submitted successfully.");
      setMatchId("");
      setScoreA("");
      setScoreB("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit result.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5">
        <div className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
          Admin Action
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">Set Match Result</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Submit final scores for a completed match.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Match ID
          </label>
          <input
            type="number"
            min={1}
            value={matchId}
            onChange={(e) =>
              setMatchId(e.target.value ? Number(e.target.value) : "")
            }
            placeholder="e.g. 12"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-amber-400/60 focus:bg-white/15"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Score A
            </label>
            <input
              type="number"
              min={0}
              value={scoreA}
              onChange={(e) =>
                setScoreA(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="0"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Score B
            </label>
            <input
              type="number"
              min={0}
              value={scoreB}
              onChange={(e) =>
                setScoreB(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="0"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-400/60 focus:bg-white/15"
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
          className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 px-4 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(245,158,11,0.25)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Submitting..." : "Submit Result"}
        </button>
      </form>
    </div>
  );
}