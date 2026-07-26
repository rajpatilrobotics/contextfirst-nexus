import { NextResponse, type NextRequest } from "next/server";

import { BrowserAnalyzeResponseSchema } from "../../../../lib/contracts";
import { analyzeDynamicBrowserCase } from "../../../../lib/ai/server/dynamic-orchestrator";
import { isLiveAnalysisEnabled } from "../../../../lib/ai/server/live-analysis-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 160_000;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return json(rejected("INVALID_REQUEST", "The request origin was rejected."), 403);
  }

  const bodyText = await request.text();
  if (Buffer.byteLength(bodyText, "utf8") > MAX_BODY_BYTES) {
    return json(
      rejected("PAYLOAD_TOO_LARGE", "The approved analysis input is too large."),
      413,
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return json(rejected("INVALID_REQUEST", "The request was not valid JSON."), 400);
  }

  const result = await analyzeDynamicBrowserCase(body, {
    liveAnalysisEnabled: isLiveAnalysisEnabled(),
  });
  const status =
    result.outcome === "succeeded" || result.outcome === "failed"
      ? 200
      : result.outcome === "service_unavailable"
        ? 503
        : 400;
  return json(result, status);
}

function rejected(
  code: "INVALID_REQUEST" | "PAYLOAD_TOO_LARGE",
  userMessage: string,
) {
  return BrowserAnalyzeResponseSchema.parse({
    schemaVersion: "1.0.0",
    outcome: "rejected_before_run",
    run: null,
    candidates: [],
    citations: [],
    quarantined: [],
    attempts: [],
    error: { code, userMessage },
  });
}

function json(value: unknown, status: number) {
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
