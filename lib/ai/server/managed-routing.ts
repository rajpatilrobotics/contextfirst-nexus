import "server-only";

import type { FailureClassification } from "./normalize";

export const MANAGED_LIVE_PROVIDER_ORDER = [
  "mistral",
  "google_gemini",
  "groq",
  "openai",
] as const;

export type ManagedLiveProviderId =
  (typeof MANAGED_LIVE_PROVIDER_ORDER)[number];

export type ManagedProviderOrderResolution =
  | {
      ok: true;
      order: readonly ManagedLiveProviderId[];
      source: "default" | "server_environment";
    }
  | {
      ok: false;
      reason: "invalid_provider_order";
    };

export type ManagedRoutingAttempt = {
  providerId: ManagedLiveProviderId;
  outcome:
    | "not_admitted"
    | "data_policy_blocked"
    | "not_configured"
    | "operational_failure"
    | "terminal_failure"
    | "accepted";
  failureClassification: FailureClassification | null;
};

export type ManagedProviderExecution<T> =
  | { ok: true; value: T }
  | { ok: false; classification: FailureClassification };

export type ManagedProviderCandidate<T> = {
  providerId: ManagedLiveProviderId;
  admitted: boolean;
  dataEligible: boolean;
  configured: boolean;
  execute: () => Promise<ManagedProviderExecution<T>>;
};

export type ManagedRoutingResult<T> =
  | {
      ok: true;
      providerId: ManagedLiveProviderId;
      value: T;
      attempts: ManagedRoutingAttempt[];
      configurationError: null;
    }
  | {
      ok: false;
      terminal: boolean;
      attempts: ManagedRoutingAttempt[];
      configurationError: "invalid_provider_order" | null;
    };

const ADVANCEABLE_FAILURES = new Set<FailureClassification>([
  "provider_authentication_failed",
  "provider_service_tier_unavailable",
  "provider_quota_exhausted",
  "provider_rate_limited",
  "provider_unavailable",
]);

/**
 * Runs one bounded, server-managed analysis intent.
 *
 * Missing, unadmitted, or data-ineligible releases are never called. Provider
 * output is accepted from at most one release and is never merged. Unknown
 * transmission, timeout, refusal, schema, citation, or safety failures stop
 * the chain because trying another model could hide an unsafe result.
 */
export async function runManagedProviderChain<T>(
  candidates: readonly ManagedProviderCandidate<T>[],
  options: { configuredOrder?: string } = {},
): Promise<ManagedRoutingResult<T>> {
  const order = resolveManagedLiveProviderOrder(
    options.configuredOrder ?? process.env.ANALYSIS_PROVIDER_ORDER,
  );
  if (!order.ok) {
    return {
      ok: false,
      terminal: true,
      attempts: [],
      configurationError: order.reason,
    };
  }
  const byProvider = new Map(
    candidates.map((candidate) => [candidate.providerId, candidate]),
  );
  const attempts: ManagedRoutingAttempt[] = [];

  for (const providerId of order.order) {
    const candidate = byProvider.get(providerId);
    if (!candidate?.admitted) {
      attempts.push({
        providerId,
        outcome: "not_admitted",
        failureClassification: null,
      });
      continue;
    }
    if (!candidate.dataEligible) {
      attempts.push({
        providerId,
        outcome: "data_policy_blocked",
        failureClassification: null,
      });
      continue;
    }
    if (!candidate.configured) {
      attempts.push({
        providerId,
        outcome: "not_configured",
        failureClassification: "provider_authentication_failed",
      });
      continue;
    }

    const result = await candidate.execute();
    if (result.ok) {
      attempts.push({
        providerId,
        outcome: "accepted",
        failureClassification: null,
      });
      return {
        ok: true,
        providerId,
        value: result.value,
        attempts,
        configurationError: null,
      };
    }

    if (!ADVANCEABLE_FAILURES.has(result.classification)) {
      attempts.push({
        providerId,
        outcome: "terminal_failure",
        failureClassification: result.classification,
      });
      return {
        ok: false,
        terminal: true,
        attempts,
        configurationError: null,
      };
    }

    attempts.push({
      providerId,
      outcome: "operational_failure",
      failureClassification: result.classification,
    });
  }

  return {
    ok: false,
    terminal: false,
    attempts,
    configurationError: null,
  };
}

export function resolveManagedLiveProviderOrder(
  value: string | undefined,
): ManagedProviderOrderResolution {
  if (value === undefined) {
    return {
      ok: true,
      order: MANAGED_LIVE_PROVIDER_ORDER,
      source: "default",
    };
  }

  const requested = value.split(",").map((providerId) => providerId.trim());
  const allowed = new Set<string>(MANAGED_LIVE_PROVIDER_ORDER);
  const unique = new Set(requested);
  if (
    requested.length !== MANAGED_LIVE_PROVIDER_ORDER.length ||
    unique.size !== MANAGED_LIVE_PROVIDER_ORDER.length ||
    requested.some((providerId) => !allowed.has(providerId))
  ) {
    return { ok: false, reason: "invalid_provider_order" };
  }

  return {
    ok: true,
    order: requested as ManagedLiveProviderId[],
    source: "server_environment",
  };
}

export function isManagedOperationalFallbackFailure(
  classification: FailureClassification,
): boolean {
  return ADVANCEABLE_FAILURES.has(classification);
}
