import Link from "next/link";
import { RoleRail } from "@/components/RoleRail";
import { RoleRow } from "@/components/RoleRow";
import { getActiveResume, getRoleMatches, listConnections } from "@/lib/api";

export default async function MatchesPage() {
  const resume = await getActiveResume();

  if (!resume) {
    return (
      <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
        <header className="flex items-baseline justify-between gap-4 border-b border-edge py-7">
          <Link
            href="/"
            className="font-display text-[17px] font-bold tracking-[-0.02em] [font-variation-settings:'wdth'_88]"
          >
            NOD
          </Link>
        </header>
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
      </main>
    );
  }

  const [roles, connections] = await Promise.all([
    getRoleMatches(resume.id),
    listConnections(),
  ]);
  const withPath = roles.filter((r) => r.connection).length;

  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
      <header className="flex items-baseline justify-between gap-4 border-b border-edge py-7">
        <Link
          href="/"
          className="font-display text-[17px] font-bold tracking-[-0.02em] [font-variation-settings:'wdth'_88]"
        >
          NOD
        </Link>
        <p className="font-mono text-[11.5px] text-muted">
          {connections.length} connection{connections.length === 1 ? "" : "s"} imported
        </p>
      </header>

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
          No matches yet. If you just uploaded a CV, the matching job may still be processing —
          check back in a moment.
        </p>
      ) : (
        <RoleRail rowCount={roles.length}>
          {roles.map((role) => (
            <RoleRow key={role.id} role={role} />
          ))}
        </RoleRail>
      )}
    </main>
  );
}
