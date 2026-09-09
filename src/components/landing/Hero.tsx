import { RoleRail } from "@/components/RoleRail";
import { RoleRow } from "@/components/RoleRow";
import { roles } from "@/lib/mock";

// The same three rows a real visitor would see on /matches — not a mockup.
const previewRoles = roles.slice(0, 3);

export function Hero() {
  return (
    <section className="pb-20 pt-16 sm:pb-28 sm:pt-24">
      <h1 className="mb-5 max-w-[17ch] font-display text-[clamp(32px,6vw,50px)] font-semibold leading-[1.05] tracking-[-0.032em] [font-variation-settings:'wdth'_82,'opsz'_48]">
        Applications disappear into a queue. A referral skips it.
      </h1>
      <p className="mb-12 max-w-[52ch] text-[15px] text-muted sm:text-base">
        Inroads reads your CV, finds the roles that actually fit, and checks
        which of your LinkedIn connections already work there — so you can
        ask instead of apply.
      </p>

      <div className="rounded-[3px] border border-edge bg-surface p-5 sm:p-8">
        <RoleRail rowCount={previewRoles.length}>
          {previewRoles.map((role) => (
            <RoleRow key={role.id} role={role} />
          ))}
        </RoleRail>
      </div>
      <p className="mt-3 text-[13px] text-muted">
        Live components, not a screenshot — this updates whenever the product does.
      </p>
    </section>
  );
}
