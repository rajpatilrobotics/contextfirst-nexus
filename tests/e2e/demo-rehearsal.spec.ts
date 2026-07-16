import { expect, test, type Locator } from "@playwright/test";

const LIMITATION_TEXT =
  "Insufficient evidence to support a link between the 2025-04-02 alleged communication and an assigned task.";

async function recordReasonedAction(
  scope: Locator,
  actionName: RegExp,
  reason: string,
  wording?: string,
) {
  await scope.getByRole("button", { name: actionName }).click();
  if (wording !== undefined) {
    await scope.getByLabel(/Revised wording|Limitation wording/i).fill(wording);
  }
  await scope.getByLabel(/Concise reason/i).fill(reason);
  await scope.getByRole("button", { name: /Record individual action/i }).click();
}

test.describe("TASK-025 prepared checkpoint rehearsal", () => {
  test("rehearses the constrained local prepared-checkpoint judged flow", async ({ page }) => {
    test.setTimeout(165_000);

    await page.goto("/case/demo/purpose");
    await page.getByRole("button", { name: "Load prepared checkpoint" }).click();
    await expect(page.getByText(/No provider transmission occurred/i)).toBeVisible();
    await expect(page.getByText(/Checkpoint active with fixture-reviewer provenance/i)).toBeVisible();

    await page.goto("/case/demo/review");
    await expect(page.getByRole("heading", { name: "Prepared synthetic review checkpoint" })).toBeVisible();
    await expect(page.getByText("Bundled deterministic replay, not live AI").first()).toBeVisible();
    await expect(page.getByText(/No provider transmission/i)).toBeVisible();
    await expect(page.locator("#candidate-CAND-TASK-0402")).toContainText("Human accepted");

    const heroCandidate = page.locator("#candidate-CAND-TASK-0402");
    await heroCandidate.getByRole("button", { name: /Open exact source/i }).first().click();
    await expect(page.getByRole("heading", { name: /Task and penalty log/i })).toBeVisible();
    await expect(page.getByText(/Exact approved masked quote/i)).toBeVisible();
    await page.getByRole("button", { name: /Close source/i }).click();

    await recordReasonedAction(
      page.locator("#candidate-CAND-CTRL-PASSPORT"),
      /Edit wording/i,
      "Preserve reported and documented source types separately.",
      "Maya reported passport removal; recruiter messages separately refer to passport custody.",
    );
    await expect(page.locator("#candidate-CAND-CTRL-PASSPORT")).toContainText("Human edited");

    await recordReasonedAction(
      page.locator("#candidate-CAND-CTRL-CONFINEMENT"),
      /Reject suggestion/i,
      "The packet does not independently confirm physical confinement.",
    );
    await expect(page.locator("#candidate-CAND-CTRL-CONFINEMENT")).toContainText("Rejected");

    await recordReasonedAction(
      page.locator("#candidate-CAND-PROV-TASKLOG"),
      /Reject suggestion/i,
      "Unresolved provenance cannot support an export finding.",
    );
    await expect(page.locator("#candidate-CAND-PROV-TASKLOG")).toContainText("Rejected");

    await page.goto("/case/demo/export");
    await page.getByRole("button", { name: /Review export gate/i }).click();
    await expect(page.getByText(/CAND-SENDER-0402/i)).toBeVisible();
    await expect(page.getByText(/CAND-URG-INTERPRETER/i)).toBeVisible();
    await expect(page.getByText(/There is no override/i)).toBeVisible();

    await page.goto("/case/demo/review");
    await recordReasonedAction(
      page.locator("#candidate-CAND-SENDER-0402"),
      /Reject suggestion/i,
      "Assignment and allegation records do not establish sender identity.",
    );
    await page.locator("#candidate-CAND-URG-INTERPRETER").getByRole("button", { name: /Confirm as unknown/i }).click();
    await expect(page.locator("#candidate-CAND-SENDER-0402")).toContainText("Rejected");
    await expect(page.locator("#candidate-CAND-URG-INTERPRETER")).toContainText("Human accepted");

    await page.locator("#candidate-CAND-TASK-0402").getByRole("button", { name: /Withdraw evidence/i }).click();
    await expect(page.getByRole("heading", { name: /Confirm evidence withdrawal/i })).toBeVisible();
    await page.getByLabel(/Reason for withdrawal/i).fill("The assignment evidence was withdrawn from consideration.");
    await page.getByRole("button", { name: /Withdraw evidence and recalculate/i }).click();
    await expect(page.getByRole("heading", { name: /Support changed after evidence withdrawal/i })).toBeVisible();
    const dependencySummary = page.locator("#dependency-change-summary");
    await expect(dependencySummary.getByText("NEXUS-COMPELLED-TASKS")).toBeVisible();
    await expect(dependencySummary.getByText("NEXUS-OFFENCE-TIMING")).toBeVisible();
    await expect(page.locator("#candidate-CAND-TASK-0402")).toContainText("Withdrawn");

    await page.locator("#candidate-NEXUS-COMPELLED-TASKS").getByRole("button", { name: /Accept suggestion/i }).click();
    await expect(page.locator("#candidate-NEXUS-COMPELLED-TASKS")).toContainText("Human accepted");

    await recordReasonedAction(
      page.locator("#candidate-NEXUS-OFFENCE-TIMING"),
      /Record as limitation/i,
      "The assigned-task dependency was withdrawn.",
      LIMITATION_TEXT,
    );
    await expect(page.locator("#candidate-NEXUS-OFFENCE-TIMING")).toContainText("Human edited");

    await page.goto("/case/demo/export");
    await page.getByRole("button", { name: /Review export gate/i }).click();
    await expect(page.getByText(/Ready to create the canonical handoff/i)).toBeVisible();
    await page.getByRole("button", { name: /Create canonical handoff/i }).click();
    await expect(page.getByRole("heading", { name: /^Canonical handoff EXPORT-/i })).toBeVisible();
    await expect(page.locator("#limitations").getByText(LIMITATION_TEXT)).toBeVisible();
    await page.getByRole("tab", { name: /Structured JSON/i }).click();
    await expect(page.getByText(/providerTransmission\\?":\s*false/i)).toBeVisible();
    await page.getByRole("button", { name: /Generate PDF locally/i }).click();
    await expect(page.getByRole("status").filter({ hasText: /PDF is ready for local download/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Download PDF locally/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /PDF generation failed/i })).toHaveCount(0);

    await page.goto("/trust");
    await expect(page.getByRole("heading", { name: /Synthetic evaluation evidence/i })).toBeVisible();
    await expect(page.getByText(/Bundled deterministic replay, not live AI/i).first()).toBeVisible();
    await expect(page.getByText(/No provider transmission/i).first()).toBeVisible();
  });
});
