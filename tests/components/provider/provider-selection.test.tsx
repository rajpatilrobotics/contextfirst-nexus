import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AnalysisDisclosurePanel,
  REPLAY_VISIBLE_LABEL,
  resolveReplayAnalysisAvailability,
} from "../../../features/analysis/provider-selection";
import {
  liveOnlyProviderOptions,
  multipleSelectableProviderOptions,
  replayOnlyProviderOptions,
  zeroSelectableProviderOptions,
} from "./fixtures";

describe("TASK-039 replay-only analysis availability", () => {
  it("accepts only the exact sole local prepared replay service", () => {
    const result = resolveReplayAnalysisAvailability(replayOnlyProviderOptions());

    expect(result).toEqual({
      status: "ready",
      option: expect.objectContaining({
        providerId: "local_replay",
        releaseConfigurationId: "prepared-replay-v1",
        mode: "deterministic_replay",
        providerTransmission: false,
        disclosure: expect.objectContaining({ providerTransmission: false }),
      }),
    });
  });

  it.each([
    ["zero selectable services", zeroSelectableProviderOptions, "zero_selectable"],
    ["multiple selectable services", multipleSelectableProviderOptions, "multiple_selectable"],
    ["one selectable live service", liveOnlyProviderOptions, "live_service_selectable"],
  ] as const)("fails closed for %s", (_label, buildOptions, reason) => {
    expect(resolveReplayAnalysisAvailability(buildOptions())).toEqual({
      status: "unavailable",
      reason,
    });
  });

  it("rejects a malformed replay projection even when it is the sole selectable service", () => {
    const malformed = replayOnlyProviderOptions().map((option) =>
      option.providerId === "local_replay"
        ? {
            ...option,
            disclosure: { ...option.disclosure, providerTransmission: true },
          }
        : option,
    );

    expect(resolveReplayAnalysisAvailability(malformed)).toEqual({
      status: "unavailable",
      reason: "invalid_replay_service",
    });
  });

  it("shows one plain-language disclosure without a service-selection control", () => {
    render(
      <AnalysisDisclosurePanel
        acknowledged={false}
        onAcknowledgementChange={vi.fn()}
      />,
    );

    expect(screen.getByText(REPLAY_VISIBLE_LABEL, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/No case content is sent to an external service/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /frozen local demo output/i })).not.toBeChecked();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(/OpenAI|Gemini|Mistral|service tier|requested model/i)).not.toBeInTheDocument();
  });

  it("requires an explicit acknowledgement and never acknowledges on render", async () => {
    const user = userEvent.setup();
    const onAcknowledgementChange = vi.fn();
    render(
      <AnalysisDisclosurePanel
        acknowledged={false}
        error="Acknowledge how local analysis works."
        onAcknowledgementChange={onAcknowledgementChange}
      />,
    );

    expect(onAcknowledgementChange).not.toHaveBeenCalled();
    const acknowledgement = screen.getByRole("checkbox", {
      name: /sends nothing to an external service/i,
    });
    expect(acknowledgement).toHaveAccessibleDescription("Acknowledge how local analysis works.");

    await user.tab();
    expect(acknowledgement).toHaveFocus();
    await user.keyboard(" ");
    expect(onAcknowledgementChange).toHaveBeenCalledTimes(1);
    expect(onAcknowledgementChange).toHaveBeenCalledWith(true);
  });
});
