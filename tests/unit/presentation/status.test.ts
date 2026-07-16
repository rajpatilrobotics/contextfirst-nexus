import { describe, expect, it } from "vitest";
import {
  CaseStatusSchema,
  EvidenceNatureSchema,
  ItemOriginSchema,
  ReviewStatusSchema,
  StageStatusSchema,
  SupportStatusSchema,
} from "../../../lib/contracts";
import {
  assertPresentationCoverage,
  caseStatusPresentation,
  evidenceNaturePresentation,
  itemOriginPresentation,
  navigationProgressPresentation,
  reviewStatusPresentation,
  supportStatusPresentation,
} from "../../../lib/presentation";

describe("status presentation mappings", () => {
  it("covers every frozen enum value separately", () => {
    expect(assertPresentationCoverage()).toEqual({
      evidenceNature: true,
      itemOrigin: true,
      supportStatus: true,
      reviewStatus: true,
      caseStatus: true,
      stageStatus: true,
    });
    expect(Object.keys(evidenceNaturePresentation)).toEqual(EvidenceNatureSchema.options);
    expect(Object.keys(itemOriginPresentation)).toEqual(ItemOriginSchema.options);
    expect(Object.keys(supportStatusPresentation)).toEqual(SupportStatusSchema.options);
    expect(Object.keys(reviewStatusPresentation)).toEqual(ReviewStatusSchema.options);
    expect(Object.keys(caseStatusPresentation)).toEqual(CaseStatusSchema.options);
    expect(Object.keys(navigationProgressPresentation)).toEqual(StageStatusSchema.options);
  });

  it("uses exact frozen labels for important unknown and failure states", () => {
    expect(supportStatusPresentation.insufficient_evidence.label).toBe("Insufficient evidence");
    expect(supportStatusPresentation.citation_unresolved.label).toBe("Citation unresolved");
    expect(supportStatusPresentation.not_processed.label).toBe("Not processed");
    expect(reviewStatusPresentation.invalidated.label).toBe("Invalidated");
    expect(caseStatusPresentation.blocked.label).toBe("Blocked");
    expect(caseStatusPresentation.processing_failed.label).toBe("Processing failed");
  });

  it("does not use score-like presentation language", () => {
    const allLabels = [
      ...Object.values(evidenceNaturePresentation),
      ...Object.values(itemOriginPresentation),
      ...Object.values(supportStatusPresentation),
      ...Object.values(reviewStatusPresentation),
      ...Object.values(caseStatusPresentation),
    ]
      .flatMap((item) => [item.label, item.description])
      .join(" ")
      .toLowerCase();

    expect(allLabels).not.toMatch(/score|risk rating|traffic light|victim status|guilt|credibility/);
  });
});
