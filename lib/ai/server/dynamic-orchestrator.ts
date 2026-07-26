import "server-only";

import {
  AnalysisExecutionResultSchema,
  BrowserAnalyzeResponseSchema,
  type AnalysisProviderProvenance,
  type BrowserAnalyzeResponse,
  type LiveAnalysisExecutionResult,
} from "../../contracts";
import { runOpenAIAnalysis } from "./adapters/openai";
import { runGroqAnalysis } from "./adapters/groq";
import { buildDynamicCanonicalAnalysisInput } from "./dynamic-canonical-input";
import {
  MANAGED_LIVE_PROVIDER_ORDER,
  runManagedProviderChain,
  type ManagedLiveProviderId,
  type ManagedProviderCandidate,
} from "./managed-routing";
import {
  normalizeAdapterResult,
  type NormalizedProviderResult,
} from "./normalize";
import { postValidateAnalysisProposal } from "./post-validate";
import { getRegistryEntry, projectProviderOption } from "./registry";
import type { ProviderPromptInput } from "./types";

type DynamicProviderExecutor = (
  input: ProviderPromptInput,
  signal: AbortSignal,
) => Promise<NormalizedProviderResult>;

export type DynamicAnalysisOptions = {
  liveAnalysisEnabled?: boolean;
  configuredProviderOrder?: string;
  admitted?: Partial<Record<ManagedLiveProviderId, boolean>>;
  configured?: Partial<Record<ManagedLiveProviderId, boolean>>;
  dataEligible?: Partial<Record<ManagedLiveProviderId, boolean>>;
  executors?: Partial<Record<ManagedLiveProviderId, DynamicProviderExecutor>>;
  now?: () => Date;
};

export async function analyzeDynamicBrowserCase(
  value: unknown,
  options: DynamicAnalysisOptions = {},
): Promise<BrowserAnalyzeResponse> {
  const canonical = buildDynamicCanonicalAnalysisInput(value);
  if (!canonical.ok) {
    return BrowserAnalyzeResponseSchema.parse({
      schemaVersion: "1.0.0",
      outcome: "rejected_before_run",
      run: null,
      candidates: [],
      citations: [],
      quarantined: [],
      attempts: [],
      error: {
        code: canonical.error.code,
        userMessage: canonical.error.userMessage,
      },
    });
  }

  if (options.liveAnalysisEnabled !== true) {
    return BrowserAnalyzeResponseSchema.parse({
      schemaVersion: "1.0.0",
      outcome: "rejected_before_run",
      run: null,
      candidates: [],
      citations: [],
      quarantined: [],
      attempts: [],
      error: {
        code: "LIVE_ANALYSIS_DISABLED",
        userMessage: "Live analysis is currently disabled.",
      },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  const observed = new Map<ManagedLiveProviderId, NormalizedProviderResult>();

  try {
    const candidates = MANAGED_LIVE_PROVIDER_ORDER.map((providerId) =>
      candidateFor(
        providerId,
        canonical.input.serializedEvidence,
        canonical.input.inputByteLength,
        controller.signal,
        observed,
        options,
      ),
    );
    const routed = await runManagedProviderChain(candidates, {
      configuredOrder: options.configuredProviderOrder,
    });

    if (!routed.ok) {
      if (routed.configurationError === "invalid_provider_order") {
        return BrowserAnalyzeResponseSchema.parse({
          schemaVersion: "1.0.0",
          outcome: "rejected_before_run",
          run: null,
          candidates: [],
          citations: [],
          quarantined: [],
          attempts: [],
          error: {
            code: "PROVIDER_NOT_CONFIGURED",
            userMessage:
              "Live analysis is unavailable because its server configuration is invalid.",
          },
        });
      }

      const terminalAttempt = routed.attempts.find(
        (attempt) => attempt.outcome === "terminal_failure",
      );
      const terminalResult = terminalAttempt
        ? observed.get(terminalAttempt.providerId)
        : undefined;
      if (terminalAttempt && terminalResult && !terminalResult.ok) {
        const run = failedRun(
          canonical.input.providerSegmentCount,
          terminalResult.provenance,
          terminalResult.failure,
          terminalResult.tokenUsage,
          options.now,
        );
        return BrowserAnalyzeResponseSchema.parse({
          schemaVersion: "1.0.0",
          outcome: "failed",
          run,
          candidates: [],
          citations: [],
          quarantined: [],
          attempts: routed.attempts,
          error: {
            code: terminalResult.failure.safeErrorCode,
            userMessage:
              "Analysis stopped safely. No result from another provider was substituted.",
          },
        });
      }

      return BrowserAnalyzeResponseSchema.parse({
        schemaVersion: "1.0.0",
        outcome: "service_unavailable",
        run: null,
        candidates: [],
        citations: [],
        quarantined: [],
        attempts: routed.attempts,
        error: {
          code: "PROVIDER_NOT_CONFIGURED",
          userMessage:
            "No admitted, data-eligible live analysis service is currently available.",
        },
      });
    }

    const normalized = routed.value;
    const runId = nextRunId();
    const validated = postValidateAnalysisProposal(
      normalized.proposal,
      { caseId: canonical.input.intent.caseId },
      runId,
      canonical.input.sourceContext,
    );
    const completedAt = currentIso(options.now);
    const run = AnalysisExecutionResultSchema.parse({
      id: runId,
      mode: "live",
      provider: normalized.provenance,
      promptVersion: "1.0.0",
      requestSchemaVersion: "1.0.0",
      responseSchemaVersion: "1.0.0",
      fixtureVersion: "1.0.0",
      rulesetVersion: "1.0.0",
      checkpointProvenance: null,
      startedAt: completedAt,
      completedAt,
      durationMs: 0,
      inputSegmentCount: canonical.input.providerSegmentCount,
      candidateCount: validated.candidates.length,
      citationCount: validated.citations.length,
      quarantinedCount: validated.quarantined.length,
      tokenUsage: normalized.tokenUsage,
      status: "succeeded",
      failure: null,
    }) as LiveAnalysisExecutionResult & { status: "succeeded" };

    return BrowserAnalyzeResponseSchema.parse({
      schemaVersion: "1.0.0",
      outcome: "succeeded",
      run,
      candidates: validated.candidates,
      citations: validated.citations,
      quarantined: validated.quarantined,
      attempts: routed.attempts,
      error: null,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function candidateFor(
  providerId: ManagedLiveProviderId,
  serializedEvidence: string,
  inputByteLength: number,
  signal: AbortSignal,
  observed: Map<ManagedLiveProviderId, NormalizedProviderResult>,
  options: DynamicAnalysisOptions,
): ManagedProviderCandidate<Extract<NormalizedProviderResult, { ok: true }>> {
  const entry = providerEntry(providerId);
  const admitted =
    options.admitted?.[providerId] ??
    Boolean(
      entry &&
        entry.kind === "live" &&
        projectProviderOption(entry, { liveAnalysisEnabled: true }).selectable,
    );
  const dataEligible =
    options.dataEligible?.[providerId] ??
    Boolean(entry?.disclosure.allowedDataOrigins.includes("browser_local"));
  const configured =
    options.configured?.[providerId] ?? providerConfigured(providerId);
  const executor = options.executors?.[providerId] ?? executorFor(providerId);

  return {
    providerId,
    admitted,
    dataEligible,
    configured,
    execute: async () => {
      if (!entry || entry.kind !== "live" || !executor) {
        return {
          ok: false,
          classification: "provider_unavailable",
        };
      }
      const result = await executor(
        {
          release: entry.release,
          serializedEvidence,
          inputByteLength,
        },
        signal,
      );
      observed.set(providerId, result);
      return result.ok
        ? { ok: true, value: result }
        : { ok: false, classification: result.failure.classification };
    },
  };
}

function providerEntry(providerId: ManagedLiveProviderId) {
  const releaseId = {
    mistral: "mistral-small-free-v1",
    google_gemini: "gemini-quality-v1",
    groq: "groq-oss-free-v1",
    openai: "openai-quality-v1",
  } as const;
  return getRegistryEntry(releaseId[providerId]);
}

function executorFor(
  providerId: ManagedLiveProviderId,
): DynamicProviderExecutor | null {
  if (providerId === "groq") {
    return (input, signal) => runGroqAnalysis(input, {}, signal);
  }
  if (providerId === "openai") {
    return async (input, signal) =>
      normalizeAdapterResult(
        (await runOpenAIAnalysis({
          input,
          signal,
        })) as Parameters<typeof normalizeAdapterResult>[0],
      );
  }
  // Current unpaid Mistral and Gemini releases are bundled-fixture only.
  return null;
}

function providerConfigured(providerId: ManagedLiveProviderId): boolean {
  if (providerId === "mistral") {
    return (
      process.env.ENABLE_MISTRAL_ANALYSIS === "true" &&
      Boolean(process.env.MISTRAL_API_KEY)
    );
  }
  if (providerId === "google_gemini") {
    return (
      process.env.ENABLE_GEMINI_ANALYSIS === "true" &&
      Boolean(process.env.GEMINI_API_KEY)
    );
  }
  if (providerId === "groq") {
    return (
      process.env.ENABLE_GROQ_ANALYSIS === "true" &&
      Boolean(process.env.GROQ_API_KEY)
    );
  }
  return (
    process.env.ENABLE_OPENAI_ANALYSIS === "true" &&
    Boolean(process.env.OPENAI_API_KEY)
  );
}

function failedRun(
  inputSegmentCount: number,
  provenance: AnalysisProviderProvenance,
  failure: Extract<NormalizedProviderResult, { ok: false }>["failure"],
  tokenUsage: LiveAnalysisExecutionResult["tokenUsage"],
  now?: () => Date,
) {
  const completedAt = currentIso(now);
  return AnalysisExecutionResultSchema.parse({
    id: nextRunId(),
    mode: "live",
    provider: provenance,
    promptVersion: "1.0.0",
    requestSchemaVersion: "1.0.0",
    responseSchemaVersion: "1.0.0",
    fixtureVersion: "1.0.0",
    rulesetVersion: "1.0.0",
    checkpointProvenance: null,
    startedAt: completedAt,
    completedAt,
    durationMs: 0,
    inputSegmentCount,
    candidateCount: 0,
    citationCount: 0,
    quarantinedCount: 0,
    tokenUsage,
    status: "failed",
    failure,
  });
}

function nextRunId(): string {
  return `RUN-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

function currentIso(now?: () => Date): string {
  return (now?.() ?? new Date()).toISOString();
}
