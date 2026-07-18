import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CasePurposeBriefForm } from "../../../features/purpose";
import {
  CasePurposeBriefSchema,
  RequiredExcludedDecisions,
  type CasePurposeBrief,
} from "../../../lib/contracts";
import { trustedPurposeBrief } from "../../../lib/analysis/replay";
import { replayOnlyProviderOptions } from "../provider/fixtures";

function replayOption() {
  const option = replayOnlyProviderOptions().find((candidate) => candidate.providerId === "local_replay");
  if (!option) throw new Error("Expected trusted replay option.");
  return option;
}

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
  await user.click(screen.getByRole("checkbox", { name: /attest that I am using this fictional demo packet/i }));
  await user.click(screen.getByRole("checkbox", { name: /system cannot verify my authority/i }));
  await user.click(screen.getByRole("checkbox", { name: /material is the bundled fictional demo packet/i }));
  await user.click(screen.getByRole("checkbox", { name: /acknowledge the demo-only data boundary/i }));
  await user.click(screen.getByRole("checkbox", { name: /does not make the excluded consequential decisions/i }));
  await user.click(screen.getByRole("checkbox", { name: /cooperation with authorities is not a condition/i }));
  await user.click(screen.getByRole("checkbox", { name: /frozen local demo output/i }));
}

describe("TASK-039 CasePurposeBriefForm", () => {
  it("focuses a linked error summary without exposing provider selection validation", async () => {
    const user = userEvent.setup();
    render(<CasePurposeBriefForm analysisOption={replayOption()} onSave={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Save Case Purpose Brief" }));
    const summary = screen.getByRole("alert", { name: "Review the Purpose Brief" });
    expect(summary).toHaveFocus();
    expect(summary).toHaveTextContent("Acknowledge how this prepared local analysis works.");
    expect(summary).not.toHaveTextContent(/choose one available live release|selected release/i);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Choose the practitioner role." }));
    expect(screen.getByLabelText("Practitioner role")).toHaveFocus();
  });

  it("saves the complete canonical brief with every exclusion and replay acknowledgement", async () => {
    const user = userEvent.setup();
    const savedBriefs: CasePurposeBrief[] = [];
    const onSave = vi.fn((brief: CasePurposeBrief) => {
      savedBriefs.push(brief);
      return null;
    });
    render(<CasePurposeBriefForm analysisOption={replayOption()} onSave={onSave} />);
    await completeForm(user);
    await user.click(screen.getByRole("button", { name: "Save Case Purpose Brief" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const brief = savedBriefs[0];
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
    const savedBriefs: CasePurposeBrief[] = [];
    const onSave = vi.fn((brief: CasePurposeBrief) => {
      savedBriefs.push(brief);
      return null;
    });
    render(
      <CasePurposeBriefForm
        initialBrief={initialBrief}
        analysisOption={replayOption()}
        onSave={onSave}
      />,
    );
    await user.clear(screen.getByLabelText("Authorized purpose"));
    await user.type(screen.getByLabelText("Authorized purpose"), "Prepare a revised synthetic review handoff.");
    await user.click(screen.getByRole("button", { name: "Save Case Purpose Brief" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = savedBriefs[0];
    if (!saved) {
      throw new Error("Expected onSave to be called before reading the saved brief.");
    }
    expect(saved.id).toBe(initialBrief.id);
    expect(saved.createdAt).toBe(initialBrief.createdAt);
    expect(saved.revision).toBe(initialBrief.revision + 1);
  });

  it("does not reuse a legacy live-provider acknowledgement for the local replay", () => {
    const replay = trustedPurposeBrief();
    const liveBrief = CasePurposeBriefSchema.parse({
      ...replay,
      providerSelection: {
        providerId: "openai",
        releaseConfigurationId: "openai-quality-v1",
        serviceTier: "paid",
        disclosureAcknowledgement: {
          ...replay.providerSelection.disclosureAcknowledgement,
          id: "ACK-LEGACY-LIVE",
          providerId: "openai",
          releaseConfigurationId: "openai-quality-v1",
          serviceTier: "paid",
        },
      },
    });
    render(
      <CasePurposeBriefForm
        analysisOption={replayOption()}
        initialBrief={liveBrief}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByRole("checkbox", { name: /frozen local demo output/i })).not.toBeChecked();
    expect(screen.queryByText(/OpenAI|gpt-5\.6-sol|openai-quality-v1/i)).not.toBeInTheDocument();
  });
});
