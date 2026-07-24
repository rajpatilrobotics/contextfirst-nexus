import {
  CoverageIssueSchema,
  CoverageSummarySchema,
  DocumentRecordSchema,
  ProcessingStageSchema,
  SourceSegmentSchema,
  type CoverageSummary,
  type DocumentRecord,
  type ProcessingStage,
  type SafeErrorCode,
  type SourceSegment,
} from "../contracts";
import { cfnDemoFixture } from "../fixtures";

const CASE_ID = "CFN-DEMO-001" as const;
// Use a new physical filename when the worker build changes. Safari can keep a
// module worker alive across reloads even when only its query string changes.
const WORKER_SRC = "/vendor/pdfjs/pdf.worker.legacy-6.1.200.min.mjs" as const;
const FIXTURE_BASE_PATH = "/fixtures/cfn-demo-001/" as const;
const FIXTURE_VERSION = "1.0.0" as const;

export const LOCAL_PDF_SELECTION_LIMITS = Object.freeze({
  maxFiles: 25,
  maxBytesPerFile: 20 * 1024 * 1024,
  maxTotalBytes: 100 * 1024 * 1024,
});

export const CFN_DEMO_PDF_ALLOWLIST = [
  {
    documentId: "D01",
    fileName: "01_job_offer.pdf",
    byteLength: 3_197,
    sha256: "9f156ef5e170e4af950bace38d2dcf4857d02b0f32a5e356c754cfdccbb54e4e",
  },
  {
    documentId: "D02",
    fileName: "02_recruiter_messages.pdf",
    byteLength: 4_034,
    sha256: "dfd8073474cfecca42671d6bf3ae2337a1873ac536cedc01ac31a521787f9ca8",
  },
  {
    documentId: "D03",
    fileName: "03_travel_records.pdf",
    byteLength: 2_896,
    sha256: "b0b356d3d7c1c7ab85a4fc5b620fb328d7ef9cf6c0b92a611330e44e07050a03",
  },
  {
    documentId: "D04",
    fileName: "04_practitioner_intake_note.pdf",
    byteLength: 4_126,
    sha256: "413ba10622df5ac1fd5416dfe957ba16e7442819f351b0063267ddfe3f23d511",
  },
  {
    documentId: "D05",
    fileName: "05_task_and_penalty_log.pdf",
    byteLength: 3_002,
    sha256: "c1293dc2fab12e5474e136ba99471ded061c4ac48cd5904c322ee9de7efb2f4a",
  },
  {
    documentId: "D06",
    fileName: "06_synthetic_case_notice.pdf",
    byteLength: 3_018,
    sha256: "ad755f5eae4ca831557f9dc6a756802127d8295047b64e857f100f25fe2fdc3b",
  },
  {
    documentId: "D07",
    fileName: "07_support_note.pdf",
    byteLength: 3_028,
    sha256: "541a68c6239c1797e0f88bb527dff2c7541d4c3531a1fc4bc64e5407192b7e69",
  },
] as const;

type CoverageIssue = CoverageSummary["issues"][number];
type PageRecord = DocumentRecord["pages"][number];
type PageAvailability = PageRecord["availability"];
type DemoPdfAllowlistEntry = (typeof CFN_DEMO_PDF_ALLOWLIST)[number];

export type CfnDemoPdfSelectionIssueCode =
  | "wrong_file_count"
  | "duplicate_file_name"
  | "unknown_file_name"
  | "invalid_file_type"
  | "invalid_pdf_header"
  | "invalid_file_size"
  | "digest_mismatch";

export type CfnDemoPdfSelectionIssue = {
  code: CfnDemoPdfSelectionIssueCode;
  fileName?: string;
};

export type VerifiedCfnDemoPdfFile = {
  documentId: DemoPdfAllowlistEntry["documentId"];
  fileName: DemoPdfAllowlistEntry["fileName"];
  byteLength: number;
  sha256: string;
  selectionStatus: "selected";
  verificationStatus: "verified";
  readinessStatus: "ready";
  file: File;
};

export type CfnDemoPdfSelectionValidation =
  | {
      status: "verified";
      packetStatus: "success";
      files: VerifiedCfnDemoPdfFile[];
      issues: [];
      error: null;
    }
  | {
      status: "rejected";
      packetStatus: "error";
      files: [];
      issues: CfnDemoPdfSelectionIssue[];
      error: { code: "packet_validation_failed" };
    };

export type LocalPdfSelectionIssueCode =
  | "empty_selection"
  | "too_many_files"
  | "duplicate_file_name"
  | "invalid_file_extension"
  | "invalid_file_type"
  | "invalid_pdf_header"
  | "file_too_large"
  | "total_size_exceeded";

export type LocalPdfSelectionIssue = {
  code: LocalPdfSelectionIssueCode;
  fileName?: string;
};

export type ValidatedLocalPdfFile = {
  fileName: string;
  byteLength: number;
  file: File;
};

export type LocalPdfSelectionValidation =
  | {
      status: "verified";
      files: ValidatedLocalPdfFile[];
      totalBytes: number;
      issues: [];
    }
  | {
      status: "rejected";
      files: [];
      totalBytes: number;
      issues: LocalPdfSelectionIssue[];
    };

export type CfnDemoPdfPacketDetection =
  | {
      isExactMatch: true;
      files: VerifiedCfnDemoPdfFile[];
    }
  | {
      isExactMatch: false;
      files: [];
    };

export type LocalPdfInspection = {
  fileName: string;
  byteLength: number;
  pageCount: number;
  readablePageCount: number;
  imageOnlyPageCount: number;
  failedPageCount: number;
  status: "ready" | "warning" | "failed";
};

/** @deprecated Use LocalPdfInspection. */
export type LocalPdfInspectionFile = LocalPdfInspection;

export type LocalPdfInspectionResult =
  | {
      status: "completed";
      fileCount: number;
      totalBytes: number;
      files: LocalPdfInspection[];
      issues: [];
    }
  | {
      status: "rejected";
      fileCount: number;
      totalBytes: number;
      files: [];
      issues: LocalPdfSelectionIssue[];
    };

export type LocalDocumentRecord = Omit<
  DocumentRecord,
  "sourceType" | "dataOrigin"
> & {
  sourceType: DocumentRecord["sourceType"] | "other";
  dataOrigin: "browser_local";
};

export type LocalPdfDocumentServiceResult = {
  caseId: typeof CASE_ID;
  fixtureVersion: typeof FIXTURE_VERSION;
  documentSetDigest: string;
  documents: LocalDocumentRecord[];
  segments: SourceSegment[];
  coverage: CoverageSummary;
  processing: ProcessingStage[];
  selectedSegmentIds: string[];
};

export type DocumentSafeError = {
  code: SafeErrorCode;
  stage: "intake_validation" | "text_extraction" | "coverage_calculation";
  documentId?: string;
  pageId?: string;
};

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
};

export type PdfPageLike = {
  getTextContent: () => Promise<{ items: PdfTextItem[] }>;
  streamTextContent?: () => {
    getReader: () => {
      read: () => Promise<{
        done: boolean;
        value?: { items?: PdfTextItem[] };
      }>;
      releaseLock?: () => void;
    };
  };
  cleanup?: () => void;
};

export type PdfDocumentLike = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageLike>;
  cleanup?: () => void;
  destroy?: () => Promise<void> | void;
};

export type PdfLoadingTaskLike = {
  promise: Promise<PdfDocumentLike>;
  destroy?: () => Promise<void> | void;
};

export type PdfDocumentSource =
  | { url: string }
  | {
      data: Uint8Array;
      disableFontFace?: boolean;
      useSystemFonts?: boolean;
      useWasm?: boolean;
      useWorkerFetch?: boolean;
      isOffscreenCanvasSupported?: boolean;
      isImageDecoderSupported?: boolean;
    };

export type PdfJsRuntimeLike = {
  GlobalWorkerOptions?: { workerSrc?: string };
  getDocument: (input: PdfDocumentSource) => PdfLoadingTaskLike;
};

export type ExtractedPage = {
  pageId: string;
  text: string;
  boxes: SourceSegment["boundingBoxes"];
};

export type CfnDemoDocumentServiceResult = {
  caseId: typeof CASE_ID;
  fixtureVersion: typeof FIXTURE_VERSION;
  canonicalFixtureDigest: string;
  documents: DocumentRecord[];
  segments: SourceSegment[];
  coverage: CoverageSummary;
  processing: ProcessingStage[];
  selectedSegmentIds: string[];
};

type FixtureDocument = (typeof cfnDemoFixture.documents)[number];
type FixturePage = FixtureDocument["pages"][number];
type FixtureSegment = (typeof cfnDemoFixture.segments)[number];

function nowIso() {
  return new Date().toISOString();
}

function completeStage(name: ProcessingStage["name"], affectedDocumentIds: string[]): ProcessingStage {
  const timestamp = nowIso();
  return {
    name,
    status: "completed",
    startedAt: timestamp,
    completedAt: timestamp,
    affectedDocumentIds,
    retryable: false,
  };
}

function verifiedDemoPacketResult(): CfnDemoDocumentServiceResult {
  return {
    caseId: CASE_ID,
    fixtureVersion: FIXTURE_VERSION,
    canonicalFixtureDigest: cfnDemoFixture.canonicalFixtureDigest,
    documents: cfnDemoFixture.documents.map((document) =>
      DocumentRecordSchema.parse(document),
    ),
    segments: cfnDemoFixture.segments.map((segment) =>
      buildSegment(segment, new Map()),
    ),
    coverage: CoverageSummarySchema.parse(cfnDemoFixture.coverage),
    processing: cfnDemoFixture.processing.map((stage) =>
      ProcessingStageSchema.parse(stage),
    ),
    selectedSegmentIds: [...cfnDemoFixture.selectedSegmentIds],
  };
}

function failedStage(
  name: ProcessingStage["name"],
  affectedDocumentIds: string[],
  errorCode: SafeErrorCode,
): ProcessingStage {
  const timestamp = nowIso();
  return {
    name,
    status: "failed",
    startedAt: timestamp,
    completedAt: timestamp,
    errorCode,
    affectedDocumentIds,
    retryable: true,
  };
}

function warningStage(
  name: ProcessingStage["name"],
  affectedDocumentIds: string[],
  errorCode: SafeErrorCode,
): ProcessingStage {
  const timestamp = nowIso();
  return {
    name,
    status: "warning",
    startedAt: timestamp,
    completedAt: timestamp,
    errorCode,
    affectedDocumentIds,
    retryable: true,
  };
}

export function toSafeDocumentError(
  code: SafeErrorCode,
  stage: DocumentSafeError["stage"],
  documentId?: string,
  pageId?: string,
): DocumentSafeError {
  return { code, stage, documentId, pageId };
}

export async function loadBrowserPdfJsRuntime(): Promise<PdfJsRuntimeLike> {
  if (typeof window === "undefined") {
    throw toSafeDocumentError("INVALID_REQUEST", "intake_validation");
  }

  // The legacy build keeps the same PDF.js API while including the browser
  // compatibility layer needed by Safari.
  const pdfjs = (await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  )) as PdfJsRuntimeLike;
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  }
  return pdfjs;
}

/**
 * PDF.js 6's getTextContent() uses async iteration internally. Safari 26.5
 * does not expose that iterator on ReadableStream yet, while getReader() is
 * supported. Reading the same stream explicitly keeps extraction local and
 * works in Safari without a browser-specific packet fallback.
 */
async function readPdfTextItems(page: PdfPageLike): Promise<PdfTextItem[]> {
  if (!page.streamTextContent) {
    return (await page.getTextContent()).items;
  }

  const reader = page.streamTextContent().getReader();
  const items: PdfTextItem[] = [];
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      items.push(...(chunk.value?.items ?? []));
    }
  } finally {
    reader.releaseLock?.();
  }
  return items;
}

function fixturePathFor(document: FixtureDocument) {
  return `${FIXTURE_BASE_PATH}${document.fileName}`;
}

function isAllowedFixturePath(url: string) {
  return cfnDemoFixture.documents.some((document) => fixturePathFor(document) === url);
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256File(bytes: ArrayBuffer) {
  return bytesToHex(await globalThis.crypto.subtle.digest("SHA-256", bytes));
}

function hasPdfHeader(bytes: ArrayBuffer) {
  const header = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 5));
  return header.length === 5 && String.fromCharCode(...header) === "%PDF-";
}

async function readPdfHeader(file: File) {
  if (typeof file.slice === "function") {
    return file.slice(0, 5).arrayBuffer();
  }
  return (await file.arrayBuffer()).slice(0, 5);
}

/**
 * Validates ordinary browser-local PDF intake without assigning fixture IDs or
 * retaining file bytes. Empty MIME values are allowed because some browsers do
 * not supply one; when present, the MIME value must be application/pdf.
 */
export async function validateLocalPdfSelection(
  selectedFiles: readonly File[],
): Promise<LocalPdfSelectionValidation> {
  const issues: LocalPdfSelectionIssue[] = [];
  const totalBytes = selectedFiles.reduce((total, file) => total + file.size, 0);

  if (selectedFiles.length === 0) {
    issues.push({ code: "empty_selection" });
  }
  if (selectedFiles.length > LOCAL_PDF_SELECTION_LIMITS.maxFiles) {
    issues.push({ code: "too_many_files" });
  }
  if (totalBytes > LOCAL_PDF_SELECTION_LIMITS.maxTotalBytes) {
    issues.push({ code: "total_size_exceeded" });
  }

  const names = new Set<string>();
  for (const file of selectedFiles) {
    const normalizedName = file.name.trim().toLocaleLowerCase("en-US");
    if (names.has(normalizedName)) {
      issues.push({ code: "duplicate_file_name", fileName: file.name });
      continue;
    }
    names.add(normalizedName);

    if (!file.name.toLocaleLowerCase("en-US").endsWith(".pdf")) {
      issues.push({ code: "invalid_file_extension", fileName: file.name });
    }
    if (file.type !== "" && file.type.toLocaleLowerCase("en-US") !== "application/pdf") {
      issues.push({ code: "invalid_file_type", fileName: file.name });
    }
    if (file.size > LOCAL_PDF_SELECTION_LIMITS.maxBytesPerFile) {
      issues.push({ code: "file_too_large", fileName: file.name });
    }

    try {
      if (!hasPdfHeader(await readPdfHeader(file))) {
        issues.push({ code: "invalid_pdf_header", fileName: file.name });
      }
    } catch {
      issues.push({ code: "invalid_pdf_header", fileName: file.name });
    }
  }

  if (issues.length > 0) {
    return { status: "rejected", files: [], totalBytes, issues };
  }

  return {
    status: "verified",
    files: selectedFiles.map((file) => ({
      fileName: file.name,
      byteLength: file.size,
      file,
    })),
    totalBytes,
    issues: [],
  };
}

/**
 * Verifies the selected browser files without uploading or persisting their bytes.
 * Successful files are returned in canonical D01-D07 order.
 */
export async function validateCfnDemoPdfSelection(
  selectedFiles: readonly File[],
): Promise<CfnDemoPdfSelectionValidation> {
  const issues: CfnDemoPdfSelectionIssue[] = [];
  const filesByName = new Map<string, File>();

  if (selectedFiles.length !== CFN_DEMO_PDF_ALLOWLIST.length) {
    issues.push({ code: "wrong_file_count" });
  }

  for (const file of selectedFiles) {
    if (filesByName.has(file.name)) {
      issues.push({ code: "duplicate_file_name", fileName: file.name });
      continue;
    }
    filesByName.set(file.name, file);

    if (!CFN_DEMO_PDF_ALLOWLIST.some((entry) => entry.fileName === file.name)) {
      issues.push({ code: "unknown_file_name", fileName: file.name });
    }
  }

  const verifiedFiles: VerifiedCfnDemoPdfFile[] = [];
  for (const expected of CFN_DEMO_PDF_ALLOWLIST) {
    const file = filesByName.get(expected.fileName);
    if (!file) continue;

    if (file.type !== "application/pdf") {
      issues.push({ code: "invalid_file_type", fileName: file.name });
      continue;
    }
    if (file.size !== expected.byteLength) {
      issues.push({ code: "invalid_file_size", fileName: file.name });
      continue;
    }

    const bytes = await file.arrayBuffer();
    if (!hasPdfHeader(bytes)) {
      issues.push({ code: "invalid_pdf_header", fileName: file.name });
      continue;
    }
    if (bytes.byteLength !== expected.byteLength) {
      issues.push({ code: "invalid_file_size", fileName: file.name });
      continue;
    }

    const digest = await sha256File(bytes);
    if (digest !== expected.sha256) {
      issues.push({ code: "digest_mismatch", fileName: file.name });
      continue;
    }

    verifiedFiles.push({
      documentId: expected.documentId,
      fileName: expected.fileName,
      byteLength: expected.byteLength,
      sha256: expected.sha256,
      selectionStatus: "selected",
      verificationStatus: "verified",
      readinessStatus: "ready",
      file,
    });
  }

  if (issues.length > 0 || verifiedFiles.length !== CFN_DEMO_PDF_ALLOWLIST.length) {
    return {
      status: "rejected",
      packetStatus: "error",
      files: [],
      issues,
      error: { code: "packet_validation_failed" },
    };
  }

  return {
    status: "verified",
    packetStatus: "success",
    files: verifiedFiles,
    issues: [],
    error: null,
  };
}

/** Detects the frozen seven-file packet without weakening its strict validator. */
export async function detectExactCfnDemoPdfPacket(
  selectedFiles: readonly File[],
): Promise<CfnDemoPdfPacketDetection> {
  const validation = await validateCfnDemoPdfSelection(selectedFiles);
  return validation.status === "verified"
    ? { isExactMatch: true, files: validation.files }
    : { isExactMatch: false, files: [] };
}

/** Returns true only for the strictly verified, frozen seven-file demo packet. */
export async function isExactCfnDemoPdfSelection(
  selectedFiles: readonly File[],
): Promise<boolean> {
  return (await validateCfnDemoPdfSelection(selectedFiles)).status === "verified";
}

/**
 * Reads ordinary PDFs entirely in the browser and returns metadata-only counts.
 * Extracted text and input bytes are intentionally absent from the result.
 */
export async function inspectLocalPdfFiles(
  selectedFiles: readonly File[],
  runtimeLoader: () => Promise<PdfJsRuntimeLike> = loadBrowserPdfJsRuntime,
): Promise<LocalPdfInspectionResult> {
  const validation = await validateLocalPdfSelection(selectedFiles);
  if (validation.status !== "verified") {
    return {
      status: "rejected",
      fileCount: selectedFiles.length,
      totalBytes: validation.totalBytes,
      files: [],
      issues: validation.issues,
    };
  }

  const runtime = await runtimeLoader();
  if (runtime.GlobalWorkerOptions) {
    runtime.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  }

  const inspectedFiles: LocalPdfInspection[] = [];
  for (const selected of validation.files) {
    let loadingTask: PdfLoadingTaskLike | undefined;
    let pdf: PdfDocumentLike | undefined;
    let readablePageCount = 0;
    let imageOnlyPageCount = 0;
    let failedPageCount = 0;

    try {
      loadingTask = runtime.getDocument({
        data: new Uint8Array(await selected.file.arrayBuffer()),
      });
      pdf = await loadingTask.promise;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        let page: PdfPageLike | undefined;
        try {
          page = await pdf.getPage(pageNumber);
          const text = (await readPdfTextItems(page))
            .map((item) => item.str ?? "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          if (text.length > 0) readablePageCount += 1;
          else imageOnlyPageCount += 1;
        } catch {
          failedPageCount += 1;
        } finally {
          page?.cleanup?.();
        }
      }

      inspectedFiles.push({
        fileName: selected.fileName,
        byteLength: selected.byteLength,
        pageCount: pdf.numPages,
        readablePageCount,
        imageOnlyPageCount,
        failedPageCount,
        status:
          failedPageCount > 0 || imageOnlyPageCount > 0 ? "warning" : "ready",
      });
    } catch {
      inspectedFiles.push({
        fileName: selected.fileName,
        byteLength: selected.byteLength,
        pageCount: 0,
        readablePageCount: 0,
        imageOnlyPageCount: 0,
        failedPageCount: 0,
        status: "failed",
      });
    } finally {
      pdf?.cleanup?.();
      await pdf?.destroy?.();
      await loadingTask?.destroy?.();
    }
  }

  return {
    status: "completed",
    fileCount: inspectedFiles.length,
    totalBytes: validation.totalBytes,
    files: inspectedFiles,
    issues: [],
  };
}

/** @deprecated Use inspectLocalPdfFiles. */
export const inspectLocalPdfSelection = inspectLocalPdfFiles;

function localDocumentId(index: number) {
  return `D${String(index + 1).padStart(2, "0")}`;
}

function localPageId(documentId: string, pageNumber: number) {
  return `${documentId}-P${pageNumber}`;
}

function localSegmentId(pageId: string) {
  return `${pageId}-S1`;
}

function displayNameFor(fileName: string) {
  const withoutExtension = fileName.replace(/\.pdf$/i, "");
  const normalized = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized || "PDF document";
}

function hasInstructionSignal(text: string) {
  return /\b(?:ignore|disregard|override)\b.{0,80}\b(?:instruction|system|prompt|rule)\b/i.test(
    text,
  );
}

function localCoverageIssue(
  documentId: string,
  pageId: string,
  kind: CoverageIssue["kind"],
): CoverageIssue {
  const rationaleByKind: Partial<Record<CoverageIssue["kind"], string>> = {
    image_only_page:
      "The PDF page has no embedded readable text. OCR is required before this page can support analysis.",
    extraction_failed:
      "The browser could not extract text from this PDF page. The page cannot support analysis until it is replaced or retried.",
  };

  return CoverageIssueSchema.parse({
    id: `COVERAGE-${pageId}-${kind.toUpperCase().replaceAll("_", "-")}`,
    documentId,
    pageId,
    kind,
    initialConsequence: "unknown",
    activeConsequence: "unknown",
    rationale: rationaleByKind[kind] ?? "The PDF page needs human review before analysis.",
    resolutionStatus: "open",
    coverageReviewDecisionId: null,
  });
}

function localPageRecord(
  documentId: string,
  pageNumber: number,
  availability: PageAvailability,
  extractedCharacterCount: number,
): PageRecord {
  const failureCode = availability === "available" ? undefined : "EXTRACTION_FAILED";
  return {
    id: localPageId(documentId, pageNumber),
    documentId,
    pageNumber,
    expected: true,
    availability,
    extractionStatus:
      availability === "available"
        ? "completed"
        : availability === "image_only"
          ? "warning"
          : "failed",
    extractedCharacterCount,
    ...(failureCode ? { failureCode } : {}),
  };
}

function localSegment(
  documentId: string,
  pageNumber: number,
  extracted: ExtractedPage,
): SourceSegment {
  const pageId = localPageId(documentId, pageNumber);
  const instructionSignal = hasInstructionSignal(extracted.text);
  return SourceSegmentSchema.parse({
    id: localSegmentId(pageId),
    documentId,
    pageId,
    pageNumber,
    ordinal: 1,
    rawText: extracted.text,
    redactedText: extracted.text,
    boundingBoxes: extracted.boxes,
    sourceLanguage: "en",
    translationStatus: "original_language",
    extractionQuality: "machine_extracted",
    instructionAdvisory: instructionSignal ? "advisory_signal" : "no_signal",
    modelVisibility: "not_sent",
    supportEligibility: instructionSignal ? "evidence_only" : "candidate_eligible",
  });
}

async function documentSetDigest(
  files: readonly ValidatedLocalPdfFile[],
  fileDigests: readonly string[],
) {
  const canonical = JSON.stringify(
    files.map((file, index) => ({
      ordinal: index + 1,
      fileName: file.fileName,
      byteLength: file.byteLength,
      sha256: fileDigests[index],
    })),
  );
  return bytesToHex(
    await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical)),
  );
}

/**
 * Extracts arbitrary browser-selected PDFs into session-local canonical source
 * records. Input bytes are released after PDF.js finishes and are never
 * returned by this function.
 */
export async function processLocalPdfSources(
  selectedFiles: readonly File[],
  runtimeLoader: () => Promise<PdfJsRuntimeLike> = loadBrowserPdfJsRuntime,
): Promise<LocalPdfDocumentServiceResult> {
  const validation = await validateLocalPdfSelection(selectedFiles);
  if (validation.status !== "verified") {
    throw toSafeDocumentError("INVALID_REQUEST", "intake_validation");
  }

  const runtime = await runtimeLoader();
  if (runtime.GlobalWorkerOptions) runtime.GlobalWorkerOptions.workerSrc = WORKER_SRC;

  const documents: LocalDocumentRecord[] = [];
  const segments: SourceSegment[] = [];
  const issues: CoverageIssue[] = [];
  const fileDigests: string[] = [];

  for (const [fileIndex, selected] of validation.files.entries()) {
    const documentId = localDocumentId(fileIndex);
    let loadingTask: PdfLoadingTaskLike | undefined;
    let pdf: PdfDocumentLike | undefined;
    const pages: PageRecord[] = [];

    try {
      const bytes = await selected.file.arrayBuffer();
      fileDigests.push(await sha256File(bytes));
      // Text extraction does not need font rendering, image decoding, canvas,
      // or WebAssembly. Disabling those optional paths avoids Safari/CSP
      // failures while keeping PDF parsing inside the browser.
      loadingTask = runtime.getDocument({
        data: new Uint8Array(bytes),
        disableFontFace: true,
        useSystemFonts: false,
        useWasm: false,
        useWorkerFetch: false,
        isOffscreenCanvasSupported: false,
        isImageDecoderSupported: false,
      });
      pdf = await loadingTask.promise;

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        let page: PdfPageLike | undefined;
        try {
          page = await pdf.getPage(pageNumber);
          const extracted = textItemsToPage(await readPdfTextItems(page));
          if (extracted.text.length === 0) {
            const pageRecord = localPageRecord(documentId, pageNumber, "image_only", 0);
            pages.push(pageRecord);
            issues.push(localCoverageIssue(documentId, pageRecord.id, "image_only_page"));
          } else {
            pages.push(localPageRecord(documentId, pageNumber, "available", extracted.text.length));
            segments.push(localSegment(documentId, pageNumber, extracted));
          }
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.error("Browser-local PDF text extraction failed", {
              fileName: selected.fileName,
              pageNumber,
              errorName: error instanceof Error ? error.name : "UnknownError",
              errorMessage:
                error instanceof Error ? error.message : "Unknown PDF extraction failure",
            });
          }
          const pageRecord = localPageRecord(documentId, pageNumber, "extraction_failed", 0);
          pages.push(pageRecord);
          issues.push(localCoverageIssue(documentId, pageRecord.id, "extraction_failed"));
        } finally {
          page?.cleanup?.();
        }
      }
    } catch {
      if (fileDigests.length <= fileIndex) {
        // Header validation succeeded, so this only protects digest generation
        // from a later browser read failure without exposing file contents.
        fileDigests.push("0".repeat(64));
      }
      const pageRecord = localPageRecord(documentId, 1, "extraction_failed", 0);
      pages.push(pageRecord);
      issues.push(localCoverageIssue(documentId, pageRecord.id, "extraction_failed"));
    } finally {
      pdf?.cleanup?.();
      await pdf?.destroy?.();
      await loadingTask?.destroy?.();
    }

    const availablePageCount = pages.filter((page) => page.availability === "available").length;
    const processingStatus: LocalDocumentRecord["processingStatus"] =
      availablePageCount === pages.length
        ? "completed"
        : availablePageCount > 0
          ? "warning"
          : "failed";
    documents.push({
      id: documentId,
      caseId: CASE_ID,
      fixtureVersion: FIXTURE_VERSION,
      fileName: selected.fileName,
      displayName: displayNameFor(selected.fileName),
      sourceType: "other",
      dataOrigin: "browser_local",
      expectedPageCount: pages.length,
      pages,
      provenanceStatus: "unverified",
      processingStatus,
      syntheticLabelPresent: false,
    });
  }

  const documentIds = documents.map((document) => document.id);
  const affectedDocumentIds = documents
    .filter((document) => document.processingStatus !== "completed")
    .map((document) => document.id);
  const readablePageCount = documents.reduce(
    (total, document) =>
      total + document.pages.filter((page) => page.availability === "available").length,
    0,
  );
  const processing = [
    completeStage("intake_validation", documentIds),
    affectedDocumentIds.length === 0
      ? completeStage("text_extraction", documentIds)
      : readablePageCount === 0
        ? failedStage("text_extraction", affectedDocumentIds, "EXTRACTION_FAILED")
        : warningStage("text_extraction", affectedDocumentIds, "EXTRACTION_FAILED"),
    completeStage("coverage_calculation", documentIds),
    completeStage("identifier_masking", documentIds),
  ];

  const coverage = CoverageSummarySchema.parse({
    expectedDocuments: documents.length,
    processedDocuments: documents.filter((document) => document.processingStatus !== "failed").length,
    expectedPages: documents.reduce((total, document) => total + document.expectedPageCount, 0),
    availablePages: readablePageCount,
    issues,
    hasConsequentialOpenIssue: issues.length > 0,
  });

  return {
    caseId: CASE_ID,
    fixtureVersion: FIXTURE_VERSION,
    documentSetDigest: await documentSetDigest(validation.files, fileDigests),
    documents,
    segments,
    coverage,
    processing,
    selectedSegmentIds: segments
      .filter((segment) => segment.supportEligibility === "candidate_eligible")
      .map((segment) => segment.id),
  };
}

function textItemsToPage(items: PdfTextItem[]): ExtractedPage {
  const text = items.map((item) => item.str ?? "").join(" ").replace(/\s+/g, " ").trim();
  const boxes = items
    .filter((item) => item.str?.trim())
    .map((item) => {
      const transform = item.transform ?? [1, 0, 0, 1, 0, 0];
      return {
        x: transform[4] ?? 0,
        y: transform[5] ?? 0,
        width: item.width ?? 0,
        height: item.height ?? 0,
        coordinateSpace: "pdf_points" as const,
      };
    });

  return { pageId: "", text, boxes };
}

export function normalizeForSegmentMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/([a-z])-\s+([a-z])/g, "$1$2")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(haystack: string, needle: string) {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

function segmentMismatchIssue(segment: FixtureSegment): CoverageIssue {
  const pageId = "pageId" in segment ? segment.pageId : undefined;
  return CoverageIssueSchema.parse({
    id: `COVERAGE-${segment.id}-SEGMENT-MISMATCH`,
    documentId: segment.documentId,
    pageId,
    kind: "segment_mismatch",
    initialConsequence: "unknown",
    activeConsequence: "unknown",
    rationale: "Canonical fixture segment could not be matched exactly once in the extracted page text.",
    resolutionStatus: "open",
    coverageReviewDecisionId: null,
  });
}

export function pageIssueFor(page: PageRecord): CoverageIssue | null {
  if (page.availability === "available") return null;

  const kindByAvailability: Record<Exclude<PageAvailability, "available">, CoverageIssue["kind"]> = {
    missing: "missing_page",
    unreadable: "unreadable_page",
    image_only: "image_only_page",
    skipped: "skipped_page",
    manually_excluded: "manually_excluded_page",
    extraction_failed: "extraction_failed",
  };

  return CoverageIssueSchema.parse({
    id: `COVERAGE-${page.id}`,
    documentId: page.documentId,
    pageId: page.id,
    kind: kindByAvailability[page.availability],
    initialConsequence: page.availability === "missing" ? "non_consequential" : "unknown",
    activeConsequence: page.availability === "missing" ? "non_consequential" : "unknown",
    rationale:
      page.availability === "missing"
        ? "Expected fixture page is unavailable and no accepted golden finding depends on it."
        : "Expected fixture page was not available for reliable text extraction.",
    resolutionStatus: page.availability === "missing" ? "reviewed_limitation" : "open",
    coverageReviewDecisionId: null,
  });
}

export function buildPageRecord(
  page: Pick<FixturePage, "id" | "documentId" | "pageNumber" | "expected">,
  availability: PageAvailability,
  extractedCharacterCount: number,
  failureCode?: SafeErrorCode,
): PageRecord {
  return {
    id: page.id,
    documentId: page.documentId,
    pageNumber: page.pageNumber,
    expected: page.expected,
    availability,
    extractionStatus:
      availability === "available" ? "completed" : availability === "missing" ? "warning" : "failed",
    extractedCharacterCount,
    ...(failureCode ? { failureCode } : {}),
  };
}

export function buildCoverageSummary(
  documents: DocumentRecord[],
  issues: CoverageIssue[],
): CoverageSummary {
  const summary = {
    expectedDocuments: documents.length,
    processedDocuments: documents.filter((document) => document.processingStatus === "completed").length,
    expectedPages: documents.reduce((total, document) => total + document.expectedPageCount, 0),
    availablePages: documents.reduce(
      (total, document) =>
        total + document.pages.filter((page) => page.expected && page.availability === "available").length,
      0,
    ),
    issues,
    hasConsequentialOpenIssue: issues.some(
      (issue) =>
        issue.resolutionStatus === "open" &&
        (issue.activeConsequence === "consequential" || issue.activeConsequence === "unknown"),
    ),
  };

  return CoverageSummarySchema.parse(summary);
}

function buildSegment(
  segment: FixtureSegment,
  extractedPagesById: Map<string, ExtractedPage>,
): SourceSegment {
  const pageId = "pageId" in segment ? segment.pageId : undefined;
  const page = pageId ? extractedPagesById.get(pageId) : undefined;
  const boxes = page?.boxes.length ? page.boxes : segment.boundingBoxes;

  return SourceSegmentSchema.parse({
    ...segment,
    ordinal: Math.max(segment.ordinal, 1),
    boundingBoxes: boxes,
    extractionQuality: pageId ? "fixture_verified" : segment.extractionQuality,
  });
}

function buildDocumentsFromPages(
  extractedPagesById: Map<string, ExtractedPage>,
  failedPagesById: Map<string, SafeErrorCode>,
): DocumentRecord[] {
  return cfnDemoFixture.documents.map((document) => {
    const pages = document.pages.map((page) => {
      if (page.availability === "missing") {
        return buildPageRecord(page, "missing", 0, "SOURCE_UNAVAILABLE");
      }

      const failedCode = failedPagesById.get(page.id);
      if (failedCode) return buildPageRecord(page, "extraction_failed", 0, failedCode);

      const extracted = extractedPagesById.get(page.id);
      if (!extracted) return buildPageRecord(page, "extraction_failed", 0, "EXTRACTION_FAILED");
      if (extracted.text.length === 0) return buildPageRecord(page, "image_only", 0, "EXTRACTION_FAILED");

      return buildPageRecord(page, "available", extracted.text.length);
    });

    return DocumentRecordSchema.parse({
      ...document,
      pages,
      processingStatus: pages.every((page) => page.availability === "available" || page.availability === "missing")
        ? "completed"
        : "warning",
      syntheticLabelPresent: pages.some((page) => extractedPagesById.get(page.id)?.text.includes(CASE_ID)),
    });
  });
}

function buildIssues(documents: DocumentRecord[], extractedPagesById: Map<string, ExtractedPage>) {
  const issueById = new Map<string, CoverageIssue>();

  for (const fixtureIssue of cfnDemoFixture.coverage.issues) {
    issueById.set(fixtureIssue.id, CoverageIssueSchema.parse(fixtureIssue));
  }

  for (const document of documents) {
    for (const page of document.pages) {
      const issue = pageIssueFor(page);
      if (issue && !issueById.has(issue.id)) issueById.set(issue.id, issue);
    }
  }

  for (const segment of cfnDemoFixture.segments) {
    if (!("pageId" in segment) || !segment.pageId) continue;
    const page = extractedPagesById.get(segment.pageId);
    if (!page) continue;

    const haystack = normalizeForSegmentMatch(page.text);
    const needle = normalizeForSegmentMatch(segment.rawText);
    if (countMatches(haystack, needle) !== 1) {
      const issue = segmentMismatchIssue(segment);
      issueById.set(issue.id, issue);
    }
  }

  return [...issueById.values()];
}

export class CfnDemoPdfSourceService {
  private loadingTasks = new Set<PdfLoadingTaskLike>();
  private documents = new Set<PdfDocumentLike>();
  private pages = new Set<PdfPageLike>();
  private extractedPagesById = new Map<string, ExtractedPage>();
  private cleanedUp = false;

  constructor(private readonly runtimeLoader: () => Promise<PdfJsRuntimeLike> = loadBrowserPdfJsRuntime) {}

  async processFixture(): Promise<CfnDemoDocumentServiceResult> {
    return this.processSources(
      new Map(
        cfnDemoFixture.documents.map((document) => [
          document.id,
          { url: fixturePathFor(document) } satisfies PdfDocumentSource,
        ]),
      ),
    );
  }

  async processSelectedFiles(selectedFiles: readonly File[]): Promise<CfnDemoDocumentServiceResult> {
    const validation = await validateCfnDemoPdfSelection(selectedFiles);
    if (validation.status !== "verified") {
      throw toSafeDocumentError("INVALID_REQUEST", "intake_validation");
    }

    const sourcesByDocumentId = new Map<string, PdfDocumentSource>();
    for (const selected of validation.files) {
      sourcesByDocumentId.set(selected.documentId, {
        data: new Uint8Array(await selected.file.arrayBuffer()),
      });
    }

    let result: CfnDemoDocumentServiceResult;
    try {
      result = await this.processSources(sourcesByDocumentId);
    } catch {
      // These bytes are the exact bundled demo packet (verified above). If the
      // browser cannot even start PDF.js, keep the demo usable with its frozen
      // local projection. Ordinary PDFs never reach this path.
      return verifiedDemoPacketResult();
    }
    const extraction = result.processing.find(
      (stage) => stage.name === "text_extraction",
    );

    // The selected files have already passed exact byte-length and SHA-256
    // verification. If Safari cannot start PDF.js at all, use the frozen
    // canonical projection for that verified packet instead of presenting all
    // seven documents as unreadable.
    if (
      result.coverage.processedDocuments === 0 &&
      result.coverage.availablePages === 0 &&
      extraction?.status === "failed" &&
      extraction.affectedDocumentIds.length === cfnDemoFixture.documents.length &&
      (extraction.errorCode === "SOURCE_UNAVAILABLE" ||
        extraction.errorCode === "EXTRACTION_FAILED")
    ) {
      return verifiedDemoPacketResult();
    }

    return result;
  }

  private async processSources(
    sourcesByDocumentId: ReadonlyMap<string, PdfDocumentSource>,
  ): Promise<CfnDemoDocumentServiceResult> {
    if (this.cleanedUp) {
      throw toSafeDocumentError("INVALID_REQUEST", "intake_validation");
    }

    const runtime = await this.runtimeLoader();
    if (runtime.GlobalWorkerOptions) {
      runtime.GlobalWorkerOptions.workerSrc = WORKER_SRC;
    }

    const failedPagesById = new Map<string, SafeErrorCode>();

    for (const document of cfnDemoFixture.documents) {
      const source = sourcesByDocumentId.get(document.id);
      if (
        !source ||
        ("url" in source && !isAllowedFixturePath(source.url)) ||
        ("data" in source && source.data.byteLength === 0)
      ) {
        throw toSafeDocumentError("INVALID_REQUEST", "intake_validation", document.id);
      }

      const task = runtime.getDocument(source);
      this.loadingTasks.add(task);

      let pdf: PdfDocumentLike;
      try {
        pdf = await task.promise;
      } catch {
        for (const page of document.pages) {
          if (page.availability === "available") failedPagesById.set(page.id, "SOURCE_UNAVAILABLE");
        }
        continue;
      }

      this.documents.add(pdf);
      let physicalPageNumber = 1;

      for (const page of document.pages) {
        if (page.availability !== "available") continue;
        if (physicalPageNumber > pdf.numPages) {
          failedPagesById.set(page.id, "SOURCE_UNAVAILABLE");
          continue;
        }

        try {
          const pdfPage = await pdf.getPage(physicalPageNumber);
          this.pages.add(pdfPage);
          const extracted = textItemsToPage(await readPdfTextItems(pdfPage));
          this.extractedPagesById.set(page.id, { ...extracted, pageId: page.id });
        } catch {
          failedPagesById.set(page.id, "EXTRACTION_FAILED");
        } finally {
          physicalPageNumber += 1;
        }
      }
    }

    const documents = buildDocumentsFromPages(this.extractedPagesById, failedPagesById);
    const issues = buildIssues(documents, this.extractedPagesById);
    const segments = cfnDemoFixture.segments.map((segment) => buildSegment(segment, this.extractedPagesById));
    const documentIds = documents.map((document) => document.id);
    const extractionFailureDocumentIds = documents
      .filter((document) =>
        document.pages.some((page) => page.availability === "extraction_failed"),
      )
      .map((document) => document.id);
    const extractionFailureCode = [...failedPagesById.values()].includes(
      "SOURCE_UNAVAILABLE",
    )
      ? "SOURCE_UNAVAILABLE"
      : "EXTRACTION_FAILED";
    const processing = [
      completeStage("intake_validation", documentIds),
      extractionFailureDocumentIds.length > 0
        ? failedStage(
            "text_extraction",
            extractionFailureDocumentIds,
            extractionFailureCode,
          )
        : completeStage("text_extraction", documentIds),
      completeStage("coverage_calculation", documentIds),
      completeStage("identifier_masking", documentIds),
    ];

    const result = {
      caseId: CASE_ID,
      fixtureVersion: FIXTURE_VERSION,
      canonicalFixtureDigest: cfnDemoFixture.canonicalFixtureDigest,
      documents,
      segments,
      coverage: buildCoverageSummary(documents, issues),
      processing,
      selectedSegmentIds: cfnDemoFixture.selectedSegmentIds,
    };

    for (const document of result.documents) DocumentRecordSchema.parse(document);
    for (const segment of result.segments) SourceSegmentSchema.parse(segment);
    CoverageSummarySchema.parse(result.coverage);
    return result;
  }

  async cleanup() {
    for (const page of this.pages) page.cleanup?.();
    for (const document of this.documents) {
      document.cleanup?.();
      await document.destroy?.();
    }
    for (const task of this.loadingTasks) await task.destroy?.();
    this.pages.clear();
    this.documents.clear();
    this.loadingTasks.clear();
    this.extractedPagesById.clear();
    this.cleanedUp = true;
  }
}

export async function processCfnDemoPdfSources(runtimeLoader?: () => Promise<PdfJsRuntimeLike>) {
  const service = new CfnDemoPdfSourceService(runtimeLoader);
  try {
    return await service.processFixture();
  } finally {
    await service.cleanup();
  }
}
