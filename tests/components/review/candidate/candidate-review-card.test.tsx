import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CaseState } from "../../../../lib/contracts";
import { CaseStateProvider } from "../../../../components/shell";
import {
  CandidateReviewCard,
  ReviewWorkspace,
} from "../../../../features/review/candidate";
import { createInitialCaseState } from "../../../../lib/state";
import { checkpointState, NOW } from "./review-test-state";

const PASSPORT_WORDING =
  "Maya reported passport removal; recruiter messages separately refer to passport custody.";

function candidate(state: CaseState, id: string) {
  const value = state.candidates.find((item) => item.id === id);
  if (!value) throw new Error(`Missing candidate ${id}`);
  return value;
}

describe("TASK-021 CandidateReviewCard", () => {
  it("renders wording, separate status dimensions, dependencies, unknowns, and exact source access", () => {
    const state = checkpointState();
    render(
      <CandidateReviewCard
        candidate={candidate(state, "CAND-CTRL-PASSPORT")}
        heroCandidateId="CAND-TASK-0402"
        onCommand={vi.fn()}
        onOpenSource={vi.fn()}
        state={state}
      />,
    );

    expect(screen.getByText("Original suggestion")).toBeInTheDocument();
    expect(screen.getByText("Current reviewed wording")).toBeInTheDocument();
    expect(screen.getByLabelText(/Item origin: AI suggestion/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Evidence nature:/i)).toHaveLength(2);
    expect(screen.getAllByLabelText(/Support status: Partially supported/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Review status: Pending/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Passport removal is reported/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Open exact source/i })).toHaveLength(2);
  });

  it("submits only the narrow edit ReviewIntent with changed wording and reason", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    const onCommand = vi.fn(() => ({ ok: true }));
    render(
      <CandidateReviewCard
        candidate={candidate(state, "CAND-CTRL-PASSPORT")}
        onCommand={onCommand}
        onOpenSource={vi.fn()}
        state={state}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Edit wording" }));
    const wording = screen.getByLabelText("Revised wording");
    await user.clear(wording);
    await user.type(wording, PASSPORT_WORDING);
    await user.type(screen.getByLabelText("Concise reason"), "Preserve the different evidence natures.");
    await user.click(screen.getByRole("button", { name: "Record individual action" }));

    const command = onCommand.mock.calls[0][0];
    expect(command.type).toBe("review_candidate");
    expect(command.intent).toEqual({
      candidateId: "CAND-CTRL-PASSPORT",
      action: "edit",
      editedText: PASSPORT_WORDING,
      reason: "Preserve the different evidence natures.",
    });
    expect(Object.keys(command.intent).sort()).toEqual([
      "action",
      "candidateId",
      "editedText",
      "reason",
    ]);
    expect(command.intent).not.toHaveProperty("actor");
    expect(command.intent).not.toHaveProperty("resultingStatus");
    expect(command.intent).not.toHaveProperty("dependencySnapshot");
    expect(command.intent).not.toHaveProperty("createdAt");
  });

  it("requires a reason and withholds invalid positive acceptance", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    const onCommand = vi.fn();
    render(
      <CandidateReviewCard
        candidate={candidate(state, "CAND-CTRL-CONFINEMENT")}
        onCommand={onCommand}
        onOpenSource={vi.fn()}
        state={state}
      />,
    );

    expect(screen.queryByRole("button", { name: "Accept suggestion" })).not.toBeInTheDocument();
    expect(screen.getByText(/positive proposition cannot be accepted/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reject suggestion" }));
    await user.click(screen.getByRole("button", { name: "Record individual action" }));
    expect(screen.getByText(/Add a concise reason/i)).toBeInTheDocument();
    expect(onCommand).not.toHaveBeenCalled();
  });

  it("uses Confirm as unknown for unknown-state candidates", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    const onCommand = vi.fn(() => ({ ok: true }));
    render(
      <CandidateReviewCard
        candidate={candidate(state, "CAND-URG-INTERPRETER")}
        onCommand={onCommand}
        onOpenSource={vi.fn()}
        state={state}
      />,
    );

    expect(screen.queryByRole("button", { name: "Accept suggestion" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm as unknown" }));
    expect(onCommand.mock.calls[0][0].intent).toEqual({
      candidateId: "CAND-URG-INTERPRETER",
      action: "confirm_unknown",
      reason: null,
    });
  });

  it("opens the dedicated withdrawal preview path without sending withdrawal as ReviewIntent", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    const onCommand = vi.fn();
    const onWithdrawRequest = vi.fn();
    render(
      <CandidateReviewCard
        candidate={candidate(state, "CAND-TASK-0402")}
        heroCandidateId="CAND-TASK-0402"
        onCommand={onCommand}
        onOpenSource={vi.fn()}
        onWithdrawRequest={onWithdrawRequest}
        state={state}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Withdraw evidence" }));
    expect(onWithdrawRequest).toHaveBeenCalledWith(candidate(state, "CAND-TASK-0402"));
    expect(onCommand).not.toHaveBeenCalled();
  });
});

describe("TASK-021 Review workspace composition", () => {
  it("shows checkpoint and replay provenance, fixture-reviewer attribution, all hero regions, and Trust navigation", () => {
    const state = checkpointState();
    render(
      <CaseStateProvider initialState={state}>
        <ReviewWorkspace />
      </CaseStateProvider>,
    );

    expect(screen.getByText("Prepared synthetic review checkpoint")).toBeInTheDocument();
    expect(screen.getByText("Bundled deterministic replay, not live AI")).toBeInTheDocument();
    expect(screen.getByText(/Seeded decisions are attributed to Fixture reviewer/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Source-linked timeline" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Charge-Coercion Nexus" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Three review lanes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review queue" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Candidate review" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Context gaps" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dependency change" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Trust and Safety|Open Trust and Safety/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /bulk/i })).not.toBeInTheDocument();
    expect(screen.getByText("No score · no legal conclusion")).toBeInTheDocument();

    const taskCard = document.getElementById("candidate-CAND-TASK-0402");
    expect(taskCard).not.toBeNull();
    expect(within(taskCard!).getByText(/Last review: accept by Fixture reviewer/i)).toBeInTheDocument();
  });

  it("renders explicit empty and safe failed states instead of blank success", () => {
    const initial = createInitialCaseState(NOW);
    const view = render(
      <CaseStateProvider initialState={initial}>
        <ReviewWorkspace />
      </CaseStateProvider>,
    );
    expect(screen.getByText("Review has not started")).toBeInTheDocument();
    expect(screen.getByText(/No canonical candidates/i)).toBeInTheDocument();

    const checkpoint = checkpointState();
    const failed = {
      ...checkpoint,
      analysisRuns: checkpoint.analysisRuns.map((run) => ({ ...run, status: "failed" })),
      candidates: [],
      citations: [],
    } as unknown as CaseState;
    view.unmount();
    render(
      <CaseStateProvider initialState={failed}>
        <ReviewWorkspace />
      </CaseStateProvider>,
    );
    expect(screen.getByText("No accepted analysis output")).toBeInTheDocument();
    expect(screen.getByText(/failed run created no review candidates/i)).toBeInTheDocument();
  });
});
