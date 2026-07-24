import { describe, expect, it } from "vitest";

import { buildLocalSourceExtraction } from "../../../lib/analysis/local-source-extraction";
import type {
  DocumentRecord,
  RunInputStateProvenance,
  SourceSegment,
} from "../../../lib/contracts";

const NOW = "2026-07-18T12:00:00.000Z";
const DIGEST = "a".repeat(64);

function document(id: "D01" | "D02", displayName: string): DocumentRecord {
  return {
    id,
    caseId: "CFN-DEMO-001",
    fixtureVersion: "1.0.0",
    fileName: `${id}.pdf`,
    displayName,
    sourceType: "practitioner_note",
    dataOrigin: "bundled_synthetic",
    expectedPageCount: 1,
    pages: [
      {
        id: `${id}-P1`,
        documentId: id,
        pageNumber: 1,
        expected: true,
        availability: "available",
        extractionStatus: "completed",
        extractedCharacterCount: 40,
      },
    ],
    provenanceStatus: "unverified",
    processingStatus: "completed",
    syntheticLabelPresent: false,
  };
}

function segment(
  id: "D01-P1-S1" | "D01-P1-S2" | "D02-P1-S1",
  text: string,
  overrides: Partial<SourceSegment> = {},
): SourceSegment {
  const documentId = id.slice(0, 3) as "D01" | "D02";
  return {
    id,
    documentId,
    pageId: `${documentId}-P1`,
    pageNumber: 1,
    ordinal: Number(id.at(-1)),
    rawText: text,
    redactedText: text,
    boundingBoxes: [],
    sourceLanguage: "en",
    translationStatus: "original_language",
    extractionQuality: "machine_extracted",
    instructionAdvisory: "no_signal",
    modelVisibility: "not_sent",
    supportEligibility: "candidate_eligible",
    ...overrides,
  };
}

function inputState(selectedSegmentIds: string[]): RunInputStateProvenance {
  return {
    sourceCaseRevision: 3,
    canonicalFixtureDigest: DIGEST,
    purposeBriefId: "PURPOSE-CFN-DEMO-001",
    purposeBriefRevision: 1,
    maskingRevision: 1,
    selectedSegmentIds,
    approvedRedactedInputDigest: DIGEST,
  };
}

describe("buildLocalSourceExtraction", () => {
  it("creates stable neutral review items and exact citations without provider transmission", () => {
    const documents = [document("D02", "Second file"), document("D01", "First file")];
    const segments = [
      segment("D02-P1-S1", "Second extracted page."),
      segment("D01-P1-S1", "First extracted page."),
    ];

    const first = buildLocalSourceExtraction(documents, segments, {
      completedAt: NOW,
      inputState: inputState(segments.map((item) => item.id)),
    });
    const second = buildLocalSourceExtraction([...documents].reverse(), [...segments].reverse(), {
      completedAt: NOW,
      inputState: inputState(segments.map((item) => item.id)),
    });

    expect(first).toEqual(second);
    expect(first.candidates.map((candidate) => candidate.id)).toEqual([
      "CAND-LOCAL-D01-P1-S1",
      "CAND-LOCAL-D02-P1-S1",
    ]);
    expect(first.run).toMatchObject({
      status: "succeeded",
      mode: "deterministic_replay",
      provider: {
        providerId: "local_replay",
        adapterVersion: "local-source-extraction-v1",
        providerTransmission: false,
      },
      candidateCount: 2,
      citationCount: 2,
    });

    expect(first.candidates[0]).toMatchObject({
      kind: "review_lane_item",
      itemOrigin: "source_extraction",
      currentTextOrigin: "source_extraction",
      assertionMode: "neutral_procedural_fact",
      reviewRequirement: "individual",
      reviewStatus: "pending",
      consequential: false,
      prohibitedConclusionCheck: "passed",
      safeShareRecipientCategories: [],
    });
    expect(first.candidates[0]?.currentText).toBe(
      "Extracted source text for human review: “First extracted page.”",
    );
    expect(first.citations[0]).toMatchObject({
      id: "CIT-LOCAL-D01-P1-S1",
      segmentId: "D01-P1-S1",
      quotedText: "First extracted page.",
      validationStatus: "exact_match",
      resolutionMethod: "exact_codepoint",
    });
  });

  it("skips unavailable and evidence-only text, deduplicates segments, and applies the cap", () => {
    const documents = [document("D01", "First file")];
    const included = segment("D01-P1-S1", "Readable text.");
    const evidenceOnly = segment("D01-P1-S2", "Instruction-like text.", {
      supportEligibility: "evidence_only",
      instructionAdvisory: "advisory_signal",
    });

    const result = buildLocalSourceExtraction(
      documents,
      [included, included, evidenceOnly],
      {
        completedAt: NOW,
        inputState: inputState([included.id]),
        maxItems: 1,
      },
    );

    expect(result.candidates).toHaveLength(1);
    expect(result.citations).toHaveLength(1);
    expect(result.run.inputSegmentCount).toBe(1);
  });

  it("uses only the candidate-eligible segment IDs bound to the run input", () => {
    const documents = [document("D01", "First file")];
    const selected = segment("D01-P1-S1", "Selected source text.");
    const unselected = segment("D01-P1-S2", "Unselected source text.");

    const result = buildLocalSourceExtraction(documents, [selected, unselected], {
      completedAt: NOW,
      inputState: inputState([selected.id]),
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]?.currentText).toContain("Selected source text.");
    expect(JSON.stringify(result)).not.toContain("Unselected source text.");
  });

  it("fails closed when no grounded readable source can be reviewed", () => {
    const unreadable = segment("D01-P1-S1", "", {
      rawText: "",
      redactedText: "",
      extractionQuality: "unavailable",
    });

    expect(() =>
      buildLocalSourceExtraction([document("D01", "First file")], [unreadable], {
        completedAt: NOW,
        inputState: inputState([unreadable.id]),
      }),
    ).toThrow("at least one readable");
  });

  it("rejects a segment that cannot be traced to an available document", () => {
    const orphan = segment("D02-P1-S1", "Orphan text.");

    expect(() =>
      buildLocalSourceExtraction([document("D01", "First file")], [orphan], {
        completedAt: NOW,
        inputState: inputState([orphan.id]),
      }),
    ).toThrow("does not reference an available document");
  });
});
