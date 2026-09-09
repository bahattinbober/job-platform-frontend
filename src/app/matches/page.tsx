import Link from "next/link";
import { RoleRail } from "@/components/RoleRail";
import { RoleRow } from "@/components/RoleRow";
import { roles } from "@/lib/mock";

export default function MatchesPage() {
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
          312 connections imported
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

      {/* The rail: one hairline down the left, a node per role. */}
      <RoleRail rowCount={roles.length}>
        {roles.map((role) => (
          <RoleRow key={role.id} role={role} />
        ))}
      </RoleRail>
    </main>
  );
}
