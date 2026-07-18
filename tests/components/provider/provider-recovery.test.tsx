import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AnalysisServiceUnavailable } from "../../../features/analysis/provider-recovery";

describe("TASK-039 AnalysisServiceUnavailable", () => {
  it("fails closed with plain language, no recovery choice, and focused error context", () => {
    render(<AnalysisServiceUnavailable />);

    const heading = screen.getByRole("heading", {
      level: 3,
      name: "Analysis service unavailable",
    });
    expect(screen.getByRole("alert")).toHaveAccessibleName("Analysis service unavailable");
    expect(heading).toHaveFocus();
    expect(screen.getByText(/No analysis request was sent/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(/OpenAI|Gemini|Mistral|provider switch|choose another/i)).not.toBeInTheDocument();
  });

  it("offers only a same-origin availability retry when the caller provides it", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<AnalysisServiceUnavailable onRetry={onRetry} />);

    const retry = screen.getByRole("button", { name: "Check availability again" });
    await user.tab();
    expect(retry).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("prevents duplicate availability retries while a check is pending", () => {
    render(<AnalysisServiceUnavailable onRetry={vi.fn()} retryPending />);

    expect(screen.getByRole("button", { name: "Checking availability…" })).toBeDisabled();
  });
});
