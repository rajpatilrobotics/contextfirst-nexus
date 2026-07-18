"use client";

import { useCallback, useEffect, useState } from "react";
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
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Purpose and analysis</p>
        <h2 className="cfn-type-heading-2">Case Purpose Brief</h2>
        <p className="max-w-[760px]">
          State the authorized case-preparation purpose, preserve the prohibited-decision boundary, and
          review how this fictional demonstration handles analysis. Saving this brief does not start analysis.
        </p>
      </header>

      <Card>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="cfn-type-label">Case</dt><dd>CFN-DEMO-001 · Fictional adult composite</dd></div>
          <div><dt className="cfn-type-label">Demo packet</dt><dd>Version 1.0.0 · Fictional case data</dd></div>
          <div><dt className="cfn-type-label">Enabled input</dt><dd>Seven approved demo PDFs selected in Documents</dd></div>
        </dl>
      </Card>

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
          <p>
            Revision {state.purposeBrief.revision} is recorded. {purposeUsesCurrentReplay
              ? "Analysis uses the prepared local demo replay with no external transmission."
              : "Save the current local analysis disclosure before analysis can begin."} Analysis remains a separate
            action after document, coverage, masking, and leak-scan prerequisites pass.
          </p>
        </Alert>
      ) : null}

      <Card className="grid gap-3">
        <div>
          <h3 className="cfn-type-heading-3">Prepared demonstration checkpoint</h3>
          <p>
            This is a separate trusted replay-based state, not another analysis mode, live provider result,
            or prior user session.
          </p>
        </div>
        <p className="font-semibold">Prepared demo review checkpoint · Deterministic local replay, not live AI</p>
        <div>
          <Button
            disabled={Boolean(state.pendingLiveAnalysis) || analysisAvailability?.status !== "ready"}
            onClick={loadCheckpoint}
          >
            Load prepared checkpoint
          </Button>
        </div>
        {checkpointMessage ? <p role="status">{checkpointMessage}</p> : null}
        {checkpointRun ? <p role="status">Checkpoint active with fixture-reviewer provenance and no provider transmission.</p> : null}
      </Card>
    </div>
  );
}
