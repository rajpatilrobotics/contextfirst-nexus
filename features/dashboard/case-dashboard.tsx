"use client";

import {
  AlertOctagon,
  ArrowRight,
  Plus,
  User,
} from "lucide-react";
import { useState } from "react";
import {
  Chip,
  DemoOnlyNotice,
  ExportStatusChip,
  SummaryMetric,
} from "../../components/lovable/nexus-ui";
import { CaseStateProvider, useCaseState } from "../../components/shell";
import { analysisRunInputMatchesState } from "../../lib/analysis/freshness";
import type { CaseState } from "../../lib/contracts";
import { derivePlanningDashboardCounts } from "../../lib/planning";

export const PRIMARY_CASE_DISPLAY_ID = "REF-2024-0047-SYN";

const readOnlyCases = [
  {
    displayId: "REF-2024-0031-SYN",
    exportState: "Pending" as const,
    practitioner: "A. Okafor",
  },
  {
    displayId: "REF-2024-0029-SYN",
    exportState: "Pending" as const,
    practitioner: "R. Salazar",
  },
] as const;

export type PrimaryCaseSummary = {
  analysisStatus: string;
  documentCount: number;
  exportStatus: string;
  openGapCount: number;
  openTaskCount: number;
  openUrgentNeedCount: number;
  overdueTaskCount: number;
  pendingInterviewQuestionCount: number;
  pendingReviewCount: number;
  referralPlanCount: number;
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
  const planning = derivePlanningDashboardCounts(state);

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
    openTaskCount: planning.openTasks,
    openUrgentNeedCount: planning.openUrgentNeeds,
    overdueTaskCount: planning.overdueTasks,
    pendingInterviewQuestionCount: planning.pendingInterviewQuestions,
    pendingReviewCount,
    referralPlanCount: planning.referralPlans,
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
  const [modalOpen, setModalOpen] = useState(false);
  const exportChipState: "Blocked" | "Pending" | "Ready" =
    summary.exportStatus === "Ready" || summary.exportStatus === "Exported"
      ? "Ready"
      : summary.exportStatus === "Blocked"
        ? "Blocked"
        : "Pending";

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Case Dashboard
            </div>
            <h1 className="mt-1 font-serif text-3xl">Open cases &amp; readiness</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Fictional caseload for demonstration. Only M. Chen has a connected
              functional workspace; the other cards are clearly read-only.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
            type="button"
          >
            <Plus className="h-4 w-4" /> New case
            <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              demo
            </span>
          </button>
        </div>

        {summary.openUrgentNeedCount > 0 ? (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-[color-mix(in_oklab,var(--rust)_35%,transparent)] bg-[color-mix(in_oklab,var(--rust)_8%,transparent)] p-4">
            <AlertOctagon className="mt-0.5 h-5 w-5 text-[color:var(--rust)]" />
            <div className="flex-1">
              <div className="font-serif text-base">Immediate-attention notice</div>
              <div className="text-sm text-muted-foreground">
                {PRIMARY_CASE_DISPLAY_ID} has {summary.openUrgentNeedCount} active
                urgent {summary.openUrgentNeedCount === 1 ? "need" : "needs"} requiring
                practitioner attention.
              </div>
            </div>
            <a
              href="/case/demo/urgent-needs"
              className="self-center rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
            >
              Open urgent needs
            </a>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryMetric label="Open cases" value={1} hint="2 read-only summaries" />
          <SummaryMetric
            label="Pending review"
            value={summary.pendingReviewCount}
            hint="candidates"
          />
          <SummaryMetric
            label="Export-ready"
            value={exportChipState === "Ready" ? 1 : 0}
          />
          <SummaryMetric label="Overdue tasks" value={summary.overdueTaskCount} />
          <SummaryMetric
            label="Active urgent needs"
            value={summary.openUrgentNeedCount}
          />
          <SummaryMetric label="Open evidence gaps" value={summary.openGapCount} />
        </div>

        <div className="mt-8">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Recently active
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <a
              aria-label={`Open workspace for M. Chen (${PRIMARY_CASE_DISPLAY_ID})`}
              className="group flex cursor-pointer flex-col rounded-xl border border-border bg-card p-5 text-left no-underline transition hover:border-[color:var(--amber)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
              href="/case/demo/purpose"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {PRIMARY_CASE_DISPLAY_ID}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> M. Chen
                  </div>
                </div>
                <ExportStatusChip state={exportChipState} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Documents</dt>
                  <dd className="text-foreground">{summary.documentCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Analysis</dt>
                  <dd>{summary.analysisStatus}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Review</dt>
                  <dd>{summary.pendingReviewCount} pending</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Urgent needs</dt>
                  <dd>{summary.openUrgentNeedCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Evidence gaps</dt>
                  <dd>{summary.openGapCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tasks</dt>
                  <dd>{summary.openTaskCount}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {summary.openUrgentNeedCount > 0 ? (
                  <Chip tone="rust">Urgent need</Chip>
                ) : null}
                {summary.openGapCount > 0 ? (
                  <Chip tone="amber">{summary.openGapCount} gaps</Chip>
                ) : null}
                {summary.openTaskCount > 0 ? (
                  <Chip tone="neutral">{summary.openTaskCount} tasks</Chip>
                ) : null}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">
                  Browser-session canonical state
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground group-hover:text-[color:var(--amber)]">
                  Open workspace <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </a>

            {readOnlyCases.map((caseProfile) => (
              <article
                aria-label={`${caseProfile.displayId}, read-only case summary`}
                className="flex flex-col rounded-xl border border-border bg-card p-5 text-left opacity-80"
                key={caseProfile.displayId}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {caseProfile.displayId}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                      {caseProfile.practitioner}
                    </div>
                  </div>
                  <Chip tone="mute">Read-only</Chip>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {[
                    "Documents",
                    "Analysis",
                    "Review",
                    "Urgent needs",
                    "Evidence gaps",
                    "Tasks",
                  ].map((label) => (
                    <div key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd>Unavailable</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4">
                  <Chip tone="neutral">No connected fixture</Chip>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="text-muted-foreground">
                    No M. Chen data is shown
                  </span>
                  <span className="font-medium text-muted-foreground">
                    Workspace unavailable
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-case-title"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5">
            <h2 className="font-serif text-xl" id="new-case-title">
              New case
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Case creation is not available in this bundled fictional demonstration.
            </p>
            <div className="mt-3">
              <DemoOnlyNotice>
                one connected M. Chen fixture is available; no new case is created.
              </DemoOnlyNotice>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
