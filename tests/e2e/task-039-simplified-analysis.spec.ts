import { expect, test, type Page } from "@playwright/test";

async function completePurpose(page: Page) {
  await page.getByLabel("Practitioner role").selectOption("demo_evaluator");
  await page.getByLabel("Organization type").selectOption("research_or_evaluation");
  await page.getByLabel("Authorized purpose").fill("Prepare a qualified synthetic review handoff.");
  await page.getByLabel("Intended recipient or handoff").fill("Demo legal aid reviewer");
  await page.getByLabel("Recipient category").selectOption("legal_aid_team");
  await page.getByLabel("Fictional jurisdiction").selectOption("J-01");
  await page.getByLabel("Translation status").selectOption("original_language");
  await page.getByLabel("Requested handoff").selectOption("full_practitioner_handoff");

  const excluded = page.getByRole("group", {
    name: "Decisions explicitly excluded from system support",
  });
  for (const checkbox of await excluded.getByRole("checkbox").all()) {
    await checkbox.check();
  }

  const acknowledgementNames = [
    /attest that I am using this synthetic fixture/i,
    /system cannot verify my authority/i,
    /material is the bundled synthetic fixture/i,
    /acknowledge the synthetic-only data boundary/i,
    /does not make the excluded consequential decisions/i,
    /cooperation with authorities is not a condition/i,
    /frozen local synthetic output/i,
  ];
  for (const name of acknowledgementNames) {
    await page.getByRole("checkbox", { name }).check();
  }

  await page.getByRole("button", { name: "Save Case Purpose Brief" }).click();
  await expect(page.getByRole("region", { name: "Saved purpose is complete" })).toContainText(
    "Analysis remains a separate action",
  );
}

async function prepareDocuments(page: Page) {
  await page.getByRole("link", { name: /Documents/ }).click();
  await page.getByRole("button", { name: "Process bundled PDFs locally" }).click();
  await expect(page.getByRole("region", { name: "Browser-local processing complete" })).toBeVisible();

  const suggestions = page.getByRole("list", { name: "Mask suggestions" });
  const count = await suggestions.getByRole("listitem").count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    await suggestions.getByRole("listitem").nth(index).getByRole("button", { name: "Approve mask" }).click();
  }
  await page.getByRole("button", {
    name: "Complete masking review and run leak scan",
  }).click();
  await expect(page.getByText(/Human review is recorded.*leak scan passed/i)).toBeVisible();
}

test.describe("TASK-039 simplified replay-only analysis", () => {
  test("auto-binds the sole local replay and starts it exactly once without a network request", async ({ page }) => {
    test.setTimeout(120_000);
    const requestedUrls: string[] = [];
    page.on("request", (request) => requestedUrls.push(request.url()));

    await page.goto("/case/demo/purpose");
    const localOrigin = new URL(page.url()).origin;
    const disclosure = page.getByRole("group", { name: "How analysis works" });
    await expect(disclosure).toBeVisible();
    await expect(disclosure.getByText(/Bundled deterministic replay, not live AI/i)).toBeVisible();
    await expect(page.getByText(/No case content is sent to an external service/i)).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.getByText(/OpenAI|Google Gemini|Mistral Small|gpt-5\.6-sol|prepared-replay-v1/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Start analysis" })).toHaveCount(0);

    await completePurpose(page);
    await prepareDocuments(page);

    const requestsBeforeStart = requestedUrls.length;
    const analysisRequestsBeforeStart = requestedUrls.filter((url) => new URL(url).pathname === "/api/analyze").length;
    const start = page.getByRole("button", { name: "Start analysis" });
    await expect(start).toBeVisible();
    await start.click();

    await expect(page.getByRole("region", { name: "Analysis completed" })).toContainText(
      "bundled deterministic replay completed",
    );
    await expect(page.getByText("Local replay complete")).toBeVisible();
    await expect(start).toBeEnabled();

    const requestsAfterStart = requestedUrls.slice(requestsBeforeStart);
    expect(requestsAfterStart).toEqual([]);
    expect(requestedUrls.filter((url) => new URL(url).pathname === "/api/analyze")).toHaveLength(
      analysisRequestsBeforeStart,
    );
    expect(requestedUrls.every((url) => new URL(url).origin === localOrigin)).toBe(true);
    expect(requestedUrls.some((url) => url.includes("contextfirst-nexus.vercel.app"))).toBe(false);
  });

  test("keeps the prepared synthetic checkpoint separate from Start analysis", async ({ page }) => {
    await page.goto("/case/demo/purpose");
    await expect(page.getByRole("button", { name: "Load prepared checkpoint" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Start analysis" })).toHaveCount(0);

    await page.getByRole("button", { name: "Load prepared checkpoint" }).click();
    await expect(page.getByText(/Checkpoint active with fixture-reviewer provenance/i)).toBeVisible();
    await expect(page.getByText("Prepared synthetic checkpoint active")).toBeVisible();
    await expect(page.getByText("Prepared synthetic review checkpoint", { exact: true })).toBeVisible();
    await expect(page.getByText(/No provider transmission occurred/i)).toBeVisible();
  });
});
