import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const CORE_STATES = [
  { name: "landing and boundaries", path: "/" },
  { name: "purpose form", path: "/case/demo/purpose" },
  { name: "documents and masking", path: "/case/demo/intake" },
  { name: "review empty or checkpoint state", path: "/case/demo/review" },
  { name: "blocked export", path: "/case/demo/export" },
  { name: "system card and safety lab", path: "/trust" },
  { name: "not found", path: "/missing-task-024-route" },
] as const;

test.describe("TASK-024 automated accessibility scans", () => {
  for (const state of CORE_STATES) {
    test(`${state.name} has no automated A/AA axe violations`, async ({ page }) => {
      await page.goto(state.path);
      await expect(page.locator("main")).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test("purpose error state exposes alert, links, and focus target", async ({ page }) => {
    await page.goto("/case/demo/purpose");
    await page.getByRole("button", { name: /save case purpose brief/i }).click();

    const alert = page.getByRole("alert", { name: /Review the Purpose Brief/i });
    await expect(alert).toContainText(/Review the Purpose Brief/i);
    await expect(alert).toBeFocused();
    await expect(alert.getByRole("link", { name: /Choose the practitioner role/i })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("320px reflow keeps primary routes operable without essential horizontal scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    for (const route of ["/case/demo/purpose", "/case/demo/review", "/case/demo/export", "/trust"]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
    }
  });
});
