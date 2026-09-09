import { SiteNav } from "@/components/nod/SiteNav";
import { NetworkStage } from "@/components/nod/NetworkStage";
import { ReferralMoment } from "@/components/nod/sections/ReferralMoment";
import { BridgeStatement } from "@/components/nod/sections/BridgeStatement";
import { UploadMoment } from "@/components/nod/sections/UploadMoment";
import { MatchesMoment } from "@/components/nod/sections/MatchesMoment";
import { OverlapMoment } from "@/components/nod/sections/OverlapMoment";
import { PeopleMoment } from "@/components/nod/sections/PeopleMoment";
import { ClosingSection } from "@/components/nod/sections/ClosingSection";

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <main>
        <NetworkStage />
        <ReferralMoment />
        <BridgeStatement />
        <UploadMoment />
        <MatchesMoment />
        <OverlapMoment />
        <PeopleMoment />
        <ClosingSection />
      </main>
    </>
  );
}
