"use client";

import { useId, useState } from "react";
import { ArrowRight, FileSearch, ShieldAlert } from "lucide-react";
import type {
  CaseCandidate,
  CaseCommand,
  CaseState,
  EvidenceDependency,
  ReviewIntent,
} from "../../../lib/contracts";
import {
  EvidenceNatureStatus,
  ItemOriginStatus,
  ReviewStatusBadge,
  SupportStatusBadge,
} from "../../../components/status";
import { Alert, Button, FieldError, Label, Textarea } from "../../../components/ui";
import {
  CitationLink,
  type CaseCommandDispatcher,
  type SourceSelection,
} from "../source";

type ReasonedAction = "edit" | "reject" | "mark_uncertain" | "accept_as_limitation";

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

function dependencyTarget(dependency: EvidenceDependency) {
  if (dependency.kind === "source") return dependency.sourceSegmentId;
  if (dependency.kind === "candidate") return dependency.candidateId;
  return dependency.nexusCandidateId;
}

function readable(value: string) {
  return value.replaceAll("_", " ");
}

function canAcceptSuggestion(candidate: CaseCandidate) {
  return (
    candidate.assertionMode !== "unknown_state" &&
    candidate.assertionMode !== "limitation" &&
    candidate.assertionMode !== "gap" &&
    candidate.supportStatus !== "insufficient_evidence" &&
    candidate.supportStatus !== "citation_unresolved" &&
    candidate.supportStatus !== "not_processed" &&
    candidate.relatedCoverageIssueIds.length === 0 &&
    candidate.prohibitedConclusionCheck === "passed"
  );
}

function canRecordLimitation(candidate: CaseCandidate) {
  return (
    candidate.assertionMode === "limitation" ||
    candidate.assertionMode === "gap" ||
    (candidate.reviewStatus === "invalidated" &&
      candidate.assertionMode === "positive_proposition" &&
      candidate.supportStatus === "insufficient_evidence")
  );
}

function reasonedActionLabel(action: ReasonedAction) {
  if (action === "edit") return "Edit wording";
  if (action === "reject") return "Reject suggestion";
  if (action === "mark_uncertain") return "Mark uncertain";
  return "Record as limitation";
}

export function CandidateReviewActions({
  candidate,
  state,
  onCommand,
  allowWithdrawal = false,
  onWithdrawRequest,
  compact = false,
}: {
  candidate: CaseCandidate;
  state: CaseState;
  onCommand: CaseCommandDispatcher;
  allowWithdrawal?: boolean;
  onWithdrawRequest?: (candidate: CaseCandidate) => void;
  compact?: boolean;
}) {
  const fieldId = useId();
  const [activeAction, setActiveAction] = useState<ReasonedAction | null>(null);
  const [editedText, setEditedText] = useState(candidate.currentText);
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [commandMessage, setCommandMessage] = useState<string | null>(null);
  const isReviewable =
    candidate.reviewRequirement === "individual" &&
    candidate.inclusionStatus === "active";

  async function sendReviewIntent(intent: ReviewIntent) {
    setCommandMessage(null);
    const result = await onCommand({
      type: "review_candidate",
      meta: commandMeta(state, `review-${candidate.id.toLowerCase()}`),
      intent,
    });
    if (result && !result.ok) {
      setCommandMessage(`Review action was not accepted: ${result.reason ?? "unknown reason"}.`);
      return false;
    }
    setCommandMessage(`${candidate.id} review recorded in canonical case state.`);
    return true;
  }

  async function submitReasonedAction() {
    if (!activeAction) return;
    const conciseReason = reason.trim();
    if (!conciseReason) {
      setFieldError("Add a concise reason before recording this action.");
      return;
    }
    if (
      (activeAction === "edit" || activeAction === "accept_as_limitation") &&
      !editedText.trim()
    ) {
      setFieldError("Enter the wording to record.");
      return;
    }
    if (
      (activeAction === "edit" || activeAction === "accept_as_limitation") &&
      editedText.trim() === candidate.currentText.trim()
    ) {
      setFieldError("The new wording must differ from the current wording.");
      return;
    }

    let intent: ReviewIntent;
    if (activeAction === "edit") {
      intent = {
        candidateId: candidate.id,
        action: "edit",
        editedText: editedText.trim(),
        reason: conciseReason,
      };
    } else if (activeAction === "accept_as_limitation") {
      intent = {
        candidateId: candidate.id,
        action: "accept_as_limitation",
        limitationText: editedText.trim(),
        reason: conciseReason,
      };
    } else {
      intent = {
        candidateId: candidate.id,
        action: activeAction,
        reason: conciseReason,
      };
    }

    if (await sendReviewIntent(intent)) {
      setActiveAction(null);
      setReason("");
      setFieldError(null);
    }
  }

  if (candidate.reviewRequirement === "derived_summary") {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        Derived summary — its canonical status follows reviewed dependencies. No duplicate review action is created.
      </p>
    );
  }

  if (candidate.reviewRequirement === "optional") {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        Informational Nexus row — no additional approval is required.
      </p>
    );
  }

  if (candidate.inclusionStatus === "withdrawn") {
    return (
      <Alert title="Withdrawn from current findings" tone="warning">
        This item remains in the audit trail and is excluded from active review and export.
      </Alert>
    );
  }

  return (
    <div aria-label={`Individual review actions for ${candidate.id}`} className="grid gap-3">
      <div className={`flex flex-wrap gap-2 ${compact ? "items-start" : ""}`}>
        {candidate.assertionMode === "unknown_state" ? (
          <Button
            disabled={!isReviewable}
            onClick={() =>
              sendReviewIntent({
                candidateId: candidate.id,
                action: "confirm_unknown",
                reason: null,
              })
            }
            variant="primary"
          >
            Confirm as unknown
          </Button>
        ) : null}

        {canAcceptSuggestion(candidate) ? (
          <Button
            disabled={!isReviewable}
            onClick={() =>
              sendReviewIntent({
                candidateId: candidate.id,
                action: "accept",
                reason: null,
              })
            }
            variant="primary"
          >
            Accept suggestion
          </Button>
        ) : null}

        {canRecordLimitation(candidate) ? (
          <Button
            disabled={!isReviewable}
            onClick={() => {
              setActiveAction("accept_as_limitation");
              setEditedText(candidate.currentText);
              setFieldError(null);
            }}
            variant="primary"
          >
            Record as limitation
          </Button>
        ) : null}

        {candidate.assertionMode !== "unknown_state" && !canRecordLimitation(candidate) ? (
          <Button
            disabled={!isReviewable}
            onClick={() => {
              setActiveAction("edit");
              setEditedText(candidate.currentText);
              setFieldError(null);
            }}
            variant="secondary"
          >
            Edit wording
          </Button>
        ) : null}

        <Button
          disabled={!isReviewable}
          onClick={() => {
            setActiveAction("reject");
            setFieldError(null);
          }}
          variant="secondary"
        >
          Reject suggestion
        </Button>
        <Button
          disabled={!isReviewable}
          onClick={() => {
            setActiveAction("mark_uncertain");
            setFieldError(null);
          }}
          variant="secondary"
        >
          Mark uncertain
        </Button>

        {allowWithdrawal &&
        onWithdrawRequest &&
        (candidate.reviewStatus === "human_accepted" ||
          candidate.reviewStatus === "human_edited") ? (
          <Button onClick={() => onWithdrawRequest(candidate)} variant="danger">
            Withdraw evidence
          </Button>
        ) : null}
      </div>

      {activeAction ? (
        <section
          aria-label={`${reasonedActionLabel(activeAction)} details`}
          className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] p-3"
        >
          <div>
            <p className="cfn-type-label">{reasonedActionLabel(activeAction)}</p>
            <p className="text-sm text-[var(--color-ink-muted)]">
              The original suggestion remains available in the review history.
            </p>
          </div>
          {activeAction === "edit" || activeAction === "accept_as_limitation" ? (
            <div className="grid gap-1">
              <Label htmlFor={`${fieldId}-wording`}>
                {activeAction === "edit" ? "Revised wording" : "Limitation wording"}
              </Label>
              <Textarea
                aria-describedby={fieldError ? `${fieldId}-error` : undefined}
                id={`${fieldId}-wording`}
                onChange={(event) => setEditedText(event.target.value)}
                value={editedText}
              />
            </div>
          ) : null}
          <div className="grid gap-1">
            <Label htmlFor={`${fieldId}-reason`}>Concise reason</Label>
            <Textarea
              aria-describedby={fieldError ? `${fieldId}-error` : undefined}
              id={`${fieldId}-reason`}
              onChange={(event) => setReason(event.target.value)}
              value={reason}
            />
          </div>
          {fieldError ? <FieldError id={`${fieldId}-error`}>{fieldError}</FieldError> : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={submitReasonedAction} variant="primary">
              Record individual action
            </Button>
            <Button
              onClick={() => {
                setActiveAction(null);
                setFieldError(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </section>
      ) : null}

      {commandMessage ? (
        <p
          className={
            commandMessage.includes("not accepted")
              ? "text-sm text-[var(--color-danger)]"
              : "text-sm text-[var(--color-supported)]"
          }
          role="status"
        >
          {commandMessage}
        </p>
      ) : null}
    </div>
  );
}

export function CandidateReviewCard({
  candidate,
  state,
  onCommand,
  onOpenSource,
  heroCandidateId,
  onWithdrawRequest,
}: {
  candidate: CaseCandidate;
  state: CaseState;
  onCommand: CaseCommandDispatcher;
  onOpenSource: (selection: SourceSelection) => void;
  heroCandidateId?: string;
  onWithdrawRequest?: (candidate: CaseCandidate) => void;
}) {
  const sourceDependencies = candidate.dependencies.filter(
    (
      dependency,
    ): dependency is Extract<EvidenceDependency, { kind: "source" }> =>
      dependency.kind === "source",
  );
  const supporting = candidate.dependencies.filter(
    (dependency) => dependency.relationship === "supports",
  );
  const limiting = candidate.dependencies.filter(
    (dependency) => dependency.relationship === "limits",
  );
  const contrary = candidate.dependencies.filter(
    (dependency) => dependency.relationship === "contradicts",
  );
  const latestDecision = [...state.reviews]
    .reverse()
    .find((decision) => decision.candidateId === candidate.id);

  return (
    <article
      aria-labelledby={`candidate-${candidate.id}-heading`}
      className="grid scroll-mt-6 gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      id={`candidate-${candidate.id}`}
      tabIndex={-1}
    >
      <header className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="cfn-type-code text-[var(--color-ink-muted)]">{candidate.id}</p>
            <h3 className="cfn-type-heading-3" id={`candidate-${candidate.id}-heading`}>
              {candidate.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <SupportStatusBadge value={candidate.supportStatus} />
            <ReviewStatusBadge value={candidate.reviewStatus} />
          </div>
        </div>
        <p className="font-semibold">{candidate.reviewQuestion}</p>
      </header>

      {candidate.reviewStatus === "invalidated" ? (
        <Alert title="Review invalidated" tone="warning">
          Support changed after a canonical dependency action. Re-check the current dependencies before recording a renewed individual review.
        </Alert>
      ) : null}
      {candidate.supportStatus === "insufficient_evidence" ? (
        <Alert title="Insufficient evidence" tone="warning">
          This positive proposition cannot be accepted. Reject it, mark it uncertain, or—after dependency invalidation—record only an explicit limitation when available.
        </Alert>
      ) : null}
      {candidate.assertionMode === "unknown_state" ? (
        <Alert title="Unknown is a valid result" tone="neutral">
          Confirming this item preserves the unknown state. It does not turn missing information into a negative finding.
        </Alert>
      ) : null}

      <section aria-label="Individual human review" className="grid gap-3 border-t border-[var(--color-border)] pt-4">
        <h4 className="cfn-type-label">Choose a review decision</h4>
        <CandidateReviewActions
          allowWithdrawal={candidate.id === heroCandidateId}
          candidate={candidate}
          onCommand={onCommand}
          onWithdrawRequest={onWithdrawRequest}
          state={state}
        />
      </section>

      <details className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3">
        <summary className="cursor-pointer font-semibold">View evidence and reasoning</summary>
        <div className="mt-4 grid gap-5">
          <div className="grid gap-3 lg:grid-cols-2">
            <section aria-label="Candidate wording" className="grid gap-2 rounded-[var(--radius-control)] bg-[var(--color-surface)] p-3">
              <div>
                <p className="cfn-type-label">Original suggestion</p>
                <p>{candidate.proposedText}</p>
              </div>
              <div>
                <p className="cfn-type-label">Current reviewed wording</p>
                <p>{candidate.currentText}</p>
              </div>
            </section>
            <section aria-label="Candidate status dimensions" className="grid content-start gap-3">
              <div className="flex flex-wrap gap-2">
                <ItemOriginStatus value={candidate.itemOrigin} />
                <SupportStatusBadge value={candidate.supportStatus} />
                <ReviewStatusBadge value={candidate.reviewStatus} />
              </div>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Assertion mode: {readable(candidate.assertionMode)} · Inclusion: {readable(candidate.inclusionStatus)}
              </p>
              {latestDecision ? (
                <p className="text-sm">
                  Last review: {readable(latestDecision.action)} by {latestDecision.actor === "fixture_reviewer" ? "Fixture reviewer" : "Current practitioner"}.
                </p>
              ) : (
                <p className="text-sm text-[var(--color-ink-muted)]">No individual review has been recorded.</p>
              )}
            </section>
          </div>

          <section aria-label="Dependency summary" className="grid gap-3">
            <div className="flex items-center gap-2">
              <ArrowRight aria-hidden="true" size={17} />
              <h4 className="cfn-type-label">Dependencies and limits</h4>
            </div>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="cfn-type-label">Supporting</dt>
                <dd className="text-sm">{supporting.length ? supporting.map(dependencyTarget).join(", ") : "None recorded"}</dd>
              </div>
              <div>
                <dt className="cfn-type-label">Limiting</dt>
                <dd className="text-sm">{limiting.length ? limiting.map(dependencyTarget).join(", ") : "None recorded"}</dd>
              </div>
              <div>
                <dt className="cfn-type-label">Contrary</dt>
                <dd className="text-sm">{contrary.length ? contrary.map(dependencyTarget).join(", ") : "None recorded"}</dd>
              </div>
            </dl>
            {candidate.dependencies.some((dependency) => !dependency.active) ? (
              <p className="text-sm text-[var(--color-warning)]">
                Inactive after recalculation: {candidate.dependencies.filter((dependency) => !dependency.active).map(dependencyTarget).join(", ")}.
              </p>
            ) : null}
          </section>

          {candidate.unknowns.length ? (
            <section aria-label="Unknowns" className="grid gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert aria-hidden="true" size={17} />
                <h4 className="cfn-type-label">Unknowns and limitations</h4>
              </div>
              <ul className="list-disc pl-5 text-sm">
                {candidate.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}
              </ul>
            </section>
          ) : null}

          {candidate.relatedCoverageIssueIds.length ? (
            <Alert title="Coverage warning" tone="warning">
              Related coverage issues: {candidate.relatedCoverageIssueIds.join(", ")}. Missing content is not filled or inferred.
            </Alert>
          ) : null}

          <section aria-label="Exact source access" className="grid gap-3">
            <div className="flex items-center gap-2">
              <FileSearch aria-hidden="true" size={17} />
              <h4 className="cfn-type-label">Exact masked sources</h4>
            </div>
            {sourceDependencies.length ? (
              <ul className="grid gap-2">
                {sourceDependencies.map((dependency) => (
                  <li className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3" key={dependency.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <EvidenceNatureStatus value={dependency.evidenceNature} />
                      <span className="text-sm">
                        {readable(dependency.relationship)} · {dependency.active ? "active" : "inactive after recalculation"}
                      </span>
                    </div>
                    <CitationLink
                      candidateId={candidate.id}
                      citationId={dependency.citationId}
                      onOpen={onOpenSource}
                      state={state}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--color-ink-muted)]">
                No source citation is attached. Any reviewed wording remains reviewer-authored context.
              </p>
            )}
          </section>
        </div>
      </details>
    </article>
  );
}
