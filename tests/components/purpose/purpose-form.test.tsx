import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CasePurposeBriefForm } from "../../../features/purpose";
import { RequiredExcludedDecisions, type CasePurposeBrief } from "../../../lib/contracts";
import { trustedPurposeBrief } from "../../../lib/analysis/replay";
import { selectableProviderOptions } from "../provider/fixtures";

async function completeForm(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText("Practitioner role"), "demo_evaluator");
  await user.selectOptions(screen.getByLabelText("Organization type"), "research_or_evaluation");
  await user.type(screen.getByLabelText("Authorized purpose"), "Prepare a qualified synthetic review handoff.");
  await user.type(screen.getByLabelText("Intended recipient or handoff"), "Demo legal aid reviewer");
  await user.selectOptions(screen.getByLabelText("Recipient category"), "legal_aid_team");
  await user.selectOptions(screen.getByLabelText("Fictional jurisdiction"), "J-01");
  await user.selectOptions(screen.getByLabelText("Translation status"), "original_language");
  await user.selectOptions(screen.getByLabelText("Requested handoff"), "full_practitioner_handoff");
  for (const decision of RequiredExcludedDecisions) {
    await user.click(screen.getByRole("checkbox", { name: new RegExp(decision === "credibility" ? "Credibility" : decision.replaceAll("_", ".*"), "i") }));
  }
  await user.click(screen.getByRole("checkbox", { name: /attest that I am using this synthetic fixture/i }));
  await user.click(screen.getByRole("checkbox", { name: /system cannot verify my authority/i }));
  await user.click(screen.getByRole("checkbox", { name: /material is the bundled synthetic fixture/i }));
  await user.click(screen.getByRole("checkbox", { name: /acknowledge the synthetic-only data boundary/i }));
  await user.click(screen.getByRole("checkbox", { name: /does not make the excluded consequential decisions/i }));
  await user.click(screen.getByRole("checkbox", { name: /cooperation with authorities is not a condition/i }));
  await user.click(screen.getByRole("radio", { name: /Bundled deterministic replay/i }));
  await user.click(screen.getByRole("checkbox", { name: /service tier, data flow, data-use terms/i }));
}

describe("TASK-018 CasePurposeBriefForm", () => {
  it("focuses a linked error summary and keeps analysis unselected on untouched submit", async () => {
    const user = userEvent.setup();
    render(<CasePurposeBriefForm onSave={vi.fn()} options={selectableProviderOptions()} />);
    await user.click(screen.getByRole("button", { name: "Save Case Purpose Brief" }));
    const summary = screen.getByRole("alert", { name: "Review the Purpose Brief" });
    expect(summary).toHaveFocus();
    expect(screen.getAllByText("Choose one available live release or bundled replay.")).toHaveLength(2);
    expect(screen.getAllByRole("radio").every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
    await user.click(screen.getByRole("link", { name: "Choose the practitioner role." }));
    expect(screen.getByLabelText("Practitioner role")).toHaveFocus();
  });

  it("saves the complete canonical brief with every exclusion and replay acknowledgement", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn((_brief: CasePurposeBrief) => null);
    render(<CasePurposeBriefForm onSave={onSave} options={selectableProviderOptions()} />);
    await completeForm(user);
    await user.click(screen.getByRole("button", { name: "Save Case Purpose Brief" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const brief = onSave.mock.calls[0][0];
    expect(brief.excludedDecisions).toEqual(RequiredExcludedDecisions);
    expect(brief.providerSelection).toMatchObject({
      providerId: "local_replay",
      releaseConfigurationId: "prepared-replay-v1",
      disclosureAcknowledgement: {
        dataFlowAcknowledged: true,
        retentionAndTrainingUseAcknowledged: true,
        serviceTierAcknowledged: true,
      },
    });
    expect(screen.getByRole("status")).toHaveTextContent(/Saving does not start analysis/i);
  });

  it("preserves identity and creation time while incrementing an edited purpose revision", async () => {
    const user = userEvent.setup();
    const initialBrief = trustedPurposeBrief();
    const onSave = vi.fn((_brief: CasePurposeBrief) => null);
    render(
      <CasePurposeBriefForm
        initialBrief={initialBrief}
        onSave={onSave}
        options={selectableProviderOptions()}
      />,
    );
    await user.clear(screen.getByLabelText("Authorized purpose"));
    await user.type(screen.getByLabelText("Authorized purpose"), "Prepare a revised synthetic review handoff.");
    await user.click(screen.getByRole("button", { name: "Save Case Purpose Brief" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const firstCall = onSave.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error("Expected onSave to be called before reading the saved brief.");
    }
    const saved = firstCall[0];
    expect(saved.id).toBe(initialBrief.id);
    expect(saved.createdAt).toBe(initialBrief.createdAt);
    expect(saved.revision).toBe(initialBrief.revision + 1);
  });

  it("clears disclosure acknowledgement when the selected release changes", async () => {
    const user = userEvent.setup();
    render(
      <CasePurposeBriefForm
        initialBrief={trustedPurposeBrief()}
        onSave={vi.fn()}
        options={selectableProviderOptions()}
      />,
    );
    expect(screen.getByRole("checkbox", { name: /service tier, data flow, data-use terms/i })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /OpenAI/i }));
    expect(screen.getByRole("checkbox", { name: /service tier, data flow, data-use terms/i })).not.toBeChecked();
  });
});
