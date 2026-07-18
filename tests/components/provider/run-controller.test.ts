import { describe, expect, it, vi } from "vitest";
import {
  CasePurposeBriefSchema,
  type CaseCommand,
  type CaseState,
} from "../../../lib/contracts";
import {
  applyCaseCommand,
  createInitialCaseState,
  type CaseCommandResult,
} from "../../../lib/state";
import {
  trustedApprovedMasking,
  trustedPurposeBrief,
  trustedSegments,
} from "../../../lib/analysis/replay";
import { cfnDemoFixture } from "../../../lib/fixtures";
import {
  buildReplayRequest,
  runSelectedAnalysis,
} from "../../../features/analysis/run-controller";

const NOW = "2026-07-16T10:00:00.000Z";

function readyReplayState(): CaseState {
  return {
    ...createInitialCaseState(NOW),
    purposeBrief: trustedPurposeBrief(),
    segments: trustedSegments(),
    selectedSegmentIds: [...cfnDemoFixture.selectedSegmentIds],
    masking: trustedApprovedMasking(),
  };
}

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

describe("TASK-039 replay-only analysis run controller", () => {
  it("builds only the frozen trusted local replay request without recovery", () => {
    const request = buildReplayRequest(readyReplayState());

    expect(request).toEqual({
      mode: "deterministic_replay",
      replayBundleId: "REPLAY-CFN-DEMO-001-V1",
      caseId: "CFN-DEMO-001",
      releaseConfigurationId: "prepared-replay-v1",
      providerDisclosureAcknowledgementId: "ACK-CFN-DEMO-REPLAY",
      recoveryOfRunId: null,
      fixtureVersion: "1.0.0",
      promptVersion: "1.0.0",
      analysisResponseVersion: "1.0.0",
      replayVersion: "1.0.0",
    });
  });

  it("dispatches the trusted replay exactly once with no fetch and records zero provider transmission", async () => {
    const harness = dispatcher(readyReplayState());
    const fetchImpl = vi.fn();

    const result = await runSelectedAnalysis({
      state: harness.getState(),
      dispatchCaseCommand: harness.dispatch,
      fetchImpl,
      now: () => NOW,
    });

    expect(result.status).toBe("completed");
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(harness.commands).toHaveLength(1);
    expect(harness.commands[0]).toMatchObject({
      type: "run_deterministic_replay",
      request: {
        replayBundleId: "REPLAY-CFN-DEMO-001-V1",
        releaseConfigurationId: "prepared-replay-v1",
        recoveryOfRunId: null,
      },
    });

    const activeRun = harness.getState().analysisRuns.find(
      (run) => run.id === harness.getState().activeAnalysisRunId,
    );
    expect(activeRun).toMatchObject({
      mode: "deterministic_replay",
      provider: {
        providerId: "local_replay",
        releaseConfigurationId: "prepared-replay-v1",
        providerTransmission: false,
      },
    });
  });

  it.each([
    ["live-bound purpose", (state: CaseState): CaseState => ({
      ...state,
      purposeBrief: livePurpose(),
    })],
    ["mismatched replay release", (state: CaseState): CaseState => ({
      ...state,
      purposeBrief: {
        ...trustedPurposeBrief(),
        providerSelection: {
          ...trustedPurposeBrief().providerSelection,
          releaseConfigurationId: "openai-quality-v1",
        },
      } as unknown as CaseState["purposeBrief"],
    })],
    ["unacknowledged replay disclosure", (state: CaseState): CaseState => ({
      ...state,
      purposeBrief: {
        ...trustedPurposeBrief(),
        providerSelection: {
          ...trustedPurposeBrief().providerSelection,
          disclosureAcknowledgement: {
            ...trustedPurposeBrief().providerSelection.disclosureAcknowledgement,
            dataFlowAcknowledged: false,
          },
        },
      } as unknown as CaseState["purposeBrief"],
    })],
  ])("fails closed for %s without dispatch or fetch", async (_label, mutate) => {
    const state = mutate(readyReplayState());
    const dispatchCaseCommand = vi.fn();
    const fetchImpl = vi.fn();

    const result = await runSelectedAnalysis({
      state,
      dispatchCaseCommand,
      fetchImpl,
      now: () => NOW,
    });

    expect(result).toEqual({
      status: "blocked",
      reason: "analysis_service_unavailable",
    });
    expect(dispatchCaseCommand).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects legacy recovery input without dispatching or fetching", async () => {
    const dispatchCaseCommand = vi.fn();
    const fetchImpl = vi.fn();

    const result = await runSelectedAnalysis({
      state: readyReplayState(),
      dispatchCaseCommand,
      recoveryOfRunId: "RUN-LIVE-FAILED-LEGACY",
      fetchImpl,
      now: () => NOW,
    });

    expect(result).toEqual({
      status: "blocked",
      reason: "analysis_service_unavailable",
    });
    expect(dispatchCaseCommand).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    ["purpose_incomplete", (state: CaseState): CaseState => ({
      ...state,
      purposeBrief: null,
    })],
    ["mask_review_incomplete", (state: CaseState): CaseState => ({
      ...state,
      masking: { ...state.masking, reviewStatus: "pending" },
    })],
    ["segments_not_selected", (state: CaseState): CaseState => ({
      ...state,
      selectedSegmentIds: [],
    })],
  ])("preserves the deterministic prerequisite reason %s", async (reason, mutate) => {
    const dispatchCaseCommand = vi.fn();
    const fetchImpl = vi.fn();

    const result = await runSelectedAnalysis({
      state: mutate(readyReplayState()),
      dispatchCaseCommand,
      fetchImpl,
      now: () => NOW,
    });

    expect(result).toEqual({ status: "blocked", reason });
    expect(dispatchCaseCommand).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
