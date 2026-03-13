import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AuthUser,
  DraftMyTeamResponse,
  DraftPickItem,
  DraftPoolItem,
  DraftRosterResponse,
  DraftStateResponse,
  DraftSummaryResponse,
  TeamItem,
  chooseDraftPlayerApi,
  confirmDraftPickApi,
  finishDraftApi,
  getAllDraftPicksApi,
  getDraftPicksApi,
  getDraftPoolApi,
  getDraftRosterApi,
  getDraftStateApi,
  getDraftSummaryApi,
  getMyDraftTeamApi,
  importAllDraftFoldersApi,
  listTeamsApi,
  pauseDraftApi,
  resetDraftApi,
  resumeDraftApi,
  startDraftApi,
  stopDraftApi,
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
] as const;

type CategoryKey = (typeof CATEGORY_OPTIONS)[number]["key"];

type TeamMeta = {
  name?: string | null;
  colorHex?: string | null;
};

type DraftOrderTeam = {
  team_code: string;
  team_name: string;
  position: number;
};

type DraftOrderPreviewMap = Partial<Record<CategoryKey, DraftOrderTeam[]>>;

type TeamRosterCardCategoryMap = Record<
  string,
  Array<{
    employee_name: string;
    pick_no: number;
    round_no: number;
    photo_url: string;
    sport_key: string;
  }>
>;

function isCategoryKey(value: string | null | undefined): value is CategoryKey {
  if (!value) return false;
  return CATEGORY_OPTIONS.some((item) => item.key === value);
}

function normalizeMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:8000";

  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

function prettyCategory(key: string | null | undefined): string {
  if (!key) return "-";
  return CATEGORY_OPTIONS.find((item) => item.key === key)?.label || key;
}

function categoryQuota(key: CategoryKey): string {
  const found = CATEGORY_OPTIONS.find((item) => item.key === key);
  return found ? `${found.quota} players per team` : "-";
}

function prettyStatus(status?: string | null): string {
  if (!status) return "Unknown";

  switch (status.toLowerCase()) {
    case "idle":
      return "Idle";
    case "running":
    case "active":
      return "Running";
    case "completed":
      return "Completed";
    case "paused":
      return "Paused";
    case "stopped":
      return "Stopped";
    default:
      return status;
  }
}

function getNextCategoryKey(currentKey: CategoryKey): CategoryKey | null {
  const index = CATEGORY_OPTIONS.findIndex((item) => item.key === currentKey);
  if (index === -1) return CATEGORY_OPTIONS[0]?.key ?? null;
  return CATEGORY_OPTIONS[index + 1]?.key ?? null;
}

function prettifyTeamCode(teamCode: string): string {
  if (!teamCode) return "Unknown Team";
  const normalized = teamCode.trim();
  if (!normalized) return "Unknown Team";
  if (normalized.length === 1) return `Team ${normalized.toUpperCase()}`;

  return normalized
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function teamStyleFromHex(colorHex?: string | null): {
  badgeClass: string;
  dotClass: string;
} {
  const hex = colorHex?.toLowerCase();

  switch (hex) {
    case "#ffffff":
      return {
        badgeClass: "bg-white text-slate-900 border border-slate-300",
        dotClass: "bg-white border border-slate-300",
      };
    case "#000000":
    case "#111111":
      return {
        badgeClass: "bg-black text-white border border-white/20",
        dotClass: "bg-black",
      };
    case "#ff0000":
      return {
        badgeClass: "bg-red-500 text-white",
        dotClass: "bg-red-500",
      };
    case "#0000ff":
      return {
        badgeClass: "bg-blue-500 text-white",
        dotClass: "bg-blue-500",
      };
    case "#ffff00":
      return {
        badgeClass: "bg-yellow-400 text-slate-900",
        dotClass: "bg-yellow-400",
      };
    case "#008000":
      return {
        badgeClass: "bg-green-700 text-white",
        dotClass: "bg-green-700",
      };
    case "#ffa500":
      return {
        badgeClass: "bg-orange-500 text-white",
        dotClass: "bg-orange-500",
      };
    case "#ffc0cb":
      return {
        badgeClass: "bg-pink-500 text-white",
        dotClass: "bg-pink-500",
      };
    default:
      return {
        badgeClass: "bg-slate-600 text-white",
        dotClass: "bg-slate-400",
      };
  }
}

function getTeamPresentation(params: {
  teamCode: string;
  teamName?: string | null;
  colorHex?: string | null;
}) {
  const style = teamStyleFromHex(params.colorHex);

  return {
    name: params.teamName?.trim() || prettifyTeamCode(params.teamCode),
    badgeClass: style.badgeClass,
    dotClass: style.dotClass,
  };
}

function isCategoryCompleted(
  categoryKey: CategoryKey,
  draftState: DraftStateResponse | null,
  summary: DraftSummaryResponse | null,
): boolean {
  if (
    draftState?.sport_key === categoryKey &&
    draftState?.status?.toLowerCase() === "completed"
  ) {
    return true;
  }

  if (summary && summary.sport_key === categoryKey) {
    return summary.teams.every((team) => team.remaining <= 0);
  }

  return false;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export default function DraftShell({ mode, user }: DraftShellProps) {
  const [viewCategory, setViewCategory] =
    useState<CategoryKey>("male_basketball");
  const [roundsInput, setRoundsInput] = useState(7);

  const [pool, setPool] = useState<DraftPoolItem[]>([]);
  const [visiblePicks, setVisiblePicks] = useState<DraftPickItem[]>([]);
  const [allPicks, setAllPicks] = useState<DraftPickItem[]>([]);
  const [draftState, setDraftState] = useState<DraftStateResponse | null>(null);
  const [roster, setRoster] = useState<DraftRosterResponse | null>(null);
  const [summary, setSummary] = useState<DraftSummaryResponse | null>(null);
  const [myTeam, setMyTeam] = useState<DraftMyTeamResponse | null>(null);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [draftOrderPreview, setDraftOrderPreview] =
    useState<DraftOrderPreviewMap>({});

  const [initialLoading, setInitialLoading] = useState(true);
  const [pageRefreshing, setPageRefreshing] = useState(false);
  const [poolLoading, setPoolLoading] = useState(false);
  const [picksLoading, setPicksLoading] = useState(false);
  const [stateLoading, setStateLoading] = useState(false);

  const [poolError, setPoolError] = useState("");
  const [picksError, setPicksError] = useState("");
  const [stateError, setStateError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [search, setSearch] = useState("");

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoStartNext, setAutoStartNext] = useState(true);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionHandledKey, setCompletionHandledKey] =
    useState<CategoryKey | null>(null);
  const [nextCategoryPending, setNextCategoryPending] =
    useState<CategoryKey | null>(null);

  const [emptyCategoryModalOpen, setEmptyCategoryModalOpen] = useState(false);
  const [emptyHandledKey, setEmptyHandledKey] = useState<CategoryKey | null>(
    null,
  );
  const [emptyNextCategory, setEmptyNextCategory] = useState<CategoryKey | null>(
    null,
  );

  const pollingRef = useRef(false);
  const autoStartInFlightRef = useRef(false);

  const activeCategory: CategoryKey | null = isCategoryKey(draftState?.sport_key)
    ? draftState.sport_key
    : null;

  const captainTeam = useMemo(() => {
    if (mode !== "captain") return null;
    return teams.find((team) => team.captain_user_id === user.user_id) || null;
  }, [mode, teams, user.user_id]);

  const captainTeamCode = captainTeam?.code || "";
  const captainTeamName = captainTeam?.name || null;
  const captainTeamColorHex = captainTeam?.color_hex || null;

  const teamMetaMap = useMemo(() => {
    const map = new Map<string, TeamMeta>();

    teams.forEach((team) => {
      map.set(team.code, {
        name: team.name,
        colorHex: team.color_hex ?? null,
      });
    });

    roster?.teams.forEach((team) => {
      const prev = map.get(team.team_code);
      map.set(team.team_code, {
        name: team.team_label || prev?.name || null,
        colorHex: prev?.colorHex || null,
      });
    });

    allPicks.forEach((pick) => {
      const prev = map.get(pick.team_code);
      map.set(pick.team_code, {
        name: pick.team_label || prev?.name || null,
        colorHex: prev?.colorHex || null,
      });
    });

    visiblePicks.forEach((pick) => {
      const prev = map.get(pick.team_code);
      map.set(pick.team_code, {
        name: pick.team_label || prev?.name || null,
        colorHex: prev?.colorHex || null,
      });
    });

    return map;
  }, [teams, roster, allPicks, visiblePicks]);

  const availableTeamsForOrder = useMemo(() => {
    return teams
      .filter((team) => !!team.code)
      .sort((a, b) => {
        const an = a.name?.trim() || a.code;
        const bn = b.name?.trim() || b.code;
        return an.localeCompare(bn);
      });
  }, [teams]);

  const isMyTurn = useMemo(() => {
    if (mode !== "captain") return false;
    if (!draftState?.current_team_code) return false;
    if (!captainTeamCode) return false;
    return (
      draftState.current_team_code.toUpperCase() ===
      captainTeamCode.toUpperCase()
    );
  }, [mode, draftState?.current_team_code, captainTeamCode]);

  const filteredPool = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return pool;

    return pool.filter((item) =>
      item.employee_name.toLowerCase().includes(keyword),
    );
  }, [pool, search]);

  const selectedPlayer = useMemo(() => {
    return (
      pool.find((item) => item.employee_name === selectedEmployeeName) || null
    );
  }, [pool, selectedEmployeeName]);

  const currentCategoryCompleted = useMemo(() => {
    return isCategoryCompleted(viewCategory, draftState, summary);
  }, [viewCategory, draftState, summary]);

  const currentCategoryHasAnyPick = useMemo(() => {
    return allPicks.some((pick) => pick.sport_key === viewCategory);
  }, [allPicks, viewCategory]);

  const currentCategoryEmpty = useMemo(() => {
    if (poolLoading || !!poolError) return false;
    if (currentCategoryCompleted) return false;

    return pool.length === 0 && !currentCategoryHasAnyPick;
  }, [
    poolLoading,
    poolError,
    pool.length,
    currentCategoryHasAnyPick,
    currentCategoryCompleted,
  ]);

  const refreshTeams = useCallback(async () => {
    try {
      const data = await listTeamsApi(user.user_id);
      setTeams(data);
    } catch {
      setTeams([]);
    }
  }, [user.user_id]);

  const syncDraftState = useCallback(
    async (silent = false) => {
      if (!silent) {
        setStateLoading(true);
        setStateError("");
      }

      try {
        const data = await getDraftStateApi();
        setDraftState(data);

        if (typeof data?.rounds === "number" && data.rounds > 0) {
          setRoundsInput(data.rounds);
        }

        if (
          (mode === "admin" || mode === "captain") &&
          isCategoryKey(data?.sport_key)
        ) {
          const nextCategory: CategoryKey = data.sport_key;
          setViewCategory((prev) => (prev === nextCategory ? prev : nextCategory));
        }
      } catch (err) {
        if (!silent) {
          setStateError(
            err instanceof Error ? err.message : "Failed to load draft state.",
          );
        }
      } finally {
        if (!silent) {
          setStateLoading(false);
        }
      }
    },
    [mode],
  );

  const refreshPool = useCallback(
    async (categoryKey: CategoryKey, silent = false) => {
      if (!silent) {
        setPoolLoading(true);
        setPoolError("");
      }

      try {
        const data = await getDraftPoolApi(categoryKey);
        setPool(data);
      } catch (err) {
        if (!silent) {
          setPoolError(
            err instanceof Error ? err.message : "Failed to load draft pool.",
          );
        }
      } finally {
        if (!silent) {
          setPoolLoading(false);
        }
      }
    },
    [],
  );

  const refreshVisiblePicks = useCallback(
    async (categoryKey: CategoryKey, silent = false) => {
      if (!silent) {
        setPicksLoading(true);
        setPicksError("");
      }

      try {
        const data =
          mode === "viewer"
            ? await getAllDraftPicksApi()
            : await getDraftPicksApi(categoryKey);

        setVisiblePicks(data);
      } catch (err) {
        if (!silent) {
          setPicksError(
            err instanceof Error ? err.message : "Failed to load draft picks.",
          );
        }
      } finally {
        if (!silent) {
          setPicksLoading(false);
        }
      }
    },
    [mode],
  );

  const refreshRoster = useCallback(async () => {
    try {
      const data = await getDraftRosterApi();
      setRoster(data);
    } catch {
      setRoster(null);
    }
  }, []);

  const refreshAllPicks = useCallback(async () => {
    try {
      const data = await getAllDraftPicksApi();
      setAllPicks(data);
    } catch {
      setAllPicks([]);
    }
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      const data = await getDraftSummaryApi();
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }, []);

  const refreshMyTeam = useCallback(async () => {
    if (mode !== "captain") {
      setMyTeam(null);
      return;
    }

    try {
      const data = await getMyDraftTeamApi(user.user_id);
      setMyTeam(data);
    } catch {
      setMyTeam(null);
    }
  }, [mode, user.user_id]);

  const refreshDashboard = useCallback(
    async (silent = false, categoryOverride?: CategoryKey) => {
      const currentCategory = categoryOverride || viewCategory;

      if (!silent) {
        setPageRefreshing(true);
      }

      await Promise.all([
        syncDraftState(silent),
        refreshPool(currentCategory, silent),
        refreshVisiblePicks(currentCategory, silent),
        refreshRoster(),
        refreshSummary(),
        refreshMyTeam(),
        refreshAllPicks(),
        refreshTeams(),
      ]);

      if (!silent) {
        setPageRefreshing(false);
      }
    },
    [
      viewCategory,
      syncDraftState,
      refreshPool,
      refreshVisiblePicks,
      refreshRoster,
      refreshSummary,
      refreshMyTeam,
      refreshAllPicks,
      refreshTeams,
    ],
  );

  async function runAction(action: () => Promise<string>) {
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const message = await action();
      setActionSuccess(message);
      setSelectedEmployeeName("");
      await refreshDashboard(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSkipEmptyCategory() {
    const next = getNextCategoryKey(viewCategory);

    if (!next) {
      setActionError("Дараагийн draft төрөл алга.");
      return;
    }

    setEmptyCategoryModalOpen(false);
    setEmptyNextCategory(next);

    await runAction(() => startDraftApi(next, roundsInput, user.user_id));
    setViewCategory(next);
  }

  function generateRandomOrderForCategory(categoryKey: CategoryKey) {
    if (availableTeamsForOrder.length === 0) {
      setActionError("Random order гаргахын тулд team data хэрэгтэй байна.");
      return;
    }

    const randomized = shuffleArray(availableTeamsForOrder).map((team, index) => ({
      team_code: team.code,
      team_name: team.name?.trim() || prettifyTeamCode(team.code),
      position: index + 1,
    }));

    setDraftOrderPreview((prev) => ({
      ...prev,
      [categoryKey]: randomized,
    }));

    setActionError("");
    setActionSuccess(`${prettyCategory(categoryKey)} random pick order үүслээ.`);
  }

  function generateRandomOrderForAllCategories() {
    if (availableTeamsForOrder.length === 0) {
      setActionError("Random order гаргахын тулд team data хэрэгтэй байна.");
      return;
    }

    const next: DraftOrderPreviewMap = {};

    CATEGORY_OPTIONS.forEach((category) => {
      next[category.key] = shuffleArray(availableTeamsForOrder).map(
        (team, index) => ({
          team_code: team.code,
          team_name: team.name?.trim() || prettifyTeamCode(team.code),
          position: index + 1,
        }),
      );
    });

    setDraftOrderPreview(next);
    setActionError("");
    setActionSuccess("Бүх төрлийн random pick order үүслээ.");
  }

  function clearRandomOrderForCategory(categoryKey: CategoryKey) {
    setDraftOrderPreview((prev) => {
      const copy = { ...prev };
      delete copy[categoryKey];
      return copy;
    });
  }

  useEffect(() => {
    void (async () => {
      setInitialLoading(true);
      await refreshDashboard(false);
      setInitialLoading(false);
    })();
  }, [refreshDashboard]);

  useEffect(() => {
    if (initialLoading) return;
    setSelectedEmployeeName("");
    setSearch("");
    void refreshDashboard(true, viewCategory);
  }, [viewCategory, initialLoading, refreshDashboard]);

  useEffect(() => {
    if (!autoRefreshEnabled || initialLoading) return;

    const timer = window.setInterval(() => {
      if (pollingRef.current) return;

      pollingRef.current = true;
      void (async () => {
        try {
          await refreshDashboard(true);
        } finally {
          pollingRef.current = false;
        }
      })();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [autoRefreshEnabled, initialLoading, refreshDashboard]);

  useEffect(() => {
    if (!currentCategoryCompleted) return;
    if (completionHandledKey === viewCategory) return;

    const candidateNext = isCategoryKey(draftState?.next_sport_key)
      ? draftState.next_sport_key
      : getNextCategoryKey(viewCategory);

    setNextCategoryPending(candidateNext);
    setCompletionHandledKey(viewCategory);
    setCompletionModalOpen(true);
  }, [
    currentCategoryCompleted,
    completionHandledKey,
    draftState?.next_sport_key,
    viewCategory,
  ]);

  useEffect(() => {
    if (mode !== "admin") return;
    if (!currentCategoryEmpty) return;
    if (emptyHandledKey === viewCategory) return;

    const next = getNextCategoryKey(viewCategory);
    setEmptyNextCategory(next);
    setEmptyHandledKey(viewCategory);
    setEmptyCategoryModalOpen(true);
  }, [mode, currentCategoryEmpty, emptyHandledKey, viewCategory]);

  useEffect(() => {
    if (
      !completionModalOpen ||
      !nextCategoryPending ||
      !autoStartNext ||
      mode !== "admin" ||
      actionLoading ||
      autoStartInFlightRef.current
    ) {
      return;
    }

    autoStartInFlightRef.current = true;

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          setActionError("");
          setActionSuccess(
            `${prettyCategory(viewCategory)} дууслаа. ${prettyCategory(
              nextCategoryPending,
            )} автоматаар эхэлж байна...`,
          );

          setViewCategory(nextCategoryPending);
          await startDraftApi(nextCategoryPending, roundsInput, user.user_id);
          await refreshDashboard(true, nextCategoryPending);
        } catch (err) {
          setActionError(
            err instanceof Error
              ? err.message
              : "Failed to auto-start next draft.",
          );
        } finally {
          autoStartInFlightRef.current = false;
        }
      })();
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [
    completionModalOpen,
    nextCategoryPending,
    autoStartNext,
    mode,
    actionLoading,
    roundsInput,
    user.user_id,
    refreshDashboard,
    viewCategory,
  ]);

  function handleGoNextManually() {
    if (!nextCategoryPending) return;

    setCompletionModalOpen(false);
    setViewCategory(nextCategoryPending);

    if (mode === "admin") {
      void runAction(() =>
        startDraftApi(nextCategoryPending, roundsInput, user.user_id),
      );
    }
  }

  if (initialLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-white backdrop-blur-xl">
        Loading draft board...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <TopStatsSection
          draftState={draftState}
          activeCategory={activeCategory}
          viewCategory={viewCategory}
          teamMetaMap={teamMetaMap}
        />

        {summary ? (
          <SummarySection summary={summary} teamMetaMap={teamMetaMap} />
        ) : null}

        <OverviewSection
          viewCategory={viewCategory}
          draftState={draftState}
          stateError={stateError}
          autoRefreshEnabled={autoRefreshEnabled}
          pageRefreshing={pageRefreshing}
          autoStartNext={autoStartNext}
          mode={mode}
          isMyTurn={isMyTurn}
          teamMetaMap={teamMetaMap}
          onCategoryChange={setViewCategory}
          onToggleAutoRefresh={() => setAutoRefreshEnabled((prev) => !prev)}
          onRefresh={() => void refreshDashboard(false)}
          onToggleAutoStartNext={() => setAutoStartNext((prev) => !prev)}
        />

        {actionError ? <FeedbackBanner tone="error" message={actionError} /> : null}
        {actionSuccess ? (
          <FeedbackBanner tone="success" message={actionSuccess} />
        ) : null}

        {mode === "admin" ? (
          <AdminControlsSection
            actionLoading={actionLoading}
            roundsInput={roundsInput}
            viewCategory={viewCategory}
            isEmptyCategory={currentCategoryEmpty}
            onRoundsChange={setRoundsInput}
            onImport={() =>
              void runAction(() => importAllDraftFoldersApi(user.user_id))
            }
            onStart={() =>
              void runAction(() =>
                startDraftApi(viewCategory, roundsInput, user.user_id),
              )
            }
            onPause={() => void runAction(() => pauseDraftApi(user.user_id))}
            onResume={() => void runAction(() => resumeDraftApi(user.user_id))}
            onStop={() => void runAction(() => stopDraftApi(user.user_id))}
            onFinish={() => void runAction(() => finishDraftApi(user.user_id))}
            onUndo={() => void runAction(() => undoDraftApi(user.user_id))}
            onReset={() =>
              void runAction(() => resetDraftApi(viewCategory, user.user_id))
            }
            onStartNext={() => {
              const next = getNextCategoryKey(viewCategory);
              if (!next) return;
              setViewCategory(next);
              void runAction(() =>
                startDraftApi(next, roundsInput, user.user_id),
              );
            }}
            onSkipEmpty={() => void handleSkipEmptyCategory()}
          />
        ) : null}

        {mode === "admin" ? (
          <RandomDraftOrderSection
            viewCategory={viewCategory}
            orders={draftOrderPreview}
            teamMetaMap={teamMetaMap}
            onGenerateCurrent={() => generateRandomOrderForCategory(viewCategory)}
            onGenerateAll={generateRandomOrderForAllCategories}
            onClearCurrent={() => clearRandomOrderForCategory(viewCategory)}
          />
        ) : null}

        {(mode === "captain" || mode === "admin") && (
          <DraftPoolSection
            mode={mode}
            pool={pool}
            poolLoading={poolLoading}
            poolError={poolError}
            filteredPool={filteredPool}
            search={search}
            selectedPlayer={selectedPlayer}
            selectedEmployeeName={selectedEmployeeName}
            actionLoading={actionLoading}
            isMyTurn={isMyTurn}
            draftState={draftState}
            onSearchChange={setSearch}
            onRefresh={() => void refreshPool(viewCategory, false)}
            onSelectPlayer={setSelectedEmployeeName}
            onChoose={() =>
              void runAction(() =>
                chooseDraftPlayerApi(
                  selectedEmployeeName.trim(),
                  viewCategory,
                  user.user_id,
                ),
              )
            }
            onConfirm={() =>
              void runAction(() => confirmDraftPickApi(user.user_id))
            }
          />
        )}

        {mode === "captain" && myTeam ? (
          <MyTeamSection
            myTeam={myTeam}
            captainTeamName={captainTeamName}
            captainTeamColorHex={captainTeamColorHex}
          />
        ) : null}

        <TeamBoardSection roster={roster} teamMetaMap={teamMetaMap} />

        <DraftPicksSection
          mode={mode}
          picksError={picksError}
          picksLoading={picksLoading}
          visiblePicks={visiblePicks}
          teamMetaMap={teamMetaMap}
          onRefresh={() => void refreshVisiblePicks(viewCategory, false)}
        />

        {mode === "viewer" ? (
          <DraftPoolSection
            mode={mode}
            pool={pool}
            poolLoading={poolLoading}
            poolError={poolError}
            filteredPool={filteredPool}
            search={search}
            selectedPlayer={null}
            selectedEmployeeName=""
            actionLoading={false}
            isMyTurn={false}
            draftState={draftState}
            onSearchChange={setSearch}
            onRefresh={() => void refreshPool(viewCategory, false)}
            onSelectPlayer={() => {}}
            onChoose={() => {}}
            onConfirm={() => {}}
          />
        ) : null}
      </div>

      {completionModalOpen ? (
        <CompletionModal
          currentCategory={prettyCategory(viewCategory)}
          nextCategory={prettyCategory(nextCategoryPending)}
          mode={mode}
          autoStartNext={autoStartNext}
          onClose={() => setCompletionModalOpen(false)}
          onGoNext={handleGoNextManually}
        />
      ) : null}

      {emptyCategoryModalOpen ? (
        <EmptyCategoryModal
          currentCategory={prettyCategory(viewCategory)}
          nextCategory={prettyCategory(emptyNextCategory)}
          onClose={() => setEmptyCategoryModalOpen(false)}
          onSkip={() => void handleSkipEmptyCategory()}
        />
      ) : null}
    </>
  );
}

function TopStatsSection({
  draftState,
  activeCategory,
  viewCategory,
  teamMetaMap,
}: {
  draftState: DraftStateResponse | null;
  activeCategory: CategoryKey | null;
  viewCategory: CategoryKey;
  teamMetaMap: Map<string, TeamMeta>;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SimpleStat label="Draft Status" value={prettyStatus(draftState?.status)} />
      <SimpleStat label="Viewing Category" value={prettyCategory(viewCategory)} />
      <SimpleStat label="Active Draft" value={prettyCategory(activeCategory)} />
      <SimpleStat
        label="Current Team"
        value={
          draftState?.current_team_code
            ? getTeamPresentation({
                teamCode: draftState.current_team_code,
                teamName: teamMetaMap.get(draftState.current_team_code)?.name,
                colorHex: teamMetaMap.get(draftState.current_team_code)?.colorHex,
              }).name
            : "-"
        }
      />
    </section>
  );
}

function SummarySection({
  summary,
  teamMetaMap,
}: {
  summary: DraftSummaryResponse;
  teamMetaMap: Map<string, TeamMeta>;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Current Sport Summary
        </div>
        <h2 className="mt-1 text-lg font-bold text-white">
          {prettyCategory(summary.sport_key)}
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summary.teams.map((team) => {
          const meta = getTeamPresentation({
            teamCode: team.team_code,
            teamName: teamMetaMap.get(team.team_code)?.name,
            colorHex: teamMetaMap.get(team.team_code)?.colorHex,
          });

          return (
            <div
              key={team.team_code}
              className="rounded-2xl border border-white/10 bg-black/10 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${meta.badgeClass}`}
                >
                  {meta.name}
                </span>
                <span className="text-xs text-slate-400">
                  {team.filled}/{summary.quota_per_team}
                </span>
              </div>

              <div className="mt-3 text-sm text-slate-300">
                Remaining: {team.remaining}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OverviewSection({
  viewCategory,
  draftState,
  stateError,
  autoRefreshEnabled,
  pageRefreshing,
  autoStartNext,
  mode,
  isMyTurn,
  teamMetaMap,
  onCategoryChange,
  onToggleAutoRefresh,
  onRefresh,
  onToggleAutoStartNext,
}: {
  viewCategory: CategoryKey;
  draftState: DraftStateResponse | null;
  stateError: string;
  autoRefreshEnabled: boolean;
  pageRefreshing: boolean;
  autoStartNext: boolean;
  mode: DraftMode;
  isMyTurn: boolean;
  teamMetaMap: Map<string, TeamMeta>;
  onCategoryChange: (value: CategoryKey) => void;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  onToggleAutoStartNext: () => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Draft Categories
          </div>
          <h2 className="mt-2 text-xl font-bold text-white">Draft Overview</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((item) => {
            const active = viewCategory === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onCategoryChange(item.key)}
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniInfo label="Rule" value={categoryQuota(viewCategory)} />
        <MiniInfo
          label="Round"
          value={draftState ? `${draftState.current_round}/${draftState.rounds}` : "-"}
        />
        <MiniInfo
          label="Pick"
          value={draftState ? String(draftState.current_pick_no) : "-"}
        />
        <MiniInfo
          label="Next Category"
          value={prettyCategory(
            isCategoryKey(draftState?.next_sport_key)
              ? draftState.next_sport_key
              : getNextCategoryKey(viewCategory),
          )}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onToggleAutoRefresh}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/15"
        >
          {autoRefreshEnabled ? "Disable Auto Refresh" : "Enable Auto Refresh"}
        </button>

        <button
          onClick={onRefresh}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white hover:bg-white/15"
        >
          {pageRefreshing ? "Refreshing..." : "Refresh Now"}
        </button>

        {mode === "admin" ? (
          <button
            onClick={onToggleAutoStartNext}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white ${
              autoStartNext
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-slate-600 hover:bg-slate-500"
            }`}
          >
            Auto Start Next: {autoStartNext ? "On" : "Off"}
          </button>
        ) : null}
      </div>

      {mode === "captain" ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            isMyTurn
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : "border-amber-400/30 bg-amber-500/10 text-amber-200"
          }`}
        >
          {isMyTurn
            ? "Одоо таны багийн сонголтын ээлж байна."
            : `Одоогийн ээлж: ${
                draftState?.current_team_code
                  ? getTeamPresentation({
                      teamCode: draftState.current_team_code,
                      teamName: teamMetaMap.get(draftState.current_team_code)?.name,
                      colorHex: teamMetaMap.get(draftState.current_team_code)?.colorHex,
                    }).name
                  : "-"
              }`}
        </div>
      ) : null}

      {stateError ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {stateError}
        </div>
      ) : null}
    </section>
  );
}

function AdminControlsSection({
  actionLoading,
  roundsInput,
  viewCategory,
  isEmptyCategory,
  onRoundsChange,
  onImport,
  onStart,
  onPause,
  onResume,
  onStop,
  onFinish,
  onUndo,
  onReset,
  onStartNext,
  onSkipEmpty,
}: {
  actionLoading: boolean;
  roundsInput: number;
  viewCategory: CategoryKey;
  isEmptyCategory: boolean;
  onRoundsChange: (value: number) => void;
  onImport: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onFinish: () => void;
  onUndo: () => void;
  onReset: () => void;
  onStartNext: () => void;
  onSkipEmpty: () => void;
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <h2 className="text-lg font-bold text-white">Admin Controls</h2>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <input
          type="number"
          min={1}
          max={20}
          value={roundsInput}
          onChange={(e) => onRoundsChange(Number(e.target.value) || 1)}
          className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-white outline-none"
          placeholder="Rounds"
        />
        <button
          disabled={actionLoading}
          onClick={onImport}
          className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Import
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <button
          disabled={actionLoading}
          onClick={onStart}
          className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Start
        </button>

        <button
          disabled={actionLoading}
          onClick={onPause}
          className="rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Pause
        </button>

        <button
          disabled={actionLoading}
          onClick={onResume}
          className="rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Resume
        </button>

        <button
          disabled={actionLoading}
          onClick={onStop}
          className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Stop
        </button>

        <button
          disabled={actionLoading}
          onClick={onFinish}
          className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Finish
        </button>

        <button
          disabled={actionLoading}
          onClick={onUndo}
          className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Undo
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          disabled={actionLoading}
          onClick={onReset}
          className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Reset Current Category
        </button>

        <button
          disabled={actionLoading || !getNextCategoryKey(viewCategory)}
          onClick={onStartNext}
          className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Start Next Category
        </button>

        <button
          disabled={actionLoading || !isEmptyCategory || !getNextCategoryKey(viewCategory)}
          onClick={onSkipEmpty}
          className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          Skip Empty Category
        </button>
      </div>
    </section>
  );
}

function RandomDraftOrderSection({
  viewCategory,
  orders,
  teamMetaMap,
  onGenerateCurrent,
  onGenerateAll,
  onClearCurrent,
}: {
  viewCategory: CategoryKey;
  orders: DraftOrderPreviewMap;
  teamMetaMap: Map<string, TeamMeta>;
  onGenerateCurrent: () => void;
  onGenerateAll: () => void;
  onClearCurrent: () => void;
}) {
  const currentOrder = orders[viewCategory] || [];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-200">
            Draft Order Planner
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">
            Random Pick Order Preview
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Энэ хэсэг нь frontend preview. Бодит draft order-ийг backend дээр хадгалах хэрэгтэй.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onGenerateCurrent}
            className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2.5 text-sm font-bold text-white"
          >
            Generate Current Sport
          </button>

          <button
            onClick={onGenerateAll}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-bold text-white"
          >
            Generate All Sports
          </button>

          <button
            onClick={onClearCurrent}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            Clear Current
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-white">
                {prettyCategory(viewCategory)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Randomized order preview
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200">
              {currentOrder.length} teams
            </div>
          </div>

          {currentOrder.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm text-slate-400">
              Одоогоор random order үүсээгүй байна.
            </div>
          ) : (
            <div className="space-y-2">
              {currentOrder.map((item) => {
                const meta = getTeamPresentation({
                  teamCode: item.team_code,
                  teamName: item.team_name || teamMetaMap.get(item.team_code)?.name,
                  colorHex: teamMetaMap.get(item.team_code)?.colorHex,
                });

                return (
                  <div
                    key={`${viewCategory}-${item.team_code}-${item.position}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-black text-white">
                        {item.position}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-white">
                          {meta.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Code: {item.team_code}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${meta.badgeClass}`}
                    >
                      Pick #{item.position}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="mb-3 text-sm font-bold text-white">
            All Sports Preview
          </div>

          <div className="space-y-3">
            {CATEGORY_OPTIONS.map((category) => {
              const order = orders[category.key] || [];

              return (
                <div
                  key={category.key}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white">
                      {category.label}
                    </div>
                    <div className="text-xs text-slate-400">
                      {order.length ? `${order.length} teams ready` : "Not generated"}
                    </div>
                  </div>

                  {order.length > 0 ? (
                    <div className="mt-2 text-xs text-slate-300">
                      {order
                        .map((team) => `${team.position}. ${team.team_name}`)
                        .join("  •  ")}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function DraftPoolSection({
  mode,
  pool,
  poolLoading,
  poolError,
  filteredPool,
  search,
  selectedPlayer,
  selectedEmployeeName,
  actionLoading,
  isMyTurn,
  draftState,
  onSearchChange,
  onRefresh,
  onSelectPlayer,
  onChoose,
  onConfirm,
}: {
  mode: DraftMode;
  pool: DraftPoolItem[];
  poolLoading: boolean;
  poolError: string;
  filteredPool: DraftPoolItem[];
  search: string;
  selectedPlayer: DraftPoolItem | null;
  selectedEmployeeName: string;
  actionLoading: boolean;
  isMyTurn: boolean;
  draftState: DraftStateResponse | null;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onSelectPlayer: (value: string) => void;
  onChoose: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-bold text-white">Draft Pool</h2>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-2.5 text-sm text-white outline-none md:w-72"
          />
          <button
            onClick={onRefresh}
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
              disabled={
                actionLoading ||
                !selectedEmployeeName.trim() ||
                !isMyTurn ||
                draftState?.status === "paused" ||
                draftState?.status === "completed"
              }
              onClick={onChoose}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              Choose
            </button>

            <button
              disabled={
                actionLoading ||
                !isMyTurn ||
                draftState?.status === "paused" ||
                draftState?.status === "completed"
              }
              onClick={onConfirm}
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
                selectable={
                  mode === "captain" &&
                  item.eligible &&
                  isMyTurn &&
                  draftState?.status !== "paused" &&
                  draftState?.status !== "completed"
                }
                onSelect={() => onSelectPlayer(item.employee_name)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MyTeamSection({
  myTeam,
  captainTeamName,
  captainTeamColorHex,
}: {
  myTeam: DraftMyTeamResponse;
  captainTeamName?: string | null;
  captainTeamColorHex?: string | null;
}) {
  const team = getTeamPresentation({
    teamCode: myTeam.team_code,
    teamName: captainTeamName,
    colorHex: captainTeamColorHex,
  });

  return (
    <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            My Team
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">{team.name} Roster</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${team.badgeClass}`}
        >
          {team.name}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {CATEGORY_OPTIONS.map((category) => {
          const found = myTeam.categories.find(
            (item) => item.sport_key === category.key,
          );

          return (
            <CategoryRosterCard
              key={category.key}
              categoryLabel={category.label}
              categoryKeyName={category.key}
              quota={category.quota}
              members={
                found?.players.map((player) => ({
                  employee_name: player.employee_name,
                  pick_no: player.pick_no,
                  round_no: player.round_no,
                  photo_url: player.photo_url || "",
                  sport_key: category.key,
                })) || []
              }
            />
          );
        })}
      </div>
    </section>
  );
}

function TeamBoardSection({
  roster,
  teamMetaMap,
}: {
  roster: DraftRosterResponse | null;
  teamMetaMap: Map<string, TeamMeta>;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Team Board
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">
            Team Rosters by Category
          </h2>
        </div>
      </div>

      {!roster || roster.teams.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
          No team roster yet.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {roster.teams
            .slice()
            .sort((a, b) =>
              getTeamPresentation({
                teamCode: a.team_code,
                teamName: a.team_label,
                colorHex: teamMetaMap.get(a.team_code)?.colorHex,
              }).name.localeCompare(
                getTeamPresentation({
                  teamCode: b.team_code,
                  teamName: b.team_label,
                  colorHex: teamMetaMap.get(b.team_code)?.colorHex,
                }).name,
              ),
            )
            .map((team) => (
              <TeamRosterCard
                key={team.team_code}
                teamCode={team.team_code}
                teamName={team.team_label || teamMetaMap.get(team.team_code)?.name}
                colorHex={teamMetaMap.get(team.team_code)?.colorHex}
                categories={Object.fromEntries(
                  team.categories.map((category) => [
                    category.sport_key,
                    category.players.map((player) => ({
                      employee_name: player.employee_name,
                      pick_no: player.pick_no,
                      round_no: player.round_no,
                      photo_url: player.photo_url || "",
                      sport_key: category.sport_key,
                    })),
                  ]),
                )}
              />
            ))}
        </div>
      )}
    </section>
  );
}

function DraftPicksSection({
  mode,
  picksError,
  picksLoading,
  visiblePicks,
  teamMetaMap,
  onRefresh,
}: {
  mode: DraftMode;
  picksError: string;
  picksLoading: boolean;
  visiblePicks: DraftPickItem[];
  teamMetaMap: Map<string, TeamMeta>;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Draft Picks</h2>
          <p className="mt-1 text-sm text-slate-300">
            {mode === "viewer"
              ? "Бүх ангиллын бүх сонголтыг харуулна."
              : "Одоогийн ангиллын сонголтуудыг харуулна."}
          </p>
        </div>

        <button
          onClick={onRefresh}
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
      ) : visiblePicks.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
          No picks yet.
        </div>
      ) : (
        <div className="space-y-2">
          {visiblePicks.map((pick, index) => (
            <PickTimelineRow
              key={`${pick.team_code}-${pick.employee_name}-${pick.pick_no}-${index}`}
              pick={pick}
              teamName={pick.team_label || teamMetaMap.get(pick.team_code)?.name}
              colorHex={teamMetaMap.get(pick.team_code)?.colorHex}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FeedbackBanner({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${
        tone === "error"
          ? "border border-red-400/20 bg-red-500/10 text-red-200"
          : "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      {message}
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

function PickTimelineRow({
  pick,
  teamName,
  colorHex,
}: {
  pick: DraftPickItem;
  teamName?: string | null;
  colorHex?: string | null;
}) {
  const team = getTeamPresentation({
    teamCode: pick.team_code,
    teamName: teamName || pick.team_label,
    colorHex,
  });

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={normalizeMediaUrl(pick.photo_url)}
          alt={pick.employee_name}
          className="h-10 w-10 rounded-full border border-white/10 bg-white object-cover"
        />

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {pick.employee_name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${team.badgeClass}`}
            >
              {team.name}
            </span>
            <span>{prettyCategory(pick.sport_key)}</span>
            <span>Round {pick.round_no}</span>
            {pick.picked_at ? (
              <span>{new Date(pick.picked_at).toLocaleString()}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="text-xs font-semibold text-amber-200">
        Pick #{pick.pick_no}
      </div>
    </div>
  );
}

function CategoryRosterCard({
  categoryLabel,
  categoryKeyName,
  quota,
  members,
}: {
  categoryLabel: string;
  categoryKeyName: string;
  quota: number;
  members: Array<{
    employee_name: string;
    pick_no: number;
    round_no: number;
    photo_url: string;
    sport_key: string;
  }>;
}) {
  const filled = members.length;
  const done = filled >= quota;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-white">{categoryLabel}</div>
          <div className="mt-1 text-xs text-slate-400">{categoryKeyName}</div>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            done
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-amber-500/20 text-amber-200"
          }`}
        >
          {filled}/{quota}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-sm text-slate-400">
            No players selected yet.
          </div>
        ) : (
          members.map((member) => (
            <div
              key={`${member.employee_name}-${member.pick_no}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={normalizeMediaUrl(member.photo_url)}
                  alt={member.employee_name}
                  className="h-9 w-9 rounded-full border border-white/10 bg-white object-cover"
                />
                <div className="truncate text-sm font-medium text-white">
                  {member.employee_name}
                </div>
              </div>

              <div className="text-xs text-slate-400">#{member.pick_no}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TeamRosterCard({
  teamCode,
  teamName,
  colorHex,
  categories,
}: {
  teamCode: string;
  teamName?: string | null;
  colorHex?: string | null;
  categories: TeamRosterCardCategoryMap;
}) {
  const team = getTeamPresentation({
    teamCode,
    teamName,
    colorHex,
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-black/10 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full ${team.dotClass}`}
          />
          <h3 className="text-lg font-bold text-white">{team.name}</h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${team.badgeClass}`}
        >
          {team.name}
        </span>
      </div>

      <div className="space-y-4">
        {CATEGORY_OPTIONS.map((category) => {
          const members = categories[category.key] || [];
          return (
            <div
              key={category.key}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">
                  {category.label}
                </div>
                <div className="text-xs text-slate-400">
                  {members.length}/{category.quota}
                </div>
              </div>

              {members.length === 0 ? (
                <div className="text-sm text-slate-400">No picks yet.</div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={`${teamCode}-${category.key}-${member.employee_name}-${member.pick_no}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={normalizeMediaUrl(member.photo_url)}
                          alt={member.employee_name}
                          className="h-9 w-9 rounded-full border border-white/10 bg-white object-cover"
                        />
                        <div className="truncate text-sm text-white">
                          {member.employee_name}
                        </div>
                      </div>

                      <div className="text-xs text-slate-400">
                        Pick #{member.pick_no}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompletionModal({
  currentCategory,
  nextCategory,
  mode,
  autoStartNext,
  onClose,
  onGoNext,
}: {
  currentCategory: string;
  nextCategory: string;
  mode: DraftMode;
  autoStartNext: boolean;
  onClose: () => void;
  onGoNext: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1728] p-6 text-white shadow-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          Draft Completed
        </div>

        <h3 className="mt-2 text-2xl font-black">
          {currentCategory} draft дууслаа
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          {nextCategory !== "-"
            ? `${nextCategory} төрлийн draft руу шилжих боломжтой байна.`
            : "Бүх төрлийн draft дууссан байна."}
        </p>

        {nextCategory !== "-" ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {mode === "admin" && autoStartNext
              ? "Auto start идэвхтэй тул дараагийн төрөл автоматаар эхэлнэ."
              : mode === "admin"
                ? "Дараагийн төрлийг гараар эхлүүлж болно."
                : "Admin дараагийн төрлийг эхлүүлэхэд энэ дэлгэц автоматаар шинэчлэгдэнэ."}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            Close
          </button>

          {nextCategory !== "-" && mode === "admin" ? (
            <button
              onClick={onGoNext}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Start Next Draft
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptyCategoryModal({
  currentCategory,
  nextCategory,
  onClose,
  onSkip,
}: {
  currentCategory: string;
  nextCategory: string;
  onClose: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1728] p-6 text-white shadow-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
          Empty Category
        </div>

        <h3 className="mt-2 text-2xl font-black">
          {currentCategory} дээр тоглогч алга
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          Энэ төрөл дээр draft хийх тоглогч байхгүй байна.{" "}
          {nextCategory !== "-"
            ? `${nextCategory} руу шууд шилжүүлэх үү?`
            : "Дараагийн төрөл алга."}
        </p>

        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Тоглогчгүй category-г skip хийгээд дараагийн sport draft эхлүүлж болно.
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            Close
          </button>

          {nextCategory !== "-" ? (
            <button
              onClick={onSkip}
              className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Skip To Next Draft
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}