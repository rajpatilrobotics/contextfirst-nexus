import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CaseDashboard,
  PRIMARY_CASE_DISPLAY_ID,
  derivePrimaryCaseSummary,
} from "../../../features/dashboard/case-dashboard";
import { applyCaseCommand, createInitialCaseState } from "../../../lib/state";

const NOW = "2026-07-24T00:00:00.000Z";

function checkpointState() {
  const initial = createInitialCaseState(NOW);
  const result = applyCaseCommand(initial, {
    type: "load_demo_checkpoint",
    meta: {
      commandId: "cmd-dashboard-checkpoint",
      idempotencyKey: "idem-dashboard-checkpoint",
      expectedCaseRevision: initial.caseRevision,
      actor: "current_practitioner",
      createdAt: NOW,
    },
    checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
  });
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

describe("fast-track Case Dashboard", () => {
  it("opens only the M. Chen canonical workspace and keeps secondary cases read-only", () => {
    render(<CaseDashboard initialState={createInitialCaseState(NOW)} />);

    expect(
      screen.getByRole("heading", { level: 1, name: /Open cases & readiness/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Only M\. Chen has a connected functional workspace/i)).toBeInTheDocument();

    const workspaceLink = screen.getByRole("link", {
      name: `Open workspace for M. Chen (${PRIMARY_CASE_DISPLAY_ID})`,
    });
    expect(workspaceLink).toHaveAttribute("href", "/case/demo/purpose");

    const readOnlyCases = [
      "REF-2024-0031-SYN, read-only case summary",
      "REF-2024-0029-SYN, read-only case summary",
    ];
    for (const label of readOnlyCases) {
      const card = screen.getByRole("article", { name: label });
      expect(within(card).getByText("Read-only")).toBeInTheDocument();
      expect(within(card).getByText("Workspace unavailable")).toBeInTheDocument();
      expect(within(card).queryByRole("link")).not.toBeInTheDocument();
    }
  });

  it("derives primary metrics from canonical case state", () => {
    const state = checkpointState();
    const summary = derivePrimaryCaseSummary(state);

    expect(summary.documentCount).toBe(state.documents.length);
    expect(summary.documentCount).toBeGreaterThan(0);
    expect(summary.pendingReviewCount).toBeGreaterThan(0);
    expect(summary.analysisStatus).toBe("Prepared checkpoint");

    render(<CaseDashboard initialState={state} />);

    const card = screen.getByRole("link", {
      name: `Open workspace for M. Chen (${PRIMARY_CASE_DISPLAY_ID})`,
    });
    expect(within(card).getByText("Documents").nextElementSibling).toHaveTextContent(
      String(summary.documentCount),
    );
    expect(within(card).getByText("Analysis").nextElementSibling).toHaveTextContent(
      summary.analysisStatus,
    );
    expect(within(card).getByText("Review").nextElementSibling).toHaveTextContent(
      `${summary.pendingReviewCount} pending`,
    );
    expect(within(card).getByText("Urgent needs").nextElementSibling).toHaveTextContent(
      String(summary.openUrgentNeedCount),
    );
    expect(within(card).getByText("Evidence gaps").nextElementSibling).toHaveTextContent(
      String(summary.openGapCount),
    );
    expect(within(card).getByText("Tasks").nextElementSibling).toHaveTextContent(
      String(summary.openTaskCount),
    );
  });

  it("marks a successful analysis stale after Purpose changes through the canonical command", () => {
    const checkpoint = checkpointState();
    if (!checkpoint.purposeBrief) throw new Error("checkpoint purpose missing");

    const changed = applyCaseCommand(checkpoint, {
      type: "save_purpose",
      meta: {
        commandId: "cmd-dashboard-purpose-change",
        idempotencyKey: "idem-dashboard-purpose-change",
        expectedCaseRevision: checkpoint.caseRevision,
        actor: "current_practitioner",
        createdAt: "2026-07-24T00:01:00.000Z",
      },
      purposeBrief: {
        ...checkpoint.purposeBrief,
        revision: checkpoint.purposeBrief.revision + 1,
        statedPurpose: `${checkpoint.purposeBrief.statedPurpose} Updated for the current handoff.`,
        updatedAt: "2026-07-24T00:01:00.000Z",
      },
    });
    if (!changed.ok) throw new Error(changed.reason);

    expect(derivePrimaryCaseSummary(changed.state).analysisStatus).toBe("Needs rerun");

    render(<CaseDashboard initialState={changed.state} />);

    const card = screen.getByRole("link", {
      name: `Open workspace for M. Chen (${PRIMARY_CASE_DISPLAY_ID})`,
    });
    expect(within(card).getByText("Analysis").nextElementSibling).toHaveTextContent(
      "Needs rerun",
    );
  });
});
