import { useCallback, useEffect, useState } from "react";
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
import StandingsDashboardCard from "@/components/admin/standings-dashboard-card";
import {
  AuthUser,
  BulkSetSportResultItem,
  CreateSchedulePayload,
  CreateSportPayload,
  DraftRosterResponse,
  ResultsDashboardResponse,
  ScheduleItem,
  SportItem,
  SportResultRow,
  TeamItem,
  bulkSetSportResultsApi,
  createScheduleApi,
  createSportApi,
  getAuthUser,
  getDraftRosterApi,
  getResultsDashboardApi,
  getSportResultsApi,
  listScheduleApi,
  listSportsApi,
  listTeamsApi,
} from "@/services/api";

type ResultHistoryItem = {
  id: string;
  sportKey: string;
  sportName: string;
  savedAt: string;
  count: number;
  message: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");

  const [sports, setSports] = useState<SportItem[]>([]);
  const [sportsLoading, setSportsLoading] = useState(true);
  const [sportsError, setSportsError] = useState("");

  const [matches, setMatches] = useState<ScheduleItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState("");

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");

  const [resultsDashboard, setResultsDashboard] =
    useState<ResultsDashboardResponse | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [standingsError, setStandingsError] = useState("");

  const [roster, setRoster] = useState<DraftRosterResponse | null>(null);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState("");

  const [selectedSportResults, setSelectedSportResults] = useState<SportResultRow[]>([]);
  const [selectedSportResultsLoading, setSelectedSportResultsLoading] = useState(false);

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
      loadSchedule(user.user_id),
      loadTeams(user.user_id),
      loadResultsDashboard(user.user_id),
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

  async function loadSchedule(userId: number) {
    setMatchesLoading(true);
    setMatchesError("");

    try {
      const items = await listScheduleApi(userId);
      setMatches(items);
    } catch (err) {
      setMatchesError(err instanceof Error ? err.message : "Failed to load schedule.");
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

  async function loadResultsDashboard(userId: number) {
    setStandingsLoading(true);
    setStandingsError("");

    try {
      const items = await getResultsDashboardApi(userId);
      setResultsDashboard(items);
    } catch (err) {
      setStandingsError(
        err instanceof Error ? err.message : "Failed to load standings."
      );
      setResultsDashboard(null);
    } finally {
      setStandingsLoading(false);
    }
  }

  const loadSportResults = useCallback(
    async (sportKey: string) => {
      if (!user || !sportKey) return;

      setSelectedSportResultsLoading(true);

      try {
        const response = await getSportResultsApi(sportKey, user.user_id);
        setSelectedSportResults(response.results || []);
      } catch (err) {
        console.error("Failed to load sport results", err);
        setSelectedSportResults([]);
      } finally {
        setSelectedSportResultsLoading(false);
      }
    },
    [user]
  );

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

  async function handleCreateSchedule(payload: CreateSchedulePayload) {
    if (!user) throw new Error("User not found.");

    const created = await createScheduleApi(payload, user.user_id);
    setMatches((prev) => [created, ...prev]);
  }

  async function handleBulkSaveResults(
    sportKey: string,
    results: BulkSetSportResultItem[]
  ) {
    if (!user) throw new Error("User not found.");

    const message = await bulkSetSportResultsApi(
      {
        sport_key: sportKey,
        results,
      },
      user.user_id
    );

    const sport = sports.find((x) => x.key === sportKey);

    setResultHistory((prev) => [
      {
        id: `${Date.now()}-${sportKey}`,
        sportKey,
        sportName: sport?.name || sportKey,
        savedAt: new Date().toLocaleString("mn-MN"),
        count: results.length,
        message,
      },
      ...prev,
    ]);

    await loadSportResults(sportKey);
    await loadResultsDashboard(user.user_id);

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
  standings={resultsDashboard?.teams || []}
  resultsDashboard={resultsDashboard}
  sportsLoading={sportsLoading}
  matchesLoading={matchesLoading}
  teamsLoading={teamsLoading}
  standingsLoading={standingsLoading}
  teamsError={teamsError}
  standingsError={standingsError}
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
          <MatchFormCard sports={sports} onSubmit={handleCreateSchedule} />
          <MatchListCard
            matches={matches}
            loading={matchesLoading}
            error={matchesError}
            onRefresh={async () => {
              await loadSchedule(user.user_id);
            }}
          />
        </section>
      )}

      {activeSection === "results" && (
        <section className="grid gap-6 xl:grid-cols-2">
          <ResultFormCard
            sports={sports}
            teams={teams}
            currentResults={selectedSportResults}
            loadingCurrent={selectedSportResultsLoading}
            onLoad={loadSportResults}
            onSubmit={handleBulkSaveResults}
          />
          <ResultHistoryCard items={resultHistory} />
        </section>
      )}

      {activeSection === "standings" && (
        <section>
          <StandingsDashboardCard
            data={resultsDashboard}
            loading={standingsLoading}
            error={standingsError}
            onRefresh={async () => {
              await loadResultsDashboard(user.user_id);
            }}
          />
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
              uses_draft=true sport дээр pool, choose, confirm UI-г дараагийн
              алхмаар холбоно.
            </p>
          </div>
        </section>
      )}
    </AdminLayout>
  );
}