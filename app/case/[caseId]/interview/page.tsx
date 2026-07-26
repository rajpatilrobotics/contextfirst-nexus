import { BrowserCaseCurrentAnalysisWorkspace } from "../../../../features/analysis/browser-case-current-analysis-workspace";

export default async function BrowserCaseInterviewPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return (
    <BrowserCaseCurrentAnalysisWorkspace
      activeDestination="interview"
      caseId={caseId}
    />
  );
}
