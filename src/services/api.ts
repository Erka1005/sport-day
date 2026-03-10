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

export async function loginApi(payload: LoginPayload): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await parseJsonSafe<
    LoginResponse | { detail?: string; message?: string }
  >(res)) as LoginResponse | { detail?: string; message?: string } | null;

  if (!res.ok || !data) {
    const message =
      (data as { detail?: string; message?: string } | null)?.detail ||
      (data as { detail?: string; message?: string } | null)?.message ||
      "Нэвтрэх үед алдаа гарлаа.";
    throw new Error(message);
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

export async function createSportApi(
  payload: CreateSportPayload,
  userId: number
): Promise<SportItem> {
  const res = await fetch(`${API_BASE}/sports-day/sports`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = (await parseJsonSafe<
    SportItem | { detail?: string; message?: string }
  >(res)) as SportItem | { detail?: string; message?: string } | null;

  if (!res.ok || !data) {
    const message =
      (data as { detail?: string; message?: string } | null)?.detail ||
      (data as { detail?: string; message?: string } | null)?.message ||
      "Failed to create sport.";
    throw new Error(message);
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

  const data = (await parseJsonSafe<
    SportItem[] | { items?: SportItem[] } | { detail?: string; message?: string }
  >(res)) as
    | SportItem[]
    | { items?: SportItem[] }
    | { detail?: string; message?: string }
    | null;

  if (!res.ok || !data) {
    const message =
      (data as { detail?: string; message?: string } | null)?.detail ||
      (data as { detail?: string; message?: string } | null)?.message ||
      "Failed to load sports.";
    throw new Error(message);
  }

  if (Array.isArray(data)) {
    return data;
  }

  if ("items" in data && Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}

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

export async function createMatchApi(
  payload: CreateMatchPayload,
  userId: number
): Promise<MatchItem> {
  const res = await fetch(`${API_BASE}/sports-day/schedule`, {
    method: "POST",
    headers: buildAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  const data = (await parseJsonSafe<
    MatchItem | { detail?: string; message?: string }
  >(res)) as MatchItem | { detail?: string; message?: string } | null;

  if (!res.ok || !data) {
    const message =
      (data as { detail?: string; message?: string } | null)?.detail ||
      (data as { detail?: string; message?: string } | null)?.message ||
      "Failed to create match.";
    throw new Error(message);
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

  const data = (await parseJsonSafe<
    MatchItem[] | { items?: MatchItem[] } | { detail?: string; message?: string }
  >(res)) as
    | MatchItem[]
    | { items?: MatchItem[] }
    | { detail?: string; message?: string }
    | null;

  if (!res.ok || !data) {
    const message =
      (data as { detail?: string; message?: string } | null)?.detail ||
      (data as { detail?: string; message?: string } | null)?.message ||
      "Failed to load matches.";
    throw new Error(message);
  }

  if (Array.isArray(data)) {
    return data;
  }

  if ("items" in data && Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}