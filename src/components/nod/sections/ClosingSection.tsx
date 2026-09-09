import Link from "next/link";
import { Reveal } from "@/components/nod/Reveal";

export function ClosingSection() {
  return (
    <section className="relative overflow-hidden bg-[#0a0b0c] px-5 py-28 text-center sm:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(47,174,143,0.12),transparent_55%)]"
      />
      <Reveal className="relative">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
          Start with your CV
        </p>
        <h2 className="mx-auto max-w-[18ch] font-display text-[clamp(30px,6vw,58px)] font-semibold leading-[1.04] tracking-[-0.025em] text-white [font-variation-settings:'wdth'_82,'opsz'_60]">
          Find who already got you in.
        </h2>
        <Link
          href="/upload"
          className="mt-9 inline-block rounded-full border border-signal bg-signal px-8 py-3.5 text-[14.5px] font-semibold text-surface transition-colors hover:bg-transparent hover:text-white"
        >
          Upload your CV
        </Link>
      </Reveal>

      <footer className="relative mx-auto mt-28 flex max-w-[1180px] flex-col items-center gap-6 border-t border-white/10 pt-8 text-[13px] text-white/40 sm:flex-row sm:justify-between">
        <p className="font-display text-[15px] font-bold tracking-[-0.01em] text-white/80 [font-variation-settings:'wdth'_90]">
          NOD
        </p>
        <nav className="flex gap-6">
          <Link href="/upload" className="transition-colors hover:text-white">
            Upload
          </Link>
          <Link href="/matches" className="transition-colors hover:text-white">
            Matches
          </Link>
          <a href="#moments" className="transition-colors hover:text-white">
            How it works
          </a>
        </nav>
        <p>© {new Date().getFullYear()} NOD</p>
      </footer>
    </section>
  );
}
