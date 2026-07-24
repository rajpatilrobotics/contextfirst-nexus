import { analysisRunInputMatchesState } from "../../../lib/analysis/freshness";
import type { CaseState } from "../../../lib/contracts";

export type ReviewDestinationState =
  | { kind: "running"; state: CaseState }
  | { kind: "not_started"; state: CaseState }
  | { kind: "failed"; state: CaseState }
  | { kind: "stale"; state: CaseState }
  | { kind: "ready"; state: CaseState };

export function deriveReviewDestinationState(
  state: CaseState,
): ReviewDestinationState {
  if (state.pendingLiveAnalysis) return { kind: "running", state };
  const activeRun =
    state.analysisRuns.find((run) => run.id === state.activeAnalysisRunId) ?? null;
  if (!activeRun) return { kind: "not_started", state };
  if (activeRun.status === "failed") return { kind: "failed", state };
  if (
    activeRun.status !== "succeeded" ||
    !analysisRunInputMatchesState(state, activeRun)
  ) {
    return { kind: "stale", state };
  }
  return {
    kind: "ready",
    state: {
      ...state,
      candidates: state.candidates.filter(
        (candidate) =>
          candidate.analysisRunId === activeRun.id &&
          candidate.inclusionStatus === "active",
      ),
      citations: state.citations.filter(
        (citation) => citation.analysisRunId === activeRun.id,
      ),
    },
  };
}
