import fixture from "../../fixtures/cases/cfn-demo-001.json";
import definitions from "../../fixtures/evals/definitions/evaluation-definitions.json";

export const cfnDemoFixture = fixture;
export const cfnDemoEvaluationDefinitions = definitions;

export function getCfnDemoSelectedSegmentIds() {
  return cfnDemoFixture.selectedSegmentIds;
}

export function getCfnDemoSegment(segmentId: string) {
  return cfnDemoFixture.segments.find((segment) => segment.id === segmentId) ?? null;
}
