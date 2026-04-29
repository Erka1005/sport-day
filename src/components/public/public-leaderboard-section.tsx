
import { Clipboard } from 'lucide-react';
type LeaderboardTeam = {
  team_code?: string;
  team_name: string;
  team_color_hex?: string | null;
  total_score: number;
  overall_rank?: number;
};

type PublicLeaderboardSectionProps = {
  teams: LeaderboardTeam[];
  loading: boolean;
};

const TEAM_LOGO_BY_COLOR: Record<string, string> = {
  "#FFFFFF": "/images/logo/white.png",
  "#FFFF00": "/images/logo/yellow.png",
  "#70AD47": "/images/logo/green.png",
  "#FF0000": "/images/logo/red.png",
  "#000000": "/images/logo/black.png",
  "#5B9BD5": "/images/logo/blue.png",
  "#FC5012": "/images/logo/orange.png",
  "#FC1268": "/images/logo/purple.png",
};

function normalizeHex(color?: string | null) {
  return color?.trim().toUpperCase() ?? "";
}

function getTeamLogo(color?: string | null) {
  return TEAM_LOGO_BY_COLOR[normalizeHex(color)] ?? null;
}

function getRankTone(rank: number) {
  if (rank === 1) return "border-cyan-300/25 bg-cyan-300/15 text-cyan-100";
  if (rank === 2) return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  if (rank === 3) return "border-white/15 bg-white/10 text-white";
  return "border-white/10 bg-white/5 text-slate-200";
}

export default function PublicLeaderboardSection({
  teams,
  loading,
}: PublicLeaderboardSectionProps) {
  const sortedTeams = [...teams].sort((a, b) => {
    const rankA = a.overall_rank ?? Number.MAX_SAFE_INTEGER;
    const rankB = b.overall_rank ?? Number.MAX_SAFE_INTEGER;

    if (rankA !== rankB) return rankA - rankB;
    return b.total_score - a.total_score;
  });

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="border-b border-white/10 px-6 py-7 md:px-7">
        <div className="inline-flex rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
           <Clipboard className="h-3.5 w-3.5 mr-2" />
           Амжилтын хүснэгт
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          Багуудын нийт оноо болон эзэлж буй байрлал.
        </p>
      </div>

      <div className="p-6 md:p-7">
        {loading ? (
          <EmptyState text="Leaderboard ачаалж байна..." />
        ) : sortedTeams.length === 0 ? (
          <EmptyState text="Leaderboard мэдээлэл алга." />
        ) : (
          <div className="space-y-3">
            {sortedTeams.map((row, index) => {
              const displayRank = row.overall_rank ?? index + 1;
              const logo = getTeamLogo(row.team_color_hex);
              const teamColor = row.team_color_hex ?? "#22D3EE";

              return (
                <div
                  key={`${row.team_code ?? row.team_name}-${index}`}
                  className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/25 hover:bg-white/[0.06]"
                  style={{
                    boxShadow: `0 0 0 rgba(0,0,0,0)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                      background: `linear-gradient(90deg, ${teamColor}22, transparent 42%)`,
                    }}
                  />

                  <div className="absolute inset-y-0 -left-1 w-24 translate-x-[-120%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)] transition-transform duration-700 group-hover:translate-x-[720%]" />

                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black shadow-[0_10px_25px_rgba(0,0,0,0.16)] ${getRankTone(
                          displayRank,
                        )}`}
                      >
                        #{displayRank}
                      </div>

                      <div
                        className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-[0_16px_35px_rgba(0,0,0,0.22)] transition duration-300 group-hover:scale-110 group-hover:rotate-3"
                        style={{
                          boxShadow: `0 0 24px ${teamColor}40`,
                        }}
                      >
                        <div
                          className="absolute inset-0 rounded-2xl opacity-0 transition duration-500 group-hover:opacity-100"
                          style={{
                            background: `radial-gradient(circle, ${teamColor}55, transparent 70%)`,
                          }}
                        />

                        {logo ? (
                          <img
                            src={logo}
                            alt={row.team_name}
                            className="relative h-full w-full rounded-2xl object-cover transition duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <span className="relative text-sm font-black text-white">
                            {row.team_code ?? "TM"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-white md:text-base">
                          {row.team_name}
                        </div>

                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                          {row.team_code}
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        Нийт оноо
                      </div>

                      <div className="mt-1 text-xl font-black text-cyan-200">
                        {row.total_score}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center">
      <div className="text-lg font-semibold text-white">{text}</div>
    </div>
  );
}
