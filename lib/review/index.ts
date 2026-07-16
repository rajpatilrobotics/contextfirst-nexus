import { cfnDemoFixture } from "../fixtures";
import type {
  CaseCandidate,
  DependencyChange,
  EvidenceDependency,
  ReviewDecision,
  ReviewIntent,
  ReviewLane,
  ReviewStatus,
  SupportStatus,
  EvidenceNature,
  ItemOrigin,
  DependencyRelationship,
  SafeShareRecipientCategory,
} from "../contracts";

type FixtureDependency = { dependencyId: string; kind: "source" | "candidate" | "nexus"; segmentId?: string; candidateId?: string; nexusCandidateId?: string; relationship: DependencyRelationship; evidenceNature?: EvidenceNature };
type FixtureDefinition = { id: string; kind: "timeline_event" | "context_gap" | "nexus_relationship"; title: string; text: string; currentText: string; currentTextOrigin: ItemOrigin; itemOrigin: ItemOrigin; assertionMode: string; reviewRequirement: string; inclusionStatus: "active" | "withdrawn" | "superseded"; supportStatus: SupportStatus; reviewLane?: ReviewLane; dependencies: FixtureDependency[]; safeShareRecipientCategories: string[] };
type ContextGapResponseIntent = { gapId: string; responseStatus: "answered"; response: string; responseExplanation: null } | { gapId: string; responseStatus: "preserved_unknown"; response: null; responseExplanation: null } | { gapId: string; responseStatus: "deferred" | "outside_scope"; response: null; responseExplanation: string };

export type ReviewAssemblyInput = {
  analysisRunId?: string;
  caseId?: string;
  now?: string;
  sourceCitations?: Record<string, "exact_match" | "manually_resolved" | "citation_unresolved" | "invalidated">;
  openCoverageIssueIds?: string[];
};

export type ReviewState = {
  candidates: CaseCandidate[];
  decisions: ReviewDecision[];
  dependencyChanges: DependencyChange[];
  exportReadinessRevoked: boolean;
};

export type ReviewContext = {
  analysisRunId: string;
  caseId: string;
  reviewerRole: "demo_evaluator";
  now: string;
  actor?: "current_practitioner" | "fixture_reviewer";
};

const RUN_ID = "RUN-CFN-DEMO-001-REVIEW";
const CASE_ID = "CFN-DEMO-001";
const ROLE = "demo_evaluator" as const;
const LIMITATION_TEXT = cfnDemoFixture.reviewDefinitions.heroTransition.limitationText;

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function reviewRequirement(value: string): "individual" | "derived_summary" | "optional" {
  if (value === "derived_summary") return value;
  if (value === "individual") return value;
  return "optional";
}

function assertionMode(value: string): "positive_proposition" | "limitation" | "gap" | "unknown_state" | "neutral_procedural_fact" {
  if (value === "limitation") return value;
  return "positive_proposition";
}

function makeDependency(definition: FixtureDependency, citationId: string): EvidenceDependency {
  if (definition.kind === "source") {
    return {
      id: definition.dependencyId,
      kind: "source",
      sourceSegmentId: definition.segmentId!,
      citationId,
      evidenceNature: definition.evidenceNature!,
      relationship: definition.relationship,
      active: true,
    };
  }
  if (definition.kind === "candidate") {
    return { id: definition.dependencyId, kind: "candidate", candidateId: definition.candidateId!, relationship: definition.relationship, active: true };
  }
  return { id: definition.dependencyId, kind: "nexus", nexusCandidateId: definition.nexusCandidateId!, relationship: definition.relationship, active: true };
}

function sourceStatus(definition: FixtureDefinition, citations: ReviewAssemblyInput["sourceCitations"]): SupportStatus {
  const sourceDependencies = definition.dependencies.filter((dependency) => dependency.kind === "source");
  if (sourceDependencies.some((dependency) => citations?.[dependency.segmentId!] === "citation_unresolved")) return "citation_unresolved";
  if (sourceDependencies.some((dependency) => citations?.[dependency.segmentId!] === "invalidated")) return "not_processed";
  return definition.supportStatus as SupportStatus;
}

function candidateFromDefinition(definition: FixtureDefinition, input: ReviewAssemblyInput, index: number): CaseCandidate {
  const runId = input.analysisRunId ?? RUN_ID;
  const caseId = input.caseId ?? CASE_ID;
  const citationId = (segmentId: string) => `CIT-${segmentId}`;
  const dependencies = definition.dependencies.map((dependency) => makeDependency(dependency, citationId(dependency.kind === "source" ? dependency.segmentId! : dependency.dependencyId)));
  const base = {
    id: definition.id,
    revision: 0,
    caseId,
    analysisRunId: runId,
    title: definition.title,
    proposedText: definition.text,
    currentText: definition.currentText,
    currentTextOrigin: definition.currentTextOrigin as ItemOrigin,
    itemOrigin: definition.itemOrigin as ItemOrigin,
    lane: cfnDemoFixture.reviewDefinitions.reviewLaneDefinitions.find((laneDefinition) => laneDefinition.candidateIds.includes(definition.id))?.lane as ReviewLane | undefined,
    assertionMode: assertionMode(definition.assertionMode),
    reviewRequirement: reviewRequirement(definition.reviewRequirement),
    inclusionStatus: definition.inclusionStatus as "active" | "withdrawn" | "superseded",
    supportStatus: sourceStatus(definition, input.sourceCitations),
    reviewStatus: "pending" as ReviewStatus,
    dependencies,
    relatedCoverageIssueIds: input.openCoverageIssueIds ?? [],
    unknowns: definition.kind === "context_gap" ? [definition.title] : [],
    reviewQuestion: definition.title,
    consequential: definition.reviewRequirement === "individual",
    prohibitedConclusionCheck: "passed" as const,
    safeShareRecipientCategories: definition.safeShareRecipientCategories.map((category) => category === "legal_practitioner" ? "legal_aid_team" : "trained_supervisor" === category ? "ngo_caseworker" : "policy_or_research_summary") as SafeShareRecipientCategory[],
    createdAt: input.now ?? "2026-07-16T00:00:00.000Z",
  };
  if (definition.kind === "timeline_event") {
    const timeline = cfnDemoFixture.reviewDefinitions.timelineDefinitions.find((item) => item.candidateId === definition.id);
    return { ...base, kind: "timeline_event", dateStart: timeline?.date, datePrecision: (timeline?.datePrecision ?? "unknown") as "day", dateAlternatives: [], actorLabels: [], locationLabel: timeline?.qualification };
  }
  if (definition.kind === "context_gap") {
    return { ...base, kind: "context_gap", response: null, responseStatus: "unanswered", responseEvidenceNature: "unknown", responseExplanation: null };
  }
  const nexus = cfnDemoFixture.reviewDefinitions.nexusDependencyDefinitions.find((item) => item.nexusCandidateId === definition.id);
  const category = definition.id.replace("NEXUS-", "").toLowerCase().replaceAll("-", "_") as "recruitment" | "movement" | "control" | "compelled_tasks" | "offence_timing" | "urgency";
  return { ...base, kind: "nexus_relationship", category, requiredDependencyIds: nexus?.dependencies.map((dependency) => dependency.dependencyId).sort() ?? [], childCandidateIds: dependencies.filter((dependency): dependency is Extract<EvidenceDependency, { kind: "candidate" }> => dependency.kind === "candidate").map((dependency) => dependency.candidateId).sort(), relationshipSummary: base.currentText };
}

export function assembleCandidates(input: ReviewAssemblyInput = {}): CaseCandidate[] {
  const definitions = cfnDemoFixture.reviewDefinitions.candidateDefinitions as unknown as FixtureDefinition[];
  const candidates = definitions.map((definition, index) => candidateFromDefinition(definition, input, index));
  return candidates;
}

export const assembleReviewCandidates = assembleCandidates;

export function selectTimeline(candidates: CaseCandidate[]) {
  return candidates.filter((candidate): candidate is Extract<CaseCandidate, { kind: "timeline_event" }> => candidate.kind === "timeline_event").sort((a, b) => (a.dateStart ?? "").localeCompare(b.dateStart ?? ""));
}

export function selectNexus(candidates: CaseCandidate[]) { return candidates.filter((candidate) => candidate.kind === "nexus_relationship"); }
export function selectContextGaps(candidates: CaseCandidate[]) { return candidates.filter((candidate) => candidate.kind === "context_gap"); }
export function selectReviewLane(candidates: CaseCandidate[], lane: ReviewLane) { return candidates.filter((candidate) => candidate.lane === lane); }
export function selectReviewLanes(candidates: CaseCandidate[]) { return { trafficking_indicators: selectReviewLane(candidates, "trafficking_indicators"), non_punishment_relevance: selectReviewLane(candidates, "non_punishment_relevance"), protection_remedy_urgency: selectReviewLane(candidates, "protection_remedy_urgency") }; }
export function selectReviewQueue(candidates: CaseCandidate[]) { return candidates.filter((candidate) => candidate.reviewRequirement === "individual" && candidate.inclusionStatus === "active" && candidate.reviewStatus === "pending"); }
export function isReviewComplete(candidates: CaseCandidate[]) { return selectReviewQueue(candidates).length === 0; }
export function selectReviewBlockers(candidates: CaseCandidate[]) { return selectReviewQueue(candidates).map((candidate) => ({ id: candidate.id, title: candidate.title, reason: candidate.supportStatus === "insufficient_evidence" ? "Insufficient evidence requires a limitation or rejection." : "Individual review is pending." })); }

function sourceDependencies(candidate: CaseCandidate) { return candidate.dependencies.filter((dependency) => dependency.kind === "source"); }
function canAccept(candidate: CaseCandidate): boolean {
  return candidate.prohibitedConclusionCheck === "passed" && candidate.supportStatus !== "insufficient_evidence" && candidate.supportStatus !== "citation_unresolved" && candidate.supportStatus !== "not_processed" && candidate.relatedCoverageIssueIds.length === 0;
}
function dependencySnapshot(candidate: CaseCandidate) { return candidate.dependencies.filter((dependency) => dependency.active).map((dependency) => dependency.id).sort(); }
function decisionId(decisions: ReviewDecision[]) { return `REVIEW-${String(decisions.length + 1).padStart(4, "0")}`; }

function validateIntent(candidate: CaseCandidate, intent: ReviewIntent) {
  if (candidate.reviewRequirement === "derived_summary") throw new Error("Derived summaries cannot receive direct review actions.");
  if (intent.action === "confirm_unknown" && candidate.assertionMode !== "unknown_state" && candidate.kind !== "context_gap") throw new Error("Confirm unknown applies only to unknown state.");
  if (intent.action === "edit" && intent.editedText.trim() === candidate.currentText.trim()) throw new Error("Edited text must differ from current text.");
  if (intent.action === "accept" && !canAccept(candidate)) throw new Error("Candidate cannot be accepted until its evidence and review gates pass.");
  if (intent.action === "confirm_unknown" && candidate.supportStatus === "insufficient_evidence") throw new Error("Insufficient evidence cannot be confirmed as unknown.");
  if (intent.action === "accept_as_limitation" && candidate.assertionMode !== "limitation" && !(candidate.reviewStatus === "invalidated" && candidate.supportStatus === "insufficient_evidence")) throw new Error("Limitation action is not valid for this candidate.");
}

export function reviewCandidate(candidates: CaseCandidate[], intent: ReviewIntent, decisions: ReviewDecision[] = [], context: Partial<ReviewContext> = {}) {
  if ((intent as { action: string }).action === "withdraw") throw new Error("Withdrawal requires withdrawCandidate.");
  const index = candidates.findIndex((candidate) => candidate.id === intent.candidateId);
  if (index < 0) throw new Error("Candidate not found.");
  const candidate = candidates[index];
  validateIntent(candidate, intent);
  const action = intent.action;
  const resultingStatus: ReviewStatus = action === "accept" || action === "confirm_unknown" ? "human_accepted" : action === "edit" || action === "accept_as_limitation" ? "human_edited" : action === "reject" ? "rejected" : "uncertain";
  const currentText = action === "edit" ? intent.editedText : action === "accept_as_limitation" ? intent.limitationText : candidate.currentText;
  const updated: CaseCandidate = { ...candidate, revision: candidate.revision + 1, currentText, currentTextOrigin: action === "edit" || action === "accept_as_limitation" ? "human_created" : candidate.currentTextOrigin, assertionMode: action === "accept_as_limitation" && candidate.reviewStatus === "invalidated" ? "limitation" : candidate.assertionMode, reviewStatus: resultingStatus };
  const nextCandidates = [...candidates]; nextCandidates[index] = updated;
  const decision: ReviewDecision = { id: decisionId(decisions), caseId: context.caseId ?? candidate.caseId, analysisRunId: context.analysisRunId ?? candidate.analysisRunId, candidateId: candidate.id, candidateRevision: updated.revision, action, previousStatus: candidate.reviewStatus, resultingStatus, editedText: action === "edit" ? intent.editedText : action === "accept_as_limitation" ? intent.limitationText : null, reason: "reason" in intent ? intent.reason : null, actor: context.actor ?? "current_practitioner", reviewerRole: "demo_evaluator", promptVersion: "1.0.0", rulesetVersion: "1.0.0", supersedesDecisionId: decisions.at(-1)?.candidateId === candidate.id ? decisions.at(-1)?.id ?? null : null, createdAt: context.now ?? "2026-07-16T00:00:00.000Z", dependencySnapshot: dependencySnapshot(candidate) };
  return { candidates: recalculateDerivedSummaries(nextCandidates), decision };
}

export function respondContextGap(candidates: CaseCandidate[], intent: ContextGapResponseIntent) {
  const index = candidates.findIndex((candidate) => candidate.id === intent.gapId && candidate.kind === "context_gap");
  if (index < 0) throw new Error("Context gap not found.");
  if (intent.responseStatus === "answered" && !intent.response.trim()) throw new Error("Answered gaps require text.");
  if ((intent.responseStatus === "deferred" || intent.responseStatus === "outside_scope") && !intent.responseExplanation.trim()) throw new Error("Deferred gaps require an explanation.");
  const candidate = candidates[index];
  const updated = intent.responseStatus === "answered" ? { ...candidate, response: intent.response, responseStatus: "answered" as const, responseEvidenceNature: "reviewer_supplied_context" as const, responseExplanation: null } : intent.responseStatus === "preserved_unknown" ? { ...candidate, response: null, responseStatus: "preserved_unknown" as const, responseEvidenceNature: "unknown" as const, responseExplanation: null } : { ...candidate, response: null, responseStatus: intent.responseStatus, responseEvidenceNature: "unknown" as const, responseExplanation: intent.responseExplanation };
  const next = [...candidates]; next[index] = { ...updated, revision: candidate.revision + 1 };
  return recalculateDerivedSummaries(next);
}

export function withdrawCandidate(candidates: CaseCandidate[], candidateId: string, reason: string, decisions: ReviewDecision[] = [], context: Partial<ReviewContext> = {}) {
  if (!reason.trim()) throw new Error("Withdrawal requires a reason.");
  const index = candidates.findIndex((candidate) => candidate.id === candidateId);
  if (index < 0) throw new Error("Candidate not found.");
  const target = candidates[index];
  const next = candidates.map((candidate) => ({ ...candidate }));
  next[index] = { ...target, revision: target.revision + 1, inclusionStatus: "withdrawn", reviewStatus: "invalidated", invalidatedAt: context.now ?? "2026-07-16T00:00:00.000Z", invalidationReason: "candidate_withdrawn" };
  const impacted = recalculateDependencyClosure(next, candidateId);
  const decision: ReviewDecision = { id: decisionId(decisions), caseId: target.caseId, analysisRunId: target.analysisRunId, candidateId, candidateRevision: next[index].revision, action: "withdraw", previousStatus: target.reviewStatus, resultingStatus: "invalidated", editedText: null, reason, actor: context.actor ?? "current_practitioner", reviewerRole: "demo_evaluator", promptVersion: "1.0.0", rulesetVersion: "1.0.0", supersedesDecisionId: decisions.at(-1)?.candidateId === candidateId ? decisions.at(-1)?.id ?? null : null, createdAt: context.now ?? "2026-07-16T00:00:00.000Z", dependencySnapshot: dependencySnapshot(target) };
  const change: DependencyChange = { id: `DEPENDENCY-CHANGE-${decisions.length + 1}`, commandId: `withdraw-${candidateId}`, auditEventId: `AUDIT-${decisions.length + 1}`, changedEntityId: candidateId, reason: "candidate_withdrawn", impacts: impacted.map((item) => ({ candidateId: item.id, previousSupportStatus: item.before.supportStatus, resultingSupportStatus: item.after.supportStatus, previousReviewStatus: item.before.reviewStatus, resultingReviewStatus: item.after.reviewStatus, previousInclusionStatus: item.before.inclusionStatus, resultingInclusionStatus: item.after.inclusionStatus, explanation: `Dependency ${candidateId} was withdrawn.` })), preservedCandidateIds: next.filter((candidate) => !impacted.some((item) => item.id === candidate.id) && candidate.id !== candidateId).map((candidate) => candidate.id), exportReadinessRevoked: true, createdAt: context.now ?? "2026-07-16T00:00:00.000Z" };
  return { candidates: recalculateDerivedSummaries(next), decision, dependencyChange: change };
}

type Impact = { id: string; before: CaseCandidate; after: CaseCandidate };
function recalculateDependencyClosure(candidates: CaseCandidate[], changedId: string): Impact[] {
  const impacted: Impact[] = [];
  let frontier = [changedId];
  const seen = new Set(frontier);
  while (frontier.length) {
    const current = frontier.shift()!;
    for (const candidate of candidates) {
      if (!candidate.dependencies.some((dependency) => dependency.active && ((dependency.kind === "candidate" && dependency.candidateId === current) || (dependency.kind === "nexus" && dependency.nexusCandidateId === current)))) continue;
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id); frontier.push(candidate.id);
      const before = candidate;
      const after = { ...candidate, reviewStatus: "invalidated" as const, supportStatus: candidate.id === "NEXUS-OFFENCE-TIMING" ? "insufficient_evidence" as const : candidate.supportStatus, invalidatedAt: "2026-07-16T00:00:00.000Z", invalidationReason: "candidate_withdrawn" as const, revision: candidate.revision + 1 };
      const index = candidates.findIndex((item) => item.id === candidate.id); candidates[index] = after; impacted.push({ id: candidate.id, before, after });
    }
  }
  return impacted;
}

function recalculateDerivedSummaries(candidates: CaseCandidate[]): CaseCandidate[] {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  return candidates.map((candidate) => {
    if (candidate.kind !== "nexus_relationship" || candidate.reviewRequirement !== "derived_summary") return candidate;
    const upstream = candidate.dependencies.map((dependency) => dependency.kind === "candidate" ? byId.get(dependency.candidateId) : dependency.kind === "nexus" ? byId.get(dependency.nexusCandidateId) : undefined).filter((value): value is CaseCandidate => Boolean(value));
    if (upstream.some((item) => item.reviewStatus === "invalidated")) return { ...candidate, reviewStatus: "invalidated", supportStatus: "not_processed" };
    if (upstream.some((item) => item.reviewStatus === "pending")) return { ...candidate, reviewStatus: "pending", supportStatus: "not_processed" };
    if (upstream.some((item) => item.reviewStatus === "rejected" || item.reviewStatus === "uncertain" || item.supportStatus === "insufficient_evidence")) return { ...candidate, reviewStatus: "uncertain", supportStatus: "insufficient_evidence" };
    const edited = upstream.some((item) => item.reviewStatus === "human_edited" || item.supportStatus === "partially_supported");
    return { ...candidate, reviewStatus: edited ? "human_edited" : "human_accepted", supportStatus: edited ? "partially_supported" : "exact_source_supported" };
  });
}

export function validateDependencyGraph(candidates: CaseCandidate[]) {
  const ids = new Set(candidates.map((candidate) => candidate.id));
  const edges = new Map<string, string[]>();
  for (const candidate of candidates) {
    const targets = candidate.dependencies.filter((dependency) => dependency.active && dependency.kind !== "source").map((dependency) => dependency.kind === "candidate" ? dependency.candidateId : dependency.kind === "nexus" ? dependency.nexusCandidateId : "");
    if (targets.some((target) => target === candidate.id || !ids.has(target))) throw new Error("Dependency graph contains a self-edge or missing node.");
    edges.set(candidate.id, targets);
  }
  const visiting = new Set<string>(); const visited = new Set<string>();
  const visit = (id: string) => { if (visiting.has(id)) throw new Error("Dependency graph contains a cycle."); if (visited.has(id)) return; visiting.add(id); for (const target of edges.get(id) ?? []) visit(target); visiting.delete(id); visited.add(id); };
  for (const id of ids) visit(id);
  return true;
}

export { LIMITATION_TEXT };
