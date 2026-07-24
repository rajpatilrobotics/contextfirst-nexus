import type { Metadata } from "next";
import { MarketingShell } from "../../components/marketing";
import { CaseStateProvider } from "../../components/shell/case-state-context";
import { LovableTrustWorkspace } from "../../features/trust/lovable-trust-workspace";
import { getTrustPageData } from "../../features/trust/trust-data.server";

export const metadata: Metadata = {
  title: "Trust & Safety — ContextFirst Nexus",
  description:
    "System card, synthetic safety lab, evaluation, guidance, audit, and AI boundaries for the ContextFirst Nexus demonstration.",
};

export default function TrustPage() {
  const data = getTrustPageData();

  return (
    <MarketingShell>
      <CaseStateProvider>
        <LovableTrustWorkspace
          deterministicHarnessResults={data.deterministicHarnessResults}
          guidanceCards={data.guidancePack.cards}
          systemCard={data.systemCard}
        />
      </CaseStateProvider>
    </MarketingShell>
  );
}
