export type UserRole = "admin" | "vendedor";

export interface AuthUser {
  username: string;
  role: UserRole;
}

export const USERS = [
  { username: "admin", password: "admin123", role: "admin" as UserRole },
  { username: "vendedor", password: "venta123", role: "vendedor" as UserRole },
];

export function validateCredentials(username: string, password: string): AuthUser | null {
  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) return null;
  return { username: user.username, role: user.role };
}

const AUTH_KEY = "bp-admin-session";

export function saveSession(user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function getSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
}
