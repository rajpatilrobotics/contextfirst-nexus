import evaluationDefinitionsJson from "../../../fixtures/evals/definitions/evaluation-definitions.json";
import geminiReportJson from "../../../fixtures/evals/results/admission/gemini-quality-v1.report.json";
import mistralReportJson from "../../../fixtures/evals/results/admission/mistral-small-free-v1.report.json";
import openAiReportJson from "../../../fixtures/evals/results/admission/openai-quality-v1.report.json";
import deterministicHarnessJson from "../../../fixtures/evals/results/deterministic-harness-v1.json";
import replayContinuityJson from "../../../fixtures/evals/results/replay-continuity-v1.json";
import {
  EvaluationDefinitionSchema,
  EvaluationResultSchema,
  ProviderEvaluationAdmissionReportSchema,
  SystemCardSchema,
  type AnalysisRun,
  type EvaluationResult,
  type NonRunAnalysisAttempt,
  type SystemCard,
} from "../../../lib/contracts";
import { createReplayInputState, createTrustedCheckpointBundle } from "../../../lib/analysis/replay";
import { STATIC_ADMISSION_RECORDS } from "../../../lib/ai/server/admission";
import { buildAnalyzeAvailabilityResponse } from "../../../lib/ai/server/registry";
import { CFN_DEMO_FIXTURE_BINDING } from "../../../lib/ai/server/types";

export const reports = [
  ProviderEvaluationAdmissionReportSchema.parse(openAiReportJson),
  ProviderEvaluationAdmissionReportSchema.parse(geminiReportJson),
  ProviderEvaluationAdmissionReportSchema.parse(mistralReportJson),
];

export const replayContinuity = EvaluationResultSchema.parse(replayContinuityJson) as EvaluationResult;
export const harnessResults = deterministicHarnessJson.harnessResults.map(
  (result) => EvaluationResultSchema.parse(result) as EvaluationResult,
);
export const definitionDisplays = evaluationDefinitionsJson.variants.map((definition) => {
  const parsed = EvaluationDefinitionSchema.parse(definition);
  return { variantId: parsed.variantId, expectedChecks: parsed.expectedChecks };
});

export const checkpointReference: NonNullable<SystemCard["activeCheckpoint"]> = (() => {
  const checkpoint = createTrustedCheckpointBundle();
  return {
    id: checkpoint.id,
    bundleVersion: checkpoint.bundleVersion,
    checkpointVersion: checkpoint.checkpointVersion,
    replayVersion: checkpoint.replayVersion,
    fixtureVersion: checkpoint.fixtureVersion,
    canonicalFixtureDigest: checkpoint.canonicalFixtureDigest,
    postDecisionHashProjectionVersion: checkpoint.postDecisionHashProjectionVersion,
    visibleLabel: checkpoint.visibleLabel,
    replayVisibleLabel: checkpoint.replayVisibleLabel,
    providerTransmission: checkpoint.providerTransmission,
    seededDecisionActor: checkpoint.seededDecisionActor,
  };
})();

export function systemCard(): SystemCard {
  const availability = buildAnalyzeAvailabilityResponse({ liveAnalysisEnabled: true });
  return SystemCardSchema.parse({
    schemaVersion: "1.0.0",
    productVersion: "0.1.0",
    intendedUse: ["Qualified practitioner review of one bundled fictional adult fixture."],
    prohibitedUse: ["No legal or victim-status decisions and no real case data."],
    enabledDataOrigin: "bundled_synthetic",
    enabledFixtureBinding: CFN_DEMO_FIXTURE_BINDING,
    providerDisplayOrder: ["openai", "google_gemini", "mistral", "local_replay"],
    providers: availability.options,
    selectedRelease: null,
    selectionPolicy: "explicit_user_choice_only",
    automaticCrossProviderFailover: false,
    crossRunOutputMerging: false,
    attemptedRuns: [],
    nonRunAttempts: [],
    currentRun: null,
    activeCheckpoint: null,
    supportedLanguages: ["en"],
    supportedDocumentMode: "bundled_text_pdf",
    humanReviewRequirements: ["Individual review is required."],
    knownFailureModes: ["Citation validation can fail."],
    unsupportedJurisdictions: ["Real domestic jurisdictions"],
    unsupportedDocumentTypes: ["Image-only PDF"],
    unsupportedUserGroups: ["Children"],
    knownLimitations: ["Synthetic prototype only."],
    fixtureCount: 1,
    unsafeOutputReportingMechanism: "Local safe category and entity IDs only.",
    evaluationFixtureVersion: "1.0.0",
    measuredResults: [...reports.flatMap((report) => report.evidence), replayContinuity],
    providerAdmissions: STATIC_ADMISSION_RECORDS,
    evaluationAdmissionReports: reports,
    liveAnalysisEnabled: true,
    replayEnabled: true,
  });
}

export function failedOpenAiRun(): AnalysisRun {
  const replay = createTrustedCheckpointBundle().replayRun;
  return {
    ...replay,
    id: "RUN-OPENAI-FAILED-001",
    mode: "live",
    provider: {
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      requestedModel: "gpt-5.6-sol",
      serviceTier: "paid",
      adapterVersion: "task-011-shared-boundary-v1",
      returnedModel: "gpt-5.6-sol-2026-07-14",
      inferenceSetting: { kind: "reasoning_effort", value: "medium" },
      disclosureVersion: "1.0.0",
      providerTransmission: true,
    },
    checkpointProvenance: null,
    inputState: createReplayInputState(),
    candidateCount: 0,
    citationCount: 0,
    quarantinedCount: 0,
    status: "failed",
    failure: {
      classification: "provider_timeout",
      safeErrorCode: "PROVIDER_TIMEOUT",
      retryableSameProvider: true,
      alternateProviderRecoveryAllowed: true,
      replayRecoveryAllowed: true,
    },
    recovery: {
      recoveryOfRunId: "RUN-GEMINI-FAILED-000",
      selectionReason: "explicit_provider_switch",
      selectedBy: "practitioner",
      automaticFailover: false,
      outputsMerged: false,
    },
  };
}

export const nonRunAttempts: NonRunAnalysisAttempt[] = [
  {
    id: "ATTEMPT-AUDIT-0100",
    caseId: "CFN-DEMO-001",
    startCommandId: "cmd-start-preflight",
    auditEventId: "AUDIT-0100",
    providerSelection: {
      providerId: "google_gemini",
      releaseConfigurationId: "gemini-quality-v1",
      serviceTier: "unpaid",
    },
    outputAccepted: false,
    occurredAt: "2026-07-16T00:00:00.000Z",
    kind: "preflight_rejection",
    transmissionStatus: "not_transmitted",
    remoteExecutionStatus: "not_started",
    safeErrorCode: "PROVIDER_DISABLED",
    reasonCode: "PROVIDER_DISABLED",
  },
  {
    id: "ATTEMPT-AUDIT-0101",
    caseId: "CFN-DEMO-001",
    startCommandId: "cmd-start-transport",
    auditEventId: "AUDIT-0101",
    providerSelection: {
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      serviceTier: "paid",
    },
    outputAccepted: false,
    occurredAt: "2026-07-16T00:01:00.000Z",
    kind: "transport_failure",
    transmissionStatus: "unknown",
    remoteExecutionStatus: "unknown",
    safeErrorCode: "CLIENT_TRANSPORT_FAILURE",
    reasonCode: "invalid_response_envelope",
  },
];
