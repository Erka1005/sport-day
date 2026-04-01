import {
  DraftRosterResponse,
  MatchItem,
  SportItem,
  StandingItem,
  TeamItem,
} from "@/services/api";
import { resolveMediaUrl } from "@/lib/media";

type Props = {
  sports?: SportItem[];
  teams?: TeamItem[];
  matches?: MatchItem[];
  standings?: StandingItem[];
  roster?: DraftRosterResponse | null;
  sportsLoading: boolean;
  matchesLoading: boolean;
  teamsLoading: boolean;
  standingsLoading: boolean;
  rosterLoading: boolean;
  teamsError: string;
  standingsError: string;
  rosterError: string;
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

function initials(name: string) {
  return name
    .split(" ")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() || "")
    .join("");
}

export default function AdminOverviewDashboard({
  sports,
  teams,
  matches,
  standings,
  roster,
  sportsLoading,
  matchesLoading,
  teamsLoading,
  standingsLoading,
  rosterLoading,
  teamsError,
  standingsError,
  rosterError,
}: Props) {
  const safeSports = Array.isArray(sports) ? sports : [];
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeMatches = Array.isArray(matches) ? matches : [];
  const safeStandings = Array.isArray(standings) ? standings : [];
  const safeRosterTeams = Array.isArray(roster?.teams) ? roster!.teams : [];

  const draftSports = safeSports.filter((s) => Boolean(s?.uses_draft));
  const nonDraftSports = safeSports.filter((s) => !s?.uses_draft);

  const completedMatches = safeMatches.filter((m) => m?.status === "completed");
  const pendingMatches = safeMatches.filter((m) => m?.status !== "completed");

  const totalRosterPlayers = safeRosterTeams.reduce((sum, team) => {
    const categories = Array.isArray(team?.categories) ? team.categories : [];
    return (
      sum +
      categories.reduce((catSum, category) => {
        const players = Array.isArray(category?.players) ? category.players : [];
        return catSum + players.length;
      }, 0)
    );
  }, 0);

  const totalLeaders = safeRosterTeams.reduce((sum, team) => {
    const categories = Array.isArray(team?.categories) ? team.categories : [];
    return (
      sum +
      categories.reduce((catSum, category) => {
        const players = Array.isArray(category?.players) ? category.players : [];
        return catSum + players.filter((p) => Boolean(p?.leader)).length;
      }, 0)
    );
  }, 0);

  const recentMatches = [...safeMatches]
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
          label="Тоглолт"
          value={matchesLoading ? "..." : String(safeMatches.length)}
          accent="white"
        />
        <StatCard
          label="Нийт бүрэлдэхүүн"
          value={rosterLoading ? "..." : String(totalRosterPlayers)}
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
                    draftSports.map((sport) => <SportCard key={sport.id} sport={sport} />)
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
                    nonDraftSports.map((sport) => <SportCard key={sport.id} sport={sport} />)
                  )}
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Тоглолтын товч мэдээлэл"
          subtitle="Хүлээгдэж буй болон дууссан тоглолтууд"
        >
          {matchesLoading ? (
            <EmptyState text="Тоглолтуудыг ачаалж байна..." />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniMetric
                  label="Хүлээгдэж буй"
                  value={String(pendingMatches.length)}
                  accent="cyan"
                />
                <MiniMetric
                  label="Дууссан"
                  value={String(completedMatches.length)}
                  accent="emerald"
                />
              </div>

              <div className="space-y-3">
                {recentMatches.length === 0 ? (
                  <EmptyState text="Тоглолтын мэдээлэл алга." />
                ) : (
                  recentMatches.map((match) => (
                    <div
                      key={match.id}
                      className="rounded-2xl border border-white/10 bg-black/10 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white">
                          Тоглолт #{match.id}
                        </div>
                        <InlineStatus status={match.status} />
                      </div>

                      <div className="mt-2 text-sm text-slate-300">
                        Баг {match.team_a_id} vs Баг {match.team_b_id}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {formatDateTime(match.start_at)}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        Байршил: {match.venue || "-"}
                      </div>

                      {typeof match.score_a === "number" ||
                      typeof match.score_b === "number" ? (
                        <div className="mt-2 text-xs font-semibold text-amber-200">
                          Оноо: {match.score_a ?? 0} : {match.score_b ?? 0}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Онооны хүснэгт" subtitle="Багуудын байрлал, оноо, үр дүн">
          {standingsError ? (
            <ErrorBox text={standingsError} />
          ) : standingsLoading ? (
            <EmptyState text="Онооны хүснэгтийг ачаалж байна..." />
          ) : safeStandings.length === 0 ? (
            <EmptyState text="Онооны хүснэгтийн мэдээлэл алга." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-[0.7fr_1.2fr_0.8fr_0.8fr_0.8fr_0.9fr] bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                <div>#</div>
                <div>Баг</div>
                <div>Х</div>
                <div>Хо</div>
                <div>Т</div>
                <div>Оноо</div>
              </div>

              <div className="divide-y divide-white/10">
                {safeStandings.map((row, index) => (
                  <div
                    key={`${row.team_code}-${index}`}
                    className="grid grid-cols-[0.7fr_1.2fr_0.8fr_0.8fr_0.8fr_0.9fr] bg-black/10 px-4 py-3 text-sm text-white"
                  >
                    <div className="font-bold text-cyan-300">{index + 1}</div>
                    <div className="font-semibold">{row.team_code}</div>
                    <div>{row.wins}</div>
                    <div>{row.losses}</div>
                    <div>{row.draws}</div>
                    <div className="font-bold text-amber-300">{row.points}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Багуудын бүрэлдэхүүн" subtitle="Leader / member тархалт, ангилал">
          {rosterError ? (
            <ErrorBox text={rosterError} />
          ) : rosterLoading ? (
            <EmptyState text="Бүрэлдэхүүнийг ачаалж байна..." />
          ) : safeRosterTeams.length === 0 ? (
            <EmptyState text="Бүрэлдэхүүний мэдээлэл алга." />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniMetric label="Нийт leader" value={String(totalLeaders)} accent="amber" />
                <MiniMetric label="Нийт тоглогч" value={String(totalRosterPlayers)} accent="cyan" />
              </div>

              <div className="space-y-3">
                {safeRosterTeams.map((team) => {
                  const categories = Array.isArray(team?.categories) ? team.categories : [];

                  const teamPlayers = categories.reduce((sum, cat) => {
                    const players = Array.isArray(cat?.players) ? cat.players : [];
                    return sum + players.length;
                  }, 0);

                  const teamLeaders = categories.reduce((sum, cat) => {
                    const players = Array.isArray(cat?.players) ? cat.players : [];
                    return sum + players.filter((p) => Boolean(p?.leader)).length;
                  }, 0);

                  return (
                    <div
                      key={team.team_code}
                      className="rounded-2xl border border-white/10 bg-black/10 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">
                            БАГ {team.team_code}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            Ангилал: {categories.length}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <InlineBadge tone="amber">Leader: {teamLeaders}</InlineBadge>
                          <InlineBadge tone="cyan">Нийт: {teamPlayers}</InlineBadge>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {categories.map((category) => {
                          const players = Array.isArray(category?.players) ? category.players : [];

                          return (
                            <div
                              key={`${team.team_code}-${category.sport_key}`}
                              className="rounded-2xl border border-white/10 bg-white/5 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-white">
                                  {formatSportLabel(category.sport_key)}
                                </div>
                                <div className="text-xs text-slate-300">
                                  {category.filled ?? players.length}/{category.quota ?? "-"}
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {players.slice(0, 4).map((player) => {
                                  const img = resolveMediaUrl(player.photo_url);

                                  return (
                                    <div
                                      key={`${category.sport_key}-${player.employee_name}`}
                                      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                        player.leader
                                          ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                                          : "border-slate-400/20 bg-slate-400/10 text-slate-200"
                                      }`}
                                    >
                                      {img ? (
                                        <img
                                          src={img}
                                          alt={player.employee_name}
                                          className="h-5 w-5 rounded-full object-cover"
                                        />
                                      ) : (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
                                          {initials(player.employee_name) || "U"}
                                        </span>
                                      )}
                                      <span className="max-w-[90px] truncate">
                                        {player.employee_name}
                                      </span>
                                    </div>
                                  );
                                })}

                                {players.length > 4 ? (
                                  <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                                    +{players.length - 4} хүн
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
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
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
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

function MiniMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "cyan" | "emerald" | "amber";
}) {
  const color =
    accent === "cyan"
      ? "text-cyan-300"
      : accent === "amber"
      ? "text-amber-300"
      : "text-emerald-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-black ${color}`}>{value}</div>
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
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function InlineStatus({ status }: { status?: string }) {
  const completed = status === "completed";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        completed
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
      }`}
    >
      {completed ? "Дууссан" : status || "Хуваарьтай"}
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