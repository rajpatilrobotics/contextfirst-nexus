import { z } from "zod";

const VERSION = "1.0.0" as const;

export const ContractVersions = {
  caseState: VERSION,
  analysisRequest: VERSION,
  analysisResponse: VERSION,
  providerRegistry: VERSION,
  providerDisclosure: VERSION,
  replay: VERSION,
  replayBundle: VERSION,
  demoCheckpoint: VERSION,
  checkpointPostDecisionHashProjection: VERSION,
  approvedRedactedInputDigestProjection: VERSION,
  privateLiveEvaluation: VERSION,
  evaluationDefinition: VERSION,
  evaluationDefinitionSetDigestProjection: VERSION,
  evaluationResult: VERSION,
  providerEvaluationAdmissionReport: VERSION,
  systemCard: VERSION,
  persistedCaseState: VERSION,
  reviewedExportStateHashProjection: VERSION,
  exportManifest: VERSION,
  fixture: VERSION,
  prompt: VERSION,
  guidancePack: VERSION,
} as const;

export type ContractVersions = typeof ContractVersions;

const literalVersion = z.literal(VERSION);
const strict = z.strictObject;
const nonEmptyString = z.string().trim().min(1);
const safeText = z.string().trim().min(1).max(4_000);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const isoUtcTimestamp = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/);
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nonNegativeInteger = z.number().int().min(0);
const positiveInteger = z.number().int().positive();
const finiteNumber = z.number().finite();

const rangeSchema = strict({
  start: nonNegativeInteger,
  end: positiveInteger,
}).refine((range) => range.end > range.start, {
  message: "Character ranges use inclusive start and exclusive end.",
});

export const IdSchemas = {
  caseId: z.string().regex(/^CFN-[A-Z0-9-]+$/),
  purposeBriefId: z.string().regex(/^PURPOSE-[A-Z0-9-]+$/),
  documentId: z.string().regex(/^D\d{2}$/),
  pageId: z.string().regex(/^D\d{2}-P\d+$/),
  segmentId: z.string().regex(/^D\d{2}-(?:P\d+-S\d+|META-\d+)$/),
  candidateId: z.string().regex(/^(?:CAND|NEXUS)-[A-Z0-9-]+$/),
  nonNexusCandidateId: z.string().regex(/^CAND-[A-Z0-9-]+$/),
  nexusCandidateId: z.string().regex(/^NEXUS-[A-Z0-9-]+$/),
  reviewDecisionId: z.string().regex(/^REVIEW-[A-Z0-9-]+$/),
  auditEventId: z.string().regex(/^AUDIT-[A-Z0-9-]+$/),
  analysisRunId: z.string().regex(/^RUN-[A-Z0-9-]+$/),
  exportId: z.string().regex(/^EXPORT-[A-Z0-9-]+$/),
  guidanceSourceId: z.string().regex(/^[A-Z]+-\d{3}[A-Z]?$/),
} as const;

export const EvidenceNatureSchema = z.enum([
  "documented_in_source",
  "reported_or_alleged_in_source",
  "reviewer_supplied_context",
  "unknown",
]);
export type EvidenceNature = z.infer<typeof EvidenceNatureSchema>;

export const ItemOriginSchema = z.enum([
  "source_extraction",
  "ai_suggestion",
  "human_created",
]);
export type ItemOrigin = z.infer<typeof ItemOriginSchema>;

export const SupportStatusSchema = z.enum([
  "exact_source_supported",
  "partially_supported",
  "conflicting",
  "insufficient_evidence",
  "citation_unresolved",
  "not_processed",
]);
export type SupportStatus = z.infer<typeof SupportStatusSchema>;

export const ReviewStatusSchema = z.enum([
  "pending",
  "human_accepted",
  "human_edited",
  "rejected",
  "uncertain",
  "invalidated",
]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const ReviewLaneSchema = z.enum([
  "trafficking_indicators",
  "non_punishment_relevance",
  "protection_remedy_urgency",
]);
export type ReviewLane = z.infer<typeof ReviewLaneSchema>;

export const StageStatusSchema = z.enum([
  "pending",
  "active",
  "completed",
  "warning",
  "failed",
]);
export type StageStatus = z.infer<typeof StageStatusSchema>;

export const DataOriginSchema = z.literal("bundled_synthetic");
export const AnalysisModeSchema = z.enum(["live", "deterministic_replay"]);
export const LiveProviderIdSchema = z.enum(["openai", "google_gemini", "mistral"]);
export const ProviderIdSchema = z.enum([
  "openai",
  "google_gemini",
  "mistral",
  "local_replay",
]);
export const LiveProviderReleaseConfigurationIdSchema = z.enum([
  "openai-quality-v1",
  "gemini-quality-v1",
  "mistral-small-free-v1",
]);
export const ProviderReleaseConfigurationIdSchema = z.enum([
  "openai-quality-v1",
  "gemini-quality-v1",
  "mistral-small-free-v1",
  "prepared-replay-v1",
]);
export const ProviderServiceTierSchema = z.enum(["paid", "unpaid", "local"]);

export type LiveProviderId = z.infer<typeof LiveProviderIdSchema>;
export type ProviderId = z.infer<typeof ProviderIdSchema>;
export type LiveProviderReleaseConfigurationId = z.infer<
  typeof LiveProviderReleaseConfigurationIdSchema
>;

export const ProviderDisplayOrderById = {
  openai: 1,
  google_gemini: 2,
  mistral: 3,
  local_replay: 4,
} as const;

export const ProviderReleaseConfigurationSchema = z.discriminatedUnion(
  "providerId",
  [
    strict({
      providerId: z.literal("openai"),
      releaseConfigurationId: z.literal("openai-quality-v1"),
      requestedModel: z.literal("gpt-5.6-sol"),
      serviceTier: z.literal("paid"),
    }),
    strict({
      providerId: z.literal("google_gemini"),
      releaseConfigurationId: z.literal("gemini-quality-v1"),
      requestedModel: z.literal("gemini-3.5-flash"),
      serviceTier: z.literal("unpaid"),
    }),
    strict({
      providerId: z.literal("mistral"),
      releaseConfigurationId: z.literal("mistral-small-free-v1"),
      requestedModel: z.literal("mistral-small-2603"),
      serviceTier: z.literal("unpaid"),
    }),
    strict({
      providerId: z.literal("local_replay"),
      releaseConfigurationId: z.literal("prepared-replay-v1"),
      requestedModel: z.literal("frozen_replay_output"),
      serviceTier: z.literal("local"),
    }),
  ],
);
export type ProviderReleaseConfiguration = z.infer<
  typeof ProviderReleaseConfigurationSchema
>;

export const LiveProviderReleaseConfigurationSchema =
  ProviderReleaseConfigurationSchema.refine(
    (release) => release.providerId !== "local_replay",
    { message: "Live release must not be local replay." },
  );
export type LiveProviderReleaseConfiguration =
  | Extract<ProviderReleaseConfiguration, { providerId: "openai" }>
  | Extract<ProviderReleaseConfiguration, { providerId: "google_gemini" }>
  | Extract<ProviderReleaseConfiguration, { providerId: "mistral" }>;
export type ReplayReleaseConfiguration = Extract<
  ProviderReleaseConfiguration,
  { providerId: "local_replay" }
>;

export const ProviderReleaseSelectionSchema = z.discriminatedUnion("providerId", [
  strict({
    providerId: z.literal("openai"),
    releaseConfigurationId: z.literal("openai-quality-v1"),
    serviceTier: z.literal("paid"),
  }),
  strict({
    providerId: z.literal("google_gemini"),
    releaseConfigurationId: z.literal("gemini-quality-v1"),
    serviceTier: z.literal("unpaid"),
  }),
  strict({
    providerId: z.literal("mistral"),
    releaseConfigurationId: z.literal("mistral-small-free-v1"),
    serviceTier: z.literal("unpaid"),
  }),
  strict({
    providerId: z.literal("local_replay"),
    releaseConfigurationId: z.literal("prepared-replay-v1"),
    serviceTier: z.literal("local"),
  }),
]);
export type ProviderReleaseSelection = z.infer<
  typeof ProviderReleaseSelectionSchema
>;

export const AnalyzeLiveProviderSelectionSchema =
  ProviderReleaseSelectionSchema.refine(
    (selection) => selection.providerId !== "local_replay",
    { message: "AnalyzeRequest accepts live providers only." },
  );
export type AnalyzeLiveProviderSelection = Extract<
  ProviderReleaseSelection,
  { providerId: LiveProviderId }
>;

export const ProviderStorageModeSchema = z.enum([
  "openai_store_false",
  "gemini_stateless_unpaid",
  "mistral_stateless_free",
  "local_no_transmission",
]);
export const ProviderRetentionSettingSchema = z.enum([
  "openai_store_false",
  "gemini_unpaid_default",
  "mistral_free_30_day_default",
  "local_no_provider_retention",
]);

export const ProviderFixtureBindingSchema = strict({
  dataOrigin: z.literal("bundled_synthetic"),
  caseId: z.literal("CFN-DEMO-001"),
  fixtureVersion: literalVersion,
  canonicalFixtureDigest: sha256,
});
export type ProviderFixtureBinding = z.infer<typeof ProviderFixtureBindingSchema>;

export const ProviderEvaluationStatusSchema = z.enum([
  "not_evaluated",
  "passed",
  "failed",
]);
export const StaticServiceTierAvailabilitySchema = z.enum([
  "available",
  "unavailable",
]);
export const LiveProviderAvailabilityStatusSchema = z.enum([
  "available",
  "disabled",
  "not_evaluated",
  "evaluation_failed",
  "not_configured",
  "service_tier_unavailable",
  "deployed_account_release_unavailable",
  "data_policy_blocked",
]);

export const DeployedAccountReleaseAvailabilitySchema = z.discriminatedUnion(
  "status",
  [
    strict({
      status: z.literal("not_required"),
      evidenceId: z.null(),
      verifiedAt: z.null(),
    }),
    strict({
      status: z.literal("not_verified"),
      evidenceId: z.null(),
      verifiedAt: z.null(),
    }),
    strict({
      status: z.literal("available"),
      evidenceId: nonEmptyString,
      verifiedAt: isoUtcTimestamp,
    }),
    strict({
      status: z.literal("unavailable"),
      evidenceId: nonEmptyString,
      verifiedAt: isoUtcTimestamp,
    }),
  ],
);

export const ProviderReleaseInferenceSettingSchema = z.discriminatedUnion("kind", [
  strict({
    kind: z.literal("reasoning_effort"),
    value: z.literal("medium"),
  }),
  strict({
    kind: z.literal("thinking_level"),
    value: z.literal("medium"),
  }),
  strict({
    kind: z.literal("not_applicable"),
    value: z.literal("not_applicable"),
  }),
]);
export type ProviderReleaseInferenceSetting = z.infer<
  typeof ProviderReleaseInferenceSettingSchema
>;

export const EvaluatedReleaseConfigurationSchema =
  ProviderReleaseConfigurationSchema.and(
    strict({
      schemaVersion: literalVersion,
      adapterVersion: nonEmptyString,
      inferenceSetting: ProviderReleaseInferenceSettingSchema,
      disclosureVersion: literalVersion,
      fixtureBinding: ProviderFixtureBindingSchema,
      promptVersion: literalVersion,
      requestSchemaVersion: literalVersion,
      responseSchemaVersion: literalVersion,
      rulesetVersion: literalVersion,
      evaluationDefinitionSetDigest: sha256,
      evaluatedConfigurationDigest: sha256,
    }),
  ).superRefine((value, context) => {
    if (value.providerId === "openai" && value.inferenceSetting.kind !== "reasoning_effort") {
      context.addIssue({ code: "custom", message: "OpenAI uses reasoning_effort." });
    }
    if (value.providerId === "google_gemini" && value.inferenceSetting.kind !== "thinking_level") {
      context.addIssue({ code: "custom", message: "Gemini uses thinking_level." });
    }
    if (value.providerId === "mistral" && value.inferenceSetting.kind !== "reasoning_effort") {
      context.addIssue({ code: "custom", message: "Mistral uses reasoning_effort." });
    }
  });

export const ProviderReleaseAdmissionRecordSchema = strict({
  schemaVersion: literalVersion,
  releaseConfigurationId: LiveProviderReleaseConfigurationIdSchema,
  deployedAccountReleaseAvailability: DeployedAccountReleaseAvailabilitySchema,
  evaluatedConfiguration: EvaluatedReleaseConfigurationSchema,
  evaluationStatus: ProviderEvaluationStatusSchema,
  evaluationReportId: z.string().nullable(),
  evaluationReportDigest: sha256.nullable(),
  recordedAt: isoUtcTimestamp.nullable(),
}).superRefine((record, context) => {
  const isMistral = record.releaseConfigurationId === "mistral-small-free-v1";
  if (isMistral && record.deployedAccountReleaseAvailability.status === "not_required") {
    context.addIssue({ code: "custom", message: "Mistral cannot use not_required availability." });
  }
  if (!isMistral && record.deployedAccountReleaseAvailability.status !== "not_required") {
    context.addIssue({ code: "custom", message: "OpenAI and Gemini require not_required availability." });
  }
  if (record.evaluationStatus === "not_evaluated") {
    for (const key of ["evaluationReportId", "evaluationReportDigest", "recordedAt"] as const) {
      if (record[key] !== null) {
        context.addIssue({ code: "custom", message: "Not-evaluated admission uses null report fields." });
      }
    }
  } else if (!record.evaluationReportId || !record.evaluationReportDigest || !record.recordedAt) {
    context.addIssue({ code: "custom", message: "Evaluated admission requires report identity, digest, and time." });
  }
});
export type ProviderReleaseAdmissionRecord = z.infer<
  typeof ProviderReleaseAdmissionRecordSchema
>;

export const ProviderDisclosureProjectionSchema = strict({
  schemaVersion: literalVersion,
  disclosureVersion: literalVersion,
  serviceTierLabel: nonEmptyString,
  dataFlowSummary: nonEmptyString,
  storageMode: ProviderStorageModeSchema,
  retentionSetting: ProviderRetentionSettingSchema,
  retentionLimitation: nonEmptyString,
  trainingUseDisclosure: nonEmptyString,
  providerContentCategories: z.array(nonEmptyString),
  processingRegion: z.string().nullable(),
  allowedDataOrigins: z.tuple([z.literal("bundled_synthetic")]),
  providerTransmission: z.boolean(),
  rawPdfSentToProvider: z.literal(false),
  toolsEnabled: z.literal(false),
  acknowledgementRequired: z.literal(true),
  lastVerified: isoUtcTimestamp,
});
export type ProviderDisclosureProjection = z.infer<
  typeof ProviderDisclosureProjectionSchema
>;

export const ProviderOptionProjectionSchema = ProviderReleaseConfigurationSchema.and(
  strict({
    schemaVersion: literalVersion,
    displayOrder: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    displayName: nonEmptyString,
    modelDisplayName: nonEmptyString,
    modelAliasDisclosure: nonEmptyString,
    adapterVersion: nonEmptyString,
    mode: AnalysisModeSchema,
    providerTransmission: z.boolean(),
    evaluationStatus: z.union([ProviderEvaluationStatusSchema, z.literal("not_applicable")]),
    deployedAccountReleaseAvailabilityStatus: z.enum([
      "not_required",
      "not_verified",
      "available",
      "unavailable",
    ]),
    availabilityStatus: z.union([
      LiveProviderAvailabilityStatusSchema,
      z.literal("available"),
    ]),
    selectable: z.boolean(),
    disclosure: ProviderDisclosureProjectionSchema,
  }),
).superRefine((option, context) => {
  if (option.displayOrder !== ProviderDisplayOrderById[option.providerId]) {
    context.addIssue({ code: "custom", message: "Provider display order is frozen." });
  }
  if (option.providerId === "local_replay") {
    if (
      option.mode !== "deterministic_replay" ||
      option.providerTransmission !== false ||
      option.evaluationStatus !== "not_applicable" ||
      option.selectable !== true
    ) {
      context.addIssue({ code: "custom", message: "Replay option must remain local and selectable." });
    }
  } else if (option.mode !== "live" || option.providerTransmission !== true) {
    context.addIssue({ code: "custom", message: "Live provider options require live mode and transmission." });
  }
});
export type ProviderOptionProjection = z.infer<typeof ProviderOptionProjectionSchema>;

export const ProviderDisclosureAcknowledgementSchema =
  ProviderReleaseSelectionSchema.and(
    strict({
      id: nonEmptyString,
      schemaVersion: literalVersion,
      disclosureVersion: literalVersion,
      dataFlowAcknowledged: z.literal(true),
      retentionAndTrainingUseAcknowledged: z.literal(true),
      serviceTierAcknowledged: z.literal(true),
      acknowledgedAt: isoUtcTimestamp,
    }),
  );
export type ProviderDisclosureAcknowledgement = z.infer<
  typeof ProviderDisclosureAcknowledgementSchema
>;

export const PurposeProviderSelectionSchema = ProviderReleaseSelectionSchema.and(
  strict({
    disclosureAcknowledgement: ProviderDisclosureAcknowledgementSchema,
  }),
);

export const CaseStatusSchema = z.enum([
  "draft",
  "processing",
  "review_required",
  "blocked",
  "ready_to_export",
  "exported",
  "processing_failed",
]);
export type CaseStatus = z.infer<typeof CaseStatusSchema>;

export const ExcludedDecisionSchema = z.enum([
  "victim_or_trafficking_status",
  "credibility",
  "guilt_or_innocence",
  "legal_eligibility",
  "non_punishment_eligibility",
  "case_priority",
  "prosecution_sentence_or_outcome",
]);
export const RequiredExcludedDecisions = ExcludedDecisionSchema.options;
export type ExcludedDecision = z.infer<typeof ExcludedDecisionSchema>;

export const SafeShareRecipientCategorySchema = z.enum([
  "legal_aid_team",
  "public_defender",
  "court_navigation",
  "ngo_caseworker",
  "policy_or_research_summary",
]);
export type SafeShareRecipientCategory = z.infer<
  typeof SafeShareRecipientCategorySchema
>;

export const PractitionerRoleSchema = z.enum([
  "legal_aid",
  "defence",
  "public_defender",
  "court_navigation",
  "ngo_legal",
  "demo_evaluator",
]);
export const JurisdictionCodeSchema = z.enum(["J-01", "J-02", "unspecified"]);
export const RequestedExportSchema = z.enum([
  "full_practitioner_handoff",
  "minimum_necessary_safe_share",
]);
export const TranslationStatusSchema = z.enum([
  "original_language",
  "translated_unverified",
  "unknown",
]);

export const CasePurposeBriefSchema = strict({
  id: IdSchemas.purposeBriefId,
  schemaVersion: literalVersion,
  caseId: IdSchemas.caseId,
  revision: nonNegativeInteger,
  status: z.enum(["draft", "complete", "withdrawn", "superseded"]),
  practitionerRole: PractitionerRoleSchema,
  organizationType: z.enum([
    "legal_aid",
    "public_defender",
    "court_service",
    "ngo",
    "law_office",
    "research_or_evaluation",
    "other_authorized",
  ]),
  supportedWorkflow: z.literal("case_preparation_handoff"),
  statedPurpose: z.string().trim().min(1).max(500),
  excludedDecisions: z.array(ExcludedDecisionSchema),
  authority: strict({
    basis: z.literal("not_applicable_synthetic_fixture"),
    status: z.enum(["active", "withdrawn"]),
    consentStatus: z.literal("not_applicable_synthetic_fixture"),
    authorityNotVerifiedAcknowledged: z.literal(true),
    syntheticOrHarmlessDataAttested: z.literal(true),
  }),
  jurisdictionCode: JurisdictionCodeSchema,
  sourceLanguage: z.literal("en"),
  translationStatus: TranslationStatusSchema,
  intendedRecipient: z.string().trim().min(1).max(500),
  intendedRecipientCategory: SafeShareRecipientCategorySchema,
  requestedExport: RequestedExportSchema,
  prohibitedDecisionsAcknowledged: z.literal(true),
  syntheticDataAcknowledged: z.literal(true),
  providerSelection: PurposeProviderSelectionSchema,
  cooperationNeutralityAcknowledged: z.literal(true),
  authorityAttested: z.literal(true),
  createdAt: isoUtcTimestamp,
  updatedAt: isoUtcTimestamp,
}).superRefine((brief, context) => {
  const missing = RequiredExcludedDecisions.filter(
    (decision) => !brief.excludedDecisions.includes(decision),
  );
  if (missing.length > 0) {
    context.addIssue({ code: "custom", message: "Purpose brief must include every excluded decision." });
  }
});
export type CasePurposeBrief = z.infer<typeof CasePurposeBriefSchema>;

export const SafeErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "UNSUPPORTED_VERSION",
  "LIVE_ANALYSIS_DISABLED",
  "CANONICAL_FIXTURE_MISMATCH",
  "UNAUTHORIZED_PURPOSE",
  "MASK_REVIEW_INCOMPLETE",
  "MASK_SPAN_INVALID",
  "PII_LEAK_DETECTED",
  "PAYLOAD_TOO_LARGE",
  "SOURCE_UNAVAILABLE",
  "EXTRACTION_FAILED",
  "PROVIDER_NOT_CONFIGURED",
  "PROVIDER_DISABLED",
  "PROVIDER_AUTHENTICATION_FAILED",
  "PROVIDER_SERVICE_TIER_UNAVAILABLE",
  "PROVIDER_QUOTA_EXHAUSTED",
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_REFUSAL",
  "PROVIDER_DATA_POLICY_BLOCKED",
  "INVALID_STRUCTURED_RESPONSE",
  "CITATION_VALIDATION_FAILED",
  "PROHIBITED_OUTPUT",
  "SAFETY_VALIDATION_FAILED",
  "REPLAY_VERSION_MISMATCH",
  "CLIENT_TRANSPORT_FAILURE",
  "INTERNAL_SAFE_FAILURE",
]);
export type SafeErrorCode = z.infer<typeof SafeErrorCodeSchema>;

export const BoundingBoxSchema = strict({
  x: finiteNumber,
  y: finiteNumber,
  width: finiteNumber.nonnegative(),
  height: finiteNumber.nonnegative(),
  coordinateSpace: z.enum(["pdf_points", "normalized_0_1"]),
});
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const PageRecordSchema = strict({
  id: IdSchemas.pageId,
  documentId: IdSchemas.documentId,
  pageNumber: positiveInteger,
  expected: z.boolean(),
  availability: z.enum([
    "available",
    "missing",
    "unreadable",
    "image_only",
    "skipped",
    "manually_excluded",
    "extraction_failed",
  ]),
  extractionStatus: StageStatusSchema,
  extractedCharacterCount: nonNegativeInteger,
  failureCode: SafeErrorCodeSchema.optional(),
});

export const SourceSegmentSchema = strict({
  id: IdSchemas.segmentId,
  documentId: IdSchemas.documentId,
  pageId: IdSchemas.pageId.optional(),
  pageNumber: positiveInteger.optional(),
  ordinal: positiveInteger,
  rawText: z.string(),
  redactedText: z.string(),
  boundingBoxes: z.array(BoundingBoxSchema),
  sourceLanguage: z.literal("en"),
  translationStatus: TranslationStatusSchema,
  extractionQuality: z.enum(["fixture_verified", "machine_extracted", "unavailable"]),
  instructionAdvisory: z.enum([
    "not_scanned",
    "no_signal",
    "advisory_signal",
    "human_reviewed",
  ]),
  modelVisibility: z.enum(["visible_as_untrusted_content", "not_sent"]),
  supportEligibility: z.enum(["candidate_eligible", "evidence_only"]),
});
export type SourceSegment = z.infer<typeof SourceSegmentSchema>;

export const DocumentRecordSchema = strict({
  id: IdSchemas.documentId,
  caseId: IdSchemas.caseId,
  fixtureVersion: literalVersion,
  fileName: nonEmptyString,
  displayName: nonEmptyString,
  sourceType: z.enum([
    "recruitment_record",
    "communication",
    "travel_record",
    "practitioner_note",
    "operational_financial_record",
    "proceeding_record",
    "support_provider_note",
  ]),
  dataOrigin: z.literal("bundled_synthetic"),
  expectedPageCount: positiveInteger,
  pages: z.array(PageRecordSchema),
  provenanceStatus: z.enum(["fixture_verified", "unverified", "unknown"]),
  processingStatus: StageStatusSchema,
  syntheticLabelPresent: z.boolean(),
});
export type DocumentRecord = z.infer<typeof DocumentRecordSchema>;

export const MaskClassSchema = z.enum([
  "person_name",
  "email",
  "phone",
  "passport",
  "bank_account",
  "address",
  "date_of_birth",
]);
export type MaskClass = z.infer<typeof MaskClassSchema>;

export const MaskSuggestionSchema = strict({
  id: nonEmptyString,
  segmentId: IdSchemas.segmentId,
  maskClass: MaskClassSchema,
  originalStart: nonNegativeInteger,
  originalEnd: positiveInteger,
  redactedStart: nonNegativeInteger,
  redactedEnd: positiveInteger,
  replacementToken: nonEmptyString,
  detectionMethod: z.enum(["deterministic_pattern", "sensitive_term_list"]),
  reviewStatus: z.enum(["pending", "approved", "edited", "rejected"]),
}).refine((mask) => mask.originalEnd > mask.originalStart && mask.redactedEnd > mask.redactedStart);

export const MaskingReviewSchema = strict({
  redactionMapVersion: literalVersion,
  revision: nonNegativeInteger,
  reviewStatus: z.enum(["pending", "approved", "invalidated"]),
  suggestions: z.array(MaskSuggestionSchema),
  declaredSupportedClasses: z.array(MaskClassSchema),
  reviewedBy: z.enum(["current_practitioner", "fixture_reviewer"]).nullable(),
  approvedAt: isoUtcTimestamp.optional(),
  leakScanStatus: z.enum(["not_run", "passed", "failed"]),
  failedClasses: z.array(MaskClassSchema),
}).superRefine((review, context) => {
  if (review.leakScanStatus === "passed" && review.failedClasses.length !== 0) {
    context.addIssue({ code: "custom", message: "Passed leak scan cannot have failed classes." });
  }
});
export type MaskingReview = z.infer<typeof MaskingReviewSchema>;

export const CoverageIssueSchema = strict({
  id: nonEmptyString,
  documentId: IdSchemas.documentId,
  pageId: IdSchemas.pageId.optional(),
  kind: z.enum([
    "missing_page",
    "unreadable_page",
    "image_only_page",
    "skipped_page",
    "manually_excluded_page",
    "extraction_failed",
    "segment_mismatch",
  ]),
  initialConsequence: z.enum(["consequential", "non_consequential", "unknown"]),
  activeConsequence: z.enum(["consequential", "non_consequential", "unknown"]),
  rationale: safeText,
  resolutionStatus: z.enum(["open", "reviewed_limitation", "resolved"]),
  coverageReviewDecisionId: z.string().nullable(),
});

export const CoverageReviewDecisionSchema = strict({
  id: nonEmptyString,
  issueId: nonEmptyString,
  originalConsequence: z.enum(["consequential", "non_consequential", "unknown"]),
  reviewedConsequence: z.enum(["consequential", "non_consequential"]),
  limitationText: safeText,
  reason: safeText,
  actor: z.enum(["current_practitioner", "fixture_reviewer"]),
  createdAt: isoUtcTimestamp,
});
export type CoverageReviewDecision = z.infer<typeof CoverageReviewDecisionSchema>;

export const CoverageSummarySchema = strict({
  expectedDocuments: nonNegativeInteger,
  processedDocuments: nonNegativeInteger,
  expectedPages: nonNegativeInteger,
  availablePages: nonNegativeInteger,
  issues: z.array(CoverageIssueSchema),
  hasConsequentialOpenIssue: z.boolean(),
});
export type CoverageSummary = z.infer<typeof CoverageSummarySchema>;

export const CitationValidationStatusSchema = z.enum([
  "unvalidated",
  "exact_match",
  "manually_resolved",
  "not_found",
  "ambiguous_match",
  "semantic_mismatch",
  "source_unavailable",
  "invalidated",
]);

const CitationBaseSchema = strict({
  id: nonEmptyString,
  caseId: z.literal("CFN-DEMO-001"),
  analysisRunId: IdSchemas.analysisRunId,
  documentId: IdSchemas.documentId,
  pageNumber: positiveInteger.optional(),
  segmentId: IdSchemas.segmentId,
  quotedText: z.string(),
  normalizedQuotedText: z.string(),
  quoteForm: z.literal("approved_redacted_derivative"),
  redactionMapVersion: literalVersion,
  sourceLanguage: z.literal("en"),
  translationStatus: TranslationStatusSchema,
  extractionQuality: z.enum(["fixture_verified", "machine_extracted", "unavailable"]),
});

export const CitationSchema = z.discriminatedUnion("validationStatus", [
  CitationBaseSchema.extend({
    validationStatus: z.literal("exact_match"),
    redactedSegmentRange: rangeSchema,
    sourceSegmentRange: rangeSchema,
    boundingBoxes: z.array(BoundingBoxSchema),
    resolutionMethod: z.enum(["exact_codepoint", "normalized_unique_lookup"]),
    resolvedBy: z.literal("system"),
    validatedAt: isoUtcTimestamp,
  }),
  CitationBaseSchema.extend({
    validationStatus: z.literal("manually_resolved"),
    redactedSegmentRange: rangeSchema,
    sourceSegmentRange: rangeSchema,
    boundingBoxes: z.array(BoundingBoxSchema),
    resolutionMethod: z.literal("manual_segment_selection"),
    resolvedBy: z.literal("practitioner"),
    validatedAt: isoUtcTimestamp,
  }),
  CitationBaseSchema.extend({
    validationStatus: z.enum([
      "unvalidated",
      "not_found",
      "ambiguous_match",
      "semantic_mismatch",
      "source_unavailable",
      "invalidated",
    ]),
    redactedSegmentRange: z.null(),
    sourceSegmentRange: z.null(),
    boundingBoxes: z.tuple([]),
    resolutionMethod: z.null(),
    resolvedBy: z.null(),
    validatedAt: isoUtcTimestamp.optional(),
  }),
]);
export type Citation = z.infer<typeof CitationSchema>;

export const CitationResolutionDecisionSchema = strict({
  id: nonEmptyString,
  caseId: IdSchemas.caseId,
  analysisRunId: IdSchemas.analysisRunId,
  candidateId: IdSchemas.candidateId,
  citationId: nonEmptyString,
  previousValidationStatus: z.literal("ambiguous_match"),
  selectedSegmentId: IdSchemas.segmentId,
  selectedRedactedSegmentRange: rangeSchema,
  resultingValidationStatus: z.literal("manually_resolved"),
  resolutionMethod: z.literal("manual_segment_selection"),
  actor: z.literal("current_practitioner"),
  createdAt: isoUtcTimestamp,
});
export type CitationResolutionDecision = z.infer<
  typeof CitationResolutionDecisionSchema
>;

export const DependencyRelationshipSchema = z.enum([
  "supports",
  "limits",
  "contradicts",
  "context_only",
]);
export type DependencyRelationship = z.infer<typeof DependencyRelationshipSchema>;

export const EvidenceDependencySchema = z.discriminatedUnion("kind", [
  strict({
    id: nonEmptyString,
    kind: z.literal("source"),
    sourceSegmentId: IdSchemas.segmentId,
    citationId: nonEmptyString,
    evidenceNature: EvidenceNatureSchema,
    relationship: DependencyRelationshipSchema,
    active: z.boolean(),
  }),
  strict({
    id: nonEmptyString,
    kind: z.literal("candidate"),
    candidateId: IdSchemas.nonNexusCandidateId,
    relationship: DependencyRelationshipSchema,
    active: z.boolean(),
  }),
  strict({
    id: nonEmptyString,
    kind: z.literal("nexus"),
    nexusCandidateId: IdSchemas.nexusCandidateId,
    relationship: DependencyRelationshipSchema,
    active: z.boolean(),
  }),
]);
export type EvidenceDependency = z.infer<typeof EvidenceDependencySchema>;

export const CandidateKindSchema = z.enum([
  "timeline_event",
  "nexus_relationship",
  "review_lane_item",
  "context_gap",
  "contradiction",
  "entity",
  "coverage_limitation",
  "provenance_limitation",
]);
export const AssertionModeSchema = z.enum([
  "positive_proposition",
  "limitation",
  "gap",
  "unknown_state",
  "neutral_procedural_fact",
]);
export const ReviewRequirementSchema = z.enum([
  "individual",
  "derived_summary",
  "optional",
]);
export const InclusionStatusSchema = z.enum(["active", "withdrawn", "superseded"]);
export const DependencyChangeReasonSchema = z.enum([
  "source_rejected",
  "source_withdrawn",
  "source_replaced",
  "source_unreadable",
  "page_unavailable",
  "citation_invalid",
  "candidate_rejected",
  "candidate_withdrawn",
  "mask_invalidated",
  "authority_excluded",
]);
export type DependencyChangeReason = z.infer<typeof DependencyChangeReasonSchema>;

const CandidateItemBaseSchema = strict({
  id: IdSchemas.candidateId,
  revision: nonNegativeInteger,
  caseId: IdSchemas.caseId,
  analysisRunId: IdSchemas.analysisRunId,
  lane: ReviewLaneSchema.optional(),
  title: safeText,
  proposedText: safeText,
  currentText: safeText,
  currentTextOrigin: ItemOriginSchema,
  itemOrigin: ItemOriginSchema,
  assertionMode: AssertionModeSchema,
  reviewRequirement: ReviewRequirementSchema,
  inclusionStatus: InclusionStatusSchema,
  supportStatus: SupportStatusSchema,
  reviewStatus: ReviewStatusSchema,
  dependencies: z.array(EvidenceDependencySchema),
  relatedCoverageIssueIds: z.array(nonEmptyString),
  unknowns: z.array(z.string()),
  reviewQuestion: safeText,
  consequential: z.boolean(),
  prohibitedConclusionCheck: z.enum(["passed", "failed"]),
  safeShareRecipientCategories: z.array(SafeShareRecipientCategorySchema),
  createdAt: isoUtcTimestamp,
  invalidatedAt: isoUtcTimestamp.optional(),
  invalidationReason: DependencyChangeReasonSchema.optional(),
});

export const TimelinePrecisionSchema = z.enum([
  "day",
  "date_range",
  "approximate",
  "conflicting",
  "unknown",
]);
export const TimelineEventSchema = CandidateItemBaseSchema.extend({
  id: z.union([IdSchemas.nonNexusCandidateId, IdSchemas.candidateId]),
  kind: z.literal("timeline_event"),
  dateStart: dateOnly.optional(),
  dateEnd: dateOnly.optional(),
  datePrecision: TimelinePrecisionSchema,
  dateAlternatives: z.array(
    strict({
      start: dateOnly.optional(),
      end: dateOnly.optional(),
      label: nonEmptyString,
    }),
  ),
  locationLabel: z.string().optional(),
  actorLabels: z.array(z.string()),
  conflictGroupId: z.string().optional(),
});

export const NexusCategorySchema = z.enum([
  "recruitment",
  "movement",
  "control",
  "compelled_tasks",
  "offence_timing",
  "urgency",
]);
export const GoldenNexusIds = [
  "NEXUS-RECRUITMENT",
  "NEXUS-MOVEMENT",
  "NEXUS-CONTROL",
  "NEXUS-COMPELLED-TASKS",
  "NEXUS-OFFENCE-TIMING",
  "NEXUS-URGENCY",
] as const;
export const GoldenNexusIdSchema = z.enum(GoldenNexusIds);

export const NexusRowSchema = CandidateItemBaseSchema.extend({
  id: IdSchemas.nexusCandidateId,
  kind: z.literal("nexus_relationship"),
  category: NexusCategorySchema,
  requiredDependencyIds: z.array(nonEmptyString),
  childCandidateIds: z.array(IdSchemas.nonNexusCandidateId),
  relationshipSummary: safeText,
});

export const ContextGapSchema = z.discriminatedUnion("responseStatus", [
  CandidateItemBaseSchema.extend({
    kind: z.literal("context_gap"),
    response: z.null(),
    responseStatus: z.literal("unanswered"),
    responseEvidenceNature: z.literal("unknown"),
    responseExplanation: z.null(),
  }),
  CandidateItemBaseSchema.extend({
    kind: z.literal("context_gap"),
    response: safeText,
    responseStatus: z.literal("answered"),
    responseEvidenceNature: z.literal("reviewer_supplied_context"),
    responseExplanation: z.null(),
  }),
  CandidateItemBaseSchema.extend({
    kind: z.literal("context_gap"),
    response: z.null(),
    responseStatus: z.literal("preserved_unknown"),
    responseEvidenceNature: z.literal("unknown"),
    responseExplanation: z.null(),
  }),
  CandidateItemBaseSchema.extend({
    kind: z.literal("context_gap"),
    response: z.null(),
    responseStatus: z.enum(["deferred", "outside_scope"]),
    responseEvidenceNature: z.literal("unknown"),
    responseExplanation: safeText,
  }),
]);

export const ContextGapResponseIntentSchema = z.discriminatedUnion("responseStatus", [
  strict({
    gapId: IdSchemas.candidateId,
    responseStatus: z.literal("answered"),
    response: safeText,
    responseExplanation: z.null(),
  }),
  strict({
    gapId: IdSchemas.candidateId,
    responseStatus: z.literal("preserved_unknown"),
    response: z.null(),
    responseExplanation: z.null(),
  }),
  strict({
    gapId: IdSchemas.candidateId,
    responseStatus: z.enum(["deferred", "outside_scope"]),
    response: z.null(),
    responseExplanation: safeText,
  }),
]);

export const OtherCandidateSchema = CandidateItemBaseSchema.extend({
  kind: z.enum([
    "review_lane_item",
    "contradiction",
    "entity",
    "coverage_limitation",
    "provenance_limitation",
  ]),
});

export const CaseCandidateSchema = z.discriminatedUnion("kind", [
  TimelineEventSchema,
  NexusRowSchema,
  ContextGapSchema,
  OtherCandidateSchema,
]);
export type CaseCandidate = z.infer<typeof CaseCandidateSchema>;

export const ReviewActionSchema = z.enum([
  "accept",
  "edit",
  "reject",
  "mark_uncertain",
  "confirm_unknown",
  "withdraw",
  "accept_as_limitation",
]);
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

export const ReviewIntentSchema = z.discriminatedUnion("action", [
  strict({
    candidateId: IdSchemas.candidateId,
    action: z.literal("edit"),
    editedText: safeText,
    reason: safeText,
  }),
  strict({
    candidateId: IdSchemas.candidateId,
    action: z.enum(["reject", "mark_uncertain"]),
    reason: safeText,
  }),
  strict({
    candidateId: IdSchemas.candidateId,
    action: z.literal("accept_as_limitation"),
    limitationText: safeText,
    reason: safeText,
  }),
  strict({
    candidateId: IdSchemas.candidateId,
    action: z.enum(["accept", "confirm_unknown"]),
    reason: z.null(),
  }),
]);
export type ReviewIntent = z.infer<typeof ReviewIntentSchema>;

export const ReviewDecisionSchema = strict({
  id: IdSchemas.reviewDecisionId,
  caseId: IdSchemas.caseId,
  analysisRunId: IdSchemas.analysisRunId,
  candidateId: IdSchemas.candidateId,
  candidateRevision: nonNegativeInteger,
  action: ReviewActionSchema,
  previousStatus: ReviewStatusSchema,
  resultingStatus: ReviewStatusSchema,
  editedText: z.string().nullable(),
  reason: z.string().nullable(),
  actor: z.enum(["current_practitioner", "fixture_reviewer"]),
  reviewerRole: PractitionerRoleSchema,
  promptVersion: literalVersion,
  rulesetVersion: literalVersion,
  supersedesDecisionId: IdSchemas.reviewDecisionId.nullable(),
  createdAt: isoUtcTimestamp,
  dependencySnapshot: z.array(nonEmptyString),
});
export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;

export const DependencyImpactSchema = strict({
  candidateId: IdSchemas.candidateId,
  previousSupportStatus: SupportStatusSchema,
  resultingSupportStatus: SupportStatusSchema,
  previousReviewStatus: ReviewStatusSchema,
  resultingReviewStatus: ReviewStatusSchema,
  previousInclusionStatus: InclusionStatusSchema,
  resultingInclusionStatus: InclusionStatusSchema,
  explanation: safeText,
});

export const DependencyChangeSchema = strict({
  id: nonEmptyString,
  commandId: nonEmptyString,
  auditEventId: IdSchemas.auditEventId,
  changedEntityId: nonEmptyString,
  reason: DependencyChangeReasonSchema,
  impacts: z.array(DependencyImpactSchema),
  preservedCandidateIds: z.array(IdSchemas.candidateId),
  exportReadinessRevoked: z.boolean(),
  createdAt: isoUtcTimestamp,
});
export type DependencyChange = z.infer<typeof DependencyChangeSchema>;

export const AnalyzeMaskApprovalSchema = strict({
  maskId: nonEmptyString,
  segmentId: IdSchemas.segmentId,
  originalStart: nonNegativeInteger,
  originalEnd: positiveInteger,
  maskClass: MaskClassSchema,
  replacementToken: nonEmptyString,
  reviewStatus: z.enum(["approved", "edited", "rejected"]),
}).refine((mask) => mask.originalEnd > mask.originalStart);

export const AnalyzeRequestSchema = strict({
  schemaVersion: literalVersion,
  caseId: z.literal("CFN-DEMO-001"),
  fixtureVersion: literalVersion,
  canonicalFixtureDigest: sha256,
  purposeBriefId: IdSchemas.purposeBriefId,
  purposeContext: strict({
    practitionerRole: PractitionerRoleSchema,
    jurisdictionCode: JurisdictionCodeSchema,
    sourceLanguage: z.literal("en"),
    requestedExport: RequestedExportSchema,
  }),
  maskReviewApproved: z.literal(true),
  leakScanStatus: z.literal("passed"),
  requestedMode: z.literal("live"),
  providerSelection: AnalyzeLiveProviderSelectionSchema,
  providerDisclosureAcknowledgement: ProviderDisclosureAcknowledgementSchema,
  selectedSegmentIds: z.array(IdSchemas.segmentId).min(1),
  maskApprovals: z.array(AnalyzeMaskApprovalSchema),
}).superRefine((request, context) => {
  if (request.providerDisclosureAcknowledgement.providerId !== request.providerSelection.providerId) {
    context.addIssue({ code: "custom", message: "Disclosure acknowledgement provider mismatch." });
  }
  if (
    request.providerDisclosureAcknowledgement.releaseConfigurationId !==
    request.providerSelection.releaseConfigurationId
  ) {
    context.addIssue({ code: "custom", message: "Disclosure acknowledgement release mismatch." });
  }
});
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const LiveEvaluationSpendApprovalSchema = strict({
  schemaVersion: literalVersion,
  id: nonEmptyString,
  release: AnalyzeLiveProviderSelectionSchema,
  approvedBy: z.literal("current_practitioner"),
  approvedAt: isoUtcTimestamp,
  expiresAt: isoUtcTimestamp,
  approvedCallCount: positiveInteger,
  totalEstimatedCostUsdMicros: nonNegativeInteger,
});

export const EvaluationVariantIdSchema = z.enum([
  "EVAL-001",
  "EVAL-002",
  "EVAL-003",
  "EVAL-004",
  "EVAL-005A",
  "EVAL-005B",
  "EVAL-006",
  "EVAL-007",
  "EVAL-008",
  "EVAL-009",
  "EVAL-010",
  "EVAL-011",
  "EVAL-012A",
  "EVAL-012B",
]);
export type EvaluationVariantId = z.infer<typeof EvaluationVariantIdSchema>;

export const PrivateLiveEvaluationRequestSchema = strict({
  schemaVersion: literalVersion,
  approval: LiveEvaluationSpendApprovalSchema,
  callOrdinal: positiveInteger,
  evaluationPurpose: strict({
    id: z.literal("PURPOSE-EVALUATION-CFN-DEMO-001"),
    dataOrigin: z.literal("bundled_synthetic"),
    statedPurpose: z.literal("frozen_synthetic_provider_evaluation"),
  }),
  release: AnalyzeLiveProviderSelectionSchema,
  caseId: z.literal("CFN-DEMO-001"),
  fixtureVersion: literalVersion,
  canonicalFixtureDigest: sha256,
  evaluationInputPacketId: nonEmptyString,
  evaluationInputPacketDigest: sha256,
  selectedSegmentIds: z.array(IdSchemas.segmentId).min(1),
  approvedRedactedInputDigest: sha256,
  maskApprovals: z.array(AnalyzeMaskApprovalSchema),
  promptVersion: literalVersion,
  responseSchemaVersion: literalVersion,
  rulesetVersion: literalVersion,
  evaluationVariantId: EvaluationVariantIdSchema,
  repetition: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export const PrivateLiveEvaluationResultSchema = strict({
  schemaVersion: literalVersion,
  source: z.literal("private_evaluation"),
  admissionMutation: z.literal(false),
  publicSelectabilityMutation: z.literal(false),
  terminalResponse: z.lazy(() => AnalyzeResponseSchema).refine(
    (response) =>
      typeof response === "object" &&
      response !== null &&
      ("outcome" in response) &&
      (response.outcome === "succeeded" || response.outcome === "failed"),
  ),
});

export const ModelCandidateProposalSchema = strict({
  proposedId: nonEmptyString,
  kind: CandidateKindSchema,
  lane: ReviewLaneSchema.optional(),
  title: safeText,
  proposedText: safeText,
  assertionMode: AssertionModeSchema,
  reviewQuestion: safeText,
  citations: z.array(
    strict({
      segmentId: IdSchemas.segmentId,
      quotedText: z.string(),
      relationship: DependencyRelationshipSchema,
      evidenceNature: EvidenceNatureSchema,
    }),
  ),
  unknowns: z.array(z.string()),
});
export const ModelAnalysisProposalSchema = strict({
  candidates: z.array(ModelCandidateProposalSchema),
});

export const StartedLiveFailureClassificationSchema = z.enum([
  "provider_authentication_failed",
  "provider_service_tier_unavailable",
  "provider_quota_exhausted",
  "provider_rate_limited",
  "provider_timeout",
  "provider_unavailable",
  "provider_refusal",
  "invalid_structured_response",
  "citation_validation_failed",
  "prohibited_output",
  "safety_validation_failed",
  "internal_safe_failure",
]);

const failureBranches = [
  ["provider_authentication_failed", "PROVIDER_AUTHENTICATION_FAILED", false, true, true],
  ["provider_service_tier_unavailable", "PROVIDER_SERVICE_TIER_UNAVAILABLE", false, true, true],
  ["provider_quota_exhausted", "PROVIDER_QUOTA_EXHAUSTED", true, true, true],
  ["provider_rate_limited", "PROVIDER_RATE_LIMITED", true, true, true],
  ["provider_timeout", "PROVIDER_TIMEOUT", true, true, true],
  ["provider_unavailable", "PROVIDER_UNAVAILABLE", true, true, true],
  ["provider_refusal", "PROVIDER_REFUSAL", false, false, false],
  ["invalid_structured_response", "INVALID_STRUCTURED_RESPONSE", false, false, false],
  ["citation_validation_failed", "CITATION_VALIDATION_FAILED", false, false, false],
  ["prohibited_output", "PROHIBITED_OUTPUT", false, false, false],
  ["safety_validation_failed", "SAFETY_VALIDATION_FAILED", false, false, false],
  ["internal_safe_failure", "INTERNAL_SAFE_FAILURE", false, false, false],
] as const;

const analysisFailureBranches = failureBranches.map(
  ([
    classification,
    safeErrorCode,
    retryableSameProvider,
    alternateProviderRecoveryAllowed,
    replayRecoveryAllowed,
  ]) =>
    strict({
      classification: z.literal(classification),
      safeErrorCode: z.literal(safeErrorCode),
      retryableSameProvider: z.literal(retryableSameProvider),
      alternateProviderRecoveryAllowed: z.literal(alternateProviderRecoveryAllowed),
      replayRecoveryAllowed: z.literal(replayRecoveryAllowed),
    }),
) as unknown as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]];

export const AnalysisFailureSchema = z.union(
  analysisFailureBranches,
);
export type AnalysisFailure = z.infer<typeof AnalysisFailureSchema>;

export const AnalysisRecoveryMetadataSchema = strict({
  recoveryOfRunId: IdSchemas.analysisRunId.nullable(),
  selectionReason: z.enum([
    "initial_choice",
    "retry_same_provider",
    "explicit_provider_switch",
    "explicit_deterministic_replay",
  ]),
  selectedBy: z.literal("practitioner"),
  automaticFailover: z.literal(false),
  outputsMerged: z.literal(false),
});
export type AnalysisRecoveryMetadata = z.infer<
  typeof AnalysisRecoveryMetadataSchema
>;

export const LiveAnalysisRecoveryMetadataSchema = AnalysisRecoveryMetadataSchema.refine(
  (recovery) =>
    recovery.selectionReason === "initial_choice"
      ? recovery.recoveryOfRunId === null
      : recovery.selectionReason === "retry_same_provider" ||
          recovery.selectionReason === "explicit_provider_switch"
        ? recovery.recoveryOfRunId !== null
        : false,
  { message: "Live recovery metadata must match its selection reason." },
);

export const ReplayAnalysisRecoveryMetadataSchema = AnalysisRecoveryMetadataSchema.refine(
  (recovery) => recovery.selectionReason === "explicit_deterministic_replay",
);

export const AnalysisProviderProvenanceSchema = ProviderReleaseConfigurationSchema.and(
  strict({
    adapterVersion: nonEmptyString,
    returnedModel: z.string().nullable(),
    inferenceSetting: ProviderReleaseInferenceSettingSchema,
    disclosureVersion: literalVersion,
    providerTransmission: z.boolean(),
  }),
).superRefine((provenance, context) => {
  if (provenance.providerId === "local_replay" && provenance.providerTransmission !== false) {
    context.addIssue({ code: "custom", message: "Replay has no provider transmission." });
  }
  if (provenance.providerId !== "local_replay" && provenance.providerTransmission !== true) {
    context.addIssue({ code: "custom", message: "Live provider provenance requires transmission." });
  }
});
export type AnalysisProviderProvenance = z.infer<
  typeof AnalysisProviderProvenanceSchema
>;

const AnalysisExecutionBaseSchema = strict({
  id: IdSchemas.analysisRunId,
  mode: AnalysisModeSchema,
  provider: AnalysisProviderProvenanceSchema,
  promptVersion: literalVersion,
  requestSchemaVersion: literalVersion,
  responseSchemaVersion: literalVersion,
  fixtureVersion: literalVersion,
  rulesetVersion: literalVersion,
  checkpointProvenance: strict({
    checkpointId: z.literal("DEMO-CHECKPOINT-REVIEW"),
    checkpointVersion: literalVersion,
    replayVersion: literalVersion,
  }).nullable(),
  startedAt: isoUtcTimestamp,
  completedAt: isoUtcTimestamp,
  durationMs: nonNegativeInteger,
  inputSegmentCount: nonNegativeInteger,
  candidateCount: nonNegativeInteger,
  citationCount: nonNegativeInteger,
  quarantinedCount: nonNegativeInteger,
  tokenUsage: strict({
    input: nonNegativeInteger,
    output: nonNegativeInteger,
    total: nonNegativeInteger,
  }).optional(),
});

export const AnalysisExecutionResultSchema = z.discriminatedUnion("status", [
  AnalysisExecutionBaseSchema.extend({
    status: z.literal("succeeded"),
    failure: z.null(),
  }),
  AnalysisExecutionBaseSchema.extend({
    status: z.literal("failed"),
    candidateCount: z.literal(0),
    citationCount: z.literal(0),
    quarantinedCount: z.literal(0),
    failure: AnalysisFailureSchema,
  }),
]);
export type AnalysisExecutionResult = z.infer<typeof AnalysisExecutionResultSchema>;

export const LiveAnalysisExecutionResultSchema = AnalysisExecutionResultSchema.refine(
  (run) =>
    run.mode === "live" &&
    run.checkpointProvenance === null &&
    run.provider.providerId !== "local_replay",
  { message: "Live execution results cannot carry recovery metadata or replay provenance." },
);
export type LiveAnalysisExecutionResult = z.infer<
  typeof LiveAnalysisExecutionResultSchema
>;

export const RunInputStateProvenanceSchema = strict({
  sourceCaseRevision: nonNegativeInteger,
  canonicalFixtureDigest: sha256,
  purposeBriefId: IdSchemas.purposeBriefId,
  purposeBriefRevision: nonNegativeInteger,
  maskingRevision: nonNegativeInteger,
  selectedSegmentIds: z.array(IdSchemas.segmentId).min(1),
  approvedRedactedInputDigest: sha256,
});
export type RunInputStateProvenance = z.infer<
  typeof RunInputStateProvenanceSchema
>;

export const AnalysisRunSchema = z.union([
  LiveAnalysisExecutionResultSchema.and(
    strict({
      recovery: LiveAnalysisRecoveryMetadataSchema,
      inputState: RunInputStateProvenanceSchema,
    }),
  ),
  AnalysisExecutionResultSchema.and(
    strict({
      mode: z.literal("deterministic_replay"),
      provider: AnalysisProviderProvenanceSchema,
      quarantinedCount: z.literal(0),
      recovery: ReplayAnalysisRecoveryMetadataSchema,
      inputState: RunInputStateProvenanceSchema,
    }),
  ).refine((run) => run.status === "succeeded" && run.provider.providerId === "local_replay"),
]);
export type AnalysisRun = z.infer<typeof AnalysisRunSchema>;

export const AnalysisRecoveryOptionSchema = z.discriminatedUnion("action", [
  strict({
    label: nonEmptyString,
    automatic: z.literal(false),
    action: z.literal("retry_same_provider"),
    targetReleaseConfigurationId: LiveProviderReleaseConfigurationIdSchema,
    displayOrder: z.literal(0),
    requiresDisclosureAcknowledgement: z.literal(false),
    startsNewRun: z.literal(true),
  }),
  strict({
    label: nonEmptyString,
    automatic: z.literal(false),
    action: z.literal("select_evaluated_release"),
    targetReleaseConfigurationId: LiveProviderReleaseConfigurationIdSchema,
    displayOrder: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    requiresDisclosureAcknowledgement: z.literal(true),
    startsNewRun: z.literal(true),
  }),
  strict({
    label: nonEmptyString,
    automatic: z.literal(false),
    action: z.literal("use_deterministic_replay"),
    targetReleaseConfigurationId: z.literal("prepared-replay-v1"),
    displayOrder: z.literal(4),
    requiresDisclosureAcknowledgement: z.literal(true),
    startsNewRun: z.literal(true),
  }),
  strict({
    label: nonEmptyString,
    automatic: z.literal(false),
    action: z.literal("return_to_purpose"),
    targetReleaseConfigurationId: z.null(),
    displayOrder: z.literal(5),
    requiresDisclosureAcknowledgement: z.literal(false),
    startsNewRun: z.literal(false),
  }),
]);

export const PreflightRejectionSafeErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "UNSUPPORTED_VERSION",
  "LIVE_ANALYSIS_DISABLED",
  "CANONICAL_FIXTURE_MISMATCH",
  "UNAUTHORIZED_PURPOSE",
  "MASK_REVIEW_INCOMPLETE",
  "MASK_SPAN_INVALID",
  "PII_LEAK_DETECTED",
  "PAYLOAD_TOO_LARGE",
  "SOURCE_UNAVAILABLE",
  "EXTRACTION_FAILED",
  "PROVIDER_NOT_CONFIGURED",
  "PROVIDER_DISABLED",
  "PROVIDER_SERVICE_TIER_UNAVAILABLE",
  "PROVIDER_DATA_POLICY_BLOCKED",
]);
export type PreflightRejectionSafeErrorCode = z.infer<
  typeof PreflightRejectionSafeErrorCodeSchema
>;

const ApiErrorBaseSchema = strict({
  schemaVersion: literalVersion,
  requestId: nonEmptyString,
  userMessage: nonEmptyString,
  failedStage: nonEmptyString,
});

export const StartedLiveApiErrorSchema = ApiErrorBaseSchema.extend({
  code: SafeErrorCodeSchema,
  retryable: z.boolean(),
  failedRunId: IdSchemas.analysisRunId,
  providerContext: AnalyzeLiveProviderSelectionSchema,
  failureClassification: StartedLiveFailureClassificationSchema,
  recoveryOptions: z.array(AnalysisRecoveryOptionSchema),
});

export const PreflightApiErrorSchema = ApiErrorBaseSchema.extend({
  code: PreflightRejectionSafeErrorCodeSchema,
  retryable: z.literal(false),
  failedRunId: z.null(),
  providerContext: AnalyzeLiveProviderSelectionSchema.nullable(),
  failureClassification: z.null(),
  recoveryOptions: z.array(AnalysisRecoveryOptionSchema),
});
export const ApiErrorSchema = z.union([
  StartedLiveApiErrorSchema,
  PreflightApiErrorSchema,
]);

export const QuarantinedProposalSchema = strict({
  id: nonEmptyString,
  proposalOrdinal: positiveInteger,
  reasonCode: z.enum([
    "UNKNOWN_SOURCE",
    "QUOTE_NOT_EXACT",
    "AMBIGUOUS_QUOTE",
    "EVIDENCE_NATURE_UPGRADE",
    "PROHIBITED_CONCLUSION",
    "INJECTION_PROPAGATION",
    "INVALID_DEPENDENCY",
  ]),
});

export const AnalyzeResponseSchema: z.ZodTypeAny = z.discriminatedUnion("outcome", [
  strict({
    schemaVersion: literalVersion,
    outcome: z.literal("succeeded"),
    run: LiveAnalysisExecutionResultSchema.refine((run) => run.status === "succeeded"),
    candidates: z.array(CaseCandidateSchema),
    citations: z.array(CitationSchema),
    quarantined: z.array(QuarantinedProposalSchema),
  }),
  strict({
    schemaVersion: literalVersion,
    outcome: z.literal("failed"),
    run: LiveAnalysisExecutionResultSchema.refine((run) => run.status === "failed"),
    candidates: z.tuple([]),
    citations: z.tuple([]),
    quarantined: z.tuple([]),
    error: StartedLiveApiErrorSchema,
  }),
  strict({
    schemaVersion: literalVersion,
    outcome: z.literal("rejected_before_run"),
    run: z.null(),
    candidates: z.tuple([]),
    citations: z.tuple([]),
    quarantined: z.tuple([]),
    error: PreflightApiErrorSchema,
  }),
]);
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

export const AnalyzeAvailabilityResponseSchema = z.discriminatedUnion(
  "liveAnalysisEnabled",
  [
    strict({
      schemaVersion: literalVersion,
      liveAnalysisEnabled: z.literal(true),
      replayEnabled: z.literal(true),
      options: z.tuple([
        ProviderOptionProjectionSchema,
        ProviderOptionProjectionSchema,
        ProviderOptionProjectionSchema,
        ProviderOptionProjectionSchema,
      ]),
    }),
    strict({
      schemaVersion: literalVersion,
      liveAnalysisEnabled: z.literal(false),
      replayEnabled: z.literal(true),
      options: z.tuple([
        ProviderOptionProjectionSchema,
        ProviderOptionProjectionSchema,
        ProviderOptionProjectionSchema,
        ProviderOptionProjectionSchema,
      ]),
    }),
  ],
).superRefine((response, context) => {
  const ids = response.options.map((option) => option.providerId);
  if (ids.join(",") !== "openai,google_gemini,mistral,local_replay") {
    context.addIssue({ code: "custom", message: "Provider options must be in frozen order." });
  }
  if (!response.liveAnalysisEnabled) {
    for (const option of response.options.slice(0, 3)) {
      if (option.availabilityStatus !== "disabled" || option.selectable !== false) {
        context.addIssue({ code: "custom", message: "Globally disabled live analysis disables live options." });
      }
    }
  }
});

export const ReplayBundleIdSchema = z.literal("REPLAY-CFN-DEMO-001-V1");
export const DemoCheckpointBundleIdSchema = z.literal("DEMO-CHECKPOINT-REVIEW");

export const ReplayRequestSchema = strict({
  mode: z.literal("deterministic_replay"),
  replayBundleId: ReplayBundleIdSchema,
  caseId: z.literal("CFN-DEMO-001"),
  releaseConfigurationId: z.literal("prepared-replay-v1"),
  providerDisclosureAcknowledgementId: nonEmptyString,
  recoveryOfRunId: IdSchemas.analysisRunId.nullable(),
  fixtureVersion: literalVersion,
  promptVersion: literalVersion,
  analysisResponseVersion: literalVersion,
  replayVersion: literalVersion,
});
export type ReplayRequest = z.infer<typeof ReplayRequestSchema>;

export const BundledReplayCountsSchema = strict({
  analysisRunCount: z.literal(1),
  candidateCount: nonNegativeInteger,
  citationCount: nonNegativeInteger,
  seededDecisionCount: nonNegativeInteger,
});

export const ApprovedRedactedInputDigestProjectionSchema = strict({
  schemaVersion: literalVersion,
  caseId: z.literal("CFN-DEMO-001"),
  fixtureVersion: literalVersion,
  redactionMapVersion: literalVersion,
  segments: z.array(
    strict({
      segmentId: IdSchemas.segmentId,
      redactedText: z.string(),
      effectiveMasks: z.array(
        strict({
          maskId: nonEmptyString,
          maskClass: MaskClassSchema,
          originalStart: nonNegativeInteger,
          originalEnd: positiveInteger,
          replacementToken: nonEmptyString,
        }),
      ),
    }),
  ),
});

export const CheckpointPostDecisionHashProjectionSchema = strict({
  schemaVersion: literalVersion,
  checkpointId: DemoCheckpointBundleIdSchema,
  candidateOutcomes: z.array(z.record(z.string(), z.unknown())),
  citationOutcomes: z.array(z.record(z.string(), z.unknown())),
  appliedSeededDecisionOutcomes: z.array(z.record(z.string(), z.unknown())),
});

const SuccessfulLocalReplayRunSchema = AnalysisExecutionResultSchema.and(
  strict({
    status: z.literal("succeeded"),
    mode: z.literal("deterministic_replay"),
    provider: AnalysisProviderProvenanceSchema,
    quarantinedCount: z.literal(0),
    recovery: ReplayAnalysisRecoveryMetadataSchema,
  }),
).refine((run) => run.provider.providerId === "local_replay");

export const ReplayBundleSchema = strict({
  schemaVersion: literalVersion,
  bundleKind: z.literal("deterministic_replay"),
  id: ReplayBundleIdSchema,
  bundleVersion: literalVersion,
  caseId: z.literal("CFN-DEMO-001"),
  fixtureVersion: literalVersion,
  canonicalFixtureDigest: sha256,
  selectedSegmentIds: z.array(IdSchemas.segmentId).min(1),
  approvedRedactedInputDigest: sha256,
  promptVersion: literalVersion,
  analysisResponseVersion: literalVersion,
  replayVersion: literalVersion,
  releaseConfigurationId: z.literal("prepared-replay-v1"),
  replayRun: SuccessfulLocalReplayRunSchema.and(
    strict({ checkpointProvenance: z.null() }),
  ),
  candidates: z.array(CaseCandidateSchema),
  citations: z.array(CitationSchema),
  seededDecisions: z.tuple([]),
  counts: BundledReplayCountsSchema.extend({ seededDecisionCount: z.literal(0) }),
  providerTransmission: z.literal(false),
  notModelOutput: z.literal(true),
});
export type ReplayBundle = z.infer<typeof ReplayBundleSchema>;

export const DemoCheckpointBundleSchema = strict({
  schemaVersion: literalVersion,
  bundleKind: z.literal("demo_checkpoint"),
  id: DemoCheckpointBundleIdSchema,
  bundleVersion: literalVersion,
  checkpointVersion: literalVersion,
  replayVersion: literalVersion,
  promptVersion: literalVersion,
  analysisResponseVersion: literalVersion,
  caseId: z.literal("CFN-DEMO-001"),
  fixtureVersion: literalVersion,
  canonicalFixtureDigest: sha256,
  selectedSegmentIds: z.array(IdSchemas.segmentId).min(1),
  approvedRedactedInputDigest: sha256,
  purposeBrief: CasePurposeBriefSchema,
  documents: z.array(DocumentRecordSchema),
  segments: z.array(SourceSegmentSchema),
  masking: MaskingReviewSchema,
  coverage: CoverageSummarySchema,
  coverageReviews: z.tuple([]),
  processing: z.array(z.lazy(() => ProcessingStageSchema)),
  visibleLabel: z.literal("Prepared synthetic review checkpoint"),
  replayVisibleLabel: z.literal("Bundled deterministic replay, not live AI"),
  replayRun: SuccessfulLocalReplayRunSchema.and(
    strict({
      checkpointProvenance: strict({
        checkpointId: DemoCheckpointBundleIdSchema,
        checkpointVersion: literalVersion,
        replayVersion: literalVersion,
      }),
    }),
  ),
  replayReleaseConfigurationId: z.literal("prepared-replay-v1"),
  candidates: z.array(CaseCandidateSchema),
  citations: z.array(CitationSchema),
  seededDecisions: z.array(ReviewDecisionSchema),
  counts: BundledReplayCountsSchema.extend({
    documentCount: nonNegativeInteger,
    segmentCount: nonNegativeInteger,
    processingStageCount: nonNegativeInteger,
    coverageReviewCount: z.literal(0),
  }),
  postDecisionHashProjectionVersion: literalVersion,
  expectedPostDecisionStateHash: sha256,
  providerTransmission: z.literal(false),
  notModelOutput: z.literal(true),
  seededDecisionActor: z.literal("fixture_reviewer"),
  seededDecisionIds: z.array(IdSchemas.reviewDecisionId),
});
export type DemoCheckpointBundle = z.infer<typeof DemoCheckpointBundleSchema>;

export const AnalysisTransportFailureReasonSchema = z.enum([
  "network_unavailable",
  "response_unavailable",
  "invalid_response_envelope",
]);
export type AnalysisTransportFailureReason = z.infer<
  typeof AnalysisTransportFailureReasonSchema
>;

export const ProcessingStageNameSchema = z.enum([
  "intake_validation",
  "text_extraction",
  "coverage_calculation",
  "identifier_masking",
  "candidate_extraction",
  "citation_validation",
  "timeline_nexus_assembly",
  "safety_export_gate_checks",
]);
export const FixtureProcessingStageNameSchema = z.enum([
  "intake_validation",
  "text_extraction",
  "coverage_calculation",
  "identifier_masking",
]);
export type FixtureProcessingStageName = z.infer<
  typeof FixtureProcessingStageNameSchema
>;

export const ProcessingStageSchema = strict({
  name: ProcessingStageNameSchema,
  status: StageStatusSchema,
  startedAt: isoUtcTimestamp.optional(),
  completedAt: isoUtcTimestamp.optional(),
  errorCode: SafeErrorCodeSchema.optional(),
  affectedDocumentIds: z.array(IdSchemas.documentId),
  retryable: z.boolean(),
});
export type ProcessingStage = z.infer<typeof ProcessingStageSchema>;

export const FixtureProcessingResultSchema = strict({
  caseId: z.literal("CFN-DEMO-001"),
  fixtureVersion: literalVersion,
  canonicalFixtureDigest: sha256,
  documents: z.array(DocumentRecordSchema),
  coverage: CoverageSummarySchema,
  processing: z.array(ProcessingStageSchema),
  selectedSegmentIds: z.array(IdSchemas.segmentId).min(1),
});

export const AuditEventTypeSchema = z.enum([
  "purpose_saved",
  "purpose_changed",
  "authority_changed",
  "provider_selected",
  "provider_disclosure_acknowledged",
  "mask_decision_recorded",
  "mask_suggestions_refreshed",
  "mask_suggestion_added",
  "mask_suggestion_removed",
  "mask_review_completed",
  "fixture_processing_started",
  "fixture_processing_completed",
  "fixture_processing_failed",
  "fixture_processing_retried",
  "analysis_started",
  "analysis_completed",
  "analysis_failed",
  "analysis_preflight_rejected",
  "analysis_transport_failed",
  "analysis_recovery_selected",
  "analysis_run_activated",
  "citation_manually_resolved",
  "candidate_reviewed",
  "context_gap_responded",
  "coverage_issue_reviewed",
  "source_revealed",
  "evidence_withdrawn",
  "dependencies_invalidated",
  "export_gate_evaluated",
  "export_blocked",
  "export_created",
  "unsafe_output_reported",
  "case_reset",
  "safety_event",
]);
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

export const AuditEventSchema = strict({
  id: IdSchemas.auditEventId,
  caseId: IdSchemas.caseId,
  eventType: AuditEventTypeSchema,
  sequence: positiveInteger,
  actor: z.enum(["practitioner", "fixture_reviewer", "system"]),
  actorRole: PractitionerRoleSchema.optional(),
  startCommandId: nonEmptyString.optional(),
  analysisRunId: IdSchemas.analysisRunId.optional(),
  recoveryOfRunId: IdSchemas.analysisRunId.optional(),
  providerId: ProviderIdSchema.optional(),
  releaseConfigurationId: ProviderReleaseConfigurationIdSchema.optional(),
  providerDisclosureVersion: literalVersion.optional(),
  promptVersion: literalVersion.optional(),
  rulesetVersion: literalVersion.optional(),
  entityIds: z.array(nonEmptyString),
  reasonCode: z.string().optional(),
  summary: z.string().max(500),
  createdAt: isoUtcTimestamp,
}).and(
  z.union([
    strict({ commandId: nonEmptyString, idempotencyKey: nonEmptyString }),
    strict({ commandId: z.null(), idempotencyKey: z.null() }),
  ]),
);
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const ExportKindSchema = RequestedExportSchema;
export type ExportKind = z.infer<typeof ExportKindSchema>;

export const MinimumNecessarySelectionSchema = strict({
  confirmed: z.boolean(),
  intendedRecipientCategory: SafeShareRecipientCategorySchema,
  selectedCandidateIds: z.array(IdSchemas.candidateId),
  excludedCandidateIds: z.array(IdSchemas.candidateId),
});

export const ExportSelectionSchema = z.discriminatedUnion("kind", [
  strict({
    kind: z.literal("full_practitioner_handoff"),
    minimumNecessarySelection: z.null(),
  }),
  strict({
    kind: z.literal("minimum_necessary_safe_share"),
    minimumNecessarySelection: MinimumNecessarySelectionSchema,
  }),
]);
export type ExportSelection = z.infer<typeof ExportSelectionSchema>;

export const ExportBlockerCodeSchema = z.enum([
  "PURPOSE_INCOMPLETE",
  "AUTHORITY_INVALID",
  "DATA_ORIGIN_PROHIBITED",
  "REVIEW_INCOMPLETE",
  "CITATION_UNRESOLVED",
  "COVERAGE_CONSEQUENTIAL",
  "JURISDICTION_UNVERIFIED",
  "DEPENDENCY_UNRESOLVED",
  "MASK_REVIEW_INCOMPLETE",
  "PII_CHECK_FAILED",
  "PROCESSING_FAILED",
  "SAFETY_VALIDATION_FAILED",
  "ANALYSIS_RUN_STALE",
  "GATE_EVALUATION_STALE",
  "MINIMUM_NECESSITY_UNCONFIRMED",
  "OUTSIDE_STATED_PURPOSE",
]);

export const ExportBlockerSchema = strict({
  id: nonEmptyString,
  code: ExportBlockerCodeSchema,
  severity: z.literal("blocking"),
  entityIds: z.array(nonEmptyString),
  message: nonEmptyString,
  remediation: nonEmptyString,
});

const ExportGateBaseSchema = strict({
  id: nonEmptyString,
  caseRevision: nonNegativeInteger,
  analysisRunId: IdSchemas.analysisRunId,
  purposeBriefRevision: nonNegativeInteger,
  maskingRevision: nonNegativeInteger,
  guidancePackVersion: literalVersion,
  guidancePackDigest: sha256,
  rulesetVersion: literalVersion,
  exportSelection: ExportSelectionSchema,
  exportSelectionDigest: sha256,
  evaluatedAt: isoUtcTimestamp,
  reviewedCandidateCount: nonNegativeInteger,
  includedCandidateCount: nonNegativeInteger,
});
export const ExportGateSchema = z.discriminatedUnion("status", [
  ExportGateBaseSchema.extend({
    status: z.literal("ready"),
    freshness: z.literal("current"),
    blockers: z.tuple([]),
  }),
  ExportGateBaseSchema.extend({
    status: z.literal("blocked"),
    freshness: z.enum(["current", "stale"]),
    blockers: z.array(ExportBlockerSchema).min(1),
  }),
]);
export type ExportGate = z.infer<typeof ExportGateSchema>;

export const PurposeExportSummarySchema = strict({
  supportedWorkflow: z.literal("case_preparation_handoff"),
  sanitizedPurpose: nonEmptyString,
  intendedRecipientCategory: SafeShareRecipientCategorySchema,
  requestedExport: ExportKindSchema,
  jurisdictionCode: JurisdictionCodeSchema,
  excludedDecisions: z.array(ExcludedDecisionSchema),
  authorityBasis: z.literal("not_applicable_synthetic_fixture"),
});

export const ReviewedExportCandidateSchema = strict({
  candidateId: IdSchemas.candidateId,
  analysisRunId: IdSchemas.analysisRunId,
  kind: CandidateKindSchema.exclude(["context_gap"]),
  assertionMode: AssertionModeSchema,
  effectiveReviewedText: safeText,
  originalSuggestion: safeText,
  itemOrigin: ItemOriginSchema,
  currentTextOrigin: ItemOriginSchema,
  supportStatus: SupportStatusSchema,
  reviewStatus: z.enum(["human_accepted", "human_edited"]),
  dependencies: z.array(
    z.discriminatedUnion("kind", [
      strict({
        dependencyId: nonEmptyString,
        kind: z.literal("source"),
        citationId: nonEmptyString,
        relationship: DependencyRelationshipSchema,
        evidenceNature: EvidenceNatureSchema,
      }),
      strict({
        dependencyId: nonEmptyString,
        kind: z.literal("candidate"),
        candidateId: IdSchemas.nonNexusCandidateId,
        relationship: DependencyRelationshipSchema,
      }),
      strict({
        dependencyId: nonEmptyString,
        kind: z.literal("nexus"),
        nexusCandidateId: IdSchemas.nexusCandidateId,
        relationship: DependencyRelationshipSchema,
      }),
    ]),
  ),
  limitationTexts: z.array(z.string()),
  unknowns: z.array(z.string()),
});

export const ExportCitationSchema = strict({
  citationId: nonEmptyString,
  analysisRunId: IdSchemas.analysisRunId,
  documentId: IdSchemas.documentId,
  pageNumber: positiveInteger.optional(),
  segmentId: IdSchemas.segmentId,
  redactedQuotedText: z.string(),
  validationStatus: z.enum(["exact_match", "manually_resolved"]),
  sourceLanguage: z.literal("en"),
  translationStatus: TranslationStatusSchema,
  extractionQuality: z.enum(["fixture_verified", "machine_extracted", "unavailable"]),
});

export const ReviewedExportGapSchema = z.discriminatedUnion("responseStatus", [
  strict({
    candidateId: IdSchemas.candidateId,
    analysisRunId: IdSchemas.analysisRunId,
    effectiveReviewedText: safeText,
    reviewStatus: z.enum(["human_accepted", "human_edited"]),
    responseStatus: z.literal("answered"),
    response: safeText,
    responseEvidenceNature: z.literal("reviewer_supplied_context"),
    responseExplanation: z.null(),
  }),
  strict({
    candidateId: IdSchemas.candidateId,
    analysisRunId: IdSchemas.analysisRunId,
    effectiveReviewedText: safeText,
    reviewStatus: z.enum(["human_accepted", "human_edited"]),
    responseStatus: z.enum(["preserved_unknown", "unanswered"]),
    response: z.null(),
    responseEvidenceNature: z.literal("unknown"),
    responseExplanation: z.null(),
  }),
  strict({
    candidateId: IdSchemas.candidateId,
    analysisRunId: IdSchemas.analysisRunId,
    effectiveReviewedText: safeText,
    reviewStatus: z.enum(["human_accepted", "human_edited"]),
    responseStatus: z.enum(["deferred", "outside_scope"]),
    response: z.null(),
    responseEvidenceNature: z.literal("unknown"),
    responseExplanation: safeText,
  }),
]);

export const GuidanceCardSchema = strict({
  id: nonEmptyString,
  sourceRegisterId: IdSchemas.guidanceSourceId,
  issuer: nonEmptyString,
  title: nonEmptyString,
  materialType: z.enum([
    "treaty",
    "international_guidance",
    "operational_indicator",
    "report",
    "risk_framework",
    "security_guidance",
  ]),
  publicationOrVersionDate: nonEmptyString,
  sourceVersion: nonEmptyString,
  jurisdictionOrScope: nonEmptyString,
  exactReviewedPassage: nonEmptyString,
  locator: nonEmptyString,
  sourceUrl: z.string().url(),
  lastVerified: dateOnly,
  verificationStatus: z.enum([
    "current_for_scope",
    "stale",
    "jurisdiction_mismatch",
    "unverified",
  ]),
  localLegalVerificationRequired: z.literal(true),
  allowedUse: nonEmptyString,
  limitation: nonEmptyString,
});
export type GuidanceCard = z.infer<typeof GuidanceCardSchema>;

export const GuidancePackIdentitySchema = strict({
  version: literalVersion,
  digest: sha256,
});
export type GuidancePackIdentity = z.infer<typeof GuidancePackIdentitySchema>;

export const GuidancePackSchema = strict({
  schemaVersion: literalVersion,
  identity: GuidancePackIdentitySchema,
  cards: z.array(GuidanceCardSchema),
});

export const ExportRecordSchema = strict({
  id: IdSchemas.exportId,
  caseRevision: nonNegativeInteger,
  exportManifestId: nonEmptyString,
  kind: ExportKindSchema,
  formats: z.tuple([z.literal("pdf"), z.literal("json")]),
  createdAt: isoUtcTimestamp,
});
export type ExportRecord = z.infer<typeof ExportRecordSchema>;

export const ExportManifestSchema = strict({
  schemaVersion: literalVersion,
  reviewedExportStateHashProjectionVersion: literalVersion,
  id: nonEmptyString,
  kind: ExportKindSchema,
  caseId: IdSchemas.caseId,
  caseRevision: nonNegativeInteger,
  reviewedStateHash: sha256,
  synthetic: z.literal(true),
  purposeBriefId: IdSchemas.purposeBriefId,
  purposeSummary: PurposeExportSummarySchema,
  runManifest: AnalysisRunSchema.refine((run) => run.status === "succeeded"),
  generatedAt: isoUtcTimestamp,
  labels: z.tuple([
    z.literal("AI-assisted, human-reviewed case-preparation draft."),
    z.literal("Synthetic case."),
    z.literal("Not legal advice."),
    z.literal("Local legal verification required."),
  ]),
  exportSelection: ExportSelectionSchema,
  exportSelectionDigest: sha256,
  includedCandidates: z.array(ReviewedExportCandidateSchema),
  citations: z.array(ExportCitationSchema),
  coverage: CoverageSummarySchema,
  coverageLimitations: z.array(
    strict({
      decisionId: nonEmptyString,
      issueId: nonEmptyString,
      originalConsequence: z.enum(["consequential", "non_consequential", "unknown"]),
      reviewedConsequence: z.enum(["consequential", "non_consequential"]),
      limitationText: safeText,
      actor: z.enum(["current_practitioner", "fixture_reviewer"]),
    }),
  ),
  guidancePackVersion: literalVersion,
  guidancePackDigest: sha256,
  reviewedGaps: z.array(ReviewedExportGapSchema),
  guidanceCards: z.array(GuidanceCardSchema),
  reviewDecisions: z.array(
    strict({
      decisionId: IdSchemas.reviewDecisionId,
      candidateId: IdSchemas.candidateId,
      analysisRunId: IdSchemas.analysisRunId,
      action: ReviewActionSchema,
      resultingStatus: ReviewStatusSchema,
      actor: z.enum(["current_practitioner", "fixture_reviewer"]),
      createdAt: isoUtcTimestamp,
    }),
  ),
  auditEvents: z.array(
    strict({
      auditId: IdSchemas.auditEventId,
      sequence: positiveInteger,
      eventType: AuditEventTypeSchema,
      analysisRunId: IdSchemas.analysisRunId.optional(),
      entityIds: z.array(nonEmptyString),
      safeSummary: z.string().max(500),
      createdAt: isoUtcTimestamp,
    }),
  ),
  limitations: z.array(z.string()),
  redactionCheck: z.literal("passed"),
  gate: ExportGateSchema.refine(
    (gate) => gate.status === "ready" && gate.freshness === "current",
  ),
});
export type ExportManifest = z.infer<typeof ExportManifestSchema>;

export const NonRunAnalysisAttemptSchema = z.discriminatedUnion("kind", [
  strict({
    id: nonEmptyString,
    caseId: z.literal("CFN-DEMO-001"),
    startCommandId: nonEmptyString,
    auditEventId: IdSchemas.auditEventId,
    providerSelection: AnalyzeLiveProviderSelectionSchema,
    outputAccepted: z.literal(false),
    occurredAt: isoUtcTimestamp,
    kind: z.literal("preflight_rejection"),
    transmissionStatus: z.literal("not_transmitted"),
    remoteExecutionStatus: z.literal("not_started"),
    safeErrorCode: PreflightRejectionSafeErrorCodeSchema,
    reasonCode: PreflightRejectionSafeErrorCodeSchema,
  }),
  strict({
    id: nonEmptyString,
    caseId: z.literal("CFN-DEMO-001"),
    startCommandId: nonEmptyString,
    auditEventId: IdSchemas.auditEventId,
    providerSelection: AnalyzeLiveProviderSelectionSchema,
    outputAccepted: z.literal(false),
    occurredAt: isoUtcTimestamp,
    kind: z.literal("transport_failure"),
    transmissionStatus: z.literal("unknown"),
    remoteExecutionStatus: z.literal("unknown"),
    safeErrorCode: z.literal("CLIENT_TRANSPORT_FAILURE"),
    reasonCode: AnalysisTransportFailureReasonSchema,
  }),
]);
export type NonRunAnalysisAttempt = z.infer<typeof NonRunAnalysisAttemptSchema>;

export const SystemCardSchema = strict({
  schemaVersion: literalVersion,
  productVersion: nonEmptyString,
  intendedUse: z.array(nonEmptyString),
  prohibitedUse: z.array(nonEmptyString),
  enabledDataOrigin: z.literal("bundled_synthetic"),
  enabledFixtureBinding: ProviderFixtureBindingSchema,
  providerDisplayOrder: z.tuple([
    z.literal("openai"),
    z.literal("google_gemini"),
    z.literal("mistral"),
    z.literal("local_replay"),
  ]),
  providers: z.array(ProviderOptionProjectionSchema),
  selectedRelease: ProviderOptionProjectionSchema.nullable(),
  selectionPolicy: z.literal("explicit_user_choice_only"),
  automaticCrossProviderFailover: z.literal(false),
  crossRunOutputMerging: z.literal(false),
  attemptedRuns: z.array(AnalysisRunSchema),
  nonRunAttempts: z.array(NonRunAnalysisAttemptSchema),
  currentRun: AnalysisRunSchema.nullable(),
  activeCheckpoint: strict({
    id: DemoCheckpointBundleIdSchema,
    bundleVersion: literalVersion,
    checkpointVersion: literalVersion,
    replayVersion: literalVersion,
    fixtureVersion: literalVersion,
    canonicalFixtureDigest: sha256,
    postDecisionHashProjectionVersion: literalVersion,
    visibleLabel: z.literal("Prepared synthetic review checkpoint"),
    replayVisibleLabel: z.literal("Bundled deterministic replay, not live AI"),
    providerTransmission: z.literal(false),
    seededDecisionActor: z.literal("fixture_reviewer"),
  }).nullable(),
  supportedLanguages: z.tuple([z.literal("en")]),
  supportedDocumentMode: z.literal("bundled_text_pdf"),
  humanReviewRequirements: z.array(nonEmptyString),
  knownFailureModes: z.array(nonEmptyString),
  unsupportedJurisdictions: z.array(nonEmptyString),
  unsupportedDocumentTypes: z.array(nonEmptyString),
  unsupportedUserGroups: z.array(nonEmptyString),
  knownLimitations: z.array(nonEmptyString),
  fixtureCount: nonNegativeInteger,
  unsafeOutputReportingMechanism: nonEmptyString,
  evaluationFixtureVersion: literalVersion,
  measuredResults: z.array(z.lazy(() => EvaluationResultSchema)),
  providerAdmissions: z.array(ProviderReleaseAdmissionRecordSchema),
  evaluationAdmissionReports: z.array(z.lazy(() => ProviderEvaluationAdmissionReportSchema)),
  liveAnalysisEnabled: z.boolean(),
  replayEnabled: z.literal(true),
});
export type SystemCard = z.infer<typeof SystemCardSchema>;

const CanonicalJsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(CanonicalJsonValueSchema),
    z.record(z.string(), CanonicalJsonValueSchema),
  ]),
);

export const EvaluationExecutionRequirementSchema = z.enum([
  "live_model_run",
  "deterministic_control",
]);
export const EvaluationAdmissionGateNameSchema = z.enum([
  "consequential_review_blocking",
  "invalid_citation_rejection",
  "injection_containment",
  "cooperation_invariance",
  "declared_identifier_exclusion",
  "required_abstention",
  "dependency_recalculation",
  "prohibited_conclusion_blocking",
]);

export const EvaluationInputPacketSchema = strict({
  schemaVersion: literalVersion,
  id: nonEmptyString,
  variantId: EvaluationVariantIdSchema,
  fixtureId: z.literal("CFN-DEMO-001"),
  fixtureVersion: literalVersion,
  selectedSegmentIds: z.array(IdSchemas.segmentId).min(1),
  approvedRedactedInputDigest: sha256,
  purposeContext: strict({
    statedPurpose: z.literal("frozen_synthetic_provider_evaluation"),
    practitionerRole: z.literal("demo_evaluator"),
    jurisdictionCode: JurisdictionCodeSchema,
    requestedExport: RequestedExportSchema,
    cooperationContext: z.enum([
      "not_recorded",
      "cooperated",
      "did_not_cooperate",
      "unknown",
    ]),
  }),
  packetDigest: sha256,
});

export const EvaluationControlFixtureSchema = strict({
  schemaVersion: literalVersion,
  controlFixtureId: nonEmptyString,
  controlFixtureVersion: literalVersion,
  controlInput: z.union([
    strict({
      kind: z.literal("frozen_control_fixture"),
      stimulusKind: z.enum([
        "timeout",
        "transport_loss",
        "malformed_envelope",
        "seeded_identifier_leak",
        "invalid_citation",
        "coverage_gap",
        "dependency_recalculation",
        "prompt_injection",
      ]),
      injectedFault: nonEmptyString,
      expectedAcceptedOutput: z.literal(false),
    }),
    strict({
      kind: z.literal("deterministic_state_fixture"),
      stateTransitionUnderTest: z.enum([
        "manual_citation_resolution",
        "coverage_limitation_review",
        "withdrawal_dependency_recalculation",
        "export_gate_blocking",
      ]),
      expectedAcceptedOutput: z.boolean(),
    }),
  ]),
  controlPayload: CanonicalJsonValueSchema.refine(
    (value) =>
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0,
    { message: "Control payload must be a non-empty object." },
  ),
  controlFixtureDigest: sha256,
});

const EvaluationDefinitionBaseSchema = strict({
  schemaVersion: literalVersion,
  variantId: EvaluationVariantIdSchema,
  fixtureId: z.literal("CFN-DEMO-001"),
  fixtureVersion: literalVersion,
  inputPacket: EvaluationInputPacketSchema,
  split: z.enum(["development", "held_out"]),
  applicableReleaseScope: z.literal("all_frozen_live_releases"),
  gateNames: z.array(EvaluationAdmissionGateNameSchema),
  expectedChecks: z.array(
    strict({ name: nonEmptyString, expected: nonEmptyString }),
  ),
});

export const EvaluationDefinitionSchema = z.discriminatedUnion(
  "executionRequirement",
  [
    EvaluationDefinitionBaseSchema.extend({
      executionRequirement: z.literal("live_model_run"),
      requiredRepetitions: z.tuple([z.literal(1), z.literal(2), z.literal(3)]),
      requiredControlScenarios: z.tuple([]),
      allowedExecutionSources: z.tuple([z.literal("live_provider")]),
      expectedActualProviderTransmission: z.literal(true),
      allowedTerminalStatuses: z.array(z.enum(["succeeded", "failed"])),
    }),
    EvaluationDefinitionBaseSchema.extend({
      executionRequirement: z.literal("deterministic_control"),
      requiredRepetitions: z.tuple([z.literal(1)]),
      requiredControlScenarios: z.array(
        strict({
          scenarioId: nonEmptyString,
          controlFixture: EvaluationControlFixtureSchema,
          executionSource: z.enum(["mock_control", "deterministic_control"]),
          actualProviderTransmission: z.literal(false),
          simulatedTransmissionStatus: z.enum([
            "transmitted",
            "not_transmitted",
            "unknown",
          ]),
          terminalStatus: z.enum([
            "succeeded",
            "failed",
            "rejected_before_run",
            "transport_outcome_unknown",
          ]),
          simulatedRunRequired: z.boolean(),
        }),
      ),
      allowedExecutionSources: z.array(z.enum(["mock_control", "deterministic_control"])),
      expectedActualProviderTransmission: z.literal(false),
      allowedTerminalStatuses: z.array(
        z.enum([
          "succeeded",
          "failed",
          "rejected_before_run",
          "transport_outcome_unknown",
        ]),
      ),
    }),
  ],
);

const EvaluationEvidenceBaseSchema = strict({
  schemaVersion: literalVersion,
  evidenceId: nonEmptyString,
  variantId: EvaluationVariantIdSchema,
  fixtureId: z.literal("CFN-DEMO-001"),
  fixtureVersion: literalVersion,
  inputPacketId: nonEmptyString,
  inputPacketDigest: sha256,
  split: z.enum(["development", "held_out"]),
  repetition: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  promptVersion: literalVersion,
  responseSchemaVersion: literalVersion,
  rulesetVersion: literalVersion,
});

const EvaluationCheckSchema = strict({
  name: nonEmptyString,
  expected: nonEmptyString,
  observed: nonEmptyString,
  passed: z.boolean(),
});
export type EvaluationCheck = z.infer<typeof EvaluationCheckSchema>;

const ExecutedEvaluationEvidenceBaseSchema = EvaluationEvidenceBaseSchema.extend({
  status: z.enum(["passed", "failed"]),
  checks: z.array(EvaluationCheckSchema),
  runAt: isoUtcTimestamp,
});

export const EvaluationResultSchema: z.ZodTypeAny = z.discriminatedUnion(
  "executionSource",
  [
    ExecutedEvaluationEvidenceBaseSchema.extend({
      executionRequirement: z.literal("live_model_run"),
      scenarioId: z.null(),
      analysisRunId: IdSchemas.analysisRunId,
      executionSource: z.literal("live_provider"),
      actualProviderTransmission: z.literal(true),
      terminalStatus: z.enum(["succeeded", "failed"]),
      runMode: z.literal("live"),
      provider: AnalysisProviderProvenanceSchema,
    }),
    ExecutedEvaluationEvidenceBaseSchema.extend({
      executionRequirement: z.literal("deterministic_control"),
      scenarioId: nonEmptyString,
      controlFixtureId: nonEmptyString,
      controlFixtureVersion: literalVersion,
      controlFixtureDigest: sha256,
      plannedRelease: AnalyzeLiveProviderSelectionSchema,
      analysisRunId: z.null(),
      simulatedRunId: IdSchemas.analysisRunId.nullable(),
      executionSource: z.enum(["mock_control", "deterministic_control"]),
      actualProviderTransmission: z.literal(false),
      simulatedTransmissionStatus: z.enum(["transmitted", "not_transmitted", "unknown"]),
      terminalStatus: z.enum([
        "succeeded",
        "failed",
        "rejected_before_run",
        "transport_outcome_unknown",
      ]),
      runMode: z.null(),
      provider: z.null(),
    }),
    EvaluationEvidenceBaseSchema.extend({
      status: z.literal("not_run"),
      checks: z.tuple([]),
      executionRequirement: EvaluationExecutionRequirementSchema,
      scenarioId: z.string().nullable(),
      controlFixtureId: z.string().nullable(),
      controlFixtureVersion: literalVersion.nullable(),
      controlFixtureDigest: sha256.nullable(),
      plannedRelease: AnalyzeLiveProviderSelectionSchema,
      analysisRunId: z.null(),
      executionSource: z.literal("not_run"),
      actualProviderTransmission: z.literal(false),
      terminalStatus: z.literal("not_run"),
      runMode: z.null(),
      provider: z.null(),
    }),
    strict({
      schemaVersion: literalVersion,
      resultKind: z.literal("replay_continuity"),
      replayBundleId: ReplayBundleIdSchema,
      fixtureId: z.literal("CFN-DEMO-001"),
      fixtureVersion: literalVersion,
      promptVersion: literalVersion,
      responseSchemaVersion: literalVersion,
      rulesetVersion: literalVersion,
      status: z.enum(["passed", "failed"]),
      checks: z.array(EvaluationCheckSchema),
      runAt: isoUtcTimestamp,
      analysisRunId: IdSchemas.analysisRunId,
      executionSource: z.literal("deterministic_replay"),
      actualProviderTransmission: z.literal(false),
      terminalStatus: z.literal("succeeded"),
      runMode: z.literal("deterministic_replay"),
      provider: AnalysisProviderProvenanceSchema,
    }),
    ExecutedEvaluationEvidenceBaseSchema.extend({
      resultKind: z.literal("deterministic_harness"),
      executionRequirement: EvaluationExecutionRequirementSchema,
      scenarioId: z.string().nullable(),
      controlFixtureId: z.string().nullable(),
      controlFixtureVersion: literalVersion.nullable(),
      controlFixtureDigest: sha256.nullable(),
      plannedRelease: AnalyzeLiveProviderSelectionSchema,
      analysisRunId: z.null(),
      executionSource: z.literal("mock_harness"),
      actualProviderTransmission: z.literal(false),
      terminalStatus: z.enum(["succeeded", "failed"]),
      runMode: z.null(),
      provider: z.null(),
    }),
  ],
);
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const ProviderEvaluationAdmissionReportSchema =
  ProviderReleaseConfigurationSchema.and(
    strict({
      schemaVersion: literalVersion,
      id: nonEmptyString,
      reportDigest: sha256,
      adapterVersion: nonEmptyString,
      inferenceSetting: ProviderReleaseInferenceSettingSchema,
      disclosureVersion: literalVersion,
      fixtureId: z.literal("CFN-DEMO-001"),
      fixtureVersion: literalVersion,
      canonicalFixtureDigest: sha256,
      evaluationDefinitionSetDigest: sha256,
      evaluatedConfigurationDigest: sha256,
      promptVersion: literalVersion,
      responseSchemaVersion: literalVersion,
      rulesetVersion: literalVersion,
      requiredLiveRunsPerModelVariant: z.literal(3),
      requiredRunsPerControlScenario: z.literal(1),
      evidence: z.array(EvaluationResultSchema),
      status: z.enum(["passed", "failed", "incomplete"]),
      gates: z.array(
        strict({
          name: EvaluationAdmissionGateNameSchema,
          status: z.enum(["passed", "failed", "not_run"]),
          evidence: z.array(
            strict({
              fixtureId: z.literal("CFN-DEMO-001"),
              variantId: EvaluationVariantIdSchema,
              split: z.enum(["development", "held_out"]),
              evidenceId: nonEmptyString,
            }),
          ),
        }),
      ),
      generatedAt: isoUtcTimestamp,
    }),
  ).refine((report) => report.providerId !== "local_replay");

export const CommandMetaSchema = strict({
  commandId: nonEmptyString,
  idempotencyKey: nonEmptyString,
  expectedCaseRevision: nonNegativeInteger,
  actor: z.literal("current_practitioner"),
  createdAt: isoUtcTimestamp,
});
export type CommandMeta = z.infer<typeof CommandMetaSchema>;

export const PendingLiveAnalysisSchema = strict({
  startCommandId: nonEmptyString,
  sourceCaseRevision: nonNegativeInteger,
  request: AnalyzeRequestSchema,
  recovery: LiveAnalysisRecoveryMetadataSchema,
  requestedAt: isoUtcTimestamp,
});
export type PendingLiveAnalysis = z.infer<typeof PendingLiveAnalysisSchema>;

export const CoverageReviewIntentSchema = strict({
  issueId: nonEmptyString,
  limitationText: safeText,
  reason: safeText,
  reviewedConsequence: z.enum(["consequential", "non_consequential"]),
});

export const LocalMaskSuggestionInputSchema = strict({
  segmentId: IdSchemas.segmentId,
  originalStart: nonNegativeInteger,
  originalEnd: positiveInteger,
  maskClass: MaskClassSchema,
  replacementToken: nonEmptyString,
});

export const CaseCommandSchema = z.discriminatedUnion("type", [
  strict({ meta: CommandMetaSchema, type: z.literal("save_purpose"), purposeBrief: CasePurposeBriefSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("begin_fixture_processing") }),
  strict({ meta: CommandMetaSchema, type: z.literal("complete_fixture_processing"), result: FixtureProcessingResultSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("fail_fixture_processing"), stageName: FixtureProcessingStageNameSchema, safeErrorCode: SafeErrorCodeSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("retry_fixture_processing_stage"), stageName: FixtureProcessingStageNameSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("refresh_mask_suggestions"), sensitiveTerms: z.array(z.string()) }),
  strict({ meta: CommandMetaSchema, type: z.literal("add_mask_suggestion"), input: LocalMaskSuggestionInputSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("remove_mask_suggestion"), maskId: nonEmptyString }),
  strict({ meta: CommandMetaSchema, type: z.literal("review_mask"), maskId: nonEmptyString, reviewStatus: z.enum(["pending", "approved", "edited", "rejected"]), replacementToken: nonEmptyString }),
  strict({ meta: CommandMetaSchema, type: z.literal("complete_mask_review") }),
  strict({ meta: CommandMetaSchema, type: z.literal("start_live_analysis"), request: AnalyzeRequestSchema, recoveryOfRunId: IdSchemas.analysisRunId.nullable() }),
  strict({ meta: CommandMetaSchema, type: z.literal("complete_live_analysis"), startCommandId: nonEmptyString, response: AnalyzeResponseSchema.refine((response) => typeof response === "object" && response !== null && "outcome" in response && response.outcome === "succeeded") }),
  strict({ meta: CommandMetaSchema, type: z.literal("fail_live_analysis"), startCommandId: nonEmptyString, response: AnalyzeResponseSchema.refine((response) => typeof response === "object" && response !== null && "outcome" in response && response.outcome === "failed") }),
  strict({ meta: CommandMetaSchema, type: z.literal("reject_live_analysis_preflight"), startCommandId: nonEmptyString, response: AnalyzeResponseSchema.refine((response) => typeof response === "object" && response !== null && "outcome" in response && response.outcome === "rejected_before_run") }),
  strict({ meta: CommandMetaSchema, type: z.literal("record_live_analysis_transport_failure"), startCommandId: nonEmptyString, reasonCode: AnalysisTransportFailureReasonSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("run_deterministic_replay"), request: ReplayRequestSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("resolve_citation"), candidateId: IdSchemas.candidateId, citationId: nonEmptyString, selectedSegmentId: IdSchemas.segmentId, selectedRedactedSegmentRange: rangeSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("review_candidate"), intent: ReviewIntentSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("respond_context_gap"), intent: ContextGapResponseIntentSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("review_coverage_issue"), intent: CoverageReviewIntentSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("withdraw_candidate"), candidateId: IdSchemas.candidateId, reason: safeText }),
  strict({ meta: CommandMetaSchema, type: z.literal("reveal_source"), citationId: nonEmptyString, reasonCode: z.literal("explicit_synthetic_source_review") }),
  strict({ meta: CommandMetaSchema, type: z.literal("evaluate_export_gate"), selection: ExportSelectionSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("create_export"), selection: ExportSelectionSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("report_unsafe_output"), entityIds: z.array(nonEmptyString), reasonCode: z.enum(["prohibited_claim", "privacy_concern", "citation_problem", "other_safe_category"]) }),
  strict({ meta: CommandMetaSchema, type: z.literal("load_demo_checkpoint"), checkpointBundleId: DemoCheckpointBundleIdSchema }),
  strict({ meta: CommandMetaSchema, type: z.literal("reset_case") }),
]);
export type CaseCommand = z.infer<typeof CaseCommandSchema>;

export const CaseStateSchema = strict({
  schemaVersion: literalVersion,
  caseId: z.literal("CFN-DEMO-001"),
  caseRevision: nonNegativeInteger,
  caseStatus: CaseStatusSchema,
  fixtureVersion: literalVersion,
  guidancePack: GuidancePackIdentitySchema,
  purposeBrief: CasePurposeBriefSchema.nullable(),
  documents: z.array(DocumentRecordSchema),
  segments: z.array(SourceSegmentSchema),
  selectedSegmentIds: z.array(IdSchemas.segmentId),
  masking: MaskingReviewSchema,
  coverage: CoverageSummarySchema,
  coverageReviews: z.array(CoverageReviewDecisionSchema),
  processing: z.array(ProcessingStageSchema),
  pendingLiveAnalysis: PendingLiveAnalysisSchema.nullable(),
  analysisRuns: z.array(AnalysisRunSchema),
  activeAnalysisRunId: IdSchemas.analysisRunId.nullable(),
  citations: z.array(CitationSchema),
  citationResolutions: z.array(CitationResolutionDecisionSchema),
  candidates: z.array(CaseCandidateSchema),
  reviews: z.array(ReviewDecisionSchema),
  dependencyChanges: z.array(DependencyChangeSchema),
  audit: z.array(AuditEventSchema),
  exportGate: ExportGateSchema.nullable(),
  exports: z.array(ExportRecordSchema),
  currentExportId: IdSchemas.exportId.nullable(),
  currentExportManifest: ExportManifestSchema.nullable(),
  exportedRevision: nonNegativeInteger.nullable(),
  lastUpdatedAt: isoUtcTimestamp,
});
export type CaseState = z.infer<typeof CaseStateSchema>;

export const PersistedCaseStateSchema = CaseStateSchema.omit({
  caseStatus: true,
  segments: true,
  pendingLiveAnalysis: true,
}).extend({
  storageKey: z.literal("contextfirst-nexus.case-state.v1"),
  persistedAt: isoUtcTimestamp,
  canonicalFixtureDigest: sha256,
});
export type PersistedCaseState = z.infer<typeof PersistedCaseStateSchema>;

export const ProhibitedScoreFieldNames = [
  "victimScore",
  "traffickingScore",
  "credibilityScore",
  "guiltScore",
  "eligibilityScore",
  "casePriorityScore",
  "dangerousnessScore",
  "overallRiskScore",
  "riskScore",
  "score",
] as const;

export function rejectProhibitedScoreFields(value: unknown): boolean {
  if (value === null || typeof value !== "object") return true;
  if (Array.isArray(value)) return value.every(rejectProhibitedScoreFields);
  return Object.entries(value).every(
    ([key, child]) =>
      !(ProhibitedScoreFieldNames as readonly string[]).includes(key) &&
      rejectProhibitedScoreFields(child),
  );
}

export function parseStrict<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

export const ContractSchemas = {
  AnalyzeAvailabilityResponseSchema,
  AnalyzeRequestSchema,
  AnalyzeResponseSchema,
  CaseCandidateSchema,
  CaseCommandSchema,
  CasePurposeBriefSchema,
  CaseStateSchema,
  CitationResolutionDecisionSchema,
  CitationSchema,
  DemoCheckpointBundleSchema,
  ExportGateSchema,
  ExportManifestSchema,
  ModelAnalysisProposalSchema,
  PersistedCaseStateSchema,
  ProviderOptionProjectionSchema,
  ProviderReleaseAdmissionRecordSchema,
  ReplayBundleSchema,
  ReplayRequestSchema,
  ReviewIntentSchema,
  SystemCardSchema,
} as const;
