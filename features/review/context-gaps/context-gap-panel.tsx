"use client";

import { useId, useState } from "react";
import { CircleHelp, UserRoundPen } from "lucide-react";
import type { CaseCandidate, CaseCommand, CaseState } from "../../../lib/contracts";
import { ReviewStatusBadge, SupportStatusBadge } from "../../../components/status";
import { Alert, Button, FieldError, Label, Textarea } from "../../../components/ui";
import { selectContextGaps } from "../../../lib/review";
import type { CaseCommandDispatcher } from "../source";

type ContextGap = Extract<CaseCandidate, { kind: "context_gap" }>;
type GapAction = "answered" | "deferred" | "outside_scope";
type GapIntent = Extract<CaseCommand, { type: "respond_context_gap" }>["intent"];

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

function responseLabel(status: ContextGap["responseStatus"]) {
  if (status === "unanswered") return "Unanswered";
  if (status === "answered") return "Answered with reviewer-supplied context";
  if (status === "deferred") return "Deferred";
  if (status === "outside_scope") return "Outside current scope";
  return "Preserved as unknown";
}

export function ContextGapPanel({
  gap,
  state,
  onCommand,
}: {
  gap: ContextGap;
  state: CaseState;
  onCommand: CaseCommandDispatcher;
}) {
  const fieldId = useId();
  const [activeAction, setActiveAction] = useState<GapAction | null>(null);
  const [responseText, setResponseText] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [commandMessage, setCommandMessage] = useState<string | null>(null);
  const reviewComplete = ["human_accepted", "human_edited", "rejected"].includes(
    gap.reviewStatus,
  );

  async function dispatchIntent(intent: GapIntent) {
    setCommandMessage(null);
    const result = await onCommand({
      type: "respond_context_gap",
      meta: commandMeta(state, `gap-${gap.id.toLowerCase()}`),
      intent,
    });
    if (result && !result.ok) {
      setCommandMessage(`Gap response was not accepted: ${result.reason ?? "unknown reason"}.`);
      return false;
    }
    setCommandMessage(`${gap.id} response recorded without changing source evidence.`);
    return true;
  }

  async function preserveUnknown() {
    await dispatchIntent({
      gapId: gap.id,
      responseStatus: "preserved_unknown",
      response: null,
      responseExplanation: null,
    });
  }

  async function submitResponse() {
    if (!activeAction) return;
    const value = responseText.trim();
    if (!value) {
      setFieldError(
        activeAction === "answered"
          ? "Add the practitioner-supplied context."
          : "Add a concise explanation for this gap status.",
      );
      return;
    }
    const intent: GapIntent =
      activeAction === "answered"
        ? {
            gapId: gap.id,
            responseStatus: "answered",
            response: value,
            responseExplanation: null,
          }
        : {
            gapId: gap.id,
            responseStatus: activeAction,
            response: null,
            responseExplanation: value,
          };
    if (await dispatchIntent(intent)) {
      setActiveAction(null);
      setResponseText("");
      setFieldError(null);
    }
  }

  async function completeGapReview() {
    setCommandMessage(null);
    const intent =
      gap.assertionMode === "unknown_state" &&
      gap.supportStatus !== "insufficient_evidence"
        ? {
            candidateId: gap.id,
            action: "confirm_unknown" as const,
            reason: null,
          }
        : {
            candidateId: gap.id,
            action: "reject" as const,
            reason: "The available sources do not establish this proposition.",
          };
    const result = await onCommand({
      type: "review_candidate",
      meta: commandMeta(state, `review-gap-${gap.id.toLowerCase()}`),
      intent,
    });
    if (result && !result.ok) {
      setCommandMessage(
        `Required review was not accepted: ${result.reason ?? "unknown reason"}.`,
      );
      return;
    }
    setCommandMessage(`${gap.id} required review is complete.`);
  }

  return (
    <article
      aria-labelledby={`gap-${gap.id}-heading`}
      className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      id={`candidate-${gap.id}`}
      tabIndex={-1}
    >
      <header className="grid gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="cfn-type-code text-[var(--color-ink-muted)]">{gap.id}</p>
            <h3 className="cfn-type-heading-3" id={`gap-${gap.id}-heading`}>
              {gap.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <SupportStatusBadge value={gap.supportStatus} />
            <ReviewStatusBadge value={gap.reviewStatus} />
          </div>
        </div>
        <p className="font-semibold">{gap.reviewQuestion}</p>
      </header>

      <div className="grid gap-2 rounded-[var(--radius-control)] bg-[var(--color-surface-subtle)] p-3">
        <p className="cfn-type-label">Context response</p>
        <p>{responseLabel(gap.responseStatus)}</p>
        {gap.responseStatus === "answered" ? (
          <div className="flex items-start gap-2 text-sm">
            <UserRoundPen aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
            <p>Reviewer-supplied context: {gap.response}</p>
          </div>
        ) : null}
        {gap.responseExplanation ? (
          <p className="text-sm text-[var(--color-ink-muted)]">Explanation: {gap.responseExplanation}</p>
        ) : null}
      </div>

      {gap.unknowns.length ? (
        <Alert title="Unknown from the available packet" tone="neutral">
          {gap.unknowns.join(" ")} This gap is not adverse evidence and does not have to be answered.
        </Alert>
      ) : null}

      <div aria-label={`Context gap actions for ${gap.id}`} className="flex flex-wrap gap-2">
        <Button disabled={reviewComplete} onClick={() => setActiveAction("answered")} variant="secondary">
          Answer
        </Button>
        <Button disabled={reviewComplete} onClick={() => setActiveAction("deferred")} variant="secondary">
          Defer
        </Button>
        <Button disabled={reviewComplete} onClick={preserveUnknown} variant="secondary">
          Preserve as unknown
        </Button>
        <Button disabled={reviewComplete} onClick={() => setActiveAction("outside_scope")} variant="secondary">
          Outside current scope
        </Button>
      </div>

      {activeAction ? (
        <section
          aria-label="Context gap response details"
          className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] p-3"
        >
          <div className="flex items-start gap-2">
            <CircleHelp aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
            <p className="text-sm">
              {activeAction === "answered"
                ? "This answer is reviewer-supplied context unless a new source is added."
                : "The explanation remains visible and does not become a negative inference."}
            </p>
          </div>
          <div className="grid gap-1">
            <Label htmlFor={`${fieldId}-response`}>
              {activeAction === "answered" ? "Reviewer-supplied context" : "Concise explanation"}
            </Label>
            <Textarea
              aria-describedby={fieldError ? `${fieldId}-error` : undefined}
              id={`${fieldId}-response`}
              onChange={(event) => setResponseText(event.target.value)}
              value={responseText}
            />
          </div>
          {fieldError ? <FieldError id={`${fieldId}-error`}>{fieldError}</FieldError> : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={submitResponse} variant="primary">Record gap response</Button>
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

      {reviewComplete ? (
        <Alert title="Required review complete" tone="neutral">
          This context gap now has a terminal practitioner decision and no longer blocks review completion.
        </Alert>
      ) : (
        <section className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-[var(--color-brand-subtle)] p-3">
          <div>
            <p className="cfn-type-label text-[var(--color-brand)]">Required decision</p>
            <p className="text-sm">
              Recording a context response preserves useful context, but a practitioner decision is still required to complete review.
            </p>
          </div>
          <Button onClick={completeGapReview} variant="primary">
            {gap.assertionMode === "unknown_state" &&
            gap.supportStatus !== "insufficient_evidence"
              ? "Confirm unknown and complete review"
              : "Reject suggestion and complete review"}
          </Button>
        </section>
      )}
      {commandMessage ? (
        <p
          className={commandMessage.includes("not accepted") ? "text-sm text-[var(--color-danger)]" : "text-sm text-[var(--color-supported)]"}
          role="status"
        >
          {commandMessage}
        </p>
      ) : null}
    </article>
  );
}

export function ContextGapList({
  state,
  onCommand,
}: {
  state: CaseState;
  onCommand: CaseCommandDispatcher;
}) {
  const gaps = selectContextGaps(state.candidates);
  return (
    <section aria-labelledby="context-gaps-heading" className="grid gap-4">
      <div>
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Missing and conflicting context</p>
        <h2 className="cfn-type-heading-2" id="context-gaps-heading">Context gaps</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Answer, defer, preserve as unknown, or keep outside the current scope. No response is forced.
        </p>
      </div>
      {gaps.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {gaps.map((gap) => <ContextGapPanel gap={gap} key={gap.id} onCommand={onCommand} state={state} />)}
        </div>
      ) : (
        <Alert title="No context-gap candidates" tone="neutral">
          The active canonical run contains no context-gap records. This is an explicit empty state, not an inference that no information is missing.
        </Alert>
      )}
    </section>
  );
}
