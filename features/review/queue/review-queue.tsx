"use client";

import { useMemo, useState } from "react";
import { Filter, LocateFixed } from "lucide-react";
import type { CaseCandidate, CaseState } from "../../../lib/contracts";
import { ReviewStatusBadge, SupportStatusBadge } from "../../../components/status";
import { Alert, Button } from "../../../components/ui";

export type QueueFilter =
  | "pending"
  | "accepted"
  | "edited"
  | "rejected"
  | "uncertain"
  | "conflict"
  | "citation_problem"
  | "export_blocker";

const filterLabels: Record<QueueFilter, string> = {
  pending: "Pending",
  accepted: "Accepted",
  edited: "Edited",
  rejected: "Rejected",
  uncertain: "Uncertain",
  conflict: "Conflict",
  citation_problem: "Citation problem",
  export_blocker: "Export blocker",
};

export function filterCanonicalReviewQueue(
  candidates: CaseCandidate[],
  filter: QueueFilter,
  earlyBlockerIds: string[],
) {
  const individual = candidates.filter(
    (candidate) => candidate.reviewRequirement === "individual",
  );
  if (filter === "pending") {
    return individual.filter(
      (candidate) =>
        candidate.inclusionStatus === "active" &&
        (candidate.reviewStatus === "pending" || candidate.reviewStatus === "invalidated"),
    );
  }
  if (filter === "accepted") {
    return individual.filter((candidate) => candidate.reviewStatus === "human_accepted");
  }
  if (filter === "edited") {
    return individual.filter((candidate) => candidate.reviewStatus === "human_edited");
  }
  if (filter === "rejected") {
    return individual.filter((candidate) => candidate.reviewStatus === "rejected");
  }
  if (filter === "uncertain") {
    return individual.filter((candidate) => candidate.reviewStatus === "uncertain");
  }
  if (filter === "conflict") {
    return individual.filter((candidate) => candidate.supportStatus === "conflicting");
  }
  if (filter === "citation_problem") {
    return individual.filter(
      (candidate) =>
        candidate.supportStatus === "citation_unresolved" ||
        candidate.dependencies.some((dependency) => !dependency.active && dependency.kind === "source"),
    );
  }
  return individual.filter(
    (candidate) =>
      earlyBlockerIds.includes(candidate.id) &&
      candidate.inclusionStatus === "active" &&
      (candidate.reviewStatus === "pending" || candidate.reviewStatus === "invalidated"),
  );
}

function targetId(candidate: CaseCandidate) {
  return candidate.kind === "context_gap"
    ? `gap-${candidate.id}`
    : `candidate-${candidate.id}`;
}

export function ReviewQueue({
  state,
  earlyBlockerIds,
}: {
  state: CaseState;
  earlyBlockerIds: string[];
}) {
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [focusMessage, setFocusMessage] = useState("");
  const candidates = useMemo(
    () => filterCanonicalReviewQueue(state.candidates, filter, earlyBlockerIds),
    [earlyBlockerIds, filter, state.candidates],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(filterLabels) as QueueFilter[]).map((key) => [
          key,
          filterCanonicalReviewQueue(state.candidates, key, earlyBlockerIds).length,
        ]),
      ) as Record<QueueFilter, number>,
    [earlyBlockerIds, state.candidates],
  );

  function moveToCandidate(candidate: CaseCandidate) {
    const target = document.getElementById(targetId(candidate));
    if (!target) {
      setFocusMessage(`The stable target for ${candidate.id} is not available in this view.`);
      return;
    }
    target.focus();
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    setFocusMessage(`Moved to ${candidate.id}. The ${filterLabels[filter]} queue filter is still selected.`);
  }

  return (
    <section aria-labelledby="review-queue-heading" className="grid gap-4" id="review-queue">
      <div className="flex items-start gap-3">
        <span className="rounded-full bg-[var(--color-brand-subtle)] p-2 text-[var(--color-brand)]">
          <Filter aria-hidden="true" size={20} />
        </span>
        <div>
          <p className="cfn-type-label text-[var(--color-ink-muted)]">Canonical worklist</p>
          <h2 className="cfn-type-heading-2" id="review-queue-heading">Review queue</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Filters are read-only projections. They never copy or persist candidate status.
          </p>
        </div>
      </div>

      <div aria-label="Review queue filters" className="flex flex-wrap gap-2" role="group">
        {(Object.keys(filterLabels) as QueueFilter[]).map((key) => (
          <Button
            aria-pressed={filter === key}
            className={filter === key ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]" : undefined}
            key={key}
            onClick={() => setFilter(key)}
            variant="secondary"
          >
            {filterLabels[key]} ({counts[key]})
          </Button>
        ))}
      </div>

      {filter === "export_blocker" ? (
        <Alert title="Early export remediation" tone="warning">
          This prepared review checkpoint exposes only the exact unresolved blocker IDs supplied by the trusted fixture. Resolved blockers leave this filter immediately.
        </Alert>
      ) : null}

      {candidates.length ? (
        <ol className="grid gap-3" aria-label={`${filterLabels[filter]} review items`}>
          {candidates.map((candidate) => (
            <li key={candidate.id}>
              <article className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="grid gap-2">
                  <div>
                    <p className="cfn-type-code text-[var(--color-ink-muted)]">{candidate.id}</p>
                    <h3 className="font-semibold">{candidate.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SupportStatusBadge value={candidate.supportStatus} />
                    <ReviewStatusBadge value={candidate.reviewStatus} />
                  </div>
                </div>
                <Button onClick={() => moveToCandidate(candidate)} variant="secondary">
                  <LocateFixed aria-hidden="true" size={17} />
                  Open stable target
                </Button>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <Alert title={`No ${filterLabels[filter].toLowerCase()} items`} tone="neutral">
          No canonical candidates currently match this filter. This is an explicit empty result, not a hidden success state.
        </Alert>
      )}
      <p aria-live="polite" className="sr-only" role="status">{focusMessage}</p>
    </section>
  );
}
