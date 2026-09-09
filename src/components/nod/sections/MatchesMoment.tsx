import { RoleRail } from "@/components/RoleRail";
import { RoleRow } from "@/components/RoleRow";
import { Reveal } from "@/components/nod/Reveal";
import { roles } from "@/lib/mock";

export function MatchesMoment() {
  const withPath = roles.filter((r) => r.connection).length;

  return (
    <section className="mx-auto w-full max-w-[860px] px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <Reveal>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          03 · Ranked matches
        </p>
        <h2 className="mb-4 max-w-[20ch] font-display text-[clamp(28px,4.6vw,44px)] font-semibold leading-[1.06] tracking-[-0.025em] [font-variation-settings:'wdth'_84,'opsz'_50]">
          Ranked by fit, not by who shouts loudest.
        </h2>
        <p className="mb-12 max-w-[48ch] text-[15px] leading-relaxed text-muted">
          Every posting NOD pulls in gets scored against your CV. The filled
          nodes on the rail are the ones where you already know someone on
          the inside — {withPath} of {roles.length} here.
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <RoleRail rowCount={roles.length}>
          {roles.map((role) => (
            <RoleRow key={role.id} role={role} />
          ))}
        </RoleRail>
      </Reveal>
    </section>
  );
}
