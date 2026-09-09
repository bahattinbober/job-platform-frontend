import { ReferralPanel } from "@/components/ReferralPanel";
import { Reveal } from "@/components/nod/Reveal";
import { jobDetails, resumeSkills } from "@/lib/mock";

const role = jobDetails[0];
const connection = role.connection!;
const matchedSkills = role.skills.filter((skill) => resumeSkills.includes(skill));

export function ReferralMoment() {
  return (
    <section
      id="referral"
      className="mx-auto w-full max-w-[860px] px-5 pb-24 pt-28 sm:px-8 sm:pt-32"
    >
      <Reveal>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          06 · Referral message
        </p>
        <h2 className="mb-4 max-w-[20ch] font-display text-[clamp(30px,5vw,50px)] font-semibold leading-[1.04] tracking-[-0.025em] [font-variation-settings:'wdth'_84,'opsz'_54]">
          That&apos;s the message NOD started drafting.
        </h2>
        <p className="mb-10 max-w-[52ch] text-[15.5px] leading-relaxed text-muted">
          You just watched the network get here: two hops from you to Elif,
          who leads the platform team at {role.company}. NOD already knows
          why you&apos;re a fit — it wrote the first draft below.
        </p>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="overflow-hidden rounded-[4px] border border-edge bg-surface">
          <div className="flex flex-col gap-2 border-b border-edge px-6 py-4 font-mono text-[11.5px] text-muted">
            <p>
              <span className="text-muted/70">To </span>
              <span className="text-ink">
                {connection.firstName} {connection.lastName} · {connection.position}
              </span>
            </p>
            <p>
              <span className="text-muted/70">Re </span>
              <span className="text-ink">
                {role.title} at {role.company}
              </span>
            </p>
          </div>
          <div className="px-6 py-6">
            <ReferralPanel
              autoGenerate
              jobId={role.id}
              connectionId={connection.id}
              jobTitle={role.title}
              company={role.company}
              connectionFirstName={connection.firstName}
              connectionPosition={connection.position}
              connectedAt={connection.connectedAt}
              matchedSkills={matchedSkills}
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
