import type { AnalysisRun, CaseState } from "../contracts";
import { cfnDemoFixture } from "../fixtures";
import { bundledGuidancePack } from "../guidance";

export function selectSuccessfulActiveAnalysisRun(state: CaseState): AnalysisRun | null {
  const activeRuns = state.analysisRuns.filter((run) => run.id === state.activeAnalysisRunId);
  if (activeRuns.length !== 1) return null;
  const [run] = activeRuns;
  return run.status === "succeeded" ? run : null;
}

function sameOrderedStrings(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function analysisRunInputMatchesState(state: CaseState, run: AnalysisRun) {
  if (!state.purposeBrief) return false;
  return (
    run.inputState.purposeBriefId === state.purposeBrief.id &&
    run.inputState.purposeBriefRevision === state.purposeBrief.revision &&
    run.inputState.maskingRevision === state.masking.revision &&
    sameOrderedStrings(run.inputState.selectedSegmentIds, state.selectedSegmentIds) &&
    run.inputState.approvedRedactedInputDigest === cfnDemoFixture.approvedRedactedInputDigest &&
    run.inputState.canonicalFixtureDigest === cfnDemoFixture.canonicalFixtureDigest &&
    run.fixtureVersion === state.fixtureVersion &&
    state.fixtureVersion === cfnDemoFixture.fixtureVersion &&
    state.caseId === cfnDemoFixture.caseId &&
    run.rulesetVersion === state.guidancePack.version &&
    state.guidancePack.version === bundledGuidancePack.identity.version &&
    state.guidancePack.digest === bundledGuidancePack.identity.digest
  );
}
