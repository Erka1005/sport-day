import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  AuthUser,
  ResultsDashboardResponse,
  getAuthUser,
  getResultsDashboardApi,
  logout,
} from "@/services/api";

function getTeamStyle(colorHex?: string | null) {
  if (!colorHex) return { backgroundColor: "#64748b" };
  return {
    backgroundColor: colorHex,
    border:
      colorHex.toLowerCase() === "#ffffff"
        ? "1px solid #cbd5e1"
        : undefined,
  };
}

export default function StandingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<ResultsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = getAuthUser();
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    setUser(currentUser);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    void loadData(user.user_id);
  }, [user]);

  async function loadData(userId: number) {
    setLoading(true);
    setError("");

    try {
      const res = await getResultsDashboardApi(userId);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Standings ачаалахад алдаа гарлаа.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace("/login");
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
              <h1 className="mt-1 text-3xl font-black text-white">Standings</h1>
              <p className="mt-1 text-sm text-slate-300">
                Нийт бүх тэмцээний нийлбэр дүн
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Буцах
              </button>
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
          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-6 text-sm text-slate-300">
              Loading standings...
            </div>
          ) : !data || data.teams.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-6 text-sm text-slate-300">
              Standings мэдээлэл алга.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl">
                <div className="grid grid-cols-[0.8fr_2fr_1fr] bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                  <div>Rank</div>
                  <div>Баг</div>
                  <div>Total</div>
                </div>

                <div className="divide-y divide-white/10">
                  {data.teams.map((team) => (
                    <div
                      key={team.team_code}
                      className="grid grid-cols-[0.8fr_2fr_1fr] items-center bg-black/10 px-4 py-4"
                    >
                      <div className="text-xl font-black text-cyan-300">
                        {team.overall_rank}
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block h-4 w-4 rounded-full"
                          style={getTeamStyle(team.team_color_hex)}
                        />
                        <div>
                          <div className="font-semibold text-white">
                            {team.team_name}
                          </div>
                          <div className="text-xs text-slate-400">{team.team_code}</div>
                        </div>
                      </div>

                      <div className="text-lg font-black text-amber-300">
                        {team.total_score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                {data.sports.map((sport) => (
                  <div
                    key={sport.sport_key}
                    className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl"
                  >
                    <div className="mb-4">
                      <div className="text-lg font-bold text-white">
                        {sport.sport_name}
                      </div>
                      <div className="text-xs text-slate-400">{sport.sport_key}</div>
                    </div>

                    <div className="space-y-2">
                      {sport.results.map((row) => (
                        <div
                          key={`${sport.sport_key}-${row.team_code}`}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="inline-block h-4 w-4 rounded-full"
                              style={getTeamStyle(row.team_color_hex)}
                            />
                            <div className="text-sm text-white">
                              {row.team_name} ({row.team_code})
                            </div>
                          </div>

                          <div className="flex gap-2 text-xs">
                            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-200">
                              Rank: {row.rank}
                            </span>
                            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-amber-200">
                              Score: {row.score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}