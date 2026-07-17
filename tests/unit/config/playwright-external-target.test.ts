import { devices } from "@playwright/test";
import { afterEach, describe, expect, it, vi } from "vitest";

const APPROVED_EXTERNAL_BASE_URL = "https://contextfirst-nexus.vercel.app";
const ENVIRONMENT_KEYS = ["PLAYWRIGHT_BASE_URL", "PLAYWRIGHT_PORT", "CI"] as const;

type EnvironmentKey = (typeof ENVIRONMENT_KEYS)[number];

const originalEnvironment = Object.fromEntries(
  ENVIRONMENT_KEYS.map((key) => [key, process.env[key]]),
) as Record<EnvironmentKey, string | undefined>;

async function loadConfig(environment: Partial<Record<EnvironmentKey, string>> = {}) {
  for (const key of ENVIRONMENT_KEYS) {
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(environment)) {
    process.env[key] = value;
  }

  vi.resetModules();
  return (await import("../../../playwright.config")).default;
}

type LoadedConfig = Awaited<ReturnType<typeof loadConfig>>;

function expectUnchangedConfig(config: LoadedConfig, ci = false) {
  expect(config.testDir).toBe("./tests");
  expect(config.fullyParallel).toBe(false);
  expect(config.forbidOnly).toBe(ci);
  expect(config.retries).toBe(ci ? 1 : 0);
  expect(config.reporter).toEqual(ci ? [["html"], ["list"]] : "list");
  expect(config.use?.trace).toBe("on-first-retry");
  expect(config.projects).toEqual([
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ]);
}

afterEach(() => {
  for (const key of ENVIRONMENT_KEYS) {
    const originalValue = originalEnvironment[key];
    if (originalValue === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalValue;
    }
  }
  vi.resetModules();
});

describe("Playwright external target configuration", () => {
  it("preserves the complete default local configuration when the target is absent", async () => {
    const config = await loadConfig();

    expect(config.use?.baseURL).toBe("http://127.0.0.1:3000");
    expect(config.webServer).toEqual({
      command: "npm run start -- --hostname 127.0.0.1 --port 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    });
    expectUnchangedConfig(config);
  });

  it("treats an empty target as the local fallback", async () => {
    const config = await loadConfig({ PLAYWRIGHT_BASE_URL: "" });

    expect(config.use?.baseURL).toBe("http://127.0.0.1:3000");
    expect(config.webServer).toEqual({
      command: "npm run start -- --hostname 127.0.0.1 --port 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    });
    expectUnchangedConfig(config);
  });

  it("preserves custom port parsing and CI behavior locally", async () => {
    const config = await loadConfig({ PLAYWRIGHT_PORT: "4321", CI: "1" });

    expect(config.use?.baseURL).toBe("http://127.0.0.1:4321");
    expect(config.webServer).toEqual({
      command: "npm run start -- --hostname 127.0.0.1 --port 4321",
      url: "http://127.0.0.1:4321",
      reuseExistingServer: false,
      timeout: 120_000,
    });
    expectUnchangedConfig(config, true);
  });

  it("uses only the exact approved external target and omits the local web server", async () => {
    const config = await loadConfig({
      PLAYWRIGHT_BASE_URL: APPROVED_EXTERNAL_BASE_URL,
    });

    expect(config.use?.baseURL).toBe(APPROVED_EXTERNAL_BASE_URL);
    expect(config).not.toHaveProperty("webServer");
    expectUnchangedConfig(config);
  });

  it.each([
    "http://contextfirst-nexus.vercel.app",
    "https://contextfirst-nexus.example.test",
    "https://contextfirst-nexus.vercel.app/",
    "https://contextfirst-nexus.vercel.app/case/demo",
    "https://contextfirst-nexus.vercel.app?mode=test",
    "https://contextfirst-nexus.vercel.app#review",
    " https://contextfirst-nexus.vercel.app",
    "https://contextfirst-nexus.vercel.app ",
    "http://127.0.0.1:3000",
  ])("rejects the unapproved non-empty target %j", async (target) => {
    await expect(loadConfig({ PLAYWRIGHT_BASE_URL: target })).rejects.toThrow(
      `PLAYWRIGHT_BASE_URL must be empty or exactly ${APPROVED_EXTERNAL_BASE_URL}.`,
    );
  });
});
