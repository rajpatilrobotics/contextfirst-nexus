import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  LIVE_RELEASES,
  canonicalDigest,
  deriveEvidenceStatus,
  deriveGateStatus,
  deriveReportStatus,
  loadEvaluationDefinitions,
  runApprovedPrivateLiveEvaluation,
  runDeterministicEvaluation,
  writeEvaluationArtifacts,
} from "../../../lib/evaluation";

const RESULT_DIRECTORY = resolve(process.cwd(), "fixtures/evals/results");

describe("TASK-016 deterministic evaluation", () => {
  it("loads the exact frozen register and rejects tampering", () => {
    const register = loadEvaluationDefinitions();
    expect(register.variants).toHaveLength(14);
    expect(register.variants.filter((item) => item.split === "development")).toHaveLength(7);
    expect(register.variants.filter((item) => item.split === "held_out")).toHaveLength(7);
    const tampered = structuredClone(register);
    tampered.variants[0].split = "held_out";
    expect(() => loadEvaluationDefinitions(tampered)).toThrow(/split mismatch/i);
  });

  it("is repeatable, zero-network, and keeps harness evidence non-admitting", () => {
    const transport = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("Provider transport must not be called in deterministic mode.");
    });
    const first = runDeterministicEvaluation();
    const second = runDeterministicEvaluation();
    expect(canonicalDigest(first)).toBe(canonicalDigest(second));
    expect(first.networkCallCount).toBe(0);
    expect(first.harnessResults).toHaveLength(14);
    expect(first.harnessResults.every((item) => item.executionSource === "mock_harness")).toBe(true);
    expect(first.harnessResults.filter((item) => item.status !== "passed")).toEqual([]);
    expect(transport).not.toHaveBeenCalled();
    transport.mockRestore();
  });

  it("preserves not-run live evidence and incomplete exact-release reports", () => {
    const run = runDeterministicEvaluation();
    expect(run.reports).toHaveLength(3);
    expect(run.reports.map((report) => report.releaseConfigurationId)).toEqual(
      LIVE_RELEASES.map((release) => release.releaseConfigurationId),
    );
    for (const report of run.reports) {
      expect(report.status).toBe("incomplete");
      expect(report.gates.every((gate: { status: string }) => gate.status === "not_run")).toBe(true);
      expect(report.evidence.filter((item: { status: string }) => item.status === "not_run")).toHaveLength(27);
      expect(report.evidence.filter((item: { executionSource: string }) => item.executionSource === "deterministic_control")).toHaveLength(5);
      expect("aggregateAccuracy" in report).toBe(false);
      const { reportDigest: _digest, ...projection } = report;
      expect(report.reportDigest).toBe(canonicalDigest(projection));
    }
  });

  it("keeps raw and validated artifacts distinct and linked", () => {
    const run = runDeterministicEvaluation();
    expect(run.rawArtifact.artifactId).not.toBe(run.validatedArtifact.artifactId);
    expect(run.rawArtifact.linkageId).toBe(run.validatedArtifact.linkageId);
    expect(run.validatedArtifact.rawArtifactId).toBe(run.rawArtifact.artifactId);
    expect(run.rawArtifact.analysisRunId).toBe(run.validatedArtifact.analysisRunId);
    expect(run.rawArtifact.provider).toEqual(run.validatedArtifact.provider);
    expect(run.replay.status).toBe("passed");
  });

  it("derives failed evidence, gates, and reports without masking the failed denominator", () => {
    expect(deriveEvidenceStatus([{ passed: true }, { passed: false }])).toBe("failed");
    expect(deriveGateStatus([{ status: "passed" }, { status: "failed" }])).toBe("failed");
    expect(deriveReportStatus([{ status: "passed" }, { status: "failed" }])).toBe("failed");
    expect(deriveGateStatus([{ status: "failed" }, { status: "not_run" }])).toBe("not_run");
    const visibleEvidence = [{ evidenceId: "EVIDENCE-FAILED", status: "failed" }];
    const passingProjection = { status: "passed", evidence: visibleEvidence };
    const failedProjection = { status: "failed", evidence: visibleEvidence };
    expect(canonicalDigest(passingProjection)).not.toBe(canonicalDigest(failedProjection));
    expect(failedProjection.evidence).toHaveLength(1);
  });

  it("cannot enter live evaluation from deterministic mode", async () => {
    await expect(runApprovedPrivateLiveEvaluation({ mode: "deterministic", approval: {}, request: {} }))
      .rejects.toThrow(/unreachable/i);
  });

  it("writes only safe versioned artifacts", () => {
    const directory = mkdtempSync(join(tmpdir(), "cfn-eval-"));
    writeEvaluationArtifacts(directory);
    const text = readFileSync(join(directory, "deterministic-harness-v1.json"), "utf8");
    expect(text).not.toMatch(/api[_-]?key|authorization:|cookie:|billing[_-]?id|https?:\/\/[^\s\"]+\/private/i);
  });

  it.runIf(process.env.CFN_EVALUATION_WRITE_ARTIFACTS === "1")(
    "writes the tracked deterministic result set",
    () => {
      const run = writeEvaluationArtifacts(RESULT_DIRECTORY);
      expect(run.variantIds).toHaveLength(14);
      expect(run.reports.every((report) => report.status === "incomplete")).toBe(true);
    },
  );
});
