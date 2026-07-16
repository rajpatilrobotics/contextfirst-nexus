import {
  CaseCommandSchema,
  CaseStateSchema,
  type AnalysisRecoveryMetadata,
  type AnalysisRun,
  type AuditEvent,
  type CaseCommand,
  type CaseState,
  type CaseStatus,
  type CoverageReviewDecision,
  type ExportRecord,
  type GuidanceCard,
  type NonRunAnalysisAttempt,
  type PersistedCaseState,
  type ProcessingStage,
} from "../contracts";
import { cfnDemoFixture } from "../fixtures";
import { bundledGuidancePack } from "../guidance";
import {
  addMaskSuggestion,
  applyLeakScanResult,
  approveMaskingReview,
  createEmptyMaskingReview,
  detectMaskSuggestions,
  makeManualSuggestion,
  removeMaskSuggestion,
  reviewMask,
  scanProviderPayload,
  validateTransmissionReadiness,
} from "../redaction";
import { respondContextGap, reviewCandidate, withdrawCandidate } from "../review";
import {
  createExportManifest,
  evaluateExportGate as evaluateExportGateCore,
  exportSelectionDigest,
  normalizeExportSelection,
} from "../export/core";
import {
  createReplayInputState,
  resolveTrustedCheckpointBundle,
  resolveTrustedReplayBundle,
  trustedSegments,
} from "../analysis/replay";

export const CASE_STATE_STORAGE_KEY = "contextfirst-nexus.case-state.v1" as const;
const VERSION = "1.0.0" as const;
const MAX_PERSISTED_BYTES = 1_000_000;

export type CaseCommandResult =
  | { ok: true; state: CaseState; auditEvent?: AuditEvent; networkAuthorized?: boolean }
  | { ok: false; state: CaseState; reason: string };

export type RestoreResult =
  | { ok: true; state: CaseState; replacedGuidanceIdentity: boolean }
  | { ok: false; reason: string; resetState: CaseState };

export type SessionStoreLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type CleanupRegistry = {
  objectUrls?: Array<() => void>;
  pdfWorkers?: Array<() => void>;
  documentCaches?: Array<() => void>;
};

type TerminalAnalyzeResponse = {
  outcome: "succeeded" | "failed" | "rejected_before_run";
  run: AnalysisRun;
  candidates: CaseState["candidates"];
  citations: CaseState["citations"];
  error?: { code: string };
};

export function createInitialCaseState(now = isoNow()): CaseState {
  return CaseStateSchema.parse({
    schemaVersion: VERSION,
    caseId: "CFN-DEMO-001",
    caseRevision: 0,
    caseStatus: "draft",
    fixtureVersion: VERSION,
    guidancePack: bundledGuidancePack.identity,
    purposeBrief: null,
    documents: [],
    segments: [],
    selectedSegmentIds: [],
    masking: createEmptyMaskingReview(0),
    coverage: {
      expectedDocuments: 0,
      processedDocuments: 0,
      expectedPages: 0,
      availablePages: 0,
      issues: [],
      hasConsequentialOpenIssue: false,
    },
    coverageReviews: [],
    processing: [],
    pendingLiveAnalysis: null,
    analysisRuns: [],
    activeAnalysisRunId: null,
    citations: [],
    citationResolutions: [],
    candidates: [],
    reviews: [],
    dependencyChanges: [],
    audit: [],
    exportGate: null,
    exports: [],
    currentExportId: null,
    currentExportManifest: null,
    exportedRevision: null,
    lastUpdatedAt: now,
  });
}

export function deriveCaseStatus(state: CaseState): CaseStatus {
  if (state.pendingLiveAnalysis || state.processing.some((stage) => stage.status === "active")) return "processing";
  if (state.processing.some((stage) => stage.status === "failed" && stage.name !== "safety_export_gate_checks")) return "processing_failed";
  if (!state.purposeBrief || state.purposeBrief.status !== "complete") return "draft";
  if (state.masking.reviewStatus !== "approved" || state.masking.leakScanStatus !== "passed") return "draft";
  if (state.coverage.hasConsequentialOpenIssue) return "blocked";
  if (state.exportGate?.status === "blocked" && state.exportGate.freshness === "current") return "blocked";
  if (
    state.candidates.some(
      (candidate) =>
        candidate.inclusionStatus === "active" &&
        candidate.reviewRequirement === "individual" &&
        (candidate.reviewStatus === "pending" || candidate.reviewStatus === "invalidated"),
    )
  ) {
    return "review_required";
  }
  if (state.currentExportId && state.exportedRevision === state.caseRevision) return "exported";
  if (state.exportGate?.status === "ready" && state.exportGate.caseRevision === state.caseRevision) return "ready_to_export";
  return state.analysisRuns.some((run) => run.status === "succeeded") ? "review_required" : "draft";
}

export function applyCaseCommand(inputState: CaseState, inputCommand: CaseCommand): CaseCommandResult {
  const parsed = CaseCommandSchema.safeParse(inputCommand);
  if (!parsed.success) return { ok: false, state: inputState, reason: "invalid_command" };

  const command = parsed.data;
  const state = withDerivedStatus(inputState);
  if (command.meta.expectedCaseRevision !== state.caseRevision) {
    return { ok: false, state, reason: "stale_case_revision" };
  }
  if (state.audit.some((event) => event.idempotencyKey === command.meta.idempotencyKey)) {
    return { ok: false, state, reason: "duplicate_idempotency_key" };
  }
  if (state.pendingLiveAnalysis && !isPendingTerminal(command.type)) {
    return { ok: false, state, reason: "live_analysis_pending" };
  }

  try {
    const next = applyValidCommand(state, command);
    return next;
  } catch (error) {
    return { ok: false, state, reason: error instanceof Error ? error.message : "command_failed" };
  }
}

function applyValidCommand(state: CaseState, command: CaseCommand): CaseCommandResult {
  switch (command.type) {
    case "save_purpose":
      return commit(state, command, {
        purposeBrief: command.purposeBrief,
        caseRevision: state.caseRevision + 1,
        exportGate: null,
        currentExportId: null,
        currentExportManifest: null,
        exportedRevision: null,
      }, "purpose_saved", [command.purposeBrief.id]);
    case "begin_fixture_processing":
      return commit(state, command, { processing: fixtureProcessing("active", command.meta.createdAt) }, "fixture_processing_started", []);
    case "complete_fixture_processing":
      return commit(state, command, {
        documents: command.result.documents,
        segments: trustedSegments(),
        selectedSegmentIds: command.result.selectedSegmentIds,
        coverage: command.result.coverage,
        processing: command.result.processing,
        caseRevision: state.caseRevision + 1,
      }, "fixture_processing_completed", command.result.documents.map((document) => document.id));
    case "fail_fixture_processing":
      return commit(state, command, {
        processing: upsertStage(state.processing, command.stageName, "failed", command.meta.createdAt, command.safeErrorCode),
      }, "fixture_processing_failed", [command.stageName], command.safeErrorCode);
    case "retry_fixture_processing_stage":
      return commit(state, command, {
        processing: upsertStage(state.processing, command.stageName, "active", command.meta.createdAt),
      }, "fixture_processing_retried", [command.stageName]);
    case "refresh_mask_suggestions":
      return commit(state, command, {
        masking: {
          ...state.masking,
          reviewStatus: "pending",
          reviewedBy: null,
          approvedAt: undefined,
          leakScanStatus: "not_run",
          failedClasses: [],
          suggestions: detectMaskSuggestions(state.segments, { sensitiveTerms: command.sensitiveTerms }),
        },
      }, "mask_suggestions_refreshed", ["masking"]);
    case "add_mask_suggestion": {
      const result = addMaskSuggestion(state.masking, makeManualSuggestion(command.input));
      return materialMaskCommit(state, command, result.review, "mask_suggestion_added", [command.input.segmentId]);
    }
    case "remove_mask_suggestion": {
      const result = removeMaskSuggestion(state.masking, command.maskId);
      return materialMaskCommit(state, command, result.review, "mask_suggestion_removed", [command.maskId]);
    }
    case "review_mask": {
      const result = reviewMask(state.masking, command.maskId, command.reviewStatus, command.replacementToken);
      return materialMaskCommit(state, command, result.review, "mask_decision_recorded", [command.maskId]);
    }
    case "complete_mask_review": {
      const approval = approveMaskingReview(state.masking, state.segments, command.meta.createdAt);
      if (!approval.ok) throw new Error("mask_review_incomplete");
      const serialized = state.segments.map((segment) => segment.redactedText).join("\n");
      const masking = applyLeakScanResult(approval.review, scanProviderPayload(serialized));
      return commit(state, command, {
        masking: { ...masking, leakScanStatus: "passed", failedClasses: [] },
        caseRevision: state.caseRevision + 1,
        exportGate: null,
        currentExportId: null,
        currentExportManifest: null,
        exportedRevision: null,
      }, "mask_review_completed", ["masking"]);
    }
    case "start_live_analysis": {
      if (state.pendingLiveAnalysis) throw new Error("live_analysis_pending");
      if (!state.purposeBrief || state.purposeBrief.status !== "complete") throw new Error("purpose_incomplete");
      if (!validateTransmissionReadiness(state.masking, state.segments).ok) throw new Error("mask_review_incomplete");
      const recovery = deriveLiveRecovery(state, command.recoveryOfRunId, command.request.providerSelection.releaseConfigurationId);
      const next = stamp({
        ...state,
        pendingLiveAnalysis: {
          startCommandId: command.meta.commandId,
          sourceCaseRevision: state.caseRevision,
          request: command.request,
          recovery,
          requestedAt: command.meta.createdAt,
        },
        processing: upsertStage(state.processing, "candidate_extraction", "active", command.meta.createdAt),
      }, command.meta.createdAt);
      const auditEvent = audit(state, command, "analysis_started", [], {
        providerId: command.request.providerSelection.providerId,
        releaseConfigurationId: command.request.providerSelection.releaseConfigurationId,
        recoveryOfRunId: command.recoveryOfRunId ?? undefined,
      });
      return { ok: true, state: withDerivedStatus({ ...next, audit: [...state.audit, auditEvent] }), auditEvent, networkAuthorized: true };
    }
    case "complete_live_analysis":
      return finishLive(state, command, "succeeded");
    case "fail_live_analysis":
      return finishLive(state, command, "failed");
    case "reject_live_analysis_preflight":
      return noRunAttempt(state, command, "preflight_rejection");
    case "record_live_analysis_transport_failure":
      return noRunAttempt(state, command, "transport_failure");
    case "run_deterministic_replay": {
      const resolved = resolveTrustedReplayBundle(command.request);
      if (!resolved.ok) throw new Error(resolved.reason);
      const recovery = deriveReplayRecovery(state, command.request.recoveryOfRunId);
      const run = {
        ...resolved.bundle.replayRun,
        id: `RUN-REPLAY-${state.analysisRuns.length + 1}`,
        recovery,
        inputState: createReplayInputState(state.caseRevision, state.purposeBrief, state.masking),
      } satisfies AnalysisRun;
      return activateRun(state, command, run, rewriteRunIds(resolved.bundle.candidates, run.id), rewriteCitationRunIds(resolved.bundle.citations, run.id), "analysis_completed");
    }
    case "load_demo_checkpoint": {
      const resolved = resolveTrustedCheckpointBundle(command.checkpointBundleId);
      if (!resolved.ok) throw new Error(resolved.reason);
      const run = {
        ...resolved.bundle.replayRun,
        id: `RUN-CHECKPOINT-${state.analysisRuns.length + 1}`,
        inputState: createReplayInputState(state.caseRevision, resolved.bundle.purposeBrief, resolved.bundle.masking),
      } satisfies AnalysisRun;
      const next = {
        ...state,
        purposeBrief: resolved.bundle.purposeBrief,
        documents: resolved.bundle.documents,
        segments: resolved.bundle.segments,
        selectedSegmentIds: resolved.bundle.selectedSegmentIds,
        masking: resolved.bundle.masking,
        coverage: resolved.bundle.coverage,
        coverageReviews: [],
        processing: resolved.bundle.processing,
        reviews: resolved.bundle.seededDecisions.map((decision) => ({ ...decision, analysisRunId: run.id })),
        caseRevision: state.caseRevision + 1,
      };
      return activateRun(next, command, run, rewriteRunIds(resolved.bundle.candidates, run.id), rewriteCitationRunIds(resolved.bundle.citations, run.id), "analysis_completed");
    }
    case "review_candidate": {
      const active = requireActiveSucceededRun(state);
      const result = reviewCandidate(state.candidates, command.intent, state.reviews, { analysisRunId: active.id, now: command.meta.createdAt });
      return commit(staleExport(state), command, {
        candidates: result.candidates,
        reviews: [...state.reviews, result.decision],
        caseRevision: state.caseRevision + 1,
      }, "candidate_reviewed", [command.intent.candidateId]);
    }
    case "respond_context_gap":
      return commit(staleExport(state), command, {
        candidates: respondContextGap(state.candidates, command.intent),
        caseRevision: state.caseRevision + 1,
      }, "context_gap_responded", [command.intent.gapId]);
    case "withdraw_candidate": {
      requireActiveSucceededRun(state);
      const result = withdrawCandidate(state.candidates, command.candidateId, command.reason, state.reviews, { now: command.meta.createdAt });
      return commit(staleExport(state), command, {
        candidates: result.candidates,
        reviews: [...state.reviews, result.decision],
        dependencyChanges: [...state.dependencyChanges, { ...result.dependencyChange, commandId: command.meta.commandId }],
        caseRevision: state.caseRevision + 1,
      }, "evidence_withdrawn", [command.candidateId]);
    }
    case "review_coverage_issue": {
      const issue = state.coverage.issues.find((item) => item.id === command.intent.issueId);
      if (!issue) throw new Error("coverage_issue_not_found");
      const decision: CoverageReviewDecision = {
        id: `COVERAGE-REVIEW-${state.coverageReviews.length + 1}`,
        issueId: issue.id,
        originalConsequence: issue.activeConsequence,
        reviewedConsequence: command.intent.reviewedConsequence,
        limitationText: command.intent.limitationText,
        reason: command.intent.reason,
        actor: "current_practitioner",
        createdAt: command.meta.createdAt,
      };
      const issues = state.coverage.issues.map((item) =>
        item.id === issue.id
          ? {
              ...item,
              activeConsequence: command.intent.reviewedConsequence,
              resolutionStatus: "reviewed_limitation" as const,
              coverageReviewDecisionId: decision.id,
            }
          : item,
      );
      return commit(staleExport(state), command, {
        coverage: { ...state.coverage, issues, hasConsequentialOpenIssue: issues.some((item) => item.resolutionStatus === "open" && item.activeConsequence !== "non_consequential") },
        coverageReviews: [...state.coverageReviews, decision],
        caseRevision: state.caseRevision + 1,
      }, "coverage_issue_reviewed", [issue.id]);
    }
    case "resolve_citation": {
      const active = requireActiveSucceededRun(state);
      const index = state.citations.findIndex((citation) => citation.id === command.citationId && citation.analysisRunId === active.id);
      if (index < 0) throw new Error("citation_not_found");
      const citation = state.citations[index];
      const candidate = state.candidates.find((item) => item.id === command.candidateId && item.analysisRunId === active.id);
      const segment = state.segments.find((item) => item.id === command.selectedSegmentId);
      if (!candidate || !segment) throw new Error("citation_owner_mismatch");
      if (command.selectedRedactedSegmentRange.end > segment.redactedText.length) throw new Error("manual_range_invalid");
      const citations = [...state.citations];
      citations[index] = {
        ...citation,
        segmentId: segment.id,
        documentId: segment.documentId,
        pageNumber: segment.pageNumber,
        quotedText: segment.redactedText.slice(command.selectedRedactedSegmentRange.start, command.selectedRedactedSegmentRange.end),
        normalizedQuotedText: segment.redactedText.slice(command.selectedRedactedSegmentRange.start, command.selectedRedactedSegmentRange.end).toLowerCase().replace(/\s+/g, " ").trim(),
        validationStatus: "manually_resolved",
        redactedSegmentRange: command.selectedRedactedSegmentRange,
        sourceSegmentRange: command.selectedRedactedSegmentRange,
        boundingBoxes: segment.boundingBoxes,
        resolutionMethod: "manual_segment_selection",
        resolvedBy: "practitioner",
        validatedAt: command.meta.createdAt,
      };
      return commit(staleExport(state), command, {
        citations,
        citationResolutions: [...state.citationResolutions, {
          id: `CITATION-RESOLUTION-${state.citationResolutions.length + 1}`,
          caseId: state.caseId,
          analysisRunId: active.id,
          candidateId: candidate.id,
          citationId: citation.id,
          previousValidationStatus: "ambiguous_match",
          selectedSegmentId: segment.id,
          selectedRedactedSegmentRange: command.selectedRedactedSegmentRange,
          resultingValidationStatus: "manually_resolved",
          resolutionMethod: "manual_segment_selection",
          actor: "current_practitioner",
          createdAt: command.meta.createdAt,
        }],
        caseRevision: state.caseRevision + 1,
      }, "citation_manually_resolved", [citation.id]);
    }
    case "evaluate_export_gate": {
      const normalized = normalizeExportSelection(command.selection);
      const digest = exportSelectionDigest(normalized);
      const unchanged = state.exportGate?.exportSelectionDigest === digest && state.exportGate.caseRevision === state.caseRevision;
      const base = unchanged ? state : { ...state, currentExportId: null, currentExportManifest: null, exportedRevision: null };
      const gate = evaluateExportGateCore(base, normalized, {
        now: command.meta.createdAt,
        previousGate: state.currentExportManifest?.gate ?? state.exportGate,
        guidanceCards: bundledGuidancePack.cards as GuidanceCard[],
      });
      const revisionBump = state.exportGate && !unchanged ? 1 : 0;
      return commit(base, command, {
        exportGate: gate,
        caseRevision: base.caseRevision + revisionBump,
      }, gate.status === "ready" ? "export_gate_evaluated" : "export_blocked", [gate.id], gate.status === "blocked" ? gate.blockers[0]?.code : undefined, false);
    }
    case "create_export": {
      const normalized = normalizeExportSelection(command.selection);
      if (!state.exportGate || state.exportGate.status !== "ready" || state.exportGate.exportSelectionDigest !== exportSelectionDigest(normalized)) {
        throw new Error("export_gate_not_ready");
      }
      const manifest = createExportManifest(state, normalized, {
        now: command.meta.createdAt,
        previousGate: state.exportGate,
        guidanceCards: bundledGuidancePack.cards as GuidanceCard[],
      });
      const record: ExportRecord = {
        id: `EXPORT-${state.exports.length + 1}`,
        caseRevision: state.exportGate.caseRevision,
        exportManifestId: manifest.id,
        kind: normalized.kind,
        formats: ["pdf", "json"],
        createdAt: command.meta.createdAt,
      };
      return commit(state, command, {
        exports: [...state.exports, record],
        currentExportId: record.id,
        currentExportManifest: manifest,
        exportedRevision: state.exportGate.caseRevision,
      }, "export_created", [record.id], undefined, false);
    }
    case "reveal_source":
      return commit(state, command, {}, "source_revealed", [command.citationId], command.reasonCode, false);
    case "report_unsafe_output":
      return commit(state, command, {}, "unsafe_output_reported", command.entityIds, command.reasonCode, false);
    case "reset_case":
      return commit(createInitialCaseState(command.meta.createdAt), command, {}, "case_reset", [], undefined, false);
  }
}

function commit(
  state: CaseState,
  command: CaseCommand,
  patch: Partial<CaseState>,
  eventType: AuditEvent["eventType"],
  entityIds: string[],
  reasonCode?: string,
  appendAudit = true,
  auditExtra: Partial<AuditEvent> = {},
): CaseCommandResult {
  const auditEvent = appendAudit ? audit(state, command, eventType, entityIds, { reasonCode, ...auditExtra }) : undefined;
  const next = withDerivedStatus(stamp({
    ...state,
    ...patch,
    audit: auditEvent ? [...state.audit, auditEvent] : state.audit,
  }, command.meta.createdAt));
  return { ok: true, state: next, auditEvent };
}

function materialMaskCommit(state: CaseState, command: CaseCommand, masking: CaseState["masking"], eventType: AuditEvent["eventType"], entityIds: string[]) {
  return commit(staleExport(state), command, {
    masking,
    caseRevision: state.caseRevision + 1,
  }, eventType, entityIds);
}

function finishLive(state: CaseState, command: Extract<CaseCommand, { type: "complete_live_analysis" | "fail_live_analysis" }>, expected: "succeeded" | "failed") {
  const pending = state.pendingLiveAnalysis;
  if (!pending || pending.startCommandId !== command.startCommandId || pending.sourceCaseRevision !== state.caseRevision) throw new Error("pending_live_mismatch");
  const response = command.response as TerminalAnalyzeResponse;
  if (response.outcome !== (expected === "succeeded" ? "succeeded" : "failed")) throw new Error("terminal_response_mismatch");
  const run = {
    ...response.run,
    recovery: pending.recovery,
    inputState: createReplayInputState(pending.sourceCaseRevision, state.purposeBrief, state.masking),
  } satisfies AnalysisRun;
  return activateRun(
    { ...state, pendingLiveAnalysis: null },
    command,
    run,
    expected === "succeeded" ? response.candidates : [],
    expected === "succeeded" ? response.citations : [],
    expected === "succeeded" ? "analysis_completed" : "analysis_failed",
  );
}

function noRunAttempt(
  state: CaseState,
  command: Extract<CaseCommand, { type: "reject_live_analysis_preflight" | "record_live_analysis_transport_failure" }>,
  kind: "preflight_rejection" | "transport_failure",
): CaseCommandResult {
  const pending = state.pendingLiveAnalysis;
  if (!pending || pending.startCommandId !== command.startCommandId) throw new Error("pending_live_mismatch");
  const eventType = kind === "preflight_rejection" ? "analysis_preflight_rejected" : "analysis_transport_failed";
  const reasonCode = command.type === "reject_live_analysis_preflight"
    ? (command.response as TerminalAnalyzeResponse).error?.code
    : command.reasonCode;
  return commit({
    ...state,
    pendingLiveAnalysis: null,
    processing: state.processing.filter((stage) => stage.name !== "candidate_extraction"),
  }, command, {}, eventType, [command.startCommandId], reasonCode, true, {
    startCommandId: command.startCommandId,
    providerId: pending.request.providerSelection.providerId,
    releaseConfigurationId: pending.request.providerSelection.releaseConfigurationId,
  });
}

function activateRun(
  state: CaseState,
  command: CaseCommand,
  run: AnalysisRun,
  candidates: CaseState["candidates"],
  citations: CaseState["citations"],
  eventType: AuditEvent["eventType"],
): CaseCommandResult {
  const success = run.status === "succeeded";
  return commit(staleExport(state), command, {
    analysisRuns: [...state.analysisRuns, run],
    activeAnalysisRunId: run.id,
    candidates: success ? candidates : [],
    citations: success ? citations : [],
    reviews: [],
    citationResolutions: [],
    dependencyChanges: [],
    pendingLiveAnalysis: null,
    processing: success
      ? completeAnalysisProcessing(command.meta.createdAt)
      : upsertStage(state.processing, "candidate_extraction", "failed", command.meta.createdAt, "INTERNAL_SAFE_FAILURE"),
    caseRevision: state.caseRevision + 1,
  }, eventType, [run.id]);
}

function audit(
  state: CaseState,
  command: CaseCommand,
  eventType: AuditEvent["eventType"],
  entityIds: string[],
  extra: Partial<AuditEvent> = {},
): AuditEvent {
  return {
    id: `AUDIT-${String(state.audit.length + 1).padStart(4, "0")}`,
    caseId: state.caseId,
    eventType,
    sequence: state.audit.length + 1,
    actor: eventType === "analysis_completed" && command.type === "load_demo_checkpoint" ? "fixture_reviewer" : "practitioner",
    actorRole: "demo_evaluator",
    entityIds,
    summary: safeSummary(eventType, entityIds, extra.reasonCode),
    createdAt: command.meta.createdAt,
    commandId: command.meta.commandId,
    idempotencyKey: command.meta.idempotencyKey,
    ...extra,
  } as AuditEvent;
}

function safeSummary(eventType: AuditEvent["eventType"], entityIds: string[], reasonCode?: string) {
  return [eventType, entityIds.join(","), reasonCode].filter(Boolean).join(" ");
}

function stamp(state: CaseState, now: string): CaseState {
  return { ...state, lastUpdatedAt: now };
}

function withDerivedStatus(state: CaseState): CaseState {
  return { ...state, caseStatus: deriveCaseStatus(state) };
}

function staleExport(state: CaseState): CaseState {
  return { ...state, exportGate: null, currentExportId: null, currentExportManifest: null, exportedRevision: null };
}

function isPendingTerminal(type: CaseCommand["type"]) {
  return [
    "complete_live_analysis",
    "fail_live_analysis",
    "reject_live_analysis_preflight",
    "record_live_analysis_transport_failure",
  ].includes(type);
}

function fixtureProcessing(status: ProcessingStage["status"], now: string): ProcessingStage[] {
  return ["intake_validation", "text_extraction", "coverage_calculation", "identifier_masking"].map((name) => ({
    name: name as ProcessingStage["name"],
    status,
    startedAt: now,
    completedAt: status === "completed" ? now : undefined,
    affectedDocumentIds: cfnDemoFixture.documents.map((document) => document.id),
    retryable: status === "failed",
  }));
}

function completeAnalysisProcessing(now: string): ProcessingStage[] {
  return [
    ...fixtureProcessing("completed", now),
    ...(["candidate_extraction", "citation_validation", "timeline_nexus_assembly"] as ProcessingStage["name"][]).map((name) => ({
      name,
      status: "completed" as const,
      startedAt: now,
      completedAt: now,
      affectedDocumentIds: cfnDemoFixture.documents.map((document) => document.id),
      retryable: false,
    })),
  ];
}

function upsertStage(
  stages: ProcessingStage[],
  name: ProcessingStage["name"],
  status: ProcessingStage["status"],
  now: string,
  errorCode?: ProcessingStage["errorCode"],
) {
  const next = stages.filter((stage) => stage.name !== name);
  next.push({
    name,
    status,
    startedAt: now,
    completedAt: status === "completed" ? now : undefined,
    errorCode,
    affectedDocumentIds: cfnDemoFixture.documents.map((document) => document.id),
    retryable: status === "failed",
  });
  return next;
}

function requireActiveSucceededRun(state: CaseState) {
  const run = state.analysisRuns.find((item) => item.id === state.activeAnalysisRunId);
  if (!run || run.status !== "succeeded") throw new Error("active_successful_run_required");
  return run;
}

function deriveLiveRecovery(
  state: CaseState,
  recoveryOfRunId: string | null,
  releaseConfigurationId: string,
): AnalysisRecoveryMetadata {
  if (!recoveryOfRunId) {
    return { recoveryOfRunId: null, selectionReason: "initial_choice", selectedBy: "practitioner", automaticFailover: false, outputsMerged: false };
  }
  const failed = state.analysisRuns.find((run) => run.id === recoveryOfRunId && run.status === "failed");
  if (!failed) throw new Error("invalid_recovery_link");
  const sameRelease = failed.provider.releaseConfigurationId === releaseConfigurationId;
  return {
    recoveryOfRunId,
    selectionReason: sameRelease ? "retry_same_provider" : "explicit_provider_switch",
    selectedBy: "practitioner",
    automaticFailover: false,
    outputsMerged: false,
  };
}

function deriveReplayRecovery(state: CaseState, recoveryOfRunId: string | null): AnalysisRecoveryMetadata {
  if (recoveryOfRunId && !state.analysisRuns.some((run) => run.id === recoveryOfRunId && run.status === "failed")) {
    throw new Error("invalid_replay_recovery_link");
  }
  return {
    recoveryOfRunId,
    selectionReason: "explicit_deterministic_replay",
    selectedBy: "practitioner",
    automaticFailover: false,
    outputsMerged: false,
  };
}

function rewriteRunIds<T extends { analysisRunId: string }>(items: T[], analysisRunId: string): T[] {
  return items.map((item) => ({ ...item, analysisRunId }));
}

function rewriteCitationRunIds<T extends { analysisRunId: string }>(items: T[], analysisRunId: string): T[] {
  return items.map((item) => ({ ...item, analysisRunId }));
}

export function projectNonRunAttempts(state: CaseState): NonRunAnalysisAttempt[] {
  const attempts: NonRunAnalysisAttempt[] = [];
  for (const event of state.audit) {
    if (!event.startCommandId) continue;
    if (event.eventType !== "analysis_preflight_rejected" && event.eventType !== "analysis_transport_failed") continue;
    const pendingProvider = {
      providerId: event.providerId === "google_gemini" ? "google_gemini" as const : event.providerId === "mistral" ? "mistral" as const : "openai" as const,
      releaseConfigurationId:
        event.releaseConfigurationId === "gemini-quality-v1"
          ? "gemini-quality-v1" as const
          : event.releaseConfigurationId === "mistral-small-free-v1"
            ? "mistral-small-free-v1" as const
            : "openai-quality-v1" as const,
      serviceTier: event.providerId === "openai" ? "paid" as const : "unpaid" as const,
    };
    if (event.eventType === "analysis_preflight_rejected") {
      attempts.push({
        id: `ATTEMPT-${event.id}`,
        caseId: "CFN-DEMO-001" as const,
        startCommandId: event.startCommandId,
        auditEventId: event.id,
        providerSelection: pendingProvider,
        outputAccepted: false as const,
        occurredAt: event.createdAt,
        kind: "preflight_rejection" as const,
        transmissionStatus: "not_transmitted" as const,
        remoteExecutionStatus: "not_started" as const,
        safeErrorCode: (event.reasonCode ?? "INVALID_REQUEST") as NonRunAnalysisAttempt["safeErrorCode"],
        reasonCode: (event.reasonCode ?? "INVALID_REQUEST") as NonRunAnalysisAttempt["reasonCode"],
      } as Extract<NonRunAnalysisAttempt, { kind: "preflight_rejection" }>);
      continue;
    }
    attempts.push({
      id: `ATTEMPT-${event.id}`,
      caseId: "CFN-DEMO-001" as const,
      startCommandId: event.startCommandId,
      auditEventId: event.id,
      providerSelection: pendingProvider,
      outputAccepted: false as const,
      occurredAt: event.createdAt,
      kind: "transport_failure" as const,
      transmissionStatus: "unknown" as const,
      remoteExecutionStatus: "unknown" as const,
      safeErrorCode: "CLIENT_TRANSPORT_FAILURE" as const,
      reasonCode: (event.reasonCode ?? "network_unavailable") as Extract<NonRunAnalysisAttempt, { kind: "transport_failure" }>["reasonCode"],
    } as Extract<NonRunAnalysisAttempt, { kind: "transport_failure" }>);
  }
  return attempts;
}

export function toPersistedCaseState(state: CaseState, now = isoNow()): PersistedCaseState {
  const {
    caseStatus: _caseStatus,
    segments: _segments,
    pendingLiveAnalysis: _pendingLiveAnalysis,
    ...safeState
  } = state;
  const persisted = {
    ...safeState,
    storageKey: CASE_STATE_STORAGE_KEY,
    persistedAt: now,
    canonicalFixtureDigest: cfnDemoFixture.canonicalFixtureDigest,
  } satisfies PersistedCaseState;
  return persisted as PersistedCaseState;
}

export function serializeCaseState(state: CaseState, now = isoNow()): string {
  const value = JSON.stringify(toPersistedCaseState(state, now));
  if (new TextEncoder().encode(value).length > MAX_PERSISTED_BYTES) throw new Error("persisted_payload_too_large");
  return value;
}

export function restoreCaseState(serialized: string): RestoreResult {
  if (new TextEncoder().encode(serialized).length > MAX_PERSISTED_BYTES) {
    return { ok: false, reason: "persisted_payload_too_large", resetState: createInitialCaseState() };
  }
  try {
    const parsed = JSON.parse(serialized) as PersistedCaseState;
    if (parsed.storageKey !== CASE_STATE_STORAGE_KEY || parsed.caseId !== "CFN-DEMO-001" || parsed.fixtureVersion !== VERSION || parsed.schemaVersion !== VERSION) {
      return { ok: false, reason: "persisted_fixture_mismatch", resetState: createInitialCaseState() };
    }
    const replacedGuidanceIdentity =
      parsed.guidancePack.version !== bundledGuidancePack.identity.version ||
      parsed.guidancePack.digest !== bundledGuidancePack.identity.digest;
    const state = withDerivedStatus({
      ...parsed,
      caseStatus: "draft",
      segments: trustedSegments(),
      pendingLiveAnalysis: null,
      guidancePack: bundledGuidancePack.identity,
      caseRevision: parsed.caseRevision + (replacedGuidanceIdentity ? 1 : 0),
      exportGate: replacedGuidanceIdentity ? null : parsed.exportGate,
      currentExportId: replacedGuidanceIdentity ? null : parsed.currentExportId,
      currentExportManifest: replacedGuidanceIdentity ? null : parsed.currentExportManifest,
      exportedRevision: replacedGuidanceIdentity ? null : parsed.exportedRevision,
    } as CaseState);
    return { ok: true, state, replacedGuidanceIdentity };
  } catch {
    return { ok: false, reason: "persisted_json_invalid", resetState: createInitialCaseState() };
  }
}

export function saveCaseState(store: SessionStoreLike, state: CaseState, now = isoNow()): boolean {
  if (state.pendingLiveAnalysis) return false;
  store.setItem(CASE_STATE_STORAGE_KEY, serializeCaseState(state, now));
  return true;
}

export function loadCaseState(store: SessionStoreLike): RestoreResult {
  const value = store.getItem(CASE_STATE_STORAGE_KEY);
  if (!value) return { ok: true, state: createInitialCaseState(), replacedGuidanceIdentity: false };
  return restoreCaseState(value);
}

export function resetCase(store?: SessionStoreLike, cleanup: CleanupRegistry = {}, now = isoNow()): CaseState {
  store?.removeItem(CASE_STATE_STORAGE_KEY);
  for (const fn of [...(cleanup.objectUrls ?? []), ...(cleanup.pdfWorkers ?? []), ...(cleanup.documentCaches ?? [])]) {
    fn();
  }
  return createInitialCaseState(now);
}

function isoNow() {
  return new Date().toISOString();
}
