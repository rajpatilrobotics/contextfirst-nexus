import { spawnSync } from "node:child_process";
import process from "node:process";

const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex >= 0 ? process.argv[modeIndex + 1] : "deterministic";
if (mode !== "deterministic") {
  console.error("Only deterministic evaluation is available without explicit live spend approval.");
  process.exit(2);
}

const suiteIndex = process.argv.indexOf("--suite");
const suite = suiteIndex >= 0 ? process.argv[suiteIndex + 1] : "provider-admission";
const suites = {
  "provider-admission": {
    test: "tests/unit/evaluation/runner.test.ts",
    environment: { CFN_EVALUATION_WRITE_ARTIFACTS: "1" },
  },
  "browser-pipeline": {
    test: "tests/unit/evaluation/browser-pipeline.test.ts",
    environment: { CFN_PIPELINE_EVALUATION_WRITE_ARTIFACTS: "1" },
  },
};
const selectedSuite = suites[suite];
if (!selectedSuite) {
  console.error(`Unknown deterministic evaluation suite: ${suite}`);
  process.exit(2);
}

const result = spawnSync(
  process.execPath,
  ["node_modules/vitest/vitest.mjs", "run", selectedSuite.test, "--mode", "deterministic"],
  {
    cwd: process.cwd(),
    env: { ...process.env, ...selectedSuite.environment },
    stdio: "inherit",
  },
);
process.exit(result.status ?? 1);
