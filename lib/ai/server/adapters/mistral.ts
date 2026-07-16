import "server-only";

import { Mistral } from "@mistralai/mistralai";
import type { ChatCompletionResponse } from "@mistralai/mistralai/models/components/chatcompletionresponse";
import type { ChatCompletionRequest } from "@mistralai/mistralai/models/components/chatcompletionrequest";
import type { RequestOptions } from "@mistralai/mistralai/lib/sdks";
import { z } from "zod";

import {
  AnalysisFailureSchema,
  AnalysisProviderProvenanceSchema,
  LiveAnalysisExecutionResultSchema,
  ModelAnalysisProposalSchema,
  type AnalysisFailure,
  type AnalyzeRequest,
  type LiveAnalysisExecutionResult,
  type SafeErrorCode,
} from "../../../contracts";
import { buildCanonicalProviderInput } from "../canonical-input";
import { getRegistryEntry } from "../registry";
import { buildProviderRequestPolicy, buildSharedPrompt } from "../request-policy";
import {
  ADAPTER_VERSION,
  AI_BOUNDARY_VERSION,
  CFN_DEMO_FIXTURE_BINDING,
  SHARED_PROMPT_VERSION,
  type CanonicalProviderInput,
} from "../types";

const MISTRAL_RELEASE = {
  providerId: "mistral",
  releaseConfigurationId: "mistral-small-free-v1",
  requestedModel: "mistral-small-2603",
  serviceTier: "unpaid",
} as const;

const MISTRAL_INFERENCE_SETTING = { kind: "reasoning_effort", value: "medium" } as const;
const RESPONSE_SCHEMA_VERSION = "1.0.0" as const;
const RULESET_VERSION = "1.0.0" as const;
const DEFAULT_TIMEOUT_MS = 30_000;

type MistralClient = Pick<Mistral, "chat">;
type ModelAnalysisProposal = z.infer<typeof ModelAnalysisProposalSchema>;
type FailureClassification =
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

export type MistralAdapterSuccess = {
  ok: true;
  proposal: ModelAnalysisProposal;
  run: LiveAnalysisExecutionResult & { status: "succeeded" };
};

export type MistralAdapterFailure = {
  ok: false;
  run: LiveAnalysisExecutionResult & { status: "failed" };
};

export type MistralAdapterResult = MistralAdapterSuccess | MistralAdapterFailure;

export type MistralAdapterOptions = {
  apiKey?: string;
  client?: MistralClient;
  signal?: AbortSignal;
  now?: () => Date;
  runId?: string;
};

export async function runMistralAnalysis(
  request: AnalyzeRequest,
  options: MistralAdapterOptions = {},
): Promise<MistralAdapterResult> {
  const started = currentIso(options.now);

  if (options.signal?.aborted) {
    return failedRun("provider_timeout", started, currentIso(options.now), null, 0, 0, undefined, options.runId);
  }

  const canonical = buildCanonicalProviderInput(request);
  if (!canonical.ok) {
    return failedRun(
      mapPreflightCode(canonical.error.code),
      started,
      currentIso(options.now),
      null,
      0,
      0,
      undefined,
      options.runId,
    );
  }

  const validationFailure = validateMistralBoundary(canonical.input);
  if (validationFailure) {
    return failedRun(
      validationFailure,
      started,
      currentIso(options.now),
      null,
      canonical.input.selectedSegments.length,
      0,
      undefined,
      options.runId,
    );
  }

  const client = options.client ?? buildMistralClient(options.apiKey);
  if (!client) {
    return failedRun(
      "provider_authentication_failed",
      started,
      currentIso(options.now),
      null,
      canonical.input.selectedSegments.length,
      0,
      undefined,
      options.runId,
    );
  }

  try {
    const response = await client.chat.complete(buildMistralRequest(canonical.input), {
      retries: { strategy: "none" },
      retryCodes: [],
      signal: options.signal,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    } satisfies RequestOptions);
    const parsed = parseStructuredResponse(response);

    if (!parsed.ok) {
      return failedRun(
        parsed.classification,
        started,
        currentIso(options.now),
        response.model ?? null,
        canonical.input.selectedSegments.length,
        canonical.input.inputByteLength,
        usageFromResponse(response),
        options.runId,
      );
    }

    return {
      ok: true,
      proposal: parsed.proposal,
      run: LiveAnalysisExecutionResultSchema.parse({
        ...baseRunFields(
          started,
          currentIso(options.now),
          response.model ?? null,
          canonical.input.selectedSegments.length,
          parsed.proposal.candidates.length,
          countCitations(parsed.proposal),
          usageFromResponse(response),
          options.runId,
        ),
        status: "succeeded",
        failure: null,
      }) as MistralAdapterSuccess["run"],
    };
  } catch (error) {
    return failedRun(
      classifyProviderError(error),
      started,
      currentIso(options.now),
      null,
      canonical.input.selectedSegments.length,
      canonical.input.inputByteLength,
      undefined,
      options.runId,
    );
  }
}

export function buildMistralRequest(input: CanonicalProviderInput): ChatCompletionRequest {
  const prompt = buildSharedPrompt(input.serializedEvidence);
  const policy = buildProviderRequestPolicy(MISTRAL_RELEASE);

  if (
    policy.maxProviderCalls !== 1 ||
    policy.streaming !== false ||
    policy.toolsEnabled !== false ||
    policy.structuredOutputOnly !== true ||
    policy.automaticRetry !== false
  ) {
    throw new Error("Mistral adapter request policy drifted.");
  }

  return {
    model: MISTRAL_RELEASE.requestedModel,
    temperature: 0,
    maxTokens: 1600,
    stream: false,
    tools: null,
    toolChoice: "none",
    parallelToolCalls: false,
    reasoningEffort: "medium",
    safePrompt: true,
    responseFormat: {
      type: "json_schema",
      jsonSchema: {
        name: "contextfirst_nexus_model_analysis_proposal",
        strict: true,
        schemaDefinition: MODEL_ANALYSIS_JSON_SCHEMA,
      },
    },
    messages: [
      {
        role: "system",
        content: [
          prompt.systemBoundary,
          prompt.requestedTasksAndSchema,
          prompt.definitions,
          "Return only JSON matching the supplied schema.",
        ].join("\n\n"),
      },
      {
        role: "user",
        content: prompt.untrustedEvidenceJson,
      },
    ],
  };
}

function buildMistralClient(apiKey?: string): MistralClient | null {
  const resolvedApiKey = apiKey ?? process.env.MISTRAL_API_KEY;
  if (!resolvedApiKey) return null;
  return new Mistral({
    apiKey: resolvedApiKey,
    retryConfig: { strategy: "none" },
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
}

function validateMistralBoundary(input: CanonicalProviderInput): FailureClassification | null {
  const release = input.release;
  const registryEntry = getRegistryEntry(MISTRAL_RELEASE.releaseConfigurationId);

  if (
    release.providerId !== MISTRAL_RELEASE.providerId ||
    release.releaseConfigurationId !== MISTRAL_RELEASE.releaseConfigurationId ||
    release.serviceTier !== MISTRAL_RELEASE.serviceTier
  ) {
    return "internal_safe_failure";
  }
  if (
    input.fixtureBinding.dataOrigin !== CFN_DEMO_FIXTURE_BINDING.dataOrigin ||
    input.fixtureBinding.caseId !== CFN_DEMO_FIXTURE_BINDING.caseId ||
    input.fixtureBinding.fixtureVersion !== CFN_DEMO_FIXTURE_BINDING.fixtureVersion ||
    input.fixtureBinding.canonicalFixtureDigest !== CFN_DEMO_FIXTURE_BINDING.canonicalFixtureDigest
  ) {
    return "internal_safe_failure";
  }
  if (registryEntry?.kind !== "live") return "internal_safe_failure";
  if (registryEntry.staticServiceTierAvailability !== "available") {
    return "provider_service_tier_unavailable";
  }
  if (
    registryEntry.release.requestedModel !== MISTRAL_RELEASE.requestedModel ||
    registryEntry.inferenceSetting.kind !== MISTRAL_INFERENCE_SETTING.kind ||
    registryEntry.inferenceSetting.value !== MISTRAL_INFERENCE_SETTING.value ||
    registryEntry.disclosure.allowedDataOrigins[0] !== CFN_DEMO_FIXTURE_BINDING.dataOrigin
  ) {
    return "internal_safe_failure";
  }
  return null;
}

function parseStructuredResponse(
  response: ChatCompletionResponse,
):
  | { ok: true; proposal: ModelAnalysisProposal }
  | { ok: false; classification: FailureClassification } {
  const content = response.choices[0]?.message?.content;
  if (typeof content !== "string") {
    return { ok: false, classification: "invalid_structured_response" };
  }

  try {
    return { ok: true, proposal: ModelAnalysisProposalSchema.parse(JSON.parse(content)) };
  } catch {
    return { ok: false, classification: "invalid_structured_response" };
  }
}

function failedRun(
  classification: FailureClassification,
  startedAt: string,
  completedAt: string,
  returnedModel: string | null,
  inputSegmentCount: number,
  inputByteLength: number,
  usage: LiveAnalysisExecutionResult["tokenUsage"] | undefined,
  runId?: string,
): MistralAdapterFailure {
  return {
    ok: false,
    run: LiveAnalysisExecutionResultSchema.parse({
      ...baseRunFields(
        startedAt,
        completedAt,
        returnedModel,
        inputSegmentCount,
        0,
        0,
        usage,
        runId,
      ),
      status: "failed",
      failure: failureFor(classification),
    }) as MistralAdapterFailure["run"],
  };
}

function baseRunFields(
  startedAt: string,
  completedAt: string,
  returnedModel: string | null,
  inputSegmentCount: number,
  candidateCount: number,
  citationCount: number,
  usage: LiveAnalysisExecutionResult["tokenUsage"] | undefined,
  runId?: string,
) {
  const started = Date.parse(startedAt);
  const completed = Date.parse(completedAt);
  const durationMs = Number.isFinite(started) && Number.isFinite(completed)
    ? Math.max(0, completed - started)
    : 0;

  return {
    id: runId ?? `RUN-MISTRAL-${Date.now()}`,
    mode: "live",
    provider: AnalysisProviderProvenanceSchema.parse({
      ...MISTRAL_RELEASE,
      adapterVersion: ADAPTER_VERSION,
      returnedModel,
      inferenceSetting: MISTRAL_INFERENCE_SETTING,
      disclosureVersion: "1.0.0",
      providerTransmission: true,
    }),
    promptVersion: SHARED_PROMPT_VERSION,
    requestSchemaVersion: AI_BOUNDARY_VERSION,
    responseSchemaVersion: RESPONSE_SCHEMA_VERSION,
    fixtureVersion: CFN_DEMO_FIXTURE_BINDING.fixtureVersion,
    rulesetVersion: RULESET_VERSION,
    checkpointProvenance: null,
    startedAt,
    completedAt,
    durationMs,
    inputSegmentCount,
    candidateCount,
    citationCount,
    quarantinedCount: 0,
    ...(usage ? { tokenUsage: usage } : {}),
  };
}

function failureFor(classification: FailureClassification): AnalysisFailure {
  return AnalysisFailureSchema.parse({
    provider_authentication_failed: {
      classification,
      safeErrorCode: "PROVIDER_AUTHENTICATION_FAILED",
      retryableSameProvider: false,
      alternateProviderRecoveryAllowed: true,
      replayRecoveryAllowed: true,
    },
    provider_service_tier_unavailable: {
      classification,
      safeErrorCode: "PROVIDER_SERVICE_TIER_UNAVAILABLE",
      retryableSameProvider: false,
      alternateProviderRecoveryAllowed: true,
      replayRecoveryAllowed: true,
    },
    provider_quota_exhausted: {
      classification,
      safeErrorCode: "PROVIDER_QUOTA_EXHAUSTED",
      retryableSameProvider: true,
      alternateProviderRecoveryAllowed: true,
      replayRecoveryAllowed: true,
    },
    provider_rate_limited: {
      classification,
      safeErrorCode: "PROVIDER_RATE_LIMITED",
      retryableSameProvider: true,
      alternateProviderRecoveryAllowed: true,
      replayRecoveryAllowed: true,
    },
    provider_timeout: {
      classification,
      safeErrorCode: "PROVIDER_TIMEOUT",
      retryableSameProvider: true,
      alternateProviderRecoveryAllowed: true,
      replayRecoveryAllowed: true,
    },
    provider_unavailable: {
      classification,
      safeErrorCode: "PROVIDER_UNAVAILABLE",
      retryableSameProvider: true,
      alternateProviderRecoveryAllowed: true,
      replayRecoveryAllowed: true,
    },
    provider_refusal: {
      classification,
      safeErrorCode: "PROVIDER_REFUSAL",
      retryableSameProvider: false,
      alternateProviderRecoveryAllowed: false,
      replayRecoveryAllowed: false,
    },
    invalid_structured_response: {
      classification,
      safeErrorCode: "INVALID_STRUCTURED_RESPONSE",
      retryableSameProvider: false,
      alternateProviderRecoveryAllowed: false,
      replayRecoveryAllowed: false,
    },
    citation_validation_failed: {
      classification,
      safeErrorCode: "CITATION_VALIDATION_FAILED",
      retryableSameProvider: false,
      alternateProviderRecoveryAllowed: false,
      replayRecoveryAllowed: false,
    },
    prohibited_output: {
      classification,
      safeErrorCode: "PROHIBITED_OUTPUT",
      retryableSameProvider: false,
      alternateProviderRecoveryAllowed: false,
      replayRecoveryAllowed: false,
    },
    safety_validation_failed: {
      classification,
      safeErrorCode: "SAFETY_VALIDATION_FAILED",
      retryableSameProvider: false,
      alternateProviderRecoveryAllowed: false,
      replayRecoveryAllowed: false,
    },
    internal_safe_failure: {
      classification,
      safeErrorCode: "INTERNAL_SAFE_FAILURE",
      retryableSameProvider: false,
      alternateProviderRecoveryAllowed: false,
      replayRecoveryAllowed: false,
    },
  }[classification]) as AnalysisFailure;
}

function classifyProviderError(error: unknown): FailureClassification {
  if (error instanceof DOMException && error.name === "AbortError") return "provider_timeout";
  if (error instanceof Error && /abort|timeout/i.test(error.name)) return "provider_timeout";

  const statusCode = statusCodeFromError(error);
  if (statusCode === 401 || statusCode === 403) return "provider_authentication_failed";
  if (statusCode === 402) return "provider_service_tier_unavailable";
  if (statusCode === 429) return "provider_rate_limited";
  if (statusCode === 413) return "provider_quota_exhausted";
  if (statusCode === 408 || statusCode === 504) return "provider_timeout";
  if (statusCode && statusCode >= 500) return "provider_unavailable";

  const message = error instanceof Error ? error.message : "";
  if (/tier|payment|billing|plan/i.test(message)) return "provider_service_tier_unavailable";
  if (/quota/i.test(message)) return "provider_quota_exhausted";
  if (/rate/i.test(message)) return "provider_rate_limited";
  if (/refus/i.test(message)) return "provider_refusal";
  if (/policy|data/i.test(message)) return "provider_refusal";
  return "provider_unavailable";
}

function statusCodeFromError(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const candidate = error as { statusCode?: unknown; status?: unknown };
  if (typeof candidate.statusCode === "number") return candidate.statusCode;
  if (typeof candidate.status === "number") return candidate.status;
  return null;
}

function mapPreflightCode(code: SafeErrorCode): FailureClassification {
  if (code === "PROVIDER_SERVICE_TIER_UNAVAILABLE") return "provider_service_tier_unavailable";
  if (code === "PROVIDER_AUTHENTICATION_FAILED" || code === "PROVIDER_NOT_CONFIGURED") {
    return "provider_authentication_failed";
  }
  if (code === "PROVIDER_QUOTA_EXHAUSTED") return "provider_quota_exhausted";
  if (code === "PROVIDER_RATE_LIMITED") return "provider_rate_limited";
  if (code === "PROVIDER_TIMEOUT") return "provider_timeout";
  if (code === "PROVIDER_UNAVAILABLE") return "provider_unavailable";
  if (code === "PROVIDER_REFUSAL") return "provider_refusal";
  if (code === "INVALID_STRUCTURED_RESPONSE") return "invalid_structured_response";
  return "internal_safe_failure";
}

function usageFromResponse(response: ChatCompletionResponse): LiveAnalysisExecutionResult["tokenUsage"] {
  const input = Math.max(0, response.usage.promptTokens ?? 0);
  const output = Math.max(0, response.usage.completionTokens ?? 0);
  return {
    input,
    output,
    total: Math.max(input + output, response.usage.totalTokens ?? 0),
  };
}

function countCitations(proposal: ModelAnalysisProposal): number {
  return proposal.candidates.reduce(
    (count: number, candidate: ModelAnalysisProposal["candidates"][number]) =>
      count + candidate.citations.length,
    0,
  );
}

function currentIso(now?: () => Date): string {
  return (now?.() ?? new Date()).toISOString();
}

const MODEL_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["candidates"],
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "proposedId",
          "kind",
          "title",
          "proposedText",
          "assertionMode",
          "reviewQuestion",
          "citations",
          "unknowns",
        ],
        properties: {
          proposedId: { type: "string" },
          kind: {
            type: "string",
            enum: [
              "review_lane_item",
              "context_gap",
              "citation_need",
              "contradiction_or_uncertainty",
            ],
          },
          lane: {
            type: "string",
            enum: [
              "trafficking_indicators",
              "non_punishment_relevance",
              "protection_remedy_urgency",
            ],
          },
          title: { type: "string" },
          proposedText: { type: "string" },
          assertionMode: {
            type: "string",
            enum: [
              "positive_proposition",
              "negative_proposition",
              "uncertainty_or_gap",
              "needs_human_review",
            ],
          },
          reviewQuestion: { type: "string" },
          citations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["segmentId", "quotedText", "relationship", "evidenceNature"],
              properties: {
                segmentId: { type: "string" },
                quotedText: { type: "string" },
                relationship: {
                  type: "string",
                  enum: [
                    "supports",
                    "partially_supports",
                    "contradicts",
                    "context_for",
                    "requires_resolution",
                  ],
                },
                evidenceNature: {
                  type: "string",
                  enum: [
                    "documented_in_source",
                    "reported_or_alleged_in_source",
                    "reviewer_supplied_context",
                    "unknown",
                  ],
                },
              },
            },
          },
          unknowns: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;
