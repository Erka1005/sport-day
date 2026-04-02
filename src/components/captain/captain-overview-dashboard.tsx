import {
  DashboardTeamItem,
  DraftMyTeamResponse,
  ScheduleItem,
  TeamItem,
} from "@/services/api";

type Props = {
  team: TeamItem | null;
  standings: DashboardTeamItem[];
  schedules: ScheduleItem[];
  myTeam: DraftMyTeamResponse | null;
  loading: boolean;
};

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

export default function CaptainOverviewDashboard({
  team,
  standings,
  schedules,
  myTeam,
  loading,
}: Props) {
  const standingRow = standings.find((s) => s.team_code === team?.code) || null;

  const totalPlayers =
    myTeam?.categories.reduce((sum, cat) => sum + cat.players.length, 0) || 0;

  const totalLeaders =
    myTeam?.categories.reduce(
      (sum, cat) => sum + cat.players.filter((p) => p.leader).length,
      0
    ) || 0;

  const mySportResults = standingRow?.sport_results || [];
  const topTeams = standings.slice(0, 5);
  const upcomingSchedules = schedules.slice(0, 5);

  return (
    <section className="space-y-2 top-0 sticky">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Миний баг" value={team?.code || "-"} accent="cyan" />
        <StatCard
          label="Нийт байр"
          value={standingRow ? String(standingRow.overall_rank) : "-"}
          accent="amber"
        />
        <StatCard label="Ахлагч" value={String(totalLeaders)} accent="emerald" />
        <StatCard
          label="Нийт оноо"
          value={standingRow ? String(standingRow.total_score) : "-"}
          accent="white"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel
          title="Миний багийн үзүүлэлт"
          subtitle="Нийлбэр дүн болон спорт тус бүрийн үр дүн"
        >
          {loading ? (
            <EmptyState text="Мэдээлэл ачаалж байна..." />
          ) : !standingRow ? (
            <EmptyState text="Энэ багийн үзүүлэлтийн мэдээлэл алга." />
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniMetric
                  label="Нийт байр"
                  value={String(standingRow.overall_rank)}
                  accent="amber"
                />
                <MiniMetric
                  label="Нийт оноо"
                  value={String(standingRow.total_score)}
                  accent="cyan"
                />
              </div>

              <div className="space-y-2">
                {mySportResults.length === 0 ? (
                  <EmptyState text="Спорт тус бүрийн үр дүнгийн мэдээлэл алга." />
                ) : (
                  mySportResults.map((item) => (
                    <div
                      key={`${standingRow.team_code}-${item.sport_key}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {item.sport_name || formatSportKey(item.sport_key)}
                        </div>
                        <div className="text-xs text-slate-400">{item.sport_key}</div>
                      </div>

                      <div className="flex gap-2">
                        <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                          Байр: {item.rank ?? "-"}
                        </span>
                        <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                          Оноо: {item.score}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Ангиллын товч мэдээлэл"
          subtitle="Багийн ангилал тус бүрийн дүүргэлт"
        >
          {loading ? (
            <EmptyState text="Мэдээлэл ачаалж байна..." />
          ) : !myTeam || myTeam.categories.length === 0 ? (
            <EmptyState text="Багийн ангиллын мэдээлэл алга." />
          ) : (
            <div className="space-y-3">
              {myTeam.categories.map((category) => (
                <div
                  key={category.sport_key}
                  className="rounded-2xl border border-white/10 bg-black/10 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      {formatSportKey(category.sport_key)}
                    </div>
                    <div className="text-xs text-slate-300">
                      {category.filled ?? category.players.length}/{category.quota ?? "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Шилдэг 5 баг" subtitle="Нийт онооны жагсаалт">
          {loading ? (
            <EmptyState text="Үзүүлэлт ачаалж байна..." />
          ) : topTeams.length === 0 ? (
            <EmptyState text="Үзүүлэлтийн мэдээлэл алга." />
          ) : (
            <div className="space-y-3">
              {topTeams.map((row) => (
                <div
                  key={row.team_code}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 p-4"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      #{row.overall_rank} {row.team_name}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{row.team_code}</div>
                  </div>
                  <div className="text-sm font-bold text-amber-300">
                    {row.total_score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Ойрын хуваарь" subtitle="Удахгүй болох тэмцээнүүд">
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
                    Огноо, цаг: {formatDateTime(item.start_at)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Байршил: {item.venue || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
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
      <div className="text-xs tracking-[0.16em] text-slate-400">{label}</div>
      <div className={`mt-3 text-3xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function MiniMetric({
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
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="text-xs tracking-[0.14em] text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-black ${color}`}>{value}</div>
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