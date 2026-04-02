import { ResultsDashboardResponse } from "@/services/api";

type Props = {
  data: ResultsDashboardResponse | null;
  loading: boolean;
  error: string;
  onRefresh: () => Promise<void>;
};

function getTeamStyle(colorHex?: string | null) {
  if (!colorHex) return { backgroundColor: "#64748b" };
  return {
    backgroundColor: colorHex,
    border: colorHex.toLowerCase() === "#ffffff" ? "1px solid #cbd5e1" : undefined,
  };
}

export default function StandingsDashboardCard({
  data,
  loading,
  error,
  onRefresh,
}: Props) {
  const teams = data?.teams || [];
  const sports = data?.sports || [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
              Хүснэгтийн мэдээлэл
            </div>
            <h2 className="mt-3 text-xl font-bold text-white">
              Нийлбэр дүнгийн хүснэгт
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Team бүрийн overall rank, total score, sport breakdown.
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
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
            Loading standings...
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
            Одоогоор standings мэдээлэл алга.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[0.8fr_1.8fr_1fr] bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              <div>Rank</div>
              <div>Баг</div>
              <div>Total</div>
            </div>

            <div className="divide-y divide-white/10">
              {teams.map((team) => (
                <div
                  key={team.team_code}
                  className="grid grid-cols-[0.8fr_1.8fr_1fr] items-center bg-black/10 px-4 py-3 text-sm text-white"
                >
                  <div className="font-black text-cyan-300">{team.overall_rank}</div>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-4 w-4 rounded-full"
                      style={getTeamStyle(team.team_color_hex)}
                    />
                    <div>
                      <div className="font-semibold">{team.team_name}</div>
                      <div className="text-xs text-slate-400">{team.team_code}</div>
                    </div>
                  </div>
                  <div className="font-black text-amber-300">{team.total_score}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-white">Sport breakdown</h3>
          <p className="mt-2 text-sm text-slate-300">
            Sport бүр дээр ямар баг хэдэд орсныг харуулна.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
            Loading breakdown...
          </div>
        ) : sports.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
            Sport breakdown алга.
          </div>
        ) : (
          <div className="space-y-4">
            {sports.map((sport) => (
              <div
                key={sport.sport_key}
                className="rounded-2xl border border-white/10 bg-black/10 p-4"
              >
                <div className="mb-4">
                  <div className="text-lg font-semibold text-white">
                    {sport.sport_name}
                  </div>
                  <div className="text-xs text-slate-400">{sport.sport_key}</div>
                </div>

                <div className="space-y-2">
                  {sport.results.map((row) => (
                    <div
                      key={`${sport.sport_key}-${row.team_code}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block h-4 w-4 rounded-full"
                          style={getTeamStyle(row.team_color_hex)}
                        />
                        <div className="text-sm text-white">
                          {row.team_name} ({row.team_code})
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-200">
                          Rank: {row.rank}
                        </span>
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-amber-200">
                          Score: {row.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}