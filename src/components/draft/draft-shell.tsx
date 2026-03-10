// components/draft/draft-shell.tsx

import { useEffect, useMemo, useState } from "react";
import {
  AuthUser,
  DraftPickItem,
  DraftPoolItem,
  DraftStateResponse,
  chooseDraftPlayerApi,
  confirmDraftPickApi,
  getDraftPicksApi,
  getDraftPoolApi,
  getDraftStateApi,
  importAllDraftFoldersApi,
  resetDraftApi,
  startDraftApi,
  undoDraftApi,
} from "@/services/api";

type DraftMode = "admin" | "captain" | "viewer";

type DraftShellProps = {
  mode: DraftMode;
  user: AuthUser;
};

const CATEGORY_OPTIONS = [
  { key: "male_basketball", label: "Men's Basketball", quota: 2 },
  { key: "female_basketball", label: "Women's Basketball", quota: 1 },
  { key: "male_volleyball", label: "Men's Volleyball", quota: 2 },
  { key: "female_volleyball", label: "Women's Volleyball", quota: 1 },
  { key: "male_tennis", label: "Men's Tennis", quota: 1 },
  { key: "female_tennis", label: "Women's Tennis", quota: 1 },

];

function normalizeMediaUrl(url?: string | null): string {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8000";

  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function prettyCategory(key: string): string {
  const found = CATEGORY_OPTIONS.find((item) => item.key === key);
  return found?.label || key;
}

function categoryQuota(key: string): string {
  const found = CATEGORY_OPTIONS.find((item) => item.key === key);
  if (!found) return "-";
  return found.quota > 0 ? `${found.quota} players per team` : "Custom";
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function DraftShell({ mode, user }: DraftShellProps) {
  const [selectedCategory, setSelectedCategory] = useState("male_basketball");
  const [roundsInput, setRoundsInput] = useState(7);

  const [pool, setPool] = useState<DraftPoolItem[]>([]);
  const [picks, setPicks] = useState<DraftPickItem[]>([]);
  const [draftState, setDraftState] = useState<DraftStateResponse | null>(null);

  const [poolLoading, setPoolLoading] = useState(true);
  const [picksLoading, setPicksLoading] = useState(true);
  const [stateLoading, setStateLoading] = useState(true);

  const [poolError, setPoolError] = useState("");
  const [picksError, setPicksError] = useState("");
  const [stateError, setStateError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

  useEffect(() => {
    void refreshState();
  }, []);

  useEffect(() => {
    void refreshForCategory(selectedCategory);
  }, [selectedCategory]);

  async function refreshPool(categoryKey: string) {
    setPoolLoading(true);
    setPoolError("");

    try {
      const data = await getDraftPoolApi(categoryKey);
      setPool(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load draft pool.";
      setPoolError(message);
    } finally {
      setPoolLoading(false);
    }
  }

  async function refreshPicks(categoryKey: string) {
    setPicksLoading(true);
    setPicksError("");

    try {
      const data = await getDraftPicksApi(categoryKey);
      setPicks(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load draft picks.";
      setPicksError(message);
    } finally {
      setPicksLoading(false);
    }
  }

  async function refreshState() {
    setStateLoading(true);
    setStateError("");

    try {
      const data = await getDraftStateApi();
      setDraftState(data);

      if (data?.sport_key) {
        setSelectedCategory(data.sport_key);
      }

      if (typeof data?.rounds === "number" && data.rounds > 0) {
        setRoundsInput(data.rounds);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load draft state.";
      setStateError(message);
    } finally {
      setStateLoading(false);
    }
  }

  async function refreshForCategory(categoryKey: string) {
    await Promise.all([refreshPool(categoryKey), refreshPicks(categoryKey)]);
  }

  async function refreshAll() {
    await Promise.all([refreshState(), refreshForCategory(selectedCategory)]);
  }

  async function runAction(action: () => Promise<string>) {
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const message = await action();
      setActionSuccess(message);
      await refreshAll();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Draft action failed.";
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  }

  const groupedPicksByRound = useMemo(() => {
    const map = new Map<number, DraftPickItem[]>();

    for (const pick of picks) {
      const current = map.get(pick.round_no) || [];
      current.push(pick);
      map.set(pick.round_no, current);
    }

    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [picks]);

  const selectedPoolPlayer = useMemo(() => {
    return pool.find((item) => item.employee_name === selectedEmployeeName) || null;
  }, [pool, selectedEmployeeName]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pool Players" value={String(pool.length)} accent="cyan" />
        <StatCard label="Confirmed Picks" value={String(picks.length)} accent="emerald" />
        <StatCard
          label="Draft Status"
          value={draftState?.status ? capitalize(draftState.status) : "Unknown"}
          accent="amber"
        />
        <StatCard label="Current Category" value={prettyCategory(selectedCategory)} />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Draft Categories
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">
              Select Draft Category
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((item) => {
              const active = selectedCategory === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedCategory(item.key)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-cyan-500 text-white"
                      : "border border-white/10 bg-white/10 text-slate-200 hover:bg-white/15"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
          Rule: <span className="font-semibold text-white">{categoryQuota(selectedCategory)}</span>
        </div>

        {stateError ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {stateError}
          </div>
        ) : stateLoading ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
            Loading draft state...
          </div>
        ) : draftState ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MiniInfo label="Status" value={capitalize(draftState.status)} />
            <MiniInfo
              label="Current Round"
              value={`${draftState.current_round} / ${draftState.rounds}`}
            />
            <MiniInfo
              label="Current Pick"
              value={String(draftState.current_pick_no)}
            />
            <MiniInfo
              label="Current Team"
              value={draftState.current_team_code || "-"}
            />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
            Draft state is not available yet.
          </div>
        )}
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
            <>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
                <div className="mb-4">
                  <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                    Import
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-white">
                    Import Players From Folders
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Import all draft players from backend folder structure.
                  </p>
                </div>

                <button
                  disabled={actionLoading}
                  onClick={() =>
                    void runAction(() => importAllDraftFoldersApi(user.user_id))
                  }
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  Import All Folders
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
                <div className="mb-4">
                  <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                    Draft Controls
                  </div>
                  <h2 className="mt-3 text-xl font-bold text-white">Admin Actions</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Start, reset, and undo the selected draft category.
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
                        void runAction(() =>
                          startDraftApi(selectedCategory, roundsInput, user.user_id)
                        )
                      }
                      className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Start
                    </button>

                    <button
                      disabled={actionLoading}
                      onClick={() =>
                        void runAction(() =>
                          resetDraftApi(selectedCategory, user.user_id)
                        )
                      }
                      className="rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Reset
                    </button>

                    <button
                      disabled={actionLoading}
                      onClick={() =>
                        void runAction(() => undoDraftApi(user.user_id))
                      }
                      className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Undo
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {mode === "captain" && (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
              <div className="mb-4">
                <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Captain Controls
                </div>
                <h2 className="mt-3 text-xl font-bold text-white">Choose & Confirm</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Add To Pool is removed. Select a player from the current pool, then choose and confirm.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Selected Player
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {selectedEmployeeName || "No player selected"}
                  </div>
                </div>

                {selectedPoolPlayer ? (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={normalizeMediaUrl(selectedPoolPlayer.photo_url)}
                        alt={selectedPoolPlayer.employee_name}
                        className="h-14 w-14 rounded-full border border-white/10 bg-white object-cover"
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {selectedPoolPlayer.employee_name}
                        </div>
                        <div className="mt-1 text-xs text-slate-300">
                          {selectedPoolPlayer.sport_key}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3">
                  <button
                    disabled={actionLoading || !selectedEmployeeName.trim()}
                    onClick={() =>
                      void runAction(() =>
                        chooseDraftPlayerApi(
                          selectedEmployeeName.trim(),
                          selectedCategory,
                          user.user_id
                        )
                      )
                    }
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Choose Selected Player
                  </button>

                  <button
                    disabled={actionLoading}
                    onClick={() =>
                      void runAction(() => confirmDraftPickApi(user.user_id))
                    }
                    className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Confirm Pick
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
                onClick={() => void refreshPool(selectedCategory)}
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
                No players in draft pool for this category yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {pool.map((item) => (
                  <PlayerPoolCard
                    key={item.id}
                    item={item}
                    selectable={mode === "captain" && item.eligible}
                    selected={selectedEmployeeName === item.employee_name}
                    onSelect={() => setSelectedEmployeeName(item.employee_name)}
                  />
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
              onClick={() => void refreshPicks(selectedCategory)}
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
              No confirmed picks for this category yet.
            </div>
          ) : (
            <div className="space-y-5">
              {groupedPicksByRound.map(([roundNo, roundPicks]) => (
                <div key={roundNo} className="space-y-3">
                  <div className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-200">
                    Round {roundNo}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {roundPicks
                      .sort((a, b) => a.pick_no - b.pick_no)
                      .map((pick, index) => (
                        <PickCard
                          key={`${pick.team_code}-${pick.employee_name}-${index}`}
                          pick={pick}
                        />
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

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function PlayerPoolCard({
  item,
  selectable,
  selected,
  onSelect,
}: {
  item: DraftPoolItem;
  selectable: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        selected
          ? "border-cyan-400/30 bg-cyan-400/10"
          : "border-white/10 bg-black/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={normalizeMediaUrl(item.photo_url)}
          alt={item.employee_name}
          className="h-14 w-14 rounded-full border border-white/10 bg-white object-cover"
        />

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {item.employee_name}
          </div>
          <div className="mt-1 text-xs text-slate-400">{item.sport_key}</div>
          <div className="mt-2">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-[11px] ${
                item.eligible
                  ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border border-red-400/20 bg-red-400/10 text-red-200"
              }`}
            >
              {item.eligible ? "Eligible" : "Unavailable"}
            </span>
          </div>
        </div>
      </div>

      {selectable ? (
        <button
          onClick={onSelect}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-3 py-2 text-xs font-semibold text-white"
        >
          {selected ? "Selected" : "Select Player"}
        </button>
      ) : null}
    </div>
  );
}

function PickCard({ pick }: { pick: DraftPickItem }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="flex items-center gap-3">
        <img
          src={normalizeMediaUrl(pick.photo_url)}
          alt={pick.employee_name}
          className="h-14 w-14 rounded-full border border-white/10 bg-white object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">
            {pick.employee_name}
          </div>
          <div className="mt-1 text-xs text-slate-400">{pick.sport_key}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-200">
              {pick.team_code}
            </span>
            <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200">
              Pick #{pick.pick_no}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}