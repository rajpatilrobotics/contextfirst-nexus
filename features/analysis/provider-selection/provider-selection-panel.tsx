"use client";

import type { ProviderOptionProjection } from "../../../lib/contracts";
import { Checkbox, FieldError } from "../../../components/ui";

export const REPLAY_VISIBLE_LABEL = "Bundled deterministic replay, not live AI";

export type ReplayAvailabilityFailureReason =
  | "zero_selectable"
  | "multiple_selectable"
  | "live_service_selectable"
  | "invalid_replay_service";

export type ReplayAnalysisAvailability =
  | {
      status: "ready";
      option: ProviderOptionProjection;
    }
  | {
      status: "unavailable";
      reason: ReplayAvailabilityFailureReason;
    };

export type AnalysisDisclosurePanelProps = {
  acknowledged: boolean;
  disabled?: boolean;
  error?: string;
  onAcknowledgementChange: (acknowledged: boolean) => void;
};

function isTrustedLocalReplay(option: ProviderOptionProjection): boolean {
  return (
    option.providerId === "local_replay" &&
    option.releaseConfigurationId === "prepared-replay-v1" &&
    option.requestedModel === "frozen_replay_output" &&
    option.serviceTier === "local" &&
    option.mode === "deterministic_replay" &&
    option.providerTransmission === false &&
    option.disclosure.providerTransmission === false
  );
}

export function resolveReplayAnalysisAvailability(
  options: readonly ProviderOptionProjection[],
): ReplayAnalysisAvailability {
  const selectable = options.filter((option) => option.selectable);

  if (selectable.length === 0) {
    return { status: "unavailable", reason: "zero_selectable" };
  }

  if (selectable.length > 1) {
    return { status: "unavailable", reason: "multiple_selectable" };
  }

  const option = selectable[0];
  if (option.providerId !== "local_replay" || option.mode === "live") {
    return { status: "unavailable", reason: "live_service_selectable" };
  }

  if (!isTrustedLocalReplay(option)) {
    return { status: "unavailable", reason: "invalid_replay_service" };
  }

  return { status: "ready", option };
}

export function AnalysisDisclosurePanel({
  acknowledged,
  disabled = false,
  error,
  onAcknowledgementChange,
}: AnalysisDisclosurePanelProps) {
  return (
    <fieldset
      aria-describedby={error ? "analysis-disclosure-error" : undefined}
      className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-control-border)] bg-[var(--color-surface)] p-4"
    >
      <legend className="cfn-type-heading-3 px-1">How analysis works</legend>
      <p>
        {REPLAY_VISIBLE_LABEL}. The bundled demo packet uses prepared output; other fictional or
        hackathon test PDFs use browser-local source extraction only.
      </p>
      <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
        No PDF or extracted content is sent to an external service or AI provider. Saving the Purpose
        Brief does not start analysis; Start analysis remains a separate action after the document
        safety checks.
      </p>
      <Checkbox
        aria-describedby={error ? "analysis-disclosure-error" : undefined}
        checked={acknowledged}
        disabled={disabled}
        id="analysis-disclosure-acknowledgement"
        label="I understand that analysis uses prepared demo replay or browser-local source extraction, is not live AI, and has no provider transmission."
        onChange={(event) => onAcknowledgementChange(event.currentTarget.checked)}
      />
      {error ? <FieldError id="analysis-disclosure-error">{error}</FieldError> : null}
    </fieldset>
  );
}
