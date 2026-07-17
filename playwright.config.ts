import { defineConfig, devices } from "@playwright/test";

const APPROVED_EXTERNAL_BASE_URL = "https://contextfirst-nexus.vercel.app";
const configuredBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const useExternalBaseURL = configuredBaseURL === APPROVED_EXTERNAL_BASE_URL;

if (configuredBaseURL && !useExternalBaseURL) {
  throw new Error(
    `PLAYWRIGHT_BASE_URL must be empty or exactly ${APPROVED_EXTERNAL_BASE_URL}.`,
  );
}

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const localBaseURL = `http://127.0.0.1:${PORT}`;
const baseURL = useExternalBaseURL ? configuredBaseURL : localBaseURL;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  ...(useExternalBaseURL
    ? {}
    : {
        webServer: {
          command: `npm run start -- --hostname 127.0.0.1 --port ${PORT}`,
          url: localBaseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
