"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { formatSince } from "@/lib/format";
import { jobDetails } from "@/lib/mock";

// Same example as the hero preview — the pipeline actually produces this match.
const exampleJob = jobDetails[0];
const exampleConnection = exampleJob.connection!;

type Chip = {
  label: string;
  detail: string;
  initialY: number;
  initialRotate: number;
  range: [number, number];
};

const CHIPS: Chip[] = [
  {
    label: "Your CV",
    detail: "TypeScript · Node.js · PostgreSQL",
    initialY: -16,
    initialRotate: -3,
    range: [0, 0.45],
  },
  {
    label: exampleJob.title,
    detail: `${exampleJob.company} · ${exampleJob.location} · ${exampleJob.remoteType}`,
    initialY: 14,
    initialRotate: 2,
    range: [0.05, 0.5],
  },
  {
    label: "Your network",
    detail: "312 connections imported",
    initialY: -10,
    initialRotate: -2,
    range: [0.1, 0.55],
  },
];

function SourceChip({
  chip,
  progress,
  reduceMotion,
}: {
  chip: Chip;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const y = useTransform(progress, chip.range, [chip.initialY, 0]);
  const rotate = useTransform(progress, chip.range, [chip.initialRotate, 0]);
  const opacity = useTransform(progress, chip.range, [0.5, 1]);

  return (
    <motion.div
      style={reduceMotion ? undefined : { y, rotate, opacity }}
      className="rounded-[3px] border border-edge bg-surface px-4 py-3.5"
    >
      <p className="mb-1 text-sm font-semibold">{chip.label}</p>
      <p className="text-[13px] text-muted">{chip.detail}</p>
    </motion.div>
  );
}

/**
 * Three unrelated sources drift into alignment as the section scrolls past.
 * None of the three cards changes what it says — only where it sits. The
 * point is that the match at the bottom only exists once all three agree.
 */
export function SourceMerge() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.4"],
  });

  const cardOpacity = useTransform(scrollYProgress, [0.6, 0.95], [0, 1]);
  const cardY = useTransform(scrollYProgress, [0.6, 0.95], [10, 0]);
  const cardScale = useTransform(scrollYProgress, [0.6, 0.95], [0.96, 1]);

  return (
    <section className="border-t border-edge py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[760px] px-6">
        <h2 className="mb-2 max-w-[24ch] font-display text-[clamp(24px,4vw,32px)] font-semibold tracking-[-0.026em] [font-variation-settings:'wdth'_86,'opsz'_40]">
          Separately, none of this helps
        </h2>
        <p className="mb-16 max-w-[50ch] text-muted">
          Your CV says what you can do. The posting says what&apos;s needed.
          Your network says who to ask. Only together do they point anywhere.
        </p>

        <div ref={containerRef} className="py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CHIPS.map((chip) => (
              <SourceChip
                key={chip.label}
                chip={chip}
                progress={scrollYProgress}
                reduceMotion={!!reduceMotion}
              />
            ))}
          </div>

          <p className="mb-3 mt-10 text-center text-[13px] text-muted">One path in.</p>
          <motion.div
            style={reduceMotion ? undefined : { opacity: cardOpacity, y: cardY, scale: cardScale }}
            className="mx-auto max-w-[420px] rounded-[3px] border border-edge border-l-2 border-l-signal bg-surface px-[15px] py-[11px]"
          >
            <p className="mb-px text-sm font-semibold">
              {exampleConnection.firstName} {exampleConnection.lastName}
            </p>
            <p className="text-[12.5px] text-muted">
              {exampleConnection.position} at {exampleJob.company}
            </p>
            {formatSince(exampleConnection.connectedAt) && (
              <p className="mt-1.5 font-mono text-[10.5px] tracking-[0.02em] text-muted">
                SINCE {formatSince(exampleConnection.connectedAt)}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
