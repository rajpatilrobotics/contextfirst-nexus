"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CaseCommand, CaseState, Citation, SourceSegment } from "../../../lib/contracts";
import { resolveCitation } from "../../../lib/citations";
import { Alert, Button } from "../../../components/ui";

export type SourceMode = "desktop" | "tablet" | "mobile";

export type SourceSelection = {
  candidateId: string;
  citationId: string;
  invoker: HTMLElement | null;
};

export type CaseCommandDispatcher = (
  command: CaseCommand,
) => void | { ok: boolean; reason?: string } | Promise<void | { ok: boolean; reason?: string }>;

type SourceDrawerProps = {
  state: CaseState;
  selection: SourceSelection | null;
  mode: SourceMode;
  onClose: () => void;
  onCommand: CaseCommandDispatcher;
};

type Range = { start: number; end: number };

function commandMeta(state: CaseState, prefix: string): CaseCommand["meta"] {
  const createdAt = new Date().toISOString();
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    commandId: `${prefix}-${suffix}`,
    idempotencyKey: `${prefix}-idem-${suffix}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt,
  };
}

function readableSourceType(sourceType: string) {
  return sourceType.replaceAll("_", " ");
}

function readableStatus(status: Citation["validationStatus"]) {
  return status.replaceAll("_", " ");
}

function validRange(text: string, range: Range | null): range is Range {
  return Boolean(range && range.start >= 0 && range.end > range.start && range.end <= text.length);
}

function SourceText({ segment, range }: { segment: SourceSegment; range: Range }) {
  const before = segment.redactedText.slice(0, range.start);
  const exact = segment.redactedText.slice(range.start, range.end);
  const after = segment.redactedText.slice(range.end);

  return (
    <p className="whitespace-pre-wrap break-words rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 text-sm leading-6">
      {before}
      <mark className="rounded bg-[var(--color-warning-subtle)] px-0.5 text-[var(--color-ink)]">{exact}</mark>
      {after}
    </p>
  );
}

function canonicalManualResolutionIsReady(state: CaseState, candidateId: string, citation: Citation) {
  if (citation.validationStatus !== "manually_resolved") return false;
  const decision = state.citationResolutions.find(
    (item) => item.candidateId === candidateId && item.citationId === citation.id && item.analysisRunId === citation.analysisRunId,
  );
  const audit = state.audit.find(
    (item) => item.eventType === "citation_manually_resolved" && item.analysisRunId === citation.analysisRunId && item.entityIds.includes(citation.id),
  );
  const candidate = state.candidates.find((item) => item.id === candidateId && item.analysisRunId === citation.analysisRunId);
  return Boolean(decision && audit && candidate && candidate.supportStatus !== "citation_unresolved");
}

export function citationCanOpen(state: CaseState, candidateId: string, citationId: string) {
  const citation = state.citations.find((item) => item.id === citationId);
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!citation || !candidate || citation.analysisRunId !== candidate.analysisRunId) return false;
  if (citation.validationStatus === "exact_match") return true;
  return canonicalManualResolutionIsReady(state, candidateId, citation);
}

export function CitationLink({
  state,
  candidateId,
  citationId,
  onOpen,
}: {
  state: CaseState;
  candidateId: string;
  citationId: string;
  onOpen: (selection: SourceSelection) => void;
}) {
  const citation = state.citations.find((item) => item.id === citationId);
  const canOpen = citationCanOpen(state, candidateId, citationId);

  if (!citation) {
    return <p className="text-sm text-[var(--color-danger)]">Citation unavailable.</p>;
  }

  const location = `${citation.documentId}${citation.pageNumber ? `, page ${citation.pageNumber}` : ""}, ${citation.segmentId}`;
  if (citation.validationStatus === "ambiguous_match") {
    return (
      <Button
        aria-label={`Resolve citation for ${location}`}
        onClick={(event) => onOpen({ candidateId, citationId, invoker: event.currentTarget })}
        variant="secondary"
      >
        Resolve citation — {location}
      </Button>
    );
  }

  if (!canOpen) {
    return (
      <p className="text-sm text-[var(--color-danger)]" role="status">
        Source link blocked: {readableStatus(citation.validationStatus)}.
      </p>
    );
  }

  return (
    <Button
      aria-label={`Open exact source: ${location}`}
      onClick={(event) => onOpen({ candidateId, citationId, invoker: event.currentTarget })}
      variant="secondary"
    >
      Open exact source — {location}
    </Button>
  );
}

export function SourceDrawer({ state, selection, mode, onClose, onCommand }: SourceDrawerProps) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const [pendingRange, setPendingRange] = useState<Range | null>(null);
  const [showRevealWarning, setShowRevealWarning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);

  const citation = useMemo(
    () => state.citations.find((item) => item.id === selection?.citationId) ?? null,
    [selection?.citationId, state.citations],
  );
  const candidate = useMemo(
    () => state.candidates.find((item) => item.id === selection?.candidateId) ?? null,
    [selection?.candidateId, state.candidates],
  );
  const segment = useMemo(
    () => state.segments.find((item) => item.id === citation?.segmentId) ?? null,
    [citation?.segmentId, state.segments],
  );
  const sourceDocument = useMemo(
    () => state.documents.find((item) => item.id === citation?.documentId) ?? null,
    [citation?.documentId, state.documents],
  );

  const ambiguityOptions = useMemo(() => {
    if (!citation || citation.validationStatus !== "ambiguous_match" || !citation.quotedText.trim()) return [];
    const result = resolveCitation({
      id: citation.id,
      analysisRunId: citation.analysisRunId,
      quotedText: citation.quotedText,
      documentId: citation.documentId,
      pageNumber: citation.pageNumber,
      segmentId: citation.segmentId,
      purpose: "supporting_candidate",
    });
    return result.ambiguityOptions.filter((option) => option.segmentId === citation.segmentId);
  }, [citation]);

  const manualReady = Boolean(citation && candidate && canonicalManualResolutionIsReady(state, candidate.id, citation));
  const sourceRange = citation?.redactedSegmentRange ?? null;
  const hasExactSource = Boolean(
    citation && segment && validRange(segment.redactedText, sourceRange) && segment.redactedText.slice(sourceRange.start, sourceRange.end) === citation.quotedText,
  );

  const closeAndRestore = () => {
    onClose();
    window.setTimeout(() => selection?.invoker?.focus(), 0);
  };

  useEffect(() => {
    setPendingRange(null);
    setShowRevealWarning(false);
    setRevealed(false);
    setCommandError(null);
  }, [selection?.citationId]);

  useEffect(() => {
    if (!selection) return;
    const target = hasExactSource ? quoteRef.current : headingRef.current;
    window.setTimeout(() => target?.focus(), 0);
  }, [hasExactSource, selection]);

  useEffect(() => {
    if (!selection) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAndRestore();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, selection]);

  if (!selection) return null;

  async function chooseRange(range: Range) {
    if (!citation || !candidate) return;
    setPendingRange(range);
    setCommandError(null);
    const result = await onCommand({
      type: "resolve_citation",
      meta: commandMeta(state, "resolve-citation"),
      candidateId: candidate.id,
      citationId: citation.id,
      selectedSegmentId: citation.segmentId,
      selectedRedactedSegmentRange: range,
    });
    if (result && !result.ok) {
      setPendingRange(null);
      setCommandError(result.reason ?? "The canonical resolution command was not accepted.");
    }
  }

  async function revealSource() {
    if (!citation) return;
    setCommandError(null);
    const result = await onCommand({
      type: "reveal_source",
      meta: commandMeta(state, "reveal-source"),
      citationId: citation.id,
      reasonCode: "explicit_synthetic_source_review",
    });
    if (result && !result.ok) {
      setCommandError(result.reason ?? "The reveal action was not accepted.");
      return;
    }
    setRevealed(true);
  }

  function trapMobileFocus(event: React.KeyboardEvent<HTMLElement>) {
    if (mode !== "mobile" || event.key !== "Tab") return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled])"),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const body = (
    <div className="grid gap-4" onKeyDown={trapMobileFocus}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="cfn-type-label text-[var(--color-ink-muted)]">Exact masked source</p>
          <h2 className="cfn-type-heading-3" id={headingId} ref={headingRef} tabIndex={-1}>
            {sourceDocument?.displayName ?? "Source unavailable"}
          </h2>
        </div>
        <Button aria-label="Close source" onClick={closeAndRestore} variant="secondary">Close</Button>
      </div>

      {!citation || !candidate ? (
        <Alert title="Source unavailable" tone="danger">This citation is not present in the active canonical run.</Alert>
      ) : citation.validationStatus === "ambiguous_match" && !manualReady ? (
        <section aria-label="Citation resolution" className="grid gap-3">
          <Alert title="Citation unresolved" tone="warning">
            Select only one repeated exact-text range in this fixed canonical segment. This action does not validate the citation locally.
          </Alert>
          {ambiguityOptions.length ? (
            <div className="grid gap-2">
              {ambiguityOptions.map((option) => {
                const selected = pendingRange?.start === option.redactedSegmentRange.start && pendingRange?.end === option.redactedSegmentRange.end;
                return (
                  <Button
                    disabled={Boolean(pendingRange)}
                    key={`${option.redactedSegmentRange.start}-${option.redactedSegmentRange.end}`}
                    onClick={() => chooseRange(option.redactedSegmentRange)}
                    variant="secondary"
                  >
                    {selected ? "Waiting for canonical resolution…" : `Choose exact range ${option.redactedSegmentRange.start}–${option.redactedSegmentRange.end}`}
                  </Button>
                );
              })}
            </div>
          ) : (
            <Alert title="Manual choice unavailable" tone="danger">
              Canonical state did not provide a bounded repeated exact-text range in the fixed eligible segment.
            </Alert>
          )}
        </section>
      ) : !citationCanOpen(state, candidate.id, citation.id) ? (
        <Alert title="Source link blocked" tone="danger">
          This citation is {readableStatus(citation.validationStatus)} and cannot be presented as an exact source location.
        </Alert>
      ) : !segment || !sourceDocument || !hasExactSource ? (
        <Alert title="Exact source unavailable" tone="danger">
          The canonical source segment or exact masked range is unavailable. No reconstructed quote is shown.
        </Alert>
      ) : (
        <>
          <dl className="grid gap-3 text-sm">
            <div><dt className="cfn-type-label">Document type</dt><dd>{readableSourceType(sourceDocument.sourceType)}</dd></div>
            <div><dt className="cfn-type-label">Location</dt><dd>{citation.pageNumber ? `Page ${citation.pageNumber}, ` : ""}{citation.segmentId}</dd></div>
            <div><dt className="cfn-type-label">Language and translation</dt><dd>{citation.sourceLanguage}; {citation.translationStatus.replaceAll("_", " ")}</dd></div>
            <div><dt className="cfn-type-label">Extraction quality</dt><dd>{citation.extractionQuality.replaceAll("_", " ")}</dd></div>
            <div><dt className="cfn-type-label">Citation match</dt><dd>{readableStatus(citation.validationStatus)}</dd></div>
            <div><dt className="cfn-type-label">Provenance</dt><dd>{sourceDocument.provenanceStatus.replaceAll("_", " ")}</dd></div>
          </dl>
          <div ref={quoteRef} tabIndex={-1}>
            <h3 className="cfn-type-label mb-2">Exact approved masked quote</h3>
            <SourceText segment={segment} range={sourceRange!} />
          </div>
          {segment.instructionAdvisory !== "no_signal" ? (
            <Alert title="Untrusted evidence content" tone="warning">
              Instruction-like material is displayed as inert source text. It cannot trigger an action or support a candidate.
            </Alert>
          ) : null}
          <Alert title="Source-location limitation" tone="neutral">
            An exact location shows only that this text occurs in the processed source. It does not prove truth, authenticity, admissibility, completeness, credibility, or legal sufficiency.
          </Alert>
          {!revealed ? (
            showRevealWarning ? (
              <Alert title="Reveal original synthetic source?" tone="warning">
                <p className="mb-3">This intentional review action shows browser-local unmasked synthetic text. It is not persisted or sent to a provider.</p>
                <Button onClick={revealSource} variant="danger">Reveal original synthetic source</Button>
              </Alert>
            ) : (
              <Button onClick={() => setShowRevealWarning(true)} variant="secondary">Review reveal warning</Button>
            )
          ) : (
            <section aria-label="Original synthetic source" className="grid gap-2">
              <h3 className="cfn-type-label">Original synthetic source — intentionally revealed</h3>
              <p className="whitespace-pre-wrap break-words rounded-[var(--radius-control)] border border-[var(--color-warning)] bg-[var(--color-warning-subtle)] p-3 text-sm leading-6">{segment.rawText}</p>
            </section>
          )}
        </>
      )}
      {commandError ? <p className="text-sm text-[var(--color-danger)]" role="alert">{commandError}</p> : null}
    </div>
  );

  if (mode === "mobile") {
    return (
      <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-3 sm:place-items-center">
        <section aria-labelledby={headingId} aria-modal="true" className="max-h-[calc(100vh-1.5rem)] w-full overflow-y-auto rounded-[var(--radius-dialog)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-elevated)]" role="dialog">
          {body}
        </section>
      </div>
    );
  }

  const className = mode === "desktop"
    ? "w-[400px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    : "fixed inset-y-0 right-0 z-40 w-full max-w-[400px] overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-elevated)]";
  return <aside aria-labelledby={headingId} className={className} role="complementary">{body}</aside>;
}
