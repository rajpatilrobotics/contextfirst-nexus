import type { AnalysisRun, CaseState } from "../contracts";
import type { BrowserCaseRecord } from "../cases";
import { cfnDemoFixture } from "../fixtures";
import { bundledGuidancePack } from "../guidance";
import { CURRENT_BROWSER_DETERMINISTIC_ADAPTER_VERSION } from "./browser-deterministic-analysis";

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
  if (state.caseId !== cfnDemoFixture.caseId) {
    return (
      state.caseId.startsWith("CFN-CASE-") &&
      run.inputState.purposeBriefId === state.purposeBrief.id &&
      run.inputState.purposeBriefRevision === state.purposeBrief.revision &&
      run.inputState.maskingRevision === state.masking.revision &&
      sameOrderedStrings(
        run.inputState.selectedSegmentIds,
        state.selectedSegmentIds,
      ) &&
      run.inputState.approvedRedactedInputDigest.length === 64 &&
      run.inputState.canonicalFixtureDigest === state.documentSetDigest &&
      run.fixtureVersion === state.fixtureVersion &&
      run.rulesetVersion === state.guidancePack.version &&
      state.guidancePack.version === bundledGuidancePack.identity.version &&
      state.guidancePack.digest === bundledGuidancePack.identity.digest
    );
  }
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

export function browserAnalysisSnapshotMatchesRecordMetadata(
  state: CaseState,
  record: BrowserCaseRecord,
): boolean {
  const run = selectSuccessfulActiveAnalysisRun(state);
  const currentBrowserRules =
    !run ||
    run.provider.providerId !== "local_replay" ||
    !run.provider.adapterVersion.startsWith("browser-deterministic-analysis-") ||
    run.provider.adapterVersion ===
      CURRENT_BROWSER_DETERMINISTIC_ADAPTER_VERSION;
  return Boolean(
    run &&
      currentBrowserRules &&
      record.purposeBrief &&
      record.documentPacket &&
      state.caseId === record.id &&
      analysisRunInputMatchesState(state, run) &&
      run.inputState.purposeBriefId === record.purposeBrief.id &&
      run.inputState.purposeBriefRevision === record.purposeBrief.revision &&
      run.inputState.maskingRevision === record.documentPacket.masking.revision &&
      run.inputState.canonicalFixtureDigest ===
        record.documentPacket.documentSetDigest,
  );
}
