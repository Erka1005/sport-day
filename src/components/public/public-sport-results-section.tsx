import { motion } from "framer-motion";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://10.10.90.78:8010";

type SportResultRow = {
  team_id?: number;
  team_code: string;
  team_name: string;
  team_color_hex?: string | null;
  captain_user_id?: number | null;
  rank: number;
  score: number;
  note?: string | null;
};

type SportMvpPlayer = {
  player_id: number;
  player_name: string;
  team_code: string;
  team_name: string;
  team_color_hex?: string | null;
  score?: number | null;
  image_url?: string | null;
};

type SportBreakdown = {
  sport_key: string;
  sport_name: string;
  mvp?: SportMvpPlayer | SportMvpPlayer[] | null;
  mvps?: SportMvpPlayer[] | null;
  results: SportResultRow[];
};

type PublicSportResultsSectionProps = {
  sports: SportBreakdown[];
  loading: boolean;
};

const HIDDEN_SPORT_KEYS = ["members"];

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

function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

function getRankLabel(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function shouldShowSport(sportKey: string) {
  return !HIDDEN_SPORT_KEYS.includes(sportKey.trim().toLowerCase());
}

function getSportMvps(sport: SportBreakdown) {
  if (Array.isArray(sport.mvps)) return sport.mvps;
  if (Array.isArray(sport.mvp)) return sport.mvp;
  if (sport.mvp) return [sport.mvp];
  return [];
}

export default function PublicSportResultsSection({
  sports,
  loading,
}: PublicSportResultsSectionProps) {
  const visibleSports = sports.filter((sport) =>
    shouldShowSport(sport.sport_key)
  );

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-lg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_28%)]" />

      <div className="relative mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
            Үр дүн
          </div>

          <h2 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.02em] text-white md:text-3xl">
            Спортын төрлүүдийн үр дүн
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-300">
            Багуудын байр, оноо болон тухайн төрлийн MVP тоглогч.
          </p>
        </div>

        <span className="inline-flex w-fit rounded-full border border-cyan-400/15 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-200">
          {loading ? "..." : `${visibleSports.length} төрөл`}
        </span>
      </div>

      {loading ? (
        <EmptyState text="Sport results ачаалж байна..." />
      ) : visibleSports.length === 0 ? (
        <EmptyState text="Sport results мэдээлэл алга." />
      ) : (
        <div className="relative grid gap-6 xl:grid-cols-2">
          {visibleSports.map((sport, sportIndex) => {
            const displayMvps = getSportMvps(sport);

            return (
              <motion.div
                key={sport.sport_key}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: sportIndex * 0.04 }}
                className="group overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/30 shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-white/[0.03]"
              >
                <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-white/[0.03] to-transparent px-5 py-4">
                  <div className="relative min-w-0">
                    <div className="text-lg font-bold leading-tight tracking-[-0.01em] text-white">
                      {sport.sport_name}
                    </div>

                  
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  {sport.results.map((row, rowIndex) => {
                    const teamColor = row.team_color_hex ?? "#22D3EE";
                    const logo = getTeamLogo(row.team_color_hex);

                    return (
                      <motion.div
                        key={`${sport.sport_key}-${row.team_code}`}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: sportIndex * 0.04 + rowIndex * 0.025,
                        }}
                        className="group/row relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 transition duration-300 hover:translate-x-1 hover:border-cyan-400/20 hover:bg-white/[0.07]"
                      >
                        <div
                          className="pointer-events-none absolute inset-0 opacity-20"
                          style={{
                            background: `linear-gradient(90deg, ${teamColor}33, transparent 45%)`,
                          }}
                        />

                        <div className="relative flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10"
                              style={{ boxShadow: `0 0 18px ${teamColor}35` }}
                            >
                              {logo ? (
                                <img
                                  src={logo}
                                  alt={row.team_name}
                                  className="h-full w-full rounded-2xl object-cover"
                                />
                              ) : (
                                <span className="text-sm font-black text-white">
                                  {row.team_code}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-white">
                                {row.team_name}
                              </div>

                              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                                {row.team_code}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                            <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
                              {getRankLabel(row.rank)}
                            </span>

                            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                              {row.score} оноо
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {displayMvps.length > 0 ? (
                    <MvpGridSection mvps={displayMvps} />
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MvpGridSection({ mvps }: { mvps: SportMvpPlayer[] }) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-[24px] border border-cyan-400/15 bg-cyan-400/10 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-100">
          MVP тоглогчид
        </div>

      
      </div>

      <div
        className={`grid gap-4 ${
          mvps.length >= 2 ? "md:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {mvps.map((mvp, index) => (
          <MvpGridCard
            key={`${mvp.player_id}-${mvp.team_code}-${index}`}
            mvp={mvp}
          />
        ))}
      </div>
    </div>
  );
}

function MvpGridCard({ mvp }: { mvp: SportMvpPlayer }) {
  const teamColor = mvp.team_color_hex ?? "#22D3EE";
  const logo = getTeamLogo(mvp.team_color_hex);
  const imageFromApi = getImageUrl(mvp.image_url);
  const image = imageFromApi || logo || "/images/logo/blue.png";

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/25 p-3">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: `linear-gradient(135deg, ${teamColor}55, transparent 62%)`,
        }}
      />

      <div className="relative flex items-center gap-3">
        <div
          className="h-20 w-20 shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-white/10"
          style={{ boxShadow: `0 0 20px ${teamColor}55` }}
        >
          <img
            src={image}
            alt={mvp.player_name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold leading-tight text-white">
            {mvp.player_name}
          </div>

          

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white">
              Баг: {mvp.team_name}
            </span>

            {mvp.score != null ? (
              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200">
                {mvp.score} оноо
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="relative rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-12 text-center">
      <div className="text-lg font-semibold text-white">{text}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Мэдээлэл орж ирэхэд энэ хэсэг автоматаар шинэчлэгдэнэ.
      </p>
    </div>
  );
}