import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  DEFAULT_OPENAI_MODEL,
  OPENAI_MODEL_CONFIGURATION,
  resolveOpenAIModel,
} from "../../../lib/ai/server/openai-model";
import { getAdmissionRecord } from "../../../lib/ai/server/admission";
import { getRegistryEntry } from "../../../lib/ai/server/registry";

describe("OpenAI GPT-5.6 model switchboard", () => {
  it("defaults to Terra when no model is configured", () => {
    expect(resolveOpenAIModel(undefined)).toEqual({
      model: DEFAULT_OPENAI_MODEL,
      displayName: "GPT-5.6 Terra",
      valid: true,
    });
  });

  it.each([
    ["gpt-5.6-sol", "GPT-5.6 Sol"],
    ["gpt-5.6-terra", "GPT-5.6 Terra"],
    ["gpt-5.6-luna", "GPT-5.6 Luna"],
  ] as const)("accepts the allowlisted %s model", (model, displayName) => {
    expect(resolveOpenAIModel(model)).toEqual({
      model,
      displayName,
      valid: true,
    });
  });

  it("fails closed for unsupported model values", () => {
    expect(resolveOpenAIModel("gpt-5.5")).toEqual({
      model: DEFAULT_OPENAI_MODEL,
      displayName: "GPT-5.6 Terra",
      valid: false,
    });
  });

  it("binds the exact configured model across registry and admission provenance", () => {
    const entry = getRegistryEntry("openai-quality-v1");
    const admission = getAdmissionRecord("openai-quality-v1");

    expect(entry?.kind).toBe("live");
    if (!entry || entry.kind !== "live" || !admission) {
      throw new Error("Expected the OpenAI live release and admission record.");
    }

    expect(entry.release.requestedModel).toBe(
      OPENAI_MODEL_CONFIGURATION.model,
    );
    expect(entry.modelDisplayName).toBe(
      OPENAI_MODEL_CONFIGURATION.displayName,
    );
    expect(entry.enabled).toBe(OPENAI_MODEL_CONFIGURATION.valid);
    expect(admission.evaluatedConfiguration.requestedModel).toBe(
      OPENAI_MODEL_CONFIGURATION.model,
    );
  });
});
