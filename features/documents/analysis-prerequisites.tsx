import type { CaseState } from "../../lib/contracts";
import { Alert, Button, Card } from "../../components/ui";

const REQUIRED_FIXTURE_STAGES = [
  "intake_validation",
  "text_extraction",
  "coverage_calculation",
  "identifier_masking",
] as const;

export type AnalysisPresentation =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "completed"; outcome: "live_succeeded" | "replay_succeeded" }
  | { status: "failed" | "rejected"; code: string; userMessage: string }
  | { status: "blocked"; reason: string }
  | { status: "transport_failed"; reasonCode: string; requestId: string };

export type AnalysisPrerequisite = {
  id: string;
  label: string;
  satisfied: boolean;
  detail: string;
};

export function deriveAnalysisPrerequisites(state: CaseState): {
  items: AnalysisPrerequisite[];
  ready: boolean;
} {
  const purposeComplete = state.purposeBrief?.status === "complete";
  const stageByName = new Map(state.processing.map((stage) => [stage.name, stage]));
  const fixtureStagesComplete = REQUIRED_FIXTURE_STAGES.every((name) => {
    const status = stageByName.get(name)?.status;
    return status === "completed" || status === "warning";
  });
  const readableSegments = state.segments.filter(
    (segment) =>
      segment.extractionQuality !== "unavailable" &&
      segment.rawText.trim().length > 0 &&
      segment.redactedText.trim().length > 0,
  );
  const selectedSegmentIds = new Set(state.selectedSegmentIds);
  const candidateEligibleSegments = readableSegments.filter(
    (segment) =>
      selectedSegmentIds.has(segment.id) &&
      segment.supportEligibility === "candidate_eligible",
  );
  const instructionOnlyReadableInput =
    readableSegments.length > 0 &&
    readableSegments.every(
      (segment) => segment.supportEligibility === "evidence_only",
    );
  const sourcesProcessed =
    state.documents.length > 0 &&
    state.coverage.expectedDocuments === state.documents.length &&
    state.coverage.processedDocuments > 0 &&
    readableSegments.length > 0 &&
    fixtureStagesComplete;
  const coverageReady =
    state.coverage.expectedDocuments === state.documents.length &&
    state.coverage.expectedDocuments > 0 &&
    !state.coverage.hasConsequentialOpenIssue;
  const maskingApproved = state.masking.reviewStatus === "approved";
  const leakScanPassed = state.masking.leakScanStatus === "passed";
  const analysisModeAcknowledged = Boolean(
    purposeComplete && state.purposeBrief?.providerSelection.disclosureAcknowledgement,
  );

  const items: AnalysisPrerequisite[] = [
    {
      id: "purpose",
      label: "Purpose brief complete",
      satisfied: purposeComplete,
      detail: purposeComplete
        ? "The qualified-practitioner purpose and prohibited-decision acknowledgements are recorded."
        : "Complete the Purpose step before processing or analysis.",
    },
    {
      id: "sources",
      label: "Selected documents processed locally",
      satisfied: sourcesProcessed,
      detail: sourcesProcessed
        ? `${state.coverage.processedDocuments} selected ${state.coverage.processedDocuments === 1 ? "document is" : "documents are"} represented by readable source segments.`
        : "Select one or more PDFs and resolve any unreadable or failed local pages.",
    },
    {
      id: "coverage",
      label: "Coverage limitations allow analysis",
      satisfied: coverageReady,
      detail: coverageReady
        ? "No consequential or unknown open coverage issue blocks analysis."
        : "A consequential or unknown open coverage issue remains, or coverage has not been calculated.",
    },
    {
      id: "candidate-sources",
      label: "Reviewable source text available",
      satisfied: candidateEligibleSegments.length > 0,
      detail:
        candidateEligibleSegments.length > 0
          ? `${candidateEligibleSegments.length} readable ${candidateEligibleSegments.length === 1 ? "segment is" : "segments are"} eligible for neutral human-review items.`
          : instructionOnlyReadableInput
            ? "Readable text was found, but it contains only instruction-like content. It remains evidence-only and cannot generate review candidates; add a PDF with ordinary source text."
            : "At least one selected readable source segment must be eligible for human review.",
    },
    {
      id: "masking",
      label: "Human masking review approved",
      satisfied: maskingApproved,
      detail: maskingApproved
        ? "Every retained mask has a practitioner decision."
        : "Pending or rejected retained masks keep analysis blocked.",
    },
    {
      id: "leak-scan",
      label: "Deterministic leak scan passed",
      satisfied: leakScanPassed,
      detail: leakScanPassed
        ? "The approved redacted document projection passed."
        : state.masking.leakScanStatus === "failed"
          ? "The deterministic scan found a remaining supported identifier. Add or correct a mask, then approve the privacy check again."
          : "Complete masking review to run the deterministic leak scan.",
    },
    {
      id: "analysis-mode",
      label: "Analysis disclosure acknowledged",
      satisfied: analysisModeAcknowledged,
      detail: analysisModeAcknowledged
        ? "The local analysis disclosure is acknowledged in the Purpose brief."
        : "Acknowledge the local analysis disclosure through the Purpose step.",
    },
  ];

  return { items, ready: items.every((item) => item.satisfied) };
}

function TerminalResult({ result }: { result: AnalysisPresentation }) {
  if (result.status === "idle") {
    return null;
  }
  if (result.status === "pending") {
    return (
      <Alert title="Analysis pending">
        <p>The approved analysis flow is running. No alternate analysis is started automatically.</p>
      </Alert>
    );
  }
  if (result.status === "completed") {
    return (
      <Alert title="Analysis completed">
        <p>
          {result.outcome === "replay_succeeded"
            ? "The prepared local analysis completed without external transmission."
            : "The approved analysis completed."}
        </p>
      </Alert>
    );
  }
  if (result.status === "failed" || result.status === "rejected") {
    return (
      <Alert
        title={result.status === "failed" ? "Analysis failed" : "Analysis rejected before run"}
        tone="danger"
      >
        <p>{result.userMessage}</p>
        <p className="cfn-type-body-small">Safe code: {result.code}</p>
      </Alert>
    );
  }
  if (result.status === "transport_failed") {
    return (
      <Alert title="Analysis connection outcome unknown" tone="danger">
        <p>Safe code: {result.reasonCode}. Request: {result.requestId}.</p>
      </Alert>
    );
  }
  if (result.status === "blocked") {
    return (
      <Alert title="Analysis remains blocked" tone="warning">
        <p>Safe reason: {result.reason}. Review the prerequisite checklist.</p>
      </Alert>
    );
  }
  return null;
}

export function AnalysisPrerequisites({
  state,
  result,
  onStart,
  disabled = false,
}: {
  state: CaseState;
  result: AnalysisPresentation;
  onStart: () => void;
  disabled?: boolean;
}) {
  const prerequisites = deriveAnalysisPrerequisites(state);
  const activeRun = state.analysisRuns.find(
    (run) => run.id === state.activeAnalysisRunId,
  );
  const isPending = result.status === "pending" || Boolean(state.pendingLiveAnalysis);

  return (
    <Card className="grid gap-4">
      <div>
        <h3 className="cfn-type-heading-3">
          {prerequisites.ready ? "Everything is ready" : "Finish the checks above"}
        </h3>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {prerequisites.ready
            ? "Start the prepared analysis, then continue directly to Review."
            : "Analysis stays unavailable until every required safety check passes."}
        </p>
      </div>

      <ul aria-label="Analysis prerequisite checklist" className="grid gap-2 sm:grid-cols-2">
        {prerequisites.items.map((item) => (
          <li
            className={`rounded-[var(--radius-control)] border p-2.5 text-sm ${
              item.satisfied
                ? "border-[var(--color-border)] bg-[var(--color-surface-subtle)]"
                : "border-[var(--color-warning)] bg-[var(--color-warning-subtle)]"
            }`}
            key={item.id}
          >
            <p className="font-semibold">{item.satisfied ? "✓" : "○"} {item.label}</p>
            {!item.satisfied ? (
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{item.detail}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {prerequisites.ready && !isPending ? (
        <div>
          <Button disabled={disabled} onClick={onStart} variant="primary">
            Start analysis
          </Button>
        </div>
      ) : null}

      <div aria-atomic="true" aria-live="polite">
        <TerminalResult result={isPending ? { status: "pending" } : result} />
      </div>

      {activeRun ? (
        <Alert title="Canonical active run">
          <p>
            <span className="cfn-type-code">{activeRun.id}</span> · {activeRun.status}
          </p>
        </Alert>
      ) : null}

      {state.candidates.length > 0 ? (
        <section aria-labelledby="canonical-candidates-heading" className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="cfn-type-heading-3" id="canonical-candidates-heading">Canonical analysis candidates</h3>
            <span className="rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-sm font-semibold text-[var(--color-brand)]">
              {state.candidates.length} ready for review
            </span>
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-[var(--color-brand)]">
              View candidate list
            </summary>
            <ul className="mt-2 grid gap-2">
              {state.candidates.map((candidate) => (
                <li className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-2.5" key={candidate.id}>
                  <p className="font-semibold">{candidate.title}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    <span className="cfn-type-code">{candidate.id}</span> · {candidate.supportStatus.replaceAll("_", " ")}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        </section>
      ) : null}
    </Card>
  );
}
