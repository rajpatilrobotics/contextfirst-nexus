import "server-only";

import {
  AnalysisRecoveryOptionSchema,
  type LiveProviderReleaseConfigurationId,
} from "../../contracts";
import { LIVE_PROVIDER_RELEASES } from "./registry";
import type { AnalysisFailureLike } from "./normalize";

type AnalysisRecoveryOption = typeof AnalysisRecoveryOptionSchema._output;

export function buildRecoveryOptions(
  failure: AnalysisFailureLike,
  selectedReleaseConfigurationId: LiveProviderReleaseConfigurationId,
): AnalysisRecoveryOption[] {
  const options: AnalysisRecoveryOption[] = [];

  if (failure.retryableSameProvider) {
    options.push(
      AnalysisRecoveryOptionSchema.parse({
        label: "Retry the same provider",
        automatic: false,
        action: "retry_same_provider",
        targetReleaseConfigurationId: selectedReleaseConfigurationId,
        displayOrder: 0,
        requiresDisclosureAcknowledgement: false,
        startsNewRun: true,
      }),
    );
  }

  if (failure.alternateProviderRecoveryAllowed) {
    for (const [index, release] of LIVE_PROVIDER_RELEASES.entries()) {
      if (release.releaseConfigurationId === selectedReleaseConfigurationId) continue;
      options.push(
        AnalysisRecoveryOptionSchema.parse({
          label: `Select ${labelForRelease(release.releaseConfigurationId)}`,
          automatic: false,
          action: "select_evaluated_release",
          targetReleaseConfigurationId: release.releaseConfigurationId,
          displayOrder: index + 1,
          requiresDisclosureAcknowledgement: true,
          startsNewRun: true,
        }),
      );
    }
  }

  if (failure.replayRecoveryAllowed) {
    options.push(
      AnalysisRecoveryOptionSchema.parse({
        label: "Use prepared replay",
        automatic: false,
        action: "use_deterministic_replay",
        targetReleaseConfigurationId: "prepared-replay-v1",
        displayOrder: 4,
        requiresDisclosureAcknowledgement: true,
        startsNewRun: true,
      }),
    );
  }

  options.push(
    AnalysisRecoveryOptionSchema.parse({
      label: "Return to purpose review",
      automatic: false,
      action: "return_to_purpose",
      targetReleaseConfigurationId: null,
      displayOrder: 5,
      requiresDisclosureAcknowledgement: false,
      startsNewRun: false,
    }),
  );

  return options.sort((a, b) => a.displayOrder - b.displayOrder);
}

function labelForRelease(releaseConfigurationId: LiveProviderReleaseConfigurationId): string {
  if (releaseConfigurationId === "openai-quality-v1") return "OpenAI";
  if (releaseConfigurationId === "gemini-quality-v1") return "Google Gemini";
  return "Mistral";
}
