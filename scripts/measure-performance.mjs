#!/usr/bin/env node

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import Module, { createRequire } from "node:module";
import { performance } from "node:perf_hooks";
import process from "node:process";

const DEFAULT_MODE = "prepared-checkpoint";
const DEFAULT_MEASURED_COUNT = 20;
const WARM_UP_COUNT = 1;
const VERSION = "1.0.0";
const FIXTURE_ID = "CFN-DEMO-001";
const FIXTURE_VERSION = "1.0.0";
const CHECKPOINT_ID = "DEMO-CHECKPOINT-REVIEW";
const CHECKPOINT_LABEL = "Prepared synthetic review checkpoint";
const REPLAY_RELEASE = "prepared-replay-v1";
const REPLAY_LABEL = "Bundled deterministic replay, not live AI";

export const PERFORMANCE_THRESHOLDS = [
  {
    id: "local_review_feedback",
    label: "Loaded local review action feedback",
    thresholdMs: 100,
  },
  {
    id: "source_drawer_exact_focus",
    label: "Source drawer open and exact segment focus",
    thresholdMs: 300,
  },
  {
    id: "dependency_recalculation_blocker_update",
    label: "Dependency recalculation and blocker update",
    thresholdMs: 300,
  },
  {
    id: "seven_document_extraction",
    label: "Seven-document fixture extraction after assets load",
    thresholdMs: 5000,
  },
  {
    id: "prepared_checkpoint_load",
    label: "Prepared review checkpoint load",
    thresholdMs: 1500,
  },
  {
    id: "export_preview",
    label: "Export preview after approved state",
    thresholdMs: 2000,
  },
  {
    id: "deterministic_replay_completion",
    label: "Deterministic replay completion",
    thresholdMs: 8000,
  },
];

const THRESHOLD_BY_ID = new Map(PERFORMANCE_THRESHOLDS.map((item) => [item.id, item]));

function usage() {
  return [
    "Usage: npm run measure:performance -- --mode prepared-checkpoint",
    "",
    "Options:",
    "  --mode prepared-checkpoint  Measure the trusted local prepared-checkpoint path.",
    "  --samples <count>           Measured samples after the one warm-up. Default: 20. Minimum: 20.",
    "  --json                      Print only machine-readable JSON.",
  ].join("\n");
}

export function parseArgs(argv) {
  const options = {
    mode: DEFAULT_MODE,
    measuredCount: DEFAULT_MEASURED_COUNT,
    jsonOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mode") {
      options.mode = argv[index + 1] ?? "";
      index += 1;
    } else if (arg === "--samples") {
      options.measuredCount = Number(argv[index + 1] ?? "0");
      index += 1;
    } else if (arg === "--json") {
      options.jsonOnly = true;
    } else if (arg === "--help" || arg === "-h") {
      return { ...options, help: true };
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (options.mode !== DEFAULT_MODE) {
    throw new Error(`Unsupported mode: ${options.mode}. Only ${DEFAULT_MODE} is allowed.`);
  }
  if (!Number.isInteger(options.measuredCount) || options.measuredCount < DEFAULT_MEASURED_COUNT) {
    throw new Error(`Measured sample count must be at least ${DEFAULT_MEASURED_COUNT}.`);
  }

  return options;
}

export function median(values) {
  if (!values.length) throw new Error("Cannot summarize an empty sample set.");
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function nearestRankPercentile(values, percentile) {
  if (!values.length) throw new Error("Cannot summarize an empty sample set.");
  if (percentile <= 0 || percentile > 100) throw new Error("Percentile must be > 0 and <= 100.");
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

export function summarizeOperation(operationId, samples) {
  const threshold = THRESHOLD_BY_ID.get(operationId);
  if (!threshold) throw new Error(`Unknown performance operation: ${operationId}`);
  if (samples.length < DEFAULT_MEASURED_COUNT) {
    throw new Error(`Operation ${operationId} has ${samples.length} measured samples; at least ${DEFAULT_MEASURED_COUNT} are required.`);
  }
  const medianMs = median(samples);
  const p95Ms = nearestRankPercentile(samples, 95);
  const pass = p95Ms < threshold.thresholdMs;
  return {
    id: operationId,
    label: threshold.label,
    thresholdMs: threshold.thresholdMs,
    sampleCount: samples.length,
    medianMs,
    p95Ms,
    minMs: Math.min(...samples),
    maxMs: Math.max(...samples),
    status: pass ? "pass" : "miss",
  };
}

export function assertPreparedCheckpointProvenance(provenance) {
  const failures = [];
  if (provenance.fixtureId !== FIXTURE_ID) failures.push("fixture_id_mismatch");
  if (provenance.fixtureVersion !== FIXTURE_VERSION) failures.push("fixture_version_mismatch");
  if (provenance.checkpointId !== CHECKPOINT_ID) failures.push("checkpoint_id_mismatch");
  if (provenance.checkpointLabel !== CHECKPOINT_LABEL) failures.push("checkpoint_label_mismatch");
  if (provenance.checkpointVersion !== VERSION) failures.push("checkpoint_version_mismatch");
  if (provenance.replayReleaseConfigurationId !== REPLAY_RELEASE) failures.push("replay_release_mismatch");
  if (provenance.replayVersion !== VERSION) failures.push("replay_version_mismatch");
  if (provenance.replayLabel !== REPLAY_LABEL) failures.push("replay_label_mismatch");
  if (provenance.providerTransmission !== false) failures.push("provider_transmission_not_false");
  if (provenance.seededDecisionActor !== "fixture_reviewer") failures.push("seeded_decision_actor_mismatch");
  if (failures.length) throw new Error(`Prepared-checkpoint provenance failed: ${failures.join(", ")}`);
  return true;
}

export function createMachineReadableReport({
  mode,
  environment,
  warmUpCount,
  measuredCount,
  provenance,
  operations,
}) {
  assertPreparedCheckpointProvenance(provenance);
  const status = operations.every((operation) => operation.status === "pass") ? "pass" : "miss";
  return {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    mode,
    status,
    environment,
    fixture: {
      caseId: provenance.fixtureId,
      fixtureVersion: provenance.fixtureVersion,
      canonicalFixtureDigest: provenance.canonicalFixtureDigest,
    },
    checkpoint: {
      id: provenance.checkpointId,
      version: provenance.checkpointVersion,
      label: provenance.checkpointLabel,
      seededDecisionActor: provenance.seededDecisionActor,
    },
    replay: {
      releaseConfigurationId: provenance.replayReleaseConfigurationId,
      version: provenance.replayVersion,
      label: provenance.replayLabel,
      providerTransmission: provenance.providerTransmission,
    },
    samplePlan: {
      warmUpCount,
      measuredCount,
      warmUpExcluded: true,
    },
    thresholds: PERFORMANCE_THRESHOLDS.map((threshold) => ({
      id: threshold.id,
      label: threshold.label,
      thresholdMs: threshold.thresholdMs,
    })),
    operations,
  };
}

function compileRuntime(repoRoot) {
  const typescriptBin = path.join(repoRoot, "node_modules", "typescript", "lib", "tsc.js");
  if (!existsSync(typescriptBin)) {
    throw new Error("TypeScript is not installed. Run npm ci from the existing package-lock.json first.");
  }

  return mkdtemp(path.join(tmpdir(), "cfn-performance-")).then(async (tempDir) => {
    const outDir = path.join(tempDir, "out");
    const configPath = path.join(tempDir, "tsconfig.measure.json");
    const config = {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "CommonJS",
        moduleResolution: "Node",
        rootDir: repoRoot,
        outDir,
        skipLibCheck: true,
        strict: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        jsx: "react-jsx",
        types: ["node"],
        typeRoots: [path.join(repoRoot, "node_modules", "@types")],
        noEmitOnError: true,
      },
      files: [
        path.join(repoRoot, "lib", "state", "index.ts"),
        path.join(repoRoot, "lib", "analysis", "replay.ts"),
        path.join(repoRoot, "lib", "documents", "pdf-source-service.ts"),
        path.join(repoRoot, "lib", "export", "renderers", "json.ts"),
      ],
      exclude: [path.join(repoRoot, "node_modules"), path.join(repoRoot, ".next")],
    };
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
    const compiled = spawnSync(process.execPath, [typescriptBin, "-p", configPath, "--pretty", "false"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: process.env,
    });
    if (compiled.status !== 0) {
      throw new Error(`Could not compile measurement runtime:\n${compiled.stdout}${compiled.stderr}`);
    }
    return { tempDir, outDir };
  });
}

function commandMeta(state, label, sequence) {
  return {
    commandId: `CMD-PERF-${label}-${sequence}`,
    idempotencyKey: `IDEM-PERF-${label}-${sequence}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt: `2026-07-16T00:00:${String(sequence % 60).padStart(2, "0")}.000Z`,
  };
}

function replayRequest() {
  return {
    mode: "deterministic_replay",
    replayBundleId: "REPLAY-CFN-DEMO-001-V1",
    caseId: FIXTURE_ID,
    releaseConfigurationId: REPLAY_RELEASE,
    providerDisclosureAcknowledgementId: "ACK-REPLAY-PERF",
    recoveryOfRunId: null,
    fixtureVersion: FIXTURE_VERSION,
    promptVersion: VERSION,
    analysisResponseVersion: VERSION,
    replayVersion: VERSION,
  };
}

function applyOk(applyCaseCommand, state, command) {
  const result = applyCaseCommand(state, command);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

function makeStateBuilders(runtime) {
  const { applyCaseCommand, createInitialCaseState } = runtime.state;
  const { LIMITATION_TEXT } = runtime.review;

  let sequence = 0;
  const next = (state, label) => commandMeta(state, label, ++sequence);

  function loadCheckpointState() {
    let state = createInitialCaseState("2026-07-16T00:00:00.000Z");
    state = applyOk(applyCaseCommand, state, {
      type: "load_demo_checkpoint",
      meta: next(state, "LOAD-CHECKPOINT"),
      checkpointBundleId: CHECKPOINT_ID,
    });
    return state;
  }

  function review(state, intent) {
    return applyOk(applyCaseCommand, state, {
      type: "review_candidate",
      meta: next(state, `REVIEW-${intent.candidateId}`),
      intent,
    });
  }

  function createEarlyReviewedState() {
    let state = loadCheckpointState();
    state = review(state, {
      candidateId: "CAND-CTRL-PASSPORT",
      action: "edit",
      editedText: "Maya reported passport removal; recruiter messages separately refer to passport custody.",
      reason: "Preserve reported and documented sources separately.",
    });
    state = review(state, {
      candidateId: "CAND-CTRL-CONFINEMENT",
      action: "reject",
      reason: "The packet does not independently confirm physical confinement.",
    });
    state = review(state, {
      candidateId: "CAND-PROV-TASKLOG",
      action: "reject",
      reason: "Unresolved provenance cannot support an export finding.",
    });
    return state;
  }

  function createReviewedState() {
    let state = createEarlyReviewedState();
    state = review(state, {
      candidateId: "CAND-SENDER-0402",
      action: "reject",
      reason: "Assignment and allegation records do not establish sender identity.",
    });
    state = review(state, {
      candidateId: "CAND-URG-INTERPRETER",
      action: "confirm_unknown",
      reason: null,
    });
    state = applyOk(applyCaseCommand, state, {
      type: "respond_context_gap",
      meta: next(state, "PRESERVE-INTERPRETER-GAP"),
      intent: {
        gapId: "CAND-URG-INTERPRETER",
        responseStatus: "preserved_unknown",
        response: null,
        responseExplanation: null,
      },
    });
    return state;
  }

  function createPostWithdrawalReadyState() {
    let state = createReviewedState();
    state = applyOk(applyCaseCommand, state, {
      type: "withdraw_candidate",
      meta: next(state, "WITHDRAW-CAND-TASK-0402"),
      candidateId: "CAND-TASK-0402",
      reason: "The assignment evidence was withdrawn from consideration.",
    });
    state = review(state, {
      candidateId: "NEXUS-COMPELLED-TASKS",
      action: "accept",
      reason: null,
    });
    state = review(state, {
      candidateId: "NEXUS-OFFENCE-TIMING",
      action: "accept_as_limitation",
      limitationText: LIMITATION_TEXT,
      reason: "The assigned-task dependency was withdrawn.",
    });
    state = applyOk(applyCaseCommand, state, {
      type: "evaluate_export_gate",
      meta: next(state, "EXPORT-GATE"),
      selection: { kind: "full_practitioner_handoff", minimumNecessarySelection: null },
    });
    if (state.exportGate?.status !== "ready") {
      throw new Error(`Expected ready export gate, received ${state.exportGate?.status ?? "missing"}`);
    }
    return state;
  }

  return {
    next,
    loadCheckpointState,
    createEarlyReviewedState,
    createReviewedState,
    createPostWithdrawalReadyState,
  };
}

async function loadRuntime(repoRoot) {
  const { tempDir, outDir } = await compileRuntime(repoRoot);
  const requireFromOut = createRequire(path.join(outDir, "measure-runtime.cjs"));
  const previousNodePath = process.env.NODE_PATH;
  process.env.NODE_PATH = previousNodePath
    ? `${path.join(repoRoot, "node_modules")}${path.delimiter}${previousNodePath}`
    : path.join(repoRoot, "node_modules");
  Module._initPaths();

  return {
    tempDir,
    modules: {
      state: requireFromOut(path.join(outDir, "lib", "state", "index.js")),
      review: requireFromOut(path.join(outDir, "lib", "review", "index.js")),
      documents: requireFromOut(path.join(outDir, "lib", "documents", "pdf-source-service.js")),
      json: requireFromOut(path.join(outDir, "lib", "export", "renderers", "json.js")),
      fixture: requireFromOut(path.join(outDir, "lib", "fixtures", "index.js")),
    },
  };
}

async function makePdfRuntime(repoRoot) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return {
    getDocument({ url }) {
      const filePath = path.join(repoRoot, "public", url.replace(/^\//, ""));
      return pdfjs.getDocument({
        url: pathToFileURL(filePath).href,
        disableWorker: true,
      });
    },
  };
}

function timeSync(action) {
  const start = performance.now();
  const result = action();
  return { durationMs: performance.now() - start, result };
}

async function timeAsync(action) {
  const start = performance.now();
  const result = await action();
  return { durationMs: performance.now() - start, result };
}

async function withSuppressedPdfFontWarnings(action) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.map((arg) => String(arg)).join(" ");
    if (message.includes("Ensure that the `standardFontDataUrl` API parameter is provided")) return;
    originalWarn(...args);
  };
  try {
    return await action();
  } finally {
    console.warn = originalWarn;
  }
}

async function measureOperations(runtime, repoRoot, measuredCount) {
  const { applyCaseCommand, createInitialCaseState } = runtime.state;
  const builders = makeStateBuilders(runtime);
  const pdfRuntime = await makePdfRuntime(repoRoot);

  const operations = {
    prepared_checkpoint_load: () => timeSync(() => builders.loadCheckpointState()),
    deterministic_replay_completion: () => timeSync(() => {
      const state = createInitialCaseState("2026-07-16T00:00:00.000Z");
      return applyOk(applyCaseCommand, state, {
        type: "run_deterministic_replay",
        meta: builders.next(state, "REPLAY"),
        request: replayRequest(),
      });
    }),
    local_review_feedback: () => timeSync(() => {
      const state = builders.loadCheckpointState();
      return applyOk(applyCaseCommand, state, {
        type: "review_candidate",
        meta: builders.next(state, "REJECT-CONFINEMENT"),
        intent: {
          candidateId: "CAND-CTRL-CONFINEMENT",
          action: "reject",
          reason: "The packet does not independently confirm physical confinement.",
        },
      });
    }),
    source_drawer_exact_focus: () => timeSync(() => {
      const state = builders.loadCheckpointState();
      const candidate = state.candidates.find((item) => item.id === "CAND-TASK-0402");
      const dependency = candidate?.dependencies.find((item) => item.kind === "source" && item.active);
      const citation = state.citations.find((item) => item.id === dependency?.citationId);
      const segment = state.segments.find((item) => item.id === citation?.segmentId);
      if (!candidate || !dependency || !citation || !segment || !citation.redactedSegmentRange) {
        throw new Error("source_lookup_incomplete");
      }
      const exact = segment.redactedText.slice(citation.redactedSegmentRange.start, citation.redactedSegmentRange.end);
      if (exact !== citation.quotedText) throw new Error("source_quote_mismatch");
      return { candidateId: candidate.id, citationId: citation.id, segmentId: segment.id };
    }),
    dependency_recalculation_blocker_update: () => timeSync(() => {
      let state = builders.createReviewedState();
      state = applyOk(applyCaseCommand, state, {
        type: "withdraw_candidate",
        meta: builders.next(state, "WITHDRAW-FOR-BLOCKER"),
        candidateId: "CAND-TASK-0402",
        reason: "The assignment evidence was withdrawn from consideration.",
      });
      state = applyOk(applyCaseCommand, state, {
        type: "evaluate_export_gate",
        meta: builders.next(state, "BLOCKER-UPDATE"),
        selection: { kind: "full_practitioner_handoff", minimumNecessarySelection: null },
      });
      if (state.exportGate?.status !== "blocked") throw new Error("expected_blocked_export_gate");
      return state.exportGate.blockers.map((blocker) => blocker.code);
    }),
    seven_document_extraction: () => timeAsync(async () => {
      const result = await withSuppressedPdfFontWarnings(() =>
        runtime.documents.processCfnDemoPdfSources(async () => pdfRuntime),
      );
      if (result.documents.length !== 7) throw new Error("document_count_mismatch");
      if (result.coverage.expectedDocuments !== 7) throw new Error("coverage_document_count_mismatch");
      return result.coverage.issues.map((issue) => issue.id);
    }),
    export_preview: () => timeSync(() => {
      let state = builders.createPostWithdrawalReadyState();
      state = applyOk(applyCaseCommand, state, {
        type: "create_export",
        meta: builders.next(state, "CREATE-EXPORT"),
        selection: { kind: "full_practitioner_handoff", minimumNecessarySelection: null },
      });
      if (!state.currentExportManifest) throw new Error("export_manifest_missing");
      const json = runtime.json.renderExportJson(state.currentExportManifest);
      if (!json.includes("Insufficient evidence to support a link")) throw new Error("export_limitation_missing");
      return json.length;
    }),
  };

  const durations = Object.fromEntries(PERFORMANCE_THRESHOLDS.map((threshold) => [threshold.id, []]));
  for (const threshold of PERFORMANCE_THRESHOLDS) {
    await operations[threshold.id]();
  }
  for (let sample = 0; sample < measuredCount; sample += 1) {
    for (const threshold of PERFORMANCE_THRESHOLDS) {
      const measurement = await operations[threshold.id]();
      durations[threshold.id].push(measurement.durationMs);
    }
  }

  return durations;
}

function environmentMetadata(repoRoot) {
  return {
    kind: "local",
    machine: "MacBook Air M2 baseline requested by task packet",
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    repoRoot,
    ci: Boolean(process.env.CI),
    stableUrlAccessed: false,
    liveProviderCalls: false,
  };
}

function provenanceFromRuntime(runtime) {
  const { cfnDemoFixture } = runtime.fixture;
  return {
    fixtureId: FIXTURE_ID,
    fixtureVersion: FIXTURE_VERSION,
    canonicalFixtureDigest: cfnDemoFixture.canonicalFixtureDigest,
    checkpointId: CHECKPOINT_ID,
    checkpointVersion: VERSION,
    checkpointLabel: CHECKPOINT_LABEL,
    replayReleaseConfigurationId: REPLAY_RELEASE,
    replayVersion: VERSION,
    replayLabel: REPLAY_LABEL,
    providerTransmission: false,
    seededDecisionActor: "fixture_reviewer",
  };
}

function formatMs(value) {
  return `${value.toFixed(2)} ms`;
}

function printHumanReport(report) {
  console.log("ContextFirst Nexus prepared-checkpoint performance");
  console.log(`Mode: ${report.mode}`);
  console.log(`Status: ${report.status.toUpperCase()}`);
  console.log(`Environment: ${report.environment.machine}; ${report.environment.platform}/${report.environment.arch}; Node ${report.environment.nodeVersion}`);
  console.log(`Fixture: ${report.fixture.caseId} v${report.fixture.fixtureVersion}`);
  console.log(`Checkpoint: ${report.checkpoint.id} v${report.checkpoint.version} (${report.checkpoint.label})`);
  console.log(`Replay: ${report.replay.releaseConfigurationId} v${report.replay.version} (${report.replay.label})`);
  console.log(`Provider transmission: ${report.replay.providerTransmission ? "YES" : "NO"}`);
  console.log(`Warm-up: ${report.samplePlan.warmUpCount} excluded; measured samples: ${report.samplePlan.measuredCount}`);
  console.log("");
  console.log("| Operation | Median | p95 | Threshold | Result |");
  console.log("|---|---:|---:|---:|---|");
  for (const operation of report.operations) {
    console.log(`| ${operation.label} | ${formatMs(operation.medianMs)} | ${formatMs(operation.p95Ms)} | ${formatMs(operation.thresholdMs)} | ${operation.status.toUpperCase()} |`);
  }
  console.log("");
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(usage());
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    console.log(usage());
    return;
  }

  const repoRoot = process.cwd();
  let tempDir;
  try {
    const loaded = await loadRuntime(repoRoot);
    tempDir = loaded.tempDir;
    const durations = await measureOperations(loaded.modules, repoRoot, options.measuredCount);
    const operations = PERFORMANCE_THRESHOLDS.map((threshold) =>
      summarizeOperation(threshold.id, durations[threshold.id]),
    );
    const report = createMachineReadableReport({
      mode: options.mode,
      environment: environmentMetadata(repoRoot),
      warmUpCount: WARM_UP_COUNT,
      measuredCount: options.measuredCount,
      provenance: provenanceFromRuntime(loaded.modules),
      operations,
    });
    if (!options.jsonOnly) printHumanReport(report);
    console.log(JSON.stringify(report, null, 2));
    if (report.status !== "pass") process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
