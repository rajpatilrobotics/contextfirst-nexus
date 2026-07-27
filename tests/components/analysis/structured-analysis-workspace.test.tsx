import { useMemo } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { CaseStateProvider, useCaseState } from "../../../components/shell";
import { StructuredAnalysisWorkspace } from "../../../features/analysis/structured";
import type { CaseState } from "../../../lib/contracts";
import { applyCaseCommand, createInitialCaseState } from "../../../lib/state";
import {
  checkpointState,
  commandMeta,
  NOW,
} from "../review/candidate/review-test-state";

function AuditProbe() {
  const { state } = useCaseState();
  const lastEvent = useMemo(
    () => state.audit.at(-1)?.eventType ?? "none",
    [state.audit],
  );
  return <p data-testid="analysis-last-audit">{lastEvent}</p>;
}

function renderWorkspace(state: CaseState = checkpointState()) {
  return render(
    <CaseStateProvider initialState={state}>
      <StructuredAnalysisWorkspace />
      <AuditProbe />
    </CaseStateProvider>,
  );
}

function isStructuredCandidate(candidate: CaseState["candidates"][number]) {
  return (
    Boolean(candidate.lane) &&
    candidate.kind !== "context_gap" &&
    candidate.kind !== "timeline_event" &&
    candidate.kind !== "nexus_relationship"
  );
}

function staleCheckpointState() {
  const checkpoint = checkpointState();
  if (!checkpoint.purposeBrief) throw new Error("checkpoint purpose missing");
  const result = applyCaseCommand(checkpoint, {
    type: "save_purpose",
    meta: commandMeta(checkpoint, "change-analysis-purpose"),
    purposeBrief: {
      ...checkpoint.purposeBrief,
      revision: checkpoint.purposeBrief.revision + 1,
      statedPurpose: `${checkpoint.purposeBrief.statedPurpose} Revised.`,
      updatedAt: "2026-07-16T00:30:00.000Z",
    },
  });
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/case/demo/analysis");
});

describe("Phase 3 Structured Analysis", () => {
  it("projects the three canonical lanes, counts, statuses, and coverage warning", () => {
    const state = checkpointState();
    const activeRunId = state.activeAnalysisRunId;
    const laneCandidates = state.candidates.filter(
      (candidate) =>
        candidate.analysisRunId === activeRunId &&
        isStructuredCandidate(candidate),
    );

    renderWorkspace(state);

    expect(
      screen.getByRole("heading", { level: 1, name: "Structured Analysis" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Lane A — Trafficking Indicators/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Lane B — Non-Punishment Relevance/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Lane C — Protection & Urgency/i })).toBeInTheDocument();
    expect(screen.getByText("Lane candidates").nextElementSibling).toHaveTextContent(
      String(laneCandidates.length),
    );
    expect(screen.getByRole("region", { name: "Coverage warning" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Review status filters" })).toBeInTheDocument();
    for (const label of [
      "All",
      "Pending",
      "Accepted",
      "Edited",
      "Rejected",
      "Uncertain",
      "Conflict",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${label} \\(`) })).toBeInTheDocument();
    }
    expect(screen.queryByRole("heading", { name: "Context gaps" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Charge-Coercion Nexus" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Source-linked timeline" })).not.toBeInTheDocument();
  });

  it("shows transparent review-order guidance without presenting a confidence score", () => {
    const checkpoint = checkpointState();
    const prioritized = checkpoint.candidates.find(isStructuredCandidate);
    if (!prioritized) throw new Error("structured candidate missing");
    const state: CaseState = {
      ...checkpoint,
      candidates: checkpoint.candidates.map((candidate) =>
        candidate.id === prioritized.id
          ? {
              ...candidate,
              deterministicMatch: {
                ruleCode: "A-CONTROL",
                exactPhrase: "withheld the passport",
                rationale:
                  "It matched an explicit browser-local review rule.",
                reviewPriority: "review_first" as const,
                priorityReason:
                  "An explicit phrase appears in two exact source locations. This determines review order only; it does not measure truth, credibility, risk, or legal strength.",
              },
            }
          : candidate,
      ),
    };

    renderWorkspace(state);
    expect(screen.getByText("Review first")).toBeInTheDocument();
    expect(screen.getByText("Review order:")).toBeInTheDocument();
    expect(
      screen.getByText(/does not measure truth, credibility, risk, or legal strength/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/confidence score/i)).not.toBeInTheDocument();
  });

  it("uses filters as read-only projections and never shows a hidden candidate detail", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(
      screen.getByRole("button", {
        name: /Select candidate CAND-CTRL-CONFINEMENT/i,
      }),
    );
    expect(
      screen.getByRole("article", {
        name: "Candidate detail: CAND-CTRL-CONFINEMENT",
      }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", { name: "Search candidates" }),
      "no matching candidate",
    );
    expect(
      screen.queryByRole("article", {
        name: "Candidate detail: CAND-CTRL-CONFINEMENT",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "No visible candidate detail" }),
    ).toBeInTheDocument();

    const filters = screen.getByRole("region", {
      name: "Structured analysis filters",
    });
    await user.click(within(filters).getByRole("button", { name: "Clear filters" }));
    await user.click(screen.getByRole("button", { name: /^Conflict \(0\)$/ }));
    expect(
      screen.getByRole("region", { name: "No candidates match these filters" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "No visible candidate detail" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: /Candidate detail:/ })).not.toBeInTheDocument();

    await user.click(within(filters).getByRole("button", { name: "Clear filters" }));
    await user.click(screen.getByRole("tab", { name: /Lane C — Protection & Urgency/i }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Origin filter" }),
      "source_extraction",
    );
    expect(
      screen.getByRole("button", {
        name: /Select candidate CAND-META-COOPERATION/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Select candidate CAND-URG-INTERPRETER/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("opens an exact candidate from an export-remediation hash", async () => {
    window.history.replaceState(
      {},
      "",
      "/case/CFN-CASE-DYNAMIC/analysis?exportBlocker=REVIEW_INCOMPLETE#candidate-CAND-META-COOPERATION",
    );
    renderWorkspace();

    expect(
      await screen.findByRole("article", {
        name: "Candidate detail: CAND-META-COOPERATION",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Lane C — Protection & Urgency/i }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("includes only active invalidated candidates in the pending projection", async () => {
    const user = userEvent.setup();
    const checkpoint = checkpointState();
    const activeInvalidatedId = "CAND-CTRL-CONFINEMENT";
    const withdrawnInvalidatedId = "CAND-CTRL-PASSPORT";
    const state: CaseState = {
      ...checkpoint,
      candidates: checkpoint.candidates.map((candidate) => {
        if (candidate.id === activeInvalidatedId) {
          return {
            ...candidate,
            inclusionStatus: "active",
            reviewStatus: "invalidated",
          };
        }
        if (candidate.id === withdrawnInvalidatedId) {
          return {
            ...candidate,
            inclusionStatus: "withdrawn",
            reviewStatus: "invalidated",
          };
        }
        return candidate;
      }),
    };
    const pendingCount = state.candidates.filter(
      (candidate) =>
        isStructuredCandidate(candidate) &&
        candidate.inclusionStatus === "active" &&
        (candidate.reviewStatus === "pending" ||
          candidate.reviewStatus === "invalidated"),
    ).length;

    renderWorkspace(state);

    expect(screen.getByText("Pending review").nextElementSibling).toHaveTextContent(
      String(pendingCount),
    );
    await user.click(
      screen.getByRole("button", {
        name: new RegExp(`^Pending \\(${pendingCount}\\)$`),
      }),
    );

    expect(
      screen.getByRole("button", {
        name: new RegExp(`Select candidate ${activeInvalidatedId}`),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByLabelText(/^Review status: Invalidated\./).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", {
        name: new RegExp(`Select candidate ${withdrawnInvalidatedId}`),
      }),
    ).not.toBeInTheDocument();
  });

  it("records an edit through the existing canonical review command", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(
      screen.getByRole("button", {
        name: /Select candidate CAND-CTRL-CONFINEMENT/i,
      }),
    );
    const detail = screen.getByRole("article", {
      name: "Candidate detail: CAND-CTRL-CONFINEMENT",
    });
    await user.click(within(detail).getByRole("button", { name: "Edit wording" }));
    const editDialog = screen.getByRole("dialog", {
      name: "Edit wording details",
    });
    const wording = within(editDialog).getByLabelText("Revised wording");
    await user.clear(wording);
    await user.type(
      wording,
      "The reviewed source reports physical confinement, without independent confirmation.",
    );
    await user.type(
      within(editDialog).getByLabelText("Concise reason"),
      "Preserve the different canonical evidence natures.",
    );
    await user.click(
      within(editDialog).getByRole("button", {
        name: "Record individual action",
      }),
    );

    await waitFor(() =>
      expect(
        within(
          screen.getByRole("article", {
            name: "Candidate detail: CAND-CTRL-CONFINEMENT",
          }),
        ).getByLabelText(/Review status: Human edited/i),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/review recorded in canonical case state/i)).toBeInTheDocument();
  });

  it("navigates the visible pending queue without recording a review action", async () => {
    const user = userEvent.setup();
    const checkpoint = checkpointState();
    const laneCandidate = checkpoint.candidates.find(
      (candidate) =>
        candidate.analysisRunId === checkpoint.activeAnalysisRunId &&
        candidate.lane === "trafficking_indicators" &&
        isStructuredCandidate(candidate),
    );
    if (!laneCandidate) throw new Error("lane candidate missing");
    const secondCandidate = {
      ...laneCandidate,
      id: `${laneCandidate.id}-SECOND`,
      title: `${laneCandidate.title} — second pending review`,
      proposedText: `${laneCandidate.proposedText} Second review item.`,
      currentText: `${laneCandidate.currentText} Second review item.`,
      reviewStatus: "pending" as const,
      inclusionStatus: "active" as const,
    };
    const state: CaseState = {
      ...checkpoint,
      candidates: [
        ...checkpoint.candidates.map((candidate) =>
          candidate.id === laneCandidate.id
            ? {
                ...candidate,
                inclusionStatus: "active" as const,
                reviewStatus: "pending" as const,
              }
            : candidate,
        ),
        secondCandidate,
      ],
    };
    const lanePending = state.candidates.filter(
      (candidate) =>
        candidate.analysisRunId === state.activeAnalysisRunId &&
        candidate.lane === "trafficking_indicators" &&
        isStructuredCandidate(candidate) &&
        candidate.inclusionStatus === "active" &&
        (candidate.reviewStatus === "pending" ||
          candidate.reviewStatus === "invalidated"),
    );
    expect(lanePending.length).toBeGreaterThan(1);

    renderWorkspace(state);
    await user.click(
      screen.getByRole("button", {
        name: new RegExp(`^Select candidate ${lanePending[0].id}:`),
      }),
    );

    const auditBefore = screen.getByTestId("analysis-last-audit").textContent;
    expect(
      screen.getByRole("group", {
        name: "Pending review queue navigation",
      }),
    ).toHaveTextContent(`${lanePending.length} pending in view`);

    await user.click(
      screen.getByRole("button", { name: "Next pending candidate" }),
    );

    expect(
      screen.getByRole("article", {
        name: `Candidate detail: ${lanePending[1].id}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("analysis-last-audit")).toHaveTextContent(
      auditBefore ?? "",
    );
    expect(
      screen.getByRole("button", { name: "Previous pending candidate" }),
    ).toBeEnabled();
  });

  it("opens the existing exact-source drawer and audits an intentional reveal", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const detail = screen.getByRole("article", {
      name: /Candidate detail:/,
    });
    const openSource = within(detail).getAllByRole("button", {
      name: /Open exact source/i,
    })[0];
    await user.click(openSource);

    const drawer = await screen.findByRole("dialog");
    expect(drawer).toHaveAttribute("aria-modal", "true");
    expect(within(drawer).getByText("Exact approved masked quote")).toBeInTheDocument();
    await user.click(
      within(drawer).getByRole("button", { name: "Review reveal warning" }),
    );
    await user.click(
      within(drawer).getByRole("button", {
        name: "Reveal original demo source",
      }),
    );

    expect(screen.getByTestId("analysis-last-audit")).toHaveTextContent(
      "source_revealed",
    );
  });

  it("opens withdrawal in an accessible overlay instead of expanding the workspace", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(
      screen.getByRole("tab", {
        name: /Lane C — Protection & Urgency/i,
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: /Select candidate CAND-META-COOPERATION/i,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Withdraw evidence" }),
    );

    const dialog = screen.getByRole("alertdialog", {
      name: "Confirm evidence withdrawal",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.closest('[aria-hidden="true"]')).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Dependency change" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keep evidence" }));
    expect(
      screen.queryByRole("alertdialog", {
        name: "Confirm evidence withdrawal",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders blocked, ready-empty, failed, stale, and successful zero-result states explicitly", () => {
    const initial = createInitialCaseState(NOW);
    const view = renderWorkspace(initial);
    expect(
      screen.getByRole("region", { name: "Structured Analysis is blocked" }),
    ).toBeInTheDocument();

    const ready = checkpointState();
    view.unmount();
    const readyView = renderWorkspace({
      ...ready,
      activeAnalysisRunId: null,
      analysisRuns: [],
      candidates: [],
      citations: [],
    });
    expect(
      screen.getByRole("region", { name: "Analysis is ready to begin" }),
    ).toBeInTheDocument();

    const checkpoint = checkpointState();
    const failed: CaseState = {
      ...checkpoint,
      analysisRuns: checkpoint.analysisRuns.map((run) => ({
        ...run,
        status: "failed",
      })) as CaseState["analysisRuns"],
    };
    readyView.unmount();
    const failedView = renderWorkspace(failed);
    expect(
      screen.getByRole("region", { name: "Analysis failed safely" }),
    ).toBeInTheDocument();

    failedView.unmount();
    const staleView = renderWorkspace(staleCheckpointState());
    expect(
      screen.getByRole("region", { name: "Analysis needs to be rerun" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lane candidates").nextElementSibling).toHaveTextContent("0");

    const zeroCheckpoint = checkpointState();
    const zero: CaseState = {
      ...zeroCheckpoint,
      candidates: [],
      citations: [],
      analysisRuns: zeroCheckpoint.analysisRuns.map((run) => ({
        ...run,
        candidateCount: 0,
        citationCount: 0,
      })),
    };
    staleView.unmount();
    renderWorkspace(zero);
    expect(
      screen.getByRole("region", {
        name: "Analysis completed with zero candidates",
      }),
    ).toHaveTextContent(/No favourable, adverse, or legal conclusion is inferred/i);
  });
});
