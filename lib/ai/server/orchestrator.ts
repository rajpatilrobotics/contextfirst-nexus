import "server-only";

import {
  AnalysisExecutionResultSchema,
  AnalyzeResponseSchema,
  PreflightApiErrorSchema,
  QuarantinedProposalSchema,
  StartedLiveApiErrorSchema,
  type AnalysisProviderProvenance,
  type CaseCandidate,
  type Citation,
  type LiveAnalysisExecutionResult,
} from "../../contracts";
import { preflightLiveProviderRequest } from "../../security/provider-boundary";
import { buildCanonicalProviderInput } from "./canonical-input";
import { runOpenAIAnalysis } from "./adapters/openai";
import { geminiAdapter } from "./adapters/gemini";
import { runMistralAnalysis } from "./adapters/mistral";
import { buildRecoveryOptions } from "./recovery";
import { failure, normalizeAdapterResult, type AnalysisFailureLike } from "./normalize";
import { postValidateAnalysisProposal } from "./post-validate";
import type { CanonicalProviderInput } from "./types";

const PROVIDER_TIMEOUT_MS = 45_000;
const RESPONSE_SCHEMA_VERSION = "1.0.0" as const;
const RULESET_VERSION = "1.0.0" as const;

export type AdapterOverrides = {
  openai?: typeof runOpenAIAnalysis;
  gemini?: typeof geminiAdapter.analyze;
  mistral?: typeof runMistralAnalysis;
};

type StartedLiveApiError = typeof StartedLiveApiErrorSchema._output;
type PreflightApiError = typeof PreflightApiErrorSchema._output;
type QuarantinedProposal = typeof QuarantinedProposalSchema._output;

export type AnalyzeResult =
  | {
      schemaVersion: "1.0.0";
      outcome: "succeeded";
      run: LiveAnalysisExecutionResult & { status: "succeeded" };
      candidates: CaseCandidate[];
      citations: Citation[];
      quarantined: QuarantinedProposal[];
    }
  | {
      schemaVersion: "1.0.0";
      outcome: "failed";
      run: LiveAnalysisExecutionResult & { status: "failed" };
      candidates: [];
      citations: [];
      quarantined: [];
      error: StartedLiveApiError;
    }
  | {
      schemaVersion: "1.0.0";
      outcome: "rejected_before_run";
      run: null;
      candidates: [];
      citations: [];
      quarantined: [];
      error: PreflightApiError;
    };

export async function analyze(value: unknown, adapters: AdapterOverrides = {}): Promise<AnalyzeResult> {
  const canonical = hasAdapterOverride(adapters)
    ? buildCanonicalProviderInput(value)
    : preflightLiveProviderRequest(value);
  if (!canonical.ok) {
    const response: AnalyzeResult = {
      schemaVersion: "1.0.0",
      outcome: "rejected_before_run",
      run: null,
      candidates: [],
      citations: [],
      quarantined: [],
      error: canonical.error,
    };
    AnalyzeResponseSchema.parse(response);
    return response;
  }

  return runSelectedProvider(canonical.input, adapters);
}

function hasAdapterOverride(adapters: AdapterOverrides): boolean {
  return Boolean(adapters.openai || adapters.gemini || adapters.mistral);
}

async function runSelectedProvider(
  input: CanonicalProviderInput,
  adapters: AdapterOverrides,
): Promise<AnalyzeResult> {
  const runId = nextRunId();
  const startedAt = nowIso();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const adapterResult = await callSelectedAdapter(input, runId, controller.signal, adapters);
    const normalized = normalizeAdapterResult(adapterResult);
    if (!normalized.ok) {
      return failedResponse(input, runId, startedAt, normalized.failure, normalized.provenance, normalized.tokenUsage);
    }

    const validated = postValidateAnalysisProposal(normalized.proposal, input, runId);
    const completedAt = nowIso();
    const run = {
      id: runId,
      mode: "live",
      provider: normalized.provenance,
      promptVersion: input.promptVersion,
      requestSchemaVersion: input.schemaVersion,
      responseSchemaVersion: RESPONSE_SCHEMA_VERSION,
      fixtureVersion: input.fixtureBinding.fixtureVersion,
      rulesetVersion: RULESET_VERSION,
      checkpointProvenance: null,
      startedAt,
      completedAt,
      durationMs: durationMs(startedAt, completedAt),
      inputSegmentCount: input.selectedSegments.length,
      candidateCount: validated.candidates.length,
      citationCount: validated.citations.length,
      quarantinedCount: validated.quarantined.length,
      tokenUsage: normalized.tokenUsage,
      status: "succeeded",
      failure: null,
    } satisfies LiveAnalysisExecutionResult & { status: "succeeded" };
    AnalysisExecutionResultSchema.parse(run);

    const response: AnalyzeResult = {
      schemaVersion: "1.0.0",
      outcome: "succeeded",
      run,
      candidates: validated.candidates,
      citations: validated.citations,
      quarantined: validated.quarantined,
    };
    AnalyzeResponseSchema.parse(response);
    return response;
  } catch {
    const entryFailure = failure(controller.signal.aborted ? "provider_timeout" : "internal_safe_failure");
    return failedResponse(input, runId, startedAt, entryFailure, fallbackProvenance(input));
  } finally {
    clearTimeout(timeout);
  }
}

async function callSelectedAdapter(
  input: CanonicalProviderInput,
  runId: string,
  signal: AbortSignal,
  adapters: AdapterOverrides,
): Promise<Parameters<typeof normalizeAdapterResult>[0]> {
  if (input.release.providerId === "openai") {
    return (adapters.openai ? adapters.openai({ input, signal }) : runOpenAIAnalysis({ input, signal })) as Promise<
      Parameters<typeof normalizeAdapterResult>[0]
    >;
  }
  if (input.release.providerId === "google_gemini") {
    return (adapters.gemini ? adapters.gemini(input, { signal }) : geminiAdapter.analyze(input, { signal })) as Promise<
      Parameters<typeof normalizeAdapterResult>[0]
    >;
  }
  return (adapters.mistral
    ? adapters.mistral(input.request, { signal, runId })
    : runMistralAnalysis(input.request, { signal, runId })) as Promise<Parameters<typeof normalizeAdapterResult>[0]>;
}

function failedResponse(
  input: CanonicalProviderInput,
  runId: string,
  startedAt: string,
  failureValue: AnalysisFailureLike,
  provenance: AnalysisProviderProvenance,
  tokenUsage?: LiveAnalysisExecutionResult["tokenUsage"],
): AnalyzeResult {
  const completedAt = nowIso();
  const run = {
    id: runId,
    mode: "live",
    provider: provenance,
    promptVersion: input.promptVersion,
    requestSchemaVersion: input.schemaVersion,
    responseSchemaVersion: RESPONSE_SCHEMA_VERSION,
    fixtureVersion: input.fixtureBinding.fixtureVersion,
    rulesetVersion: RULESET_VERSION,
    checkpointProvenance: null,
    startedAt,
    completedAt,
    durationMs: durationMs(startedAt, completedAt),
    inputSegmentCount: input.selectedSegments.length,
    candidateCount: 0,
    citationCount: 0,
    quarantinedCount: 0,
    tokenUsage,
    status: "failed",
    failure: failureValue,
  } satisfies LiveAnalysisExecutionResult & { status: "failed" };
  AnalysisExecutionResultSchema.parse(run);

  const error = StartedLiveApiErrorSchema.parse({
    schemaVersion: "1.0.0",
    requestId: `REQ-${runId}`,
    userMessage: "The selected live analysis run could not complete safely.",
    failedStage: "provider_execution",
    code: failureValue.safeErrorCode,
    retryable: failureValue.retryableSameProvider,
    failedRunId: runId,
    providerContext: input.request.providerSelection,
    failureClassification: failureValue.classification,
    recoveryOptions: buildRecoveryOptions(
      failureValue,
      input.request.providerSelection.releaseConfigurationId,
    ),
  });

  const response: AnalyzeResult = {
    schemaVersion: "1.0.0",
    outcome: "failed",
    run,
    candidates: [],
    citations: [],
    quarantined: [],
    error,
  };
  AnalyzeResponseSchema.parse(response);
  return response;
}

function fallbackProvenance(input: CanonicalProviderInput): AnalysisProviderProvenance {
  return {
    ...input.release,
    requestedModel:
      input.release.providerId === "openai"
        ? "gpt-5.6-sol"
        : input.release.providerId === "google_gemini"
          ? "gemini-3.5-flash"
          : "mistral-small-2603",
    adapterVersion: "task-011-shared-boundary-v1",
    returnedModel: null,
    inferenceSetting:
      input.release.providerId === "google_gemini"
        ? { kind: "thinking_level", value: "medium" }
        : { kind: "reasoning_effort", value: "medium" },
    disclosureVersion: "1.0.0",
    providerTransmission: true,
  } as AnalysisProviderProvenance;
}

function nextRunId(): string {
  return `RUN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function durationMs(start: string, end: string): number {
  return Math.max(0, Date.parse(end) - Date.parse(start));
}
