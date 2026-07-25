import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "../../../app/page";
import {
  CaseShell,
  SYNTHETIC_BANNER_TEXT,
  WORKSPACE_NAVIGATION,
  deriveCurrentStep,
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

function readyPreAnalysisState(): CaseState {
  return {
    ...checkpointState(),
    activeAnalysisRunId: null,
    analysisRuns: [],
    candidates: [],
    citations: [],
  };
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
  it("presents one centered demonstration action and secondary Trust navigation", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Source-grounded case preparation for forced-criminality matters/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Qualified practitioners preparing complex cases/i)).toBeInTheDocument();
    expect(screen.getByText(/REF-2024-0047-SYN/i)).toBeInTheDocument();
    expect(screen.getByText(/A workbench, not an oracle/i)).toBeInTheDocument();
    expect(screen.getByText(/Not a survivor-facing crisis service/i)).toBeInTheDocument();
    const demonstrationLinks = screen.getAllByRole("link", {
      name: "Start Demonstration",
    });
    expect(demonstrationLinks).toHaveLength(1);
    expect(demonstrationLinks[0]).toHaveAttribute("href", "/dashboard");
    expect(
      screen.queryByRole("link", { name: /Open case dashboard/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Trust & Safety/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Do not enter real or private case data/i).length,
    ).toBeGreaterThan(0);
  });
});

describe("TASK-017 case shell", () => {
  it("renders the persistent banner, six-stage tracker, case identity, and truthful workspace navigation", () => {
    render(
      <CaseShell currentPath="/case/demo/analysis" initialState={createInitialCaseState(NOW)}>
        <h2>Structured Analysis child route</h2>
      </CaseShell>,
    );

    expect(screen.getByText(SYNTHETIC_BANNER_TEXT)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to case workspace" })).toHaveAttribute("href", "#case-workspace");
    expect(screen.getByText("REF-2024-0047-SYN")).toBeInTheDocument();
    expect(screen.getByText(/Canonical case/i)).toHaveTextContent("CFN-DEMO-001");
    expect(screen.getByText("Current section").nextElementSibling).toHaveTextContent("Analysis");
    expect(screen.getByLabelText(/Case status: Draft/i)).toBeInTheDocument();
    expect(screen.getByText("Analysis status").nextElementSibling).toHaveTextContent("Not started");
    expect(screen.queryByText("Mode", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Provider", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Model", { selector: "dt" })).not.toBeInTheDocument();

    const tracker = screen.getByRole("region", { name: "Six-stage case progress" });
    expect(within(tracker).getAllByRole("listitem")).toHaveLength(6);
    expect(
      within(tracker)
        .getAllByRole("listitem")
        .map((item) => item.textContent?.replace(/\s+/g, " ").trim()),
    ).toEqual([
      "1Purpose, active",
      "2Documents, pending",
      "3Analysis, pending",
      "4Planning, pending",
      "5Review, pending",
      "6Export, pending",
    ]);
    expect(within(tracker).getByRole("link", { current: "step" })).toHaveTextContent(
      "Analysis",
    );
    expect(
      within(tracker).getByRole("link", { name: "Open Structured Analysis" }),
    ).toHaveAttribute("href", "/case/demo/analysis");

    const nav = screen.getByRole("navigation", { name: "Case workspace" });
    expect(nav.closest("aside")).not.toBeNull();
    expect(
      nav.compareDocumentPosition(screen.getByRole("main")) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      WORKSPACE_NAVIGATION.filter((item) => item.id !== "trust").map((item) => item.href),
    );
    expect(within(nav).getByRole("link", { name: "Structured Analysis" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: "Structured Analysis" })).toHaveAttribute(
      "href",
      "/case/demo/analysis",
    );
    expect(within(nav).queryByText("Later")).not.toBeInTheDocument();
  });

  it("derives journey progress from canonical case state instead of the current URL", () => {
    const initial = createInitialCaseState(NOW);
    const purposeReady = {
      ...initial,
      purposeBrief: checkpointState().purposeBrief,
    };
    const checkpoint = checkpointState();

    expect(deriveCurrentStep("/case/demo/intake")).toBe("documents");
    expect(deriveCurrentStep("/case/demo/analysis")).toBe("analysis");
    expect(deriveCurrentStep("/case/demo/review")).toBe("analysis");
    expect(deriveCurrentStep("/case/demo/review#nexus")).toBe("review");
    expect(deriveCurrentStep("/case/demo/urgent-needs")).toBe("analysis");
    expect(deriveCurrentStep("/case/demo/gaps")).toBe("analysis");
    expect(deriveCurrentStep("/case/demo/interview")).toBe("planning");
    expect(deriveCurrentStep("/case/demo/services")).toBe("planning");
    expect(deriveCurrentStep("/case/demo/tasks")).toBe("planning");
    expect(deriveCurrentStep("/case/demo/notes")).toBe("planning");
    expect(deriveCurrentStep("/case/demo/nexus")).toBe("review");
    expect(deriveCurrentStep("/case/demo/timeline")).toBe("review");
    expect(deriveCurrentStep("/case/demo/audit")).toBe("export");
    expect(deriveCurrentStep("/trust")).toBe("export");
    expect(deriveStepProgress("purpose", initial)).toBe("active");
    expect(deriveStepProgress("documents", initial)).toBe("pending");
    expect(deriveStepProgress("analysis", initial)).toBe("pending");
    expect(deriveStepProgress("planning", initial)).toBe("pending");
    expect(deriveStepProgress("purpose", purposeReady)).toBe("completed");
    expect(deriveStepProgress("documents", purposeReady)).toBe("active");
    expect(deriveStepProgress("purpose", checkpoint)).toBe("completed");
    expect(deriveStepProgress("documents", checkpoint)).toBe("completed");
    expect(deriveStepProgress("analysis", checkpoint)).toBe("completed");
    expect(deriveStepProgress("review", checkpoint)).toBe("warning");
    expect(deriveStepProgress("export", checkpoint)).toBe("pending");
  });

  it("keeps Documents complete and makes Analysis ready after document preparation", () => {
    const state = readyPreAnalysisState();

    expect(deriveStepProgress("documents", state)).toBe("completed");
    expect(deriveStepProgress("analysis", state)).toBe("active");
  });

  it("keeps processed documents active until masking preparation is complete", () => {
    const ready = readyPreAnalysisState();
    const state: CaseState = {
      ...ready,
      masking: createInitialCaseState(NOW).masking,
    };

    expect(deriveStepProgress("documents", state)).toBe("active");
    expect(deriveStepProgress("analysis", state)).toBe("pending");
  });

  it("keeps Analysis pending when document preparation has failed", () => {
    const ready = readyPreAnalysisState();
    const state: CaseState = {
      ...ready,
      processing: ready.processing.map((stage) =>
        stage.name === "text_extraction"
          ? {
              ...stage,
              status: "failed",
              completedAt: undefined,
              errorCode: "SOURCE_UNAVAILABLE",
              retryable: true,
            }
          : stage,
      ),
    };

    expect(deriveStepProgress("documents", state)).toBe("failed");
    expect(deriveStepProgress("analysis", state)).toBe("pending");
  });

  it("shows only Analysis active while a ready analysis is pending", () => {
    const ready = readyPreAnalysisState();
    const state: CaseState = {
      ...ready,
      processing: ready.processing.map((stage) =>
        stage.name === "candidate_extraction"
          ? {
              ...stage,
              status: "active",
              completedAt: undefined,
            }
          : stage,
      ),
    };

    expect(deriveStepProgress("documents", state)).toBe("completed");
    expect(deriveStepProgress("analysis", state)).toBe("active");
  });

  it("completes Analysis for a current successful run with zero candidates", () => {
    const checkpoint = checkpointState();
    const state: CaseState = {
      ...checkpoint,
      candidates: [],
    };

    expect(deriveStepProgress("documents", state)).toBe("completed");
    expect(deriveStepProgress("analysis", state)).toBe("completed");
  });

  it("distinguishes running, failed, succeeded, and replay analysis states", () => {
    expect(describeRunProvenance(null, true).analysisStatusLabel).toBe("Analysis running");
    expect(
      describeRunProvenance({
        ...liveRun(),
        status: "failed",
        candidateCount: 0,
        citationCount: 0,
        quarantinedCount: 0,
        failure: {
          classification: "internal_safe_failure",
          safeErrorCode: "INTERNAL_SAFE_FAILURE",
          retryableSameProvider: false,
          alternateProviderRecoveryAllowed: false,
          replayRecoveryAllowed: false,
        },
      } as AnalysisRun).analysisStatusLabel,
    ).toBe("Analysis failed");
    expect(describeRunProvenance(liveRun()).analysisStatusLabel).toBe("Analysis complete");
    expect(describeRunProvenance(replayRun(false)).analysisStatusLabel).toBe(
      "Local replay complete",
    );
  });

  it("summarizes a safely restored legacy live run without persistent provider or model fields", () => {
    render(
      <CaseShell currentPath="/case/demo/purpose" initialState={stateWithRun(liveRun())}>
        <p>Purpose</p>
      </CaseShell>,
    );

    expect(screen.getByText("Analysis status").nextElementSibling).toHaveTextContent("Analysis complete");
    expect(screen.queryByText("OpenAI")).not.toBeInTheDocument();
    expect(screen.queryByText("gpt-5.6-sol")).not.toBeInTheDocument();
    expect(screen.queryByText("Provider", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Model", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Prepared demo review checkpoint")).not.toBeInTheDocument();
  });

  it("shows local replay and prepared checkpoint as plain-language status variants", () => {
    expect(describeRunProvenance(replayRun(false))).toMatchObject({
      analysisStatusLabel: "Local replay complete",
      checkpointLabel: null,
    });
    expect(describeRunProvenance(replayRun(true))).toMatchObject({
      analysisStatusLabel: "Prepared demo checkpoint active",
      checkpointLabel: "Prepared demo review checkpoint",
    });

    render(
      <CaseShell currentPath="/case/demo/purpose" initialState={stateWithRun(replayRun(true))}>
        <p>Purpose</p>
      </CaseShell>,
    );

    expect(screen.getByText("Analysis status").nextElementSibling).toHaveTextContent(
      "Prepared demo checkpoint active",
    );
    expect(screen.getByText("Prepared demo review checkpoint")).toBeInTheDocument();
    expect(screen.queryByText("frozen_replay_output")).not.toBeInTheDocument();
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
    expect(screen.getByText("Case reset to the demo start.")).toBeInTheDocument();
    expect(screen.getByText("Analysis status").nextElementSibling).toHaveTextContent("Not started");
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
    expect(screen.getByText("Analysis status").nextElementSibling).toHaveTextContent(
      "Prepared demo checkpoint active",
    );
    expect(screen.getByText("Prepared demo review checkpoint")).toBeInTheDocument();
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
    expect(screen.getByText("Analysis status").nextElementSibling).toHaveTextContent(
      "Prepared demo checkpoint active",
    );
    expect(screen.getByText("Prepared demo review checkpoint")).toBeInTheDocument();
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
      <CaseShell currentPath="/case/demo/intake" initialState={createInitialCaseState(NOW)}>
        <h2>Documents child route</h2>
      </CaseShell>,
    );

    expect(screen.getByRole("button", { name: /Reset Case/i })).toBeEnabled();
    const workspaceNavigation = screen.getByRole("navigation", {
      name: "Case workspace",
    });
    expect(within(workspaceNavigation).getByRole("link", { name: "Documents" })).toHaveAttribute(
      "href",
      "/case/demo/documents",
    );
    expect(within(workspaceNavigation).getByRole("link", { name: "Documents" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("region", { name: "Six-stage case progress" })).toBeInTheDocument();
    for (const item of WORKSPACE_NAVIGATION.filter((entry) => entry.id !== "trust")) {
      expect(within(workspaceNavigation).getByRole("link", { name: item.label })).toBeInTheDocument();
    }
  });
});
