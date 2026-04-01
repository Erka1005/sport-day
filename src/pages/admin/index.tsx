import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/admin/admin-layout";
import AdminSidebar, { AdminSection } from "@/components/admin/admin-sidebar";
import AdminOverviewDashboard from "@/components/admin/admin-overview-dashboard";
import SportFormCard from "@/components/admin/sport-form-card";
import SportListCard from "@/components/admin/sport-list-card";
import MatchFormCard from "@/components/admin/match-form-card";
import MatchListCard from "@/components/admin/match-list-card";
import ResultFormCard from "@/components/admin/result-form-card";
import ResultHistoryCard from "@/components/admin/result-history-card";
import RosterManagementCard from "@/components/admin/roster-management-card";
import {
  AuthUser,
  CreateMatchPayload,
  CreateSportPayload,
  DraftRosterResponse,
  MatchItem,
  SportItem,
  StandingItem,
  TeamItem,
  createMatchApi,
  createSportApi,
  getAuthUser,
  getDraftRosterApi,
  listMatchesApi,
  listSportsApi,
  listStandingsApi,
  listTeamsApi,
  setMatchResultApi,
} from "@/services/api";

type ResultHistoryItem = {
  id: string;
  matchId: number;
  scoreA: number;
  scoreB: number;
  createdAt: string;
  message: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");

  const [sports, setSports] = useState<SportItem[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [sportsError, setSportsError] = useState("");

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState("");

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");

  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState("");

  const [roster, setRoster] = useState<DraftRosterResponse | null>(null);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState("");

  const [resultHistory, setResultHistory] = useState<ResultHistoryItem[]>([]);

  useEffect(() => {
    const currentUser = getAuthUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (currentUser.role !== "admin") {
      router.replace("/");
      return;
    }

    setUser(currentUser);
  }, [router]);

  useEffect(() => {
    if (!user) return;

    void Promise.all([
      loadSports(user.user_id),
      loadMatches(user.user_id),
      loadTeams(user.user_id),
      loadStandings(user.user_id),
      loadRoster(),
    ]);
  }, [user]);

  async function loadSports(userId: number) {
    setSportsLoading(true);
    setSportsError("");

    try {
      const items = await listSportsApi(userId);
      setSports(items);
    } catch (err) {
      setSportsError(err instanceof Error ? err.message : "Failed to load sports.");
    } finally {
      setSportsLoading(false);
    }
  }

  async function loadMatches(userId: number) {
    setMatchesLoading(true);
    setMatchesError("");

    try {
      const items = await listMatchesApi(userId);
      setMatches(items);
    } catch (err) {
      setMatchesError(err instanceof Error ? err.message : "Failed to load matches.");
    } finally {
      setMatchesLoading(false);
    }
  }

  async function loadTeams(userId: number) {
    setTeamsLoading(true);
    setTeamsError("");

    try {
      const items = await listTeamsApi(userId);
      setTeams(items);
    } catch (err) {
      setTeamsError(err instanceof Error ? err.message : "Failed to load teams.");
    } finally {
      setTeamsLoading(false);
    }
  }

  async function loadStandings(userId: number) {
    setStandingsLoading(true);
    setStandingsError("");

    try {
      const items = await listStandingsApi(userId);
      setStandings(items);
    } catch (err) {
      setStandingsError(
        err instanceof Error ? err.message : "Failed to load standings."
      );
    } finally {
      setStandingsLoading(false);
    }
  }

  async function loadRoster() {
    setRosterLoading(true);
    setRosterError("");

    try {
      const data = await getDraftRosterApi();
      setRoster(data);
    } catch (err) {
      setRosterError(err instanceof Error ? err.message : "Failed to load roster.");
      setRoster(null);
    } finally {
      setRosterLoading(false);
    }
  }

  async function handleCreateSport(payload: CreateSportPayload) {
    if (!user) throw new Error("User not found.");

    const created = await createSportApi(payload, user.user_id);
    setSports((prev) => [created, ...prev]);
  }

  async function handleCreateMatch(payload: CreateMatchPayload) {
    if (!user) throw new Error("User not found.");

    const created = await createMatchApi(payload, user.user_id);
    setMatches((prev) => [created, ...prev]);
  }

  async function handleSetResult(
    matchId: number,
    payload: { score_a: number; score_b: number }
  ) {
    if (!user) throw new Error("User not found.");

    const message = await setMatchResultApi(matchId, payload, user.user_id);

    setResultHistory((prev) => [
      {
        id: `${Date.now()}-${matchId}`,
        matchId,
        scoreA: payload.score_a,
        scoreB: payload.score_b,
        createdAt: new Date().toLocaleString(),
        message,
      },
      ...prev,
    ]);

    setMatches((prev) =>
      prev.map((item) =>
        item.id === matchId
          ? {
              ...item,
              score_a: payload.score_a,
              score_b: payload.score_b,
              status: "completed",
            }
          : item
      )
    );

    await loadStandings(user.user_id);
    await loadRoster();

    return message;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading admin portal...
      </div>
    );
  }

  return (
    <AdminLayout
      username={user.username}
      sidebar={
        <AdminSidebar
          activeSection={activeSection}
          onChange={setActiveSection}
        />
      }
    >
      {activeSection === "overview" && (
        <AdminOverviewDashboard
          sports={sports}
          teams={teams}
          matches={matches}
          standings={standings}
          roster={roster}
          sportsLoading={sportsLoading}
          matchesLoading={matchesLoading}
          teamsLoading={teamsLoading}
          standingsLoading={standingsLoading}
          rosterLoading={rosterLoading}
          teamsError={teamsError}
          standingsError={standingsError}
          rosterError={rosterError}
        />
      )}

      {activeSection === "sports" && (
        <section className="grid gap-6 xl:grid-cols-2">
          <SportFormCard onSubmit={handleCreateSport} />
          <SportListCard
            sports={sports}
            loading={sportsLoading}
            error={sportsError}
            onRefresh={async () => {
              await loadSports(user.user_id);
            }}
          />
        </section>
      )}

      {activeSection === "schedule" && (
        <section className="grid gap-6 xl:grid-cols-2">
          <MatchFormCard sports={sports} onSubmit={handleCreateMatch} />
          <MatchListCard
            matches={matches}
            sports={sports}
            loading={matchesLoading}
            error={matchesError}
            onRefresh={async () => {
              await loadMatches(user.user_id);
            }}
          />
        </section>
      )}

      {activeSection === "results" && (
        <section className="grid gap-6 xl:grid-cols-2">
          <ResultFormCard onSubmit={handleSetResult} />
          <ResultHistoryCard items={resultHistory} />
        </section>
      )}

      {activeSection === "roster" && (
        <section>
          <RosterManagementCard
            userId={user.user_id}
            teams={teams}
            sports={sports}
          />
        </section>
      )}

      {activeSection === "draft" && (
        <section>
          <div className="rounded-3xl border border-dashed border-cyan-400/20 bg-cyan-500/10 p-8 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white">Draft panel</h3>
            <p className="mt-2 text-sm text-slate-300">
              Uses_draft=true sport дээр pool, choose, confirm UI-г дараагийн
              алхмаар холбоно.
            </p>
          </div>
        </section>
      )}
    </AdminLayout>
  );
}