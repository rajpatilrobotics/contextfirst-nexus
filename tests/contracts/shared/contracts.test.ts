import { describe, expect, it } from "vitest";

import {
  AnalysisRecoveryOptionSchema,
  AnalyzeAvailabilityResponseSchema,
  AnalyzeRequestSchema,
  CaseCandidateSchema,
  CaseCommandSchema,
  CaseStateSchema,
  CitationSchema,
  ContractVersions,
  EvidenceNatureSchema,
  ExportManifestSchema,
  GoldenNexusIds,
  IdSchemas,
  ItemOriginSchema,
  LiveAnalysisExecutionResultSchema,
  MaskingReviewSchema,
  NonRunAnalysisAttemptSchema,
  PersistedCaseStateSchema,
  PreflightApiErrorSchema,
  ProviderOptionProjectionSchema,
  ProviderReleaseAdmissionRecordSchema,
  ProviderReleaseConfigurationSchema,
  ReplayBundleSchema,
  ReplayRequestSchema,
  ReviewIntentSchema,
  ReviewStatusSchema,
  SupportStatusSchema,
  SystemCardSchema,
  rejectProhibitedScoreFields,
} from "../../../lib/contracts";

const digest = "a".repeat(64);
const now = "2026-07-15T19:03:16Z";

const openAiSelection = {
  providerId: "openai",
  releaseConfigurationId: "openai-quality-v1",
  serviceTier: "paid",
} as const;

const acknowledgement = {
  ...openAiSelection,
  id: "ACK-OPENAI-001",
  schemaVersion: "1.0.0",
  disclosureVersion: "1.0.0",
  dataFlowAcknowledged: true,
  retentionAndTrainingUseAcknowledged: true,
  serviceTierAcknowledged: true,
  acknowledgedAt: now,
} as const;

const provider = {
  providerId: "openai",
  releaseConfigurationId: "openai-quality-v1",
  requestedModel: "gpt-5.6-sol",
  serviceTier: "paid",
  adapterVersion: "adapter-1",
  returnedModel: "gpt-5.6-sol",
  inferenceSetting: { kind: "reasoning_effort", value: "medium" },
  disclosureVersion: "1.0.0",
  providerTransmission: true,
} as const;

function baseCandidate(overrides: Record<string, unknown> = {}) {
  return {
    id: "CAND-TASK-0402",
    revision: 1,
    caseId: "CFN-DEMO-001",
    analysisRunId: "RUN-DEMO-LIVE-001",
    kind: "review_lane_item",
    title: "Task log assignment",
    proposedText: "The task log assigns a task.",
    currentText: "The task log assigns a task.",
    currentTextOrigin: "ai_suggestion",
    itemOrigin: "ai_suggestion",
    assertionMode: "positive_proposition",
    reviewRequirement: "individual",
    inclusionStatus: "active",
    supportStatus: "exact_source_supported",
    reviewStatus: "pending",
    dependencies: [],
    relatedCoverageIssueIds: [],
    unknowns: [],
    reviewQuestion: "Is this source-supported?",
    consequential: true,
    prohibitedConclusionCheck: "passed",
    safeShareRecipientCategories: ["legal_aid_team"],
    createdAt: now,
    ...overrides,
  };
}

function liveRun(overrides: Record<string, unknown> = {}) {
  return {
    id: "RUN-DEMO-LIVE-001",
    mode: "live",
    provider,
    promptVersion: "1.0.0",
    requestSchemaVersion: "1.0.0",
    responseSchemaVersion: "1.0.0",
    fixtureVersion: "1.0.0",
    rulesetVersion: "1.0.0",
    checkpointProvenance: null,
    startedAt: now,
    completedAt: now,
    durationMs: 1200,
    inputSegmentCount: 1,
    candidateCount: 0,
    citationCount: 0,
    quarantinedCount: 0,
    status: "succeeded",
    failure: null,
    ...overrides,
  };
}

function providerDisclosure(providerTransmission = true) {
  return {
    schemaVersion: "1.0.0",
    disclosureVersion: "1.0.0",
    serviceTierLabel: "Paid",
    dataFlowSummary: "Redacted synthetic text only.",
    storageMode: "openai_store_false",
    retentionSetting: "openai_store_false",
    retentionLimitation: "Configured no-store request.",
    trainingUseDisclosure: "No training use claimed beyond configured API terms.",
    providerContentCategories: ["approved redacted synthetic text"],
    processingRegion: null,
    allowedDataOrigins: ["bundled_synthetic"],
    providerTransmission,
    rawPdfSentToProvider: false,
    toolsEnabled: false,
    acknowledgementRequired: true,
    lastVerified: now,
  } as const;
}

describe("shared primitive and identifier contracts", () => {
  it("exports the frozen 1.0.0 version map", () => {
    expect(Object.values(ContractVersions).every((version) => version === "1.0.0")).toBe(true);
  });

  it("keeps exact enum spellings separate", () => {
    expect(EvidenceNatureSchema.options).toEqual([
      "documented_in_source",
      "reported_or_alleged_in_source",
      "reviewer_supplied_context",
      "unknown",
    ]);
    expect(ItemOriginSchema.options).toEqual([
      "source_extraction",
      "ai_suggestion",
      "human_created",
    ]);
    expect(SupportStatusSchema.options).toContain("citation_unresolved");
    expect(ReviewStatusSchema.options).toContain("human_edited");
  });

  it("validates documented identifier formats and rejects near misses", () => {
    expect(IdSchemas.caseId.parse("CFN-DEMO-001")).toBe("CFN-DEMO-001");
    expect(IdSchemas.segmentId.parse("D04-P2-S07")).toBe("D04-P2-S07");
    expect(IdSchemas.segmentId.parse("D05-META-01")).toBe("D05-META-01");
    expect(() => IdSchemas.segmentId.parse("D5-P2-S7")).toThrow();
  });

  it("rejects prohibited score fields recursively", () => {
    expect(rejectProhibitedScoreFields({ candidate: { supportStatus: "unknown" } })).toBe(true);
    expect(rejectProhibitedScoreFields({ candidate: { overallRiskScore: 0.8 } })).toBe(false);
  });
});

describe("provider and disclosure contracts", () => {
  it("preserves exact provider-release bindings", () => {
    expect(
      ProviderReleaseConfigurationSchema.parse({
        providerId: "mistral",
        releaseConfigurationId: "mistral-small-free-v1",
        requestedModel: "mistral-small-2603",
        serviceTier: "unpaid",
      }),
    ).toMatchObject({
      providerId: "mistral",
      requestedModel: "mistral-small-2603",
    });

    expect(() =>
      ProviderReleaseConfigurationSchema.parse({
        providerId: "mistral",
        releaseConfigurationId: "mistral-small-free-v1",
        requestedModel: "mistral-large",
        serviceTier: "unpaid",
      }),
    ).toThrow();
  });

  it("keeps provider option display order and live/replay mode distinct", () => {
    const option = {
      providerId: "local_replay",
      releaseConfigurationId: "prepared-replay-v1",
      requestedModel: "frozen_replay_output",
      serviceTier: "local",
      schemaVersion: "1.0.0",
      displayOrder: 4,
      displayName: "Bundled deterministic replay",
      modelDisplayName: "Frozen replay output",
      modelAliasDisclosure: "Versioned local replay, not live AI",
      adapterVersion: "replay-1",
      mode: "deterministic_replay",
      providerTransmission: false,
      evaluationStatus: "not_applicable",
      deployedAccountReleaseAvailabilityStatus: "not_required",
      availabilityStatus: "available",
      selectable: true,
      disclosure: {
        ...providerDisclosure(false),
        storageMode: "local_no_transmission",
        retentionSetting: "local_no_provider_retention",
      },
    };

    expect(ProviderOptionProjectionSchema.parse(option).displayOrder).toBe(4);
    expect(() =>
      ProviderOptionProjectionSchema.parse({ ...option, displayOrder: 1 }),
    ).toThrow();
  });

  it("requires Mistral deployed-account evidence when available and forbids not_required", () => {
    const baseRecord = {
      schemaVersion: "1.0.0",
      releaseConfigurationId: "mistral-small-free-v1",
      deployedAccountReleaseAvailability: {
        status: "available",
        evidenceId: "EVID-MISTRAL-ACCOUNT-001",
        verifiedAt: now,
      },
      evaluatedConfiguration: {
        providerId: "mistral",
        releaseConfigurationId: "mistral-small-free-v1",
        requestedModel: "mistral-small-2603",
        serviceTier: "unpaid",
        schemaVersion: "1.0.0",
        adapterVersion: "mistral-adapter-1",
        inferenceSetting: { kind: "reasoning_effort", value: "medium" },
        disclosureVersion: "1.0.0",
        fixtureBinding: {
          dataOrigin: "bundled_synthetic",
          caseId: "CFN-DEMO-001",
          fixtureVersion: "1.0.0",
          canonicalFixtureDigest: digest,
        },
        promptVersion: "1.0.0",
        requestSchemaVersion: "1.0.0",
        responseSchemaVersion: "1.0.0",
        rulesetVersion: "1.0.0",
        evaluationDefinitionSetDigest: digest,
        evaluatedConfigurationDigest: digest,
      },
      evaluationStatus: "passed",
      evaluationReportId: "REPORT-MISTRAL-001",
      evaluationReportDigest: digest,
      recordedAt: now,
    };

    expect(ProviderReleaseAdmissionRecordSchema.parse(baseRecord).evaluationStatus).toBe("passed");
    expect(() =>
      ProviderReleaseAdmissionRecordSchema.parse({
        ...baseRecord,
        deployedAccountReleaseAvailability: {
          status: "not_required",
          evidenceId: null,
          verifiedAt: null,
        },
      }),
    ).toThrow();
  });

  it("safe availability response preserves OpenAI, Gemini, Mistral, replay order", () => {
    const option = (providerId: "openai" | "google_gemini" | "mistral", displayOrder: 1 | 2 | 3) => ({
      providerId,
      releaseConfigurationId:
        providerId === "openai"
          ? "openai-quality-v1"
          : providerId === "google_gemini"
            ? "gemini-quality-v1"
            : "mistral-small-free-v1",
      requestedModel:
        providerId === "openai"
          ? "gpt-5.6-sol"
          : providerId === "google_gemini"
            ? "gemini-3.5-flash"
            : "mistral-small-2603",
      serviceTier: providerId === "openai" ? "paid" : "unpaid",
      schemaVersion: "1.0.0",
      displayOrder,
      displayName: providerId,
      modelDisplayName: providerId,
      modelAliasDisclosure: providerId,
      adapterVersion: "adapter-1",
      mode: "live",
      providerTransmission: true,
      evaluationStatus: "not_evaluated",
      deployedAccountReleaseAvailabilityStatus:
        providerId === "mistral" ? "not_verified" : "not_required",
      availabilityStatus: "disabled",
      selectable: false,
      disclosure: providerDisclosure(true),
    });

    const replay = {
      providerId: "local_replay",
      releaseConfigurationId: "prepared-replay-v1",
      requestedModel: "frozen_replay_output",
      serviceTier: "local",
      schemaVersion: "1.0.0",
      displayOrder: 4,
      displayName: "Replay",
      modelDisplayName: "Frozen replay output",
      modelAliasDisclosure: "Versioned local replay, not live AI",
      adapterVersion: "replay-1",
      mode: "deterministic_replay",
      providerTransmission: false,
      evaluationStatus: "not_applicable",
      deployedAccountReleaseAvailabilityStatus: "not_required",
      availabilityStatus: "available",
      selectable: true,
      disclosure: {
        ...providerDisclosure(false),
        storageMode: "local_no_transmission",
        retentionSetting: "local_no_provider_retention",
      },
    };

    const response = AnalyzeAvailabilityResponseSchema.parse({
      schemaVersion: "1.0.0",
      liveAnalysisEnabled: false,
      replayEnabled: true,
      options: [option("openai", 1), option("google_gemini", 2), option("mistral", 3), replay],
    });
    expect(response.options.map((item) => item.providerId)).toEqual([
      "openai",
      "google_gemini",
      "mistral",
      "local_replay",
    ]);
  });
});

describe("stateless API and run lifecycle contracts", () => {
  const request = {
    schemaVersion: "1.0.0",
    caseId: "CFN-DEMO-001",
    fixtureVersion: "1.0.0",
    canonicalFixtureDigest: digest,
    purposeBriefId: "PURPOSE-DEMO-001",
    purposeContext: {
      practitionerRole: "legal_aid",
      jurisdictionCode: "J-01",
      sourceLanguage: "en",
      requestedExport: "full_practitioner_handoff",
    },
    maskReviewApproved: true,
    leakScanStatus: "passed",
    requestedMode: "live",
    providerSelection: openAiSelection,
    providerDisclosureAcknowledgement: acknowledgement,
    selectedSegmentIds: ["D05-P1-S05"],
    maskApprovals: [],
  };

  it("accepts a narrow AnalyzeRequest and rejects raw content, URLs, and recovery linkage", () => {
    expect(AnalyzeRequestSchema.parse(request).requestedMode).toBe("live");
    expect(() =>
      AnalyzeRequestSchema.parse({
        ...request,
        recoveryOfRunId: "RUN-DEMO-LIVE-000",
      }),
    ).toThrow();
    expect(() => AnalyzeRequestSchema.parse({ ...request, rawText: "secret" })).toThrow();
    expect(() => AnalyzeRequestSchema.parse({ ...request, endpoint: "https://example.test" })).toThrow();
    expect(() => AnalyzeRequestSchema.parse({ ...request, purposeFreeText: "send everything" })).toThrow();
  });

  it("terminal live execution result has no recovery metadata", () => {
    expect(LiveAnalysisExecutionResultSchema.parse(liveRun()).status).toBe("succeeded");
    expect(() =>
      LiveAnalysisExecutionResultSchema.parse({
        ...liveRun(),
        recovery: {
          recoveryOfRunId: null,
          selectionReason: "initial_choice",
          selectedBy: "practitioner",
          automaticFailover: false,
          outputsMerged: false,
        },
      }),
    ).toThrow();
  });

  it("preflight API errors use the positive allowlist and no failed run", () => {
    expect(
      PreflightApiErrorSchema.parse({
        schemaVersion: "1.0.0",
        requestId: "REQ-1",
        userMessage: "Live analysis is disabled.",
        failedStage: "preflight",
        code: "LIVE_ANALYSIS_DISABLED",
        retryable: false,
        failedRunId: null,
        providerContext: openAiSelection,
        failureClassification: null,
        recoveryOptions: [],
      }).failedRunId,
    ).toBeNull();

    expect(() =>
      PreflightApiErrorSchema.parse({
        schemaVersion: "1.0.0",
        requestId: "REQ-1",
        userMessage: "Timeout.",
        failedStage: "preflight",
        code: "PROVIDER_TIMEOUT",
        retryable: false,
        failedRunId: null,
        providerContext: openAiSelection,
        failureClassification: null,
        recoveryOptions: [],
      }),
    ).toThrow();
  });

  it("recovery options keep same-provider retry first and replay after live releases", () => {
    expect(
      AnalysisRecoveryOptionSchema.parse({
        label: "Retry selected provider",
        automatic: false,
        action: "retry_same_provider",
        targetReleaseConfigurationId: "openai-quality-v1",
        displayOrder: 0,
        requiresDisclosureAcknowledgement: false,
        startsNewRun: true,
      }).displayOrder,
    ).toBe(0);
    expect(
      AnalysisRecoveryOptionSchema.parse({
        label: "Use bundled replay",
        automatic: false,
        action: "use_deterministic_replay",
        targetReleaseConfigurationId: "prepared-replay-v1",
        displayOrder: 4,
        requiresDisclosureAcknowledgement: true,
        startsNewRun: true,
      }).displayOrder,
    ).toBe(4);
  });
});

describe("candidate, citation, and review contracts", () => {
  it("enforces CaseCandidate discriminated union exclusivity", () => {
    expect(CaseCandidateSchema.parse(baseCandidate()).kind).toBe("review_lane_item");
    expect(() =>
      CaseCandidateSchema.parse({
        ...baseCandidate({ kind: "timeline_event" }),
        category: "control",
      }),
    ).toThrow();
  });

  it("uses one canonical Nexus ID as the candidate identity", () => {
    expect(GoldenNexusIds).toContain("NEXUS-OFFENCE-TIMING");
    const nexus = CaseCandidateSchema.parse(
      baseCandidate({
        id: "NEXUS-OFFENCE-TIMING",
        kind: "nexus_relationship",
        category: "offence_timing",
        requiredDependencyIds: ["DEP-1"],
        childCandidateIds: ["CAND-TASK-0402"],
        relationshipSummary: "Relationship summary.",
      }),
    );
    expect(nexus.id).toBe("NEXUS-OFFENCE-TIMING");
  });

  it("requires unresolved citations to carry null ranges and exact matches to carry ranges", () => {
    expect(
      CitationSchema.parse({
        id: "CIT-1",
        caseId: "CFN-DEMO-001",
        analysisRunId: "RUN-DEMO-LIVE-001",
        documentId: "D05",
        pageNumber: 1,
        segmentId: "D05-P1-S05",
        quotedText: "assigned task",
        normalizedQuotedText: "assigned task",
        quoteForm: "approved_redacted_derivative",
        redactionMapVersion: "1.0.0",
        sourceLanguage: "en",
        translationStatus: "original_language",
        extractionQuality: "fixture_verified",
        validationStatus: "ambiguous_match",
        redactedSegmentRange: null,
        sourceSegmentRange: null,
        boundingBoxes: [],
        resolutionMethod: null,
        resolvedBy: null,
      }).validationStatus,
    ).toBe("ambiguous_match");
  });

  it("keeps ReviewIntent narrow and withdrawal on its own command", () => {
    expect(
      ReviewIntentSchema.parse({
        candidateId: "CAND-TASK-0402",
        action: "accept",
        reason: null,
      }).action,
    ).toBe("accept");
    expect(() =>
      ReviewIntentSchema.parse({
        candidateId: "CAND-TASK-0402",
        action: "withdraw",
        reason: "remove it",
      }),
    ).toThrow();
    expect(() =>
      ReviewIntentSchema.parse({
        candidateId: "CAND-TASK-0402",
        action: "accept",
        resultingStatus: "human_accepted",
        actor: "current_practitioner",
        reason: null,
      }),
    ).toThrow();
  });

  it("allows withdrawal only through withdraw_candidate command", () => {
    expect(
      CaseCommandSchema.parse({
        meta: {
          commandId: "CMD-1",
          idempotencyKey: "IDEMP-1",
          expectedCaseRevision: 1,
          actor: "current_practitioner",
          createdAt: now,
        },
        type: "withdraw_candidate",
        candidateId: "CAND-TASK-0402",
        reason: "Source withdrawn.",
      }).type,
    ).toBe("withdraw_candidate");
  });
});

describe("replay, system card, export, and state contracts", () => {
  it("replay command accepts only the trusted replay bundle ID", () => {
    expect(
      ReplayRequestSchema.parse({
        mode: "deterministic_replay",
        replayBundleId: "REPLAY-CFN-DEMO-001-V1",
        caseId: "CFN-DEMO-001",
        releaseConfigurationId: "prepared-replay-v1",
        providerDisclosureAcknowledgementId: "ACK-REPLAY-001",
        recoveryOfRunId: null,
        fixtureVersion: "1.0.0",
        promptVersion: "1.0.0",
        analysisResponseVersion: "1.0.0",
        replayVersion: "1.0.0",
      }).replayBundleId,
    ).toBe("REPLAY-CFN-DEMO-001-V1");

    expect(() =>
      ReplayRequestSchema.parse({
        mode: "deterministic_replay",
        replayBundleId: "https://example.test/replay.json",
        caseId: "CFN-DEMO-001",
        releaseConfigurationId: "prepared-replay-v1",
        providerDisclosureAcknowledgementId: "ACK-REPLAY-001",
        recoveryOfRunId: null,
        fixtureVersion: "1.0.0",
        promptVersion: "1.0.0",
        analysisResponseVersion: "1.0.0",
        replayVersion: "1.0.0",
      }),
    ).toThrow();
  });

  it("non-run attempts cannot fabricate a run or accepted output", () => {
    expect(
      NonRunAnalysisAttemptSchema.parse({
        id: "NONRUN-1",
        caseId: "CFN-DEMO-001",
        startCommandId: "CMD-START",
        auditEventId: "AUDIT-000123",
        providerSelection: openAiSelection,
        outputAccepted: false,
        occurredAt: now,
        kind: "transport_failure",
        transmissionStatus: "unknown",
        remoteExecutionStatus: "unknown",
        safeErrorCode: "CLIENT_TRANSPORT_FAILURE",
        reasonCode: "response_unavailable",
      }).outputAccepted,
    ).toBe(false);

    expect(() =>
      NonRunAnalysisAttemptSchema.parse({
        id: "NONRUN-1",
        caseId: "CFN-DEMO-001",
        startCommandId: "CMD-START",
        auditEventId: "AUDIT-000123",
        providerSelection: openAiSelection,
        outputAccepted: true,
        occurredAt: now,
        kind: "transport_failure",
        transmissionStatus: "unknown",
        remoteExecutionStatus: "unknown",
        safeErrorCode: "CLIENT_TRANSPORT_FAILURE",
        reasonCode: "response_unavailable",
        runId: "RUN-FAKE",
      }),
    ).toThrow();
  });

  it("PersistedCaseState excludes raw segments and pending live request", () => {
    const shapeKeys = Object.keys((PersistedCaseStateSchema as unknown as { shape: Record<string, unknown> }).shape);
    expect(shapeKeys).not.toContain("segments");
    expect(shapeKeys).not.toContain("pendingLiveAnalysis");
    expect(shapeKeys).not.toContain("caseStatus");
  });

  it("CaseState has one candidate collection and rejects mirrored arrays", () => {
    const shapeKeys = Object.keys((CaseStateSchema as unknown as { shape: Record<string, unknown> }).shape);
    expect(shapeKeys).toContain("candidates");
    expect(shapeKeys).not.toContain("timelineEvents");
    expect(shapeKeys).not.toContain("nexusRows");
    expect(shapeKeys).not.toContain("contextGaps");
  });

  it("export labels are exact and contain no override path", () => {
    const shapeKeys = Object.keys((ExportManifestSchema as unknown as { shape: Record<string, unknown> }).shape);
    expect(shapeKeys).toContain("labels");
    expect(shapeKeys).not.toContain("override");
  });

  it("bundle and system-card schemas are exported for downstream tasks", () => {
    expect(ReplayBundleSchema).toBeDefined();
    expect(SystemCardSchema).toBeDefined();
    expect(MaskingReviewSchema).toBeDefined();
  });
});
