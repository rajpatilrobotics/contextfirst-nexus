"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  FileText,
  TriangleAlert,
} from "lucide-react";
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

function displayFileName(name: string): string {
  return name
    .replace(/synthetic[_-]?/gi, "")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

function pageNeedsAttention(
  page: DocumentRecord["pages"][number],
): boolean {
  return (
    page.extractionStatus === "failed" ||
    ["extraction_failed", "unreadable", "image_only"].includes(
      page.availability,
    )
  );
}

function pageIsLimitation(
  page: DocumentRecord["pages"][number],
): boolean {
  return ["missing", "skipped", "manually_excluded"].includes(
    page.availability,
  );
}

function provenanceLabel(document: DocumentRecord): string {
  if (document.dataOrigin === "browser_local") return "Browser-local source";
  if (document.provenanceStatus === "fixture_verified") {
    return "Verified demo source";
  }
  if (document.provenanceStatus === "unverified") return "Unverified source";
  return "Source provenance unknown";
}

function processingLabel(document: DocumentRecord): string {
  const issue = documentIssueLabel(document);
  if (issue) return issue;
  return document.processingStatus === "completed"
    ? "Ready"
    : document.processingStatus.replaceAll("_", " ");
}

function healthTone(document: DocumentRecord): "supported" | "warning" | "danger" {
  if (documentNeedsAttention(document)) return "danger";
  if (
    documentHasLimitation(document) ||
    document.processingStatus === "warning" ||
    document.processingStatus === "active" ||
    document.processingStatus === "pending"
  ) {
    return "warning";
  }
  return "supported";
}

function HealthStatus({ document }: { document: DocumentRecord }) {
  const tone = healthTone(document);
  return (
    <span className="cfn-status-token capitalize" data-tone={tone}>
      {tone === "supported" ? (
        <Check aria-hidden="true" size={13} />
      ) : tone === "danger" ? (
        <AlertCircle aria-hidden="true" size={13} />
      ) : (
        <TriangleAlert aria-hidden="true" size={13} />
      )}
      {processingLabel(document)}
    </span>
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
  const [selectedDocumentId, setSelectedDocumentId] = useState(
    documents[0]?.id ?? "",
  );

  if (documents.length === 0) {
    return null;
  }

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ??
    documents[0];
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
  const readablePageCount = selectedDocument.pages.filter(
    (page) => page.availability === "available",
  ).length;
  const limitationPageCount = selectedDocument.pages.filter(pageIsLimitation).length;
  const attentionPageCount = selectedDocument.pages.filter(pageNeedsAttention).length;

  return (
    <section aria-labelledby="document-list-heading" className="grid gap-4">
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

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1.35fr)]">
        <section
          aria-labelledby="packet-list-heading"
          className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-3">
            <h4 className="font-serif text-base" id="packet-list-heading">
              Packet ({documents.length})
            </h4>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
              Select a source
            </span>
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {documents.map((document) => {
              const selected = document.id === selectedDocument.id;
              const issueLabel = documentIssueLabel(document);

              return (
                <li data-document-id={document.id} key={document.id}>
                  <button
                    aria-controls="selected-document-health"
                    aria-pressed={selected}
                    className={`cfn-control-target grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-none px-3 py-3 text-left transition-colors ${
                      selected
                        ? "bg-[color-mix(in_oklab,var(--amber)_12%,transparent)]"
                        : "hover:bg-[var(--color-surface-subtle)]"
                    }`}
                    onClick={() => setSelectedDocumentId(document.id)}
                    type="button"
                  >
                    <FileText
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[var(--color-ink-muted)]"
                      size={16}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {displayFileName(document.fileName)}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] text-[var(--color-ink-muted)]">
                        {document.id} · {document.expectedPageCount} pages
                      </span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        <HealthStatus document={document} />
                        {documentHasLimitation(document) &&
                        !documentNeedsAttention(document) ? (
                          <span
                            className="cfn-status-token"
                            data-tone="neutral"
                          >
                            Limitation retained
                          </span>
                        ) : null}
                      </span>
                      {issueLabel ? (
                        <span className="sr-only">
                          {document.pages
                            .filter((page) => page.availability !== "available")
                            .map((page) => (
                              <span key={page.id}>
                                {PAGE_AVAILABILITY_LABELS[page.availability]}
                              </span>
                            ))}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <article
          aria-labelledby="selected-document-heading"
          className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          id="selected-document-health"
        >
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] p-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
                {selectedDocument.id} · Source health
              </p>
              <h4
                className="mt-1 font-serif text-xl"
                id="selected-document-heading"
              >
                {selectedDocument.displayName}
              </h4>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                {SOURCE_TYPE_LABELS[selectedDocument.sourceType]} ·{" "}
                {provenanceLabel(selectedDocument)}
              </p>
            </div>
            <HealthStatus document={selectedDocument} />
          </header>

          <div className="grid gap-4 p-4">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Expected", selectedDocument.expectedPageCount],
                ["Readable", readablePageCount],
                ["Limitations", limitationPageCount],
                ["Needs attention", attentionPageCount],
              ].map(([label, value]) => (
                <div
                  className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] p-3"
                  key={label}
                >
                  <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">
                    {label}
                  </dt>
                  <dd className="mt-1 font-serif text-2xl">{value}</dd>
                </div>
              ))}
            </dl>

            {limitationPageCount > 0 || attentionPageCount > 0 ? (
              <section
                aria-labelledby="selected-document-limitations-heading"
                className={`rounded-[var(--radius-control)] border p-3 ${
                  attentionPageCount > 0
                    ? "border-[var(--color-danger)] bg-[var(--color-danger-subtle)]"
                    : "border-[var(--color-warning)] bg-[var(--color-warning-subtle)]"
                }`}
              >
                <h5
                  className="text-sm font-semibold"
                  id="selected-document-limitations-heading"
                >
                  {attentionPageCount > 0
                    ? "Source needs attention"
                    : "Recorded source limitation"}
                </h5>
                <p className="mt-1 text-xs leading-5">
                  {attentionPageCount > 0
                    ? "At least one page could not be prepared as readable source text. The exact page state remains visible below."
                    : "The expected gap is retained as a limitation and is not silently treated as processed source text."}
                </p>
              </section>
            ) : (
              <section
                aria-label="Source pages ready"
                className="rounded-[var(--radius-control)] border border-[var(--color-supported)] bg-[var(--color-supported-subtle)] p-3"
              >
                <p className="text-sm font-semibold">
                  Every expected page is represented as readable source text.
                </p>
              </section>
            )}

            <section aria-labelledby="selected-document-pages-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h5
                  className="font-serif text-base"
                  id="selected-document-pages-heading"
                >
                  Page health
                </h5>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Reported from canonical processing state
                </p>
              </div>
              <ul
                aria-label={`${selectedDocument.id} page availability`}
                className="mt-2 divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-border)]"
              >
                {selectedDocument.pages.map((page) => (
                  <li
                    className="grid gap-1 bg-[var(--color-canvas)] px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    key={page.id}
                  >
                    <span>
                      <span className="font-semibold">Page {page.pageNumber}</span>
                      <span className="ml-2 font-mono text-[10px] text-[var(--color-ink-muted)]">
                        {page.id}
                      </span>
                      {page.failureCode ? (
                        <span className="mt-0.5 block text-xs text-[var(--color-danger)]">
                          Safe code: {page.failureCode}
                        </span>
                      ) : null}
                    </span>
                    <span className="sm:text-right">
                      <span
                        className={
                          page.availability === "available"
                            ? "font-medium text-[var(--color-supported)]"
                            : pageNeedsAttention(page)
                              ? "font-semibold text-[var(--color-danger)]"
                              : "font-semibold text-[var(--color-warning)]"
                        }
                      >
                        {PAGE_AVAILABILITY_LABELS[page.availability]}
                      </span>
                      {page.availability === "available" ? (
                        <span
                          className="block text-[10px] text-[var(--color-ink-muted)]"
                        >
                          {page.extractedCharacterCount.toLocaleString()} extracted
                          characters
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <p className="border-t border-[var(--color-border)] pt-3 text-xs leading-5 text-[var(--color-ink-muted)]">
              Source health reports extraction facts and limitations. It is not a
              completeness, confidence, credibility, or case-strength score.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
