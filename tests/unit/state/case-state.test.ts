import { describe, expect, it } from "vitest";

import {
  applyCaseCommand,
  createInitialCaseState,
  loadCaseState,
  projectNonRunAttempts,
  resetCase,
  saveCaseState,
  serializeCaseState,
} from "../../../lib/state";
import { trustedPurposeBrief } from "../../../lib/analysis/replay";
import { cfnDemoFixture } from "../../../lib/fixtures";
import type { AnalyzeRequest, CaseCommand, CaseState, LiveAnalysisExecutionResult } from "../../../lib/contracts";

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

function applyOk(state: CaseState, command: CaseCommand): CaseState {
  const result = applyCaseCommand(state, command);
  expect(result.ok, result.ok ? undefined : result.reason).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

function loadCheckpoint(state = createInitialCaseState(NOW)) {
  return applyOk(state, {
    type: "load_demo_checkpoint",
    meta: meta(state, "cmd-load-checkpoint"),
    checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
  });
}

function liveRequest(state: CaseState): AnalyzeRequest {
  if (!state.purposeBrief) throw new Error("missing purpose");
  return {
    schemaVersion: "1.0.0",
    caseId: "CFN-DEMO-001",
    fixtureVersion: "1.0.0",
    canonicalFixtureDigest: cfnDemoFixture.canonicalFixtureDigest,
    purposeBriefId: state.purposeBrief.id,
    purposeContext: {
      practitionerRole: state.purposeBrief.practitionerRole,
      jurisdictionCode: state.purposeBrief.jurisdictionCode,
      sourceLanguage: "en",
      requestedExport: state.purposeBrief.requestedExport,
    },
    maskReviewApproved: true,
    leakScanStatus: "passed",
    requestedMode: "live",
    providerSelection: {
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      serviceTier: "paid",
    },
    providerDisclosureAcknowledgement: {
      id: "ACK-LIVE-OPENAI",
      schemaVersion: "1.0.0",
      disclosureVersion: "1.0.0",
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      serviceTier: "paid",
      dataFlowAcknowledged: true,
      retentionAndTrainingUseAcknowledged: true,
      serviceTierAcknowledged: true,
      acknowledgedAt: NOW,
    },
    selectedSegmentIds: [...state.selectedSegmentIds],
    maskApprovals: [],
  };
}

function failedRun(id: string): LiveAnalysisExecutionResult {
  return {
    id,
    mode: "live",
    provider: {
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      requestedModel: "gpt-5.6-sol",
      serviceTier: "paid",
      adapterVersion: "test-adapter",
      returnedModel: null,
      inferenceSetting: { kind: "reasoning_effort", value: "medium" },
      disclosureVersion: "1.0.0",
      providerTransmission: true,
    },
    promptVersion: "1.0.0",
    requestSchemaVersion: "1.0.0",
    responseSchemaVersion: "1.0.0",
    fixtureVersion: "1.0.0",
    rulesetVersion: "1.0.0",
    checkpointProvenance: null,
    startedAt: NOW,
    completedAt: NOW,
    durationMs: 10,
    inputSegmentCount: 1,
    candidateCount: 0,
    citationCount: 0,
    quarantinedCount: 0,
    status: "failed",
    failure: {
      classification: "provider_timeout",
      safeErrorCode: "PROVIDER_TIMEOUT",
      retryableSameProvider: true,
      alternateProviderRecoveryAllowed: true,
      replayRecoveryAllowed: true,
    },
  };
}

describe("TASK-010 case state reducer", () => {
  it("rejects stale revisions and duplicate idempotency keys without mutation", () => {
    const initial = createInitialCaseState(NOW);
    const command: CaseCommand = {
      type: "save_purpose",
      meta: meta(initial, "cmd-purpose"),
      purposeBrief: trustedPurposeBrief(),
    };
    const saved = applyOk(initial, command);
    expect(saved.caseRevision).toBe(1);
    expect(saved.audit).toHaveLength(1);

    const duplicate = applyCaseCommand(saved, { ...command, meta: { ...command.meta, expectedCaseRevision: saved.caseRevision } });
    expect(duplicate.ok).toBe(false);
    expect(duplicate.state.caseRevision).toBe(1);
    expect(duplicate.state.audit).toHaveLength(1);

    const stale = applyCaseCommand(saved, {
      type: "save_purpose",
      meta: { ...meta(saved, "cmd-stale"), expectedCaseRevision: 0 },
      purposeBrief: trustedPurposeBrief(),
    });
    expect(stale.ok).toBe(false);
    expect(stale.state.caseRevision).toBe(1);
  });

  it("locks material commands while a live request is pending and records no-run attempts", () => {
    let state = loadCheckpoint();
    const start: CaseCommand = {
      type: "start_live_analysis",
      meta: meta(state, "cmd-start-live"),
      request: liveRequest(state),
      recoveryOfRunId: null,
    };
    const started = applyCaseCommand(state, start);
    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error(started.reason);
    state = started.state;
    expect(state.pendingLiveAnalysis?.startCommandId).toBe("cmd-start-live");
    expect(state.caseRevision).toBe(2);
    expect(started.networkAuthorized).toBe(true);

    const blocked = applyCaseCommand(state, {
      type: "save_purpose",
      meta: meta(state, "cmd-blocked-purpose"),
      purposeBrief: trustedPurposeBrief(),
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.state.caseRevision).toBe(state.caseRevision);

    const rejected = applyOk(state, {
      type: "record_live_analysis_transport_failure",
      meta: meta(state, "cmd-transport"),
      startCommandId: "cmd-start-live",
      reasonCode: "network_unavailable",
    });
    expect(rejected.pendingLiveAnalysis).toBeNull();
    expect(rejected.analysisRuns).toHaveLength(1);
    const attempts = projectNonRunAttempts(rejected);
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      kind: "transport_failure",
      startCommandId: "cmd-start-live",
      outputAccepted: false,
      remoteExecutionStatus: "unknown",
    });
  });

  it("attaches local recovery metadata and activates a failed terminal run atomically", () => {
    let state = loadCheckpoint();
    const startCommand: CaseCommand = {
      type: "start_live_analysis",
      meta: meta(state, "cmd-start-fail"),
      request: liveRequest(state),
      recoveryOfRunId: null,
    };
    state = applyOk(state, startCommand);
    const failed = applyOk(state, {
      type: "fail_live_analysis",
      meta: meta(state, "cmd-fail-live"),
      startCommandId: "cmd-start-fail",
      response: {
        schemaVersion: "1.0.0",
        outcome: "failed",
        run: failedRun("RUN-LIVE-FAILED"),
        candidates: [],
        citations: [],
        quarantined: [],
        error: {
          schemaVersion: "1.0.0",
          requestId: "REQ-FAILED",
          userMessage: "The provider timed out.",
          failedStage: "provider",
          code: "PROVIDER_TIMEOUT",
          retryable: true,
          failedRunId: "RUN-LIVE-FAILED",
          providerContext: liveRequest(state).providerSelection,
          failureClassification: "provider_timeout",
          recoveryOptions: [],
        },
      },
    });
    expect(failed.pendingLiveAnalysis).toBeNull();
    expect(failed.activeAnalysisRunId).toBe("RUN-LIVE-FAILED");
    expect(failed.candidates).toHaveLength(0);
    expect(failed.analysisRuns.at(-1)?.recovery).toMatchObject({
      recoveryOfRunId: null,
      selectionReason: "initial_choice",
      automaticFailover: false,
      outputsMerged: false,
    });
  });

  it("persists only the safe projection and does not overwrite storage while pending", () => {
    let state = loadCheckpoint();
    const store = new Map<string, string>();
    const session = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    };

    expect(saveCaseState(session, state, NOW)).toBe(true);
    const serialized = serializeCaseState(state, NOW);
    expect(serialized).not.toContain("pendingLiveAnalysis");
    expect(serialized).not.toContain("rawText");

    state = applyOk(state, {
      type: "start_live_analysis",
      meta: meta(state, "cmd-start-persist"),
      request: liveRequest(state),
      recoveryOfRunId: null,
    });
    expect(saveCaseState(session, state, NOW)).toBe(false);

    const restored = loadCaseState(session);
    expect(restored.ok).toBe(true);
    if (!restored.ok) throw new Error(restored.reason);
    expect(restored.state.pendingLiveAnalysis).toBeNull();
    expect(restored.state.segments).toHaveLength(cfnDemoFixture.segments.length);
  });

  it("reset removes the session key and invokes cleanup callbacks once", () => {
    const calls: string[] = [];
    const store = new Map<string, string>([["contextfirst-nexus.case-state.v1", "{}"]]);
    const state = resetCase(
      {
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => store.set(key, value),
        removeItem: (key) => store.delete(key),
      },
      {
        objectUrls: [() => calls.push("url")],
        pdfWorkers: [() => calls.push("worker")],
        documentCaches: [() => calls.push("cache")],
      },
      NOW,
    );
    expect(store.has("contextfirst-nexus.case-state.v1")).toBe(false);
    expect(calls).toEqual(["url", "worker", "cache"]);
    expect(state.caseRevision).toBe(0);
  });
});
