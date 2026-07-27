import { describe, expect, it } from "vitest";
import {
  CaseCommandSchema,
  type CaseCommand,
  type CaseState,
  type ExportSelection,
} from "../../../lib/contracts";
import { createExportManifest, evaluateExportGate } from "../../../lib/export/core";
import { renderExportJson } from "../../../lib/export/renderers";
import { buildExportDocumentSections } from "../../../lib/export/renderers/document-model";
import {
  deriveGapActionCoverage,
  derivePlanningDashboardCounts,
  deriveServiceResourceMatches,
  serviceProviderDirectory,
  sourceLinkState,
} from "../../../lib/planning";
import {
  applyCaseCommand,
  createInitialCaseState,
  loadCaseState,
  resetCase,
  restoreCaseState,
  saveCaseState,
  serializeCaseState,
} from "../../../lib/state";

const NOW = "2026-07-24T00:00:00.000Z";
const fullSelection: ExportSelection = {
  kind: "full_practitioner_handoff",
  minimumNecessarySelection: null,
};

function meta(state: CaseState, id: string): CaseCommand["meta"] {
  return {
    commandId: id,
    idempotencyKey: `idem-${id}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt: NOW,
  };
}

function applyOk(state: CaseState, command: CaseCommand): CaseState {
  const result = applyCaseCommand(state, command);
  expect(result.ok, result.ok ? undefined : result.reason).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

function expectCommandFailure(result: ReturnType<typeof applyCaseCommand>, reason: string) {
  expect(result.ok).toBe(false);
  if (!("reason" in result)) throw new Error("Expected command failure");
  expect(result.reason).toBe(reason);
}

function checkpointState() {
  const initial = createInitialCaseState(NOW);
  return applyOk(initial, {
    type: "load_demo_checkpoint",
    meta: meta(initial, "cmd-load-checkpoint"),
    checkpointBundleId: "DEMO-CHECKPOINT-REVIEW",
  });
}

function completeReview(state = checkpointState()) {
  const intents: Array<Extract<CaseCommand, { type: "review_candidate" }>["intent"]> = [
    {
      candidateId: "CAND-CTRL-PASSPORT",
      action: "edit",
      editedText: "The practitioner report describes passport removal; recruiter messages separately refer to passport custody.",
      reason: "Preserve reported and documented sources separately.",
    },
    { candidateId: "CAND-CTRL-CONFINEMENT", action: "reject", reason: "No independent confirmation." },
    { candidateId: "CAND-SENDER-0402", action: "reject", reason: "Sender identity remains unestablished." },
    { candidateId: "CAND-URG-INTERPRETER", action: "confirm_unknown", reason: null },
    { candidateId: "CAND-PROV-TASKLOG", action: "reject", reason: "Task-log provenance remains unresolved for export." },
    { candidateId: "CAND-META-COOPERATION", action: "confirm_unknown", reason: null },
  ];
  for (const [index, intent] of intents.entries()) {
    const current = state.candidates.find((candidate) => candidate.id === intent.candidateId);
    if (!current || ["human_accepted", "human_edited", "rejected"].includes(current.reviewStatus)) continue;
    state = applyOk(state, {
      type: "review_candidate",
      meta: meta(state, `cmd-review-${index + 1}`),
      intent,
    });
  }
  return state;
}

function sessionStore() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  };
}

describe("planning canonical state", () => {
  it("uses curated official resources without claiming availability", () => {
    expect(serviceProviderDirectory).toHaveLength(7);
    expect(
      serviceProviderDirectory.every(
        (resource) =>
          resource.verificationStatus === "official_source_verified" &&
          resource.availabilityStatus === "not_verified" &&
          resource.sourceUrl.startsWith("https://") &&
          resource.needCategories.length > 0,
      ),
    ).toBe(true);

    const matches = deriveServiceResourceMatches(checkpointState());
    expect(matches.find(({ resource }) => resource.id === "SERVICE-1")?.matchedNeedIds).toContain("NEED-1");
    expect(matches.find(({ resource }) => resource.id === "SERVICE-4")?.matchedNeedIds).toContain("NEED-1");
  });

  it("validates bounded planning commands and referral consent literals", () => {
    const state = checkpointState();
    expect(
      CaseCommandSchema.safeParse({
        type: "create_referral_plan",
        meta: meta(state, "cmd-bad-referral"),
        input: {
          providerId: "SERVICE-1",
          planningStatus: "draft",
          consentConfirmed: false,
          safeContactAcknowledged: true,
        },
      }).success,
    ).toBe(false);
    expect(
      CaseCommandSchema.safeParse({
        type: "update_referral_plan_status",
        meta: meta(state, "cmd-bad-status"),
        referralPlanId: "REFERRAL-1",
        planningStatus: "sent",
      }).success,
    ).toBe(false);
  });

  it("creates gap actions once, preserves CAND gap IDs, and never mutates evidence collections", () => {
    let state = checkpointState();
    const before = {
      candidates: state.candidates,
      citations: state.citations,
      documents: state.documents,
    };

    state = applyOk(state, {
      type: "create_gap_action",
      meta: meta(state, "cmd-gap-question"),
      input: {
        actionType: "create_interview_question",
        gapId: "CAND-SENDER-0402",
        body: "Could you help clarify who, if anyone, sent that specific communication?",
        rationale: "Open question created from a canonical context gap.",
      },
    });
    state = applyOk(state, {
      type: "create_gap_action",
      meta: meta(state, "cmd-gap-task"),
      input: {
        actionType: "create_document_request",
        gapId: "CAND-SENDER-0402",
        title: "Request source material for sender identity",
        description: "Operational document request only.",
        owner: "M. Chen",
        priority: "high",
      },
    });

    expect(state.interviewQuestions.at(-1)).toMatchObject({
      linkedGapCandidateId: "CAND-SENDER-0402",
      source: expect.objectContaining({
        sourceType: "context_gap",
        sourceId: "CAND-SENDER-0402",
      }),
    });
    expect(state.caseTasks.at(-1)).toMatchObject({
      kind: "document_request",
      origin: "context_gap",
      originId: "CAND-SENDER-0402",
    });
    expect(deriveGapActionCoverage(state, "CAND-SENDER-0402")).toMatchObject({
      hasQuestion: true,
      hasDocumentRequest: true,
    });
    expect(state.candidates).toEqual(before.candidates);
    expect(state.citations).toEqual(before.citations);
    expect(state.documents).toEqual(before.documents);

    const duplicate = applyCaseCommand(state, {
      type: "create_gap_action",
      meta: meta(state, "cmd-gap-question-dupe"),
      input: {
        actionType: "create_interview_question",
        gapId: "CAND-SENDER-0402",
        body: "Could you clarify the source of the communication?",
        rationale: "Duplicate active action should fail.",
      },
    });
    expectCommandFailure(duplicate, "duplicate_active_gap_action");
  });

  it("rejects stale revisions, invalid references, and preserves unknown without resolving evidence", () => {
    let state = checkpointState();
    const stale = applyCaseCommand(state, {
      type: "create_case_task",
      meta: { ...meta(state, "cmd-stale-task"), expectedCaseRevision: state.caseRevision + 1 },
      input: {
        kind: "general_task",
        title: "Stale task",
        description: "Should not apply.",
        owner: "M. Chen",
        priority: "medium",
      },
    });
    expectCommandFailure(stale, "stale_case_revision");

    const badReference = applyCaseCommand(state, {
      type: "create_gap_action",
      meta: meta(state, "cmd-missing-gap"),
      input: {
        actionType: "create_case_task",
        gapId: "CAND-NOPE",
        title: "Missing gap",
        description: "Should fail.",
        owner: "M. Chen",
        priority: "medium",
      },
    });
    expectCommandFailure(badReference, "context_gap_not_found");

    const gapBefore = state.candidates.find((candidate) => candidate.id === "CAND-URG-INTERPRETER")!;
    state = applyOk(state, {
      type: "respond_context_gap",
      meta: meta(state, "cmd-preserve-unknown"),
      intent: {
        gapId: "CAND-URG-INTERPRETER",
        responseStatus: "preserved_unknown",
        response: null,
        responseExplanation: null,
      },
    });
    const gapAfter = state.candidates.find((candidate) => candidate.id === "CAND-URG-INTERPRETER")!;
    expect(gapAfter).toMatchObject({
      responseStatus: "preserved_unknown",
      reviewStatus: gapBefore.reviewStatus,
      supportStatus: gapBefore.supportStatus,
    });
  });

  it("task completion does not resolve gaps and referral plans never transmit", () => {
    let state = checkpointState();
    state = applyOk(state, {
      type: "create_gap_action",
      meta: meta(state, "cmd-gap-task-complete"),
      input: {
        actionType: "create_case_task",
        gapId: "CAND-URG-INTERPRETER",
        title: "Follow up on interpreter status",
        description: "Operational task only.",
        owner: "M. Chen",
        priority: "medium",
      },
    });
    const task = state.caseTasks.at(-1)!;
    state = applyOk(state, {
      type: "update_case_task_status",
      meta: meta(state, "cmd-complete-task"),
      taskId: task.id,
      status: "completed",
    });
    expect(state.candidates.find((candidate) => candidate.id === "CAND-URG-INTERPRETER")).toMatchObject({
      kind: "context_gap",
      responseStatus: "unanswered",
    });

    state = applyOk(state, {
      type: "create_referral_plan",
      meta: meta(state, "cmd-referral"),
      input: {
        providerId: "SERVICE-1",
        planningStatus: "draft",
        consentConfirmed: true,
        safeContactAcknowledged: true,
      },
    });
    expect(state.referralPlans.at(-1)).toMatchObject({
      contactStatus: "not_contacted",
      transmissionStatus: "not_transmitted",
    });

    state = applyOk(state, {
      type: "update_referral_plan_status",
      meta: meta(state, "cmd-referral-planned"),
      referralPlanId: state.referralPlans.at(-1)!.id,
      planningStatus: "planned_for_manual_follow_up",
    });
    state = applyOk(state, {
      type: "update_referral_plan_status",
      meta: meta(state, "cmd-referral-cancelled"),
      referralPlanId: state.referralPlans.at(-1)!.id,
      planningStatus: "cancelled",
    });
    expectCommandFailure(
      applyCaseCommand(state, {
        type: "update_referral_plan_status",
        meta: meta(state, "cmd-referral-reopen"),
        referralPlanId: state.referralPlans.at(-1)!.id,
        planningStatus: "planned_for_manual_follow_up",
      }),
      "referral_plan_cancelled",
    );
  });

  it("edits tasks canonically and retains removed tasks as cancelled history", () => {
    let state = checkpointState();
    state = applyOk(state, {
      type: "create_case_task",
      meta: meta(state, "cmd-create-editable-task"),
      input: {
        kind: "general_task",
        title: "Original task wording",
        description: "Original operational description.",
        owner: "M. Chen",
        priority: "medium",
      },
    });
    const taskId = state.caseTasks.at(-1)!.id;

    state = applyOk(state, {
      type: "update_case_task",
      meta: meta(state, "cmd-update-editable-task"),
      input: {
        taskId,
        title: "Revised task wording",
        description: "Revised operational description.",
      },
    });
    expect(state.caseTasks.find((task) => task.id === taskId)).toMatchObject({
      title: "Revised task wording",
      description: "Revised operational description.",
      status: "todo",
    });
    expect(state.audit.at(-1)).toMatchObject({
      eventType: "case_task_updated",
      entityIds: [taskId],
    });

    state = applyOk(state, {
      type: "update_case_task_status",
      meta: meta(state, "cmd-remove-editable-task"),
      taskId,
      status: "cancelled",
    });
    expect(state.caseTasks.find((task) => task.id === taskId)?.status).toBe(
      "cancelled",
    );

    const editCancelled = applyCaseCommand(state, {
      type: "update_case_task",
      meta: meta(state, "cmd-edit-cancelled-task"),
      input: {
        taskId,
        title: "Should not reopen",
        description: "Cancelled history stays closed.",
      },
    });
    expectCommandFailure(editCancelled, "cancelled_case_task_cannot_be_edited");
  });

  it("rejects gap actions when the active analysis source is stale", () => {
    let state = checkpointState();
    if (!state.purposeBrief) throw new Error("checkpoint purpose missing");
    state = applyOk(state, {
      type: "save_purpose",
      meta: meta(state, "cmd-purpose-stales-gap-actions"),
      purposeBrief: {
        ...state.purposeBrief,
        revision: state.purposeBrief.revision + 1,
        statedPurpose: `${state.purposeBrief.statedPurpose} Purpose changed before planning action.`,
        updatedAt: NOW,
      },
    });
    const result = applyCaseCommand(state, {
      type: "create_gap_action",
      meta: meta(state, "cmd-gap-after-stale-purpose"),
      input: {
        actionType: "create_interview_question",
        gapId: "CAND-URG-INTERPRETER",
        body: "What, if anything, have you been told about interpretation support for the hearing?",
        rationale: "Should fail because the source analysis is stale.",
      },
    });
    expectCommandFailure(result, "context_gap_source_stale");
  });

  it("keeps planning secrets out of export projections while planning stales only the snapshot", () => {
    let state = completeReview();
    const gateBefore = evaluateExportGate(state, fullSelection, { now: NOW });
    expect(gateBefore).toMatchObject({ status: "ready", freshness: "current", blockers: [] });
    const blockerCodesBefore = gateBefore.blockers.map((blocker) => blocker.code);
    state = applyOk(state, {
      type: "evaluate_export_gate",
      meta: meta(state, "cmd-gate-before-planning"),
      selection: fullSelection,
    });
    expect(state.exportGate).not.toBeNull();

    state = applyOk(state, {
      type: "create_urgent_need",
      meta: meta(state, "cmd-need-sensitive"),
      input: {
        category: "safe_contact",
        description: "URGENT_NEED_SECRET_MARKER_9271",
        urgency: "within_72_hours",
        owner: "M. Chen",
        safeContactConstraints: "URGENT_SAFE_CONTACT_SECRET_MARKER_9271",
        nextAction: "URGENT_NEXT_ACTION_SECRET_MARKER_9271",
        linkedCandidateIds: [],
        linkedCitationIds: [],
      },
    });

    state = applyOk(state, {
      type: "create_practitioner_note",
      meta: meta(state, "cmd-note-sensitive"),
      input: {
        body: "NOTE_SECRET_MARKER_9271",
        visibility: "team",
        linkedEntityIds: [],
      },
    });
    state = applyOk(state, {
      type: "create_interview_question",
      meta: meta(state, "cmd-question-sensitive"),
      input: {
        body: "QUESTION_SECRET_MARKER_9271",
        rationale: "RATIONALE_SECRET_MARKER_9271",
      },
    });
    state = applyOk(state, {
      type: "create_case_task",
      meta: meta(state, "cmd-task-sensitive"),
      input: {
        kind: "general_task",
        title: "TASK_TITLE_SECRET_MARKER_9271",
        description: "TASK_DESCRIPTION_SECRET_MARKER_9271",
        owner: "M. Chen",
        priority: "medium",
      },
    });
    state = applyOk(state, {
      type: "create_referral_plan",
      meta: meta(state, "cmd-referral-sensitive"),
      input: {
        providerId: "SERVICE-1",
        planningStatus: "planned_for_manual_follow_up",
        consentConfirmed: true,
        safeContactAcknowledged: true,
      },
    });

    expect(state.exportGate).toBeNull();
    expect(state.audit.map((event) => event.summary).join(" ")).not.toContain("SECRET_MARKER_9271");
    expect(state.candidates.some((candidate) => candidate.currentText.includes("SECRET_MARKER_9271"))).toBe(false);

    const gateAfter = evaluateExportGate(state, fullSelection, { now: NOW });
    expect(gateAfter.blockers.map((blocker) => blocker.code)).toEqual(blockerCodesBefore);
    expect(gateAfter).toMatchObject({ status: "ready", freshness: "current", blockers: [] });
    const manifest = createExportManifest(state, fullSelection, { now: NOW, previousGate: gateAfter });
    const json = renderExportJson(manifest);
    const documentProjection = JSON.stringify(buildExportDocumentSections(manifest));
    for (const forbidden of [
      "URGENT_NEED_SECRET_MARKER_9271",
      "URGENT_SAFE_CONTACT_SECRET_MARKER_9271",
      "URGENT_NEXT_ACTION_SECRET_MARKER_9271",
      "NOTE_SECRET_MARKER_9271",
      "QUESTION_SECRET_MARKER_9271",
      "RATIONALE_SECRET_MARKER_9271",
      "TASK_TITLE_SECRET_MARKER_9271",
      "TASK_DESCRIPTION_SECRET_MARKER_9271",
      "Fictional Harbor Legal Aid",
      "Region A demonstration area",
      "referralPlans",
      "contactStatus",
      "transmissionStatus",
      "consentConfirmed",
      "safeContactAcknowledged",
    ]) {
      expect(json).not.toContain(forbidden);
      expect(documentProjection).not.toContain(forbidden);
    }
  });

  it("restores legacy planning defaults and fails closed on tampered persisted planning data", () => {
    const state = checkpointState();
    const legacy = JSON.parse(serializeCaseState(state, NOW)) as Record<string, unknown>;
    delete legacy.urgentNeeds;
    delete legacy.interviewSetup;
    delete legacy.interviewQuestions;
    delete legacy.caseTasks;
    delete legacy.practitionerNotes;
    delete legacy.referralPlans;

    const restoredLegacy = restoreCaseState(JSON.stringify(legacy));
    if (!restoredLegacy.ok) throw new Error(restoredLegacy.reason);
    expect(restoredLegacy.ok).toBe(true);
    expect(restoredLegacy.state.urgentNeeds).toHaveLength(1);
    expect(restoredLegacy.state.referralPlans).toHaveLength(0);

    const withReferral = applyOk(state, {
      type: "create_referral_plan",
      meta: meta(state, "cmd-referral-persist-tamper"),
      input: {
        providerId: "SERVICE-1",
        planningStatus: "draft",
        consentConfirmed: true,
        safeContactAcknowledged: true,
      },
    });
    const tamperedContact = JSON.parse(serializeCaseState(withReferral, NOW)) as {
      referralPlans: Array<Record<string, unknown>>;
    };
    tamperedContact.referralPlans[0]!.contactStatus = "contacted";
    const restoredContact = restoreCaseState(JSON.stringify(tamperedContact));
    expect(restoredContact.ok).toBe(false);
    expect(restoredContact.ok ? null : restoredContact.resetState.referralPlans).toHaveLength(0);

    const tamperedTransmission = JSON.parse(serializeCaseState(withReferral, NOW)) as {
      referralPlans: Array<Record<string, unknown>>;
    };
    tamperedTransmission.referralPlans[0]!.transmissionStatus = "transmitted";
    expect(restoreCaseState(JSON.stringify(tamperedTransmission)).ok).toBe(false);

    const tamperedPlanningStatus = JSON.parse(serializeCaseState(state, NOW)) as {
      urgentNeeds: Array<Record<string, unknown>>;
    };
    tamperedPlanningStatus.urgentNeeds[0]!.status = "auto_resolved";
    expect(restoreCaseState(JSON.stringify(tamperedPlanningStatus)).ok).toBe(false);

    const tamperedReference = JSON.parse(serializeCaseState(state, NOW)) as {
      urgentNeeds: Array<Record<string, unknown>>;
    };
    tamperedReference.urgentNeeds[0]!.linkedCandidateIds = ["CAND-DOES-NOT-EXIST"];
    expect(restoreCaseState(JSON.stringify(tamperedReference)).ok).toBe(false);
  });

  it("persists planning records, resets to seeded state, and marks superseded gap links", () => {
    let state = checkpointState();
    state = applyOk(state, {
      type: "create_gap_action",
      meta: meta(state, "cmd-gap-question-persist"),
      input: {
        actionType: "create_interview_question",
        gapId: "CAND-URG-INTERPRETER",
        body: "Could you tell me what interpreter support would help?",
        rationale: "Open planning prompt from a canonical gap.",
      },
    });
    const question = state.interviewQuestions.at(-1)!;
    expect(sourceLinkState(state, question.source)).toBe("current");

    const store = sessionStore();
    expect(saveCaseState(store, state, NOW)).toBe(true);
    const restored = loadCaseState(store);
    expect(restored.ok).toBe(true);
    if (!restored.ok) throw new Error(restored.reason);
    expect(restored.state.interviewQuestions.some((item) => item.id === question.id)).toBe(true);

    const rerun = applyOk(restored.state, {
      type: "run_deterministic_replay",
      meta: meta(restored.state, "cmd-rerun"),
      request: {
        mode: "deterministic_replay",
        replayBundleId: "REPLAY-CFN-DEMO-001-V1",
        caseId: "CFN-DEMO-001",
        releaseConfigurationId: "prepared-replay-v1",
        providerDisclosureAcknowledgementId: restored.state.purposeBrief!.providerSelection.disclosureAcknowledgement.id,
        recoveryOfRunId: null,
        fixtureVersion: "1.0.0",
        promptVersion: "1.0.0",
        analysisResponseVersion: "1.0.0",
        replayVersion: "1.0.0",
      },
    });
    const retained = rerun.interviewQuestions.find((item) => item.id === question.id)!;
    expect(sourceLinkState(rerun, retained.source)).toBe("superseded");

    const reset = resetCase(store, {}, NOW);
    expect(reset.interviewQuestions.some((item) => item.id === question.id)).toBe(false);
    expect(reset.referralPlans).toHaveLength(0);
    expect(derivePlanningDashboardCounts(reset).openUrgentNeeds).toBeGreaterThan(0);
  });
});
