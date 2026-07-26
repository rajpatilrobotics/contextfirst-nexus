import { BrowserCaseCurrentAnalysisWorkspace } from "../../../../features/analysis/browser-case-current-analysis-workspace";

export default async function BrowserCaseTasksPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <BrowserCaseCurrentAnalysisWorkspace
      activeDestination="tasks"
      caseId={caseId}
    />
  );
}
