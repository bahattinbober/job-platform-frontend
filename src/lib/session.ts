/**
 * Everything that knows the token lives in localStorage is here. The
 * backend returns the JWT in a JSON body and sets no cookies, so
 * localStorage is what's available for this pass — swapping to an
 * httpOnly cookie later means changing these three functions, not every
 * call site that currently imports getToken/setToken/clearToken.
 */
const TOKEN_KEY = "nod_auth_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable (private mode, quota) — session just won't persist
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
