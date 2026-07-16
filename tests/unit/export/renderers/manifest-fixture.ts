import type { CaseCommand, CaseState, ExportManifest, ExportSelection, ReviewIntent } from "../../../../lib/contracts";
import { createInitialCaseState, applyCaseCommand } from "../../../../lib/state";
import { LIMITATION_TEXT } from "../../../../lib/review";

export const FIXED_NOW = "2026-07-16T00:00:00.000Z";

let commandSequence = 0;

function meta(state: CaseState): CaseCommand["meta"] {
  commandSequence += 1;
  return {
    commandId: `CMD-EXPORT-FIXTURE-${commandSequence}`,
    idempotencyKey: `IDEM-EXPORT-FIXTURE-${commandSequence}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt: FIXED_NOW,
  };
}

function applyOk(state: CaseState, command: CaseCommand) {
  const result = applyCaseCommand(state, command);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

function review(state: CaseState, intent: ReviewIntent) {
  return applyOk(state, { type: "review_candidate", meta: meta(state), intent });
}

export const FULL_SELECTION: ExportSelection = {
  kind: "full_practitioner_handoff",
  minimumNecessarySelection: null,
};

export function createGoldenEarlyState(): CaseState {
  let state = createInitialCaseState(FIXED_NOW);
  state = applyOk(state, {
    type: "load_demo_checkpoint",
    meta: meta(state),
    checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
  });
  state = review(state, {
    candidateId: "CAND-CTRL-PASSPORT",
    action: "edit",
    editedText: "Maya reported passport removal; recruiter messages separately refer to passport custody.",
    reason: "Preserve reported and documented sources separately.",
  });
  state = review(state, {
    candidateId: "CAND-CTRL-CONFINEMENT",
    action: "reject",
    reason: "The packet does not independently confirm physical confinement.",
  });
  state = review(state, {
    candidateId: "CAND-PROV-TASKLOG",
    action: "reject",
    reason: "Unresolved provenance cannot support an export finding.",
  });
  return state;
}

export function createReviewedState(): CaseState {
  let state = createGoldenEarlyState();
  state = review(state, {
    candidateId: "CAND-SENDER-0402",
    action: "reject",
    reason: "Assignment and allegation records do not establish sender identity.",
  });
  state = review(state, {
    candidateId: "CAND-URG-INTERPRETER",
    action: "confirm_unknown",
    reason: null,
  });
  state = applyOk(state, {
    type: "respond_context_gap",
    meta: meta(state),
    intent: {
      gapId: "CAND-URG-INTERPRETER",
      responseStatus: "preserved_unknown",
      response: null,
      responseExplanation: null,
    },
  });
  return state;
}

export function createReadyState({ createManifest = true }: { createManifest?: boolean } = {}): CaseState {
  let state = createReviewedState();
  state = applyOk(state, {
    type: "evaluate_export_gate",
    meta: meta(state),
    selection: FULL_SELECTION,
  });
  if (state.exportGate?.status !== "ready") {
    throw new Error(`Expected ready fixture; blockers: ${state.exportGate?.status === "blocked" ? state.exportGate.blockers.map((item) => item.code).join(",") : "missing gate"}`);
  }
  if (createManifest) {
    state = applyOk(state, {
      type: "create_export",
      meta: meta(state),
      selection: FULL_SELECTION,
    });
  }
  return state;
}

export function createReadyManifest(): ExportManifest {
  const manifest = createReadyState().currentExportManifest;
  if (!manifest) throw new Error("Ready fixture did not create a manifest.");
  return manifest;
}

export function createPostWithdrawalManifest(): ExportManifest {
  let state = createReviewedState();
  state = applyOk(state, {
    type: "withdraw_candidate",
    meta: meta(state),
    candidateId: "CAND-TASK-0402",
    reason: "The assignment evidence was withdrawn from consideration.",
  });
  state = review(state, {
    candidateId: "NEXUS-COMPELLED-TASKS",
    action: "accept",
    reason: null,
  });
  state = review(state, {
    candidateId: "NEXUS-OFFENCE-TIMING",
    action: "accept_as_limitation",
    limitationText: LIMITATION_TEXT,
    reason: "The assigned-task dependency was withdrawn.",
  });
  state = applyOk(state, {
    type: "evaluate_export_gate",
    meta: meta(state),
    selection: FULL_SELECTION,
  });
  if (state.exportGate?.status !== "ready") {
    throw new Error(`Expected post-withdrawal ready fixture; blockers: ${state.exportGate?.status === "blocked" ? state.exportGate.blockers.map((item) => item.code).join(",") : "missing gate"}`);
  }
  state = applyOk(state, {
    type: "create_export",
    meta: meta(state),
    selection: FULL_SELECTION,
  });
  if (!state.currentExportManifest) throw new Error("Post-withdrawal fixture did not create a manifest.");
  return state.currentExportManifest;
}

export function createSafeShareState(): CaseState {
  const reviewed = createReviewedState();
  const purposeBrief = reviewed.purposeBrief;
  const runIndex = reviewed.analysisRuns.findIndex((run) => run.id === reviewed.activeAnalysisRunId);
  if (!purposeBrief || runIndex < 0) throw new Error("Safe-share fixture is missing purpose or run.");
  const revision = purposeBrief.revision + 1;
  const analysisRuns = [...reviewed.analysisRuns];
  analysisRuns[runIndex] = {
    ...analysisRuns[runIndex],
    inputState: { ...analysisRuns[runIndex].inputState, purposeBriefRevision: revision },
  };
  return {
    ...reviewed,
    purposeBrief: { ...purposeBrief, revision, requestedExport: "minimum_necessary_safe_share" },
    analysisRuns,
    exportGate: null,
    currentExportId: null,
    currentExportManifest: null,
    exportedRevision: null,
  };
}
