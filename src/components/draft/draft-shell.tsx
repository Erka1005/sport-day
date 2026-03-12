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
  return CATEGORY_OPTIONS.find((item) => item.key === key)?.label || key;
}

function categoryQuota(key: string): string {
  const found = CATEGORY_OPTIONS.find((item) => item.key === key);
  if (!found) return "-";
  return `${found.quota} players per team`;
}

function prettyStatus(status?: string | null): string {
  if (!status) return "Unknown";

  switch (status.toLowerCase()) {
    case "idle":
      return "Idle";
    case "active":
      return "Active";
    case "completed":
      return "Completed";
    case "paused":
      return "Paused";
    default:
      return status;
  }
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
  const [search, setSearch] = useState("");

  useEffect(() => {
    void refreshState();
  }, []);

  useEffect(() => {
    setSelectedEmployeeName("");
    setSearch("");
    void refreshForCategory(selectedCategory);
  }, [selectedCategory]);

  async function refreshPool(categoryKey: string) {
    setPoolLoading(true);
    setPoolError("");

    try {
      const data = await getDraftPoolApi(categoryKey);
      setPool(data);
    } catch (err) {
      setPoolError(
        err instanceof Error ? err.message : "Failed to load pool."
      );
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
      setPicksError(
        err instanceof Error ? err.message : "Failed to load picks."
      );
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
      setStateError(
        err instanceof Error ? err.message : "Failed to load draft state."
      );
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
      setActionError(
        err instanceof Error ? err.message : "Action failed."
      );
    } finally {
      setActionLoading(false);
    }
  }

  const filteredPool = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return pool;

    return pool.filter((item) =>
      item.employee_name.toLowerCase().includes(keyword)
    );
  }, [pool, search]);

  const selectedPlayer = useMemo(() => {
    return pool.find((item) => item.employee_name === selectedEmployeeName) || null;
  }, [pool, selectedEmployeeName]);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2">
        <SimpleStat
          label="Draft Status"
          value={stateLoading ? "Loading..." : prettyStatus(draftState?.status)}
        />
        <SimpleStat label="Category" value={prettyCategory(selectedCategory)} />
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

        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Rule
          </div>
          <div className="mt-2 text-sm font-semibold text-white">
            {categoryQuota(selectedCategory)}
          </div>
        </div>

        {!stateLoading && draftState ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MiniInfo
              label="Round"
              value={`${draftState.current_round}/${draftState.rounds}`}
            />
            <MiniInfo
              label="Pick"
              value={String(draftState.current_pick_no)}
            />
            <MiniInfo
              label="Current Team"
              value={draftState.current_team_code || "-"}
            />
          </div>
        ) : null}

        {stateError ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {stateError}
          </div>
        ) : null}
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

      {mode === "admin" ? (
        <section className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-bold text-white">Admin Controls</h2>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              type="number"
              min={1}
              max={20}
              value={roundsInput}
              onChange={(e) => setRoundsInput(Number(e.target.value) || 1)}
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none"
              placeholder="Rounds"
            />
            <button
              disabled={actionLoading}
              onClick={() =>
                void runAction(() => importAllDraftFoldersApi(user.user_id))
              }
              className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              Import
            </button>
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
                void runAction(() => resetDraftApi(selectedCategory, user.user_id))
              }
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
        </section>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-white">Draft Pool</h2>

          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2.5 text-sm text-white outline-none md:w-72"
            />
            <button
              onClick={() => void refreshPool(selectedCategory)}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/15"
            >
              Refresh
            </button>
          </div>
        </div>

        {mode === "captain" ? (
          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-cyan-200">
              Selected Player
            </div>
            <div className="mt-2 text-base font-bold text-white">
              {selectedPlayer?.employee_name || "No player selected"}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
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
                Choose
              </button>

              <button
                disabled={actionLoading}
                onClick={() =>
                  void runAction(() => confirmDraftPickApi(user.user_id))
                }
                className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          {poolError ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {poolError}
            </div>
          ) : poolLoading ? (
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
              Loading pool...
            </div>
          ) : filteredPool.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
              No players found.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPool.map((item) => (
                <SimplePlayerRow
                  key={item.id}
                  item={item}
                  selected={selectedEmployeeName === item.employee_name}
                  selectable={mode === "captain" && item.eligible}
                  onSelect={() => setSelectedEmployeeName(item.employee_name)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Draft Picks</h2>
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
            Loading picks...
          </div>
        ) : picks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
            No picks yet.
          </div>
        ) : (
          <div className="space-y-2">
            {picks.map((pick, index) => (
              <div
                key={`${pick.team_code}-${pick.employee_name}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {pick.employee_name}
                  </div>
                  <div className="text-xs text-slate-400">{pick.team_code}</div>
                </div>

                <div className="text-xs text-amber-200">Pick #{pick.pick_no}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SimpleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="text-sm text-slate-300">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
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

function SimplePlayerRow({
  item,
  selected,
  selectable,
  onSelect,
}: {
  item: DraftPoolItem;
  selected: boolean;
  selectable: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={selectable ? onSelect : undefined}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? "border-cyan-400/40 bg-cyan-400/10"
          : "border-white/10 bg-black/10 hover:bg-white/[0.05]"
      } ${!selectable ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={normalizeMediaUrl(item.photo_url)}
          alt={item.employee_name}
          className="h-12 w-12 rounded-full border border-white/10 bg-white object-cover"
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {item.employee_name}
          </div>
          <div className="text-xs text-slate-400">
            {item.eligible ? "Eligible" : "Unavailable"}
          </div>
        </div>
      </div>

      {selected ? (
        <div className="text-sm font-semibold text-cyan-300">Selected</div>
      ) : null}
    </button>
  );
}