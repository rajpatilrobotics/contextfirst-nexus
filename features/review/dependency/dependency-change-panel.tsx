"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, GitBranch, RotateCcw, TriangleAlert } from "lucide-react";
import type { CaseCandidate, CaseCommand, CaseState } from "../../../lib/contracts";
import { ReviewStatusBadge, SupportStatusBadge } from "../../../components/status";
import { Alert, Button, FieldError, Label, Textarea } from "../../../components/ui";
import type { CaseCommandDispatcher } from "../source";

function commandMeta(state: CaseState, prefix: string): CaseCommand["meta"] {
  const createdAt = new Date().toISOString();
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    commandId: `${prefix}-${suffix}`,
    idempotencyKey: `${prefix}-idem-${suffix}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt,
  };
}

function dependencyTargetsCandidate(candidate: CaseCandidate, changedId: string) {
  return candidate.dependencies.some(
    (dependency) =>
      dependency.active &&
      ((dependency.kind === "candidate" && dependency.candidateId === changedId) ||
        (dependency.kind === "nexus" && dependency.nexusCandidateId === changedId)),
  );
}

export function selectCanonicalWithdrawalPreview(
  candidates: CaseCandidate[],
  changedId: string,
) {
  return candidates
    .filter((candidate) => dependencyTargetsCandidate(candidate, changedId))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function DependencyChangePanel({
  state,
  candidateToWithdraw,
  onCancelWithdrawal,
  onCommand,
}: {
  state: CaseState;
  candidateToWithdraw: CaseCandidate | null;
  onCancelWithdrawal: () => void;
  onCommand: CaseCommandDispatcher;
}) {
  const reasonId = useId();
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const latestChange = state.dependencyChanges.at(-1) ?? null;
  const seenChangeId = useRef(latestChange?.id ?? null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const preview = candidateToWithdraw
    ? selectCanonicalWithdrawalPreview(state.candidates, candidateToWithdraw.id)
    : [];

  useEffect(() => {
    if (candidateToWithdraw) {
      window.setTimeout(() => previewHeadingRef.current?.focus(), 0);
    }
  }, [candidateToWithdraw]);

  useEffect(() => {
    if (!latestChange || latestChange.id === seenChangeId.current) return;
    seenChangeId.current = latestChange.id;
    const affected = [
      latestChange.changedEntityId,
      ...latestChange.impacts.map((impact) => impact.candidateId),
    ];
    setAnnouncement(`Invalidated items: ${affected.join(", ")}. Export readiness revoked.`);
    window.setTimeout(() => summaryRef.current?.focus(), 0);
  }, [latestChange]);

  async function confirmWithdrawal() {
    if (!candidateToWithdraw) return;
    if (!reason.trim()) {
      setReasonError("Add a concise reason before withdrawing this accepted evidence.");
      return;
    }
    setReasonError(null);
    setCommandError(null);
    const result = await onCommand({
      type: "withdraw_candidate",
      meta: commandMeta(state, `withdraw-${candidateToWithdraw.id.toLowerCase()}`),
      candidateId: candidateToWithdraw.id,
      reason: reason.trim(),
    });
    if (result && !result.ok) {
      setCommandError(`Withdrawal was not accepted: ${result.reason ?? "unknown reason"}.`);
      return;
    }
    setReason("");
    onCancelWithdrawal();
  }

  const changedCandidate = latestChange
    ? state.candidates.find((candidate) => candidate.id === latestChange.changedEntityId) ?? null
    : null;
  const withdrawalDecision = latestChange
    ? [...state.reviews]
        .reverse()
        .find(
          (decision) =>
            decision.candidateId === latestChange.changedEntityId &&
            decision.action === "withdraw",
        )
    : null;

  return (
    <section aria-labelledby="dependency-change-heading" className="grid gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-[var(--color-brand-subtle)] p-2 text-[var(--color-brand)]">
          <GitBranch aria-hidden="true" size={20} />
        </div>
        <div>
          <p className="cfn-type-label text-[var(--color-ink-muted)]">Reachable-only recalculation</p>
          <h2 className="cfn-type-heading-2" id="dependency-change-heading">
            Dependency change
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Review the exact downstream effects before evidence is withdrawn. Unrelated decisions remain unchanged.
          </p>
        </div>
      </div>

      {candidateToWithdraw ? (
        <section
          aria-labelledby={`${reasonId}-preview-heading`}
          className="grid gap-4 rounded-[var(--radius-dialog)] border-2 border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-4 shadow-[var(--shadow-elevated)]"
          role="alertdialog"
        >
          <div>
            <p className="cfn-type-code text-[var(--color-danger)]">{candidateToWithdraw.id}</p>
            <h3
              className="cfn-type-heading-3"
              id={`${reasonId}-preview-heading`}
              ref={previewHeadingRef}
              tabIndex={-1}
            >
              Confirm evidence withdrawal
            </h3>
            <p>
              This removes the accepted candidate from active findings and recalculates only reachable dependants.
            </p>
          </div>

          <div>
            <h4 className="cfn-type-label">Items that will require renewed review</h4>
            {preview.length ? (
              <ul className="mt-2 grid gap-2">
                {preview.map((candidate) => (
                  <li
                    className="rounded-[var(--radius-control)] border border-[var(--color-danger)] bg-[var(--color-surface)] p-3"
                    key={candidate.id}
                  >
                    <span className="cfn-type-code">{candidate.id}</span>
                    <span className="block text-sm">{candidate.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Alert title="No canonical downstream impact" tone="warning">
                Withdrawal is blocked because no affected canonical dependency is available for preview.
              </Alert>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor={`${reasonId}-reason`}>Reason for withdrawal</Label>
            <Textarea
              aria-describedby={reasonError ? `${reasonId}-error` : undefined}
              autoFocus
              id={`${reasonId}-reason`}
              onChange={(event) => setReason(event.target.value)}
              value={reason}
            />
          </div>
          {reasonError ? <FieldError id={`${reasonId}-error`}>{reasonError}</FieldError> : null}
          {commandError ? <p className="text-sm text-[var(--color-danger)]" role="alert">{commandError}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={!preview.length} onClick={confirmWithdrawal} variant="danger">
              Withdraw evidence and recalculate
            </Button>
            <Button onClick={onCancelWithdrawal} variant="secondary">
              Keep evidence
            </Button>
          </div>
        </section>
      ) : null}

      {latestChange ? (
        <section
          aria-labelledby="dependency-summary-heading"
          className="grid scroll-mt-6 gap-4 rounded-[var(--radius-card)] border-2 border-[var(--color-warning)] bg-[var(--color-warning-subtle)] p-4"
          id="dependency-change-summary"
          ref={summaryRef}
          tabIndex={-1}
        >
          <div className="flex items-start gap-3">
            <RotateCcw aria-hidden="true" className="mt-1 shrink-0 text-[var(--color-warning)]" size={20} />
            <div>
              <p className="cfn-type-label text-[var(--color-warning)]">Persistent recalculation record</p>
              <h3 className="cfn-type-heading-3" id="dependency-summary-heading">
                Support changed after evidence withdrawal
              </h3>
              <p>
                {latestChange.changedEntityId} was withdrawn. Export readiness was revoked and the affected items below require renewed review.
              </p>
            </div>
          </div>

          {changedCandidate && withdrawalDecision ? (
            <div className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <p className="cfn-type-code">{changedCandidate.id}</p>
                <p className="text-sm">Included before; now withdrawn and excluded.</p>
                <p className="text-sm text-[var(--color-ink-muted)]">Reason recorded: {withdrawalDecision.reason}</p>
              </div>
              <ReviewStatusBadge value={changedCandidate.reviewStatus} />
            </div>
          ) : null}

          <ul className="grid gap-3">
            {latestChange.impacts.map((impact) => (
              <li
                className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                key={impact.candidateId}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="cfn-type-code">{impact.candidateId}</span>
                  <a className="font-semibold" href={`#candidate-${impact.candidateId}`}>
                    Renew individual review
                  </a>
                </div>
                <div className="grid items-center gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                  <div>
                    <p className="cfn-type-label">Before</p>
                    <div className="flex flex-wrap gap-2">
                      <SupportStatusBadge value={impact.previousSupportStatus} />
                      <ReviewStatusBadge value={impact.previousReviewStatus} />
                    </div>
                  </div>
                  <ArrowRight aria-hidden="true" className="hidden sm:block" size={20} />
                  <div>
                    <p className="cfn-type-label">After</p>
                    <div className="flex flex-wrap gap-2">
                      <SupportStatusBadge value={impact.resultingSupportStatus} />
                      <ReviewStatusBadge value={impact.resultingReviewStatus} />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[var(--color-ink-muted)]">{impact.explanation}</p>
              </li>
            ))}
          </ul>

          <Alert title="Export blocked pending renewed review" tone="warning">
            <span className="inline-flex items-start gap-2">
              <TriangleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
              The current export gate is stale. Unrelated reviewed decisions were preserved: {latestChange.preservedCandidateIds.length} canonical candidates.
            </span>
          </Alert>
        </section>
      ) : (
        <Alert title="No dependency change recorded" tone="neutral">
          The workspace will retain a before-and-after summary here after the accepted 2025-04-02 task candidate is withdrawn.
        </Alert>
      )}

      <p aria-atomic="true" aria-live="assertive" className="sr-only" role="status">
        {announcement}
      </p>
    </section>
  );
}
