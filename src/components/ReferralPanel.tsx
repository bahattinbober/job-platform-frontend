"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { generateReferralMessage, type ReferralMessageContext } from "@/lib/referral";

type State = { step: "idle" } | { step: "generating" } | { step: "done"; message: string };

function splitWords(message: string): string[] {
  return message.split(/\s+/);
}

// Reads as the draft landing on the page rather than snapping into view,
// without the tedium of a per-character typewriter. Tuned to land in
// 900ms–1.1s total for a typical message length. Staggering per word (rather
// than in multi-word groups) matters beyond timing: a group wrapped in its
// own inline-block is an atomic box the browser won't split across lines,
// so it jumps to the next line as a unit even with room left on the current
// one — reading as short, ragged lines that stop well short of the edge.
// Single words are already the smallest unit text wraps on, so this can't
// happen at the word level.
const messageContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.012 } },
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

type ReferralPanelProps = ReferralMessageContext & {
  jobId: string;
  connectionId: string;
  /** Starts drafting as soon as the panel scrolls into view, instead of
   * waiting for the "Draft an intro" button — for the landing page, where
   * the copy around it already promises the draft is there. */
  autoGenerate?: boolean;
};

const buttonClass =
  "cursor-pointer whitespace-nowrap rounded-[2px] border border-signal bg-signal px-[13px] py-[7px] text-[12.5px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function ReferralPanel({
  jobId,
  connectionId,
  autoGenerate = false,
  ...context
}: ReferralPanelProps) {
  const [state, setState] = useState<State>({ step: "idle" });
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const cancelRef = useRef<(() => void) | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const generateRef = useRef(generate);
  useEffect(() => {
    generateRef.current = generate;
  });

  useEffect(() => {
    if (!autoGenerate) return;
    const el = containerRef.current;
    if (!el) return;
    let triggered = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered) {
          triggered = true;
          generateRef.current();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoGenerate]);

  const copy = () => {
    if (state.step !== "done") return;
    navigator.clipboard.writeText(state.message);
    setCopied(true);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div ref={containerRef}>
      {state.step === "generating" && (
        <p className="flex items-center gap-2.5 text-sm text-muted">
          <span
            aria-hidden
            className="stage-active-dot h-[9px] w-[9px] shrink-0 rounded-full border border-ink bg-paper"
          />
          Drafting your intro…
        </p>
      )}

      {state.step === "done" &&
        (() => {
          const words = splitWords(state.message);
          return (
            <div className="rounded-[3px] border border-edge bg-surface px-5 py-4">
              <motion.p
                className="whitespace-pre-line text-sm leading-relaxed"
                initial={reduceMotion ? "visible" : "hidden"}
                animate="visible"
                variants={messageContainer}
              >
                {words.map((word, i) => (
                  <Fragment key={i}>
                    <motion.span variants={wordVariants} className="inline-block">
                      {word}
                    </motion.span>
                    {/* A trailing space inside the inline-block above gets
                        trimmed at the box edge by the browser and silently
                        disappears — keeping it as its own text node between
                        the spans is what actually renders a visible space. */}
                    {i < words.length - 1 ? " " : ""}
                  </Fragment>
                ))}
              </motion.p>
              <button type="button" onClick={copy} className={`mt-4 ${buttonClass}`}>
                {copied ? "Copied" : "Copy message"}
              </button>
            </div>
          );
        })()}

      {state.step === "idle" && (
        <button type="button" onClick={generate} className={buttonClass}>
          Draft an intro
        </button>
      )}
    </div>
  );
}
