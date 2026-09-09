import { UploadPanel } from "@/components/UploadPanel";
import { Reveal } from "@/components/nod/Reveal";

export function UploadMoment() {
  return (
    <section id="moments" className="mx-auto w-full max-w-[1180px] px-5 pt-28 pb-20 sm:px-8 sm:pt-40">
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <Reveal>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            01 — 02 · Upload &amp; parse
          </p>
          <h2 className="max-w-[16ch] font-display text-[clamp(30px,5vw,48px)] font-semibold leading-[1.04] tracking-[-0.025em] [font-variation-settings:'wdth'_84,'opsz'_54]">
            Drop in a CV. NOD reads it in seconds.
          </h2>
          <p className="mt-5 max-w-[42ch] text-[15.5px] leading-relaxed text-muted">
            Text comes out of the PDF, skills come out of the text, and the
            whole thing gets organized into categories you can actually scan —
            languages, backend, frontend, whatever the CV is made of. This is
            the same panel that runs on the real upload page.
          </p>
        </Reveal>
        <Reveal delay={0.08} className="lg:pt-2">
          <UploadPanel />
        </Reveal>
      </div>
    </section>
  );
}
