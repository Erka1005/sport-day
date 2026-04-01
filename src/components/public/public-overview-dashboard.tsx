import {
  DraftRosterResponse,
  MatchItem,
  SportItem,
  StandingItem,
  TeamItem,
} from "@/services/api";
import { resolveMediaUrl } from "@/lib/media";

type Props = {
  sports: SportItem[];
  teams: TeamItem[];
  matches: MatchItem[];
  standings: StandingItem[];
  roster: DraftRosterResponse | null;
  loading: boolean;
};

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

function formatSportKey(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

export default function PublicOverviewDashboard({
  sports,
  teams,
  matches,
  standings,
  roster,
  loading,
}: Props) {
  const completedMatches = matches.filter((m) => m.status === "completed").slice(0, 6);
  const upcomingMatches = matches.filter((m) => m.status !== "completed").slice(0, 6);

  const totalPlayers =
    roster?.teams.reduce(
      (sum, team) =>
        sum +
        team.categories.reduce((catSum, category) => catSum + category.players.length, 0),
      0
    ) || 0;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Төрөл" value={String(sports.length)} accent="cyan" />
        <StatCard label="Баг" value={String(teams.length)} accent="emerald" />
        <StatCard label="Тоглолт" value={String(matches.length)} accent="white" />
        <StatCard label="Дууссан" value={String(completedMatches.length)} accent="amber" />
        <StatCard label="Тоглогч" value={String(totalPlayers)} accent="cyan" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Онооны хүснэгт" subtitle="Нийт багуудын байрлал, оноо">
          {loading ? (
            <EmptyState text="Онооны хүснэгтийг ачаалж байна..." />
          ) : standings.length === 0 ? (
            <EmptyState text="Одоогоор standings мэдээлэл алга." />
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
                {standings.map((row, index) => (
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

        <Panel title="Ойрын тоглолтууд" subtitle="Хуваарьтай тоглолтууд">
          {loading ? (
            <EmptyState text="Тоглолтуудыг ачаалж байна..." />
          ) : upcomingMatches.length === 0 ? (
            <EmptyState text="Ойрын тоглолтын мэдээлэл алга." />
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Сүүлийн үр дүн" subtitle="Дууссан тоглолтуудын оноо">
          {loading ? (
            <EmptyState text="Үр дүнг ачаалж байна..." />
          ) : completedMatches.length === 0 ? (
            <EmptyState text="Одоогоор дууссан тоглолт алга." />
          ) : (
            <div className="space-y-3">
              {completedMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Багуудын бүрэлдэхүүн" subtitle="Leader болон member товч харагдац">
          {loading ? (
            <EmptyState text="Бүрэлдэхүүнийг ачаалж байна..." />
          ) : !roster || roster.teams.length === 0 ? (
            <EmptyState text="Бүрэлдэхүүний мэдээлэл алга." />
          ) : (
            <div className="space-y-3">
              {roster.teams.map((team) => (
                <div
                  key={team.team_code}
                  className="rounded-2xl border border-white/10 bg-black/10 p-4"
                >
                  <div className="text-sm font-bold text-white">БАГ {team.team_code}</div>

                  <div className="mt-3 space-y-3">
                    {team.categories.slice(0, 3).map((category) => (
                      <div
                        key={`${team.team_code}-${category.sport_key}`}
                        className="rounded-2xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-white">
                            {formatSportKey(category.sport_key)}
                          </div>
                          <div className="text-xs text-slate-300">
                            {category.filled}/{category.quota}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {category.players.slice(0, 4).map((player) => {
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
    </section>
  );
}

function MatchCard({ match }: { match: MatchItem }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">Тоглолт #{match.id}</div>
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            match.status === "completed"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
          }`}
        >
          {match.status === "completed" ? "Дууссан" : match.status || "Хуваарьтай"}
        </span>
      </div>

      <div className="mt-2 text-sm text-slate-300">
        Баг {match.team_a_id} vs Баг {match.team_b_id}
      </div>

      <div className="mt-1 text-xs text-slate-400">{formatDateTime(match.start_at)}</div>
      <div className="mt-1 text-xs text-slate-400">Байршил: {match.venue || "-"}</div>

      {typeof match.score_a === "number" || typeof match.score_b === "number" ? (
        <div className="mt-2 text-xs font-semibold text-amber-200">
          Оноо: {match.score_a ?? 0} : {match.score_b ?? 0}
        </div>
      ) : null}
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
  accent: "cyan" | "emerald" | "amber" | "white";
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