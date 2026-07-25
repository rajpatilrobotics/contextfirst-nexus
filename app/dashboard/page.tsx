import type { Metadata } from "next";
import { MarketingShell } from "../../components/marketing";
import { CaseDashboard } from "../../features/dashboard/case-dashboard";

export const metadata: Metadata = {
  title: "Case Dashboard — ContextFirst Nexus",
  description:
    "Create and reopen independent fictional browser-local case workspaces.",
};

export default function DashboardPage() {
  return (
    <MarketingShell>
      <CaseDashboard />
    </MarketingShell>
  );
}
