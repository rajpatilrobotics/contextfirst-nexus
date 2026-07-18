import "server-only";

import evaluationDefinitionsJson from "../../fixtures/evals/definitions/evaluation-definitions.json";
import geminiReportJson from "../../fixtures/evals/results/admission/gemini-quality-v1.report.json";
import mistralReportJson from "../../fixtures/evals/results/admission/mistral-small-free-v1.report.json";
import openAiReportJson from "../../fixtures/evals/results/admission/openai-quality-v1.report.json";
import deterministicHarnessJson from "../../fixtures/evals/results/deterministic-harness-v1.json";
import replayContinuityJson from "../../fixtures/evals/results/replay-continuity-v1.json";
import packageJson from "../../package.json";
import {
  EvaluationDefinitionSchema,
  EvaluationResultSchema,
  ProviderEvaluationAdmissionReportSchema,
  SystemCardSchema,
  type EvaluationResult,
  type SystemCard,
} from "../../lib/contracts";
import { createTrustedCheckpointBundle } from "../../lib/analysis/replay";
import { bundledGuidancePack } from "../../lib/guidance";
import { STATIC_ADMISSION_RECORDS } from "../../lib/ai/server/admission";
import { isLiveAnalysisEnabled } from "../../lib/ai/server/live-analysis-policy";
import { buildAnalyzeAvailabilityResponse } from "../../lib/ai/server/registry";
import { CFN_DEMO_FIXTURE_BINDING } from "../../lib/ai/server/types";

export type EvaluationDefinitionDisplay = {
  variantId: string;
  expectedChecks: Array<{ name: string; expected: string }>;
};

export type TrustPageData = {
  systemCard: SystemCard;
  deterministicHarnessResults: EvaluationResult[];
  evaluationDefinitions: EvaluationDefinitionDisplay[];
  guidancePack: typeof bundledGuidancePack;
  checkpointReference: NonNullable<SystemCard["activeCheckpoint"]>;
};

const INTENDED_USE = [
  "Organize the bundled fictional adult case for qualified practitioner review.",
  "Present source-linked candidates, limitations, contradictions, and gaps for individual human decisions.",
  "Prepare reviewed, redacted, purpose-bound local handoffs after every required gate passes.",
];

const PROHIBITED_USE = [
  "Do not determine trafficking or victim status, credibility, guilt, eligibility, punishment, priority, or case outcome.",
  "Do not use this prototype for real, private, client, survivor, or child material.",
  "Do not use it as legal advice, an emergency or reporting service, a survivor chatbot, or an investigation tool.",
];

const HUMAN_REVIEW_REQUIREMENTS = [
  "A qualified practitioner reviews every consequential candidate individually.",
  "Exact or centrally resolved citations, coverage, masking, privacy, and dependencies must pass before export.",
  "Guidance may frame questions but never establishes a case fact or domestic legal conclusion.",
];

const KNOWN_FAILURE_MODES = [
  "Extraction or coverage can remain unavailable or incomplete.",
  "A live provider can refuse, time out, return invalid structure, or fail deterministic safety validation.",
  "A citation can be missing, ambiguous, invalid, or tied to unavailable coverage.",
  "A dependency change can invalidate reviewed findings and revoke export readiness.",
];

const KNOWN_LIMITATIONS = [
  "Working fictional-data hackathon prototype; no real-case or production assurance.",
  "One English fictional adult fixture and bundled text PDFs only; no OCR or arbitrary upload.",
  "No domestic legal verification, multilingual assurance, chain of custody, production authentication, or durable case store.",
  "Provider terms and availability can change; no provider setting is described as guaranteed zero retention.",
  "Demo evaluation evidence does not establish real-world effectiveness.",
];

export function getTrustPageData(): TrustPageData {
  const reports = [
    ProviderEvaluationAdmissionReportSchema.parse(openAiReportJson),
    ProviderEvaluationAdmissionReportSchema.parse(geminiReportJson),
    ProviderEvaluationAdmissionReportSchema.parse(mistralReportJson),
  ];
  const replayContinuity = EvaluationResultSchema.parse(replayContinuityJson);
  const measuredResults = [
    ...reports.flatMap((report) => report.evidence),
    replayContinuity,
  ];
  const deterministicHarnessResults = deterministicHarnessJson.harnessResults.map((result) =>
    EvaluationResultSchema.parse(result),
  );
  const evaluationDefinitions = evaluationDefinitionsJson.variants.map((definition) => {
    const parsed = EvaluationDefinitionSchema.parse(definition);
    return {
      variantId: parsed.variantId,
      expectedChecks: parsed.expectedChecks,
    };
  });
  const availability = buildAnalyzeAvailabilityResponse({
    liveAnalysisEnabled: isLiveAnalysisEnabled(),
  });
  const checkpoint = createTrustedCheckpointBundle();

  const checkpointReference: NonNullable<SystemCard["activeCheckpoint"]> = {
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

  const systemCard = SystemCardSchema.parse({
    schemaVersion: "1.0.0",
    productVersion: packageJson.version,
    intendedUse: INTENDED_USE,
    prohibitedUse: PROHIBITED_USE,
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
    humanReviewRequirements: HUMAN_REVIEW_REQUIREMENTS,
    knownFailureModes: KNOWN_FAILURE_MODES,
    unsupportedJurisdictions: ["All real domestic jurisdictions require independent local legal verification."],
    unsupportedDocumentTypes: ["Scanned or image-only PDFs", "Audio", "Video", "Arbitrary uploads"],
    unsupportedUserGroups: ["Survivor self-service", "Children", "Public or unauthenticated real-case users"],
    knownLimitations: KNOWN_LIMITATIONS,
    fixtureCount: 1,
    unsafeOutputReportingMechanism: "Local browser-session audit event using a safe category and affected entity IDs only.",
    evaluationFixtureVersion: "1.0.0",
    measuredResults,
    providerAdmissions: STATIC_ADMISSION_RECORDS,
    evaluationAdmissionReports: reports,
    liveAnalysisEnabled: availability.liveAnalysisEnabled,
    replayEnabled: true,
  });

  return {
    systemCard,
    deterministicHarnessResults,
    evaluationDefinitions,
    guidancePack: bundledGuidancePack,
    checkpointReference,
  };
}
