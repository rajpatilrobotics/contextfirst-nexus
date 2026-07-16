"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, BadgeCheck, ExternalLink, ShieldCheck } from "lucide-react";
import { useCaseState } from "../../../components/shell";
import { Alert, Card, Skeleton } from "../../../components/ui";
import type { CaseCandidate } from "../../../lib/contracts";
import { cfnDemoFixture } from "../../../lib/fixtures";
import { Timeline } from "../timeline";
import {
  SourceDrawer,
  type SourceMode,
  type SourceSelection,
} from "../source";
import { NexusMatrix } from "../nexus";
import { ReviewLanes } from "../lanes";
import { ReviewQueue } from "../queue";
import { ContextGapList } from "../context-gaps";
import { DependencyChangePanel } from "../dependency";
import { CandidateReviewCard } from "./candidate-review-card";

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

function WorkspaceNavigation() {
  const destinations = [
    ["timeline", "Timeline"],
    ["nexus", "Nexus"],
    ["review-lanes", "Three lanes"],
    ["review-queue", "Queue"],
    ["candidate-review", "Candidate review"],
    ["context-gaps-heading", "Context gaps"],
    ["dependency-change-heading", "Dependency change"],
  ] as const;
  return (
    <nav aria-label="Review workspace sections" className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3">
      <ul className="flex flex-wrap gap-2">
        {destinations.map(([id, label]) => (
          <li key={id}>
            <a className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 font-semibold" href={`#${id}`}>
              {label}
              <ArrowDown aria-hidden="true" size={15} />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CheckpointProvenance({
  fixtureReviewerDecisionCount,
}: {
  fixtureReviewerDecisionCount: number;
}) {
  return (
    <Card className="grid gap-4 border-[var(--color-brand)] bg-[var(--color-brand-subtle)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="grid gap-1">
        <p className="cfn-type-label text-[var(--color-brand)]">Prepared demonstration state</p>
        <h2 className="cfn-type-heading-3">Prepared synthetic review checkpoint</h2>
        <p className="font-semibold">Bundled deterministic replay, not live AI</p>
        <p className="text-sm">
          No provider transmission. Seeded decisions are attributed to Fixture reviewer, not the current practitioner.
        </p>
      </div>
      <div className="grid gap-2 text-sm">
        <span className="inline-flex items-center gap-2 font-semibold">
          <BadgeCheck aria-hidden="true" size={18} />
          DEMO-CHECKPOINT-REVIEW · 1.0.0
        </span>
        <span>{fixtureReviewerDecisionCount} Fixture reviewer decisions loaded</span>
      </div>
    </Card>
  );
}

function ReviewSummary({ state }: { state: ReturnType<typeof useCaseState>["state"] }) {
  const individuallyRequired = state.candidates.filter(
    (candidate) => candidate.reviewRequirement === "individual",
  );
  const pending = individuallyRequired.filter(
    (candidate) =>
      candidate.inclusionStatus === "active" &&
      (candidate.reviewStatus === "pending" || candidate.reviewStatus === "invalidated"),
  ).length;
  const reviewed = individuallyRequired.filter((candidate) =>
    ["human_accepted", "human_edited", "rejected", "uncertain"].includes(candidate.reviewStatus),
  ).length;
  const invalidated = state.candidates.filter(
    (candidate) => candidate.reviewStatus === "invalidated",
  ).length;
  const citationProblems = state.candidates.filter(
    (candidate) => candidate.supportStatus === "citation_unresolved",
  ).length;

  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <dt className="cfn-type-label">Individual review remaining</dt>
        <dd className="mt-1 text-2xl font-bold">{pending}</dd>
      </div>
      <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <dt className="cfn-type-label">Individually reviewed</dt>
        <dd className="mt-1 text-2xl font-bold">{reviewed}</dd>
      </div>
      <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <dt className="cfn-type-label">Invalidated</dt>
        <dd className="mt-1 text-2xl font-bold">{invalidated}</dd>
      </div>
      <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <dt className="cfn-type-label">Citation problems</dt>
        <dd className="mt-1 text-2xl font-bold">{citationProblems}</dd>
      </div>
    </dl>
  );
}

export function ReviewWorkspace() {
  const { state, dispatchCaseCommand } = useCaseState();
  const sourceMode = useSourceMode();
  const [sourceSelection, setSourceSelection] = useState<SourceSelection | null>(null);
  const [withdrawalCandidateId, setWithdrawalCandidateId] = useState<string | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const reviewWorkspaceTargetRef = useRef<HTMLElement>(null);
  const activeRun = useMemo(
    () => state.analysisRuns.find((run) => run.id === state.activeAnalysisRunId) ?? null,
    [state.activeAnalysisRunId, state.analysisRuns],
  );
  const reviewCandidates = useMemo(
    () =>
      state.candidates.filter(
        (candidate) =>
          candidate.kind !== "nexus_relationship" &&
          candidate.reviewRequirement === "individual",
      ),
    [state.candidates],
  );
  const withdrawalCandidate = withdrawalCandidateId
    ? state.candidates.find((candidate) => candidate.id === withdrawalCandidateId) ?? null
    : null;
  const heroCandidateId = cfnDemoFixture.reviewDefinitions.heroTransition.triggerCandidateId;
  const earlyBlockerIds = [...cfnDemoFixture.reviewDefinitions.earlyUnresolvedBlockerIds];
  const fixtureReviewerDecisionCount = state.reviews.filter(
    (decision) => decision.actor === "fixture_reviewer",
  ).length;
  const hasCoverageWarning = state.coverage.issues.some(
    (issue) => issue.resolutionStatus !== "resolved",
  );

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    workspace.inert = Boolean(sourceSelection && sourceMode === "mobile");
    return () => {
      workspace.inert = false;
    };
  }, [sourceMode, sourceSelection]);

  useEffect(() => {
    if (window.location.hash !== "#review-workspace") return;

    const focusTimeout = window.setTimeout(() => {
      reviewWorkspaceTargetRef.current?.focus({ preventScroll: true });
    }, 0);

    return () => window.clearTimeout(focusTimeout);
  }, []);

  if (state.pendingLiveAnalysis) {
    return (
      <section aria-labelledby="review-loading-heading" className="grid gap-4">
        <h2 className="cfn-type-heading-2" id="review-loading-heading">Review workspace is preparing</h2>
        <Alert title="Analysis in progress" tone="neutral">
          The selected run has not reached a terminal accepted state. Refresh restores only the last stable state and does not confirm the remote outcome.
        </Alert>
        <Skeleton label="Loading review workspace" />
        <Skeleton label="Loading review candidates" />
      </section>
    );
  }

  if (!activeRun || activeRun.status !== "succeeded" || !state.candidates.length) {
    const failedRun = activeRun?.status === "failed";
    return (
      <section aria-labelledby="review-empty-heading" className="grid gap-4">
        <div>
          <p className="cfn-type-label text-[var(--color-ink-muted)]">Review workspace</p>
          <h2 className="cfn-type-heading-2" id="review-empty-heading">
            {failedRun ? "No accepted analysis output" : "Review has not started"}
          </h2>
        </div>
        <Alert title={failedRun ? "Analysis failed safely" : "No canonical candidates"} tone={failedRun ? "danger" : "neutral"}>
          {failedRun
            ? "The failed run created no review candidates or partial brief. Return to Documents or Purpose to choose an explicit safe next action."
            : "Load the trusted prepared checkpoint or complete the explicit analysis flow. A blank workspace does not imply success."}
        </Alert>
        <div className="flex flex-wrap gap-3">
          <a className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-[var(--color-control-border)] px-4 py-2 font-semibold" href="/case/demo/purpose">
            Return to Purpose
          </a>
          <a className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-[var(--color-control-border)] px-4 py-2 font-semibold" href="/case/demo/intake">
            Open Documents
          </a>
        </div>
      </section>
    );
  }

  return (
    <div className={sourceMode === "desktop" && sourceSelection ? "flex items-start" : "relative"}>
      <div
        aria-hidden={sourceSelection && sourceMode === "mobile" ? "true" : undefined}
        className="min-w-0 flex-1"
        ref={workspaceRef}
      >
        <div className="grid gap-10 pb-6">
          <section
            aria-labelledby="review-workspace-heading"
            className="grid gap-5"
            id="review-workspace"
            ref={reviewWorkspaceTargetRef}
            tabIndex={-1}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="max-w-3xl">
                <p className="cfn-type-label text-[var(--color-ink-muted)]">Qualified practitioner review</p>
                <h2 className="cfn-type-heading-1" id="review-workspace-heading">Review workspace</h2>
                <p className="mt-2 text-[var(--color-ink-muted)]">
                  Inspect exact masked sources, preserve limitations and unknowns, and record one consequential decision at a time.
                </p>
              </div>
              <a className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-control-border)] px-4 py-2 font-semibold" href="/trust">
                Trust and Safety
                <ExternalLink aria-hidden="true" size={16} />
              </a>
            </div>
            {activeRun.checkpointProvenance ? (
              <CheckpointProvenance fixtureReviewerDecisionCount={fixtureReviewerDecisionCount} />
            ) : (
              <Alert title={activeRun.mode === "live" ? "Live provider run" : "Bundled deterministic replay, not live AI"} tone="neutral">
                Review records belong only to the active successful run. Outputs from separate runs are not merged.
              </Alert>
            )}
            <ReviewSummary state={state} />
            {state.coverage.hasConsequentialOpenIssue ? (
              <Alert title="Review blocked by consequential coverage" tone="danger">
                A consequential source-coverage issue remains open. Affected findings and export stay blocked; missing content is not inferred.
              </Alert>
            ) : hasCoverageWarning ? (
              <Alert title="Coverage warning" tone="warning">
                D04 includes an unavailable page. It remains visible as a limitation and does not supply missing content.
              </Alert>
            ) : (
              <Alert title="Review records loaded" tone="neutral">
                Canonical candidates, citations, and review provenance are available for this active run.
              </Alert>
            )}
            <WorkspaceNavigation />
          </section>

          <section aria-label="Source-linked chronology" id="timeline">
            <Timeline
              dataState={hasCoverageWarning ? { kind: "partial", message: "D04 page 3 is unavailable and remains visible as a coverage limitation." } : { kind: "ready" }}
              onOpenSource={setSourceSelection}
              state={state}
            />
          </section>

          <NexusMatrix
            dataState={state.coverage.hasConsequentialOpenIssue ? { kind: "blocked", message: "Consequential coverage must be reviewed before affected Nexus relationships can be relied on." } : hasCoverageWarning ? { kind: "partial", message: "The packet includes an unavailable page and provenance limitations. No missing content is inferred." } : { kind: "ready" }}
            onCommand={dispatchCaseCommand}
            onOpenSource={setSourceSelection}
            state={state}
          />

          <ReviewLanes state={state} />

          <ReviewQueue earlyBlockerIds={earlyBlockerIds} state={state} />

          <section aria-labelledby="candidate-review-heading" className="grid gap-5" id="candidate-review">
            <div>
              <p className="cfn-type-label text-[var(--color-ink-muted)]">One decision at a time</p>
              <h2 className="cfn-type-heading-2" id="candidate-review-heading">Candidate review</h2>
              <p className="max-w-3xl text-sm text-[var(--color-ink-muted)]">
                Every card shows proposed wording, provenance, support, review status, dependencies, unknowns, coverage, and exact source access together. There is no bulk approval.
              </p>
            </div>
            {reviewCandidates.length ? (
              <div className="grid gap-5">
                {reviewCandidates.map((candidate) => (
                  <CandidateReviewCard
                    candidate={candidate}
                    heroCandidateId={heroCandidateId}
                    key={candidate.id}
                    onCommand={dispatchCaseCommand}
                    onOpenSource={setSourceSelection}
                    onWithdrawRequest={(selected: CaseCandidate) => setWithdrawalCandidateId(selected.id)}
                    state={state}
                  />
                ))}
              </div>
            ) : (
              <Alert title="No individually reviewable candidates" tone="neutral">
                The canonical run contains no non-Nexus candidate cards. This is an explicit empty state.
              </Alert>
            )}
          </section>

          <ContextGapList onCommand={dispatchCaseCommand} state={state} />

          <DependencyChangePanel
            candidateToWithdraw={withdrawalCandidate}
            onCancelWithdrawal={() => setWithdrawalCandidateId(null)}
            onCommand={dispatchCaseCommand}
            state={state}
          />

          <section aria-labelledby="review-trust-heading" className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck aria-hidden="true" className="mt-1 shrink-0 text-[var(--color-supported)]" size={20} />
              <div>
                <h2 className="cfn-type-heading-3" id="review-trust-heading">Trust navigation</h2>
                <p className="text-sm">
                  Provider disclosures, audit explanation, unsafe-output reporting, and measured synthetic evaluation remain on the separate Trust and Safety destination.
                </p>
              </div>
            </div>
            <a className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-control-border)] px-4 py-2 font-semibold" href="/trust">
              Open Trust and Safety
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          </section>

          <p className="flex items-start gap-2 text-sm text-[var(--color-ink-muted)]">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
            Synthetic adult fixture only. AI suggests and organizes; a qualified practitioner makes every consequential review decision.
          </p>
        </div>
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
