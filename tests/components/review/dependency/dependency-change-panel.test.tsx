import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CaseCommand, CaseState } from "../../../../lib/contracts";
import {
  DependencyChangePanel,
  selectCanonicalWithdrawalPreview,
} from "../../../../features/review/dependency";
import type { CaseCommandDispatcher } from "../../../../features/review/source";
import { LIMITATION_TEXT } from "../../../../lib/review";
import { applyCaseCommand } from "../../../../lib/state";
import {
  checkpointState,
  commandMeta,
  withdrawnCheckpointState,
} from "../candidate/review-test-state";

function candidate(state: CaseState, id: string) {
  const value = state.candidates.find((item) => item.id === id);
  if (!value) throw new Error(`Missing candidate ${id}`);
  return value;
}

function CanonicalWithdrawalHarness() {
  const [state, setState] = useState(checkpointState);
  const [selectedId, setSelectedId] = useState<string | null>("CAND-TASK-0402");
  function dispatch(command: CaseCommand) {
    const result = applyCaseCommand(state, command);
    if (result.ok) setState(result.state);
    return result;
  }
  return (
    <DependencyChangePanel
      candidateToWithdraw={selectedId ? candidate(state, selectedId) : null}
      onCancelWithdrawal={() => setSelectedId(null)}
      onCommand={dispatch}
      state={state}
    />
  );
}

describe("TASK-021 dependency change and hero withdrawal", () => {
  it("previews exactly the two canonical downstream Nexus items and no unrelated item", () => {
    const state = checkpointState();
    expect(
      selectCanonicalWithdrawalPreview(state.candidates, "CAND-TASK-0402").map((item) => item.id),
    ).toEqual(["NEXUS-COMPELLED-TASKS", "NEXUS-OFFENCE-TIMING"]);

    render(
      <DependencyChangePanel
        candidateToWithdraw={candidate(state, "CAND-TASK-0402")}
        onCancelWithdrawal={vi.fn()}
        onCommand={vi.fn()}
        state={state}
      />,
    );
    const dialog = screen.getByRole("alertdialog", { name: "Confirm evidence withdrawal" });
    expect(dialog).toHaveTextContent("NEXUS-COMPELLED-TASKS");
    expect(dialog).toHaveTextContent("NEXUS-OFFENCE-TIMING");
    expect(dialog).not.toHaveTextContent("CAND-TL-ARRIVAL");
  });

  it("requires a reason and dispatches only the dedicated withdraw_candidate command", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    const onCommand = vi.fn<CaseCommandDispatcher>(() => ({ ok: true }));
    render(
      <DependencyChangePanel
        candidateToWithdraw={candidate(state, "CAND-TASK-0402")}
        onCancelWithdrawal={vi.fn()}
        onCommand={onCommand}
        state={state}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Withdraw evidence and recalculate" }));
    expect(screen.getByText(/Add a concise reason/i)).toBeInTheDocument();
    expect(onCommand).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Reason for withdrawal"), "The record should no longer support the handoff.");
    await user.click(screen.getByRole("button", { name: "Withdraw evidence and recalculate" }));
    expect(onCommand).toHaveBeenCalledTimes(1);
    const call = onCommand.mock.calls[0];
    if (!call) throw new Error("Expected the withdrawal command to be recorded");
    const [command] = call;
    expect(command).toMatchObject({
      type: "withdraw_candidate",
      candidateId: "CAND-TASK-0402",
      reason: "The record should no longer support the handoff.",
    });
    expect(command).not.toHaveProperty("intent");
  });

  it("persists before-and-after feedback, moves focus, and announces the three invalidated items", async () => {
    const user = userEvent.setup();
    render(<CanonicalWithdrawalHarness />);

    await user.type(screen.getByLabelText("Reason for withdrawal"), "Task-log provenance cannot support this reviewed handoff.");
    await user.click(screen.getByRole("button", { name: "Withdraw evidence and recalculate" }));

    const summary = await screen.findByRole("region", { name: "Support changed after evidence withdrawal" });
    await waitFor(() => expect(summary).toHaveFocus());
    expect(summary).toHaveTextContent("CAND-TASK-0402");
    expect(summary).toHaveTextContent("NEXUS-COMPELLED-TASKS");
    expect(summary).toHaveTextContent("NEXUS-OFFENCE-TIMING");
    expect(summary).toHaveTextContent("Export readiness was revoked");
    expect(summary).toHaveTextContent("Before");
    expect(summary).toHaveTextContent("After");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Invalidated items: CAND-TASK-0402, NEXUS-COMPELLED-TASKS, NEXUS-OFFENCE-TIMING. Export readiness revoked.",
    );
  });

  it("preserves unrelated decisions and completes renewed review with the exact limitation and audit trail", () => {
    const withdrawn = withdrawnCheckpointState();
    const unrelatedBefore = candidate(checkpointState(), "CAND-TL-ARRIVAL");
    const unrelatedAfterWithdrawal = candidate(withdrawn, "CAND-TL-ARRIVAL");
    expect(unrelatedAfterWithdrawal.reviewStatus).toBe(unrelatedBefore.reviewStatus);

    const renewedCompelled = applyCaseCommand(withdrawn, {
      type: "review_candidate",
      meta: commandMeta(withdrawn, "renew-compelled"),
      intent: {
        candidateId: "NEXUS-COMPELLED-TASKS",
        action: "accept",
        reason: null,
      },
    });
    if (!renewedCompelled.ok) throw new Error(renewedCompelled.reason);

    const renewedTiming = applyCaseCommand(renewedCompelled.state, {
      type: "review_candidate",
      meta: commandMeta(renewedCompelled.state, "record-timing-limitation"),
      intent: {
        candidateId: "NEXUS-OFFENCE-TIMING",
        action: "accept_as_limitation",
        limitationText: LIMITATION_TEXT,
        reason: "The accepted assignment dependency was withdrawn.",
      },
    });
    if (!renewedTiming.ok) throw new Error(renewedTiming.reason);

    const final = renewedTiming.state;
    expect(candidate(final, "CAND-TASK-0402")).toMatchObject({
      reviewStatus: "invalidated",
      inclusionStatus: "withdrawn",
    });
    expect(candidate(final, "NEXUS-COMPELLED-TASKS").reviewStatus).toBe("human_accepted");
    expect(candidate(final, "NEXUS-OFFENCE-TIMING")).toMatchObject({
      supportStatus: "insufficient_evidence",
      reviewStatus: "human_edited",
      assertionMode: "limitation",
      currentText: LIMITATION_TEXT,
    });
    expect(candidate(final, "CAND-TL-ARRIVAL").reviewStatus).toBe(unrelatedBefore.reviewStatus);
    expect(final.dependencyChanges).toHaveLength(1);
    expect(final.dependencyChanges[0].exportReadinessRevoked).toBe(true);
    expect(final.audit.some((event) => event.eventType === "evidence_withdrawn")).toBe(true);
    expect(final.audit.filter((event) => event.eventType === "candidate_reviewed").length).toBeGreaterThanOrEqual(2);
    expect(final.reviews.at(-1)).toMatchObject({
      candidateId: "NEXUS-OFFENCE-TIMING",
      action: "accept_as_limitation",
      editedText: LIMITATION_TEXT,
    });
    expect(final.candidates.some((item) => item.currentText.includes("overlaps the documented task entry") && item.reviewStatus !== "invalidated")).toBe(false);
  });
});
