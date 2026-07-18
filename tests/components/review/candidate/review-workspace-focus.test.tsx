import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaseStateProvider, useCaseState } from "../../../../components/shell";
import { ReviewWorkspace } from "../../../../features/review/candidate";
import { commandMeta, checkpointState } from "./review-test-state";

const ORIGINAL_URL = window.location.href;

function setReviewUrl(suffix = "") {
  window.history.replaceState(null, "", `/case/demo/review${suffix}`);
}

function LoadCheckpointControl() {
  const { state, dispatchCaseCommand } = useCaseState();

  return (
    <button
      onClick={() => {
        const result = dispatchCaseCommand({
          type: "load_demo_checkpoint",
          meta: commandMeta(state, "focus-load-checkpoint"),
          checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
        });
        if (!result.ok) throw new Error(result.reason);
      }}
      type="button"
    >
      Load prepared checkpoint
    </button>
  );
}

function ReviewUpdateControl() {
  const { state, dispatchCaseCommand } = useCaseState();

  return (
    <button
      onClick={() => {
        const result = dispatchCaseCommand({
          type: "review_candidate",
          meta: commandMeta(state, "focus-review-update"),
          intent: {
            candidateId: "CAND-CTRL-PASSPORT",
            action: "mark_uncertain",
            reason: "Need a narrower source-grounded wording before export.",
          },
        });
        if (!result.ok) throw new Error(result.reason);
      }}
      type="button"
    >
      Record later review update
    </button>
  );
}

function renderWorkspace() {
  return render(
    <CaseStateProvider initialState={checkpointState()}>
      <ReviewWorkspace />
    </CaseStateProvider>,
  );
}

function renderHydratingWorkspace() {
  return render(
    <CaseStateProvider>
      <LoadCheckpointControl />
      <ReviewUpdateControl />
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
  vi.restoreAllMocks();
  window.sessionStorage.clear();
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
    expect(document.getElementById("citations")).toHaveAttribute("tabindex", "-1");
    expect(document.getElementById("dependencies")).toHaveAttribute("tabindex", "-1");
  });

  it("focuses the newly rendered target after the canonical checkpoint transition", () => {
    vi.useFakeTimers();
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    setReviewUrl("?exportBlocker=REVIEW_INCOMPLETE#review-workspace");

    renderHydratingWorkspace();

    expect(screen.getByText("Review has not started")).toBeInTheDocument();
    expect(document.getElementById("review-workspace")).toBeNull();
    runScheduledFocus();
    expect(
      focusSpy.mock.contexts.some(
        (context) => context instanceof HTMLElement && context.id === "review-workspace",
      ),
    ).toBe(false);

    act(() => {
      screen.getByRole("button", { name: "Load prepared checkpoint" }).click();
    });

    const target = screen.getByRole("region", { name: "Review workspace" });
    expect(target).not.toHaveFocus();
    runScheduledFocus();

    expect(target).toHaveFocus();
    expect(screen.queryByText("REVIEW_INCOMPLETE")).not.toBeInTheDocument();
    expect(target).toHaveAccessibleName("Review workspace");
    const targetFocusCalls = focusSpy.mock.contexts
      .map((context, index) => ({ args: focusSpy.mock.calls[index], context }))
      .filter(({ context }) => context === target);
    expect(targetFocusCalls).toHaveLength(1);
    expect(targetFocusCalls[0]?.args).toEqual([{ preventScroll: true }]);

    const updateButton = screen.getByRole("button", { name: "Record later review update" });
    updateButton.focus();
    expect(updateButton).toHaveFocus();
    act(() => {
      updateButton.click();
    });
    runScheduledFocus();

    expect(updateButton).toHaveFocus();
    expect(
      focusSpy.mock.contexts.filter((context) => context === target),
    ).toHaveLength(1);
  });

  it("does not steal focus during ordinary Review entry before or after checkpoint load", () => {
    vi.useFakeTimers();
    setReviewUrl();
    const sentinel = document.createElement("button");
    sentinel.dataset.reviewFocusSentinel = "true";
    sentinel.textContent = "Existing focus";
    document.body.append(sentinel);
    sentinel.focus();

    renderHydratingWorkspace();
    runScheduledFocus();
    expect(sentinel).toHaveFocus();

    act(() => {
      screen.getByRole("button", { name: "Load prepared checkpoint" }).click();
    });
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
      renderHydratingWorkspace();
      runScheduledFocus();
      expect(document.getElementById("review-workspace")).toBeNull();

      act(() => {
        screen.getByRole("button", { name: "Load prepared checkpoint" }).click();
      });
      const target = screen.getByRole("region", { name: "Review workspace" });
      runScheduledFocus();

      expect(target).not.toHaveFocus();
    },
  );

  it("does not focus after unmount before the checkpoint makes the target available", () => {
    vi.useFakeTimers();
    setReviewUrl("#review-workspace");
    const view = renderHydratingWorkspace();

    expect(document.getElementById("review-workspace")).toBeNull();
    view.unmount();
    runScheduledFocus();

    expect(document.activeElement).toBe(document.body);
  });

  it("cleans up scheduled focus when the rendered workspace unmounts", () => {
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

  it("does not use the query string as a focus signal without the exact hash", () => {
    vi.useFakeTimers();
    setReviewUrl("?exportBlocker=REVIEW_INCOMPLETE");
    renderWorkspace();

    const target = screen.getByRole("region", { name: "Review workspace" });
    runScheduledFocus();

    expect(target).not.toHaveFocus();
    expect(screen.queryByText("REVIEW_INCOMPLETE")).not.toBeInTheDocument();
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

    expect(screen.getByText("Prepared demo review checkpoint")).toBeInTheDocument();
    expect(screen.getByText("Bundled deterministic replay, not live AI")).toBeInTheDocument();
    expect(screen.getByText("Explore timeline and supporting analysis")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review required items" })).toBeInTheDocument();

    const taskCard = document.getElementById("candidate-CAND-TASK-0402");
    expect(taskCard).not.toBeNull();
    expect(within(taskCard!).getByText(/Last review: accept by Fixture reviewer/i)).toBeInTheDocument();
  });
});
