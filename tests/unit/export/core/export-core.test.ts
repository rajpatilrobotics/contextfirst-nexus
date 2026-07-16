import { describe, expect, it } from "vitest";
import {
  createExportManifest,
  evaluateExportGate,
  exportSelectionDigest,
  normalizeExportSelection,
} from "../../../../lib/export/core";
import {
  RequiredExcludedDecisions,
  type AnalysisRun,
  type CaseCandidate,
  type CaseCommand,
  type CaseState,
  type Citation,
  type CoverageReviewDecision,
  type ExportGate,
  type ExportSelection,
  type GuidanceCard,
  type ProcessingStage,
  type ReviewDecision,
} from "../../../../lib/contracts";
import { cfnDemoFixture } from "../../../../lib/fixtures";
import { bundledGuidancePack } from "../../../../lib/guidance";
import { LIMITATION_TEXT, assembleCandidates, reviewCandidate } from "../../../../lib/review";
import { applyCaseCommand } from "../../../../lib/state";

const NOW = "2026-07-16T00:00:00.000Z";
const HASH = cfnDemoFixture.canonicalFixtureDigest;
const APPROVED_INPUT_DIGEST = cfnDemoFixture.approvedRedactedInputDigest;
const RUN_ID = "RUN-CFN-DEMO-001-REVIEW";
type ExportBlocker = Extract<ExportGate, { status: "blocked" }>["blockers"][number];

const fullSelection: ExportSelection = {
  kind: "full_practitioner_handoff",
  minimumNecessarySelection: null,
};

function segment(segmentId: string) {
  return (cfnDemoFixture.segments as Array<{ id: string; documentId: string; pageNumber?: number; redactedText: string }>).find(
    (item) => item.id === segmentId,
  );
}

function completeReviews(candidates: CaseCandidate[]) {
  return candidates.map((candidate) => {
    if (candidate.kind === "context_gap") {
      return {
        ...candidate,
        reviewStatus: "human_accepted" as const,
        responseStatus: "preserved_unknown" as const,
        response: null,
        responseEvidenceNature: "unknown" as const,
        responseExplanation: null,
      };
    }
    return {
      ...candidate,
      reviewStatus: candidate.reviewRequirement === "individual" || candidate.reviewRequirement === "derived_summary" ? ("human_accepted" as const) : candidate.reviewStatus,
    };
  });
}

function sourceCitations(candidates: CaseCandidate[]): Citation[] {
  const seen = new Map<string, Citation>();
  for (const candidate of candidates) {
    for (const dependency of candidate.dependencies) {
      if (dependency.kind !== "source") continue;
      const source = segment(dependency.sourceSegmentId);
      seen.set(dependency.citationId, {
        id: dependency.citationId,
        caseId: "CFN-DEMO-001",
        analysisRunId: RUN_ID,
        documentId: source?.documentId ?? "DOC-CFN-DEMO-001-CHAT",
        pageNumber: source?.pageNumber ?? 1,
        segmentId: dependency.sourceSegmentId,
        quotedText: source?.redactedText.slice(0, 80) || "Reviewed redacted source text.",
        normalizedQuotedText: (source?.redactedText.slice(0, 80) || "Reviewed redacted source text.").toLowerCase(),
        quoteForm: "approved_redacted_derivative",
        redactionMapVersion: "1.0.0",
        sourceLanguage: "en",
        translationStatus: "original_language",
        extractionQuality: "fixture_verified",
        validationStatus: "exact_match",
        redactedSegmentRange: { start: 0, end: 10 },
        sourceSegmentRange: { start: 0, end: 10 },
        boundingBoxes: [],
        resolutionMethod: "exact_codepoint",
        resolvedBy: "system",
        validatedAt: NOW,
      });
    }
  }
  return [...seen.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function successfulRun(caseRevision = 1): AnalysisRun {
  return {
    id: RUN_ID,
    mode: "deterministic_replay",
    provider: {
      providerId: "local_replay",
      releaseConfigurationId: "prepared-replay-v1",
      requestedModel: "frozen_replay_output",
      serviceTier: "local",
      adapterVersion: "1.0.0",
      returnedModel: "frozen_replay_output",
      inferenceSetting: { kind: "not_applicable", value: "not_applicable" },
      disclosureVersion: "1.0.0",
      providerTransmission: false,
    },
    promptVersion: "1.0.0",
    requestSchemaVersion: "1.0.0",
    responseSchemaVersion: "1.0.0",
    fixtureVersion: "1.0.0",
    rulesetVersion: "1.0.0",
    checkpointProvenance: {
      checkpointId: "DEMO-CHECKPOINT-REVIEW",
      checkpointVersion: "1.0.0",
      replayVersion: "1.0.0",
    },
    startedAt: NOW,
    completedAt: NOW,
    durationMs: 1,
    inputSegmentCount: cfnDemoFixture.selectedSegmentIds.length,
    candidateCount: 14,
    citationCount: 1,
    quarantinedCount: 0,
    status: "succeeded",
    failure: null,
    recovery: {
      recoveryOfRunId: null,
      selectionReason: "explicit_deterministic_replay",
      selectedBy: "practitioner",
      automaticFailover: false,
      outputsMerged: false,
    },
    inputState: {
      sourceCaseRevision: caseRevision,
      canonicalFixtureDigest: HASH,
      purposeBriefId: "PURPOSE-CFN-DEMO-001",
      purposeBriefRevision: 1,
      maskingRevision: 1,
      selectedSegmentIds: cfnDemoFixture.selectedSegmentIds,
      approvedRedactedInputDigest: APPROVED_INPUT_DIGEST,
    },
  };
}

function failedSafetyRun(): AnalysisRun {
  return {
    ...successfulRun(),
    id: "RUN-CFN-DEMO-001-SAFETY",
    status: "failed",
    candidateCount: 0,
    citationCount: 0,
    quarantinedCount: 0,
    failure: {
      classification: "safety_validation_failed",
      safeErrorCode: "SAFETY_VALIDATION_FAILED",
      retryableSameProvider: false,
      alternateProviderRecoveryAllowed: false,
      replayRecoveryAllowed: false,
    },
  } as AnalysisRun;
}

function processing(): ProcessingStage[] {
  return [
    "intake_validation",
    "text_extraction",
    "coverage_calculation",
    "identifier_masking",
    "candidate_extraction",
    "citation_validation",
    "timeline_nexus_assembly",
    "safety_export_gate_checks",
  ].map((name) => ({
    name: name as ProcessingStage["name"],
    status: "completed" as const,
    startedAt: NOW,
    completedAt: NOW,
    affectedDocumentIds: [],
    retryable: false,
  }));
}

function baseState(): CaseState {
  const candidates = completeReviews(assembleCandidates());
  return {
    schemaVersion: "1.0.0",
    caseId: "CFN-DEMO-001",
    caseRevision: 1,
    caseStatus: "ready_to_export",
    fixtureVersion: "1.0.0",
    guidancePack: { version: "1.0.0", digest: bundledGuidancePack.identity.digest },
    purposeBrief: {
      id: "PURPOSE-CFN-DEMO-001",
      schemaVersion: "1.0.0",
      caseId: "CFN-DEMO-001",
      revision: 1,
      status: "complete",
      practitionerRole: "demo_evaluator",
      organizationType: "legal_aid",
      supportedWorkflow: "case_preparation_handoff",
      statedPurpose: "Prepare a source-grounded practitioner handoff for the bundled synthetic case.",
      excludedDecisions: [...RequiredExcludedDecisions],
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
      intendedRecipient: "Legal aid team",
      intendedRecipientCategory: "legal_aid_team",
      requestedExport: "full_practitioner_handoff",
      prohibitedDecisionsAcknowledged: true,
      syntheticDataAcknowledged: true,
      providerSelection: {
        providerId: "local_replay",
        releaseConfigurationId: "prepared-replay-v1",
        serviceTier: "local",
        disclosureAcknowledgement: {
          id: "DISCLOSURE-CFN-DEMO-001",
          schemaVersion: "1.0.0",
          providerId: "local_replay",
          releaseConfigurationId: "prepared-replay-v1",
          serviceTier: "local",
          disclosureVersion: "1.0.0",
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
    },
    documents: cfnDemoFixture.documents as CaseState["documents"],
    segments: cfnDemoFixture.segments as CaseState["segments"],
    selectedSegmentIds: cfnDemoFixture.selectedSegmentIds,
    masking: {
      redactionMapVersion: "1.0.0",
      revision: 1,
      reviewStatus: "approved",
      suggestions: [],
      declaredSupportedClasses: ["person_name", "email", "phone", "passport", "bank_account", "address", "date_of_birth"],
      reviewedBy: "fixture_reviewer",
      approvedAt: NOW,
      leakScanStatus: "passed",
      failedClasses: [],
    },
    coverage: {
      expectedDocuments: cfnDemoFixture.documents.length,
      processedDocuments: cfnDemoFixture.documents.length,
      expectedPages: 1,
      availablePages: 1,
      issues: [],
      hasConsequentialOpenIssue: false,
    },
    coverageReviews: [],
    processing: processing(),
    pendingLiveAnalysis: null,
    analysisRuns: [successfulRun()],
    activeAnalysisRunId: RUN_ID,
    citations: sourceCitations(candidates),
    citationResolutions: [],
    candidates,
    reviews: candidates.map((candidate, index) => ({
      id: `REVIEW-${String(index + 1).padStart(4, "0")}`,
      caseId: "CFN-DEMO-001",
      analysisRunId: RUN_ID,
      candidateId: candidate.id,
      candidateRevision: candidate.revision,
      action: "accept",
      previousStatus: "pending",
      resultingStatus: candidate.reviewStatus,
      editedText: null,
      reason: null,
      actor: "fixture_reviewer",
      reviewerRole: "demo_evaluator",
      promptVersion: "1.0.0",
      rulesetVersion: "1.0.0",
      supersedesDecisionId: null,
      createdAt: NOW,
      dependencySnapshot: candidate.dependencies.map((dependency) => dependency.id).sort(),
    })) as ReviewDecision[],
    dependencyChanges: [],
    audit: [
      {
        id: "AUDIT-0001",
        caseId: "CFN-DEMO-001",
        eventType: "export_gate_evaluated",
        sequence: 1,
        actor: "system",
        entityIds: ["CFN-DEMO-001"],
        summary: "Export gate evaluated.",
        createdAt: NOW,
        commandId: null,
        idempotencyKey: null,
      },
    ],
    exportGate: null,
    exports: [],
    currentExportId: null,
    currentExportManifest: null,
    exportedRevision: null,
    lastUpdatedAt: NOW,
  };
}

function blockerCodes(state: CaseState, selection: ExportSelection = fullSelection) {
  return evaluateExportGate(state, selection, { now: NOW }).blockers.map((blocker: ExportBlocker) => blocker.code);
}

function commandMeta(state: CaseState, commandId: string): CaseCommand["meta"] {
  return {
    commandId,
    idempotencyKey: `idem-${commandId}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt: NOW,
  };
}

function applyStateCommand(state: CaseState, command: CaseCommand) {
  const result = applyCaseCommand(state, command);
  expect(result.ok, result.ok ? undefined : result.reason).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

describe("TASK-009 export core", () => {
  it("creates a deterministic ready manifest from the reviewed synthetic handoff state", () => {
    const state = baseState();
    const gate = evaluateExportGate(state, fullSelection, { now: NOW });
    const first = createExportManifest(state, fullSelection, { now: NOW, previousGate: gate });
    const second = createExportManifest(state, fullSelection, { now: NOW, previousGate: gate });

    expect(gate).toMatchObject({ status: "ready", freshness: "current", blockers: [] });
    expect(first.labels).toEqual([
      "AI-assisted, human-reviewed case-preparation draft.",
      "Synthetic case.",
      "Not legal advice.",
      "Local legal verification required.",
    ]);
    expect(first.schemaVersion).toBe("1.0.0");
    expect(first.reviewedExportStateHashProjectionVersion).toBe("1.0.0");
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.includedCandidates.map((candidate) => candidate.candidateId)).toContain("CAND-CTRL-PASSPORT");
    expect(first.reviewedGaps.map((gap) => gap.candidateId)).toContain("CAND-SENDER-0402");
    expect(first.citations.every((citation) => citation.validationStatus === "exact_match" || citation.validationStatus === "manually_resolved")).toBe(true);
    expect(JSON.stringify(first)).not.toContain("rawText");
    expect(JSON.stringify(first)).not.toContain("provider logs");
  });

  it("reports the exact initial review blockers needed for the demo opening state", () => {
    const state = { ...baseState(), candidates: assembleCandidates() };
    const gate = evaluateExportGate(state, fullSelection, { now: NOW });

    expect(gate.status).toBe("blocked");
    expect(gate.blockers.find((entry) => entry.code === "REVIEW_INCOMPLETE")?.entityIds).toEqual(
      expect.arrayContaining(["CAND-SENDER-0402", "CAND-URG-INTERPRETER"]),
    );
  });

  it.each([
    ["PURPOSE_INCOMPLETE", (state: CaseState) => ({ ...state, purposeBrief: { ...state.purposeBrief!, status: "draft" as const } })],
    ["AUTHORITY_INVALID", (state: CaseState) => ({ ...state, purposeBrief: { ...state.purposeBrief!, authority: { ...state.purposeBrief!.authority, status: "withdrawn" as const } } })],
    ["DATA_ORIGIN_PROHIBITED", (state: CaseState) => ({ ...state, documents: [{ ...state.documents[0], syntheticLabelPresent: false }, ...state.documents.slice(1)] })],
    ["REVIEW_INCOMPLETE", (state: CaseState) => ({ ...state, candidates: state.candidates.map((candidate) => (candidate.id === "CAND-SENDER-0402" ? { ...candidate, reviewStatus: "pending" as const } : candidate)) })],
    ["CITATION_UNRESOLVED", (state: CaseState) => ({ ...state, citations: state.citations.map((citation) => (citation.id === "CIT-D02-P2-S02" ? { ...citation, validationStatus: "unvalidated" as const, redactedSegmentRange: null, sourceSegmentRange: null, boundingBoxes: [] as [], resolutionMethod: null, resolvedBy: null } : citation)) })],
    ["COVERAGE_CONSEQUENTIAL", (state: CaseState) => ({ ...state, coverage: { ...state.coverage, hasConsequentialOpenIssue: true, issues: [{ id: "COVERAGE-OPEN", documentId: state.documents[0].id, kind: "missing_page" as const, initialConsequence: "unknown" as const, activeConsequence: "unknown" as const, rationale: "Missing page could matter.", resolutionStatus: "open" as const, coverageReviewDecisionId: null }] } })],
    ["JURISDICTION_UNVERIFIED", (state: CaseState) => ({ ...state, purposeBrief: { ...state.purposeBrief!, jurisdictionCode: "unspecified" as const } })],
    ["DEPENDENCY_UNRESOLVED", (state: CaseState) => ({ ...state, candidates: state.candidates.map((candidate) => (candidate.id === "NEXUS-OFFENCE-TIMING" ? { ...candidate, reviewStatus: "invalidated" as const } : candidate)) })],
    ["MASK_REVIEW_INCOMPLETE", (state: CaseState) => ({ ...state, masking: { ...state.masking, reviewStatus: "pending" as const } })],
    ["PII_CHECK_FAILED", (state: CaseState) => ({ ...state, masking: { ...state.masking, leakScanStatus: "failed" as const, failedClasses: ["phone" as const] } })],
    ["PROCESSING_FAILED", (state: CaseState) => ({ ...state, processing: [{ ...state.processing[0], status: "failed" as const }, ...state.processing.slice(1)] })],
    ["SAFETY_VALIDATION_FAILED", (state: CaseState) => ({ ...state, analysisRuns: [...state.analysisRuns, failedSafetyRun()] })],
    ["ANALYSIS_RUN_STALE", (state: CaseState) => ({ ...state, analysisRuns: [{ ...successfulRun(), inputState: { ...successfulRun().inputState, approvedRedactedInputDigest: "b".repeat(64) } }] })],
    ["GATE_EVALUATION_STALE", (state: CaseState) => ({ ...state, exportGate: { ...evaluateExportGate(state, fullSelection, { now: NOW }), caseRevision: 0 } })],
    ["MINIMUM_NECESSITY_UNCONFIRMED", (state: CaseState) => state],
    ["OUTSIDE_STATED_PURPOSE", (state: CaseState) => state],
  ] as const)("blocks export for %s", (code, mutate) => {
    const state = mutate(baseState());
    const selection =
      code === "MINIMUM_NECESSITY_UNCONFIRMED"
        ? ({
            kind: "minimum_necessary_safe_share",
            minimumNecessarySelection: {
              confirmed: false,
              intendedRecipientCategory: "legal_aid_team",
              selectedCandidateIds: ["CAND-SENDER-0402"],
              excludedCandidateIds: [],
            },
          } satisfies ExportSelection)
        : code === "OUTSIDE_STATED_PURPOSE"
          ? ({
              kind: "minimum_necessary_safe_share",
              minimumNecessarySelection: {
                confirmed: true,
                intendedRecipientCategory: "policy_or_research_summary",
                selectedCandidateIds: [],
                excludedCandidateIds: [],
              },
            } satisfies ExportSelection)
          : fullSelection;

    expect(blockerCodes(state, selection)).toContain(code);
  });

  it("keeps safe-share exports limited to confirmed eligible selected candidates", () => {
    const state = {
      ...baseState(),
      purposeBrief: { ...baseState().purposeBrief!, requestedExport: "minimum_necessary_safe_share" as const },
    };
    const selection: ExportSelection = {
      kind: "minimum_necessary_safe_share",
      minimumNecessarySelection: {
        confirmed: true,
        intendedRecipientCategory: "legal_aid_team",
        selectedCandidateIds: ["CAND-CTRL-PASSPORT", "CAND-CTRL-PASSPORT"],
        excludedCandidateIds: ["CAND-TASK-0402"],
      },
    };
    const manifest = createExportManifest(state, selection, { now: NOW });

    expect(normalizeExportSelection(selection).minimumNecessarySelection!.selectedCandidateIds).toEqual(["CAND-CTRL-PASSPORT"]);
    expect(exportSelectionDigest(selection)).toBe(manifest.exportSelectionDigest);
    expect(manifest.includedCandidates.map((candidate) => candidate.candidateId)).toEqual(["CAND-CTRL-PASSPORT"]);
    expect(manifest.includedCandidates.map((candidate) => candidate.candidateId)).not.toContain("CAND-TASK-0402");
    expect(manifest.citations.map((citation) => citation.citationId)).not.toContain("CIT-D05-P1-S05");
  });

  it("restores the exact Step 3 gate and manifest after canonical renewed review", () => {
    let state = baseState();
    state = applyStateCommand(state, {
      type: "withdraw_candidate",
      meta: commandMeta(state, "cmd-step-2-withdraw"),
      candidateId: "CAND-TASK-0402",
      reason: "Withdraw task evidence.",
    });

    expect(blockerCodes(state)).toEqual(["DEPENDENCY_UNRESOLVED", "REVIEW_INCOMPLETE"]);
    expect(state.dependencyChanges).toHaveLength(1);
    expect(state.dependencyChanges[0]).toMatchObject({
      changedEntityId: "CAND-TASK-0402",
      exportReadinessRevoked: true,
    });

    state = applyStateCommand(state, {
      type: "review_candidate",
      meta: commandMeta(state, "cmd-step-3-compelled"),
      intent: { candidateId: "NEXUS-COMPELLED-TASKS", action: "accept", reason: null },
    });
    state = applyStateCommand(state, {
      type: "review_candidate",
      meta: commandMeta(state, "cmd-step-3-offence"),
      intent: {
        candidateId: "NEXUS-OFFENCE-TIMING",
        action: "accept_as_limitation",
        limitationText: LIMITATION_TEXT,
        reason: "The assigned-task dependency was withdrawn.",
      },
    });

    const gate = evaluateExportGate(state, fullSelection, { now: NOW });
    expect(gate).toMatchObject({ status: "ready", freshness: "current", blockers: [] });
    expect(blockerCodes(state)).toEqual([]);
    const manifest = createExportManifest(state, fullSelection, { now: NOW, previousGate: gate });
    const includedIds = manifest.includedCandidates.map((candidate) => candidate.candidateId);
    const projectedDependencies = manifest.includedCandidates.flatMap((candidate) => candidate.dependencies);

    expect(includedIds).not.toContain("CAND-TASK-0402");
    expect(projectedDependencies.some((dependency) => dependency.kind === "candidate" && dependency.candidateId === "CAND-TASK-0402")).toBe(false);
    expect(manifest.includedCandidates.find((candidate) => candidate.candidateId === "NEXUS-OFFENCE-TIMING")).toMatchObject({
      assertionMode: "limitation",
      effectiveReviewedText: LIMITATION_TEXT,
      limitationTexts: [LIMITATION_TEXT],
    });
    expect(manifest.limitations).toContain(LIMITATION_TEXT);
    expect(manifest.reviewDecisions).toEqual(expect.arrayContaining([
      expect.objectContaining({ candidateId: "CAND-TASK-0402", action: "withdraw", resultingStatus: "invalidated" }),
      expect.objectContaining({ candidateId: "NEXUS-COMPELLED-TASKS", action: "accept", resultingStatus: "human_accepted" }),
      expect.objectContaining({ candidateId: "NEXUS-OFFENCE-TIMING", action: "accept_as_limitation", resultingStatus: "human_edited" }),
    ]));
    expect(manifest.auditEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({ eventType: "evidence_withdrawn", entityIds: ["CAND-TASK-0402"] }),
      expect.objectContaining({ eventType: "candidate_reviewed", entityIds: ["NEXUS-COMPELLED-TASKS"] }),
      expect.objectContaining({ eventType: "candidate_reviewed", entityIds: ["NEXUS-OFFENCE-TIMING"] }),
    ]));
  });

  it("preserves reviewed gap responses and coverage limitation history", () => {
    let state = baseState();
    const accepted = reviewCandidate(state.candidates, { candidateId: "CAND-SENDER-0402", action: "edit", editedText: "Edited sender timing remains source-grounded.", reason: "Demo edit" }, state.reviews);
    const coverageReview: CoverageReviewDecision = {
      id: "COVERAGE-REVIEW-0001",
      issueId: "COVERAGE-0402",
      originalConsequence: "unknown",
      reviewedConsequence: "non_consequential",
      limitationText: "One page gap was reviewed as non-consequential for this handoff.",
      reason: "Synthetic demo limitation.",
      actor: "current_practitioner",
      createdAt: NOW,
    };
    state = {
      ...state,
      candidates: accepted.candidates,
      reviews: [...state.reviews, accepted.decision],
      coverageReviews: [coverageReview],
    };
    const manifest = createExportManifest(state, fullSelection, { now: NOW });

    expect(manifest.reviewDecisions.map((decision) => decision.action)).toContain("edit");
    expect(manifest.reviewedGaps.length).toBeGreaterThan(0);
    expect(manifest.coverageLimitations).toEqual([
      {
        decisionId: "COVERAGE-REVIEW-0001",
        issueId: "COVERAGE-0402",
        originalConsequence: "unknown",
        reviewedConsequence: "non_consequential",
        limitationText: "One page gap was reviewed as non-consequential for this handoff.",
        actor: "current_practitioner",
      },
    ]);
  });

  it("uses frozen input provenance and ignores sourceCaseRevision for export freshness", () => {
    const state = baseState();
    const run = state.analysisRuns[0];
    const changedSourceRevision = {
      ...state,
      analysisRuns: [{ ...run, inputState: { ...run.inputState, sourceCaseRevision: 999 } }],
    };

    expect(blockerCodes(changedSourceRevision)).not.toContain("ANALYSIS_RUN_STALE");

    const staleMutations: Array<[string, (value: CaseState) => CaseState]> = [
      ["purpose identity", (value) => ({ ...value, purposeBrief: { ...value.purposeBrief!, id: "PURPOSE-CFN-DEMO-001-CHANGED" } })],
      ["purpose revision", (value) => ({ ...value, purposeBrief: { ...value.purposeBrief!, revision: value.purposeBrief!.revision + 1 } })],
      ["masking revision", (value) => ({ ...value, masking: { ...value.masking, revision: value.masking.revision + 1 } })],
      ["selected segment order", (value) => ({ ...value, selectedSegmentIds: [...value.selectedSegmentIds].reverse() })],
      ["selected segment membership", (value) => ({ ...value, selectedSegmentIds: value.selectedSegmentIds.slice(1) })],
      ["approved input digest", (value) => ({ ...value, analysisRuns: [{ ...run, inputState: { ...run.inputState, approvedRedactedInputDigest: "b".repeat(64) } }] })],
      ["canonical fixture digest", (value) => ({ ...value, analysisRuns: [{ ...run, inputState: { ...run.inputState, canonicalFixtureDigest: "b".repeat(64) } }] })],
      ["fixture version", (value) => ({ ...value, analysisRuns: [{ ...run, fixtureVersion: "2.0.0" }] as unknown as AnalysisRun[] })],
      ["ruleset version", (value) => ({ ...value, analysisRuns: [{ ...run, rulesetVersion: "2.0.0" }] as unknown as AnalysisRun[] })],
      ["guidance digest", (value) => ({ ...value, guidancePack: { ...value.guidancePack, digest: "b".repeat(64) } })],
    ];

    for (const [label, mutate] of staleMutations) {
      expect(blockerCodes(mutate(state)), label).toContain("ANALYSIS_RUN_STALE");
    }
  });

  it("builds the exact deterministic limitation union from included manifest projections", () => {
    const state = baseState();
    const candidates = [...state.candidates]
      .reverse()
      .map((candidate) => {
        if (candidate.id === "CAND-CTRL-PASSPORT") {
          return {
            ...candidate,
            assertionMode: "limitation" as const,
            currentText: "Shared limitation",
            reviewStatus: "human_edited" as const,
          };
        }
        if (candidate.id === "CAND-TASK-0402") {
          return {
            ...candidate,
            assertionMode: "limitation" as const,
            currentText: "Excluded candidate limitation",
            reviewStatus: "rejected" as const,
          };
        }
        if (candidate.kind === "context_gap" && candidate.id === "CAND-SENDER-0402") {
          return {
            ...candidate,
            reviewStatus: "human_accepted" as const,
            responseStatus: "deferred" as const,
            response: null,
            responseEvidenceNature: "unknown" as const,
            responseExplanation: "Gap explanation",
          };
        }
        return candidate;
      });
    const coverageReviews: CoverageReviewDecision[] = [
      {
        id: "COVERAGE-REVIEW-0002",
        issueId: "COVERAGE-0002",
        originalConsequence: "unknown",
        reviewedConsequence: "non_consequential",
        limitationText: "Zulu limitation",
        reason: "Reviewed synthetic limitation.",
        actor: "current_practitioner",
        createdAt: NOW,
      },
      {
        id: "COVERAGE-REVIEW-0001",
        issueId: "COVERAGE-0001",
        originalConsequence: "unknown",
        reviewedConsequence: "non_consequential",
        limitationText: "Shared limitation",
        reason: "Reviewed synthetic limitation.",
        actor: "current_practitioner",
        createdAt: NOW,
      },
    ];
    const [firstCard, secondCard, excludedCard] = bundledGuidancePack.cards;
    const guidanceCards: GuidanceCard[] = [
      { ...(secondCard as GuidanceCard), limitation: "Shared limitation" },
      { ...(firstCard as GuidanceCard), limitation: "Alpha guidance limitation" },
    ];
    const manifest = createExportManifest(
      { ...state, candidates, coverageReviews },
      fullSelection,
      { now: NOW, guidanceCards },
    );

    expect(manifest.limitations).toEqual([
      "Alpha guidance limitation",
      "Gap explanation",
      "Shared limitation",
      "Zulu limitation",
    ]);
    expect(manifest.limitations).not.toContain("Excluded candidate limitation");
    expect(manifest.limitations).not.toContain(excludedCard.limitation);

    const shuffledAgain = createExportManifest(
      { ...state, candidates: [...candidates].reverse(), coverageReviews: [...coverageReviews].reverse() },
      fullSelection,
      { now: NOW, guidanceCards: [...guidanceCards].reverse() },
    );
    expect(shuffledAgain.limitations).toEqual(manifest.limitations);
  });
});
