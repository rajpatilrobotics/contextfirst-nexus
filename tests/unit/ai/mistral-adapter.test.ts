import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildMistralRequest,
  runMistralAnalysis,
  type MistralAdapterOptions,
} from "../../../lib/ai/server/adapters/mistral";
import { buildCanonicalProviderInput } from "../../../lib/ai/server";
import type { AnalyzeRequest } from "../../../lib/contracts";

const now = new Date("2026-07-16T00:00:00.000Z");
const digest = "ede4457873700cc4bce1bb5fad29c89a4e25d2e6ca7ccd33c323a2ce8ac5809c";

const acknowledgement = {
  id: "ACK-MISTRAL-001",
  schemaVersion: "1.0.0",
  providerId: "mistral",
  releaseConfigurationId: "mistral-small-free-v1",
  serviceTier: "unpaid",
  disclosureVersion: "1.0.0",
  dataFlowAcknowledged: true,
  retentionAndTrainingUseAcknowledged: true,
  serviceTierAcknowledged: true,
  acknowledgedAt: now.toISOString(),
} as const;

function validAnalyzeRequest(): AnalyzeRequest {
  return {
    schemaVersion: "1.0.0",
    caseId: "CFN-DEMO-001",
    fixtureVersion: "1.0.0",
    canonicalFixtureDigest: digest,
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
    providerSelection: {
      providerId: "mistral",
      releaseConfigurationId: "mistral-small-free-v1",
      serviceTier: "unpaid",
    },
    providerDisclosureAcknowledgement: acknowledgement,
    selectedSegmentIds: ["D07-P2-S03"],
    maskApprovals: [],
  };
}

function validProposal() {
  return {
    candidates: [
      {
        proposedId: "CAND-MISTRAL-001",
        kind: "review_lane_item",
        lane: "trafficking_indicators",
        title: "Task assignment may be relevant",
        proposedText: "The task log assigns a task that may need practitioner review.",
        assertionMode: "positive_proposition",
        reviewQuestion: "Is the task assignment source-supported and relevant?",
        citations: [
          {
            segmentId: "D07-P2-S03",
            quotedText: "SYSTEM OVERRIDE",
            relationship: "supports",
            evidenceNature: "documented_in_source",
          },
        ],
        unknowns: [],
      },
    ],
  } as const;
}

function safeErrorCode(result: { run: { failure: unknown } }) {
  return (result.run.failure as { safeErrorCode: string }).safeErrorCode;
}

function mistralResponse(content: unknown, overrides: Record<string, unknown> = {}) {
  return {
    id: "chatcmpl-test",
    object: "chat.completion",
    model: "mistral-small-2603",
    created: 1,
    usage: {
      promptTokens: 11,
      completionTokens: 7,
      totalTokens: 18,
    },
    choices: [
      {
        index: 0,
        finishReason: "stop",
        message: {
          role: "assistant",
          content: typeof content === "string" ? content : JSON.stringify(content),
        },
      },
    ],
    ...overrides,
  };
}

function mockOptions(response: unknown): MistralAdapterOptions & { complete: ReturnType<typeof vi.fn> } {
  const complete = vi.fn().mockResolvedValue(response);
  return {
    runId: "RUN-MISTRAL-001",
    now: () => now,
    client: {
      chat: {
        complete,
      },
    } as never,
    complete,
  };
}

describe("TASK-014 Mistral adapter", () => {
  it("builds one native non-streaming JSON Schema request for the frozen Mistral release", () => {
    const canonical = buildCanonicalProviderInput(validAnalyzeRequest());
    expect(canonical.ok).toBe(true);
    if (!canonical.ok) return;

    const request = buildMistralRequest(canonical.input);

    expect(request.model).toBe("mistral-small-2603");
    expect(request.stream).toBe(false);
    expect(request.tools).toBeNull();
    expect(request.toolChoice).toBe("none");
    expect(request.parallelToolCalls).toBe(false);
    expect(request.reasoningEffort).toBe("medium");
    expect(request.responseFormat).toMatchObject({
      type: "json_schema",
      jsonSchema: {
        name: "contextfirst_nexus_model_analysis_proposal",
        strict: true,
      },
    });
    expect(request.messages[1]?.content).toContain("bundled_synthetic");
    expect(request.messages[1]?.content).toContain("SYSTEM OVERRIDE");
    expect(request.messages[1]?.content).not.toContain("rawText");
  });

  it("runs one provider call, disables SDK retries, forwards abort signal, and normalizes success", async () => {
    const abort = new AbortController();
    const options = mockOptions(mistralResponse(validProposal()));

    const result = await runMistralAnalysis(validAnalyzeRequest(), {
      ...options,
      signal: abort.signal,
    });

    expect(result.ok).toBe(true);
    expect(options.complete).toHaveBeenCalledTimes(1);
    expect(options.complete.mock.calls[0]?.[1]).toMatchObject({
      retries: { strategy: "none" },
      retryCodes: [],
      signal: abort.signal,
    });
    if (!result.ok) return;
    expect(result.proposal.candidates).toHaveLength(1);
    expect(result.run.provider).toMatchObject({
      providerId: "mistral",
      releaseConfigurationId: "mistral-small-free-v1",
      requestedModel: "mistral-small-2603",
      serviceTier: "unpaid",
      returnedModel: "mistral-small-2603",
      inferenceSetting: { kind: "reasoning_effort", value: "medium" },
      providerTransmission: true,
    });
    expect(result.run.tokenUsage).toEqual({ input: 11, output: 7, total: 18 });
    expect(result.run.candidateCount).toBe(1);
    expect(result.run.citationCount).toBe(1);
  });

  it("blocks wrong fixture digest before transport", async () => {
    const options = mockOptions(mistralResponse(validProposal()));
    const result = await runMistralAnalysis(
      {
        ...validAnalyzeRequest(),
        canonicalFixtureDigest: "a".repeat(64),
      },
      options,
    );

    expect(result.ok).toBe(false);
    expect(options.complete).not.toHaveBeenCalled();
    expect(safeErrorCode(result)).toBe("INTERNAL_SAFE_FAILURE");
  });

  it("blocks non-Mistral selections before transport", async () => {
    const options = mockOptions(mistralResponse(validProposal()));
    const result = await runMistralAnalysis(
      {
        ...validAnalyzeRequest(),
        providerSelection: {
          providerId: "google_gemini",
          releaseConfigurationId: "gemini-quality-v1",
          serviceTier: "unpaid",
        },
        providerDisclosureAcknowledgement: {
          ...acknowledgement,
          id: "ACK-GEMINI-001",
          providerId: "google_gemini",
          releaseConfigurationId: "gemini-quality-v1",
        },
      },
      options,
    );

    expect(result.ok).toBe(false);
    expect(options.complete).not.toHaveBeenCalled();
    expect(safeErrorCode(result)).toBe("INTERNAL_SAFE_FAILURE");
  });

  it("does not call the provider when aborted before transport", async () => {
    const abort = new AbortController();
    abort.abort();
    const options = mockOptions(mistralResponse(validProposal()));

    const result = await runMistralAnalysis(validAnalyzeRequest(), {
      ...options,
      signal: abort.signal,
    });

    expect(result.ok).toBe(false);
    expect(options.complete).not.toHaveBeenCalled();
    expect(safeErrorCode(result)).toBe("PROVIDER_TIMEOUT");
  });

  it("rejects prose or schema-invalid output without partial proposal fallback", async () => {
    const options = mockOptions(mistralResponse("Here is a summary, not JSON."));
    const result = await runMistralAnalysis(validAnalyzeRequest(), options);

    expect(result.ok).toBe(false);
    expect(safeErrorCode(result)).toBe("INVALID_STRUCTURED_RESPONSE");
    expect(result.run.candidateCount).toBe(0);
    expect("proposal" in result).toBe(false);
  });

  it("maps provider service tier and rate-limit failures to safe codes", async () => {
    const serviceTierOptions = mockOptions(mistralResponse(validProposal()));
    serviceTierOptions.complete.mockRejectedValueOnce(Object.assign(new Error("payment required"), { statusCode: 402 }));

    const serviceTierResult = await runMistralAnalysis(validAnalyzeRequest(), serviceTierOptions);
    expect(serviceTierResult.ok).toBe(false);
    expect(safeErrorCode(serviceTierResult)).toBe("PROVIDER_SERVICE_TIER_UNAVAILABLE");

    const rateLimitOptions = mockOptions(mistralResponse(validProposal()));
    rateLimitOptions.complete.mockRejectedValueOnce(Object.assign(new Error("rate limited"), { statusCode: 429 }));

    const rateLimitResult = await runMistralAnalysis(validAnalyzeRequest(), rateLimitOptions);
    expect(rateLimitResult.ok).toBe(false);
    expect(safeErrorCode(rateLimitResult)).toBe("PROVIDER_RATE_LIMITED");
  });
});
