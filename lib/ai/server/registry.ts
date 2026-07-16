import {
  AnalyzeAvailabilityResponseSchema,
  ProviderDisplayOrderById,
  ProviderOptionProjectionSchema,
  type LiveProviderReleaseConfiguration,
  type ProviderOptionProjection,
} from "../../contracts";
import { expectedEvaluatedConfigurationDigest, getAdmissionRecord } from "./admission";
import {
  ADAPTER_VERSION,
  type LiveProviderReleaseRegistryEntry,
  type ProviderAvailabilityOptions,
  type ProviderReleaseRegistryEntry,
  type ReplayReleaseRegistryEntry,
} from "./types";

const LAST_VERIFIED = "2026-07-16T00:00:00.000Z" as const;

export const LIVE_PROVIDER_RELEASES = [
  {
    providerId: "openai",
    releaseConfigurationId: "openai-quality-v1",
    requestedModel: "gpt-5.6-sol",
    serviceTier: "paid",
  },
  {
    providerId: "google_gemini",
    releaseConfigurationId: "gemini-quality-v1",
    requestedModel: "gemini-3.5-flash",
    serviceTier: "unpaid",
  },
  {
    providerId: "mistral",
    releaseConfigurationId: "mistral-small-free-v1",
    requestedModel: "mistral-small-2603",
    serviceTier: "unpaid",
  },
] as const satisfies readonly LiveProviderReleaseConfiguration[];

export const REPLAY_RELEASE = {
  providerId: "local_replay",
  releaseConfigurationId: "prepared-replay-v1",
  requestedModel: "frozen_replay_output",
  serviceTier: "local",
} as const;

export const PROVIDER_REGISTRY = [
  liveEntry(LIVE_PROVIDER_RELEASES[0], {
    displayName: "OpenAI",
    modelDisplayName: "GPT-5.6 Sol",
    modelAliasDisclosure: "Frozen OpenAI quality release for the synthetic demo fixture.",
    inferenceSetting: { kind: "reasoning_effort", value: "medium" },
    disclosure: {
      schemaVersion: "1.0.0",
      disclosureVersion: "1.0.0",
      serviceTierLabel: "Paid live provider",
      dataFlowSummary: "Approved redacted synthetic fixture evidence is sent to OpenAI for one analysis run.",
      storageMode: "openai_store_false",
      retentionSetting: "openai_store_false",
      retentionLimitation: "Requests are sent with provider storage disabled for this release.",
      trainingUseDisclosure: "This boundary does not permit use of the synthetic case for model training.",
      providerContentCategories: ["approved redacted synthetic evidence", "purpose metadata"],
      processingRegion: null,
      allowedDataOrigins: ["bundled_synthetic"],
      providerTransmission: true,
      rawPdfSentToProvider: false,
      toolsEnabled: false,
      acknowledgementRequired: true,
      lastVerified: LAST_VERIFIED,
    },
  }),
  liveEntry(LIVE_PROVIDER_RELEASES[1], {
    displayName: "Google Gemini",
    modelDisplayName: "Gemini 3.5 Flash",
    modelAliasDisclosure: "Frozen Gemini unpaid synthetic-only release.",
    inferenceSetting: { kind: "thinking_level", value: "medium" },
    disclosure: {
      schemaVersion: "1.0.0",
      disclosureVersion: "1.0.0",
      serviceTierLabel: "Unpaid synthetic-only live provider",
      dataFlowSummary: "Approved redacted synthetic fixture evidence is sent to Gemini for one analysis run.",
      storageMode: "gemini_stateless_unpaid",
      retentionSetting: "gemini_unpaid_default",
      retentionLimitation: "Unpaid-provider retention follows the provider's default unpaid terms.",
      trainingUseDisclosure: "Only bundled synthetic data is allowed for this unpaid release.",
      providerContentCategories: ["approved redacted synthetic evidence", "purpose metadata"],
      processingRegion: null,
      allowedDataOrigins: ["bundled_synthetic"],
      providerTransmission: true,
      rawPdfSentToProvider: false,
      toolsEnabled: false,
      acknowledgementRequired: true,
      lastVerified: LAST_VERIFIED,
    },
  }),
  liveEntry(LIVE_PROVIDER_RELEASES[2], {
    displayName: "Mistral",
    modelDisplayName: "Mistral Small 2603",
    modelAliasDisclosure: "Frozen Mistral unpaid synthetic-only release.",
    inferenceSetting: { kind: "reasoning_effort", value: "medium" },
    disclosure: {
      schemaVersion: "1.0.0",
      disclosureVersion: "1.0.0",
      serviceTierLabel: "Unpaid synthetic-only live provider",
      dataFlowSummary: "Approved redacted synthetic fixture evidence would be sent to Mistral only after admission passes.",
      storageMode: "mistral_stateless_free",
      retentionSetting: "mistral_free_30_day_default",
      retentionLimitation: "Free-tier retention may last up to 30 days; no zero-data-retention claim is made.",
      trainingUseDisclosure: "Training-use opt-out is not claimed for this free-tier release.",
      providerContentCategories: ["approved redacted synthetic evidence", "purpose metadata"],
      processingRegion: null,
      allowedDataOrigins: ["bundled_synthetic"],
      providerTransmission: true,
      rawPdfSentToProvider: false,
      toolsEnabled: false,
      acknowledgementRequired: true,
      lastVerified: LAST_VERIFIED,
    },
  }),
  {
    kind: "replay",
    release: REPLAY_RELEASE,
    displayName: "Prepared replay",
    modelDisplayName: "Frozen replay output",
    modelAliasDisclosure: "Bundled deterministic replay, not a live AI provider.",
    adapterVersion: ADAPTER_VERSION,
    displayOrder: 4,
    inferenceSetting: { kind: "not_applicable", value: "not_applicable" },
    disclosure: {
      schemaVersion: "1.0.0",
      disclosureVersion: "1.0.0",
      serviceTierLabel: "Local deterministic replay",
      dataFlowSummary: "No provider transmission occurs; the bundled replay is local demo data.",
      storageMode: "local_no_transmission",
      retentionSetting: "local_no_provider_retention",
      retentionLimitation: "No external provider receives or retains the replay request.",
      trainingUseDisclosure: "No provider training use occurs because no provider call is made.",
      providerContentCategories: ["bundled deterministic replay metadata"],
      processingRegion: null,
      allowedDataOrigins: ["bundled_synthetic"],
      providerTransmission: false,
      rawPdfSentToProvider: false,
      toolsEnabled: false,
      acknowledgementRequired: true,
      lastVerified: LAST_VERIFIED,
    },
  } satisfies ReplayReleaseRegistryEntry,
] as const satisfies readonly ProviderReleaseRegistryEntry[];

export function getProviderRegistry(): readonly ProviderReleaseRegistryEntry[] {
  return PROVIDER_REGISTRY;
}

export function getRegistryEntry(
  releaseConfigurationId: string,
): ProviderReleaseRegistryEntry | null {
  return (
    PROVIDER_REGISTRY.find(
      (entry) => entry.release.releaseConfigurationId === releaseConfigurationId,
    ) ?? null
  );
}

export function projectProviderOption(
  entry: ProviderReleaseRegistryEntry,
  options: ProviderAvailabilityOptions = {},
): ProviderOptionProjection {
  const projected =
    entry.kind === "replay"
      ? {
          schemaVersion: "1.0.0",
          ...entry.release,
          displayOrder: entry.displayOrder,
          displayName: entry.displayName,
          modelDisplayName: entry.modelDisplayName,
          modelAliasDisclosure: entry.modelAliasDisclosure,
          adapterVersion: entry.adapterVersion,
          mode: "deterministic_replay",
          providerTransmission: false,
          evaluationStatus: "not_applicable",
          deployedAccountReleaseAvailabilityStatus: "not_required",
          availabilityStatus: "available",
          selectable: true,
          disclosure: entry.disclosure,
        }
      : {
          schemaVersion: "1.0.0",
          ...entry.release,
          displayOrder: entry.displayOrder,
          displayName: entry.displayName,
          modelDisplayName: entry.modelDisplayName,
          modelAliasDisclosure: entry.modelAliasDisclosure,
          adapterVersion: entry.adapterVersion,
          mode: "live",
          providerTransmission: true,
          evaluationStatus: exactAdmissionPassed(entry) ? entry.admission.evaluationStatus : "not_evaluated",
          deployedAccountReleaseAvailabilityStatus:
            entry.admission.deployedAccountReleaseAvailability.status,
          availabilityStatus: availabilityForLiveEntry(entry, options),
          selectable: availabilityForLiveEntry(entry, options) === "available",
          disclosure: entry.disclosure,
        };

  return ProviderOptionProjectionSchema.parse(projected);
}

export function buildAnalyzeAvailabilityResponse(options: ProviderAvailabilityOptions = {}) {
  return AnalyzeAvailabilityResponseSchema.parse({
    schemaVersion: "1.0.0",
    liveAnalysisEnabled: options.liveAnalysisEnabled === true,
    replayEnabled: true,
    options: PROVIDER_REGISTRY.map((entry) => projectProviderOption(entry, options)),
  });
}

function liveEntry(
  release: (typeof LIVE_PROVIDER_RELEASES)[number],
  config: Omit<
    LiveProviderReleaseRegistryEntry,
    "kind" | "release" | "adapterVersion" | "displayOrder" | "enabled" | "staticServiceTierAvailability" | "admission"
  >,
): LiveProviderReleaseRegistryEntry {
  const admission = getAdmissionRecord(release.releaseConfigurationId);
  if (!admission) {
    throw new Error(`Missing static admission for ${release.releaseConfigurationId}`);
  }

  return {
    kind: "live",
    release,
    adapterVersion: ADAPTER_VERSION,
    displayOrder: ProviderDisplayOrderById[release.providerId] as 1 | 2 | 3,
    enabled: true,
    staticServiceTierAvailability: "available",
    admission,
    ...config,
  };
}

function availabilityForLiveEntry(
  entry: LiveProviderReleaseRegistryEntry,
  options: ProviderAvailabilityOptions,
): ProviderOptionProjection["availabilityStatus"] {
  if (options.liveAnalysisEnabled !== true) {
    return "disabled";
  }
  if (!entry.enabled) {
    return "disabled";
  }
  if (entry.staticServiceTierAvailability !== "available") {
    return "service_tier_unavailable";
  }
  if (entry.admission.deployedAccountReleaseAvailability.status === "not_verified") {
    return "deployed_account_release_unavailable";
  }
  if (entry.admission.deployedAccountReleaseAvailability.status === "unavailable") {
    return "deployed_account_release_unavailable";
  }
  if (!exactAdmissionPassed(entry)) {
    return entry.admission.evaluationStatus === "failed" ? "evaluation_failed" : "not_evaluated";
  }
  return "available";
}

function exactAdmissionPassed(entry: LiveProviderReleaseRegistryEntry): boolean {
  return (
    entry.admission.evaluationStatus === "passed" &&
    entry.admission.evaluatedConfiguration.providerId === entry.release.providerId &&
    entry.admission.evaluatedConfiguration.releaseConfigurationId ===
      entry.release.releaseConfigurationId &&
    entry.admission.evaluatedConfiguration.requestedModel === entry.release.requestedModel &&
    entry.admission.evaluatedConfiguration.serviceTier === entry.release.serviceTier &&
    entry.admission.evaluatedConfiguration.evaluatedConfigurationDigest ===
      expectedEvaluatedConfigurationDigest(entry.release, entry.inferenceSetting)
  );
}
