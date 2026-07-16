import { describe, expect, it } from "vitest";
import type { MaskingReview, SourceSegment } from "../../../lib/contracts";
import {
  DEFAULT_REPLACEMENT_TOKENS,
  SUPPORTED_MASK_CLASSES,
  addMaskSuggestion,
  applyLeakScanResult,
  approveMaskingReview,
  buildRedactedSegments,
  buildSegmentRedaction,
  createEmptyMaskingReview,
  detectMaskSuggestions,
  makeManualSuggestion,
  mapOriginalOffsetToRedacted,
  mapRedactedOffsetToOriginal,
  removeMaskSuggestion,
  reviewMask,
  scanProviderPayload,
  scanSafeShare,
  validateTransmissionReadiness,
} from "../../../lib/redaction";

function segment(id: string, rawText: string): Pick<SourceSegment, "id" | "rawText"> {
  return { id, rawText };
}

function reviewWithSuggestions(suggestions: MaskingReview["suggestions"]): MaskingReview {
  return {
    ...createEmptyMaskingReview(),
    suggestions,
  };
}

function approveAll(suggestions: MaskingReview["suggestions"]): MaskingReview["suggestions"] {
  return suggestions.map((suggestion) => ({ ...suggestion, reviewStatus: "approved" }));
}

describe("redaction detection", () => {
  it("detects the exact supported seeded classes with stable ranges and readable tokens", () => {
    const rawText =
      "Maya K. emailed maya.k@example.test, called +1 202-555-0147, used passport X0000007, account 000123456789, address 18 Example Lane, Sample City, and DOB 1997-08-14.";
    const source = segment("D01-P1-S01", rawText);

    const suggestions = detectMaskSuggestions([source], { sensitiveTerms: ["Maya K."] });

    expect(SUPPORTED_MASK_CLASSES).toEqual([
      "person_name",
      "email",
      "phone",
      "passport",
      "bank_account",
      "address",
      "date_of_birth",
    ]);
    expect(suggestions.map((suggestion) => suggestion.maskClass).sort()).toEqual([
      "address",
      "bank_account",
      "date_of_birth",
      "email",
      "passport",
      "person_name",
      "phone",
    ]);

    for (const suggestion of suggestions) {
      const original = rawText.slice(suggestion.originalStart, suggestion.originalEnd);
      expect(suggestion.reviewStatus).toBe("pending");
      expect(suggestion.replacementToken).toBe(DEFAULT_REPLACEMENT_TOKENS[suggestion.maskClass]);
      expect(suggestion.id).toBe(
        `mask-${source.id}-${suggestion.maskClass}-${suggestion.originalStart}-${suggestion.originalEnd}`,
      );
      expect(suggestion.redactedEnd - suggestion.redactedStart).toBe(
        suggestion.replacementToken.length,
      );
      expect(original.length).toBeGreaterThan(0);
    }

    expect(
      suggestions.find((suggestion) => suggestion.maskClass === "person_name")?.detectionMethod,
    ).toBe("sensitive_term_list");
    expect(suggestions.find((suggestion) => suggestion.maskClass === "email")).toMatchObject({
      originalStart: rawText.indexOf("maya.k@example.test"),
      originalEnd: rawText.indexOf("maya.k@example.test") + "maya.k@example.test".length,
    });
  });

  it("does not claim person-name detection without supplied sensitive terms", () => {
    const suggestions = detectMaskSuggestions([segment("D01-P1-S01", "Maya K. wrote a note.")]);

    expect(suggestions.some((suggestion) => suggestion.maskClass === "person_name")).toBe(false);
  });

  it("avoids near-match and ordinary-date classification outside the declared support", () => {
    const suggestions = detectMaskSuggestions([
      segment(
        "D01-P1-S01",
        "Near matches maya.k@example, X000000, 2025550147, 123456789, and event date 2025-03-14.",
      ),
    ]);

    expect(suggestions).toEqual([]);
  });
});

describe("review, approval, and invalidation", () => {
  it("blocks pending, rejected, invalid, overlapping, and unsafe masks", () => {
    const source = segment("D01-P1-S01", "Maya K. and Maya K. share one line.");
    const detected = detectMaskSuggestions([source], { sensitiveTerms: ["Maya K."] });

    expect(approveMaskingReview(reviewWithSuggestions(detected), [source])).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "pending_mask" })]),
    });

    const rejected = [{ ...detected[0]!, reviewStatus: "rejected" as const }];
    expect(approveMaskingReview(reviewWithSuggestions(rejected), [source])).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "rejected_mask" })]),
    });

    const invalid = makeManualSuggestion({
      segmentId: source.id,
      originalStart: 8,
      originalEnd: 3,
      maskClass: "person_name",
      reviewStatus: "approved",
    });
    expect(approveMaskingReview(reviewWithSuggestions([invalid]), [source])).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "invalid_range" })]),
    });

    const overlapping = [
      makeManualSuggestion({
        segmentId: source.id,
        originalStart: 0,
        originalEnd: 7,
        maskClass: "person_name",
        reviewStatus: "approved",
      }),
      makeManualSuggestion({
        segmentId: source.id,
        originalStart: 5,
        originalEnd: 12,
        maskClass: "person_name",
        reviewStatus: "approved",
      }),
    ];
    expect(approveMaskingReview(reviewWithSuggestions(overlapping), [source])).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "overlapping_masks" })]),
    });

    const unsafe = [
      makeManualSuggestion({
        segmentId: source.id,
        originalStart: 0,
        originalEnd: 7,
        maskClass: "person_name",
        replacementToken: "Maya K.",
        reviewStatus: "approved",
      }),
    ];
    expect(approveMaskingReview(reviewWithSuggestions(unsafe), [source])).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "unsafe_replacement_token" }),
      ]),
    });
  });

  it("invalidates approval and returns stale downstream signals after mask changes", () => {
    const source = segment("D01-P1-S01", "Maya K. wrote a note.");
    const [suggestion] = approveAll(
      detectMaskSuggestions([source], { sensitiveTerms: ["Maya K."] }),
    );
    const approved = approveMaskingReview(reviewWithSuggestions([suggestion!]), [source]);

    expect(approved.ok).toBe(true);
    if (!approved.ok) {
      return;
    }

    const edited = reviewMask(
      approved.review,
      suggestion!.id,
      "edited",
      "[Person name masked 2]",
    );
    expect(edited.review.reviewStatus).toBe("invalidated");
    expect(edited.review.revision).toBe(1);
    expect(edited.review.leakScanStatus).toBe("not_run");
    expect(edited.invalidation).toEqual({
      maskingRevisionDelta: 1,
      caseRevisionDelta: 1,
      staleAnalysis: true,
      staleExport: true,
      staleGate: true,
    });

    const added = addMaskSuggestion(edited.review, {
      ...suggestion!,
      id: `${suggestion!.id}-manual`,
      originalStart: 8,
      originalEnd: 13,
    });
    expect(added.review.revision).toBe(2);

    const removed = removeMaskSuggestion(added.review, `${suggestion!.id}-manual`);
    expect(removed.review.revision).toBe(3);
  });
});

describe("redacted derivatives and browser-local mapping", () => {
  it("creates a derivative, preserves source text, and maps before, inside, and after replacements", () => {
    const rawText = "A Maya K. B X0000007 C";
    const source = segment("D01-P1-S01", rawText);
    const approvedSuggestions = approveAll(
      detectMaskSuggestions([source], { sensitiveTerms: ["Maya K."] }),
    );

    const redacted = buildSegmentRedaction(source, approvedSuggestions);

    expect(source.rawText).toBe(rawText);
    expect(redacted.rawText).toBe(rawText);
    expect(redacted.redactedText).toBe("A [Person name masked] B [Passport masked] C");
    expect(redacted.map.entries).toHaveLength(2);

    expect(mapOriginalOffsetToRedacted(redacted.map, 1)).toEqual({ kind: "point", offset: 1 });
    expect(mapOriginalOffsetToRedacted(redacted.map, 4)).toEqual({
      kind: "masked",
      maskId: approvedSuggestions[0]!.id,
      range: redacted.map.entries[0]!.redactedRange,
    });
    expect(mapOriginalOffsetToRedacted(redacted.map, rawText.length)).toEqual({
      kind: "point",
      offset: redacted.redactedText.length,
    });

    expect(mapRedactedOffsetToOriginal(redacted.map, 1)).toEqual({ kind: "point", offset: 1 });
    expect(mapRedactedOffsetToOriginal(redacted.map, 5)).toEqual({
      kind: "masked",
      maskId: approvedSuggestions[0]!.id,
      range: redacted.map.entries[0]!.originalRange,
    });
    expect(mapRedactedOffsetToOriginal(redacted.map, redacted.redactedText.length)).toEqual({
      kind: "point",
      offset: rawText.length,
    });
  });

  it("handles repeated masks deterministically", () => {
    const source = segment("D01-P1-S01", "Maya K. called Maya K.");
    const approvedSuggestions = approveAll(
      detectMaskSuggestions([source], { sensitiveTerms: ["Maya K."] }),
    );

    const redacted = buildSegmentRedaction(source, approvedSuggestions);

    expect(approvedSuggestions.map((suggestion) => suggestion.originalStart)).toEqual([0, 15]);
    expect(redacted.redactedText).toBe(
      "[Person name masked] called [Person name masked]",
    );
  });

  it("requires approved review and passed leak scan before provider/export derivative build", () => {
    const source = segment("D01-P1-S01", "Maya K. emailed maya.k@example.test.");
    const approvedSuggestions = approveAll(
      detectMaskSuggestions([source], { sensitiveTerms: ["Maya K."] }),
    );
    const approved = approveMaskingReview(reviewWithSuggestions(approvedSuggestions), [source]);

    expect(approved.ok).toBe(true);
    if (!approved.ok) {
      return;
    }

    expect(validateTransmissionReadiness(approved.review, [source])).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([expect.objectContaining({ code: "leak_scan_not_passed" })]),
    });

    const preview = buildSegmentRedaction(source, approvedSuggestions);
    const scan = scanProviderPayload(preview.redactedText, { sensitiveTerms: ["Maya K."] });
    const passedReview = applyLeakScanResult(approved.review, scan);
    const result = buildRedactedSegments([source], passedReview);

    expect(scan).toMatchObject({ ok: true, failedClasses: [] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.segments[0]!.redactedText).toBe(
        "[Person name masked] emailed [Email masked].",
      );
    }
  });
});

describe("provider and safe-share leak scans", () => {
  it("returns safe class and range metadata without echoing leaked values", () => {
    const leakedText =
      "Provider payload still includes Maya K., maya.k@example.test, +1 202-555-0147, X0000007, 000123456789, 18 Example Lane, Sample City, and 1997-08-14.";

    const result = scanProviderPayload(leakedText, { sensitiveTerms: ["Maya K."] });

    expect(result.ok).toBe(false);
    expect(result.failedClasses).toEqual([
      "person_name",
      "email",
      "phone",
      "passport",
      "bank_account",
      "address",
      "date_of_birth",
    ]);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          checkName: "provider_payload",
          checkKind: "sensitive_term_list",
          maskClass: "person_name",
          range: {
            start: leakedText.indexOf("Maya K."),
            end: leakedText.indexOf("Maya K.") + "Maya K.".length,
          },
        }),
      ]),
    );

    const safeFailure = JSON.stringify(result);
    expect(safeFailure).not.toContain("Maya K.");
    expect(safeFailure).not.toContain("maya.k@example.test");
    expect(safeFailure).not.toContain("+1 202-555-0147");
    expect(safeFailure).not.toContain("X0000007");
    expect(safeFailure).not.toContain("000123456789");
    expect(safeFailure).not.toContain("18 Example Lane, Sample City");
    expect(safeFailure).not.toContain("1997-08-14");
  });

  it("keeps provider and safe-share scans separate and supports policy literals without a new mask class", () => {
    const redactedText = "[Person name masked] emailed [Email masked].";

    expect(scanProviderPayload(redactedText, { sensitiveTerms: ["Maya K."] })).toEqual({
      ok: true,
      checkName: "provider_payload",
      leakScanStatus: "passed",
      failedClasses: [],
      findings: [],
    });

    const safeShare = scanSafeShare("Case CFN-DEMO-001 is ready.", {
      policyDisallowedLiterals: ["CFN-DEMO-001"],
    });

    expect(safeShare).toMatchObject({
      ok: false,
      checkName: "safe_share",
      leakScanStatus: "failed",
      failedClasses: [],
      findings: [
        expect.objectContaining({
          checkKind: "policy_disallowed_literal",
        }),
      ],
    });
    expect(safeShare.findings[0]).not.toHaveProperty("maskClass");
    expect(JSON.stringify(safeShare)).not.toContain("CFN-DEMO-001");
  });
});
