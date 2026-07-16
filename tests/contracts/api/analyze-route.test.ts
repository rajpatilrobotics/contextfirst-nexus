import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { GET, POST } from "../../../app/api/analyze/route";

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

describe("TASK-015 /api/analyze contract", () => {
  it("returns safe availability projections in frozen order", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.schemaVersion).toBe("1.0.0");
    expect(body.options.map((option: { providerId: string }) => option.providerId)).toEqual([
      "openai",
      "google_gemini",
      "mistral",
      "local_replay",
    ]);
    expect(JSON.stringify(body)).not.toContain("apiKey");
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
  });
});
