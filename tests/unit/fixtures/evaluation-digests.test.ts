import crypto from "node:crypto";
import { describe, expect, it } from "vitest";

import packageJson from "../../../package.json";
import definitions from "../../../fixtures/evals/definitions/evaluation-definitions.json";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | JsonRecord;
type JsonRecord = { [key: string]: JsonValue };
type InputPacket = JsonRecord & {
  packetDigest: string;
  selectedSegmentIds: string[];
  purposeContext: JsonRecord;
};
type ControlFixture = JsonRecord & {
  controlFixtureDigest: string;
  controlInput: JsonRecord;
  controlPayload: JsonRecord;
};
type ControlScenario = JsonRecord & {
  scenarioId: string;
  controlFixture: ControlFixture;
};
type ExpectedCheck = JsonRecord & { name: string; expected: string };
type EvaluationDefinition = JsonRecord & {
  variantId: string;
  inputPacket: InputPacket;
  gateNames: string[];
  expectedChecks: ExpectedCheck[];
  requiredRepetitions: number[];
  requiredControlScenarios: ControlScenario[];
  allowedExecutionSources: string[];
  allowedTerminalStatuses: string[];
};

const variants = definitions.variants as unknown as EvaluationDefinition[];
const variantOrder = [
  "EVAL-001", "EVAL-002", "EVAL-003", "EVAL-004", "EVAL-005A", "EVAL-005B", "EVAL-006",
  "EVAL-007", "EVAL-008", "EVAL-009", "EVAL-010", "EVAL-011", "EVAL-012A", "EVAL-012B",
];
const gateOrder = [
  "consequential_review_blocking",
  "invalid_citation_rejection",
  "injection_containment",
  "cooperation_invariance",
  "declared_identifier_exclusion",
  "required_abstention",
  "dependency_recalculation",
  "prohibited_conclusion_blocking",
];

function compareUnicodeCodePoints(left: string, right: string) {
  const leftPoints = Array.from(left);
  const rightPoints = Array.from(right);
  for (let index = 0; index < Math.min(leftPoints.length, rightPoints.length); index += 1) {
    const difference = leftPoints[index].codePointAt(0)! - rightPoints[index].codePointAt(0)!;
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

function canonicalize(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort(compareUnicodeCodePoints)
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key]!)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value: JsonValue) {
  return crypto.createHash("sha256").update(canonicalize(value), "utf8").digest("hex");
}

function withoutField(record: JsonRecord, field: string): JsonRecord {
  const projection = { ...record };
  delete projection[field];
  return projection;
}

function normalizeDefinition(definition: EvaluationDefinition): EvaluationDefinition {
  return {
    ...definition,
    inputPacket: { ...definition.inputPacket, selectedSegmentIds: [...definition.inputPacket.selectedSegmentIds] },
    expectedChecks: [...definition.expectedChecks].sort((left, right) => compareUnicodeCodePoints(left.name, right.name)),
    gateNames: [...definition.gateNames].sort((left, right) => gateOrder.indexOf(left) - gateOrder.indexOf(right)),
    requiredRepetitions: [...definition.requiredRepetitions],
    requiredControlScenarios: [...definition.requiredControlScenarios]
      .sort((left, right) => compareUnicodeCodePoints(left.scenarioId, right.scenarioId)),
    allowedExecutionSources: [...definition.allowedExecutionSources],
    allowedTerminalStatuses: [...definition.allowedTerminalStatuses],
  };
}

function definitionSetDigest(input: readonly EvaluationDefinition[]) {
  const normalizedDefinitions = [...input]
    .sort((left, right) => variantOrder.indexOf(left.variantId) - variantOrder.indexOf(right.variantId))
    .map(normalizeDefinition);
  return digest({ schemaVersion: "1.0.0", definitions: normalizedDefinitions });
}

describe("TASK-029 evaluation digest projections", () => {
  it("recomputes every packet, control fixture, and definition-set digest from its canonical projection", () => {
    expect(variants.map((definition) => definition.variantId)).toEqual(variantOrder);

    for (const definition of variants) {
      expect(digest(withoutField(definition.inputPacket, "packetDigest"))).toBe(definition.inputPacket.packetDigest);
      for (const scenario of definition.requiredControlScenarios) {
        expect(digest(withoutField(scenario.controlFixture, "controlFixtureDigest")))
          .toBe(scenario.controlFixture.controlFixtureDigest);
      }
    }

    expect(definitionSetDigest(variants)).toBe(definitions.evaluationDefinitionSetDigest);
  });

  it("normalizes object insertion, definition, check, gate, and scenario order without changing digests", () => {
    const controlDefinition = variants.find((definition) => definition.variantId === "EVAL-007");
    if (!controlDefinition) throw new Error("Missing EVAL-007 definition.");
    const scenario = controlDefinition.requiredControlScenarios[0];
    if (!scenario) throw new Error("Missing EVAL-007 control scenario.");

    const reorderedPacket = Object.fromEntries(
      Object.entries(controlDefinition.inputPacket).reverse(),
    ) as InputPacket;
    expect(digest(withoutField(reorderedPacket, "packetDigest"))).toBe(controlDefinition.inputPacket.packetDigest);
    expect(definitionSetDigest([...variants].reverse())).toBe(definitionSetDigest(variants));

    const secondControlFixture: ControlFixture = {
      ...scenario.controlFixture,
      controlFixtureId: "CONTROL-EVAL-007-ORDER",
      controlFixtureDigest: "",
    };
    secondControlFixture.controlFixtureDigest = digest(
      withoutField(secondControlFixture, "controlFixtureDigest"),
    );
    const expandedDefinition: EvaluationDefinition = {
      ...controlDefinition,
      expectedChecks: [
        ...controlDefinition.expectedChecks,
        { name: "Additional ordering check", expected: "Keeps canonical normalization stable." },
      ],
      requiredControlScenarios: [
        scenario,
        { ...scenario, scenarioId: "EVAL-007-SCENARIO-ORDER", controlFixture: secondControlFixture },
      ],
    };
    const permutedDefinition: EvaluationDefinition = {
      ...expandedDefinition,
      expectedChecks: [...expandedDefinition.expectedChecks].reverse(),
      gateNames: [...expandedDefinition.gateNames].reverse(),
      requiredControlScenarios: [...expandedDefinition.requiredControlScenarios].reverse(),
    };
    expect(definitionSetDigest([expandedDefinition])).toBe(definitionSetDigest([permutedDefinition]));
  });

  it("changes the applicable digest when a bound packet, control, definition, or preserved array changes", () => {
    const controlDefinition = variants.find((definition) => definition.variantId === "EVAL-007");
    if (!controlDefinition) throw new Error("Missing EVAL-007 definition.");
    const scenario = controlDefinition.requiredControlScenarios[0];
    if (!scenario) throw new Error("Missing EVAL-007 control scenario.");

    const alteredPacket: InputPacket = {
      ...controlDefinition.inputPacket,
      purposeContext: { ...controlDefinition.inputPacket.purposeContext, cooperationContext: "cooperated" },
    };
    expect(digest(withoutField(alteredPacket, "packetDigest"))).not.toBe(controlDefinition.inputPacket.packetDigest);
    const reorderedSegments: InputPacket = {
      ...controlDefinition.inputPacket,
      selectedSegmentIds: [...controlDefinition.inputPacket.selectedSegmentIds].reverse(),
    };
    expect(digest(withoutField(reorderedSegments, "packetDigest"))).not.toBe(controlDefinition.inputPacket.packetDigest);

    const alteredInputFixture: ControlFixture = {
      ...scenario.controlFixture,
      controlInput: { ...scenario.controlFixture.controlInput, injectedFault: "changed fault" },
    };
    expect(digest(withoutField(alteredInputFixture, "controlFixtureDigest")))
      .not.toBe(scenario.controlFixture.controlFixtureDigest);
    const alteredPayloadFixture: ControlFixture = {
      ...scenario.controlFixture,
      controlPayload: { ...scenario.controlFixture.controlPayload, expected: "changed payload" },
    };
    expect(digest(withoutField(alteredPayloadFixture, "controlFixtureDigest")))
      .not.toBe(scenario.controlFixture.controlFixtureDigest);

    const alteredDefinition: EvaluationDefinition = {
      ...controlDefinition,
      allowedTerminalStatuses: [...controlDefinition.allowedTerminalStatuses].reverse(),
    };
    expect(definitionSetDigest([alteredDefinition])).not.toBe(definitionSetDigest([controlDefinition]));
  });

  it("wires npm eval to the future TASK-016 runner without an empty-test bypass", () => {
    expect(packageJson.scripts.eval).toBe("node scripts/run-evaluation.mjs");
    expect(packageJson.scripts.eval).not.toContain("tests/evals");
    expect(packageJson.scripts.eval).not.toContain("--passWithNoTests");
  });
});
