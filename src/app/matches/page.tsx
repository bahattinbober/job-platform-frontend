"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RoleRail } from "@/components/RoleRail";
import { RoleRow } from "@/components/RoleRow";
import { ApiError, getActiveResume, getRoleMatches, listConnections } from "@/lib/api";
import type { RoleMatch } from "@/lib/types";

type Screen =
  | { step: "loading" }
  | { step: "error"; message: string }
  | { step: "empty" }
  | { step: "ready"; roles: RoleMatch[]; connectionCount: number };

function MatchesBody() {
  const [screen, setScreen] = useState<Screen>({ step: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setScreen({ step: "loading" });
      try {
        const resume = await getActiveResume();
        if (!resume) {
          if (!cancelled) setScreen({ step: "empty" });
          return;
        }
        const [roles, connections] = await Promise.all([
          getRoleMatches(resume.id),
          listConnections(),
        ]);
        if (!cancelled) setScreen({ step: "ready", roles, connectionCount: connections.length });
      } catch (err) {
        if (!cancelled) {
          setScreen({
            step: "error",
            message: err instanceof ApiError ? err.message : "Something went wrong.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connectionsBadge =
    screen.step === "ready" ? (
      <p className="font-mono text-[11.5px] text-muted">
        {screen.connectionCount} connection{screen.connectionCount === 1 ? "" : "s"} imported
      </p>
    ) : undefined;

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
      <AppHeader right={connectionsBadge} />

      {screen.step === "loading" && <p className="pt-14 text-sm text-muted">Loading your matches…</p>}

      {screen.step === "error" && (
        <div className="pt-14">
          <h1 className="mb-2 font-display text-[26px] font-semibold tracking-[-0.02em]">
            Couldn&apos;t load your matches
          </h1>
          <p className="max-w-[46ch] text-sm text-muted">{screen.message}</p>
        </div>
      )}

      {screen.step === "empty" && (
        <section className="pt-14">
          <h1 className="mb-3 font-display text-[clamp(26px,5vw,38px)] font-semibold leading-[1.1] tracking-[-0.028em]">
            No CV on file yet
          </h1>
          <p className="mb-6 max-w-[46ch] text-muted">
            Upload your CV and NOD will rank the roles that fit and find who you know at each
            company.
          </p>
          <Link
            href="/upload"
            className="inline-block rounded-[2px] border border-signal bg-signal px-4 py-2 text-[13px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-signal"
          >
            Upload your CV
          </Link>
        </section>
      )}

      {screen.step === "ready" && (() => {
        const { roles } = screen;
        const withPath = roles.filter((r) => r.connections.length > 0).length;
        return (
          <>
            <section className="pb-11 pt-14">
              <h1 className="mb-[18px] max-w-[15ch] font-display text-[clamp(30px,6vw,46px)] font-semibold leading-[1.06] tracking-[-0.032em] [font-variation-settings:'wdth'_82,'opsz'_48]">
                {roles.length === 1 ? "One role fits" : `${roles.length} roles fit`} your
                CV. <span className="text-signal">{withPath}</span> have someone you
                know.
              </h1>
              <p className="max-w-[46ch] text-muted">
                Your application lands in a queue. A referral skips it. The filled marks
                are companies where you already know a way in —{" "}
                <b className="font-medium text-ink">ranked by fit, not by who you know</b>.
              </p>
            </section>

            {roles.length === 0 ? (
              <p className="text-sm text-muted">
                No matches yet. If you just uploaded a CV, the matching job may still be
                processing — check back in a moment.
              </p>
            ) : (
              <RoleRail rowCount={roles.length}>
                {roles.map((role) => (
                  <RoleRow key={role.id} role={role} />
                ))}
              </RoleRail>
            )}
          </>
        );
      })()}
    </main>
  );
}

export default function MatchesPage() {
  return (
    <RequireAuth>
      <MatchesBody />
    </RequireAuth>
  );
}
