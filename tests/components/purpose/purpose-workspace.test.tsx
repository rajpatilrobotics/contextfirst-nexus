import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CaseStateProvider } from "../../../components/shell";
import { PurposeWorkspace } from "../../../features/purpose";
import { createInitialCaseState } from "../../../lib/state";
import {
  multipleSelectableProviderOptions,
  replayOnlyProviderOptions,
} from "../provider/fixtures";

const NOW = "2026-07-16T10:00:00.000Z";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TASK-018 PurposeWorkspace", () => {
  it("shows a non-blank loading state without exposing a provider control", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));
    render(
      <CaseStateProvider initialState={createInitialCaseState(NOW)}>
        <PurposeWorkspace />
      </CaseStateProvider>,
    );
    expect(screen.getByRole("status", { name: "Loading analysis availability" })).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("shows the plain fail-closed availability message and retry action", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    render(
      <CaseStateProvider initialState={createInitialCaseState(NOW)}>
        <PurposeWorkspace />
      </CaseStateProvider>,
    );
    expect(await screen.findByRole("alert", { name: "Analysis service unavailable" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check availability again" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Case Purpose Brief" })).toBeDisabled();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("auto-binds the sole replay disclosure without provider or model controls", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      schemaVersion: "1.0.0",
      liveAnalysisEnabled: false,
      replayEnabled: true,
      options: replayOnlyProviderOptions(),
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <CaseStateProvider initialState={createInitialCaseState(NOW)}>
        <PurposeWorkspace />
      </CaseStateProvider>,
    );

    expect(await screen.findByRole("group", { name: "How analysis works" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /frozen local synthetic output/i })).not.toBeChecked();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByText(/OpenAI|Gemini|Mistral|gpt-5\.6-sol|prepared-replay-v1/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start analysis" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Load prepared checkpoint" }));
    expect(await screen.findByText(/Checkpoint active with fixture-reviewer provenance/i)).toBeInTheDocument();
    expect(screen.getByText(/No provider transmission occurred/i)).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/analyze", { method: "GET", cache: "no-store" });
  });

  it("fails closed when multiple services are unexpectedly selectable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      schemaVersion: "1.0.0",
      liveAnalysisEnabled: true,
      replayEnabled: true,
      options: multipleSelectableProviderOptions(),
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    render(
      <CaseStateProvider initialState={createInitialCaseState(NOW)}>
        <PurposeWorkspace />
      </CaseStateProvider>,
    );

    expect(await screen.findByRole("alert", { name: "Analysis service unavailable" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Case Purpose Brief" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Load prepared checkpoint" })).toBeDisabled();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
