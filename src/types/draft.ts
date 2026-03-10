// types/draft.ts

export type DraftMode = "admin" | "captain" | "viewer";

export type DraftStatus = "idle" | "running" | "completed";

export type DraftSportKey =
  | "chess"
  | "basketball"
  | "volleyball"
  | "table_tennis"
  | "professional_skill"
  | "esports";

export type DraftSport = {
  key: DraftSportKey;
  label: string;
  targetCount: number;
};

export type DraftPlayer = {
  id: string;
  name: string;
  sportKey: DraftSportKey;
  photoUrl: string;
  company: string;
  gender: "male" | "female";
  inPool: boolean;
  addedToPoolByTeamId: number | null;
  draftedByTeamId: number | null;
  draftOrder: number | null;
};

export type DraftTeam = {
  id: number;
  name: string;
  shortName: string;
  picks: string[];
};

export type DraftHistoryType =
  | "start"
  | "reset"
  | "undo"
  | "add-to-pool"
  | "choose"
  | "confirm";

export type DraftHistoryEntry = {
  id: string;
  type: DraftHistoryType;
  text: string;
  createdAt: string;
  meta?: {
    playerId?: string;
    teamId?: number;
    prevRound?: number;
    prevTurnTeamId?: number;
    prevStatus?: DraftStatus;
  };
};

export type DraftState = {
  rounds: number;
  totalTeams: number;
  currentRound: number;
  currentTurnTeamId: number;
  status: DraftStatus;
  selectedSportKey: DraftSportKey;
  sports: DraftSport[];
  teams: DraftTeam[];
  players: DraftPlayer[];
  pendingChoices: Record<number, string | null>;
  history: DraftHistoryEntry[];
  captainAssignments: Record<string, number>;
};