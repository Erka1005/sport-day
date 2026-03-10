// services/api.ts

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

export type CreateSportPayload = {
  key: string;
  name: string;
  scoring_type: string;
};

export type SportItem = {
  id: number;
  key: string;
  name: string;
  scoring_type: string;
};

export type CreateMatchPayload = {
  sport_id: number;
  start_at: string;
  venue: string;
  team_a_id: number;
  team_b_id: number;
};

export type MatchItem = {
  id: number;
  sport_id: number;
  start_at: string;
  venue: string;
  team_a_id: number;
  team_b_id: number;
  status?: string;
  score_a?: number;
  score_b?: number;
  winner_team_id?: number | null;
};

export type SetMatchResultPayload = {
  score_a: number;
  score_b: number;
};

export type SetMatchResultResponse = string;

export type DraftPoolItem = {
  id: number;
  employee_name: string;
  sport_key: string;
  photo_url: string;
  eligible: boolean;
};

export type DraftPickItem = {
  round_no: number;
  pick_no: number;
  team_code: string;
  employee_name: string;
  sport_key: string;
  photo_url: string;
};

export type DraftStateResponse = {
  status: "idle" | "running" | "completed" | string;
  rounds: number;
  current_round: number;
  current_pick_no: number;
  current_team_code: string;
  sport_key: string;
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<
    LoginResponse | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Нэвтрэх үед алдаа гарлаа."));
  }

  if (
    typeof (data as LoginResponse).user_id !== "number" ||
    typeof (data as LoginResponse).username !== "string" ||
    typeof (data as LoginResponse).role !== "string"
  ) {
    throw new Error("Login response буруу бүтэцтэй байна.");
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
      typeof userId === "number"
        ? {
            "X-User-Id": String(userId),
          }
        : undefined,
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

/* ---------------- Matches ---------------- */

export async function createMatchApi(
  payload: CreateMatchPayload,
  userId: number
): Promise<MatchItem> {
  const res = await fetch(`${API_BASE}/sports-day/schedule`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<
    MatchItem | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to create match."));
  }

  return data as MatchItem;
}

export async function listMatchesApi(userId?: number): Promise<MatchItem[]> {
  const res = await fetch(`${API_BASE}/sports-day/schedule`, {
    method: "GET",
    headers:
      typeof userId === "number"
        ? {
            "X-User-Id": String(userId),
          }
        : undefined,
  });

  const data = await parseJsonSafe<
    MatchItem[] | { items?: MatchItem[] } | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load matches."));
  }

  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;

  return [];
}

export async function setMatchResultApi(
  matchId: number,
  payload: SetMatchResultPayload,
  userId: number
): Promise<SetMatchResultResponse> {
  const res = await fetch(`${API_BASE}/sports-day/match/${matchId}/result`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe<
    string | { detail?: string; message?: string }
  >(res);

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to set match result."));
  }

  if (typeof data === "string") return data;
  return "Result submitted successfully.";
}

/* ---------------- Draft ---------------- */

export async function importAllDraftFoldersApi(userId: number): Promise<string> {
  const res = await fetch(`${API_BASE}/sports-day/draft/import-all-folders`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
  });

  const data = await parseJsonSafe<
    string | { detail?: string; message?: string }
  >(res);

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to import folders."));
  }

  return typeof data === "string" ? data : "Import completed.";
}

export async function getDraftPoolApi(sportKey: string): Promise<DraftPoolItem[]> {
  const res = await fetch(
    withQuery("/sports-day/draft/pool", { sport: sportKey }),
    {
      method: "GET",
    }
  );

  const data = await parseJsonSafe<
    DraftPoolItem[] | { items?: DraftPoolItem[] } | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load draft pool."));
  }

  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;

  return [];
}

export async function getDraftPicksApi(sportKey: string): Promise<DraftPickItem[]> {
  const res = await fetch(
    withQuery("/sports-day/draft/picks", { sport: sportKey }),
    {
      method: "GET",
    }
  );

  const data = await parseJsonSafe<
    DraftPickItem[] | { items?: DraftPickItem[] } | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load draft picks."));
  }

  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;

  return [];
}

export async function getDraftStateApi(): Promise<DraftStateResponse | null> {
  const res = await fetch(`${API_BASE}/sports-day/draft/state`, {
    method: "GET",
  });

  const data = await parseJsonSafe<
    DraftStateResponse | { detail?: string; message?: string }
  >(res);

  if (!res.ok || !data) {
    throw new Error(resolveErrorMessage(data, "Failed to load draft state."));
  }

  if (typeof data === "object" && data !== null && "status" in data) {
    return data as DraftStateResponse;
  }

  return null;
}

export async function startDraftApi(
  sportKey: string,
  rounds: number,
  userId: number
): Promise<string> {
  const res = await fetch(
    withQuery("/sports-day/draft/start", {
      sport: sportKey,
      rounds,
    }),
    {
      method: "POST",
      headers: buildAuthHeaders(userId),
    }
  );

  const data = await parseJsonSafe<
    string | { detail?: string; message?: string }
  >(res);

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to start draft."));
  }

  return typeof data === "string" ? data : "Draft started.";
}

export async function resetDraftApi(
  sportKey: string,
  userId: number
): Promise<string> {
  const res = await fetch(
    withQuery("/sports-day/draft/reset", {
      sport: sportKey,
    }),
    {
      method: "POST",
      headers: buildAuthHeaders(userId),
    }
  );

  const data = await parseJsonSafe<
    string | { detail?: string; message?: string }
  >(res);

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to reset draft."));
  }

  return typeof data === "string" ? data : "Draft reset.";
}

export async function undoDraftApi(userId: number): Promise<string> {
  const res = await fetch(`${API_BASE}/sports-day/draft/undo`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
  });

  const data = await parseJsonSafe<
    string | { detail?: string; message?: string }
  >(res);

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to undo draft action."));
  }

  return typeof data === "string" ? data : "Draft action undone.";
}

export async function chooseDraftPlayerApi(
  employeeName: string,
  sportKey: string,
  userId: number
): Promise<string> {
  const res = await fetch(`${API_BASE}/sports-day/draft/choose`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify({
      employee_name: employeeName,
      sport_key: sportKey,
    }),
  });

  const data = await parseJsonSafe<
    string | { detail?: string; message?: string }
  >(res);

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to choose player."));
  }

  return typeof data === "string" ? data : "Player chosen.";
}

export async function confirmDraftPickApi(userId: number): Promise<string> {
  const res = await fetch(`${API_BASE}/sports-day/draft/confirm`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify({
      confirm: true,
    }),
  });

  const data = await parseJsonSafe<
    string | { detail?: string; message?: string }
  >(res);

  if (!res.ok || data === null) {
    throw new Error(resolveErrorMessage(data, "Failed to confirm pick."));
  }

  return typeof data === "string" ? data : "Pick confirmed.";
}

/* ---------------- local auth storage ---------------- */

export function saveAuthUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthUser();
}

export function hasRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}