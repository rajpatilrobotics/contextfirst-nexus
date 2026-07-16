import type { CaseState } from "../../lib/contracts";
import { Alert, Button, Card } from "../../components/ui";

const REQUIRED_FIXTURE_STAGES = [
  "intake_validation",
  "text_extraction",
  "coverage_calculation",
  "identifier_masking",
] as const;

const PROVIDER_PRESENTATION = {
  openai: { label: "OpenAI", model: "gpt-5.6-sol" },
  google_gemini: { label: "Google Gemini", model: "gemini-3.5-flash" },
  mistral: { label: "Mistral", model: "mistral-small-2603" },
  local_replay: {
    label: "Bundled deterministic replay, not live AI",
    model: "Frozen replay output",
  },
} as const;

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
  const sourcesProcessed =
    state.documents.length === 7 &&
    state.coverage.processedDocuments === 7 &&
    state.selectedSegmentIds.length > 0 &&
    fixtureStagesComplete;
  const coverageReady =
    state.coverage.expectedDocuments === 7 &&
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
      label: "Bundled sources processed locally",
      satisfied: sourcesProcessed,
      detail: sourcesProcessed
        ? "Seven documents and selected redacted segments are represented."
        : "Process the seven application-managed PDFs and resolve any failed local stage.",
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
        ? "The canonical redacted provider-boundary projection passed."
        : "Complete masking review to run the deterministic leak scan.",
    },
    {
      id: "analysis-mode",
      label: "Analysis mode disclosure acknowledged",
      satisfied: analysisModeAcknowledged,
      detail: analysisModeAcknowledged
        ? "The selected release disclosure is acknowledged in the purpose brief."
        : "Choose and acknowledge a release through the Purpose step.",
    },
  ];

  return { items, ready: items.every((item) => item.satisfied) };
}

function TerminalResult({ result }: { result: AnalysisPresentation }) {
  if (result.status === "idle") {
    return (
      <Alert title="Analysis not started">
        <p>No analysis result has been requested from this intake workspace.</p>
      </Alert>
    );
  }
  if (result.status === "pending") {
    return (
      <Alert title="Analysis pending">
        <p>The selected TASK-018 controller flow is running. No provider switch or fallback occurs automatically.</p>
      </Alert>
    );
  }
  if (result.status === "completed") {
    return (
      <Alert title="Analysis completed">
        <p>
          {result.outcome === "replay_succeeded"
            ? "The bundled deterministic replay completed; this was not live AI."
            : "The selected live analysis completed."}
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
  const selection = state.purposeBrief?.providerSelection;
  const provider = selection ? PROVIDER_PRESENTATION[selection.providerId] : null;
  const activeRun = state.analysisRuns.find(
    (run) => run.id === state.activeAnalysisRunId,
  );
  const isPending = result.status === "pending" || Boolean(state.pendingLiveAnalysis);

  return (
    <Card className="grid gap-4">
      <div>
        <h2 className="cfn-type-heading-2">Analysis prerequisites</h2>
        <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
          Start analysis appears only when every canonical prerequisite passes. This route delegates exactly once to the shared run controller.
        </p>
      </div>

      {selection && provider ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="cfn-type-label">Selected mode</dt><dd>{selection.providerId === "local_replay" ? "Deterministic replay" : "Live analysis"}</dd></div>
          <div><dt className="cfn-type-label">Provider or replay</dt><dd>{provider.label}</dd></div>
          <div><dt className="cfn-type-label">Model</dt><dd className="cfn-type-code">{provider.model}</dd></div>
          <div className="sm:col-span-3"><dt className="cfn-type-label">Release</dt><dd className="cfn-type-code">{selection.releaseConfigurationId}</dd></div>
        </dl>
      ) : (
        <Alert title="No acknowledged analysis mode" tone="warning">
          <p>Choose a release and acknowledge its disclosure through the Purpose step.</p>
        </Alert>
      )}

      <ul aria-label="Analysis prerequisite checklist" className="grid gap-2">
        {prerequisites.items.map((item) => (
          <li className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3" key={item.id}>
            <p className="font-semibold">{item.satisfied ? "Complete" : "Blocked"}: {item.label}</p>
            <p className="cfn-type-body-small">{item.detail}</p>
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
            <span className="cfn-type-code">{activeRun.id}</span> · {activeRun.status} · {activeRun.provider.requestedModel}
          </p>
        </Alert>
      ) : null}

      {state.candidates.length > 0 ? (
        <section aria-labelledby="canonical-candidates-heading" className="grid gap-3">
          <div>
            <h3 className="cfn-type-heading-3" id="canonical-candidates-heading">Canonical analysis candidates</h3>
            <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
              Read directly from the shared case state; no parallel timeline, Nexus, gap, lane, or blocker copy is created here.
            </p>
          </div>
          <ul className="grid gap-2">
            {state.candidates.map((candidate) => (
              <li className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-3" key={candidate.id}>
                <p className="font-semibold">{candidate.title}</p>
                <p className="cfn-type-body-small">
                  <span className="cfn-type-code">{candidate.id}</span> · {candidate.kind.replaceAll("_", " ")} · {candidate.supportStatus.replaceAll("_", " ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Alert title="No canonical candidates">
          <p>No candidate records are present. This is not treated as a successful empty analysis.</p>
        </Alert>
      )}
    </Card>
  );
}
