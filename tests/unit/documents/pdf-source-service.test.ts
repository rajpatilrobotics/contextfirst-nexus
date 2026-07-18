import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cfnDemoFixture } from "../../../lib/fixtures";
import {
  CFN_DEMO_PDF_ALLOWLIST,
  CfnDemoPdfSourceService,
  buildCoverageSummary,
  buildPageRecord,
  normalizeForSegmentMatch,
  pageIssueFor,
  toSafeDocumentError,
  validateCfnDemoPdfSelection,
  type PdfDocumentLike,
  type PdfDocumentSource,
  type PdfJsRuntimeLike,
} from "../../../lib/documents";
import type { DocumentRecord } from "../../../lib/contracts";

function makeFile(name: string, bytes: Uint8Array, type = "application/pdf") {
  return {
    name,
    size: bytes.byteLength,
    type,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    },
  } as File;
}

function canonicalPdfFiles() {
  return CFN_DEMO_PDF_ALLOWLIST.map((entry) => {
    const bytes = readFileSync(join(process.cwd(), "public", "fixtures", "cfn-demo-001", entry.fileName));
    return makeFile(entry.fileName, bytes);
  });
}

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
  const inputs: PdfDocumentSource[] = [];
  let inputIndex = 0;

  const runtime: PdfJsRuntimeLike = {
    GlobalWorkerOptions: {},
    getDocument(input) {
      inputs.push(input);
      const documentFixture =
        "url" in input
          ? cfnDemoFixture.documents.find((document) => input.url.endsWith(document.fileName))
          : cfnDemoFixture.documents[inputIndex];
      inputIndex += 1;
      if ("url" in input) urls.push(input.url);
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

  return { runtime, cleanupCalls, destroyedDocuments, destroyedTasks, urls, inputs };
}

describe("CfnDemoPdfSourceService", () => {
  it("verifies the exact seven local PDFs and returns canonical ready states", async () => {
    const validation = await validateCfnDemoPdfSelection(canonicalPdfFiles().reverse());

    expect(validation).toMatchObject({
      status: "verified",
      packetStatus: "success",
      issues: [],
      error: null,
    });
    if (validation.status !== "verified") throw new Error("expected verified fixture files");
    expect(validation.files.map((file) => file.fileName)).toEqual(
      CFN_DEMO_PDF_ALLOWLIST.map((entry) => entry.fileName),
    );
    expect(validation.files.map(({ documentId, byteLength, sha256 }) => ({ documentId, byteLength, sha256 }))).toEqual(
      CFN_DEMO_PDF_ALLOWLIST.map(({ documentId, byteLength, sha256 }) => ({ documentId, byteLength, sha256 })),
    );
    expect(validation.files.every((file) => file.selectionStatus === "selected")).toBe(true);
    expect(validation.files.every((file) => file.verificationStatus === "verified")).toBe(true);
    expect(validation.files.every((file) => file.readinessStatus === "ready")).toBe(true);
  });

  it("rejects incomplete, duplicate, unknown, mistyped, resized, and tampered selections", async () => {
    const canonical = canonicalPdfFiles();
    const incomplete = await validateCfnDemoPdfSelection(canonical.slice(0, -1));
    expect(incomplete).toMatchObject({ status: "rejected", packetStatus: "error" });
    expect(incomplete.issues).toContainEqual({ code: "wrong_file_count" });

    const duplicate = await validateCfnDemoPdfSelection([...canonical.slice(0, -1), canonical[0]]);
    expect(duplicate.issues).toContainEqual({ code: "duplicate_file_name", fileName: canonical[0].name });

    const unknown = await validateCfnDemoPdfSelection([
      ...canonical.slice(0, -1),
      makeFile("other.pdf", new Uint8Array([37, 80, 68, 70, 45])),
    ]);
    expect(unknown.issues).toContainEqual({ code: "unknown_file_name", fileName: "other.pdf" });

    const originalBytes = readFileSync(
      join(process.cwd(), "public", "fixtures", "cfn-demo-001", CFN_DEMO_PDF_ALLOWLIST[0].fileName),
    );
    const wrongType = await validateCfnDemoPdfSelection([
      makeFile(CFN_DEMO_PDF_ALLOWLIST[0].fileName, originalBytes, "text/plain"),
      ...canonical.slice(1),
    ]);
    expect(wrongType.issues).toContainEqual({
      code: "invalid_file_type",
      fileName: CFN_DEMO_PDF_ALLOWLIST[0].fileName,
    });

    const resized = await validateCfnDemoPdfSelection([
      makeFile(CFN_DEMO_PDF_ALLOWLIST[0].fileName, originalBytes.subarray(0, -1)),
      ...canonical.slice(1),
    ]);
    expect(resized.issues).toContainEqual({
      code: "invalid_file_size",
      fileName: CFN_DEMO_PDF_ALLOWLIST[0].fileName,
    });

    const invalidHeaderBytes = Uint8Array.from(originalBytes);
    invalidHeaderBytes.set([78, 79, 84, 80, 68], 0);
    const invalidHeader = await validateCfnDemoPdfSelection([
      makeFile(CFN_DEMO_PDF_ALLOWLIST[0].fileName, invalidHeaderBytes),
      ...canonical.slice(1),
    ]);
    expect(invalidHeader.issues).toContainEqual({
      code: "invalid_pdf_header",
      fileName: CFN_DEMO_PDF_ALLOWLIST[0].fileName,
    });

    const tamperedBytes = Uint8Array.from(originalBytes);
    tamperedBytes[tamperedBytes.length - 1] ^= 1;
    const tampered = await validateCfnDemoPdfSelection([
      makeFile(CFN_DEMO_PDF_ALLOWLIST[0].fileName, tamperedBytes),
      ...canonical.slice(1),
    ]);
    expect(tampered.issues).toContainEqual({
      code: "digest_mismatch",
      fileName: CFN_DEMO_PDF_ALLOWLIST[0].fileName,
    });
  });

  it("processes verified browser-local PDF bytes without object URLs", async () => {
    const fake = makeRuntime();
    const service = new CfnDemoPdfSourceService(async () => fake.runtime);
    const result = await service.processSelectedFiles(canonicalPdfFiles());

    expect(fake.urls).toEqual([]);
    expect(fake.inputs).toHaveLength(7);
    expect(fake.inputs.every((input) => "data" in input && input.data.byteLength > 0)).toBe(true);
    expect(result.coverage).toMatchObject({ expectedPages: 17, availablePages: 16 });
    expect(result.documents.find((document) => document.id === "D04")?.pages).toMatchObject([
      { id: "D04-P1", availability: "available" },
      { id: "D04-P2", availability: "available" },
      { id: "D04-P3", availability: "missing", failureCode: "SOURCE_UNAVAILABLE" },
      { id: "D04-P4", availability: "available" },
    ]);

    await service.cleanup();
  });

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
