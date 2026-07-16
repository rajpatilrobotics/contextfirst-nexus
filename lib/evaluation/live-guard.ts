import { LiveEvaluationSpendApprovalSchema, PrivateLiveEvaluationRequestSchema } from "../contracts";

export async function runApprovedPrivateLiveEvaluation(input: {
  mode: "live" | "deterministic";
  approval: unknown;
  request: unknown;
  now?: string;
}) {
  if (input.mode !== "live") throw new Error("Private live evaluation is unreachable from deterministic mode.");
  const approval = LiveEvaluationSpendApprovalSchema.parse(input.approval);
  const request = PrivateLiveEvaluationRequestSchema.parse(input.request);
  const now = Date.parse(input.now ?? new Date().toISOString());
  if (now > Date.parse(approval.expiresAt)) throw new Error("Live-evaluation approval has expired.");
  if (request.approval.id !== approval.id || request.callOrdinal > approval.approvedCallCount) {
    throw new Error("Live-evaluation call is outside the approved bounded batch.");
  }
  if (request.release.releaseConfigurationId !== approval.release.releaseConfigurationId) {
    throw new Error("Live-evaluation release does not match the approval.");
  }
  const { runPrivateLiveEvaluation } = await import("../ai/server/evaluation-entry");
  return runPrivateLiveEvaluation(request);
}

