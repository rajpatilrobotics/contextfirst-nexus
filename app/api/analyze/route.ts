import { NextResponse, type NextRequest } from "next/server";

import {
  AnalyzeAvailabilityResponseSchema,
  AnalyzeResponseSchema,
} from "../../../lib/contracts";
import { buildAnalyzeAvailabilityResponse } from "../../../lib/ai/server/registry";
import { analyze, type AnalyzeResult } from "../../../lib/ai/server/orchestrator";
import { makePreflightError } from "../../../lib/ai/server/errors";
import { isLiveAnalysisEnabled } from "../../../lib/ai/server/live-analysis-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 1_000_000;

export async function GET() {
  return json(
    AnalyzeAvailabilityResponseSchema.parse(
      buildAnalyzeAvailabilityResponse({ liveAnalysisEnabled: isLiveAnalysisEnabled() }),
    ),
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return json(rejected(makePreflightError("INVALID_REQUEST", "same_origin")), 403);
  }

  const bodyText = await request.text();
  if (Buffer.byteLength(bodyText, "utf8") > MAX_BODY_BYTES) {
    return json(rejected(makePreflightError("PAYLOAD_TOO_LARGE", "body_limit")), 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return json(rejected(makePreflightError("INVALID_REQUEST", "json_parse")), 400);
  }

  if (!isLiveAnalysisEnabled()) {
    return json(
      rejected(makePreflightError("LIVE_ANALYSIS_DISABLED", "live_analysis_policy")),
      400,
    );
  }

  const result = await analyze(body);
  return json(result, result.outcome === "rejected_before_run" ? 400 : 200);
}

function rejected(error: ReturnType<typeof makePreflightError>): AnalyzeResult {
  const response: AnalyzeResult = {
    schemaVersion: "1.0.0",
    outcome: "rejected_before_run",
    run: null,
    candidates: [],
    citations: [],
    quarantined: [],
    error,
  };
  AnalyzeResponseSchema.parse(response);
  return response;
}

function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
  });
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
