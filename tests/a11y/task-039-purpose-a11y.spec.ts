import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.describe("TASK-039 Purpose accessibility", () => {
  test("has no automated A/AA violations and exposes one keyboard-operable disclosure", async ({ page }) => {
    await page.goto("/case/demo/purpose");
    await expect(page.getByRole("group", { name: "How analysis works" })).toBeVisible();

    const acknowledgement = page.getByRole("checkbox", { name: /frozen local synthetic output/i });
    await acknowledgement.focus();
    await page.keyboard.press("Space");
    await expect(acknowledgement).toBeChecked();
    await expect(page.getByRole("radio")).toHaveCount(0);

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("focuses the linked Purpose error summary without a provider-choice error", async ({ page }) => {
    await page.goto("/case/demo/purpose");
    await expect(page.getByRole("button", { name: "Save Case Purpose Brief" })).toBeEnabled();
    await page.getByRole("button", { name: "Save Case Purpose Brief" }).click();

    const alert = page.getByRole("alert", { name: "Review the Purpose Brief" });
    await expect(alert).toBeFocused();
    await expect(alert.getByRole("link", { name: "Choose the practitioner role." })).toBeVisible();
    await expect(alert).not.toContainText(/choose one available live release|selected release/i);

    await alert.getByRole("link", { name: "Choose the practitioner role." }).click();
    await expect(page.getByLabel("Practitioner role")).toBeFocused();

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("announces the fail-closed service state and keeps retry keyboard accessible", async ({ page }) => {
    await page.route("**/api/analyze", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        status: 200,
        body: JSON.stringify({ unexpected: true }),
      });
    });
    await page.goto("/case/demo/purpose");

    const unavailable = page.getByRole("alert", { name: "Analysis service unavailable" });
    await expect(unavailable).toBeVisible();
    await expect(unavailable.getByRole("heading", { name: "Analysis service unavailable" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Save Case Purpose Brief" })).toBeDisabled();
    const retry = unavailable.getByRole("button", { name: "Check availability again" });
    await retry.focus();
    await expect(retry).toBeFocused();

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations).toEqual([]);
  });

  test("keeps Purpose, Reset Case, and navigation usable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/case/demo/purpose");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset Case" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Case steps" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Purpose/ })).toHaveAttribute("aria-current", "step");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
