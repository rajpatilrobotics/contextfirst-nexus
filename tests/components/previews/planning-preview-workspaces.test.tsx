import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CaseStateProvider } from "../../../components/shell";
import {
  InterviewPlannerPreview,
  NotesPreview,
  ServicesPreview,
  TasksPreview,
  UrgentNeedsPreview,
} from "../../../features/previews";
import type { CaseCommand, CaseState } from "../../../lib/contracts";
import {
  applyCaseCommand,
  createInitialCaseState,
  saveCaseState,
} from "../../../lib/state";

const NOW = "2026-07-24T00:00:00.000Z";

function renderWorkspace(element: React.ReactNode) {
  return render(
    <CaseStateProvider initialState={createInitialCaseState(NOW)}>
      {element}
    </CaseStateProvider>,
  );
}

function meta(state: CaseState, commandId: string): CaseCommand["meta"] {
  return {
    commandId,
    idempotencyKey: `idem-${commandId}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt: NOW,
  };
}

afterEach(() => {
  window.sessionStorage.clear();
});

describe("planning workspaces", () => {
  it("records an Urgent Need in canonical browser-session state", async () => {
    const user = userEvent.setup();
    renderWorkspace(<UrgentNeedsPreview />);

    expect(screen.getByRole("heading", { name: "Urgent Needs" })).toBeInTheDocument();
    expect(screen.queryByText(/not yet connected/i)).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Practitioner description"), "Needs a safe callback window.");
    await user.type(screen.getByLabelText("Safe-contact constraints"), "SMS only after 10:00.");
    await user.type(screen.getByLabelText("Next action"), "Confirm a fictional safe-contact plan.");
    await user.click(screen.getByRole("button", { name: "Record need" }));

    expect(screen.getByText(/saved in browser-session case state/i)).toBeInTheDocument();
    expect(screen.getAllByText("Confirm a fictional safe-contact plan.").length).toBeGreaterThan(0);
  });

  it("creates and approves an Interview Planner question", async () => {
    const user = userEvent.setup();
    renderWorkspace(<InterviewPlannerPreview />);

    expect(screen.getByRole("heading", { name: "Interview Planner" })).toBeInTheDocument();
    const newQuestion = screen.getByRole("heading", { name: "New question" }).closest("aside");
    if (!newQuestion) throw new Error("new-question panel missing");

    await user.type(
      within(newQuestion).getByLabelText("Question"),
      "Could you describe what document support would help you feel prepared?",
    );
    await user.type(
      within(newQuestion).getByLabelText("Rationale"),
      "Open planning question, separate from evidence.",
    );
    await user.click(within(newQuestion).getByRole("button", { name: "Create question" }));

    expect(screen.getByText(/saved for practitioner review/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Approve for use" }));
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });

  it("saves a Services local referral plan only after both confirmations", async () => {
    const user = userEvent.setup();
    renderWorkspace(<ServicesPreview />);

    expect(screen.getByRole("heading", { name: "Services & Referrals" })).toBeInTheDocument();
    const providerList = screen.getByRole("navigation", { name: "Fictional providers" });
    await user.click(
      within(providerList).getByRole("button", {
        name: /Fictional Meridian Trauma Support/i,
      }),
    );

    const detail = screen.getByRole("article", {
      name: "Selected provider: Fictional Meridian Trauma Support",
    });
    const save = within(detail).getByRole("button", { name: "Save local referral plan" });
    expect(save).toBeDisabled();
    await user.click(within(detail).getByLabelText("Consent confirmed for this synthetic demonstration"));
    await user.click(within(detail).getByLabelText("Safe-contact restrictions reviewed"));
    expect(save).toBeEnabled();
    await user.click(save);

    expect(screen.getByText(/No contact was made and no information was transmitted/i)).toBeInTheDocument();
    expect(save).toBeDisabled();
    expect(within(detail).getByLabelText("Consent confirmed for this synthetic demonstration")).not.toBeChecked();
    expect(within(detail).getByLabelText("Safe-contact restrictions reviewed")).not.toBeChecked();
  });

  it("does not carry referral confirmations across selected providers", async () => {
    const user = userEvent.setup();
    renderWorkspace(<ServicesPreview />);

    const providerList = screen.getByRole("navigation", { name: "Fictional providers" });
    const harborDetail = screen.getByRole("article", {
      name: "Selected provider: Fictional Harbor Legal Aid",
    });
    await user.click(within(harborDetail).getByLabelText("Consent confirmed for this synthetic demonstration"));
    await user.click(within(harborDetail).getByLabelText("Safe-contact restrictions reviewed"));
    expect(within(harborDetail).getByRole("button", { name: "Save local referral plan" })).toBeEnabled();

    await user.click(
      within(providerList).getByRole("button", {
        name: /Fictional Meridian Trauma Support/i,
      }),
    );

    const meridianDetail = screen.getByRole("article", {
      name: "Selected provider: Fictional Meridian Trauma Support",
    });
    expect(within(meridianDetail).getByLabelText("Consent confirmed for this synthetic demonstration")).not.toBeChecked();
    expect(within(meridianDetail).getByLabelText("Safe-contact restrictions reviewed")).not.toBeChecked();
    expect(within(meridianDetail).getByRole("button", { name: "Save local referral plan" })).toBeDisabled();
    expect(screen.queryByText(/No contact was made and no information was transmitted/i)).not.toBeInTheDocument();
  });

  it("keeps Interview Planner edit buffers scoped to the selected question", async () => {
    const user = userEvent.setup();
    renderWorkspace(<InterviewPlannerPreview />);

    await user.type(screen.getByLabelText("Edit question wording"), "QUESTION_ONE_UNSAVED_DRAFT");
    const questionList = screen.getByRole("navigation", { name: "Interview questions" });
    await user.click(within(questionList).getByRole("button", { name: /QUESTION-2/i }));

    expect(screen.getByLabelText("Edit question wording")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Save edit" }));
    expect(screen.getByRole("article", { name: "Interview question detail: QUESTION-2" })).toHaveTextContent(
      "Were there documents about work or wages that you were given, kept, or not given?",
    );
    expect(screen.getByRole("article", { name: "Interview question detail: QUESTION-2" })).not.toHaveTextContent(
      "QUESTION_ONE_UNSAVED_DRAFT",
    );
  });

  it("hydrates Interview Planner setup from persisted canonical state without clobbering active edits", async () => {
    const user = userEvent.setup();
    const initial = createInitialCaseState(NOW);
    const saved = applyCaseCommand(initial, {
      type: "save_interview_setup",
      meta: meta(initial, "cmd-hydrate-setup"),
      input: {
        purpose: "Hydrated setup purpose from session",
        language: "Hydrated language",
        interpreter: "Hydrated interpreter note",
        accessibility: "Hydrated accessibility note",
        safeContact: "Hydrated safe-contact note",
        consentConfirmed: true,
      },
    });
    if (!saved.ok) throw new Error(saved.reason);
    saveCaseState(window.sessionStorage, saved.state, NOW);

    render(
      <CaseStateProvider>
        <InterviewPlannerPreview />
      </CaseStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Purpose")).toHaveValue("Hydrated setup purpose from session");
    });
    await user.clear(screen.getByLabelText("Purpose"));
    await user.type(screen.getByLabelText("Purpose"), "Unsaved local setup edit");

    const newQuestion = screen.getByRole("heading", { name: "New question" }).closest("aside");
    if (!newQuestion) throw new Error("new-question panel missing");
    await user.type(
      within(newQuestion).getByLabelText("Question"),
      "Could you describe what support would help today?",
    );
    await user.type(within(newQuestion).getByLabelText("Rationale"), "Unrelated state update.");
    await user.click(within(newQuestion).getByRole("button", { name: "Create question" }));

    expect(screen.getByLabelText("Purpose")).toHaveValue("Unsaved local setup edit");
  });

  it("creates a Case Task and preserves operational wording", async () => {
    const user = userEvent.setup();
    renderWorkspace(<TasksPreview />);

    expect(screen.getByRole("heading", { name: "Case Tasks" })).toBeInTheDocument();
    const filters = screen.getByRole("group", { name: "Task filters" });
    expect(within(filters).queryByRole("button", { name: "Export blockers" })).not.toBeInTheDocument();
    for (const filter of ["All", "My tasks", "Due soon", "Overdue", "Waiting", "Safety-related", "Completed"]) {
      expect(within(filters).getByRole("button", { name: filter })).toBeInTheDocument();
    }
    const createTask = screen.getByRole("heading", { name: "Create task" }).closest("aside");
    if (!createTask) throw new Error("create-task panel missing");
    await user.type(within(createTask).getByLabelText("Title"), "Check manual provider verification");
    await user.type(within(createTask).getByLabelText("Description"), "Planning task only.");
    await user.click(within(createTask).getByRole("button", { name: "Create task" }));

    expect(screen.getByText(/saved\. Completing tasks does not resolve evidence gaps/i)).toBeInTheDocument();
    expect(screen.getAllByText("Check manual provider verification").length).toBeGreaterThan(0);
  });

  it("creates and archives a Notes & Journal commentary record", async () => {
    const user = userEvent.setup();
    renderWorkspace(<NotesPreview />);

    expect(screen.getByRole("heading", { name: "Notes & Journal" })).toBeInTheDocument();
    expect(screen.getByText(/not evidence, not audit records/i)).toBeInTheDocument();
    expect(screen.getByText(/Bundled fixture reviewer/i)).toBeInTheDocument();
    const newNote = screen.getByRole("heading", { name: "New note" }).closest("aside");
    if (!newNote) throw new Error("new-note panel missing");
    await user.type(within(newNote).getByLabelText("Commentary"), "A local practitioner comment.");
    await user.click(within(newNote).getByRole("button", { name: /Record note/i }));

    expect(screen.getByText(/saved as practitioner commentary/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Archive note" }));
    expect(screen.getByText(/archived/i)).toBeInTheDocument();
  });

  it("keeps Notes edit buffers scoped to the selected note", async () => {
    const user = userEvent.setup();
    renderWorkspace(<NotesPreview />);

    await user.type(screen.getByLabelText("Edit commentary"), "NOTE_ONE_UNSAVED_DRAFT");
    const noteList = screen.getByRole("navigation", { name: "Practitioner notes" });
    await user.click(within(noteList).getByRole("button", { name: /NOTE-2/i }));

    expect(screen.getByLabelText("Edit commentary")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Save note edit" }));
    expect(screen.getByRole("article", { name: "Note detail: NOTE-2" })).toHaveTextContent(
      "Preserve both conflicting fictional arrival dates rather than selecting one without source resolution.",
    );
    expect(screen.getByRole("article", { name: "Note detail: NOTE-2" })).not.toHaveTextContent(
      "NOTE_ONE_UNSAVED_DRAFT",
    );
  });
});
