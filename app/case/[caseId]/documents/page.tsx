import { BrowserCaseDocumentsWorkspace } from "../../../../features/documents";

export default async function BrowserCaseDocumentsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  return <BrowserCaseDocumentsWorkspace caseId={caseId} />;
}
