import {
  DemoCheckpointBundleSchema,
  ReplayBundleSchema,
  type AnalysisRun,
  type CaseCandidate,
  type CasePurposeBrief,
  type Citation,
  type DemoCheckpointBundle,
  type MaskingReview,
  type ProcessingStage,
  type ReplayBundle,
  type ReplayRequest,
  type RunInputStateProvenance,
  type SourceSegment,
} from "../contracts";
import { cfnDemoFixture } from "../fixtures";
import { bundledGuidancePack } from "../guidance";
import { assembleCandidates, reviewCandidate } from "../review";
import { sha256Hex } from "../export/core";

export const TRUSTED_REPLAY_BUNDLE_ID = "REPLAY-CFN-DEMO-001-V1" as const;
export const TRUSTED_DEMO_CHECKPOINT_ID = "DEMO-CHECKPOINT-REVIEW" as const;

const VERSION = "1.0.0" as const;
const NOW = "2026-07-16T00:00:00.000Z" as const;
const REPLAY_RUN_ID = "RUN-CFN-DEMO-001-REPLAY" as const;
const CHECKPOINT_RUN_ID = "RUN-CFN-DEMO-001-CHECKPOINT" as const;

export type ReplayValidationResult =
  | { ok: true; bundle: ReplayBundle }
  | { ok: false; reason: string };

export type CheckpointValidationResult =
  | { ok: true; bundle: DemoCheckpointBundle }
  | { ok: false; reason: string };

function localProvider() {
  return {
    providerId: "local_replay" as const,
    releaseConfigurationId: "prepared-replay-v1" as const,
    requestedModel: "frozen_replay_output" as const,
    serviceTier: "local" as const,
    adapterVersion: "local-replay-registry-v1",
    returnedModel: "frozen_replay_output",
    inferenceSetting: { kind: "not_applicable" as const, value: "not_applicable" as const },
    disclosureVersion: VERSION,
    providerTransmission: false,
  };
}

export function trustedSegments(): SourceSegment[] {
  return cfnDemoFixture.segments.map((segment) => ({
    ...segment,
    ordinal: Math.max(segment.ordinal, 1),
  })) as SourceSegment[];
}

export function createReplayInputState(
  sourceCaseRevision = 0,
  purposeBrief?: CasePurposeBrief | null,
  masking?: MaskingReview,
): RunInputStateProvenance {
  return {
    sourceCaseRevision,
    canonicalFixtureDigest: cfnDemoFixture.canonicalFixtureDigest,
    purposeBriefId: purposeBrief?.id ?? "PURPOSE-CFN-DEMO-001",
    purposeBriefRevision: purposeBrief?.revision ?? 0,
    maskingRevision: masking?.revision ?? 0,
    selectedSegmentIds: [...cfnDemoFixture.selectedSegmentIds],
    approvedRedactedInputDigest: cfnDemoFixture.approvedRedactedInputDigest,
  };
}

function makeRun(
  id: string,
  inputState: RunInputStateProvenance,
  counts: { candidateCount: number; citationCount: number },
  checkpoint: boolean,
  recoveryOfRunId: string | null,
): AnalysisRun {
  return {
    id,
    mode: "deterministic_replay",
    provider: localProvider(),
    promptVersion: VERSION,
    requestSchemaVersion: VERSION,
    responseSchemaVersion: VERSION,
    fixtureVersion: VERSION,
    rulesetVersion: VERSION,
    checkpointProvenance: checkpoint
      ? {
          checkpointId: TRUSTED_DEMO_CHECKPOINT_ID,
          checkpointVersion: VERSION,
          replayVersion: VERSION,
        }
      : null,
    startedAt: NOW,
    completedAt: NOW,
    durationMs: 0,
    inputSegmentCount: cfnDemoFixture.selectedSegmentIds.length,
    candidateCount: counts.candidateCount,
    citationCount: counts.citationCount,
    quarantinedCount: 0,
    status: "succeeded",
    failure: null,
    recovery: {
      recoveryOfRunId,
      selectionReason: "explicit_deterministic_replay",
      selectedBy: "practitioner",
      automaticFailover: false,
      outputsMerged: false,
    },
    inputState,
  };
}

function citationsFor(candidates: CaseCandidate[], runId: string): Citation[] {
  const byId = new Map<string, Citation>();
  const segments = trustedSegments();

  for (const candidate of candidates) {
    for (const dependency of candidate.dependencies) {
      if (dependency.kind !== "source") continue;
      const segment = segments.find((item) => item.id === dependency.sourceSegmentId);
      if (!segment || byId.has(dependency.citationId)) continue;
      byId.set(dependency.citationId, {
        id: dependency.citationId,
        caseId: "CFN-DEMO-001",
        analysisRunId: runId,
        documentId: segment.documentId,
        pageNumber: segment.pageNumber,
        segmentId: segment.id,
        quotedText: segment.redactedText,
        normalizedQuotedText: segment.redactedText.toLowerCase().replace(/\s+/g, " ").trim(),
        quoteForm: "approved_redacted_derivative",
        redactionMapVersion: VERSION,
        sourceLanguage: "en",
        translationStatus: segment.translationStatus,
        extractionQuality: segment.extractionQuality,
        validationStatus: "exact_match",
        redactedSegmentRange: { start: 0, end: Math.max(1, segment.redactedText.length) },
        sourceSegmentRange: { start: 0, end: Math.max(1, segment.rawText.length) },
        boundingBoxes: segment.boundingBoxes,
        resolutionMethod: "exact_codepoint",
        resolvedBy: "system",
        validatedAt: NOW,
      });
    }
  }

  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function completedProcessing(): ProcessingStage[] {
  const stages: ProcessingStage["name"][] = [
    "intake_validation",
    "text_extraction",
    "coverage_calculation",
    "identifier_masking",
    "candidate_extraction",
    "citation_validation",
    "timeline_nexus_assembly",
  ];
  return stages.map((name) => ({
    name,
    status: "completed",
    startedAt: NOW,
    completedAt: NOW,
    affectedDocumentIds: cfnDemoFixture.documents.map((document) => document.id),
    retryable: false,
  }));
}

export function trustedPurposeBrief(actor: "current_practitioner" | "fixture_reviewer" = "current_practitioner"): CasePurposeBrief {
  return {
    id: "PURPOSE-CFN-DEMO-001",
    schemaVersion: VERSION,
    caseId: "CFN-DEMO-001",
    revision: 1,
    status: "complete",
    practitionerRole: "demo_evaluator",
    organizationType: "legal_aid",
    supportedWorkflow: "case_preparation_handoff",
    statedPurpose: "Prepare a synthetic, source-grounded practitioner handoff for demo review.",
    excludedDecisions: [
      "victim_or_trafficking_status",
      "credibility",
      "guilt_or_innocence",
      "legal_eligibility",
      "non_punishment_eligibility",
      "case_priority",
      "prosecution_sentence_or_outcome",
    ],
    authority: {
      basis: "not_applicable_synthetic_fixture",
      status: "active",
      consentStatus: "not_applicable_synthetic_fixture",
      authorityNotVerifiedAcknowledged: true,
      syntheticOrHarmlessDataAttested: true,
    },
    jurisdictionCode: "J-01",
    sourceLanguage: "en",
    translationStatus: "original_language",
    intendedRecipient: actor === "fixture_reviewer" ? "Fixture reviewer" : "Demo evaluator",
    intendedRecipientCategory: "legal_aid_team",
    requestedExport: "full_practitioner_handoff",
    prohibitedDecisionsAcknowledged: true,
    syntheticDataAcknowledged: true,
    providerSelection: {
      providerId: "local_replay",
      releaseConfigurationId: "prepared-replay-v1",
      serviceTier: "local",
      disclosureAcknowledgement: {
        id: "ACK-CFN-DEMO-REPLAY",
        schemaVersion: VERSION,
        disclosureVersion: VERSION,
        providerId: "local_replay",
        releaseConfigurationId: "prepared-replay-v1",
        serviceTier: "local",
        dataFlowAcknowledged: true,
        retentionAndTrainingUseAcknowledged: true,
        serviceTierAcknowledged: true,
        acknowledgedAt: NOW,
      },
    },
    cooperationNeutralityAcknowledged: true,
    authorityAttested: true,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export function trustedApprovedMasking(actor: "current_practitioner" | "fixture_reviewer" = "current_practitioner"): MaskingReview {
  return {
    redactionMapVersion: VERSION,
    revision: 1,
    reviewStatus: "approved",
    suggestions: [],
    declaredSupportedClasses: [
      "person_name",
      "email",
      "phone",
      "passport",
      "bank_account",
      "address",
      "date_of_birth",
    ],
    reviewedBy: actor,
    approvedAt: NOW,
    leakScanStatus: "passed",
    failedClasses: [],
  };
}

export function createTrustedReplayBundle(inputState = createReplayInputState()): ReplayBundle {
  const candidates = assembleCandidates({ analysisRunId: REPLAY_RUN_ID, now: NOW });
  const citations = citationsFor(candidates, REPLAY_RUN_ID);
  const run = makeRun(
    REPLAY_RUN_ID,
    inputState,
    { candidateCount: candidates.length, citationCount: citations.length },
    false,
    null,
  );

  return ReplayBundleSchema.parse({
    schemaVersion: VERSION,
    bundleKind: "deterministic_replay",
    id: TRUSTED_REPLAY_BUNDLE_ID,
    bundleVersion: VERSION,
    caseId: "CFN-DEMO-001",
    fixtureVersion: VERSION,
    canonicalFixtureDigest: cfnDemoFixture.canonicalFixtureDigest,
    selectedSegmentIds: [...cfnDemoFixture.selectedSegmentIds],
    approvedRedactedInputDigest: cfnDemoFixture.approvedRedactedInputDigest,
    promptVersion: VERSION,
    analysisResponseVersion: VERSION,
    replayVersion: VERSION,
    releaseConfigurationId: "prepared-replay-v1",
    replayRun: withoutInputState(run),
    candidates,
    citations,
    seededDecisions: [],
    counts: {
      analysisRunCount: 1,
      candidateCount: candidates.length,
      citationCount: citations.length,
      seededDecisionCount: 0,
    },
    providerTransmission: false,
    notModelOutput: true,
  });
}

export function createTrustedCheckpointBundle(): DemoCheckpointBundle {
  const purposeBrief = trustedPurposeBrief("fixture_reviewer");
  const masking = trustedApprovedMasking("fixture_reviewer");
  const inputState = createReplayInputState(0, purposeBrief, masking);
  const baseCandidates = assembleCandidates({ analysisRunId: CHECKPOINT_RUN_ID, now: NOW });
  const reviewed = reviewCandidate(
    baseCandidates,
    { candidateId: "CAND-TASK-0402", action: "reject", reason: "Fixture checkpoint marks this as needing renewed review." },
    [],
    { actor: "fixture_reviewer", analysisRunId: CHECKPOINT_RUN_ID, now: NOW },
  );
  const candidates = reviewed.candidates;
  const citations = citationsFor(candidates, CHECKPOINT_RUN_ID);
  const run = makeRun(
    CHECKPOINT_RUN_ID,
    inputState,
    { candidateCount: candidates.length, citationCount: citations.length },
    true,
    null,
  );
  const postDecisionHashProjection = {
    schemaVersion: VERSION,
    checkpointId: TRUSTED_DEMO_CHECKPOINT_ID,
    candidateOutcomes: candidates.map((candidate) => ({
      id: candidate.id,
      reviewStatus: candidate.reviewStatus,
      supportStatus: candidate.supportStatus,
      inclusionStatus: candidate.inclusionStatus,
    })),
    citationOutcomes: citations.map((citation) => ({
      id: citation.id,
      validationStatus: citation.validationStatus,
      segmentId: citation.segmentId,
    })),
    appliedSeededDecisionOutcomes: [reviewed.decision].map((decision) => ({
      id: decision.id,
      candidateId: decision.candidateId,
      action: decision.action,
      actor: decision.actor,
    })),
  };

  return DemoCheckpointBundleSchema.parse({
    schemaVersion: VERSION,
    bundleKind: "demo_checkpoint",
    id: TRUSTED_DEMO_CHECKPOINT_ID,
    bundleVersion: VERSION,
    checkpointVersion: VERSION,
    replayVersion: VERSION,
    promptVersion: VERSION,
    analysisResponseVersion: VERSION,
    caseId: "CFN-DEMO-001",
    fixtureVersion: VERSION,
    canonicalFixtureDigest: cfnDemoFixture.canonicalFixtureDigest,
    selectedSegmentIds: [...cfnDemoFixture.selectedSegmentIds],
    approvedRedactedInputDigest: cfnDemoFixture.approvedRedactedInputDigest,
    purposeBrief,
    documents: cfnDemoFixture.documents,
    segments: trustedSegments(),
    masking,
    coverage: cfnDemoFixture.coverage,
    coverageReviews: [],
    processing: completedProcessing(),
    visibleLabel: "Prepared synthetic review checkpoint",
    replayVisibleLabel: "Bundled deterministic replay, not live AI",
    replayRun: withoutInputState(run),
    replayReleaseConfigurationId: "prepared-replay-v1",
    candidates,
    citations,
    seededDecisions: [reviewed.decision],
    counts: {
      analysisRunCount: 1,
      candidateCount: candidates.length,
      citationCount: citations.length,
      seededDecisionCount: 1,
      documentCount: cfnDemoFixture.documents.length,
      segmentCount: cfnDemoFixture.segments.length,
      processingStageCount: completedProcessing().length,
      coverageReviewCount: 0,
    },
    postDecisionHashProjectionVersion: VERSION,
    expectedPostDecisionStateHash: sha256Hex(postDecisionHashProjection),
    providerTransmission: false,
    notModelOutput: true,
    seededDecisionActor: "fixture_reviewer",
    seededDecisionIds: [reviewed.decision.id],
  });
}

function withoutInputState(run: AnalysisRun) {
  const { inputState: _inputState, ...bundleRun } = run;
  return bundleRun;
}

export function resolveTrustedReplayBundle(request: ReplayRequest): ReplayValidationResult {
  if (request.replayBundleId !== TRUSTED_REPLAY_BUNDLE_ID) return { ok: false, reason: "unknown_replay_bundle" };
  if (
    request.mode !== "deterministic_replay" ||
    request.releaseConfigurationId !== "prepared-replay-v1" ||
    request.caseId !== "CFN-DEMO-001" ||
    request.fixtureVersion !== VERSION ||
    request.promptVersion !== VERSION ||
    request.analysisResponseVersion !== VERSION ||
    request.replayVersion !== VERSION
  ) {
    return { ok: false, reason: "replay_request_mismatch" };
  }
  const bundle = createTrustedReplayBundle();
  return validateReplayBundle(bundle);
}

export function resolveTrustedCheckpointBundle(checkpointBundleId: string): CheckpointValidationResult {
  if (checkpointBundleId !== TRUSTED_DEMO_CHECKPOINT_ID) return { ok: false, reason: "unknown_checkpoint_bundle" };
  return validateCheckpointBundle(createTrustedCheckpointBundle());
}

export function validateReplayBundle(bundle: ReplayBundle): ReplayValidationResult {
  const parsed = ReplayBundleSchema.safeParse(bundle);
  if (!parsed.success) return { ok: false, reason: "schema_invalid" };
  const value = parsed.data;
  if (value.canonicalFixtureDigest !== cfnDemoFixture.canonicalFixtureDigest) return { ok: false, reason: "fixture_digest_mismatch" };
  if (value.approvedRedactedInputDigest !== cfnDemoFixture.approvedRedactedInputDigest) return { ok: false, reason: "redacted_input_digest_mismatch" };
  if (value.selectedSegmentIds.join("|") !== cfnDemoFixture.selectedSegmentIds.join("|")) return { ok: false, reason: "selected_segments_mismatch" };
  if (value.counts.candidateCount !== value.candidates.length || value.replayRun.candidateCount !== value.candidates.length) return { ok: false, reason: "candidate_count_mismatch" };
  if (value.counts.citationCount !== value.citations.length || value.replayRun.citationCount !== value.citations.length) return { ok: false, reason: "citation_count_mismatch" };
  if (value.replayRun.quarantinedCount !== 0 || value.counts.seededDecisionCount !== 0) return { ok: false, reason: "unexpected_replay_payload" };
  if (value.candidates.some((candidate) => candidate.analysisRunId !== value.replayRun.id)) return { ok: false, reason: "candidate_run_owner_mismatch" };
  if (value.citations.some((citation) => citation.analysisRunId !== value.replayRun.id)) return { ok: false, reason: "citation_run_owner_mismatch" };
  return { ok: true, bundle: value };
}

export function validateCheckpointBundle(bundle: DemoCheckpointBundle): CheckpointValidationResult {
  const parsed = DemoCheckpointBundleSchema.safeParse(bundle);
  if (!parsed.success) return { ok: false, reason: "schema_invalid" };
  const value = parsed.data;
  if (value.canonicalFixtureDigest !== cfnDemoFixture.canonicalFixtureDigest) return { ok: false, reason: "fixture_digest_mismatch" };
  if (value.counts.documentCount !== value.documents.length) return { ok: false, reason: "document_count_mismatch" };
  if (value.counts.segmentCount !== value.segments.length) return { ok: false, reason: "segment_count_mismatch" };
  if (value.counts.candidateCount !== value.candidates.length || value.replayRun.candidateCount !== value.candidates.length) return { ok: false, reason: "candidate_count_mismatch" };
  if (value.counts.citationCount !== value.citations.length || value.replayRun.citationCount !== value.citations.length) return { ok: false, reason: "citation_count_mismatch" };
  if (value.seededDecisions.some((decision) => decision.actor !== "fixture_reviewer")) return { ok: false, reason: "seed_actor_mismatch" };
  if (value.coverageReviews.length !== 0 || value.coverage.issues.some((issue) => issue.coverageReviewDecisionId !== null)) return { ok: false, reason: "coverage_review_mismatch" };
  const projection = {
    schemaVersion: VERSION,
    checkpointId: TRUSTED_DEMO_CHECKPOINT_ID,
    candidateOutcomes: value.candidates.map((candidate) => ({
      id: candidate.id,
      reviewStatus: candidate.reviewStatus,
      supportStatus: candidate.supportStatus,
      inclusionStatus: candidate.inclusionStatus,
    })),
    citationOutcomes: value.citations.map((citation) => ({
      id: citation.id,
      validationStatus: citation.validationStatus,
      segmentId: citation.segmentId,
    })),
    appliedSeededDecisionOutcomes: value.seededDecisions.map((decision) => ({
      id: decision.id,
      candidateId: decision.candidateId,
      action: decision.action,
      actor: decision.actor,
    })),
  };
  if (sha256Hex(projection) !== value.expectedPostDecisionStateHash) return { ok: false, reason: "post_decision_hash_mismatch" };
  if (value.purposeBrief.providerSelection.providerId !== "local_replay") return { ok: false, reason: "checkpoint_not_replay_acknowledged" };
  if (value.masking.reviewedBy !== "fixture_reviewer" || value.masking.leakScanStatus !== "passed") return { ok: false, reason: "checkpoint_masking_mismatch" };
  if (bundledGuidancePack.identity.version !== VERSION) return { ok: false, reason: "guidance_version_mismatch" };
  return { ok: true, bundle: value };
}
