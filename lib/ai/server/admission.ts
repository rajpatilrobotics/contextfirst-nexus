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
  GROQ_ADAPTER_VERSION,
  adapterVersionForProvider,
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
  {
    providerId: "groq",
    releaseConfigurationId: "groq-oss-free-v1",
    requestedModel: "openai/gpt-oss-120b",
    serviceTier: "unpaid",
  },
] as const satisfies readonly LiveProviderReleaseConfiguration[];

const INFERENCE_BY_RELEASE = {
  "openai-quality-v1": { kind: "reasoning_effort", value: "medium" },
  "gemini-quality-v1": { kind: "thinking_level", value: "medium" },
  "mistral-small-free-v1": { kind: "reasoning_effort", value: "medium" },
  "groq-oss-free-v1": { kind: "reasoning_effort", value: "medium" },
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
    adapterVersion: string;
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
      status: "not_run" | "incomplete";
      total: 27;
      passed: number;
      failed: number;
      interrupted: number;
      notRun: number;
      actualProviderTransmissions: number;
    };
    deterministicControl: {
      status: "passed";
      total: 5;
      passed: 5;
      actualProviderTransmissions: 0;
    };
    blockingGates: {
      status: "incomplete";
      total: 8;
      passed: number;
      failed: number;
      notRun: number;
      names: readonly string[];
    };
  };
  admissionDisposition: "not_evaluated";
  reasons: readonly [
    "report_incomplete",
    "live_evidence_incomplete",
  ];
};

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
  reportGeneratedAt: string,
  observedEvaluatedConfigurationDigest: string,
  expectedEvaluatedConfigurationDigest: string,
  liveEvidence: {
    passed: number;
    failed: number;
    interrupted: number;
    notRun: number;
    actualProviderTransmissions: number;
  },
  blockingGateEvidence: {
    passed: number;
    failed: number;
    notRun: number;
  } = { passed: 1, failed: 0, notRun: 7 },
): ReviewedIncompleteReport {
  return {
    report: {
      schemaVersion: ContractVersions.providerEvaluationAdmissionReport,
      id: reportId,
      digest: reportDigest,
      generatedAt: reportGeneratedAt,
      status: "incomplete",
    },
    binding: {
      release,
      adapterVersion:
        release.providerId === "groq"
          ? GROQ_ADAPTER_VERSION
          : ADAPTER_VERSION,
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
        status:
          liveEvidence.passed === 0 &&
          liveEvidence.failed === 0 &&
          liveEvidence.interrupted === 0
            ? "not_run"
            : "incomplete",
        total: 27,
        ...liveEvidence,
      },
      deterministicControl: {
        status: "passed",
        total: 5,
        passed: 5,
        actualProviderTransmissions: 0,
      },
      blockingGates: {
        status: "incomplete",
        total: 8,
        ...blockingGateEvidence,
        names: BLOCKING_GATE_NAMES,
      },
    },
    admissionDisposition: "not_evaluated",
    reasons: [
      "report_incomplete",
      "live_evidence_incomplete",
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
    "af1f3508e6901cd64cc939a085549c773d428e535d424fe08886e3871869dad2",
    "2026-07-16T00:00:00.000Z",
    "c23118e6683c1b1d099db3385d1cbc47eb05fdaf6608b9bcbd3741ba910a877a",
    "c23118e6683c1b1d099db3385d1cbc47eb05fdaf6608b9bcbd3741ba910a877a",
    {
      passed: 0,
      failed: 0,
      interrupted: 0,
      notRun: 27,
      actualProviderTransmissions: 0,
    },
  ),
  "gemini-quality-v1": reviewedIncompleteReport(
    LIVE_RELEASES[1],
    INFERENCE_BY_RELEASE["gemini-quality-v1"],
    "REPORT-GEMINI-QUALITY-V1-V1",
    "dc28aff7b9c228e5729b857da3bc1d72bafb713152ee295b4ece0084a2a258c2",
    "2026-07-16T00:00:00.000Z",
    "cb0ca178f90adf56b77a706565cea3d706d7c2134c3b50dbe49981e59d101295",
    "cb0ca178f90adf56b77a706565cea3d706d7c2134c3b50dbe49981e59d101295",
    {
      passed: 0,
      failed: 0,
      interrupted: 0,
      notRun: 27,
      actualProviderTransmissions: 0,
    },
  ),
  "mistral-small-free-v1": reviewedIncompleteReport(
    LIVE_RELEASES[2],
    INFERENCE_BY_RELEASE["mistral-small-free-v1"],
    "REPORT-MISTRAL-SMALL-FREE-V1-V1",
    "26fae46551dcbd9d6f3bd27aa202855053d8856c34bb5607c71788e566832774",
    "2026-07-16T00:00:00.000Z",
    "f8e92d9921a04c55431f528e7148f64fb5c9c86fe59569b98bdacc45561ac7dd",
    "f8e92d9921a04c55431f528e7148f64fb5c9c86fe59569b98bdacc45561ac7dd",
    {
      passed: 0,
      failed: 0,
      interrupted: 0,
      notRun: 27,
      actualProviderTransmissions: 0,
    },
  ),
  "groq-oss-free-v1": reviewedIncompleteReport(
    LIVE_RELEASES[3],
    INFERENCE_BY_RELEASE["groq-oss-free-v1"],
    "REPORT-GROQ-OSS-FREE-V1-V1",
    "40db44f9874c7b921730f2aa7cf71801a6b0851ae95043a4a25a3194fa707f57",
    "2026-07-26T07:07:32.318Z",
    "27fef2648570ce1a0b6c50ffc98295cc8816ffeaaadbc5a1dc0a41f9e586cd83",
    "27fef2648570ce1a0b6c50ffc98295cc8816ffeaaadbc5a1dc0a41f9e586cd83",
    {
      passed: 10,
      failed: 1,
      interrupted: 0,
      notRun: 16,
      actualProviderTransmissions: 14,
    },
    { passed: 3, failed: 0, notRun: 5 },
  ),
} as const satisfies Partial<Record<
  LiveProviderReleaseConfiguration["releaseConfigurationId"],
  ReviewedIncompleteReport
>>;

export const STATIC_ADMISSION_RECORDS = LIVE_RELEASES.map((release) =>
  ProviderReleaseAdmissionRecordSchema.parse({
    schemaVersion: "1.0.0",
    releaseConfigurationId: release.releaseConfigurationId,
    deployedAccountReleaseAvailability:
      release.providerId === "mistral" || release.providerId === "groq"
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
    adapterVersion: adapterVersionForProvider(release.providerId),
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
    adapterVersion: adapterVersionForProvider(release.providerId),
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
