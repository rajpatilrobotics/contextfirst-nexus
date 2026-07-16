import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LIMITATION_TEXT } from "../../../../lib/review";
import { applyCaseCommand } from "../../../../lib/state";
import { NexusMatrix } from "../../../../features/review/nexus";
import type { CaseCommandDispatcher } from "../../../../features/review/source";
import {
  checkpointState,
  commandMeta,
  withdrawnCheckpointState,
} from "../candidate/review-test-state";

describe("TASK-021 Charge-Coercion Nexus", () => {
  it("renders exactly six canonical rows in a semantic desktop table", () => {
    const state = checkpointState();
    render(
      <NexusMatrix
        onCommand={vi.fn()}
        onOpenSource={vi.fn()}
        presentation="desktop"
        state={state}
      />,
    );

    const table = screen.getByRole("table", { name: /Six source-linked relationship questions/i });
    expect(table).toBeInTheDocument();
    expect(within(table).getAllByRole("columnheader")).toHaveLength(4);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(6);
    for (const id of [
      "NEXUS-RECRUITMENT",
      "NEXUS-MOVEMENT",
      "NEXUS-CONTROL",
      "NEXUS-COMPELLED-TASKS",
      "NEXUS-OFFENCE-TIMING",
      "NEXUS-URGENCY",
    ]) {
      expect(within(table).getByRole("rowheader", { name: new RegExp(`^${id}`) })).toBeInTheDocument();
    }
    expect(screen.getByText("No score · no legal conclusion")).toBeInTheDocument();
  });

  it("renders a semantically equivalent six-card mobile representation without horizontal-table dependence", () => {
    const state = checkpointState();
    render(
      <NexusMatrix
        onCommand={vi.fn()}
        onOpenSource={vi.fn()}
        presentation="mobile"
        state={state}
      />,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Charge-Coercion Nexus rows" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("Current reviewed relationship")).toHaveLength(6);
    expect(screen.getAllByLabelText("Support and dependencies")).toHaveLength(6);
    expect(screen.getAllByLabelText("Limits and unknowns")).toHaveLength(6);
    expect(screen.getAllByLabelText("Review action")).toHaveLength(6);
  });

  it("does not create duplicate approval for derived or optional rows", () => {
    const state = checkpointState();
    render(
      <NexusMatrix
        onCommand={vi.fn()}
        onOpenSource={vi.fn()}
        presentation="desktop"
        state={state}
      />,
    );

    const table = screen.getByRole("table");
    const controlRow = within(table).getByRole("rowheader", { name: /^NEXUS-CONTROL/ }).closest("tr")!;
    expect(within(controlRow).getByText(/Derived summary/i)).toBeInTheDocument();
    expect(within(controlRow).queryByRole("button", { name: "Accept suggestion" })).not.toBeInTheDocument();

    const movementRow = within(table).getByRole("rowheader", { name: /^NEXUS-MOVEMENT/ }).closest("tr")!;
    expect(within(movementRow).getByText(/no additional approval is required/i)).toBeInTheDocument();

    const compelledRow = within(table).getByRole("rowheader", { name: /^NEXUS-COMPELLED-TASKS/ }).closest("tr")!;
    expect(within(compelledRow).getByRole("button", { name: "Accept suggestion" })).toBeInTheDocument();
  });

  it("shows changed support and permits offence timing only through the exact limitation action after withdrawal", async () => {
    const user = userEvent.setup();
    const state = withdrawnCheckpointState();
    const onCommand = vi.fn<CaseCommandDispatcher>(() => ({ ok: true }));
    render(
      <NexusMatrix
        onCommand={onCommand}
        onOpenSource={vi.fn()}
        presentation="desktop"
        state={state}
      />,
    );

    const table = screen.getByRole("table");
    const compelledRow = within(table).getByRole("rowheader", { name: /^NEXUS-COMPELLED-TASKS/ }).closest("tr")!;
    expect(within(compelledRow).getByLabelText(/Review status: Invalidated/i)).toBeInTheDocument();
    expect(within(compelledRow).getByRole("button", { name: "Accept suggestion" })).toBeInTheDocument();

    const timingRow = within(table).getByRole("rowheader", { name: /^NEXUS-OFFENCE-TIMING/ }).closest("tr")!;
    expect(within(timingRow).getByLabelText(/Support status: Insufficient evidence/i)).toBeInTheDocument();
    expect(within(timingRow).queryByRole("button", { name: "Accept suggestion" })).not.toBeInTheDocument();
    await user.click(within(timingRow).getByRole("button", { name: "Record as limitation" }));
    const wording = within(timingRow).getByLabelText("Limitation wording");
    await user.clear(wording);
    await user.type(wording, LIMITATION_TEXT);
    await user.type(within(timingRow).getByLabelText("Concise reason"), "The assigned-task dependency was withdrawn.");
    await user.click(within(timingRow).getByRole("button", { name: "Record individual action" }));

    expect(onCommand).toHaveBeenCalledTimes(1);
    const call = onCommand.mock.calls[0];
    if (!call) throw new Error("Expected the Nexus review command to be recorded");
    const [command] = call;
    if (command.type !== "review_candidate") throw new Error(`Unexpected command ${command.type}`);
    expect(command.intent).toEqual({
      candidateId: "NEXUS-OFFENCE-TIMING",
      action: "accept_as_limitation",
      limitationText: LIMITATION_TEXT,
      reason: "The assigned-task dependency was withdrawn.",
    });
  });

  it("replaces the current positive offence-timing text with the canonical limitation after renewed review", () => {
    const withdrawn = withdrawnCheckpointState();
    const result = applyCaseCommand(withdrawn, {
      type: "review_candidate",
      meta: commandMeta(withdrawn, "record-timing-limitation"),
      intent: {
        candidateId: "NEXUS-OFFENCE-TIMING",
        action: "accept_as_limitation",
        limitationText: LIMITATION_TEXT,
        reason: "The assigned-task dependency was withdrawn.",
      },
    });
    if (!result.ok) throw new Error(result.reason);

    render(
      <NexusMatrix
        onCommand={vi.fn()}
        onOpenSource={vi.fn()}
        presentation="desktop"
        state={result.state}
      />,
    );

    const table = screen.getByRole("table");
    const timingRow = within(table).getByRole("rowheader", { name: /^NEXUS-OFFENCE-TIMING/ }).closest("tr")!;
    expect(
      within(within(timingRow).getByLabelText("Current reviewed relationship")).getByText(LIMITATION_TEXT),
    ).toBeInTheDocument();
    expect(within(timingRow).getByText(/Original suggestion — superseded, not a current finding/i)).toBeInTheDocument();
    expect(within(timingRow).getByLabelText(/Item origin: AI suggestion/i)).toBeInTheDocument();
  });

  it("renders explicit loading, empty, blocked, warning, and error states", () => {
    const state = checkpointState();
    const { rerender } = render(
      <NexusMatrix dataState={{ kind: "loading" }} onCommand={vi.fn()} onOpenSource={vi.fn()} presentation="desktop" state={state} />,
    );
    expect(screen.getByLabelText("Loading Nexus")).toBeInTheDocument();

    rerender(<NexusMatrix onCommand={vi.fn()} onOpenSource={vi.fn()} presentation="desktop" state={{ ...state, candidates: [] }} />);
    expect(screen.getByText(/contains no Nexus relationship records/i)).toBeInTheDocument();

    rerender(<NexusMatrix dataState={{ kind: "blocked", message: "Coverage blocks affected rows." }} onCommand={vi.fn()} onOpenSource={vi.fn()} presentation="desktop" state={state} />);
    expect(screen.getByText("Coverage blocks affected rows.")).toBeInTheDocument();

    rerender(<NexusMatrix dataState={{ kind: "partial", message: "D04 page 3 is unavailable." }} onCommand={vi.fn()} onOpenSource={vi.fn()} presentation="desktop" state={state} />);
    expect(screen.getByText("D04 page 3 is unavailable.")).toBeInTheDocument();

    rerender(<NexusMatrix dataState={{ kind: "error", message: "Canonical Nexus failed to load." }} onCommand={vi.fn()} onOpenSource={vi.fn()} presentation="desktop" state={state} />);
    expect(screen.getByText("Canonical Nexus failed to load.")).toBeInTheDocument();
  });
});
