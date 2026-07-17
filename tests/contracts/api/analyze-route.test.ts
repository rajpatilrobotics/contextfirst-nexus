import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const { analyzeMock } = vi.hoisted(() => ({
  analyzeMock: vi.fn(),
}));

vi.mock("../../../lib/ai/server/orchestrator", () => ({
  analyze: analyzeMock,
}));

import { GET, POST } from "../../../app/api/analyze/route";
import { getTrustPageData } from "../../../features/trust/trust-data.server";

const ORIGINAL_SERVER_FLAG = process.env.ENABLE_LIVE_ANALYSIS;
const ORIGINAL_PUBLIC_FLAG = process.env.NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS;

const selection = {
  providerId: "openai",
  releaseConfigurationId: "openai-quality-v1",
  serviceTier: "paid",
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
    providerSelection: selection,
    providerDisclosureAcknowledgement: {
      id: "ACK-OPENAI-001",
      schemaVersion: "1.0.0",
      ...selection,
      disclosureVersion: "1.0.0",
      dataFlowAcknowledged: true,
      retentionAndTrainingUseAcknowledged: true,
      serviceTierAcknowledged: true,
      acknowledgedAt: "2026-07-16T00:00:00.000Z",
    },
    selectedSegmentIds: ["D05-P1-S02"],
    maskApprovals: [],
  };
}

function restoreEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }
  process.env[name] = value;
}

beforeEach(() => {
  process.env.ENABLE_LIVE_ANALYSIS = "false";
  delete process.env.NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS;
  analyzeMock.mockReset();
});

afterEach(() => {
  restoreEnvironmentVariable("ENABLE_LIVE_ANALYSIS", ORIGINAL_SERVER_FLAG);
  restoreEnvironmentVariable("NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS", ORIGINAL_PUBLIC_FLAG);
});

describe("TASK-038 /api/analyze contract", () => {
  it("reports disabled live availability while preserving trusted local replay", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body.schemaVersion).toBe("1.0.0");
    expect(body.liveAnalysisEnabled).toBe(false);
    expect(body.replayEnabled).toBe(true);
    expect(body.options.map((option: { providerId: string }) => option.providerId)).toEqual([
      "openai",
      "google_gemini",
      "mistral",
      "local_replay",
    ]);
    expect(
      body.options.slice(0, 3).map((option: { availabilityStatus: string }) => option.availabilityStatus),
    ).toEqual(["disabled", "disabled", "disabled"]);
    expect(body.options.slice(0, 3).every((option: { selectable: boolean }) => !option.selectable)).toBe(
      true,
    );
    expect(body.options[3]).toMatchObject({
      providerId: "local_replay",
      releaseConfigurationId: "prepared-replay-v1",
      mode: "deterministic_replay",
      providerTransmission: false,
      availabilityStatus: "available",
      selectable: true,
    });
    expect(JSON.stringify(body)).not.toContain("apiKey");
  });

  it("does not allow the public client flag to enable a server-disabled GET", async () => {
    process.env.NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS = "true";

    const response = await GET();
    const body = await response.json();

    expect(body.liveAnalysisEnabled).toBe(false);
    expect(body.options.slice(0, 3).every((option: { selectable: boolean }) => !option.selectable)).toBe(
      true,
    );
    expect(body.options[3].selectable).toBe(true);
  });

  it("keeps Trust correlated with the API through the shared server policy", async () => {
    process.env.NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS = "true";

    const apiBody = await (await GET()).json();
    const trustData = getTrustPageData();

    expect(trustData.systemCard.liveAnalysisEnabled).toBe(apiBody.liveAnalysisEnabled);
    expect(trustData.systemCard.providers).toEqual(apiBody.options);
  });

  it("rejects cross-origin POST before provider work", async () => {
    const request = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      headers: { origin: "http://evil.test" },
      body: JSON.stringify(validAnalyzeRequest()),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.outcome).toBe("rejected_before_run");
    expect(body.run).toBeNull();
    expect(body.error.failedStage).toBe("same_origin");
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies with the safe preflight shape", async () => {
    const request = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: JSON.stringify({ padding: "x".repeat(1_000_001) }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.outcome).toBe("rejected_before_run");
    expect(body.candidates).toEqual([]);
    expect(body.citations).toEqual([]);
    expect(body.quarantined).toEqual([]);
    expect(body.error.code).toBe("PAYLOAD_TOO_LARGE");
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON before applying the live-analysis policy", async () => {
    const request = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: "{",
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatchObject({
      code: "INVALID_REQUEST",
      failedStage: "json_parse",
    });
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("rejects disabled POST before orchestration or provider-facing work", async () => {
    const request = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: JSON.stringify(validAnalyzeRequest()),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      schemaVersion: "1.0.0",
      outcome: "rejected_before_run",
      run: null,
      candidates: [],
      citations: [],
      quarantined: [],
      error: {
        schemaVersion: "1.0.0",
        requestId: "REQ-LOCAL-PREFLIGHT",
        userMessage: "Live analysis is currently disabled.",
        failedStage: "live_analysis_policy",
        code: "LIVE_ANALYSIS_DISABLED",
        retryable: false,
        failedRunId: null,
        providerContext: null,
        failureClassification: null,
        recoveryOptions: [],
      },
    });
    expect(analyzeMock).not.toHaveBeenCalled();
  });

  it("preserves enabled-policy orchestration behavior for the exact server value", async () => {
    process.env.ENABLE_LIVE_ANALYSIS = "true";
    analyzeMock.mockResolvedValue({
      schemaVersion: "1.0.0",
      outcome: "rejected_before_run",
      run: null,
      candidates: [],
      citations: [],
      quarantined: [],
      error: {
        schemaVersion: "1.0.0",
        requestId: "REQ-LOCAL-PREFLIGHT",
        userMessage: "The analysis request could not be validated.",
        failedStage: "canonical_request",
        code: "INVALID_REQUEST",
        retryable: false,
        failedRunId: null,
        providerContext: null,
        failureClassification: null,
        recoveryOptions: [],
      },
    });
    const availability = await (await GET()).json();
    const body = validAnalyzeRequest();
    const request = new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(availability.liveAnalysisEnabled).toBe(true);
    expect(analyzeMock).toHaveBeenCalledOnce();
    expect(analyzeMock).toHaveBeenCalledWith(body);
  });
});
