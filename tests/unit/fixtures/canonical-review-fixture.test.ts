import { describe, expect, it } from "vitest";

import { CFN_DEMO_FIXTURE_BINDING } from "../../../lib/ai/server/types";
import {
  cfnDemoEvaluationDefinitions,
  cfnDemoFixture,
  getCfnDemoCandidateDefinition,
} from "../../../lib/fixtures";

const candidateIds = [
  "CAND-TL-ARRIVAL",
  "CAND-CTRL-PASSPORT",
  "CAND-CTRL-CONFINEMENT",
  "CAND-PROV-TASKLOG",
  "CAND-TASK-0402",
  "CAND-SENDER-0402",
  "CAND-URG-INTERPRETER",
  "CAND-META-COOPERATION",
  "NEXUS-RECRUITMENT",
  "NEXUS-MOVEMENT",
  "NEXUS-CONTROL",
  "NEXUS-COMPELLED-TASKS",
  "NEXUS-OFFENCE-TIMING",
  "NEXUS-URGENCY",
] as const;

const sourceDependencyIds = (candidateId: string) =>
  getCfnDemoCandidateDefinition(candidateId)?.dependencies
    .filter((dependency) => dependency.kind === "source")
    .map((dependency) => dependency.segmentId) ?? [];

describe("TASK-028 canonical review fixture", () => {
  it("contains the exact ordered 14-candidate set without legacy aliases", () => {
    const actual = cfnDemoFixture.reviewDefinitions.candidateDefinitions.map((candidate) => candidate.id);
    expect(actual).toEqual(candidateIds);
    expect(new Set(actual).size).toBe(14);
    expect(actual).not.toEqual(expect.arrayContaining([
      "CAND-RECRUITMENT-OFFER",
      "CAND-PASSPORT-DEBT",
      "CAND-REPORTED-CONTROL",
      "CAND-ALLEGED-0402",
      "CAND-URG-HEARING",
    ]));
  });

  it("keeps the documented D03 arrival distinct from the reported D04 worksite arrival", () => {
    const arrival = cfnDemoFixture.reviewDefinitions.timelineDefinitions.find(
      (item) => item.candidateId === "CAND-TL-ARRIVAL",
    );
    const passport = cfnDemoFixture.reviewDefinitions.timelineDefinitions.find(
      (item) => item.candidateId === "CAND-CTRL-PASSPORT",
    );
    expect(arrival).toMatchObject({
      dateStart: "2025-03-12",
      datePrecision: "day",
      locationLabel: "Jurisdiction J-02",
      conflictGroupId: null,
    });
    expect(passport).toMatchObject({
      dateStart: "2025-03-15",
      datePrecision: "approximate",
      locationLabel: "Reported worksite",
      conflictGroupId: null,
    });
    expect(passport?.qualification).toContain("clarification question");

    expect(getCfnDemoCandidateDefinition("CAND-TL-ARRIVAL")?.dependencies).toMatchObject([
      { segmentId: "D03-P1-S02", evidenceNature: "documented_in_source" },
    ]);
    expect(getCfnDemoCandidateDefinition("CAND-CTRL-PASSPORT")?.dependencies).toMatchObject([
      { segmentId: "D04-P1-S03", evidenceNature: "reported_or_alleged_in_source" },
      { segmentId: "D02-P2-S02", evidenceNature: "documented_in_source" },
    ]);
  });

  it("preserves the eight stable candidate semantics and required actions", () => {
    const expected = {
      "CAND-TL-ARRIVAL": ["ai_suggestion", "neutral_procedural_fact", "exact_source_supported", "accept"],
      "CAND-CTRL-PASSPORT": ["ai_suggestion", "positive_proposition", "partially_supported", "edit_to_preserve_reported_and_documented_sources"],
      "CAND-CTRL-CONFINEMENT": ["ai_suggestion", "positive_proposition", "insufficient_evidence", "reject"],
      "CAND-PROV-TASKLOG": ["ai_suggestion", "positive_proposition", "insufficient_evidence", "mark_uncertain"],
      "CAND-TASK-0402": ["ai_suggestion", "positive_proposition", "exact_source_supported", "accept_then_withdraw_during_hero_interaction"],
      "CAND-SENDER-0402": ["ai_suggestion", "positive_proposition", "insufficient_evidence", "reject"],
      "CAND-URG-INTERPRETER": ["ai_suggestion", "unknown_state", "exact_source_supported", "confirm_unknown"],
      "CAND-META-COOPERATION": ["source_extraction", "unknown_state", "exact_source_supported", "confirm_unknown_without_changing_analysis"],
    } as const;

    for (const [id, semantics] of Object.entries(expected)) {
      const candidate = getCfnDemoCandidateDefinition(id);
      expect(candidate).not.toBeNull();
      expect([
        candidate?.itemOrigin,
        candidate?.assertionMode,
        candidate?.supportStatus,
        candidate?.requiredHumanAction,
      ]).toEqual(semantics);
      expect(candidate?.reviewStatus).toBe("pending");
    }
    expect(getCfnDemoCandidateDefinition("CAND-CTRL-CONFINEMENT")?.text).toBe(
      "Physical confinement is independently confirmed.",
    );
    expect(getCfnDemoCandidateDefinition("CAND-SENDER-0402")?.text).toBe(
      "Maya sent the specific communication alleged on 2025-04-02.",
    );
  });

  it("restores canonical Nexus sources and the derived withdrawal edges", () => {
    expect(sourceDependencyIds("NEXUS-RECRUITMENT")).toEqual(["D01-P1-S01", "D01-P2-S02", "D02-P1-S04"]);
    expect(sourceDependencyIds("NEXUS-MOVEMENT")).toEqual(["D03-P1-S02", "D03-P2-S01"]);
    expect(sourceDependencyIds("NEXUS-CONTROL")).toEqual([
      "D02-P2-S02", "D02-P2-S05", "D02-P3-S03", "D04-P1-S03", "D04-P2-S02", "D04-P2-S05",
    ]);
    expect(sourceDependencyIds("NEXUS-COMPELLED-TASKS")).toEqual([
      "D04-P2-S07", "D05-P1-S02", "D05-P1-S05", "D05-P2-S03",
    ]);
    expect(sourceDependencyIds("NEXUS-OFFENCE-TIMING")).toEqual(["D06-P1-S05"]);
    expect(sourceDependencyIds("NEXUS-URGENCY")).toEqual([
      "D06-P2-S02", "D06-P2-S04", "D07-P1-S02", "D07-P1-S04", "D07-P1-S05",
    ]);

    expect(getCfnDemoCandidateDefinition("NEXUS-CONTROL")?.dependencies).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "candidate", candidateId: "CAND-CTRL-PASSPORT" }),
      expect.objectContaining({ kind: "candidate", candidateId: "CAND-CTRL-CONFINEMENT" }),
    ]));
    expect(getCfnDemoCandidateDefinition("NEXUS-COMPELLED-TASKS")?.dependencies).toContainEqual(
      expect.objectContaining({ kind: "candidate", candidateId: "CAND-TASK-0402" }),
    );
    expect(getCfnDemoCandidateDefinition("NEXUS-OFFENCE-TIMING")?.dependencies).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "candidate", candidateId: "CAND-TASK-0402" }),
      expect.objectContaining({ kind: "nexus", nexusCandidateId: "NEXUS-CONTROL" }),
      expect.objectContaining({ kind: "nexus", nexusCandidateId: "NEXUS-COMPELLED-TASKS" }),
    ]));
  });

  it("keeps the three lanes, early blockers, hero limitation, and frozen bindings", () => {
    expect(cfnDemoFixture.reviewDefinitions.reviewLaneDefinitions.map((lane) => lane.candidateIds.length)).toEqual([6, 5, 3]);
    expect(cfnDemoFixture.reviewDefinitions.reviewLaneDefinitions.map((lane) => lane.label)).toEqual([
      "Trafficking indicators for review",
      "Non-punishment relevance for review",
      "Protection, remedy, and procedural urgency",
    ]);
    expect(cfnDemoFixture.reviewDefinitions.earlyUnresolvedBlockerIds).toEqual([
      "CAND-SENDER-0402",
      "CAND-URG-INTERPRETER",
    ]);
    expect(cfnDemoFixture.reviewDefinitions.heroTransition).toMatchObject({
      triggerCandidateId: "CAND-TASK-0402",
      limitationText: "Insufficient evidence to support a link between the 2025-04-02 alleged communication and an assigned task.",
    });

    expect(cfnDemoFixture.canonicalFixtureDigest).toBe("ede4457873700cc4bce1bb5fad29c89a4e25d2e6ca7ccd33c323a2ce8ac5809c");
    expect(cfnDemoFixture.approvedRedactedInputDigest).toBe("430b6bd635d101340c52c41e65d66b55c8d443fbff4a252748dab504845e18ee");
    expect(cfnDemoEvaluationDefinitions.evaluationDefinitionSetDigest).toBe("14861367a7050ffecc72ba3467208bdc3cf313efcd7396862aca2952539a1dc1");
    expect(CFN_DEMO_FIXTURE_BINDING).toEqual({
      dataOrigin: "bundled_synthetic",
      caseId: "CFN-DEMO-001",
      fixtureVersion: "1.0.0",
      canonicalFixtureDigest: "ede4457873700cc4bce1bb5fad29c89a4e25d2e6ca7ccd33c323a2ce8ac5809c",
    });
  });
});
