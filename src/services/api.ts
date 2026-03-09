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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

const AUTH_STORAGE_KEY = "auth_user";

export async function loginApi(payload: LoginPayload): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as
    | LoginResponse
    | { detail?: string; message?: string }
    | null;

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