"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProviderOptionProjection, SystemCard } from "../../lib/contracts";
import { projectNonRunAttempts } from "../../lib/state";
import { Skeleton } from "../../components/ui";
import { useCaseState } from "../../components/shell/case-state-context";
import { AuditHistory } from "./audit-history";
import { RunHistory } from "./system-card-panel";
import { UnsafeOutputReport } from "./unsafe-output-report";

export function CaseTrustExperience({
  providers,
  checkpointReference,
}: {
  providers: ProviderOptionProjection[];
  checkpointReference: NonNullable<SystemCard["activeCheckpoint"]>;
}) {
  const { state, dispatchCaseCommand } = useCaseState();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const selectedRelease = useMemo(() => {
    const releaseId = state.purposeBrief?.providerSelection.releaseConfigurationId;
    return providers.find((provider) => provider.releaseConfigurationId === releaseId) ?? null;
  }, [providers, state.purposeBrief]);
  const currentRun = useMemo(
    () => state.analysisRuns.find((run) => run.id === state.activeAnalysisRunId) ?? null,
    [state.activeAnalysisRunId, state.analysisRuns],
  );
  const checkpoint = currentRun?.checkpointProvenance ? checkpointReference : null;

  if (!hydrated) {
    return (
      <section aria-label="Loading browser-session trust history" className="grid min-w-0 gap-4">
        <p className="cfn-type-label text-[var(--color-brand)]">Loading local browser-session state</p>
        <Skeleton label="Loading provider, audit, and report panels" />
        <Skeleton label="Loading safe audit history" />
      </section>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-10">
      <RunHistory
        attemptedRuns={state.analysisRuns}
        checkpoint={checkpoint}
        currentRun={currentRun}
        nonRunAttempts={projectNonRunAttempts(state)}
        selectedRelease={selectedRelease}
      />
      <AuditHistory events={state.audit} />
      <UnsafeOutputReport onCommand={dispatchCaseCommand} state={state} />
    </div>
  );
}
