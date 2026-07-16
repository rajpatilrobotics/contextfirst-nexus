import { describe, expect, it } from "vitest";

const metricsUrl = new URL("../../scripts/measure-performance.mjs", import.meta.url).href;
const metrics = await import(metricsUrl);

const validProvenance = {
  fixtureId: "CFN-DEMO-001",
  fixtureVersion: "1.0.0",
  canonicalFixtureDigest: "a".repeat(64),
  checkpointId: "DEMO-CHECKPOINT-REVIEW",
  checkpointVersion: "1.0.0",
  checkpointLabel: "Prepared synthetic review checkpoint",
  replayReleaseConfigurationId: "prepared-replay-v1",
  replayVersion: "1.0.0",
  replayLabel: "Bundled deterministic replay, not live AI",
  providerTransmission: false,
  seededDecisionActor: "fixture_reviewer",
};

describe("TASK-025 performance measurement reporting", () => {
  it("accepts only the prepared-checkpoint mode and at least 20 measured samples", () => {
    expect(metrics.parseArgs(["--mode", "prepared-checkpoint", "--samples", "20"])).toMatchObject({
      mode: "prepared-checkpoint",
      measuredCount: 20,
    });
    expect(() => metrics.parseArgs(["--mode", "live"])).toThrow(/Unsupported mode/);
    expect(() => metrics.parseArgs(["--mode", "prepared-checkpoint", "--samples", "19"])).toThrow(/at least 20/);
  });

  it("uses nearest-rank p95 so warm-up samples cannot be hidden in the sample set", () => {
    const measuredSamples = Array.from({ length: 20 }, (_, index) => index + 1);
    expect(metrics.nearestRankPercentile(measuredSamples, 95)).toBe(19);
    expect(metrics.summarizeOperation("prepared_checkpoint_load", measuredSamples)).toMatchObject({
      sampleCount: 20,
      medianMs: 10.5,
      p95Ms: 19,
      status: "pass",
    });
    expect(() => metrics.summarizeOperation("prepared_checkpoint_load", measuredSamples.slice(0, 19))).toThrow(/at least 20/);
  });

  it("reports threshold misses without averaging them away", () => {
    const slowSamples = Array.from({ length: 20 }, () => 1600);
    expect(metrics.summarizeOperation("prepared_checkpoint_load", slowSamples)).toMatchObject({
      thresholdMs: 1500,
      status: "miss",
    });
  });

  it("requires checkpoint and replay provenance with zero provider transmission", () => {
    expect(metrics.assertPreparedCheckpointProvenance(validProvenance)).toBe(true);
    expect(() =>
      metrics.assertPreparedCheckpointProvenance({
        ...validProvenance,
        providerTransmission: true,
      }),
    ).toThrow(/provider_transmission_not_false/);
    expect(() =>
      metrics.assertPreparedCheckpointProvenance({
        ...validProvenance,
        checkpointLabel: "Live checkpoint",
      }),
    ).toThrow(/checkpoint_label_mismatch/);
  });

  it("builds a machine-readable report with pass or miss status and metadata", () => {
    const operations = [
      metrics.summarizeOperation("prepared_checkpoint_load", Array.from({ length: 20 }, () => 25)),
      metrics.summarizeOperation("deterministic_replay_completion", Array.from({ length: 20 }, () => 30)),
    ];
    const report = metrics.createMachineReadableReport({
      mode: "prepared-checkpoint",
      environment: {
        kind: "local",
        nodeVersion: "v26.0.0",
        stableUrlAccessed: false,
        liveProviderCalls: false,
      },
      warmUpCount: 1,
      measuredCount: 20,
      provenance: validProvenance,
      operations,
    });
    expect(report.status).toBe("pass");
    expect(report.samplePlan).toMatchObject({ warmUpCount: 1, measuredCount: 20, warmUpExcluded: true });
    expect(report.replay).toMatchObject({
      releaseConfigurationId: "prepared-replay-v1",
      providerTransmission: false,
    });
  });
});
