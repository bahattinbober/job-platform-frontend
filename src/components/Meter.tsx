"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  animate,
  type MotionValue,
} from "motion/react";

const SEGMENTS = 10;
const FILL_DURATION = 0.25;

function Segment({ index, filled }: { index: number; filled: MotionValue<number> }) {
  const backgroundColor = useTransform(filled, (value) =>
    index < value ? "var(--ink)" : "var(--edge)"
  );

  return (
    <motion.span
      style={{ backgroundColor }}
      className="block h-[14px] w-[4px] rounded-[0.5px]"
    />
  );
}

/**
 * The score is a measurement, not a percentage, so it reads as a gauge
 * rather than a progress bar. Ten segments, one decimal, tabular figures.
 * On mount the gauge sweeps from zero, like an instrument taking a reading.
 */
export function Meter({ score }: { score: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(reduceMotion ? score : 0);
  const filled = useTransform(progress, (value) => Math.round(value * SEGMENTS));
  const label = useTransform(progress, (value) => value.toFixed(2));

  useEffect(() => {
    if (reduceMotion) {
      progress.set(score);
      return;
    }
    const controls = animate(progress, score, {
      duration: FILL_DURATION,
      ease: "easeOut",
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, reduceMotion]);

  return (
    <div
      className="flex shrink-0 items-center gap-[9px] pt-0.5"
      title={`Similarity between your CV and this posting: ${score.toFixed(2)}`}
    >
      <div className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <Segment key={i} index={i} filled={filled} />
        ))}
      </div>
      <motion.span className="font-mono text-[11.5px] tabular-nums text-muted">
        {label}
      </motion.span>
    </div>
  );
}
