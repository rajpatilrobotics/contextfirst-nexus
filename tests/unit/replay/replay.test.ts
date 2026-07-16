import { describe, expect, it } from "vitest";

import { applyCaseCommand, createInitialCaseState } from "../../../lib/state";
import {
  createTrustedCheckpointBundle,
  createTrustedReplayBundle,
  validateCheckpointBundle,
  validateReplayBundle,
} from "../../../lib/analysis/replay";
import type { CaseCommand, CaseState, ReplayRequest } from "../../../lib/contracts";

const NOW = "2026-07-16T00:00:00.000Z";

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

describe("TASK-010 trusted replay registry", () => {
  it("rejects mutated replay bundles before state mutation", () => {
    const bundle = createTrustedReplayBundle();
    expect(validateReplayBundle(bundle).ok).toBe(true);
    expect(validateReplayBundle({ ...bundle, candidates: bundle.candidates.slice(1) }).ok).toBe(false);
    expect(validateReplayBundle({ ...bundle, canonicalFixtureDigest: "0".repeat(64) }).ok).toBe(false);
  });

  it("runs deterministic replay locally and activates a separate run", () => {
    const initial = createInitialCaseState(NOW);
    const result = applyCaseCommand(initial, {
      type: "run_deterministic_replay",
      meta: meta(initial, "cmd-replay"),
      request: replayRequest(),
    });
    expect(result.ok, result.ok ? undefined : result.reason).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.analysisRuns).toHaveLength(1);
    expect(result.state.analysisRuns[0].mode).toBe("deterministic_replay");
    expect(result.state.analysisRuns[0].provider.providerTransmission).toBe(false);
    expect(result.state.candidates.length).toBeGreaterThan(0);
    expect(result.state.citations.length).toBeGreaterThan(0);
  });

  it("loads the prepared checkpoint with fixture-reviewer seeded decisions", () => {
    const checkpoint = createTrustedCheckpointBundle();
    expect(validateCheckpointBundle(checkpoint).ok).toBe(true);
    expect(checkpoint.visibleLabel).toBe("Prepared synthetic review checkpoint");
    expect(checkpoint.replayVisibleLabel).toBe("Bundled deterministic replay, not live AI");
    expect(checkpoint.seededDecisions.every((decision) => decision.actor === "fixture_reviewer")).toBe(true);

    const initial = createInitialCaseState(NOW);
    const result = applyCaseCommand(initial, {
      type: "load_demo_checkpoint",
      meta: meta(initial, "cmd-checkpoint"),
      checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
    });
    expect(result.ok, result.ok ? undefined : result.reason).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.purposeBrief?.providerSelection.providerId).toBe("local_replay");
    expect(result.state.masking.reviewedBy).toBe("fixture_reviewer");
    expect(result.state.reviews.every((decision) => decision.actor === "fixture_reviewer")).toBe(true);
    expect(result.state.analysisRuns[0].checkpointProvenance?.checkpointId).toBe("DEMO-CHECKPOINT-REVIEW");
  });

  it("rejects unknown replay and checkpoint IDs", () => {
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
