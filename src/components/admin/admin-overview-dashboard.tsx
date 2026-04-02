import {
  DashboardTeamItem,
  ResultsDashboardResponse,
  ScheduleItem,
  SportItem,
  TeamItem,
} from "@/services/api";

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

function formatSportLabel(key: string) {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("mn-MN");
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
      const aTime = new Date(a?.start_at || 0).getTime();
      const bTime = new Date(b?.start_at || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 6);

  return (
    <section className="space-y-6">
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
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
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
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      {item.sport_name || formatSportLabel(item.sport_key)}
                    </div>
                    <InlineStatus status={item.status} />
                  </div>

                  <div className="mt-2 text-sm text-slate-300">
                    Огноо: {formatDateTime(item.start_at)}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    Байршил: {item.venue || "-"}
                  </div>

                  {item.date_label ? (
                    <div className="mt-1 text-xs text-slate-400">
                      Date label: {item.date_label}
                    </div>
                  ) : null}

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
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
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
  const className =
    status === "completed"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}
    >
      {status || "Хуваарьтай"}
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