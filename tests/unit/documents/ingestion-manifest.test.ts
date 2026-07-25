import { describe, expect, it } from "vitest";
import type { DocumentRecord, SourceSegment } from "../../../lib/contracts";
import {
  buildDocumentIngestionManifest,
  createSafeIntegrityReport,
} from "../../../lib/documents";
import { createEmptyMaskingReview } from "../../../lib/redaction";

function document(id: string, fileName: string): DocumentRecord {
  return {
    id,
    caseId: "CFN-CASE-INTEGRITY",
    fixtureVersion: "1.0.0",
    fileName,
    displayName: fileName,
    sourceType: "other",
    dataOrigin: "browser_local",
    expectedPageCount: 1,
    pages: [
      {
        id: `${id}-P1`,
        documentId: id,
        pageNumber: 1,
        expected: true,
        availability: "available",
        extractionStatus: "completed",
        extractedCharacterCount: 80,
      },
    ],
    provenanceStatus: "unverified",
    processingStatus: "completed",
    syntheticLabelPresent: false,
  };
}

function segment(
  documentId: string,
  text: string,
): SourceSegment {
  return {
    id: `${documentId}-P1-S1`,
    documentId,
    pageId: `${documentId}-P1`,
    pageNumber: 1,
    ordinal: 1,
    rawText: text,
    redactedText: text,
    boundingBoxes: [],
    sourceLanguage: "en",
    translationStatus: "original_language",
    extractionQuality: "machine_extracted",
    instructionAdvisory: "no_signal",
    modelVisibility: "not_sent",
    supportEligibility: "candidate_eligible",
  };
}

describe("browser-local ingestion manifest", () => {
  it("reports exact files/pages without placing source text in the report", async () => {
    const secret = "UNIQUE-PRIVATE-SOURCE-TEXT";
    const repeated = `${secret} repeated source paragraph with enough tokens for deterministic page matching`;
    const manifest = await buildDocumentIngestionManifest({
      documents: [document("D01", "one.pdf"), document("D02", "two.pdf")],
      fileMetadata: [
        {
          documentId: "D01",
          fileName: "one.pdf",
          byteLength: 120,
          sha256: "a".repeat(64),
        },
        {
          documentId: "D02",
          fileName: "two.pdf",
          byteLength: 120,
          sha256: "a".repeat(64),
        },
      ],
      segments: [segment("D01", repeated), segment("D02", repeated)],
      generatedAt: "2026-07-25T12:00:00.000Z",
    });

    expect(manifest.summary).toMatchObject({
      exactFileGroupCount: 1,
      exactPageGroupCount: 1,
    });
    const report = createSafeIntegrityReport({
      caseId: "CFN-CASE-INTEGRITY",
      documentSetDigest: "d".repeat(64),
      manifest,
      masking: createEmptyMaskingReview(),
    });
    expect(JSON.stringify(report)).not.toContain(secret);
    expect(report.exclusions).toContain("OCR text");
  });

  it("flags high-overlap pages as advisory near duplicates", async () => {
    const common =
      "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron";
    const manifest = await buildDocumentIngestionManifest({
      documents: [document("D01", "one.pdf"), document("D02", "two.pdf")],
      fileMetadata: [
        {
          documentId: "D01",
          fileName: "one.pdf",
          byteLength: 120,
          sha256: "a".repeat(64),
        },
        {
          documentId: "D02",
          fileName: "two.pdf",
          byteLength: 130,
          sha256: "b".repeat(64),
        },
      ],
      segments: [
        segment("D01", `${common} first`),
        segment("D02", `${common} second`),
      ],
    });

    expect(
      manifest.duplicates.some(
        (duplicate) => duplicate.kind === "near_duplicate_page",
      ),
    ).toBe(true);
  });
});
