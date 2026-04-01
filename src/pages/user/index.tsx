import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PublicOverviewDashboard from "@/components/public/public-overview-dashboard";
import {
  AuthUser,
  DraftRosterResponse,
  MatchItem,
  SportItem,
  StandingItem,
  TeamItem,
  getAuthUser,
  getDraftRosterApi,
  listMatchesApi,
  listSportsApi,
  listStandingsApi,
  listTeamsApi,
  logout,
} from "@/services/api";

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const [sports, setSports] = useState<SportItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [roster, setRoster] = useState<DraftRosterResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

  async function loadPublicData(userId: number) {
    setLoading(true);

    try {
      const [sportRows, teamRows, matchRows, standingRows, rosterRows] =
        await Promise.all([
          listSportsApi(userId),
          listTeamsApi(userId),
          listMatchesApi(userId),
          listStandingsApi(userId),
          getDraftRosterApi(),
        ]);

      setSports(sportRows);
      setTeams(teamRows);
      setMatches(matchRows);
      setStandings(standingRows);
      setRoster(rosterRows);
    } catch (error) {
      console.error("Failed to load public data", error);
      setSports([]);
      setTeams([]);
      setMatches([]);
      setStandings([]);
      setRoster(null);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Нийтийн самбарыг ачаалж байна...
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
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                MMS Sports Day
              </div>
              <h1 className="mt-1 text-3xl font-black text-white">
                Нийтийн мэдээллийн самбар
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Бүх баг, тоглолт, оноо, бүрэлдэхүүний мэдээллийг read-only горимоор харна.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-right md:block">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-300">
                  Нэвтэрсэн хэрэглэгч
                </div>
                <div className="text-sm font-semibold text-white">{user.username}</div>
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
          <div className="mb-6 rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Ерөнхий харагдац
                </div>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Тэмцээний нэгдсэн мэдээлэл
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Одоогийн онооны хүснэгт, ойрын тоглолтууд, сүүлийн үр дүн болон
                  багуудын бүрэлдэхүүнийг эндээс харна.
                </p>
              </div>

              <button
                onClick={() => void loadPublicData(user.user_id)}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-200"
              >
                {loading ? "Шинэчилж байна..." : "Дахин ачаалах"}
              </button>
            </div>
          </div>

          <PublicOverviewDashboard
            sports={sports}
            teams={teams}
            matches={matches}
            standings={standings}
            roster={roster}
            loading={loading}
          />
        </main>
      </div>
    </div>
  );
}