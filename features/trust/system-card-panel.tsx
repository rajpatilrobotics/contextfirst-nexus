import {
  ArrowRight,
  Database,
  ExternalLink,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import type {
  AnalysisRun,
  NonRunAnalysisAttempt,
  ProviderOptionProjection,
  SystemCard,
} from "../../lib/contracts";
import { Alert, Card } from "../../components/ui";
import { StatusMark, type TrustStatusTone } from "./status-mark";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  google_gemini: "Google Gemini",
  mistral: "Mistral",
  local_replay: "Local replay",
};

const HUMAN_LABELS: Record<string, string> = {
  not_evaluated: "Not evaluated",
  passed: "Passed",
  failed: "Failed",
  not_applicable: "Not applicable",
  available: "Available",
  disabled: "Disabled in this deployment",
  evaluation_failed: "Evaluation failed",
  not_configured: "Not configured",
  service_tier_unavailable: "Service tier unavailable",
  deployed_account_release_unavailable: "Deployed-account release unavailable",
  data_policy_blocked: "Data policy blocked",
  not_required: "Not required",
  not_verified: "Not verified",
  unavailable: "Unavailable",
  incomplete: "Incomplete",
  not_run: "Not run",
};

function humanize(value: string) {
  return HUMAN_LABELS[value] ?? value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function toneFor(value: string): TrustStatusTone {
  if (["passed", "available", "succeeded"].includes(value)) return "supported";
  if (["failed", "evaluation_failed", "unavailable"].includes(value)) return "danger";
  if (["not_evaluated", "not_verified", "incomplete", "not_run", "deployed_account_release_unavailable"].includes(value)) return "warning";
  return "neutral";
}

function reportBoundaryText(status: string) {
  if (status === "passed") {
    return "This passed report remains linked evidence only. Runtime selectability still comes from static admission and, for Mistral, safe deployed-account availability.";
  }
  if (status === "failed") {
    return "This failed report remains visible evidence and cannot enable runtime admission or selectability.";
  }
  return "This incomplete report is evidence, not runtime admission. Its identity and digest do not populate the static accepted-report fields.";
}

function Detail({ label, value, code = false }: { label: string; value: string; code?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="cfn-type-label text-[var(--color-ink-muted)]">{label}</dt>
      <dd className={`${code ? "cfn-type-code break-all" : "break-words"}`}>{value}</dd>
    </div>
  );
}

function InferenceSetting({ option }: { option: ProviderOptionProjection }) {
  if (option.mode === "deterministic_replay") return <span>Not applicable</span>;
  return <span>Bound in reviewed configuration; see exact admission record below.</span>;
}

export function SystemCardPanel({ card }: { card: SystemCard }) {
  return (
    <section aria-labelledby="system-card-heading" className="grid min-w-0 gap-5" id="system-card">
      <div className="grid gap-2">
        <p className="cfn-type-label text-[var(--color-brand)]">System Card · schema {card.schemaVersion}</p>
        <h2 className="cfn-type-heading-1" id="system-card-heading">Release authority and operating boundaries</h2>
        <p className="cfn-reading-column text-[var(--color-ink-muted)]">
          Static admission is the runtime authority. Evaluation files are linked evidence only and cannot enable a release.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="grid gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="text-[var(--color-supported)]" size={20} />
            <h3 className="cfn-type-heading-3">Intended use</h3>
          </div>
          <ul className="grid list-disc gap-2 pl-5">
            {card.intendedUse.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Card>
        <Card className="grid gap-4 border-[var(--color-danger)]">
          <div className="flex items-center gap-2">
            <LockKeyhole aria-hidden="true" className="text-[var(--color-danger)]" size={20} />
            <h3 className="cfn-type-heading-3">Prohibited use</h3>
          </div>
          <ul className="grid list-disc gap-2 pl-5">
            {card.prohibitedUse.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Card>
      </div>

      <Card className="grid gap-4">
        <div className="flex items-center gap-2">
          <Database aria-hidden="true" className="text-[var(--color-brand)]" size={20} />
          <h3 className="cfn-type-heading-3">Enabled data boundary</h3>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Data origin" value={humanize(card.enabledDataOrigin)} />
          <Detail label="Case ID" value={card.enabledFixtureBinding.caseId} code />
          <Detail label="Fixture version" value={card.enabledFixtureBinding.fixtureVersion} />
          <Detail label="Canonical fixture digest" value={card.enabledFixtureBinding.canonicalFixtureDigest} code />
        </dl>
        <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
          One English bundled text-PDF fixture is enabled. Raw PDFs are not sent to providers.
        </p>
      </Card>

      <div className="grid gap-3">
        <div>
          <h3 className="cfn-type-heading-2">Provider and replay registry</h3>
          <p className="text-[var(--color-ink-muted)]">
            Fixed display order only: OpenAI, Gemini, Mistral, then replay. No automatic attempt chain or output merging exists.
          </p>
        </div>
        <ol className="grid gap-4">
          {card.providers.map((option) => (
            <ProviderCard card={card} key={option.releaseConfigurationId} option={option} />
          ))}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BoundaryList heading="Human review requirements" items={card.humanReviewRequirements} />
        <BoundaryList heading="Known failure modes" items={card.knownFailureModes} />
        <BoundaryList heading="Unsupported conditions" items={[
          ...card.unsupportedJurisdictions,
          ...card.unsupportedDocumentTypes,
          ...card.unsupportedUserGroups,
        ]} />
        <BoundaryList heading="Known limitations" items={card.knownLimitations} />
      </div>

      <Alert title="Reporting mechanism" tone="neutral">
        <p className="mt-2">{card.unsafeOutputReportingMechanism}</p>
        <p className="mt-2 cfn-type-body-small text-[var(--color-ink-muted)]">
          It asks for no source text, quote, prompt, credential, provider body, or sensitive free-text reason and sends nothing externally.
        </p>
      </Alert>
    </section>
  );
}

function ProviderCard({ card, option }: { card: SystemCard; option: ProviderOptionProjection }) {
  const admission = card.providerAdmissions.find(
    (record) => record.releaseConfigurationId === option.releaseConfigurationId,
  );
  const report = card.evaluationAdmissionReports.find(
    (record) => record.releaseConfigurationId === option.releaseConfigurationId,
  );
  const selectableLabel = option.selectable ? "Selectable" : "Not selectable";

  return (
    <li>
      <article className="cfn-surface grid gap-5 p-4" data-provider-id={option.providerId}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="cfn-type-label text-[var(--color-ink-muted)]">{option.displayOrder} of 4</p>
            <h4 className="cfn-type-heading-3">{option.displayName}</h4>
            <p>{option.modelDisplayName}</p>
            <p className="cfn-type-body-small text-[var(--color-ink-muted)]">{option.modelAliasDisclosure}</p>
          </div>
          <div className="flex max-w-full flex-wrap gap-2">
            <StatusMark label={humanize(option.evaluationStatus)} tone={toneFor(option.evaluationStatus)} />
            <StatusMark label={selectableLabel} tone={option.selectable ? "supported" : "neutral"} />
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Provider ID" value={option.providerId} code />
          <Detail label="Release configuration" value={option.releaseConfigurationId} code />
          <Detail label="Requested model" value={option.requestedModel} code />
          <Detail label="Service tier" value={option.disclosure.serviceTierLabel} />
          <Detail label="Mode" value={humanize(option.mode)} />
          <Detail label="Availability" value={humanize(option.availabilityStatus)} />
          <Detail label="Adapter version" value={option.adapterVersion} code />
          <Detail label="Disclosure version" value={option.disclosure.disclosureVersion} />
          <Detail label="Storage mode" value={humanize(option.disclosure.storageMode)} code />
          <Detail label="Retention setting" value={humanize(option.disclosure.retentionSetting)} code />
          <Detail label="Provider transmission" value={option.providerTransmission ? "Yes, only after an explicit eligible start" : "No provider transmission"} />
          <Detail label="Last disclosure verification" value={option.disclosure.lastVerified} />
        </dl>

        <div className="grid gap-3 border-l-4 border-[var(--color-border-strong)] pl-4">
          <p><span className="font-semibold">Data flow:</span> {option.disclosure.dataFlowSummary}</p>
          <p><span className="font-semibold">Content categories:</span> {option.disclosure.providerContentCategories.join(", ")}</p>
          <p><span className="font-semibold">Retention limitation:</span> {option.disclosure.retentionLimitation}</p>
          <p><span className="font-semibold">Training-use disclosure:</span> {option.disclosure.trainingUseDisclosure}</p>
          <p><span className="font-semibold">Inference setting:</span> <InferenceSetting option={option} /></p>
          <p><span className="font-semibold">Scope:</span> Bundled synthetic fixture only. Raw PDF sent: No. Tools enabled: No.</p>
        </div>

        {option.providerId === "mistral" ? (
          <Alert title="Mistral availability limitation" tone="warning">
            <p className="mt-2">
              Exact model <span className="cfn-type-code">mistral-small-2603</span> is {option.selectable ? "selectable only for the approved synthetic scope" : "not selectable"}. Static admission is {humanize(option.evaluationStatus).toLowerCase()} and deployed-account availability is {humanize(option.deployedAccountReleaseAvailabilityStatus).toLowerCase()}.
            </p>
            <p className="mt-2">
              Free-tier training opt-out is not claimed. Inputs and outputs may be retained for up to 30 days for abuse monitoring; free zero data retention is not available or claimed.
            </p>
          </Alert>
        ) : null}

        {admission ? (
          <div className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-warning)] bg-[var(--color-warning-subtle)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h5 className="cfn-type-label">Reviewed static admission</h5>
              <StatusMark label={humanize(admission.evaluationStatus)} tone={toneFor(admission.evaluationStatus)} />
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Detail label="Accepted report identity" value={admission.evaluationReportId ?? "No report accepted by the static admission record"} code={Boolean(admission.evaluationReportId)} />
              <Detail label="Accepted report digest" value={admission.evaluationReportDigest ?? "No accepted report digest"} code={Boolean(admission.evaluationReportDigest)} />
              <Detail label="Recorded at" value={admission.recordedAt ?? "Not recorded"} />
              <Detail label="Admission requirement" value={admission.evaluationStatus === "not_evaluated" ? "Evaluation required" : admission.evaluationStatus === "passed" ? "Static evaluation recorded" : "Evaluation failure blocks admission"} />
              <Detail label="Deployed-account release availability" value={humanize(admission.deployedAccountReleaseAvailability.status)} />
              <Detail label="Evaluated configuration digest" value={admission.evaluatedConfiguration.evaluatedConfigurationDigest} code />
              <Detail label="Inference setting" value={`${humanize(admission.evaluatedConfiguration.inferenceSetting.kind)}: ${admission.evaluatedConfiguration.inferenceSetting.value}`} />
            </dl>
          </div>
        ) : (
          <p className="text-[var(--color-ink-muted)]">Local replay has no live-provider admission record.</p>
        )}

        {report ? (
          <div className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-neutral-subtle)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h5 className="cfn-type-label">Linked evaluation evidence report</h5>
              <StatusMark label={humanize(report.status)} tone={toneFor(report.status)} />
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Detail label="Exact report ID" value={report.id} code />
              <Detail label="Canonical report digest" value={report.reportDigest} code />
              <Detail label="Release binding" value={report.releaseConfigurationId} code />
              <Detail label="Generated at" value={report.generatedAt} />
            </dl>
            <a className="inline-flex min-h-11 items-center gap-2 font-semibold" href={`#report-${report.releaseConfigurationId}`}>
              Inspect every recorded result and gate <ArrowRight aria-hidden="true" size={16} />
            </a>
            <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
              {reportBoundaryText(report.status)}
            </p>
          </div>
        ) : option.providerId !== "local_replay" ? (
          <Alert title="Linked evaluation report unavailable" tone="danger">
            <p className="mt-2">No exact report identity or digest is available for this release. It remains non-selectable.</p>
          </Alert>
        ) : null}

        {option.providerId === "local_replay" ? (
          <a className="inline-flex min-h-11 items-center gap-2 font-semibold" href="#replay-continuity">
            Inspect replay continuity evidence <ExternalLink aria-hidden="true" size={16} />
          </a>
        ) : null}
      </article>
    </li>
  );
}

function BoundaryList({ heading, items }: { heading: string; items: string[] }) {
  return (
    <Card className="grid content-start gap-3">
      <h3 className="cfn-type-heading-3">{heading}</h3>
      <ul className="grid list-disc gap-2 pl-5">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </Card>
  );
}

export function RunHistory({
  selectedRelease,
  attemptedRuns,
  nonRunAttempts,
  currentRun,
  checkpoint,
}: {
  selectedRelease: ProviderOptionProjection | null;
  attemptedRuns: AnalysisRun[];
  nonRunAttempts: NonRunAnalysisAttempt[];
  currentRun: AnalysisRun | null;
  checkpoint: SystemCard["activeCheckpoint"];
}) {
  return (
    <section aria-labelledby="session-provenance-heading" className="grid min-w-0 gap-4">
      <div>
        <p className="cfn-type-label text-[var(--color-brand)]">Current browser session</p>
        <h2 className="cfn-type-heading-2" id="session-provenance-heading">Provider, replay, and checkpoint provenance</h2>
        <p className="text-[var(--color-ink-muted)]">
          Browser-session history is kept separate from static admission and evaluation evidence.
        </p>
      </div>

      <Card className="grid gap-3">
        <h3 className="cfn-type-heading-3">Selected release</h3>
        {selectedRelease ? (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Provider" value={selectedRelease.displayName} />
            <Detail label="Release" value={selectedRelease.releaseConfigurationId} code />
            <Detail label="Requested model" value={selectedRelease.requestedModel} code />
            <Detail label="Tier" value={selectedRelease.disclosure.serviceTierLabel} />
          </dl>
        ) : (
          <p>No analysis mode is selected in the current case. No run or provider transmission is implied.</p>
        )}
      </Card>

      <div className="grid gap-4">
        <h3 className="cfn-type-heading-3">Attempted runs</h3>
        {attemptedRuns.length ? (
          <ol className="grid gap-4">
            {attemptedRuns.map((run) => <RunCard current={run.id === currentRun?.id} key={run.id} run={run} />)}
          </ol>
        ) : (
          <Alert title="No attempted run" tone="neutral">
            <p className="mt-2">No live or replay run exists in the current browser-session case.</p>
          </Alert>
        )}
      </div>

      <div className="grid gap-4">
        <h3 className="cfn-type-heading-3">Non-run attempts</h3>
        {nonRunAttempts.length ? (
          <ol className="grid gap-3">
            {nonRunAttempts.map((attempt) => <NonRunCard attempt={attempt} key={attempt.id} />)}
          </ol>
        ) : (
          <p className="text-[var(--color-ink-muted)]">No preflight rejection or unknown browser-transport outcome is recorded.</p>
        )}
      </div>

      {checkpoint ? <CheckpointCard checkpoint={checkpoint} /> : (
        <Alert title="No active prepared checkpoint" tone="neutral">
          <p className="mt-2">The current active run is not backed by DEMO-CHECKPOINT-REVIEW.</p>
        </Alert>
      )}
    </section>
  );
}

function RunCard({ run, current }: { run: AnalysisRun; current: boolean }) {
  const statusLabel = run.status === "succeeded" ? "Succeeded" : "Failed";
  const failure = run.status === "failed" ? run.failure as { classification: string } : null;
  return (
    <li>
      <article className="cfn-surface grid gap-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="cfn-type-heading-3">{run.id}</h4>
            <p>{PROVIDER_LABELS[run.provider.providerId] ?? run.provider.providerId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {current ? <StatusMark label="Current run" tone="brand" /> : null}
            <StatusMark label={statusLabel} tone={run.status === "succeeded" ? "supported" : "danger"} />
            <StatusMark label={run.mode === "live" ? "Live provider run" : "Bundled deterministic replay, not live AI"} tone={run.mode === "live" ? "brand" : "neutral"} />
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Release" value={run.provider.releaseConfigurationId} code />
          <Detail label="Requested model" value={run.provider.requestedModel} code />
          <Detail label="Returned model" value={run.provider.returnedModel ?? "Not returned"} code={Boolean(run.provider.returnedModel)} />
          <Detail label="Service tier" value={run.provider.serviceTier} />
          <Detail label="Disclosure version" value={run.provider.disclosureVersion} />
          <Detail label="Inference setting" value={`${humanize(run.provider.inferenceSetting.kind)}: ${run.provider.inferenceSetting.value}`} />
          <Detail label="Transmission" value={run.provider.providerTransmission ? "Provider transmission occurred" : "No provider transmission"} />
          <Detail label="Recovery selection" value={humanize(run.recovery.selectionReason)} />
          <Detail label="Recovery of run" value={run.recovery.recoveryOfRunId ?? "Not a linked recovery"} code={Boolean(run.recovery.recoveryOfRunId)} />
          <Detail label="Started" value={run.startedAt} />
          <Detail label="Completed" value={run.completedAt} />
          <Detail label="Duration" value={`${run.durationMs} ms`} />
        </dl>
        {failure ? (
          <Alert title="Safe failure" tone="danger">
            <p className="mt-2">Category: {humanize(failure.classification)}. No candidate or citation output was accepted.</p>
          </Alert>
        ) : null}
      </article>
    </li>
  );
}

function NonRunCard({ attempt }: { attempt: NonRunAnalysisAttempt }) {
  return (
    <li>
      <article className="cfn-surface grid gap-3 p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <h4 className="cfn-type-heading-3">{attempt.kind === "preflight_rejection" ? "Preflight rejection" : "Browser transport failure"}</h4>
          <StatusMark label="No output accepted" tone="warning" />
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Attempt ID" value={attempt.id} code />
          <Detail label="Start command" value={attempt.startCommandId} code />
          <Detail label="Audit event" value={attempt.auditEventId} code />
          <Detail label="Provider" value={attempt.providerSelection.providerId} code />
          <Detail label="Release" value={attempt.providerSelection.releaseConfigurationId} code />
          <Detail label="Reason" value={humanize(attempt.reasonCode)} code />
          <Detail label="Transmission" value={humanize(attempt.transmissionStatus)} />
          <Detail label="Remote execution" value={humanize(attempt.remoteExecutionStatus)} />
        </dl>
        {attempt.kind === "transport_failure" ? (
          <p className="font-semibold">Remote outcome unknown. No output was accepted and no run ID or recovery link was invented.</p>
        ) : (
          <p className="font-semibold">Not transmitted and not started. No run ID was created.</p>
        )}
      </article>
    </li>
  );
}

function CheckpointCard({ checkpoint }: { checkpoint: NonNullable<SystemCard["activeCheckpoint"]> }) {
  return (
    <Card className="grid gap-4 border-[var(--color-brand)] bg-[var(--color-brand-subtle)]">
      <div>
        <p className="cfn-type-label text-[var(--color-brand)]">Active prepared checkpoint</p>
        <h3 className="cfn-type-heading-3">{checkpoint.visibleLabel}</h3>
        <p className="font-semibold">{checkpoint.replayVisibleLabel}</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Checkpoint ID" value={checkpoint.id} code />
        <Detail label="Bundle version" value={checkpoint.bundleVersion} />
        <Detail label="Checkpoint version" value={checkpoint.checkpointVersion} />
        <Detail label="Replay version" value={checkpoint.replayVersion} />
        <Detail label="Fixture version" value={checkpoint.fixtureVersion} />
        <Detail label="Decision provenance" value="Fixture reviewer" />
        <Detail label="Provider transmission" value="No provider transmission" />
        <Detail label="Outcome projection version" value={checkpoint.postDecisionHashProjectionVersion} />
      </dl>
    </Card>
  );
}
