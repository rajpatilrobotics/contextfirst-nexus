import { describe, expect, it } from "vitest";

import { trustedPurposeBrief } from "../../../lib/analysis/replay";
import type {
  CaseCommand,
  CaseState,
  LocalDocumentProcessingResult,
  ProcessingStage,
  SourceSegment,
} from "../../../lib/contracts";
import {
  applyCaseCommand,
  createInitialCaseState,
} from "../../../lib/state";

const NOW = "2026-07-18T12:00:00.000Z";
const DIGEST = "a".repeat(64);
const SEGMENT_ID = "D01-P1-S1";

function meta(state: CaseState, id: string): CaseCommand["meta"] {
  return {
    commandId: `cmd-${id}`,
    idempotencyKey: `idem-${id}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt: NOW,
  };
}

function applyOk(state: CaseState, command: CaseCommand) {
  const result = applyCaseCommand(state, command);
  expect(result.ok, result.ok ? undefined : result.reason).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

function processingStages(): ProcessingStage[] {
  return [
    "intake_validation",
    "text_extraction",
    "coverage_calculation",
    "identifier_masking",
  ].map((name) => ({
    name: name as ProcessingStage["name"],
    status: "completed" as const,
    affectedDocumentIds: ["D01"],
    retryable: false,
  }));
}

function localResult(
  rawText: string,
  supportEligibility: SourceSegment["supportEligibility"] = "candidate_eligible",
): LocalDocumentProcessingResult {
  return {
    caseId: "CFN-DEMO-001",
    fixtureVersion: "1.0.0",
    documentSetDigest: DIGEST,
    documents: [
      {
        id: "D01",
        caseId: "CFN-DEMO-001",
        fixtureVersion: "1.0.0",
        fileName: "local-note.pdf",
        displayName: "Local note",
        sourceType: "other",
        dataOrigin: "browser_local",
        expectedPageCount: 1,
        pages: [
          {
            id: "D01-P1",
            documentId: "D01",
            pageNumber: 1,
            expected: true,
            availability: "available",
            extractionStatus: "completed",
            extractedCharacterCount: rawText.length,
          },
        ],
        provenanceStatus: "unverified",
        processingStatus: "completed",
        syntheticLabelPresent: false,
      },
    ],
    segments: [
      {
        id: SEGMENT_ID,
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
        instructionAdvisory:
          supportEligibility === "candidate_eligible"
            ? "no_signal"
            : "advisory_signal",
        modelVisibility: "not_sent",
        supportEligibility,
      },
    ],
    coverage: {
      expectedDocuments: 1,
      processedDocuments: 1,
      expectedPages: 1,
      availablePages: 1,
      issues: [],
      hasConsequentialOpenIssue: false,
    },
    processing: processingStages(),
    selectedSegmentIds:
      supportEligibility === "candidate_eligible" ? [SEGMENT_ID] : [],
  };
}

function prepareLocalState(rawText: string) {
  let state = createInitialCaseState(NOW);
  state = applyOk(state, {
    type: "save_purpose",
    meta: meta(state, "purpose"),
    purposeBrief: trustedPurposeBrief(),
  });
  state = applyOk(state, {
    type: "complete_local_document_processing",
    meta: meta(state, "local-processing"),
    result: localResult(rawText),
  });
  return applyOk(state, {
    type: "refresh_mask_suggestions",
    meta: meta(state, "refresh-masks"),
    sensitiveTerms: [],
  });
}

describe("browser-local masking", () => {
  it("materializes approved masks, retains a failed leak scan, and emits only redacted candidate text", () => {
    const firstEmail = "first@example.test";
    const secondEmail = "second@example.test";
    const rawText = `Contact ${firstEmail} or ${secondEmail}.`;
    let state = prepareLocalState(rawText);

    expect(state.masking.suggestions).toHaveLength(2);
    const [firstMask, secondMask] = state.masking.suggestions;
    if (!firstMask || !secondMask) throw new Error("expected two email masks");

    state = applyOk(state, {
      type: "remove_mask_suggestion",
      meta: meta(state, "remove-second-mask"),
      maskId: secondMask.id,
    });
    state = applyOk(state, {
      type: "review_mask",
      meta: meta(state, "approve-first-mask"),
      maskId: firstMask.id,
      reviewStatus: "approved",
      replacementToken: firstMask.replacementToken,
    });
    state = applyOk(state, {
      type: "complete_mask_review",
      meta: meta(state, "complete-with-leak"),
    });

    expect(state.masking).toMatchObject({
      reviewStatus: "approved",
      leakScanStatus: "failed",
      failedClasses: ["email"],
    });
    expect(state.segments[0].redactedText).toContain("[Email masked]");
    expect(state.segments[0].redactedText).not.toContain(firstEmail);
    expect(state.segments[0].redactedText).toContain(secondEmail);

    state = applyOk(state, {
      type: "add_mask_suggestion",
      meta: meta(state, "restore-second-mask"),
      input: {
        segmentId: SEGMENT_ID,
        originalStart: rawText.indexOf(secondEmail),
        originalEnd: rawText.indexOf(secondEmail) + secondEmail.length,
        maskClass: "email",
        replacementToken: "[Email masked]",
      },
    });
    const restoredMask = state.masking.suggestions.find(
      (suggestion) => suggestion.originalStart === rawText.indexOf(secondEmail),
    );
    if (!restoredMask) throw new Error("restored mask missing");
    state = applyOk(state, {
      type: "review_mask",
      meta: meta(state, "approve-restored-mask"),
      maskId: restoredMask.id,
      reviewStatus: "approved",
      replacementToken: restoredMask.replacementToken,
    });
    state = applyOk(state, {
      type: "complete_mask_review",
      meta: meta(state, "complete-without-leak"),
    });

    expect(state.masking.leakScanStatus).toBe("passed");
    expect(state.segments[0].redactedText).not.toContain(firstEmail);
    expect(state.segments[0].redactedText).not.toContain(secondEmail);

    state = applyOk(state, {
      type: "run_local_source_extraction",
      meta: meta(state, "run-local-extraction"),
    });
    expect(state.candidates).toHaveLength(1);
    expect(state.citations).toHaveLength(1);
    expect(state.candidates[0].currentText).toContain("[Email masked]");
    expect(state.citations[0].quotedText).toBe(state.segments[0].redactedText);
    expect(JSON.stringify([state.candidates, state.citations])).not.toContain(
      "@example.test",
    );
  });

  it("allows a processed segment with no suggestions to complete the deterministic scan", () => {
    let state = prepareLocalState("General planning notes without personal details.");

    expect(state.masking.suggestions).toEqual([]);
    state = applyOk(state, {
      type: "complete_mask_review",
      meta: meta(state, "complete-zero-suggestion-review"),
    });

    expect(state.masking).toMatchObject({
      reviewStatus: "approved",
      leakScanStatus: "passed",
      failedClasses: [],
    });
  });
});
