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
    schemaVersion: "1.0.0",
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
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
