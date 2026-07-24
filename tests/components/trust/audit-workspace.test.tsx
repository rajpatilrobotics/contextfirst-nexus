import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText(`Showing ${state.audit.length} of ${state.audit.length} canonical events`)).toBeInTheDocument();
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
