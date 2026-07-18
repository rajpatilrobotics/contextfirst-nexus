"use client";

import { useRef, useState, type FormEvent } from "react";
import { FileWarning, SendHorizontal } from "lucide-react";
import type { CaseCommand, CaseState } from "../../lib/contracts";
import type { CaseCommandResult } from "../../lib/state";
import { Alert, Button, Label, Select } from "../../components/ui";

export const UNSAFE_REPORT_CATEGORIES = [
  { value: "prohibited_claim", label: "Prohibited claim" },
  { value: "privacy_concern", label: "Privacy concern" },
  { value: "citation_problem", label: "Citation problem" },
  { value: "other_safe_category", label: "Other safe category" },
] as const;

type UnsafeReportCategory = (typeof UNSAFE_REPORT_CATEGORIES)[number]["value"];

function entityOptions(state: CaseState) {
  return Array.from(new Set([
    state.caseId,
    ...state.analysisRuns.map((run) => run.id),
    ...state.candidates.map((candidate) => candidate.id),
    ...state.citations.map((citation) => citation.id),
    ...state.exports.map((record) => record.id),
  ])).sort();
}

export function UnsafeOutputReport({
  state,
  onCommand,
}: {
  state: CaseState;
  onCommand: (command: CaseCommand) => CaseCommandResult;
}) {
  const entities = entityOptions(state);
  const [category, setCategory] = useState<UnsafeReportCategory>("prohibited_claim");
  const [entityId, setEntityId] = useState(entities[0] ?? state.caseId);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (!entities.includes(entityId)) {
      setError("Choose one listed case entity.");
      return;
    }
    sequence.current += 1;
    const createdAt = new Date().toISOString();
    const token = `${createdAt}-${sequence.current}`;
    const result = onCommand({
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
    if (!result.ok) {
      setError("The local report could not be recorded because the case state changed. Review the current case and try again.");
      return;
    }
    setMessage(`Local report recorded for ${entityId}. Nothing was transmitted.`);
  }

  return (
    <section aria-labelledby="unsafe-report-heading" className="grid min-w-0 gap-4" id="unsafe-output-report">
      <div className="flex items-start gap-3">
        <FileWarning aria-hidden="true" className="mt-1 shrink-0 text-[var(--color-warning)]" size={22} />
        <div>
          <p className="cfn-type-label text-[var(--color-brand)]">Local browser-session action</p>
          <h2 className="cfn-type-heading-2" id="unsafe-report-heading">Unsafe Output Report</h2>
          <p className="text-[var(--color-ink-muted)]">
            Record one safe category and one affected entity ID. Do not paste or enter evidence, identifiers, prompts, provider output, credentials, or sensitive reasons.
          </p>
        </div>
      </div>

      <Alert title="Local only — no automatic transmission" tone="warning">
        <p className="mt-2">
          Submission appends a canonical local audit event. It does not call a provider, support service, analytics endpoint, email system, or external message action.
        </p>
      </Alert>

      <form className="cfn-surface grid gap-5 p-4" onSubmit={submit}>
        <div className="grid gap-2">
          <Label htmlFor="unsafe-report-category">Safe report category</Label>
          <Select
            id="unsafe-report-category"
            onChange={(event) => setCategory(event.target.value as UnsafeReportCategory)}
            value={category}
          >
            {UNSAFE_REPORT_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="unsafe-report-entity">Affected entity ID</Label>
          <Select id="unsafe-report-entity" onChange={(event) => setEntityId(event.target.value)} value={entityId}>
            {entities.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
          <p className="cfn-type-body-small text-[var(--color-ink-muted)]" id="unsafe-report-entity-help">
            Only IDs already present in the canonical demo case are available.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary">
            <SendHorizontal aria-hidden="true" size={16} /> Record local report
          </Button>
          <span className="cfn-type-body-small text-[var(--color-ink-muted)]">No free-text report field exists.</span>
        </div>
        {error ? <p className="text-[var(--color-danger)]" role="alert">{error}</p> : null}
        {message ? <p className="font-semibold text-[var(--color-supported)]" role="status">{message}</p> : null}
      </form>
    </section>
  );
}
