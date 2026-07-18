import type { z } from "zod";
import {
  ApiErrorSchema,
  CasePurposeBriefSchema,
  type AnalysisTransportFailureReason,
  type CaseCommand,
  type CaseState,
  type ReplayRequest,
} from "../../../lib/contracts";
import type { CaseCommandResult } from "../../../lib/state";
import { TRUSTED_REPLAY_BUNDLE_ID } from "../../../lib/analysis/replay";

export type CaseCommandDispatcher = (command: CaseCommand) => CaseCommandResult;
export type RunControllerApiError = z.infer<typeof ApiErrorSchema>;

// Keep the established result shape while TASK-039 removes every live execution path.
// Existing Documents presentation code still handles restored legacy terminal states.
export type RunControllerResult =
  | { status: "completed"; outcome: "live_succeeded" | "replay_succeeded"; commandResult: CaseCommandResult }
  | { status: "failed"; error: RunControllerApiError; commandResult: CaseCommandResult }
  | { status: "rejected"; error: RunControllerApiError; commandResult: CaseCommandResult }
  | { status: "blocked"; reason: string; commandResult?: CaseCommandResult }
  | {
      status: "transport_failed";
      reasonCode: AnalysisTransportFailureReason;
      requestId: string;
      commandResult: CaseCommandResult;
    };

export type RunControllerOptions = {
  state: CaseState;
  dispatchCaseCommand: CaseCommandDispatcher;
  // Retained temporarily for compatibility with pre-TASK-039 callers. Any recovery
  // request fails closed because public replay is never a live-provider fallback.
  recoveryOfRunId?: string | null;
  // Retained for injected consumer/test compatibility. Replay never reads or calls it.
  fetchImpl?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response | null | undefined>;
  now?: () => string;
};

function commandMeta(state: CaseState, now: () => string): CaseCommand["meta"] {
  const createdAt = now();
  const nonce = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    commandId: `CMD-REPLAY-${nonce}`,
    idempotencyKey: `IDEM-REPLAY-${nonce}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt,
  };
}

function requirePreparedReplayPurpose(state: CaseState) {
  const purpose = state.purposeBrief;
  if (!purpose || purpose.status !== "complete") {
    throw new Error("purpose_incomplete");
  }

  const parsed = CasePurposeBriefSchema.safeParse(purpose);
  if (!parsed.success || parsed.data.caseId !== state.caseId) {
    throw new Error("analysis_service_unavailable");
  }

  const selection = parsed.data.providerSelection;
  if (
    selection.providerId !== "local_replay"
    || selection.releaseConfigurationId !== "prepared-replay-v1"
    || selection.serviceTier !== "local"
  ) {
    throw new Error("analysis_service_unavailable");
  }

  const acknowledgement = selection.disclosureAcknowledgement;
  if (
    acknowledgement.providerId !== "local_replay"
    || acknowledgement.releaseConfigurationId !== "prepared-replay-v1"
    || acknowledgement.serviceTier !== "local"
    || acknowledgement.disclosureVersion !== "1.0.0"
    || acknowledgement.dataFlowAcknowledged !== true
    || acknowledgement.retentionAndTrainingUseAcknowledged !== true
    || acknowledgement.serviceTierAcknowledged !== true
  ) {
    throw new Error("analysis_service_unavailable");
  }

  return parsed.data;
}

export function buildReplayRequest(state: CaseState): ReplayRequest {
  const purpose = requirePreparedReplayPurpose(state);
  return {
    mode: "deterministic_replay",
    replayBundleId: TRUSTED_REPLAY_BUNDLE_ID,
    caseId: "CFN-DEMO-001",
    releaseConfigurationId: "prepared-replay-v1",
    providerDisclosureAcknowledgementId:
      purpose.providerSelection.disclosureAcknowledgement.id,
    recoveryOfRunId: null,
    fixtureVersion: "1.0.0",
    promptVersion: "1.0.0",
    analysisResponseVersion: "1.0.0",
    replayVersion: "1.0.0",
  };
}

export async function runSelectedAnalysis({
  state,
  dispatchCaseCommand,
  recoveryOfRunId = null,
  now = () => new Date().toISOString(),
}: RunControllerOptions): Promise<RunControllerResult> {
  let request: ReplayRequest;
  try {
    request = buildReplayRequest(state);
  } catch (error) {
    return {
      status: "blocked",
      reason: error instanceof Error
        ? error.message
        : "analysis_service_unavailable",
    };
  }

  if (recoveryOfRunId !== null || state.pendingLiveAnalysis !== null) {
    return { status: "blocked", reason: "analysis_service_unavailable" };
  }
  if (
    state.masking.reviewStatus !== "approved"
    || state.masking.leakScanStatus !== "passed"
  ) {
    return { status: "blocked", reason: "mask_review_incomplete" };
  }
  if (state.selectedSegmentIds.length === 0) {
    return { status: "blocked", reason: "segments_not_selected" };
  }

  const result = dispatchCaseCommand({
    type: "run_deterministic_replay",
    meta: commandMeta(state, now),
    request,
  });
  return result.ok
    ? {
        status: "completed",
        outcome: "replay_succeeded",
        commandResult: result,
      }
    : {
        status: "blocked",
        reason: result.reason,
        commandResult: result,
      };
}
