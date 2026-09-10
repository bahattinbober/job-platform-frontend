"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getMe, login as apiLogin, registerAccount } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/session";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; email: string }
  | { status: "unauthenticated" };

type AuthContextValue = {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        if (!cancelled) setState({ status: "unauthenticated" });
        return;
      }
      try {
        const me = await getMe();
        if (!cancelled) setState({ status: "authenticated", email: me.email });
      } catch {
        // A 401 here already triggers the API client's clear-token-and-
        // redirect; any other failure (backend down) just leaves the user
        // logged out rather than stuck on a spinner forever.
        if (!cancelled) setState({ status: "unauthenticated" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const token = await apiLogin(email, password);
    setToken(token);
    const me = await getMe();
    setState({ status: "authenticated", email: me.email });
  }, []);

  const register = useCallback(
    async (email: string, password: string) => {
      await registerAccount(email, password);
      await login(email, password);
    },
    [login]
  );

  const signOut = useCallback(() => {
    clearToken();
    setState({ status: "unauthenticated" });
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ state, login, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
