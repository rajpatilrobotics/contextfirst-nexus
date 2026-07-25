import { BrowserCasePurposeWorkspace } from "../../../../features/purpose";

export default async function BrowserCasePurposePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return <BrowserCasePurposeWorkspace caseId={caseId} />;
}
