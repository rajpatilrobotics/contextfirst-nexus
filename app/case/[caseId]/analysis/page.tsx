import { BrowserCaseStructuredAnalysisWorkspace } from "../../../../features/analysis/structured";

export default async function BrowserCaseAnalysisPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return <BrowserCaseStructuredAnalysisWorkspace caseId={caseId} />;
}
