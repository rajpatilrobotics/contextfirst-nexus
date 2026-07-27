"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist/types/src/display/api";
import {
  ChevronDown,
  Check,
  EyeOff,
  FileText,
  Lock,
  RefreshCw,
  ScanLine,
  Trash2,
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
import type {
  BrowserOcrProgress,
  PdfRuntimeMetadata,
  VerifiedOcrPage,
} from "../../lib/documents";
import type { MaskNavigationTarget } from "./packet-mask-review-queue";

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
  image_only: "OCR required — not analyzed",
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
  if (document.dataOrigin === "browser_local") {
    return document.provenanceStatus === "unverified"
      ? "Browser-local source · unverified provenance"
      : "Browser-local source";
  }
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

const DOCUMENT_TABS: DocumentTab[] = [
  "health",
  "view",
  "quality",
  "masking",
];

const DOCUMENT_TAB_LABELS: Record<DocumentTab, string> = {
  health: "Document Health",
  view: "Document View",
  quality: "Source Quality",
  masking: "Masking Status",
};

export type BrowserLocalDocumentMetadata = {
  byteLength: number;
  documentId: string;
  fileName: string;
  sha256: string;
};

export type DocumentMaskingContext = {
  document: DocumentRecord;
  file?: File;
  focusedMaskId?: string;
  metadata?: BrowserLocalDocumentMetadata;
};

function documentHasKnownPageCount(document: DocumentRecord) {
  return document.pages.length > 0 && document.pages.every((page) => page.expected);
}

function readableFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PdfPageViewer({
  file,
  title,
}: {
  file: File;
  title: string;
}) {
  const pagesRef = useRef<HTMLDivElement | null>(null);
  const [renderMessage, setRenderMessage] = useState("Rendering PDF pages…");

  useEffect(() => {
    const pages = pagesRef.current;
    if (!pages) return;
    const pageContainer = pages;

    let disposed = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let pdfDocument: PDFDocumentProxy | undefined;
    let renderTask: RenderTask | undefined;

    pageContainer.replaceChildren();
    setRenderMessage("Rendering PDF pages…");

    async function renderPdf() {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc =
          "/vendor/pdfjs/pdf.worker.legacy-6.1.200.min.mjs";
        const data = new Uint8Array(await file.arrayBuffer());
        if (disposed) return;

        loadingTask = pdfjs.getDocument({ data });
        pdfDocument = await loadingTask.promise;
        if (disposed) return;

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          const page = await pdfDocument.getPage(pageNumber);
          if (disposed) return;

          const viewport = page.getViewport({ scale: 1.35 });
          const pageFrame = document.createElement("figure");
          const pageLabel = document.createElement("figcaption");
          const canvas = document.createElement("canvas");

          pageFrame.className =
            "mx-auto grid w-full max-w-[56rem] gap-2 rounded-md border border-border bg-white p-2 shadow-sm";
          pageLabel.className =
            "font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground";
          pageLabel.textContent = `Page ${pageNumber} of ${pdfDocument.numPages}`;
          canvas.className = "h-auto w-full bg-white";
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.setAttribute("aria-label", `${title}, page ${pageNumber}`);
          canvas.setAttribute("role", "img");

          pageFrame.append(pageLabel, canvas);
          pageContainer.append(pageFrame);

          const nextRenderTask = page.render({ canvas, viewport });
          renderTask = nextRenderTask;
          await nextRenderTask.promise;
          renderTask = undefined;
        }

        if (!disposed) setRenderMessage("");
      } catch {
        if (!disposed) {
          setRenderMessage(
            "The embedded preview could not render this PDF. Use “Open local PDF in a new tab” above.",
          );
        }
      }
    }

    void renderPdf();

    return () => {
      disposed = true;
      renderTask?.cancel();
      void loadingTask?.destroy();
      pageContainer.replaceChildren();
    };
  }, [file, title]);

  return (
    <div
      aria-label={title}
      className="h-[34rem] overflow-y-auto rounded-lg border border-border bg-muted/20 p-3"
      role="region"
      tabIndex={0}
      title={title}
    >
      {renderMessage ? (
        <p className="pb-3 text-center text-xs text-muted-foreground" role="status">
          {renderMessage}
        </p>
      ) : null}
      <div className="grid gap-4" ref={pagesRef} />
    </div>
  );
}

function LocalPdfPreview({
  document: sourceDocument,
  file,
  onReselect,
}: {
  document: DocumentRecord;
  file?: File;
  onReselect?: () => void;
}) {
  const previewUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function revokePreview(clearState = true) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (clearState) setPreviewUrl(null);
  }

  useEffect(() => {
    revokePreview();
    return () => revokePreview(false);
    // The current source changed or its session-local File was replaced.
  }, [sourceDocument.id, file]);

  useEffect(() => {
    function revokeWhenLeavingPage() {
      revokePreview();
    }
    function revokeWhenHidden() {
      if (document.visibilityState === "hidden") revokePreview();
    }
    window.addEventListener("pagehide", revokeWhenLeavingPage);
    document.addEventListener("visibilitychange", revokeWhenHidden);
    return () => {
      window.removeEventListener("pagehide", revokeWhenLeavingPage);
      document.removeEventListener("visibilitychange", revokeWhenHidden);
      revokePreview(false);
    };
  }, []);

  if (!file) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
        <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <div className="mt-3 font-serif text-lg">
          This PDF is not available in browser storage yet.
        </div>
        <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
          Choose the existing PDF again once. Future reloads will restore the
          locally saved PDF automatically.
        </p>
        {onReselect ? (
          <button
            className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
            onClick={onReselect}
            type="button"
          >
            Choose PDF
          </button>
        ) : null}
      </div>
    );
  }

  if (!previewUrl) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
        <EyeOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <div className="mt-3 font-serif text-lg">Original, unmasked PDF</div>
        <p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
          This displays the original PDF selected in this browser session. It
          may contain unmasked information. The file and its temporary preview
          address are never uploaded, persisted, logged, or transmitted.
        </p>
        <button
          className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md bg-[color:var(--amber)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)] focus-visible:ring-offset-2"
          onClick={() => {
            const nextUrl = URL.createObjectURL(file);
            previewUrlRef.current = nextUrl;
            setPreviewUrl(nextUrl);
          }}
          type="button"
        >
          View original PDF
        </button>
      </div>
    );
  }

  const title = `Original unmasked PDF preview: ${displayFileName(sourceDocument.fileName)}`;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
        <span>
          Original, unmasked PDF · available only in this browser session
        </span>
        <a
          className="font-semibold text-[var(--color-brand)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
          href={previewUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open local PDF in a new tab
        </a>
      </div>
      <PdfPageViewer file={file} title={title} />
    </div>
  );
}

export function DocumentCards({
  documents,
  documentFiles,
  documentMetadata,
  maskingStatus = "pending",
  maskingContent,
  maskingTarget,
  packetPrimaryAction,
  qualityContent,
  renderMaskingContent,
  onAddSource,
  onReselectPreview,
  onRemove,
  onRemoveAll,
  onSelectForRemoval,
  onReplace,
  onRetry,
  onRetryPage,
  onRunOcr,
  onVerifyOcr,
  onRejectOcr,
  onUnlockDocument,
  onUpdateSourceType,
  runtimeMetadata,
  ocrDrafts,
  pageProgress,
  actionLabels = {},
}: {
  documents: DocumentRecord[];
  documentFiles?: Readonly<Record<string, File | undefined>>;
  documentMetadata?: Readonly<
    Record<string, BrowserLocalDocumentMetadata | undefined>
  >;
  maskingStatus?: string;
  maskingContent?: ReactNode;
  maskingTarget?: MaskNavigationTarget | null;
  packetPrimaryAction?: ReactNode;
  qualityContent?: ReactNode;
  renderMaskingContent?: (context: DocumentMaskingContext) => ReactNode;
  onAddSource?: () => void;
  onReselectPreview?: () => void;
  onRemove?: (documentId: string) => void;
  onRemoveAll?: () => void;
  onSelectForRemoval?: () => void;
  onReplace?: (documentId: string) => void;
  onRetry?: (documentId: string) => void;
  onRetryPage?: (documentId: string, pageNumber: number) => void;
  onRunOcr?: (documentId: string, pageNumber: number) => void;
  onVerifyOcr?: (draft: VerifiedOcrPage) => void;
  onRejectOcr?: (documentId: string, pageNumber: number) => void;
  onUnlockDocument?: (
    documentId: string,
    password: string,
  ) => Promise<boolean>;
  runtimeMetadata?: Readonly<
    Record<string, PdfRuntimeMetadata | undefined>
  >;
  ocrDrafts?: Readonly<Record<string, VerifiedOcrPage | undefined>>;
  pageProgress?: Readonly<
    Record<string, BrowserOcrProgress | undefined>
  >;
  onUpdateSourceType?: (
    documentId: string,
    sourceType: DocumentRecord["sourceType"],
  ) => void;
  actionLabels?: {
    add?: string;
    replace?: string;
    retry?: string;
  };
}) {
  const [selectedDocumentId, setSelectedDocumentId] = useState(
    documents[0]?.id ?? "",
  );
  const [tab, setTab] = useState<DocumentTab>("health");
  const selectedDocumentForDraft =
    documents.find((document) => document.id === selectedDocumentId) ??
    documents[0];
  const [sourceTypeDraft, setSourceTypeDraft] = useState<
    DocumentRecord["sourceType"]
  >(selectedDocumentForDraft?.sourceType ?? "other");
  const [passwordDraft, setPasswordDraft] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [removeMenuOpen, setRemoveMenuOpen] = useState(false);
  const tabRefs = useRef<Partial<Record<DocumentTab, HTMLButtonElement | null>>>(
    {},
  );

  useEffect(() => {
    setSourceTypeDraft(selectedDocumentForDraft?.sourceType ?? "other");
    setPasswordDraft("");
    setRemoveMenuOpen(false);
  }, [selectedDocumentForDraft?.id, selectedDocumentForDraft?.sourceType]);

  useEffect(() => {
    if (!maskingTarget) return;
    setSelectedDocumentId(maskingTarget.documentId);
    setTab("masking");
  }, [maskingTarget]);

  if (documents.length === 0) {
    return null;
  }

  const selectedDocument = selectedDocumentForDraft!;
  const selectedFile = documentFiles?.[selectedDocument.id];
  const selectedMetadata = documentMetadata?.[selectedDocument.id];
  const selectedRuntimeMetadata = runtimeMetadata?.[selectedDocument.id];
  const dynamicLocalPreview = documentFiles !== undefined || onReselectPreview;
  const hasKnownPageCount = documentHasKnownPageCount(selectedDocument);
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
    (page) => page.availability === "extraction_failed",
  ).length;
  const totalExtractedCharacters = selectedDocument.pages.reduce(
    (total, page) => total + page.extractedCharacterCount,
    0,
  );
  const extractionCoverage = hasKnownPageCount
    ? Math.round(
        (readablePageCount /
          Math.max(1, selectedDocument.expectedPageCount)) *
          100,
      )
    : null;
  const limitationPageCount = selectedDocument.pages.filter(pageIsLimitation).length;
  const attentionPageCount = selectedDocument.pages.filter(pageNeedsAttention).length;
  const limitationItems = selectedDocument.pages
    .filter((page) => page.availability !== "available")
    .map(
      (page) =>
        page.expected
          ? `Page ${page.pageNumber}: ${PAGE_AVAILABILITY_LABELS[page.availability]}`
          : "PDF page count and page extraction states are unavailable because PDF.js could not open the document.",
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

  function selectTabFromKeyboard(
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: DocumentTab,
  ) {
    const currentIndex = DOCUMENT_TABS.indexOf(currentTab);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % DOCUMENT_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + DOCUMENT_TABS.length) % DOCUMENT_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = DOCUMENT_TABS.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = DOCUMENT_TABS[nextIndex];
    setTab(nextTab);
    tabRefs.current[nextTab]?.focus();
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
            <h4 className="font-serif text-base" id="packet-list-heading">
              Packet ({documents.length})
            </h4>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <button
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-muted"
                onClick={() =>
                  onAddSource
                    ? onAddSource()
                    : document
                        .getElementById("documents")
                        ?.scrollIntoView({ behavior: "smooth" })
                }
                type="button"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                {actionLabels.add ?? "Open source intake"}
              </button>
              {packetPrimaryAction}
            </div>
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
                        {document.id} · {SOURCE_TYPE_LABELS[document.sourceType]} ·{" "}
                        {documentHasKnownPageCount(document)
                          ? `${document.expectedPageCount} pages`
                          : "page count unavailable"}
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
                onClick={() =>
                  onRetry
                    ? onRetry(selectedDocument.id)
                    : moveToControl("processing")
                }
                type="button"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {actionLabels.retry ?? "Open processing controls"}
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                onClick={() =>
                  onReplace
                    ? onReplace(selectedDocument.id)
                    : moveToControl("documents")
                }
                type="button"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                {actionLabels.replace ?? "Replace via source intake"}
              </button>
              {onRemove ? (
                <div className="relative inline-flex">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-l-md border border-r-0 border-[color:var(--rust)]/35 px-2.5 py-1 text-xs text-[color:var(--rust)] hover:bg-[color:var(--rust)]/5"
                    onClick={() => onRemove(selectedDocument.id)}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove PDF
                  </button>
                  <button
                    aria-expanded={removeMenuOpen}
                    aria-haspopup="menu"
                    aria-label="More PDF removal options"
                    className="inline-flex items-center rounded-r-md border border-[color:var(--rust)]/35 px-1.5 py-1 text-[color:var(--rust)] hover:bg-[color:var(--rust)]/5"
                    onClick={() => setRemoveMenuOpen((open) => !open)}
                    type="button"
                  >
                    <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                  {removeMenuOpen ? (
                    <div
                      aria-label="PDF removal options"
                      className="absolute right-0 top-[calc(100%+0.35rem)] z-30 min-w-52 rounded-lg border border-border bg-card p-1.5 shadow-xl"
                      role="menu"
                    >
                      {onSelectForRemoval ? (
                        <button
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold hover:bg-muted"
                          onClick={() => {
                            setRemoveMenuOpen(false);
                            onSelectForRemoval();
                          }}
                          role="menuitem"
                          type="button"
                        >
                          <Check aria-hidden="true" className="h-3.5 w-3.5" />
                          Select PDFs to remove
                        </button>
                      ) : null}
                      {onRemoveAll ? (
                        <button
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-[color:var(--rust)] hover:bg-[color:var(--rust)]/5"
                          onClick={() => {
                            setRemoveMenuOpen(false);
                            onRemoveAll();
                          }}
                          role="menuitem"
                          type="button"
                        >
                          <Trash2
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                          Remove all PDFs
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </header>

          <div
            aria-label="Document detail"
            className="flex gap-1 overflow-x-auto border-b border-border px-4"
            role="tablist"
          >
            {DOCUMENT_TABS.map((value) => (
              <button
                aria-controls={`document-${value}-panel`}
                aria-selected={tab === value}
                className={`whitespace-nowrap px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)] focus-visible:ring-inset ${
                  tab === value
                    ? "border-b-2 border-[color:var(--amber)] text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                id={`document-${value}-tab`}
                key={value}
                onClick={() => setTab(value)}
                onKeyDown={(event) => selectTabFromKeyboard(event, value)}
                ref={(node) => {
                  tabRefs.current[value] = node;
                }}
                role="tab"
                tabIndex={tab === value ? 0 : -1}
                type="button"
              >
                {DOCUMENT_TAB_LABELS[value]}
              </button>
            ))}
          </div>

          <div
            aria-label={`${tab.replaceAll("_", " ")} for ${selectedDocument.id}`}
            aria-labelledby={`document-${tab}-tab`}
            className="grid gap-4 p-5"
            id={`document-${tab}-panel`}
            role="tabpanel"
          >
            {tab === "health" ? (
              <div className="grid gap-4 sm:grid-cols-4">
                <DocumentStat
                  label="Pages"
                  value={
                    hasKnownPageCount
                      ? selectedDocument.expectedPageCount
                      : "Unavailable"
                  }
                />
                <DocumentStat label="Readable" value={readablePageCount} />
                <DocumentStat label="OCR" value={ocrPageCount} />
                <DocumentStat
                  label="Failed"
                  value={hasKnownPageCount ? failedPageCount : "Unavailable"}
                />
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
              dynamicLocalPreview ? (
                <LocalPdfPreview
                  document={selectedDocument}
                  file={selectedFile}
                  onReselect={onReselectPreview}
                />
              ) : (
                <div className="grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
                  {attentionPageCount > 0 ? (
                    <Lock className="h-6 w-6 text-[color:var(--rust)]" />
                  ) : limitationPageCount > 0 ? (
                    <ScanLine className="h-6 w-6 text-[color:var(--amber)]" />
                  ) : (
                    <EyeOff className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div className="mt-3 font-serif text-lg">
                    Source preview remains available through the legacy demo
                    review workflow
                  </div>
                  <div className="mt-1 max-w-md text-xs text-muted-foreground">
                    This compatibility view does not expose browser-created case
                    files.
                  </div>
                </div>
              )
            ) : null}

            {tab === "quality" ? (
              <div className="space-y-3 text-sm">
                <div>
                  <h5 className="font-serif text-base">
                    Extraction quality and coverage
                  </h5>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Technical facts reported by browser-local PDF.js extraction.
                  </p>
                </div>

                {onUpdateSourceType ? (
                  <section
                    aria-labelledby="source-classification-heading"
                    className="rounded-lg border border-border bg-muted/25 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h5
                          className="font-serif text-base"
                          id="source-classification-heading"
                        >
                          Source classification
                        </h5>
                        <p className="mt-0.5 max-w-xl text-[11px] leading-4 text-muted-foreground">
                          Practitioner-supplied context for later analysis. This
                          does not verify authenticity, credibility, or legal
                          strength.
                        </p>
                      </div>
                      <Chip tone={selectedDocument.sourceType === "other" ? "mute" : "sage"}>
                        {selectedDocument.sourceType === "other"
                          ? "Unclassified"
                          : SOURCE_TYPE_LABELS[selectedDocument.sourceType]}
                      </Chip>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <label className="grid gap-1 text-xs font-semibold">
                        Source role
                        <select
                          aria-label={`Source role for ${selectedDocument.id}`}
                          className="cfn-control-target w-full rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
                          onChange={(event) =>
                            setSourceTypeDraft(
                              event.currentTarget
                                .value as DocumentRecord["sourceType"],
                            )
                          }
                          value={sourceTypeDraft}
                        >
                          {Object.entries(SOURCE_TYPE_LABELS).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {value === "other"
                                  ? "Unclassified / other uploaded PDF"
                                  : label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      <button
                        className="cfn-control-target rounded-md bg-[var(--color-brand)] px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={
                          sourceTypeDraft === selectedDocument.sourceType
                        }
                        onClick={() =>
                          onUpdateSourceType(
                            selectedDocument.id,
                            sourceTypeDraft,
                          )
                        }
                        type="button"
                      >
                        Save classification
                      </button>
                    </div>
                  </section>
                ) : null}

                {selectedRuntimeMetadata ? (
                  <section className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h5 className="font-serif text-base">
                          Embedded PDF metadata
                        </h5>
                        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                          Self-declared technical metadata from the PDF. These
                          fields are unverified and are not evidence of
                          authenticity.
                        </p>
                      </div>
                      <Chip
                        tone={
                          selectedRuntimeMetadata.encryptionStatus ===
                          "password_required"
                            ? "rust"
                            : "mute"
                        }
                      >
                        {selectedRuntimeMetadata.encryptionStatus.replaceAll(
                          "_",
                          " ",
                        )}
                      </Chip>
                    </div>
                    <dl className="mt-2 grid gap-2 sm:grid-cols-3">
                      <QualityFact
                        label="PDF version"
                        value={
                          selectedRuntimeMetadata.pdfFormatVersion ??
                          "Not declared"
                        }
                      />
                      <QualityFact
                        label="Title"
                        value={selectedRuntimeMetadata.title ?? "Not declared"}
                      />
                      <QualityFact
                        label="Author"
                        value={selectedRuntimeMetadata.author ?? "Not declared"}
                      />
                      <QualityFact
                        label="Creator"
                        value={
                          selectedRuntimeMetadata.creator ?? "Not declared"
                        }
                      />
                      <QualityFact
                        label="Producer"
                        value={
                          selectedRuntimeMetadata.producer ?? "Not declared"
                        }
                      />
                      <QualityFact
                        label="Permissions"
                        value={
                          selectedRuntimeMetadata.permissionFlags?.length
                            ? selectedRuntimeMetadata.permissionFlags.join(", ")
                            : "Not declared"
                        }
                      />
                    </dl>
                    {selectedRuntimeMetadata.encryptionStatus ===
                      "password_required" && onUnlockDocument ? (
                      <form
                        className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          if (!passwordDraft) return;
                          setUnlocking(true);
                          const unlocked = await onUnlockDocument(
                            selectedDocument.id,
                            passwordDraft,
                          );
                          setUnlocking(false);
                          if (unlocked) setPasswordDraft("");
                        }}
                      >
                        <label className="grid min-w-[14rem] flex-1 gap-1 text-xs font-semibold">
                          PDF password
                          <input
                            autoComplete="off"
                            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                            onChange={(event) =>
                              setPasswordDraft(event.currentTarget.value)
                            }
                            type="password"
                            value={passwordDraft}
                          />
                        </label>
                        <button
                          className="rounded-md bg-[var(--color-brand)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          disabled={!passwordDraft || unlocking}
                          type="submit"
                        >
                          {unlocking ? "Unlocking locally…" : "Unlock locally"}
                        </button>
                        <p className="w-full text-[11px] text-muted-foreground">
                          The password stays in memory for this tab. It is
                          never saved, logged, uploaded, or included in reports.
                        </p>
                      </form>
                    ) : null}
                  </section>
                ) : null}

                <dl className="grid gap-2 sm:grid-cols-2">
                  <QualityFact
                    label="File size"
                    value={
                      selectedMetadata
                        ? readableFileSize(selectedMetadata.byteLength)
                        : "Unavailable"
                    }
                  />
                  <QualityFact
                    label="Processing status"
                    value={selectedDocument.processingStatus.replaceAll("_", " ")}
                  />
                  <QualityFact
                    label="Expected pages"
                    value={
                      hasKnownPageCount
                        ? selectedDocument.expectedPageCount
                        : "Unavailable"
                    }
                  />
                  <QualityFact label="Readable pages" value={readablePageCount} />
                  <QualityFact
                    label="OCR-required pages"
                    value={ocrPageCount}
                  />
                  <QualityFact
                    label="Failed pages"
                    value={hasKnownPageCount ? failedPageCount : "Unavailable"}
                  />
                  <QualityFact
                    label="Extracted characters"
                    value={totalExtractedCharacters.toLocaleString()}
                  />
                  <QualityFact
                    label="Browser-session file"
                    value={
                      selectedFile
                        ? "Available for this session"
                        : "Reselect required"
                    }
                  />
                  <QualityFact
                    label="Provenance"
                    value={provenanceLabel(selectedDocument)}
                  />
                  <div className="rounded-md border border-border p-3 sm:col-span-2">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      SHA-256 fingerprint
                    </dt>
                    <dd className="mt-1 break-all font-mono text-[11px] leading-5">
                      {selectedMetadata?.sha256 ?? "Unavailable"}
                    </dd>
                  </div>
                </dl>

                <div className="rounded-md border border-border p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    Extraction coverage
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[color:var(--amber)]"
                        style={{
                          width: `${extractionCoverage ?? 0}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs">
                      {extractionCoverage === null
                        ? "Unavailable"
                        : `${extractionCoverage}%`}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {hasKnownPageCount
                      ? `${readablePageCount} of ${selectedDocument.expectedPageCount} expected pages have embedded readable text.`
                      : "PDF.js could not determine a page count, so no coverage percentage is calculated."}
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
                    {selectedDocument.pages.map((page) => {
                      const progress = pageProgress?.[page.id];
                      const ocrDraft = ocrDrafts?.[page.id];
                      const recoverable = [
                        "image_only",
                        "unreadable",
                        "extraction_failed",
                      ].includes(page.availability);
                      return (
                        <li
                          className="grid gap-2 bg-[var(--color-canvas)] px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                          key={page.id}
                        >
                          <span>
                          <span className="font-semibold">
                            {page.expected
                              ? `Page ${page.pageNumber}`
                              : "Document-level extraction"}
                          </span>
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
                            {recoverable ? (
                              <span className="mt-1 flex flex-wrap justify-start gap-1 sm:justify-end">
                                {onRetryPage ? (
                                  <button
                                    className="rounded border border-border px-2 py-1 text-[10px] font-semibold hover:bg-muted disabled:opacity-50"
                                    disabled={Boolean(progress)}
                                    onClick={() =>
                                      onRetryPage(
                                        selectedDocument.id,
                                        page.pageNumber,
                                      )
                                    }
                                    type="button"
                                  >
                                    Retry embedded text
                                  </button>
                                ) : null}
                                {onRunOcr ? (
                                  <button
                                    className="rounded border border-border px-2 py-1 text-[10px] font-semibold hover:bg-muted disabled:opacity-50"
                                    disabled={Boolean(progress)}
                                    onClick={() =>
                                      onRunOcr(
                                        selectedDocument.id,
                                        page.pageNumber,
                                      )
                                    }
                                    type="button"
                                  >
                                    Run local OCR
                                  </button>
                                ) : null}
                              </span>
                            ) : null}
                          </span>
                          {progress ? (
                            <div
                              className="sm:col-span-2"
                              role="status"
                            >
                              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full bg-[color:var(--amber)]"
                                  style={{
                                    width: `${Math.round(progress.progress * 100)}%`,
                                  }}
                                />
                              </div>
                              <p className="mt-1 text-[10px] capitalize text-muted-foreground">
                                {progress.status} ·{" "}
                                {Math.round(progress.progress * 100)}%
                              </p>
                            </div>
                          ) : null}
                          {ocrDraft ? (
                            <section className="rounded-md border border-[color:var(--amber)] bg-muted/20 p-3 sm:col-span-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <h6 className="font-semibold">
                                    OCR draft — human verification required
                                  </h6>
                                  <p className="text-[10px] text-muted-foreground">
                                    English local OCR · confidence{" "}
                                    {Math.round(ocrDraft.confidence)}%
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    className="rounded bg-[var(--color-brand)] px-2 py-1 text-[10px] font-semibold text-white"
                                    onClick={() => onVerifyOcr?.(ocrDraft)}
                                    type="button"
                                  >
                                    Verify OCR text
                                  </button>
                                  <button
                                    className="rounded border border-border px-2 py-1 text-[10px] font-semibold"
                                    onClick={() =>
                                      onRejectOcr?.(
                                        selectedDocument.id,
                                        page.pageNumber,
                                      )
                                    }
                                    type="button"
                                  >
                                    Discard
                                  </button>
                                </div>
                              </div>
                              <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded bg-background p-2 text-[11px] leading-4">
                                {ocrDraft.text}
                              </pre>
                            </section>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
                <p className="border-t border-[var(--color-border)] pt-3 text-xs leading-5 text-[var(--color-ink-muted)]">
                  Source Quality reports technical extraction availability. It
                  does not determine authenticity, credibility, factual accuracy,
                  legal reliability, completeness, or case strength.
                </p>
                {qualityContent}
              </div>
            ) : null}

            {tab === "masking" ? (
              renderMaskingContent?.({
                document: selectedDocument,
                file: selectedFile,
                focusedMaskId:
                  maskingTarget?.documentId === selectedDocument.id
                    ? maskingTarget.maskId
                    : undefined,
                metadata: selectedMetadata,
              }) ??
              maskingContent ?? (
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
              )
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function QualityFact({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 capitalize">{value}</dd>
    </div>
  );
}

function DocumentStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-serif text-2xl">{value}</div>
    </div>
  );
}
