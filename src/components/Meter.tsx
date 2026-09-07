import type { ReactElement } from "react";

const SEGMENTS = 10;

/**
 * The score is a measurement, not a percentage, so it reads as a gauge
 * rather than a progress bar. Ten segments, one decimal, tabular figures.
 */
export function Meter({ score }: { score: number }): ReactElement {
  const filled = Math.round(score * SEGMENTS);

  return (
    <div
      className="flex shrink-0 items-center gap-[9px] pt-0.5"
      title={`Similarity between your CV and this posting: ${score.toFixed(2)}`}
    >
      <div className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={`block h-[14px] w-[4px] rounded-[0.5px] ${
              i < filled ? "bg-ink" : "bg-edge"
            }`}
          />
        ))}
      </div>
      <span className="font-mono text-[11.5px] tabular-nums text-muted">
        {score.toFixed(2)}
      </span>
    </div>
  );
}