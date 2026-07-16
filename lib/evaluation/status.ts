export type CheckLike = { passed: boolean };
export type EvidenceLike = { status: "passed" | "failed" | "not_run" };
export type GateLike = { status: "passed" | "failed" | "not_run" };

export function deriveEvidenceStatus(checks: readonly CheckLike[]): "passed" | "failed" {
  if (checks.length === 0) throw new Error("Executed evidence requires at least one check.");
  return checks.every((check) => check.passed) ? "passed" : "failed";
}

export function deriveGateStatus(evidence: readonly EvidenceLike[]): "passed" | "failed" | "not_run" {
  if (evidence.length === 0 || evidence.some((item) => item.status === "not_run")) return "not_run";
  return evidence.some((item) => item.status === "failed") ? "failed" : "passed";
}

export function deriveReportStatus(gates: readonly GateLike[]): "passed" | "failed" | "incomplete" {
  if (gates.length === 0 || gates.some((gate) => gate.status === "not_run")) return "incomplete";
  return gates.some((gate) => gate.status === "failed") ? "failed" : "passed";
}

