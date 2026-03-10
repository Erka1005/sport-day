// services/draft-local.ts

import { createInitialDraftState } from "@/data/mock-draft";
import { AuthUser } from "@/services/api";
import {
  DraftHistoryEntry,
  DraftPlayer,
  DraftState,
  DraftStatus,
} from "@/types/draft";

const DRAFT_STORAGE_KEY = "sports_day_draft_state_v1";

function nowString(): string {
  return new Date().toLocaleString();
}

function historyEntry(
  type: DraftHistoryEntry["type"],
  text: string,
  meta?: DraftHistoryEntry["meta"]
): DraftHistoryEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    text,
    createdAt: nowString(),
    meta,
  };
}

export function loadDraftState(): DraftState {
  if (typeof window === "undefined") {
    return createInitialDraftState();
  }

  const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) {
    const initial = createInitialDraftState();
    saveDraftState(initial);
    return initial;
  }

  try {
    return JSON.parse(raw) as DraftState;
  } catch {
    const initial = createInitialDraftState();
    saveDraftState(initial);
    return initial;
  }
}

export function saveDraftState(state: DraftState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state));
}

export function resolveCaptainTeamId(
  state: DraftState,
  user: AuthUser
): { nextState: DraftState; teamId: number } {
  const existing = state.captainAssignments[user.username];
  if (existing) {
    return { nextState: state, teamId: existing };
  }

  const assignedIds = new Set(Object.values(state.captainAssignments));
  const nextTeam = state.teams.find((team) => !assignedIds.has(team.id)) ?? state.teams[0];

  const nextState: DraftState = {
    ...state,
    captainAssignments: {
      ...state.captainAssignments,
      [user.username]: nextTeam.id,
    },
  };

  return { nextState, teamId: nextTeam.id };
}

export function startDraft(state: DraftState, rounds: number): DraftState {
  const normalizedRounds = Math.max(1, rounds);

  return {
    ...state,
    rounds: normalizedRounds,
    currentRound: 1,
    currentTurnTeamId: 1,
    status: "running",
    history: [
      historyEntry("start", `Draft started with ${normalizedRounds} rounds.`),
      ...state.history,
    ],
  };
}

export function resetDraft(state: DraftState): DraftState {
  const fresh = createInitialDraftState();

  return {
    ...fresh,
    captainAssignments: state.captainAssignments,
    history: [
      historyEntry("reset", "Draft has been reset."),
      ...fresh.history,
    ],
  };
}

export function undoLastConfirm(state: DraftState): DraftState {
  const lastConfirm = state.history.find((item) => item.type === "confirm");
  if (!lastConfirm?.meta?.playerId || !lastConfirm.meta.teamId) {
    return {
      ...state,
      history: [
        historyEntry("undo", "Undo requested, but no confirmed pick was found."),
        ...state.history,
      ],
    };
  }

  const playerId = lastConfirm.meta.playerId;
  const teamId = lastConfirm.meta.teamId;

  const nextPlayers = state.players.map((player) =>
    player.id === playerId
      ? {
          ...player,
          draftedByTeamId: null,
          draftOrder: null,
        }
      : player
  );

  const nextTeams = state.teams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          picks: team.picks.filter((id) => id !== playerId),
        }
      : team
  );

  const filteredHistory = state.history.filter((item) => item.id !== lastConfirm.id);

  return {
    ...state,
    players: nextPlayers,
    teams: nextTeams,
    currentRound: lastConfirm.meta.prevRound ?? 1,
    currentTurnTeamId: lastConfirm.meta.prevTurnTeamId ?? 1,
    status: lastConfirm.meta.prevStatus ?? "running",
    pendingChoices: {
      ...state.pendingChoices,
      [teamId]: playerId,
    },
    history: [
      historyEntry("undo", `Last confirmed pick was undone for Team ${teamId}.`),
      ...filteredHistory,
    ],
  };
}

export function addPlayerToPool(
  state: DraftState,
  playerId: string,
  teamId: number
): DraftState {
  const player = state.players.find((item) => item.id === playerId);
  if (!player || player.inPool) return state;

  return {
    ...state,
    players: state.players.map((item) =>
      item.id === playerId
        ? {
            ...item,
            inPool: true,
            addedToPoolByTeamId: teamId,
          }
        : item
    ),
    history: [
      historyEntry("add-to-pool", `${player.name} was added to the pool.`, {
        playerId,
        teamId,
      }),
      ...state.history,
    ],
  };
}

export function choosePlayerForTeam(
  state: DraftState,
  playerId: string,
  teamId: number
): DraftState {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) return state;
  if (state.status !== "running") return state;
  if (state.currentTurnTeamId !== teamId) return state;
  if (!player.inPool || player.draftedByTeamId) return state;

  return {
    ...state,
    pendingChoices: {
      ...state.pendingChoices,
      [teamId]: playerId,
    },
    history: [
      historyEntry("choose", `${player.name} was chosen as pending pick.`, {
        playerId,
        teamId,
      }),
      ...state.history,
    ],
  };
}

function nextTurnInfo(
  currentTurnTeamId: number,
  currentRound: number,
  totalTeams: number,
  rounds: number
): {
  nextTurnTeamId: number;
  nextRound: number;
  nextStatus: DraftStatus;
} {
  if (currentTurnTeamId < totalTeams) {
    return {
      nextTurnTeamId: currentTurnTeamId + 1,
      nextRound: currentRound,
      nextStatus: "running",
    };
  }

  if (currentRound >= rounds) {
    return {
      nextTurnTeamId: totalTeams,
      nextRound: currentRound,
      nextStatus: "completed",
    };
  }

  return {
    nextTurnTeamId: 1,
    nextRound: currentRound + 1,
    nextStatus: "running",
  };
}

export function confirmTeamChoice(
  state: DraftState,
  teamId: number
): DraftState {
  if (state.status !== "running") return state;
  if (state.currentTurnTeamId !== teamId) return state;

  const playerId = state.pendingChoices[teamId];
  if (!playerId) return state;

  const player = state.players.find((item) => item.id === playerId);
  if (!player) return state;

  const previousRound = state.currentRound;
  const previousTurn = state.currentTurnTeamId;
  const previousStatus = state.status;

  const nextTurn = nextTurnInfo(
    state.currentTurnTeamId,
    state.currentRound,
    state.totalTeams,
    state.rounds
  );

  const nextPlayers: DraftPlayer[] = state.players.map((item) =>
    item.id === playerId
      ? {
          ...item,
          draftedByTeamId: teamId,
          draftOrder:
            state.players.filter((p) => p.draftedByTeamId !== null).length + 1,
        }
      : item
  );

  const nextTeams = state.teams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          picks: [...team.picks, playerId],
        }
      : team
  );

  return {
    ...state,
    players: nextPlayers,
    teams: nextTeams,
    currentRound: nextTurn.nextRound,
    currentTurnTeamId: nextTurn.nextTurnTeamId,
    status: nextTurn.nextStatus,
    pendingChoices: {
      ...state.pendingChoices,
      [teamId]: null,
    },
    history: [
      historyEntry(
        "confirm",
        `${player.name} was confirmed for Team ${teamId}.`,
        {
          playerId,
          teamId,
          prevRound: previousRound,
          prevTurnTeamId: previousTurn,
          prevStatus: previousStatus,
        }
      ),
      ...state.history,
    ],
  };
}

export function getCaptainTeamId(
  state: DraftState,
  user: AuthUser
): number | null {
  return state.captainAssignments[user.username] ?? null;
}