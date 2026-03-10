// data/mock-draft.ts

import {
  DraftHistoryEntry,
  DraftPlayer,
  DraftSport,
  DraftSportKey,
  DraftState,
  DraftTeam,
} from "@/types/draft";

export const DRAFT_SPORTS: DraftSport[] = [
  { key: "chess", label: "Chess / Draughts", targetCount: 8 },
  { key: "basketball", label: "Basketball", targetCount: 12 },
  { key: "volleyball", label: "Volleyball", targetCount: 12 },
  { key: "table_tennis", label: "Table Tennis / Darts", targetCount: 10 },
  { key: "professional_skill", label: "Professional Skill", targetCount: 8 },
  { key: "esports", label: "E-Sports", targetCount: 6 },
];

const TEAM_NAMES = [
  "Falcons",
  "Titans",
  "Blazers",
  "Storm",
  "Wolves",
  "Comets",
  "Vikings",
  "Royals",
];

const FIRST_NAMES = [
  "Amar",
  "Bilguun",
  "Temuulen",
  "Anu",
  "Enkhjin",
  "Munkh",
  "Saruul",
  "Nomun",
  "Tergel",
  "Ariun",
  "Nandin",
  "Batsuuri",
  "Tsolmon",
  "Zolboo",
  "Maral",
  "Khulan",
];

const LAST_NAMES = [
  "Bat",
  "Bold",
  "Enkh",
  "Gan",
  "Tumur",
  "Otgon",
  "Munkh",
  "Dorj",
  "Sukh",
  "Erdene",
  "Tsetseg",
  "Bayar",
  "Od",
  "Solongo",
];

const COMPANIES = [
  "MMS Engineering",
  "MMSE Green Building",
  "My Origin",
  "Insight-Out",
  "Source Hub",
  "Field Ops",
];

function buildTeams(): DraftTeam[] {
  return TEAM_NAMES.map((name, index) => ({
    id: index + 1,
    name: name,
    shortName: name.slice(0, 3).toUpperCase(),
    picks: [],
  }));
}

function buildHistory(): DraftHistoryEntry[] {
  return [];
}

function sportPlan(): DraftSportKey[] {
  return [
    ...Array(8).fill("chess"),
    ...Array(12).fill("basketball"),
    ...Array(12).fill("volleyball"),
    ...Array(10).fill("table_tennis"),
    ...Array(8).fill("professional_skill"),
    ...Array(6).fill("esports"),
  ] as DraftSportKey[];
}

function buildPlayers(): DraftPlayer[] {
  const plans = sportPlan();

  return plans.map((sportKey, index) => {
    const first = FIRST_NAMES[index % FIRST_NAMES.length];
    const last = LAST_NAMES[index % LAST_NAMES.length];
    const name = `${first} ${last} ${index + 1}`;
    const seed = encodeURIComponent(name);

    return {
      id: `player-${index + 1}`,
      name,
      sportKey,
      photoUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`,
      company: COMPANIES[index % COMPANIES.length],
      gender: index % 3 === 0 ? "female" : "male",
      inPool: false,
      addedToPoolByTeamId: null,
      draftedByTeamId: null,
      draftOrder: null,
    };
  });
}

export function createInitialDraftState(): DraftState {
  return {
    rounds: 7,
    totalTeams: 8,
    currentRound: 1,
    currentTurnTeamId: 1,
    status: "idle",
    selectedSportKey: "basketball",
    sports: DRAFT_SPORTS,
    teams: buildTeams(),
    players: buildPlayers(),
    pendingChoices: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
    },
    history: buildHistory(),
    captainAssignments: {},
  };
}