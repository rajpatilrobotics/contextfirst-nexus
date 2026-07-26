import {
  AnalyzeRequestSchema,
  PrivateLiveEvaluationRequestSchema,
  type AnalyzeRequest,
} from "../../contracts";
import {
  cfnDemoEvaluationDefinitions,
  cfnDemoFixture,
  getCfnDemoSegment,
} from "../../fixtures";
import {
  applyLeakScanResult,
  buildRedactedSegments,
  scanProviderPayload,
  type MaskReviewStatus,
  type RedactedSegment,
} from "../../redaction";
import { makePreflightError } from "./errors";
import { LIVE_PROVIDER_RELEASES } from "./registry";
import {
  AI_BOUNDARY_VERSION,
  CFN_DEMO_FIXTURE_BINDING,
  SHARED_PROMPT_VERSION,
  type CanonicalProviderInput,
} from "./types";

const MAX_SERIALIZED_INPUT_BYTES = 24_000;
const DECLARED_SYNTHETIC_IDENTIFIERS = ["Maya K."] as const;

export function buildCanonicalProviderInput(
  value: unknown,
): { ok: true; input: CanonicalProviderInput } | { ok: false; error: ReturnType<typeof makePreflightError> } {
  const parsed = AnalyzeRequestSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, error: makePreflightError("INVALID_REQUEST", "canonical_request") };
  }

  const request = parsed.data;
  const fixtureCheck = validateFixtureBinding(request);
  if (fixtureCheck) {
    return { ok: false, error: fixtureCheck };
  }

  const release = LIVE_PROVIDER_RELEASES.find(
    (candidate) =>
      candidate.providerId === request.providerSelection.providerId &&
      candidate.releaseConfigurationId === request.providerSelection.releaseConfigurationId &&
      candidate.serviceTier === request.providerSelection.serviceTier,
  );
  if (!release) {
    return { ok: false, error: makePreflightError("PROVIDER_DATA_POLICY_BLOCKED", "provider_selection") };
  }

  const segments = request.selectedSegmentIds.map((segmentId) => getCfnDemoSegment(segmentId));
  if (segments.some((segment) => segment === null)) {
    return { ok: false, error: makePreflightError("SOURCE_UNAVAILABLE", "selected_segments") };
  }

  const selectedSegments = segments.filter((segment): segment is NonNullable<typeof segment> => Boolean(segment));
  const maskSuggestions = request.maskApprovals.map((approval) => ({
    id: approval.maskId,
    segmentId: approval.segmentId,
    maskClass: approval.maskClass,
    originalStart: approval.originalStart,
    originalEnd: approval.originalEnd,
    redactedStart: approval.originalStart,
    redactedEnd: approval.originalStart + approval.replacementToken.length,
    replacementToken: approval.replacementToken,
    detectionMethod: "deterministic_pattern" as const,
    reviewStatus: approval.reviewStatus as MaskReviewStatus,
  }));

  const redaction = buildRedactedSegments(selectedSegments, {
    redactionMapVersion: "1.0.0",
    revision: 1,
    reviewStatus: "approved",
    reviewedBy: "current_practitioner",
    approvedAt: request.providerDisclosureAcknowledgement.acknowledgedAt,
    declaredSupportedClasses: [
      "person_name",
      "email",
      "phone",
      "passport",
      "bank_account",
      "address",
      "date_of_birth",
    ],
    leakScanStatus: request.leakScanStatus,
    failedClasses: [],
    suggestions: maskSuggestions,
  });

  if (!redaction.ok) {
    return { ok: false, error: makePreflightError("MASK_SPAN_INVALID", "mask_validation") };
  }

  const serializedEvidence = serializeEvidence(redaction.segments);
  if (Buffer.byteLength(serializedEvidence, "utf8") > MAX_SERIALIZED_INPUT_BYTES) {
    return { ok: false, error: makePreflightError("PAYLOAD_TOO_LARGE", "canonical_input") };
  }

  const serverLeakScan = scanProviderPayload(serializedEvidence, {
    sensitiveTerms: DECLARED_SYNTHETIC_IDENTIFIERS,
  });
  const leakCheckedReview = applyLeakScanResult(
    {
      redactionMapVersion: "1.0.0",
      revision: 1,
      reviewStatus: "approved",
      reviewedBy: "current_practitioner",
      approvedAt: request.providerDisclosureAcknowledgement.acknowledgedAt,
      declaredSupportedClasses: [],
      leakScanStatus: request.leakScanStatus,
      failedClasses: [],
      suggestions: maskSuggestions,
    },
    serverLeakScan,
  );
  if (leakCheckedReview.leakScanStatus !== "passed") {
    return { ok: false, error: makePreflightError("PII_LEAK_DETECTED", "server_leak_scan") };
  }

  return {
    ok: true,
    input: {
      schemaVersion: AI_BOUNDARY_VERSION,
      promptVersion: SHARED_PROMPT_VERSION,
      request,
      release,
      fixtureBinding: CFN_DEMO_FIXTURE_BINDING,
      selectedSegments: redaction.segments,
      serializedEvidence,
      inputByteLength: Buffer.byteLength(serializedEvidence, "utf8"),
    },
  };
}

export function serializeEvidence(segments: readonly RedactedSegment[]): string {
  return JSON.stringify({
    dataOrigin: "bundled_synthetic",
    caseId: CFN_DEMO_FIXTURE_BINDING.caseId,
    fixtureVersion: CFN_DEMO_FIXTURE_BINDING.fixtureVersion,
    segments: segments.map((segment) => {
      const fixtureSegment = getCfnDemoSegment(segment.segmentId);
      return {
        segmentId: segment.segmentId,
        redactedText: segment.redactedText,
        instructionAdvisory: fixtureSegment?.instructionAdvisory ?? "unknown",
        modelVisibility: fixtureSegment?.modelVisibility ?? "untrusted_content",
        supportEligibility: fixtureSegment?.supportEligibility ?? "evidence_only",
      };
    }),
  });
}

export function buildFrozenEvaluationProviderInput(
  value: unknown,
): { ok: true; input: CanonicalProviderInput } | { ok: false; reason: string } {
  const parsed = PrivateLiveEvaluationRequestSchema.safeParse(value);
  if (!parsed.success) return { ok: false, reason: "invalid_evaluation_request" };
  const request = parsed.data;
  const definition = cfnDemoEvaluationDefinitions.variants.find(
    (item) => item.variantId === request.evaluationVariantId,
  );
  if (
    !definition ||
    request.caseId !== CFN_DEMO_FIXTURE_BINDING.caseId ||
    request.fixtureVersion !== CFN_DEMO_FIXTURE_BINDING.fixtureVersion ||
    request.canonicalFixtureDigest !== CFN_DEMO_FIXTURE_BINDING.canonicalFixtureDigest ||
    request.evaluationInputPacketId !== definition.inputPacket.id ||
    request.evaluationInputPacketDigest !== definition.inputPacket.packetDigest ||
    request.approvedRedactedInputDigest !==
      definition.inputPacket.approvedRedactedInputDigest ||
    request.selectedSegmentIds.join("|") !==
      definition.inputPacket.selectedSegmentIds.join("|")
  ) {
    return { ok: false, reason: "evaluation_binding_mismatch" };
  }

  const release = LIVE_PROVIDER_RELEASES.find(
    (candidate) =>
      candidate.providerId === request.release.providerId &&
      candidate.releaseConfigurationId ===
        request.release.releaseConfigurationId &&
      candidate.serviceTier === request.release.serviceTier,
  );
  if (!release) return { ok: false, reason: "evaluation_release_mismatch" };

  const sourceSegments = request.selectedSegmentIds.map((segmentId) =>
    getCfnDemoSegment(segmentId),
  );
  if (sourceSegments.some((segment) => segment === null)) {
    return { ok: false, reason: "evaluation_source_unavailable" };
  }
  const selectedSegments: RedactedSegment[] = sourceSegments.map((segment) => {
    if (!segment) throw new Error("Evaluation segment disappeared.");
    return {
      segmentId: segment.id,
      rawText: segment.redactedText,
      redactedText: segment.redactedText,
      map: {
        version: "1.0.0",
        segmentId: segment.id,
        originalLength: segment.redactedText.length,
        redactedLength: segment.redactedText.length,
        entries: [],
      },
    };
  });
  const serializedEvidence = serializeEvidence(selectedSegments);
  const leakScan = scanProviderPayload(serializedEvidence, {
    sensitiveTerms: cfnDemoFixture.seededIdentifiers.filter(
      (identifier) => identifier !== CFN_DEMO_FIXTURE_BINDING.caseId,
    ),
  });
  if (!leakScan.ok) return { ok: false, reason: "evaluation_leak_detected" };

  const analyzeRequest = AnalyzeRequestSchema.parse({
    schemaVersion: "1.0.0",
    caseId: request.caseId,
    fixtureVersion: request.fixtureVersion,
    canonicalFixtureDigest: request.canonicalFixtureDigest,
    purposeBriefId: "PURPOSE-DEMO-001",
    purposeContext: {
      practitionerRole: "demo_evaluator",
      jurisdictionCode: "unspecified",
      sourceLanguage: "en",
      requestedExport: "full_practitioner_handoff",
    },
    maskReviewApproved: true,
    leakScanStatus: "passed",
    requestedMode: "live",
    providerSelection: request.release,
    providerDisclosureAcknowledgement: {
      id: `ACK-EVAL-${request.callOrdinal}`,
      schemaVersion: "1.0.0",
      ...request.release,
      disclosureVersion: "1.0.0",
      dataFlowAcknowledged: true,
      retentionAndTrainingUseAcknowledged: true,
      serviceTierAcknowledged: true,
      acknowledgedAt: request.approval.approvedAt,
    },
    selectedSegmentIds: request.selectedSegmentIds,
    maskApprovals: [],
  });

  return {
    ok: true,
    input: {
      schemaVersion: AI_BOUNDARY_VERSION,
      promptVersion: SHARED_PROMPT_VERSION,
      request: analyzeRequest,
      release,
      fixtureBinding: CFN_DEMO_FIXTURE_BINDING,
      selectedSegments,
      serializedEvidence,
      inputByteLength: Buffer.byteLength(serializedEvidence, "utf8"),
    },
  };
}

function validateFixtureBinding(request: AnalyzeRequest): ReturnType<typeof makePreflightError> | null {
  if (
    request.caseId !== CFN_DEMO_FIXTURE_BINDING.caseId ||
    request.fixtureVersion !== CFN_DEMO_FIXTURE_BINDING.fixtureVersion ||
    request.canonicalFixtureDigest !== CFN_DEMO_FIXTURE_BINDING.canonicalFixtureDigest ||
    cfnDemoFixture.caseId !== CFN_DEMO_FIXTURE_BINDING.caseId ||
    cfnDemoFixture.fixtureVersion !== CFN_DEMO_FIXTURE_BINDING.fixtureVersion ||
    cfnDemoFixture.canonicalFixtureDigest !== CFN_DEMO_FIXTURE_BINDING.canonicalFixtureDigest
  ) {
    return makePreflightError("CANONICAL_FIXTURE_MISMATCH", "fixture_binding", request.providerSelection);
  }
  return null;
}
