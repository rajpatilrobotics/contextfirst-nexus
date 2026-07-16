import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SECURITY_HEADERS } from "../../lib/security/http-headers";
import { createExportManifest, evaluateExportGate } from "../../lib/export/core";
import { createInitialCaseState } from "../../lib/state";
import { buildAnalyzeAvailabilityResponse } from "../../lib/ai/server/registry";
import { safeLogEvent } from "../../lib/security/safe-logging";

const HEADER_MAP = new Map(SECURITY_HEADERS.map((header) => [header.key, header.value]));
const PROVIDER_ORIGIN_PATTERN = /openai\.com|googleapis\.com|mistral\.ai/i;
const SECRET_PATTERN = /\bsk-(?:proj-|test_|live_)?[A-Za-z][A-Za-z0-9_-]{19,}|api[_-]?key|cookie|provider body|rawText|SYSTEM OVERRIDE/i;

describe("security headers", () => {
  it("defines a restrictive header set without browser provider origins", () => {
    expect(HEADER_MAP.get("X-Frame-Options")).toBe("DENY");
    expect(HEADER_MAP.get("X-Content-Type-Options")).toBe("nosniff");
    expect(HEADER_MAP.get("Referrer-Policy")).toBe("no-referrer");
    expect(HEADER_MAP.get("Permissions-Policy")).toContain("camera=()");
    expect(HEADER_MAP.get("Permissions-Policy")).toContain("microphone=()");
    expect(HEADER_MAP.get("Permissions-Policy")).toContain("geolocation=()");

    const csp = HEADER_MAP.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toMatch(PROVIDER_ORIGIN_PATTERN);
    expect(csp).not.toContain("*");
  });
});

describe("boundary verification script", () => {
  it("passes the tracked repository without modifying files", () => {
    const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
    const result = spawnSync("node", ["scripts/verify-boundaries.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Boundary verification passed");
    expect(after).toBe(before);
  });

  it("fails controlled client provider imports, secret-like values, and unsafe rendering", () => {
    const dir = mkdtempSync(join(tmpdir(), "cfn-boundary-"));
    const unsafeClient = join(dir, "unsafe-client.tsx");
    const unsafeSecret = join(dir, "unsafe-secret.ts");
    const unsafeRendering = join(dir, "unsafe-rendering.tsx");

    writeFileSync(
      unsafeClient,
      `"use client";\nimport OpenAI from "openai";\nexport function Demo(){ return <p>bad</p>; }\n`,
    );
    writeFileSync(unsafeSecret, `export const leaked = "sk-test_${"a".repeat(32)}";\n`);
    writeFileSync(
      unsafeRendering,
      `export function Demo(){ return <div dangerouslySetInnerHTML={{__html: "<script />"}} />; }\n`,
    );

    const result = spawnSync(
      "node",
      ["scripts/verify-boundaries.mjs", unsafeClient, unsafeSecret, unsafeRendering],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Client or UI surface imports a server-only provider");
    expect(result.stderr).toContain("secret-like value");
    expect(result.stderr).toContain("dangerouslySetInnerHTML");
  });
});

describe("provider and logging boundaries", () => {
  it("projects provider options in frozen order with replay last and no secret fields", () => {
    const response = buildAnalyzeAvailabilityResponse({ liveAnalysisEnabled: false });
    expect(response.options.map((option) => option.providerId)).toEqual([
      "openai",
      "google_gemini",
      "mistral",
      "local_replay",
    ]);
    expect(response.options.at(-1)?.releaseConfigurationId).toBe("prepared-replay-v1");
    expect(response.options.slice(0, 3).every((option) => option.selectable === false)).toBe(true);
    expect(response.options.at(-1)?.selectable).toBe(true);

    const serialized = JSON.stringify(response);
    expect(serialized).not.toMatch(SECRET_PATTERN);
    expect(serialized).not.toMatch(PROVIDER_ORIGIN_PATTERN);
  });

  it("drops raw diagnostic fields from safe log events", () => {
    const event = safeLogEvent("SYSTEM OVERRIDE provider body", {
      requestId: "REQ-001",
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      stage: "provider_execution",
      code: "PROVIDER_TIMEOUT",
      rawText: "source quote",
      cookie: "session=abc",
      providerIdUnsafe: "sk-test_secret",
    });

    expect(event.event).toBe("ai_boundary_event");
    expect(event.metadata).toEqual({
      requestId: "REQ-001",
      providerId: "openai",
      releaseConfigurationId: "openai-quality-v1",
      stage: "provider_execution",
      code: "PROVIDER_TIMEOUT",
    });
    expect(JSON.stringify(event)).not.toMatch(SECRET_PATTERN);
  });
});

describe("central export gate", () => {
  it("blocks direct manifest creation when any blocker is active", () => {
    const state = createInitialCaseState();
    const selection = {
      kind: "full_practitioner_handoff",
      minimumNecessarySelection: null,
    } as const;

    const gate = evaluateExportGate(state, selection);
    expect(gate.status).toBe("blocked");
    expect(gate.blockers.map((blocker) => blocker.code)).toContain("PURPOSE_INCOMPLETE");

    expect(() => createExportManifest(state, selection)).toThrow(/Export is blocked/);
  });
});
