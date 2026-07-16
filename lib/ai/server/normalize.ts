import "server-only";

import {
  AnalysisFailureSchema,
  ModelAnalysisProposalSchema,
  type AnalysisProviderProvenance,
  type LiveAnalysisExecutionResult,
} from "../../contracts";

export type FailureClassification =
  | "provider_authentication_failed"
  | "provider_service_tier_unavailable"
  | "provider_quota_exhausted"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_unavailable"
  | "provider_refusal"
  | "invalid_structured_response"
  | "citation_validation_failed"
  | "prohibited_output"
  | "safety_validation_failed"
  | "internal_safe_failure";

export type AnalysisFailureLike = {
  classification: FailureClassification;
  safeErrorCode: string;
  retryableSameProvider: boolean;
  alternateProviderRecoveryAllowed: boolean;
  replayRecoveryAllowed: boolean;
};

export type NormalizedProviderResult =
  | {
      ok: true;
      proposal: ReturnType<typeof ModelAnalysisProposalSchema.parse>;
      provenance: AnalysisProviderProvenance;
      tokenUsage?: LiveAnalysisExecutionResult["tokenUsage"];
    }
  | {
      ok: false;
      failure: AnalysisFailureLike;
      provenance: AnalysisProviderProvenance;
      tokenUsage?: LiveAnalysisExecutionResult["tokenUsage"];
    };

type OpenLikeResult = {
  ok: boolean;
  proposal?: unknown;
  provenance?: AnalysisProviderProvenance;
  failure?: AnalysisFailureLike;
  error?: { classification?: FailureClassification };
  usage?: unknown;
  tokenUsage?: LiveAnalysisExecutionResult["tokenUsage"];
  run?: LiveAnalysisExecutionResult;
};

export function normalizeAdapterResult(result: OpenLikeResult): NormalizedProviderResult {
  if (result.ok) {
    const proposal = ModelAnalysisProposalSchema.parse(result.proposal);
    return {
      ok: true,
      proposal,
      provenance: result.provenance ?? requireProvenance(result.run?.provider),
      tokenUsage: normalizeUsage(result.tokenUsage ?? result.usage ?? result.run?.tokenUsage),
    };
  }

  return {
    ok: false,
    failure:
      (result.failure as AnalysisFailureLike | undefined) ??
      (result.run?.failure as AnalysisFailureLike | undefined) ??
      failure(result.error?.classification ?? "internal_safe_failure"),
    provenance: result.provenance ?? requireProvenance(result.run?.provider),
    tokenUsage: normalizeUsage(result.tokenUsage ?? result.run?.tokenUsage),
  };
}

function requireProvenance(value: AnalysisProviderProvenance | undefined): AnalysisProviderProvenance {
  if (!value) throw new Error("Provider result did not include provenance.");
  return value;
}

export function failure(classification: FailureClassification): AnalysisFailureLike {
  const map = {
    provider_authentication_failed: ["PROVIDER_AUTHENTICATION_FAILED", false, true, true],
    provider_service_tier_unavailable: ["PROVIDER_SERVICE_TIER_UNAVAILABLE", false, true, true],
    provider_quota_exhausted: ["PROVIDER_QUOTA_EXHAUSTED", true, true, true],
    provider_rate_limited: ["PROVIDER_RATE_LIMITED", true, true, true],
    provider_timeout: ["PROVIDER_TIMEOUT", true, true, true],
    provider_unavailable: ["PROVIDER_UNAVAILABLE", true, true, true],
    provider_refusal: ["PROVIDER_REFUSAL", false, false, false],
    invalid_structured_response: ["INVALID_STRUCTURED_RESPONSE", false, false, false],
    citation_validation_failed: ["CITATION_VALIDATION_FAILED", false, false, false],
    prohibited_output: ["PROHIBITED_OUTPUT", false, false, false],
    safety_validation_failed: ["SAFETY_VALIDATION_FAILED", false, false, false],
    internal_safe_failure: ["INTERNAL_SAFE_FAILURE", false, false, false],
  } as const;
  const [safeErrorCode, retryableSameProvider, alternateProviderRecoveryAllowed, replayRecoveryAllowed] =
    map[classification];
  return AnalysisFailureSchema.parse({
    classification,
    safeErrorCode,
    retryableSameProvider,
    alternateProviderRecoveryAllowed,
    replayRecoveryAllowed,
  }) as AnalysisFailureLike;
}

function normalizeUsage(value: unknown): LiveAnalysisExecutionResult["tokenUsage"] | undefined {
  if (!value || typeof value !== "object") return undefined;
  const usage = value as Record<string, unknown>;
  const input =
    numberValue(usage.input) ??
    numberValue(usage.input_tokens) ??
    numberValue(usage.promptTokens) ??
    numberValue(usage.prompt_tokens);
  const output =
    numberValue(usage.output) ??
    numberValue(usage.output_tokens) ??
    numberValue(usage.completionTokens) ??
    numberValue(usage.completion_tokens);
  const total = numberValue(usage.total) ?? numberValue(usage.total_tokens);
  if (input === undefined && output === undefined && total === undefined) return undefined;
  return {
    input: input ?? 0,
    output: output ?? 0,
    total: total ?? (input ?? 0) + (output ?? 0),
  };
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : undefined;
}
