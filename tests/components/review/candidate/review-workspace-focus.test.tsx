import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaseStateProvider } from "../../../../components/shell";
import { ReviewWorkspace } from "../../../../features/review/candidate";
import { checkpointState } from "./review-test-state";

const ORIGINAL_URL = window.location.href;

function setReviewUrl(suffix = "") {
  window.history.replaceState(null, "", `/case/demo/review${suffix}`);
}

function renderWorkspace() {
  return render(
    <CaseStateProvider initialState={checkpointState()}>
      <ReviewWorkspace />
    </CaseStateProvider>,
  );
}

function runScheduledFocus() {
  act(() => {
    vi.runOnlyPendingTimers();
  });
}

afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, "", ORIGINAL_URL);
  document.querySelectorAll("[data-review-focus-sentinel]").forEach((element) => element.remove());
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
});

describe("TASK-032 Review workspace remediation focus bridge", () => {
  it("exposes a stable accessible remediation target named by the visible heading", () => {
    setReviewUrl();
    renderWorkspace();

    const target = screen.getByRole("region", { name: "Review workspace" });
    expect(target).toHaveAttribute("id", "review-workspace");
    expect(target).toHaveAttribute("tabindex", "-1");
    expect(target).toHaveAttribute("aria-labelledby", "review-workspace-heading");
    expect(within(target).getByRole("heading", { name: "Review workspace" })).toHaveAttribute(
      "id",
      "review-workspace-heading",
    );
  });

  it("focuses the exact target after hydration for the real export remediation URL", () => {
    vi.useFakeTimers();
    setReviewUrl("?exportBlocker=REVIEW_INCOMPLETE#review-workspace");
    renderWorkspace();

    const target = screen.getByRole("region", { name: "Review workspace" });
    expect(target).not.toHaveFocus();

    runScheduledFocus();

    expect(target).toHaveFocus();
    expect(screen.queryByText("REVIEW_INCOMPLETE")).not.toBeInTheDocument();
    expect(target).toHaveAccessibleName("Review workspace");
  });

  it("does not steal focus during ordinary Review entry", () => {
    vi.useFakeTimers();
    setReviewUrl();
    const sentinel = document.createElement("button");
    sentinel.dataset.reviewFocusSentinel = "true";
    sentinel.textContent = "Existing focus";
    document.body.append(sentinel);
    sentinel.focus();

    renderWorkspace();
    const target = screen.getByRole("region", { name: "Review workspace" });
    runScheduledFocus();

    expect(sentinel).toHaveFocus();
    expect(target).not.toHaveFocus();
  });

  it.each(["#", "#candidate-review", "#review-workspace/", "#Review-Workspace"])(
    "does not focus for non-matching hash %s",
    (hash) => {
      vi.useFakeTimers();
      setReviewUrl(hash);
      renderWorkspace();

      const target = screen.getByRole("region", { name: "Review workspace" });
      runScheduledFocus();

      expect(target).not.toHaveFocus();
    },
  );

  it("cleans up scheduled focus when the workspace unmounts", () => {
    vi.useFakeTimers();
    setReviewUrl("#review-workspace");
    const view = renderWorkspace();
    const target = screen.getByRole("region", { name: "Review workspace" });
    const focusSpy = vi.spyOn(target, "focus");

    view.unmount();
    runScheduledFocus();

    expect(focusSpy).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(target);
  });

  it("stays outside sequential tab order while retaining programmatic focus", async () => {
    const user = userEvent.setup();
    setReviewUrl();
    const sentinel = document.createElement("button");
    sentinel.dataset.reviewFocusSentinel = "true";
    sentinel.textContent = "Before workspace";
    document.body.append(sentinel);
    sentinel.focus();

    renderWorkspace();
    const target = screen.getByRole("region", { name: "Review workspace" });
    expect(target).toHaveAttribute("tabindex", "-1");

    await user.tab();
    expect(target).not.toHaveFocus();

    target.focus();
    expect(target).toHaveFocus();
  });

  it("preserves existing Review workspace smoke behavior", () => {
    setReviewUrl();
    renderWorkspace();

    expect(screen.getByText("Prepared synthetic review checkpoint")).toBeInTheDocument();
    expect(screen.getByText("Bundled deterministic replay, not live AI")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review queue" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Candidate review" })).toBeInTheDocument();

    const taskCard = document.getElementById("candidate-CAND-TASK-0402");
    expect(taskCard).not.toBeNull();
    expect(within(taskCard!).getByText(/Last review: accept by Fixture reviewer/i)).toBeInTheDocument();
  });
});
