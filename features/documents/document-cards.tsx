"use client";

import { useState } from "react";
import {
  Check,
  EyeOff,
  FileText,
  Lock,
  RefreshCw,
  ScanLine,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import {
  DocumentRecordSchema,
  type DocumentRecord,
} from "../../lib/contracts";
import { cfnDemoFixture } from "../../lib/fixtures";
import {
  Chip,
  DemoOnlyNotice,
  LimitationNotice,
  ProcessingStatusBadge,
} from "../../components/lovable/nexus-ui";

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
type DocumentTab = "health" | "view" | "quality" | "masking";

export function DocumentCards({
  documents,
  maskingStatus = "pending",
}: {
  documents: DocumentRecord[];
  maskingStatus?: string;
}) {
  const [selectedDocumentId, setSelectedDocumentId] = useState(
    documents[0]?.id ?? "",
  );
  const [tab, setTab] = useState<DocumentTab>("health");

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
  const ocrPageCount = selectedDocument.pages.filter((page) =>
    ["image_only", "unreadable"].includes(page.availability),
  ).length;
  const failedPageCount = selectedDocument.pages.filter(
    (page) =>
      page.extractionStatus === "failed" ||
      page.availability === "extraction_failed",
  ).length;
  const limitationPageCount = selectedDocument.pages.filter(pageIsLimitation).length;
  const attentionPageCount = selectedDocument.pages.filter(pageNeedsAttention).length;
  const limitationItems = selectedDocument.pages
    .filter((page) => page.availability !== "available")
    .map(
      (page) =>
        `Page ${page.pageNumber}: ${PAGE_AVAILABILITY_LABELS[page.availability]}`,
    );
  if (
    selectedDocument.processingStatus === "failed" &&
    limitationItems.length === 0
  ) {
    limitationItems.push(
      "Document processing failed before a readable page result was recorded.",
    );
  }

  function moveToControl(targetId: "documents" | "processing") {
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    target?.focus({ preventScroll: true });
  }

  return (
    <section aria-labelledby="document-list-heading" className="grid gap-4">
      <div className="sr-only">
        <div>
          <h3 className="font-serif text-lg leading-tight" id="document-list-heading">
            {heading}
          </h3>
          <p className="text-sm leading-5 text-[var(--color-ink-muted)]">
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

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div
          aria-labelledby="packet-list-heading"
          className="rounded-xl border border-border bg-card"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border p-3">
            <h4 className="font-serif text-base" id="packet-list-heading">
              Packet ({documents.length})
            </h4>
            <button
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
              onClick={() => document.getElementById("documents")?.scrollIntoView({ behavior: "smooth" })}
              type="button"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Open source intake
            </button>
          </div>
          <ul>
            {documents.map((document) => {
              const selected = document.id === selectedDocument.id;
              const issueLabel = documentIssueLabel(document);

              return (
                <li data-document-id={document.id} key={document.id}>
                  <button
                    aria-controls="selected-document-health"
                    aria-pressed={selected}
                    className={`flex w-full min-w-0 items-start gap-3 border-b border-border/60 px-3 py-3 text-left last:border-0 ${
                      selected
                        ? "bg-muted/60"
                        : "hover:bg-muted/30"
                    }`}
                    onClick={() => setSelectedDocumentId(document.id)}
                    type="button"
                  >
                    <FileText
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 text-muted-foreground"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {displayFileName(document.fileName)}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[10px] text-[var(--color-ink-muted)]">
                        {document.id} · {SOURCE_TYPE_LABELS[document.sourceType]} · {document.expectedPageCount} pages
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1">
                        <ProcessingStatusBadge status={document.processingStatus} />
                        <Chip tone="mute">
                          Masking: {maskingStatus.replaceAll("_", " ")}
                        </Chip>
                      </span>
                      {issueLabel ? (
                        <span className="mt-1 block text-xs font-medium text-[color:var(--amber)]">
                          {issueLabel}
                        </span>
                      ) : null}
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
          <div className="border-t border-border p-3">
            <DemoOnlyNotice>
              PDF processing stays in this browser; no source is uploaded or transmitted.
            </DemoOnlyNotice>
          </div>
        </div>

        <div
          aria-labelledby="selected-document-heading"
          className="rounded-xl border border-border bg-card"
          id="selected-document-health"
        >
          <header className="grid items-start gap-3 border-b border-border p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="font-mono text-[11px] text-muted-foreground">
                {selectedDocument.id}
              </p>
              <h4 className="font-serif text-xl" id="selected-document-heading">
                {displayFileName(selectedDocument.fileName)}
              </h4>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <ProcessingStatusBadge status={selectedDocument.processingStatus} />
                <Chip tone="mute">{SOURCE_TYPE_LABELS[selectedDocument.sourceType]}</Chip>
                <Chip tone="mute">{provenanceLabel(selectedDocument)}</Chip>
                <span className="sr-only">{selectedDocument.displayName}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                onClick={() => moveToControl("processing")}
                type="button"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Open processing controls
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                onClick={() => moveToControl("documents")}
                type="button"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Replace via source intake
              </button>
            </div>
          </header>

          <div className="flex gap-1 overflow-x-auto border-b border-border px-4" role="tablist">
            {(["health", "view", "quality", "masking"] as const).map((value) => (
              <button
                aria-controls={`document-${value}-panel`}
                aria-selected={tab === value}
                className={`whitespace-nowrap px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] ${
                  tab === value
                    ? "border-b-2 border-[color:var(--amber)] text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                key={value}
                onClick={() => setTab(value)}
                role="tab"
                type="button"
              >
                {value === "health"
                  ? "Document Health"
                  : value === "view"
                    ? "Document View"
                    : value === "quality"
                      ? "Source Quality"
                      : "Masking Status"}
              </button>
            ))}
          </div>

          <div
            aria-label={`${tab.replaceAll("_", " ")} for ${selectedDocument.id}`}
            className="grid gap-4 p-5"
            id={`document-${tab}-panel`}
            role="tabpanel"
          >
            {tab === "health" ? (
              <div className="grid gap-4 sm:grid-cols-4">
                <DocumentStat label="Pages" value={selectedDocument.expectedPageCount} />
                <DocumentStat label="Readable" value={readablePageCount} />
                <DocumentStat label="OCR" value={ocrPageCount} />
                <DocumentStat label="Failed" value={failedPageCount} />
                <div className="sm:col-span-4">
                  <LimitationNotice
                    items={
                      limitationItems.length
                        ? limitationItems
                        : ["No canonical page limitation is recorded."]
                    }
                  />
                </div>
                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs sm:col-span-4">
                  <span className="font-medium">Extraction method:</span>{" "}
                  {selectedDocument.dataOrigin === "browser_local"
                    ? "Browser-local PDF text extraction"
                    : "Prepared local fixture text extraction"}
                </div>
              </div>
            ) : null}

            {tab === "view" ? (
              <div className="grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
                {attentionPageCount > 0 ? (
                  <Lock className="h-6 w-6 text-[color:var(--rust)]" />
                ) : limitationPageCount > 0 ? (
                  <ScanLine className="h-6 w-6 text-[color:var(--amber)]" />
                ) : (
                  <EyeOff className="h-6 w-6 text-muted-foreground" />
                )}
                <div className="mt-3 font-serif text-lg">
                  Document preview is available through the audited source-review control below
                </div>
                <div className="mt-1 max-w-md text-xs text-muted-foreground">
                  This health panel never renders raw source content. Redacted text is shown first,
                  and original text requires an intentional recorded reveal.
                </div>
              </div>
            ) : null}

            {tab === "quality" ? (
              <div className="space-y-3 text-sm">
                <div className="rounded-md border border-border p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Coverage
                  </div>
                  <div className="mt-1">
                    {readablePageCount} of {selectedDocument.expectedPageCount} expected pages
                    readable; {attentionPageCount} need attention; {limitationPageCount} retained as
                    limitations.
                  </div>
                </div>
                <div className="rounded-md border border-border p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Readable page coverage
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[color:var(--amber)]"
                        style={{
                          width: `${Math.round((readablePageCount / Math.max(1, selectedDocument.expectedPageCount)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs">
                      {Math.round((readablePageCount / Math.max(1, selectedDocument.expectedPageCount)) * 100)}%
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Coverage reports extraction availability only. It is not a confidence score.
                  </p>
                </div>
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
                            <span className="block text-[10px] text-[var(--color-ink-muted)]">
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
            ) : null}

            {tab === "masking" ? (
              <div className="space-y-3 text-sm">
                <div className="rounded-md border border-border p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Masking state
                  </div>
                  <div className="mt-1 capitalize">{maskingStatus.replaceAll("_", " ")}</div>
                </div>
                <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs">
                  Sensitive identifiers remain masked unless an authorized practitioner
                  intentionally reveals source text for a recorded reason.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function DocumentStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-serif text-2xl">{value}</div>
    </div>
  );
}
