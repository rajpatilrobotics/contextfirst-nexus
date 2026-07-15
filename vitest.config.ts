import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup/vitest.ts"],
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/contracts/**/*.test.{ts,tsx}",
      "tests/components/**/*.test.{ts,tsx}",
      "tests/evals/**/*.test.{ts,tsx}",
    ],
    exclude: ["node_modules/**", ".next/**"],
  },
});
