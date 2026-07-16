import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  ReviewQueue,
  filterCanonicalReviewQueue,
} from "../../../../features/review/queue";
import { applyCaseCommand } from "../../../../lib/state";
import { cfnDemoFixture } from "../../../../lib/fixtures";
import {
  checkpointState,
  commandMeta,
} from "../candidate/review-test-state";

const blockers = [...cfnDemoFixture.reviewDefinitions.earlyUnresolvedBlockerIds];

describe("TASK-021 review queue", () => {
  it("filters canonical candidates across every frozen queue category", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    render(<ReviewQueue earlyBlockerIds={blockers} state={state} />);

    for (const label of [
      "Pending",
      "Accepted",
      "Edited",
      "Rejected",
      "Uncertain",
      "Conflict",
      "Citation problem",
      "Export blocker",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${label} \\(`) })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Pending (4)" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Export blocker (2)" }));
    expect(screen.getByText("CAND-SENDER-0402")).toBeInTheDocument();
    expect(screen.getByText("CAND-URG-INTERPRETER")).toBeInTheDocument();
    expect(screen.queryByText("CAND-CTRL-CONFINEMENT")).not.toBeInTheDocument();
  });

  it("moves keyboard focus to a stable gap target without losing queue context", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    render(
      <>
        <ReviewQueue earlyBlockerIds={blockers} state={state} />
        <div id="gap-CAND-SENDER-0402" tabIndex={-1}>Sender remediation target</div>
      </>,
    );

    const filter = screen.getByRole("button", { name: "Export blocker (2)" });
    await user.click(filter);
    const sender = screen.getByText("CAND-SENDER-0402").closest("article")!;
    await user.click(sender.querySelector("button")!);
    expect(document.getElementById("gap-CAND-SENDER-0402")).toHaveFocus();
    expect(filter).toHaveAttribute("aria-pressed", "true");
  });

  it("removes a resolved blocker immediately when canonical state changes", async () => {
    const before = checkpointState();
    const result = applyCaseCommand(before, {
      type: "review_candidate",
      meta: commandMeta(before, "reject-sender"),
      intent: {
        candidateId: "CAND-SENDER-0402",
        action: "reject",
        reason: "Assignment and allegation do not establish sender identity.",
      },
    });
    if (!result.ok) throw new Error(result.reason);

    expect(filterCanonicalReviewQueue(before.candidates, "export_blocker", blockers).map((item) => item.id)).toEqual([
      "CAND-SENDER-0402",
      "CAND-URG-INTERPRETER",
    ]);
    expect(filterCanonicalReviewQueue(result.state.candidates, "export_blocker", blockers).map((item) => item.id)).toEqual([
      "CAND-URG-INTERPRETER",
    ]);
  });

  it("derives conflict and citation-problem filters without storing queue copies", () => {
    const state = checkpointState();
    const changed = state.candidates.map((candidate) =>
      candidate.id === "CAND-CTRL-PASSPORT"
        ? { ...candidate, supportStatus: "conflicting" as const }
        : candidate.id === "CAND-CTRL-CONFINEMENT"
          ? { ...candidate, supportStatus: "citation_unresolved" as const }
          : candidate,
    );
    expect(filterCanonicalReviewQueue(changed, "conflict", blockers).map((item) => item.id)).toEqual([
      "CAND-CTRL-PASSPORT",
    ]);
    expect(filterCanonicalReviewQueue(changed, "citation_problem", blockers).map((item) => item.id)).toEqual([
      "CAND-CTRL-CONFINEMENT",
    ]);
  });

  it("shows an explicit empty filter state", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    render(<ReviewQueue earlyBlockerIds={blockers} state={state} />);
    await user.click(screen.getByRole("button", { name: "Edited (0)" }));
    expect(screen.getByText(/No edited items/i)).toBeInTheDocument();
    expect(screen.getByText(/explicit empty result/i)).toBeInTheDocument();
  });
});
