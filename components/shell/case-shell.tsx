"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "../ui";
import { CaseStatusBadge, NavigationProgressStatus } from "../status";
import type { AnalysisRun, CaseCommand, CaseState, StageStatus } from "../../lib/contracts";
import {
  deriveCaseStatus,
} from "../../lib/state";
import { CaseStateProvider, useCaseState } from "./case-state-context";

export const SYNTHETIC_BANNER_TEXT =
  "Fictional hackathon demo case. Do not upload or enter real case data.";

export const STEP_NAVIGATION = [
  { id: "purpose", label: "Purpose", href: "/case/demo/purpose" },
  { id: "documents", label: "Documents", href: "/case/demo/intake" },
  { id: "review", label: "Review", href: "/case/demo/review" },
  { id: "export", label: "Export", href: "/case/demo/export" },
] as const;

type StepId = (typeof STEP_NAVIGATION)[number]["id"];

function nowIso() {
  return new Date().toISOString();
}

function commandMeta(state: CaseState): CaseCommand["meta"] {
  const createdAt = nowIso();
  return {
    commandId: `cmd-reset-${createdAt}`,
    idempotencyKey: `idem-reset-${createdAt}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt,
  };
}

export function deriveCurrentStep(pathname: string | null | undefined): StepId {
  const path = pathname ?? "";
  return STEP_NAVIGATION.find((step) => path.startsWith(step.href))?.id ?? "purpose";
}

export function deriveStepProgress(stepId: StepId, state: CaseState): StageStatus {
  const purposeComplete = state.purposeBrief?.status === "complete";
  const activeRun = state.analysisRuns.find((run) => run.id === state.activeAnalysisRunId) ?? null;
  const analysisSucceeded = activeRun?.status === "succeeded" && state.candidates.length > 0;
  const processingFailed = state.processing.some((stage) => stage.status === "failed");
  const analysisFailed = activeRun?.status === "failed";
  const reviewPending = state.candidates.some(
    (candidate) =>
      candidate.inclusionStatus === "active" &&
      candidate.reviewRequirement === "individual" &&
      !["human_accepted", "human_edited", "rejected"].includes(candidate.reviewStatus),
  );
  const citationProblems = state.candidates.some(
    (candidate) =>
      candidate.inclusionStatus === "active" && candidate.supportStatus === "citation_unresolved",
  );
  const reviewComplete = analysisSucceeded && !reviewPending && !citationProblems;
  const exportComplete = Boolean(
    state.currentExportId && state.exportedRevision === state.caseRevision,
  );

  if (stepId === "purpose") return purposeComplete ? "completed" : "active";
  if (stepId === "documents") {
    if (processingFailed || analysisFailed) return "failed";
    if (analysisSucceeded) return "completed";
    return purposeComplete ? "active" : "pending";
  }
  if (stepId === "review") {
    if (reviewComplete) return "completed";
    return analysisSucceeded ? "warning" : "pending";
  }
  if (exportComplete) return "completed";
  if (state.exportGate?.status === "blocked" && state.exportGate.freshness === "current") {
    return "failed";
  }
  return reviewComplete ? "active" : "pending";
}

export function describeRunProvenance(run: AnalysisRun | null, pending = false) {
  if (pending) {
    return {
      analysisStatusLabel: "Analysis running",
      checkpointLabel: null,
    };
  }
  if (!run) {
    return {
      analysisStatusLabel: "Not started",
      checkpointLabel: null,
    };
  }

  if (run.status === "failed") {
    return {
      analysisStatusLabel: "Analysis failed",
      checkpointLabel: null,
    };
  }

  if (run.mode === "deterministic_replay") {
    return {
      analysisStatusLabel: run.checkpointProvenance
        ? "Prepared demo checkpoint active"
        : "Local replay complete",
      checkpointLabel: run.checkpointProvenance
        ? "Prepared demo review checkpoint"
        : null,
    };
  }

  return {
    analysisStatusLabel: "Analysis complete",
    checkpointLabel: null,
  };
}

type CaseShellProps = {
  children: ReactNode;
  initialState?: CaseState;
  currentPath?: string;
  onReset?: (state: CaseState, command: Extract<CaseCommand, { type: "reset_case" }>) => void;
  onNavigate?: (href: string) => void;
};

export function CaseShell({ initialState, ...props }: CaseShellProps) {
  return (
    <CaseStateProvider initialState={initialState}>
      <CaseShellContent {...props} />
    </CaseStateProvider>
  );
}

function CaseShellContent({
  children,
  currentPath,
  onReset,
  onNavigate,
}: Omit<CaseShellProps, "initialState">) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, dispatchCaseCommand } = useCaseState();
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const currentStep = deriveCurrentStep(currentPath ?? pathname);
  const caseStatus = deriveCaseStatus(state);
  const activeRun = useMemo(
    () => state.analysisRuns.find((run) => run.id === state.activeAnalysisRunId) ?? null,
    [state.activeAnalysisRunId, state.analysisRuns],
  );
  const provenance = describeRunProvenance(activeRun, Boolean(state.pendingLiveAnalysis));

  function handleReset() {
    const command: Extract<CaseCommand, { type: "reset_case" }> = {
      type: "reset_case",
      meta: commandMeta(state),
    };
    const result = dispatchCaseCommand(command);
    if (!result.ok) {
      setResetMessage("Reset could not run because the case state changed. Try again from the current case.");
      return;
    }
    onReset?.(result.state, command);
    onNavigate?.("/case/demo/purpose");
    if (!onNavigate) router.push("/case/demo/purpose");
    setResetMessage("Case reset to the demo start.");
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-[var(--color-surface)] focus:px-4 focus:py-2"
        href="#case-workspace"
      >
        Skip to case workspace
      </a>
      <div className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div
          className="border-b border-[var(--color-warning)] bg-[var(--color-warning-subtle)] px-4 py-2 text-center text-xs font-semibold text-[var(--color-warning)] sm:text-sm"
          role="note"
        >
          {SYNTHETIC_BANNER_TEXT}
        </div>
        <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:px-6">
          <div className="min-w-0 flex-1">
            <p className="cfn-type-label text-[var(--color-ink-muted)]">
              Step {STEP_NAVIGATION.findIndex((step) => step.id === currentStep) + 1} of {STEP_NAVIGATION.length}
            </p>
            <h1 className="truncate text-lg font-semibold">ContextFirst Nexus</h1>
          </div>
          <dl className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:order-none sm:w-auto sm:text-sm">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Case ID</dt>
              <dd className="cfn-type-code">{state.caseId}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Fixture version</dt>
              <dd>{state.fixtureVersion}</dd>
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <dt className="sr-only">Current section</dt>
              <dd>{STEP_NAVIGATION.find((step) => step.id === currentStep)?.label}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Case status</dt>
              <dd><CaseStatusBadge value={caseStatus} /></dd>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--color-ink-muted)]">
              <dt className="sr-only">Analysis status</dt>
              <dd>{provenance.analysisStatusLabel}</dd>
            </div>
            {provenance.checkpointLabel ? (
              <div className="flex items-center gap-1.5 text-[var(--color-ink-muted)]">
                <dt className="sr-only">Checkpoint provenance</dt>
                <dd>{provenance.checkpointLabel}</dd>
              </div>
            ) : null}
          </dl>
          <Button aria-describedby="reset-case-note" onClick={handleReset} variant="secondary">
            <RotateCcw aria-hidden="true" size={16} />
            Reset Case
          </Button>
          <p className="sr-only" id="reset-case-note">
            Reset uses the central case command and returns the browser session to the bundled demo case.
          </p>
          {resetMessage ? (
            <p className="w-full text-sm text-[var(--color-supported)]" role="status">
              {resetMessage}
            </p>
          ) : null}
        </header>

        <nav aria-label="Case steps" className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <ol className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-1 px-3 py-1 min-[520px]:grid-cols-4 lg:px-5">
            {STEP_NAVIGATION.map((step) => {
              const progress = deriveStepProgress(step.id, state);
              return (
                <li className="min-w-0" key={step.id}>
                  <a
                    aria-current={step.id === currentStep ? "step" : undefined}
                    className={`grid min-h-14 min-w-0 grid-cols-[auto_1fr] items-center gap-x-2 rounded-[var(--radius-control)] border-b-2 px-2 py-2 text-sm no-underline hover:bg-[var(--color-surface-subtle)] sm:px-3 ${
                      progress === "active" || progress === "warning" || progress === "failed"
                        ? "border-[var(--color-brand)] bg-[var(--color-surface-subtle)]"
                        : "border-transparent"
                    }`}
                    href={step.href}
                  >
                    <span className="font-semibold text-[var(--color-ink)]">
                      {step.label}<span aria-hidden="true"> </span>
                    </span>
                    <NavigationProgressStatus value={progress} />
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-6">
        <main
          aria-labelledby="case-workspace-heading"
          className="min-h-[520px]"
          id="case-workspace"
        >
          <h2 className="sr-only" id="case-workspace-heading">
            {STEP_NAVIGATION.find((step) => step.id === currentStep)?.label} workspace
          </h2>
          {children}
        </main>
      </div>
    </div>
  );
}
