// components/draft/draft-shell.tsx

import { useEffect, useMemo, useState } from "react";
import {
  addToDraftPoolApi,
  AuthUser,
  chooseDraftPlayerApi,
  confirmDraftPickApi,
  DraftPickItem,
  DraftPoolItem,
  getDraftPicksApi,
  getDraftPoolApi,
  resetDraftApi,
  startDraftApi,
  undoDraftApi,
} from "@/services/api";

type DraftMode = "admin" | "captain" | "viewer";

type DraftShellProps = {
  mode: DraftMode;
  user: AuthUser;
};

export default function DraftShell({ mode, user }: DraftShellProps) {
  const [roundsInput, setRoundsInput] = useState(7);

  const [pool, setPool] = useState<DraftPoolItem[]>([]);
  const [picks, setPicks] = useState<DraftPickItem[]>([]);

  const [poolLoading, setPoolLoading] = useState(true);
  const [picksLoading, setPicksLoading] = useState(true);

  const [poolError, setPoolError] = useState("");
  const [picksError, setPicksError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [employeeName, setEmployeeName] = useState("");

  useEffect(() => {
    void refreshAll();
  }, []);

  async function refreshPool() {
    setPoolLoading(true);
    setPoolError("");

    try {
      const data = await getDraftPoolApi();
      setPool(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load draft pool.";
      setPoolError(message);
    } finally {
      setPoolLoading(false);
    }
  }

  async function refreshPicks() {
    setPicksLoading(true);
    setPicksError("");

    try {
      const data = await getDraftPicksApi();
      setPicks(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load draft picks.";
      setPicksError(message);
    } finally {
      setPicksLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([refreshPool(), refreshPicks()]);
  }

  async function runAction(action: () => Promise<string>) {
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const msg = await action();
      setActionSuccess(msg);
      await refreshAll();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Draft action failed.";
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  }

  const groupedPicks = useMemo(() => {
    const map = new Map<string, DraftPickItem[]>();

    for (const pick of picks) {
      const key = pick.team_name || `Team ${pick.team_id ?? "-"}`;
      const current = map.get(key) || [];
      current.push(pick);
      map.set(key, current);
    }

    return Array.from(map.entries());
  }, [picks]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pool Players" value={String(pool.length)} accent="cyan" />
        <StatCard label="Confirmed Picks" value={String(picks.length)} accent="emerald" />
        <StatCard
          label="Draft View"
          value={mode === "admin" ? "Admin" : mode === "captain" ? "Captain" : "Public"}
          accent="amber"
        />
        <StatCard label="Signed User" value={user.username} />
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {actionError}
        </div>
      ) : null}

      {actionSuccess ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {actionSuccess}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          {mode === "admin" && (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
              <div className="mb-4">
                <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  Draft Controls
                </div>
                <h2 className="mt-3 text-xl font-bold text-white">Admin Actions</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Start, reset, and undo the draft process for all teams.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Rounds
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={roundsInput}
                    onChange={(e) => setRoundsInput(Number(e.target.value) || 1)}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    disabled={actionLoading}
                    onClick={() =>
                      void runAction(() => startDraftApi(roundsInput, user.user_id))
                    }
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Start
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => void runAction(() => resetDraftApi(user.user_id))}
                    className="rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Reset
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => void runAction(() => undoDraftApi(user.user_id))}
                    className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Undo
                  </button>
                </div>
              </div>
            </div>
          )}

          {mode === "captain" && (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
              <div className="mb-4">
                <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Captain Controls
                </div>
                <h2 className="mt-3 text-xl font-bold text-white">Pick Actions</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Add employee to pool, choose player, then confirm your draft pick.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Enter employee name"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div className="grid gap-3">
                  <button
                    disabled={actionLoading || !employeeName.trim()}
                    onClick={() =>
                      void runAction(() =>
                        addToDraftPoolApi(employeeName.trim(), user.user_id)
                      )
                    }
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Add to Pool
                  </button>

                  <button
                    disabled={actionLoading || !employeeName.trim()}
                    onClick={() =>
                      void runAction(() =>
                        chooseDraftPlayerApi(employeeName.trim(), user.user_id)
                      )
                    }
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Choose
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() => void runAction(() => confirmDraftPickApi(user.user_id))}
                    className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  Pool
                </div>
                <h2 className="mt-3 text-xl font-bold text-white">Draft Pool</h2>
              </div>

              <button
                onClick={() => void refreshPool()}
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
              >
                Refresh
              </button>
            </div>

            {poolError ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {poolError}
              </div>
            ) : poolLoading ? (
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
                Loading draft pool...
              </div>
            ) : pool.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
                No players in draft pool yet.
              </div>
            ) : (
              <div className="space-y-3">
                {pool.map((item, index) => (
                  <div
                    key={`${item.employee_name}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/10 p-4"
                  >
                    <div className="text-sm font-medium text-white">
                      {item.employee_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Picks
              </div>
              <h2 className="mt-3 text-xl font-bold text-white">Draft Picks</h2>
            </div>

            <button
              onClick={() => void refreshPicks()}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Refresh
            </button>
          </div>

          {picksError ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {picksError}
            </div>
          ) : picksLoading ? (
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
              Loading draft picks...
            </div>
          ) : picks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
              No confirmed picks yet.
            </div>
          ) : groupedPicks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
              No grouped picks available.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {groupedPicks.map(([teamName, teamPicks]) => (
                <div
                  key={teamName}
                  className="rounded-2xl border border-white/10 bg-black/10 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-white">{teamName}</div>
                    <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-200">
                      {teamPicks.length} picks
                    </div>
                  </div>

                  <div className="space-y-2">
                    {teamPicks.map((pick, index) => (
                      <div
                        key={`${pick.employee_name}-${index}`}
                        className="rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="text-sm font-medium text-white">
                          {pick.employee_name}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Round: {pick.round ?? "-"} • Pick: {pick.pick_number ?? "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
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