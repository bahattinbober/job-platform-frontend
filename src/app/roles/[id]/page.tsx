import Link from "next/link";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { Meter } from "@/components/Meter";
import { ReferralPanel } from "@/components/ReferralPanel";
import { formatSince } from "@/lib/format";
import { jobDetails, resumeSkills } from "@/lib/mock";

export default async function RoleDetailPage(props: PageProps<"/roles/[id]">) {
  const { id } = await props.params;
  const job = jobDetails.find((j) => j.id === id);

  if (!job) notFound();

  const meta = [job.company, job.location, job.remoteType].filter(Boolean);
  const matchedSkills = job.skills.filter((skill) => resumeSkills.includes(skill));

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
      <header className="flex items-baseline justify-between gap-4 border-b border-edge py-7">
        <Link
          href="/"
          className="font-display text-[17px] font-bold tracking-[-0.02em] [font-variation-settings:'wdth'_88]"
        >
          Inroads
        </Link>
        <Link
          href="/matches"
          className="text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          Back to matches
        </Link>
      </header>

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
          <ul className="flex flex-wrap gap-1.5">
            {job.skills.map((skill) => {
              const matched = resumeSkills.includes(skill);
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
        </section>

        <section className="py-6">
          <h2 className="mb-4 text-sm font-semibold">Network</h2>
          {job.connection ? (
            <div className="flex items-center gap-3.5 rounded-[3px] border border-edge border-l-2 border-l-signal bg-surface px-[15px] py-[11px] max-[560px]:flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="mb-px text-sm font-semibold">
                  {job.connection.firstName} {job.connection.lastName}
                </p>
                <p className="truncate text-[12.5px] text-muted">{job.connection.position}</p>
              </div>
              {formatSince(job.connection.connectedAt) && (
                <span className="whitespace-nowrap font-mono text-[10.5px] tracking-[0.02em] text-muted">
                  SINCE {formatSince(job.connection.connectedAt)}
                </span>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-muted">No one from your network works here.</p>
          )}
        </section>

        {job.connection && (
          <section className="py-6">
            <h2 className="mb-4 text-sm font-semibold">Referral message</h2>
            <ReferralPanel
              jobId={job.id}
              connectionId={job.connection.id}
              jobTitle={job.title}
              company={job.company}
              connectionFirstName={job.connection.firstName}
              connectionPosition={job.connection.position}
              connectedAt={job.connection.connectedAt}
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
