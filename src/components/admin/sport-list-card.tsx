// components/admin/sport-list-card.tsx

import { SportItem } from "@/services/api";

type SportListCardProps = {
  sports: SportItem[];
  loading: boolean;
  error: string;
  onRefresh: () => Promise<void>;
};

export default function SportListCard({
  sports,
  loading,
  error,
  onRefresh,
}: SportListCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
            Preview
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">Sports List</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Current sports configured in the system.
          </p>
        </div>

        <button
          onClick={() => void onRefresh()}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
          Loading sports...
        </div>
      ) : sports.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
          No sports found yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sports.map((sport) => (
            <div
              key={sport.id}
              className="rounded-2xl border border-white/10 bg-black/10 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {sport.name}
                  </div>
                  <div className="mt-1 font-mono text-xs text-slate-400">
                    key: {sport.key}
                  </div>
                </div>

                <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  {sport.scoring_type}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}