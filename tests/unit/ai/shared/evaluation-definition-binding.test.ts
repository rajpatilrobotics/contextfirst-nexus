import { describe, expect, it } from "vitest";

import definitions from "../../../../fixtures/evals/definitions/evaluation-definitions.json";
import { EVALUATION_DEFINITION_SET_DIGEST } from "../../../../lib/ai/server/types";

describe("TASK-029 shared AI evaluation binding", () => {
  it("matches the generated evaluation-definition artifact exactly", () => {
    expect(EVALUATION_DEFINITION_SET_DIGEST).toBe(definitions.evaluationDefinitionSetDigest);
  });
});
