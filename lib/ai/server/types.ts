import type {
  AnalyzeRequest,
  LiveProviderId,
  LiveProviderReleaseConfiguration,
  ProviderDisclosureProjection,
  ProviderFixtureBinding,
  ProviderOptionProjection,
  ProviderReleaseAdmissionRecord,
  ProviderReleaseConfiguration,
  ProviderReleaseInferenceSetting,
  ProviderReleaseSelection,
  ReplayReleaseConfiguration,
} from "../../contracts";
import type { RedactedSegment } from "../../redaction";

export const AI_BOUNDARY_VERSION = "1.0.0" as const;
export const SHARED_PROMPT_VERSION = "1.0.0" as const;
export const ADAPTER_VERSION = "task-011-shared-boundary-v1" as const;
export const EVALUATION_DEFINITION_SET_DIGEST =
  "649b10f68d8a445e79c626efa63ede464cc19b7a82ffab5785c8dcd84b4f2683" as const;

export const CFN_DEMO_FIXTURE_BINDING = {
  dataOrigin: "bundled_synthetic",
  caseId: "CFN-DEMO-001",
  fixtureVersion: "1.0.0",
  canonicalFixtureDigest:
    "ede4457873700cc4bce1bb5fad29c89a4e25d2e6ca7ccd33c323a2ce8ac5809c",
} as const satisfies ProviderFixtureBinding;

export type LiveProviderReleaseRegistryEntry = {
  kind: "live";
  release: LiveProviderReleaseConfiguration;
  displayName: string;
  modelDisplayName: string;
  modelAliasDisclosure: string;
  adapterVersion: typeof ADAPTER_VERSION;
  displayOrder: 1 | 2 | 3;
  enabled: boolean;
  staticServiceTierAvailability: "available" | "unavailable";
  inferenceSetting: ProviderReleaseInferenceSetting;
  disclosure: ProviderDisclosureProjection;
  admission: ProviderReleaseAdmissionRecord;
};

export type ReplayReleaseRegistryEntry = {
  kind: "replay";
  release: ReplayReleaseConfiguration;
  displayName: string;
  modelDisplayName: string;
  modelAliasDisclosure: string;
  adapterVersion: typeof ADAPTER_VERSION;
  displayOrder: 4;
  inferenceSetting: ProviderReleaseInferenceSetting;
  disclosure: ProviderDisclosureProjection;
};

export type ProviderReleaseRegistryEntry =
  | LiveProviderReleaseRegistryEntry
  | ReplayReleaseRegistryEntry;

export type ProviderAvailabilityOptions = {
  liveAnalysisEnabled?: boolean;
};

export type CanonicalProviderInput = {
  schemaVersion: typeof AI_BOUNDARY_VERSION;
  promptVersion: typeof SHARED_PROMPT_VERSION;
  request: AnalyzeRequest;
  release: Extract<ProviderReleaseSelection, { providerId: LiveProviderId }>;
  fixtureBinding: typeof CFN_DEMO_FIXTURE_BINDING;
  selectedSegments: RedactedSegment[];
  serializedEvidence: string;
  inputByteLength: number;
};

export type SharedPrompt = {
  version: typeof SHARED_PROMPT_VERSION;
  systemBoundary: string;
  requestedTasksAndSchema: string;
  definitions: string;
  untrustedEvidenceJson: string;
};

export type ProviderRequestPolicy = {
  schemaVersion: typeof AI_BOUNDARY_VERSION;
  release: ProviderReleaseConfiguration;
  mode: "live" | "deterministic_replay";
  maxProviderCalls: 1;
  streaming: false;
  toolsEnabled: false;
  structuredOutputOnly: true;
  automaticRetry: false;
  crossProviderFallback: false;
  replaySubstitution: false;
  backgroundWork: false;
  files: false;
  browsing: false;
  search: false;
  memory: false;
  externalActions: false;
};

export type SafeLogMetadata = {
  requestId?: string;
  runId?: string;
  providerId?: string;
  releaseConfigurationId?: string;
  stage?: string;
  code?: string;
  availabilityStatus?: ProviderOptionProjection["availabilityStatus"];
  evaluationStatus?: ProviderOptionProjection["evaluationStatus"];
};
