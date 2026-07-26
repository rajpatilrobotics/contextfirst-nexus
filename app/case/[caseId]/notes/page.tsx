import { BrowserCaseCurrentAnalysisWorkspace } from "../../../../features/analysis/browser-case-current-analysis-workspace";

export default async function BrowserCaseNotesPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <BrowserCaseCurrentAnalysisWorkspace
      activeDestination="notes"
      caseId={caseId}
    />
  );
}
