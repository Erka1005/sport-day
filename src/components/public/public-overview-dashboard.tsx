import {
  ResultsDashboardResponse,
  ScheduleItem,
  SportItem,
  TeamItem,
} from "@/services/api";

type Props = {
  sports: SportItem[];
  teams: TeamItem[];
  schedules: ScheduleItem[];
  dashboard: ResultsDashboardResponse | null;
  loading: boolean;
};

function getTeamStyle(colorHex?: string | null) {
  if (!colorHex) return { backgroundColor: "#64748b" };

  return {
    backgroundColor: colorHex,
    border:
      colorHex.toLowerCase() === "#ffffff"
        ? "1px solid #cbd5e1"
        : undefined,
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("mn-MN");
}

function formatSportKey(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

export default function PublicOverviewDashboard({
  sports,
  teams,
  schedules,
  dashboard,
  loading,
}: Props) {
  const leaderboard = dashboard?.teams || [];
  const sportBreakdown = dashboard?.sports || [];
  const upcomingSchedules = [...schedules].slice(0, 8);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Төрөл"
          value={loading ? "..." : String(sports.length)}
          accent="cyan"
        />
        <StatCard
          label="Баг"
          value={loading ? "..." : String(teams.length)}
          accent="amber"
        />
        <StatCard
          label="Хуваарь"
          value={loading ? "..." : String(schedules.length)}
          accent="emerald"
        />
        <StatCard
          label="Standings"
          value={loading ? "..." : String(leaderboard.length)}
          accent="white"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Нийт leaderboard" subtitle="Багуудын нийлбэр оноо, байрлал">
          {loading ? (
            <EmptyState text="Leaderboard ачаалж байна..." />
          ) : leaderboard.length === 0 ? (
            <EmptyState text="Leaderboard мэдээлэл алга." />
          ) : (
            <div className="space-y-3">
              {leaderboard.map((row) => (
                <div
                  key={row.team_code}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-4 w-4 rounded-full"
                      style={getTeamStyle(row.team_color_hex)}
                    />
                    <div>
                      <div className="text-sm font-semibold text-white">
                        #{row.overall_rank} {row.team_name}
                      </div>
                      <div className="text-xs text-slate-400">{row.team_code}</div>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-amber-300">
                    {row.total_score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Ойрын хуваарь" subtitle="Тэмцээнүүдийн тов">
          {loading ? (
            <EmptyState text="Хуваарь ачаалж байна..." />
          ) : upcomingSchedules.length === 0 ? (
            <EmptyState text="Хуваарь алга." />
          ) : (
            <div className="space-y-3">
              {upcomingSchedules.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/10 p-4"
                >
                  <div className="text-sm font-semibold text-white">
                    {item.sport_name || formatSportKey(item.sport_key)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {formatDateTime(item.start_at)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Байршил: {item.venue || "-"}
                  </div>
                  {item.note ? (
                    <div className="mt-2 text-xs text-slate-300">
                      Тэмдэглэл: {item.note}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Sport бүрийн үр дүн"
        subtitle="Ямар баг хэдэд орсон, ямар оноо авсныг sport тус бүрээр харуулна"
      >
        {loading ? (
          <EmptyState text="Sport results ачаалж байна..." />
        ) : sportBreakdown.length === 0 ? (
          <EmptyState text="Sport results мэдээлэл алга." />
        ) : (
          <div className="grid gap-6 xl:grid-cols-2">
            {sportBreakdown.map((sport) => (
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

                      <div className="flex gap-2 text-xs">
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
      </Panel>
    </section>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-300">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "cyan" | "amber" | "emerald" | "white";
}) {
  const color =
    accent === "cyan"
      ? "text-cyan-300"
      : accent === "amber"
      ? "text-amber-300"
      : accent === "emerald"
      ? "text-emerald-300"
      : "text-white";

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className={`mt-3 text-3xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
      {text}
    </div>
  );
}