"use client";

import { useEffect, useRef, useState } from "react";
import type { z } from "zod";
import {
  AnalysisRecoveryOptionSchema,
  ApiErrorSchema,
  ProviderDisclosureAcknowledgementSchema,
  type AnalysisRun,
  type ProviderDisclosureAcknowledgement,
  type ProviderOptionProjection,
} from "../../../lib/contracts";
import { Alert, Button, Card, Checkbox } from "../../../components/ui";
import { REPLAY_VISIBLE_LABEL } from "../provider-selection";

export type RecoveryOption = z.infer<typeof AnalysisRecoveryOptionSchema>;
export type RecoveryApiError = z.infer<typeof ApiErrorSchema>;

export type ProviderRecoverySelection = {
  option: RecoveryOption;
  acknowledgement?: ProviderDisclosureAcknowledgement;
};

export type ProviderRecoveryPanelProps = {
  outcome:
    | { kind: "api_error"; error: RecoveryApiError; failedRun?: AnalysisRun | null }
    | {
        kind: "transport_failure";
        requestId: string;
        reasonCode: "network_unavailable" | "response_unavailable" | "invalid_response_envelope";
        providerLabel: string;
      };
  providerOptions: ProviderOptionProjection[];
  onAction: (selection: ProviderRecoverySelection) => void;
};

export function ProviderRecoveryPanel({ outcome, providerOptions, onAction }: ProviderRecoveryPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [pendingOption, setPendingOption] = useState<RecoveryOption | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (outcome.kind === "transport_failure") {
    return (
      <Alert title="Remote outcome unknown" tone="danger">
        <div className="grid gap-2">
          <h3 className="cfn-type-heading-3 outline-none" ref={headingRef} tabIndex={-1}>Analysis transport failure</h3>
          <p>{outcome.providerLabel} could not return a parseable terminal response.</p>
          <p><strong>No output accepted.</strong> Transmission and remote execution status are unknown.</p>
          <p>Any later attempt must be an explicit new unlinked attempt. Nothing starts automatically.</p>
          <p className="cfn-type-code">Local reference: {outcome.requestId}</p>
        </div>
      </Alert>
    );
  }

  const { error, failedRun = null } = outcome;
  const orderedOptions = [...error.recoveryOptions].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );
  const isPreflight = error.failedRunId === null;
  const pendingProvider = pendingOption
    ? providerOptions.find(
        (option) => option.releaseConfigurationId === pendingOption.targetReleaseConfigurationId,
      ) ?? null
    : null;

  function chooseOption(option: RecoveryOption) {
    if (option.requiresDisclosureAcknowledgement) {
      setPendingOption(option);
      setAcknowledged(false);
      return;
    }
    onAction({ option });
  }

  function confirmAcknowledgedOption() {
    if (!pendingOption || !pendingProvider || !acknowledged) return;
    const now = new Date().toISOString();
    const acknowledgement = ProviderDisclosureAcknowledgementSchema.safeParse({
      id: `ACK-RECOVERY-${pendingProvider.releaseConfigurationId.toUpperCase()}-${Date.now()}`,
      schemaVersion: "1.0.0",
      disclosureVersion: pendingProvider.disclosure.disclosureVersion,
      providerId: pendingProvider.providerId,
      releaseConfigurationId: pendingProvider.releaseConfigurationId,
      serviceTier: pendingProvider.serviceTier,
      dataFlowAcknowledged: true,
      retentionAndTrainingUseAcknowledged: true,
      serviceTierAcknowledged: true,
      acknowledgedAt: now,
    });
    if (!acknowledgement.success) return;
    onAction({
      option: pendingOption,
      acknowledgement: acknowledgement.data,
    });
  }

  return (
    <section className="grid gap-4" aria-labelledby="provider-recovery-heading">
      <Alert title="Analysis did not complete" tone="danger">
        <div className="grid gap-2">
          <h3
            className="cfn-type-heading-3 outline-none"
            id="provider-recovery-heading"
            ref={headingRef}
            tabIndex={-1}
          >
            Provider recovery
          </h3>
          <p>{error.userMessage}</p>
          <p><strong>No output accepted.</strong></p>
          {isPreflight ? (
            <p>No run was created. The request was not transmitted and did not start.</p>
          ) : (
            <p>The failed run remains in history. Recovery creates a separate run and never merges outputs.</p>
          )}
          <p className="cfn-type-code">Safe category: {error.code} · Local reference: {error.requestId}</p>
        </div>
      </Alert>

      {failedRun ? (
        <Card>
          <h4 className="cfn-type-heading-3">Preserved failed run</h4>
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            <div><dt className="cfn-type-label">Run</dt><dd className="cfn-type-code">{failedRun.id}</dd></div>
            <div><dt className="cfn-type-label">Provider</dt><dd>{failedRun.provider.providerId}</dd></div>
            <div><dt className="cfn-type-label">Release</dt><dd className="cfn-type-code">{failedRun.provider.releaseConfigurationId}</dd></div>
          </dl>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {orderedOptions.map((option) => {
          const target = providerOptions.find(
            (provider) => provider.releaseConfigurationId === option.targetReleaseConfigurationId,
          );
          if (option.action === "select_evaluated_release" && (!target || !target.selectable)) return null;
          return (
            <Button key={`${option.action}-${option.displayOrder}`} onClick={() => chooseOption(option)}>
              {option.action === "use_deterministic_replay" ? REPLAY_VISIBLE_LABEL : option.label}
            </Button>
          );
        })}
      </div>

      {pendingOption && pendingProvider ? (
        <Card className="grid gap-3">
          <h4 className="cfn-type-heading-3">Review the new release disclosure</h4>
          <p className="font-semibold">
            {pendingProvider.providerId === "local_replay" ? REPLAY_VISIBLE_LABEL : pendingProvider.displayName}
          </p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="cfn-type-label">Release</dt><dd className="cfn-type-code">{pendingProvider.releaseConfigurationId}</dd></div>
            <div><dt className="cfn-type-label">Model and tier</dt><dd>{pendingProvider.modelDisplayName} · {pendingProvider.disclosure.serviceTierLabel}</dd></div>
            <div className="sm:col-span-2"><dt className="cfn-type-label">Data flow</dt><dd>{pendingProvider.disclosure.dataFlowSummary}</dd></div>
            <div className="sm:col-span-2"><dt className="cfn-type-label">Content categories sent</dt><dd>{pendingProvider.disclosure.providerContentCategories.join(", ")}</dd></div>
            <div className="sm:col-span-2"><dt className="cfn-type-label">Data use</dt><dd>{pendingProvider.disclosure.trainingUseDisclosure}</dd></div>
            <div className="sm:col-span-2"><dt className="cfn-type-label">Retention limitation</dt><dd>{pendingProvider.disclosure.retentionLimitation}</dd></div>
            <div className="sm:col-span-2"><dt className="cfn-type-label">Known limitation</dt><dd>{pendingProvider.modelAliasDisclosure}</dd></div>
            <div><dt className="cfn-type-label">Provider transmission</dt><dd>{pendingProvider.providerTransmission ? "Yes, after explicit confirmation" : "No provider transmission"}</dd></div>
            <div><dt className="cfn-type-label">Last verified</dt><dd>{pendingProvider.disclosure.lastVerified}</dd></div>
          </dl>
          <Checkbox
            checked={acknowledged}
            id="recovery-disclosure-acknowledgement"
            label="I reviewed and acknowledge this exact release's service tier, data flow, data-use terms, and retention limitation."
            onChange={(event) => setAcknowledged(event.currentTarget.checked)}
          />
          <div className="flex gap-3">
            <Button disabled={!acknowledged} onClick={confirmAcknowledgedOption} variant="primary">Confirm explicit recovery choice</Button>
            <Button onClick={() => { setPendingOption(null); setAcknowledged(false); }}>Cancel</Button>
          </div>
        </Card>
      ) : null}
    </section>
  );
}
