"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import type { Connection } from "@/lib/types";
import { jobDetails } from "@/lib/mock";

// Same connection as the hero preview and the source-merge section — one
// example, carried through the whole page instead of three invented ones.
const exampleConnection = jobDetails[0].connection as Connection;

// Scroll progress (0–1 across the pinned scene) at which each beat happens.
// Shared between the canvas draw loop and the DOM overlay's motion values
// so the two never drift out of sync.
//
// Four blocks: active (0–0.35), hold (0.35–0.46), groupExit (0.46–0.52),
// and a fourth block that's new — a deliberately empty tail, 0.52–1.00,
// where nothing happens at all. That tail isn't waste: SignatureRail
// pulls itself up into part of it (see -mt-[…] there) to cut the
// post-scene dead scroll, which only works because the tail is long
// enough to absorb the pull-up without SignatureRail's first pixel ever
// appearing before this scene's content has fully finished fading — the
// invariant is M ≤ (1 − exitEnd) × (H − V), spelled out where H (this
// section's height) is set, below. exitEnd moved from 0.58 to 0.52 (and
// hold shortened from 0.35–0.50 to 0.35–0.46 to make room) specifically
// to widen that invariant's margin of safety — see that same comment for
// why the theoretical 50 ≤ 50.4vh headroom from the previous pass wasn't
// enough in a real browser.
//
// Beats 1–4 inside "active" keep their previous relative shape, rescaled
// from the previous 0–0.62 active range down onto 0–0.35 (old × 0.35/0.62)
// — this keeps their absolute vh close to unchanged (see the section
// height comment below) even though the section itself got taller, because
// all of that extra height went to the new empty tail, not to active:
//   1. markerAppear  0.05–0.10  a short signal segment arrives at the top row
//      (captionFade  0.08–0.11  the caption clears, just ahead of the scan —
//                                the queue itself is at full alpha from
//                                progress 0, no fade-in of its own)
//   2. scan          0.10–0.25  the segment steps down row by row, dimming
//                                each row it passes
//   3. collapse      0.25–0.32  remaining text is erased; the segment grows
//                                into one line spanning the old list and
//                                slides toward the rail's resting x
//   4. crossfade     0.29–0.35  the canvas line fades out while the DOM
//                                node, tie, name (0.32–0.35), and subtext
//                                (0.32–0.35) fade in at the exact same
//                                geometry (see railGeometry) — starts
//                                before collapse finishes, so the line is
//                                never left on screen alone
//   5. hold          0.35–0.46  settled final frame, held long enough to
//                                actually read (~13.2vh desktop, ~3.08vh
//                                mobile — see the section height comment
//                                below): node, line, name, subtext all in
//                                place, nothing animates
//   6. groupExit     0.46–0.52  the whole node+tie+name+subtext group
//                                fades out together (see groupExitOpacity)
//                                so it's already gone well before the pin
//                                releases — ordinary scroll-away clipping
//                                never gets a chance to hide the name
//                                while the line (120px taller than the
//                                name it hangs from) is still visible
//   7. (empty tail)  0.52–1.00  nothing animates, nothing is visible —
//                                this is the budget SignatureRail's
//                                negative margin spends; see its own
//                                comment for the exact invariant check
const PHASES = {
  markerAppearStart: 0.05,
  markerAppearEnd: 0.1,
  captionFadeStart: 0.08,
  captionFadeEnd: 0.11,
  scanStart: 0.1,
  scanEnd: 0.25,
  collapseStart: 0.25,
  collapseEnd: 0.32,
  crossfadeStart: 0.29,
  crossfadeEnd: 0.35,
  nodeStart: 0.29,
  nodeEnd: 0.32,
  tieStart: 0.3,
  tieEnd: 0.35,
  identityStart: 0.32,
  identityEnd: 0.35,
  subtextStart: 0.32,
  subtextEnd: 0.35,
  exitStart: 0.46,
  exitEnd: 0.52,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// 0 until edge0, 1 after edge1, smoothed in between — the general-purpose
// fade curve used for every gradual transition in this scene except the
// per-row scan step, which needs a plateau-then-snap shape instead.
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Holds near 0 for the first third of a row-step, snaps through the middle
// third, holds near 1 for the last third — a near-step curve so the marker
// reads as moving row to row with a pause at each one, not gliding.
function stepEase(t: number) {
  return smoothstep(0.35, 0.65, t);
}

function parseHex(hex: string) {
  const clean = hex.trim().replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const value = parseInt(full, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Matches the mx-auto max-w-[760px] px-6 wrapper used across the rest of the
// page, so the resting node lines up with the page's own left text margin —
// and with the rail that starts immediately below in SignatureRail.
function contentLeftInset(width: number) {
  const contentWidth = Math.min(width, 760);
  const sideGutter = Math.max(0, (width - contentWidth) / 2);
  return sideGutter + 24;
}

// The queue's own reading column — centered on the canvas as a whole, not
// on the page's narrower text column. It only converges onto contentLeft
// at the very end, when the scan resolves into the rail.
function blockLeftInset(width: number) {
  const blockWidth = Math.min(480, width - 48);
  return (width - blockWidth) / 2;
}

// Where the canvas collapse line ends and the DOM rail (node, tie, name)
// begins — the one place both sides read this from, so they can never
// drift into two differently-positioned lines during the crossfade. The
// rail is a short accent under the name, not a line down to the viewport
// edge: railBottom sits a fixed RAIL_LENGTH below railTop (== the name's
// own row, top-[40%] — see RAIL_TOP_RATIO). The DOM tie's h-[120px] below
// and its top-[40%] are that same length and ratio written as literals
// (Tailwind classes can't read a JS constant) — keep the DOM's top-[40%]
// classes (tie, node, name, subtext, all below) and buildLines' own block
// centering in sync with RAIL_TOP_RATIO if either changes. The tie's
// left-[13px] falls inside the same mx-auto max-w-[760px] px-6 column
// contentLeftInset replicates here, landing on railX.
const RAIL_LENGTH = 120;

// Above true vertical center, not at it: a name centered at 50% leaves as
// much empty paper above it as the line + subtext need below it, which is
// what made the final frame read as top-heavy-empty. 0.40 moves the name
// toward the upper third while leaving 60% of the height below for the
// 120px line and the subtext under it. buildLines reads this same ratio
// to center the queue block, so the scan's last row (where the marker
// starts its collapse) ends up close to where the name will resolve,
// instead of the marker jumping from mid-screen up to the new railTop.
const RAIL_TOP_RATIO = 0.4;

function railGeometry(width: number, height: number) {
  const railTop = height * RAIL_TOP_RATIO;
  return {
    railX: contentLeftInset(width) + 13,
    railTop,
    railBottom: railTop + RAIL_LENGTH,
  };
}

// Generic role titles only — never invented company names. Uniformity is
// the point: every row reads as "an application," not as a specific,
// fabricated employer that could be mistaken for a real one.
const ROLE_TITLES = [
  "Backend Engineer",
  "Product Designer",
  "Data Analyst",
  "Frontend Engineer",
  "Operations Manager",
  "Marketing Coordinator",
  "Sales Development Rep",
  "Customer Success Manager",
  "QA Engineer",
  "DevOps Engineer",
  "Content Strategist",
  "Finance Analyst",
  "Program Manager",
  "Support Specialist",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function seededFrac(n: number) {
  const seed = Math.sin(n) * 43758.5453;
  return seed - Math.floor(seed);
}

// Row i's date — deterministic regardless of viewport, since it only
// depends on the row index. Row 0 is always "1 Jan" (seededFrac(0) is 0
// for both factors below); the resolve-phase subtext reuses firstRowDate
// rather than repeating that string by hand, so it stays correct if the
// seeding ever changes.
function dateForRow(i: number) {
  const day = 1 + Math.floor(seededFrac(i * 91.345) * 28);
  const month = MONTHS[Math.floor(seededFrac(i * 33.771) * MONTHS.length)];
  return `${day} ${month}`;
}

const firstRowDate = dateForRow(0);

// Fixed 34px row spacing at 18px type, set directly by the readability
// pass rather than derived from viewport height. Row count instead adapts
// to fit a comfortable block, vertically centered on the viewport.
const ROW_SPACING = 34;

type LineDef = { y: number; role: string; date: string };

// Row count is derived from a target block height, not written as a fresh
// literal — that target (390px desktop, 240px mobile) is the same block
// height the previous 30px-spacing/14-9-row block produced, so bumping
// ROW_SPACING alone shrinks the count to fit (≈13 rows desktop, ≈8
// mobile) instead of leaving the block taller than before.
function buildLines(width: number, height: number): LineDef[] {
  const isMobile = width < 640;
  const targetBlockHeight = isMobile ? 240 : 390;
  const count = Math.max(4, Math.round(targetBlockHeight / ROW_SPACING) + 1);
  const blockHeight = (count - 1) * ROW_SPACING;
  const margin = 32;
  // Centered on RAIL_TOP_RATIO, not true mid-height — matches railGeometry
  // so the scan's last row lands close to where the name resolves.
  const top = clamp(
    height * RAIL_TOP_RATIO - blockHeight / 2,
    margin,
    Math.max(margin, height - blockHeight - margin)
  );
  const lines: LineDef[] = [];

  for (let i = 0; i < count; i++) {
    const role = ROLE_TITLES[Math.floor(seededFrac(i * 45.164) * ROLE_TITLES.length)];
    lines.push({ y: top + i * ROW_SPACING, role, date: dateForRow(i) });
  }

  return lines;
}

/**
 * The one sentence the whole page is arguing — a queue, and a referral that
 * skips it — shown instead of said. A short list of identical-looking
 * applications fills the screen; a signal-colored marker scans down through
 * them, and what's left resolves into a name.
 * That name sits exactly where SignatureRail's rail begins next.
 */
function AnimatedQueueScene({ connection }: { connection: Connection }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const linesRef = useRef<LineDef[]>([]);
  const colorsRef = useRef({
    ink: "#17181a",
    muted: "#6e7169",
    signal: "#1f5c4c",
    fontBody: "sans-serif",
    fontMono: "monospace",
  });

  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ["start start", "end end"] });

  // Readable while the queue is intact, gone before the marker starts
  // moving — a plain linear cross-fade in both directions.
  const captionOpacity = useTransform(
    scrollYProgress,
    [0, PHASES.captionFadeStart, PHASES.captionFadeEnd],
    [1, 1, 0]
  );

  // The DOM handoff — node, tie, name, subtext — is staggered across the
  // crossfade window (crossfadeStart..subtextEnd, 0.29–0.35): it starts
  // while the canvas collapse is still finishing, not after, so the rail
  // is never left with nothing on it.
  const nodeOpacity = useTransform(scrollYProgress, [PHASES.nodeStart, PHASES.nodeEnd], [0, 1]);
  const nodeScale = useTransform(scrollYProgress, [PHASES.nodeStart, PHASES.nodeEnd], [0.5, 1]);
  const tieScaleY = useTransform(scrollYProgress, [PHASES.tieStart, PHASES.tieEnd], [0, 1]);
  const identityOpacity = useTransform(
    scrollYProgress,
    [PHASES.identityStart, PHASES.identityEnd],
    [0, 1]
  );
  const identityY = useTransform(scrollYProgress, [PHASES.identityStart, PHASES.identityEnd], [6, 0]);
  const subtextOpacity = useTransform(
    scrollYProgress,
    [PHASES.subtextStart, PHASES.subtextEnd],
    [0, 1]
  );
  const subtextY = useTransform(scrollYProgress, [PHASES.subtextStart, PHASES.subtextEnd], [6, 0]);

  // The resolved group — node, tie, name, subtext — shares this one exit:
  // it fades out as a unit at exitStart..exitEnd (0.46–0.52), well before
  // the pin actually releases at progress 1 — the gap between exitEnd and
  // 1 is deliberate empty budget SignatureRail's negative margin spends
  // (see the section height comment below). Fading out this early, rather
  // than right at release, is also what makes ordinary top-to-bottom
  // scroll-away clipping harmless afterward: there's nothing left in the
  // group for it to split apart (the line hangs 120px below the name, so
  // without this the name would otherwise clear the viewport a full 120px
  // of scroll before the line does).
  const groupExitOpacity = useTransform(scrollYProgress, [PHASES.exitStart, PHASES.exitEnd], [1, 0]);

  useEffect(() => {
    // The section itself is hidden via motion-reduce:hidden — this is a
    // client-only belt-and-suspenders check so a reduced-motion visitor's
    // browser never spends cycles driving an invisible canvas either.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rootStyle = getComputedStyle(document.documentElement);
    colorsRef.current = {
      ink: rootStyle.getPropertyValue("--ink").trim() || colorsRef.current.ink,
      muted: rootStyle.getPropertyValue("--muted").trim() || colorsRef.current.muted,
      signal: rootStyle.getPropertyValue("--signal").trim() || colorsRef.current.signal,
      fontBody: rootStyle.getPropertyValue("--font-body").trim() || colorsRef.current.fontBody,
      fontMono: rootStyle.getPropertyValue("--font-mono").trim() || colorsRef.current.fontMono,
    };

    function draw(progress: number) {
      const { width, height } = sizeRef.current;
      const lines = linesRef.current;
      if (!ctx || lines.length === 0) return;
      const colors = colorsRef.current;

      ctx.clearRect(0, 0, width, height);

      const blockLeft = blockLeftInset(width);
      const { railX, railTop, railBottom } = railGeometry(width, height);

      const rowCount = lines.length;
      const topRowY = lines[0].y;
      const bottomRowY = lines[rowCount - 1].y;

      const markerAppear = smoothstep(PHASES.markerAppearStart, PHASES.markerAppearEnd, progress);
      const scanT = clamp(
        (progress - PHASES.scanStart) / (PHASES.scanEnd - PHASES.scanStart),
        0,
        1
      );
      const collapseT = clamp(
        (progress - PHASES.collapseStart) / (PHASES.collapseEnd - PHASES.collapseStart),
        0,
        1
      );
      // How far into the canvas→DOM handoff we are — the canvas line's own
      // fade-out, mirrored by the DOM node/tie/name fading in over the same
      // window (nodeStart..identityEnd all sit inside crossfadeStart/End).
      const crossfadeT = smoothstep(PHASES.crossfadeStart, PHASES.crossfadeEnd, progress);

      // The marker's fractional row position across the scan phase: a
      // near-step curve per row (stepEase) rather than a continuous glide
      // from scanT directly.
      const totalSteps = Math.max(1, rowCount - 1);
      const scaledStep = scanT * totalSteps;
      const stepIndex = Math.min(totalSteps - 1, Math.floor(scaledStep));
      const stepFrac = scaledStep - stepIndex;
      const markerRowFloat = scanT >= 1 ? totalSteps : stepIndex + stepEase(stepFrac);
      const markerCenterY = topRowY + markerRowFloat * ROW_SPACING;

      // --- Row text: "Role · Applied D Mon", drawn in three fillText
      // calls per row so the date can sit in the mono face while the rest
      // stays in body text, per the design rule that only measurements
      // (dates, counts) get the mono treatment.
      const fontSize = 18;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      for (let i = 0; i < rowCount; i++) {
        const line = lines[i];
        // Fades smoothly as the marker's position crosses this row — not
        // an on/off toggle. "The marker passes and the row dims behind it."
        const passed = scanT > 0 ? smoothstep(i - 0.5, i + 0.5, markerRowFloat) : 0;
        const dimmed = lerp(1, 0.25, passed); // 60%→15%, 45%→~11%: same ratio
        const eraseFade = 1 - collapseT; // the collapse phase wipes what's left
        const visibility = dimmed * eraseFade; // full alpha from progress 0 — no fade-in
        if (visibility <= 0.01) continue;

        ctx.font = `${fontSize}px ${colors.fontBody}`;
        ctx.fillStyle = hexToRgba(colors.ink, 0.6 * visibility);
        ctx.fillText(line.role, blockLeft, line.y);
        const roleWidth = ctx.measureText(line.role).width;

        ctx.fillStyle = hexToRgba(colors.muted, 0.45 * visibility);
        ctx.fillText(" · ", blockLeft + roleWidth, line.y);
        const dotWidth = ctx.measureText(" · ").width;

        ctx.font = `${fontSize}px ${colors.fontMono}`;
        ctx.fillText(line.date, blockLeft + roleWidth + dotWidth, line.y);
      }

      // --- The marker: a short segment at the row it's currently on, in
      // the gutter just left of the text column. Fades out exactly as the
      // collapse phase's growing line fades in — a cross-fade, not a cut.
      const markerSegHalf = (ROW_SPACING - 6) / 2;
      const markerAlpha = markerAppear * (1 - collapseT);
      if (markerAlpha > 0.01) {
        ctx.globalAlpha = markerAlpha;
        ctx.strokeStyle = colors.signal;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(blockLeft - 20, markerCenterY - markerSegHalf);
        ctx.lineTo(blockLeft - 20, markerCenterY + markerSegHalf);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // --- The collapse: the marker grows from that short segment (still
      // anchored where the scan left it, at the bottom row) into one line
      // spanning the whole former list, while sliding from the queue's own
      // centered column toward railX — the rail's resting x, where the DOM
      // tie picks up during the crossfade.
      if (collapseT > 0.001) {
        const eased = easeInOutCubic(collapseT);
        // Grows toward railX/railTop/railBottom — the exact geometry the
        // DOM node, tie, and text resolve to (top-[40%], h-[120px] below,
        // left-[13px]) — so the crossfade below hands off on identical
        // pixels instead of two lines at different positions.
        const lineX = lerp(blockLeft - 20, railX, eased);
        const centerY = lerp(bottomRowY, (railTop + railBottom) / 2, eased);
        const halfSpan = lerp(markerSegHalf, (railBottom - railTop) / 2, eased);
        const top = centerY - halfSpan;
        const bottom = centerY + halfSpan;

        // Fades to transparent over the last 30px instead of stopping on a
        // hard edge — the rail hands off to whatever follows the scene,
        // it doesn't terminate. Same 30/RAIL_LENGTH ratio as the DOM tie's
        // gradient below, so the two read as one continuous fade.
        const fadeLength = 30;
        const fadeStart = clamp(1 - fadeLength / (bottom - top || 1), 0, 1);
        const gradient = ctx.createLinearGradient(lineX, top, lineX, bottom);
        gradient.addColorStop(0, colors.signal);
        gradient.addColorStop(fadeStart, colors.signal);
        gradient.addColorStop(1, hexToRgba(colors.signal, 0));

        ctx.globalAlpha = collapseT * (1 - crossfadeT);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lineX, top);
        ctx.lineTo(lineX, bottom);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    function resize() {
      const rect = viewport!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Backing store is CSS size × dpr, and setTransform scales the
      // context so every draw call after this uses CSS-pixel coordinates —
      // the standard high-dpi canvas pattern, equivalent to ctx.scale(dpr,
      // dpr) on a freshly reset transform. If text still looks soft after
      // the 18px bump, raise the dpr cap (2) below before touching this.
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      canvas!.style.width = `${rect.width}px`;
      canvas!.style.height = `${rect.height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = { width: rect.width, height: rect.height };
      linesRef.current = buildLines(rect.width, rect.height);
      draw(scrollYProgress.get());
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    const unsubscribe = scrollYProgress.on("change", draw);

    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [scrollYProgress]);

  return (
    // H (this section's height) and V (h-screen's 100vh) set the pin
    // duration H−V, which the PHASES fractions above turn into vh. This
    // pass deliberately grows H beyond what the animation itself needs,
    // so that a chunk of the pin (PHASES.exitEnd..1, the "empty tail") is
    // pure scroll budget with nothing on screen — SignatureRail spends
    // that budget via a negative margin instead of it being wasted as
    // dead scroll after the pin releases. The one rule that has to hold,
    // proven in the previous pass and still true here: SignatureRail's
    // negative margin M must satisfy M ≤ (1 − exitEnd) × (H − V), so its
    // first pixel never appears before this section's content (which
    // finishes fading at exitEnd, not at progress 1) is fully gone.
    //
    // Desktop: H = 220vh, V = 100vh, H−V = 120vh.
    //   active    0–0.35        → 0.35 × 120vh = 42vh    (unchanged)
    //   hold      0.35–0.46     → 0.11 × 120vh = 13.2vh  (was 18vh)
    //   groupExit 0.46–0.52     → 0.06 × 120vh = 7.2vh   (was ≈9.6vh)
    //   empty tail 0.52–1.00    → 0.48 × 120vh = 57.6vh  → max M
    //   SignatureRail uses -mt-[30vh]: 30 ≤ 57.6, 27.6vh of slack (was
    //   0.4vh — the previous pass's 50 ≤ 50.4 held in theory but not in a
    //   real browser; see SignatureRail's own comment for why this pass
    //   doesn't trust a slack margin under roughly 45% of the max again)
    //
    // Mobile: H = 128vh, V = 100vh, H−V = 28vh.
    //   active    0–0.35        → 0.35 × 28vh  = 9.8vh   (unchanged)
    //   hold      0.35–0.46     → 0.11 × 28vh  ≈ 3.08vh  (was 4.2vh)
    //   groupExit 0.46–0.52     → 0.06 × 28vh  = 1.68vh  (was ≈2.24vh)
    //   empty tail 0.52–1.00    → 0.48 × 28vh  ≈ 13.44vh → max M
    //   SignatureRail uses -mt-[6vh]: 6 ≤ 13.44, 7.44vh of slack (was
    //   0.76vh) — still proportionally the more cautious of the two
    //   breakpoints (6/13.44 ≈ 45% used vs desktop's 30/57.6 ≈ 52%),
    //   since mobile's dynamic viewport height (address bar show/hide)
    //   makes 100vh itself wobble by a few px on top of whatever margin
    //   this pass is otherwise correcting for.
    //
    // isolate + z-10 give this section (and the sticky div inside it) a
    // guaranteed spot above SignatureRail in paint order — belt-and-
    // suspenders, not load-bearing: the margin values above are chosen so
    // the two sections' boxes never share screen space in the first
    // place, so there's nothing for paint order to actually resolve
    // unless a future change violates the invariant above.
    <section
      ref={sceneRef}
      className="relative isolate z-10 h-[128vh] motion-reduce:hidden sm:h-[220vh]"
    >
      <h2 className="sr-only">A referral separates one application from the queue</h2>
      <div ref={viewportRef} className="sticky top-0 h-screen w-full overflow-hidden bg-paper">
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

        <div className="pointer-events-none relative mx-auto h-full w-full max-w-[760px] px-6">
          {/* Explains the metaphor while the queue is intact, then fades
              before the marker moves — a caption for the scene, not a
              label that outlives its usefulness or contradicts the final,
              single-name frame. */}
          <motion.p
            aria-hidden
            style={{ opacity: captionOpacity }}
            className="absolute left-0 right-6 top-8 text-[13px] text-muted sm:top-10"
          >
            Each line below is an application, and none of them stand out.
          </motion.p>
          {/* Node, tie, name, and subtext share this one wrapper — one
              positioning context, one opacity (groupExitOpacity) — so
              they can only ever appear or disappear together. inset-0
              matches the parent's own box exactly, so children's absolute
              positions render identically to being placed directly on the
              parent. */}
          <motion.div
            aria-hidden
            style={{ opacity: groupExitOpacity }}
            className="pointer-events-none absolute inset-0"
          >
            {/* A short accent under the name, not a line to the viewport
                edge — h-[120px] is RAIL_LENGTH and top-[40%] is
                RAIL_TOP_RATIO, both written as literals (Tailwind can't
                read a JS constant; see railGeometry above — keep these in
                sync with it). Fades out over its last 30px (75% ==
                (120-30)/120) instead of stopping on a hard edge, matching
                the canvas line's gradient during the crossfade. */}
            <motion.span
              style={{ scaleY: tieScaleY }}
              className="absolute left-[13px] top-[40%] h-[120px] w-px origin-top bg-[linear-gradient(to_bottom,var(--signal)_0%,var(--signal)_75%,transparent_100%)]"
            />
            {/* Wrapper handles the static top-[40%] centering (RAIL_TOP_RATIO
                — see railGeometry); Motion owns only opacity/scale on the
                child, so the two transforms never fight over the
                element's single `transform` property. */}
            <div className="absolute left-[9px] top-[40%] -translate-y-1/2">
              <motion.span
                style={{ opacity: nodeOpacity, scale: nodeScale }}
                className="block h-[9px] w-[9px] rounded-full border border-signal bg-signal shadow-[0_0_0_4px_var(--paper),0_0_0_5px_rgb(31_92_76/0.22)]"
              />
            </div>
            <div className="absolute left-8 right-6 top-[40%] -translate-y-1/2">
              <motion.p style={{ opacity: identityOpacity, y: identityY }} className="text-[15px]">
                <span className="font-semibold">
                  {connection.firstName} {connection.lastName}
                </span>
                <span className="text-muted"> · {connection.position}</span>
              </motion.p>
            </div>
            {/* Ties the final frame back to the queue it resolved from —
                one of the rows the scan dimmed and erased is the one this
                name was referred for. Date comes from firstRowDate
                (row 0's date), not typed by hand. */}
            <div className="absolute left-8 right-6 top-[40%] translate-y-[14px]">
              <motion.p
                style={{ opacity: subtextOpacity, y: subtextY }}
                className="text-[18px] text-muted"
              >
                Referred you for the role you applied to on {firstRowDate}.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Reduced motion: no queue, no scroll-jack, just the scene's final frame —
// the resolved line and the name it becomes — in a normal-height block.
function StaticFinalFrame({ connection }: { connection: Connection }) {
  return (
    <section className="hidden border-t border-edge py-20 motion-reduce:block sm:py-28">
      <h2 className="sr-only">A referral separates one application from the queue</h2>
      <div className="relative mx-auto w-full max-w-[760px] px-6">
        <span aria-hidden className="absolute left-[13px] top-0 h-16 w-px bg-signal" />
        <span
          aria-hidden
          className="absolute left-[9px] top-16 h-[9px] w-[9px] rounded-full border border-signal bg-signal shadow-[0_0_0_4px_var(--paper),0_0_0_5px_rgb(31_92_76/0.22)]"
        />
        <p className="pl-8 pt-[68px] text-[15px]">
          <span className="font-semibold">
            {connection.firstName} {connection.lastName}
          </span>
          <span className="text-muted"> · {connection.position}</span>
        </p>
      </div>
    </section>
  );
}

// Both branches render unconditionally — server and client produce the
// identical tree, so there's nothing for hydration to disagree about.
// Which one is visible is decided by @media (prefers-reduced-motion),
// via the motion-reduce:/hidden classes above, not by a JS check: the
// browser resolves that media query before first paint, so there's no
// gap where the wrong version is visible and no async swap that could
// make the section's height jump once React hydrates.
export function QueueScene() {
  return (
    <>
      <AnimatedQueueScene connection={exampleConnection} />
      <StaticFinalFrame connection={exampleConnection} />
    </>
  );
}
