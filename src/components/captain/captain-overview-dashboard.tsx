import {
  DraftMyTeamResponse,
  MatchItem,
  StandingItem,
  TeamItem,
} from "@/services/api";

type Props = {
  team: TeamItem | null;
  standings: StandingItem[];
  matches: MatchItem[];
  myTeam: DraftMyTeamResponse | null;
  loading: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("mn-MN");
}

export default function CaptainOverviewDashboard({
  team,
  standings,
  matches,
  myTeam,
  loading,
}: Props) {
  const standingRow = standings.find((s) => s.team_code === team?.code) || null;
  const teamId = team?.id;

  const myMatches = matches.filter(
    (m) => m.team_a_id === teamId || m.team_b_id === teamId
  );

  const upcoming = myMatches.filter((m) => m.status !== "completed").slice(0, 5);
  const completed = myMatches.filter((m) => m.status === "completed").slice(0, 5);

  const totalPlayers =
    myTeam?.categories.reduce((sum, cat) => sum + cat.players.length, 0) || 0;

  const totalLeaders =
    myTeam?.categories.reduce(
      (sum, cat) => sum + cat.players.filter((p) => p.leader).length,
      0
    ) || 0;

  const rank =
    standingRow ? standings.findIndex((s) => s.team_code === standingRow.team_code) + 1 : "-";

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Миний баг" value={team?.code || "-"} accent="cyan" />
        <StatCard label="Байр" value={String(rank)} accent="amber" />
        <StatCard label="Leader" value={String(totalLeaders)} accent="emerald" />
        <StatCard label="Нийт тоглогч" value={String(totalPlayers)} accent="white" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Миний багийн үзүүлэлт" subtitle="Оноо, хожил, хожигдол, тэнцээ">
          {loading ? (
            <EmptyState text="Мэдээлэл ачаалж байна..." />
          ) : !standingRow ? (
            <EmptyState text="Энэ багийн standings мэдээлэл алга." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniMetric label="Оноо" value={String(standingRow.points)} accent="amber" />
              <MiniMetric label="Хожил" value={String(standingRow.wins)} accent="emerald" />
              <MiniMetric label="Хожигдол" value={String(standingRow.losses)} accent="cyan" />
              <MiniMetric label="Тэнцээ" value={String(standingRow.draws)} accent="white" />
            </div>
          )}
        </Panel>

        <Panel title="Ангиллын товч мэдээлэл" subtitle="Багийн ангилал тус бүрийн дүүргэлт">
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
                      {category.sport_key}
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
        <Panel title="Ойрын тоглолтууд" subtitle="Миний багийн дараагийн тоглолтууд">
          {loading ? (
            <EmptyState text="Тоглолтуудыг ачаалж байна..." />
          ) : upcoming.length === 0 ? (
            <EmptyState text="Ойрын тоглолт алга." />
          ) : (
            <div className="space-y-3">
              {upcoming.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Сүүлийн үр дүн" subtitle="Дууссан тоглолтуудын оноо">
          {loading ? (
            <EmptyState text="Үр дүнг ачаалж байна..." />
          ) : completed.length === 0 ? (
            <EmptyState text="Дууссан тоглолтын мэдээлэл алга." />
          ) : (
            <div className="space-y-3">
              {completed.map((match) => (
                <MatchCard key={match.id} match={match} />
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

      <div className="mt-1 text-xs text-slate-400">
        {formatDateTime(match.start_at)}
      </div>

      <div className="mt-1 text-xs text-slate-400">
        Байршил: {match.venue || "-"}
      </div>

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
      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</div>
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