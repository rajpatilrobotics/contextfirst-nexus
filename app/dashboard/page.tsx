import type { Metadata } from "next";
import { MarketingShell } from "../../components/marketing";
import { CaseDashboard } from "../../features/dashboard/case-dashboard";

export const metadata: Metadata = {
  title: "Case Dashboard — ContextFirst Nexus",
  description:
    "Open the complete fictional M. Chen judge workflow or review clearly labelled read-only case summaries.",
};

export default function DashboardPage() {
  return (
    <MarketingShell>
      <CaseDashboard />
    </MarketingShell>
  );
}
