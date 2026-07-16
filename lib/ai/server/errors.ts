import {
  PreflightApiErrorSchema,
  type AnalyzeLiveProviderSelection,
  type PreflightRejectionSafeErrorCode,
} from "../../contracts";

const USER_MESSAGES: Record<PreflightRejectionSafeErrorCode, string> = {
  INVALID_REQUEST: "The analysis request could not be validated.",
  UNSUPPORTED_VERSION: "This analysis request uses an unsupported version.",
  LIVE_ANALYSIS_DISABLED: "Live analysis is currently disabled.",
  CANONICAL_FIXTURE_MISMATCH: "The request does not match the approved demo fixture.",
  UNAUTHORIZED_PURPOSE: "The request purpose is not authorized for live analysis.",
  MASK_REVIEW_INCOMPLETE: "Mask review must be complete before live analysis.",
  MASK_SPAN_INVALID: "The approved mask spans could not be validated.",
  PII_LEAK_DETECTED: "The redacted provider input did not pass the leak scan.",
  PAYLOAD_TOO_LARGE: "The provider input is too large for this demo boundary.",
  SOURCE_UNAVAILABLE: "Requested source content is not available in the approved fixture.",
  EXTRACTION_FAILED: "The provider input could not be reconstructed.",
  PROVIDER_NOT_CONFIGURED: "The selected provider is not configured.",
  PROVIDER_DISABLED: "The selected provider is disabled.",
  PROVIDER_SERVICE_TIER_UNAVAILABLE: "The selected provider tier is unavailable.",
  PROVIDER_DATA_POLICY_BLOCKED: "The selected provider is not allowed for this data policy.",
};

export function makePreflightError(
  code: PreflightRejectionSafeErrorCode,
  failedStage: string,
  providerContext: AnalyzeLiveProviderSelection | null = null,
) {
  return PreflightApiErrorSchema.parse({
    schemaVersion: "1.0.0",
    requestId: "REQ-LOCAL-PREFLIGHT",
    userMessage: USER_MESSAGES[code],
    failedStage,
    code,
    retryable: false,
    failedRunId: null,
    providerContext,
    failureClassification: null,
    recoveryOptions: [],
  });
}
