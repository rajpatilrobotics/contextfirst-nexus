import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

import {
  EvaluationDefinitionSchema,
  EvaluationVariantIdSchema,
} from "../contracts";
import { canonicalDigest } from "./canonical";

export const EVALUATION_VARIANT_ORDER = EvaluationVariantIdSchema.options;
export const DEVELOPMENT_VARIANTS = [
  "EVAL-001", "EVAL-003", "EVAL-004", "EVAL-006", "EVAL-007", "EVAL-012A", "EVAL-012B",
] as const;
export const HELD_OUT_VARIANTS = [
  "EVAL-002", "EVAL-005A", "EVAL-005B", "EVAL-008", "EVAL-009", "EVAL-010", "EVAL-011",
] as const;

const DefinitionFileSchema = z.strictObject({
  schemaVersion: z.literal("1.0.0"),
  fixtureId: z.literal("CFN-DEMO-001"),
  fixtureVersion: z.literal("1.0.0"),
  canonicalFixtureDigest: z.string().regex(/^[a-f0-9]{64}$/),
  evaluationDefinitionSetDigest: z.string().regex(/^[a-f0-9]{64}$/),
  variants: z.array(EvaluationDefinitionSchema),
});

export type EvaluationDefinition = z.infer<typeof EvaluationDefinitionSchema>;
export type EvaluationDefinitionFile = z.infer<typeof DefinitionFileSchema>;

const DEFINITIONS_PATH = resolve(
  process.cwd(),
  "fixtures/evals/definitions/evaluation-definitions.json",
);

export function loadEvaluationDefinitions(
  value: unknown = JSON.parse(readFileSync(DEFINITIONS_PATH, "utf8")),
): EvaluationDefinitionFile {
  const parsed = DefinitionFileSchema.parse(value);
  const ids = parsed.variants.map((definition) => definition.variantId);
  assertExactOrder(ids, EVALUATION_VARIANT_ORDER, "evaluation variant");

  const packetIds = parsed.variants.map((definition) => definition.inputPacket.id);
  assertUnique(packetIds, "packet ID");

  for (const definition of parsed.variants) {
    const expectedSplit = DEVELOPMENT_VARIANTS.includes(definition.variantId as never)
      ? "development"
      : HELD_OUT_VARIANTS.includes(definition.variantId as never)
        ? "held_out"
        : null;
    if (!expectedSplit || definition.split !== expectedSplit) {
      throw new Error(`Frozen split mismatch for ${definition.variantId}.`);
    }
    if (
      definition.fixtureVersion !== parsed.fixtureVersion ||
      definition.inputPacket.fixtureVersion !== parsed.fixtureVersion ||
      definition.inputPacket.variantId !== definition.variantId
    ) {
      throw new Error(`Frozen fixture or packet binding mismatch for ${definition.variantId}.`);
    }
    const { packetDigest, ...packetProjection } = definition.inputPacket;
    if (canonicalDigest(packetProjection) !== packetDigest) {
      throw new Error(`Packet digest mismatch for ${definition.variantId}.`);
    }
    assertUnique(definition.expectedChecks.map((check) => check.name), "check name");
    if (definition.expectedChecks.length === 0 || definition.gateNames.length === 0) {
      throw new Error(`Missing frozen checks or gates for ${definition.variantId}.`);
    }

    if (definition.executionRequirement === "deterministic_control") {
      if (definition.requiredControlScenarios.length === 0) {
        throw new Error(`Missing deterministic scenario for ${definition.variantId}.`);
      }
      assertUnique(
        definition.requiredControlScenarios.map((scenario) => scenario.scenarioId),
        "scenario ID",
      );
      for (const scenario of definition.requiredControlScenarios) {
        const fixture = scenario.controlFixture;
        const payload = fixture.controlPayload as Record<string, unknown>;
        if (
          payload.variantId !== definition.variantId ||
          payload.scenarioId !== scenario.scenarioId ||
          !Array.isArray(payload.selectedSegmentIds) ||
          payload.selectedSegmentIds.join("|") !== definition.inputPacket.selectedSegmentIds.join("|")
        ) {
          throw new Error(`Control payload binding mismatch for ${scenario.scenarioId}.`);
        }
        const { controlFixtureDigest, ...controlProjection } = fixture;
        if (canonicalDigest(controlProjection) !== controlFixtureDigest) {
          throw new Error(`Control fixture digest mismatch for ${scenario.scenarioId}.`);
        }
      }
    }
  }

  const setDigest = canonicalDigest({
    schemaVersion: parsed.schemaVersion,
    definitions: parsed.variants,
  });
  if (setDigest !== parsed.evaluationDefinitionSetDigest) {
    throw new Error("Evaluation definition-set digest mismatch.");
  }
  return parsed;
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}.`);
}

function assertExactOrder(actual: readonly string[], expected: readonly string[], label: string): void {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    throw new Error(`Missing, renamed, duplicate, or reordered ${label}.`);
  }
}
