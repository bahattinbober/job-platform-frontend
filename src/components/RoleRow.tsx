"use client";

import type { ReactElement } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import type { RoleMatch } from "@/lib/types";
import { formatSince } from "@/lib/format";
import { Meter } from "./Meter";

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// A connection is a small event — it gets a quick overshoot so the node
// reads as "this one lit up," not just "this one faded in."
const nodeVariantsConnected: Variants = {
  hidden: { opacity: 0, scale: 0.4 },
  visible: {
    opacity: 1,
    scale: [0.4, 1.35, 1],
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const nodeVariantsPlain: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

export function RoleRow({ role }: { role: RoleMatch }): ReactElement {
  const path = role.connection;
  const meta = [role.company, role.location, role.remoteType].filter(Boolean);

  return (
    <motion.article
      variants={rowVariants}
      className="relative border-b border-edge py-[18px] last:border-b-0"
    >
      {/* Node on the rail. Filled means there is a way in. */}
      <motion.span
        aria-hidden
        variants={path ? nodeVariantsConnected : nodeVariantsPlain}
        className={`absolute left-[-33px] top-[25px] h-[9px] w-[9px] rounded-full border ${
          path
            ? "border-signal bg-signal shadow-[0_0_0_4px_var(--paper),0_0_0_5px_rgb(31_92_76/0.22)]"
            : "border-edge bg-paper"
        }`}
      />

      {/* Ties the node to the row so the rail reads as a graph, not a margin rule. */}
      <span
        aria-hidden
        className={`absolute left-[-24px] top-[29px] h-px w-[18px] ${
          path ? "bg-signal/40" : "bg-edge"
        }`}
      />

      <div className="flex items-baseline justify-between gap-5 max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-2.5">
        <div>
          <h2 className="mb-[3px] font-display text-[19px] font-semibold tracking-[-0.018em] [font-variation-settings:'wdth'_90]">
            <Link
              href={`/roles/${role.id}`}
              className="before:absolute before:inset-0 before:content-[''] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <ViewTransition name={`role-title-${role.id}`}>{role.title}</ViewTransition>
            </Link>
          </h2>
          <p className="text-[13.5px] text-muted">
            {meta.map((part, i) => (
              <span key={part}>
                {i > 0 && <span className="px-0.5 text-edge">·</span>}
                {part}
              </span>
            ))}
          </p>
        </div>
        <Meter score={role.score} />
      </div>

      {path ? (
        <div className="mt-3 flex items-center gap-3.5 rounded-[3px] border border-edge border-l-2 border-l-signal bg-surface px-[15px] py-[11px]">
          <div className="min-w-0 flex-1">
            <p className="mb-px text-sm font-semibold">
              {path.firstName} {path.lastName}
            </p>
            <p className="truncate text-[12.5px] text-muted">{path.position}</p>
          </div>
          {formatSince(path.connectedAt) && (
            <span className="whitespace-nowrap font-mono text-[10.5px] tracking-[0.02em] text-muted">
              SINCE {formatSince(path.connectedAt)}
            </span>
          )}
        </div>
      ) : (
        <p className="mt-2.5 text-[13px] text-muted">
          No one from your network works here.
        </p>
      )}
    </motion.article>
  );
}
