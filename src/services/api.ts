export type UserRole = "user" | "admin" | "captain";

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  user_id: number;
  username: string;
  role: UserRole;
};

export type AuthUser = LoginResponse;

/* ---------------- Sports ---------------- */

export type CreateSportPayload = {
  key: string;
  name: string;
  uses_draft: boolean;
};

export type SportItem = {
  id: number;
  key: string;
  name: string;
  uses_draft: boolean;
};

/* ---------------- Schedule ---------------- */

export type CreateSchedulePayload = {
  sport_key: string;
  start_at: string;
  venue?: string;
  date_label?: string;
  note?: string;
};
export type UpdateSchedulePayload = Partial<CreateSchedulePayload>;

export type ScheduleItem = {
  id: number;
  sport_key: string;
  sport_name?: string;
  start_at?: string | null;
  venue?: string | null;
  date_label?: string | null;
  note?: string | null;
  status?: string | null;
};

/* ---------------- Results ---------------- */

export type SportResultRow = {
  team_id: number;
  team_code: string;
  team_name: string;
  team_color_hex?: string | null;
  captain_user_id?: number | null;
  rank: number;
  score: number;
  note?: string | null;
};

export type SportResultResponse = {
  sport_key: string;
  sport_name: string;
  results: SportResultRow[];
};

export type BulkSetSportResultItem = {
  team_code: string;
  rank: number;
  note?: string | null;
};

export type BulkSetSportResultsPayload = {
  sport_key: string;
  results: BulkSetSportResultItem[];
};

export type TeamDashboardSportResult = {
  sport_key: string;
  sport_name?: string;
  rank: number | null;
  score: number;
  note?: string | null;
};

export type DashboardTeamItem = {
  team_id: number;
  team_code: string;
  team_name: string;
  team_color_hex?: string | null;
  captain_user_id?: number | null;
  overall_rank: number;
  total_score: number;
  sport_results: TeamDashboardSportResult[];
};

export type DashboardSportItem = {
  sport_key: string;
  sport_name: string;
  results: SportResultRow[];
};

export type ResultsDashboardResponse = {
  teams: DashboardTeamItem[];
  sports: DashboardSportItem[];
};

/* ---------------- Draft ---------------- */

export type DraftPoolItem = {
  id: number;
  employee_name: string;
  sport_key: string;
  photo_url: string | null;
  eligible: boolean;
};

export type DraftPickItem = {
  round_no: number;
  pick_no: number;
  team_code: string;
  employee_name: string;
  sport_key: string;
  photo_url: string | null;
  picked_at?: string | null;
  team_label?: string | null;
  captain_username?: string | null;
};

export type DraftStatus =
  | "idle"
  | "running"
  | "paused"
  | "stopped"
  | "completed"
  | string;

export type DraftStateResponse = {
  status: DraftStatus;
  rounds: number;
  current_round: number;
  current_pick_no: number;
  current_team_code: string | null;
  sport_key: string | null;
  next_sport_key?: string | null;
  quota_per_team?: number | null;
  total_teams?: number | null;
  has_pending_pick?: boolean;
  updated_at?: string | null;
  completed_at?: string | null;
};

export type DraftRosterPlayer = {
  employee_name: string;
  photo_url: string | null;
  leader: boolean;
  note?: string | null;
  pick_no?: number;
  round_no?: number;
};

export type DraftRosterCategory = {
  sport_key: string;
  quota: number;
  filled: number;
  remaining?: number;
  players: DraftRosterPlayer[];
};

export type DraftRosterTeam = {
  team_code: string;
  team_label?: string | null;
  categories: DraftRosterCategory[];
};

export type DraftRosterResponse = {
  teams: DraftRosterTeam[];
};

export type DraftSummaryTeam = {
  team_code: string;
  filled: number;
  remaining: number;
};

export type DraftSummaryResponse = {
  sport_key: string;
  status: DraftStatus;
  quota_per_team: number;
  total_teams: number;
  teams: DraftSummaryTeam[];
};

export type DraftMyTeamCategory = {
  sport_key: string;
  quota?: number;
  filled?: number;
  players: DraftRosterPlayer[];
};

export type DraftMyTeamResponse = {
  team_code: string;
  categories: DraftMyTeamCategory[];
};

/* ---------------- Teams / Members ---------------- */

export type TeamItem = {
  id: number;
  code: string;
  name: string;
  color_hex?: string | null;
  captain_user_id?: number | null;
};

export type RenameMyTeamPayload = {
  name: string;
};

export type TeamMemberItem = {
  id: number;
  team_code?: string;
  employee_name: string;
  sport_key?: string;
  leader: boolean;
  note?: string | null;
  photo_url: string | null;
};

export type TeamMemberListResponse =
  | TeamMemberItem[]
  | { items?: TeamMemberItem[] }
  | { players?: TeamMemberItem[] };

export type BulkMemberInput =
  | string
  | {
      employee_name: string;
      leader?: boolean;
      note?: string;
      photo_url?: string;
    };

export type BulkAddMembersPayload = {
  team_code: string;
  sport_key: string;
  members: BulkMemberInput[];
};

export type BulkSetMembersPayload = {
  team_code: string;
  sport_key: string;
  members: BulkMemberInput[];
};

export type BulkRemoveMembersPayload = {
  team_code: string;
  sport_key: string;
  employee_names: string[];
};

export type UpdateMemberPayload = {
  employee_name: string;
  sport_key: string;
  leader?: boolean;
  note?: string;
  photo?: File | null;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

const AUTH_STORAGE_KEY = "auth_user";

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function buildAuthHeaders(userId?: number): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof userId === "number") {
    headers["X-User-Id"] = String(userId);
  }

  return headers;
}

function resolveErrorMessage(data: unknown, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;

  if (typeof data === "object" && data !== null) {
    const maybe = data as {
      detail?: string;
      message?: string;
      error?: string;
    };
    return maybe.detail || maybe.message || maybe.error || fallback;
  }

  return fallback;
}

function withQuery(
  path: string,
  params: Record<string, string | number | undefined | null>
): string {
  const url = new URL(`${API_BASE}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

/* ---------------- Auth ---------------- */

export async function loginApi(payload: LoginPayload): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<
    LoginResponse | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Нэвтрэх үед алдаа гарлаа."));
  }

  return data as LoginResponse;
}

/* ---------------- Sports ---------------- */

export async function createSportApi(
  payload: CreateSportPayload,
  userId: number
): Promise<SportItem> {
  const res = await fetch(`${API_BASE}/sports-day/sports`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<
    SportItem | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to create sport."));
  }

  return data as SportItem;
}

export async function listSportsApi(userId?: number): Promise<SportItem[]> {
  const res = await fetch(`${API_BASE}/sports-day/sports`, {
    method: "GET",
    headers:
      typeof userId === "number" ? { "X-User-Id": String(userId) } : undefined,
  });

  const data = await parseJsonSafe<
    SportItem[] | { items?: SportItem[] } | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load sports."));
  }

  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;
  return [];
}

/* ---------------- Teams ---------------- */

export async function listTeamsApi(userId?: number): Promise<TeamItem[]> {
  const res = await fetch(`${API_BASE}/sports-day/teams`, {
    method: "GET",
    headers:
      typeof userId === "number" ? { "X-User-Id": String(userId) } : undefined,
  });

  const data = await parseJsonSafe<
    TeamItem[] | { items?: TeamItem[] } | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load teams."));
  }

  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;
  return [];
}

export async function renameMyTeamApi(
  payload: RenameMyTeamPayload,
  userId: number
): Promise<TeamItem> {
  const res = await fetch(`${API_BASE}/sports-day/teams/my/name`, {
    method: "PUT",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<
    TeamItem | { detail?: string; message?: string; error?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to rename team."));
  }

  return data as TeamItem;
}

/* ---------------- Schedule ---------------- */

export async function createScheduleApi(
  payload: CreateSchedulePayload,
  userId: number
): Promise<ScheduleItem> {
  const res = await fetch(`${API_BASE}/sports-day/schedule`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<
    ScheduleItem | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to create schedule."));
  }

  return data as ScheduleItem;
}

export async function listScheduleApi(userId?: number): Promise<ScheduleItem[]> {
  const res = await fetch(`${API_BASE}/sports-day/schedule`, {
    method: "GET",
    headers:
      typeof userId === "number" ? { "X-User-Id": String(userId) } : undefined,
  });

  const data = await parseJsonSafe<
    ScheduleItem[] | { items?: ScheduleItem[] } | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load schedule."));
  }

  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;
  return [];
}

export async function listTodayScheduleApi(
  dateLabel: string,
  userId?: number
): Promise<ScheduleItem[]> {
  const res = await fetch(
    withQuery("/sports-day/schedule/today", { date_label: dateLabel }),
    {
      method: "GET",
      headers:
        typeof userId === "number"
          ? { "X-User-Id": String(userId) }
          : undefined,
    }
  );

  const data = await parseJsonSafe<
    ScheduleItem[] | { items?: ScheduleItem[] } | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load today schedule."));
  }

  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;
  return [];
}

export async function updateScheduleApi(
  scheduleId: number,
  payload: UpdateSchedulePayload,
  userId: number
): Promise<ScheduleItem> {
  const res = await fetch(`${API_BASE}/sports-day/schedule/${scheduleId}`, {
    method: "PUT",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<
    ScheduleItem | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to update schedule."));
  }

  return data as ScheduleItem;
}

export async function deleteScheduleApi(
  scheduleId: number,
  userId: number
): Promise<string> {
  const res = await fetch(`${API_BASE}/sports-day/schedule/${scheduleId}`, {
    method: "DELETE",
    headers:
      typeof userId === "number" ? { "X-User-Id": String(userId) } : undefined,
  });

  const data = await parseJsonSafe<
    string | { detail?: string; message?: string }
  >(res);

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to delete schedule."));
  }

  return typeof data === "string" ? data : "Schedule deleted successfully.";
}

/* ---------------- Results ---------------- */

export async function getSportResultsApi(
  sportKey: string,
  userId?: number
): Promise<SportResultResponse> {
  const res = await fetch(
    withQuery("/sports/results", { sport_key: sportKey }),
    {
      method: "GET",
      headers:
        typeof userId === "number"
          ? { "X-User-Id": String(userId) }
          : undefined,
    }
  );

  const data = await parseJsonSafe<
    SportResultResponse | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load sport results."));
  }

  return data as SportResultResponse;
}

export async function getResultsDashboardApi(
  userId?: number
): Promise<ResultsDashboardResponse> {
  const res = await fetch(`${API_BASE}/sports/results/dashboard`, {
    method: "GET",
    headers:
      typeof userId === "number" ? { "X-User-Id": String(userId) } : undefined,
  });

  const data = await parseJsonSafe<
    ResultsDashboardResponse | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load results dashboard."));
  }

  return data as ResultsDashboardResponse;
}

export async function bulkSetSportResultsApi(
  payload: BulkSetSportResultsPayload,
  userId: number
): Promise<string> {
  const res = await fetch(`${API_BASE}/sports/results/bulk-set`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<
    string | { detail?: string; message?: string }
  >(res);

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to save sport results."));
  }

  return typeof data === "string" ? data : "Sport results saved successfully.";
}

/* ---------------- Members / Roster ---------------- */

export async function listMembersApi(params: {
  team_code?: string;
  sport_key?: string;
  userId?: number;
}): Promise<TeamMemberItem[]> {
  const res = await fetch(
    withQuery("/sports-day/member", {
      team_code: params.team_code,
      sport_key: params.sport_key,
    }),
    {
      method: "GET",
      headers:
        typeof params.userId === "number"
          ? { "X-User-Id": String(params.userId) }
          : undefined,
    }
  );

  const data = await parseJsonSafe<
    TeamMemberListResponse | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load roster members."));
  }

  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;
  if ("players" in data && Array.isArray(data.players)) return data.players;
  return [];
}

export async function bulkAddMembersApi(
  payload: BulkAddMembersPayload,
  userId: number
): Promise<string> {
  const res = await fetch(`${API_BASE}/sports-day/member/bulk-add`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<string | { detail?: string; message?: string }>(
    res
  );

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to add members."));
  }

  return typeof data === "string" ? data : "Members added successfully.";
}

export async function bulkSetMembersApi(
  payload: BulkSetMembersPayload,
  userId: number
): Promise<string> {
  const res = await fetch(`${API_BASE}/sports-day/member/bulk-set`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<string | { detail?: string; message?: string }>(
    res
  );

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to set members."));
  }

  return typeof data === "string" ? data : "Members set successfully.";
}

export async function bulkRemoveMembersApi(
  payload: BulkRemoveMembersPayload,
  userId: number
): Promise<string> {
  const res = await fetch(`${API_BASE}/sports-day/member/bulk-remove`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<string | { detail?: string; message?: string }>(
    res
  );

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to remove members."));
  }

  return typeof data === "string" ? data : "Members removed successfully.";
}

export async function updateMemberApi(
  memberId: number,
  payload: UpdateMemberPayload,
  userId: number
): Promise<TeamMemberItem> {
  const form = new FormData();
  form.append("employee_name", payload.employee_name);
  form.append("sport_key", payload.sport_key);

  if (typeof payload.leader === "boolean") {
    form.append("leader", String(payload.leader));
  }

  if (payload.note !== undefined) {
    form.append("note", payload.note);
  }

  if (payload.photo) {
    form.append("photo", payload.photo);
  }

  const res = await fetch(`${API_BASE}/sports-day/member/${memberId}`, {
    method: "PUT",
    headers:
      typeof userId === "number" ? { "X-User-Id": String(userId) } : undefined,
    body: form,
  });

  const data = await parseJsonSafe<
    TeamMemberItem | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to update member."));
  }

  return data as TeamMemberItem;
}

export async function deleteMemberApi(
  memberId: number,
  userId: number
): Promise<string> {
  const res = await fetch(`${API_BASE}/sports-day/member/${memberId}`, {
    method: "DELETE",
    headers:
      typeof userId === "number" ? { "X-User-Id": String(userId) } : undefined,
  });

  const data = await parseJsonSafe<string | { detail?: string; message?: string }>(
    res
  );

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to delete member."));
  }

  return typeof data === "string" ? data : "Member deleted successfully.";
}

/* ---------------- Draft ---------------- */
/* Эндээс доошх draft функцүүдээ хуучнаараа хэвээр үлдээнэ. */
export async function getDraftRosterApi(): Promise<DraftRosterResponse> {
  const res = await fetch(`${API_BASE}/sports-day/draft/roster`, {
    method: "GET",
  });

  const data = await parseJsonSafe<
    DraftRosterResponse | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load draft roster."));
  }

  return data as DraftRosterResponse;
}

export async function getMyDraftTeamApi(
  userId: number
): Promise<DraftMyTeamResponse> {
  const res = await fetch(`${API_BASE}/sports-day/draft/my-team`, {
    method: "GET",
    headers: { "X-User-Id": String(userId) },
  });

  const data = await parseJsonSafe<
    DraftMyTeamResponse | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load my draft team."));
  }

  return data as DraftMyTeamResponse;
}
export function saveAuthUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}