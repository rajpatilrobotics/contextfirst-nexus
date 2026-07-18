import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/case/demo/purpose",
  "/case/demo/intake",
  "/case/demo/review",
  "/case/demo/export",
  "/trust",
] as const;

const PROHIBITED_CONSOLE = /Maya K\.|maya\.k@example\.test|\+1 202-555-0147|X0000007|000123456789|18 Example Lane|1997-08-14|SYSTEM OVERRIDE|provider body|api[_-]?key|cookie/i;

test.describe("TASK-024 browser security and integration smoke flows", () => {
  for (const route of ROUTES) {
    test(`applies restrictive headers and safe synthetic boundary on ${route}`, async ({ page, request }) => {
      const response = await request.get(route);
      expect(response.ok()).toBe(true);
      const headers = response.headers();
      expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
      expect(headers["content-security-policy"]).toContain("connect-src 'self'");
      expect(headers["content-security-policy"]).not.toMatch(/openai\.com|googleapis\.com|mistral\.ai/i);
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["permissions-policy"]).toContain("camera=()");
      expect(headers["permissions-policy"]).toContain("microphone=()");
      expect(headers["permissions-policy"]).toContain("geolocation=()");

      const consoleMessages: string[] = [];
      page.on("console", (message) => consoleMessages.push(message.text()));
      await page.goto(route);
      await expect(page.getByRole("main").first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/detected trafficking|confirmed victim|legal eligibility score/i);
      expect(consoleMessages.join("\n")).not.toMatch(PROHIBITED_CONSOLE);
    });
  }

  test("supports keyboard navigation, focus, reduced motion preference, and reset visibility", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/case/demo/purpose");

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /skip to case workspace/i })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#case-workspace")).toBeInViewport();

    await expect(page.getByRole("navigation", { name: /case steps/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /purpose/i })).toHaveAttribute("aria-current", "step");
    await expect(page.getByRole("button", { name: /reset case/i })).toBeVisible();
    await expect(page.getByText(/Hackathon demo case\. Do not upload or enter real case data\./i)).toBeVisible();
  });

  test("purpose validation focuses a safe error summary and starts no analysis automatically", async ({ page }) => {
    await page.goto("/case/demo/purpose");
    await page.getByRole("button", { name: /save case purpose brief/i }).click();

    const errorSummary = page.getByRole("alert", { name: /Review the Purpose Brief/i });
    await expect(errorSummary).toContainText(/Review the Purpose Brief/i);
    await expect(errorSummary).toBeFocused();
    await expect(page.getByText(/Saving this brief does not start analysis/i)).toBeVisible();
    await expect(page.getByText(/No analysis run selected/i)).toBeVisible();
  });

  test("review and export empty states are explicit safe states", async ({ page }) => {
    await page.goto("/case/demo/review");
    await expect(page.getByRole("heading", { name: /Review has not started|No accepted analysis output/i })).toBeVisible();
    await expect(page.getByText(/A blank workspace does not imply success/i)).toBeVisible();

    await page.goto("/case/demo/export");
    await expect(page.getByRole("heading", { name: /Export reviewed handoff/i })).toBeVisible();
    await page.getByRole("button", { name: /Review export gate/i }).click();
    await expect(page.getByRole("heading", { name: /Export is blocked|Export gate/i })).toBeVisible();
    await expect(page.getByText(/Purpose brief is not complete/i)).toBeVisible();
    await expect(page.getByText(/does not email, upload, file, refer, share, or otherwise transmit/i)).toBeVisible();
  });

  test("not-found state is actionable and does not leak diagnostics", async ({ page }) => {
    await page.goto("/not-a-real-cfn-route");
    await expect(page.getByRole("heading", { name: /not part of the synthetic demo/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open synthetic case/i })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/stack|provider body|api key|Maya K\./i);
  });
});
