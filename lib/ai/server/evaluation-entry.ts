import "server-only";

import {
  PrivateLiveEvaluationRequestSchema,
  PrivateLiveEvaluationResultSchema,
} from "../../contracts";
import { analyze, type AdapterOverrides, type AnalyzeResult } from "./orchestrator";
import { CFN_DEMO_FIXTURE_BINDING, SHARED_PROMPT_VERSION } from "./types";

type PrivateLiveEvaluationResult = {
  schemaVersion: "1.0.0";
  source: "private_evaluation";
  admissionMutation: false;
  publicSelectabilityMutation: false;
  terminalResponse: Extract<AnalyzeResult, { outcome: "succeeded" | "failed" }>;
};

export async function runPrivateLiveEvaluation(
  value: unknown,
  adapters: AdapterOverrides = {},
): Promise<PrivateLiveEvaluationResult> {
  const request = PrivateLiveEvaluationRequestSchema.parse(value);
  if (
    request.caseId !== CFN_DEMO_FIXTURE_BINDING.caseId ||
    request.fixtureVersion !== CFN_DEMO_FIXTURE_BINDING.fixtureVersion ||
    request.canonicalFixtureDigest !== CFN_DEMO_FIXTURE_BINDING.canonicalFixtureDigest ||
    request.promptVersion !== SHARED_PROMPT_VERSION ||
    request.callOrdinal > request.approval.approvedCallCount ||
    request.release.releaseConfigurationId !== request.approval.release.releaseConfigurationId
  ) {
    throw new Error("Evaluation request is outside the frozen synthetic boundary.");
  }

  const terminalResponse = await analyze(
    {
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
      maskApprovals: request.maskApprovals,
    },
    adapters,
  );

  if (terminalResponse.outcome === "rejected_before_run") {
    throw new Error("Evaluation preflight unexpectedly rejected the frozen input.");
  }

  const result: PrivateLiveEvaluationResult = {
    schemaVersion: "1.0.0",
    source: "private_evaluation",
    admissionMutation: false,
    publicSelectabilityMutation: false,
    terminalResponse,
  };
  PrivateLiveEvaluationResultSchema.parse(result);
  return result;
}
