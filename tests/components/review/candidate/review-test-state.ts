import type { CaseCommand, CaseState } from "../../../../lib/contracts";
import { applyCaseCommand, createInitialCaseState } from "../../../../lib/state";

export const NOW = "2026-07-16T00:00:00.000Z";
let sequence = 0;

export function commandMeta(state: CaseState, prefix: string): CaseCommand["meta"] {
  sequence += 1;
  return {
    commandId: `${prefix}-${sequence}`,
    idempotencyKey: `${prefix}-idem-${sequence}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt: `2026-07-16T00:${String(sequence).padStart(2, "0")}:00.000Z`,
  };
}

export function checkpointState() {
  const state = createInitialCaseState(NOW);
  const result = applyCaseCommand(state, {
    type: "load_demo_checkpoint",
    meta: commandMeta(state, "load-checkpoint"),
    checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
  });
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

export function withdrawnCheckpointState() {
  const state = checkpointState();
  const result = applyCaseCommand(state, {
    type: "withdraw_candidate",
    meta: commandMeta(state, "withdraw-task-0402"),
    candidateId: "CAND-TASK-0402",
    reason: "The task-log entry can no longer be relied on for this reviewed handoff.",
  });
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}
