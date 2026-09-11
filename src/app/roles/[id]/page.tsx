"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ViewTransition } from "react";
import { AppHeader } from "@/components/AppHeader";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Meter } from "@/components/Meter";
import { ReferralPanel } from "@/components/ReferralPanel";
import { formatSince } from "@/lib/format";
import {
  ApiError,
  flattenParsedSkills,
  getActiveResume,
  getJobDetail,
  getMatchingJobs,
} from "@/lib/api";
import type { JobDetail } from "@/lib/types";

type Screen =
  | { step: "loading" }
  | { step: "not-found" }
  | { step: "error"; message: string }
  | { step: "ready"; job: JobDetail; resumeSkills: string[] };

function RoleDetailBody({ id }: { id: string }) {
  const [screen, setScreen] = useState<Screen>({ step: "loading" });
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setScreen({ step: "loading" });
      setSelectedConnectionId(null);
      try {
        const resume = await getActiveResume();
        const matches = resume ? await getMatchingJobs(resume.id) : [];
        const score = matches.find((m) => m.id === id)?.score ?? 0;
        const resumeSkills = flattenParsedSkills(resume?.parsedSkills ?? null).map((s) =>
          s.toLowerCase()
        );
        const job = await getJobDetail(id, score);
        if (!cancelled) {
          setScreen({ step: "ready", job, resumeSkills });
          setSelectedConnectionId(job.connections[0]?.id ?? null);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setScreen({ step: "not-found" });
        } else {
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
  }, [id]);

  if (screen.step === "loading") {
    return (
      <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
        <AppHeader right={<BackLink />} />
        <p className="pt-14 text-sm text-muted">Loading this role…</p>
      </main>
    );
  }

  if (screen.step === "not-found") {
    return (
      <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
        <AppHeader right={<BackLink />} />
        <div className="pt-14">
          <h1 className="mb-2 font-display text-[26px] font-semibold tracking-[-0.02em]">
            This role doesn&apos;t exist
          </h1>
          <p className="max-w-[46ch] text-sm text-muted">
            It may have been removed. Head back to your matches.
          </p>
        </div>
      </main>
    );
  }

  if (screen.step === "error") {
    return (
      <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
        <AppHeader right={<BackLink />} />
        <div className="pt-14">
          <h1 className="mb-2 font-display text-[26px] font-semibold tracking-[-0.02em]">
            Couldn&apos;t load this role
          </h1>
          <p className="max-w-[46ch] text-sm text-muted">{screen.message}</p>
        </div>
      </main>
    );
  }

  const { job, resumeSkills } = screen;
  const meta = [job.company, job.location, job.remoteType].filter(Boolean);
  const matchedSkills = job.skills.filter((skill) => resumeSkills.includes(skill.toLowerCase()));
  const selectedConnection =
    job.connections.find((c) => c.id === selectedConnectionId) ?? job.connections[0] ?? null;
  const multipleConnections = job.connections.length > 1;

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
      <AppHeader right={<BackLink />} />

      <div className="divide-y divide-edge">
        <section className="flex items-start justify-between gap-5 py-6 max-[560px]:flex-col max-[560px]:items-start">
          <div>
            <h1 className="mb-1 font-display text-[27px] font-semibold tracking-[-0.026em] [font-variation-settings:'wdth'_86,'opsz'_40]">
              <ViewTransition name={`role-title-${job.id}`}>{job.title}</ViewTransition>
            </h1>
            <p className="text-[14px] text-muted">
              {meta.map((part, i) => (
                <span key={part}>
                  {i > 0 && <span className="px-0.5 text-edge">·</span>}
                  {part}
                </span>
              ))}
            </p>
          </div>
          <Meter score={job.score} />
        </section>

        <section className="py-6">
          <h2 className="mb-4 text-sm font-semibold">Why it matched</h2>
          {job.skills.length === 0 ? (
            <p className="text-[13px] text-muted">This posting doesn&apos;t list required skills.</p>
          ) : (
            <>
              <ul className="flex flex-wrap gap-1.5">
                {job.skills.map((skill) => {
                  const matched = resumeSkills.includes(skill.toLowerCase());
                  return (
                    <li
                      key={skill}
                      className={
                        matched
                          ? "rounded-[2px] bg-ink px-2 py-1 text-[12.5px] text-surface"
                          : "rounded-[2px] border border-edge px-2 py-1 text-[12.5px] text-muted"
                      }
                    >
                      {skill}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 font-mono text-[11.5px] text-muted">
                {matchedSkills.length} of {job.skills.length} skills on your CV
              </p>
            </>
          )}
        </section>

        <section className="py-6">
          <h2 className="mb-4 text-sm font-semibold">Network</h2>
          {job.connections.length === 0 ? (
            <p className="text-[13px] text-muted">No one from your network works here.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {job.connections.map((connection) => {
                const isSelected = connection.id === selectedConnection?.id;
                return (
                  <button
                    key={connection.id}
                    type="button"
                    aria-pressed={multipleConnections ? isSelected : undefined}
                    onClick={() => setSelectedConnectionId(connection.id)}
                    className={`flex w-full cursor-pointer items-center gap-3.5 rounded-[3px] border bg-surface px-[15px] py-[11px] text-left transition-colors max-[560px]:flex-wrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                      !multipleConnections || isSelected
                        ? "border-edge border-l-2 border-l-signal"
                        : "border-edge border-l-2 border-l-transparent hover:border-l-signal/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="mb-px text-sm font-semibold">
                        {connection.firstName} {connection.lastName}
                      </p>
                      <p className="truncate text-[12.5px] text-muted">{connection.position}</p>
                    </div>
                    {formatSince(connection.connectedAt) && (
                      <span className="whitespace-nowrap font-mono text-[10.5px] tracking-[0.02em] text-muted">
                        SINCE {formatSince(connection.connectedAt)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedConnection && (
          <section className="py-6">
            <h2 className="mb-4 text-sm font-semibold">Referral message</h2>
            <ReferralPanel
              key={selectedConnection.id}
              source="live"
              jobId={job.id}
              connectionId={selectedConnection.id}
              jobTitle={job.title}
              company={job.company}
              connectionFirstName={selectedConnection.firstName}
              connectionPosition={selectedConnection.position}
              connectedAt={selectedConnection.connectedAt}
              matchedSkills={matchedSkills}
            />
          </section>
        )}
      </div>

      <div className="pt-6">
        <Link
          href="/matches"
          className="text-sm font-semibold text-ink underline decoration-edge underline-offset-4 transition-colors hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Back to matches
        </Link>
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link href="/matches" className="text-[12.5px] text-muted transition-colors hover:text-ink">
      Back to matches
    </Link>
  );
}

export default function RoleDetailPage(props: PageProps<"/roles/[id]">) {
  const { id } = use(props.params);
  return (
    <RequireAuth>
      <RoleDetailBody id={id} />
    </RequireAuth>
  );
}
