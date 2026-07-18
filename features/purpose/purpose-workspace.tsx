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
    <div className="mx-auto grid w-full max-w-5xl gap-5">
      <header className="grid gap-1 border-b border-[var(--color-border)] pb-4">
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Step 1 of 4 · Purpose</p>
        <h2 className="cfn-type-heading-2">Case Purpose Brief</h2>
        <p className="max-w-[760px]">
          Tell us who is preparing the handoff and why. Save this brief, then continue directly to Documents.
        </p>
      </header>

      <section
        aria-label="Demo case summary"
        className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3"
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="cfn-type-label">Case</dt><dd>CFN-DEMO-001 · Fictional adult composite</dd></div>
          <div><dt className="cfn-type-label">Version</dt><dd>1.0.0 · Demo-only data</dd></div>
          <div><dt className="cfn-type-label">Next</dt><dd>Select and verify the demo PDFs in Documents</dd></div>
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

      <Card className="flex flex-col items-start justify-between gap-3 border-dashed sm:flex-row sm:items-center">
        <div className="max-w-2xl">
          <p className="cfn-type-label text-[var(--color-ink-muted)]">Optional judging shortcut</p>
          <h3 className="cfn-type-heading-3">Jump to a prepared Review checkpoint</h3>
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
