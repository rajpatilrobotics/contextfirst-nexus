import { FlaskConical, Network, ShieldAlert } from "lucide-react";
import type { EvaluationResult, SystemCard } from "../../lib/contracts";
import { Alert, Card } from "../../components/ui";
import type { EvaluationDefinitionDisplay } from "./trust-data.server";
import { StatusMark } from "./status-mark";

type SafetyLabResultProps = {
  result: EvaluationResult;
  definition?: EvaluationDefinitionDisplay;
  provenanceLabel?: string;
};

// Canonical evaluation records are parsed before reaching this renderer. The
// shared schema intentionally exposes its payload as unknown, so this local
// view describes only the safe, displayable fields used by the Trust page.
export type SafetyLabResultRecord = {
  executionSource: string;
  status: "passed" | "failed" | "not_run";
  fixtureId: string;
  fixtureVersion: string;
  analysisRunId?: string | null;
  evidenceId?: string;
  variantId?: string;
  split?: string;
  repetition?: number;
  executionRequirement?: string;
  runMode?: string | null;
  terminalStatus: string;
  actualProviderTransmission: boolean;
  scenarioId?: string | null;
  inputPacketId?: string;
  replayBundleId?: string;
  checks: Array<{
    name: string;
    expected: string;
    observed: string;
    passed: boolean;
  }>;
  plannedRelease?: {
    providerId: string;
    releaseConfigurationId: string;
    serviceTier: string;
  } | null;
  provider?: {
    providerId: string;
    releaseConfigurationId: string;
    requestedModel: string;
    returnedModel: string | null;
    adapterVersion: string;
    serviceTier: string;
    disclosureVersion: string;
    inferenceSetting: {
      kind: string;
      value: string;
    };
  } | null;
};

const LABELS: Record<string, string> = {
  passed: "Passed",
  failed: "Failed",
  not_run: "Not run",
  development: "Development",
  held_out: "Held out",
  live_model_run: "Live model run required",
  deterministic_control: "Deterministic control",
  live_provider: "Live provider",
  deterministic_control_source: "Deterministic control",
  mock_control: "Mock control",
  mock_harness: "Mock harness",
  deterministic_replay: "Deterministic replay",
  succeeded: "Succeeded",
  rejected_before_run: "Rejected before run",
  transport_outcome_unknown: "Transport outcome unknown",
};

function label(value: string | null | undefined) {
  if (!value) return "Not applicable";
  return LABELS[value] ?? value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function CodeValue({ children }: { children: string }) {
  return <span className="cfn-type-code break-all">{children}</span>;
}

function ResultDetail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="cfn-type-label text-[var(--color-ink-muted)]">{term}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

function resultIdentity(result: SafetyLabResultRecord) {
  if (result.executionSource === "deterministic_replay") return result.analysisRunId ?? "REPLAY-EVIDENCE-UNAVAILABLE";
  return result.evidenceId ?? "EVALUATION-EVIDENCE-UNAVAILABLE";
}

export function SafetyLabResult({ result, definition, provenanceLabel }: SafetyLabResultProps) {
  const record = result as SafetyLabResultRecord;
  const status = record.status;
  const tone = status === "passed" ? "supported" : status === "failed" ? "danger" : "warning";
  const isReplay = record.executionSource === "deterministic_replay";
  const isHarness = record.executionSource === "mock_harness";
  const expectedChecks = definition?.expectedChecks ?? [];
  const checks = record.checks ?? [];

  return (
    <article
      aria-labelledby={`result-${resultIdentity(record)}`}
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      data-evaluation-status={status}
      data-execution-source={record.executionSource}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="cfn-type-label text-[var(--color-ink-muted)]">
            {provenanceLabel ?? (isReplay ? "Replay continuity" : isHarness ? "Deterministic CI harness" : `Variant ${record.variantId}`)}
          </p>
          <h4 className="cfn-type-heading-3 break-all" id={`result-${resultIdentity(record)}`}>
            {resultIdentity(record)}
          </h4>
        </div>
        <StatusMark label={label(status)} tone={tone} />
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResultDetail term="Fixture"><CodeValue>{record.fixtureId}</CodeValue></ResultDetail>
        <ResultDetail term="Fixture version">{record.fixtureVersion}</ResultDetail>
        {!isReplay ? <ResultDetail term="Split">{label(record.split)}</ResultDetail> : null}
        {!isReplay ? <ResultDetail term="Repetition">{String(record.repetition)}</ResultDetail> : null}
        {!isReplay ? <ResultDetail term="Execution requirement">{label(record.executionRequirement)}</ResultDetail> : null}
        <ResultDetail term="Execution source">{label(record.executionSource)}</ResultDetail>
        <ResultDetail term="Run mode">{record.runMode ? label(record.runMode) : status === "not_run" ? "No run started" : "Not a provider run"}</ResultDetail>
        <ResultDetail term="Terminal status">{label(record.terminalStatus)}</ResultDetail>
        <ResultDetail term="Actual provider transmission">{record.actualProviderTransmission ? "Yes" : "No"}</ResultDetail>
        {record.analysisRunId ? <ResultDetail term="Analysis run"><CodeValue>{record.analysisRunId}</CodeValue></ResultDetail> : null}
        {isReplay && record.replayBundleId ? <ResultDetail term="Replay bundle"><CodeValue>{record.replayBundleId}</CodeValue></ResultDetail> : null}
        {!isReplay && record.scenarioId ? <ResultDetail term="Scenario"><CodeValue>{record.scenarioId}</CodeValue></ResultDetail> : null}
        {!isReplay && record.inputPacketId ? <ResultDetail term="Input packet"><CodeValue>{record.inputPacketId}</CodeValue></ResultDetail> : null}
      </dl>

      {record.plannedRelease ? (
        <div className="grid gap-2 rounded-[var(--radius-control)] bg-[var(--color-neutral-subtle)] p-3">
          <p className="cfn-type-label">Planned release provenance</p>
          <p className="break-words">
            <CodeValue>{record.plannedRelease.providerId}</CodeValue>{" · "}
            <CodeValue>{record.plannedRelease.releaseConfigurationId}</CodeValue>{" · "}
            {record.plannedRelease.serviceTier} tier
          </p>
          {isHarness ? <p className="font-semibold">Not live model evidence. This mock-harness record cannot support admission.</p> : null}
        </div>
      ) : null}

      {record.provider ? (
        <div className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
          <p className="cfn-type-label">Exact execution provenance</p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ResultDetail term="Provider"><CodeValue>{record.provider.providerId}</CodeValue></ResultDetail>
            <ResultDetail term="Release"><CodeValue>{record.provider.releaseConfigurationId}</CodeValue></ResultDetail>
            <ResultDetail term="Requested model"><CodeValue>{record.provider.requestedModel}</CodeValue></ResultDetail>
            <ResultDetail term="Returned model"><CodeValue>{record.provider.returnedModel ?? "Not returned"}</CodeValue></ResultDetail>
            <ResultDetail term="Adapter"><CodeValue>{record.provider.adapterVersion}</CodeValue></ResultDetail>
            <ResultDetail term="Service tier">{record.provider.serviceTier}</ResultDetail>
            <ResultDetail term="Disclosure version">{record.provider.disclosureVersion}</ResultDetail>
            <ResultDetail term="Inference setting">{label(record.provider.inferenceSetting.kind)}: {record.provider.inferenceSetting.value}</ResultDetail>
          </dl>
        </div>
      ) : null}

      <div className="grid gap-3">
        <h5 className="cfn-type-label">Check evidence</h5>
        {checks.length ? (
          <ul className="grid gap-3">
            {checks.map((check: { name: string; expected: string; observed: string; passed: boolean }) => (
              <li className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3" key={check.name}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{check.name}</span>
                  <StatusMark label={check.passed ? "Check passed" : "Check failed"} tone={check.passed ? "supported" : "danger"} />
                </div>
                <p className="break-words"><span className="font-semibold">Expected:</span> {check.expected}</p>
                <p className="break-all"><span className="font-semibold">Observed:</span> {check.observed}</p>
              </li>
            ))}
          </ul>
        ) : expectedChecks.length ? (
          <ul className="grid gap-3">
            {expectedChecks.map((check) => (
              <li className="grid gap-2 rounded-[var(--radius-control)] border border-dashed border-[var(--color-border-strong)] p-3" key={check.name}>
                <p className="font-semibold">{check.name}</p>
                <p><span className="font-semibold">Expected:</span> {check.expected}</p>
                <p><span className="font-semibold">Observed:</span> Not run; no observation was recorded.</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Not run; this record contains no executed checks or observed result.</p>
        )}
      </div>
    </article>
  );
}

export function SafetyLab({
  reports,
  measuredResults,
  deterministicHarnessResults,
  definitions,
}: {
  reports: SystemCard["evaluationAdmissionReports"];
  measuredResults: EvaluationResult[];
  deterministicHarnessResults: EvaluationResult[];
  definitions: EvaluationDefinitionDisplay[];
}) {
  const definitionByVariant = new Map(definitions.map((definition) => [definition.variantId, definition]));
  const measuredRecords = measuredResults as SafetyLabResultRecord[];
  const harnessRecords = deterministicHarnessResults as SafetyLabResultRecord[];
  const replayResult = measuredRecords.find((result) => result.executionSource === "deterministic_replay");

  return (
    <section aria-labelledby="safety-lab-heading" className="grid min-w-0 gap-6" id="safety-lab">
      <div className="grid gap-2">
        <p className="cfn-type-label text-[var(--color-brand)]">Safety Lab · fixture version 1.0.0</p>
        <h2 className="cfn-type-heading-1" id="safety-lab-heading">Demo evaluation evidence</h2>
        <p className="cfn-reading-column text-[var(--color-ink-muted)]">
          Every integrated evidence record is shown item by item. Critical checks are never averaged, and these demo records do not establish real-world effectiveness.
        </p>
      </div>

      <Alert title="Evidence boundary" tone="warning">
        <p className="mt-2">
          Production evidence currently contains genuine Passed and Not run records only. No measured Failed record is invented. Report generation cannot change runtime admission.
        </p>
      </Alert>

      <div className="grid gap-8">
        {reports.map((report) => (
          <section
            aria-labelledby={`report-heading-${report.releaseConfigurationId}`}
            className="grid min-w-0 gap-4 scroll-mt-4"
            id={`report-${report.releaseConfigurationId}`}
            key={report.releaseConfigurationId}
          >
            <Card className="grid gap-4 border-[var(--color-warning)] bg-[var(--color-warning-subtle)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="cfn-type-label">Provider admission evidence report</p>
                  <h3 className="cfn-type-heading-2 break-all" id={`report-heading-${report.releaseConfigurationId}`}>{report.id}</h3>
                </div>
                <StatusMark label={label(report.status)} tone="warning" />
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ResultDetail term="Provider"><CodeValue>{report.providerId}</CodeValue></ResultDetail>
                <ResultDetail term="Release"><CodeValue>{report.releaseConfigurationId}</CodeValue></ResultDetail>
                <ResultDetail term="Requested model"><CodeValue>{report.requestedModel}</CodeValue></ResultDetail>
                <ResultDetail term="Service tier">{report.serviceTier}</ResultDetail>
                <ResultDetail term="Canonical report digest"><CodeValue>{report.reportDigest}</CodeValue></ResultDetail>
                <ResultDetail term="Evaluated configuration digest"><CodeValue>{report.evaluatedConfigurationDigest}</CodeValue></ResultDetail>
                <ResultDetail term="Generated">{report.generatedAt}</ResultDetail>
                <ResultDetail term="Evidence records">{String(report.evidence.length)}</ResultDetail>
              </dl>
              <div className="grid gap-2">
                <p className="cfn-type-label">Blocking gates</p>
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {report.gates.map((gate) => (
                    <li className="flex min-w-0 flex-wrap items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2" key={gate.name}>
                      <span className="cfn-type-code break-all">{gate.name}</span>
                      <StatusMark label={label(gate.status)} tone={gate.status === "passed" ? "supported" : gate.status === "failed" ? "danger" : "warning"} />
                    </li>
                  ))}
                </ul>
              </div>
              <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
                Required live-model repetitions: {report.requiredLiveRunsPerModelVariant}. Required deterministic-control repetitions: {report.requiredRunsPerControlScenario}. This incomplete evidence does not admit the release.
              </p>
            </Card>

            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
              {(report.evidence as SafetyLabResultRecord[]).map((result) => (
                <SafetyLabResult
                  definition={definitionByVariant.get(result.variantId ?? "")}
                  key={result.evidenceId}
                  result={result}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <section aria-labelledby="replay-continuity-heading" className="grid min-w-0 gap-4" id="replay-continuity">
        <div className="flex items-center gap-2">
          <Network aria-hidden="true" className="text-[var(--color-brand)]" size={20} />
          <h3 className="cfn-type-heading-2" id="replay-continuity-heading">Replay continuity evidence</h3>
        </div>
        <p className="text-[var(--color-ink-muted)]">
          Local deterministic continuity is not a live-provider comparison and does not support provider admission.
        </p>
        {replayResult ? (
          <SafetyLabResult provenanceLabel="Bundled replay continuity" result={replayResult} />
        ) : (
          <Alert title="Replay evidence unavailable" tone="danger"><p className="mt-2">No replay-continuity record was integrated.</p></Alert>
        )}
      </section>

      <section aria-labelledby="harness-heading" className="grid min-w-0 gap-4">
        <div className="flex items-center gap-2">
          <FlaskConical aria-hidden="true" className="text-[var(--color-brand)]" size={20} />
          <h3 className="cfn-type-heading-2" id="harness-heading">Deterministic CI harness</h3>
        </div>
        <Alert title="Not live model evidence" tone="neutral">
          <p className="mt-2">
            These zero-network mock-harness records exercise renderer and control paths. They are excluded from provider comparison, recommendation, and admission.
          </p>
        </Alert>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
          {harnessRecords.length ? harnessRecords.map((result) => (
            <SafetyLabResult
              definition={definitionByVariant.get(result.variantId ?? "")}
              key={result.evidenceId}
              provenanceLabel="Not live model evidence · mock harness"
              result={result}
            />
          )) : (
            <Alert title="Harness results empty" tone="neutral"><p className="mt-2">No deterministic harness record is integrated.</p></Alert>
          )}
        </div>
      </section>

      <Card className="flex gap-3 border-[var(--color-border-strong)]">
        <ShieldAlert aria-hidden="true" className="mt-1 shrink-0 text-[var(--color-warning)]" size={20} />
        <p>
          A future genuine failure must remain visible beside the exact fixture and checks. This page contains no certification, provider recommendation, real-case validation, or production-readiness claim.
        </p>
      </Card>
    </section>
  );
}
