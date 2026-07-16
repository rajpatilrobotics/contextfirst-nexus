import { describe, expect, it } from "vitest";

import type { CaseCandidate, ReviewDecision, ReviewIntent } from "../../../lib/contracts";
import {
  LIMITATION_TEXT,
  assembleCandidates,
  isReviewComplete,
  reviewCandidate,
  selectContextGaps,
  selectNexus,
  selectReviewLanes,
  selectTimeline,
  validateDependencyGraph,
  withdrawCandidate,
} from "../../../lib/review";

const canonicalIds = [
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

function applyDecisions(
  startingCandidates: CaseCandidate[],
  intents: ReviewIntent[],
  startingDecisions: ReviewDecision[] = [],
) {
  let candidates = startingCandidates;
  const decisions = [...startingDecisions];
  for (const intent of intents) {
    const result = reviewCandidate(candidates, intent, decisions);
    candidates = result.candidates;
    decisions.push(result.decision);
  }
  return { candidates, decisions };
}

describe("TASK-028 review dependency engine", () => {
  it("assembles the exact candidates, projections, lanes, and valid dependency graph", () => {
    const candidates = assembleCandidates();
    expect(candidates.map((candidate) => candidate.id)).toEqual(canonicalIds);
    expect(selectTimeline(candidates).map((candidate) => candidate.id)).toEqual([
      "CAND-TL-ARRIVAL",
      "CAND-CTRL-PASSPORT",
      "CAND-TASK-0402",
    ]);
    expect(selectNexus(candidates)).toHaveLength(6);
    expect(selectContextGaps(candidates).map((candidate) => candidate.id)).toEqual([
      "CAND-SENDER-0402",
      "CAND-URG-INTERPRETER",
    ]);
    expect(Object.values(selectReviewLanes(candidates)).map((lane) => lane.length)).toEqual([6, 5, 3]);
    expect(validateDependencyGraph(candidates)).toBe(true);
  });

  it("projects D03 and D04 as separate, qualified timeline records", () => {
    const timeline = selectTimeline(assembleCandidates());
    const arrival = timeline.find((candidate) => candidate.id === "CAND-TL-ARRIVAL")!;
    const passport = timeline.find((candidate) => candidate.id === "CAND-CTRL-PASSPORT")!;

    expect(arrival).toMatchObject({
      dateStart: "2025-03-12",
      datePrecision: "day",
      locationLabel: "Jurisdiction J-02",
    });
    expect(passport).toMatchObject({
      dateStart: "2025-03-15",
      datePrecision: "approximate",
      locationLabel: "Reported worksite",
    });
    expect("conflictGroupId" in arrival).toBe(false);
    expect("conflictGroupId" in passport).toBe(false);
    expect(arrival.dependencies).toMatchObject([
      { sourceSegmentId: "D03-P1-S02", evidenceNature: "documented_in_source" },
    ]);
    expect(passport.dependencies).toMatchObject([
      { sourceSegmentId: "D04-P1-S03", evidenceNature: "reported_or_alleged_in_source" },
      { sourceSegmentId: "D02-P2-S02", evidenceNature: "documented_in_source" },
    ]);
    expect(arrival.reviewQuestion).not.toBe(passport.reviewQuestion);
  });

  it("enforces every stable individual action and recomputes derived summaries", () => {
    let candidates = assembleCandidates();
    const originalPassport = candidates.find((candidate) => candidate.id === "CAND-CTRL-PASSPORT")!;

    expect(() => reviewCandidate(candidates, { candidateId: "CAND-CTRL-CONFINEMENT", action: "accept", reason: null })).toThrow();
    expect(() => reviewCandidate(candidates, { candidateId: "CAND-SENDER-0402", action: "accept", reason: null })).toThrow();
    expect(() => reviewCandidate(candidates, { candidateId: "NEXUS-CONTROL", action: "accept", reason: null })).toThrow();

    const result = applyDecisions(candidates, [
      { candidateId: "CAND-TL-ARRIVAL", action: "accept", reason: null },
      {
        candidateId: "CAND-CTRL-PASSPORT",
        action: "edit",
        editedText: "Maya reported passport removal; recruiter messages separately refer to passport custody.",
        reason: "Preserve reported and documented sources separately.",
      },
      { candidateId: "CAND-CTRL-CONFINEMENT", action: "reject", reason: "No independent confirmation." },
      { candidateId: "CAND-PROV-TASKLOG", action: "mark_uncertain", reason: "Provenance remains unknown." },
      { candidateId: "CAND-META-COOPERATION", action: "confirm_unknown", reason: null },
      { candidateId: "CAND-URG-INTERPRETER", action: "confirm_unknown", reason: null },
    ]);
    candidates = result.candidates;

    expect(candidates.find((candidate) => candidate.id === "CAND-CTRL-PASSPORT")).toMatchObject({
      proposedText: originalPassport.proposedText,
      currentTextOrigin: "human_created",
      reviewStatus: "human_edited",
    });
    expect(candidates.find((candidate) => candidate.id === "CAND-PROV-TASKLOG")?.reviewStatus).toBe("uncertain");
    expect(candidates.find((candidate) => candidate.id === "CAND-META-COOPERATION")).toMatchObject({
      itemOrigin: "source_extraction",
      assertionMode: "unknown_state",
      reviewStatus: "human_accepted",
    });
    expect(candidates.find((candidate) => candidate.id === "NEXUS-CONTROL")).toMatchObject({
      reviewStatus: "uncertain",
      supportStatus: "insufficient_evidence",
    });
    expect(candidates.find((candidate) => candidate.id === "NEXUS-URGENCY")).toMatchObject({
      reviewStatus: "human_accepted",
      supportStatus: "exact_source_supported",
    });
  });

  it("links a later task withdrawal to its acceptance despite intervening decisions", () => {
    const seeded = applyDecisions(assembleCandidates(), [
      { candidateId: "CAND-TL-ARRIVAL", action: "accept", reason: null },
      { candidateId: "CAND-PROV-TASKLOG", action: "mark_uncertain", reason: "Provenance remains unknown." },
      { candidateId: "CAND-META-COOPERATION", action: "confirm_unknown", reason: null },
      { candidateId: "CAND-TASK-0402", action: "accept", reason: null },
      { candidateId: "NEXUS-COMPELLED-TASKS", action: "accept", reason: null },
      { candidateId: "NEXUS-OFFENCE-TIMING", action: "accept", reason: null },
    ]);
    const withdrawal = withdrawCandidate(
      seeded.candidates,
      "CAND-TASK-0402",
      "The assignment evidence was withdrawn from consideration.",
      seeded.decisions,
    );

    expect(withdrawal.decision.id).toBe("REVIEW-0007");
    expect(withdrawal.decision.supersedesDecisionId).toBe("REVIEW-0004");
    expect(withdrawal.decision.previousStatus).toBe("human_accepted");
  });

  it("generically reconciles only invalid active non-source dependencies during renewed review", () => {
    const assembled = assembleCandidates();
    const candidateTemplate = assembled.find((candidate) => candidate.id === "CAND-TL-ARRIVAL")!;
    const nexusTemplate = assembled.find((candidate) => candidate.id === "NEXUS-COMPELLED-TASKS")!;
    const sourceDependency = nexusTemplate.dependencies.find((dependency) => dependency.kind === "source")!;
    const withdrawnTarget: CaseCandidate = {
      ...candidateTemplate,
      id: "CAND-GENERIC-WITHDRAWN",
      inclusionStatus: "withdrawn",
      reviewStatus: "invalidated",
    };
    const validTarget: CaseCandidate = {
      ...candidateTemplate,
      id: "CAND-GENERIC-VALID",
      reviewStatus: "human_accepted",
    };
    const invalidatedNexus: CaseCandidate = {
      ...nexusTemplate,
      id: "NEXUS-GENERIC-INVALIDATED",
      reviewStatus: "invalidated",
    };
    const validNexus: CaseCandidate = {
      ...nexusTemplate,
      id: "NEXUS-GENERIC-VALID",
      reviewStatus: "human_accepted",
    };
    const reviewed: CaseCandidate = {
      ...nexusTemplate,
      id: "NEXUS-GENERIC-REVIEWED",
      reviewStatus: "invalidated",
      dependencies: [
        { ...sourceDependency, id: "DEP-GENERIC-SOURCE" },
        { id: "DEP-GENERIC-WITHDRAWN", kind: "candidate", candidateId: withdrawnTarget.id, relationship: "supports", active: true },
        { id: "DEP-GENERIC-INVALIDATED-NEXUS", kind: "nexus", nexusCandidateId: invalidatedNexus.id, relationship: "supports", active: true },
        { id: "DEP-GENERIC-VALID", kind: "candidate", candidateId: validTarget.id, relationship: "supports", active: true },
        { id: "DEP-GENERIC-VALID-NEXUS", kind: "nexus", nexusCandidateId: validNexus.id, relationship: "context_only", active: true },
        { id: "DEP-GENERIC-MISSING", kind: "candidate", candidateId: "CAND-GENERIC-MISSING", relationship: "supports", active: true },
        { id: "DEP-GENERIC-HISTORICAL", kind: "candidate", candidateId: withdrawnTarget.id, relationship: "limits", active: false },
      ],
    };
    const candidates = [reviewed, withdrawnTarget, validTarget, invalidatedNexus, validNexus];

    const result = reviewCandidate(candidates, { candidateId: reviewed.id, action: "accept", reason: null });
    const reconciled = result.candidates.find((candidate) => candidate.id === reviewed.id)!;
    const activity = Object.fromEntries(reconciled.dependencies.map((dependency) => [dependency.id, dependency.active]));

    expect(reconciled.dependencies.map((dependency) => dependency.id)).toEqual(reviewed.dependencies.map((dependency) => dependency.id));
    expect(activity).toEqual({
      "DEP-GENERIC-SOURCE": true,
      "DEP-GENERIC-WITHDRAWN": false,
      "DEP-GENERIC-INVALIDATED-NEXUS": false,
      "DEP-GENERIC-VALID": true,
      "DEP-GENERIC-VALID-NEXUS": true,
      "DEP-GENERIC-MISSING": true,
      "DEP-GENERIC-HISTORICAL": false,
    });
    expect(result.decision.dependencySnapshot).toEqual([
      "DEP-GENERIC-MISSING",
      "DEP-GENERIC-SOURCE",
      "DEP-GENERIC-VALID",
      "DEP-GENERIC-VALID-NEXUS",
    ]);
    expect(reviewed.dependencies.find((dependency) => dependency.id === "DEP-GENERIC-WITHDRAWN")?.active).toBe(true);
    expect(result.candidates.find((candidate) => candidate.id === validTarget.id)).toEqual(validTarget);
  });

  it("reproduces the complete Step 0 through Step 3 hero transition", () => {
    let candidates = assembleCandidates();
    let decisions: ReviewDecision[] = [];

    expect(candidates.find((candidate) => candidate.id === "CAND-TASK-0402")).toMatchObject({ supportStatus: "exact_source_supported", reviewStatus: "pending" });
    expect(candidates.find((candidate) => candidate.id === "NEXUS-COMPELLED-TASKS")).toMatchObject({ supportStatus: "partially_supported", reviewStatus: "pending" });
    expect(candidates.find((candidate) => candidate.id === "NEXUS-OFFENCE-TIMING")).toMatchObject({ supportStatus: "partially_supported", reviewStatus: "pending" });

    ({ candidates, decisions } = applyDecisions(candidates, [
      { candidateId: "CAND-TL-ARRIVAL", action: "accept", reason: null },
      {
        candidateId: "CAND-CTRL-PASSPORT",
        action: "edit",
        editedText: "Maya reported passport removal; recruiter messages separately refer to passport custody.",
        reason: "Preserve evidence nature.",
      },
      { candidateId: "CAND-CTRL-CONFINEMENT", action: "reject", reason: "No independent confirmation." },
      { candidateId: "CAND-PROV-TASKLOG", action: "mark_uncertain", reason: "Provenance remains unknown." },
      { candidateId: "CAND-META-COOPERATION", action: "confirm_unknown", reason: null },
      { candidateId: "CAND-SENDER-0402", action: "reject", reason: "Assignment and allegation do not prove sender identity." },
      { candidateId: "CAND-URG-INTERPRETER", action: "confirm_unknown", reason: null },
      { candidateId: "CAND-TASK-0402", action: "accept", reason: null },
      { candidateId: "NEXUS-COMPELLED-TASKS", action: "accept", reason: null },
      { candidateId: "NEXUS-OFFENCE-TIMING", action: "accept", reason: null },
    ], decisions));

    expect(isReviewComplete(candidates)).toBe(true);
    expect(candidates.find((candidate) => candidate.id === "CAND-TASK-0402")?.reviewStatus).toBe("human_accepted");
    expect(candidates.find((candidate) => candidate.id === "NEXUS-COMPELLED-TASKS")?.reviewStatus).toBe("human_accepted");
    expect(candidates.find((candidate) => candidate.id === "NEXUS-OFFENCE-TIMING")?.reviewStatus).toBe("human_accepted");

    const withdrawal = withdrawCandidate(
      candidates,
      "CAND-TASK-0402",
      "The assignment evidence was withdrawn from consideration.",
      decisions,
    );
    candidates = withdrawal.candidates;
    decisions.push(withdrawal.decision);
    expect(candidates.find((candidate) => candidate.id === "CAND-TASK-0402")).toMatchObject({ reviewStatus: "invalidated", inclusionStatus: "withdrawn" });
    expect(candidates.find((candidate) => candidate.id === "NEXUS-COMPELLED-TASKS")).toMatchObject({ reviewStatus: "invalidated", supportStatus: "partially_supported" });
    expect(candidates.find((candidate) => candidate.id === "NEXUS-OFFENCE-TIMING")).toMatchObject({ reviewStatus: "invalidated", supportStatus: "insufficient_evidence" });
    expect(withdrawal.dependencyChange.exportReadinessRevoked).toBe(true);
    expect(withdrawal.dependencyChange.preservedCandidateIds).toContain("CAND-TL-ARRIVAL");

    ({ candidates, decisions } = applyDecisions(candidates, [
      { candidateId: "NEXUS-COMPELLED-TASKS", action: "accept", reason: null },
      {
        candidateId: "NEXUS-OFFENCE-TIMING",
        action: "accept_as_limitation",
        limitationText: LIMITATION_TEXT,
        reason: "The assigned-task dependency was withdrawn.",
      },
    ], decisions));

    expect(candidates.find((candidate) => candidate.id === "CAND-TASK-0402")).toMatchObject({ reviewStatus: "invalidated", inclusionStatus: "withdrawn" });
    expect(candidates.find((candidate) => candidate.id === "NEXUS-COMPELLED-TASKS")).toMatchObject({ reviewStatus: "human_accepted", supportStatus: "partially_supported" });
    expect(candidates.find((candidate) => candidate.id === "NEXUS-OFFENCE-TIMING")).toMatchObject({
      reviewStatus: "human_edited",
      supportStatus: "insufficient_evidence",
      assertionMode: "limitation",
      currentText: LIMITATION_TEXT,
    });
    const compelled = candidates.find((candidate) => candidate.id === "NEXUS-COMPELLED-TASKS")!;
    const offenceTiming = candidates.find((candidate) => candidate.id === "NEXUS-OFFENCE-TIMING")!;
    expect(compelled.dependencies.find((dependency) => dependency.kind === "candidate" && dependency.candidateId === "CAND-TASK-0402")?.active).toBe(false);
    expect(compelled.dependencies.filter((dependency) => dependency.kind === "source").every((dependency) => dependency.active)).toBe(true);
    expect(offenceTiming.dependencies.find((dependency) => dependency.kind === "candidate" && dependency.candidateId === "CAND-TASK-0402")?.active).toBe(false);
    expect(offenceTiming.dependencies.find((dependency) => dependency.kind === "nexus" && dependency.nexusCandidateId === "NEXUS-COMPELLED-TASKS")?.active).toBe(true);
    expect(decisions.at(-2)?.dependencySnapshot).toEqual(compelled.dependencies.filter((dependency) => dependency.active).map((dependency) => dependency.id).sort());
    expect(decisions.at(-1)?.dependencySnapshot).toEqual(offenceTiming.dependencies.filter((dependency) => dependency.active).map((dependency) => dependency.id).sort());
  });

  it("rejects validly shaped dependency cycles before graph use", () => {
    const candidates = assembleCandidates();
    const cycle = candidates.map((candidate) =>
      candidate.id === "NEXUS-CONTROL"
        ? {
            ...candidate,
            dependencies: [
              ...candidate.dependencies,
              {
                id: "DEP-NEXUS-CONTROL-NEXUS-OFFENCE-TIMING",
                kind: "nexus" as const,
                nexusCandidateId: "NEXUS-OFFENCE-TIMING",
                relationship: "supports" as const,
                active: true,
              },
            ],
          }
        : candidate,
    );
    expect(() => validateDependencyGraph(cycle)).toThrow("cycle");
  });
});
