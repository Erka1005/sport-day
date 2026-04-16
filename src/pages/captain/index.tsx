import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Noto_Sans } from "next/font/google";
import CaptainOverviewDashboard from "@/components/captain/captain-overview-dashboard";
import {
  AuthUser,
  DashboardTeamItem,
  DraftMyTeamResponse,
  ScheduleItem,
  TeamItem,
  TeamMemberItem,
  getAuthUser,
  getMyDraftTeamApi,
  getResultsDashboardApi,
  listMembersApi,
  listScheduleApi,
  listTeamsApi,
  logout,
  renameMyTeamApi,
} from "@/services/api";

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

function getTeamStyle(colorHex?: string | null) {
  if (!colorHex) {
    return { backgroundColor: "#64748b" };
  }

  return {
    backgroundColor: colorHex,
    border:
      colorHex.toLowerCase() === "#ffffff"
        ? "1px solid #cbd5e1"
        : undefined,
  };
}

export default function CaptainPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [team, setTeam] = useState<TeamItem | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);

  const [standings, setStandings] = useState<DashboardTeamItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [myTeam, setMyTeam] = useState<DraftMyTeamResponse | null>(null);
  const [allMembers, setAllMembers] = useState<TeamMemberItem[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [teamNameInput, setTeamNameInput] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [renameSuccess, setRenameSuccess] = useState("");
  const [showSettings, setShowSettings] = useState(false);

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
    void Promise.all([
      loadCaptainTeam(user.user_id),
      loadCaptainOverview(user.user_id),
    ]);
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
      const [dashboardRows, scheduleRows, myTeamRows, teams] = await Promise.all([
        getResultsDashboardApi(userId),
        listScheduleApi(userId),
        getMyDraftTeamApi(userId),
        listTeamsApi(userId),
      ]);

      const myCurrentTeam =
        teams.find((item) => item.captain_user_id === userId) || null;

      let memberRows: TeamMemberItem[] = [];
      if (myCurrentTeam?.code) {
        memberRows = await listMembersApi({
          team_code: myCurrentTeam.code,
          userId,
        });
      }

      setStandings(dashboardRows.teams || []);
      setSchedules(scheduleRows || []);
      setMyTeam(myTeamRows);
      setAllMembers(memberRows || []);
    } catch (error) {
      console.error("Failed to load captain overview", error);
      setStandings([]);
      setSchedules([]);
      setMyTeam(null);
      setAllMembers([]);
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
      const updatedTeam = await renameMyTeamApi(
        { name: trimmed },
        user.user_id
      );
      setTeam(updatedTeam);
      setTeamNameInput(updatedTeam.name);
      setRenameSuccess("Багийн нэр амжилттай шинэчлэгдлээ.");
      await loadCaptainOverview(user.user_id);
    } catch (err) {
      setRenameError(
        err instanceof Error
          ? err.message
          : "Багийн нэр солих үед алдаа гарлаа."
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

  const teamStyle = useMemo(() => getTeamStyle(team?.color_hex), [team]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Ахлагчийн хэсгийг ачаалж байна...
      </div>
    );
  }

  return (
    <div className={`${notoSans.className} min-h-screen bg-[#07111f] text-white`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.14),transparent_22%),radial-gradient(circle_at_bottom,rgba(234,179,8,0.10),transparent_30%)]" />

      <div className="relative z-10">
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 sm:px-6 xl:px-8">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-[0.12em] text-emerald-200">
                MMS SPORTS CUP 2026
              </div>
              <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                Ахлагчийн самбар
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-right md:block">
                <div className="text-[11px] tracking-[0.12em] text-slate-300">
                  Нэвтэрсэн хэрэглэгч
                </div>

                <div className="mt-1 flex items-center justify-end gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={teamStyle}
                  />
                  <span className="max-w-[220px] truncate text-sm font-semibold text-white">
                    {displayName}
                  </span>
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

        <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 xl:px-8">
          <div className="mb-5 rounded-[28px] border border-white/10 bg-white/10 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-[0.12em] text-cyan-200">
                  БАГИЙН ТОВЧ УДИРДЛАГА
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="text-lg font-bold text-white sm:text-xl">
                    {team?.name || "Багийн нэргүй"}
                  </div>
                  {team?.code ? (
                    <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs font-semibold text-slate-200">
                      Код: {team.code}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  Доорх хэсгүүдээр багийнхаа мэдээллийг хэт олон cardгүйгээр цэгцтэй харна.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowSettings((prev) => !prev)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  {showSettings ? "Тохиргоог хаах" : "Багийн тохиргоо"}
                </button>

                <button
                  onClick={() => router.push("/standings")}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Бүтэн хүснэгт
                </button>
              </div>
            </div>

            {showSettings ? (
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Багийн нэр
                    </label>
                    <input
                      type="text"
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      placeholder="Багийн нэр"
                      className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none"
                    />

                    {renameError ? (
                      <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {renameError}
                      </div>
                    ) : null}

                    {renameSuccess ? (
                      <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        {renameSuccess}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => void handleRenameTeam()}
                      disabled={renameLoading}
                      className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-white transition disabled:opacity-70"
                    >
                      {renameLoading ? "Хадгалж байна..." : "Нэр шинэчлэх"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <CaptainOverviewDashboard
            team={team}
            standings={standings}
            schedules={schedules}
            myTeam={myTeam}
            allMembers={allMembers}
            loading={overviewLoading || teamLoading}
          />
        </main>
      </div>
    </div>
  );
}