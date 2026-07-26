import {
  EvaluationProviderAttemptSchema,
  type EvaluationOperationalInterruption,
  type EvaluationProviderAttempt,
} from "../contracts";

const OPERATIONAL_INTERRUPTION_SET =
  new Set<EvaluationOperationalInterruption>([
    "provider_quota_exhausted",
    "provider_rate_limited",
    "provider_timeout",
    "provider_unavailable",
  ]);

export function isOperationalEvaluationInterruption(
  classification: string | null,
): classification is EvaluationOperationalInterruption {
  return (
    classification !== null &&
    OPERATIONAL_INTERRUPTION_SET.has(
      classification as EvaluationOperationalInterruption,
    )
  );
}

export function isResumableEvaluationEvidence(evidence: {
  status?: string;
} | null | undefined): boolean {
  return (
    evidence?.status === "not_run" ||
    evidence?.status === "interrupted"
  );
}

export function appendEvaluationProviderAttempt(
  previousAttempts: readonly EvaluationProviderAttempt[] | undefined,
  attempt: Omit<EvaluationProviderAttempt, "attemptOrdinal">,
): EvaluationProviderAttempt[] {
  const existing = previousAttempts ?? [];
  return [
    ...existing,
    EvaluationProviderAttemptSchema.parse({
      ...attempt,
      attemptOrdinal: existing.length + 1,
    }),
  ];
}
