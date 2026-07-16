import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  type AuditEvent,
  type CaseCommand,
} from "../../../lib/contracts";
import { applyCaseCommand, createInitialCaseState } from "../../../lib/state";
import { AuditHistory, UNSAFE_REPORT_CATEGORIES, UnsafeOutputReport } from "../../../features/trust";

const EVENTS: AuditEvent[] = [
  {
    id: "AUDIT-0200",
    caseId: "CFN-DEMO-001",
    eventType: "analysis_recovery_selected",
    sequence: 1,
    actor: "practitioner",
    actorRole: "demo_evaluator",
    analysisRunId: "RUN-OPENAI-FAILED-001",
    recoveryOfRunId: "RUN-GEMINI-FAILED-000",
    providerId: "openai",
    releaseConfigurationId: "openai-quality-v1",
    entityIds: ["RUN-OPENAI-FAILED-001"],
    summary: "analysis_recovery_selected RUN-OPENAI-FAILED-001",
    createdAt: "2026-07-16T00:00:00.000Z",
    commandId: "cmd-switch",
    idempotencyKey: "idem-switch",
  },
  {
    id: "AUDIT-0201",
    caseId: "CFN-DEMO-001",
    eventType: "evidence_withdrawn",
    sequence: 2,
    actor: "fixture_reviewer",
    actorRole: "demo_evaluator",
    analysisRunId: "RUN-CHECKPOINT-001",
    entityIds: ["CAND-TASK-0402"],
    summary: "evidence_withdrawn CAND-TASK-0402",
    createdAt: "2026-07-16T00:01:00.000Z",
    commandId: "cmd-withdraw",
    idempotencyKey: "idem-withdraw",
  },
];

function LocalReportHarness() {
  const [state, setState] = useState(createInitialCaseState("2026-07-16T00:00:00.000Z"));
  function dispatch(command: CaseCommand) {
    const result = applyCaseCommand(state, command);
    if (result.ok) setState(result.state);
    return result;
  }
  return (
    <div>
      <UnsafeOutputReport onCommand={dispatch} state={state} />
      <AuditHistory events={state.audit} />
    </div>
  );
}

describe("TASK-023 safe audit and local reporting", () => {
  it("renders sequence, actors, safe summaries, links, and IDs as inert text", () => {
    const { container } = render(<AuditHistory events={EVENTS} />);
    expect(screen.getByText("Sequence 1")).toBeInTheDocument();
    expect(screen.getByText("Current practitioner", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Fixture reviewer", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("RUN-GEMINI-FAILED-000")).toBeInTheDocument();
    expect(screen.getByText("CAND-TASK-0402")).toBeInTheDocument();
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(container.querySelector("[dangerouslySetInnerHTML]")).not.toBeInTheDocument();
    expect(screen.getByText(/not an immutable, forensic, tamper-evident/i)).toBeInTheDocument();
  });

  it("has an explicit empty audit state", () => {
    render(<AuditHistory events={[]} />);
    expect(screen.getByText("No audit events in this browser session")).toBeInTheDocument();
    expect(screen.getByText(/An empty history does not imply that processing or review occurred/i)).toBeInTheDocument();
  });

  it("accepts every allowlisted category and records only local category and entity IDs", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<LocalReportHarness />);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText(/do not paste or enter evidence/i)).toBeInTheDocument();
    for (const category of UNSAFE_REPORT_CATEGORIES) {
      await user.selectOptions(screen.getByLabelText("Safe report category"), category.value);
      await user.selectOptions(screen.getByLabelText("Affected entity ID"), "CFN-DEMO-001");
      await user.click(screen.getByRole("button", { name: "Record local report" }));
      expect(await screen.findByText(/Nothing was transmitted/i)).toBeInTheDocument();
    }

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getAllByRole("heading", { name: "Unsafe output reported" })).toHaveLength(4);
    expect(screen.getAllByText("CFN-DEMO-001").length).toBeGreaterThanOrEqual(4);
    fetchSpy.mockRestore();
  });

  it("supports keyboard-only selection and submission with visible focusable controls", async () => {
    const user = userEvent.setup();
    const state = createInitialCaseState();
    const onCommand = vi.fn((command: CaseCommand) => applyCaseCommand(state, command));
    render(<UnsafeOutputReport onCommand={onCommand} state={state} />);

    await user.tab();
    expect(screen.getByLabelText("Safe report category")).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("Affected entity ID")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Record local report" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onCommand).toHaveBeenCalledTimes(1);
    const command = onCommand.mock.calls[0]?.[0];
    expect(command).toMatchObject({
      type: "report_unsafe_output",
      entityIds: ["CFN-DEMO-001"],
      reasonCode: "prohibited_claim",
    });
    expect(command).not.toHaveProperty("text");
    expect(command).not.toHaveProperty("reason");
  });
});
