import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ApiErrorSchema } from "../../../lib/contracts";
import { ProviderRecoveryPanel } from "../../../features/analysis/provider-recovery";
import { selectableProviderOptions } from "./fixtures";

const providerContext = {
  providerId: "openai" as const,
  releaseConfigurationId: "openai-quality-v1" as const,
  serviceTier: "paid" as const,
};

function operationalError() {
  return ApiErrorSchema.parse({
    schemaVersion: "1.0.0",
    requestId: "REQ-SAFE-1",
    userMessage: "OpenAI did not complete this run. Your reviewed work is unchanged.",
    failedStage: "candidate_extraction",
    code: "PROVIDER_TIMEOUT",
    retryable: true,
    failedRunId: "RUN-FAILED-1",
    providerContext,
    failureClassification: "provider_timeout",
    recoveryOptions: [
      { label: "Use labelled replay", automatic: false, action: "use_deterministic_replay", targetReleaseConfigurationId: "prepared-replay-v1", displayOrder: 4, requiresDisclosureAcknowledgement: true, startsNewRun: true },
      { label: "Choose Gemini", automatic: false, action: "select_evaluated_release", targetReleaseConfigurationId: "gemini-quality-v1", displayOrder: 2, requiresDisclosureAcknowledgement: true, startsNewRun: true },
      { label: "Retry selected provider", automatic: false, action: "retry_same_provider", targetReleaseConfigurationId: "openai-quality-v1", displayOrder: 0, requiresDisclosureAcknowledgement: false, startsNewRun: true },
      { label: "Return to Purpose", automatic: false, action: "return_to_purpose", targetReleaseConfigurationId: null, displayOrder: 5, requiresDisclosureAcknowledgement: false, startsNewRun: false },
    ],
  });
}

describe("TASK-018 ProviderRecoveryPanel", () => {
  it("renders operational options in canonical order and starts nothing on render", () => {
    const onAction = vi.fn();
    render(
      <ProviderRecoveryPanel
        onAction={onAction}
        outcome={{ kind: "api_error", error: operationalError() }}
        providerOptions={selectableProviderOptions()}
      />,
    );
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Retry selected provider",
      "Choose Gemini",
      "Bundled deterministic replay, not live AI",
      "Return to Purpose",
    ]);
    expect(screen.getByText(/failed run remains in history/i)).toBeInTheDocument();
  });

  it("requires the alternate release disclosure acknowledgement before confirming", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <ProviderRecoveryPanel
        onAction={onAction}
        outcome={{ kind: "api_error", error: operationalError() }}
        providerOptions={selectableProviderOptions()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Choose Gemini" }));
    const confirm = screen.getByRole("button", { name: "Confirm explicit recovery choice" });
    expect(confirm).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /reviewed and acknowledge/i }));
    await user.click(confirm);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        option: expect.objectContaining({ action: "select_evaluated_release" }),
        acknowledgement: expect.objectContaining({ releaseConfigurationId: "gemini-quality-v1" }),
      }),
    );
  });

  it.each([
    ["refusal", "PROVIDER_REFUSAL", "provider_refusal"],
    ["privacy", "PII_LEAK_DETECTED", "safety_validation_failed"],
    ["citation", "CITATION_VALIDATION_FAILED", "citation_validation_failed"],
    ["injection", "SAFETY_VALIDATION_FAILED", "safety_validation_failed"],
    ["structured response", "INVALID_STRUCTURED_RESPONSE", "invalid_structured_response"],
    ["prohibited output", "PROHIBITED_OUTPUT", "prohibited_output"],
    ["semantic safety", "SAFETY_VALIDATION_FAILED", "safety_validation_failed"],
  ] as const)("does not manufacture provider switching for %s failures", (_label, code, failureClassification) => {
    const safetyError = ApiErrorSchema.parse({
      schemaVersion: "1.0.0",
      requestId: "REQ-SAFE-2",
      userMessage: "This result requires safe review without provider switching.",
      failedStage: "candidate_extraction",
      code,
      retryable: false,
      failedRunId: "RUN-FAILED-2",
      providerContext,
      failureClassification,
      recoveryOptions: [],
    });
    render(
      <ProviderRecoveryPanel
        onAction={vi.fn()}
        outcome={{ kind: "api_error", error: safetyError }}
        providerOptions={selectableProviderOptions()}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/No output accepted/i)).toBeInTheDocument();
  });

  it("distinguishes preflight and transport failures without inventing a run", () => {
    const preflight = ApiErrorSchema.parse({
      schemaVersion: "1.0.0",
      requestId: "REQ-PREFLIGHT",
      userMessage: "The selected provider is not configured.",
      failedStage: "provider_selection",
      code: "PROVIDER_NOT_CONFIGURED",
      retryable: false,
      failedRunId: null,
      providerContext,
      failureClassification: null,
      recoveryOptions: [],
    });
    const { rerender } = render(
      <ProviderRecoveryPanel
        onAction={vi.fn()}
        outcome={{ kind: "api_error", error: preflight }}
        providerOptions={selectableProviderOptions()}
      />,
    );
    expect(screen.getByText(/No run was created.*not transmitted.*did not start/i)).toBeInTheDocument();
    rerender(
      <ProviderRecoveryPanel
        onAction={vi.fn()}
        outcome={{ kind: "transport_failure", requestId: "AUDIT-LOCAL-1", reasonCode: "network_unavailable", providerLabel: "OpenAI" }}
        providerOptions={selectableProviderOptions()}
      />,
    );
    expect(screen.getByText(/Transmission and remote execution status are unknown/i)).toBeInTheDocument();
    expect(screen.getByText(/explicit new unlinked attempt/i)).toBeInTheDocument();
  });
});
