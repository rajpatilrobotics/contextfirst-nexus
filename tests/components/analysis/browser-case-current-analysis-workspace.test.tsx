import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { BrowserCaseCurrentAnalysisWorkspace } from "../../../features/analysis/browser-case-current-analysis-workspace";
import {
  BrowserCaseRecordSchema,
  persistBrowserCaseRegistry,
} from "../../../lib/cases";
import type { BrowserCaseAnalysisStore } from "../../../lib/cases/browser-case-analysis-store";
import { CaseStateSchema, type CaseState } from "../../../lib/contracts";
import { checkpointState } from "../review/candidate/review-test-state";

const CASE_ID = "CFN-CASE-PLANNING";
const NOW = "2026-07-26T12:00:00.000Z";

function dynamicCaseState() {
  const checkpoint = checkpointState();
  if (!checkpoint.purposeBrief || !checkpoint.documentSetDigest) {
    throw new Error("Expected prepared checkpoint");
  }
  const purposeBrief = {
    ...checkpoint.purposeBrief,
    id: "PURPOSE-CFN-CASE-PLANNING",
    caseId: CASE_ID,
    sourceMaterialClassification: "user_attested_authorized_public" as const,
    authority: {
      ...checkpoint.purposeBrief.authority,
      basis: "user_attested_authorized_public_material" as const,
      consentStatus: "not_applicable_authorized_public_material" as const,
    },
  };
  return CaseStateSchema.parse({
    ...checkpoint,
    caseId: CASE_ID,
    purposeBrief,
    documents: checkpoint.documents.map((document) => ({
      ...document,
      caseId: CASE_ID,
    })),
    analysisRuns: checkpoint.analysisRuns.map((run) => ({
      ...run,
      inputState: {
        ...run.inputState,
        purposeBriefId: purposeBrief.id,
        purposeBriefRevision: purposeBrief.revision,
      },
    })),
    urgentNeeds: [],
    interviewSetup: {
      ...checkpoint.interviewSetup,
      caseId: CASE_ID,
    },
    interviewQuestions: [],
    caseTasks: [],
    practitionerNotes: [],
    referralPlans: [],
    audit: checkpoint.audit.map((event) => ({
      ...event,
      caseId: CASE_ID,
    })),
  });
}

function storeDynamicCase(state: CaseState) {
  const record = BrowserCaseRecordSchema.parse({
    schemaVersion: "1.0.0",
    id: CASE_ID,
    displayReference: "REF-2026-PLANNING",
    personAlias: "J. Dynamic",
    assignedPractitioner: "Dynamic reviewer",
    createdAt: NOW,
    updatedAt: NOW,
    purposeBrief: state.purposeBrief,
    documentPacket: {
      schemaVersion: "1.0.0",
      caseId: CASE_ID,
      documentSetDigest: state.documentSetDigest,
      fileMetadata: state.documents.map((document) => ({
        documentId: document.id,
        fileName: document.fileName,
        byteLength: 1,
        sha256: "a".repeat(64),
      })),
      documents: state.documents,
      coverage: state.coverage,
      processing: state.processing,
      masking: state.masking,
      ocrVerifications: [],
      contentPersistence: "browser_indexeddb",
      updatedAt: NOW,
    },
  });
  const result = persistBrowserCaseRegistry(window.localStorage, {
    schemaVersion: "1.0.0",
    cases: [record],
  });
  if (!result.ok) throw new Error(result.reason);
}

function memoryStore(initial: CaseState): BrowserCaseAnalysisStore & {
  snapshots: Map<string, CaseState>;
} {
  const snapshots = new Map([[CASE_ID, initial]]);
  return {
    snapshots,
    async load(caseId) {
      return snapshots.get(caseId) ?? null;
    },
    async save(caseId, state) {
      snapshots.set(caseId, state);
    },
  };
}

beforeEach(() => {
  window.localStorage.clear();
  window.location.hash = "";
});

describe("browser-created current-analysis destinations", () => {
  it("persists practitioner-written urgent needs with the case-specific owner and audit event", async () => {
    const initial = dynamicCaseState();
    storeDynamicCase(initial);
    const analysisStore = memoryStore(initial);
    const user = userEvent.setup();

    const first = render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="urgent-needs"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Urgent Needs" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Urgent Needs" })).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/urgent-needs`,
    );
    expect(screen.getByRole("link", { name: "Evidence Gaps" })).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/gaps`,
    );
    expect(screen.getByRole("link", { name: "Interview Planner" })).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/interview`,
    );
    expect(screen.getByRole("link", { name: "Case Tasks" })).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/tasks`,
    );
    expect(
      screen.getByRole("link", { name: "Services & Referrals" }),
    ).toHaveAttribute("href", `/case/${CASE_ID}/services`);
    expect(screen.getByRole("link", { name: "Notes & Journal" })).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/notes`,
    );
    expect(
      screen.getByRole("link", { name: "Charge–Coercion Nexus" }),
    ).toHaveAttribute("href", `/case/${CASE_ID}/nexus`);
    expect(screen.getByRole("link", { name: "Timeline" })).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/timeline`,
    );
    expect(screen.getByRole("link", { name: "Export Gate" })).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/export`,
    );
    expect(screen.getByRole("link", { name: "Audit Trail" })).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/audit`,
    );
    expect(screen.getByText(/No operational needs recorded/i)).toBeInTheDocument();
    await user.type(
      screen.getByLabelText("Practitioner description"),
      "Synthetic safe-contact support is needed.",
    );
    await user.type(
      screen.getByLabelText("Safe-contact constraints"),
      "Use the fictional callback window only.",
    );
    await user.type(
      screen.getByLabelText("Next action"),
      "Review the fictional contact plan.",
    );
    await user.click(screen.getByRole("button", { name: "Record need" }));

    await waitFor(() => {
      expect(analysisStore.snapshots.get(CASE_ID)?.urgentNeeds).toHaveLength(1);
    });
    expect(analysisStore.snapshots.get(CASE_ID)?.urgentNeeds[0]).toMatchObject({
      caseId: CASE_ID,
      owner: "Dynamic reviewer",
      origin: "human_created",
    });
    expect(
      analysisStore.snapshots
        .get(CASE_ID)
        ?.audit.some((event) => event.eventType === "urgent_need_created"),
    ).toBe(true);

    first.unmount();
    render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="urgent-needs"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByText("Synthetic safe-contact support is needed."),
    ).toBeInTheDocument();
  });

  it("creates a canonical gap task and links to the case-specific destination", async () => {
    const initial = dynamicCaseState();
    storeDynamicCase(initial);
    const analysisStore = memoryStore(initial);
    const user = userEvent.setup();

    const gaps = render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="evidence-gaps"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Evidence Gaps" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create case task" }));

    await waitFor(() => {
      expect(analysisStore.snapshots.get(CASE_ID)?.caseTasks).toHaveLength(1);
    });
    const task = analysisStore.snapshots.get(CASE_ID)?.caseTasks[0];
    expect(task).toMatchObject({
      caseId: CASE_ID,
      origin: "context_gap",
      owner: "Dynamic reviewer",
    });
    expect(screen.getByRole("link", { name: "Open Case Tasks" })).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/tasks#task-TASK-1`,
    );
    expect(
      analysisStore.snapshots
        .get(CASE_ID)
        ?.audit.some((event) => event.eventType === "gap_action_created"),
    ).toBe(true);

    if (!task?.originId) throw new Error("Expected a source-linked task");
    gaps.unmount();
    window.location.hash = `#task-${task.id}`;
    render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="tasks"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByRole("link", { name: task.originId }),
    ).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/gaps#candidate-${task.originId}`,
    );
  });

  it("opens the exact gap-created interview question with a return link to its source gap", async () => {
    const initial = dynamicCaseState();
    storeDynamicCase(initial);
    const analysisStore = memoryStore(initial);
    const user = userEvent.setup();

    const gaps = render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="evidence-gaps"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Evidence Gaps" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Create interview question" }),
    );

    await waitFor(() => {
      expect(analysisStore.snapshots.get(CASE_ID)?.interviewQuestions).toHaveLength(1);
    });
    const question = analysisStore.snapshots.get(CASE_ID)?.interviewQuestions[0];
    if (!question?.linkedGapCandidateId) {
      throw new Error("Expected a gap-linked interview question");
    }
    const exactLink = screen.getByRole("link", {
      name: "Open Interview Planner",
    });
    expect(exactLink).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/interview#question-${question.id}`,
    );

    gaps.unmount();
    window.location.hash = `#question-${question.id}`;
    render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="interview"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );

    expect(
      await screen.findByRole("article", {
        name: `Interview question detail: ${question.id}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: question.linkedGapCandidateId }),
    ).toHaveAttribute(
      "href",
      `/case/${CASE_ID}/gaps#candidate-${question.linkedGapCandidateId}`,
    );
  });

  it("persists browser-created interview questions and task ownership", async () => {
    const initial = dynamicCaseState();
    storeDynamicCase(initial);
    const analysisStore = memoryStore(initial);
    const user = userEvent.setup();

    const interview = render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="interview"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Interview Planner" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Question" }));
    const questionDialog = screen.getByRole("dialog", { name: "New question" });
    await user.type(
      within(questionDialog).getByLabelText("Question"),
      "What support would help you participate safely?",
    );
    await user.type(
      within(questionDialog).getByLabelText("Rationale"),
      "Neutral practitioner-authored planning question.",
    );
    await user.click(
      within(questionDialog).getByRole("button", { name: "Create question" }),
    );
    await waitFor(() => {
      expect(analysisStore.snapshots.get(CASE_ID)?.interviewQuestions).toHaveLength(1);
    });
    expect(analysisStore.snapshots.get(CASE_ID)?.interviewQuestions[0]).toMatchObject({
      caseId: CASE_ID,
      origin: "human_created",
      status: "draft",
    });
    interview.unmount();

    const tasks = render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="tasks"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Case Tasks" }),
    ).toBeInTheDocument();
    const taskPanel = screen.getByRole("heading", { name: "Create task" }).closest("aside");
    if (!taskPanel) throw new Error("create-task panel missing");
    await user.type(within(taskPanel).getByLabelText("Title"), "Review safe-contact plan");
    await user.type(
      within(taskPanel).getByLabelText("Description"),
      "Synthetic operational planning only.",
    );
    await user.click(within(taskPanel).getByRole("button", { name: "Create task" }));
    await waitFor(() => {
      expect(analysisStore.snapshots.get(CASE_ID)?.caseTasks).toHaveLength(1);
    });
    expect(analysisStore.snapshots.get(CASE_ID)?.caseTasks[0]).toMatchObject({
      caseId: CASE_ID,
      origin: "manual",
      owner: "Dynamic reviewer",
      status: "todo",
    });
    tasks.unmount();

    render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="interview"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findAllByText("What support would help you participate safely?"),
    ).not.toHaveLength(0);
  });

  it("persists consent-gated referral plans and practitioner notes without transmission", async () => {
    const initial = dynamicCaseState();
    storeDynamicCase(initial);
    const analysisStore = memoryStore(initial);
    const user = userEvent.setup();

    const services = render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="services"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Services & Referrals" }),
    ).toBeInTheDocument();
    const resourceDetail = screen.getByRole("article", {
      name: "Selected resource: 211 Community Resource Search",
    });
    const savePlan = within(resourceDetail).getByRole("button", {
      name: "Save local referral plan",
    });
    expect(savePlan).toBeDisabled();
    await user.click(
      within(resourceDetail).getByLabelText(
        "Consent confirmed for this resource follow-up",
      ),
    );
    await user.click(
      within(resourceDetail).getByLabelText("Safe-contact restrictions reviewed"),
    );
    await user.click(savePlan);
    await waitFor(() => {
      expect(analysisStore.snapshots.get(CASE_ID)?.referralPlans).toHaveLength(1);
    });
    expect(analysisStore.snapshots.get(CASE_ID)?.referralPlans[0]).toMatchObject({
      caseId: CASE_ID,
      consentConfirmed: true,
      safeContactAcknowledged: true,
      contactStatus: "not_contacted",
      transmissionStatus: "not_transmitted",
    });
    services.unmount();

    const notes = render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="notes"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Notes & Journal" }),
    ).toBeInTheDocument();
    const notePanel = screen.getByRole("heading", { name: "New note" }).closest("aside");
    if (!notePanel) throw new Error("new-note panel missing");
    await user.type(
      within(notePanel).getByLabelText("Commentary"),
      "Synthetic practitioner commentary, not evidence.",
    );
    await user.click(within(notePanel).getByRole("button", { name: "Record note" }));
    await waitFor(() => {
      expect(analysisStore.snapshots.get(CASE_ID)?.practitionerNotes).toHaveLength(1);
    });
    expect(analysisStore.snapshots.get(CASE_ID)?.practitionerNotes[0]).toMatchObject({
      caseId: CASE_ID,
      author: "current_practitioner",
      origin: "human_created",
      archived: false,
    });
    await user.type(
      screen.getByLabelText("Edit commentary"),
      " Updated safely.",
    );
    await user.click(screen.getByRole("button", { name: "Save note edit" }));
    await waitFor(() => {
      expect(
        analysisStore.snapshots.get(CASE_ID)?.practitionerNotes[0]?.body,
      ).toContain("Updated safely.");
    });
    await user.click(screen.getByRole("button", { name: "Archive note" }));
    await waitFor(() => {
      expect(
        analysisStore.snapshots.get(CASE_ID)?.practitionerNotes[0]?.archived,
      ).toBe(true);
    });
    notes.unmount();

    render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="services"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByText(/Contact status is always not contacted/i),
    ).toBeInTheDocument();
  });

  it("projects canonical Nexus relationships and qualified timeline events", async () => {
    const initial = dynamicCaseState();
    storeDynamicCase(initial);
    const analysisStore = memoryStore(initial);

    const nexus = render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="nexus"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Evidence Integrity Map" }),
    ).toBeInTheDocument();
    const map = screen.getByRole("heading", {
      name: "Canonical relationship map",
    }).closest("section");
    if (!map) throw new Error("canonical relationship map missing");
    expect(
      within(map).getAllByRole("button", { name: /Select Nexus node/i }),
    ).toHaveLength(6);
    nexus.unmount();

    render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="timeline"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Timeline" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Qualified timeline events" }),
    ).toBeInTheDocument();
  });

  it("persists a fail-closed Export Gate and shows this case's real audit events", async () => {
    const initial = dynamicCaseState();
    storeDynamicCase(initial);
    const analysisStore = memoryStore(initial);
    const user = userEvent.setup();

    const exportView = render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="export"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Export Gate" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Check readiness" }));
    await waitFor(() => {
      expect(analysisStore.snapshots.get(CASE_ID)?.exportGate).not.toBeNull();
    });
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toContain("/case/demo");
    }
    exportView.unmount();

    render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="audit"
        analysisStore={analysisStore}
        caseId={CASE_ID}
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Audit Trail" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(
          `Showing \\d+ of ${analysisStore.snapshots.get(CASE_ID)?.audit.length ?? 0} canonical events`,
        ),
      ),
    ).toBeInTheDocument();
  });

  it("fails safely for an unknown browser-created case ID", async () => {
    const state = dynamicCaseState();
    const analysisStore = memoryStore(state);
    render(
      <BrowserCaseCurrentAnalysisWorkspace
        activeDestination="urgent-needs"
        analysisStore={analysisStore}
        caseId="CFN-CASE-MISSING"
      />,
    );

    expect(await screen.findByText("Case not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
