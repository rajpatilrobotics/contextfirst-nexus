"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "../ui";
import { CaseStatusBadge, NavigationProgressStatus } from "../status";
import type { AnalysisRun, CaseCommand, CaseState, CaseStatus, StageStatus } from "../../lib/contracts";
import {
  deriveCaseStatus,
} from "../../lib/state";
import { CaseStateProvider, useCaseState } from "./case-state-context";

export const SYNTHETIC_BANNER_TEXT =
  "Synthetic training case. Do not upload or enter real case data.";

export const STEP_NAVIGATION = [
  { id: "purpose", label: "Purpose", href: "/case/demo/purpose" },
  { id: "documents", label: "Documents", href: "/case/demo/documents" },
  { id: "review", label: "Review", href: "/case/demo/review" },
  { id: "export", label: "Export", href: "/case/demo/export" },
] as const;

type StepId = (typeof STEP_NAVIGATION)[number]["id"];

const providerLabels: Record<string, string> = {
  openai: "OpenAI",
  google_gemini: "Gemini",
  mistral: "Mistral",
  local_replay: "Bundled deterministic replay, not live AI",
};

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

export function deriveStepProgress(stepId: StepId, currentStep: StepId, caseStatus: CaseStatus): StageStatus {
  if (stepId === currentStep && caseStatus === "blocked") return "failed";
  if (stepId === currentStep && caseStatus === "review_required") return "warning";
  if (stepId === currentStep) return "active";
  const stepIndex = STEP_NAVIGATION.findIndex((step) => step.id === stepId);
  const currentIndex = STEP_NAVIGATION.findIndex((step) => step.id === currentStep);
  return stepIndex < currentIndex ? "completed" : "pending";
}

export function describeRunProvenance(run: AnalysisRun | null) {
  if (!run) {
    return {
      modeLabel: "No analysis run selected",
      providerLabel: "No provider selected",
      modelLabel: "Model not selected",
      checkpointLabel: null,
    };
  }

  if (run.mode === "deterministic_replay") {
    return {
      modeLabel: "Deterministic replay",
      providerLabel: "Bundled deterministic replay, not live AI",
      modelLabel: run.provider.requestedModel,
      checkpointLabel: run.checkpointProvenance
        ? "Prepared synthetic review checkpoint"
        : null,
    };
  }

  return {
    modeLabel: "Live provider run",
    providerLabel: providerLabels[run.provider.providerId] ?? run.provider.providerId,
    modelLabel: run.provider.returnedModel ?? run.provider.requestedModel,
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
  const provenance = describeRunProvenance(activeRun);

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
    setResetMessage("Case reset to the synthetic demo start.");
  }

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-[var(--color-surface)] focus:px-4 focus:py-2"
        href="#case-workspace"
      >
        Skip to case workspace
      </a>
      <div
        className="border-b border-[var(--color-warning)] bg-[var(--color-warning-subtle)] px-4 py-3 text-sm font-semibold text-[var(--color-warning)]"
        role="note"
      >
        {SYNTHETIC_BANNER_TEXT}
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <header className="lg:col-span-2">
          <div className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-3">
              <div>
                <p className="cfn-type-label text-[var(--color-ink-muted)]">Synthetic case workspace</p>
                <h1 className="cfn-type-heading-1">ContextFirst Nexus demo case</h1>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="cfn-type-label">Case ID</dt>
                  <dd className="cfn-type-code">{state.caseId}</dd>
                </div>
                <div>
                  <dt className="cfn-type-label">Fixture version</dt>
                  <dd>{state.fixtureVersion}</dd>
                </div>
                <div>
                  <dt className="cfn-type-label">Current section</dt>
                  <dd>{STEP_NAVIGATION.find((step) => step.id === currentStep)?.label}</dd>
                </div>
                <div>
                  <dt className="cfn-type-label">Case status</dt>
                  <dd>
                    <CaseStatusBadge value={caseStatus} />
                  </dd>
                </div>
              </dl>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="cfn-type-label">Mode</dt>
                  <dd>{provenance.modeLabel}</dd>
                </div>
                <div>
                  <dt className="cfn-type-label">Provider</dt>
                  <dd>{provenance.providerLabel}</dd>
                </div>
                <div>
                  <dt className="cfn-type-label">Model</dt>
                  <dd>{provenance.modelLabel}</dd>
                </div>
                {provenance.checkpointLabel ? (
                  <div className="sm:col-span-3">
                    <dt className="cfn-type-label">Checkpoint provenance</dt>
                    <dd>{provenance.checkpointLabel}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <div className="flex items-start">
              <Button aria-describedby="reset-case-note" onClick={handleReset} variant="secondary">
                <RotateCcw aria-hidden="true" size={16} />
                Reset Case
              </Button>
            </div>
            <p className="cfn-type-body-small text-[var(--color-ink-muted)] lg:col-span-2" id="reset-case-note">
              Reset uses the central case command and returns the browser session to the bundled synthetic case.
            </p>
            {resetMessage ? (
              <p className="cfn-type-body-small text-[var(--color-supported)]" role="status">
                {resetMessage}
              </p>
            ) : null}
          </div>
        </header>

        <aside aria-label="Case step panel">
          <nav
            aria-label="Case steps"
            className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <ol className="grid gap-2">
              {STEP_NAVIGATION.map((step) => {
                const progress = deriveStepProgress(step.id, currentStep, caseStatus);
                return (
                  <li key={step.id}>
                    <a
                      aria-current={step.id === currentStep ? "step" : undefined}
                      className="grid gap-1 rounded-[var(--radius-control)] px-3 py-2 text-sm no-underline hover:bg-[var(--color-surface-subtle)]"
                      href={step.href}
                    >
                      <span className="font-semibold text-[var(--color-ink)]">{step.label}</span>
                      {" "}
                      <NavigationProgressStatus value={progress} />
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        <main
          aria-labelledby="case-workspace-heading"
          className="min-h-[520px] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
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
