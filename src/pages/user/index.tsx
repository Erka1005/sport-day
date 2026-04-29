import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import PublicHero from "@/components/public/public-hero";
import PublicQuickStats from "@/components/public/public-quick-stats";
import PublicLeaderboardSection from "@/components/public/public-leaderboard-section";
import PublicUpcomingScheduleSection from "@/components/public/public-upcoming-schedule-section";
import PublicSportResultsSection from "@/components/public/public-sport-results-section";
import { heroSlides } from "@/mock/public-dashboard-mock";
import {
  AuthUser,
  ResultsDashboardResponse,
  ScheduleItem,
  SportItem,
  TeamItem,
  getAuthUser,
  getResultsDashboardApi,
  listScheduleApi,
  listSportsApi,
  listTeamsApi,
  logout,
} from "@/services/api";

type ViewKey = "overview" | "leaderboard" | "schedule" | "results";

const VIEW_ITEMS: { key: ViewKey; label: string }[] = [
  { key: "overview", label: "Ерөнхий" },
  { key: "leaderboard", label: "Хүснэгт" },
  { key: "schedule", label: "Хуваарь" },
  { key: "results", label: "Үр дүн" },
];

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sports, setSports] = useState<SportItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [dashboard, setDashboard] = useState<ResultsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const currentUser = getAuthUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "user") {
      router.replace("/");
      return;
    }

    setUser(currentUser);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    void loadPublicData(user.user_id);
  }, [user]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeView]);

  async function loadPublicData(userId: number) {
    setLoading(true);

    try {
      const [sportRows, teamRows, scheduleRows, dashboardRows] =
        await Promise.all([
          listSportsApi(userId),
          listTeamsApi(userId),
          listScheduleApi(userId),
          getResultsDashboardApi(userId),
        ]);

      setSports(sportRows);
      setTeams(teamRows);
      setSchedules(scheduleRows);
      setDashboard(dashboardRows);
    } catch (error) {
      console.error("Failed to load public data", error);
      setSports([]);
      setTeams([]);
      setSchedules([]);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function handleViewChange(view: ViewKey) {
    setActiveView(view);
    setMobileMenuOpen(false);
  }

  const quickStats = useMemo(() => {
    const resultCount =
      dashboard?.sports?.reduce((acc, item) => acc + item.results.length, 0) ?? 0;

    return [
      { id: 1, label: "Нийт спорт", value: loading ? "..." : String(sports.length), helper: "Тэмцээний төрлүүд" },
      { id: 2, label: "Нийт баг", value: loading ? "..." : String(teams.length), helper: "Оролцож буй багууд" },
      { id: 3, label: "Хуваарь", value: loading ? "..." : String(schedules.length), helper: "Нийт тоглолтын тоо" },
      { id: 4, label: "Үр дүн", value: loading ? "..." : String(resultCount), helper: "Бүртгэгдсэн үр дүн" },
    ];
  }, [sports.length, teams.length, schedules.length, dashboard, loading]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Ачаалж байна...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_18%)]" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07111f]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-5 lg:px-8 xl:px-12">
          <div className="flex min-h-[64px] items-center justify-between gap-4">
            <div className="min-w-0 shrink-0">
              <div className="text-base font-black uppercase tracking-[0.22em] text-cyan-200 md:text-lg">
                MMS Sports Cup
              </div>
              <div className="mt-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                2026 Dashboard
              </div>
            </div>

            <nav className="hidden flex-1 justify-center lg:flex">
              <div className="flex rounded-[24px] border border-white/10 bg-white/[0.04] p-1">
                {VIEW_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleViewChange(item.key)}
                    className={`rounded-[20px] px-5 py-2.5 text-sm font-bold transition ${
                      activeView === item.key
                        ? "bg-cyan-400/15 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>

            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <div className="flex items-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.05] px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/15 text-sm font-black text-cyan-200">
                  {user.username?.slice(0, 1).toUpperCase()}
                </div>
                <div className="max-w-[120px] truncate text-sm font-bold text-white">
                  {user.username}
                </div>
              </div>

              <button
                onClick={() => void loadPublicData(user.user_id)}
                disabled={loading}
                className="rounded-[20px] border border-cyan-400/15 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-60"
              >
                {loading ? "Ачаалж..." : "Шинэчлэх"}
              </button>

              <button
                onClick={handleLogout}
                className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-500/15 hover:text-rose-100"
              >
                Гарах
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] lg:hidden"
            >
              ☰
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="mt-3 rounded-[24px] border border-white/10 bg-[#0b1728] p-4 shadow-lg lg:hidden">
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 font-black text-cyan-200">
                  {user.username?.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    User
                  </div>
                  <div className="truncate text-sm font-bold text-white">
                    {user.username}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {VIEW_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleViewChange(item.key)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                      activeView === item.key
                        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                        : "border-white/10 bg-white/[0.04] text-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => void loadPublicData(user.user_id)}
                  className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-200"
                >
                  {loading ? "Ачаалж байна..." : "Шинэчлэх"}
                </button>

                <button
                  onClick={handleLogout}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-white"
                >
                  Гарах
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-5 sm:px-5 sm:py-6 lg:px-8 xl:px-12">
        {activeView === "overview" && (
          <>
         <PublicHero
  slides={heroSlides}
  onScheduleClick={() => setActiveView("schedule")}
/>
            <PublicQuickStats items={quickStats} />
          </>
        )}

        {activeView === "leaderboard" && (
          <PublicLeaderboardSection teams={dashboard?.teams || []} loading={loading} />
        )}

        {activeView === "schedule" && (
          <PublicUpcomingScheduleSection schedules={schedules} loading={loading} />
        )}

        {activeView === "results" && (
          <PublicSportResultsSection sports={dashboard?.sports || []} loading={loading} />
        )}
      </main>
    </div>
  );
}