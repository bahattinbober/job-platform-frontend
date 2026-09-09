import Link from "next/link";

export function ClosingCta() {
  return (
    <section className="border-t border-edge py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[760px] px-6 text-center">
        <h2 className="mb-3 font-display text-[clamp(26px,5vw,38px)] font-semibold tracking-[-0.028em] [font-variation-settings:'wdth'_84,'opsz'_44]">
          See your matches.
        </h2>
        <p className="mx-auto mb-8 max-w-[42ch] text-muted">
          Every role is ranked by fit. The filled ones are where you already
          know someone.
        </p>
        <Link
          href="/matches"
          className="inline-block rounded-[2px] border border-signal bg-signal px-5 py-2.5 text-[13px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          See your matches
        </Link>
      </div>
    </section>
  );
}
