import {
  DashboardTeamItem,
  ResultsDashboardResponse,
  ScheduleItem,
  SportItem,
  TeamItem,
} from "@/services/api";
import { Noto_Sans } from "next/font/google";

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

type Props = {
  sports?: SportItem[];
  teams?: TeamItem[];
  matches?: ScheduleItem[];
  standings?: DashboardTeamItem[];
  resultsDashboard?: ResultsDashboardResponse | null;
  sportsLoading: boolean;
  matchesLoading: boolean;
  teamsLoading: boolean;
  standingsLoading: boolean;
  teamsError: string;
  standingsError: string;
};

function formatSportLabel(key?: string | null) {
  if (!key) return "Төрөлгүй";

  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

function formatScheduleDate(item: ScheduleItem) {
  if (item.date_label) return item.date_label;

  if (item.start_at) {
    const date = new Date(item.start_at);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("mn-MN");
    }
    return item.start_at;
  }

  return "-";
}

function formatScheduleTime(item: ScheduleItem) {
  const startTime =
    (item as ScheduleItem & { start_time?: string | null }).start_time ||
    (() => {
      if (!item.start_at) return null;
      const date = new Date(item.start_at);
      if (Number.isNaN(date.getTime())) return item.start_at;
      return date.toLocaleTimeString("mn-MN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    })();

  const endTime = (item as ScheduleItem & { end_time?: string | null }).end_time;

  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;
  if (endTime) return endTime;
  return "-";
}

function formatScheduleStatus(status?: string | null) {
  if (!status) return "Тодорхойгүй";
  if (status === "scheduled") return "Товлогдсон";
  if (status === "ongoing") return "Явагдаж байна";
  if (status === "completed") return "Дууссан";
  if (status === "cancelled") return "Цуцлагдсан";
  return status;
}

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

export default function AdminOverviewDashboard({
  sports,
  teams,
  matches,
  standings,
  resultsDashboard,
  sportsLoading,
  matchesLoading,
  teamsLoading,
  standingsLoading,
  teamsError,
  standingsError,
}: Props) {
  const safeSports = Array.isArray(sports) ? sports : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeMatches = Array.isArray(matches) ? matches : [];
  const safeStandings = Array.isArray(standings) ? standings : [];
  const safeSportBreakdown = Array.isArray(resultsDashboard?.sports)
    ? resultsDashboard!.sports
    : [];

  const draftSports = safeSports.filter((s) => Boolean(s?.uses_draft));
  const nonDraftSports = safeSports.filter((s) => !s?.uses_draft);

  const recentSchedules = [...safeMatches]
    .sort((a, b) => {
      const aDate =
        a.date_label ||
        (a.start_at ? new Date(a.start_at).toISOString().slice(0, 10) : "");
      const bDate =
        b.date_label ||
        (b.start_at ? new Date(b.start_at).toISOString().slice(0, 10) : "");

      const aStart =
        (a as ScheduleItem & { start_time?: string | null }).start_time ||
        a.start_at ||
        "";
      const bStart =
        (b as ScheduleItem & { start_time?: string | null }).start_time ||
        b.start_at ||
        "";

      const aSort = `${aDate} ${aStart}`;
      const bSort = `${bDate} ${bStart}`;

      return bSort.localeCompare(aSort);
    })
    .slice(0, 6);

  return (
    <section className={`${notoSans.className} space-y-6`}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Төрөл"
          value={sportsLoading ? "..." : String(safeSports.length)}
          accent="cyan"
        />
        <StatCard
          label="Драфттай төрөл"
          value={sportsLoading ? "..." : String(draftSports.length)}
          accent="emerald"
        />
        <StatCard
          label="Баг"
          value={teamsLoading ? "..." : String(safeTeams.length)}
          accent="amber"
        />
        <StatCard
          label="Хуваарь"
          value={matchesLoading ? "..." : String(safeMatches.length)}
          accent="white"
        />
        <StatCard
          label="Хүснэгтэд орсон баг"
          value={standingsLoading ? "..." : String(safeStandings.length)}
          accent="cyan"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Тэмцээний төрлүүд"
          subtitle="Драфттай болон энгийн төрлүүдийн хуваарилалт"
        >
          {sportsLoading ? (
            <EmptyState text="Төрлүүдийг ачаалж байна..." />
          ) : safeSports.length === 0 ? (
            <EmptyState text="Одоогоор төрөл алга." />
          ) : (
            <div className="space-y-5">
              <div>
                <div className="mb-3 text-xs font-semibold tracking-[0.12em] text-emerald-200">
                  Драфт ашигладаг
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {draftSports.length === 0 ? (
                    <EmptyMini text="Драфттай төрөл алга." />
                  ) : (
                    draftSports.map((sport) => (
                      <SportCard key={sport.id} sport={sport} />
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 text-xs font-semibold tracking-[0.12em] text-amber-200">
                  Шууд бүрэлдэхүүнтэй
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {nonDraftSports.length === 0 ? (
                    <EmptyMini text="Энгийн төрөл алга." />
                  ) : (
                    nonDraftSports.map((sport) => (
                      <SportCard key={sport.id} sport={sport} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Хуваарийн товч мэдээлэл"
          subtitle="Сүүлийн бүртгэгдсэн тэмцээнүүд"
        >
          {matchesLoading ? (
            <EmptyState text="Хуваарийг ачаалж байна..." />
          ) : recentSchedules.length === 0 ? (
            <EmptyState text="Хуваарийн мэдээлэл алга." />
          ) : (
            <div className="space-y-3">
              {recentSchedules.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      {item.sport_name || formatSportLabel(item.sport_key)}
                    </div>
                    <InlineStatus status={item.status} />
                  </div>

                  <div className="mt-2 text-sm text-slate-300">
                    Огноо: {formatScheduleDate(item)}
                  </div>

                  <div className="mt-1 text-sm text-slate-300">
                    Цаг: {formatScheduleTime(item)}
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

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel
          title="Нийт standings"
          subtitle="Багуудын нийлбэр оноо болон байрлал"
        >
          {standingsLoading ? (
            <EmptyState text="Standings ачаалж байна..." />
          ) : standingsError ? (
            <ErrorBox text={standingsError} />
          ) : safeStandings.length === 0 ? (
            <EmptyState text="Standings мэдээлэл алга." />
          ) : (
            <div className="max-h-[460px] overflow-y-auto rounded-2xl border border-white/10">
              <div className="grid grid-cols-[80px_minmax(0,1fr)_110px] bg-white/10 px-4 py-3 text-xs tracking-[0.12em] text-slate-300">
                <div>Байр</div>
                <div>Баг</div>
                <div className="text-right">Оноо</div>
              </div>

              <div className="divide-y divide-white/10">
                {safeStandings.map((row) => (
                  <div
                    key={row.team_code}
                    className="grid grid-cols-[80px_minmax(0,1fr)_110px] items-center bg-black/10 px-4 py-3"
                  >
                    <div className="text-sm font-black text-cyan-300">
                      #{row.overall_rank}
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="inline-block h-4 w-4 shrink-0 rounded-full"
                        style={getTeamStyle(row.team_color_hex)}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">
                          {row.team_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {row.team_code}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-sm font-black text-amber-300">
                      {row.total_score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Спорт тус бүрийн үр дүн"
          subtitle="Төрөл бүрээр ямар баг хэдэд орсныг харуулна"
        >
          {standingsLoading ? (
            <EmptyState text="Үр дүнг ачаалж байна..." />
          ) : standingsError ? (
            <ErrorBox text={standingsError} />
          ) : safeSportBreakdown.length === 0 ? (
            <EmptyState text="Спорт тус бүрийн үр дүнгийн мэдээлэл алга." />
          ) : (
            <div className="max-h-[460px] space-y-4 overflow-y-auto pr-1">
              {safeSportBreakdown.map((sport) => (
                <div
                  key={sport.sport_key}
                  className="rounded-2xl border border-white/10 bg-black/10 p-4"
                >
                  <div className="mb-3">
                    <div className="text-sm font-bold text-white">
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
                            Байр: {row.rank}
                          </span>
                          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-amber-200">
                            Оноо: {row.score}
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
      </div>

      {teamsError ? <ErrorBox text={teamsError} /> : null}
    </section>
  );
}

function StatCard({
  label,
  value,
  accent = "white",
}: {
  label: string;
  value: string;
  accent?: "white" | "cyan" | "amber" | "emerald";
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
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="text-xs tracking-[0.12em] text-slate-400">{label}</div>
      <div className={`mt-3 text-3xl font-black ${color}`}>{value}</div>
    </div>
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
    <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-[0_15px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-300">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function SportCard({ sport }: { sport: SportItem }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="text-sm font-bold text-white">{sport.name}</div>
      <div className="mt-1 font-mono text-xs text-slate-400">{sport.key}</div>
      <div className="mt-3">
        {sport.uses_draft ? (
          <InlineBadge tone="emerald">✅ Драфттай</InlineBadge>
        ) : (
          <InlineBadge tone="amber">❌ Шууд бүрэлдэхүүн</InlineBadge>
        )}
      </div>
    </div>
  );
}

function InlineBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "cyan" | "emerald" | "amber";
}) {
  const className =
    tone === "cyan"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
      : tone === "emerald"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : "border-amber-400/20 bg-amber-400/10 text-amber-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function InlineStatus({ status }: { status?: string | null }) {
  let className =
    "border-slate-400/20 bg-slate-400/10 text-slate-200";

  if (status === "scheduled") {
    className = "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
  } else if (status === "ongoing") {
    className = "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  } else if (status === "completed") {
    className = "border-amber-400/20 bg-amber-400/10 text-amber-200";
  } else if (status === "cancelled") {
    className = "border-rose-400/20 bg-rose-400/10 text-rose-200";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {formatScheduleStatus(status)}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-6 text-sm text-slate-300">
      {text}
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-slate-400">
      {text}
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {text}
    </div>
  );
}