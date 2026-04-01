import { useEffect, useMemo, useState } from "react";
import { DraftMyTeamResponse, getMyDraftTeamApi } from "@/services/api";
import { resolveMediaUrl } from "@/lib/media";

type Props = {
  userId: number;
};

function formatSportKey(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase() || "")
    .join("");
}

function getTotalPlayers(data: DraftMyTeamResponse | null) {
  if (!data) return 0;
  return data.categories.reduce((sum, cat) => sum + cat.players.length, 0);
}

function getLeaderCount(data: DraftMyTeamResponse | null) {
  if (!data) return 0;
  return data.categories.reduce(
    (sum, cat) => sum + cat.players.filter((p) => p.leader).length,
    0
  );
}

export default function MyTeamCard({ userId }: Props) {
  const [data, setData] = useState<DraftMyTeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMyTeam() {
    setLoading(true);
    setError("");

    try {
      const result = await getMyDraftTeamApi(userId);
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Миний багийн мэдээлэл татах үед алдаа гарлаа."
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMyTeam();
  }, [userId]);

  const totalPlayers = useMemo(() => getTotalPlayers(data), [data]);
  const totalLeaders = useMemo(() => getLeaderCount(data), [data]);

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
              Миний бүрэлдэхүүн
            </div>

            <h2 className="mt-3 text-2xl font-black text-white">
              Багийн бүрэлдэхүүн
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Ангилал бүрээр багийн leader болон members-ийг ойлгомжтой байдлаар харуулна.
            </p>
          </div>

          <button
            onClick={() => void loadMyTeam()}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            {loading ? "Шинэчилж байна..." : "Дахин ачаалах"}
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && data ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SummaryStat label="Багийн код" value={data.team_code} accent="cyan" />
            <SummaryStat label="Нийт тоглогч" value={String(totalPlayers)} accent="white" />
            <SummaryStat label="Leader" value={String(totalLeaders)} accent="amber" />
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-white/10 bg-white/10 p-8 text-sm text-slate-300 backdrop-blur-xl">
          Бүрэлдэхүүнийг ачаалж байна...
        </div>
      ) : !data ? (
        <div className="rounded-[28px] border border-white/10 bg-white/10 p-8 text-sm text-slate-300 backdrop-blur-xl">
          Багийн мэдээлэл олдсонгүй.
        </div>
      ) : data.categories.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/10 p-8 text-sm text-slate-300 backdrop-blur-xl">
          Одоогоор бүрэлдэхүүн хоосон байна.
        </div>
      ) : (
        <div className="space-y-5">
          {data.categories.map((category) => {
            const leaders = category.players.filter((p) => p.leader).length;

            return (
              <div
                key={category.sport_key}
                className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl"
              >
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                      Ангилал
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-white">
                      {formatSportKey(category.sport_key)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      key: {category.sport_key}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {typeof category.quota === "number" ? (
                      <Badge tone="cyan">Квот: {category.quota}</Badge>
                    ) : null}
                    {typeof category.filled === "number" ? (
                      <Badge tone="emerald">Дүүргэлт: {category.filled}</Badge>
                    ) : null}
                    <Badge tone="amber">Leader: {leaders}</Badge>
                  </div>
                </div>

                {category.players.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-5 text-sm text-slate-300">
                    Энэ ангилалд одоогоор хүн алга.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {category.players.map((player) => {
                      const imageUrl = resolveMediaUrl(player.photo_url);

                      return (
                        <div
                          key={`${category.sport_key}-${player.employee_name}`}
                          className={`rounded-2xl border p-4 transition ${
                            player.leader
                              ? "border-amber-400/20 bg-amber-500/10"
                              : "border-white/10 bg-black/10"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={player.employee_name}
                                className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10"
                                onError={(e) => {
                                  const img = e.currentTarget;
                                  img.style.display = "none";
                                  const fallback = img.nextElementSibling as HTMLElement | null;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}

                            <div
                              className={`${
                                imageUrl ? "hidden" : "flex"
                              } h-16 w-16 items-center justify-center rounded-2xl bg-slate-700 text-sm font-bold text-slate-200`}
                            >
                              {getInitials(player.employee_name) || "U"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-white">
                                {player.employee_name}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {player.leader ? (
                                  <Badge tone="amber">⭐ Leader</Badge>
                                ) : (
                                  <Badge tone="slate">Гишүүн</Badge>
                                )}

                                {typeof player.round_no === "number" ? (
                                  <Badge tone="cyan">Round {player.round_no}</Badge>
                                ) : null}
                              </div>

                              {player.note ? (
                                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-slate-300">
                                  🏅 {player.note}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "white" | "cyan" | "amber";
}) {
  const color =
    accent === "cyan"
      ? "text-cyan-300"
      : accent === "amber"
      ? "text-amber-300"
      : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "cyan" | "emerald" | "amber" | "slate";
}) {
  const className =
    tone === "cyan"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
      : tone === "emerald"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : tone === "amber"
      ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
      : "border-slate-400/20 bg-slate-400/10 text-slate-200";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  );
}