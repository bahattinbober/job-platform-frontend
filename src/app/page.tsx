import { Hero } from "@/components/landing/Hero";
import { QueueScene } from "@/components/landing/QueueScene";
import { SignatureRail } from "@/components/landing/SignatureRail";
import { SourceMerge } from "@/components/landing/SourceMerge";
import { BuiltWith } from "@/components/landing/BuiltWith";
import { ClosingCta } from "@/components/landing/ClosingCta";

export default function LandingPage() {
  return (
    <>
      <header className="border-b border-edge">
        <div className="mx-auto w-full max-w-[760px] px-6 py-7">
          <p className="font-display text-[17px] font-bold tracking-[-0.02em] [font-variation-settings:'wdth'_88]">
            Inroads
          </p>
        </div>
      </header>

      <main>
        <div className="mx-auto w-full max-w-[760px] px-6">
          <Hero />
        </div>
        <QueueScene />
        <SignatureRail />
        <SourceMerge />
        <BuiltWith />
        <ClosingCta />
      </main>
    </>
  );
}
