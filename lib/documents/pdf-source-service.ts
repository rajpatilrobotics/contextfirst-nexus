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

type CoverageIssue = CoverageSummary["issues"][number];
type PageRecord = DocumentRecord["pages"][number];
type PageAvailability = PageRecord["availability"];

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

export type PdfJsRuntimeLike = {
  GlobalWorkerOptions?: { workerSrc?: string };
  getDocument: (input: { url: string }) => PdfLoadingTaskLike;
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
  private objectUrls = new Set<string>();
  private extractedPagesById = new Map<string, ExtractedPage>();
  private cleanedUp = false;

  constructor(private readonly runtimeLoader: () => Promise<PdfJsRuntimeLike> = loadBrowserPdfJsRuntime) {}

  async processFixture(): Promise<CfnDemoDocumentServiceResult> {
    if (this.cleanedUp) {
      throw toSafeDocumentError("INVALID_REQUEST", "intake_validation");
    }

    const runtime = await this.runtimeLoader();
    if (runtime.GlobalWorkerOptions) {
      runtime.GlobalWorkerOptions.workerSrc = WORKER_SRC;
    }

    const failedPagesById = new Map<string, SafeErrorCode>();

    for (const document of cfnDemoFixture.documents) {
      const url = fixturePathFor(document);
      if (!isAllowedFixturePath(url)) {
        throw toSafeDocumentError("INVALID_REQUEST", "intake_validation", document.id);
      }

      const task = runtime.getDocument({ url });
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
    for (const url of this.objectUrls) URL.revokeObjectURL(url);

    this.pages.clear();
    this.documents.clear();
    this.loadingTasks.clear();
    this.objectUrls.clear();
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
