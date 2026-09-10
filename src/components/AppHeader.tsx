"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

/** Shared header for the app screens (as opposed to the public landing page's SiteNav). */
export function AppHeader({ right }: { right?: ReactNode }) {
  const { state, signOut } = useAuth();

  return (
    <header className="flex items-baseline justify-between gap-4 border-b border-edge py-7">
      <Link
        href="/"
        className="font-display text-[17px] font-bold tracking-[-0.02em] [font-variation-settings:'wdth'_88]"
      >
        NOD
      </Link>
      <div className="flex items-center gap-4">
        {right}
        {state.status === "authenticated" && (
          <div className="flex items-center gap-3 font-mono text-[11.5px] text-muted">
            <span className="hidden sm:inline">{state.email}</span>
            <button
              type="button"
              onClick={signOut}
              className="cursor-pointer text-ink underline decoration-edge underline-offset-4 transition-colors hover:decoration-ink"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
