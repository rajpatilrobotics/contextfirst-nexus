import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ProviderSelectionPanel,
  REPLAY_VISIBLE_LABEL,
  providerAvailabilityLabel,
} from "../../../features/analysis/provider-selection";
import { providerOptions, selectableProviderOptions } from "./fixtures";

describe("TASK-018 ProviderSelectionPanel", () => {
  it.each([
    ["disabled", "Unavailable in this deployment"],
    ["not_evaluated", "Admission required"],
    ["evaluation_failed", "Admission required"],
    ["not_configured", "Unavailable in this deployment"],
    ["service_tier_unavailable", "Exact service tier unavailable"],
    ["deployed_account_release_unavailable", "Admission required"],
    ["data_policy_blocked", "Unavailable for this data policy"],
  ] as const)("maps %s to a safe availability explanation", (availabilityStatus, label) => {
    const option = { ...providerOptions()[0], availabilityStatus, selectable: false };
    expect(providerAvailabilityLabel(option)).toBe(label);
  });

  it("renders the frozen order, truthful availability, Mistral admission state, and separated replay", () => {
    render(
      <ProviderSelectionPanel
        disclosureAcknowledged={false}
        onDisclosureAcknowledgementChange={vi.fn()}
        onSelectionChange={vi.fn()}
        options={providerOptions()}
        selectedReleaseConfigurationId={null}
      />,
    );

    const radios = screen.getAllByRole("radio");
    expect(radios.map((radio) => radio.getAttribute("value"))).toEqual([
      "openai-quality-v1",
      "gemini-quality-v1",
      "mistral-small-free-v1",
      "prepared-replay-v1",
    ]);
    expect(radios.every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByText("Synthetic fixture only")).toBeInTheDocument();
    expect(screen.getByText("Exact bundled synthetic fixture only")).toBeInTheDocument();
    expect(screen.getByText(/Mistral Small 4 is not available until exact release/i)).toHaveTextContent(
      /mistral-small-2603.*passed evidence/i,
    );
    expect(screen.getByText(REPLAY_VISIBLE_LABEL)).toBeInTheDocument();
    expect(screen.getAllByText("No provider transmission").length).toBeGreaterThan(0);
    expect(screen.queryByText(/api key|billing identifier|project identifier/i)).not.toBeInTheDocument();
  });

  it("clears stale acknowledgement through the parent when the release changes", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <ProviderSelectionPanel
        disclosureAcknowledged
        onDisclosureAcknowledgementChange={vi.fn()}
        onSelectionChange={onSelectionChange}
        options={selectableProviderOptions()}
        selectedReleaseConfigurationId="openai-quality-v1"
      />,
    );
    await user.click(screen.getByRole("radio", { name: /Google Gemini/i }));
    expect(onSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ releaseConfigurationId: "gemini-quality-v1" }),
    );
  });

  it("shows the selected release disclosure and exact acknowledgement", () => {
    render(
      <ProviderSelectionPanel
        disclosureAcknowledged={false}
        onDisclosureAcknowledgementChange={vi.fn()}
        onSelectionChange={vi.fn()}
        options={selectableProviderOptions()}
        selectedReleaseConfigurationId="gemini-quality-v1"
      />,
    );
    const group = screen.getByRole("group", { name: "Choose analysis service" });
    expect(within(group).getByText(/approved redacted synthetic fixture evidence is sent to Gemini/i)).toBeInTheDocument();
    expect(within(group).getByRole("checkbox", { name: /service tier, data flow, data-use terms/i })).not.toBeChecked();
  });
});
