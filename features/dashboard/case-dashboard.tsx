"use client";

import {
  ArrowRight,
  FileText,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  CaseStateProvider,
  WORKSPACE_NAVIGATION,
  useCaseState,
} from "../../components/shell";
import { CaseStatusBadge } from "../../components/status";
import { analysisRunInputMatchesState } from "../../lib/analysis/freshness";
import type { CaseState } from "../../lib/contracts";
import { deriveCaseStatus } from "../../lib/state";

export const PRIMARY_CASE_DISPLAY_ID = "REF-2024-0047-SYN";

const readOnlyCases = [
  { displayId: "REF-2024-0031-SYN", practitioner: "A. Okafor" },
  { displayId: "REF-2024-0029-SYN", practitioner: "R. Salazar" },
] as const;

export type PrimaryCaseSummary = {
  analysisStatus: string;
  documentCount: number;
  exportStatus: string;
  openGapCount: number;
  pendingReviewCount: number;
};

export function derivePrimaryCaseSummary(state: CaseState): PrimaryCaseSummary {
  const activeRun =
    state.analysisRuns.find((run) => run.id === state.activeAnalysisRunId) ?? null;
  const pendingReviewCount = state.candidates.filter(
    (candidate) =>
      candidate.inclusionStatus === "active" &&
      candidate.reviewRequirement === "individual" &&
      (candidate.reviewStatus === "pending" || candidate.reviewStatus === "invalidated"),
  ).length;
  const openGapCount = state.candidates.filter(
    (candidate) =>
      candidate.kind === "context_gap" &&
      candidate.inclusionStatus === "active" &&
      (candidate.responseStatus === "unanswered" || candidate.responseStatus === "deferred"),
  ).length;

  let analysisStatus = "Not started";
  if (state.pendingLiveAnalysis) analysisStatus = "Running";
  else if (activeRun?.status === "failed") analysisStatus = "Failed safely";
  else if (activeRun?.status === "succeeded") {
    if (!analysisRunInputMatchesState(state, activeRun)) {
      analysisStatus = "Needs rerun";
    } else {
      analysisStatus = activeRun.checkpointProvenance ? "Prepared checkpoint" : "Complete";
    }
  }

  let exportStatus = "Not evaluated";
  if (state.currentExportId && state.exportedRevision === state.caseRevision) {
    exportStatus = "Exported";
  } else if (
    state.exportGate?.status === "ready" &&
    state.exportGate.caseRevision === state.caseRevision
  ) {
    exportStatus = "Ready";
  } else if (
    state.exportGate?.status === "blocked" &&
    state.exportGate.freshness === "current"
  ) {
    exportStatus = "Blocked";
  }

  return {
    analysisStatus,
    documentCount: state.documents.length,
    exportStatus,
    openGapCount,
    pendingReviewCount,
  };
}

export function CaseDashboard({ initialState }: { initialState?: CaseState }) {
  return (
    <CaseStateProvider initialState={initialState}>
      <CaseDashboardContent />
    </CaseStateProvider>
  );
}

function CaseDashboardContent() {
  const { state } = useCaseState();
  const summary = derivePrimaryCaseSummary(state);
  const caseStatus = deriveCaseStatus(state);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
            Case Dashboard
          </p>
          <h1 className="mt-1 text-3xl">Open cases and workflow readiness</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-muted)]">
            One complete fictional judge workflow is available. Secondary cards are
            presentation-only summaries and cannot enter the functional workspace.
          </p>
        </div>
        <a
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
          href="/trust"
        >
          <ShieldCheck aria-hidden="true" size={16} />
          Review safety boundary
        </a>

        <nav
          aria-label="M. Chen workspace destinations"
          className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
                Direct destinations
              </p>
              <h3 className="mt-1 font-serif text-lg">Open any workspace screen</h3>
            </div>
            <span className="text-xs text-[var(--color-ink-muted)]">
              Preview routes remain separate from canonical counts and export.
            </span>
          </div>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {WORKSPACE_NAVIGATION.map((item) => (
              <li key={item.id}>
                <a
                  className="flex min-h-10 items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)] no-underline hover:border-[var(--amber)] hover:bg-[var(--color-surface-subtle)]"
                  href={item.href}
                >
                  <span>{item.label}</span>
                  <ArrowRight aria-hidden="true" size={15} />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <section
        aria-label="Functional case boundary"
        className="mt-6 flex items-start gap-3 rounded-xl border border-[color-mix(in_oklab,var(--amber)_42%,transparent)] bg-[color-mix(in_oklab,var(--amber)_10%,transparent)] p-4"
      >
        <LockKeyhole
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-[var(--color-warning)]"
          size={20}
        />
        <div>
          <h2 className="text-base">One case can open in this release</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">
            Only {PRIMARY_CASE_DISPLAY_ID}, mapped to canonical fixture {state.caseId}, has
            complete source, review, dependency, audit, and export behavior.
          </p>
        </div>
      </section>

      <section className="mt-7" aria-labelledby="primary-case-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
              Functional judge workflow
            </p>
            <h2 className="mt-1 text-2xl" id="primary-case-heading">
              M. Chen case workspace
            </h2>
          </div>
          <CaseStatusBadge value={caseStatus} />
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryMetric label="Documents selected" value={summary.documentCount} />
          <SummaryMetric label="Analysis" value={summary.analysisStatus} />
          <SummaryMetric label="Pending review" value={summary.pendingReviewCount} />
          <SummaryMetric label="Open evidence gaps" value={summary.openGapCount} />
          <SummaryMetric label="Export gate" value={summary.exportStatus} />
        </dl>

        <a
          aria-label={`Open M. Chen workspace (${PRIMARY_CASE_DISPLAY_ID})`}
          className="group mt-4 grid gap-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-[var(--color-ink)] no-underline shadow-[0_1px_0_0_var(--color-border)] transition hover:border-[var(--amber)] hover:shadow-[var(--shadow-elevated)] sm:grid-cols-[1fr_auto] sm:items-center"
          href="/case/demo/purpose"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                {PRIMARY_CASE_DISPLAY_ID}
              </span>
              <span className="rounded-full border border-[color-mix(in_oklab,var(--sage)_45%,transparent)] bg-[color-mix(in_oklab,var(--sage)_16%,transparent)] px-2 py-0.5 text-[11px] font-semibold">
                Workspace enabled
              </span>
            </div>
            <p className="mt-3 flex items-center gap-2 font-semibold">
              <UserRound aria-hidden="true" size={17} />
              M. Chen · assigned practitioner
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-ink-muted)]">
              Continue the canonical Purpose, Documents, Review, and Export workflow. All
              displayed counts above come from the current browser session’s canonical case state.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 font-semibold">
            Open workspace
            <ArrowRight
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
              size={17}
            />
          </span>
        </a>
      </section>

      <section className="mt-10" aria-labelledby="read-only-heading">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
          Read-only synthetic summaries
        </p>
        <h2 className="mt-1 text-2xl" id="read-only-heading">
          Additional case fixtures are not connected
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {readOnlyCases.map((caseProfile) => (
            <article
              aria-label={`${caseProfile.displayId}, read-only case summary`}
              className="rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-surface)_65%,transparent)] p-5"
              key={caseProfile.displayId}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-[var(--color-ink-muted)]">
                    {caseProfile.displayId}
                  </p>
                  <p className="mt-2 flex items-center gap-2 font-semibold">
                    <UserRound aria-hidden="true" size={16} />
                    {caseProfile.practitioner}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-ink-muted)]">
                  Read-only
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--color-ink-muted)]">
                No separate canonical fixture is bundled for this summary. Counts, progress,
                source material, and workspace actions are intentionally unavailable.
              </p>
              <p className="mt-4 border-t border-[var(--color-border)] pt-3 text-xs font-semibold text-[var(--color-ink-muted)]">
                Workspace access disabled
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--color-ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-xl text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}
