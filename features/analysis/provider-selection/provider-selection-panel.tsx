"use client";

import type { ProviderOptionProjection } from "../../../lib/contracts";
import { Checkbox, FieldError } from "../../../components/ui";

export const REPLAY_VISIBLE_LABEL = "Bundled deterministic replay, not live AI";

export type ProviderSelectionPanelProps = {
  options: ProviderOptionProjection[];
  selectedReleaseConfigurationId: string | null;
  disclosureAcknowledged: boolean;
  disabled?: boolean;
  error?: string;
  onSelectionChange: (option: ProviderOptionProjection) => void;
  onDisclosureAcknowledgementChange: (acknowledged: boolean) => void;
};

const availabilityLabels: Record<string, string> = {
  available: "Available",
  disabled: "Unavailable in this deployment",
  not_evaluated: "Admission required",
  evaluation_failed: "Admission required",
  not_configured: "Unavailable in this deployment",
  service_tier_unavailable: "Exact service tier unavailable",
  deployed_account_release_unavailable: "Admission required",
  data_policy_blocked: "Unavailable for this data policy",
};

export function providerAvailabilityLabel(option: ProviderOptionProjection): string {
  return availabilityLabels[option.availabilityStatus] ?? "Unavailable";
}

export function ProviderSelectionPanel({
  options,
  selectedReleaseConfigurationId,
  disclosureAcknowledged,
  disabled = false,
  error,
  onSelectionChange,
  onDisclosureAcknowledgementChange,
}: ProviderSelectionPanelProps) {
  const ordered = [...options].sort((left, right) => left.displayOrder - right.displayOrder);
  const selected = ordered.find(
    (option) => option.releaseConfigurationId === selectedReleaseConfigurationId,
  );

  return (
    <fieldset aria-describedby={error ? "provider-selection-error" : undefined} className="grid gap-4">
      <legend className="cfn-type-heading-3">Choose analysis service</legend>
      <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
        No service is selected automatically. The order below is presentation order only and never an
        automatic attempt chain.
      </p>

      <div className="grid gap-3">
        {ordered.map((option) => {
          const isReplay = option.providerId === "local_replay";
          const isSelected = option.releaseConfigurationId === selectedReleaseConfigurationId;
          const selectable = option.selectable && !disabled;
          const displayName = isReplay ? REPLAY_VISIBLE_LABEL : option.displayName;

          return (
            <label
              className={`grid gap-3 rounded-[var(--radius-card)] border p-4 ${
                isReplay ? "mt-3 border-[var(--color-brand)]" : "border-[var(--color-border)]"
              } ${isSelected ? "bg-[var(--color-surface-subtle)]" : "bg-[var(--color-surface)]"}`}
              key={option.releaseConfigurationId}
            >
              <span className="flex min-h-11 items-start gap-3">
                <input
                  checked={isSelected}
                  disabled={!selectable}
                  name="analysis-service"
                  onChange={() => onSelectionChange(option)}
                  type="radio"
                  value={option.releaseConfigurationId}
                />
                <span className="grid gap-1">
                  <span className="font-semibold">{displayName}</span>
                  <span className="cfn-type-body-small">
                    {option.modelDisplayName} · {option.disclosure.serviceTierLabel}
                  </span>
                  <span className="cfn-type-body-small font-semibold">
                    {providerAvailabilityLabel(option)}
                  </span>
                </span>
              </span>

              {option.providerId === "google_gemini" ? (
                <strong className="cfn-type-label">Synthetic fixture only</strong>
              ) : null}
              {option.providerId === "mistral" ? (
                <strong className="cfn-type-label">Exact bundled synthetic fixture only</strong>
              ) : null}

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="cfn-type-label">Release</dt>
                  <dd className="cfn-type-code">{option.releaseConfigurationId}</dd>
                </div>
                <div>
                  <dt className="cfn-type-label">Requested model</dt>
                  <dd className="cfn-type-code">{option.requestedModel}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="cfn-type-label">Data flow</dt>
                  <dd>{option.disclosure.dataFlowSummary}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="cfn-type-label">Content categories sent</dt>
                  <dd>{option.disclosure.providerContentCategories.join(", ")}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="cfn-type-label">Data use</dt>
                  <dd>{option.disclosure.trainingUseDisclosure}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="cfn-type-label">Retention limitation</dt>
                  <dd>{option.disclosure.retentionLimitation}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="cfn-type-label">Known limitation</dt>
                  <dd>{option.modelAliasDisclosure}</dd>
                </div>
                <div>
                  <dt className="cfn-type-label">Provider transmission</dt>
                  <dd>{option.disclosure.providerTransmission ? "Yes, after explicit start" : "No provider transmission"}</dd>
                </div>
                <div>
                  <dt className="cfn-type-label">Last verified</dt>
                  <dd>{option.disclosure.lastVerified}</dd>
                </div>
              </dl>

              {!option.selectable && option.providerId === "mistral" ? (
                <p className="cfn-type-body-small text-[var(--color-warning)]">
                  Mistral Small 4 is not available until exact release {" "}
                  <span className="cfn-type-code">mistral-small-2603</span> has passed evidence,
                  reviewed static admission, and confirmed deployed-account availability. No account,
                  credential, billing, or internal configuration detail is exposed.
                </p>
              ) : null}
            </label>
          );
        })}
      </div>

      {selected ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-control-border)] p-4">
          <Checkbox
            checked={disclosureAcknowledged}
            disabled={disabled}
            id="provider-disclosure-acknowledgement"
            label={`I reviewed and acknowledge this exact release's service tier, data flow, data-use terms, and retention limitation${
              selected.providerId === "local_replay"
                ? ", including that it is frozen local output and not live AI"
                : ""
            }.`}
            onChange={(event) => onDisclosureAcknowledgementChange(event.currentTarget.checked)}
          />
        </div>
      ) : null}

      {error ? <FieldError id="provider-selection-error">{error}</FieldError> : null}
    </fieldset>
  );
}
