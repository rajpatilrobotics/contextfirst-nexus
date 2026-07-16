import { describe, expect, it } from "vitest";

import { cfnDemoFixture } from "../../../lib/fixtures";
import {
  CfnDemoPdfSourceService,
  buildCoverageSummary,
  buildPageRecord,
  normalizeForSegmentMatch,
  pageIssueFor,
  toSafeDocumentError,
  type PdfDocumentLike,
  type PdfJsRuntimeLike,
} from "../../../lib/documents";
import type { DocumentRecord } from "../../../lib/contracts";

function pageText(pageId: string) {
  const segments = cfnDemoFixture.segments.filter((segment) => "pageId" in segment && segment.pageId === pageId);
  return [`${cfnDemoFixture.caseId} synthetic fixture page ${pageId}`, ...segments.map((segment) => segment.rawText)].join(
    " ",
  );
}

function makeRuntime(overrides: Record<string, string> = {}) {
  const cleanupCalls: string[] = [];
  const destroyedDocuments: string[] = [];
  const destroyedTasks: string[] = [];
  const urls: string[] = [];

  const runtime: PdfJsRuntimeLike = {
    GlobalWorkerOptions: {},
    getDocument({ url }) {
      urls.push(url);
      const documentFixture = cfnDemoFixture.documents.find((document) => url.endsWith(document.fileName));
      if (!documentFixture) throw new Error("unexpected fixture path");

      const availablePages = documentFixture.pages.filter((page) => page.availability === "available");
      const document: PdfDocumentLike = {
        numPages: availablePages.length,
        async getPage(pageNumber) {
          const fixturePage = availablePages[pageNumber - 1];
          return {
            async getTextContent() {
              const text = overrides[fixturePage.id] ?? pageText(fixturePage.id);
              return {
                items: text
                  .split(" ")
                  .filter(Boolean)
                  .map((word, index) => ({
                    str: word,
                    transform: [1, 0, 0, 1, 72 + index, 120],
                    width: Math.max(word.length * 5, 1),
                    height: 10,
                  })),
              };
            },
            cleanup() {
              cleanupCalls.push(fixturePage.id);
            },
          };
        },
        cleanup() {
          cleanupCalls.push(documentFixture.id);
        },
        destroy() {
          destroyedDocuments.push(documentFixture.id);
        },
      };

      return {
        promise: Promise.resolve(document),
        destroy() {
          destroyedTasks.push(documentFixture.id);
        },
      };
    },
  };

  return { runtime, cleanupCalls, destroyedDocuments, destroyedTasks, urls };
}

describe("CfnDemoPdfSourceService", () => {
  it("extracts only the bundled CFN-DEMO-001 fixture and preserves canonical coverage", async () => {
    const fake = makeRuntime();
    const service = new CfnDemoPdfSourceService(async () => fake.runtime);

    const result = await service.processFixture();

    expect(fake.runtime.GlobalWorkerOptions?.workerSrc).toBe("/vendor/pdfjs/pdf.worker.min.mjs");
    expect(fake.urls).toEqual(
      cfnDemoFixture.documents.map((document) => `/fixtures/cfn-demo-001/${document.fileName}`),
    );
    expect(result.caseId).toBe("CFN-DEMO-001");
    expect(result.documents).toHaveLength(7);
    expect(result.segments).toHaveLength(cfnDemoFixture.segments.length);
    expect(result.selectedSegmentIds).toEqual(cfnDemoFixture.selectedSegmentIds);
    expect(result.coverage).toMatchObject({
      expectedDocuments: 7,
      processedDocuments: 7,
      expectedPages: 17,
      availablePages: 16,
      hasConsequentialOpenIssue: false,
    });
    expect(result.coverage.issues).toEqual(cfnDemoFixture.coverage.issues);

    const d04 = result.documents.find((document) => document.id === "D04");
    expect(d04?.pages.map((page) => [page.id, page.availability, page.failureCode])).toEqual([
      ["D04-P1", "available", undefined],
      ["D04-P2", "available", undefined],
      ["D04-P3", "missing", "SOURCE_UNAVAILABLE"],
      ["D04-P4", "available", undefined],
    ]);
    expect(result.segments.find((segment) => segment.id === "D05-META-01")?.pageId).toBeUndefined();
    expect(result.segments.find((segment) => segment.id === "D07-P2-S03")).toMatchObject({
      instructionAdvisory: "human_reviewed",
      modelVisibility: "visible_as_untrusted_content",
      supportEligibility: "evidence_only",
    });

    await service.cleanup();
    await service.cleanup();
    expect(fake.destroyedDocuments).toHaveLength(7);
    expect(fake.destroyedTasks).toHaveLength(7);
    expect(fake.cleanupCalls).toContain("D04-P4");
  });

  it("normalizes PDF line-break hyphenation for segment matching", () => {
    expect(normalizeForSegmentMatch("ser- vice")).toBe(normalizeForSegmentMatch("service"));
  });

  it("fails closed when a canonical segment is missing or duplicated", async () => {
    const duplicate = `${pageText("D01-P1")} ${cfnDemoFixture.segments[0].rawText}`;
    const fake = makeRuntime({ "D01-P1": duplicate, "D01-P2": "blank synthetic page" });
    const service = new CfnDemoPdfSourceService(async () => fake.runtime);

    const result = await service.processFixture();

    expect(result.coverage.hasConsequentialOpenIssue).toBe(true);
    expect(result.coverage.issues.map((issue) => issue.kind)).toContain("segment_mismatch");
    expect(result.coverage.issues.find((issue) => issue.id.includes("D01-P1-S01"))).toMatchObject({
      activeConsequence: "unknown",
      resolutionStatus: "open",
    });
  });

  it("keeps distinct unavailable page states visible in coverage", () => {
    const fixturePage = cfnDemoFixture.documents[0].pages[0];
    const states = [
      "missing",
      "unreadable",
      "image_only",
      "skipped",
      "manually_excluded",
      "extraction_failed",
    ] as const;

    const kinds = states.map((state) =>
      pageIssueFor(buildPageRecord(fixturePage, state, 0, state === "missing" ? "SOURCE_UNAVAILABLE" : "EXTRACTION_FAILED"))
        ?.kind,
    );

    expect(kinds).toEqual([
      "missing_page",
      "unreadable_page",
      "image_only_page",
      "skipped_page",
      "manually_excluded_page",
      "extraction_failed",
    ]);
  });

  it("marks unknown open coverage issues as consequential blockers", () => {
    const baseDocument = cfnDemoFixture.documents[0] as DocumentRecord;
    const issue = pageIssueFor(buildPageRecord(baseDocument.pages[0], "unreadable", 0, "EXTRACTION_FAILED"));

    expect(buildCoverageSummary([baseDocument], issue ? [issue] : []).hasConsequentialOpenIssue).toBe(true);
  });

  it("returns safe errors without source text, paths, bytes, or stacks", () => {
    expect(toSafeDocumentError("SOURCE_UNAVAILABLE", "text_extraction", "D04", "D04-P3")).toEqual({
      code: "SOURCE_UNAVAILABLE",
      stage: "text_extraction",
      documentId: "D04",
      pageId: "D04-P3",
    });
  });
});
