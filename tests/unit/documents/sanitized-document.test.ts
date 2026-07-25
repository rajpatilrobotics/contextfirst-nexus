import { describe, expect, it } from "vitest";
import type {
  DocumentRecord,
  MaskingReview,
  SourceSegment,
} from "../../../lib/contracts";
import { prepareSanitizedTextPacket } from "../../../lib/documents";
import {
  applyLeakScanResult,
  approveMaskingReview,
  createEmptyMaskingReview,
  detectMaskSuggestions,
  reviewMask,
  scanProviderPayload,
} from "../../../lib/redaction";

const CASE_ID = "CFN-CASE-SANITIZED";
const DIGEST = "c".repeat(64);
const SECRET_EMAIL = "private.person@example.test";

function source(rawText = `Contact ${SECRET_EMAIL} for the record.`): SourceSegment {
  return {
    id: "D01-P1-S1",
    documentId: "D01",
    pageId: "D01-P1",
    pageNumber: 1,
    ordinal: 1,
    rawText,
    redactedText: rawText,
    boundingBoxes: [],
    sourceLanguage: "en",
    translationStatus: "original_language",
    extractionQuality: "machine_extracted",
    instructionAdvisory: "no_signal",
    modelVisibility: "not_sent",
    supportEligibility: "candidate_eligible",
  };
}

function document(): DocumentRecord {
  return {
    id: "D01",
    caseId: CASE_ID,
    fixtureVersion: "1.0.0",
    fileName: "private-person-record.pdf",
    displayName: "Private person record",
    sourceType: "other",
    dataOrigin: "browser_local",
    expectedPageCount: 2,
    pages: [
      {
        id: "D01-P1",
        documentId: "D01",
        pageNumber: 1,
        expected: true,
        availability: "available",
        extractionStatus: "completed",
        extractedCharacterCount: 44,
      },
      {
        id: "D01-P2",
        documentId: "D01",
        pageNumber: 2,
        expected: true,
        availability: "image_only",
        extractionStatus: "warning",
        extractedCharacterCount: 0,
      },
    ],
    provenanceStatus: "unverified",
    processingStatus: "warning",
    syntheticLabelPresent: false,
  };
}

function approvedReview(segment: SourceSegment): MaskingReview {
  const [suggestion] = detectMaskSuggestions([segment]);
  if (!suggestion) throw new Error("expected_email_suggestion");
  const reviewed = reviewMask(
    {
      ...createEmptyMaskingReview(),
      suggestions: [suggestion],
    },
    suggestion.id,
    "approved",
    suggestion.replacementToken,
  ).review;
  const approval = approveMaskingReview(reviewed, [segment], "2026-07-25T12:00:00.000Z");
  if (!approval.ok) throw new Error("expected_masking_approval");
  return applyLeakScanResult(
    approval.review,
    scanProviderPayload("Contact [Email masked] for the record."),
  );
}

describe("sanitized text packet", () => {
  it("fails closed until the current masking review and leak scan pass", () => {
    const segment = source();
    const result = prepareSanitizedTextPacket({
      caseId: CASE_ID,
      documentSetDigest: DIGEST,
      documents: [document()],
      segments: [segment],
      masking: createEmptyMaskingReview(),
    });

    expect(result).toEqual({
      ok: false,
      reason: "privacy_review_incomplete",
    });
  });

  it("contains redacted text only and records non-extractable source pages", () => {
    const segment = source();
    const result = prepareSanitizedTextPacket({
      caseId: CASE_ID,
      documentSetDigest: DIGEST,
      documents: [document()],
      segments: [segment],
      masking: approvedReview(segment),
      generatedAt: "2026-07-25T12:30:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const serialized = JSON.stringify(result.packet);
    expect(serialized).toContain("[Email masked]");
    expect(serialized).not.toContain(SECRET_EMAIL);
    expect(serialized).not.toContain("private-person-record.pdf");
    expect(result.packet.documents[0]).toMatchObject({
      documentId: "D01",
      omittedPageNumbers: [2],
    });
  });

  it("rejects segments that do not map to a current packet document", () => {
    const segment = { ...source(), documentId: "D02" };
    const result = prepareSanitizedTextPacket({
      caseId: CASE_ID,
      documentSetDigest: DIGEST,
      documents: [document()],
      segments: [segment],
      masking: approvedReview(segment),
    });

    expect(result).toEqual({ ok: false, reason: "source_mapping_invalid" });
  });
});
