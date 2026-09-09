"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";

type Step = {
  title: string;
  description: string;
  kind: "neutral" | "signal";
};

// Descriptions echo real copy from the app itself: the PROCESSING_STAGES
// labels, the cosine-distance comment on RoleMatch.score, the connection
// count in the /matches header. The same words, doing the same job twice.
const STEPS: Step[] = [
  {
    title: "Upload your CV",
    description: "Text extracted. Skills parsed. Embedding generated.",
    kind: "neutral",
  },
  {
    title: "Matches surface",
    description:
      "Ranked by semantic similarity — cosine distance between embeddings, not keyword overlap.",
    kind: "neutral",
  },
  {
    title: "Find someone inside",
    description:
      "Your imported LinkedIn connections, checked against every company on the list.",
    kind: "signal",
  },
  {
    title: "Write the message",
    description: "Specific to that person and that role — not a template.",
    kind: "neutral",
  },
];

function RailStep({
  step,
  index,
  progress,
  reduceMotion,
}: {
  step: Step;
  index: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const start = index / STEPS.length;
  const end = (index + 0.5) / STEPS.length;
  const activation = useTransform(progress, [start, end], [0, 1]);

  const scale = useTransform(activation, [0, 1], [0.55, 1]);
  const nodeOpacity = useTransform(activation, [0, 1], [0.3, 1]);
  const textOpacity = useTransform(activation, [0, 1], [0.5, 1]);

  const activeColor = step.kind === "signal" ? "var(--signal)" : "var(--ink)";
  const borderColor = useTransform(activation, (v) => (v > 0.5 ? activeColor : "var(--edge)"));
  const backgroundColor = useTransform(activation, (v) => (v > 0.5 ? activeColor : "var(--paper)"));
  const boxShadow = useTransform(activation, (v) =>
    step.kind === "signal" && v > 0.5
      ? "0 0 0 4px var(--paper), 0 0 0 5px rgb(31 92 76 / 0.22)"
      : "none"
  );

  const nodeStyle = reduceMotion
    ? { borderColor: activeColor, backgroundColor: activeColor }
    : { scale, opacity: nodeOpacity, borderColor, backgroundColor, boxShadow };

  return (
    <div className="relative pb-24 last:pb-0 sm:pb-32">
      <span
        aria-hidden
        className="absolute left-[-24px] top-[10px] h-px w-[18px] bg-edge"
      />
      <motion.span
        aria-hidden
        style={nodeStyle}
        className="absolute left-[-33px] top-[6px] h-[9px] w-[9px] rounded-full border"
      />
      <motion.div style={reduceMotion ? undefined : { opacity: textOpacity }}>
        <p className="mb-1.5 font-mono text-[10.5px] text-muted">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="mb-1.5 font-display text-[19px] font-semibold tracking-[-0.018em] [font-variation-settings:'wdth'_90]">
          {step.title}
        </h3>
        <p className="max-w-[40ch] text-[14px] leading-relaxed text-muted">{step.description}</p>
      </motion.div>
    </div>
  );
}

/**
 * The same rail from the matches list, this time drawn by scroll position
 * instead of by mount. It is making the identical argument — the network
 * reaches this far and no further — but now the "rows" are the steps of
 * the pipeline, not the roles it produced.
 */
export function SignatureRail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.75", "end 0.5"],
  });

  return (
    // Same negative-margin mechanism as before, spending budget QueueScene
    // deliberately leaves empty at the tail of its pin (see its own
    // comment: everything from exitEnd to progress 1 is empty, worth
    // (1 − exitEnd) × (H − V) of scroll). Pulling this section up by M
    // moves its reveal point earlier by M — only safe while
    // M ≤ (1 − exitEnd) × (H − V).
    //
    // The previous pass used M = 50vh against a desktop max of 50.4vh —
    // 0.4vh of slack, satisfied on paper (50 ≤ 50.4) but not in an actual
    // browser: this section's heading rendered partly hidden behind
    // QueueScene's still-visible sticky content. The 0.4vh gap was too
    // thin to survive real-world vh rounding, scrollbar-width effects on
    // 100vw/100vh measurements, or sub-pixel drift in where useScroll's
    // "end end" offset actually lands — exactly the causes this pass was
    // warned not to guess at, so instead of guessing a bigger fixed
    // buffer, both levers moved: M dropped by ~40%, and QueueScene's
    // exitEnd moved from 0.58 to 0.52 (shortening hold, not active) so
    // the max itself grew too. Result is a much wider proportional
    // margin, not just a wider absolute one.
    //
    // Desktop: exitEnd = 0.52, H = 220vh, V = 100vh → max M =
    // (1 − 0.52) × 120vh = 57.6vh. Using -mt-[30vh]: 30 ≤ 57.6 ✓, 27.6vh
    // of slack (was 0.4vh) — this section now only uses about 52% of its
    // budget, versus the previous pass's 99%.
    //
    // Mobile: exitEnd = 0.52 (same PHASES, shared across breakpoints),
    // H = 128vh, V = 100vh → max M = 0.48 × 28vh ≈ 13.44vh. Using
    // -mt-[6vh]: 6 ≤ 13.44 ✓, 7.44vh of slack (was 0.76vh) — about 45% of
    // budget used, still the more cautious of the two breakpoints
    // (45% vs desktop's 52%) since mobile browsers' address-bar
    // show/hide makes 100vh itself wobble by a few px on top of whatever
    // this wider margin is already correcting for.
    //
    // All four numbers (-mt-[6vh], sm:-mt-[30vh], and the exitEnd/H/V
    // they're checked against in QueueScene) are literals in two separate
    // files — if any one of them changes, re-run this inequality by hand
    // before touching the others. motion-reduce:mt-0 cancels both margins
    // for the reduced-motion path, where QueueScene renders its
    // StaticFinalFrame instead (a normal short block, not a 220vh/128vh
    // pinned one) — there's no budget to spend there, and applying either
    // margin would yank this section up over whatever precedes it.
    <section className="border-t border-edge pb-20 pt-10 -mt-[6vh] motion-reduce:mt-0 sm:pb-28 sm:pt-14 sm:-mt-[30vh]">
      <div className="mx-auto w-full max-w-[760px] px-6">
        <h2 className="mb-2 max-w-[22ch] font-display text-[clamp(24px,4vw,32px)] font-semibold tracking-[-0.026em] [font-variation-settings:'wdth'_86,'opsz'_40]">
          What happens when you upload a CV
        </h2>
        {/* mb-16 (64px) used to be most of the ~100px measured between this
            line and the first step — tightened to mb-8 (32px) for a
            stricter vertical rhythm; the heading's own mb-2 plus this
            paragraph's line height make up the rest. */}
        <p className="mb-8 max-w-[46ch] text-muted">
          Four steps, start to finish. Scroll to follow the line.
        </p>

        <div ref={containerRef} className="relative pl-[42px]">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute bottom-2 left-[13px] top-2 w-px origin-top bg-edge"
            style={{ scaleY: reduceMotion ? 1 : scrollYProgress }}
          />
          {STEPS.map((step, i) => (
            <RailStep
              key={step.title}
              step={step}
              index={i}
              progress={scrollYProgress}
              reduceMotion={!!reduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
