"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Filter,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCaseState } from "../../../components/shell";
import {
  EvidenceNatureStatus,
  ItemOriginStatus,
  ReviewStatusBadge,
  SupportStatusBadge,
} from "../../../components/status";
import { Alert, Button, Input, Select, Skeleton } from "../../../components/ui";
import { analysisRunInputMatchesState } from "../../../lib/analysis/freshness";
import type {
  CaseCandidate,
  CaseState,
  EvidenceDependency,
  ItemOrigin,
  ReviewLane,
  ReviewStatus,
  SupportStatus,
} from "../../../lib/contracts";
import { deriveAnalysisPrerequisites } from "../../documents/analysis-prerequisites";
import { CandidateReviewActions } from "../../review/candidate/candidate-review-card";
import { DependencyChangePanel } from "../../review/dependency";
import {
  CitationLink,
  SourceDrawer,
  type SourceMode,
  type SourceSelection,
} from "../../review/source";

type StatusFilter =
  | "all"
  | "pending"
  | "accepted"
  | "edited"
  | "rejected"
  | "uncertain"
  | "conflict";

type OriginFilter = "all" | ItemOrigin;
type SupportFilter = "all" | SupportStatus;

const LANE_META: Array<{
  id: ReviewLane;
  code: "A" | "B" | "C";
  label: string;
  boundary: string;
}> = [
  {
    id: "trafficking_indicators",
    code: "A",
    label: "Trafficking Indicators",
    boundary:
      "Indicators prompt qualified review and never determine trafficking or victim status.",
  },
  {
    id: "non_punishment_relevance",
    code: "B",
    label: "Non-Punishment Relevance",
    boundary:
      "This lane organizes relevance questions, not legal eligibility or a legal conclusion.",
  },
  {
    id: "protection_remedy_urgency",
    code: "C",
    label: "Protection & Urgency",
    boundary:
      "These are questions for qualified action; the workspace contacts no recipient automatically.",
  },
];

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "edited", label: "Edited" },
  { id: "rejected", label: "Rejected" },
  { id: "uncertain", label: "Uncertain" },
  { id: "conflict", label: "Conflict" },
];

const ORIGIN_LABELS: Record<ItemOrigin, string> = {
  source_extraction: "Source extraction",
  ai_suggestion: "AI suggestion",
  human_created: "Human-created",
};

const SUPPORT_LABELS: Record<SupportStatus, string> = {
  exact_source_supported: "Exact-source supported",
  partially_supported: "Partially supported",
  conflicting: "Conflicting",
  insufficient_evidence: "Insufficient evidence",
  citation_unresolved: "Citation unresolved",
  not_processed: "Not processed",
};

function readable(value: string) {
  return value.replaceAll("_", " ");
}

function dependencyTarget(dependency: EvidenceDependency) {
  if (dependency.kind === "source") return dependency.sourceSegmentId;
  if (dependency.kind === "candidate") return dependency.candidateId;
  return dependency.nexusCandidateId;
}

export function candidateHasCanonicalConflict(candidate: CaseCandidate) {
  return (
    candidate.supportStatus === "conflicting" ||
    candidate.kind === "contradiction" ||
    (candidate.kind === "timeline_event" &&
      candidate.datePrecision === "conflicting") ||
    candidate.dependencies.some(
      (dependency) =>
        dependency.active && dependency.relationship === "contradicts",
    )
  );
}

export function candidateRequiresPendingReview(candidate: CaseCandidate) {
  return (
    candidate.inclusionStatus === "active" &&
    (candidate.reviewStatus === "pending" ||
      candidate.reviewStatus === "invalidated")
  );
}

function matchesStatus(candidate: CaseCandidate, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "pending") return candidateRequiresPendingReview(candidate);
  if (filter === "accepted") {
    return candidate.reviewStatus === "human_accepted";
  }
  if (filter === "edited") return candidate.reviewStatus === "human_edited";
  if (filter === "rejected") return candidate.reviewStatus === "rejected";
  if (filter === "uncertain") return candidate.reviewStatus === "uncertain";
  return candidateHasCanonicalConflict(candidate);
}

function useSourceMode(): SourceMode {
  const [mode, setMode] = useState<SourceMode>("mobile");

  useEffect(() => {
    const update = () =>
      setMode(
        window.innerWidth >= 1280
          ? "desktop"
          : window.innerWidth >= 768
            ? "tablet"
            : "mobile",
      );
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return mode;
}

function AnalysisHeader({
  candidates,
}: {
  candidates: CaseCandidate[];
}) {
  const pending = candidates.filter(candidateRequiresPendingReview).length;
  const reviewed = candidates.filter((candidate) =>
    ["human_accepted", "human_edited", "rejected"].includes(
      candidate.reviewStatus,
    ),
  ).length;
  const conflicts = candidates.filter(candidateHasCanonicalConflict).length;

  return (
    <header className="grid gap-3 border-b border-[var(--color-border)] pb-4">
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
          Stage 3 · Analysis
        </p>
        <h1 className="mt-1 text-3xl">Structured Analysis</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--color-ink-muted)]">
          Source-linked canonical candidates organized for explicit human review.
          Lanes and filters are projections only; they never create findings or
          change candidate membership.
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Lane candidates", candidates.length],
          ["Pending review", pending],
          ["Reviewed", reviewed],
          ["Conflicts", conflicts],
        ].map(([label, value]) => (
          <div
            className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
            key={label}
          >
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
              {label}
            </dt>
            <dd className="font-serif text-xl">{value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

function LaneSelector({
  activeLane,
  candidates,
  onChange,
}: {
  activeLane: ReviewLane;
  candidates: CaseCandidate[];
  onChange: (lane: ReviewLane) => void;
}) {
  return (
    <section aria-labelledby="analysis-lanes-heading" className="grid gap-2">
      <h2 className="sr-only" id="analysis-lanes-heading">
        Structured analysis lanes
      </h2>
      <div
        aria-label="Structured analysis lanes"
        className="grid gap-2 md:grid-cols-3"
        role="tablist"
      >
        {LANE_META.map((lane) => {
          const count = candidates.filter(
            (candidate) => candidate.lane === lane.id,
          ).length;
          const active = lane.id === activeLane;
          return (
            <button
              aria-controls="structured-analysis-workspace"
              aria-selected={active}
              className={`cfn-control-target grid gap-1 rounded-[var(--radius-control)] border px-3 py-2 text-left ${
                active
                  ? "border-[var(--amber)] bg-[var(--color-warning-subtle)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)]"
              }`}
              key={lane.id}
              onClick={() => onChange(lane.id)}
              role="tab"
              type="button"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-serif text-sm font-semibold sm:text-base">
                  Lane {lane.code} — {lane.label}
                </span>
                <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 font-mono text-[10px]">
                  {count}
                </span>
              </span>
              <span className="line-clamp-2 text-xs leading-4 text-[var(--color-ink-muted)]">
                {lane.boundary}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[var(--color-ink-muted)]">
        Canonical lane membership is preserved exactly; candidates are never
        copied or reclassified by this view.
      </p>
    </section>
  );
}

function StateLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="inline-flex min-h-11 w-fit items-center rounded-[var(--radius-control)] border border-[var(--color-control-border)] px-4 py-2 font-semibold"
      href={href}
    >
      {children}
    </a>
  );
}

function CandidateList({
  candidates,
  selectedId,
  onSelect,
  onClear,
}: {
  candidates: CaseCandidate[];
  selectedId: string | null;
  onSelect: (candidateId: string) => void;
  onClear: () => void;
}) {
  return (
    <section
      aria-labelledby="structured-candidate-list-heading"
      className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="border-b border-[var(--color-border)] px-3 py-3">
        <h2 className="font-serif text-base" id="structured-candidate-list-heading">
          Candidates ({candidates.length})
        </h2>
      </div>
      {candidates.length ? (
        <ul className="divide-y divide-[var(--color-border)]">
          {candidates.map((candidate) => {
            const selected = candidate.id === selectedId;
            return (
              <li key={candidate.id}>
                <button
                  aria-current={selected ? "true" : undefined}
                  aria-label={`Select candidate ${candidate.id}: ${candidate.title}`}
                  className={`cfn-control-target grid w-full gap-2 border-l-2 px-3 py-3 text-left ${
                    selected
                      ? "border-l-[var(--amber)] bg-[var(--color-surface-subtle)]"
                      : "border-l-transparent hover:bg-[var(--color-surface-subtle)]"
                  }`}
                  onClick={() => onSelect(candidate.id)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-[10px] text-[var(--color-ink-muted)]">
                      {candidate.id}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold">
                      {candidate.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[var(--color-ink-muted)]">
                      {candidate.currentText}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    <ReviewStatusBadge value={candidate.reviewStatus} />
                    <SupportStatusBadge value={candidate.supportStatus} />
                    {candidateHasCanonicalConflict(candidate) ? (
                      <span className="cfn-status-token" data-tone="conflict">
                        <AlertTriangle aria-hidden="true" size={13} />
                        Conflict
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid gap-3 p-5">
          <Alert title="No candidates match these filters" tone="neutral">
            Change the lane or clear the current projections. No hidden candidate
            is displayed in the detail panel.
          </Alert>
          <Button onClick={onClear} variant="secondary">
            Clear filters
          </Button>
        </div>
      )}
    </section>
  );
}

function CandidateDetail({
  candidate,
  state,
  onOpenSource,
  onWithdrawRequest,
}: {
  candidate: CaseCandidate;
  state: CaseState;
  onOpenSource: (selection: SourceSelection) => void;
  onWithdrawRequest: (candidate: CaseCandidate) => void;
}) {
  const { dispatchCaseCommand } = useCaseState();
  const sourceDependencies = candidate.dependencies.filter(
    (
      dependency,
    ): dependency is Extract<EvidenceDependency, { kind: "source" }> =>
      dependency.kind === "source",
  );
  const evidenceNatures = [
    ...new Set(sourceDependencies.map((dependency) => dependency.evidenceNature)),
  ];
  const latestDecision =
    [...state.reviews]
      .reverse()
      .find((decision) => decision.candidateId === candidate.id) ?? null;

  return (
    <article
      aria-label={`Candidate detail: ${candidate.id}`}
      className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <header className="grid gap-3 border-b border-[var(--color-border)] p-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
            {candidate.id} · {readable(candidate.kind)}
          </p>
          <h2 className="mt-1 font-serif text-2xl">{candidate.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">
            {candidate.currentText}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ItemOriginStatus value={candidate.itemOrigin} />
          <SupportStatusBadge value={candidate.supportStatus} />
          <ReviewStatusBadge value={candidate.reviewStatus} />
          {evidenceNatures.map((nature) => (
            <EvidenceNatureStatus key={nature} value={nature} />
          ))}
        </div>
      </header>

      <div className="grid gap-5 p-4 xl:grid-cols-2">
        <section aria-labelledby={`candidate-${candidate.id}-provenance`}>
          <h3
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]"
            id={`candidate-${candidate.id}-provenance`}
          >
            Provenance and review
          </h3>
          <dl className="mt-2 grid gap-2 text-sm">
            <div>
              <dt className="cfn-type-label">Active run</dt>
              <dd className="break-all font-mono text-xs">
                {candidate.analysisRunId}
              </dd>
            </div>
            <div>
              <dt className="cfn-type-label">Current wording origin</dt>
              <dd>{ORIGIN_LABELS[candidate.currentTextOrigin]}</dd>
            </div>
            <div>
              <dt className="cfn-type-label">Assertion and inclusion</dt>
              <dd>
                {readable(candidate.assertionMode)} ·{" "}
                {readable(candidate.inclusionStatus)}
              </dd>
            </div>
            <div>
              <dt className="cfn-type-label">Latest human decision</dt>
              <dd>
                {latestDecision
                  ? `${readable(latestDecision.action)} by ${
                      latestDecision.actor === "fixture_reviewer"
                        ? "Fixture reviewer"
                        : "Current practitioner"
                    }`
                  : "No individual review recorded"}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby={`candidate-${candidate.id}-limitations`}>
          <h3
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]"
            id={`candidate-${candidate.id}-limitations`}
          >
            Limitations and unknowns
          </h3>
          {candidate.unknowns.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {candidate.unknowns.map((unknown) => (
                <li key={unknown}>{unknown}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              No separate unknown is recorded for this candidate.
            </p>
          )}
          {candidate.relatedCoverageIssueIds.length ? (
            <Alert title="Related coverage limitation" tone="warning">
              {candidate.relatedCoverageIssueIds.join(", ")}. Missing content is
              not filled or inferred.
            </Alert>
          ) : null}
        </section>

        <section
          aria-labelledby={`candidate-${candidate.id}-citations`}
          className="grid content-start gap-3"
        >
          <h3
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]"
            id={`candidate-${candidate.id}-citations`}
          >
            Exact source citations
          </h3>
          {sourceDependencies.length ? (
            <ul className="grid gap-2">
              {sourceDependencies.map((dependency) => (
                <li
                  className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] p-3"
                  key={dependency.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <EvidenceNatureStatus value={dependency.evidenceNature} />
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      {readable(dependency.relationship)} ·{" "}
                      {dependency.active
                        ? "active"
                        : "inactive after recalculation"}
                    </span>
                  </div>
                  <CitationLink
                    candidateId={candidate.id}
                    citationId={dependency.citationId}
                    onOpen={onOpenSource}
                    state={state}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Alert title="No exact citation attached" tone="warning">
              This candidate cannot present a source location. Any reviewer-created
              context remains separately attributed.
            </Alert>
          )}
        </section>

        <section
          aria-labelledby={`candidate-${candidate.id}-dependencies`}
          className="grid content-start gap-3"
        >
          <h3
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]"
            id={`candidate-${candidate.id}-dependencies`}
          >
            Dependencies
          </h3>
          {candidate.dependencies.length ? (
            <ul className="grid gap-2 text-sm">
              {candidate.dependencies.map((dependency) => (
                <li
                  className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2"
                  key={dependency.id}
                >
                  <span className="font-mono text-xs">
                    {dependencyTarget(dependency)}
                  </span>
                  <span className="block text-xs text-[var(--color-ink-muted)]">
                    {readable(dependency.kind)} ·{" "}
                    {readable(dependency.relationship)} ·{" "}
                    {dependency.active ? "active" : "inactive"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-ink-muted)]">
              No canonical dependencies are recorded.
            </p>
          )}
        </section>
      </div>

      <section
        aria-labelledby={`candidate-${candidate.id}-review-actions`}
        className="grid gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"
      >
        <div>
          <h3
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
            id={`candidate-${candidate.id}-review-actions`}
          >
            Human review
          </h3>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
            Every action dispatches the existing canonical review command. No
            filter or selection action changes case state.
          </p>
        </div>
        <CandidateReviewActions
          allowWithdrawal
          candidate={candidate}
          compact
          key={candidate.id}
          onCommand={dispatchCaseCommand}
          onWithdrawRequest={onWithdrawRequest}
          state={state}
        />
      </section>
    </article>
  );
}

export function StructuredAnalysisWorkspace() {
  const { state, dispatchCaseCommand } = useCaseState();
  const sourceMode = useSourceMode();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [activeLane, setActiveLane] = useState<ReviewLane>(
    "trafficking_indicators",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");
  const [supportFilter, setSupportFilter] = useState<SupportFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [sourceSelection, setSourceSelection] =
    useState<SourceSelection | null>(null);
  const [withdrawalCandidateId, setWithdrawalCandidateId] = useState<
    string | null
  >(null);

  const activeRun =
    state.analysisRuns.find((run) => run.id === state.activeAnalysisRunId) ??
    null;
  const runIsCurrent = Boolean(
    activeRun?.status === "succeeded" &&
      analysisRunInputMatchesState(state, activeRun),
  );
  const laneCandidates = useMemo(
    () =>
      state.candidates.filter(
        (candidate) =>
          candidate.analysisRunId === activeRun?.id && Boolean(candidate.lane),
      ),
    [activeRun?.id, state.candidates],
  );
  const prerequisites = deriveAnalysisPrerequisites(state);
  const openCoverageIssues = state.coverage.issues.filter(
    (issue) => issue.resolutionStatus !== "resolved",
  );
  const withdrawalCandidate = withdrawalCandidateId
    ? state.candidates.find(
        (candidate) => candidate.id === withdrawalCandidateId,
      ) ?? null
    : null;

  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        STATUS_FILTERS.map(({ id }) => [
          id,
          laneCandidates.filter((candidate) => matchesStatus(candidate, id))
            .length,
        ]),
      ) as Record<StatusFilter, number>,
    [laneCandidates],
  );

  const visibleCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return laneCandidates.filter((candidate) => {
      if (candidate.lane !== activeLane) return false;
      if (!matchesStatus(candidate, statusFilter)) return false;
      if (
        originFilter !== "all" &&
        candidate.itemOrigin !== originFilter
      ) {
        return false;
      }
      if (
        supportFilter !== "all" &&
        candidate.supportStatus !== supportFilter
      ) {
        return false;
      }
      if (!normalizedQuery) return true;
      return [
        candidate.id,
        candidate.title,
        candidate.proposedText,
        candidate.currentText,
        candidate.reviewQuestion,
        ...candidate.unknowns,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [
    activeLane,
    laneCandidates,
    originFilter,
    query,
    statusFilter,
    supportFilter,
  ]);

  const selectedCandidate =
    visibleCandidates.find(
      (candidate) => candidate.id === selectedCandidateId,
    ) ??
    visibleCandidates[0] ??
    null;
  const filtersActive =
    statusFilter !== "all" ||
    originFilter !== "all" ||
    supportFilter !== "all" ||
    query.trim().length > 0;
  const presentationCandidates =
    runIsCurrent && !state.pendingLiveAnalysis ? laneCandidates : [];

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    workspace.inert = Boolean(sourceSelection && sourceMode === "mobile");
    return () => {
      workspace.inert = false;
    };
  }, [sourceMode, sourceSelection]);

  function clearFilters() {
    setStatusFilter("all");
    setOriginFilter("all");
    setSupportFilter("all");
    setQuery("");
  }

  const sharedHeader = (
    <>
      <AnalysisHeader candidates={presentationCandidates} />
      <LaneSelector
        activeLane={activeLane}
        candidates={presentationCandidates}
        onChange={setActiveLane}
      />
    </>
  );

  if (state.pendingLiveAnalysis) {
    return (
      <div className="grid gap-5">
        {sharedHeader}
        <Alert title="Analysis is running" tone="neutral">
          The selected run has not reached a terminal accepted state. Only the
          last stable canonical state survives refresh.
        </Alert>
        <Skeleton label="Loading structured analysis" />
        <Skeleton label="Loading canonical candidates" />
      </div>
    );
  }

  if (activeRun?.status === "failed") {
    return (
      <div className="grid gap-5">
        {sharedHeader}
        <Alert title="Analysis failed safely" tone="danger">
          The active failed run is not displayed as partial or successful
          analysis. No candidate detail is inferred from it.
        </Alert>
        <StateLink href="/case/demo/intake">Return to Documents</StateLink>
      </div>
    );
  }

  if (activeRun?.status === "succeeded" && !runIsCurrent) {
    return (
      <div className="grid gap-5">
        {sharedHeader}
        <Alert title="Analysis needs to be rerun" tone="warning">
          The successful run no longer matches the current Purpose, masking,
          selected sources, fixture, or guidance provenance. Its candidates are
          not presented as current analysis.
        </Alert>
        <StateLink href="/case/demo/intake">Review readiness and rerun</StateLink>
      </div>
    );
  }

  if (!activeRun || activeRun.status !== "succeeded") {
    const unmet = prerequisites.items.filter((item) => !item.satisfied);
    return (
      <div className="grid gap-5">
        {sharedHeader}
        {prerequisites.ready ? (
          <Alert title="Analysis is ready to begin" tone="neutral">
            The canonical prerequisites are complete, but no successful analysis
            run has been recorded.
          </Alert>
        ) : (
          <Alert title="Structured Analysis is blocked" tone="warning">
            <p>Complete the canonical prerequisites before starting analysis.</p>
            <ul className="mt-2 list-disc pl-5">
              {unmet.map((item) => (
                <li key={item.id}>{item.label}</li>
              ))}
            </ul>
          </Alert>
        )}
        <StateLink href="/case/demo/intake">Open Documents</StateLink>
      </div>
    );
  }

  if (laneCandidates.length === 0) {
    return (
      <div className="grid gap-5">
        {sharedHeader}
        <Alert
          title={
            activeRun.candidateCount === 0
              ? "Analysis completed with zero candidates"
              : "No structured lane candidates are available"
          }
          tone="neutral"
        >
          A successful run may legitimately return no candidates. No favourable,
          adverse, or legal conclusion is inferred from an empty result.
        </Alert>
      </div>
    );
  }

  return (
    <div
      className={
        sourceMode === "desktop" && sourceSelection
          ? "flex items-start"
          : "relative"
      }
    >
      <div
        aria-hidden={
          sourceSelection && sourceMode === "mobile" ? "true" : undefined
        }
        className="grid min-w-0 flex-1 gap-4"
        ref={workspaceRef}
      >
        {sharedHeader}

        {state.coverage.hasConsequentialOpenIssue ? (
          <Alert title="Structured review is coverage-blocked" tone="danger">
            A consequential coverage issue remains open. Missing content is not
            inferred, and affected positive acceptance and export remain blocked.
          </Alert>
        ) : openCoverageIssues.length ? (
          <Alert title="Coverage warning" tone="warning">
            {openCoverageIssues.length} source coverage{" "}
            {openCoverageIssues.length === 1 ? "limitation remains" : "limitations remain"}{" "}
            visible. The analysis does not fill missing or unreadable content.
          </Alert>
        ) : null}

        <section
          aria-label="Structured analysis filters"
          className="grid gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5"
        >
          <div
            aria-label="Review status filters"
            className="flex flex-wrap gap-1.5"
            role="group"
          >
            {STATUS_FILTERS.map((filter) => (
              <button
                aria-label={`${filter.label} (${statusCounts[filter.id]})`}
                aria-pressed={statusFilter === filter.id}
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                  statusFilter === filter.id
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-subtle)]"
                }`}
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                type="button"
              >
                {filter.label}
                <span className="font-mono text-[10px]">
                  {statusCounts[filter.id]}
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_auto_auto_auto]">
            <label className="relative">
              <span className="sr-only">Search candidates</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                size={15}
              />
              <Input
                aria-label="Search candidates"
                className="pl-9"
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder="Search candidates"
                type="search"
                value={query}
              />
            </label>
            <label className="flex items-center gap-2">
              <Filter
                aria-hidden="true"
                className="text-[var(--color-ink-muted)]"
                size={14}
              />
              <span className="sr-only">Origin filter</span>
              <Select
                aria-label="Origin filter"
                onChange={(event) =>
                  setOriginFilter(event.currentTarget.value as OriginFilter)
                }
                value={originFilter}
              >
                <option value="all">All origins</option>
                {Object.entries(ORIGIN_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              <span className="sr-only">Support filter</span>
              <Select
                aria-label="Support filter"
                onChange={(event) =>
                  setSupportFilter(event.currentTarget.value as SupportFilter)
                }
                value={supportFilter}
              >
                <option value="all">All support states</option>
                {Object.entries(SUPPORT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
            <Button
              className="min-h-9 px-3 py-1.5"
              disabled={!filtersActive}
              onClick={clearFilters}
              variant="secondary"
            >
              Clear filters
            </Button>
          </div>
          <p aria-live="polite" className="text-xs text-[var(--color-ink-muted)]">
            Showing {visibleCandidates.length} of {laneCandidates.length} canonical
            lane candidates.
          </p>
        </section>

        <div
          className="grid min-w-0 gap-4 lg:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.45fr)]"
          id="structured-analysis-workspace"
        >
          <CandidateList
            candidates={visibleCandidates}
            onClear={clearFilters}
            onSelect={setSelectedCandidateId}
            selectedId={selectedCandidate?.id ?? null}
          />
          {selectedCandidate ? (
            <CandidateDetail
              candidate={selectedCandidate}
              key={selectedCandidate.id}
              onOpenSource={setSourceSelection}
              onWithdrawRequest={(candidate) =>
                setWithdrawalCandidateId(candidate.id)
              }
              state={state}
            />
          ) : (
            <section
              aria-label="No visible candidate detail"
              className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] p-5"
            >
              <h2 className="font-serif text-lg">No candidate detail displayed</h2>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                The current projections contain no visible candidate. A hidden
                selection is never retained in this panel.
              </p>
            </section>
          )}
        </div>

        {withdrawalCandidate || state.dependencyChanges.length ? (
          <DependencyChangePanel
            candidateToWithdraw={withdrawalCandidate}
            onCancelWithdrawal={() => setWithdrawalCandidateId(null)}
            onCommand={dispatchCaseCommand}
            state={state}
          />
        ) : null}

        <p className="flex items-start gap-2 text-xs leading-5 text-[var(--color-ink-muted)]">
          <ShieldCheck
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={16}
          />
          Suggestions remain non-binding. Evidence Gaps, Evidence Integrity Map,
          and Timeline remain separate review destinations.
        </p>
      </div>

      <SourceDrawer
        mode={sourceMode}
        onClose={() => setSourceSelection(null)}
        onCommand={dispatchCaseCommand}
        selection={sourceSelection}
        state={state}
      />
    </div>
  );
}
