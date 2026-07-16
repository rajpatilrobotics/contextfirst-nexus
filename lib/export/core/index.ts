import { createHash } from "node:crypto";
import {
  ExportGateSchema,
  ExportManifestSchema,
  type AnalysisRun,
  type AuditEvent,
  type CaseCandidate,
  type CaseState,
  type Citation,
  type CoverageReviewDecision,
  type ExportGate,
  type ExportManifest,
  type ExportSelection,
  type GuidanceCard,
  type ReviewDecision,
} from "../../contracts";

const MANIFEST_SCHEMA_VERSION = "1.0.0" as const;
const REVIEWED_HASH_PROJECTION_VERSION = "1.0.0" as const;
const DEFAULT_NOW = "2026-07-16T00:00:00.000Z";
const LABELS = [
  "AI-assisted, human-reviewed case-preparation draft.",
  "Synthetic case.",
  "Not legal advice.",
  "Local legal verification required.",
] as const;

type BlockedExportGate = Extract<ExportGate, { status: "blocked" }>;
type ExportBlocker = BlockedExportGate["blockers"][number];
type ExportBlockerCode = ExportBlocker["code"];
type ResolvedCitation = Extract<Citation, { validationStatus: "exact_match" | "manually_resolved" }>;

export type ExportCoreOptions = {
  now?: string;
  previousGate?: ExportGate | null;
  guidanceCards?: GuidanceCard[];
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256Hex(value: unknown): string {
  return createHash("sha256").update(typeof value === "string" ? value : canonicalJson(value)).digest("hex");
}

export function normalizeExportSelection(selection: ExportSelection): ExportSelection {
  if (selection.kind === "full_practitioner_handoff") return selection;
  const uniqueSorted = (values: string[]) => [...new Set(values)].sort();
  return {
    kind: "minimum_necessary_safe_share",
    minimumNecessarySelection: {
      confirmed: selection.minimumNecessarySelection.confirmed,
      intendedRecipientCategory: selection.minimumNecessarySelection.intendedRecipientCategory,
      selectedCandidateIds: uniqueSorted(selection.minimumNecessarySelection.selectedCandidateIds),
      excludedCandidateIds: uniqueSorted(selection.minimumNecessarySelection.excludedCandidateIds),
    },
  };
}

export function exportSelectionDigest(selection: ExportSelection): string {
  return sha256Hex(normalizeExportSelection(selection));
}

function blocker(code: ExportBlockerCode, entityIds: string[], message: string, remediation: string): ExportBlocker {
  return {
    id: `EXPORT-BLOCKER-${code}`,
    code,
    severity: "blocking",
    entityIds: [...new Set(entityIds)].sort(),
    message,
    remediation,
  };
}

function activeCandidates(state: CaseState) {
  return state.candidates.filter((candidate) => candidate.inclusionStatus === "active");
}

function activeReviewedCandidates(state: CaseState) {
  return activeCandidates(state).filter(
    (candidate) =>
      candidate.kind !== "context_gap" &&
      (candidate.reviewStatus === "human_accepted" || candidate.reviewStatus === "human_edited"),
  );
}

function latestSuccessfulActiveRun(state: CaseState): AnalysisRun | null {
  const activeRuns = state.analysisRuns.filter((run) => run.id === state.activeAnalysisRunId);
  if (activeRuns.length !== 1) return null;
  const [run] = activeRuns;
  return run.status === "succeeded" ? run : null;
}

function sameStringSet(left: string[], right: string[]) {
  return left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

function currentRunInputMatchesState(state: CaseState, run: AnalysisRun, normalizedSelection: ExportSelection) {
  if (!state.purposeBrief) return false;
  return (
    run.inputState.sourceCaseRevision === state.caseRevision &&
    run.inputState.purposeBriefId === state.purposeBrief.id &&
    run.inputState.purposeBriefRevision === state.purposeBrief.revision &&
    run.inputState.maskingRevision === state.masking.revision &&
    sameStringSet(run.inputState.selectedSegmentIds, state.selectedSegmentIds) &&
    run.rulesetVersion === state.guidancePack.version &&
    exportSelectionDigest(normalizedSelection) === exportSelectionDigest(normalizedSelection)
  );
}

function candidateById(state: CaseState) {
  return new Map(state.candidates.map((candidate) => [candidate.id, candidate]));
}

function citationById(state: CaseState) {
  return new Map(state.citations.map((citation) => [citation.id, citation]));
}

function dependencyUnresolvedIds(state: CaseState) {
  const byId = candidateById(state);
  return activeCandidates(state)
    .filter((candidate) =>
      candidate.reviewStatus === "invalidated" ||
      candidate.dependencies.some((dependency) => {
        if (!dependency.active || dependency.kind === "source") return false;
        const targetId = dependency.kind === "candidate" ? dependency.candidateId : dependency.nexusCandidateId;
        const target = byId.get(targetId);
        return !target || target.inclusionStatus !== "active" || target.reviewStatus === "invalidated";
      }),
    )
    .map((candidate) => candidate.id);
}

function unresolvedCitationIds(state: CaseState) {
  const citations = citationById(state);
  const ids = new Set<string>();
  for (const candidate of activeReviewedCandidates(state)) {
    for (const dependency of candidate.dependencies) {
      if (!dependency.active || dependency.kind !== "source") continue;
      const citation = citations.get(dependency.citationId);
      if (!citation || (citation.validationStatus !== "exact_match" && citation.validationStatus !== "manually_resolved")) {
        ids.add(dependency.citationId);
      }
    }
  }
  return [...ids].sort();
}

function outsidePurposeIds(state: CaseState, selection: ExportSelection) {
  if (!state.purposeBrief) return ["purpose"];
  const ids: string[] = [];
  if (selection.kind !== state.purposeBrief.requestedExport) ids.push(state.purposeBrief.id);
  if (
    selection.kind === "minimum_necessary_safe_share" &&
    selection.minimumNecessarySelection.intendedRecipientCategory !== state.purposeBrief.intendedRecipientCategory
  ) {
    ids.push(state.purposeBrief.id);
  }
  return ids;
}

function selectedCandidatesForManifest(state: CaseState, selection: ExportSelection) {
  const reviewed = activeReviewedCandidates(state);
  if (selection.kind === "full_practitioner_handoff") return reviewed;
  const selected = new Set(selection.minimumNecessarySelection.selectedCandidateIds);
  const excluded = new Set(selection.minimumNecessarySelection.excludedCandidateIds);
  return reviewed.filter((candidate) => selected.has(candidate.id) && !excluded.has(candidate.id));
}

function minimumNecessityIssues(state: CaseState, selection: ExportSelection) {
  if (selection.kind === "full_practitioner_handoff") return [];
  const issues: string[] = [];
  const minimum = selection.minimumNecessarySelection;
  if (!minimum.confirmed) issues.push("minimum_necessity_confirmation");
  const eligible = new Set(
    activeReviewedCandidates(state)
      .filter((candidate) => candidate.safeShareRecipientCategories.includes(minimum.intendedRecipientCategory))
      .map((candidate) => candidate.id),
  );
  for (const id of minimum.selectedCandidateIds) {
    if (!eligible.has(id)) issues.push(id);
  }
  return [...new Set(issues)].sort();
}

function guidanceIssues(cards: GuidanceCard[]) {
  return cards
    .filter((card) => card.verificationStatus !== "current_for_scope" || !card.localLegalVerificationRequired)
    .map((card) => card.id);
}

function buildBlockers(state: CaseState, selection: ExportSelection, options: ExportCoreOptions = {}) {
  const normalizedSelection = normalizeExportSelection(selection);
  const blockers: ExportBlocker[] = [];
  const purpose = state.purposeBrief;
  const activeRun = latestSuccessfulActiveRun(state);
  const guidanceCards = options.guidanceCards ?? [];

  if (!purpose || purpose.status !== "complete") {
    blockers.push(blocker("PURPOSE_INCOMPLETE", purpose ? [purpose.id] : ["purpose"], "Purpose brief is not complete.", "Complete the Purpose brief before export."));
  }
  if (!purpose || purpose.authority.status !== "active" || !purpose.authorityAttested || !purpose.authority.syntheticOrHarmlessDataAttested) {
    blockers.push(blocker("AUTHORITY_INVALID", purpose ? [purpose.id] : ["authority"], "Purpose authority is not valid for export.", "Restore active synthetic fixture authority."));
  }
  const prohibitedOrigins = state.documents.filter((document) => document.dataOrigin !== "bundled_synthetic" || !document.syntheticLabelPresent).map((document) => document.id);
  if (prohibitedOrigins.length > 0) {
    blockers.push(blocker("DATA_ORIGIN_PROHIBITED", prohibitedOrigins, "Only bundled synthetic data may be exported.", "Remove prohibited-origin documents."));
  }
  const incompleteReviews = activeCandidates(state)
    .filter((candidate) => candidate.reviewRequirement === "individual" && !["human_accepted", "human_edited", "rejected"].includes(candidate.reviewStatus))
    .map((candidate) => candidate.id);
  if (incompleteReviews.length > 0) {
    blockers.push(blocker("REVIEW_INCOMPLETE", incompleteReviews, "Individual candidate review is incomplete.", "Finish each required human review."));
  }
  const citations = unresolvedCitationIds(state);
  if (citations.length > 0) {
    blockers.push(blocker("CITATION_UNRESOLVED", citations, "One or more included source citations are unresolved.", "Resolve exact or manual citations before export."));
  }
  const coverageIssues = state.coverage.issues
    .filter((issue) => issue.resolutionStatus === "open" && (issue.activeConsequence === "consequential" || issue.activeConsequence === "unknown"))
    .map((issue) => issue.id);
  if (state.coverage.hasConsequentialOpenIssue || coverageIssues.length > 0) {
    blockers.push(blocker("COVERAGE_CONSEQUENTIAL", coverageIssues.length ? coverageIssues : ["coverage"], "Consequential coverage gaps remain open.", "Review coverage gaps as limitations or resolve them."));
  }
  const jurisdictionIssues = guidanceIssues(guidanceCards);
  if (purpose?.jurisdictionCode === "unspecified" || jurisdictionIssues.length > 0) {
    blockers.push(blocker("JURISDICTION_UNVERIFIED", jurisdictionIssues.length ? jurisdictionIssues : [purpose?.id ?? "jurisdiction"], "Jurisdictional legal verification is not current.", "Verify jurisdiction scope before export."));
  }
  const dependencies = dependencyUnresolvedIds(state);
  if (dependencies.length > 0) {
    blockers.push(blocker("DEPENDENCY_UNRESOLVED", dependencies, "A reviewed candidate depends on withdrawn or invalidated material.", "Renew review after dependency changes."));
  }
  if (state.masking.reviewStatus !== "approved") {
    blockers.push(blocker("MASK_REVIEW_INCOMPLETE", ["masking"], "Masking review is not approved.", "Approve masking review before export."));
  }
  if (state.masking.leakScanStatus !== "passed" || state.masking.failedClasses.length > 0) {
    blockers.push(blocker("PII_CHECK_FAILED", state.masking.failedClasses.length ? state.masking.failedClasses : ["pii_scan"], "PII leak scan has not passed.", "Run and pass the PII leak scan."));
  }
  const failedProcessing = state.processing.filter((stage) => stage.status !== "completed").map((stage) => stage.name);
  if (failedProcessing.length > 0 || state.documents.some((document) => document.processingStatus === "failed")) {
    blockers.push(blocker("PROCESSING_FAILED", failedProcessing.length ? failedProcessing : ["processing"], "Source processing is not complete.", "Complete source processing before export."));
  }
  if (
    state.analysisRuns.some((run) => {
      const failure = (run as { failure?: { classification?: string } }).failure;
      return run.status === "failed" && failure?.classification === "safety_validation_failed";
    })
  ) {
    blockers.push(blocker("SAFETY_VALIDATION_FAILED", ["analysis"], "A safety validation failure is present.", "Create a clean successful analysis run."));
  }
  if (!activeRun || !currentRunInputMatchesState(state, activeRun, normalizedSelection)) {
    blockers.push(blocker("ANALYSIS_RUN_STALE", [state.activeAnalysisRunId ?? "analysis"], "Active analysis run does not match the current reviewed state.", "Run analysis again for the current state."));
  }
  if (state.exportGate && state.exportGate.caseRevision !== state.caseRevision) {
    blockers.push(blocker("GATE_EVALUATION_STALE", [state.exportGate.id], "Stored export gate belongs to an older case revision.", "Evaluate the export gate again."));
  }
  const minimumIssues = minimumNecessityIssues(state, normalizedSelection);
  if (minimumIssues.length > 0) {
    blockers.push(blocker("MINIMUM_NECESSITY_UNCONFIRMED", minimumIssues, "Minimum necessary safe-share selection is not confirmed or eligible.", "Confirm and narrow safe-share selection."));
  }
  const purposeIssues = outsidePurposeIds(state, normalizedSelection);
  if (purposeIssues.length > 0) {
    blockers.push(blocker("OUTSIDE_STATED_PURPOSE", purposeIssues, "Export selection is outside the stated Purpose.", "Choose the Purpose-requested export kind and recipient category."));
  }
  return blockers.sort((left, right) => left.code.localeCompare(right.code));
}

export function evaluateExportGate(state: CaseState, selection: ExportSelection, options: ExportCoreOptions = {}): ExportGate {
  const normalizedSelection = normalizeExportSelection(selection);
  const activeRun = latestSuccessfulActiveRun(state);
  const blockers = buildBlockers(state, normalizedSelection, options);
  const reusableGate =
    options.previousGate?.status === "ready" &&
    options.previousGate.caseRevision === state.caseRevision &&
    options.previousGate.exportSelectionDigest === exportSelectionDigest(normalizedSelection)
      ? options.previousGate
      : null;
  if (reusableGate && blockers.length === 0) return reusableGate;

  const base = {
    id: `EXPORT-GATE-${sha256Hex({ caseRevision: state.caseRevision, selection: normalizedSelection }).slice(0, 12).toUpperCase()}`,
    caseRevision: state.caseRevision,
    analysisRunId: activeRun?.id ?? state.activeAnalysisRunId ?? "RUN-CFN-DEMO-001-UNKNOWN",
    purposeBriefRevision: state.purposeBrief?.revision ?? 0,
    maskingRevision: state.masking.revision,
    guidancePackVersion: state.guidancePack.version,
    guidancePackDigest: state.guidancePack.digest,
    rulesetVersion: activeRun?.rulesetVersion ?? state.guidancePack.version,
    exportSelection: normalizedSelection,
    exportSelectionDigest: exportSelectionDigest(normalizedSelection),
    evaluatedAt: options.now ?? DEFAULT_NOW,
    reviewedCandidateCount: activeCandidates(state).filter((candidate) => candidate.reviewRequirement === "individual").length,
    includedCandidateCount: selectedCandidatesForManifest(state, normalizedSelection).length,
  };

  return ExportGateSchema.parse(
    blockers.length === 0
      ? { ...base, status: "ready", freshness: "current", blockers: [] }
      : { ...base, status: "blocked", freshness: state.exportGate && state.exportGate.caseRevision !== state.caseRevision ? "stale" : "current", blockers },
  );
}

function projectDependencies(candidate: CaseCandidate) {
  return candidate.dependencies
    .filter((dependency) => dependency.active)
    .map((dependency) => {
      if (dependency.kind === "source") {
        return {
          dependencyId: dependency.id,
          kind: "source" as const,
          citationId: dependency.citationId,
          relationship: dependency.relationship,
          evidenceNature: dependency.evidenceNature,
        };
      }
      if (dependency.kind === "candidate") {
        return {
          dependencyId: dependency.id,
          kind: "candidate" as const,
          candidateId: dependency.candidateId,
          relationship: dependency.relationship,
        };
      }
      return {
        dependencyId: dependency.id,
        kind: "nexus" as const,
        nexusCandidateId: dependency.nexusCandidateId,
        relationship: dependency.relationship,
      };
    })
    .sort((left, right) => left.dependencyId.localeCompare(right.dependencyId));
}

function projectCandidate(candidate: CaseCandidate) {
  return {
    candidateId: candidate.id,
    analysisRunId: candidate.analysisRunId,
    kind: candidate.kind,
    assertionMode: candidate.assertionMode,
    effectiveReviewedText: candidate.currentText,
    originalSuggestion: candidate.proposedText,
    itemOrigin: candidate.itemOrigin,
    currentTextOrigin: candidate.currentTextOrigin,
    supportStatus: candidate.supportStatus,
    reviewStatus: candidate.reviewStatus,
    dependencies: projectDependencies(candidate),
    limitationTexts: candidate.assertionMode === "limitation" ? [candidate.currentText] : [],
    unknowns: [...candidate.unknowns].sort(),
  };
}

function isResolvedCitation(citation: Citation): citation is ResolvedCitation {
  return citation.validationStatus === "exact_match" || citation.validationStatus === "manually_resolved";
}

function projectCitation(citation: ResolvedCitation) {
  return {
    citationId: citation.id,
    analysisRunId: citation.analysisRunId,
    documentId: citation.documentId,
    pageNumber: citation.pageNumber,
    segmentId: citation.segmentId,
    redactedQuotedText: citation.quotedText,
    validationStatus: citation.validationStatus,
    sourceLanguage: citation.sourceLanguage,
    translationStatus: citation.translationStatus,
    extractionQuality: citation.extractionQuality,
  };
}

function projectGap(candidate: Extract<CaseCandidate, { kind: "context_gap" }>) {
  return {
    candidateId: candidate.id,
    analysisRunId: candidate.analysisRunId,
    effectiveReviewedText: candidate.currentText,
    reviewStatus: candidate.reviewStatus,
    responseStatus: candidate.responseStatus,
    response: candidate.response,
    responseEvidenceNature: candidate.responseEvidenceNature,
    responseExplanation: candidate.responseExplanation,
  };
}

function projectCoverageLimitation(decision: CoverageReviewDecision) {
  return {
    decisionId: decision.id,
    issueId: decision.issueId,
    originalConsequence: decision.originalConsequence,
    reviewedConsequence: decision.reviewedConsequence,
    limitationText: decision.limitationText,
    actor: decision.actor,
  };
}

function projectReviewDecision(decision: ReviewDecision) {
  return {
    decisionId: decision.id,
    candidateId: decision.candidateId,
    analysisRunId: decision.analysisRunId,
    action: decision.action,
    resultingStatus: decision.resultingStatus,
    actor: decision.actor,
    createdAt: decision.createdAt,
  };
}

function projectAuditEvent(event: AuditEvent) {
  return {
    auditId: event.id,
    sequence: event.sequence,
    eventType: event.eventType,
    analysisRunId: event.analysisRunId,
    entityIds: [...event.entityIds].sort(),
    safeSummary: event.summary,
    createdAt: event.createdAt,
  };
}

function reviewedStateProjection(manifest: unknown) {
  return {
    projection: REVIEWED_HASH_PROJECTION_VERSION,
    manifest,
  };
}

export function createExportManifest(state: CaseState, selection: ExportSelection, options: ExportCoreOptions = {}): ExportManifest {
  const gate = evaluateExportGate(state, selection, { ...options, previousGate: options.previousGate ?? state.exportGate });
  if (gate.status !== "ready") {
    throw new Error(`Export is blocked: ${gate.blockers.map((entry) => entry.code).join(", ")}`);
  }
  if (!state.purposeBrief) throw new Error("Export is blocked: PURPOSE_INCOMPLETE");
  const run = latestSuccessfulActiveRun(state);
  if (!run) throw new Error("Export is blocked: ANALYSIS_RUN_STALE");

  const selectedCandidates = selectedCandidatesForManifest(state, gate.exportSelection);
  const citationIds = new Set(
    selectedCandidates.flatMap((candidate) => {
      const sourceDependencies = candidate.dependencies.filter(
        (dependency): dependency is Extract<CaseCandidate["dependencies"][number], { kind: "source" }> =>
          dependency.active && dependency.kind === "source",
      );
      return sourceDependencies.map((dependency) => dependency.citationId);
    }),
  );
  const manifestWithoutHash = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    reviewedExportStateHashProjectionVersion: REVIEWED_HASH_PROJECTION_VERSION,
    kind: gate.exportSelection.kind,
    caseId: state.caseId,
    caseRevision: state.caseRevision,
    synthetic: true as const,
    purposeBriefId: state.purposeBrief.id,
    purposeSummary: {
      supportedWorkflow: state.purposeBrief.supportedWorkflow,
      sanitizedPurpose: state.purposeBrief.statedPurpose,
      intendedRecipientCategory: state.purposeBrief.intendedRecipientCategory,
      requestedExport: state.purposeBrief.requestedExport,
      jurisdictionCode: state.purposeBrief.jurisdictionCode,
      excludedDecisions: [...state.purposeBrief.excludedDecisions].sort(),
      authorityBasis: state.purposeBrief.authority.basis,
    },
    runManifest: run,
    labels: LABELS,
    exportSelection: gate.exportSelection,
    exportSelectionDigest: gate.exportSelectionDigest,
    includedCandidates: selectedCandidates.map(projectCandidate).sort((left, right) => left.candidateId.localeCompare(right.candidateId)),
    citations: state.citations
      .filter((citation): citation is ResolvedCitation => citationIds.has(citation.id) && isResolvedCitation(citation))
      .map(projectCitation)
      .sort((left, right) => left.citationId.localeCompare(right.citationId)),
    coverage: state.coverage,
    coverageLimitations: state.coverageReviews.map(projectCoverageLimitation).sort((left, right) => left.decisionId.localeCompare(right.decisionId)),
    guidancePackVersion: state.guidancePack.version,
    guidancePackDigest: state.guidancePack.digest,
    reviewedGaps: state.candidates
      .filter((candidate): candidate is Extract<CaseCandidate, { kind: "context_gap" }> => candidate.kind === "context_gap" && (candidate.reviewStatus === "human_accepted" || candidate.reviewStatus === "human_edited"))
      .map(projectGap)
      .sort((left, right) => left.candidateId.localeCompare(right.candidateId)),
    guidanceCards: (options.guidanceCards ?? []).sort((left, right) => left.id.localeCompare(right.id)),
    reviewDecisions: state.reviews.map(projectReviewDecision).sort((left, right) => left.decisionId.localeCompare(right.decisionId)),
    auditEvents: state.audit.map(projectAuditEvent).sort((left, right) => left.sequence - right.sequence),
    limitations: state.coverageReviews.map((review) => review.limitationText).sort(),
    redactionCheck: "passed" as const,
    gate,
  };

  const reviewedStateHash = sha256Hex(reviewedStateProjection(manifestWithoutHash));
  return ExportManifestSchema.parse({
    ...manifestWithoutHash,
    id: `EXPORT-MANIFEST-${reviewedStateHash.slice(0, 16).toUpperCase()}`,
    reviewedStateHash,
    generatedAt: options.now ?? DEFAULT_NOW,
  });
}
