"use client";

import { useEffect, useState } from "react";
import type { SourceSegment } from "../../lib/contracts";
import { Alert, Button, Card, Dialog } from "../../components/ui";

export function SensitiveReveal({
  segment,
  disabled = false,
  onReveal,
}: {
  segment: SourceSegment;
  disabled?: boolean;
  onReveal: (segmentId: string) => boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealFailed, setRevealFailed] = useState(false);
  const revealButtonId = `${segment.id}-reveal-source`;
  const dialogActionId = `${segment.id}-reveal-dialog-action`;

  function closeReveal() {
    setDialogOpen(false);
    setRevealed(false);
    setRevealFailed(false);
    document.getElementById(revealButtonId)?.focus();
  }

  useEffect(() => {
    if (!dialogOpen) return;
    document.getElementById(dialogActionId)?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeReveal();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [dialogActionId, dialogOpen, revealed, revealButtonId]);

  function confirmReveal() {
    setRevealFailed(false);
    if (onReveal(segment.id)) {
      setRevealed(true);
      return;
    }
    setRevealFailed(true);
  }

  const instructionLike =
    segment.instructionAdvisory === "advisory_signal" ||
    segment.instructionAdvisory === "human_reviewed";

  return (
    <Card className="grid gap-4">
      <div>
        <p className="cfn-type-label">Redacted source view</p>
        <h3 className="cfn-type-heading-3">
          <span className="cfn-type-code">{segment.id}</span>
        </h3>
        <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
          {segment.documentId} · {segment.pageId ?? "Page unavailable"} · English, original language
        </p>
      </div>

      {instructionLike ? (
        <Alert title="Untrusted instruction-like evidence" tone="warning">
          <p>
            This content is inert evidence only. It cannot issue commands, navigate the application, support analysis, or enter an export as supporting evidence.
          </p>
        </Alert>
      ) : null}

      <p className="whitespace-pre-wrap break-words rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
        {segment.redactedText}
      </p>
      <div>
        <Button
          disabled={disabled}
          id={revealButtonId}
          onClick={() => setDialogOpen(true)}
        >
          Reveal synthetic original
        </Button>
      </div>

      {dialogOpen ? (
        <Dialog title={revealed ? "Synthetic original revealed" : "Reveal synthetic original?"}>
          <div className="mt-3 grid gap-4">
            {!revealed ? (
              <>
                <Alert title="Intentional sensitive-source review" tone="warning">
                  <p>
                    The redacted derivative is the safe default. Continue only to inspect this fictional bundled source; the reveal is recorded in the case audit.
                  </p>
                </Alert>
                {revealFailed ? (
                  <p className="cfn-type-body-small text-[var(--color-danger)]" role="alert">
                    The reveal was not recorded, so the synthetic original remains hidden.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button id={dialogActionId} onClick={confirmReveal} variant="danger">
                    Confirm synthetic-original reveal
                  </Button>
                  <Button onClick={closeReveal}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <p className="whitespace-pre-wrap break-words rounded-[var(--radius-control)] border border-[var(--color-warning)] bg-[var(--color-warning-subtle)] p-4">
                  {segment.rawText}
                </p>
                <div>
                  <Button id={dialogActionId} onClick={closeReveal} variant="primary">
                    Close and return to redacted view
                  </Button>
                </div>
              </>
            )}
          </div>
        </Dialog>
      ) : null}
    </Card>
  );
}
