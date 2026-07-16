import "server-only";

import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import {
  ModelAnalysisProposalSchema,
  type AnalysisProviderProvenance,
  type SafeErrorCode,
} from "../../../contracts";
import { buildCanonicalProviderInput } from "../canonical-input";
import { buildSharedPrompt } from "../request-policy";
import {
  ADAPTER_VERSION,
  CFN_DEMO_FIXTURE_BINDING,
  SHARED_PROMPT_VERSION,
  type CanonicalProviderInput,
} from "../types";

type ModelAnalysisProposal = ReturnType<typeof ModelAnalysisProposalSchema.parse>;

const GEMINI_RELEASE = {
  providerId: "google_gemini",
  releaseConfigurationId: "gemini-quality-v1",
  requestedModel: "gemini-3.5-flash",
  serviceTier: "unpaid",
} as const;

const GEMINI_INFERENCE_SETTING = {
  kind: "thinking_level",
  value: "medium",
} as const;

const GEMINI_THINKING_CONFIG = { thinkingLevel: "medium" } as const;

const GEMINI_RESPONSE_JSON_SCHEMA = {
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
          lane: { type: "string" },
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
                segmentId: { type: "string" },
                quotedText: { type: "string" },
                relationship: {
                  type: "string",
                  enum: ["supports", "limits", "contradicts", "context_only"],
                },
                evidenceNature: { type: "string" },
              },
            },
          },
          unknowns: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

export type GeminiTransport = {
  generateContent: (params: {
    model: string;
    contents: Array<{ role: "user"; parts: Array<{ text: string }> }>;
    config: {
      systemInstruction: string;
      responseMimeType: "application/json";
      responseJsonSchema: typeof GEMINI_RESPONSE_JSON_SCHEMA;
      thinkingConfig: { thinkingLevel: "medium" };
      abortSignal?: AbortSignal;
    };
  }) => Promise<GenerateContentResponse>;
};

export type GeminiAdapterOptions = {
  client?: GeminiTransport;
  signal?: AbortSignal;
  apiKey?: string;
};

export type GeminiAdapterSuccess = {
  ok: true;
  proposal: ModelAnalysisProposal;
  provenance: AnalysisProviderProvenance;
  tokenUsage?: { input: number; output: number; total: number };
};

export type GeminiAdapterFailure = {
  ok: false;
  error: {
    code: SafeErrorCode;
    classification:
      | "provider_authentication_failed"
      | "provider_service_tier_unavailable"
      | "provider_quota_exhausted"
      | "provider_rate_limited"
      | "provider_timeout"
      | "provider_unavailable"
      | "provider_refusal"
      | "invalid_structured_response"
      | "internal_safe_failure";
    retryable: boolean;
  };
  provenance: AnalysisProviderProvenance;
};

export type GeminiAdapterResult = GeminiAdapterSuccess | GeminiAdapterFailure;

export type GeminiAnalysisAdapter = {
  analyze: (
    input: CanonicalProviderInput | unknown,
    options?: GeminiAdapterOptions,
  ) => Promise<GeminiAdapterResult>;
};

export function createGeminiAdapter(defaultOptions: GeminiAdapterOptions = {}): GeminiAnalysisAdapter {
  return {
    analyze: (input, options = {}) => analyzeWithGemini(input, { ...defaultOptions, ...options }),
  };
}

export const geminiAdapter = createGeminiAdapter();

export async function analyzeWithGemini(
  value: CanonicalProviderInput | unknown,
  options: GeminiAdapterOptions = {},
): Promise<GeminiAdapterResult> {
  const canonical = isCanonicalProviderInput(value)
    ? { ok: true as const, input: value }
    : buildCanonicalProviderInput(value);

  if (!canonical.ok) {
    return failure(
      canonical.error.code,
      "internal_safe_failure",
      false,
    );
  }

  const input = canonical.input;
  if (!hasExactGeminiFixtureBoundary(input)) {
    return failure("PROVIDER_DATA_POLICY_BLOCKED", "internal_safe_failure", false);
  }

  if (options.signal?.aborted) {
    return failure("PROVIDER_TIMEOUT", "provider_timeout", true);
  }

  let transport: GeminiTransport | undefined = options.client;
  if (!transport) {
    const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return failure("PROVIDER_NOT_CONFIGURED", "internal_safe_failure", false);
    }
    transport = new GoogleGenAI({ apiKey }).models as unknown as GeminiTransport;
  }
  if (!transport) return failure("PROVIDER_NOT_CONFIGURED", "internal_safe_failure", false);

  const prompt = buildSharedPrompt(input.serializedEvidence);
  try {
    const response = await transport.generateContent({
      model: GEMINI_RELEASE.requestedModel,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [prompt.requestedTasksAndSchema, prompt.definitions, prompt.untrustedEvidenceJson].join("\n\n"),
            },
          ],
        },
      ],
      config: {
        systemInstruction: prompt.systemBoundary,
        responseMimeType: "application/json",
        responseJsonSchema: GEMINI_RESPONSE_JSON_SCHEMA,
        thinkingConfig: GEMINI_THINKING_CONFIG,
        abortSignal: options.signal,
      },
    });

    if (response.promptFeedback?.blockReason || !response.text?.trim()) {
      return failure("PROVIDER_REFUSAL", "provider_refusal", false);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.text);
    } catch {
      return failure("INVALID_STRUCTURED_RESPONSE", "invalid_structured_response", false);
    }

    const proposal = ModelAnalysisProposalSchema.safeParse(parsed);
    if (!proposal.success) {
      return failure("INVALID_STRUCTURED_RESPONSE", "invalid_structured_response", false);
    }

    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount ?? 0;
    const outputTokens = usage?.candidatesTokenCount ?? 0;
    return {
      ok: true,
      proposal: proposal.data,
      provenance: provenance(response.modelVersion ?? null),
      ...(usage
        ? { tokenUsage: { input: inputTokens, output: outputTokens, total: usage.totalTokenCount ?? inputTokens + outputTokens } }
        : {}),
    };
  } catch (error) {
    return mapProviderError(error);
  }
}

function isCanonicalProviderInput(value: unknown): value is CanonicalProviderInput {
  return typeof value === "object" && value !== null && "fixtureBinding" in value && "serializedEvidence" in value;
}

function hasExactGeminiFixtureBoundary(input: CanonicalProviderInput): boolean {
  return (
    input.release.providerId === GEMINI_RELEASE.providerId &&
    input.release.releaseConfigurationId === GEMINI_RELEASE.releaseConfigurationId &&
    input.release.serviceTier === GEMINI_RELEASE.serviceTier &&
    input.request.providerSelection.providerId === GEMINI_RELEASE.providerId &&
    input.request.providerSelection.releaseConfigurationId === GEMINI_RELEASE.releaseConfigurationId &&
    input.request.providerSelection.serviceTier === GEMINI_RELEASE.serviceTier &&
    input.fixtureBinding.dataOrigin === CFN_DEMO_FIXTURE_BINDING.dataOrigin &&
    input.fixtureBinding.caseId === CFN_DEMO_FIXTURE_BINDING.caseId &&
    input.fixtureBinding.fixtureVersion === CFN_DEMO_FIXTURE_BINDING.fixtureVersion &&
    input.fixtureBinding.canonicalFixtureDigest === CFN_DEMO_FIXTURE_BINDING.canonicalFixtureDigest
  );
}

function provenance(returnedModel: string | null): AnalysisProviderProvenance {
  return {
    ...GEMINI_RELEASE,
    adapterVersion: ADAPTER_VERSION,
    returnedModel,
    inferenceSetting: GEMINI_INFERENCE_SETTING,
    disclosureVersion: SHARED_PROMPT_VERSION,
    providerTransmission: true,
  };
}

function failure(
  code: SafeErrorCode,
  classification: GeminiAdapterFailure["error"]["classification"],
  retryable: boolean,
): GeminiAdapterFailure {
  return {
    ok: false,
    error: { code, classification, retryable },
    provenance: provenance(null),
  };
}

function mapProviderError(error: unknown): GeminiAdapterFailure {
  if (isAbortError(error)) return failure("PROVIDER_TIMEOUT", "provider_timeout", true);

  const status = typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
    ? error.status
    : null;
  if (status === 401 || status === 403) return failure("PROVIDER_AUTHENTICATION_FAILED", "provider_authentication_failed", false);
  if (status === 429) return failure("PROVIDER_RATE_LIMITED", "provider_rate_limited", true);
  if (status === 408 || status === 504) return failure("PROVIDER_TIMEOUT", "provider_timeout", true);
  if (status !== null && status >= 500) return failure("PROVIDER_UNAVAILABLE", "provider_unavailable", true);

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("quota")) return failure("PROVIDER_QUOTA_EXHAUSTED", "provider_quota_exhausted", true);
  if (message.includes("rate limit") || message.includes("ratelimit")) return failure("PROVIDER_RATE_LIMITED", "provider_rate_limited", true);
  if (message.includes("permission") || message.includes("unauthorized") || message.includes("api key")) {
    return failure("PROVIDER_AUTHENTICATION_FAILED", "provider_authentication_failed", false);
  }
  if (message.includes("timeout") || message.includes("abort")) return failure("PROVIDER_TIMEOUT", "provider_timeout", true);
  if (message.includes("safety") || message.includes("blocked") || message.includes("refus")) {
    return failure("PROVIDER_REFUSAL", "provider_refusal", false);
  }
  return failure("PROVIDER_UNAVAILABLE", "provider_unavailable", true);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError" ||
    error instanceof Error && error.name === "AbortError";
}
