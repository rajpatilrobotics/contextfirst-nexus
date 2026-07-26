import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  MANAGED_LIVE_PROVIDER_ORDER,
  resolveManagedLiveProviderOrder,
  runManagedProviderChain,
  type ManagedProviderCandidate,
} from "../../../lib/ai/server/managed-routing";

function candidate(
  providerId: ManagedProviderCandidate<string>["providerId"],
  result: Awaited<ReturnType<ManagedProviderCandidate<string>["execute"]>>,
  options: Partial<
    Pick<
      ManagedProviderCandidate<string>,
      "admitted" | "configured" | "dataEligible"
    >
  > = {},
): ManagedProviderCandidate<string> {
  return {
    providerId,
    admitted: true,
    configured: true,
    dataEligible: true,
    execute: vi.fn().mockResolvedValue(result),
    ...options,
  };
}

describe("managed live provider routing", () => {
  it("freezes the approved cost-conscious order", () => {
    expect(MANAGED_LIVE_PROVIDER_ORDER).toEqual([
      "mistral",
      "google_gemini",
      "groq",
      "openai",
    ]);
  });

  it("accepts an exact server-only provider reordering", async () => {
    expect(
      resolveManagedLiveProviderOrder(
        " openai, mistral, google_gemini, groq ",
      ),
    ).toEqual({
      ok: true,
      order: ["openai", "mistral", "google_gemini", "groq"],
      source: "server_environment",
    });

    const mistral = candidate("mistral", {
      ok: true,
      value: "mistral-result",
    });
    const openai = candidate("openai", {
      ok: true,
      value: "openai-result",
    });
    const result = await runManagedProviderChain([mistral, openai], {
      configuredOrder: "openai,mistral,google_gemini,groq",
    });

    expect(result).toMatchObject({
      ok: true,
      providerId: "openai",
      value: "openai-result",
      configurationError: null,
    });
    expect(openai.execute).toHaveBeenCalledTimes(1);
    expect(mistral.execute).not.toHaveBeenCalled();
  });

  it.each([
    "",
    "openai,mistral,google_gemini",
    "openai,mistral,google_gemini,openai",
    "openai,mistral,google_gemini,unknown",
  ])("fails closed for invalid provider order %j", async (configuredOrder) => {
    const openai = candidate("openai", {
      ok: true,
      value: "must-not-run",
    });

    expect(resolveManagedLiveProviderOrder(configuredOrder)).toEqual({
      ok: false,
      reason: "invalid_provider_order",
    });
    const result = await runManagedProviderChain([openai], {
      configuredOrder,
    });

    expect(result).toEqual({
      ok: false,
      terminal: true,
      attempts: [],
      configurationError: "invalid_provider_order",
    });
    expect(openai.execute).not.toHaveBeenCalled();
  });

  it("uses Mistral first and stops immediately after an accepted result", async () => {
    const mistral = candidate("mistral", { ok: true, value: "mistral-result" });
    const gemini = candidate("google_gemini", {
      ok: true,
      value: "gemini-result",
    });

    const result = await runManagedProviderChain([gemini, mistral]);

    expect(result).toMatchObject({
      ok: true,
      providerId: "mistral",
      value: "mistral-result",
    });
    expect(mistral.execute).toHaveBeenCalledTimes(1);
    expect(gemini.execute).not.toHaveBeenCalled();
  });

  it("advances through operational failures without merging outputs", async () => {
    const mistral = candidate("mistral", {
      ok: false,
      classification: "provider_rate_limited",
    });
    const gemini = candidate("google_gemini", {
      ok: false,
      classification: "provider_quota_exhausted",
    });
    const groq = candidate("groq", { ok: true, value: "groq-result" });
    const openai = candidate("openai", {
      ok: true,
      value: "openai-result",
    });

    const result = await runManagedProviderChain([
      openai,
      groq,
      gemini,
      mistral,
    ]);

    expect(result).toMatchObject({
      ok: true,
      providerId: "groq",
      value: "groq-result",
      attempts: [
        {
          providerId: "mistral",
          outcome: "operational_failure",
          failureClassification: "provider_rate_limited",
        },
        {
          providerId: "google_gemini",
          outcome: "operational_failure",
          failureClassification: "provider_quota_exhausted",
        },
        {
          providerId: "groq",
          outcome: "accepted",
          failureClassification: null,
        },
      ],
    });
    expect(openai.execute).not.toHaveBeenCalled();
  });

  it("never calls an unadmitted, data-ineligible, or unconfigured release", async () => {
    const mistral = candidate(
      "mistral",
      { ok: true, value: "unsafe" },
      { dataEligible: false },
    );
    const gemini = candidate(
      "google_gemini",
      { ok: true, value: "unsafe" },
      { admitted: false },
    );
    const groq = candidate(
      "groq",
      { ok: true, value: "unsafe" },
      { configured: false },
    );
    const openai = candidate("openai", {
      ok: true,
      value: "openai-result",
    });

    const result = await runManagedProviderChain([
      mistral,
      gemini,
      groq,
      openai,
    ]);

    expect(result).toMatchObject({
      ok: true,
      providerId: "openai",
      attempts: [
        { providerId: "mistral", outcome: "data_policy_blocked" },
        { providerId: "google_gemini", outcome: "not_admitted" },
        { providerId: "groq", outcome: "not_configured" },
        { providerId: "openai", outcome: "accepted" },
      ],
    });
    expect(mistral.execute).not.toHaveBeenCalled();
    expect(gemini.execute).not.toHaveBeenCalled();
    expect(groq.execute).not.toHaveBeenCalled();
  });

  it.each([
    "provider_timeout",
    "provider_refusal",
    "invalid_structured_response",
    "citation_validation_failed",
    "prohibited_output",
    "safety_validation_failed",
  ] as const)("fails closed on %s", async (classification) => {
    const mistral = candidate("mistral", { ok: false, classification });
    const gemini = candidate("google_gemini", {
      ok: true,
      value: "bypass",
    });

    const result = await runManagedProviderChain([mistral, gemini]);

    expect(result).toMatchObject({
      ok: false,
      terminal: true,
      attempts: [
        {
          providerId: "mistral",
          outcome: "terminal_failure",
          failureClassification: classification,
        },
      ],
    });
    expect(gemini.execute).not.toHaveBeenCalled();
  });
});
