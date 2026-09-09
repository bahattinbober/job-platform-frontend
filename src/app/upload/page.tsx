import Link from "next/link";
import { UploadPanel } from "@/components/UploadPanel";

export default function UploadPage() {
  return (
    <main className="mx-auto w-full max-w-[760px] px-6 pb-24">
      <header className="flex items-baseline justify-between gap-4 border-b border-edge py-7">
        <Link
          href="/"
          className="font-display text-[17px] font-bold tracking-[-0.02em] [font-variation-settings:'wdth'_88]"
        >
          NOD
        </Link>
        <Link
          href="/matches"
          className="text-[12.5px] text-muted transition-colors hover:text-ink"
        >
          Back to matches
        </Link>
      </header>

      <section className="pt-12">
        <UploadPanel />
      </section>
    </main>
  );
}
