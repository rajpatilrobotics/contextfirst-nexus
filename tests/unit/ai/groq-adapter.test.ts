import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildCanonicalProviderInput } from "../../../lib/ai/server";
import {
  buildGroqRequest,
  runGroqAnalysis,
} from "../../../lib/ai/server/adapters/groq";
import type { AnalyzeRequest } from "../../../lib/contracts";

const now = "2026-07-26T00:00:00.000Z";

function validRequest(): AnalyzeRequest {
  return {
    schemaVersion: "1.0.0",
    caseId: "CFN-DEMO-001",
    fixtureVersion: "1.0.0",
    canonicalFixtureDigest:
      "ede4457873700cc4bce1bb5fad29c89a4e25d2e6ca7ccd33c323a2ce8ac5809c",
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
      providerId: "groq",
      releaseConfigurationId: "groq-oss-20b-free-v1",
      serviceTier: "unpaid",
    },
    providerDisclosureAcknowledgement: {
      id: "ACK-GROQ-001",
      schemaVersion: "1.0.0",
      providerId: "groq",
      releaseConfigurationId: "groq-oss-20b-free-v1",
      serviceTier: "unpaid",
      disclosureVersion: "1.0.0",
      dataFlowAcknowledged: true,
      retentionAndTrainingUseAcknowledged: true,
      serviceTierAcknowledged: true,
      acknowledgedAt: now,
    },
    selectedSegmentIds: ["D05-P1-S02"],
    maskApprovals: [],
  };
}

function canonicalInput() {
  const canonical = buildCanonicalProviderInput(validRequest());
  if (!canonical.ok) throw new Error(canonical.error.code);
  return canonical.input;
}

const proposal = {
  candidates: [
    {
      proposedId: "CAND-GROQ-001",
      kind: "review_lane_item",
      lane: "trafficking_indicators",
      title: "Movement detail requires review",
      proposedText: "The source describes a movement detail for practitioner review.",
      assertionMode: "positive_proposition",
      reviewQuestion: "How should this exact source detail be reviewed?",
      citations: [
        {
          segmentId: "D05-P1-S02",
          quotedText: "Maya K. travelled",
          relationship: "supports",
          evidenceNature: "reported_or_alleged_in_source",
        },
      ],
      unknowns: [],
    },
  ],
};

describe("Groq native analysis adapter", () => {
  it("builds one stateless strict Chat Completions schema request", () => {
    const request = buildGroqRequest(canonicalInput());

    expect(request).toMatchObject({
      model: "openai/gpt-oss-20b",
      reasoning_effort: "low",
      include_reasoning: false,
      max_completion_tokens: 4096,
      response_format: {
        type: "json_schema",
        json_schema: { strict: true },
      },
      stream: false,
    });
    expect(request.messages).toHaveLength(2);
    expect(request.messages[0].content).toContain(
      "return at most 4 candidates",
    );
    expect(request.messages[0].content).toContain(
      "at most 2 short exact citations",
    );
    expect(JSON.stringify(request)).not.toContain("apiKey");
  });

  it("parses a valid structured response and records usage", async () => {
    const transport = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: "openai/gpt-oss-20b",
          choices: [
            {
              finish_reason: "stop",
              message: { content: JSON.stringify(proposal) },
            },
          ],
          usage: {
            prompt_tokens: 20,
            completion_tokens: 10,
            total_tokens: 30,
          },
        }),
        { status: 200 },
      ),
    );

    const result = await runGroqAnalysis(canonicalInput(), {
      apiKey: "test-only",
      fetch: transport,
    });

    expect(result).toMatchObject({
      ok: true,
      provenance: {
        providerId: "groq",
        releaseConfigurationId: "groq-oss-20b-free-v1",
        returnedModel: "openai/gpt-oss-20b",
      },
      tokenUsage: { input: 20, output: 10, total: 30 },
    });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("fails closed without a key and never calls transport", async () => {
    const transport = vi.fn();
    const result = await runGroqAnalysis(canonicalInput(), {
      apiKey: "",
      fetch: transport,
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        classification: "provider_authentication_failed",
      },
    });
    expect(transport).not.toHaveBeenCalled();
  });

  it("does not advance unsafe or malformed content inside the adapter", async () => {
    const transport = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: "openai/gpt-oss-20b",
          choices: [
            {
              finish_reason: "stop",
              message: { content: "not-json" },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await runGroqAnalysis(canonicalInput(), {
      apiKey: "test-only",
      fetch: transport,
    });

    expect(result).toMatchObject({
      ok: false,
      failure: { classification: "invalid_structured_response" },
    });
  });

  it("fails closed on a truncated completion before parsing content", async () => {
    const result = await runGroqAnalysis(canonicalInput(), {
      apiKey: "test-only",
      fetch: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            model: "openai/gpt-oss-20b",
            choices: [
              {
                finish_reason: "length",
                message: { content: JSON.stringify(proposal) },
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    });

    expect(result).toMatchObject({
      ok: false,
      failure: { classification: "invalid_structured_response" },
    });
  });

  it("treats an unknown transport outcome as terminal timeout state", async () => {
    const result = await runGroqAnalysis(canonicalInput(), {
      apiKey: "test-only",
      fetch: vi.fn().mockRejectedValue(new TypeError("network failed")),
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        classification: "provider_timeout",
      },
    });
  });

  it("classifies a confirmed 503 as provider unavailability", async () => {
    const result = await runGroqAnalysis(canonicalInput(), {
      apiKey: "test-only",
      fetch: vi.fn().mockResolvedValue(new Response("", { status: 503 })),
    });

    expect(result).toMatchObject({
      ok: false,
      failure: { classification: "provider_unavailable" },
    });
  });

  it("classifies Groq's exact 413 rate-limit code as operational", async () => {
    const result = await runGroqAnalysis(canonicalInput(), {
      apiKey: "test-only",
      fetch: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "rate_limit_exceeded",
              message: "not exposed to the application",
            },
          }),
          { status: 413 },
        ),
      ),
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        classification: "provider_rate_limited",
        retryableSameProvider: true,
      },
    });
  });

  it("keeps an unrelated 413 fail closed", async () => {
    const result = await runGroqAnalysis(canonicalInput(), {
      apiKey: "test-only",
      fetch: vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "payload_too_large",
              message: "not exposed to the application",
            },
          }),
          { status: 413 },
        ),
      ),
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        classification: "internal_safe_failure",
        retryableSameProvider: false,
      },
    });
  });
});
