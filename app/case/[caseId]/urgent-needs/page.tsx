import { BrowserCaseCurrentAnalysisWorkspace } from "../../../../features/analysis/browser-case-current-analysis-workspace";

export default async function BrowserCaseUrgentNeedsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <BrowserCaseCurrentAnalysisWorkspace
      activeDestination="urgent-needs"
      caseId={caseId}
    />
  );
}
