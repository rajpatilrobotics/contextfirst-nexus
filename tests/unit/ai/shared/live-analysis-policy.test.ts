import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isLiveAnalysisEnabled } from "../../../../lib/ai/server/live-analysis-policy";

const ORIGINAL_SERVER_FLAG = process.env.ENABLE_LIVE_ANALYSIS;
const ORIGINAL_PUBLIC_FLAG = process.env.NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS;

function restoreEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

afterEach(() => {
  restoreEnvironmentVariable("ENABLE_LIVE_ANALYSIS", ORIGINAL_SERVER_FLAG);
  restoreEnvironmentVariable("NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS", ORIGINAL_PUBLIC_FLAG);
});

describe("TASK-038 shared live-analysis policy", () => {
  it("enables live analysis only for the exact server value", () => {
    process.env.ENABLE_LIVE_ANALYSIS = "true";

    expect(isLiveAnalysisEnabled()).toBe(true);
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["false", "false"],
    ["uppercase", "TRUE"],
    ["mixed case", "True"],
    ["leading whitespace", " true"],
    ["trailing whitespace", "true "],
    ["numeric-like", "1"],
    ["arbitrary", "enabled"],
  ])("disables live analysis for %s server values", (_label, value) => {
    restoreEnvironmentVariable("ENABLE_LIVE_ANALYSIS", value);

    expect(isLiveAnalysisEnabled()).toBe(false);
  });

  it.each([undefined, "", "false"])(
    "does not allow the public flag to override server value %s",
    (serverValue) => {
      restoreEnvironmentVariable("ENABLE_LIVE_ANALYSIS", serverValue);
      process.env.NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS = "true";

      expect(isLiveAnalysisEnabled()).toBe(false);
    },
  );
});
