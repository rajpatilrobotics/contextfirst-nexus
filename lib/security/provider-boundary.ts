import "server-only";

import type { AnalyzeRequest } from "../contracts";
import { buildCanonicalProviderInput } from "../ai/server/canonical-input";
import { getRegistryEntry, projectProviderOption } from "../ai/server/registry";
import { makePreflightError } from "../ai/server/errors";

export function preflightLiveProviderRequest(value: unknown) {
  const canonical = buildCanonicalProviderInput(value);
  if (!canonical.ok) {
    return canonical;
  }

  const entry = getRegistryEntry(canonical.input.request.providerSelection.releaseConfigurationId);
  if (!entry || entry.kind !== "live") {
    return {
      ok: false as const,
      error: makePreflightError(
        "PROVIDER_DATA_POLICY_BLOCKED",
        "provider_registry",
        canonical.input.request.providerSelection,
      ),
    };
  }

  const option = projectProviderOption(entry, { liveAnalysisEnabled: true });
  if (!option.selectable) {
    return {
      ok: false as const,
      error: makePreflightError(
        option.availabilityStatus === "disabled" ? "PROVIDER_DISABLED" : "PROVIDER_DATA_POLICY_BLOCKED",
        "provider_admission",
        canonical.input.request.providerSelection,
      ),
    };
  }

  return canonical;
}

export function assertNoBrowserSuppliedProviderFields(request: AnalyzeRequest): boolean {
  return !Object.prototype.hasOwnProperty.call(request, "model") &&
    !Object.prototype.hasOwnProperty.call(request, "apiKey") &&
    !Object.prototype.hasOwnProperty.call(request, "endpoint") &&
    !Object.prototype.hasOwnProperty.call(request, "retryPolicy");
}
