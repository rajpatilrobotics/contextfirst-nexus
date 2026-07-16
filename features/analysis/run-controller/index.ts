import type { z } from "zod";
import {
  AnalyzeRequestSchema,
  AnalyzeResponseSchema,
  ApiErrorSchema,
  type AnalysisTransportFailureReason,
  type AnalyzeRequest,
  type CaseCommand,
  type CaseState,
  type ReplayRequest,
} from "../../../lib/contracts";
import type { CaseCommandResult } from "../../../lib/state";
import { cfnDemoFixture } from "../../../lib/fixtures";
import { TRUSTED_REPLAY_BUNDLE_ID } from "../../../lib/analysis/replay";

export type CaseCommandDispatcher = (command: CaseCommand) => CaseCommandResult;
export type RunControllerApiError = z.infer<typeof ApiErrorSchema>;

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
  recoveryOfRunId?: string | null;
  fetchImpl?: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response | null | undefined>;
  now?: () => string;
};

function hasAnalyzeOutcome(
  value: unknown,
): value is {
  outcome: "succeeded" | "failed" | "rejected_before_run";
  error?: unknown;
} {
  if (typeof value !== "object" || value === null || !("outcome" in value)) return false;
  return value.outcome === "succeeded"
    || value.outcome === "failed"
    || value.outcome === "rejected_before_run";
}

function commandMeta(state: CaseState, prefix: string, now: () => string): CaseCommand["meta"] {
  const createdAt = now();
  const nonce = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    commandId: `CMD-${prefix}-${nonce}`,
    idempotencyKey: `IDEM-${prefix}-${nonce}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt,
  };
}

export function buildAnalyzeRequest(state: CaseState): AnalyzeRequest {
  const purpose = state.purposeBrief;
  if (!purpose || purpose.status !== "complete") throw new Error("purpose_incomplete");
  if (purpose.providerSelection.providerId === "local_replay") throw new Error("live_provider_not_selected");
  if (state.masking.reviewStatus !== "approved" || state.masking.leakScanStatus !== "passed") {
    throw new Error("mask_review_incomplete");
  }
  if (state.selectedSegmentIds.length === 0) throw new Error("segments_not_selected");

  return AnalyzeRequestSchema.parse({
    schemaVersion: "1.0.0",
    caseId: "CFN-DEMO-001",
    fixtureVersion: "1.0.0",
    canonicalFixtureDigest: cfnDemoFixture.canonicalFixtureDigest,
    purposeBriefId: purpose.id,
    purposeContext: {
      practitionerRole: purpose.practitionerRole,
      jurisdictionCode: purpose.jurisdictionCode,
      sourceLanguage: "en",
      requestedExport: purpose.requestedExport,
    },
    maskReviewApproved: true,
    leakScanStatus: "passed",
    requestedMode: "live",
    providerSelection: {
      providerId: purpose.providerSelection.providerId,
      releaseConfigurationId: purpose.providerSelection.releaseConfigurationId,
      serviceTier: purpose.providerSelection.serviceTier,
    },
    providerDisclosureAcknowledgement: purpose.providerSelection.disclosureAcknowledgement,
    selectedSegmentIds: [...state.selectedSegmentIds],
    maskApprovals: state.masking.suggestions
      .filter((mask) => mask.reviewStatus === "approved" || mask.reviewStatus === "edited")
      .map((mask) => ({
        maskId: mask.id,
        segmentId: mask.segmentId,
        originalStart: mask.originalStart,
        originalEnd: mask.originalEnd,
        maskClass: mask.maskClass,
        replacementToken: mask.replacementToken,
        reviewStatus: mask.reviewStatus,
      })),
  });
}

export function buildReplayRequest(state: CaseState, recoveryOfRunId: string | null): ReplayRequest {
  const purpose = state.purposeBrief;
  if (!purpose || purpose.status !== "complete") throw new Error("purpose_incomplete");
  if (purpose.providerSelection.providerId !== "local_replay") throw new Error("replay_not_selected");
  return {
    mode: "deterministic_replay",
    replayBundleId: TRUSTED_REPLAY_BUNDLE_ID,
    caseId: "CFN-DEMO-001",
    releaseConfigurationId: "prepared-replay-v1",
    providerDisclosureAcknowledgementId: purpose.providerSelection.disclosureAcknowledgement.id,
    recoveryOfRunId,
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
  fetchImpl = fetch,
  now = () => new Date().toISOString(),
}: RunControllerOptions): Promise<RunControllerResult> {
  const purpose = state.purposeBrief;
  if (!purpose || purpose.status !== "complete") return { status: "blocked", reason: "purpose_incomplete" };

  if (purpose.providerSelection.providerId === "local_replay") {
    let request: ReplayRequest;
    try {
      request = buildReplayRequest(state, recoveryOfRunId);
    } catch (error) {
      return { status: "blocked", reason: error instanceof Error ? error.message : "replay_request_invalid" };
    }
    const result = dispatchCaseCommand({
      type: "run_deterministic_replay",
      meta: commandMeta(state, "REPLAY", now),
      request,
    });
    return result.ok
      ? { status: "completed", outcome: "replay_succeeded", commandResult: result }
      : { status: "blocked", reason: result.reason, commandResult: result };
  }

  let request: AnalyzeRequest;
  try {
    request = buildAnalyzeRequest(state);
  } catch (error) {
    return { status: "blocked", reason: error instanceof Error ? error.message : "analysis_request_invalid" };
  }

  const startMeta = commandMeta(state, "START-LIVE", now);
  const startResult = dispatchCaseCommand({
    type: "start_live_analysis",
    meta: startMeta,
    request,
    recoveryOfRunId,
  });
  if (!startResult.ok || startResult.networkAuthorized !== true) {
    return {
      status: "blocked",
      reason: startResult.ok ? "network_not_authorized" : startResult.reason,
      commandResult: startResult,
    };
  }

  let response: Response | null | undefined;
  try {
    response = await fetchImpl("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    return recordTransportFailure(
      startResult.state,
      startMeta.commandId,
      "network_unavailable",
      dispatchCaseCommand,
      now,
    );
  }
  if (!response) {
    return recordTransportFailure(
      startResult.state,
      startMeta.commandId,
      "response_unavailable",
      dispatchCaseCommand,
      now,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return recordTransportFailure(
      startResult.state,
      startMeta.commandId,
      "invalid_response_envelope",
      dispatchCaseCommand,
      now,
    );
  }
  const parsed = AnalyzeResponseSchema.safeParse(payload);
  if (!parsed.success || !hasAnalyzeOutcome(parsed.data)) {
    return recordTransportFailure(
      startResult.state,
      startMeta.commandId,
      "invalid_response_envelope",
      dispatchCaseCommand,
      now,
    );
  }

  const parsedError = parsed.data.outcome === "succeeded"
    ? null
    : ApiErrorSchema.safeParse(parsed.data.error);
  if (parsedError && !parsedError.success) {
    return recordTransportFailure(
      startResult.state,
      startMeta.commandId,
      "invalid_response_envelope",
      dispatchCaseCommand,
      now,
    );
  }

  const terminalMeta = commandMeta(startResult.state, "TERMINAL-LIVE", now);
  const command: CaseCommand = parsed.data.outcome === "succeeded"
    ? { type: "complete_live_analysis", meta: terminalMeta, startCommandId: startMeta.commandId, response: parsed.data }
    : parsed.data.outcome === "failed"
      ? { type: "fail_live_analysis", meta: terminalMeta, startCommandId: startMeta.commandId, response: parsed.data }
      : { type: "reject_live_analysis_preflight", meta: terminalMeta, startCommandId: startMeta.commandId, response: parsed.data };
  const terminalResult = dispatchCaseCommand(command);
  if (!terminalResult.ok) {
    return { status: "blocked", reason: terminalResult.reason, commandResult: terminalResult };
  }
  if (parsed.data.outcome === "failed" && parsedError?.success) {
    return { status: "failed", error: parsedError.data, commandResult: terminalResult };
  }
  if (parsed.data.outcome === "rejected_before_run" && parsedError?.success) {
    return { status: "rejected", error: parsedError.data, commandResult: terminalResult };
  }
  return { status: "completed", outcome: "live_succeeded", commandResult: terminalResult };
}

function recordTransportFailure(
  state: CaseState,
  startCommandId: string,
  reasonCode: AnalysisTransportFailureReason,
  dispatchCaseCommand: CaseCommandDispatcher,
  now: () => string,
): RunControllerResult {
  const result = dispatchCaseCommand({
    type: "record_live_analysis_transport_failure",
    meta: commandMeta(state, "TRANSPORT-FAILURE", now),
    startCommandId,
    reasonCode,
  });
  return result.ok
    ? { status: "transport_failed", reasonCode, requestId: startCommandId, commandResult: result }
    : { status: "blocked", reason: result.reason, commandResult: result };
}
