"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const RAIL_DURATION = 0.9;

const listVariants: Variants = {
  hidden: {},
  visible: (stagger: number) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.05 },
  }),
};

/**
 * The rail is the argument: the network reaches these rows and not others.
 * Drawing it top to bottom, in step with the rows landing, is what makes
 * that argument instead of just decorating a list.
 */
export function RoleRail({ children, rowCount }: { children: ReactNode; rowCount: number }) {
  const reduceMotion = useReducedMotion();
  const stagger = rowCount > 1 ? (RAIL_DURATION * 0.75) / rowCount : 0;

  return (
    <motion.div
      className="relative pl-[42px]"
      initial={reduceMotion ? "visible" : "hidden"}
      animate="visible"
      variants={listVariants}
      custom={stagger}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-3.5 left-[13px] top-3.5 w-px origin-top bg-edge"
        initial={reduceMotion ? { scaleY: 1 } : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={
          reduceMotion ? { duration: 0 } : { duration: RAIL_DURATION, ease: "easeInOut" }
        }
      />
      {children}
    </motion.div>
  );
}
