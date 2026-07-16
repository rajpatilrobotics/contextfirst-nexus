import { buildAnalyzeAvailabilityResponse } from "../../../lib/ai/server/registry";
import type { ProviderOptionProjection } from "../../../lib/contracts";

export function providerOptions(): ProviderOptionProjection[] {
  return buildAnalyzeAvailabilityResponse({ liveAnalysisEnabled: true }).options;
}

export function selectableProviderOptions(): ProviderOptionProjection[] {
  return providerOptions().map((option) =>
    option.providerId === "mistral"
      ? option
      : { ...option, availabilityStatus: "available" as const, selectable: true },
  );
}
