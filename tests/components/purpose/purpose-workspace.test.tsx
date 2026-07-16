import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaseStateProvider } from "../../../components/shell";
import { PurposeWorkspace } from "../../../features/purpose";
import { createInitialCaseState } from "../../../lib/state";
import { selectableProviderOptions } from "../provider/fixtures";

const NOW = "2026-07-16T10:00:00.000Z";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TASK-018 PurposeWorkspace", () => {
  it("shows a non-blank loading state without selecting a service", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));
    render(
      <CaseStateProvider initialState={createInitialCaseState(NOW)}>
        <PurposeWorkspace />
      </CaseStateProvider>,
    );
    expect(screen.getByLabelText("Loading analysis service choices")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("shows a safe availability error and retry action", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    render(
      <CaseStateProvider initialState={createInitialCaseState(NOW)}>
        <PurposeWorkspace />
      </CaseStateProvider>,
    );
    expect(await screen.findByLabelText("Analysis service choices unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try loading choices again" })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("loads the prepared checkpoint separately and runs its replay locally", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      schemaVersion: "1.0.0",
      liveAnalysisEnabled: true,
      replayEnabled: true,
      options: selectableProviderOptions(),
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CaseStateProvider initialState={createInitialCaseState(NOW)}>
        <PurposeWorkspace />
      </CaseStateProvider>,
    );

    expect(await screen.findByText("Choose analysis service")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Run bundled deterministic replay/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load prepared checkpoint" }));
    expect(await screen.findByText(/Checkpoint active with fixture-reviewer provenance/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Run bundled deterministic replay" }));
    expect(await screen.findByText(/replay completed locally.*No provider transmission occurred/i)).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/analyze", { method: "GET", cache: "no-store" });
  });
});
