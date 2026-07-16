import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createTrustedReplayBundle, createReplayInputState, trustedSegments } from "../../../../lib/analysis/replay";
import type { CaseState } from "../../../../lib/contracts";
import { cfnDemoFixture } from "../../../../lib/fixtures";
import { createInitialCaseState } from "../../../../lib/state";
import { Timeline, TimelineEventCard, TimelineSourceExperience } from "../../../../features/review/timeline";

const NOW = "2026-07-16T00:00:00.000Z";

function reviewState(): CaseState {
  const bundle = createTrustedReplayBundle();
  const run = { ...bundle.replayRun, inputState: createReplayInputState() };
  return {
    ...createInitialCaseState(NOW),
    documents: cfnDemoFixture.documents as CaseState["documents"],
    segments: trustedSegments(),
    analysisRuns: [run],
    activeAnalysisRunId: run.id,
    candidates: bundle.candidates,
    citations: bundle.citations,
  } as CaseState;
}

describe("TASK-020 qualified timeline", () => {
  it("renders canonical timeline events with separate status dimensions and source controls", () => {
    const state = reviewState();
    render(<Timeline onOpenSource={vi.fn()} state={state} />);

    expect(screen.getByRole("list", { name: "Qualified timeline events" })).toBeInTheDocument();
    expect(screen.getByText("2025-04-02 assigned deceptive-message task")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Evidence nature: Documented in source/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Item origin: AI suggestion/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Support status: Exact-source supported/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Review status: Pending/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Open exact source: D05, page 1, D05-P1-S05/i })).toBeEnabled();
  });

  it("keeps a selected filter while source opening is handled outside the ordered list", async () => {
    const user = userEvent.setup();
    const state = reviewState();
    const open = vi.fn();
    render(<Timeline onOpenSource={open} state={state} />);

    await user.selectOptions(screen.getByLabelText("Filter timeline"), "alleged_conduct");
    expect(screen.getByText("2025-04-02 alleged communication")).toBeInTheDocument();
    expect(screen.queryByText("Initial customer-support offer")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Open exact source: D06/i }));
    expect(open).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Filter timeline")).toHaveValue("alleged_conduct");
  });

  it("shows explicit loading, empty, partial, and error states", () => {
    const state = reviewState();
    const { rerender } = render(<Timeline dataState={{ kind: "loading" }} onOpenSource={vi.fn()} state={state} />);
    expect(screen.getByLabelText("Loading timeline")).toBeInTheDocument();

    rerender(<Timeline onOpenSource={vi.fn()} state={{ ...state, candidates: [] }} />);
    expect(screen.getByText(/No canonical events match this filter/i)).toBeInTheDocument();

    rerender(<Timeline dataState={{ kind: "partial", message: "D04 page 3 is unavailable." }} onOpenSource={vi.fn()} state={state} />);
    expect(screen.getByText("D04 page 3 is unavailable.")).toBeInTheDocument();

    rerender(<Timeline dataState={{ kind: "error", message: "Timeline records could not be loaded." }} onOpenSource={vi.fn()} state={state} />);
    expect(screen.getByText("Timeline records could not be loaded.")).toBeInTheDocument();
  });

  it("visibly preserves approximate, conflicting, and unknown dates", () => {
    const state = reviewState();
    const event = state.candidates.find((candidate) => candidate.kind === "timeline_event")!;
    const { rerender } = render(<TimelineEventCard event={{ ...event, datePrecision: "approximate" }} onOpen={vi.fn()} state={state} />);
    expect(screen.getByText("Date remains approximate.")).toBeInTheDocument();

    rerender(<TimelineEventCard event={{ ...event, datePrecision: "conflicting", dateAlternatives: [{ label: "2025-03-12 ticket arrival" }, { label: "2025-03-15 reported worksite arrival" }] }} onOpen={vi.fn()} state={state} />);
    expect(screen.getByText(/Conflicting dates: 2025-03-12 ticket arrival/i)).toBeInTheDocument();

    rerender(<TimelineEventCard event={{ ...event, datePrecision: "unknown", dateStart: undefined }} onOpen={vi.fn()} state={state} />);
    expect(screen.getAllByText(/Date is unknown from the available packet/i).length).toBeGreaterThan(0);
  });

  it("opens a desktop complementary source region and restores the exact citation focus on Escape", async () => {
    const user = userEvent.setup();
    const state = reviewState();
    render(<TimelineSourceExperience onCommand={vi.fn()} sourceMode="desktop" state={state} />);

    const citation = screen.getByRole("button", { name: /Open exact source: D05, page 1, D05-P1-S05/i });
    await user.click(citation);
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(screen.getByText("Exact approved masked quote")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(citation).toHaveFocus();
  });
});
