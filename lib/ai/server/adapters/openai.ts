import "server-only";

import OpenAI from "openai";
import { APIConnectionTimeoutError, APIError, APIUserAbortError } from "openai";
import type { Response, ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";

import {
  AnalysisProviderProvenanceSchema,
  ModelAnalysisProposalSchema,
  type AnalysisFailure,
  type AnalysisProviderProvenance,
} from "../../../contracts";
import { buildProviderRequestPolicy, buildSharedPrompt } from "../request-policy";
import { LIVE_PROVIDER_RELEASES } from "../registry";
import {
  ADAPTER_VERSION,
  AI_BOUNDARY_VERSION,
  SHARED_PROMPT_VERSION,
  type CanonicalProviderInput,
} from "../types";

const OPENAI_RELEASE = LIVE_PROVIDER_RELEASES[0];

type OpenAIResponsesClient = {
  responses: {
    create(
      body: ResponseCreateParamsNonStreaming,
      options?: { signal?: AbortSignal },
    ): Promise<Response>;
  };
};

type ModelAnalysisProposal = typeof ModelAnalysisProposalSchema._output;
type FailureClassification =
  | "provider_authentication_failed"
  | "provider_service_tier_unavailable"
  | "provider_quota_exhausted"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_unavailable"
  | "provider_refusal"
  | "invalid_structured_response"
  | "internal_safe_failure";

export type OpenAIAnalysisSuccess = {
  ok: true;
  proposal: ModelAnalysisProposal;
  provenance: AnalysisProviderProvenance;
  providerResponseId: string;
  usage: Response["usage"] | null;
};

export type OpenAIAnalysisFailure = {
  ok: false;
  failure: AnalysisFailure;
  provenance: AnalysisProviderProvenance;
};

export type OpenAIAnalysisResult = OpenAIAnalysisSuccess | OpenAIAnalysisFailure;

export type RunOpenAIAnalysisOptions = {
  input: CanonicalProviderInput;
  signal?: AbortSignal;
  client?: OpenAIResponsesClient;
};

const proposalJsonSchema = {
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
          proposedId: { type: "string", minLength: 1 },
          kind: {
            type: "string",
            enum: [
              "timeline_event",
              "nexus_relationship",
              "review_lane_item",
              "context_gap",
              "contradiction",
              "entity",
              "coverage_limitation",
              "provenance_limitation",
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
              "limitation",
              "gap",
              "unknown_state",
              "neutral_procedural_fact",
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
                segmentId: {
                  type: "string",
                  pattern: "^D\\d{2}-(?:P\\d+-S\\d+|META-\\d+)$",
                },
                quotedText: { type: "string" },
                relationship: {
                  type: "string",
                  enum: ["supports", "limits", "contradicts", "context_only"],
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

export async function runOpenAIAnalysis({
  input,
  signal,
  client = new OpenAI({ maxRetries: 0 }),
}: RunOpenAIAnalysisOptions): Promise<OpenAIAnalysisResult> {
  const provenance = buildOpenAIProvenance(null);

  if (
    input.release.providerId !== OPENAI_RELEASE.providerId ||
    input.release.releaseConfigurationId !== OPENAI_RELEASE.releaseConfigurationId ||
    input.release.serviceTier !== OPENAI_RELEASE.serviceTier
  ) {
    return { ok: false, failure: failure("internal_safe_failure"), provenance };
  }

  const policy = buildProviderRequestPolicy(OPENAI_RELEASE);
  if (
    policy.maxProviderCalls !== 1 ||
    policy.streaming ||
    policy.toolsEnabled ||
    !policy.structuredOutputOnly ||
    policy.automaticRetry ||
    policy.crossProviderFallback ||
    policy.replaySubstitution
  ) {
    return { ok: false, failure: failure("internal_safe_failure"), provenance };
  }

  const prompt = buildSharedPrompt(input.serializedEvidence);

  try {
    const response = await client.responses.create(
      {
        model: OPENAI_RELEASE.requestedModel,
        instructions: prompt.systemBoundary,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  prompt.requestedTasksAndSchema,
                  prompt.definitions,
                  "Untrusted evidence JSON:",
                  prompt.untrustedEvidenceJson,
                ].join("\n\n"),
              },
            ],
          },
        ],
        reasoning: { effort: "medium" },
        text: {
          format: {
            type: "json_schema",
            name: "contextfirst_model_analysis_proposal",
            strict: true,
            schema: proposalJsonSchema,
          },
        },
        store: false,
        stream: false,
        background: false,
        parallel_tool_calls: false,
        tool_choice: "none",
        tools: [],
        include: [],
        truncation: "disabled",
      },
      { signal },
    );

    const responseProvenance = buildOpenAIProvenance(response.model ?? null);
    if (response.status === "failed" || response.status === "incomplete" || response.error) {
      return { ok: false, failure: failure("provider_unavailable"), provenance: responseProvenance };
    }
    if (hasRefusal(response)) {
      return { ok: false, failure: failure("provider_refusal"), provenance: responseProvenance };
    }

    const parsedJson = parseOutputJson(response.output_text);
    if (!parsedJson.ok) {
      return {
        ok: false,
        failure: failure("invalid_structured_response"),
        provenance: responseProvenance,
      };
    }

    const proposal = ModelAnalysisProposalSchema.safeParse(parsedJson.value);
    if (!proposal.success) {
      return {
        ok: false,
        failure: failure("invalid_structured_response"),
        provenance: responseProvenance,
      };
    }

    return {
      ok: true,
      proposal: proposal.data,
      provenance: responseProvenance,
      providerResponseId: response.id,
      usage: response.usage ?? null,
    };
  } catch (error) {
    return { ok: false, failure: mapOpenAIError(error), provenance };
  }
}

function buildOpenAIProvenance(returnedModel: string | null): AnalysisProviderProvenance {
  return AnalysisProviderProvenanceSchema.parse({
    ...OPENAI_RELEASE,
    adapterVersion: ADAPTER_VERSION,
    returnedModel,
    inferenceSetting: { kind: "reasoning_effort", value: "medium" },
    disclosureVersion: AI_BOUNDARY_VERSION,
    providerTransmission: true,
  });
}

function parseOutputJson(outputText: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(outputText) };
  } catch {
    return { ok: false };
  }
}

function hasRefusal(response: Response): boolean {
  return JSON.stringify(response).includes('"type":"refusal"');
}

function mapOpenAIError(error: unknown): AnalysisFailure {
  if (error instanceof APIUserAbortError) {
    return failure("provider_timeout");
  }
  if (error instanceof APIConnectionTimeoutError) {
    return failure("provider_timeout");
  }
  if (error instanceof APIError) {
    if (error.status === 401) return failure("provider_authentication_failed");
    if (error.status === 403) return failure("provider_service_tier_unavailable");
    if (error.status === 408) return failure("provider_timeout");
    if (error.status === 429) return failure("provider_rate_limited");
    if (error.status && error.status >= 500) return failure("provider_unavailable");
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return failure("provider_timeout");
  }
  return failure("provider_unavailable");
}

function failure(classification: FailureClassification): AnalysisFailure {
  switch (classification) {
    case "provider_authentication_failed":
      return {
        classification,
        safeErrorCode: "PROVIDER_AUTHENTICATION_FAILED",
        retryableSameProvider: false,
        alternateProviderRecoveryAllowed: true,
        replayRecoveryAllowed: true,
      };
    case "provider_service_tier_unavailable":
      return {
        classification,
        safeErrorCode: "PROVIDER_SERVICE_TIER_UNAVAILABLE",
        retryableSameProvider: false,
        alternateProviderRecoveryAllowed: true,
        replayRecoveryAllowed: true,
      };
    case "provider_quota_exhausted":
      return {
        classification,
        safeErrorCode: "PROVIDER_QUOTA_EXHAUSTED",
        retryableSameProvider: true,
        alternateProviderRecoveryAllowed: true,
        replayRecoveryAllowed: true,
      };
    case "provider_rate_limited":
      return {
        classification,
        safeErrorCode: "PROVIDER_RATE_LIMITED",
        retryableSameProvider: true,
        alternateProviderRecoveryAllowed: true,
        replayRecoveryAllowed: true,
      };
    case "provider_timeout":
      return {
        classification,
        safeErrorCode: "PROVIDER_TIMEOUT",
        retryableSameProvider: true,
        alternateProviderRecoveryAllowed: true,
        replayRecoveryAllowed: true,
      };
    case "provider_unavailable":
      return {
        classification,
        safeErrorCode: "PROVIDER_UNAVAILABLE",
        retryableSameProvider: true,
        alternateProviderRecoveryAllowed: true,
        replayRecoveryAllowed: true,
      };
    case "provider_refusal":
      return {
        classification,
        safeErrorCode: "PROVIDER_REFUSAL",
        retryableSameProvider: false,
        alternateProviderRecoveryAllowed: false,
        replayRecoveryAllowed: false,
      };
    case "invalid_structured_response":
      return {
        classification,
        safeErrorCode: "INVALID_STRUCTURED_RESPONSE",
        retryableSameProvider: false,
        alternateProviderRecoveryAllowed: false,
        replayRecoveryAllowed: false,
      };
    case "internal_safe_failure":
    default:
      return {
        classification: "internal_safe_failure",
        safeErrorCode: "INTERNAL_SAFE_FAILURE",
        retryableSameProvider: false,
        alternateProviderRecoveryAllowed: false,
        replayRecoveryAllowed: false,
      };
  }
}
