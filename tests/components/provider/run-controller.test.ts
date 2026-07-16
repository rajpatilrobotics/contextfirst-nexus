import { describe, expect, it, vi } from "vitest";
import {
  AnalyzeResponseSchema,
  CasePurposeBriefSchema,
  type AnalysisTransportFailureReason,
  type CaseCommand,
  type CaseState,
} from "../../../lib/contracts";
import { applyCaseCommand, createInitialCaseState, type CaseCommandResult } from "../../../lib/state";
import { trustedApprovedMasking, trustedPurposeBrief, trustedSegments } from "../../../lib/analysis/replay";
import { cfnDemoFixture } from "../../../lib/fixtures";
import {
  buildAnalyzeRequest,
  runSelectedAnalysis,
  type RunControllerOptions,
} from "../../../features/analysis/run-controller";

const NOW = "2026-07-16T10:00:00.000Z";
type FetchImplementation = NonNullable<RunControllerOptions["fetchImpl"]>;

const transportFailures = [
  ["network_unavailable", async (): Promise<Response | null | undefined> => { throw new Error("offline"); }],
  ["response_unavailable", async (): Promise<Response | null | undefined> => undefined],
  ["invalid_response_envelope", async (): Promise<Response | null | undefined> => jsonResponse({ unexpected: true })],
] as const satisfies ReadonlyArray<readonly [AnalysisTransportFailureReason, FetchImplementation]>;

function livePurpose() {
  const replay = trustedPurposeBrief();
  return CasePurposeBriefSchema.parse({
    ...replay,
    providerSelection: {
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      serviceTier: "paid",
      disclosureAcknowledgement: {
        ...replay.providerSelection.disclosureAcknowledgement,
        id: "ACK-OPENAI-TEST",
        providerId: "openai",
        releaseConfigurationId: "openai-quality-v1",
        serviceTier: "paid",
      },
    },
  });
}

function readyState(mode: "live" | "replay" = "live"): CaseState {
  return {
    ...createInitialCaseState(NOW),
    purposeBrief: mode === "live" ? livePurpose() : trustedPurposeBrief(),
    segments: trustedSegments(),
    selectedSegmentIds: [...cfnDemoFixture.selectedSegmentIds],
    masking: trustedApprovedMasking(),
  };
}

function dispatcher(initial: CaseState) {
  let state = initial;
  const commands: CaseCommand[] = [];
  const dispatch = (command: CaseCommand): CaseCommandResult => {
    commands.push(command);
    const result = applyCaseCommand(state, command);
    if (result.ok) state = result.state;
    return result;
  };
  return { dispatch, commands, getState: () => state };
}

function liveRun(status: "succeeded" | "failed") {
  return {
    id: status === "succeeded" ? "RUN-LIVE-SUCCESS" : "RUN-LIVE-FAILED",
    mode: "live" as const,
    provider: {
      providerId: "openai" as const,
      releaseConfigurationId: "openai-quality-v1" as const,
      requestedModel: "gpt-5.6-sol" as const,
      serviceTier: "paid" as const,
      adapterVersion: "test-adapter",
      returnedModel: "gpt-5.6-sol",
      inferenceSetting: { kind: "reasoning_effort" as const, value: "medium" as const },
      disclosureVersion: "1.0.0" as const,
      providerTransmission: true as const,
    },
    promptVersion: "1.0.0" as const,
    requestSchemaVersion: "1.0.0" as const,
    responseSchemaVersion: "1.0.0" as const,
    fixtureVersion: "1.0.0" as const,
    rulesetVersion: "1.0.0" as const,
    checkpointProvenance: null,
    startedAt: NOW,
    completedAt: NOW,
    durationMs: 10,
    inputSegmentCount: cfnDemoFixture.selectedSegmentIds.length,
    candidateCount: 0,
    citationCount: 0,
    quarantinedCount: 0,
    status,
    failure: status === "failed"
      ? { classification: "provider_timeout" as const, safeErrorCode: "PROVIDER_TIMEOUT" as const, retryableSameProvider: true as const, alternateProviderRecoveryAllowed: true as const, replayRecoveryAllowed: true as const }
      : null,
  };
}

function jsonResponse(value: unknown) {
  return new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("TASK-018 analysis run controller", () => {
  it("builds only the strict ID-and-mask request", () => {
    const state = readyState();
    const request = buildAnalyzeRequest(state);
    expect(request).toMatchObject({ requestedMode: "live", caseId: "CFN-DEMO-001" });
    expect(request.selectedSegmentIds).toEqual(state.selectedSegmentIds);
    expect(request).not.toHaveProperty("statedPurpose");
    expect(request).not.toHaveProperty("intendedRecipient");
    expect(request).not.toHaveProperty("recoveryOfRunId");
    expect(JSON.stringify(request)).not.toContain(state.purposeBrief?.statedPurpose ?? "not-present");
  });

  it("dispatches start before exactly one POST and maps success to completion", async () => {
    const harness = dispatcher(readyState());
    const succeeded = AnalyzeResponseSchema.parse({
      schemaVersion: "1.0.0", outcome: "succeeded", run: liveRun("succeeded"), candidates: [], citations: [], quarantined: [],
    });
    const fetchImpl = vi.fn(async (
      _input: RequestInfo | URL,
      _init?: RequestInit,
    ): Promise<Response> => {
      expect(harness.commands[0].type).toBe("start_live_analysis");
      expect(harness.getState().pendingLiveAnalysis).not.toBeNull();
      return jsonResponse(succeeded);
    });
    const result = await runSelectedAnalysis({ state: harness.getState(), dispatchCaseCommand: harness.dispatch, fetchImpl, now: () => NOW });
    expect(result.status).toBe("completed");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(harness.commands.map((command) => command.type)).toEqual(["start_live_analysis", "complete_live_analysis"]);
    const body = JSON.parse(fetchImpl.mock.calls[0][1]?.body as string);
    expect(body).not.toHaveProperty("recoveryOfRunId");
    expect(harness.getState().analysisRuns).toHaveLength(1);
  });

  it("maps failed and preflight terminal unions to only their matching commands", async () => {
    const failedHarness = dispatcher(readyState());
    const failed = AnalyzeResponseSchema.parse({
      schemaVersion: "1.0.0",
      outcome: "failed",
      run: liveRun("failed"),
      candidates: [], citations: [], quarantined: [],
      error: {
        schemaVersion: "1.0.0", requestId: "REQ-FAILED", userMessage: "Provider timed out.", failedStage: "candidate_extraction",
        code: "PROVIDER_TIMEOUT", retryable: true, failedRunId: "RUN-LIVE-FAILED",
        providerContext: { providerId: "openai", releaseConfigurationId: "openai-quality-v1", serviceTier: "paid" },
        failureClassification: "provider_timeout", recoveryOptions: [],
      },
    });
    await runSelectedAnalysis({ state: failedHarness.getState(), dispatchCaseCommand: failedHarness.dispatch, fetchImpl: async () => jsonResponse(failed), now: () => NOW });
    expect(failedHarness.commands.map((command) => command.type)).toEqual(["start_live_analysis", "fail_live_analysis"]);

    const preflightHarness = dispatcher(readyState());
    const preflight = AnalyzeResponseSchema.parse({
      schemaVersion: "1.0.0", outcome: "rejected_before_run", run: null, candidates: [], citations: [], quarantined: [],
      error: {
        schemaVersion: "1.0.0", requestId: "REQ-PREFLIGHT", userMessage: "Provider is not configured.", failedStage: "provider_selection",
        code: "PROVIDER_NOT_CONFIGURED", retryable: false, failedRunId: null,
        providerContext: { providerId: "openai", releaseConfigurationId: "openai-quality-v1", serviceTier: "paid" },
        failureClassification: null, recoveryOptions: [],
      },
    });
    await runSelectedAnalysis({ state: preflightHarness.getState(), dispatchCaseCommand: preflightHarness.dispatch, fetchImpl: async () => jsonResponse(preflight), now: () => NOW });
    expect(preflightHarness.commands.map((command) => command.type)).toEqual(["start_live_analysis", "reject_live_analysis_preflight"]);
    expect(preflightHarness.getState().analysisRuns).toHaveLength(0);
  });

  it("does not POST when the start transition is rejected", async () => {
    const fetchImpl = vi.fn();
    const rejectedDispatch = vi.fn((command: CaseCommand): CaseCommandResult => ({ ok: false, state: readyState(), reason: command.type === "start_live_analysis" ? "stale_case_revision" : "unexpected" }));
    const result = await runSelectedAnalysis({ state: readyState(), dispatchCaseCommand: rejectedDispatch, fetchImpl, now: () => NOW });
    expect(result).toMatchObject({ status: "blocked", reason: "stale_case_revision" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each(transportFailures)("records %s without inventing a run", async (reasonCode, fetchImpl) => {
    const harness = dispatcher(readyState());
    const result = await runSelectedAnalysis({ state: harness.getState(), dispatchCaseCommand: harness.dispatch, fetchImpl, now: () => NOW });
    expect(result).toMatchObject({ status: "transport_failed", reasonCode });
    expect(harness.commands.map((command) => command.type)).toEqual(["start_live_analysis", "record_live_analysis_transport_failure"]);
    expect(harness.getState().pendingLiveAnalysis).toBeNull();
    expect(harness.getState().analysisRuns).toHaveLength(0);
  });

  it("runs deterministic replay locally with the trusted ID and no POST", async () => {
    const harness = dispatcher(readyState("replay"));
    const fetchImpl = vi.fn();
    const result = await runSelectedAnalysis({ state: harness.getState(), dispatchCaseCommand: harness.dispatch, fetchImpl, now: () => NOW });
    expect(result.status).toBe("completed");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(harness.commands).toHaveLength(1);
    expect(harness.commands[0]).toMatchObject({ type: "run_deterministic_replay", request: { replayBundleId: "REPLAY-CFN-DEMO-001-V1" } });
  });
});
