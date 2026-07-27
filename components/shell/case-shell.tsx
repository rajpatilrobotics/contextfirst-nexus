"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  ScrollText,
} from "lucide-react";
import { ExportStatusChip, SyntheticBanner } from "../lovable/nexus-ui";
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
type NavigationIcon = ComponentType<{
  "aria-hidden"?: boolean | "true";
  className?: string;
  size?: number;
}>;

type WorkspaceNavigationItem = {
  group: "Intake" | "Analysis" | "Planning" | "Review" | "Export" | "Trust";
  href: string;
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
    | "export"
    | "audit"
    | "trust";
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
    href: "/case/demo/documents",
    icon: FileText,
    id: "documents",
    label: "Documents",
    stage: "documents",
  },
  {
    group: "Analysis",
    href: "/case/demo/analysis",
    icon: Search,
    id: "structured-analysis",
    label: "Structured Analysis",
    stage: "analysis",
  },
  {
    group: "Analysis",
    href: "/case/demo/urgent-needs",
    icon: AlertOctagon,
    id: "urgent-needs",
    label: "Urgent Needs",
    stage: "analysis",
  },
  {
    group: "Analysis",
    href: "/case/demo/gaps",
    icon: HelpCircle,
    id: "evidence-gaps",
    label: "Evidence Gaps",
    stage: "analysis",
  },
  {
    group: "Planning",
    href: "/case/demo/interview",
    icon: MessageSquare,
    id: "interview",
    label: "Interview Planner",
    stage: "planning",
  },
  {
    group: "Planning",
    href: "/case/demo/services",
    icon: HandHelping,
    id: "services",
    label: "Services & Referrals",
    stage: "planning",
  },
  {
    group: "Planning",
    href: "/case/demo/tasks",
    icon: CheckSquare,
    id: "tasks",
    label: "Case Tasks",
    stage: "planning",
  },
  {
    group: "Planning",
    href: "/case/demo/notes",
    icon: NotebookPen,
    id: "notes",
    label: "Notes & Journal",
    stage: "planning",
  },
  {
    group: "Review",
    href: "/case/demo/nexus",
    icon: Network,
    id: "integrity-map",
    label: "Charge–Coercion Nexus",
    stage: "review",
  },
  {
    group: "Review",
    href: "/case/demo/timeline",
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
  {
    group: "Trust",
    href: "/case/demo/audit",
    icon: ScrollText,
    id: "audit",
    label: "Audit Trail",
    stage: "export",
  },
  {
    group: "Trust",
    href: "/trust",
    icon: ShieldCheck,
    id: "trust",
    label: "Trust & Safety",
    stage: "export",
  },
] as const;

const NAVIGATION_GROUPS = [
  "Intake",
  "Analysis",
  "Planning",
  "Review",
  "Export",
] as const;
const STEP_DESTINATIONS: Record<StepId, string> = {
  purpose: "/case/demo/purpose",
  documents: "/case/demo/documents",
  analysis: "/case/demo/analysis",
  planning: "/case/demo/interview",
  review: "/case/demo/nexus",
  export: "/case/demo/export",
};
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
  if (path.includes("/intake") || path.includes("/documents")) return "documents";
  if (
    path.includes("/analysis") ||
    path.includes("/urgent-needs") ||
    path.includes("/gaps")
  ) return "analysis";
  if (path.includes("/review#nexus") || path.includes("/review#timeline")) {
    return "review";
  }
  if (path.includes("/review")) return "analysis";
  if (
    path.includes("/interview") ||
    path.includes("/services") ||
    path.includes("/tasks") ||
    path.includes("/notes")
  ) return "planning";
  if (path.includes("/nexus") || path.includes("/timeline")) return "review";
  if (
    path.includes("/export") ||
    path.includes("/audit") ||
    path === "/trust"
  ) return "export";
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
  const exportChipState =
    state.exportGate?.caseRevision === state.caseRevision &&
    state.exportGate.status === "ready"
      ? "Ready"
      : state.exportGate?.freshness === "current" &&
          state.exportGate.status === "blocked"
        ? "Blocked"
        : "Pending";

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
    <div className="min-h-screen overflow-x-clip bg-background text-foreground lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2"
        href="#case-workspace"
      >
        Skip to case workspace
      </a>
      <div
        className="sticky top-0 z-40 shrink-0 bg-background shadow-[0_1px_0_var(--border)]"
        data-testid="workspace-sticky-header"
      >
        <SyntheticBanner compact />
        <span className="sr-only">{SYNTHETIC_BANNER_TEXT}</span>
        <header className="border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 -translate-y-0.5 rounded-full bg-[color:var(--amber)]"
              />
              <span className="font-serif text-base">
                ContextFirst <span className="italic text-muted-foreground">Nexus</span>
              </span>
            </Link>
            <span className="hidden text-border sm:inline">·</span>
            <div className="hidden text-xs sm:block">
              <span className="font-mono text-foreground">REF-2024-0047-SYN</span>
              <span className="mx-2 text-border">·</span>
              <span className="text-muted-foreground">Assigned</span> M. Chen
              <span className="mx-2 text-border">·</span>
              <span className="text-muted-foreground">
                {state.documents.length} documents
              </span>
              <span className="sr-only">
                Canonical case {state.caseId}. {provenance.analysisStatusLabel}.
                {provenance.checkpointLabel ? ` ${provenance.checkpointLabel}.` : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportStatusChip state={exportChipState} />
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" aria-hidden /> Dashboard
            </a>
            <button
              aria-label="Reset Case — reset demonstration"
              aria-describedby="reset-case-note"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              type="button"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset demonstration
            </button>
          </div>
          <p className="sr-only" id="reset-case-note">
            Reset uses the central case command and returns the browser session to the
            bundled demo case.
          </p>
          {resetMessage ? (
            <p className="w-full text-xs text-muted-foreground" role="status">
              {resetMessage}
            </p>
          ) : null}
          <dl className="sr-only">
            <div>
              <dt>Current section</dt>
              <dd>
                {STEP_NAVIGATION.find((step) => step.id === currentStep)?.label}
              </dd>
            </div>
            <div aria-label={`Case status: ${caseStatus}`}>
              <dt>Case status</dt>
              <dd>{caseStatus}</dd>
            </div>
            <div>
              <dt>Analysis status</dt>
              <dd>{provenance.analysisStatusLabel}</dd>
            </div>
            {provenance.checkpointLabel ? (
              <div>
                <dt>Checkpoint provenance</dt>
                <dd>{provenance.checkpointLabel}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <section
          aria-label="Six-stage case progress"
          className="max-w-full overflow-hidden sm:overflow-x-auto"
        >
          <ol className="mx-auto grid grid-cols-3 gap-x-3 gap-y-2 px-6 pb-3 sm:flex sm:w-max sm:min-w-full sm:flex-nowrap sm:items-center sm:gap-2">
            {STEP_NAVIGATION.map((step, index) => {
            const progress = deriveStepProgress(step.id, state);
            const isCurrent = step.id === currentStep;
            const numberStyle = isCurrent
              ? "border-[color:var(--amber)] bg-[color-mix(in_oklab,var(--amber)_20%,transparent)] text-foreground"
              : progress === "completed"
                ? "border-[color:var(--sage)] bg-[color-mix(in_oklab,var(--sage)_20%,transparent)] text-foreground"
                : progress === "failed"
                  ? "border-[color:var(--rust)] bg-[color-mix(in_oklab,var(--rust)_12%,transparent)] text-[color:var(--rust)]"
                  : "border-border text-muted-foreground";
            return (
              <li key={step.id} className="flex min-w-0 items-center gap-2">
                <a
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Open ${
                    step.id === "analysis" ? "Structured Analysis" : step.label
                  }`}
                  className="flex items-center gap-2"
                  href={STEP_DESTINATIONS[step.id]}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[10px] ${numberStyle}`}
                  >
                    {step.index}
                  </span>
                  <span
                    className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="sr-only">, {progress}</span>
                </a>
                {index < STEP_NAVIGATION.length - 1 ? (
                  <span
                    className="mx-1 hidden h-px w-8 bg-border sm:block"
                    aria-hidden
                  />
                ) : null}
              </li>
            );
            })}
          </ol>
        </section>
        </header>
      </div>

      <div className="border-b border-border bg-muted/40 px-6 py-2 text-xs text-muted-foreground lg:hidden">
        This case workspace is designed for a display of 1280px or wider. Sidebar
        navigation still works on smaller screens.
      </div>

      <div className="mx-auto grid w-full grid-cols-1 gap-0 lg:min-h-0 lg:flex-1 lg:grid-cols-[210px_1fr] lg:overflow-hidden">
        <aside
          className="border-r border-border bg-card/40 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
          data-testid="workspace-sticky-sidebar"
        >
          <nav aria-label="Case workspace" className="p-3">
            {NAVIGATION_GROUPS.map((group) => (
              <div className="mb-4" key={group}>
                <div className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {group}
                </div>
                <ul className="space-y-0.5">
                  {WORKSPACE_NAVIGATION.filter((item) => item.group === group).map(
                    (item) => {
                      const Icon = item.icon;
                      const active = item.id === activeDestination;
                      return (
                        <li key={item.id}>
                          <a
                            aria-current={active ? "page" : undefined}
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                              active
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground/80 hover:bg-muted"
                            }`}
                            href={item.href}
                          >
                            <Icon className="h-4 w-4 opacity-80" aria-hidden />
                            <span>{item.label}</span>
                          </a>
                        </li>
                      );
                    },
                  )}
                </ul>
              </div>
            ))}
            <div className="mt-6 border-t border-border pt-3">
              {WORKSPACE_NAVIGATION.filter((item) => item.id === "audit").map(
                (item) => {
                  const Icon = item.icon;
                  const active = item.id === activeDestination;
                  return (
                    <a
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:bg-muted"
                      }`}
                      href={item.href}
                      key={item.id}
                    >
                      <Icon className="h-4 w-4 opacity-80" aria-hidden />
                      <span>{item.label}</span>
                    </a>
                  );
                },
              )}
            </div>
          </nav>
        </aside>

        <main
          className="min-w-0 px-6 py-6 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
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
  if (path.includes("/intake") || path.includes("/documents")) return "documents";
  if (path.includes("/analysis")) return "structured-analysis";
  if (path.includes("/urgent-needs")) return "urgent-needs";
  if (path.includes("/gaps")) return "evidence-gaps";
  if (path.includes("/interview")) return "interview";
  if (path.includes("/services")) return "services";
  if (path.includes("/tasks")) return "tasks";
  if (path.includes("/notes")) return "notes";
  if (path.includes("/nexus")) return "integrity-map";
  if (path.includes("/timeline")) return "timeline";
  if (path.includes("/export")) return "export";
  if (path.includes("/audit")) return "audit";
  if (path === "/trust") return "trust";
  if (path.includes("#context-gaps-heading")) return "evidence-gaps";
  if (path.includes("#nexus")) return "integrity-map";
  if (path.includes("#timeline")) return "timeline";
  if (path.includes("/review")) return "structured-analysis";
  return "purpose";
}
