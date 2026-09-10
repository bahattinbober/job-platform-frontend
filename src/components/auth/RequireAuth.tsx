"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Route guard for /upload, /matches and /roles/[id]. The token lives in
 * localStorage, which a Server Component can't read, so these pages fetch
 * client-side — which means the guard has to be client-side too. Rather
 * than a Server Component that renders the page shell and a client child
 * that fetches, this gate renders nothing at all until the session check
 * resolves: no flash of protected UI, no doomed fetch fired before the
 * redirect lands. The tradeoff is a client round trip (GET /auth/me) on
 * first load instead of a single server-rendered response, and a blank
 * beat before content appears — acceptable here since these are
 * already-authenticated, already-interactive screens, not the landing page.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state.status === "unauthenticated") router.replace("/login");
  }, [state.status, router]);

  if (state.status !== "authenticated") return null;
  return <>{children}</>;
}
