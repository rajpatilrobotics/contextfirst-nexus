import { Check, TriangleAlert } from "lucide-react";
import {
  DocumentRecordSchema,
  type DocumentRecord,
} from "../../lib/contracts";
import { cfnDemoFixture } from "../../lib/fixtures";

const SOURCE_TYPE_LABELS: Record<DocumentRecord["sourceType"], string> = {
  recruitment_record: "Recruitment record",
  communication: "Communication",
  travel_record: "Travel or transport record",
  practitioner_note: "Practitioner note of a reported account",
  operational_financial_record: "Operational or financial record",
  proceeding_record: "Alleged-offence and procedural record",
  support_provider_note: "Support-provider note",
  other: "Uploaded PDF",
};

const PAGE_AVAILABILITY_LABELS: Record<
  DocumentRecord["pages"][number]["availability"],
  string
> = {
  available: "Readable",
  missing: "Expected page unavailable — recorded as a limitation",
  unreadable: "No readable text found",
  image_only: "No readable text found — OCR is unavailable",
  skipped: "Page was skipped",
  manually_excluded: "Page was excluded",
  extraction_failed: "Text extraction failed — try again or replace this PDF",
};

type PageAvailability = DocumentRecord["pages"][number]["availability"];

const PAGE_ISSUE_PRIORITY: PageAvailability[] = [
  "extraction_failed",
  "unreadable",
  "image_only",
  "missing",
  "skipped",
  "manually_excluded",
];

function documentIssueLabel(document: DocumentRecord): string | null {
  const primaryIssue = PAGE_ISSUE_PRIORITY.find((availability) =>
    document.pages.some((page) => page.availability === availability),
  );

  if (primaryIssue === "extraction_failed") return "Text extraction failed";
  if (primaryIssue === "unreadable" || primaryIssue === "image_only") {
    return "No readable text";
  }
  if (primaryIssue === "missing") return "Expected page unavailable";
  if (primaryIssue === "skipped") return "Page skipped";
  if (primaryIssue === "manually_excluded") return "Page excluded";
  if (document.processingStatus === "failed") return "Processing failed";
  if (document.processingStatus === "warning") return "Processing warning";
  if (document.processingStatus === "active") return "Processing";
  if (document.processingStatus === "pending") return "Waiting to process";
  return null;
}

function documentNeedsAttention(document: DocumentRecord): boolean {
  return (
    document.processingStatus === "failed" ||
    document.pages.some((page) =>
      ["extraction_failed", "unreadable", "image_only"].includes(
        page.availability,
      ),
    )
  );
}

function documentHasLimitation(document: DocumentRecord): boolean {
  return document.pages.some((page) =>
    ["missing", "skipped", "manually_excluded"].includes(page.availability),
  );
}

export function initialSyntheticDocuments(): DocumentRecord[] {
  return cfnDemoFixture.documents.map((document) =>
    DocumentRecordSchema.parse({
      ...document,
      processingStatus: "pending",
      pages: document.pages.map((page) => ({
        ...page,
        extractionStatus: page.availability === "missing" ? "warning" : "pending",
      })),
    }),
  );
}
export function DocumentCards({ documents }: { documents: DocumentRecord[] }) {
  if (documents.length === 0) {
    return null;
  }

  const attentionDocumentCount = documents.filter(documentNeedsAttention).length;
  const limitationDocumentCount = documents.filter(documentHasLimitation).length;
  const readyDocumentCount = documents.length - attentionDocumentCount;
  const allDocumentsReady =
    attentionDocumentCount === 0 && limitationDocumentCount === 0;
  const heading = attentionDocumentCount
    ? "Documents need attention"
    : limitationDocumentCount
      ? "Documents processed with limitations"
      : "Documents ready";

  return (
    <section aria-labelledby="document-list-heading" className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="cfn-type-heading-3" id="document-list-heading">
            {heading}
          </h3>
          <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
            {attentionDocumentCount > 0
              ? `${readyDocumentCount} of ${documents.length} PDFs opened successfully. ${attentionDocumentCount} ${attentionDocumentCount === 1 ? "needs" : "need"} attention.`
              : limitationDocumentCount > 0
                ? `${documents.length} PDFs opened successfully. ${limitationDocumentCount} expected ${limitationDocumentCount === 1 ? "limitation is" : "limitations are"} preserved below.`
                : `${documents.length} PDFs processed in this browser.`}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
            attentionDocumentCount === 0
              ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
              : "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
          }`}
        >
          {allDocumentsReady ? (
            <>
              <Check aria-hidden="true" size={15} /> {documents.length} ready
            </>
          ) : attentionDocumentCount === 0 ? (
            <>
              <TriangleAlert aria-hidden="true" size={15} /> {limitationDocumentCount}{" "}
              {limitationDocumentCount === 1 ? "limitation" : "limitations"}
            </>
          ) : (
            <>
              <TriangleAlert aria-hidden="true" size={15} /> {attentionDocumentCount}{" "}
              {attentionDocumentCount === 1 ? "document needs" : "documents need"} attention
            </>
          )}
        </span>
      </div>
      <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {documents.map((document) => {
          const issueLabel = documentIssueLabel(document);
          const hasPageIssue = document.pages.some(
            (page) => page.availability !== "available",
          );

          return (
            <li
              className="relative grid min-w-0 gap-2 px-3 py-2.5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"
              data-document-id={document.id}
              key={document.id}
            >
              <span className="cfn-type-code font-semibold text-[var(--color-brand)]">
                {document.id}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{document.displayName}</p>
                <p className="truncate text-xs text-[var(--color-ink-muted)]">
                  {SOURCE_TYPE_LABELS[document.sourceType]} · {document.expectedPageCount} pages
                </p>
              </div>
              {hasPageIssue && issueLabel ? (
                <details className="sm:text-right">
                  <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-[var(--color-warning)]">
                    <TriangleAlert aria-hidden="true" size={15} /> {issueLabel}
                  </summary>
                  <ul
                    aria-label={`${document.id} page availability`}
                    className="mt-2 grid gap-1 text-left text-sm sm:absolute sm:right-8 sm:z-10 sm:w-72 sm:rounded-[var(--radius-control)] sm:border sm:border-[var(--color-border)] sm:bg-[var(--color-surface)] sm:p-3 sm:shadow-[var(--shadow-elevated)]"
                  >
                    {document.pages.map((page) => (
                      <li className="flex justify-between gap-3" key={page.id}>
                        <span>Page {page.pageNumber}</span>
                        <span
                          className={
                            page.availability === "available"
                              ? ""
                              : "font-semibold text-[var(--color-warning)]"
                          }
                        >
                          {PAGE_AVAILABILITY_LABELS[page.availability]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : issueLabel ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-warning)]">
                  <TriangleAlert aria-hidden="true" size={15} /> {issueLabel}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand)]">
                  <Check aria-hidden="true" size={15} /> Ready
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
