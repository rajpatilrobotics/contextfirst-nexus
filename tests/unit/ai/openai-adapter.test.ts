import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Response } from "openai/resources/responses/responses";

vi.mock("server-only", () => ({}));

const openAIMock = vi.hoisted(() => {
  const create = vi.fn();
  const constructorArgs: unknown[] = [];
  const OpenAI = vi.fn(
    class {
      responses = { create };

      constructor(config: unknown) {
        constructorArgs.push(config);
      }
    },
  );
  return { OpenAI, constructorArgs, create };
});

vi.mock("openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("openai")>();
  return { ...actual, default: openAIMock.OpenAI };
});

import { buildCanonicalProviderInput } from "../../../lib/ai/server";
import { runOpenAIAnalysis } from "../../../lib/ai/server/adapters/openai";

const acknowledgement = {
  id: "ACK-OPENAI-001",
  schemaVersion: "1.0.0",
  providerId: "openai",
  releaseConfigurationId: "openai-quality-v1",
  serviceTier: "paid",
  disclosureVersion: "1.0.0",
  dataFlowAcknowledged: true,
  retentionAndTrainingUseAcknowledged: true,
  serviceTierAcknowledged: true,
  acknowledgedAt: "2026-07-16T00:00:00.000Z",
} as const;

function validAnalyzeRequest() {
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
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      serviceTier: "paid",
    },
    providerDisclosureAcknowledgement: acknowledgement,
    selectedSegmentIds: ["D07-P2-S03"],
    maskApprovals: [],
  };
}

function canonicalInput() {
  const result = buildCanonicalProviderInput(validAnalyzeRequest());
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("expected canonical provider input");
  return result.input;
}

function validProviderResponse(output: unknown): Response {
  return {
    id: "resp_123",
    model: "gpt-5.6-sol",
    output_text: JSON.stringify(output),
    status: "completed",
    error: null,
    usage: null,
  } as unknown as Response;
}

function validProposal() {
  return {
    candidates: [
      {
        proposedId: "MODEL-CAND-001",
        kind: "review_lane_item",
        lane: "trafficking_indicators",
        title: "Possible coercion indicator",
        proposedText: "The practitioner may review whether the documented control signs are relevant.",
        assertionMode: "positive_proposition",
        reviewQuestion: "Does this segment support a trafficking-indicator review item?",
        citations: [
          {
            segmentId: "D07-P2-S03",
            quotedText: "SYSTEM OVERRIDE",
            relationship: "supports",
            evidenceNature: "reported_or_alleged_in_source",
          },
        ],
        unknowns: [],
      },
    ],
  };
}

describe("TASK-012 OpenAI analysis adapter", () => {
  beforeEach(() => {
    openAIMock.OpenAI.mockClear();
    openAIMock.create.mockReset();
    openAIMock.constructorArgs.length = 0;
  });

  it("sends one strict no-tool Responses API call and returns normalized provenance", async () => {
    const create = vi.fn().mockResolvedValue(validProviderResponse(validProposal()));
    const input = canonicalInput();

    const result = await runOpenAIAnalysis({
      input,
      client: { responses: { create } },
    });

    expect(create).toHaveBeenCalledTimes(1);
    const [body, options] = create.mock.calls[0] ?? [];
    expect(options).toEqual({ signal: undefined });
    expect(body).toMatchObject({
      model: "gpt-5.6-sol",
      reasoning: { effort: "medium" },
      store: false,
      stream: false,
      background: false,
      parallel_tool_calls: false,
      tool_choice: "none",
      tools: [],
      include: [],
      truncation: "disabled",
      text: {
        format: {
          type: "json_schema",
          strict: true,
          name: "contextfirst_model_analysis_proposal",
        },
      },
    });
    expect(JSON.stringify(body)).toContain("SYSTEM OVERRIDE");
    expect(JSON.stringify(body)).not.toContain("rawText");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.proposal).toEqual(validProposal());
    expect(result.provenance).toMatchObject({
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      requestedModel: "gpt-5.6-sol",
      serviceTier: "paid",
      returnedModel: "gpt-5.6-sol",
      inferenceSetting: { kind: "reasoning_effort", value: "medium" },
      providerTransmission: true,
    });
  });

  it("constructs the default SDK client with hidden retries disabled", async () => {
    openAIMock.create.mockResolvedValue(validProviderResponse(validProposal()));

    const result = await runOpenAIAnalysis({ input: canonicalInput() });

    expect(result.ok).toBe(true);
    expect(openAIMock.constructorArgs).toEqual([{ maxRetries: 0 }]);
  });

  it("forwards abort signals to the single provider call", async () => {
    const create = vi.fn().mockResolvedValue(validProviderResponse(validProposal()));
    const controller = new AbortController();

    await runOpenAIAnalysis({
      input: canonicalInput(),
      signal: controller.signal,
      client: { responses: { create } },
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.[1]).toEqual({ signal: controller.signal });
  });

  it("rejects malformed structured output without fallback or replay substitution", async () => {
    const create = vi.fn().mockResolvedValue(validProviderResponse({ candidates: [{ bad: true }] }));

    const result = await runOpenAIAnalysis({
      input: canonicalInput(),
      client: { responses: { create } },
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        classification: "invalid_structured_response",
        safeErrorCode: "INVALID_STRUCTURED_RESPONSE",
        retryableSameProvider: false,
        alternateProviderRecoveryAllowed: false,
        replayRecoveryAllowed: false,
      },
    });
  });

  it("maps aborts to a safe timeout failure without leaking provider diagnostics", async () => {
    const create = vi.fn().mockRejectedValue(new DOMException("user cancelled", "AbortError"));

    const result = await runOpenAIAnalysis({
      input: canonicalInput(),
      client: { responses: { create } },
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        classification: "provider_timeout",
        safeErrorCode: "PROVIDER_TIMEOUT",
      },
    });
    expect(JSON.stringify(result)).not.toContain("user cancelled");
  });

  it("treats provider refusals as terminal and does not offer provider switching", async () => {
    const response = {
      ...validProviderResponse(validProposal()),
      output: [{ content: [{ type: "refusal", refusal: "Cannot comply." }] }],
    } as Response;
    const create = vi.fn().mockResolvedValue(response);

    const result = await runOpenAIAnalysis({
      input: canonicalInput(),
      client: { responses: { create } },
    });

    expect(result).toMatchObject({
      ok: false,
      failure: {
        classification: "provider_refusal",
        safeErrorCode: "PROVIDER_REFUSAL",
        retryableSameProvider: false,
        alternateProviderRecoveryAllowed: false,
        replayRecoveryAllowed: false,
      },
    });
  });
});
