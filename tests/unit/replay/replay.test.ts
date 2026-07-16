import { describe, expect, it } from "vitest";

import {
  CANONICAL_REVIEW_CANDIDATE_IDS,
  createTrustedCheckpointBundle,
  createTrustedReplayBundle,
  validateCheckpointBundle,
  validateReplayBundle,
} from "../../../lib/analysis/replay";
import type {
  CaseCommand,
  CaseState,
  DemoCheckpointBundle,
  ReplayBundle,
  ReplayRequest,
} from "../../../lib/contracts";
import { applyCaseCommand, createInitialCaseState } from "../../../lib/state";

const NOW = "2026-07-16T00:00:00.000Z";
const expectedCheckpointSequence = [
  ["CAND-TL-ARRIVAL", "accept"],
  ["CAND-PROV-TASKLOG", "mark_uncertain"],
  ["CAND-META-COOPERATION", "confirm_unknown"],
  ["CAND-TASK-0402", "accept"],
  ["NEXUS-COMPELLED-TASKS", "accept"],
  ["NEXUS-OFFENCE-TIMING", "accept"],
] as const;

function meta(state: CaseState, id: string): CaseCommand["meta"] {
  return {
    commandId: id,
    idempotencyKey: `idem-${id}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt: NOW,
  };
}

function replayRequest(): ReplayRequest {
  return {
    mode: "deterministic_replay",
    replayBundleId: "REPLAY-CFN-DEMO-001-V1",
    caseId: "CFN-DEMO-001",
    releaseConfigurationId: "prepared-replay-v1",
    providerDisclosureAcknowledgementId: "ACK-REPLAY",
    recoveryOfRunId: null,
    fixtureVersion: "1.0.0",
    promptVersion: "1.0.0",
    analysisResponseVersion: "1.0.0",
    replayVersion: "1.0.0",
  };
}

function sourceCitationIds(bundle: ReplayBundle | DemoCheckpointBundle) {
  return new Set(
    bundle.candidates.flatMap((candidate) =>
      candidate.dependencies
        .filter((dependency) => dependency.kind === "source")
        .map((dependency) => dependency.citationId),
    ),
  );
}

describe("TASK-028 trusted replay and checkpoint", () => {
  it("builds ordinary replay with exactly 14 candidates, 23 citations, and no decisions", () => {
    const bundle = createTrustedReplayBundle();
    expect(validateReplayBundle(bundle)).toMatchObject({ ok: true });
    expect(bundle.candidates.map((candidate) => candidate.id)).toEqual(CANONICAL_REVIEW_CANDIDATE_IDS);
    expect(bundle.counts).toEqual({
      analysisRunCount: 1,
      candidateCount: 14,
      citationCount: 23,
      seededDecisionCount: 0,
    });
    expect(bundle.seededDecisions).toEqual([]);
    expect(new Set(bundle.citations.map((citation) => citation.id)).size).toBe(23);
    expect(sourceCitationIds(bundle)).toEqual(new Set(bundle.citations.map((citation) => citation.id)));
    expect(bundle.candidates.every((candidate) => candidate.analysisRunId === bundle.replayRun.id)).toBe(true);
    expect(bundle.citations.every((citation) => citation.analysisRunId === bundle.replayRun.id)).toBe(true);
  });

  it("activates ordinary replay as one rewritten local run", () => {
    const initial = createInitialCaseState(NOW);
    const result = applyCaseCommand(initial, {
      type: "run_deterministic_replay",
      meta: meta(initial, "cmd-replay"),
      request: replayRequest(),
    });
    expect(result.ok, result.ok ? undefined : result.reason).toBe(true);
    if (!result.ok) throw new Error(result.reason);

    expect(result.state.analysisRuns).toHaveLength(1);
    expect(result.state.activeAnalysisRunId).toBe("RUN-REPLAY-1");
    expect(result.state.analysisRuns[0]).toMatchObject({
      id: "RUN-REPLAY-1",
      mode: "deterministic_replay",
      candidateCount: 14,
      citationCount: 23,
      provider: { providerTransmission: false },
    });
    expect(result.state.candidates).toHaveLength(14);
    expect(result.state.citations).toHaveLength(23);
    expect(result.state.reviews).toEqual([]);
    expect(result.state.candidates.every((candidate) => candidate.analysisRunId === "RUN-REPLAY-1")).toBe(true);
    expect(result.state.citations.every((citation) => citation.analysisRunId === "RUN-REPLAY-1")).toBe(true);
  });

  it("builds the prepared checkpoint with six ordered fixture-reviewer decisions", () => {
    const checkpoint = createTrustedCheckpointBundle();
    expect(validateCheckpointBundle(checkpoint)).toMatchObject({ ok: true });
    expect(checkpoint.counts).toMatchObject({
      analysisRunCount: 1,
      candidateCount: 14,
      citationCount: 23,
      seededDecisionCount: 6,
    });
    expect(checkpoint.seededDecisions.map((decision) => [decision.candidateId, decision.action])).toEqual(
      expectedCheckpointSequence,
    );
    expect(checkpoint.seededDecisionIds).toEqual([
      "REVIEW-0001",
      "REVIEW-0002",
      "REVIEW-0003",
      "REVIEW-0004",
      "REVIEW-0005",
      "REVIEW-0006",
    ]);
    expect(checkpoint.seededDecisions.every((decision) => decision.actor === "fixture_reviewer")).toBe(true);
    expect(checkpoint.visibleLabel).toBe("Prepared synthetic review checkpoint");
    expect(checkpoint.replayVisibleLabel).toBe("Bundled deterministic replay, not live AI");
    expect(checkpoint.purposeBrief.status).toBe("complete");
    expect(checkpoint.purposeBrief.providerSelection.providerId).toBe("local_replay");
    expect(checkpoint.masking).toMatchObject({
      reviewStatus: "approved",
      reviewedBy: "fixture_reviewer",
      leakScanStatus: "passed",
    });
    expect(checkpoint.candidates.find((candidate) => candidate.id === "CAND-TASK-0402")).toMatchObject({
      revision: 1,
      reviewStatus: "human_accepted",
      inclusionStatus: "active",
    });
  });

  it("loads all seeded decisions and preserves task acceptance before withdrawal", () => {
    const initial = createInitialCaseState(NOW);
    const loaded = applyCaseCommand(initial, {
      type: "load_demo_checkpoint",
      meta: meta(initial, "cmd-checkpoint"),
      checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
    });
    expect(loaded.ok, loaded.ok ? undefined : loaded.reason).toBe(true);
    if (!loaded.ok) throw new Error(loaded.reason);

    expect(loaded.state.activeAnalysisRunId).toBe("RUN-CHECKPOINT-1");
    expect(loaded.state.candidates).toHaveLength(14);
    expect(loaded.state.citations).toHaveLength(23);
    expect(loaded.state.reviews.map((decision) => [decision.candidateId, decision.action])).toEqual(
      expectedCheckpointSequence,
    );
    expect(loaded.state.reviews.every((decision) =>
      decision.actor === "fixture_reviewer" && decision.analysisRunId === "RUN-CHECKPOINT-1"
    )).toBe(true);
    expect(loaded.state.candidates.find((candidate) => candidate.id === "CAND-TASK-0402")?.reviewStatus).toBe(
      "human_accepted",
    );

    const withdrawn = applyCaseCommand(loaded.state, {
      type: "withdraw_candidate",
      meta: meta(loaded.state, "cmd-withdraw-task"),
      candidateId: "CAND-TASK-0402",
      reason: "The assignment evidence was withdrawn from consideration.",
    });
    expect(withdrawn.ok, withdrawn.ok ? undefined : withdrawn.reason).toBe(true);
    if (!withdrawn.ok) throw new Error(withdrawn.reason);
    expect(withdrawn.state.reviews).toHaveLength(7);
    expect(withdrawn.state.reviews[6]).toMatchObject({
      candidateId: "CAND-TASK-0402",
      action: "withdraw",
      previousStatus: "human_accepted",
      supersedesDecisionId: "REVIEW-0004",
    });
    expect(withdrawn.state.candidates.find((candidate) => candidate.id === "CAND-TASK-0402")).toMatchObject({
      reviewStatus: "invalidated",
      inclusionStatus: "withdrawn",
    });
    expect(withdrawn.state.candidates.find((candidate) => candidate.id === "NEXUS-COMPELLED-TASKS")?.reviewStatus).toBe("invalidated");
    expect(withdrawn.state.candidates.find((candidate) => candidate.id === "NEXUS-OFFENCE-TIMING")).toMatchObject({
      reviewStatus: "invalidated",
      supportStatus: "insufficient_evidence",
    });
    expect(withdrawn.state.dependencyChanges.at(-1)?.exportReadinessRevoked).toBe(true);
  });

  it("rejects count, ownership, sequence, digest, and post-decision tampering", () => {
    const replay = createTrustedReplayBundle();
    expect(validateReplayBundle({ ...replay, candidates: replay.candidates.slice(1) }).ok).toBe(false);
    expect(validateReplayBundle({ ...replay, canonicalFixtureDigest: "0".repeat(64) }).ok).toBe(false);
    expect(validateReplayBundle({
      ...replay,
      candidates: replay.candidates.map((candidate, index) =>
        index === 0 ? { ...candidate, analysisRunId: "RUN-MIXED-OWNER" } : candidate,
      ),
    }).ok).toBe(false);

    const checkpoint = createTrustedCheckpointBundle();
    const tamperedCandidate = {
      ...checkpoint,
      candidates: checkpoint.candidates.map((candidate, index) =>
        index === 0 ? { ...candidate, currentText: `${candidate.currentText} Tampered.` } : candidate,
      ),
    };
    expect(validateCheckpointBundle(tamperedCandidate).ok).toBe(false);
    expect(validateCheckpointBundle({
      ...checkpoint,
      seededDecisions: [...checkpoint.seededDecisions].reverse(),
    }).ok).toBe(false);
    expect(validateCheckpointBundle({
      ...checkpoint,
      approvedRedactedInputDigest: "0".repeat(64),
    }).ok).toBe(false);
  });

  it("rejects unknown trusted registry IDs without mutating state", () => {
    const state = createInitialCaseState(NOW);
    const replay = applyCaseCommand(state, {
      type: "run_deterministic_replay",
      meta: meta(state, "cmd-bad-replay"),
      request: { ...replayRequest(), replayBundleId: "BAD-ID" as "REPLAY-CFN-DEMO-001-V1" },
    });
    expect(replay.ok).toBe(false);
    expect(replay.state.analysisRuns).toHaveLength(0);

    const checkpoint = applyCaseCommand(state, {
      type: "load_demo_checkpoint",
      meta: meta(state, "cmd-bad-checkpoint"),
      checkpointBundleId: "BAD-ID" as "DEMO-CHECKPOINT-REVIEW",
    });
    expect(checkpoint.ok).toBe(false);
    expect(checkpoint.state.analysisRuns).toHaveLength(0);
  });
});
