import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewLanes } from "../../../../features/review/lanes";
import { applyCaseCommand } from "../../../../lib/state";
import {
  checkpointState,
  commandMeta,
} from "../candidate/review-test-state";

describe("TASK-021 three review lanes", () => {
  it("renders three separate labelled regions with their exact non-decision boundaries", () => {
    const state = checkpointState();
    render(<ReviewLanes state={state} />);

    const laneA = screen.getByRole("region", { name: "Trafficking indicators for review" });
    const laneB = screen.getByRole("region", { name: "Non-punishment relevance for review" });
    const laneC = screen.getByRole("region", { name: "Protection, remedy, and procedural urgency" });
    expect(within(laneA).getByText(/do not determine trafficking or victim status/i)).toBeInTheDocument();
    expect(within(laneB).getByText(/not eligibility.*Domestic legal verification is required/i)).toBeInTheDocument();
    expect(within(laneC).getByText(/never contacts a court, service, police agency/i)).toBeInTheDocument();
    expect(screen.getByText(/Cooperation status.*does not change evidence, Nexus, or protection results/i)).toBeInTheDocument();
  });

  it("projects all lane items from canonical candidates without merging IDs or actions", () => {
    const state = checkpointState();
    render(<ReviewLanes state={state} />);

    const links = screen.getAllByRole("link", { name: "Open canonical candidate" });
    expect(links).toHaveLength(14);
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(new Set(hrefs).size).toBe(14);
    expect(screen.getByText("CAND-META-COOPERATION")).toBeInTheDocument();
    expect(screen.getByText("NEXUS-OFFENCE-TIMING")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /approve all|bulk/i })).not.toBeInTheDocument();
  });

  it("reflects a central review transition on rerender with no retained earlier lane status", () => {
    const before = checkpointState();
    const result = applyCaseCommand(before, {
      type: "review_candidate",
      meta: commandMeta(before, "reject-confinement"),
      intent: {
        candidateId: "CAND-CTRL-CONFINEMENT",
        action: "reject",
        reason: "The reported account does not independently confirm confinement.",
      },
    });
    if (!result.ok) throw new Error(result.reason);

    const { rerender } = render(<ReviewLanes state={before} />);
    let card = screen.getByText("CAND-CTRL-CONFINEMENT").closest("article")!;
    expect(within(card).getByLabelText(/Review status: Pending/i)).toBeInTheDocument();

    rerender(<ReviewLanes state={result.state} />);
    card = screen.getByText("CAND-CTRL-CONFINEMENT").closest("article")!;
    expect(within(card).getByLabelText(/Review status: Rejected/i)).toBeInTheDocument();
    expect(within(card).queryByLabelText(/Review status: Pending/i)).not.toBeInTheDocument();
  });

  it("renders explicit loading, blocked, error, and per-lane empty states", () => {
    const state = checkpointState();
    const { rerender } = render(<ReviewLanes dataState={{ kind: "loading" }} state={state} />);
    expect(screen.getByLabelText("Loading review lanes")).toBeInTheDocument();

    rerender(<ReviewLanes dataState={{ kind: "blocked", message: "Review lanes are blocked by coverage." }} state={state} />);
    expect(screen.getByText("Review lanes are blocked by coverage.")).toBeInTheDocument();

    rerender(<ReviewLanes dataState={{ kind: "error", message: "Review lane projection failed." }} state={state} />);
    expect(screen.getByText("Review lane projection failed.")).toBeInTheDocument();

    rerender(<ReviewLanes state={{ ...state, candidates: [] }} />);
    expect(screen.getAllByText(/No candidates in this lane/i)).toHaveLength(3);
  });
});
