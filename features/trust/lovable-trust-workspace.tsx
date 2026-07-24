"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import {
  Chip,
  DemoOnlyNotice,
  SectionTitle,
} from "../../components/lovable/nexus-ui";
import { useCaseState } from "../../components/shell/case-state-context";
import type {
  AuditEvent,
  EvaluationCheck,
  GuidanceCard,
  SystemCard,
} from "../../lib/contracts";
import { UNSAFE_REPORT_CATEGORIES } from "./unsafe-output-report";

const TABS = [
  "System Card",
  "Safety Lab",
  "Evaluation",
  "Guidance",
  "Audit",
  "Report",
  "AI Boundaries",
] as const;
type Tab = (typeof TABS)[number];
type EvaluationDisplayResult = {
  actualProviderTransmission: boolean;
  checks: EvaluationCheck[];
  evidenceId: string;
  split: "development" | "held_out";
  status: "passed" | "failed";
};
type UnsafeReportCategory = (typeof UNSAFE_REPORT_CATEGORIES)[number]["value"];

export function LovableTrustWorkspace({
  systemCard,
  deterministicHarnessResults,
  guidanceCards,
}: {
  systemCard: SystemCard;
  deterministicHarnessResults: unknown[];
  guidanceCards: GuidanceCard[];
}) {
  const [tab, setTab] = useState<Tab>("System Card");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <SectionTitle
        eyebrow="Trust & Safety"
        title="How this workspace is bounded"
        description="This is a professional workbench. It does not decide trafficking status, credibility, guilt, or eligibility. Human review is the consequential act."
      />
      <div
        role="tablist"
        aria-label="Trust & Safety"
        className="mt-6 flex flex-wrap gap-1 border-b border-border"
      >
        {TABS.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] ${
              tab === item
                ? "border-b-2 border-[color:var(--amber)] text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "System Card" ? <SystemCardPanel systemCard={systemCard} /> : null}
        {tab === "Safety Lab" ? (
          <SafetyLabPanel results={deterministicHarnessResults} />
        ) : null}
        {tab === "Evaluation" ? (
          <EvaluationPanel results={deterministicHarnessResults} />
        ) : null}
        {tab === "Guidance" ? <GuidancePanel cards={guidanceCards} /> : null}
        {tab === "Audit" ? <AuditPanel /> : null}
        {tab === "Report" ? <ReportPanel /> : null}
        {tab === "AI Boundaries" ? <BoundariesPanel systemCard={systemCard} /> : null}
      </div>
    </div>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-border py-3 last:border-b-0 md:grid-cols-[220px_1fr]">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function SystemCardPanel({ systemCard }: { systemCard: SystemCard }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <Row title="Intended users">
        Qualified legal-aid, defence, and trained anti-trafficking practitioners;
        supervisors and designated reviewers within an authorized purpose.
      </Row>
      <Row title="Intended use">
        <ul className="space-y-1">
          {systemCard.intendedUse.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </Row>
      <Row title="Prohibited uses">
        <ul className="space-y-1">
          {systemCard.prohibitedUse.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </Row>
      <Row title="Known limitations">
        <ul className="space-y-1">
          {systemCard.knownLimitations.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </Row>
      <Row title="Human oversight">
        <ul className="space-y-1">
          {systemCard.humanReviewRequirements.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      </Row>
      <Row title="Provider availability">
        <div className="grid gap-2 sm:grid-cols-2">
          {systemCard.providers.map((provider) => (
            <div
              className="rounded-md border border-border bg-background px-3 py-2"
              key={provider.releaseConfigurationId}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{provider.displayName}</span>
                <Chip tone={provider.selectable ? "sage" : "mute"}>
                  {provider.selectable ? "Selectable" : "Unavailable"}
                </Chip>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {provider.mode === "deterministic_replay"
                  ? "Bundled deterministic replay · no provider transmission"
                  : `${provider.evaluationStatus.replaceAll("_", " ")} · ${provider.availabilityStatus.replaceAll("_", " ")}`}
              </div>
            </div>
          ))}
        </div>
      </Row>
      <Row title="Data handling (demonstration)">
        Browser-session state for one bundled fictional adult fixture. Raw PDFs are
        processed locally; replay input is frozen and provider transmission is false.
      </Row>
      <Row title="External transmission">
        Live analysis is {systemCard.liveAnalysisEnabled ? "enabled" : "disabled"}.
        The public judge path uses the bundled replay and does not transmit case
        sources to a model provider.
      </Row>
    </div>
  );
}

function SafetyLabPanel({ results }: { results: unknown[] }) {
  const typedResults = results as EvaluationDisplayResult[];
  const checks = typedResults.flatMap((result) =>
    result.checks.map((check) => ({
      description: check.observed,
      key: `${result.evidenceId}-${check.name}`,
      passed: check.passed,
      title: check.name,
    })),
  );
  return (
    <>
      <div className="mb-4 text-xs text-muted-foreground">
        Recorded deterministic harness evidence, not a real-world effectiveness claim.
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {checks.slice(0, 6).map((check) => (
          <div key={check.key} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 font-serif text-lg">
              {check.passed ? (
                <CheckCircle2 className="h-4 w-4 text-[color:var(--sage)]" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-[color:var(--rust)]" />
              )}
              {check.title}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{check.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function EvaluationPanel({ results }: { results: unknown[] }) {
  const typedResults = results as EvaluationDisplayResult[];
  const passed = typedResults.filter((result) => result.status === "passed").length;
  const heldOut = typedResults.filter((result) => result.split === "held_out");
  const heldOutPassed = heldOut.filter((result) => result.status === "passed").length;
  const providerTransmissions = typedResults.filter(
    (result) => result.actualProviderTransmission,
  ).length;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Deterministic synthetic harness
      </div>
      <h2 className="mt-1 font-serif text-2xl">
        Recorded checks, held-out evidence, and transmission truth
      </h2>
      <div className="mt-2 text-xs text-muted-foreground">
        Synthetic evaluation evidence — not a live effectiveness, accuracy, or
        production-readiness claim.
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Passed recorded results",
            value: `${passed} / ${typedResults.length}`,
            tone:
              passed === typedResults.length ? ("sage" as const) : ("amber" as const),
          },
          {
            label: "Held-out results passed",
            value: `${heldOutPassed} / ${heldOut.length}`,
            tone:
              heldOutPassed === heldOut.length ? ("sage" as const) : ("amber" as const),
          },
          {
            label: "Provider transmissions",
            value: providerTransmissions,
            tone: providerTransmissions === 0 ? ("sage" as const) : ("rust" as const),
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-border bg-background p-4"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {metric.label}
            </div>
            <div className="mt-2 font-serif text-3xl">{metric.value}</div>
            <div className="mt-2">
              <Chip tone={metric.tone}>Recorded evidence</Chip>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        Results are versioned synthetic records. Provider admission and deployed-account
        availability remain separate release gates.
      </div>
    </div>
  );
}

function GuidancePanel({ cards }: { cards: GuidanceCard[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cards.map((card) => (
        <article key={card.id} className="rounded-lg border border-border bg-card p-4">
          <div className="font-serif text-lg">{card.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{card.allowedUse}</div>
          <div className="mt-3 font-mono text-[10px] text-muted-foreground">
            {card.sourceRegisterId} · {card.locator}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {card.limitation} Reference material remains separate from case evidence and
            jurisdiction-specific legal advice.
          </div>
        </article>
      ))}
    </div>
  );
}

function eventLabel(event: AuditEvent) {
  return event.eventType
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function AuditPanel() {
  const { state } = useCaseState();
  const rows = [...state.audit].sort((left, right) => right.sequence - left.sequence);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            <th className="p-3">Timestamp</th>
            <th className="p-3">Event</th>
            <th className="p-3">Actor</th>
            <th className="p-3">Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((event) => (
            <tr key={event.id} className="border-b border-border/60 last:border-0">
              <td className="p-3 font-mono text-xs">{event.createdAt}</td>
              <td className="p-3">
                <div>{eventLabel(event)}</div>
                <div className="mt-1 max-w-xl text-xs text-muted-foreground">
                  {event.summary}
                </div>
              </td>
              <td className="p-3">{event.actor.replaceAll("_", " ")}</td>
              <td className="p-3">
                <Chip tone={event.eventType.includes("blocked") ? "rust" : "neutral"}>
                  recorded
                </Chip>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td className="p-4 text-sm text-muted-foreground" colSpan={4}>
                No audit events are recorded in this browser session.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function ReportPanel() {
  const { state, dispatchCaseCommand } = useCaseState();
  const entities = useMemo(
    () =>
      Array.from(
        new Set([
          state.caseId,
          ...state.analysisRuns.map((run) => run.id),
          ...state.candidates.map((candidate) => candidate.id),
          ...state.citations.map((citation) => citation.id),
          ...state.exports.map((record) => record.id),
        ]),
      ).sort(),
    [
      state.analysisRuns,
      state.candidates,
      state.caseId,
      state.citations,
      state.exports,
    ],
  );
  const [category, setCategory] = useState<UnsafeReportCategory>(
    UNSAFE_REPORT_CATEGORIES[0].value,
  );
  const [entityId, setEntityId] = useState(entities[0] ?? state.caseId);
  const [message, setMessage] = useState<string | null>(null);
  const sequence = useRef(0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!entities.includes(entityId)) {
      setMessage("Choose one listed case entity.");
      return;
    }
    sequence.current += 1;
    const createdAt = new Date().toISOString();
    const token = `${createdAt}-${sequence.current}`;
    const result = dispatchCaseCommand({
      type: "report_unsafe_output",
      meta: {
        commandId: `cmd-unsafe-report-${token}`,
        idempotencyKey: `idem-unsafe-report-${token}`,
        expectedCaseRevision: state.caseRevision,
        actor: "current_practitioner",
        createdAt,
      },
      entityIds: [entityId],
      reasonCode: category,
    });
    setMessage(
      result.ok
        ? `Local report recorded for ${entityId}. Nothing was transmitted.`
        : "The local report could not be recorded because the case state changed.",
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-serif text-2xl">Report a local safety concern</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This records a safe category and existing entity ID in the canonical local
        audit history. Nothing is transmitted.
      </p>
      <div className="mt-4">
        <DemoOnlyNotice>
          no free-text evidence, identifiers, prompts, or provider output are accepted.
        </DemoOnlyNotice>
      </div>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Concern category</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-2"
            onChange={(event) =>
              setCategory(
                event.target.value as (typeof UNSAFE_REPORT_CATEGORIES)[number]["value"],
              )
            }
            value={category}
          >
            {UNSAFE_REPORT_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Affected entity ID</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-2"
            onChange={(event) => setEntityId(event.target.value)}
            value={entityId}
          >
            {entities.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Local audit event only. Nothing transmitted or emailed.
          </span>
          <button
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            type="submit"
          >
            Record local report
          </button>
        </div>
        {message ? (
          <div
            className="rounded-md border border-[color:var(--sage)]/40 bg-[color-mix(in_oklab,var(--sage)_10%,transparent)] px-3 py-2 text-xs"
            role="status"
          >
            {message}
          </div>
        ) : null}
      </div>
    </form>
  );
}

function BoundariesPanel({ systemCard }: { systemCard: SystemCard }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 font-serif text-lg">
          <ShieldCheck className="h-4 w-4 text-[color:var(--sage)]" /> May assist
          with
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          {systemCard.intendedUse.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--sage)]" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 font-serif text-lg">
          <AlertTriangle className="h-4 w-4 text-[color:var(--rust)]" /> Must not
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          {systemCard.prohibitedUse.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--rust)]" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
