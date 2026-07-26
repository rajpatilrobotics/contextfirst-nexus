import "server-only";

import {
  PrivateLiveEvaluationRequestSchema,
  PrivateLiveEvaluationResultSchema,
} from "../../contracts";
import {
  runSelectedProvider,
  type AdapterOverrides,
  type AnalyzeResult,
} from "./orchestrator";
import { geminiAdapter } from "./adapters/gemini";
import { runGroqAnalysis } from "./adapters/groq";
import { runMistralAnalysis } from "./adapters/mistral";
import { runOpenAIAnalysis } from "./adapters/openai";
import { CFN_DEMO_FIXTURE_BINDING, SHARED_PROMPT_VERSION } from "./types";
import { buildFrozenEvaluationProviderInput } from "./canonical-input";

type PrivateLiveEvaluationResult = {
  schemaVersion: "1.0.0";
  source: "private_evaluation";
  admissionMutation: false;
  publicSelectabilityMutation: false;
  terminalResponse: Extract<AnalyzeResult, { outcome: "succeeded" | "failed" }>;
};

export async function runPrivateLiveEvaluation(
  value: unknown,
  adapters: AdapterOverrides = {},
): Promise<PrivateLiveEvaluationResult> {
  const request = PrivateLiveEvaluationRequestSchema.parse(value);
  if (
    request.caseId !== CFN_DEMO_FIXTURE_BINDING.caseId ||
    request.fixtureVersion !== CFN_DEMO_FIXTURE_BINDING.fixtureVersion ||
    request.canonicalFixtureDigest !== CFN_DEMO_FIXTURE_BINDING.canonicalFixtureDigest ||
    request.promptVersion !== SHARED_PROMPT_VERSION ||
    request.callOrdinal > request.approval.approvedCallCount ||
    request.release.releaseConfigurationId !== request.approval.release.releaseConfigurationId
  ) {
    throw new Error("Evaluation request is outside the frozen synthetic boundary.");
  }

  const canonical = buildFrozenEvaluationProviderInput(request);
  if (!canonical.ok) {
    throw new Error(`Evaluation canonical input failed: ${canonical.reason}.`);
  }
  const terminalResponse = await runSelectedProvider(
    canonical.input,
    Object.keys(adapters).length > 0
      ? adapters
      : privateEvaluationAdapter(request.release.providerId),
  );

  if (terminalResponse.outcome === "rejected_before_run") {
    throw new Error("Evaluation preflight unexpectedly rejected the frozen input.");
  }

  const result: PrivateLiveEvaluationResult = {
    schemaVersion: "1.0.0",
    source: "private_evaluation",
    admissionMutation: false,
    publicSelectabilityMutation: false,
    terminalResponse,
  };
  PrivateLiveEvaluationResultSchema.parse(result);
  return result;
}

function privateEvaluationAdapter(
  providerId: "openai" | "google_gemini" | "mistral" | "groq",
): AdapterOverrides {
  if (providerId === "openai") return { openai: runOpenAIAnalysis };
  if (providerId === "google_gemini") {
    return { gemini: geminiAdapter.analyze };
  }
  if (providerId === "mistral") return { mistral: runMistralAnalysis };
  return { groq: runGroqAnalysis };
}
