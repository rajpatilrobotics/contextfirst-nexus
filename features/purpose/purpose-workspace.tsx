"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, FastForward } from "lucide-react";
import {
  AnalyzeAvailabilityResponseSchema,
  type CaseCommand,
  type CasePurposeBrief,
} from "../../lib/contracts";
import { useCaseState } from "../../components/shell";
import { Alert, Button, Card, Skeleton } from "../../components/ui";
import {
  AnalysisServiceUnavailable,
} from "../analysis/provider-recovery";
import {
  resolveReplayAnalysisAvailability,
  type ReplayAnalysisAvailability,
} from "../analysis/provider-selection";
import { CasePurposeBriefForm } from "./case-purpose-brief-form";

function commandMeta(caseRevision: number): CaseCommand["meta"] {
  const now = new Date().toISOString();
  const nonce = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    commandId: `CMD-PURPOSE-${nonce}`,
    idempotencyKey: `IDEM-PURPOSE-${nonce}`,
    expectedCaseRevision: caseRevision,
    actor: "current_practitioner",
    createdAt: now,
  };
}

export function PurposeWorkspace() {
  const { state, dispatchCaseCommand } = useCaseState();
  const [analysisAvailability, setAnalysisAvailability] = useState<ReplayAnalysisAvailability | null>(null);
  const [availabilityState, setAvailabilityState] = useState<"loading" | "ready" | "error">("loading");
  const [checkpointMessage, setCheckpointMessage] = useState<string | null>(null);

  const loadAvailability = useCallback(async () => {
    setAvailabilityState("loading");
    try {
      const response = await fetch("/api/analyze", { method: "GET", cache: "no-store" });
      const parsed = AnalyzeAvailabilityResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("invalid_availability_projection");
      setAnalysisAvailability(resolveReplayAnalysisAvailability(parsed.data.options));
      setAvailabilityState("ready");
    } catch {
      setAnalysisAvailability(null);
      setAvailabilityState("error");
    }
  }, []);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  async function savePurpose(brief: CasePurposeBrief): Promise<string | null> {
    const command: Extract<CaseCommand, { type: "save_purpose" }> = {
      type: "save_purpose",
      meta: commandMeta(state.caseRevision),
      purposeBrief: brief,
    };
    const result = dispatchCaseCommand(command);
    return result.ok ? null : `The purpose could not be saved (${result.reason}). Review the current case state.`;
  }

  function loadCheckpoint() {
    setCheckpointMessage(null);
    if (analysisAvailability?.status !== "ready") {
      setCheckpointMessage("Analysis service unavailable");
      return;
    }
    const command: Extract<CaseCommand, { type: "load_demo_checkpoint" }> = {
      type: "load_demo_checkpoint",
      meta: commandMeta(state.caseRevision),
      checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
    };
    const result = dispatchCaseCommand(command);
    setCheckpointMessage(
      result.ok
        ? "Prepared demo review checkpoint loaded from the trusted local registry. No external transmission occurred."
        : `The prepared checkpoint could not be loaded (${result.reason}).`,
    );
  }

  const checkpointRun = state.analysisRuns.find(
    (run) => run.id === state.activeAnalysisRunId && run.checkpointProvenance !== null,
  );
  const replayOption = analysisAvailability?.status === "ready"
    ? analysisAvailability.option
    : null;
  const purposeUsesCurrentReplay = state.purposeBrief?.status === "complete"
    && state.purposeBrief.providerSelection.providerId === "local_replay"
    && state.purposeBrief.providerSelection.releaseConfigurationId === "prepared-replay-v1";

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-5">
      <header className="grid gap-2 border-b border-[var(--color-border)] pb-5">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
          Stage 1 · Intake
        </p>
        <h2 className="cfn-type-heading-2">Purpose Brief</h2>
        <p className="max-w-[760px] text-[var(--color-ink-muted)]">
          Record why this review is being prepared, who will receive it, and which decisions remain
          with a qualified practitioner.
        </p>
      </header>

      <section
        aria-label="Test workspace summary"
        className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
      >
        <dl className="grid text-sm sm:grid-cols-3 sm:divide-x sm:divide-[var(--color-border)]">
          <div className="border-b border-[var(--color-border)] px-4 py-3 sm:border-b-0">
            <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
              Workspace
            </dt>
            <dd className="mt-1 font-semibold">CFN-DEMO-001 · Fictional testing only</dd>
          </div>
          <div className="border-b border-[var(--color-border)] px-4 py-3 sm:border-b-0">
            <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
              Data boundary
            </dt>
            <dd className="mt-1 font-semibold">No real or private data</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
              Next
            </dt>
            <dd className="mt-1 font-semibold">Review source health in Documents</dd>
          </div>
        </dl>
      </section>

      {availabilityState === "loading" ? (
        <div className="grid gap-3" aria-label="Loading analysis availability">
          <Skeleton label="Loading analysis availability" />
        </div>
      ) : null}

      {availabilityState === "error" ? (
        <AnalysisServiceUnavailable onRetry={() => void loadAvailability()} />
      ) : null}

      {availabilityState === "ready" && analysisAvailability?.status === "unavailable" ? (
        <AnalysisServiceUnavailable />
      ) : null}

      {availabilityState !== "loading" ? (
        <CasePurposeBriefForm
          analysisOption={replayOption}
          disabled={Boolean(state.pendingLiveAnalysis) || !replayOption}
          initialBrief={state.purposeBrief}
          key={`${state.purposeBrief?.id ?? "new"}-${state.purposeBrief?.revision ?? 0}-${replayOption?.releaseConfigurationId ?? "unavailable"}`}
          onSave={savePurpose}
        />
      ) : null}

      {state.purposeBrief?.status === "complete" ? (
        <Alert title="Saved purpose is complete">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="max-w-2xl">
              Revision {state.purposeBrief.revision} is recorded. {purposeUsesCurrentReplay
                ? "Prepared local analysis is selected with no external transmission."
                : "Save the current local analysis disclosure before analysis can begin."} Analysis remains a separate
              action after the document checks pass.
            </p>
            <a
              className="cfn-control-target inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold !text-white no-underline hover:bg-[var(--color-brand-hover)]"
              href="/case/demo/intake"
            >
              Continue to Documents
              <ArrowRight aria-hidden="true" size={17} />
            </a>
          </div>
        </Alert>
      ) : null}

      <Card className="grid gap-3 border-dashed lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
            Optional judging shortcut
          </p>
          <h3 className="mt-1 cfn-type-heading-3">Jump to a prepared Review checkpoint</h3>
          <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
            Skip the normal Purpose and Documents journey only when demonstrating the Review workspace.
            This uses a trusted local replay and sends nothing externally.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            disabled={Boolean(state.pendingLiveAnalysis) || analysisAvailability?.status !== "ready"}
            onClick={loadCheckpoint}
            variant="secondary"
          >
            <FastForward aria-hidden="true" size={16} />
            Load prepared checkpoint
          </Button>
        </div>
        {checkpointMessage ? <p className="w-full" role="status">{checkpointMessage}</p> : null}
        {checkpointRun ? <p className="w-full" role="status">Checkpoint active with fixture-reviewer provenance and no provider transmission.</p> : null}
      </Card>
    </div>
  );
}
