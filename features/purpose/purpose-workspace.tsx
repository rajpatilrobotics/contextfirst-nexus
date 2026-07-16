"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AnalyzeAvailabilityResponseSchema,
  CasePurposeBriefSchema,
  type CaseCommand,
  type CasePurposeBrief,
  type CaseState,
  type ProviderOptionProjection,
} from "../../lib/contracts";
import { useCaseState } from "../../components/shell";
import { Alert, Button, Card, Skeleton } from "../../components/ui";
import {
  ProviderRecoveryPanel,
  type ProviderRecoveryPanelProps,
  type ProviderRecoverySelection,
} from "../analysis/provider-recovery";
import { runSelectedAnalysis } from "../analysis/run-controller";
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
  const [options, setOptions] = useState<ProviderOptionProjection[]>([]);
  const [availabilityState, setAvailabilityState] = useState<"loading" | "ready" | "error">("loading");
  const [checkpointMessage, setCheckpointMessage] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [recoveryOutcome, setRecoveryOutcome] = useState<
    ProviderRecoveryPanelProps["outcome"] | null
  >(null);

  const loadAvailability = useCallback(async () => {
    setAvailabilityState("loading");
    try {
      const response = await fetch("/api/analyze", { method: "GET", cache: "no-store" });
      const parsed = AnalyzeAvailabilityResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("invalid_availability_projection");
      setOptions(parsed.data.options);
      setAvailabilityState("ready");
    } catch {
      setOptions([]);
      setAvailabilityState("error");
    }
  }, []);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  async function savePurpose(brief: CasePurposeBrief): Promise<string | null> {
    setRunMessage(null);
    setRecoveryOutcome(null);
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
    setRunMessage(null);
    setRecoveryOutcome(null);
    const command: Extract<CaseCommand, { type: "load_demo_checkpoint" }> = {
      type: "load_demo_checkpoint",
      meta: commandMeta(state.caseRevision),
      checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
    };
    const result = dispatchCaseCommand(command);
    setCheckpointMessage(
      result.ok
        ? "Prepared synthetic review checkpoint loaded from the trusted local registry. No provider transmission occurred."
        : `The prepared checkpoint could not be loaded (${result.reason}).`,
    );
  }

  async function executeAnalysis(
    recoveryOfRunId: string | null = null,
    sourceState: CaseState = state,
  ) {
    setIsRunning(true);
    setRunMessage(null);
    setRecoveryOutcome(null);
    const result = await runSelectedAnalysis({
      state: sourceState,
      dispatchCaseCommand,
      recoveryOfRunId,
    });
    setIsRunning(false);

    if (result.status === "blocked") {
      const safeReason = result.reason === "mask_review_incomplete"
        ? "Approved masking and a passed leak scan are required before live transmission."
        : result.reason === "segments_not_selected"
          ? "At least one approved fixture segment must be selected before live analysis."
          : "The current canonical case transition did not authorize analysis.";
      setRunMessage(safeReason);
      return;
    }

    if (result.status === "transport_failed") {
      const releaseId = sourceState.purposeBrief?.providerSelection.releaseConfigurationId;
      const providerLabel = options.find(
        (option) => option.releaseConfigurationId === releaseId,
      )?.displayName ?? "The selected provider";
      setRecoveryOutcome({
        kind: "transport_failure",
        requestId: result.requestId,
        reasonCode: result.reasonCode,
        providerLabel,
      });
      return;
    }

    if (result.status === "failed" || result.status === "rejected") {
      const failedRun = result.error.failedRunId
        ? result.commandResult.state.analysisRuns.find(
            (run) => run.id === result.error.failedRunId,
          ) ?? null
        : null;
      setRecoveryOutcome({ kind: "api_error", error: result.error, failedRun });
      return;
    }

    setRunMessage(
      result.outcome === "replay_succeeded"
        ? "Bundled deterministic replay completed locally. No provider transmission occurred."
        : "Live analysis completed as one explicit provider run. Its output was not merged with another run.",
    );
  }

  async function handleRecovery(selection: ProviderRecoverySelection) {
    if (!recoveryOutcome || recoveryOutcome.kind !== "api_error") return;
    const recoveryOfRunId = recoveryOutcome.error.failedRunId;

    if (selection.option.action === "return_to_purpose") {
      setRecoveryOutcome(null);
      document.getElementById("purpose-form")?.focus();
      return;
    }

    if (selection.option.action === "retry_same_provider") {
      await executeAnalysis(recoveryOfRunId);
      return;
    }

    const currentPurpose = state.purposeBrief;
    const target = options.find(
      (option) => option.releaseConfigurationId === selection.option.targetReleaseConfigurationId,
    );
    if (!currentPurpose || currentPurpose.status !== "complete" || !target?.selectable || !selection.acknowledgement) {
      setRunMessage("The selected recovery release is not currently eligible with a matching acknowledgement.");
      return;
    }

    const updatedPurpose = CasePurposeBriefSchema.safeParse({
      ...currentPurpose,
      revision: currentPurpose.revision + 1,
      providerSelection: {
        providerId: target.providerId,
        releaseConfigurationId: target.releaseConfigurationId,
        serviceTier: target.serviceTier,
        disclosureAcknowledgement: selection.acknowledgement,
      },
      updatedAt: new Date().toISOString(),
    });
    if (!updatedPurpose.success) {
      setRunMessage("The recovery choice did not match the canonical purpose and disclosure contract.");
      return;
    }

    const saveResult = dispatchCaseCommand({
      type: "save_purpose",
      meta: commandMeta(state.caseRevision),
      purposeBrief: updatedPurpose.data,
    });
    if (!saveResult.ok) {
      setRunMessage("The newly acknowledged recovery release could not be saved to the current case revision.");
      return;
    }
    await executeAnalysis(recoveryOfRunId, saveResult.state);
  }

  const checkpointRun = state.analysisRuns.find(
    (run) => run.id === state.activeAnalysisRunId && run.checkpointProvenance !== null,
  );
  const purposeComplete = state.purposeBrief?.status === "complete";
  const replaySelected = state.purposeBrief?.providerSelection.providerId === "local_replay";
  const liveInputsReady = state.selectedSegmentIds.length > 0
    && state.masking.reviewStatus === "approved"
    && state.masking.leakScanStatus === "passed";
  const runEnabled = purposeComplete
    && (replaySelected || liveInputsReady)
    && !state.pendingLiveAnalysis
    && !isRunning;

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Purpose and analysis service</p>
        <h2 className="cfn-type-heading-2">Case Purpose Brief</h2>
        <p className="max-w-[760px]">
          State the authorized case-preparation purpose, preserve the prohibited-decision boundary, and
          explicitly choose one available live release or the bundled local replay. Saving this brief does
          not start analysis.
        </p>
      </header>

      <Card>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="cfn-type-label">Case</dt><dd>CFN-DEMO-001 · Fictional adult composite</dd></div>
          <div><dt className="cfn-type-label">Fixture</dt><dd>Version 1.0.0 · Bundled synthetic</dd></div>
          <div><dt className="cfn-type-label">Enabled input</dt><dd>One bundled fixture; no upload</dd></div>
        </dl>
      </Card>

      {availabilityState === "loading" ? (
        <div className="grid gap-3" aria-label="Loading analysis service choices">
          <Skeleton label="Loading OpenAI choice" />
          <Skeleton label="Loading Gemini choice" />
          <Skeleton label="Loading Mistral choice" />
          <Skeleton label="Loading replay choice" />
        </div>
      ) : null}

      {availabilityState === "error" ? (
        <Alert title="Analysis service choices unavailable" tone="danger">
          <p>The safe availability projection could not be loaded. No service was selected or contacted.</p>
          <Button className="mt-3" onClick={() => void loadAvailability()}>Try loading choices again</Button>
        </Alert>
      ) : null}

      {availabilityState === "ready" ? (
        <CasePurposeBriefForm
          disabled={Boolean(state.pendingLiveAnalysis)}
          initialBrief={state.purposeBrief}
          key={`${state.purposeBrief?.id ?? "new"}-${state.purposeBrief?.revision ?? 0}`}
          onSave={savePurpose}
          options={options}
        />
      ) : null}

      {state.purposeBrief?.status === "complete" ? (
        <Alert title="Saved purpose is complete">
          <p>
            Revision {state.purposeBrief.revision} selects {state.purposeBrief.providerSelection.releaseConfigurationId}.
            Analysis remains a separate explicit action after document, coverage, masking, and leak-scan prerequisites pass.
          </p>
        </Alert>
      ) : null}

      {purposeComplete ? (
        <Card className="grid gap-3">
          <div>
            <h3 className="cfn-type-heading-3">Run the selected analysis service</h3>
            <p>
              One explicit action creates one run. There is no automatic retry, provider fallback,
              replay substitution, or output merging.
            </p>
          </div>
          {!replaySelected && !liveInputsReady ? (
            <Alert title="Live analysis prerequisites incomplete" tone="warning">
              <p>Approved fixture segments, completed mask review, and a passed leak scan are required before transmission.</p>
            </Alert>
          ) : null}
          <div>
            <Button
              disabled={!runEnabled}
              onClick={() => void executeAnalysis()}
              variant="primary"
            >
              {isRunning
                ? "Running selected service…"
                : replaySelected
                  ? "Run bundled deterministic replay"
                  : "Start one live analysis run"}
            </Button>
          </div>
          {runMessage ? <p role="status">{runMessage}</p> : null}
        </Card>
      ) : null}

      {recoveryOutcome ? (
        <ProviderRecoveryPanel
          onAction={(selection) => void handleRecovery(selection)}
          outcome={recoveryOutcome}
          providerOptions={options}
        />
      ) : null}

      <Card className="grid gap-3">
        <div>
          <h3 className="cfn-type-heading-3">Prepared demonstration checkpoint</h3>
          <p>
            This is a separate trusted replay-based state, not another analysis mode, live provider result,
            or prior user session.
          </p>
        </div>
        <p className="font-semibold">Prepared synthetic review checkpoint · Bundled deterministic replay, not live AI</p>
        <div><Button disabled={Boolean(state.pendingLiveAnalysis)} onClick={loadCheckpoint}>Load prepared checkpoint</Button></div>
        {checkpointMessage ? <p role="status">{checkpointMessage}</p> : null}
        {checkpointRun ? <p role="status">Checkpoint active with fixture-reviewer provenance and no provider transmission.</p> : null}
      </Card>
    </div>
  );
}
