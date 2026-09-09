"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { Meter } from "@/components/Meter";
import { Reveal } from "@/components/nod/Reveal";
import { jobDetails, resumeSkills } from "@/lib/mock";

const role = jobDetails[0];
const matchedSkills = role.skills.filter((skill) => resumeSkills.includes(skill));

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const chipVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function OverlapMoment() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto w-full max-w-[1020px] px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <Reveal>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          04 · Skill overlap
        </p>
        <h2 className="mb-4 max-w-[22ch] font-display text-[clamp(28px,4.6vw,44px)] font-semibold leading-[1.06] tracking-[-0.025em] [font-variation-settings:'wdth'_84,'opsz'_50]">
          You already match more of this than you think.
        </h2>
        <p className="mb-12 max-w-[52ch] text-[15px] leading-relaxed text-muted">
          NOD lines your parsed skills up against what {role.company} asked
          for on the {role.title} posting, so the score isn&apos;t a mystery.
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid gap-px overflow-hidden rounded-[4px] border border-edge bg-edge sm:grid-cols-[1fr_auto_1fr]">
          <div className="bg-surface px-6 py-7">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              Your CV
            </p>
            <motion.ul
              className="flex flex-wrap gap-1.5"
              initial={reduceMotion ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={listVariants}
            >
              {resumeSkills.map((skill) => {
                const matched = matchedSkills.includes(skill);
                return (
                  <motion.li
                    key={skill}
                    variants={chipVariants}
                    className={
                      matched
                        ? "rounded-[2px] border border-signal bg-signal/10 px-2 py-1 text-[12.5px] font-medium text-signal"
                        : "rounded-[2px] border border-edge px-2 py-1 text-[12.5px] text-muted"
                    }
                  >
                    {skill}
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>

          <div className="flex items-center justify-center bg-surface px-4 py-7 sm:flex-col sm:gap-3">
            <Meter score={role.score} />
            <p className="mt-2 whitespace-nowrap font-mono text-[11px] text-muted sm:mt-0">
              {matchedSkills.length} of {role.skills.length} matched
            </p>
          </div>

          <div className="bg-surface px-6 py-7">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {role.title} · {role.company}
            </p>
            <motion.ul
              className="flex flex-wrap gap-1.5"
              initial={reduceMotion ? "visible" : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={listVariants}
            >
              {role.skills.map((skill) => {
                const matched = matchedSkills.includes(skill);
                return (
                  <motion.li
                    key={skill}
                    variants={chipVariants}
                    className={
                      matched
                        ? "rounded-[2px] bg-signal px-2 py-1 text-[12.5px] font-medium text-surface"
                        : "rounded-[2px] border border-edge px-2 py-1 text-[12.5px] text-muted"
                    }
                  >
                    {skill}
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
