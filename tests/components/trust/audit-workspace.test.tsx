import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CaseStateProvider } from "../../../components/shell";
import { AuditWorkspace } from "../../../features/trust";
import { checkpointState } from "../review/candidate/review-test-state";

describe("canonical Audit Trail destination", () => {
  it("filters canonical events without introducing note or preview records", async () => {
    const user = userEvent.setup();
    const state = checkpointState();
    render(
      <CaseStateProvider initialState={state}>
        <AuditWorkspace />
      </CaseStateProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Audit Trail" }),
    ).toBeInTheDocument();
    const filterToolbar = screen.getByRole("region", { name: "Audit filters" });
    expect(within(filterToolbar).getByRole("searchbox")).toBeInTheDocument();
    expect(within(filterToolbar).getByLabelText("Actor")).toBeInTheDocument();
    expect(
      within(filterToolbar).getByText(
        `Showing ${state.audit.length} of ${state.audit.length} canonical events`,
      ),
    ).toBeInTheDocument();
    expect(
      within(filterToolbar).getByText(
        /this explanatory browser-session record is not a forensic or tamper-evident audit log/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("N-01")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Actor"), "fixture_reviewer");
    const expected = state.audit.filter(
      (event) => event.actor === "fixture_reviewer",
    ).length;
    expect(
      screen.getByText(`Showing ${expected} of ${state.audit.length} canonical events`),
    ).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "no matching audit summary");
    expect(
      screen.getByText("No audit events match these filters"),
    ).toBeInTheDocument();
  });
});
