import { expect, test } from "@playwright/test";

const PROVIDER_ORIGIN_PATTERN = /openai\.com|googleapis\.com|mistral\.ai/i;

function parseContentSecurityPolicy(csp: string): Map<string, string[]> {
  return new Map(
    csp
      .split(";")
      .map((directive) => directive.trim().split(/\s+/))
      .filter(([name]) => Boolean(name))
      .map(([name, ...tokens]) => [name, tokens]),
  );
}

test("allows local WebAssembly compilation under the real export response CSP", async ({ page, request }) => {
  const response = await request.get("/case/demo/export");
  expect(response.ok()).toBe(true);

  const csp = response.headers()["content-security-policy"] ?? "";
  const directives = parseContentSecurityPolicy(csp);
  const scriptTokens = directives.get("script-src") ?? [];
  const allTokens = [...directives.values()].flat();

  expect(scriptTokens).toContain("'wasm-unsafe-eval'");
  expect(scriptTokens).not.toContain("'unsafe-eval'");
  expect(allTokens).not.toContain("'unsafe-eval'");
  expect(allTokens.join(" ")).not.toMatch(PROVIDER_ORIGIN_PATTERN);
  expect(allTokens).not.toContain("*");
  expect(directives.get("default-src")).toEqual(["'self'"]);
  expect(directives.get("object-src")).toEqual(["'none'"]);
  expect(directives.get("frame-ancestors")).toEqual(["'none'"]);
  expect(directives.get("connect-src")).toEqual(["'self'"]);
  expect(directives.get("worker-src")).toEqual(["'self'", "blob:"]);
  expect(directives.get("frame-src")).toEqual(["'self'", "blob:"]);

  await page.goto("/case/demo/export");
  await expect(page.getByRole("main").first()).toBeVisible();

  const compilationSucceeded = await page.evaluate(async () => {
    await WebAssembly.compile(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
    return true;
  });

  expect(compilationSucceeded).toBe(true);
});
