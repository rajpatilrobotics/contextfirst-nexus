import { buildAnalyzeAvailabilityResponse } from "../../../lib/ai/server/registry";
import type { ProviderOptionProjection } from "../../../lib/contracts";

export function replayOnlyProviderOptions(): ProviderOptionProjection[] {
  return buildAnalyzeAvailabilityResponse({ liveAnalysisEnabled: false }).options;
}

export function zeroSelectableProviderOptions(): ProviderOptionProjection[] {
  return replayOnlyProviderOptions().map((option) => ({ ...option, selectable: false }));
}

export function multipleSelectableProviderOptions(): ProviderOptionProjection[] {
  return replayOnlyProviderOptions().map((option) =>
    option.providerId === "openai"
      ? { ...option, availabilityStatus: "available" as const, selectable: true }
      : option,
  );
}

export function liveOnlyProviderOptions(): ProviderOptionProjection[] {
  return multipleSelectableProviderOptions().map((option) =>
    option.providerId === "local_replay" ? { ...option, selectable: false } : option,
  );
}
