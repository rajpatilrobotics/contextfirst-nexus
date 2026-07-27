import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  canonicalDigest,
  formatOfflineBrowserPipelineReport,
  runOfflineBrowserPipelineEvaluation,
  writeOfflineBrowserPipelineArtifacts,
} from "../../../lib/evaluation";

const RESULT_DIRECTORY = resolve(
  process.cwd(),
  "fixtures/evals/results/pipeline",
);

describe("offline browser-pipeline quality evaluation", () => {
  it("is deterministic, credit-free, and passes every frozen scenario", () => {
    const transport = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("Offline pipeline evaluation must not use the network.");
    });
    const first = runOfflineBrowserPipelineEvaluation();
    const second = runOfflineBrowserPipelineEvaluation();

    expect(canonicalDigest(first)).toBe(canonicalDigest(second));
    expect(first).toMatchObject({
      suiteId: "offline-browser-pipeline-v1",
      status: "passed",
      execution: {
        engine: "browser_local_deterministic",
        adapterVersion: "browser-deterministic-analysis-v5",
        providerTransmission: false,
        networkCallCount: 0,
      },
      summary: {
        scenarioCount: 6,
        passedScenarioCount: 6,
        failedScenarioCount: 0,
        failedCheckCount: 0,
      },
    });
    expect(first.summary.passedCheckCount).toBe(first.summary.checkCount);
    expect(first.scenarios.every((scenario) => scenario.status === "passed")).toBe(
      true,
    );
    const { reportDigest, ...reportProjection } = first;
    expect(reportDigest).toBe(canonicalDigest(reportProjection));
    expect(transport).not.toHaveBeenCalled();
    transport.mockRestore();
  });

  it("covers source grounding, abstention, privacy blocking, downstream state, and stale-input rejection", () => {
    const report = runOfflineBrowserPipelineEvaluation();
    const checks = new Map(
      report.scenarios.flatMap((scenario) =>
        scenario.checks.map((check) => [
          `${scenario.id}:${check.id}`,
          check,
        ]),
      ),
    );

    expect(checks.get("representative-three-lane:exact-citations")?.passed).toBe(
      true,
    );
    expect(checks.get("representative-three-lane:lane-coverage")?.passed).toBe(
      true,
    );
    expect(checks.get("representative-three-lane:gap-action-command")?.passed).toBe(
      true,
    );
    expect(
      checks.get("representative-three-lane:planning-export-separation")?.passed,
    ).toBe(true);
    expect(checks.get("representative-three-lane:stale-source-block")?.passed).toBe(
      true,
    );
    expect(
      checks.get("unrelated-technical-abstention:candidate-count")?.passed,
    ).toBe(true);
    expect(checks.get("mixed-packet-source-isolation:source-isolation")?.passed).toBe(
      true,
    );
    expect(checks.get("advisory-text-isolation:excluded-output")?.passed).toBe(
      true,
    );
    expect(checks.get("privacy-review-incomplete:privacy-block")?.passed).toBe(
      true,
    );
    expect(checks.get("failed-leak-scan:privacy-block")?.passed).toBe(true);
  });

  it("writes safe readable JSON and Markdown reports", () => {
    const directory = mkdtempSync(join(tmpdir(), "cfn-pipeline-eval-"));
    const report = writeOfflineBrowserPipelineArtifacts(directory);
    const json = readFileSync(
      join(directory, "offline-browser-pipeline-v1.json"),
      "utf8",
    );
    const markdown = readFileSync(
      join(directory, "offline-browser-pipeline-v1.md"),
      "utf8",
    );

    expect(JSON.parse(json)).toEqual(report);
    expect(markdown).toBe(formatOfflineBrowserPipelineReport(report));
    expect(markdown).toContain("6/6 passed");
    expect(markdown).toContain("Network calls: 0");
    expect(`${json}\n${markdown}`).not.toMatch(
      /api[_-]?key|authorization:|cookie:|billing[_-]?id/i,
    );
  });

  it.runIf(process.env.CFN_PIPELINE_EVALUATION_WRITE_ARTIFACTS === "1")(
    "writes the tracked offline browser-pipeline result set",
    () => {
      const report = writeOfflineBrowserPipelineArtifacts(RESULT_DIRECTORY);
      expect(report.status).toBe("passed");
    },
  );
});
