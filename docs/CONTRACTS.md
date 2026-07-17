# Shared Contracts

## 1. Status and authority

This document freezes the names, schemas, identifiers, states, and boundary behavior shared by ContextFirst Nexus P0 tasks. TypeScript and Zod implementations must represent these contracts without changing their meaning.

Shared contract changes require coordinator approval, a contract-version change when compatibility is affected, updated fixtures, and updated tests. A feature worker must not create a competing local version of a shared type.

### 1.1 DEC-045 staged contract reconciliation

DEC-045 replaces practitioner-controlled live provider selection with a plain-language analysis start and future server-managed routing. The currently implemented `providerSelection`, disclosure-acknowledgement, `selectionReason`, and browser recovery shapes below remain the legacy `1.0.0` implementation baseline only while TASK-039 removes the developer-style UI in the replay-only deployment.

TASK-039 may auto-bind only the sole selectable local replay release through those existing shapes. It must not enable a live provider or redefine shared schemas.

TASK-040 must begin by reconciling and, where incompatible, versioning this document and `docs/ARCHITECTURE.md` before changing live request or orchestration code. The reconciled contracts must express one browser analysis intent, ordered admitted server attempts, safe attempt metadata, one accepted result, no output merging, bounded attempts, forbidden-fallback classifications, exact final provider/release provenance, and replay as a separate local path. Until that reconciliation integrates, the legacy live-selection schemas are not authority for new UI or routing work.

## 2. Versioning rules

Use independent semantic versions for persisted case state, model output, exports, fixtures, prompts, and guidance.

```ts
type ContractVersions = {
  caseState: "1.0.0";
  analysisRequest: "1.0.0";
  analysisResponse: "1.0.0";
  providerRegistry: "1.0.0";
  providerDisclosure: "1.0.0";
  replay: "1.0.0";
  replayBundle: "1.0.0";
  demoCheckpoint: "1.0.0";
  checkpointPostDecisionHashProjection: "1.0.0";
  approvedRedactedInputDigestProjection: "1.0.0";
  privateLiveEvaluation: "1.0.0";
  evaluationDefinition: "1.0.0";
  evaluationDefinitionSetDigestProjection: "1.0.0";
  evaluationResult: "1.0.0";
  providerEvaluationAdmissionReport: "1.0.0";
  systemCard: "1.0.0";
  persistedCaseState: "1.0.0";
  reviewedExportStateHashProjection: "1.0.0";
  exportManifest: "1.0.0";
  fixture: "1.0.0";
  prompt: "1.0.0";
  guidancePack: "1.0.0";
};
```

The `1.0.0` schemas remain preimplementation drafts until the first implementation consumes them. Before that point, an approved correction updates every affected `1.0.0` draft together and is recorded explicitly. It must not be described as a compatible runtime change. After the first implementation, incompatible changes follow the normal major-version process.

Rules:

- Every persisted or exported root object carries `schemaVersion`.
- Unknown major versions fail closed and offer Reset Case or an unsupported-file message.
- Boundary readers are strict and reject unknown fields. An additive field requires an explicitly supported schema version and, when needed, a separately tested compatibility adapter. No same-version reader silently strips or ignores an unknown field.
- Enum meaning cannot change without a major version.
- Fixture expectations identify the exact fixture version.
- A replay is valid only for the matching prompt, analysis-response, and fixture versions.
- A replay or checkpoint bundle is valid only for its exact trusted bundle ID, bundle version, replay version, canonical fixture digest, and single-run ownership checks.
- A checkpoint outcome hash is comparable only under the same post-decision hash-projection version.
- Timestamps use ISO 8601 UTC.
- Date-only evidence stays in `YYYY-MM-DD` form and is never converted to a timestamp.
- Character intervals use an inclusive start and exclusive end.
- JSON may omit an optional field only when it is structurally not applicable. Semantic unknown values use a required explicit unknown enum or `null`; omission must never mean unknown. Serialized JSON never contains `undefined`.

## 3. Identifier formats

Identifiers are opaque strings after validation. User-facing labels may be separate.

| Entity | Format | Example |
|---|---|---|
| Case | `CFN-[A-Z0-9-]+` | `CFN-DEMO-001` |
| Purpose brief | `PURPOSE-[A-Z0-9-]+` | `PURPOSE-DEMO-001` |
| Document | `D` plus two digits | `D04` |
| Page | `{documentId}-P{number}` | `D04-P2` |
| Segment | `{documentId}-P{number}-S{number}` or approved metadata suffix | `D04-P2-S07`, `D05-META-01` |
| Candidate item, non-Nexus branch | `CAND-[A-Z0-9-]+` | `CAND-TASK-0402` |
| Candidate item, Nexus branch | `NEXUS-[A-Z0-9-]+` | `NEXUS-OFFENCE-TIMING` |
| Review decision | `REVIEW-[A-Z0-9-]+` | `REVIEW-CAND-TASK-0402-01` |
| Audit event | `AUDIT-[A-Z0-9-]+` | `AUDIT-000123` |
| Analysis run | `RUN-[A-Z0-9-]+` | `RUN-DEMO-LIVE-001` |
| Export | `EXPORT-[A-Z0-9-]+` | `EXPORT-DEMO-001` |
| Guidance source | Source register ID | `INT-002` |

Stable fixture identifiers must be hard-coded only in fixture data, not repeated as business logic.

## 4. Shared primitive values

### 4.1 Evidence nature

This value belongs to each source dependency, not to the candidate as a whole.

```ts
type EvidenceNature =
  | "documented_in_source"
  | "reported_or_alleged_in_source"
  | "reviewer_supplied_context"
  | "unknown";
```

### 4.2 Item origin

```ts
type ItemOrigin =
  | "source_extraction"
  | "ai_suggestion"
  | "human_created";
```

### 4.3 Support status

```ts
type SupportStatus =
  | "exact_source_supported"
  | "partially_supported"
  | "conflicting"
  | "insufficient_evidence"
  | "citation_unresolved"
  | "not_processed";
```

### 4.4 Review status

```ts
type ReviewStatus =
  | "pending"
  | "human_accepted"
  | "human_edited"
  | "rejected"
  | "uncertain"
  | "invalidated";
```

### 4.5 Review lane

```ts
type ReviewLane =
  | "trafficking_indicators"
  | "non_punishment_relevance"
  | "protection_remedy_urgency";
```

### 4.6 Processing-stage status

```ts
type StageStatus =
  | "pending"
  | "active"
  | "completed"
  | "warning"
  | "failed";
```

### 4.7 Data origin and run mode

```ts
type DataOrigin = "bundled_synthetic";
type AnalysisMode = "live" | "deterministic_replay";

type LiveProviderId = "openai" | "google_gemini" | "mistral";
type ProviderId = LiveProviderId | "local_replay";

type LiveProviderReleaseConfigurationId =
  | "openai-quality-v1"
  | "gemini-quality-v1"
  | "mistral-small-free-v1";

type ProviderReleaseConfigurationId =
  | LiveProviderReleaseConfigurationId
  | "prepared-replay-v1";

type ProviderServiceTier = "paid" | "unpaid" | "local";

type ProviderReleaseConfiguration =
  | {
      providerId: "openai";
      releaseConfigurationId: "openai-quality-v1";
      requestedModel: "gpt-5.6-sol";
      serviceTier: "paid";
    }
  | {
      providerId: "google_gemini";
      releaseConfigurationId: "gemini-quality-v1";
      requestedModel: "gemini-3.5-flash";
      serviceTier: "unpaid";
    }
  | {
      providerId: "mistral";
      releaseConfigurationId: "mistral-small-free-v1";
      requestedModel: "mistral-small-2603";
      serviceTier: "unpaid";
    }
  | {
      providerId: "local_replay";
      releaseConfigurationId: "prepared-replay-v1";
      requestedModel: "frozen_replay_output";
      serviceTier: "local";
    };

type ProviderReleaseSelection<
  R extends ProviderReleaseConfiguration = ProviderReleaseConfiguration,
> = R extends ProviderReleaseConfiguration
  ? Pick<R, "providerId" | "releaseConfigurationId" | "serviceTier">
  : never;

type LiveProviderReleaseConfiguration = Extract<
  ProviderReleaseConfiguration,
  { providerId: LiveProviderId }
>;

type ProviderDisplayOrderById = {
  openai: 1;
  google_gemini: 2;
  mistral: 3;
  local_replay: 4;
};

type ProviderStorageMode =
  | "openai_store_false"
  | "gemini_stateless_unpaid"
  | "mistral_stateless_free"
  | "local_no_transmission";

type ProviderStorageModeById = {
  openai: "openai_store_false";
  google_gemini: "gemini_stateless_unpaid";
  mistral: "mistral_stateless_free";
  local_replay: "local_no_transmission";
};

type ProviderRetentionSetting =
  | "openai_store_false"
  | "gemini_unpaid_default"
  | "mistral_free_30_day_default"
  | "local_no_provider_retention";

type ProviderRetentionSettingById = {
  openai: "openai_store_false";
  google_gemini: "gemini_unpaid_default";
  mistral: "mistral_free_30_day_default";
  local_replay: "local_no_provider_retention";
};

type ProviderFixtureBinding = {
  dataOrigin: "bundled_synthetic";
  caseId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  canonicalFixtureDigest: string;
};

type ProviderEvaluationStatus = "not_evaluated" | "passed" | "failed";

type StaticServiceTierAvailability = "available" | "unavailable";

type LiveProviderAvailabilityStatus =
  | "available"
  | "disabled"
  | "not_evaluated"
  | "evaluation_failed"
  | "not_configured"
  | "service_tier_unavailable"
  | "deployed_account_release_unavailable"
  | "data_policy_blocked";

type DeployedAccountReleaseAvailability =
  | {
      status: "not_required";
      evidenceId: null;
      verifiedAt: null;
    }
  | {
      status: "not_verified";
      evidenceId: null;
      verifiedAt: null;
    }
  | {
      status: "available" | "unavailable";
      evidenceId: string;
      verifiedAt: string;
    };

type DeployedAccountReleaseAvailabilityFor<
  R extends LiveProviderReleaseConfiguration,
> = R["releaseConfigurationId"] extends "mistral-small-free-v1"
  ? Exclude<DeployedAccountReleaseAvailability, { status: "not_required" }>
  : Extract<DeployedAccountReleaseAvailability, { status: "not_required" }>;

type ProviderReleaseAdmissionRecordBase<
  R extends LiveProviderReleaseConfiguration,
> = {
  schemaVersion: "1.0.0";
  releaseConfigurationId: R["releaseConfigurationId"];
  deployedAccountReleaseAvailability: DeployedAccountReleaseAvailabilityFor<R>;
  evaluatedConfiguration: EvaluatedReleaseConfiguration<R>;
};

type ProviderReleaseAdmissionRecord<
  R extends LiveProviderReleaseConfiguration = LiveProviderReleaseConfiguration,
> = R extends LiveProviderReleaseConfiguration
  ?
  | (ProviderReleaseAdmissionRecordBase<R> & {
      evaluationStatus: "not_evaluated";
      evaluationReportId: null;
      evaluationReportDigest: null;
      recordedAt: null;
    })
  | (ProviderReleaseAdmissionRecordBase<R> & {
      evaluationStatus: "passed" | "failed";
      evaluationReportId: string;
      evaluationReportDigest: string;
      recordedAt: string;
    })
  : never;

type ProviderReleaseInferenceSetting<
  R extends ProviderReleaseConfiguration,
> = R extends { releaseConfigurationId: "openai-quality-v1" }
  ? { kind: "reasoning_effort"; value: "medium" }
  : R extends { releaseConfigurationId: "gemini-quality-v1" }
    ? { kind: "thinking_level"; value: "medium" }
    : R extends { releaseConfigurationId: "mistral-small-free-v1" }
      ? { kind: "reasoning_effort"; value: "medium" }
      : { kind: "not_applicable"; value: "not_applicable" };

type EvaluatedReleaseConfiguration<
  R extends LiveProviderReleaseConfiguration,
> = R & {
  schemaVersion: "1.0.0";
  adapterVersion: string;
  inferenceSetting: ProviderReleaseInferenceSetting<R>;
  disclosureVersion: "1.0.0";
  fixtureBinding: ProviderFixtureBinding;
  promptVersion: "1.0.0";
  requestSchemaVersion: "1.0.0";
  responseSchemaVersion: "1.0.0";
  rulesetVersion: "1.0.0";
  evaluationDefinitionSetDigest: string;
  evaluatedConfigurationDigest: string;
};

type EvaluatedReleaseConfigurationDigestProjection<
  R extends LiveProviderReleaseConfiguration,
> = Omit<EvaluatedReleaseConfiguration<R>, "evaluatedConfigurationDigest">;

type LiveProviderReleaseRegistryEntry<
  R extends LiveProviderReleaseConfiguration = LiveProviderReleaseConfiguration,
> = R extends LiveProviderReleaseConfiguration ? {
  release: R;
  displayOrder: ProviderDisplayOrderById[R["providerId"]];
  adapterVersion: string;
  inferenceSetting: ProviderReleaseInferenceSetting<R>;
  evaluatedConfiguration: EvaluatedReleaseConfiguration<R>;
  enabled: boolean;
  configured: boolean;
  serviceTierAvailability: StaticServiceTierAvailability;
  requiresDeployedAccountReleaseAvailability: R["releaseConfigurationId"] extends "mistral-small-free-v1" ? true : false;
  admission: ProviderReleaseAdmissionRecord<R>;
  allowedDataOrigins: ["bundled_synthetic"];
  allowedFixtureBindings: [ProviderFixtureBinding];
  structuredOutput: true;
  streamingEnabled: false;
  toolsEnabled: false;
  storageMode: ProviderStorageModeById[R["providerId"]] & ProviderStorageMode;
  retentionSetting: ProviderRetentionSettingById[R["providerId"]] &
    ProviderRetentionSetting;
  disclosureVersion: "1.0.0";
} : never;

type ReplayReleaseConfiguration = Extract<
  ProviderReleaseConfiguration,
  { providerId: "local_replay" }
>;

type ReplayReleaseRegistryEntry = {
  release: ReplayReleaseConfiguration;
  displayOrder: 4;
  adapterVersion: string;
  inferenceSetting: { kind: "not_applicable"; value: "not_applicable" };
  enabled: true;
  configured: true;
  requiresDeployedAccountReleaseAvailability: false;
  allowedDataOrigins: ["bundled_synthetic"];
  allowedFixtureBindings: [ProviderFixtureBinding];
  structuredOutput: true;
  streamingEnabled: false;
  toolsEnabled: false;
  storageMode: "local_no_transmission";
  retentionSetting: "local_no_provider_retention";
  disclosureVersion: "1.0.0";
};

type ProviderReleaseRegistryEntry =
  | LiveProviderReleaseRegistryEntry
  | ReplayReleaseRegistryEntry;

type ProviderDisclosureProjection<
  P extends ProviderId = ProviderId,
> = P extends ProviderId ? {
  schemaVersion: "1.0.0";
  disclosureVersion: "1.0.0";
  serviceTierLabel: string;
  dataFlowSummary: string;
  storageMode: ProviderStorageModeById[P] & ProviderStorageMode;
  retentionSetting: ProviderRetentionSettingById[P] & ProviderRetentionSetting;
  retentionLimitation: string;
  trainingUseDisclosure: string;
  providerContentCategories: string[];
  processingRegion: string | null;
  allowedDataOrigins: ["bundled_synthetic"];
  providerTransmission: P extends "local_replay" ? false : true;
  rawPdfSentToProvider: false;
  toolsEnabled: false;
  acknowledgementRequired: true;
  lastVerified: string;
} : never;

type ProviderOptionProjection<
  R extends ProviderReleaseConfiguration = ProviderReleaseConfiguration,
> = R extends LiveProviderReleaseConfiguration ? R & {
  schemaVersion: "1.0.0";
  displayOrder: ProviderDisplayOrderById[R["providerId"]];
  displayName: string;
  modelDisplayName: string;
  modelAliasDisclosure: string;
  adapterVersion: string;
  mode: "live";
  providerTransmission: true;
  evaluationStatus: ProviderEvaluationStatus;
  deployedAccountReleaseAvailabilityStatus:
    DeployedAccountReleaseAvailabilityFor<R>["status"];
  availabilityStatus: LiveProviderAvailabilityStatus;
  selectable: boolean;
  disclosure: ProviderDisclosureProjection<R["providerId"]>;
} : R extends ReplayReleaseConfiguration ? R & {
  schemaVersion: "1.0.0";
  displayOrder: 4;
  displayName: string;
  modelDisplayName: "Frozen replay output";
  modelAliasDisclosure: "Versioned local replay, not live AI";
  adapterVersion: string;
  mode: "deterministic_replay";
  providerTransmission: false;
  evaluationStatus: "not_applicable";
  deployedAccountReleaseAvailabilityStatus: "not_required";
  availabilityStatus: "available";
  selectable: true;
  disclosure: ProviderDisclosureProjection<"local_replay">;
} : never;

type ProviderDisclosureAcknowledgement<
  R extends ProviderReleaseConfiguration = ProviderReleaseConfiguration,
> = R extends ProviderReleaseConfiguration
  ? ProviderReleaseSelection<R> & {
      id: string;
      schemaVersion: "1.0.0";
      disclosureVersion: "1.0.0";
      dataFlowAcknowledged: true;
      retentionAndTrainingUseAcknowledged: true;
      serviceTierAcknowledged: true;
      acknowledgedAt: string;
    }
  : never;

type PurposeProviderSelection<
  R extends ProviderReleaseConfiguration = ProviderReleaseConfiguration,
> = R extends ProviderReleaseConfiguration
  ? ProviderReleaseSelection<R> & {
      disclosureAcknowledgement: ProviderDisclosureAcknowledgement<R>;
    }
  : never;
```

The server validates every provider, release-configuration, service-tier, and disclosure combination against its static registry. Live entries also require the matching static admission record. The local replay entry has no provider admission record and is governed by its exact replay, fixture, and version contracts. The browser cannot supply a model name, endpoint, API key, admission record, or unevaluated live release. Availability is a safe public projection and never exposes credentials, raw environment values, internal endpoints, provider error bodies, or account evidence contents.

The registry and every safe projection use one fixed provider order: OpenAI `1`, Google Gemini `2`, Mistral `3`, and local replay `4`. Live evaluation status is derived from a version-controlled static admission record. It is never promoted by an environment value, a runtime evaluation-file read, or a provider response. Missing, incomplete, or mismatched live admission evidence fails closed as `not_evaluated`. Local replay reports `evaluationStatus: not_applicable` and remains visibly governed by deterministic replay assurance instead of live-provider admission.

For a live option, `availabilityStatus` is derived once using this exact first-match order: `disabled` when the static entry is disabled; `not_evaluated` when its admission record is not evaluated, its evaluated configuration does not deep-equal the registry configuration, either evaluated-configuration digest fails to recompute, or the two digests differ; `evaluation_failed` when its admission record is failed; `not_configured` when its required server configuration is absent; `service_tier_unavailable` when its static exact-tier availability is `unavailable`; `deployed_account_release_unavailable` when the release requires deployed-account availability and its safe status is not `available`; `data_policy_blocked` when the current origin or fixture binding is not permitted; otherwise `available`. `StaticServiceTierAvailability` is a version-controlled server configuration fact for the exact frozen tier, not an account-health or provider probe, and its raw configuration is never exposed beyond the derived safe status. `selectable` is true exactly when the derived status is `available` and its current disclosure is available for acknowledgement. This computation never performs a provider health, quota, rate-limit, or transient-availability probe. Those conditions exist only as safe outcomes of a started live request, never as static capability status.

An admission record with `not_evaluated` has null report identity, digest, and recorded time. A `passed` or `failed` record requires a non-empty report ID, lowercase 64-character SHA-256 report digest, and valid ISO 8601 recorded time. `evaluatedConfigurationDigest` is a lowercase 64-character SHA-256 digest of the UTF-8 canonical JSON encoding of `EvaluatedReleaseConfigurationDigestProjection` version `1.0.0`. Object keys sort by Unicode codepoint; fixture binding and release values preserve their declared tuple or scalar order; no undefined value is allowed. The registry recomputes both digests and requires exact deep equality of the two projections before an admission can be considered passed. OpenAI and Gemini records require the exact deployed-account state `not_required`. Mistral records permit only `not_verified`, `available`, or `unavailable`; Mistral can never use `not_required`. Schema validation rejects every mixed release, availability, or evaluated-configuration combination before registry selectability derives from the record.

`LiveProviderReleaseRegistryEntry.evaluatedConfiguration` is never independently authored state. The registry derives it from the entry's release, adapter, inference setting, disclosure, fixture binding, and fixed prompt, schema, ruleset, and definition-set constants, then recomputes its digest. It compares that derived projection and digest against both the static admission record and referenced evaluation report before exposing a passed selectable release. Changing any sibling field without a matching regenerated evaluation configuration fails closed as `not_evaluated`.

The Mistral entry binds `mistral-small-free-v1` to `mistral-small-2603`, unpaid service terms, `mistral_stateless_free`, `mistral_free_30_day_default`, and exact `ProviderReleaseInferenceSetting` value `{ kind: "reasoning_effort", value: "medium" }`. Its disclosure states that the free API profile has no zero-data-retention guarantee, may retain inputs and outputs for thirty rolling days, and may use them for training unless the account has opted out, subject to provider terms and exceptions. It is not selectable until the exact evaluation report passed and its static admission record also contains a coordinator-recorded `available` deployed-account release status with a non-empty safe evidence ID and a valid ISO 8601 verification time. For Mistral, `not_verified` requires both evidence fields to be null. Only OpenAI and Gemini use `not_required`, also with null evidence fields. `available` and `unavailable` require both evidence fields, and a blank identifier or invalid time fails closed. No account detail or evidence content appears in the public projection.

Every P0 registry entry has exactly one allowlisted bundled-fixture binding. A live request is eligible only when its case ID, fixture version, and canonical fixture digest exactly match that binding. A matching data-origin label without a matching digest is insufficient.

### 4.8 Case status

```ts
type CaseStatus =
  | "draft"
  | "processing"
  | "review_required"
  | "blocked"
  | "ready_to_export"
  | "exported"
  | "processing_failed";
```

No P0 enum includes a victim, credibility, guilt, eligibility, case-priority, or overall-risk score.

## 5. Case Purpose Brief

```ts
type ExcludedDecision =
  | "victim_or_trafficking_status"
  | "credibility"
  | "guilt_or_innocence"
  | "legal_eligibility"
  | "non_punishment_eligibility"
  | "case_priority"
  | "prosecution_sentence_or_outcome";

type SafeShareRecipientCategory =
  | "legal_aid_team"
  | "public_defender"
  | "court_navigation"
  | "ngo_caseworker"
  | "policy_or_research_summary";

type CasePurposeBrief = {
  id: string;
  schemaVersion: "1.0.0";
  caseId: string;
  revision: number;
  status: "draft" | "complete" | "withdrawn" | "superseded";
  practitionerRole:
    | "legal_aid"
    | "defence"
    | "public_defender"
    | "court_navigation"
    | "ngo_legal"
    | "demo_evaluator";
  organizationType:
    | "legal_aid"
    | "public_defender"
    | "court_service"
    | "ngo"
    | "law_office"
    | "research_or_evaluation"
    | "other_authorized";
  supportedWorkflow: "case_preparation_handoff";
  statedPurpose: string;
  excludedDecisions: ExcludedDecision[];
  authority: {
    basis: "not_applicable_synthetic_fixture";
    status: "active" | "withdrawn";
    consentStatus: "not_applicable_synthetic_fixture";
    authorityNotVerifiedAcknowledged: true;
    syntheticOrHarmlessDataAttested: true;
  };
  jurisdictionCode: "J-01" | "J-02" | "unspecified";
  sourceLanguage: "en";
  translationStatus: "original_language" | "translated_unverified" | "unknown";
  intendedRecipient: string;
  intendedRecipientCategory: SafeShareRecipientCategory;
  requestedExport: "full_practitioner_handoff" | "minimum_necessary_safe_share";
  prohibitedDecisionsAcknowledged: true;
  syntheticDataAcknowledged: true;
  providerSelection: PurposeProviderSelection;
  cooperationNeutralityAcknowledged: true;
  authorityAttested: true;
  createdAt: string;
  updatedAt: string;
};
```

P0 rules:

- The two jurisdiction codes are fictional and do not select domestic law.
- `supportedWorkflow` is the only P0 supported workflow. `statedPurpose` supplies a short local description within that boundary.
- `bundled_synthetic` is the only enabled P0 source-data origin.
- All acknowledgement fields must be `true` before processing begins. The provider acknowledgement must match the selected registry release, service tier, and current disclosure version.
- The required `excludedDecisions` set contains every `ExcludedDecision` value.
- `statedPurpose` and `intendedRecipient` are length-limited plain text and remain browser-local. `intendedRecipientCategory` is the only value used for deterministic safe-share eligibility.
- The system records the authority attestation but explicitly does not verify it.
- Cooperation with authorities is not required and cannot affect analysis.
- A purpose change after analysis invalidates export readiness and requires scope review.
- A requested handoff-kind change returns the user to Purpose, increments case revision, and invalidates the current export gate.

## 6. Source document contracts

```ts
type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateSpace: "pdf_points" | "normalized_0_1";
};

type PageRecord = {
  id: string;
  documentId: string;
  pageNumber: number;
  expected: boolean;
  availability:
    | "available"
    | "missing"
    | "unreadable"
    | "image_only"
    | "skipped"
    | "manually_excluded"
    | "extraction_failed";
  extractionStatus: StageStatus;
  extractedCharacterCount: number;
  failureCode?: SafeErrorCode;
};

type SourceSegment = {
  id: string;
  documentId: string;
  pageId?: string;
  pageNumber?: number;
  ordinal: number;
  rawText: string;
  redactedText: string;
  boundingBoxes: BoundingBox[];
  sourceLanguage: "en";
  translationStatus: "original_language" | "translated_unverified" | "unknown";
  extractionQuality: "fixture_verified" | "machine_extracted" | "unavailable";
  instructionAdvisory:
    | "not_scanned"
    | "no_signal"
    | "advisory_signal"
    | "human_reviewed";
  modelVisibility: "visible_as_untrusted_content" | "not_sent";
  supportEligibility: "candidate_eligible" | "evidence_only";
};

type DocumentRecord = {
  id: string;
  caseId: string;
  fixtureVersion: "1.0.0";
  fileName: string;
  displayName: string;
  sourceType:
    | "recruitment_record"
    | "communication"
    | "travel_record"
    | "practitioner_note"
    | "operational_financial_record"
    | "proceeding_record"
    | "support_provider_note";
  dataOrigin: "bundled_synthetic";
  expectedPageCount: number;
  pages: PageRecord[];
  provenanceStatus: "fixture_verified" | "unverified" | "unknown";
  processingStatus: StageStatus;
  syntheticLabelPresent: boolean;
};
```

`rawText` remains in the browser fixture and the server's canonical synthetic fixture manifest. It must not enter logs, exports by default, or the provider request. The server reconstructs approved `redactedText` from canonical fixture text and validated mask spans before calling the provider.

An instruction advisory is non-destructive. It cannot delete, hide, or alter a segment. `D07-P2-S03` is visible to the model as untrusted content for the containment test but is `evidence_only`, so it cannot support a case candidate or export statement.

## 7. Masking contracts

```ts
type MaskClass =
  | "person_name"
  | "email"
  | "phone"
  | "passport"
  | "bank_account"
  | "address"
  | "date_of_birth";

type MaskSuggestion = {
  id: string;
  segmentId: string;
  maskClass: MaskClass;
  originalStart: number;
  originalEnd: number;
  redactedStart: number;
  redactedEnd: number;
  replacementToken: string;
  detectionMethod: "deterministic_pattern" | "sensitive_term_list";
  reviewStatus: "pending" | "approved" | "edited" | "rejected";
};

type MaskingReview = {
  redactionMapVersion: "1.0.0";
  revision: number;
  reviewStatus: "pending" | "approved" | "invalidated";
  suggestions: MaskSuggestion[];
  declaredSupportedClasses: MaskClass[];
  reviewedBy: "current_practitioner" | "fixture_reviewer" | null;
  approvedAt?: string;
  leakScanStatus: "not_run" | "passed" | "failed";
  failedClasses: MaskClass[];
};
```

Provider transmission and every export require an approved masking review and a passed leak scan. Safe-share applies the stricter minimum-necessary selection as well.

When `leakScanStatus` is `passed`, `failedClasses` must be empty. A changed mask invalidates the review, increments masking revision and case revision, and stales any analysis run, export gate, or export that depended on the prior derivative.

## 8. Coverage contract

```ts
type CoverageIssue = {
  id: string;
  documentId: string;
  pageId?: string;
  kind:
    | "missing_page"
    | "unreadable_page"
    | "image_only_page"
    | "skipped_page"
    | "manually_excluded_page"
    | "extraction_failed"
    | "segment_mismatch";
  initialConsequence: "consequential" | "non_consequential" | "unknown";
  activeConsequence: "consequential" | "non_consequential" | "unknown";
  rationale: string;
  resolutionStatus: "open" | "reviewed_limitation" | "resolved";
  coverageReviewDecisionId: string | null;
};

type CoverageReviewDecision = {
  id: string;
  issueId: string;
  originalConsequence: CoverageIssue["initialConsequence"];
  reviewedConsequence: "consequential" | "non_consequential";
  limitationText: string;
  reason: string;
  actor: "current_practitioner" | "fixture_reviewer";
  createdAt: string;
};

type CoverageSummary = {
  expectedDocuments: number;
  processedDocuments: number;
  expectedPages: number;
  availablePages: number;
  issues: CoverageIssue[];
  hasConsequentialOpenIssue: boolean;
};
```

Coverage is a set of observable facts and issues. It is not a misleading completeness percentage. Before review, `activeConsequence` exactly equals `initialConsequence` and `coverageReviewDecisionId` is null. `hasConsequentialOpenIssue` is derived as true when any issue not deterministically `resolved` has active consequence `consequential`, or when an open issue has active consequence `unknown`. An unknown consequence therefore fails closed until a practitioner records a limitation through the one coverage-review command. A reviewed limitation with reviewed consequence `consequential` remains blocking; only a reviewed non-consequential limitation or deterministic source resolution can clear that path. A reviewed limitation retains its original and reviewed consequence, a linked immutable `CoverageReviewDecision`, and visible limitation text. It cannot be silently recast as resolved source content.

## 9. Citation and dependency contracts

```ts
type CitationValidationStatus =
  | "unvalidated"
  | "exact_match"
  | "manually_resolved"
  | "not_found"
  | "ambiguous_match"
  | "semantic_mismatch"
  | "source_unavailable"
  | "invalidated";

type CitationBase = {
  id: string;
  caseId: "CFN-DEMO-001";
  analysisRunId: string;
  documentId: string;
  pageNumber?: number;
  segmentId: string;
  quotedText: string;
  normalizedQuotedText: string;
  quoteForm: "approved_redacted_derivative";
  redactionMapVersion: "1.0.0";
  sourceLanguage: "en";
  translationStatus: SourceSegment["translationStatus"];
  extractionQuality: SourceSegment["extractionQuality"];
};

type Citation =
  | (CitationBase & {
      validationStatus: "exact_match";
      redactedSegmentRange: { start: number; end: number };
      sourceSegmentRange: { start: number; end: number };
      boundingBoxes: BoundingBox[];
      resolutionMethod: "exact_codepoint" | "normalized_unique_lookup";
      resolvedBy: "system";
      validatedAt: string;
    })
  | (CitationBase & {
      validationStatus: "manually_resolved";
      redactedSegmentRange: { start: number; end: number };
      sourceSegmentRange: { start: number; end: number };
      boundingBoxes: BoundingBox[];
      resolutionMethod: "manual_segment_selection";
      resolvedBy: "practitioner";
      validatedAt: string;
    })
  | (CitationBase & {
      validationStatus:
        | "unvalidated"
        | "not_found"
        | "ambiguous_match"
        | "semantic_mismatch"
        | "source_unavailable"
        | "invalidated";
      redactedSegmentRange: null;
      sourceSegmentRange: null;
      boundingBoxes: [];
      resolutionMethod: null;
      resolvedBy: null;
      validatedAt?: string;
    });

type CitationResolutionDecision = {
  id: string;
  caseId: string;
  analysisRunId: string;
  candidateId: string;
  citationId: string;
  previousValidationStatus: "ambiguous_match";
  selectedSegmentId: string;
  selectedRedactedSegmentRange: { start: number; end: number };
  resultingValidationStatus: "manually_resolved";
  resolutionMethod: "manual_segment_selection";
  actor: "current_practitioner";
  createdAt: string;
};

type DependencyRelationship = "supports" | "limits" | "contradicts" | "context_only";

type SourceEvidenceDependency = {
  id: string;
  kind: "source";
  sourceSegmentId: string;
  citationId: string;
  evidenceNature: EvidenceNature;
  relationship: DependencyRelationship;
  active: boolean;
};

type CandidateDependency = {
  id: string;
  kind: "candidate";
  candidateId: string;
  relationship: DependencyRelationship;
  active: boolean;
};

type NexusDependency = {
  id: string;
  kind: "nexus";
  nexusCandidateId: string;
  relationship: DependencyRelationship;
  active: boolean;
};

type EvidenceDependency =
  | SourceEvidenceDependency
  | CandidateDependency
  | NexusDependency;
```

Rules:

- The `kind` discriminator determines exactly one upstream entity type.
- A `CandidateDependency.candidateId` resolves only to a non-Nexus `CaseCandidate` whose canonical ID begins `CAND-`. A `NexusDependency.nexusCandidateId` resolves only to a `NexusRow` whose canonical ID begins `NEXUS-`. Cross-kind targeting is invalid, so the discriminator cannot ambiguously identify a Nexus row.
- A `NexusDependency.nexusCandidateId` resolves directly to the canonical `CandidateItem.id` of one `NexusRow`. No second Nexus identifier or mapping exists.
- An active source dependency that supports or contradicts a positive candidate requires an `exact_match` or `manually_resolved` citation.
- Manual resolution is a typed practitioner action, not a component-side status change. The selected range must be one of the pure resolver's recomputed ambiguous-match options in the citation's existing available, allowlisted, candidate-eligible segment.
- Every citation carries its case and analysis-run ownership directly. Candidate ownership is verified through the candidate's active source dependency for that citation ID.
- A reviewable ambiguity exists only when the document, page, and one canonical segment are known, available, allowlisted, and candidate-eligible, and `quotedText` has more than one bounded exact-codepoint occurrence inside that same segment. It returns the candidate with `supportStatus: citation_unresolved`, `reviewStatus: pending`, and an `ambiguous_match` citation whose ranges are null. The practitioner may resolve it only through `resolve_citation`.
- Ambiguity across segments, an unknown or unavailable source, a non-candidate-eligible segment, a result without a bounded within-segment option, or more than one normalized-only match is unsafe ambiguity. The proposal is quarantined as `AMBIGUOUS_QUOTE` and no candidate or citation enters case state.
- The reducer preserves the prior ambiguous state in `CitationResolutionDecision` and audit history, derives the updated redacted citation, recalculates affected support, and never upgrades evidence nature or review status.
- Citation resolution first attempts exact codepoint matching. Its only normalized fallback applies Unicode NFC, converts line endings, collapses whitespace, preserves case, punctuation, words, and numbers, and may produce `exact_match` only when the normalized lookup is unique. Multiple normalized-only matches are never manually reviewable.
- `ModelCandidateProposal.citations[].quotedText` is lookup input only. After validation, `Citation.quotedText` is the exact canonical slice from the approved redacted derivative at the resolved range that the provider was allowed to see.
- The deterministic redaction map converts its redacted range into an original source range for browser highlighting.
- The source drawer displays the exact source slice with approved masks applied by default. An intentional reveal may show the browser-local original for the synthetic fixture.
- A unique normalized lookup may locate a canonical range, but the validator stores and displays the exact canonical source slice at that range. It never stores a normalized string or presents a silently reconstructed model string as the source quote.
- A citation match proves text location only. It does not prove authenticity or truth.
- A model cannot create a source or segment ID that was absent from the server's canonical selected-segment allowlist.

## 10. Candidate contract

```ts
type CandidateKind =
  | "timeline_event"
  | "nexus_relationship"
  | "review_lane_item"
  | "context_gap"
  | "contradiction"
  | "entity"
  | "coverage_limitation"
  | "provenance_limitation";

type AssertionMode =
  | "positive_proposition"
  | "limitation"
  | "gap"
  | "unknown_state"
  | "neutral_procedural_fact";

type ReviewRequirement = "individual" | "derived_summary" | "optional";
type InclusionStatus = "active" | "withdrawn" | "superseded";

type CandidateItem = {
  id: string;
  revision: number;
  caseId: string;
  analysisRunId: string;
  kind: CandidateKind;
  lane?: ReviewLane;
  title: string;
  proposedText: string;
  currentText: string;
  currentTextOrigin: ItemOrigin;
  itemOrigin: ItemOrigin;
  assertionMode: AssertionMode;
  reviewRequirement: ReviewRequirement;
  inclusionStatus: InclusionStatus;
  supportStatus: SupportStatus;
  reviewStatus: ReviewStatus;
  dependencies: EvidenceDependency[];
  relatedCoverageIssueIds: string[];
  unknowns: string[];
  reviewQuestion: string;
  consequential: boolean;
  prohibitedConclusionCheck: "passed" | "failed";
  safeShareRecipientCategories: SafeShareRecipientCategory[];
  createdAt: string;
  invalidatedAt?: string;
  invalidationReason?: DependencyChangeReason;
};
```

Invariants:

- `itemOrigin` never changes after creation.
- Citation roles are derived from the discriminated source dependencies and cannot drift in parallel arrays.
- Human acceptance does not change the evidence nature of a dependency.
- `human_accepted` and `human_edited` require all required source citations to be exact or manually resolved, no unresolved consequential coverage issue and no open unknown-consequence issue inside that candidate's dependency closure, and `prohibitedConclusionCheck: "passed"`.
- An `insufficient_evidence` positive claim cannot be accepted as a finding. It can be accepted only as an explicit limitation or gap.
- Reviewer-authored context without a citation may be reviewed only with `reviewer_supplied_context`; it cannot independently produce `exact_source_supported`.
- A withdrawn candidate is a resolved exclusion, not permanently incomplete review. Only active candidates with `reviewRequirement: "individual"` can block review completion.
- A `derived_summary` is never a direct review target. `review_candidate` rejects every direct intent for it, derives its display and status only from the current upstream candidates, and appends no `ReviewDecision` for the summary itself.
- `unknowns` cannot be silently rewritten as negative evidence.
- Deterministic output validation rejects prohibited decision language, instruction propagation, and any attempt to use an `evidence_only` segment as candidate support.
- `safeShareRecipientCategories` is a frozen fixture-authored allowlist for minimum-necessary safe-share exports. Full practitioner handoff ignores it; safe-share readiness requires every selected candidate and required dependency candidate to include the Purpose Brief's `intendedRecipientCategory`.

## 11. Timeline contract

```ts
type TimelinePrecision = "day" | "date_range" | "approximate" | "conflicting" | "unknown";

type TimelineEvent = CandidateItem & {
  kind: "timeline_event";
  dateStart?: string;
  dateEnd?: string;
  datePrecision: TimelinePrecision;
  dateAlternatives: Array<{ start?: string; end?: string; label: string }>;
  locationLabel?: string;
  actorLabels: string[];
  conflictGroupId?: string;
};
```

An approximate date, date range, or conflict must remain visibly qualified. Sorting does not resolve a conflict.

## 12. Charge-Coercion Nexus contract

```ts
type NexusCategory =
  | "recruitment"
  | "movement"
  | "control"
  | "compelled_tasks"
  | "offence_timing"
  | "urgency";

type NexusRow = CandidateItem & {
  kind: "nexus_relationship";
  category: NexusCategory;
  requiredDependencyIds: string[];
  childCandidateIds: string[];
  relationshipSummary: string;
};
```

Golden P0 rows are exactly:

- `NEXUS-RECRUITMENT`
- `NEXUS-MOVEMENT`
- `NEXUS-CONTROL`
- `NEXUS-COMPELLED-TASKS`
- `NEXUS-OFFENCE-TIMING`
- `NEXUS-URGENCY`

Each value above is the row's canonical `CandidateItem.id`. It is also the only identifier accepted by `ReviewIntent.candidateId`, `ReviewDecision.candidateId`, selectors, exports, and `NexusDependency.nexusCandidateId` for that row.

The Nexus has no overall score, probability, victim-status conclusion, causal legal conclusion, or traffic-light rating.

`relationshipSummary` is exactly the current `currentText` projection for the row and cannot be independently edited. `requiredDependencyIds` is the unique, lexicographically sorted list of that row's active dependency IDs. `childCandidateIds` is the unique, lexicographically sorted list of resolved non-Nexus `CandidateDependency.candidateId` values. The assembler, review reducer, and dependency recalculator derive these three fields together after every material change, so no Nexus view can show stale parallel relationship content.

Golden review requirements are frozen:

- `NEXUS-CONTROL` and `NEXUS-URGENCY` use `derived_summary`.
- `NEXUS-COMPELLED-TASKS` and `NEXUS-OFFENCE-TIMING` use `individual`.
- `NEXUS-RECRUITMENT` and `NEXUS-MOVEMENT` use the requirement specified by the fixture manifest and cannot create a duplicate approval for already reviewed child candidates.

For a `derived_summary`, the assembler fixes `itemOrigin` and `currentTextOrigin` to `ai_suggestion`. No direct review intent or decision exists for that row. Its active required upstream rows determine its state exactly:

| Upstream condition, evaluated in this order | Derived review status | Derived support | Export eligible |
|---|---|---|---|
| Any required upstream is invalidated | Invalidated | Not processed | No |
| Any required active upstream is pending | Pending | Not processed | No |
| Any required upstream is rejected, uncertain, withdrawn, or lacks usable support | Uncertain | Insufficient evidence | No |
| All required active upstream rows are human accepted and exact-source supported | Human accepted | Exact-source supported | Yes, if all other export gates pass |
| All required active upstream rows are human accepted or human edited, at least one has partial support or a human edit, and none is conflicting or insufficient | Human edited | Partially supported | Yes, if all other export gates pass |
| All required active upstream rows are human accepted or human edited and at least one is conflicting | Uncertain | Conflicting | No |

The derived `currentText`, `relationshipSummary`, active dependencies, required dependency IDs, and child candidate IDs are rebuilt together from the sorted active upstream current text and IDs after every state transition. The generated text names only the qualifying support or limitation state and never upgrades an upstream qualifier, evidence nature, or review status. A prior eligible derived summary becomes invalidated before recalculation when any upstream material change occurs.

## 13. Context Gap contract

```ts
type ContextGap = CandidateItem & {
  kind: "context_gap";
} & (
    | {
        response: null;
        responseStatus: "unanswered" | "preserved_unknown";
        responseEvidenceNature: "unknown";
        responseExplanation: null;
      }
    | {
        response: string;
        responseStatus: "answered";
        responseEvidenceNature: "reviewer_supplied_context";
        responseExplanation: null;
      }
    | {
        response: null;
        responseStatus: "deferred" | "outside_scope";
        responseEvidenceNature: "unknown";
        responseExplanation: string;
      }
  );

type ContextGapResponseIntent =
  | {
      gapId: string;
      responseStatus: "answered";
      response: string;
      responseExplanation: null;
    }
  | {
      gapId: string;
      responseStatus: "preserved_unknown";
      response: null;
      responseExplanation: null;
    }
  | {
      gapId: string;
      responseStatus: "deferred" | "outside_scope";
      response: null;
      responseExplanation: string;
    };

type OtherCandidate = CandidateItem & {
  kind: Exclude<CandidateKind, "timeline_event" | "nexus_relationship" | "context_gap">;
};

type CaseCandidate = TimelineEvent | NexusRow | ContextGap | OtherCandidate;
```

An answered gap requires trimmed, length-limited reviewer-supplied text. Deferred and outside-scope states require a trimmed, length-limited explanatory reason. Preserved unknown carries no response text or explanation. `unanswered` is an initial state only and cannot be set through `respond_context_gap`. Every non-answered gap remains visible. The model must not infer the answer.

`CaseCandidate[]` is the only stored candidate collection. Timeline, Nexus, and context-gap views are read-only selectors filtered by the `kind` discriminator. They are never stored, persisted, reviewed, or invalidated in parallel arrays.

## 14. Review decision contract

```ts
type ReviewAction =
  | "accept"
  | "edit"
  | "reject"
  | "mark_uncertain"
  | "confirm_unknown"
  | "withdraw"
  | "accept_as_limitation";

type ReviewIntent =
  | {
      candidateId: string;
      action: "edit";
      editedText: string;
      reason: string;
    }
  | {
      candidateId: string;
      action: "reject" | "mark_uncertain";
      editedText?: never;
      reason: string;
    }
  | {
      candidateId: string;
      action: "accept_as_limitation";
      limitationText: string;
      editedText?: never;
      reason: string;
    }
  | {
      candidateId: string;
      action: "accept" | "confirm_unknown";
      editedText?: never;
      reason: null;
    };

type ReviewDecision = {
  id: string;
  caseId: string;
  analysisRunId: string;
  candidateId: string;
  candidateRevision: number;
  action: ReviewAction;
  previousStatus: ReviewStatus;
  resultingStatus: ReviewStatus;
  editedText: string | null;
  reason: string | null;
  actor: "current_practitioner" | "fixture_reviewer";
  reviewerRole: CasePurposeBrief["practitionerRole"];
  promptVersion: "1.0.0";
  rulesetVersion: "1.0.0";
  supersedesDecisionId: string | null;
  createdAt: string;
  dependencySnapshot: string[];
};
```

Rules:

- There is no bulk accept action.
- `ReviewIntent` is the only input to `review_candidate`. It contains the practitioner's candidate and non-withdraw action, but never trusts a caller to provide status transitions, revision, actor, time, dependency snapshot, or supersession.
- The reducer and review policy derive `candidateRevision`, `previousStatus`, `resultingStatus`, `actor`, `reviewerRole`, prompt and ruleset versions, `supersedesDecisionId`, `createdAt`, and `dependencySnapshot` before appending a `ReviewDecision`.
- `withdraw_candidate` is the only command input path for withdrawal. It may derive and append a `ReviewDecision` whose action is `withdraw`, but `review_candidate` cannot request that action.
- `edit`, `reject`, `mark_uncertain`, `withdraw`, and `accept_as_limitation` require a trimmed non-empty length-limited reason. `edit` requires trimmed non-empty length-limited changed text that differs from the current text. `accept_as_limitation` requires trimmed non-empty length-limited `limitationText` that differs from the current text. `ReviewDecision.editedText` is exactly that changed text for `edit`, exactly `limitationText` for `accept_as_limitation`, and null for every other action. `accept` and `confirm_unknown` use `reason: null`.
- `confirm_unknown` results in `human_accepted` only when `assertionMode` is `unknown_state`.
- `accept_as_limitation` results in `human_edited`, sets `currentText` to its explicit practitioner `limitationText`, and sets `currentTextOrigin` to `human_created`. It is valid for `limitation` or `gap`, and for an invalidated `positive_proposition` only when that item's current support is `insufficient_evidence` after a dependency recalculation. In the latter path the reducer changes `assertionMode` to `limitation` while preserving immutable `proposedText`, item origin, sources, and the prior review decision. A positive item may never be accepted without this explicit transition.
- `edit` preserves immutable `proposedText` and `itemOrigin`, updates `currentText`, and sets `currentTextOrigin` to `human_created`.
- A source-free human edit is labelled reviewer-authored interpretation.
- `withdraw` results in `invalidated` and triggers downstream recalculation.
- A changed upstream dependency invalidates affected downstream decisions even if they were previously accepted.
- A later decision references the prior decision through `supersedesDecisionId`; prior review records are retained while the same active successful run remains current, and safe audit records are never deleted.

Required transitions:

| From | Action or event | Result |
|---|---|---|
| Pending | Accept | Human accepted |
| Pending | Edit | Human edited |
| Pending | Reject | Rejected |
| Pending | Mark uncertain | Uncertain |
| Pending unknown-state | Confirm unknown | Human accepted as unknown |
| Pending limitation or gap | Record explicit limitation | Human edited as limitation |
| Invalidated positive proposition with insufficient evidence after dependency change | Record explicit limitation | Assertion mode becomes limitation and review becomes Human edited |
| Human accepted or Human edited | Withdraw | Invalidated and Withdrawn |
| Human accepted or Human edited | Material dependency change | Invalidated, still Active, renewed review required |
| Invalidated active item | Renewed accept, edit, reject, uncertain, or limitation action | Corresponding reviewed state |

## 15. Dependency transition contract

```ts
type DependencyChangeReason =
  | "source_rejected"
  | "source_withdrawn"
  | "source_replaced"
  | "source_unreadable"
  | "page_unavailable"
  | "citation_invalid"
  | "candidate_rejected"
  | "candidate_withdrawn"
  | "mask_invalidated"
  | "authority_excluded";

type DependencyImpact = {
  candidateId: string;
  previousSupportStatus: SupportStatus;
  resultingSupportStatus: SupportStatus;
  previousReviewStatus: ReviewStatus;
  resultingReviewStatus: ReviewStatus;
  previousInclusionStatus: InclusionStatus;
  resultingInclusionStatus: InclusionStatus;
  explanation: string;
};

type DependencyChange = {
  id: string;
  commandId: string;
  auditEventId: string;
  changedEntityId: string;
  reason: DependencyChangeReason;
  impacts: DependencyImpact[];
  preservedCandidateIds: string[];
  exportReadinessRevoked: boolean;
  createdAt: string;
};
```

The graph must reject cycles. Recalculation is deterministic and limited to reachable downstream nodes. Every material dependency transition appends one `DependencyChange` linked to its initiating command and safe audit event. The active-run ledger is append-only while that run remains current, is persisted for refresh, and drives the main-workspace before-and-after panel. Activating a new run clears that current ledger and preserves the safe audit trail. The `CAND-TASK-0402` transition table in `docs/DEMO_AND_FIXTURES.md` is normative.

## 16. Analysis API contracts

### 16.1 Availability and disclosure projection

`GET /api/analyze` returns only safe registry metadata. It does not test a provider by sending case content.

```ts
type GloballyDisabledLiveProviderOption<
  R extends LiveProviderReleaseConfiguration,
> = ProviderOptionProjection<R> & {
  availabilityStatus: "disabled";
  selectable: false;
};

type EnabledAvailabilityOptions = [
  ProviderOptionProjection<Extract<LiveProviderReleaseConfiguration, { providerId: "openai" }>>,
  ProviderOptionProjection<Extract<LiveProviderReleaseConfiguration, { providerId: "google_gemini" }>>,
  ProviderOptionProjection<Extract<LiveProviderReleaseConfiguration, { providerId: "mistral" }>>,
  ProviderOptionProjection<ReplayReleaseConfiguration>,
];

type GloballyDisabledAvailabilityOptions = [
  GloballyDisabledLiveProviderOption<Extract<LiveProviderReleaseConfiguration, { providerId: "openai" }>>,
  GloballyDisabledLiveProviderOption<Extract<LiveProviderReleaseConfiguration, { providerId: "google_gemini" }>>,
  GloballyDisabledLiveProviderOption<Extract<LiveProviderReleaseConfiguration, { providerId: "mistral" }>>,
  ProviderOptionProjection<ReplayReleaseConfiguration>,
];

type AnalyzeAvailabilityResponse =
  | {
      schemaVersion: "1.0.0";
      liveAnalysisEnabled: true;
      replayEnabled: true;
      options: EnabledAvailabilityOptions;
    }
  | {
      schemaVersion: "1.0.0";
      liveAnalysisEnabled: false;
      replayEnabled: true;
      options: GloballyDisabledAvailabilityOptions;
    };
```

The server derives `liveAnalysisEnabled` from the server-side global release setting only. When it is false, every live option is structurally `disabled` and non-selectable, regardless of its per-release admission record or any client-visible setting. When it is true, each live option derives its own safe availability and selectability from the static registry. A live option is selectable only when its exact release configuration has passed reviewed static admission, is enabled, is configured, permits the active data origin, and has a current disclosure. Local replay remains enabled for the bundled synthetic demo in both response branches, has `evaluationStatus: not_applicable`, and is selectable only through its fixed trusted-bundle registry, exact replay, fixture, prompt, response-contract, disclosure, and version checks. A configured credential does not prove provider health or remaining quota.

### 16.2 Request

```ts
type AnalyzeMaskApproval = {
  maskId: string;
  segmentId: string;
  originalStart: number;
  originalEnd: number;
  maskClass: MaskClass;
  replacementToken: string;
  reviewStatus: "approved" | "edited" | "rejected";
};

type AnalyzeLiveProviderSelection =
  ProviderReleaseSelection<LiveProviderReleaseConfiguration>;

type AnalyzeRequest<
  R extends LiveProviderReleaseConfiguration = LiveProviderReleaseConfiguration,
> = R extends LiveProviderReleaseConfiguration ? {
  schemaVersion: "1.0.0";
  caseId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  canonicalFixtureDigest: string;
  purposeBriefId: string;
  purposeContext: {
    practitionerRole: CasePurposeBrief["practitionerRole"];
    jurisdictionCode: CasePurposeBrief["jurisdictionCode"];
    sourceLanguage: "en";
    requestedExport: CasePurposeBrief["requestedExport"];
  };
  maskReviewApproved: true;
  leakScanStatus: "passed";
  requestedMode: "live";
  providerSelection: ProviderReleaseSelection<R>;
  providerDisclosureAcknowledgement: ProviderDisclosureAcknowledgement<R>;
  selectedSegmentIds: string[];
  maskApprovals: AnalyzeMaskApproval[];
} : never;

type LiveEvaluationSpendApproval = {
  schemaVersion: "1.0.0";
  id: string;
  release: AnalyzeLiveProviderSelection;
  approvedBy: "current_practitioner";
  approvedAt: string;
  expiresAt: string;
  approvedCallCount: number;
  totalEstimatedCostUsdMicros: number;
};

type PrivateLiveEvaluationRequest = {
  schemaVersion: "1.0.0";
  approval: LiveEvaluationSpendApproval;
  callOrdinal: number;
  evaluationPurpose: {
    id: "PURPOSE-EVALUATION-CFN-DEMO-001";
    dataOrigin: "bundled_synthetic";
    statedPurpose: "frozen_synthetic_provider_evaluation";
  };
  release: AnalyzeLiveProviderSelection;
  caseId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  canonicalFixtureDigest: string;
  evaluationInputPacketId: string;
  evaluationInputPacketDigest: string;
  selectedSegmentIds: string[];
  approvedRedactedInputDigest: string;
  maskApprovals: AnalyzeMaskApproval[];
  promptVersion: "1.0.0";
  responseSchemaVersion: "1.0.0";
  rulesetVersion: "1.0.0";
  evaluationVariantId: EvaluationVariantId;
  repetition: 1 | 2 | 3;
};

type PrivateLiveEvaluationResult = {
  schemaVersion: "1.0.0";
  source: "private_evaluation";
  admissionMutation: false;
  publicSelectabilityMutation: false;
  terminalResponse: Extract<AnalyzeResponse, { outcome: "succeeded" | "failed" }>;
};

type PrivateLiveEvaluationEntry = (
  request: PrivateLiveEvaluationRequest,
) => Promise<PrivateLiveEvaluationResult>;
```

Server invariants:

- Reject any extra root field, raw file, raw-text field, direct identifier, unexpected URL field, or structural tool-instruction field.
- Instruction-like, HTML-like, and URL-like strings inside the canonical fixture remain inert untrusted evidence. They are not rejected merely for resembling code or instructions.
- Reject an unknown case, fixture, document, segment, or contract version.
- The central browser reducer, before transport, verifies the active complete Purpose Brief, authority and synthetic acknowledgements, prohibited-decision exclusions, current selection, and matching disclosure acknowledgement. The stateless public route has no case database or signed Purpose Brief and therefore validates only a non-empty purpose ID and the allowlisted purpose-context shape, matching complete correlated disclosure acknowledgement, and mask approvals. The acknowledgement must carry the same provider, release configuration, service tier, disclosure version, and true attestations as the selected release. The private evaluation entry instead requires its exact frozen synthetic evaluation-purpose context and approved mask inputs.
- The public `POST /api/analyze` route rejects an unknown, disabled, unavailable, unevaluated, or mismatched provider release before provider transmission.
- Reject a release when its exact service tier is unavailable, even if the provider and model are otherwise configured.
- Reject a provider selection whose current disclosure was not acknowledged for the exact provider, release configuration, service tier, and disclosure version.
- Reject a request above the configured segment or byte limit.
- Load canonical text by allowlisted segment ID, require an exact match to the selected registry entry's single bundled-fixture binding and canonical digest, validate mask spans and allowlisted replacement tokens, and construct the redacted derivative server-side.
- Re-run a deterministic declared-identifier leak scan server-side.
- Do not trust client-supplied evidence classification or support status as final.
- Current pre-TASK-040 runtime calls exactly the legacy selected release once. TASK-040 must replace this invariant only after contract versioning with bounded admitted server routing; no route ever enters replay or merges outputs.

`runPrivateLiveEvaluation` is the sole implementation of `PrivateLiveEvaluationEntry`. It is server-only and has no HTTP route, client export, or runtime-admission import. The local evaluation runner, not this stateless entry, tracks one unique `callOrdinal` for each approved call and rejects a duplicate or ordinal outside `1` through `approvedCallCount`. The entry validates that approval is unexpired, matches the exact correlated release, includes a positive approved call count and non-negative total estimated cost, and receives one permitted ordinal. It may bypass only the public route's static evaluation-status and public-selectability check so it can measure the frozen candidate before admission. It still requires the exact known, enabled, configured release, Mistral account-availability gate where applicable, bundled synthetic fixture and digest, approved mask spans, leak scan, selected segments, prompt, schema, and full post-validation. It reconstructs the approved derivative from canonical fixture text and mask spans, verifies selected segments and digest, then uses the exact adapter, prompt, response schema, and post-validation path. It accepts no raw text, API key, endpoint, model override, provider body, or admission record. It writes evidence only and is structurally unable to mutate admission, registry selectability, public availability, browser state, or a case export.

### 16.3 Model proposal

The provider-specific schema is narrower than the application schema.

```ts
type ModelCandidateProposal = {
  proposedId: string;
  kind: CandidateKind;
  lane?: ReviewLane;
  title: string;
  proposedText: string;
  assertionMode: AssertionMode;
  reviewQuestion: string;
  citations: Array<{
    segmentId: string;
    quotedText: string;
    relationship: DependencyRelationship;
    evidenceNature: EvidenceNature;
  }>;
  unknowns: string[];
};

type ModelAnalysisProposal = {
  candidates: ModelCandidateProposal[];
};
```

The model does not set final `supportStatus`, `reviewStatus`, citation validity, consequential status, export readiness, legal conclusions, or audit records. Deterministic application code derives them from fixture and ruleset inputs.

### 16.4 Response

```ts
type AnalysisProviderProvenance<
  R extends ProviderReleaseConfiguration = ProviderReleaseConfiguration,
> = R extends ProviderReleaseConfiguration
  ? R & {
      adapterVersion: string;
      returnedModel: string | null;
      inferenceSetting: ProviderReleaseInferenceSetting<R>;
      disclosureVersion: "1.0.0";
      providerTransmission: R extends ReplayReleaseConfiguration ? false : true;
    }
  : never;

type StartedLiveFailureClassification =
  | "provider_authentication_failed"
  | "provider_service_tier_unavailable"
  | "provider_quota_exhausted"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_unavailable"
  | "provider_refusal"
  | "invalid_structured_response"
  | "citation_validation_failed"
  | "prohibited_output"
  | "safety_validation_failed"
  | "internal_safe_failure";

type AnalysisRecoveryMetadata = {
  recoveryOfRunId: string | null;
  selectionReason:
    | "initial_choice"
    | "retry_same_provider"
    | "explicit_provider_switch"
    | "explicit_deterministic_replay";
  selectedBy: "practitioner";
  automaticFailover: false;
  outputsMerged: false;
};

type LiveAnalysisRecoveryMetadata =
  | (Omit<AnalysisRecoveryMetadata, "selectionReason" | "recoveryOfRunId"> & {
      selectionReason: "initial_choice";
      recoveryOfRunId: null;
    })
  | (Omit<AnalysisRecoveryMetadata, "selectionReason" | "recoveryOfRunId"> & {
      selectionReason: "retry_same_provider" | "explicit_provider_switch";
      recoveryOfRunId: string;
    });

type ReplayAnalysisRecoveryMetadata = Omit<
  AnalysisRecoveryMetadata,
  "selectionReason"
> & {
  selectionReason: "explicit_deterministic_replay";
};

type AnalysisFailure =
  | {
      classification: "provider_authentication_failed";
      safeErrorCode: "PROVIDER_AUTHENTICATION_FAILED";
      retryableSameProvider: false;
      alternateProviderRecoveryAllowed: true;
      replayRecoveryAllowed: true;
    }
  | {
      classification: "provider_service_tier_unavailable";
      safeErrorCode: "PROVIDER_SERVICE_TIER_UNAVAILABLE";
      retryableSameProvider: false;
      alternateProviderRecoveryAllowed: true;
      replayRecoveryAllowed: true;
    }
  | {
      classification: "provider_quota_exhausted";
      safeErrorCode: "PROVIDER_QUOTA_EXHAUSTED";
      retryableSameProvider: true;
      alternateProviderRecoveryAllowed: true;
      replayRecoveryAllowed: true;
    }
  | {
      classification: "provider_rate_limited";
      safeErrorCode: "PROVIDER_RATE_LIMITED";
      retryableSameProvider: true;
      alternateProviderRecoveryAllowed: true;
      replayRecoveryAllowed: true;
    }
  | {
      classification: "provider_timeout";
      safeErrorCode: "PROVIDER_TIMEOUT";
      retryableSameProvider: true;
      alternateProviderRecoveryAllowed: true;
      replayRecoveryAllowed: true;
    }
  | {
      classification: "provider_unavailable";
      safeErrorCode: "PROVIDER_UNAVAILABLE";
      retryableSameProvider: true;
      alternateProviderRecoveryAllowed: true;
      replayRecoveryAllowed: true;
    }
  | {
      classification: "provider_refusal";
      safeErrorCode: "PROVIDER_REFUSAL";
      retryableSameProvider: false;
      alternateProviderRecoveryAllowed: false;
      replayRecoveryAllowed: false;
    }
  | {
      classification: "invalid_structured_response";
      safeErrorCode: "INVALID_STRUCTURED_RESPONSE";
      retryableSameProvider: false;
      alternateProviderRecoveryAllowed: false;
      replayRecoveryAllowed: false;
    }
  | {
      classification: "citation_validation_failed";
      safeErrorCode: "CITATION_VALIDATION_FAILED";
      retryableSameProvider: false;
      alternateProviderRecoveryAllowed: false;
      replayRecoveryAllowed: false;
    }
  | {
      classification: "prohibited_output";
      safeErrorCode: "PROHIBITED_OUTPUT";
      retryableSameProvider: false;
      alternateProviderRecoveryAllowed: false;
      replayRecoveryAllowed: false;
    }
  | {
      classification: "safety_validation_failed";
      safeErrorCode: "SAFETY_VALIDATION_FAILED";
      retryableSameProvider: false;
      alternateProviderRecoveryAllowed: false;
      replayRecoveryAllowed: false;
    }
  | {
      classification: "internal_safe_failure";
      safeErrorCode: "INTERNAL_SAFE_FAILURE";
      retryableSameProvider: false;
      alternateProviderRecoveryAllowed: false;
      replayRecoveryAllowed: false;
    };

type AnalysisExecutionBase = {
  id: string;
  mode: AnalysisMode;
  provider: AnalysisProviderProvenance;
  promptVersion: "1.0.0";
  requestSchemaVersion: "1.0.0";
  responseSchemaVersion: "1.0.0";
  fixtureVersion: "1.0.0";
  rulesetVersion: "1.0.0";
  checkpointProvenance: {
    checkpointId: "DEMO-CHECKPOINT-REVIEW";
    checkpointVersion: "1.0.0";
    replayVersion: "1.0.0";
  } | null;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  inputSegmentCount: number;
  candidateCount: number;
  citationCount: number;
  quarantinedCount: number;
  tokenUsage?: { input: number; output: number; total: number };
};

type AnalysisExecutionResult =
  | (AnalysisExecutionBase & {
      status: "succeeded";
      failure: null;
    })
  | (AnalysisExecutionBase & {
      status: "failed";
      candidateCount: 0;
      citationCount: 0;
      quarantinedCount: 0;
      failure: AnalysisFailure;
    });

type LiveAnalysisExecutionResult =
  | (Extract<AnalysisExecutionResult, { status: "succeeded" }> & {
      mode: "live";
      checkpointProvenance: null;
      provider: AnalysisProviderProvenance<LiveProviderReleaseConfiguration>;
    })
  | (Extract<AnalysisExecutionResult, { status: "failed" }> & {
      mode: "live";
      checkpointProvenance: null;
      provider: AnalysisProviderProvenance<LiveProviderReleaseConfiguration>;
    });

type RunInputStateProvenance = {
  sourceCaseRevision: number;
  canonicalFixtureDigest: string;
  purposeBriefId: string;
  purposeBriefRevision: number;
  maskingRevision: number;
  selectedSegmentIds: string[];
  approvedRedactedInputDigest: string;
};

type LiveAnalysisRun = LiveAnalysisExecutionResult & {
  recovery: LiveAnalysisRecoveryMetadata;
  inputState: RunInputStateProvenance;
};

type LocalReplayAnalysisRun = Extract<
  AnalysisExecutionResult,
  { status: "succeeded" }
> & {
  mode: "deterministic_replay";
  provider: AnalysisProviderProvenance<ReplayReleaseConfiguration>;
  quarantinedCount: 0;
  recovery: ReplayAnalysisRecoveryMetadata;
  inputState: RunInputStateProvenance;
};

type AnalysisRun = LiveAnalysisRun | LocalReplayAnalysisRun;

type FailedAnalyzeResponse<
  R extends Extract<LiveAnalysisExecutionResult, { status: "failed" }> = Extract<
    LiveAnalysisExecutionResult,
    { status: "failed" }
  >,
> = R extends Extract<LiveAnalysisExecutionResult, { status: "failed" }>
  ? {
      schemaVersion: "1.0.0";
      outcome: "failed";
      run: R;
      candidates: [];
      citations: [];
      quarantined: [];
      error: StartedLiveApiError<R["failure"]> & {
        failedRunId: R["id"];
        providerContext: ProviderReleaseSelection<
          Extract<R["provider"], LiveProviderReleaseConfiguration>
        >;
      };
    }
  : never;

type AnalyzeResponse =
  | {
      schemaVersion: "1.0.0";
      outcome: "succeeded";
      run: Extract<LiveAnalysisExecutionResult, { status: "succeeded" }>;
      candidates: CaseCandidate[];
      citations: Citation[];
      quarantined: QuarantinedProposal[];
    }
  | FailedAnalyzeResponse
  | {
      schemaVersion: "1.0.0";
      outcome: "rejected_before_run";
      run: null;
      candidates: [];
      citations: [];
      quarantined: [];
      error: PreflightApiError;
    };
```

A preflight rejection occurs before a valid execution exists and returns `run: null`. It may use only `PreflightRejectionSafeErrorCode`; timeout, rate-limit, quota, authentication, refusal, client-transport, structured-response, citation, prohibited-output, and semantic-safety codes require a started or browser-side outcome and are rejected in this branch. Once execution starts, failed analysis is unrepresentable with partial candidates or citations. A failed response derives its error from that exact `run.failure`: code, classification, same-provider retryability, recovery options, `failedRunId`, and provider and release selection must match the one returned failed run. The route rejects any mismatch before returning the terminal response. Before the browser reducer accepts a successful response, `run.candidateCount`, `run.citationCount`, and `run.quarantinedCount` must exactly equal the corresponding response-array lengths; every candidate and citation must have the returned case and run IDs; every candidate source dependency must resolve to one returned citation; and every returned citation must be referenced by at least one returned candidate. A mismatch rejects the complete terminal response without appending a run. The stateless route never receives, verifies, echoes, or logs a recovery link.

The browser reducer validates recovery against its append-only local failed-run history, then promotes a terminal `LiveAnalysisExecutionResult` with `LiveAnalysisRecoveryMetadata` or a replay activation with `ReplayAnalysisRecoveryMetadata`. A recovery creates a separate local run, retains the prior run, and never merges proposals or reviewed outputs across runs.

### 16.5 Replay and prepared checkpoint

Replay is a local fixture adapter, not a request to `POST /api/analyze`.

```ts
type ReplayBundleId = "REPLAY-CFN-DEMO-001-V1";
type DemoCheckpointBundleId = "DEMO-CHECKPOINT-REVIEW";

type ReplayRequest = {
  mode: "deterministic_replay";
  replayBundleId: ReplayBundleId;
  caseId: "CFN-DEMO-001";
  releaseConfigurationId: "prepared-replay-v1";
  providerDisclosureAcknowledgementId: string;
  recoveryOfRunId: string | null;
  fixtureVersion: "1.0.0";
  promptVersion: "1.0.0";
  analysisResponseVersion: "1.0.0";
  replayVersion: "1.0.0";
};

type SuccessfulLocalReplayRun = Omit<
  LocalReplayAnalysisRun,
  "inputState"
> & {
  inputState?: never;
};

type BundledReplayCounts = {
  analysisRunCount: 1;
  candidateCount: number;
  citationCount: number;
  seededDecisionCount: number;
};

type ApprovedRedactedInputDigestProjection = {
  schemaVersion: "1.0.0";
  caseId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  redactionMapVersion: "1.0.0";
  segments: Array<{
    segmentId: string;
    redactedText: string;
    effectiveMasks: Array<{
      maskId: string;
      maskClass: MaskClass;
      originalStart: number;
      originalEnd: number;
      replacementToken: string;
    }>;
  }>;
};

type DemoCheckpointCounts = BundledReplayCounts & {
  documentCount: number;
  segmentCount: number;
  processingStageCount: number;
  coverageReviewCount: 0;
};

type CheckpointPostDecisionHashProjection = {
  schemaVersion: "1.0.0";
  checkpointId: DemoCheckpointBundleId;
  candidateOutcomes: Array<{
    id: string;
    revision: number;
    kind: CandidateKind;
    lane: ReviewLane | null;
    title: string;
    proposedText: string;
    currentText: string;
    currentTextOrigin: ItemOrigin;
    itemOrigin: ItemOrigin;
    assertionMode: AssertionMode;
    reviewRequirement: ReviewRequirement;
    supportStatus: SupportStatus;
    reviewStatus: ReviewStatus;
    inclusionStatus: InclusionStatus;
    relatedCoverageIssueIds: string[];
    unknowns: string[];
    reviewQuestion: string;
    consequential: boolean;
    prohibitedConclusionCheck: "passed" | "failed";
    invalidationReason: DependencyChangeReason | null;
    timelineOutcome: {
      dateStart: string | null;
      dateEnd: string | null;
      datePrecision: TimelinePrecision;
      dateAlternatives: Array<{ start: string | null; end: string | null; label: string }>;
      locationLabel: string | null;
      actorLabels: string[];
      conflictGroupId: string | null;
    } | null;
    nexusOutcome: {
      category: NexusCategory;
      requiredDependencyIds: string[];
      childCandidateIds: string[];
      relationshipSummary: string;
    } | null;
    contextGapOutcome: {
      response: string | null;
      responseStatus: ContextGap["responseStatus"];
      responseEvidenceNature: ContextGap["responseEvidenceNature"];
      responseExplanation: string | null;
    } | null;
    dependencyOutcomes: Array<
      | {
          id: string;
          kind: "source";
          sourceSegmentId: string;
          citationId: string;
          evidenceNature: EvidenceNature;
          relationship: DependencyRelationship;
          active: boolean;
        }
      | {
          id: string;
          kind: "candidate";
          candidateId: string;
          relationship: DependencyRelationship;
          active: boolean;
        }
      | {
          id: string;
          kind: "nexus";
          nexusCandidateId: string;
          relationship: DependencyRelationship;
          active: boolean;
        }
    >;
  }>;
  citationOutcomes: Array<{
    id: string;
    documentId: string;
    pageNumber: number | null;
    segmentId: string;
    quotedText: string;
    normalizedQuotedText: string;
    quoteForm: "approved_redacted_derivative";
    redactionMapVersion: "1.0.0";
    sourceLanguage: "en";
    translationStatus: SourceSegment["translationStatus"];
    extractionQuality: SourceSegment["extractionQuality"];
    validationStatus: CitationValidationStatus;
    redactedSegmentRange: { start: number; end: number } | null;
    sourceSegmentRange: { start: number; end: number } | null;
    boundingBoxes: BoundingBox[];
    resolutionMethod: Citation["resolutionMethod"];
    resolvedBy: "system" | "practitioner" | null;
  }>;
  appliedSeededDecisionOutcomes: Array<{
    ordinal: number;
    id: string;
    candidateId: string;
    candidateRevision: number;
    action: ReviewAction;
    previousStatus: ReviewStatus;
    resultingStatus: ReviewStatus;
    editedText: string | null;
    reason: string | null;
    actor: "fixture_reviewer";
    reviewerRole: CasePurposeBrief["practitionerRole"];
    promptVersion: "1.0.0";
    rulesetVersion: "1.0.0";
    supersedesDecisionId: string | null;
    dependencySnapshot: string[];
  }>;
};

type ReplayBundle = {
  schemaVersion: "1.0.0";
  bundleKind: "deterministic_replay";
  id: ReplayBundleId;
  bundleVersion: "1.0.0";
  caseId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  canonicalFixtureDigest: string;
  selectedSegmentIds: string[];
  approvedRedactedInputDigest: string;
  promptVersion: "1.0.0";
  analysisResponseVersion: "1.0.0";
  replayVersion: "1.0.0";
  releaseConfigurationId: "prepared-replay-v1";
  replayRun: SuccessfulLocalReplayRun & { checkpointProvenance: null };
  candidates: CaseCandidate[];
  citations: Citation[];
  seededDecisions: [];
  counts: BundledReplayCounts & { seededDecisionCount: 0 };
  providerTransmission: false;
  notModelOutput: true;
};

type DemoCheckpointBundle = {
  schemaVersion: "1.0.0";
  bundleKind: "demo_checkpoint";
  id: DemoCheckpointBundleId;
  bundleVersion: "1.0.0";
  checkpointVersion: "1.0.0";
  replayVersion: "1.0.0";
  promptVersion: "1.0.0";
  analysisResponseVersion: "1.0.0";
  caseId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  canonicalFixtureDigest: string;
  selectedSegmentIds: string[];
  approvedRedactedInputDigest: string;
  purposeBrief: CasePurposeBrief;
  documents: DocumentRecord[];
  segments: SourceSegment[];
  masking: MaskingReview;
  coverage: CoverageSummary;
  coverageReviews: [];
  processing: ProcessingStage[];
  visibleLabel: "Prepared synthetic review checkpoint";
  replayVisibleLabel: "Bundled deterministic replay, not live AI";
  replayRun: SuccessfulLocalReplayRun & {
    checkpointProvenance: {
      checkpointId: "DEMO-CHECKPOINT-REVIEW";
      checkpointVersion: "1.0.0";
      replayVersion: "1.0.0";
    };
  };
  replayReleaseConfigurationId: "prepared-replay-v1";
  candidates: CaseCandidate[];
  citations: Citation[];
  seededDecisions: ReviewDecision[];
  counts: DemoCheckpointCounts;
  postDecisionHashProjectionVersion: "1.0.0";
  expectedPostDecisionStateHash: string;
  providerTransmission: false;
  notModelOutput: true;
  seededDecisionActor: "fixture_reviewer";
  seededDecisionIds: string[];
};

type DemoCheckpoint = DemoCheckpointBundle;

type TrustedBundleActivationContext = {
  internallyGeneratedRunId: string;
  recovery: ReplayAnalysisRecoveryMetadata;
  activatedAt: string;
};

type TrustedBundledArtifactRegistry = Readonly<{
  "REPLAY-CFN-DEMO-001-V1": {
    kind: "deterministic_replay";
    resolve: (context: TrustedBundleActivationContext) => ReplayBundle;
  };
  "DEMO-CHECKPOINT-REVIEW": {
    kind: "demo_checkpoint";
    resolve: (context: TrustedBundleActivationContext) => DemoCheckpointBundle;
  };
}>;
```

`TrustedBundledArtifactRegistry` is compile-time application code. It cannot be populated or overridden by browser data, session storage, an environment value, a URL, a fetched file, or provider output. A command supplies only a trusted bundle ID and the narrow scalar request metadata defined above. After validating any recovery link, the reducer creates an internal activation context and asks the matching registry entry to instantiate the versioned bundle. The registry binds its frozen source data to one internally generated run ID across the run, candidates, citations, and checkpoint decisions.

Every resolved bundle must pass all of these checks before any state mutation:

- It contains exactly one successful `replayRun`, uses `deterministic_replay`, `local_replay`, `prepared-replay-v1`, `frozen_replay_output`, local service tier, and `providerTransmission: false`. Because neither bundle carries a quarantined-proposal array, `replayRun.quarantinedCount` must be exactly `0`.
- The activation context's run ID is fresh in `CaseState.analysisRuns`; `replayRun.id` equals that ID; `replayRun.recovery` exactly equals the browser-derived, locally validated activation recovery metadata; and activation derives the final `LocalReplayAnalysisRun.inputState` from the current validated purpose, masking, ordered selected segments, and recomputed redacted-input digest. Prepared bundles never carry a browser case revision or a final input-state provenance object.
- Its case ID, canonical fixture digest, fixture, prompt, analysis-response, replay, and bundle versions exactly match the active case and request. A checkpoint also matches checkpoint version `1.0.0` and exact checkpoint provenance.
- `selectedSegmentIds` is non-empty, ordered, and unique; every selected segment is a known model-visible fixture segment; and its length equals `replayRun.inputSegmentCount`. The ordered IDs and exact approved redacted derivatives recompute the bundle's `approvedRedactedInputDigest` before activation.
- `approvedRedactedInputDigest` is the lowercase 64-character SHA-256 hexadecimal digest of the UTF-8 canonical JSON encoding of `ApprovedRedactedInputDigestProjection` version `1.0.0`. Projection segments preserve `selectedSegmentIds` order. Within each segment, only effective `approved` or `edited` masks are included and they are sorted by `originalStart`, `originalEnd`, then `maskId`. Canonical JSON recursively sorts object keys by Unicode codepoint, preserves array order, contains no `undefined`, and preserves exact serialized strings, numbers, booleans, and nulls.
- Before hashing, every selected redacted derivative is recomputed from the canonical raw fixture segment and the effective non-overlapping masks. The recomputed text must exactly equal the stored `redactedText`. Every bundled citation is then re-run through the canonical citation resolver against that exact derivative and its deterministic original-range map. Its encoded validation status, segment identity, quote, redacted range, source range, and resolution method must equal the recomputed outcome. A derivative, mask, citation, or range mismatch rejects the complete bundle.
- `counts.analysisRunCount` is exactly `1`; the run's `candidateCount`, `counts.candidateCount`, and `candidates.length` are equal; `counts.citationCount` equals `citations.length`; and `counts.seededDecisionCount` equals `seededDecisions.length`.
- A checkpoint has `counts.coverageReviewCount: 0`, `coverageReviews: []`, and every checkpoint coverage issue has `coverageReviewDecisionId: null` with active consequence equal to initial consequence. Any coverage-review record or linkage rejects the bundle before activation.
- Candidate, citation, review-decision, dependency, and resolution IDs are unique where their contracts require uniqueness. Every candidate and citation has the bundle case ID and the single replay-run ID. Every seeded decision targets an included candidate at its exact revision and has that same case and run ID.
- Every candidate source dependency resolves to an included citation with the same run ownership. Every included citation is referenced by at least one included candidate. Candidate and Nexus dependencies resolve only to included records from that same run.
- An ordinary `ReplayBundle` has no seeded decisions and null checkpoint provenance. A `DemoCheckpointBundle` carries pre-decision replay candidates, attributes every seeded decision to `fixture_reviewer`, contains the same decision IDs in the same order as `seededDecisionIds`, and has no current-practitioner decision. Applying the decisions once in array order must produce the declared `expectedPostDecisionStateHash`; a revision, transition, supersession, ordering, or hash mismatch rejects the bundle.
- The checkpoint state hash is the lowercase 64-character SHA-256 hexadecimal digest of the UTF-8 canonical JSON encoding of `CheckpointPostDecisionHashProjection` version `1.0.0`. Candidate outcomes are sorted by candidate ID; nested candidate ID lists, coverage IDs, unknowns, actor labels, and dependency snapshots are sorted lexicographically; each dependency outcome is sorted by dependency ID; citation outcomes are sorted by citation ID; bounding boxes preserve canonical source order; and seeded-decision outcomes preserve application order with one-based consecutive `ordinal` values. Optional candidate and timeline fields normalize to explicit `null`. Every candidate field that affects review, support, inclusion, export, dependency, coverage, or branch meaning is included, including all stable timeline and Nexus fields. Every dependency includes its discriminator-specific stable target, and every source dependency includes its citation ID and evidence nature. Every citation includes its stable document, page, segment, quote, source-quality, range, bounding-box, resolution, and resolver fields. Every seeded decision includes all stable decision provenance and payload fields except its dynamic creation time. Canonical JSON recursively sorts object keys by Unicode codepoint, preserves these normalized array orders, contains no `undefined`, and preserves exact serialized strings, numbers, booleans, and nulls. The projection excludes only analysis-run IDs, case revision, activation time, `invalidatedAt`, review creation time, audit IDs, audit sequence, and audit timestamps. Those values are activation or explanatory-record metadata; no other checkpoint outcome field is excluded.
- A checkpoint activation has `recoveryOfRunId: null`, `selectionReason: explicit_deterministic_replay`, practitioner selection, no automatic failover, and no output merging. Checkpoint loading cannot claim to recover a live failure because its command carries no recovery field.
- A checkpoint's `purposeBrief` is complete, active, bound to the checkpoint case, selects and acknowledges `local_replay` with `prepared-replay-v1` and disclosure version `1.0.0`, contains every required exclusion and acknowledgement, and is attributed only through trusted fixture state. Its masking review is approved by `fixture_reviewer`, has a passed leak scan, no failed class, and no pending, rejected, or unreviewed required mask.
- A checkpoint contains the exact fixture documents and canonical segments for its recorded digest. Its document, segment, and processing counts match their arrays; coverage recomputes exactly from those documents and pages; and every required processing stage needed to enter Review is completed with no failed or active stage. No checkpoint field may refer to an unknown document, page, segment, mask, purpose, case, fixture, or run.
- No candidate, citation, review, gate, export, or dependency from the previously active run is copied into the resolved bundle or retained as current output after activation.

`run_deterministic_replay` resolves only `ReplayRequest.replayBundleId`. It validates the current practitioner purpose, provider acknowledgement, approved masking review, passed leak scan, active fixture digest, exact selected-segment list, exact approved-redacted-input digest, citation outcomes, and any replay recovery against the current preserved failed run and its `replayRecoveryAllowed` flag. The digest is recomputed from current approved browser state and canonical fixture text, never accepted as a request assertion. It derives `explicit_deterministic_replay` recovery metadata, resolves the trusted bundle locally, appends exactly its one run, and activates exactly its candidates and citations. An ordinary replay never overwrites the current purpose, documents, segments, masking, coverage, or processing state and never calls `POST /api/analyze`.

Loading `DEMO-CHECKPOINT-REVIEW` is a visible replay-based demo action that resolves only its trusted checkpoint bundle ID. After all bundle invariants pass as one atomic precondition, it loads the checkpoint's trusted purpose, exact fixture documents and segments, approved masking, coverage, and completed processing state; appends exactly the checkpoint's one local replay run; makes it active; loads only its candidates and citations; then applies only its fixture-reviewer decisions. The reducer records the practitioner's visible checkpoint-load action separately and derives fixture-reviewer audit provenance for every seeded purpose, masking, and review record. Any mismatch rejects the complete action before mutation. The checkpoint is not a hidden route, saved user session, third analysis mode, prior live model response, or arbitrary browser payload. Seeded decisions must never be attributed to the current practitioner.

### 16.6 Safe errors

```ts
type SafeErrorCode =
  | "INVALID_REQUEST"
  | "UNSUPPORTED_VERSION"
  | "LIVE_ANALYSIS_DISABLED"
  | "CANONICAL_FIXTURE_MISMATCH"
  | "UNAUTHORIZED_PURPOSE"
  | "MASK_REVIEW_INCOMPLETE"
  | "MASK_SPAN_INVALID"
  | "PII_LEAK_DETECTED"
  | "PAYLOAD_TOO_LARGE"
  | "SOURCE_UNAVAILABLE"
  | "EXTRACTION_FAILED"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_DISABLED"
  | "PROVIDER_AUTHENTICATION_FAILED"
  | "PROVIDER_SERVICE_TIER_UNAVAILABLE"
  | "PROVIDER_QUOTA_EXHAUSTED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_REFUSAL"
  | "PROVIDER_DATA_POLICY_BLOCKED"
  | "INVALID_STRUCTURED_RESPONSE"
  | "CITATION_VALIDATION_FAILED"
  | "PROHIBITED_OUTPUT"
  | "SAFETY_VALIDATION_FAILED"
  | "REPLAY_VERSION_MISMATCH"
  | "CLIENT_TRANSPORT_FAILURE"
  | "INTERNAL_SAFE_FAILURE";

type AnalysisTransportFailureReason =
  | "network_unavailable"
  | "response_unavailable"
  | "invalid_response_envelope";

type LiveProviderRecoveryTarget =
  | {
      targetReleaseConfigurationId: "openai-quality-v1";
      displayOrder: 1;
    }
  | {
      targetReleaseConfigurationId: "gemini-quality-v1";
      displayOrder: 2;
    }
  | {
      targetReleaseConfigurationId: "mistral-small-free-v1";
      displayOrder: 3;
    };

type AnalysisRecoveryOptionBase = {
  label: string;
  automatic: false;
};

type AnalysisRecoveryOption =
  | (AnalysisRecoveryOptionBase & {
      action: "retry_same_provider";
      targetReleaseConfigurationId: LiveProviderReleaseConfigurationId;
      displayOrder: 0;
      requiresDisclosureAcknowledgement: false;
      startsNewRun: true;
    })
  | (AnalysisRecoveryOptionBase &
      LiveProviderRecoveryTarget & {
        action: "select_evaluated_release";
        requiresDisclosureAcknowledgement: true;
        startsNewRun: true;
      })
  | (AnalysisRecoveryOptionBase & {
      action: "use_deterministic_replay";
      targetReleaseConfigurationId: "prepared-replay-v1";
      displayOrder: 4;
      requiresDisclosureAcknowledgement: true;
      startsNewRun: true;
    })
  | (AnalysisRecoveryOptionBase & {
      action: "return_to_purpose";
      targetReleaseConfigurationId: null;
      displayOrder: 5;
      requiresDisclosureAcknowledgement: false;
      startsNewRun: false;
    });

type ApiErrorBase = {
  schemaVersion: "1.0.0";
  requestId: string;
  userMessage: string;
  failedStage: string;
};

type StartedLiveApiError<
  F extends AnalysisFailure = AnalysisFailure,
> = F extends AnalysisFailure
  ? ApiErrorBase & {
      code: F["safeErrorCode"];
      retryable: F["retryableSameProvider"];
      failedRunId: string;
      providerContext: AnalyzeLiveProviderSelection;
      failureClassification: F["classification"];
      recoveryOptions: AnalysisRecoveryOption[];
    }
  : never;

type PreflightApiError = ApiErrorBase & {
  code: PreflightRejectionSafeErrorCode;
  retryable: false;
  failedRunId: null;
  providerContext: AnalyzeLiveProviderSelection | null;
  failureClassification: null;
  recoveryOptions: AnalysisRecoveryOption[];
};

type ApiError = StartedLiveApiError | PreflightApiError;

type QuarantinedProposal = {
  id: string;
  proposalOrdinal: number;
  reasonCode:
    | "UNKNOWN_SOURCE"
    | "QUOTE_NOT_EXACT"
    | "AMBIGUOUS_QUOTE"
    | "EVIDENCE_NATURE_UPGRADE"
    | "PROHIBITED_CONCLUSION"
    | "INJECTION_PROPAGATION"
    | "INVALID_DEPENDENCY";
};
```

API errors never return document text, prompts, provider bodies, keys, or stack traces. `providerContext` is one correlated live provider and release pair or null, so a local replay or impossible cross-provider pair is unrepresentable. A quarantine ID is server-generated and opaque, and `proposalOrdinal` is the one-based position in the parsed provider proposal array. The provider-owned `proposedId` is never copied into a quarantine record, error, log, audit event, or browser-safe projection. Recovery options are derived from safe application error codes, never raw provider messages. Provider switching is offered only for eligible availability, service-tier, quota, rate-limit, timeout, authentication, or configuration failures. No recovery option starts automatically, and safety failures cannot be bypassed by selecting another model.

Recovery options render in ascending `displayOrder`. Same-provider retry is `0`; alternate evaluated live releases retain their registry order `1` through `3`; deterministic replay is `4`; and Return to Purpose is `5`. Omitted or ineligible actions do not renumber the remaining options. Selecting Mistral, another live provider, or replay is always an explicit practitioner action. After a verified terminal failed run, an eligible action creates a separate linked run, preserves that failed run, and never copies or merges outputs. After a preflight rejection or browser transport failure, there is no failed run to link; any later explicit action starts with `recoveryOfRunId: null` and `selectionReason: initial_choice` while preserving the safe non-run attempt history.

## 17. Processing contracts

```ts
type ProcessingStageName =
  | "intake_validation"
  | "text_extraction"
  | "coverage_calculation"
  | "identifier_masking"
  | "candidate_extraction"
  | "citation_validation"
  | "timeline_nexus_assembly"
  | "safety_export_gate_checks";

type FixtureProcessingStageName =
  | "intake_validation"
  | "text_extraction"
  | "coverage_calculation"
  | "identifier_masking";

type ProcessingStage = {
  name: ProcessingStageName;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  errorCode?: SafeErrorCode;
  affectedDocumentIds: string[];
  retryable: boolean;
};

type FixtureProcessingResult = {
  caseId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  canonicalFixtureDigest: string;
  documents: DocumentRecord[];
  coverage: CoverageSummary;
  processing: ProcessingStage[];
  selectedSegmentIds: string[];
};
```

No blank output panel is a successful state. A route derives its visible loading, partial, warning, blocked, error, success, unknown, and insufficient-evidence states from these explicit records.

Processing status transitions are canonical. `begin_fixture_processing` marks `intake_validation` active and all later stages pending. A valid local fixture-processing success completes, in order, `intake_validation`, `text_extraction`, `coverage_calculation`, and `identifier_masking`; it leaves `candidate_extraction`, `citation_validation`, `timeline_nexus_assembly`, and `safety_export_gate_checks` pending. A fixture-processing failure marks exactly the failed fixture stage as failed, keeps earlier completed stages completed, and keeps later stages pending unless they were already safely completed by a prior valid run. Retrying a fixture stage first marks only that failed fixture stage active, never any post-intake analysis stage.

Starting a valid live analysis or local replay marks `candidate_extraction` active and leaves `citation_validation`, `timeline_nexus_assembly`, and `safety_export_gate_checks` pending. A terminal successful analysis or replay completes `candidate_extraction`, completes `citation_validation` only after every accepted current citation is validated or explicitly blocked, and completes `timeline_nexus_assembly` only after current timeline, Nexus, dependency, and context-gap selectors can be derived from the active run. It leaves `safety_export_gate_checks` pending when `exportGate` is null. The separate `evaluate_export_gate` command updates that stage: completed when the gate is current and ready, warning when the gate is current but blocked only by visible review, limitation, citation, or coverage work, and failed only for a deterministic safety or export-gate failure that prevents review from continuing. A later material review, citation, coverage, purpose, mask, guidance, or run change that stales the gate returns `safety_export_gate_checks` to pending. A terminal started failure marks `candidate_extraction` failed and leaves the later three post-intake stages pending. A malformed successful envelope or post-validation rejection marks the earliest post-intake stage whose invariant failed as failed and keeps later post-intake stages pending. Preflight rejection and browser transport failure restore the prior stable processing array and never mark a post-intake stage active, completed, warning, or failed.

## 18. Audit contract

```ts
type AuditEventType =
  | "purpose_saved"
  | "purpose_changed"
  | "authority_changed"
  | "provider_selected"
  | "provider_disclosure_acknowledged"
  | "mask_decision_recorded"
  | "mask_suggestions_refreshed"
  | "mask_suggestion_added"
  | "mask_suggestion_removed"
  | "mask_review_completed"
  | "fixture_processing_started"
  | "fixture_processing_completed"
  | "fixture_processing_failed"
  | "fixture_processing_retried"
  | "analysis_started"
  | "analysis_completed"
  | "analysis_failed"
  | "analysis_preflight_rejected"
  | "analysis_transport_failed"
  | "analysis_recovery_selected"
  | "analysis_run_activated"
  | "citation_manually_resolved"
  | "candidate_reviewed"
  | "context_gap_responded"
  | "coverage_issue_reviewed"
  | "source_revealed"
  | "evidence_withdrawn"
  | "dependencies_invalidated"
  | "export_gate_evaluated"
  | "export_blocked"
  | "export_created"
  | "unsafe_output_reported"
  | "case_reset"
  | "safety_event";

type AuditEvent = {
  id: string;
  caseId: string;
  eventType: AuditEventType;
  sequence: number;
  actor: "practitioner" | "fixture_reviewer" | "system";
  actorRole?: CasePurposeBrief["practitionerRole"];
  startCommandId?: string;
  analysisRunId?: string;
  recoveryOfRunId?: string;
  providerId?: ProviderId;
  releaseConfigurationId?: ProviderReleaseConfigurationId;
  providerDisclosureVersion?: "1.0.0";
  promptVersion?: "1.0.0";
  rulesetVersion?: "1.0.0";
  entityIds: string[];
  reasonCode?: string;
  summary: string;
  createdAt: string;
} & (
  | {
      commandId: string;
      idempotencyKey: string;
    }
  | {
      commandId: null;
      idempotencyKey: null;
    }
);
```

The P0 audit is an explanatory record appended through normal application actions within the current browser session. It is not immutable, tamper-evident, independently witnessed, forensic, or production-grade.

Audit summaries contain no raw source quote or direct identifier. Every user-command-derived audit event carries that command's opaque `commandId` and `idempotencyKey`; fixture and system-only events carry null for both. Before applying any command, the reducer scans the persisted audit links and rejects a reused command ID or idempotency key. This check survives session restore without hidden module state. Provider-selection and recovery events record only safe registry IDs, disclosure version when applicable, run linkage, and the explicit actor action. Preflight-rejection and transport-failure events retain the opaque `startCommandId` so `NonRunAnalysisAttempt` can link to the exact safe event without fabricating an analysis run.

## 19. Export gate contract

```ts
type ExportKind = "full_practitioner_handoff" | "minimum_necessary_safe_share";

type MinimumNecessarySelection = {
  confirmed: boolean;
  intendedRecipientCategory: CasePurposeBrief["intendedRecipientCategory"];
  selectedCandidateIds: string[];
  excludedCandidateIds: string[];
};

type ExportSelection =
  | {
      kind: "full_practitioner_handoff";
      minimumNecessarySelection: null;
    }
  | {
      kind: "minimum_necessary_safe_share";
      minimumNecessarySelection: MinimumNecessarySelection;
    };

type ExportBlockerCode =
  | "PURPOSE_INCOMPLETE"
  | "AUTHORITY_INVALID"
  | "DATA_ORIGIN_PROHIBITED"
  | "REVIEW_INCOMPLETE"
  | "CITATION_UNRESOLVED"
  | "COVERAGE_CONSEQUENTIAL"
  | "JURISDICTION_UNVERIFIED"
  | "DEPENDENCY_UNRESOLVED"
  | "MASK_REVIEW_INCOMPLETE"
  | "PII_CHECK_FAILED"
  | "PROCESSING_FAILED"
  | "SAFETY_VALIDATION_FAILED"
  | "ANALYSIS_RUN_STALE"
  | "GATE_EVALUATION_STALE"
  | "MINIMUM_NECESSITY_UNCONFIRMED"
  | "OUTSIDE_STATED_PURPOSE";

type ExportBlocker = {
  id: string;
  code: ExportBlockerCode;
  severity: "blocking";
  entityIds: string[];
  message: string;
  remediation: string;
};

type ExportGateBase = {
  id: string;
  caseRevision: number;
  analysisRunId: string;
  purposeBriefRevision: number;
  maskingRevision: number;
  guidancePackVersion: "1.0.0";
  guidancePackDigest: string;
  rulesetVersion: "1.0.0";
  exportSelection: ExportSelection;
  exportSelectionDigest: string;
  evaluatedAt: string;
  reviewedCandidateCount: number;
  includedCandidateCount: number;
};

type ExportGate =
  | (ExportGateBase & {
      status: "ready";
      freshness: "current";
      blockers: [];
    })
  | (ExportGateBase & {
      status: "blocked";
      freshness: "current" | "stale";
      blockers: [ExportBlocker, ...ExportBlocker[]];
    });
```

There is no P0 override for a blocking condition. A ready gate is structurally current and has zero blockers. A stale gate is always blocked and contains at least the `GATE_EVALUATION_STALE` blocker. `ExportSelection` is normalized before gate evaluation: all candidate IDs are known, unique, and lexicographically sorted, selected and excluded IDs are disjoint, and the shape matches the Purpose-selected export kind. A ready normalized safe-share selection must include only active candidate IDs whose `safeShareRecipientCategories` contain the Purpose Brief's `intendedRecipientCategory`, the selection's `intendedRecipientCategory` must equal the Purpose Brief category, and it must include the active required candidate and Nexus dependency closure of every selected item. Every source dependency in that ready closure must resolve to an included citation. A structurally valid selection whose dependency closure is omitted or cannot be included creates a blocked gate with `DEPENDENCY_UNRESOLVED` and explains the omission limitation rather than failing before mutation or producing a dangling relationship. `exportSelectionDigest` is the lowercase 64-character SHA-256 digest of its canonical JSON representation with object keys recursively sorted and selection arrays in this normalized order. A full-practitioner selection has a null minimum-necessary selection. A safe-share selection with `confirmed: false` is valid input but cannot be ready; it produces `MINIMUM_NECESSITY_UNCONFIRMED`. A safe-share selection with `confirmed: true` may still produce `OUTSIDE_STATED_PURPOSE` when its recipient category differs from Purpose or when any selected or closure-required candidate is not eligible for the Purpose recipient category.

Export command revision effects are fixed. Re-evaluating `evaluate_export_gate` with the same normalized selection and unchanged case inputs is revision-stable. If there is a current export for the same case revision and selection digest, the reducer preserves the exact current ready gate object referenced by the manifest; it may append safe audit and update processing status but must not replace the gate ID or evaluated time. A stale gate re-evaluated with the same normalized selection after an unrelated material change creates a new gate at the current revision without an additional revision increment. The reducer normalizes and structurally validates a submitted selection before any mutation. Unknown IDs, duplicate IDs, overlapping selected and excluded IDs, wrong handoff kind, or malformed shape fail with no state change. Valid-but-unconfirmed, outside-purpose, or missing-closure selections create a blocked gate with `MINIMUM_NECESSITY_UNCONFIRMED`, `OUTSIDE_STATED_PURPOSE`, or `DEPENDENCY_UNRESOLVED` rather than failing before mutation. A valid initial selection creates a gate at the current revision without incrementing. A valid changed minimum-necessary selection is a material scope change, even when it creates a blocked gate: after normalization and structural validation, the reducer atomically increments `caseRevision`, clears `currentExportId`, `currentExportManifest`, and `exportedRevision`, then creates the gate at the resulting revision. A reorder-equivalent selection has the same digest and is revision-stable. `create_export` never increments `caseRevision`; it requires a current ready gate with a matching normalized selection digest and writes the `ExportRecord`, `currentExportId`, `currentExportManifest`, and `exportedRevision` at that current gate revision. Therefore a gate or export does not stale itself merely by being created.

Some blocker codes are defensive policy outputs rather than states reachable from a fully valid P0 case. `DATA_ORIGIN_PROHIBITED` is exercised by pure evaluator input with a non-`bundled_synthetic` origin and cannot occur in the enabled fixture. `JURISDICTION_UNVERIFIED` is exercised by a pure evaluator input that requests a domestic legal claim from unverified guidance or fictional jurisdiction data and cannot be cleared by guidance alone. `PURPOSE_INCOMPLETE` is represented by a precondition gate-evaluation result before an `ExportGateBase` can exist, because a typed gate requires an analysis run and purpose revision. `PROCESSING_FAILED` ignores `safety_export_gate_checks` itself and applies only to required pre-gate processing stages; the safety/export stage is updated by gate evaluation.

Only active candidates with `reviewRequirement: "individual"` participate in the review-complete gate. A withdrawn candidate is a resolved exclusion. Its active downstream dependants still require renewed review. Any material case change increments case revision and makes a prior gate stale.

## 20. Export manifest contract

```ts
type PurposeExportSummary = {
  supportedWorkflow: "case_preparation_handoff";
  sanitizedPurpose: string;
  intendedRecipientCategory: CasePurposeBrief["intendedRecipientCategory"];
  requestedExport: ExportKind;
  jurisdictionCode: CasePurposeBrief["jurisdictionCode"];
  excludedDecisions: ExcludedDecision[];
  authorityBasis: "not_applicable_synthetic_fixture";
};

type ReviewedExportCandidate = {
  candidateId: string;
  analysisRunId: string;
  kind: Exclude<CandidateKind, "context_gap">;
  assertionMode: AssertionMode;
  effectiveReviewedText: string;
  originalSuggestion: string;
  itemOrigin: ItemOrigin;
  currentTextOrigin: ItemOrigin;
  supportStatus: SupportStatus;
  reviewStatus: "human_accepted" | "human_edited";
  dependencies: Array<
    | {
        dependencyId: string;
        kind: "source";
        citationId: string;
        relationship: DependencyRelationship;
        evidenceNature: EvidenceNature;
      }
    | {
        dependencyId: string;
        kind: "candidate";
        candidateId: string;
        relationship: DependencyRelationship;
      }
    | {
        dependencyId: string;
        kind: "nexus";
        nexusCandidateId: string;
        relationship: DependencyRelationship;
      }
  >;
  limitationTexts: string[];
  unknowns: string[];
};

type ExportCitation = {
  citationId: string;
  analysisRunId: string;
  documentId: string;
  pageNumber?: number;
  segmentId: string;
  redactedQuotedText: string;
  validationStatus: "exact_match" | "manually_resolved";
  sourceLanguage: "en";
  translationStatus: SourceSegment["translationStatus"];
  extractionQuality: SourceSegment["extractionQuality"];
};

type ReviewedExportGapBase = {
  candidateId: string;
  analysisRunId: string;
  effectiveReviewedText: string;
  reviewStatus: "human_accepted" | "human_edited";
};

type ReviewedExportGap =
  | (ReviewedExportGapBase & {
      responseStatus: "answered";
      response: string;
      responseEvidenceNature: "reviewer_supplied_context";
      responseExplanation: null;
    })
  | (ReviewedExportGapBase & {
      responseStatus: "preserved_unknown" | "unanswered";
      response: null;
      responseEvidenceNature: "unknown";
      responseExplanation: null;
    })
  | (ReviewedExportGapBase & {
      responseStatus: "deferred" | "outside_scope";
      response: null;
      responseEvidenceNature: "unknown";
      responseExplanation: string;
    });

type ReviewedExportCoverageLimitation = {
  decisionId: string;
  issueId: string;
  originalConsequence: CoverageReviewDecision["originalConsequence"];
  reviewedConsequence: CoverageReviewDecision["reviewedConsequence"];
  limitationText: string;
  actor: CoverageReviewDecision["actor"];
};

type SanitizedReviewDecision = {
  decisionId: string;
  candidateId: string;
  analysisRunId: string;
  action: ReviewAction;
  resultingStatus: ReviewStatus;
  actor: ReviewDecision["actor"];
  createdAt: string;
};

type SanitizedAuditEntry = {
  auditId: string;
  sequence: number;
  eventType: AuditEventType;
  analysisRunId?: string;
  entityIds: string[];
  safeSummary: string;
  createdAt: string;
};

type ExportRecord = {
  id: string;
  caseRevision: number;
  exportManifestId: string;
  kind: ExportKind;
  formats: ["pdf", "json"];
  createdAt: string;
};

type SuccessfulAnalysisRunManifest<
  R extends Extract<AnalysisRun, { status: "succeeded" }> = Extract<
    AnalysisRun,
    { status: "succeeded" }
  >,
> = R extends Extract<AnalysisRun, { status: "succeeded" }>
  ? Pick<
      R,
      | "id"
      | "mode"
      | "status"
      | "provider"
      | "recovery"
      | "inputState"
      | "promptVersion"
      | "requestSchemaVersion"
      | "responseSchemaVersion"
      | "fixtureVersion"
      | "rulesetVersion"
      | "checkpointProvenance"
    >
  : never;

type ExportManifest = {
  schemaVersion: "1.0.0";
  reviewedExportStateHashProjectionVersion: "1.0.0";
  id: string;
  kind: ExportKind;
  caseId: string;
  caseRevision: number;
  reviewedStateHash: string;
  synthetic: true;
  purposeBriefId: string;
  purposeSummary: PurposeExportSummary;
  runManifest: SuccessfulAnalysisRunManifest;
  generatedAt: string;
  labels: [
    "AI-assisted, human-reviewed case-preparation draft.",
    "Synthetic case.",
    "Not legal advice.",
    "Local legal verification required."
  ];
  exportSelection: ExportSelection;
  exportSelectionDigest: string;
  includedCandidates: ReviewedExportCandidate[];
  citations: ExportCitation[];
  coverage: CoverageSummary;
  coverageLimitations: ReviewedExportCoverageLimitation[];
  guidancePackVersion: "1.0.0";
  guidancePackDigest: string;
  reviewedGaps: ReviewedExportGap[];
  guidanceCards: GuidanceCard[];
  reviewDecisions: SanitizedReviewDecision[];
  auditEvents: SanitizedAuditEntry[];
  limitations: string[];
  redactionCheck: "passed";
  gate: Extract<ExportGate, { status: "ready"; freshness: "current" }>;
};

type ReviewedExportStateHashProjection = Omit<
  ExportManifest,
  "id" | "reviewedStateHash" | "generatedAt"
> & {
  schemaVersion: "1.0.0";
  reviewedExportStateHashProjectionVersion: "1.0.0";
};
```

Safe-share rules:

- Include only fields selected for the stated recipient and purpose.
- Replace direct identifiers with approved pseudonyms or tokens.
- Exclude raw full documents, rejected candidates, hidden prompts, provider logs, and unnecessary audit detail.
- Preserve source IDs, review status, coverage limitations, guidance-pack identity, and dependency meaning.
- `coverageLimitations` contains exactly one record for every included coverage issue whose `resolutionStatus` is `reviewed_limitation`, ordered by issue ID then decision ID. Its decision ID must resolve to the persisted `CoverageReviewDecision` named by that issue; original and reviewed consequence, limitation text, and actor must exactly match. A dangling or extra record rejects the manifest.
- `ReviewedExportCandidate.limitationTexts` is empty unless the included candidate has `assertionMode: "limitation"`; in that case it is the one-item array containing its exact `effectiveReviewedText`. `ExportManifest.limitations` is the lexicographically sorted, duplicate-free union of included candidate limitation texts, coverage-limitation texts, reviewed-gap explanations, and included guidance-card limitations. It cannot contain any independently authored string.
- Export only active dependencies in the safe `ReviewedExportCandidate.dependencies` projection. Source entries must resolve to an included exact or manually resolved citation; candidate and Nexus entries must resolve to another included candidate or Nexus record in the normalized dependency closure and preserve their discriminator, target ID, and relationship. An excluded dependency target blocks the safe share with `DEPENDENCY_UNRESOLVED` rather than leaving a dangling reference. Gap responses and explanations use the strict `ReviewedExportGap` branch, remain subject to final redaction and minimum-necessity checks, and cannot introduce new evidence nature or legal meaning.
- Use the handoff kind selected in the current Purpose Brief. `ExportManifest.exportSelection` and digest must exactly equal the ready gate's normalized selection and digest. PDF and JSON are formats of that one handoff, not two different handoff purposes.
- Require `runManifest.status` to be `succeeded`. Every included candidate, citation, gap, and review decision must carry that same run ID.
- Preserve the exact provider, release configuration, model, service tier, adapter, disclosure, provider-transmission, and recovery provenance from the selected run.
- Never combine candidates, citations, decisions, or summaries from separate analysis runs into one manifest.

PDF and JSON use the same reviewed manifest. The P0 PDF is not claimed to satisfy PDF/UA or to be a tagged accessible document. The structured JSON companion preserves the same content in a machine-readable form. An accessible-document export strategy is required before any real pilot.

`reviewedStateHash` is the lowercase 64-character SHA-256 hexadecimal digest of the UTF-8 canonical JSON encoding of `ReviewedExportStateHashProjection` version `1.0.0`. The projection is the complete manifest state except the generated manifest `id`, `reviewedStateHash` itself, and `generatedAt`. No review, audit, gate, provenance, limitation, citation, dependency, gap-response, selection, guidance-pack, or coverage-limitation field is otherwise omitted. Before canonical JSON, selected and excluded candidate IDs, `purposeSummary.excludedDecisions`, candidate dependencies by dependency ID, unknown and limitation arrays, and entity ID arrays are sorted by their declared enum order where one exists, otherwise lexicographically; included candidates sort by candidate ID; citations by citation ID; coverage issues by issue ID; coverage limitations by issue ID then decision ID; reviewed gaps by candidate ID; guidance cards by ID; review decisions by decision ID; audit entries by sequence then audit ID; gate blockers by blocker ID; and labels retain their required tuple order. Canonical JSON recursively sorts object keys by Unicode codepoint, preserves these normalized array orders, contains no `undefined`, and preserves exact strings, numbers, booleans, and nulls. Changing any included reviewed-state field must change the hash. The three explicitly excluded fields are manifest-generation metadata only and cannot be used to alter the reviewed content.

## 21. Guidance contract

```ts
type GuidanceCard = {
  id: string;
  sourceRegisterId: string;
  issuer: string;
  title: string;
  materialType:
    | "treaty"
    | "international_guidance"
    | "operational_indicator"
    | "report"
    | "risk_framework"
    | "security_guidance";
  publicationOrVersionDate: string;
  sourceVersion: string;
  jurisdictionOrScope: string;
  exactReviewedPassage: string;
  locator: string;
  sourceUrl: string;
  lastVerified: string;
  verificationStatus: "current_for_scope" | "stale" | "jurisdiction_mismatch" | "unverified";
  localLegalVerificationRequired: true;
  allowedUse: string;
  limitation: string;
};

type GuidancePackIdentity = {
  version: "1.0.0";
  digest: string;
};

type GuidancePack = {
  schemaVersion: "1.0.0";
  identity: GuidancePackIdentity;
  cards: GuidanceCard[];
};

type GuidancePackDigestProjection = Omit<GuidancePack, "identity">;
```

`GuidancePackIdentity.digest` is a lowercase 64-character SHA-256 digest of the UTF-8 canonical JSON encoding of `GuidancePackDigestProjection` version `1.0.0`. Cards sort lexicographically by ID before hashing; object keys sort by Unicode codepoint; no undefined value is allowed; all reviewed-card strings and metadata are included. Schema validation rejects a non-lowercase or non-64-character digest, duplicate card ID, or a pack whose identity digest does not recompute. TASK-003 builds the one bundled pack and its digest from the reviewed source-register definitions. Guidance is never an evidence dependency for a case fact. P0 guidance cannot support a domestic legal conclusion.

P0's authoritative pack contains exactly the six reviewed source-register cards `INT-002`, `INT-004`, `HR-002`, `IND-001`, `FC-002`, and `SEC-001`; `ExportManifest.guidanceCards` is that complete sorted pack, never an arbitrary subset. The current trusted pack must satisfy exact equality across `CaseState.guidancePack`, `PersistedCaseState.guidancePack`, `ExportGate` version and digest, and `ExportManifest` version and digest. Gate creation and restore recompute the identity from the complete authoritative pack rather than from a manifest copy. A mismatch blocks or clears current export state before rendering or download.

## 22. System card contract

```ts
type NonRunAnalysisAttemptBase = {
  id: string;
  caseId: "CFN-DEMO-001";
  startCommandId: string;
  auditEventId: string;
  providerSelection: AnalyzeLiveProviderSelection;
  outputAccepted: false;
  occurredAt: string;
};

type PreflightRejectionSafeErrorCode =
  | "INVALID_REQUEST"
  | "UNSUPPORTED_VERSION"
  | "LIVE_ANALYSIS_DISABLED"
  | "CANONICAL_FIXTURE_MISMATCH"
  | "UNAUTHORIZED_PURPOSE"
  | "MASK_REVIEW_INCOMPLETE"
  | "MASK_SPAN_INVALID"
  | "PII_LEAK_DETECTED"
  | "PAYLOAD_TOO_LARGE"
  | "SOURCE_UNAVAILABLE"
  | "EXTRACTION_FAILED"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_DISABLED"
  | "PROVIDER_SERVICE_TIER_UNAVAILABLE"
  | "PROVIDER_DATA_POLICY_BLOCKED";

type NonRunAnalysisAttempt =
  | (NonRunAnalysisAttemptBase & {
      kind: "preflight_rejection";
      transmissionStatus: "not_transmitted";
      remoteExecutionStatus: "not_started";
      safeErrorCode: PreflightRejectionSafeErrorCode;
      reasonCode: PreflightRejectionSafeErrorCode;
    })
  | (NonRunAnalysisAttemptBase & {
      kind: "transport_failure";
      transmissionStatus: "unknown";
      remoteExecutionStatus: "unknown";
      safeErrorCode: "CLIENT_TRANSPORT_FAILURE";
      reasonCode: AnalysisTransportFailureReason;
    });

type AnalysisRunSummary<
  R extends AnalysisRun = AnalysisRun,
> = R extends AnalysisRun
  ? Pick<
      R,
      | "id"
      | "mode"
      | "status"
      | "provider"
      | "recovery"
      | "failure"
      | "checkpointProvenance"
      | "inputState"
    >
  : never;

type SystemCardBase = {
  schemaVersion: "1.0.0";
  productVersion: string;
  intendedUse: string[];
  prohibitedUse: string[];
  enabledDataOrigin: "bundled_synthetic";
  enabledFixtureBinding: ProviderFixtureBinding;
  providerDisplayOrder: ["openai", "google_gemini", "mistral", "local_replay"];
  providers: ProviderOptionProjection[];
  selectedRelease: ProviderOptionProjection | null;
  selectionPolicy: "explicit_user_choice_only";
  automaticCrossProviderFailover: false;
  crossRunOutputMerging: false;
  attemptedRuns: AnalysisRunSummary[];
  nonRunAttempts: NonRunAnalysisAttempt[];
  currentRun: AnalysisRunSummary | null;
  activeCheckpoint: Pick<
    DemoCheckpointBundle,
    | "id"
    | "bundleVersion"
    | "checkpointVersion"
    | "replayVersion"
    | "fixtureVersion"
    | "canonicalFixtureDigest"
    | "postDecisionHashProjectionVersion"
    | "visibleLabel"
    | "replayVisibleLabel"
    | "providerTransmission"
    | "seededDecisionActor"
  > | null;
  supportedLanguages: ["en"];
  supportedDocumentMode: "bundled_text_pdf";
  humanReviewRequirements: string[];
  knownFailureModes: string[];
  unsupportedJurisdictions: string[];
  unsupportedDocumentTypes: string[];
  unsupportedUserGroups: string[];
  knownLimitations: string[];
  fixtureCount: number;
  unsafeOutputReportingMechanism: string;
  evaluationFixtureVersion: "1.0.0";
  measuredResults: EvaluationResult[];
  providerAdmissions: ProviderReleaseAdmissionRecord[];
  evaluationAdmissionReports: ProviderEvaluationAdmissionReport[];
};

type SystemCard =
  | (SystemCardBase & {
      liveAnalysisEnabled: true;
      replayEnabled: true;
      providers: EnabledAvailabilityOptions;
      selectedRelease: ProviderOptionProjection | null;
    })
  | (SystemCardBase & {
      liveAnalysisEnabled: false;
      replayEnabled: true;
      providers: GloballyDisabledAvailabilityOptions;
      selectedRelease: ProviderOptionProjection<ReplayReleaseConfiguration> | null;
    });
```

`providerAdmissions` contains exactly the three live release records. Local replay appears in `providers`, measured replay results, and replay provenance, but never in `providerAdmissions` or `evaluationAdmissionReports`. `SystemCard.liveAnalysisEnabled` and its live-provider option status must match the one correlated `AnalyzeAvailabilityResponse` branch; a globally disabled live system exposes no selectable live option.

`attemptedRuns` remains run-only. `nonRunAttempts` is derived from the corresponding safe audit events and separately projects preflight rejections and browser transport failures that intentionally created no `AnalysisRun`; it is not a second mutable attempt ledger. It contains only safe registry IDs, the safe start-command and audit linkage, safe reason codes, transmission and remote-execution status, `outputAccepted: false`, and time. For preflight rejection, `reasonCode` equals the public `safeErrorCode`; no provider or validation text is copied. It never includes source text, provider bodies, credentials, endpoints, request payloads, or an invented run ID.

## 23. Evaluation result contract

```ts
type EvaluationExecutionRequirement = "live_model_run" | "deterministic_control";

type EvaluationVariantId =
  | "EVAL-001"
  | "EVAL-002"
  | "EVAL-003"
  | "EVAL-004"
  | "EVAL-005A"
  | "EVAL-005B"
  | "EVAL-006"
  | "EVAL-007"
  | "EVAL-008"
  | "EVAL-009"
  | "EVAL-010"
  | "EVAL-011"
  | "EVAL-012A"
  | "EVAL-012B";

type EvaluationInputPacket = {
  schemaVersion: "1.0.0";
  id: string;
  variantId: EvaluationVariantId;
  fixtureId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  selectedSegmentIds: string[];
  approvedRedactedInputDigest: string;
  purposeContext: {
    statedPurpose: "frozen_synthetic_provider_evaluation";
    practitionerRole: "demo_evaluator";
    jurisdictionCode: CasePurposeBrief["jurisdictionCode"];
    requestedExport: CasePurposeBrief["requestedExport"];
    cooperationContext: "not_recorded" | "cooperated" | "did_not_cooperate" | "unknown";
  };
  packetDigest: string;
};

type EvaluationInputPacketDigestProjection = Omit<
  EvaluationInputPacket,
  "packetDigest"
>;

type EvaluationControlInput =
  | {
      kind: "frozen_control_fixture";
      stimulusKind:
        | "timeout"
        | "transport_loss"
        | "malformed_envelope"
        | "seeded_identifier_leak"
        | "invalid_citation"
        | "coverage_gap"
        | "dependency_recalculation"
        | "prompt_injection";
      injectedFault: string;
      expectedAcceptedOutput: false;
    }
  | {
      kind: "deterministic_state_fixture";
      stateTransitionUnderTest:
        | "manual_citation_resolution"
        | "coverage_limitation_review"
        | "withdrawal_dependency_recalculation"
        | "export_gate_blocking";
      expectedAcceptedOutput: boolean;
    };

type CanonicalJsonPrimitive = string | number | boolean | null;
type CanonicalJsonValue =
  | CanonicalJsonPrimitive
  | CanonicalJsonValue[]
  | { [key: string]: CanonicalJsonValue };

type EvaluationControlFixture = {
  schemaVersion: "1.0.0";
  controlFixtureId: string;
  controlFixtureVersion: "1.0.0";
  controlInput: EvaluationControlInput;
  controlPayload: CanonicalJsonValue;
  controlFixtureDigest: string;
};

type EvaluationControlFixtureDigestProjection = Omit<
  EvaluationControlFixture,
  "controlFixtureDigest"
>;

type EvaluationDefinitionBase = {
  schemaVersion: "1.0.0";
  variantId: EvaluationVariantId;
  fixtureId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  inputPacket: EvaluationInputPacket;
  split: "development" | "held_out";
  applicableReleaseScope: "all_frozen_live_releases";
  gateNames: EvaluationAdmissionGateName[];
  expectedChecks: Array<{ name: string; expected: string }>;
};

type EvaluationDefinition =
  | (EvaluationDefinitionBase & {
      executionRequirement: "live_model_run";
      requiredRepetitions: [1, 2, 3];
      requiredControlScenarios: [];
      allowedExecutionSources: ["live_provider"];
      expectedActualProviderTransmission: true;
      allowedTerminalStatuses: Array<"succeeded" | "failed">;
    })
  | (EvaluationDefinitionBase & {
      executionRequirement: "deterministic_control";
      requiredRepetitions: [1];
      requiredControlScenarios: Array<{
        scenarioId: string;
        controlFixture: EvaluationControlFixture;
        executionSource: "mock_control" | "deterministic_control";
        actualProviderTransmission: false;
        simulatedTransmissionStatus: "transmitted" | "not_transmitted" | "unknown";
        terminalStatus:
          | "succeeded"
          | "failed"
          | "rejected_before_run"
          | "transport_outcome_unknown";
        simulatedRunRequired: boolean;
      }>;
      allowedExecutionSources: Array<"mock_control" | "deterministic_control">;
      expectedActualProviderTransmission: false;
      allowedTerminalStatuses: Array<
        | "succeeded"
        | "failed"
        | "rejected_before_run"
        | "transport_outcome_unknown"
      >;
    });

type EvaluationDefinitionSetDigestProjection = {
  schemaVersion: "1.0.0";
  definitions: EvaluationDefinition[];
};

type EvaluationEvidenceBase = {
  schemaVersion: "1.0.0";
  evidenceId: string;
  variantId: EvaluationVariantId;
  fixtureId: string;
  fixtureVersion: "1.0.0";
  inputPacketId: string;
  inputPacketDigest: string;
  split: "development" | "held_out";
  repetition: 1 | 2 | 3;
  promptVersion: "1.0.0";
  responseSchemaVersion: "1.0.0";
  rulesetVersion: "1.0.0";
};

type EvaluationCheck = {
  name: string;
  expected: string;
  observed: string;
  passed: boolean;
};

type ExecutedEvaluationEvidenceBase = EvaluationEvidenceBase & {
  status: "passed" | "failed";
  checks: Array<{
    name: string;
    expected: string;
    observed: string;
    passed: boolean;
  }>;
  runAt: string;
};

type LiveModelEvaluationEvidence = ExecutedEvaluationEvidenceBase & {
  executionRequirement: "live_model_run";
  scenarioId: null;
  analysisRunId: string;
  executionSource: "live_provider";
  actualProviderTransmission: true;
  terminalStatus: "succeeded" | "failed";
  runMode: "live";
  provider: AnalysisProviderProvenance<LiveProviderReleaseConfiguration>;
};

type DeterministicControlEvaluationEvidence = ExecutedEvaluationEvidenceBase & {
  executionRequirement: "deterministic_control";
  scenarioId: string;
  controlFixtureId: string;
  controlFixtureVersion: "1.0.0";
  controlFixtureDigest: string;
  plannedRelease: AnalyzeLiveProviderSelection;
  analysisRunId: null;
  simulatedRunId: string | null;
  executionSource: "mock_control" | "deterministic_control";
  actualProviderTransmission: false;
  simulatedTransmissionStatus: "transmitted" | "not_transmitted" | "unknown";
  terminalStatus:
    | "succeeded"
    | "failed"
    | "rejected_before_run"
    | "transport_outcome_unknown";
  runMode: null;
  provider: null;
};

type ReplayContinuityEvaluationResult = {
  schemaVersion: "1.0.0";
  resultKind: "replay_continuity";
  replayBundleId: ReplayBundleId;
  fixtureId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  promptVersion: "1.0.0";
  responseSchemaVersion: "1.0.0";
  rulesetVersion: "1.0.0";
  status: "passed" | "failed";
  checks: EvaluationCheck[];
  runAt: string;
  analysisRunId: string;
  executionSource: "deterministic_replay";
  actualProviderTransmission: false;
  terminalStatus: "succeeded";
  runMode: "deterministic_replay";
  provider: AnalysisProviderProvenance<ReplayReleaseConfiguration>;
};

type NotRunEvaluationEvidence = EvaluationEvidenceBase & {
  status: "not_run";
  checks: [];
  runAt?: never;
  executionRequirement: EvaluationExecutionRequirement;
  scenarioId: string | null;
  controlFixtureId: string | null;
  controlFixtureVersion: "1.0.0" | null;
  controlFixtureDigest: string | null;
  plannedRelease: AnalyzeLiveProviderSelection;
  analysisRunId: null;
  executionSource: "not_run";
  actualProviderTransmission: false;
  terminalStatus: "not_run";
  runMode: null;
  provider: null;
};

type DeterministicHarnessResult = ExecutedEvaluationEvidenceBase & {
  resultKind: "deterministic_harness";
  executionRequirement: EvaluationExecutionRequirement;
  scenarioId: string | null;
  controlFixtureId: string | null;
  controlFixtureVersion: "1.0.0" | null;
  controlFixtureDigest: string | null;
  plannedRelease: AnalyzeLiveProviderSelection;
  analysisRunId: null;
  executionSource: "mock_harness";
  actualProviderTransmission: false;
  terminalStatus: "succeeded" | "failed";
  runMode: null;
  provider: null;
};

type ProviderAdmissionEvidenceRecord =
  | LiveModelEvaluationEvidence
  | DeterministicControlEvaluationEvidence
  | NotRunEvaluationEvidence;

type EvaluationResult =
  | ProviderAdmissionEvidenceRecord
  | ReplayContinuityEvaluationResult
  | DeterministicHarnessResult;

type EvaluationAdmissionGateName =
  | "consequential_review_blocking"
  | "invalid_citation_rejection"
  | "injection_containment"
  | "cooperation_invariance"
  | "declared_identifier_exclusion"
  | "required_abstention"
  | "dependency_recalculation"
  | "prohibited_conclusion_blocking";

type ProviderEvaluationAdmissionReport<
  R extends LiveProviderReleaseConfiguration = LiveProviderReleaseConfiguration,
> = R extends LiveProviderReleaseConfiguration ? {
  schemaVersion: "1.0.0";
  id: string;
  reportDigest: string;
  release: R;
  adapterVersion: string;
  inferenceSetting: ProviderReleaseInferenceSetting<R>;
  disclosureVersion: "1.0.0";
  fixtureId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  canonicalFixtureDigest: string;
  evaluationDefinitionSetDigest: string;
  evaluatedConfigurationDigest: string;
  promptVersion: "1.0.0";
  responseSchemaVersion: "1.0.0";
  rulesetVersion: "1.0.0";
  requiredLiveRunsPerModelVariant: 3;
  requiredRunsPerControlScenario: 1;
  evidence: ProviderAdmissionEvidenceRecord[];
  status: "passed" | "failed" | "incomplete";
  gates: Array<{
    name: EvaluationAdmissionGateName;
    status: "passed" | "failed" | "not_run";
    evidence: Array<{
      fixtureId: string;
      variantId: EvaluationVariantId;
      split: "development" | "held_out";
      evidenceId: string;
    }>;
  }>;
  generatedAt: string;
} : never;
```

`EvaluationInputPacket.packetDigest` is a lowercase 64-character SHA-256 hexadecimal digest. It is the UTF-8 canonical JSON digest of `EvaluationInputPacketDigestProjection` version `1.0.0`. The ordered selected segment IDs plus the approved-redacted-input digest are the complete source-content binding for the evaluation packet; no separate opaque source-packet identifier or digest exists. Control-scenario inputs are defined only by the owning `EvaluationDefinition.requiredControlScenarios` branch and are bound through the definition-set digest, never by a parallel packet field. Each deterministic control scenario must carry a canonical `controlFixture` that identifies the frozen fixture ID, fixture version, fixture digest, stimulus or state transition under test, injected fault where applicable, accepted-output expectation, and the complete `controlPayload` consumed by the runner. `controlPayload` is the exact structured envelope, request fragment, injected provider result, seeded leak input, citation test input, coverage state, dependency state, or other deterministic state fixture for that scenario. It must be a non-empty object conforming to the frozen schema for the exact `controlInput.kind`, `stimulusKind`, or `stateTransitionUnderTest`; scalar, null, empty object, and wrong-branch payloads are invalid. The runner must consume exactly those structured values after schema validation; it cannot rebuild, reinterpret, or replace them from scenario labels. `controlFixtureDigest` is a lowercase 64-character SHA-256 digest of the UTF-8 canonical JSON encoding of `EvaluationControlFixtureDigestProjection` version `1.0.0`. Changing the timeout, transport loss, malformed envelope, seeded leak, invalid citation, coverage gap, dependency recalculation, prompt-injection stimulus, deterministic state fixture, actual control payload, or any field of the canonical control input changes the control-fixture digest and the definition-set digest. Before digesting, selected segment IDs preserve their fixed request order. Canonical JSON recursively sorts object keys by Unicode codepoint, preserves those normalized array orders, contains no `undefined`, and preserves exact strings, numbers, booleans, and nulls. Packet schema validation rejects a non-lowercase, non-64-character digest, duplicate ID, unknown segment, wrong fixture, or a packet whose derived purpose, cooperation context, jurisdiction, or requested export differs from the frozen variant definition. Control-fixture validation rejects a non-lowercase, non-64-character digest, duplicate control fixture ID, mismatched embedded ID or version, invalid payload, or a recomputed control-fixture digest mismatch.

`evaluationDefinitionSetDigest` is the lowercase 64-character SHA-256 hexadecimal digest of the UTF-8 canonical JSON encoding of `EvaluationDefinitionSetDigestProjection` version `1.0.0`. Definitions use the declared `EvaluationVariantId` order. Within each definition, the input packet's selected segment IDs preserve frozen order; expected checks are sorted by check name, gate names use declared `EvaluationAdmissionGateName` order, allowed terminal statuses use their declaration order, and control scenarios are sorted by `scenarioId`. Required repetitions preserve their frozen tuple order. Canonical JSON recursively sorts object keys by Unicode codepoint, preserves those normalized array orders, contains no `undefined`, and preserves exact serialized strings, numbers, booleans, and nulls. Filesystem enumeration and object insertion order must not affect the digest.

`reportDigest` is a lowercase 64-character SHA-256 hexadecimal digest of the UTF-8 canonical JSON representation of the complete report with only `reportDigest` omitted. Canonical JSON recursively sorts object keys by Unicode codepoint, preserves array order, contains no `undefined`, and uses the exact serialized strings and numbers in the report. Report evidence is sorted by variant ID, split, repetition, scenario ID with null before strings, then evidence ID. Gates use the declared `EvaluationAdmissionGateName` order, and each gate's references are sorted by variant ID, split, then evidence ID. `generatedAt` remains in the digested payload. Recomputing the digest for one stored artifact must produce the same value; changing any bound field must change it.

Each strict versioned `EvaluationDefinition` declares exactly one immutable complete `EvaluationInputPacket`, execution requirement, exact repetitions, checks, gates, and execution expectations. Before an evaluation run, the runner rebuilds that variant's packet from the trusted fixture and rejects any packet ID, ordered segment list, redacted-input digest, purpose or cooperation context, jurisdiction, requested export, or packet digest mismatch. `PrivateLiveEvaluationRequest` must carry the exact definition packet ID and digest, plus the same selected segments and redacted-input digest. Every evidence record must repeat the exact packet ID and digest of its definition. Model-output variants require `live_model_run`; forced timeout, transport, malformed-envelope, reducer, and other adapter-control variants require `deterministic_control`. Every control definition names each required scenario separately. Every evidence and gate-reference `variantId` must match exactly one frozen definition, whose fixture ID remains `CFN-DEMO-001`. A passed report requires every gate exactly once and passed, exact evidence cardinality for every development and held-out definition, and exact conformance to the frozen definition. Every `live_model_run` variant requires repetitions `1`, `2`, and `3`, `scenarioId: null`, globally unique non-null run IDs, `executionSource: live_provider`, `actualProviderTransmission: true`, and an allowed genuine terminal live result from the report's exact release. Every deterministic control scenario requires repetition `1`, its exact scenario ID, exact control fixture ID, version, digest, and payload, declared deterministic or mock-control source, `actualProviderTransmission: false`, exact simulated transmission and terminal state, and a unique evidence ID; it always has `analysisRunId: null`, and `simulatedRunId` is non-null exactly when the definition requires it. Not-run and deterministic-harness records for a deterministic-control scenario also repeat the exact control fixture ID, version, and digest. Live-model records and not-run live-model records set all control fixture fields to null. Gate evidence IDs must resolve to report evidence in the same variant. A complete report with any failed gate is `failed`. Missing, duplicate, not-run, wrong-variant, wrong-packet, wrong-scenario, wrong-control-fixture, wrong-source, wrong-cardinality, wrong-transmission, wrong-terminal, unreferenced, or wrong-release evidence makes the report `incomplete`. A mock or deterministic-control record can satisfy only a definition frozen as `deterministic_control`; it can never substitute for a required live model run. The evaluation-definition-set digest is computed from canonical JSON of the complete ordered strict definitions and therefore binds the report to exact source packets, expected answers, splits, gates, per-variant execution requirements, control fixtures, and control scenarios.

Evidence and report statuses are derived, never independently asserted. A complete executed evidence record is `passed` exactly when every definition-required check appears once and passes, and `failed` exactly when every required check appears once and at least one fails. `not_run` has no execution, no run time, null actual run ID, and only the definition's planned release and not-run markers. `DeterministicHarnessResult` is a separate zero-network mock-harness artifact used to exercise every definition in CI. It never enters `ProviderEvaluationAdmissionReport.evidence` and cannot support live admission, including for a model-output definition. A gate is `passed` exactly when all required, definition-matched admission evidence records for that gate are complete and passed; it is `failed` exactly when that complete set contains a failed record; otherwise it is `not_run`. A report is `passed` only when its complete gate set is passed, `failed` only when its complete gate set contains a failed gate, and `incomplete` otherwise. Any mismatch between evidence status, checks, gate references, or report status rejects the artifact before digest or static handoff.

Failed fixtures remain in the denominator and visible in the Safety Lab. Every genuine live or replay result identifies the exact provider, release configuration, requested and returned model, adapter, service tier, disclosure version, inference setting, and actual transmission state. A deterministic control identifies the planned correlated live release, actual no-network state, and simulated scenario state without fabricating provider provenance. A not-run result retains the planned correlated release and uses a null run ID.

The evaluation harness produces a versioned admission report and canonical digest but cannot change runtime admission. A separate static handoff verifies the report identity, digest, exact release, adapter, settings, fixture, prompt, schemas, ruleset, frozen per-variant execution requirements, genuine live run provenance where required, exact deterministic-control provenance where required, evidence IDs, terminal outcomes, transmission states, cardinality, and every blocking gate before recording `passed`, `failed`, or fail-closed `not_evaluated` status. Mocked, replayed, or deterministic evidence in place of a required live model run always maps to fail-closed `not_evaluated`. No runtime file read, environment value, or provider response may promote a release.

## 24. Local mutation contracts

P0 has no case-mutation network API. Purpose, masks, live-run lifecycle, replay, citation resolution, review, gaps, dependencies, gate evaluation, exports, source reveal, unsafe-output reporting, checkpoint load, and reset are typed local reducer commands. Only the stateless live execution request crosses the server boundary.

```ts
type CommandMeta = {
  commandId: string;
  idempotencyKey: string;
  expectedCaseRevision: number;
  actor: "current_practitioner";
  createdAt: string;
};

type PendingLiveAnalysis = {
  startCommandId: string;
  sourceCaseRevision: number;
  request: AnalyzeRequest;
  recovery: LiveAnalysisRecoveryMetadata;
  requestedAt: string;
};

type CoverageReviewIntent = {
  issueId: string;
  limitationText: string;
  reason: string;
  reviewedConsequence: "consequential" | "non_consequential";
};

type LocalMaskSuggestionInput = {
  segmentId: string;
  originalStart: number;
  originalEnd: number;
  maskClass: MaskClass;
  replacementToken: string;
};

type CaseCommand =
  | { meta: CommandMeta; type: "save_purpose"; purposeBrief: CasePurposeBrief }
  | { meta: CommandMeta; type: "begin_fixture_processing" }
  | { meta: CommandMeta; type: "complete_fixture_processing"; result: FixtureProcessingResult }
  | { meta: CommandMeta; type: "fail_fixture_processing"; stageName: FixtureProcessingStageName; safeErrorCode: SafeErrorCode }
  | { meta: CommandMeta; type: "retry_fixture_processing_stage"; stageName: FixtureProcessingStageName }
  | { meta: CommandMeta; type: "refresh_mask_suggestions"; sensitiveTerms: string[] }
  | { meta: CommandMeta; type: "add_mask_suggestion"; input: LocalMaskSuggestionInput }
  | { meta: CommandMeta; type: "remove_mask_suggestion"; maskId: string }
  | { meta: CommandMeta; type: "review_mask"; maskId: string; reviewStatus: MaskSuggestion["reviewStatus"]; replacementToken: string }
  | { meta: CommandMeta; type: "complete_mask_review" }
  | { meta: CommandMeta; type: "start_live_analysis"; request: AnalyzeRequest; recoveryOfRunId: string | null }
  | { meta: CommandMeta; type: "complete_live_analysis"; startCommandId: string; response: Extract<AnalyzeResponse, { outcome: "succeeded" }> }
  | { meta: CommandMeta; type: "fail_live_analysis"; startCommandId: string; response: Extract<AnalyzeResponse, { outcome: "failed" }> }
  | { meta: CommandMeta; type: "reject_live_analysis_preflight"; startCommandId: string; response: Extract<AnalyzeResponse, { outcome: "rejected_before_run" }> }
  | { meta: CommandMeta; type: "record_live_analysis_transport_failure"; startCommandId: string; reasonCode: AnalysisTransportFailureReason }
  | { meta: CommandMeta; type: "run_deterministic_replay"; request: ReplayRequest }
  | { meta: CommandMeta; type: "resolve_citation"; candidateId: string; citationId: string; selectedSegmentId: string; selectedRedactedSegmentRange: { start: number; end: number } }
  | { meta: CommandMeta; type: "review_candidate"; intent: ReviewIntent }
  | { meta: CommandMeta; type: "respond_context_gap"; intent: ContextGapResponseIntent }
  | { meta: CommandMeta; type: "review_coverage_issue"; intent: CoverageReviewIntent }
  | { meta: CommandMeta; type: "withdraw_candidate"; candidateId: string; reason: string }
  | { meta: CommandMeta; type: "reveal_source"; citationId: string; reasonCode: "explicit_synthetic_source_review" }
  | { meta: CommandMeta; type: "evaluate_export_gate"; selection: ExportSelection }
  | { meta: CommandMeta; type: "create_export"; selection: ExportSelection }
  | { meta: CommandMeta; type: "report_unsafe_output"; entityIds: string[]; reasonCode: "prohibited_claim" | "privacy_concern" | "citation_problem" | "other_safe_category" }
  | { meta: CommandMeta; type: "load_demo_checkpoint"; checkpointBundleId: DemoCheckpointBundleId }
  | { meta: CommandMeta; type: "reset_case" };
```

`CommandMeta` is caller-supplied only for `current_practitioner`. Trusted checkpoint activation internally derives fixture-reviewer provenance for its frozen records and audit history, while system-generated audit fields are never caller command authority. The reducer rejects a stale revision or a command ID or idempotency key already linked in the persisted audit. It validates every transition centrally and never trusts a component to set case status, citation status, support status, gate readiness, recovery linkage, dependency impacts, or fixture-reviewer authority directly. Unsafe-output reports contain safe categories and entity IDs only, never pasted evidence or identifiers.

`begin_fixture_processing` starts only the fixed bundled-fixture pipeline. `complete_fixture_processing` accepts no raw source text, PDF bytes, URL, provider result, or arbitrary segment content. Before mutation, the reducer revalidates the result's exact fixture binding, documents, page states, selected segment IDs, coverage counts and issues, and stage transitions against the trusted fixture plus the deterministic TASK-005 and TASK-006 services. A mismatch fails closed. `fail_fixture_processing` accepts only one affected `FixtureProcessingStageName` and a safe code derived by that service. `retry_fixture_processing_stage` is allowed only for one fixed retryable failed fixture stage and reruns the same local deterministic service. `candidate_extraction`, `citation_validation`, `timeline_nexus_assembly`, and `safety_export_gate_checks` transition only through the explicit live-analysis or replay lifecycle and have no fixture-processing retry command. `complete_mask_review` recomputes the leak scan from canonical fixture text and current approved mask state; it cannot accept a caller-supplied passed status. These commands append safe audit events, increment case revision only on material completion or failure, and stale prior analysis or export state where applicable.

`refresh_mask_suggestions` is a browser-local, ephemeral detector request. Its `sensitiveTerms` are used only for the synchronous local TASK-006 scan against trusted fixture text, then discarded. They are never appended to state, audit summaries, persistence, logs, provider requests, exports, errors, or telemetry. The reducer records only safe counts, mask classes, and segment IDs. `add_mask_suggestion` and `remove_mask_suggestion` accept only safe segment IDs, canonical ranges, classes, and allowlisted replacement tokens. The reducer validates the range against canonical local text, rejects overlap or unknown segments, derives the safe suggestion ID and redaction map, and invalidates mask approval. These three commands append only safe audit events, increment masking and case revision when their derived suggestion set changes, and stale dependent runs and exports.

`review_coverage_issue` accepts only an open known issue, a non-empty limited limitation text and reason, and one explicit non-unknown reviewed consequence. The reducer appends one immutable `CoverageReviewDecision`, changes the issue to `reviewed_limitation`, retains its immutable initial consequence, records the reviewed consequence and linked decision ID, keeps the source issue visible, appends a safe audit event, increments case revision, and recalculates affected candidate support and gate state. The full limitation and reason live only in the decision ledger, not in the audit summary. It cannot create missing source content, mark an issue resolved, or silently change a consequential or unknown issue. A source issue becomes `resolved` only when a later deterministic processing result confirms that the underlying page or segment is available.

`start_live_analysis` validates current purpose, masking, leak scan, selected release, acknowledgement, case revision, and the absence of another pending request before any network call. A non-null recovery link must resolve to a preserved failed run whose safe failure permits either a same-provider retry or the explicitly selected live-provider switch. Replay recovery is invalid for this command and is validated only by `run_deterministic_replay`. The reducer derives the selection reason and always records practitioner selection, `automaticFailover: false`, and `outputsMerged: false`. Starting a request does not increment `caseRevision`. While a request is pending, every material case command is rejected except its matching terminal, preflight-rejection, or transport-failure command and `reset_case`.

A terminal live response is accepted only for the matching pending command and unchanged source case revision. Success or started failure atomically appends and activates the server execution after attaching the locally derived recovery metadata. A successful activation replaces current run-scoped data with only that run's output. A failed activation clears current run-scoped findings and gate state. A preflight rejection clears the pending request, appends a safe audit event, creates no run, and preserves the previously active run.

If the browser receives no parseable `AnalyzeResponse`, `record_live_analysis_transport_failure` accepts only the matching pending start and unchanged source revision, clears pending state, appends `analysis_transport_failed` with `CLIENT_TRANSPORT_FAILURE` and the safe reason code, creates no run, and preserves the previously active run. It states that the remote execution outcome is unknown and no output was accepted. A later explicit attempt starts as a new unlinked attempt because no verified failed run exists. Replay remains local and never calls `POST /api/analyze`.

`resolve_citation` accepts only a candidate and citation in the active successful run whose current status is `ambiguous_match`. The selected segment must remain the citation's existing canonical segment, and the selected range must exactly match one option recomputed by the pure citation resolver. The reducer derives the `manually_resolved` citation, appends a `CitationResolutionDecision` and safe audit event, increments case revision, stales the export gate, recalculates affected support, and never auto-accepts or reinstates a review decision.

`review_candidate` accepts only a `ReviewIntent`. The reducer validates the active candidate and action, then derives and appends the full `ReviewDecision` through the review policy. `withdraw_candidate` remains the sole input path that may derive a withdrawal decision and dependency transition.

If a future pilot moves a command to a server route, it requires a separately versioned request, success response, safe error, authorization check, and revision conflict behavior before use.

## 25. Root case state

```ts
type CaseState = {
  schemaVersion: "1.0.0";
  caseId: "CFN-DEMO-001";
  caseRevision: number;
  caseStatus: CaseStatus;
  fixtureVersion: "1.0.0";
  guidancePack: GuidancePackIdentity;
  purposeBrief: CasePurposeBrief | null;
  documents: DocumentRecord[];
  segments: SourceSegment[];
  selectedSegmentIds: string[];
  masking: MaskingReview;
  coverage: CoverageSummary;
  coverageReviews: CoverageReviewDecision[];
  processing: ProcessingStage[];
  pendingLiveAnalysis: PendingLiveAnalysis | null;
  analysisRuns: AnalysisRun[];
  activeAnalysisRunId: string | null;
  citations: Citation[];
  citationResolutions: CitationResolutionDecision[];
  candidates: CaseCandidate[];
  reviews: ReviewDecision[];
  dependencyChanges: DependencyChange[];
  audit: AuditEvent[];
  exportGate: ExportGate | null;
  exports: ExportRecord[];
  currentExportId: string | null;
  currentExportManifest: ExportManifest | null;
  exportedRevision: number | null;
  lastUpdatedAt: string;
};
```

Raw PDF bytes, provider prompts, provider response bodies, API keys, and generated PDF blobs are not part of persisted `CaseState`.

`CaseState.selectedSegmentIds` is ordered, unique, and contains only known model-visible synthetic fixture segments. It is the single active source-selection collection; a selector does not persist a second parallel document-selection structure.

```ts
type PersistedCaseState = {
  schemaVersion: "1.0.0";
  storageKey: "contextfirst-nexus.case-state.v1";
  persistedAt: string;
  caseId: "CFN-DEMO-001";
  fixtureVersion: "1.0.0";
  canonicalFixtureDigest: string;
  guidancePack: GuidancePackIdentity;
  caseRevision: number;
  purposeBrief: CasePurposeBrief | null;
  selectedSegmentIds: string[];
  documents: DocumentRecord[];
  masking: MaskingReview;
  coverage: CoverageSummary;
  coverageReviews: CoverageReviewDecision[];
  processing: ProcessingStage[];
  analysisRuns: AnalysisRun[];
  activeAnalysisRunId: string | null;
  citations: Citation[];
  citationResolutions: CitationResolutionDecision[];
  candidates: CaseCandidate[];
  reviews: ReviewDecision[];
  dependencyChanges: DependencyChange[];
  audit: AuditEvent[];
  exportGate: ExportGate | null;
  exports: ExportRecord[];
  currentExportId: string | null;
  currentExportManifest: ExportManifest | null;
  exportedRevision: number | null;
  lastUpdatedAt: string;
};
```

`CaseState` is the in-memory domain aggregate. The `sessionStorage` serializer writes only the strict `PersistedCaseState` root and never serializes `SourceSegment`, including `rawText`, PDF bytes, object URLs, provider request or response bodies, prompts, keys, cookies, generated export blobs, or `pendingLiveAnalysis`. It may serialize only the current redacted safe `ExportManifest`, never a PDF or separate renderer artifact. On restore, it validates the exact storage key, schema version, case ID, fixture version, current bundled guidance-pack identity, ordered selected segment IDs, and every referenced document, segment, run, citation, candidate, coverage-review decision, review, dependency change, audit, export, and current-manifest relationship against the trusted bundled fixture and canonical contracts. A guidance-pack identity mismatch replaces the stored identity with the current trusted identity, increments case revision, clears `exportGate`, `currentExportId`, `currentExportManifest`, and `exportedRevision`, and returns a re-derived non-exported state. It recomputes the saved manifest hash and validates that its ID, ready current gate, record, revision, selected run, guidance-pack identity, and reviewed coverage limitations match `currentExportId` and `exportedRevision`; it runs the declared-identifier leak scan over all persisted text-bearing safe projections, including that manifest. It then rehydrates read-only segments from that fixture and derives `caseStatus`; it never trusts a serialized status or resumes a request. An unknown major version, unknown field, invalid relation, raw-source field, failed leak scan, hash mismatch, or payload above 1 MB fails closed to Reset Case. Writes pause while `pendingLiveAnalysis` is non-null, leaving the last validated stable snapshot untouched. Completed citation-resolution decisions contain redacted ranges and safe IDs only and may be included.

`ExportRecord` is append-only. Whether an export is current is derived from `currentExportId`, `currentExportManifest`, `exportedRevision`, and the current case revision; a later material change clears those current pointers and manifest without mutating an earlier export record.

When promoting a terminal live execution, the browser derives `RunInputStateProvenance` from the one matching pending request and current approved masking state, recomputes its approved-redacted-input digest, and appends it immutably with the new run. Replay and checkpoint activation derive the same provenance from their validated trusted bundle. `sourceCaseRevision` is used only to correlate the pending request with its terminal response and to preserve start provenance. It is never an export-staleness comparison because review and other post-analysis actions intentionally advance `caseRevision`. A run is stale for export whenever its stored purpose ID or revision, masking revision, ordered selected segment IDs, approved-redacted-input digest, or fixture binding no longer matches the current eligible analysis input. Restore and gate evaluation use this immutable provenance, never an inferred count or current provider response, to determine `ANALYSIS_RUN_STALE`.

`analysisRuns` is append-only within the current browser case. `activeAnalysisRunId` is null before a run is selected and otherwise resolves to exactly one preserved run. Current candidate and citation arrays are empty for an active failed run and contain data from only the active successful run. Activating a retry, alternate provider, or replay run never copies or merges outputs from another run.

`reviews`, `citationResolutions`, and `dependencyChanges` are active-run ledgers. They are append-only while the same active successful run and its candidate and citation set remain current. Activating a new successful run, failed run, alternate provider run, or ordinary replay clears the current run-scoped `reviews`, `citationResolutions`, and `dependencyChanges` arrays together with current candidates, current citations, stale gate state, current export pointers, and current export manifest. It preserves `analysisRuns`, safe audit history, immutable historical export records, coverage reviews, purpose, documents, segments, masking, coverage, processing, and guidance identity. `load_demo_checkpoint` is the explicit exception for prerequisite state only: after validating the trusted checkpoint bundle, it preserves `analysisRuns`, safe audit history, and immutable historical export records; clears prior `reviews`, `citationResolutions`, `dependencyChanges`, gate state, current export pointers, and current export manifest; appends the checkpoint run; makes it active; and atomically replaces purpose, documents, segments, masking, coverage, `coverageReviews`, processing, current candidates, current citations, and ordered fixture-reviewer decision state with the checkpoint prerequisite state. Current guidance identity remains the trusted bundled pack. A reducer must not retain dangling review, citation-resolution, or dependency-change records that target candidates or citations from a non-active run. Historical audit and export records remain the safe explanatory history for prior runs.

Timeline, Nexus, and context-gap selectors derive from `candidates` on every read and return the corresponding `CaseCandidate` branch. Commands mutate one canonical candidate record by ID, so review, context response, withdrawal, dependency invalidation, gate evaluation, persistence, replay, and checkpoint loading cannot drift across mirrored arrays.

Case status is derived, not freely set by UI components:

1. `processing` while any required stage is active.
2. `processing_failed` when a required current stage failed.
3. `draft` before purpose and analysis prerequisites are complete.
4. `blocked` when a non-review critical gate is open.
5. `review_required` while an individually required candidate is pending or invalidated.
6. `ready_to_export` when the current export gate is ready and no current export has been created.
7. `exported` only when `currentExportId` and `currentExportManifest` are both non-null and their record and manifest match `exportedRevision`, which equals the current case revision.

Every material purpose, authority, mask, evidence, context, review, guidance, run, or minimum-necessity change increments `caseRevision`. A prior gate becomes stale and a prior export remains immutable but becomes non-current.

## 26. Cross-contract invariants

These invariants are mandatory test targets:

1. Evidence nature, item origin, support status, and review status remain separate.
2. Every source-supported portion resolves to an exact or manually resolved citation.
3. Every active candidate marked `individual` is reviewed before export; derived summaries never create duplicate approval.
4. No bulk approval API or state action exists.
5. Invalid citations cannot be accepted or exported.
6. Evidence withdrawal invalidates only reachable downstream decisions and revokes export readiness.
7. Cooperation value does not alter evidence, Nexus, or protection-analysis output.
8. Unknown remains distinct from false, absent, or negative.
9. Model output cannot decide support, review, export, or legal status.
10. Only dedicated export-safe projections of reviewed, redacted, purpose-bound content enter an export.
11. Replay and live analysis are distinguishable in every run and export.
12. The API never returns sensitive internal errors or logs raw case content.
13. Cycles in dependencies are rejected.
14. Missing or unreadable consequential coverage blocks affected export.
15. Guidance cannot become case evidence or unverified domestic law.
16. The export kind matches the current Purpose Brief and PDF and JSON remain formats of the same manifest.
17. A withdrawn candidate is excluded without permanently blocking export, while active affected dependants require renewed review.
18. A stale case revision, analysis run, mask review, or export gate cannot authorize export.
19. Canonical instruction-like evidence remains visible but cannot become candidate support or export content.
20. Prepared checkpoint decisions retain fixture-reviewer provenance.
21. Practitioner-facing provider choice is superseded. TASK-040 must version a provider-neutral browser intent and managed attempt contract; users never select releases or API keys.
22. Managed live routing advances only for approved classified operational failures and never enters replay mode. Unknown remote execution, partial/accepted output, and every safety or validation failure stop routing.
23. Current candidates, citations, reviews, the current gate, current export pointers, and current export manifest belong to exactly one active successful run. Immutable historical `ExportRecord[]` entries remain explanatory history and are excluded from this current-run ownership rule. Outputs from separate runs are never copied or merged, even when they use the same fixture or provider.
24. Provider availability errors remain safe, and managed progression cannot bypass a privacy, citation, prohibited-output, semantic-safety, malformed-output, injection, or unknown-execution failure.
25. System cards, evaluation results, audit records, and exports identify the exact provider, release configuration, service tier, model, disclosure, transmission state, and recovery linkage that actually applied.
26. Every live request matches the selected registry entry's sole `bundled_synthetic` fixture binding, fixture version, and canonical digest before provider transmission.
27. Managed live routing preserves OpenAI `1`, Google Gemini `2`, Mistral `3`, then a separately evaluated/admitted fourth live slot. Local replay is outside this order.
28. Every P0 provider request is non-streaming, and one selected application run cannot assemble a result from partial streamed output.
29. The stateless live API never receives or claims recovery linkage. Only the browser reducer may attach recovery metadata after verifying its preserved failed-run history and the permitted recovery class.
30. A pending live request is in-memory only. Starting it does not increment `caseRevision`, material mutations are blocked while it is pending, and a terminal response activates atomically only when its start command and source case revision still match.
31. Manual citation resolution is a central command with an active-run decision and durable audit record. A component cannot set citation validity or review status directly.
32. Every command-derived audit event carries its opaque command ID and idempotency key. The reducer rejects a reused value by scanning persisted audit links before mutation, including after restore.
33. Runtime provider admission changes only through a reviewed static admission handoff that matches a versioned evaluation report. Environment values, runtime files, and provider responses cannot promote a release.
34. A missing or unparseable browser response clears pending state only through `record_live_analysis_transport_failure`, creates no run or recovery link, preserves the prior active run, and records that no output was accepted.
35. Session persistence pauses while a live request is pending. Refresh restores the prior validated stable snapshot, re-derives case status, and never resumes or retries the request.
36. `CaseState.candidates` is the sole candidate source of truth. Timeline, Nexus, and context-gap collections are derived selectors and are never independently mutable or persisted.
37. Replay and checkpoint commands accept only compile-time trusted bundle IDs. A resolved bundle contains exactly one successful local replay run, and all candidates, citations, decisions, dependencies, and counts validate against that single run before atomic activation.
38. Ordinary replay preserves the current validated purpose and masking state. The prepared checkpoint may load prerequisite state only from its trusted fixture bundle, with complete purpose, approved masks, passed leak scan, exact fixture records, and fixture-reviewer attribution.
39. `review_candidate` accepts a narrow `ReviewIntent`; the reducer derives the active-run `ReviewDecision`. Withdrawal remains a separate command and cannot be smuggled through review intent.
40. Preflight and transport outcomes that create no run appear only in `SystemCard.nonRunAttempts` with safe start-command and audit linkage. They never receive a fabricated run ID or accepted output.

## 27. Contract acceptance checklist

- All shared enums have one canonical spelling.
- Every persisted and exported root has a version.
- All fixture IDs in `docs/DEMO_AND_FIXTURES.md` are representable.
- API input is narrower than browser case state.
- Model proposals are narrower than reviewed application records.
- Deterministic code owns citations, support derivation, dependencies, audit, and export readiness.
- Safe errors reveal no raw content.
- Provider availability and disclosure projections reveal no keys, internal endpoints, raw environment values, or provider bodies.
- The Mistral release is the exact unpaid `mistral-small-free-v1` configuration using `mistral-small-2603` and reasoning effort `medium`, and is unavailable until matching passed reviewed static admission and coordinator-recorded deployed-account availability are present.
- Service-tier unavailability has a safe availability status, failure classification, and error code.
- Provider options and recovery options have deterministic display ordering, with replay after all live releases.
- Every provider transmission is limited to the exact registry-bound bundled fixture and canonical digest.
- Practitioner-facing live provider selection is superseded by DEC-045; TASK-040 must version and test bounded server-managed routing before runtime adoption.
- Run history preserves failed attempts while active outputs remain single-run and unmerged.
- Trusted replay and checkpoint bundles fail closed on any count, ownership, fixture, version, purpose, masking, or provenance mismatch and never accept browser-supplied artifact data.
- System cards distinguish terminal runs from safe non-run attempt projections.
- Full practitioner and safe-share handoff kinds use one versioned manifest schema and are exercised as separate purpose-bound flows.
- State transitions needed by the hero demo are explicit and testable.
- No contract contains a prohibited score or automated legal conclusion.
