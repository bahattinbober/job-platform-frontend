"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { generateReferralMessage, type ReferralMessageContext } from "@/lib/referral";

type State = { step: "idle" } | { step: "generating" } | { step: "done"; message: string };

const WORDS_PER_GROUP = 6;

function chunkMessage(message: string): string[] {
  const words = message.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_GROUP) {
    chunks.push(words.slice(i, i + WORDS_PER_GROUP).join(" "));
  }
  return chunks;
}

// Reads as the draft landing on the page rather than snapping into view,
// without the tedium of a per-character typewriter. Tuned to land in
// 400–600ms total for a typical message length.
const messageContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const chunkVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

type ReferralPanelProps = ReferralMessageContext & {
  jobId: string;
  connectionId: string;
};

const buttonClass =
  "cursor-pointer whitespace-nowrap rounded-[2px] border border-signal bg-signal px-[13px] py-[7px] text-[12.5px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function ReferralPanel({ jobId, connectionId, ...context }: ReferralPanelProps) {
  const [state, setState] = useState<State>({ step: "idle" });
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const cancelRef = useRef<(() => void) | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      cancelRef.current?.();
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  const generate = () => {
    setState({ step: "generating" });
    cancelRef.current = generateReferralMessage(jobId, connectionId, context, {
      onComplete: (message) => setState({ step: "done", message }),
      onError: () => setState({ step: "idle" }),
    });
  };

  const copy = () => {
    if (state.step !== "done") return;
    navigator.clipboard.writeText(state.message);
    setCopied(true);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 1600);
  };

  if (state.step === "generating") {
    return (
      <p className="flex items-center gap-2.5 text-sm text-muted">
        <span
          aria-hidden
          className="stage-active-dot h-[9px] w-[9px] shrink-0 rounded-full border border-ink bg-paper"
        />
        Drafting your intro…
      </p>
    );
  }

  if (state.step === "done") {
    const chunks = chunkMessage(state.message);

    return (
      <div className="rounded-[3px] border border-edge bg-surface px-5 py-4">
        <motion.p
          className="whitespace-pre-line text-sm leading-relaxed"
          initial={reduceMotion ? "visible" : "hidden"}
          animate="visible"
          variants={messageContainer}
        >
          {chunks.map((chunk, i) => (
            <motion.span key={i} variants={chunkVariants} className="inline-block">
              {chunk}
              {i < chunks.length - 1 ? " " : ""}
            </motion.span>
          ))}
        </motion.p>
        <button type="button" onClick={copy} className={`mt-4 ${buttonClass}`}>
          {copied ? "Copied" : "Copy message"}
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={generate} className={buttonClass}>
      Draft an intro
    </button>
  );
}
