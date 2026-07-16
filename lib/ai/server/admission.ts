import crypto from "node:crypto";

import {
  ContractVersions,
  ProviderReleaseAdmissionRecordSchema,
  type LiveProviderReleaseConfiguration,
  type ProviderReleaseAdmissionRecord,
  type ProviderReleaseInferenceSetting,
} from "../../contracts";
import {
  ADAPTER_VERSION,
  CFN_DEMO_FIXTURE_BINDING,
  EVALUATION_DEFINITION_SET_DIGEST,
  SHARED_PROMPT_VERSION,
} from "./types";

const LIVE_RELEASES = [
  {
    providerId: "openai",
    releaseConfigurationId: "openai-quality-v1",
    requestedModel: "gpt-5.6-sol",
    serviceTier: "paid",
  },
  {
    providerId: "google_gemini",
    releaseConfigurationId: "gemini-quality-v1",
    requestedModel: "gemini-3.5-flash",
    serviceTier: "unpaid",
  },
  {
    providerId: "mistral",
    releaseConfigurationId: "mistral-small-free-v1",
    requestedModel: "mistral-small-2603",
    serviceTier: "unpaid",
  },
] as const satisfies readonly LiveProviderReleaseConfiguration[];

const INFERENCE_BY_RELEASE = {
  "openai-quality-v1": { kind: "reasoning_effort", value: "medium" },
  "gemini-quality-v1": { kind: "thinking_level", value: "medium" },
  "mistral-small-free-v1": { kind: "reasoning_effort", value: "medium" },
} as const satisfies Record<
  LiveProviderReleaseConfiguration["releaseConfigurationId"],
  ProviderReleaseInferenceSetting
>;

type ReviewedIncompleteReport = {
  report: {
    schemaVersion: typeof ContractVersions.providerEvaluationAdmissionReport;
    id: string;
    digest: string;
    generatedAt: string;
    status: "incomplete";
  };
  binding: {
    release: LiveProviderReleaseConfiguration;
    adapterVersion: typeof ADAPTER_VERSION;
    inferenceSetting: ProviderReleaseInferenceSetting;
    disclosureVersion: typeof ContractVersions.providerDisclosure;
    fixtureBinding: typeof CFN_DEMO_FIXTURE_BINDING;
    evaluationDefinitionSetDigest: typeof EVALUATION_DEFINITION_SET_DIGEST;
    observedEvaluatedConfigurationDigest: string;
    expectedEvaluatedConfigurationDigest: string;
    promptVersion: typeof SHARED_PROMPT_VERSION;
    responseSchemaVersion: typeof ContractVersions.analysisResponse;
    rulesetVersion: typeof ContractVersions.privateLiveEvaluation;
    requiredLiveRunsPerModelVariant: 3;
    requiredRunsPerControlScenario: 1;
  };
  evidence: {
    liveModel: {
      status: "not_run";
      total: 27;
      notRun: 27;
      actualProviderTransmissions: 0;
    };
    deterministicControl: {
      status: "passed";
      total: 5;
      passed: 5;
      actualProviderTransmissions: 0;
    };
    blockingGates: {
      status: "not_run";
      total: 8;
      notRun: 8;
      names: readonly string[];
    };
  };
  admissionDisposition: "not_evaluated";
  reasons: readonly [
    "report_incomplete",
    "live_evidence_not_run",
    "evaluated_configuration_digest_mismatch",
  ];
};

const REVIEWED_REPORT_TIME = "2026-07-16T00:00:00.000Z" as const;
const BLOCKING_GATE_NAMES = [
  "consequential_review_blocking",
  "invalid_citation_rejection",
  "injection_containment",
  "cooperation_invariance",
  "declared_identifier_exclusion",
  "required_abstention",
  "dependency_recalculation",
  "prohibited_conclusion_blocking",
] as const;

function reviewedIncompleteReport(
  release: LiveProviderReleaseConfiguration,
  inferenceSetting: ProviderReleaseInferenceSetting,
  reportId: string,
  reportDigest: string,
  observedEvaluatedConfigurationDigest: string,
  expectedEvaluatedConfigurationDigest: string,
): ReviewedIncompleteReport {
  return {
    report: {
      schemaVersion: ContractVersions.providerEvaluationAdmissionReport,
      id: reportId,
      digest: reportDigest,
      generatedAt: REVIEWED_REPORT_TIME,
      status: "incomplete",
    },
    binding: {
      release,
      adapterVersion: ADAPTER_VERSION,
      inferenceSetting,
      disclosureVersion: ContractVersions.providerDisclosure,
      fixtureBinding: CFN_DEMO_FIXTURE_BINDING,
      evaluationDefinitionSetDigest: EVALUATION_DEFINITION_SET_DIGEST,
      observedEvaluatedConfigurationDigest,
      expectedEvaluatedConfigurationDigest,
      promptVersion: SHARED_PROMPT_VERSION,
      responseSchemaVersion: ContractVersions.analysisResponse,
      rulesetVersion: ContractVersions.privateLiveEvaluation,
      requiredLiveRunsPerModelVariant: 3,
      requiredRunsPerControlScenario: 1,
    },
    evidence: {
      liveModel: {
        status: "not_run",
        total: 27,
        notRun: 27,
        actualProviderTransmissions: 0,
      },
      deterministicControl: {
        status: "passed",
        total: 5,
        passed: 5,
        actualProviderTransmissions: 0,
      },
      blockingGates: {
        status: "not_run",
        total: 8,
        notRun: 8,
        names: BLOCKING_GATE_NAMES,
      },
    },
    admissionDisposition: "not_evaluated",
    reasons: [
      "report_incomplete",
      "live_evidence_not_run",
      "evaluated_configuration_digest_mismatch",
    ],
  };
}

/**
 * Reviewed report evidence is intentionally separate from the accepted
 * admission records below. Incomplete evidence cannot populate the canonical
 * report identity fields or promote a provider.
 */
export const REVIEWED_INCOMPLETE_REPORTS = {
  "openai-quality-v1": reviewedIncompleteReport(
    LIVE_RELEASES[0],
    INFERENCE_BY_RELEASE["openai-quality-v1"],
    "REPORT-OPENAI-QUALITY-V1-V1",
    "4151cc9ff1ee73b5e2fd28157eacd0dc30fb9d3fac56ad2323cbb3da0494a0a2",
    "4e527ee661762a6883516e59820f974bf97823cdc4d7c2131a69dee751e69fae",
    "d89b36b93a94e9cd50423f9ab4c53264fbdedb6a37b38aee53f1f6c024504271",
  ),
  "gemini-quality-v1": reviewedIncompleteReport(
    LIVE_RELEASES[1],
    INFERENCE_BY_RELEASE["gemini-quality-v1"],
    "REPORT-GEMINI-QUALITY-V1-V1",
    "a334c3abb2d04349345294ee4631cbc907933cc4ac4e97a9ed9fea12efa04213",
    "59d286ff2e6b68c7afb13b875bac255bf3bc94f1d79c6dc43fc8b3962ad7e467",
    "ec1d82db7de230bd9b7101c7d427d3ca99be7c5bef3cbb82c9fc342453386dab",
  ),
  "mistral-small-free-v1": reviewedIncompleteReport(
    LIVE_RELEASES[2],
    INFERENCE_BY_RELEASE["mistral-small-free-v1"],
    "REPORT-MISTRAL-SMALL-FREE-V1-V1",
    "fdfe95ffba0d3c85a24bddfd48dae6289288bd2595fd6ff874ef2864155c9be8",
    "892989ab11faaf20e56965fb2e3f456dfa07d189afa2bbf5817c38d1ceeb2b97",
    "40449626bede007f68a2f111b7b12e51c99c591fe7eccadf85f31745a1d0aaaf",
  ),
} as const satisfies Record<
  LiveProviderReleaseConfiguration["releaseConfigurationId"],
  ReviewedIncompleteReport
>;

export const STATIC_ADMISSION_RECORDS = LIVE_RELEASES.map((release) =>
  ProviderReleaseAdmissionRecordSchema.parse({
    schemaVersion: "1.0.0",
    releaseConfigurationId: release.releaseConfigurationId,
    deployedAccountReleaseAvailability:
      release.providerId === "mistral"
        ? { status: "not_verified", evidenceId: null, verifiedAt: null }
        : { status: "not_required", evidenceId: null, verifiedAt: null },
    evaluatedConfiguration: buildEvaluatedConfiguration(
      release,
      INFERENCE_BY_RELEASE[release.releaseConfigurationId],
    ),
    evaluationStatus: "not_evaluated",
    evaluationReportId: null,
    evaluationReportDigest: null,
    recordedAt: null,
  }),
) satisfies ProviderReleaseAdmissionRecord[];

export function getAdmissionRecord(
  releaseConfigurationId: LiveProviderReleaseConfiguration["releaseConfigurationId"],
): ProviderReleaseAdmissionRecord | null {
  return (
    STATIC_ADMISSION_RECORDS.find(
      (record) => record.releaseConfigurationId === releaseConfigurationId,
    ) ?? null
  );
}

export function expectedEvaluatedConfigurationDigest(
  release: LiveProviderReleaseConfiguration,
  inferenceSetting: ProviderReleaseInferenceSetting,
): string {
  return digestJson({
    schemaVersion: ContractVersions.providerRegistry,
    providerId: release.providerId,
    releaseConfigurationId: release.releaseConfigurationId,
    requestedModel: release.requestedModel,
    serviceTier: release.serviceTier,
    adapterVersion: ADAPTER_VERSION,
    inferenceSetting,
    disclosureVersion: ContractVersions.providerDisclosure,
    fixtureBinding: CFN_DEMO_FIXTURE_BINDING,
    promptVersion: SHARED_PROMPT_VERSION,
    requestSchemaVersion: ContractVersions.analysisRequest,
    responseSchemaVersion: ContractVersions.analysisResponse,
    rulesetVersion: ContractVersions.privateLiveEvaluation,
    evaluationDefinitionSetDigest: EVALUATION_DEFINITION_SET_DIGEST,
  });
}

function buildEvaluatedConfiguration(
  release: LiveProviderReleaseConfiguration,
  inferenceSetting: ProviderReleaseInferenceSetting,
) {
  return {
    schemaVersion: ContractVersions.providerRegistry,
    ...release,
    adapterVersion: ADAPTER_VERSION,
    inferenceSetting,
    disclosureVersion: ContractVersions.providerDisclosure,
    fixtureBinding: CFN_DEMO_FIXTURE_BINDING,
    promptVersion: SHARED_PROMPT_VERSION,
    requestSchemaVersion: ContractVersions.analysisRequest,
    responseSchemaVersion: ContractVersions.analysisResponse,
    rulesetVersion: ContractVersions.privateLiveEvaluation,
    evaluationDefinitionSetDigest: EVALUATION_DEFINITION_SET_DIGEST,
    evaluatedConfigurationDigest: expectedEvaluatedConfigurationDigest(release, inferenceSetting),
  };
}

function digestJson(value: unknown): string {
  return crypto.createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value === undefined) {
    throw new Error("Canonical JSON cannot contain undefined.");
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort(compareCodepoints)
        .map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

function compareCodepoints(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
