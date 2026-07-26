import "server-only";

import {
  AnalysisProviderProvenanceSchema,
  ModelAnalysisProposalSchema,
  type AnalysisProviderProvenance,
} from "../../../contracts";
import { failure, type NormalizedProviderResult } from "../normalize";
import { buildSharedPrompt } from "../request-policy";
import {
  AI_BOUNDARY_VERSION,
  GROQ_ADAPTER_VERSION,
  type ProviderPromptInput,
} from "../types";
import { safeLogEvent } from "../../../security/safe-logging";
import { MODEL_ANALYSIS_JSON_SCHEMA } from "./mistral";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_RELEASE = {
  providerId: "groq",
  releaseConfigurationId: "groq-oss-20b-free-v1",
  requestedModel: "openai/gpt-oss-20b",
  serviceTier: "unpaid",
} as const;

type GroqFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type GroqResponse = {
  model?: string;
  error?: unknown;
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: string | null;
      refusal?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export type GroqAdapterOptions = {
  apiKey?: string;
  fetch?: GroqFetch;
};

export async function runGroqAnalysis(
  input: ProviderPromptInput,
  options: GroqAdapterOptions = {},
  signal?: AbortSignal,
): Promise<NormalizedProviderResult> {
  const provenance = buildGroqProvenance(null);
  if (
    input.release.providerId !== GROQ_RELEASE.providerId ||
    input.release.releaseConfigurationId !==
      GROQ_RELEASE.releaseConfigurationId ||
    input.release.serviceTier !== GROQ_RELEASE.serviceTier
  ) {
    return {
      ok: false,
      failure: failure("internal_safe_failure"),
      provenance,
    };
  }

  const apiKey = options.apiKey ?? process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      failure: failure("provider_authentication_failed"),
      provenance,
    };
  }

  if (signal?.aborted) {
    return {
      ok: false,
      failure: failure("provider_timeout"),
      provenance,
    };
  }

  try {
    const response = await (options.fetch ?? fetch)(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGroqRequest(input)),
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      const providerCode = await readSafeProviderCode(response);
      if (process.env.CFN_GROQ_SAFE_DIAGNOSTICS === "1") {
        console.warn(
          JSON.stringify(
            safeLogEvent("groq_provider_response", {
              providerId: GROQ_RELEASE.providerId,
              releaseConfigurationId:
                GROQ_RELEASE.releaseConfigurationId,
              stage: "provider_response",
              code: [
                `HTTP_${response.status}`,
                providerCode,
              ]
                .filter(Boolean)
                .join("_"),
            }),
          ),
        );
      }
      return {
        ok: false,
        failure: failure(classifyStatus(response.status, providerCode)),
        provenance,
      };
    }

    const raw = (await response.json()) as GroqResponse;
    const returnedProvenance = buildGroqProvenance(raw.model ?? null);
    const choice = raw.choices?.[0];
    if (
      raw.error ||
      choice?.finish_reason === "content_filter" ||
      Boolean(choice?.message?.refusal)
    ) {
      return {
        ok: false,
        failure: failure("provider_refusal"),
        provenance: returnedProvenance,
      };
    }
    if (
      typeof choice?.finish_reason === "string" &&
      choice.finish_reason !== "stop"
    ) {
      logSafeStructuredRejection(
        "finish_reason",
        choice.finish_reason,
      );
      return {
        ok: false,
        failure: failure("invalid_structured_response"),
        provenance: returnedProvenance,
      };
    }

    const content = choice?.message?.content;
    if (typeof content !== "string") {
      logSafeStructuredRejection("content", "missing");
      return {
        ok: false,
        failure: failure("invalid_structured_response"),
        provenance: returnedProvenance,
      };
    }

    let decoded: unknown;
    try {
      decoded = JSON.parse(content);
    } catch {
      logSafeStructuredRejection("json_parse", "invalid");
      return {
        ok: false,
        failure: failure("invalid_structured_response"),
        provenance: returnedProvenance,
      };
    }
    const proposal = ModelAnalysisProposalSchema.safeParse(decoded);
    if (!proposal.success) {
      logSafeStructuredRejection("canonical_schema", "rejected");
      return {
        ok: false,
        failure: failure("invalid_structured_response"),
        provenance: returnedProvenance,
      };
    }

    return {
      ok: true,
      proposal: proposal.data,
      provenance: returnedProvenance,
      tokenUsage: raw.usage
        ? {
            input: raw.usage.prompt_tokens ?? 0,
            output: raw.usage.completion_tokens ?? 0,
            total:
              raw.usage.total_tokens ??
              (raw.usage.prompt_tokens ?? 0) +
                (raw.usage.completion_tokens ?? 0),
          }
        : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      failure: failure(
        signal?.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
          ? "provider_timeout"
          : "provider_timeout",
      ),
      provenance,
    };
  }
}

export function buildGroqRequest(input: ProviderPromptInput) {
  const prompt = buildSharedPrompt(input.serializedEvidence);
  return {
    model: GROQ_RELEASE.requestedModel,
    messages: [
      {
        role: "system",
        content: [
          prompt.systemBoundary,
          prompt.requestedTasksAndSchema,
          prompt.definitions,
          "Output budget: return at most 4 candidates. Each candidate must use concise, meaningful, non-whitespace text; include at most 2 short exact citations and at most 2 concise unknowns. Keep quotedText to the shortest sufficient exact source span.",
          "Return only JSON matching the supplied schema.",
        ].join("\n\n"),
      },
      {
        role: "user",
        content: [
          "Untrusted evidence JSON:",
          prompt.untrustedEvidenceJson,
        ].join("\n\n"),
      },
    ],
    reasoning_effort: "low",
    include_reasoning: false,
    max_completion_tokens: 4096,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "contextfirst_nexus_model_analysis_proposal",
        strict: true,
        schema: MODEL_ANALYSIS_JSON_SCHEMA,
      },
    },
    stream: false,
  } as const;
}

function logSafeStructuredRejection(stage: string, code: string) {
  if (process.env.CFN_GROQ_SAFE_DIAGNOSTICS !== "1") return;
  console.warn(
    JSON.stringify(
      safeLogEvent("groq_structured_response_rejected", {
        providerId: GROQ_RELEASE.providerId,
        releaseConfigurationId: GROQ_RELEASE.releaseConfigurationId,
        stage,
        code,
      }),
    ),
  );
}

function buildGroqProvenance(
  returnedModel: string | null,
): AnalysisProviderProvenance {
  return AnalysisProviderProvenanceSchema.parse({
    ...GROQ_RELEASE,
    adapterVersion: GROQ_ADAPTER_VERSION,
    returnedModel,
    inferenceSetting: { kind: "reasoning_effort", value: "low" },
    disclosureVersion: AI_BOUNDARY_VERSION,
    providerTransmission: true,
  });
}

function classifyStatus(status: number, providerCode: string | null) {
  if (status === 401) return "provider_authentication_failed" as const;
  if (status === 403) return "provider_service_tier_unavailable" as const;
  if (status === 408) return "provider_timeout" as const;
  if (
    status === 429 ||
    (status === 413 && providerCode === "rate_limit_exceeded")
  ) {
    return "provider_rate_limited" as const;
  }
  if (
    status === 400 &&
    providerCode === "json_validate_failed"
  ) {
    return "invalid_structured_response" as const;
  }
  if (status === 502 || status === 503) return "provider_unavailable" as const;
  if (status === 504) return "provider_timeout" as const;
  return "internal_safe_failure" as const;
}

async function readSafeProviderCode(response: Response): Promise<string | null> {
  try {
    const value = (await response.clone().json()) as {
      error?: { code?: unknown; type?: unknown };
    };
    const candidate =
      typeof value.error?.code === "string"
        ? value.error.code
        : typeof value.error?.type === "string"
          ? value.error.type
          : null;
    return candidate?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) ?? null;
  } catch {
    return null;
  }
}
