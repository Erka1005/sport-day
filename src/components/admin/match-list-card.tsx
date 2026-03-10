// components/admin/match-list-card.tsx

import { MatchItem, SportItem } from "@/services/api";

type MatchListCardProps = {
  matches: MatchItem[];
  sports: SportItem[];
  loading: boolean;
  error: string;
  onRefresh: () => Promise<void>;
};

function getSportName(sports: SportItem[], sportId: number) {
  return sports.find((sport) => sport.id === sportId)?.name || `#${sportId}`;
}

export default function MatchListCard({
  matches,
  sports,
  loading,
  error,
  onRefresh,
}: MatchListCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
            Schedule
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">Match List</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Preview scheduled matches from the system.
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
          Loading matches...
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
          No matches found yet.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <div
              key={match.id}
              className="rounded-2xl border border-white/10 bg-black/10 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-lg font-semibold text-white">
                    {getSportName(sports, match.sport_id)}
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    Team {match.team_a_id} vs Team {match.team_b_id}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {match.venue} • {match.start_at}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {match.status ? (
                    <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                      {match.status}
                    </span>
                  ) : null}

                  {(typeof match.score_a === "number" ||
                    typeof match.score_b === "number") && (
                    <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                      {match.score_a ?? 0} : {match.score_b ?? 0}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}