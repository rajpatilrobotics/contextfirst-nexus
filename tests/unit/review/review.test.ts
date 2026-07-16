import { describe, expect, it } from "vitest";
import {
  LIMITATION_TEXT,
  assembleCandidates,
  isReviewComplete,
  selectContextGaps,
  selectNexus,
  selectReviewLanes,
  selectTimeline,
  reviewCandidate,
  validateDependencyGraph,
  withdrawCandidate,
} from "../../../lib/review";
import type { ReviewDecision } from "../../../lib/contracts";

describe("review dependency engine", () => {
  it("assembles one canonical collection with qualified projections", () => {
    const candidates = assembleCandidates();
    expect(candidates).toHaveLength(14);
    expect(selectTimeline(candidates)).toHaveLength(6);
    expect(selectNexus(candidates)).toHaveLength(6);
    expect(selectContextGaps(candidates)).toHaveLength(2);
    expect(Object.values(selectReviewLanes(candidates)).map((lane) => lane.length)).toEqual([6, 5, 3]);
    expect(candidates.find((candidate) => candidate.id === "NEXUS-OFFENCE-TIMING")?.reviewStatus).toBe("pending");
  });

  it("requires individual review and preserves the original proposal when editing", () => {
    const candidates = assembleCandidates();
    const original = candidates.find((candidate) => candidate.id === "CAND-PASSPORT-DEBT")!;
    const result = reviewCandidate(candidates, { candidateId: original.id, action: "edit", editedText: "Maya reported passport removal; recruiter messages separately refer to passport custody.", reason: "Separate reported and documented sources." });
    const edited = result.candidates.find((candidate) => candidate.id === original.id)!;
    expect(edited.proposedText).toBe(original.proposedText);
    expect(edited.currentTextOrigin).toBe("human_created");
    expect(result.decision.resultingStatus).toBe("human_edited");
    expect(() => reviewCandidate(candidates, { candidateId: "NEXUS-CONTROL", action: "accept", reason: null })).toThrow();
  });

  it("reproduces the withdrawal transition and preserves unrelated candidates", () => {
    let candidates = assembleCandidates();
    let decisions: ReviewDecision[] = [];
    const accepted = reviewCandidate(candidates, { candidateId: "CAND-TASK-0402", action: "accept", reason: null }, decisions);
    candidates = accepted.candidates; decisions = [accepted.decision];
    const result = withdrawCandidate(candidates, "CAND-TASK-0402", "The assignment evidence was withdrawn from consideration.", decisions);
    candidates = result.candidates;
    expect(candidates.find((candidate) => candidate.id === "CAND-TASK-0402")).toMatchObject({ reviewStatus: "invalidated", inclusionStatus: "withdrawn" });
    expect(candidates.find((candidate) => candidate.id === "NEXUS-COMPELLED-TASKS")).toMatchObject({ reviewStatus: "invalidated", supportStatus: "partially_supported" });
    expect(candidates.find((candidate) => candidate.id === "NEXUS-OFFENCE-TIMING")).toMatchObject({ reviewStatus: "invalidated", supportStatus: "insufficient_evidence" });
    expect(result.dependencyChange.exportReadinessRevoked).toBe(true);
    expect(result.dependencyChange.preservedCandidateIds).toContain("NEXUS-RECRUITMENT");
  });

  it("rejects cycles before graph use", () => {
    const candidates = assembleCandidates();
    expect(validateDependencyGraph(candidates)).toBe(true);
    const cycle = candidates.map((candidate) => candidate.id === "CAND-TASK-0402" ? { ...candidate, dependencies: [{ id: "cycle", kind: "candidate" as const, candidateId: "NEXUS-OFFENCE-TIMING", relationship: "supports" as const, active: true }] } : candidate);
    expect(() => validateDependencyGraph(cycle)).toThrow();
  });

  it("does not complete review while individual work is pending", () => {
    const candidates = assembleCandidates();
    expect(isReviewComplete(candidates)).toBe(false);
    expect(LIMITATION_TEXT).toContain("Insufficient evidence");
  });
});
