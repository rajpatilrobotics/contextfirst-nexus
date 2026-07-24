"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertOctagon,
  CheckSquare,
  Clock3,
  FileText,
  HandHelping,
  HelpCircle,
  Home,
  MessageSquare,
  Network,
  NotebookPen,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../ui";
import { CaseStatusBadge, NavigationProgressStatus } from "../status";
import { deriveAnalysisPrerequisites } from "../../features/documents/analysis-prerequisites";
import { analysisRunInputMatchesState } from "../../lib/analysis/freshness";
import type { AnalysisRun, CaseCommand, CaseState, StageStatus } from "../../lib/contracts";
import { deriveCaseStatus } from "../../lib/state";
import { CaseStateProvider, useCaseState } from "./case-state-context";

export const SYNTHETIC_BANNER_TEXT =
  "Bundled fictional M. Chen judge fixture. Do not upload or enter real case data.";

export const STEP_NAVIGATION = [
  { id: "purpose", label: "Purpose", index: 1 },
  { id: "documents", label: "Documents", index: 2 },
  { id: "analysis", label: "Analysis", index: 3 },
  { id: "planning", label: "Planning", index: 4 },
  { id: "review", label: "Review", index: 5 },
  { id: "export", label: "Export", index: 6 },
] as const;

type StepId = (typeof STEP_NAVIGATION)[number]["id"];
type NavigationIcon = ComponentType<{ "aria-hidden"?: boolean | "true"; size?: number }>;

type WorkspaceNavigationItem = {
  group: "Intake" | "Analysis" | "Planning" | "Review" | "Export";
  href: string | null;
  icon: NavigationIcon;
  id:
    | "purpose"
    | "documents"
    | "structured-analysis"
    | "urgent-needs"
    | "evidence-gaps"
    | "interview"
    | "services"
    | "tasks"
    | "notes"
    | "integrity-map"
    | "timeline"
    | "export";
  label: string;
  stage: StepId;
};

export const WORKSPACE_NAVIGATION: readonly WorkspaceNavigationItem[] = [
  {
    group: "Intake",
    href: "/case/demo/purpose",
    icon: FileText,
    id: "purpose",
    label: "Purpose Brief",
    stage: "purpose",
  },
  {
    group: "Intake",
    href: "/case/demo/intake",
    icon: FileText,
    id: "documents",
    label: "Documents & Source Health",
    stage: "documents",
  },
  {
    group: "Analysis",
    href: "/case/demo/review#review-workspace",
    icon: Search,
    id: "structured-analysis",
    label: "Structured Analysis",
    stage: "analysis",
  },
  {
    group: "Analysis",
    href: null,
    icon: AlertOctagon,
    id: "urgent-needs",
    label: "Urgent Needs",
    stage: "analysis",
  },
  {
    group: "Analysis",
    href: "/case/demo/review#context-gaps-heading",
    icon: HelpCircle,
    id: "evidence-gaps",
    label: "Evidence Gaps",
    stage: "analysis",
  },
  {
    group: "Planning",
    href: null,
    icon: MessageSquare,
    id: "interview",
    label: "Interview Planner",
    stage: "planning",
  },
  {
    group: "Planning",
    href: null,
    icon: HandHelping,
    id: "services",
    label: "Services & Referrals",
    stage: "planning",
  },
  {
    group: "Planning",
    href: null,
    icon: CheckSquare,
    id: "tasks",
    label: "Case Tasks",
    stage: "planning",
  },
  {
    group: "Planning",
    href: null,
    icon: NotebookPen,
    id: "notes",
    label: "Notes & Journal",
    stage: "planning",
  },
  {
    group: "Review",
    href: "/case/demo/review#nexus",
    icon: Network,
    id: "integrity-map",
    label: "Evidence Integrity Map",
    stage: "review",
  },
  {
    group: "Review",
    href: "/case/demo/review#timeline",
    icon: Clock3,
    id: "timeline",
    label: "Timeline",
    stage: "review",
  },
  {
    group: "Export",
    href: "/case/demo/export",
    icon: Send,
    id: "export",
    label: "Export Gate",
    stage: "export",
  },
] as const;

const NAVIGATION_GROUPS = ["Intake", "Analysis", "Planning", "Review", "Export"] as const;
const DOCUMENT_PREPARATION_STAGES = new Set([
  "intake_validation",
  "text_extraction",
  "coverage_calculation",
  "identifier_masking",
]);
const DOCUMENT_PREREQUISITE_IDS = new Set([
  "sources",
  "coverage",
  "candidate-sources",
  "masking",
  "leak-scan",
]);

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
  if (path.includes("/intake")) return "documents";
  if (path.includes("/review")) {
    if (path.includes("#nexus") || path.includes("#timeline")) return "review";
    return "analysis";
  }
  if (path.includes("/export")) return "export";
  return "purpose";
}

export function deriveStepProgress(stepId: StepId, state: CaseState): StageStatus {
  const purposeComplete = state.purposeBrief?.status === "complete";
  const activeRun = state.analysisRuns.find((run) => run.id === state.activeAnalysisRunId) ?? null;
  const prerequisites = deriveAnalysisPrerequisites(state);
  const documentPreparation = state.processing.filter((stage) =>
    DOCUMENT_PREPARATION_STAGES.has(stage.name),
  );
  const documentPreparationStarted =
    state.documents.length > 0 || documentPreparation.length > 0;
  const documentPreparationFailed = documentPreparation.some(
    (stage) => stage.status === "failed",
  );
  const documentsReady = prerequisites.items
    .filter((item) => DOCUMENT_PREREQUISITE_IDS.has(item.id))
    .every((item) => item.satisfied);
  const analysisPending =
    Boolean(state.pendingLiveAnalysis) ||
    state.processing.some(
      (stage) => stage.name === "candidate_extraction" && stage.status === "active",
    );
  const analysisSucceeded =
    !analysisPending &&
    activeRun?.status === "succeeded" &&
    analysisRunInputMatchesState(state, activeRun);
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
    if (documentPreparationFailed) return "failed";
    if (documentsReady) return "completed";
    return purposeComplete || documentPreparationStarted ? "active" : "pending";
  }
  if (stepId === "analysis") {
    if (analysisPending) return documentsReady ? "active" : "pending";
    if (analysisFailed) return "failed";
    if (analysisSucceeded) return "completed";
    return prerequisites.ready ? "active" : "pending";
  }
  if (stepId === "planning") {
    return "pending";
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
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    if (currentPath || typeof window === "undefined") return;
    const syncHash = () => setCurrentHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [currentPath, pathname]);

  const activePath = currentPath ?? `${pathname ?? ""}${currentHash}`;
  const currentStep = deriveCurrentStep(activePath);
  const activeDestination = deriveActiveDestination(activePath);
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
      <div
        className="border-b border-[color-mix(in_oklab,var(--amber)_42%,transparent)] bg-[color-mix(in_oklab,var(--amber)_11%,transparent)] px-4 py-1.5 text-center text-xs font-semibold text-[var(--color-ink)]"
        role="note"
      >
        {SYNTHETIC_BANNER_TEXT}
      </div>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_94%,transparent)] shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <a
            className="mr-auto inline-flex items-baseline gap-2 text-[var(--color-ink)] no-underline"
            href="/"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 -translate-y-px rounded-full bg-[var(--amber)]"
            />
            <span className="font-serif text-base font-semibold">
              ContextFirst <em className="font-normal text-[var(--color-ink-muted)]">Nexus</em>
            </span>
          </a>
          <dl className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:order-none sm:w-auto">
            <div>
              <dt className="sr-only">Display case reference</dt>
              <dd className="font-mono">REF-2024-0047-SYN</dd>
            </div>
            <div>
              <dt className="sr-only">Canonical case ID</dt>
              <dd className="text-[var(--color-ink-muted)]">{state.caseId}</dd>
            </div>
            <div>
              <dt className="sr-only">Assigned practitioner</dt>
              <dd>M. Chen</dd>
            </div>
            <div>
              <dt className="sr-only">Current section</dt>
              <dd className="font-semibold">
                {STEP_NAVIGATION.find((step) => step.id === currentStep)?.label}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Case status</dt>
              <dd><CaseStatusBadge value={caseStatus} /></dd>
            </div>
            <div className="text-[var(--color-ink-muted)]">
              <dt className="sr-only">Analysis status</dt>
              <dd>{provenance.analysisStatusLabel}</dd>
            </div>
            {provenance.checkpointLabel ? (
              <div className="text-[var(--color-ink-muted)]">
                <dt className="sr-only">Checkpoint provenance</dt>
                <dd>{provenance.checkpointLabel}</dd>
              </div>
            ) : null}
          </dl>
          <a
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
            href="/dashboard"
          >
            <Home aria-hidden="true" size={15} />
            Dashboard
          </a>
          <a
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
            href="/trust"
          >
            <ShieldCheck aria-hidden="true" size={15} />
            Trust
          </a>
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
        </div>

        <section
          aria-label="Six-stage case progress"
          className="border-t border-[var(--color-border)]"
        >
          <ol className="mx-auto grid w-full max-w-[1600px] grid-cols-2 gap-1 px-3 py-2 min-[560px]:grid-cols-3 lg:grid-cols-6 lg:px-5">
            {STEP_NAVIGATION.map((step) => {
              const progress = deriveStepProgress(step.id, state);
              const isCurrent = step.id === currentStep;
              return (
                <li
                  aria-current={isCurrent ? "step" : undefined}
                  className={`min-w-0 rounded-[var(--radius-control)] border px-2 py-2 ${
                    isCurrent
                      ? "border-[var(--amber)] bg-[color-mix(in_oklab,var(--amber)_10%,transparent)]"
                      : "border-transparent"
                  }`}
                  key={step.id}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                        isCurrent
                          ? "border-[var(--amber)]"
                          : "border-[var(--color-border-strong)]"
                      }`}
                    >
                      {step.index}
                    </span>
                    <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em]">
                      {step.label}
                    </span>
                  </div>
                  <div className="mt-1 pl-8">
                    <NavigationProgressStatus value={progress} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_58%,transparent)] lg:min-h-[calc(100vh-170px)] lg:border-b-0 lg:border-r">
          <nav aria-label="Case workspace" className="grid gap-4 p-3 sm:grid-cols-2 lg:block">
            {NAVIGATION_GROUPS.map((group) => (
              <section className="mb-4" key={group}>
                <h2 className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
                  {group}
                </h2>
                <ul className="space-y-0.5">
                  {WORKSPACE_NAVIGATION.filter((item) => item.group === group).map((item) => {
                    const Icon = item.icon;
                    const active = item.id === activeDestination;
                    return (
                      <li key={item.id}>
                        {item.href ? (
                          <a
                            aria-current={active ? "page" : undefined}
                            className={`flex min-h-10 items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-sm no-underline ${
                              active
                                ? "bg-[var(--color-brand)] font-semibold !text-white"
                                : "text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
                            }`}
                            href={item.href}
                          >
                            <Icon aria-hidden="true" size={16} />
                            <span>{item.label}</span>
                          </a>
                        ) : (
                          <span
                            aria-disabled="true"
                            className="flex min-h-10 items-center gap-2 rounded-[var(--radius-control)] px-2 py-1.5 text-sm text-[var(--color-ink-muted)]"
                            title="This destination will be connected in a later integration slice."
                          >
                            <Icon aria-hidden="true" size={16} />
                            <span>{item.label}</span>
                            <span className="ml-auto rounded-full border border-[var(--color-border)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]">
                              Later
                            </span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>
        </aside>

        <main
          aria-labelledby="case-workspace-heading"
          className="min-h-[520px] min-w-0 px-4 py-5 lg:px-6"
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

function deriveActiveDestination(path: string): WorkspaceNavigationItem["id"] {
  if (path.includes("/intake")) return "documents";
  if (path.includes("/export")) return "export";
  if (path.includes("#context-gaps-heading")) return "evidence-gaps";
  if (path.includes("#nexus")) return "integrity-map";
  if (path.includes("#timeline")) return "timeline";
  if (path.includes("/review")) return "structured-analysis";
  return "purpose";
}
