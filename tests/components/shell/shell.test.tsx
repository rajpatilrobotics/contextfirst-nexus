import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "../../../app/page";
import {
  CaseShell,
  STEP_NAVIGATION,
  SYNTHETIC_BANNER_TEXT,
  deriveStepProgress,
  describeRunProvenance,
  useCaseState,
} from "../../../components/shell";
import type { AnalysisRun, CaseCommand, CaseState } from "../../../lib/contracts";
import {
  applyCaseCommand,
  createInitialCaseState,
  serializeCaseState,
} from "../../../lib/state";
import { createReplayInputState } from "../../../lib/analysis/replay";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/case/demo/purpose",
  useRouter: () => ({ push: routerPush }),
}));

const NOW = "2026-07-16T00:00:00.000Z";

function liveRun(): AnalysisRun {
  return {
    id: "RUN-LIVE-OPENAI",
    mode: "live",
    provider: {
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      requestedModel: "gpt-5.6-sol",
      serviceTier: "paid",
      adapterVersion: "test-adapter",
      returnedModel: "gpt-5.6-sol",
      inferenceSetting: { kind: "reasoning_effort", value: "medium" },
      disclosureVersion: "1.0.0",
      providerTransmission: true,
    },
    promptVersion: "1.0.0",
    requestSchemaVersion: "1.0.0",
    responseSchemaVersion: "1.0.0",
    fixtureVersion: "1.0.0",
    rulesetVersion: "1.0.0",
    checkpointProvenance: null,
    startedAt: NOW,
    completedAt: NOW,
    durationMs: 20,
    inputSegmentCount: 1,
    candidateCount: 0,
    citationCount: 0,
    quarantinedCount: 0,
    status: "succeeded",
    failure: null,
    recovery: {
      recoveryOfRunId: null,
      selectionReason: "initial_choice",
      selectedBy: "practitioner",
      automaticFailover: false,
      outputsMerged: false,
    },
    inputState: createReplayInputState(),
  };
}

function replayRun(checkpoint = false): AnalysisRun {
  return {
    id: checkpoint ? "RUN-CHECKPOINT-1" : "RUN-REPLAY-1",
    mode: "deterministic_replay",
    provider: {
      providerId: "local_replay",
      releaseConfigurationId: "prepared-replay-v1",
      requestedModel: "frozen_replay_output",
      serviceTier: "local",
      adapterVersion: "local-replay-registry-v1",
      returnedModel: "frozen_replay_output",
      inferenceSetting: { kind: "not_applicable", value: "not_applicable" },
      disclosureVersion: "1.0.0",
      providerTransmission: false,
    },
    promptVersion: "1.0.0",
    requestSchemaVersion: "1.0.0",
    responseSchemaVersion: "1.0.0",
    fixtureVersion: "1.0.0",
    rulesetVersion: "1.0.0",
    checkpointProvenance: checkpoint
      ? {
          checkpointId: "DEMO-CHECKPOINT-REVIEW",
          checkpointVersion: "1.0.0",
          replayVersion: "1.0.0",
        }
      : null,
    startedAt: NOW,
    completedAt: NOW,
    durationMs: 0,
    inputSegmentCount: 1,
    candidateCount: 1,
    citationCount: 1,
    quarantinedCount: 0,
    status: "succeeded",
    failure: null,
    recovery: {
      recoveryOfRunId: null,
      selectionReason: "explicit_deterministic_replay",
      selectedBy: "practitioner",
      automaticFailover: false,
      outputsMerged: false,
    },
    inputState: createReplayInputState(),
  };
}

function stateWithRun(run: AnalysisRun): CaseState {
  return {
    ...createInitialCaseState(NOW),
    analysisRuns: [run],
    activeAnalysisRunId: run.id,
  };
}

function checkpointState() {
  const initial = createInitialCaseState(NOW);
  const result = applyCaseCommand(initial, {
    type: "load_demo_checkpoint",
    meta: {
      commandId: "cmd-shell-checkpoint",
      idempotencyKey: "idem-shell-checkpoint",
      expectedCaseRevision: initial.caseRevision,
      actor: "current_practitioner",
      createdAt: NOW,
    },
    checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
  });
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

function SharedRouteChild() {
  const { state, dispatchCaseCommand } = useCaseState();
  const [result, setResult] = useState("not-run");

  function loadCheckpoint() {
    const command: CaseCommand = {
      type: "load_demo_checkpoint",
      meta: {
        commandId: "cmd-route-checkpoint",
        idempotencyKey: "idem-route-checkpoint",
        expectedCaseRevision: state.caseRevision,
        actor: "current_practitioner",
        createdAt: NOW,
      },
      checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
    };
    const applied = dispatchCaseCommand(command);
    setResult(applied.ok ? "applied" : applied.reason);
  }

  function dispatchStaleCommand() {
    const applied = dispatchCaseCommand({
      type: "reset_case",
      meta: {
        commandId: "cmd-route-stale",
        idempotencyKey: "idem-route-stale",
        expectedCaseRevision: state.caseRevision + 1,
        actor: "current_practitioner",
        createdAt: NOW,
      },
    });
    setResult(applied.ok ? "applied" : applied.reason);
  }

  return (
    <section aria-label="Route state probe">
      <p data-testid="route-case-revision">{state.caseRevision}</p>
      <p data-testid="route-run-id">{state.activeAnalysisRunId ?? "no-run"}</p>
      <p data-testid="route-command-result">{result}</p>
      <button onClick={loadCheckpoint} type="button">Load checkpoint from route</button>
      <button onClick={dispatchStaleCommand} type="button">Dispatch stale command</button>
    </section>
  );
}

beforeEach(() => {
  routerPush.mockClear();
  window.sessionStorage.clear();
});

describe("TASK-017 landing boundary screen", () => {
  it("presents purpose, audience, synthetic-only boundary, prohibited decisions, and demo links", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "ContextFirst Nexus" })).toBeInTheDocument();
    expect(screen.getByText(/qualified practitioners prepare source-grounded case handoffs/i)).toBeInTheDocument();
    expect(screen.getByText(/legal aid, public defender, NGO legal/i)).toBeInTheDocument();
    expect(screen.getByText(/fictional synthetic adult fixture CFN-DEMO-001/i)).toBeInTheDocument();
    expect(screen.getByText(/does not determine trafficking status, credibility, guilt, legal eligibility/i)).toBeInTheDocument();
    expect(screen.getByText(/not a survivor chatbot, emergency service, reporting channel/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start demo" })).toHaveAttribute("href", "/case/demo/purpose");
    expect(screen.getByRole("link", { name: "Trust and Safety" })).toHaveAttribute("href", "/trust");
    expect(screen.queryByText(/upload/i)).toHaveTextContent("Do not upload, paste, or enter real case data.");
  });
});

describe("TASK-017 case shell", () => {
  it("renders the persistent banner, landmarks, case identity, and exact navigation order", () => {
    render(
      <CaseShell currentPath="/case/demo/review" initialState={createInitialCaseState(NOW)}>
        <h2>Review child route</h2>
      </CaseShell>,
    );

    expect(screen.getByText(SYNTHETIC_BANNER_TEXT)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to case workspace" })).toHaveAttribute("href", "#case-workspace");
    expect(screen.getByText("CFN-DEMO-001")).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
    expect(screen.getByText("Current section").nextElementSibling).toHaveTextContent("Review");
    expect(screen.getByLabelText(/Case status: Draft/i)).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Case steps" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "Purpose Complete",
      "Documents Complete",
      "Review In progress",
      "Export Not started",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      STEP_NAVIGATION.map((step) => step.href),
    );
    expect(within(nav).getByRole("link", { name: /Review/ })).toHaveAttribute("aria-current", "step");
  });

  it("uses frozen navigation progress labels for active status variants", () => {
    expect(deriveStepProgress("purpose", "purpose", "draft")).toBe("active");
    expect(deriveStepProgress("purpose", "purpose", "review_required")).toBe("warning");
    expect(deriveStepProgress("purpose", "purpose", "blocked")).toBe("failed");
    expect(deriveStepProgress("purpose", "documents", "draft")).toBe("completed");
    expect(deriveStepProgress("export", "documents", "draft")).toBe("pending");
  });

  it("shows live provider and model only from the active canonical run", () => {
    render(
      <CaseShell currentPath="/case/demo/purpose" initialState={stateWithRun(liveRun())}>
        <p>Purpose</p>
      </CaseShell>,
    );

    expect(screen.getByText("Live provider run")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("gpt-5.6-sol")).toBeInTheDocument();
    expect(screen.queryByText("Prepared synthetic review checkpoint")).not.toBeInTheDocument();
  });

  it("shows replay and prepared checkpoint provenance as separate labels", () => {
    expect(describeRunProvenance(replayRun(false))).toMatchObject({
      modeLabel: "Deterministic replay",
      providerLabel: "Bundled deterministic replay, not live AI",
      checkpointLabel: null,
    });

    render(
      <CaseShell currentPath="/case/demo/purpose" initialState={stateWithRun(replayRun(true))}>
        <p>Purpose</p>
      </CaseShell>,
    );

    expect(screen.getByText("Bundled deterministic replay, not live AI")).toBeInTheDocument();
    expect(screen.getByText("Prepared synthetic review checkpoint")).toBeInTheDocument();
  });

  it("dispatches the central reset_case command once and returns to Purpose", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    const onNavigate = vi.fn();

    render(
      <CaseShell
        currentPath="/case/demo/export"
        initialState={stateWithRun(liveRun())}
        onNavigate={onNavigate}
        onReset={onReset}
      >
        <p>Export</p>
      </CaseShell>,
    );

    await user.click(screen.getByRole("button", { name: /Reset Case/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onReset.mock.calls[0][1]).toMatchObject({ type: "reset_case" });
    expect(onReset.mock.calls[0][0]).toMatchObject({
      caseId: "CFN-DEMO-001",
      fixtureVersion: "1.0.0",
      caseRevision: 0,
      activeAnalysisRunId: null,
    });
    expect(onNavigate).toHaveBeenCalledWith("/case/demo/purpose");
    expect(routerPush).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Case reset to the synthetic demo start.");
    expect(JSON.parse(window.sessionStorage.getItem("contextfirst-nexus.case-state.v1") ?? "{}")).toMatchObject({
      caseRevision: 0,
      activeAnalysisRunId: null,
    });
  });

  it("shares one canonical context and dispatcher between the shell and a route child", async () => {
    const user = userEvent.setup();
    render(
      <CaseShell currentPath="/case/demo/purpose" initialState={createInitialCaseState(NOW)}>
        <SharedRouteChild />
      </CaseShell>,
    );

    expect(screen.getByTestId("route-run-id")).toHaveTextContent("no-run");
    await user.click(screen.getByRole("button", { name: "Load checkpoint from route" }));

    expect(screen.getByTestId("route-command-result")).toHaveTextContent("applied");
    expect(screen.getByTestId("route-run-id")).toHaveTextContent("RUN-CHECKPOINT-1");
    expect(screen.getByText("Bundled deterministic replay, not live AI")).toBeInTheDocument();
    expect(screen.getByText("Prepared synthetic review checkpoint")).toBeInTheDocument();
    expect(JSON.parse(window.sessionStorage.getItem("contextfirst-nexus.case-state.v1") ?? "{}")).toMatchObject({
      activeAnalysisRunId: "RUN-CHECKPOINT-1",
    });
  });

  it("hydrates the shared production state from session storage and rejects stale route commands", async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(
      "contextfirst-nexus.case-state.v1",
      serializeCaseState(checkpointState(), NOW),
    );
    render(
      <CaseShell currentPath="/case/demo/review">
        <SharedRouteChild />
      </CaseShell>,
    );

    await waitFor(() => expect(screen.getByTestId("route-run-id")).toHaveTextContent("RUN-CHECKPOINT-1"));
    expect(screen.getByText("Prepared synthetic review checkpoint")).toBeInTheDocument();
    const persistedBefore = window.sessionStorage.getItem("contextfirst-nexus.case-state.v1");
    await user.click(screen.getByRole("button", { name: "Dispatch stale command" }));
    expect(screen.getByTestId("route-command-result")).toHaveTextContent("stale_case_revision");
    expect(window.sessionStorage.getItem("contextfirst-nexus.case-state.v1")).toBe(persistedBefore);
  });

  it("fails closed to the fresh synthetic state for an invalid persisted payload", async () => {
    window.sessionStorage.setItem("contextfirst-nexus.case-state.v1", JSON.stringify({ unexpected: true }));
    render(
      <CaseShell currentPath="/case/demo/purpose">
        <SharedRouteChild />
      </CaseShell>,
    );

    await waitFor(() => expect(screen.getByTestId("route-case-revision")).toHaveTextContent("0"));
    expect(screen.getByTestId("route-run-id")).toHaveTextContent("no-run");
    expect(screen.getByLabelText(/Case status: Draft/i)).toBeInTheDocument();
  });

  it("keeps controls and navigation available for a narrow viewport render", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });

    render(
      <CaseShell currentPath="/case/demo/documents" initialState={createInitialCaseState(NOW)}>
        <h2>Documents child route</h2>
      </CaseShell>,
    );

    expect(screen.getByRole("button", { name: /Reset Case/i })).toBeEnabled();
    for (const step of STEP_NAVIGATION) {
      expect(screen.getByRole("link", { name: new RegExp(step.label) })).toBeInTheDocument();
    }
  });
});
