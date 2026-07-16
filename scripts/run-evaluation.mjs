import { spawnSync } from "node:child_process";
import process from "node:process";

const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex >= 0 ? process.argv[modeIndex + 1] : "deterministic";
if (mode !== "deterministic") {
  console.error("Only deterministic evaluation is available without explicit live spend approval.");
  process.exit(2);
}

const result = spawnSync(
  process.execPath,
  ["node_modules/vitest/vitest.mjs", "run", "tests/unit/evaluation/runner.test.ts", "--mode", "deterministic"],
  {
    cwd: process.cwd(),
    env: { ...process.env, CFN_EVALUATION_WRITE_ARTIFACTS: "1" },
    stdio: "inherit",
  },
);
process.exit(result.status ?? 1);

