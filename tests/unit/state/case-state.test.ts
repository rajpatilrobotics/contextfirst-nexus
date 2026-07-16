import { describe, expect, it } from "vitest";

import {
  applyCaseCommand,
  createInitialCaseState,
  loadCaseState,
  projectNonRunAttempts,
  resetCase,
  saveCaseState,
  serializeCaseState,
} from "../../../lib/state";
import {
  resolveTrustedCheckpointBundle,
  trustedPurposeBrief,
} from "../../../lib/analysis/replay";
import { resolveCitation, resolveManualCitation } from "../../../lib/citations";
import { cfnDemoFixture } from "../../../lib/fixtures";
import { LIMITATION_TEXT } from "../../../lib/review";
import type {
  AnalyzeRequest,
  CaseCommand,
  CaseState,
  Citation,
  ExportSelection,
  LiveAnalysisExecutionResult,
} from "../../../lib/contracts";

const NOW = "2026-07-16T00:00:00.000Z";

function meta(state: CaseState, id: string): CaseCommand["meta"] {
  return {
    commandId: id,
    idempotencyKey: `idem-${id}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt: NOW,
  };
}

function applyOk(state: CaseState, command: CaseCommand): CaseState {
  const result = applyCaseCommand(state, command);
  expect(result.ok, result.ok ? undefined : result.reason).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

function loadCheckpoint(state = createInitialCaseState(NOW)) {
  return applyOk(state, {
    type: "load_demo_checkpoint",
    meta: meta(state, "cmd-load-checkpoint"),
    checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
  });
}

function completeCheckpointReview(state = loadCheckpoint()) {
  const intents: Array<Extract<CaseCommand, { type: "review_candidate" }>["intent"]> = [
    {
      candidateId: "CAND-CTRL-PASSPORT",
      action: "edit",
      editedText: "The practitioner report describes passport removal; recruiter messages separately refer to passport custody.",
      reason: "Preserve reported and documented sources separately.",
    },
    { candidateId: "CAND-CTRL-CONFINEMENT", action: "reject", reason: "No independent confirmation." },
    { candidateId: "CAND-SENDER-0402", action: "reject", reason: "Assignment and allegation do not prove sender identity." },
    { candidateId: "CAND-URG-INTERPRETER", action: "confirm_unknown", reason: null },
  ];
  for (const [index, intent] of intents.entries()) {
    state = applyOk(state, {
      type: "review_candidate",
      meta: meta(state, `cmd-complete-checkpoint-${index + 1}`),
      intent,
    });
  }
  return state;
}

function createPopulatedExportState() {
  let state = completeCheckpointReview();
  state = applyOk(state, {
    type: "evaluate_export_gate",
    meta: meta(state, "cmd-current-export-gate"),
    selection: fullSelection,
  });
  return state;
}

function liveRequest(state: CaseState): AnalyzeRequest {
  if (!state.purposeBrief) throw new Error("missing purpose");
  return {
    schemaVersion: "1.0.0",
    caseId: "CFN-DEMO-001",
    fixtureVersion: "1.0.0",
    canonicalFixtureDigest: cfnDemoFixture.canonicalFixtureDigest,
    purposeBriefId: state.purposeBrief.id,
    purposeContext: {
      practitionerRole: state.purposeBrief.practitionerRole,
      jurisdictionCode: state.purposeBrief.jurisdictionCode,
      sourceLanguage: "en",
      requestedExport: state.purposeBrief.requestedExport,
    },
    maskReviewApproved: true,
    leakScanStatus: "passed",
    requestedMode: "live",
    providerSelection: {
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      serviceTier: "paid",
    },
    providerDisclosureAcknowledgement: {
      id: "ACK-LIVE-OPENAI",
      schemaVersion: "1.0.0",
      disclosureVersion: "1.0.0",
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      serviceTier: "paid",
      dataFlowAcknowledged: true,
      retentionAndTrainingUseAcknowledged: true,
      serviceTierAcknowledged: true,
      acknowledgedAt: NOW,
    },
    selectedSegmentIds: [...state.selectedSegmentIds],
    maskApprovals: [],
  };
}

function failedRun(id: string): LiveAnalysisExecutionResult {
  return {
    id,
    mode: "live",
    provider: {
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      requestedModel: "gpt-5.6-sol",
      serviceTier: "paid",
      adapterVersion: "test-adapter",
      returnedModel: null,
      inferenceSetting: { kind: "reasoning_effort", value: "medium" },
      disclosureVersion: "1.0.0",
      providerTransmission: true,
    },
    promptVersion: "1.0.0",
    requestSchemaVersion: "1.0.0",
    responseSchemaVersion: "1.0.0",
    fixtureVersion: "1.0.0",
    rulesetVersion: "1.0.0",
    checkpointProvenance: null,
    startedAt: NOW,
    completedAt: NOW,
    durationMs: 10,
    inputSegmentCount: 1,
    candidateCount: 0,
    citationCount: 0,
    quarantinedCount: 0,
    status: "failed",
    failure: {
      classification: "provider_timeout",
      safeErrorCode: "PROVIDER_TIMEOUT",
      retryableSameProvider: true,
      alternateProviderRecoveryAllowed: true,
      replayRecoveryAllowed: true,
    },
  };
}

const fullSelection: ExportSelection = {
  kind: "full_practitioner_handoff",
  minimumNecessarySelection: null,
};

function ambiguousCitationState() {
  let state = loadCheckpoint();
  state = applyOk(state, {
    type: "evaluate_export_gate",
    meta: meta(state, "cmd-gate-before-resolution"),
    selection: fullSelection,
  });
  const candidateId = "NEXUS-CONTROL";
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate) throw new Error("missing candidate");
  const dependency = candidate.dependencies.find(
    (item) => item.kind === "source" && item.sourceSegmentId === "D02-P2-S05",
  );
  if (!dependency || dependency.kind !== "source") throw new Error("missing source dependency");
  const originalCitation = state.citations.find((item) => item.id === dependency.citationId);
  if (!originalCitation) throw new Error("missing citation");
  const recomputed = resolveCitation({
    id: originalCitation.id,
    analysisRunId: originalCitation.analysisRunId,
    candidateId,
    quotedText: "debt",
    documentId: originalCitation.documentId,
    pageNumber: originalCitation.pageNumber,
    segmentId: dependency.sourceSegmentId,
    purpose: "supporting_candidate",
    claimedEvidenceNature: dependency.evidenceNature,
    sourceEvidenceNature: dependency.evidenceNature,
    now: NOW,
  });
  expect(recomputed.citation.validationStatus).toBe("ambiguous_match");
  expect(recomputed.ambiguityOptions.length).toBeGreaterThan(1);
  const ambiguousCitation: Citation = {
    ...recomputed.citation,
    id: originalCitation.id,
    analysisRunId: originalCitation.analysisRunId,
    quotedText: "debt",
    normalizedQuotedText: "debt",
  };
  state = {
    ...state,
    citations: state.citations.map((citation) =>
      citation.id === ambiguousCitation.id ? ambiguousCitation : citation,
    ),
    candidates: state.candidates.map((item) =>
      item.id === candidateId
        ? { ...item, supportStatus: "citation_unresolved", reviewStatus: "pending" }
        : item,
    ),
  };
  return {
    state,
    candidateId,
    citationId: ambiguousCitation.id,
    segmentId: dependency.sourceSegmentId,
    options: recomputed.ambiguityOptions,
    recomputed,
    originalCitation,
  };
}

describe("TASK-010 case state reducer", () => {
  it("rejects stale revisions and duplicate idempotency keys without mutation", () => {
    const initial = createInitialCaseState(NOW);
    const command: CaseCommand = {
      type: "save_purpose",
      meta: meta(initial, "cmd-purpose"),
      purposeBrief: trustedPurposeBrief(),
    };
    const saved = applyOk(initial, command);
    expect(saved.caseRevision).toBe(1);
    expect(saved.audit).toHaveLength(1);

    const duplicate = applyCaseCommand(saved, { ...command, meta: { ...command.meta, expectedCaseRevision: saved.caseRevision } });
    expect(duplicate.ok).toBe(false);
    expect(duplicate.state.caseRevision).toBe(1);
    expect(duplicate.state.audit).toHaveLength(1);

    const stale = applyCaseCommand(saved, {
      type: "save_purpose",
      meta: { ...meta(saved, "cmd-stale"), expectedCaseRevision: 0 },
      purposeBrief: trustedPurposeBrief(),
    });
    expect(stale.ok).toBe(false);
    expect(stale.state.caseRevision).toBe(1);
  });

  it("locks material commands while a live request is pending and records no-run attempts", () => {
    let state = loadCheckpoint();
    const start: CaseCommand = {
      type: "start_live_analysis",
      meta: meta(state, "cmd-start-live"),
      request: liveRequest(state),
      recoveryOfRunId: null,
    };
    const started = applyCaseCommand(state, start);
    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error(started.reason);
    state = started.state;
    expect(state.pendingLiveAnalysis?.startCommandId).toBe("cmd-start-live");
    expect(state.caseRevision).toBe(2);
    expect(started.networkAuthorized).toBe(true);

    const blocked = applyCaseCommand(state, {
      type: "save_purpose",
      meta: meta(state, "cmd-blocked-purpose"),
      purposeBrief: trustedPurposeBrief(),
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.state.caseRevision).toBe(state.caseRevision);

    const rejected = applyOk(state, {
      type: "record_live_analysis_transport_failure",
      meta: meta(state, "cmd-transport"),
      startCommandId: "cmd-start-live",
      reasonCode: "network_unavailable",
    });
    expect(rejected.pendingLiveAnalysis).toBeNull();
    expect(rejected.analysisRuns).toHaveLength(1);
    const attempts = projectNonRunAttempts(rejected);
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      kind: "transport_failure",
      startCommandId: "cmd-start-live",
      outputAccepted: false,
      remoteExecutionStatus: "unknown",
    });
  });

  it("attaches local recovery metadata and activates a failed terminal run atomically", () => {
    let state = loadCheckpoint();
    const startCommand: CaseCommand = {
      type: "start_live_analysis",
      meta: meta(state, "cmd-start-fail"),
      request: liveRequest(state),
      recoveryOfRunId: null,
    };
    state = applyOk(state, startCommand);
    const failed = applyOk(state, {
      type: "fail_live_analysis",
      meta: meta(state, "cmd-fail-live"),
      startCommandId: "cmd-start-fail",
      response: {
        schemaVersion: "1.0.0",
        outcome: "failed",
        run: failedRun("RUN-LIVE-FAILED"),
        candidates: [],
        citations: [],
        quarantined: [],
        error: {
          schemaVersion: "1.0.0",
          requestId: "REQ-FAILED",
          userMessage: "The provider timed out.",
          failedStage: "provider",
          code: "PROVIDER_TIMEOUT",
          retryable: true,
          failedRunId: "RUN-LIVE-FAILED",
          providerContext: liveRequest(state).providerSelection,
          failureClassification: "provider_timeout",
          recoveryOptions: [],
        },
      },
    });
    expect(failed.pendingLiveAnalysis).toBeNull();
    expect(failed.activeAnalysisRunId).toBe("RUN-LIVE-FAILED");
    expect(failed.candidates).toHaveLength(0);
    expect(failed.reviews).toHaveLength(0);
    expect(failed.analysisRuns.at(-1)?.recovery).toMatchObject({
      recoveryOfRunId: null,
      selectionReason: "initial_choice",
      automaticFailover: false,
      outputsMerged: false,
    });
  });

  it("retains the validated ordered checkpoint decisions while ordinary replay clears them", () => {
    const resolved = resolveTrustedCheckpointBundle("DEMO-CHECKPOINT-REVIEW");
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) throw new Error(resolved.reason);

    const checkpoint = loadCheckpoint();
    const activeRunId = checkpoint.activeAnalysisRunId!;
    expect(checkpoint.reviews).toEqual(
      resolved.bundle.seededDecisions.map((decision) => ({
        ...decision,
        analysisRunId: activeRunId,
      })),
    );
    expect(checkpoint.reviews.map((decision) => decision.id)).toEqual(
      resolved.bundle.seededDecisions.map((decision) => decision.id),
    );
    const finalDecisionByCandidate = new Map(
      checkpoint.reviews.map((decision) => [decision.candidateId, decision]),
    );
    for (const decision of finalDecisionByCandidate.values()) {
      expect(checkpoint.candidates.find((candidate) => candidate.id === decision.candidateId)).toMatchObject({
        analysisRunId: activeRunId,
        reviewStatus: decision.resultingStatus,
        revision: decision.candidateRevision,
      });
    }
    expect(checkpoint.audit.at(-1)).toMatchObject({
      eventType: "analysis_completed",
      actor: "fixture_reviewer",
      actorRole: "demo_evaluator",
      analysisRunId: activeRunId,
      providerId: resolved.bundle.replayRun.provider.providerId,
      releaseConfigurationId: resolved.bundle.replayRun.provider.releaseConfigurationId,
      providerDisclosureVersion: resolved.bundle.replayRun.provider.disclosureVersion,
      promptVersion: resolved.bundle.replayRun.promptVersion,
      rulesetVersion: resolved.bundle.replayRun.rulesetVersion,
    });

    const ordinaryReplay = applyOk(checkpoint, {
      type: "run_deterministic_replay",
      meta: meta(checkpoint, "cmd-ordinary-replay-after-checkpoint"),
      request: {
        mode: "deterministic_replay",
        replayBundleId: "REPLAY-CFN-DEMO-001-V1",
        caseId: "CFN-DEMO-001",
        releaseConfigurationId: "prepared-replay-v1",
        providerDisclosureAcknowledgementId: checkpoint.purposeBrief!.providerSelection.disclosureAcknowledgement.id,
        recoveryOfRunId: null,
        fixtureVersion: "1.0.0",
        promptVersion: "1.0.0",
        analysisResponseVersion: "1.0.0",
        replayVersion: "1.0.0",
      },
    });
    expect(ordinaryReplay.reviews).toEqual([]);
    expect(ordinaryReplay.citationResolutions).toEqual([]);
    expect(ordinaryReplay.dependencyChanges).toEqual([]);
  });

  it("persists renewed-review dependency reconciliation through the reducer and session projection", () => {
    let state = completeCheckpointReview();
    state = applyOk(state, {
      type: "evaluate_export_gate",
      meta: meta(state, "cmd-gate-before-withdrawal"),
      selection: fullSelection,
    });
    const unrelatedBefore = state.candidates.find((candidate) => candidate.id === "CAND-TL-ARRIVAL");
    state = applyOk(state, {
      type: "withdraw_candidate",
      meta: meta(state, "cmd-withdraw-task"),
      candidateId: "CAND-TASK-0402",
      reason: "The assignment evidence was withdrawn from consideration.",
    });
    const beforeRenewedReview = state;
    state = applyOk(state, {
      type: "review_candidate",
      meta: meta(state, "cmd-renew-compelled-tasks"),
      intent: { candidateId: "NEXUS-COMPELLED-TASKS", action: "accept", reason: null },
    });

    const compelled = state.candidates.find((candidate) => candidate.id === "NEXUS-COMPELLED-TASKS")!;
    const withdrawnEdge = compelled.dependencies.find(
      (dependency) => dependency.kind === "candidate" && dependency.candidateId === "CAND-TASK-0402",
    );
    expect(withdrawnEdge?.active).toBe(false);
    expect(state.reviews.at(-1)?.dependencySnapshot).toEqual(
      compelled.dependencies.filter((dependency) => dependency.active).map((dependency) => dependency.id).sort(),
    );
    expect(state.caseRevision).toBe(beforeRenewedReview.caseRevision + 1);
    expect(state.reviews).toHaveLength(beforeRenewedReview.reviews.length + 1);
    expect(state.audit).toHaveLength(beforeRenewedReview.audit.length + 1);
    expect(state.audit.at(-1)?.eventType).toBe("candidate_reviewed");
    expect(state.exportGate).toBeNull();
    expect(state.currentExportId).toBeNull();
    expect(state.currentExportManifest).toBeNull();
    expect(state.candidates.find((candidate) => candidate.id === "CAND-TL-ARRIVAL")).toEqual(unrelatedBefore);

    state = applyOk(state, {
      type: "review_candidate",
      meta: meta(state, "cmd-renew-offence-timing"),
      intent: {
        candidateId: "NEXUS-OFFENCE-TIMING",
        action: "accept_as_limitation",
        limitationText: LIMITATION_TEXT,
        reason: "The assigned-task dependency was withdrawn.",
      },
    });
    const store = new Map<string, string>();
    const session = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    };
    expect(saveCaseState(session, state, NOW)).toBe(true);
    const restored = loadCaseState(session);
    expect(restored.ok).toBe(true);
    if (!restored.ok) throw new Error(restored.reason);
    for (const candidateId of ["NEXUS-COMPELLED-TASKS", "NEXUS-OFFENCE-TIMING"]) {
      expect(
        restored.state.candidates
          .find((candidate) => candidate.id === candidateId)
          ?.dependencies.find((dependency) => dependency.kind === "candidate" && dependency.candidateId === "CAND-TASK-0402")
          ?.active,
      ).toBe(false);
    }
  });

  it("audits intentional source reveal once without material or export mutation", () => {
    const state = createPopulatedExportState();
    const citation = state.citations[0];
    const command: CaseCommand = {
      type: "reveal_source",
      meta: meta(state, "cmd-reveal-source"),
      citationId: citation.id,
      reasonCode: "explicit_synthetic_source_review",
    };
    const result = applyCaseCommand(state, command);
    expect(result.ok, result.ok ? undefined : result.reason).toBe(true);
    if (!result.ok) throw new Error(result.reason);

    expect(result.auditEvent).toMatchObject({
      eventType: "source_revealed",
      entityIds: [citation.id],
      reasonCode: "explicit_synthetic_source_review",
      summary: `source_revealed ${citation.id} explicit_synthetic_source_review`,
    });
    expect(result.state.audit).toHaveLength(state.audit.length + 1);
    expect(result.state.audit.filter((event) => event.eventType === "source_revealed")).toHaveLength(1);
    expect(result.auditEvent?.summary).not.toContain(citation.quotedText);
    expect(result.state.caseRevision).toBe(state.caseRevision);
    expect(result.state.exportGate).toEqual(state.exportGate);
    expect(result.state.exports).toEqual(state.exports);
    expect(result.state.currentExportId).toBe(state.currentExportId);
    expect(result.state.currentExportManifest).toEqual(state.currentExportManifest);
    expect(result.state.exportedRevision).toBe(state.exportedRevision);
    expect(result.state.candidates).toEqual(state.candidates);
    expect(result.state.citations).toEqual(state.citations);
    expect(result.state.reviews).toEqual(state.reviews);
    expect(result.state.citationResolutions).toEqual(state.citationResolutions);
    expect(result.state.dependencyChanges).toEqual(state.dependencyChanges);

    const duplicate = applyCaseCommand(result.state, command);
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) throw new Error("duplicate reveal unexpectedly succeeded");
    expect(duplicate.reason).toBe("duplicate_idempotency_key");
    expect(duplicate.state).toEqual(result.state);
    expect(duplicate.state.audit.filter((event) => event.eventType === "source_revealed")).toHaveLength(1);
  });

  it("persists only the safe projection and does not overwrite storage while pending", () => {
    let state = loadCheckpoint();
    const store = new Map<string, string>();
    const session = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    };

    expect(saveCaseState(session, state, NOW)).toBe(true);
    const serialized = serializeCaseState(state, NOW);
    expect(serialized).not.toContain("pendingLiveAnalysis");
    expect(serialized).not.toContain("rawText");

    state = applyOk(state, {
      type: "start_live_analysis",
      meta: meta(state, "cmd-start-persist"),
      request: liveRequest(state),
      recoveryOfRunId: null,
    });
    expect(saveCaseState(session, state, NOW)).toBe(false);

    const restored = loadCaseState(session);
    expect(restored.ok).toBe(true);
    if (!restored.ok) throw new Error(restored.reason);
    expect(restored.state.pendingLiveAnalysis).toBeNull();
    expect(restored.state.segments).toHaveLength(cfnDemoFixture.segments.length);
  });

  it("reset removes the session key and invokes cleanup callbacks once", () => {
    const calls: string[] = [];
    const store = new Map<string, string>([["contextfirst-nexus.case-state.v1", "{}"]]);
    const state = resetCase(
      {
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => store.set(key, value),
        removeItem: (key) => store.delete(key),
      },
      {
        objectUrls: [() => calls.push("url")],
        pdfWorkers: [() => calls.push("worker")],
        documentCaches: [() => calls.push("cache")],
      },
      NOW,
    );
    expect(store.has("contextfirst-nexus.case-state.v1")).toBe(false);
    expect(calls).toEqual(["url", "worker", "cache"]);
    expect(state.caseRevision).toBe(0);
  });

  it("resolves only an exact TASK-007 ambiguity option and stores resolver-produced output", () => {
    const fixture = ambiguousCitationState();
    const selected = fixture.options[0];
    const expected = resolveManualCitation(fixture.recomputed, {
      decisionId: "CITATION-RESOLUTION-1",
      analysisRunId: fixture.state.activeAnalysisRunId!,
      candidateId: fixture.candidateId,
      citationId: fixture.citationId,
      selectedSegmentId: fixture.segmentId,
      selectedRedactedSegmentRange: selected.redactedSegmentRange,
      now: NOW,
    });
    if ("reason" in expected) throw new Error(expected.reason);

    const result = applyCaseCommand(fixture.state, {
      type: "resolve_citation",
      meta: meta(fixture.state, "cmd-resolve-valid"),
      candidateId: fixture.candidateId,
      citationId: fixture.citationId,
      selectedSegmentId: fixture.segmentId,
      selectedRedactedSegmentRange: selected.redactedSegmentRange,
    });
    expect(result.ok, result.ok ? undefined : result.reason).toBe(true);
    if (!result.ok) throw new Error(result.reason);

    expect(result.state.citations.find((citation) => citation.id === fixture.citationId)).toEqual(expected.citation);
    expect(result.state.citationResolutions.at(-1)).toEqual(expected.decision);
    expect(result.state.candidates.find((candidate) => candidate.id === fixture.candidateId)).toMatchObject({
      supportStatus: "exact_source_supported",
      reviewStatus: "pending",
    });
    expect(result.state.audit.at(-1)).toMatchObject({
      eventType: "citation_manually_resolved",
      analysisRunId: fixture.state.activeAnalysisRunId,
      entityIds: [fixture.citationId],
    });
    expect(result.state.caseRevision).toBe(fixture.state.caseRevision + 1);
    expect(result.state.exportGate).toBeNull();
    expect(result.state.currentExportId).toBeNull();
    expect(result.state.currentExportManifest).toBeNull();
    expect(result.state.exportedRevision).toBeNull();
    expect(result.state.reviews).toEqual(fixture.state.reviews);
  });

  it("rejects invalid manual citation states, ownership, segments, and ranges without mutation", () => {
    const fixture = ambiguousCitationState();
    const selected = fixture.options[0].redactedSegmentRange;
    const otherCandidate = fixture.state.candidates.find(
      (candidate) => candidate.id !== fixture.candidateId,
    )!;
    const cases: Array<{
      label: string;
      state?: CaseState;
      candidateId?: string;
      segmentId?: string;
      range?: { start: number; end: number };
    }> = [
      { label: "exact citation", state: { ...fixture.state, citations: fixture.state.citations.map((citation) => citation.id === fixture.citationId ? { ...fixture.originalCitation, validationStatus: "exact_match", resolutionMethod: "exact_codepoint", resolvedBy: "system" } as Citation : citation) } },
      { label: "already resolved", state: { ...fixture.state, citations: fixture.state.citations.map((citation) => citation.id === fixture.citationId ? { ...fixture.originalCitation, validationStatus: "manually_resolved", resolutionMethod: "manual_segment_selection", resolvedBy: "practitioner" } as Citation : citation) } },
      { label: "normalized-only exact", state: { ...fixture.state, citations: fixture.state.citations.map((citation) => citation.id === fixture.citationId ? { ...fixture.originalCitation, validationStatus: "exact_match", resolutionMethod: "normalized_unique_lookup", resolvedBy: "system" } as Citation : citation) } },
      { label: "cross-run citation", state: { ...fixture.state, citations: fixture.state.citations.map((citation) => citation.id === fixture.citationId ? { ...citation, analysisRunId: "RUN-OTHER" } : citation) } },
      { label: "cross-run candidate", state: { ...fixture.state, candidates: fixture.state.candidates.map((candidate) => candidate.id === fixture.candidateId ? { ...candidate, analysisRunId: "RUN-OTHER" } : candidate) } },
      { label: "inactive candidate", state: { ...fixture.state, candidates: fixture.state.candidates.map((candidate) => candidate.id === fixture.candidateId ? { ...candidate, inclusionStatus: "withdrawn" } : candidate) } },
      { label: "inactive source dependency", state: { ...fixture.state, candidates: fixture.state.candidates.map((candidate) => candidate.id === fixture.candidateId ? { ...candidate, dependencies: candidate.dependencies.map((dependency) => dependency.kind === "source" && dependency.citationId === fixture.citationId ? { ...dependency, active: false } : dependency) } : candidate) } },
      { label: "candidate does not own citation", candidateId: otherCandidate.id },
      { label: "missing arbitrary segment", segmentId: "D99-P1-S01" },
      { label: "existing arbitrary segment", segmentId: fixture.state.segments.find((segment) => segment.id !== fixture.segmentId)!.id },
      { label: "shifted range", range: { start: selected.start + 1, end: selected.end + 1 } },
      { label: "partial range", range: { start: selected.start, end: selected.end - 1 } },
      { label: "out-of-bounds range", range: { start: selected.start, end: 999_999 } },
    ];

    for (const [index, testCase] of cases.entries()) {
      const state = testCase.state ?? fixture.state;
      const result = applyCaseCommand(state, {
        type: "resolve_citation",
        meta: { ...meta(state, `cmd-resolve-invalid-${index}`), expectedCaseRevision: state.caseRevision },
        candidateId: testCase.candidateId ?? fixture.candidateId,
        citationId: fixture.citationId,
        selectedSegmentId: testCase.segmentId ?? fixture.segmentId,
        selectedRedactedSegmentRange: testCase.range ?? selected,
      });
      expect(result.ok, testCase.label).toBe(false);
      expect(result.state, testCase.label).toEqual(state);
    }
  });

  it("increments revision before evaluating a materially changed normalized export selection", () => {
    const checkpoint = loadCheckpoint();
    const state: CaseState = {
      ...checkpoint,
      purposeBrief: {
        ...checkpoint.purposeBrief!,
        requestedExport: "minimum_necessary_safe_share",
      },
    };
    const firstSelection: ExportSelection = {
      kind: "minimum_necessary_safe_share",
      minimumNecessarySelection: {
        confirmed: true,
        intendedRecipientCategory: state.purposeBrief!.intendedRecipientCategory,
        selectedCandidateIds: ["CAND-CTRL-PASSPORT"],
        excludedCandidateIds: ["CAND-TASK-0402"],
      },
    };
    const first = applyOk(state, {
      type: "evaluate_export_gate",
      meta: meta(state, "cmd-gate-first"),
      selection: firstSelection,
    });
    expect(first.caseRevision).toBe(state.caseRevision);
    expect(first.exportGate?.caseRevision).toBe(first.caseRevision);

    const changedSelection: ExportSelection = {
      kind: "minimum_necessary_safe_share",
      minimumNecessarySelection: {
        ...firstSelection.minimumNecessarySelection!,
        selectedCandidateIds: ["CAND-CTRL-PASSPORT", "CAND-TL-ARRIVAL"],
      },
    };
    const changed = applyOk(first, {
      type: "evaluate_export_gate",
      meta: meta(first, "cmd-gate-changed"),
      selection: changedSelection,
    });
    expect(changed.caseRevision).toBe(first.caseRevision + 1);
    expect(changed.exportGate?.caseRevision).toBe(changed.caseRevision);
    expect(changed.currentExportId).toBeNull();
    expect(changed.currentExportManifest).toBeNull();
    expect(changed.exportedRevision).toBeNull();

    const reorderedSelection: ExportSelection = {
      kind: "minimum_necessary_safe_share",
      minimumNecessarySelection: {
        ...changedSelection.minimumNecessarySelection!,
        selectedCandidateIds: [...changedSelection.minimumNecessarySelection!.selectedCandidateIds].reverse(),
      },
    };
    const unchanged = applyOk(changed, {
      type: "evaluate_export_gate",
      meta: meta(changed, "cmd-gate-reordered"),
      selection: reorderedSelection,
    });
    expect(unchanged.caseRevision).toBe(changed.caseRevision);
    expect(unchanged.exportGate?.caseRevision).toBe(unchanged.caseRevision);
    expect(unchanged.exportGate?.exportSelectionDigest).toBe(changed.exportGate?.exportSelectionDigest);
  });

  it("rejects structurally invalid export selections before any revision or export mutation", () => {
    const checkpoint = loadCheckpoint();
    const state: CaseState = {
      ...checkpoint,
      purposeBrief: {
        ...checkpoint.purposeBrief!,
        requestedExport: "minimum_necessary_safe_share",
      },
    };
    const invalidSelections: ExportSelection[] = [
      {
        kind: "minimum_necessary_safe_share",
        minimumNecessarySelection: {
          confirmed: true,
          intendedRecipientCategory: state.purposeBrief!.intendedRecipientCategory,
          selectedCandidateIds: ["CAND-CTRL-PASSPORT", "CAND-CTRL-PASSPORT"],
          excludedCandidateIds: [],
        },
      },
      {
        kind: "minimum_necessary_safe_share",
        minimumNecessarySelection: {
          confirmed: true,
          intendedRecipientCategory: state.purposeBrief!.intendedRecipientCategory,
          selectedCandidateIds: ["CAND-CTRL-PASSPORT"],
          excludedCandidateIds: ["CAND-CTRL-PASSPORT"],
        },
      },
      {
        kind: "minimum_necessary_safe_share",
        minimumNecessarySelection: {
          confirmed: true,
          intendedRecipientCategory: state.purposeBrief!.intendedRecipientCategory,
          selectedCandidateIds: ["CAND-UNKNOWN"],
          excludedCandidateIds: [],
        },
      },
      fullSelection,
    ];

    for (const [index, selection] of invalidSelections.entries()) {
      const result = applyCaseCommand(state, {
        type: "evaluate_export_gate",
        meta: meta(state, `cmd-invalid-selection-${index}`),
        selection,
      });
      expect(result.ok).toBe(false);
      expect(result.state).toEqual(state);
    }
  });
});
