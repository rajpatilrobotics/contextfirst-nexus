import {
  CoverageIssueSchema,
  CoverageSummarySchema,
  DocumentRecordSchema,
  SourceSegmentSchema,
  type CoverageSummary,
  type DocumentRecord,
  type ProcessingStage,
  type SafeErrorCode,
  type SourceSegment,
} from "../contracts";
import { cfnDemoFixture } from "../fixtures";

const CASE_ID = "CFN-DEMO-001" as const;
const WORKER_SRC = "/vendor/pdfjs/pdf.worker.min.mjs" as const;
const FIXTURE_BASE_PATH = "/fixtures/cfn-demo-001/" as const;
const FIXTURE_VERSION = "1.0.0" as const;

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
  | { data: Uint8Array };

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

  const pdfJsModule = "pdfjs-dist/build/pdf.mjs";
  const pdfjs = (await import(/* @vite-ignore */ pdfJsModule)) as PdfJsRuntimeLike;
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  }
  return pdfjs;
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

    return this.processSources(sourcesByDocumentId);
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
          const extracted = textItemsToPage((await pdfPage.getTextContent()).items);
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
    const processing = [
      completeStage("intake_validation", documentIds),
      completeStage("text_extraction", documentIds),
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
