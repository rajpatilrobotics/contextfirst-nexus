import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildCanonicalProviderInput } from "../../../lib/ai/server";
import {
  analyzeWithGemini,
  type GeminiTransport,
} from "../../../lib/ai/server/adapters/gemini";

const fixtureDigest = "ede4457873700cc4bce1bb5fad29c89a4e25d2e6ca7ccd33c323a2ce8ac5809c";

function validRequest() {
  return {
    schemaVersion: "1.0.0",
    caseId: "CFN-DEMO-001",
    fixtureVersion: "1.0.0",
    canonicalFixtureDigest: fixtureDigest,
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
      providerId: "google_gemini",
      releaseConfigurationId: "gemini-quality-v1",
      serviceTier: "unpaid",
    },
    providerDisclosureAcknowledgement: {
      id: "ACK-GEMINI-001",
      schemaVersion: "1.0.0",
      providerId: "google_gemini",
      releaseConfigurationId: "gemini-quality-v1",
      serviceTier: "unpaid",
      disclosureVersion: "1.0.0",
      dataFlowAcknowledged: true,
      retentionAndTrainingUseAcknowledged: true,
      serviceTierAcknowledged: true,
      acknowledgedAt: "2026-07-16T00:00:00.000Z",
    },
    selectedSegmentIds: ["D07-P2-S03"],
    maskApprovals: [],
  } as const;
}

function canonicalInput() {
  const result = buildCanonicalProviderInput(validRequest());
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("test fixture did not build");
  return result.input;
}

function proposal() {
  return {
    candidates: [
      {
        proposedId: "MODEL-CANDIDATE-001",
        kind: "review_lane_item",
        lane: "trafficking_indicators",
        title: "Review source-grounded indicator",
        proposedText: "Review the documented indicator.",
        assertionMode: "positive_proposition",
        reviewQuestion: "What should the practitioner verify?",
        citations: [
          {
            segmentId: "D07-P2-S03",
            quotedText: "[REDACTED]",
            relationship: "supports",
            evidenceNature: "documented_in_source",
          },
        ],
        unknowns: ["The source does not establish a legal conclusion."],
      },
    ],
  };
}

function transport(response: unknown) {
  return {
    generateContent: vi.fn<GeminiTransport["generateContent"]>().mockResolvedValue(response as never),
  };
}

describe("Gemini analysis adapter", () => {
  it("makes one native stateless strict structured request with the approved fixture only", async () => {
    const client = transport({
      text: JSON.stringify(proposal()),
      modelVersion: "gemini-3.5-flash-001",
      usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 21, totalTokenCount: 33 },
    });

    const result = await analyzeWithGemini(canonicalInput(), { client });
    expect(result.ok).toBe(true);
    expect(client.generateContent).toHaveBeenCalledTimes(1);
    const request = client.generateContent.mock.calls[0]?.[0];
    expect(request?.model).toBe("gemini-3.5-flash");
    expect(request?.config.thinkingConfig).toEqual({ thinkingLevel: "medium" });
    expect(request?.config.responseMimeType).toBe("application/json");
    expect(request?.config.responseJsonSchema).toBeDefined();
    expect(request?.config).not.toHaveProperty("tools");
    expect(request?.config).not.toHaveProperty("cachedContent");
    expect(request?.contents[0]?.parts[0]?.text).toContain('"dataOrigin":"bundled_synthetic"');
    expect(request?.contents[0]?.parts[0]?.text).not.toContain("rawText");
    expect(result.ok && result.provenance).toMatchObject({
      providerId: "google_gemini",
      releaseConfigurationId: "gemini-quality-v1",
      requestedModel: "gemini-3.5-flash",
      serviceTier: "unpaid",
      returnedModel: "gemini-3.5-flash-001",
      providerTransmission: true,
    });
    expect(result.ok && result.tokenUsage).toEqual({ input: 12, output: 21, total: 33 });
  });

  it("blocks a forged fixture binding before transport", async () => {
    const client = transport({ text: JSON.stringify(proposal()) });
    const input = canonicalInput();
    const forged = {
      ...input,
      fixtureBinding: { ...input.fixtureBinding, canonicalFixtureDigest: "a".repeat(64) },
    } as typeof input;

    const result = await analyzeWithGemini(forged, { client });
    expect(result).toMatchObject({ ok: false, error: { code: "PROVIDER_DATA_POLICY_BLOCKED" } });
    expect(client.generateContent).not.toHaveBeenCalled();
  });

  it("does not call Gemini for a pre-aborted request", async () => {
    const client = transport({ text: JSON.stringify(proposal()) });
    const controller = new AbortController();
    controller.abort();

    const result = await analyzeWithGemini(canonicalInput(), { client, signal: controller.signal });
    expect(result).toMatchObject({ ok: false, error: { code: "PROVIDER_TIMEOUT" } });
    expect(client.generateContent).not.toHaveBeenCalled();
  });

  it("rejects prose or invalid structured output without a partial proposal", async () => {
    const client = transport({ text: "Here is the analysis." });
    const result = await analyzeWithGemini(canonicalInput(), { client });

    expect(result).toMatchObject({ ok: false, error: { code: "INVALID_STRUCTURED_RESPONSE" } });
    expect(result).not.toHaveProperty("proposal");
  });

  it.each([
    [401, "PROVIDER_AUTHENTICATION_FAILED"],
    [429, "PROVIDER_RATE_LIMITED"],
    [503, "PROVIDER_UNAVAILABLE"],
  ])("maps provider status %s to a safe error", async (status, code) => {
    const client = {
      generateContent: vi.fn<GeminiTransport["generateContent"]>().mockRejectedValue({ status }),
    };

    const result = await analyzeWithGemini(canonicalInput(), { client });
    expect(result).toMatchObject({ ok: false, error: { code } });
    expect(JSON.stringify(result)).not.toContain(String(status));
  });

  it("maps an in-flight abort to timeout without retrying", async () => {
    const controller = new AbortController();
    const client = {
      generateContent: vi.fn<GeminiTransport["generateContent"]>(() =>
        new Promise((_, reject) => {
          controller.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
      ),
    };

    const pending = analyzeWithGemini(canonicalInput(), { client, signal: controller.signal });
    controller.abort();
    const result = await pending;

    expect(result).toMatchObject({ ok: false, error: { code: "PROVIDER_TIMEOUT" } });
    expect(client.generateContent).toHaveBeenCalledTimes(1);
  });
});
