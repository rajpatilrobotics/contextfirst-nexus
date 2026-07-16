import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CaseCandidate, CaseCommand, CaseState } from "../../../../lib/contracts";
import {
  ContextGapList,
  ContextGapPanel,
} from "../../../../features/review/context-gaps";
import type { CaseCommandDispatcher } from "../../../../features/review/source";
import { applyCaseCommand } from "../../../../lib/state";
import { checkpointState } from "../candidate/review-test-state";

type ContextGap = Extract<CaseCandidate, { kind: "context_gap" }>;

function gap(state: CaseState, id: string) {
  const value = state.candidates.find(
    (candidate): candidate is ContextGap => candidate.id === id && candidate.kind === "context_gap",
  );
  if (!value) throw new Error(`Missing gap ${id}`);
  return value;
}

function CanonicalGapHarness() {
  const [state, setState] = useState(checkpointState);
  function dispatch(command: CaseCommand) {
    const result = applyCaseCommand(state, command);
    if (result.ok) setState(result.state);
    return result;
  }
  return <ContextGapPanel gap={gap(state, "CAND-URG-INTERPRETER")} onCommand={dispatch} state={state} />;
}

describe("TASK-021 context gaps", () => {
  it("offers all four exact gap actions and keeps unknowns non-adverse", () => {
    const state = checkpointState();
    render(<ContextGapPanel gap={gap(state, "CAND-URG-INTERPRETER")} onCommand={vi.fn()} state={state} />);
    expect(screen.getByRole("button", { name: "Answer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Defer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preserve as unknown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Outside current scope" })).toBeInTheDocument();
    expect(screen.getByText(/This gap is not adverse evidence and does not have to be answered/i)).toBeInTheDocument();
  });

  it("submits a narrow reviewer-supplied answer intent", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    const onCommand = vi.fn<CaseCommandDispatcher>(() => ({ ok: true }));
    render(<ContextGapPanel gap={gap(state, "CAND-URG-INTERPRETER")} onCommand={onCommand} state={state} />);

    await user.click(screen.getByRole("button", { name: "Answer" }));
    await user.type(screen.getByLabelText("Reviewer-supplied context"), "Interpreter booking is being checked by the practitioner.");
    await user.click(screen.getByRole("button", { name: "Record gap response" }));
    expect(onCommand).toHaveBeenCalledTimes(1);
    const call = onCommand.mock.calls[0];
    if (!call) throw new Error("Expected the context-gap command to be recorded");
    const [command] = call;
    if (command.type !== "respond_context_gap") throw new Error(`Unexpected command ${command.type}`);
    expect(command.type).toBe("respond_context_gap");
    expect(command.intent).toEqual({
      gapId: "CAND-URG-INTERPRETER",
      responseStatus: "answered",
      response: "Interpreter booking is being checked by the practitioner.",
      responseExplanation: null,
    });
    expect(command.intent).not.toHaveProperty("evidenceNature");
    expect(command.intent).not.toHaveProperty("reviewStatus");
  });

  it("requires explanations for defer and outside-scope responses", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    const onCommand = vi.fn();
    const { rerender } = render(<ContextGapPanel gap={gap(state, "CAND-SENDER-0402")} onCommand={onCommand} state={state} />);

    await user.click(screen.getByRole("button", { name: "Defer" }));
    await user.click(screen.getByRole("button", { name: "Record gap response" }));
    expect(screen.getByText(/Add a concise explanation/i)).toBeInTheDocument();
    expect(onCommand).not.toHaveBeenCalled();

    rerender(<ContextGapPanel gap={gap(state, "CAND-SENDER-0402")} onCommand={onCommand} state={state} />);
    await user.click(screen.getByRole("button", { name: "Outside current scope" }));
    expect(screen.getByLabelText("Concise explanation")).toBeInTheDocument();
  });

  it("preserves unknown through the central dispatcher and visibly retains unknown evidence nature", async () => {
    const user = userEvent.setup();
    render(<CanonicalGapHarness />);
    await user.click(screen.getByRole("button", { name: "Preserve as unknown" }));
    expect(await screen.findByText("Preserved as unknown")).toBeInTheDocument();
    expect(screen.getByText(/response recorded without changing source evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/not adverse evidence/i)).toBeInTheDocument();
  });

  it("renders both canonical gaps and an explicit empty state", () => {
    const state = checkpointState();
    const { rerender } = render(<ContextGapList onCommand={vi.fn()} state={state} />);
    expect(screen.getByText("CAND-SENDER-0402")).toBeInTheDocument();
    expect(screen.getByText("CAND-URG-INTERPRETER")).toBeInTheDocument();

    rerender(<ContextGapList onCommand={vi.fn()} state={{ ...state, candidates: state.candidates.filter((candidate) => candidate.kind !== "context_gap") }} />);
    expect(screen.getByText(/contains no context-gap records/i)).toBeInTheDocument();
    expect(screen.getByText(/not an inference that no information is missing/i)).toBeInTheDocument();
  });
});
