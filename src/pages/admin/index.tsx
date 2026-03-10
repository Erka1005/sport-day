// pages/admin.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/admin/admin-layout";
import AdminSidebar, { AdminSection } from "@/components/admin/admin-sidebar";
import SportFormCard from "@/components/admin/sport-form-card";
import SportListCard from "@/components/admin/sport-list-card";
import MatchFormCard from "@/components/admin/match-form-card";
import MatchListCard from "@/components/admin/match-list-card";
import ResultFormCard from "@/components/admin/result-form-card";
import ResultHistoryCard from "@/components/admin/result-history-card";
import DraftShell from "@/components/draft/draft-shell";
import {
  AuthUser,
  CreateMatchPayload,
  CreateSportPayload,
  MatchItem,
  SportItem,
  createMatchApi,
  createSportApi,
  getAuthUser,
  listMatchesApi,
  listSportsApi,
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
    void Promise.all([loadSports(user.user_id), loadMatches(user.user_id)]);
  }, [user]);

  async function loadSports(userId: number) {
    setSportsLoading(true);
    setSportsError("");

    try {
      const items = await listSportsApi(userId);
      setSports(items);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load sports.";
      setSportsError(message);
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
      const message =
        err instanceof Error ? err.message : "Failed to load matches.";
      setMatchesError(message);
    } finally {
      setMatchesLoading(false);
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
    if (!user) {
      throw new Error("User not found.");
    }

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
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Configured Sports" value={String(sports.length)} />
            <StatCard label="Scheduled Matches" value={String(matches.length)} />
            <StatCard
              label="Submitted Results"
              value={String(resultHistory.length)}
              accent="emerald"
            />
            <StatCard label="Access Level" value="Admin" accent="amber" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <InfoCard
              title="Sports Management"
              desc="Create sport categories and review all configured sports."
            />
            <InfoCard
              title="Schedule Management"
              desc="Create matches and review the current event schedule."
            />
            <InfoCard
              title="Result Submission"
              desc="Submit match scores and keep track of recent result updates."
            />
            <InfoCard
              title="Draft Control"
              desc="This section is reserved for draft start and draft controls."
            />
          </div>
        </section>
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

     {activeSection === "draft" && <DraftShell mode="admin" user={user} />}
    </AdminLayout>
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
      <div className="text-sm text-slate-300">{label}</div>
      <div className={`mt-2 text-3xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function InfoCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{desc}</p>
    </div>
  );
}

function PlaceholderCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 backdrop-blur-xl">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{desc}</p>
    </div>
  );
}