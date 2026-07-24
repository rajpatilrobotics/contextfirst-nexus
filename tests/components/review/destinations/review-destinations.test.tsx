import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CaseStateProvider } from "../../../../components/shell";
import {
  EvidenceGapsWorkspace,
  EvidenceIntegrityWorkspace,
  TimelineWorkspace,
  deriveReviewDestinationState,
} from "../../../../features/review/destinations";
import { applyCaseCommand } from "../../../../lib/state";
import {
  checkpointState,
  commandMeta,
} from "../candidate/review-test-state";

function renderDestination(element: React.ReactNode) {
  return render(
    <CaseStateProvider initialState={checkpointState()}>
      {element}
    </CaseStateProvider>,
  );
}

describe("canonical review destinations", () => {
  it("projects Evidence Gaps from the active run and preserves canonical response actions", async () => {
    const user = userEvent.setup();
    renderDestination(<EvidenceGapsWorkspace />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Evidence Gaps" }),
    ).toBeInTheDocument();
    expect(screen.getByText("A gap is not proof")).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", {
      name: "Evidence gap candidates",
    });
    expect(
      within(navigation).getByText(/CAND-URG-INTERPRETER/),
    ).toBeInTheDocument();

    await user.click(
      within(navigation).getByRole("button", {
        name: /Is an interpreter confirmed/i,
      }),
    );
    expect(
      screen.getByRole("button", { name: "Preserve as unknown" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("region", {
        name: "Evidence and dependencies for CAND-URG-INTERPRETER",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Export impact:/i)).toBeInTheDocument();
  });

  it("renders exactly six selectable canonical nexus nodes with source-linked detail", () => {
    renderDestination(<EvidenceIntegrityWorkspace />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Evidence Integrity Map",
      }),
    ).toBeInTheDocument();
    const mapSection = screen.getByRole("heading", {
      name: "Canonical relationship map",
    }).closest("section");
    if (!mapSection) throw new Error("Canonical relationship map section missing");
    expect(
      within(mapSection).getAllByRole("button", { name: /Select Nexus node/i }),
    ).toHaveLength(6);
    expect(
      screen.getByRole("article", { name: /Evidence map detail:/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not a trafficking determination/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Open exact source/i }).length,
    ).toBeGreaterThan(0);
  });

  it("keeps a valid withdrawn nexus record visible instead of replacing the map with a contract error", async () => {
    const user = userEvent.setup();
    const checkpoint = checkpointState();
    const result = applyCaseCommand(checkpoint, {
      type: "withdraw_candidate",
      meta: commandMeta(checkpoint, "withdraw-nexus-movement"),
      candidateId: "NEXUS-MOVEMENT",
      reason: "The relationship row should remain visible as withdrawn.",
    });
    if (!result.ok) throw new Error(result.reason);

    render(
      <CaseStateProvider initialState={result.state}>
        <EvidenceIntegrityWorkspace />
      </CaseStateProvider>,
    );

    expect(screen.queryByText("Nexus contract mismatch")).not.toBeInTheDocument();
    const mapSection = screen.getByRole("heading", {
      name: "Canonical relationship map",
    }).closest("section");
    if (!mapSection) throw new Error("Canonical relationship map section missing");
    expect(
      within(mapSection).getAllByRole("button", { name: /Select Nexus node/i }),
    ).toHaveLength(6);

    await user.click(
      within(mapSection).getByRole("button", {
        name: /Select Nexus node NEXUS-MOVEMENT/i,
      }),
    );

    expect(
      screen.getByRole("article", { name: "Evidence map detail: NEXUS-MOVEMENT" }),
    ).toHaveTextContent(/Inclusion: withdrawn/i);
    expect(screen.getByText("Withdrawn from current findings")).toBeInTheDocument();
  });

  it("renders the separate qualified Timeline destination", () => {
    renderDestination(<TimelineWorkspace />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Timeline" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Qualified timeline events" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Filter timeline"),
    ).toBeInTheDocument();
  });

  it("fails stale successful projections closed after a canonical Purpose change", () => {
    const checkpoint = checkpointState();
    if (!checkpoint.purposeBrief) throw new Error("checkpoint purpose missing");
    const changed = applyCaseCommand(checkpoint, {
      type: "save_purpose",
      meta: commandMeta(checkpoint, "destination-stale-purpose"),
      purposeBrief: {
        ...checkpoint.purposeBrief,
        revision: checkpoint.purposeBrief.revision + 1,
        statedPurpose: `${checkpoint.purposeBrief.statedPurpose} Revised.`,
        updatedAt: "2026-07-16T00:30:00.000Z",
      },
    });
    if (!changed.ok) throw new Error(changed.reason);

    expect(deriveReviewDestinationState(changed.state).kind).toBe("stale");
    render(
      <CaseStateProvider initialState={changed.state}>
        <EvidenceGapsWorkspace />
      </CaseStateProvider>,
    );
    expect(
      screen.getByText("Evidence Gaps needs a rerun"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Evidence gap candidates" }),
    ).not.toBeInTheDocument();
  });
});
