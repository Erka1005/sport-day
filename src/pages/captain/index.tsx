import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import CaptainOverviewDashboard from "@/components/captain/captain-overview-dashboard";
import MyTeamCard from "@/components/captain/my-team-card";
import {
  AuthUser,
  DraftMyTeamResponse,
  MatchItem,
  StandingItem,
  TeamItem,
  getAuthUser,
  getMyDraftTeamApi,
  listMatchesApi,
  listStandingsApi,
  listTeamsApi,
  logout,
  renameMyTeamApi,
} from "@/services/api";

function getTeamColorClass(colorHex?: string | null): string {
  if (!colorHex) return "bg-slate-400";

  const normalized = colorHex.toLowerCase();

  if (normalized === "#ffffff") return "bg-white border border-slate-300";
  if (normalized === "#000000" || normalized === "#111111") {
    return "bg-black border border-white/20";
  }
  if (normalized === "#ff0000") return "bg-red-500";
  if (normalized === "#0000ff") return "bg-blue-500";
  if (normalized === "#ffff00") return "bg-yellow-400";
  if (normalized === "#008000") return "bg-green-700";
  if (normalized === "#ffa500") return "bg-orange-500";
  if (normalized === "#ffc0cb") return "bg-pink-500";

  return "bg-slate-400";
}

export default function CaptainPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [team, setTeam] = useState<TeamItem | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);

  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [myTeam, setMyTeam] = useState<DraftMyTeamResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [teamNameInput, setTeamNameInput] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [renameSuccess, setRenameSuccess] = useState("");

  useEffect(() => {
    const currentUser = getAuthUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "captain") {
      router.replace("/");
      return;
    }

    setUser(currentUser);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    void Promise.all([loadCaptainTeam(user.user_id), loadCaptainOverview(user.user_id)]);
  }, [user]);

  async function loadCaptainTeam(userId: number) {
    setTeamLoading(true);
    setRenameError("");

    try {
      const teams = await listTeamsApi(userId);
      const myCurrentTeam =
        teams.find((item) => item.captain_user_id === userId) || null;

      setTeam(myCurrentTeam);
      setTeamNameInput(myCurrentTeam?.name || "");
    } catch (error) {
      console.error("Failed to load captain team", error);
      setTeam(null);
    } finally {
      setTeamLoading(false);
    }
  }

  async function loadCaptainOverview(userId: number) {
    setOverviewLoading(true);

    try {
      const [standingRows, matchRows, myTeamRows] = await Promise.all([
        listStandingsApi(userId),
        listMatchesApi(userId),
        getMyDraftTeamApi(userId),
      ]);

      setStandings(standingRows);
      setMatches(matchRows);
      setMyTeam(myTeamRows);
    } catch (error) {
      console.error("Failed to load captain overview", error);
      setStandings([]);
      setMatches([]);
      setMyTeam(null);
    } finally {
      setOverviewLoading(false);
    }
  }

  async function handleRenameTeam() {
    if (!user) return;

    const trimmed = teamNameInput.trim();

    setRenameError("");
    setRenameSuccess("");

    if (!trimmed) {
      setRenameError("Багийн нэр хоосон байж болохгүй.");
      return;
    }

    if (trimmed.length < 2) {
      setRenameError("Багийн нэр хэт богино байна.");
      return;
    }

    if (team?.name?.trim() === trimmed) {
      setRenameError("Шинэ нэр нь одоогийн нэртэй ижил байна.");
      return;
    }

    setRenameLoading(true);

    try {
      const updatedTeam = await renameMyTeamApi({ name: trimmed }, user.user_id);
      setTeam(updatedTeam);
      setTeamNameInput(updatedTeam.name);
      setRenameSuccess("Багийн нэр амжилттай шинэчлэгдлээ.");
    } catch (err) {
      setRenameError(
        err instanceof Error ? err.message : "Багийн нэр солих үед алдаа гарлаа."
      );
    } finally {
      setRenameLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const displayName = useMemo(() => {
    if (team?.name) return `${team.name} ахлагч`;
    if (user?.username) return user.username;
    return "";
  }, [team, user]);

  const colorClass = useMemo(() => getTeamColorClass(team?.color_hex), [team]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Ахлагчийн хэсгийг ачаалж байна...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.14),transparent_22%),radial-gradient(circle_at_bottom,rgba(234,179,8,0.10),transparent_30%)]" />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                MMS Sports Day
              </div>
              <h1 className="mt-1 text-3xl font-black text-white">Ахлагчийн самбар</h1>
              <p className="mt-1 text-sm text-slate-300">
                Багийн мэдээлэл, оноо, тоглолт, бүрэлдэхүүнийг нэг дороос харна.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-right md:block">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                  Нэвтэрсэн хэрэглэгч
                </div>

                <div className="mt-1 flex items-center justify-end gap-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${colorClass}`} />
                  <span className="text-sm font-semibold text-white">{displayName}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Гарах
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    Багийн төлөв
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <span className={`inline-block h-4 w-4 rounded-full ${colorClass}`} />
                    <h2 className="text-2xl font-black text-white">
                      {teamLoading ? "Багийг ачаалж байна..." : team ? `${team.name} ахлагч` : user.username}
                    </h2>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {team
                      ? `${team.name} (${team.code}) багийн ахлагчийн удирдлагын хэсэг`
                      : "Таны багийн мэдээллийг ачаалж байна."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniInfoCard label="Эрх" value="Ахлагч" accent="emerald" />
                  <MiniInfoCard label="Багийн код" value={team?.code || "-"} accent="cyan" />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
                Багийн тохиргоо
              </div>
              <h2 className="mt-2 text-xl font-bold text-white">Багийн нэр солих</h2>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Эндээс багийнхаа нэрийг шинэчилнэ.
              </p>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Багийн нэр
                </label>
                <input
                  type="text"
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value)}
                  placeholder="Шинэ нэр оруулна уу"
                  disabled={teamLoading || renameLoading || !team}
                  className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTeamNameInput(team?.name || "");
                    setRenameError("");
                    setRenameSuccess("");
                  }}
                  disabled={renameLoading || teamLoading || !team}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Буцаах
                </button>

                <button
                  type="button"
                  onClick={() => void handleRenameTeam()}
                  disabled={renameLoading || teamLoading || !team}
                  className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {renameLoading ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>

              {renameError ? (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {renameError}
                </div>
              ) : null}

              {renameSuccess ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {renameSuccess}
                </div>
              ) : null}
            </div>
          </div>

          <CaptainOverviewDashboard
            team={team}
            standings={standings}
            matches={matches}
            myTeam={myTeam}
            loading={overviewLoading}
          />

          <div className="mt-6">
            <MyTeamCard userId={user.user_id} />
          </div>
        </main>
      </div>
    </div>
  );
}

function MiniInfoCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "emerald" | "cyan";
}) {
  const color = accent === "emerald" ? "text-emerald-300" : "text-cyan-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className={`mt-2 text-lg font-black ${color}`}>{value}</div>
    </div>
  );
}