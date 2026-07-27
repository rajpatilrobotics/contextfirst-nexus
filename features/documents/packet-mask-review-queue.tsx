"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldAlert,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  DocumentRecord,
  MaskClass,
  MaskingReview,
  SourceSegment,
} from "../../lib/contracts";

type MaskSuggestion = MaskingReview["suggestions"][number];

export type MaskNavigationTarget = {
  documentId: string;
  maskId: string;
  pageNumber: number;
};

const MASK_CLASS_LABELS: Record<MaskClass, string> = {
  person_name: "Person names",
  email: "Emails",
  phone: "Phone numbers",
  passport: "Passports",
  bank_account: "Bank accounts",
  address: "Addresses",
  date_of_birth: "Birth dates",
};

const STATUS_LABELS: Record<MaskSuggestion["reviewStatus"], string> = {
  pending: "Pending",
  approved: "Approved",
  edited: "Edited",
  rejected: "Needs correction",
};

export function PacketMaskReviewQueue({
  automaticSuggestionIds,
  disabled = false,
  documents,
  focusedMaskId,
  onApplyAllDetected,
  onComplete,
  onNavigate,
  onRestore,
  review,
  segments,
}: {
  automaticSuggestionIds: readonly string[];
  disabled?: boolean;
  documents: readonly DocumentRecord[];
  focusedMaskId?: string;
  onApplyAllDetected: (maskIds: readonly string[]) => void;
  onComplete: () => void;
  onNavigate: (target: MaskNavigationTarget) => void;
  onRestore?: () => void;
  review: MaskingReview;
  segments: readonly SourceSegment[];
}) {
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const segmentById = useMemo(
    () => new Map(segments.map((segment) => [segment.id, segment])),
    [segments],
  );
  const documentById = useMemo(
    () => new Map(documents.map((document) => [document.id, document])),
    [documents],
  );
  const automaticIds = useMemo(
    () => new Set(automaticSuggestionIds),
    [automaticSuggestionIds],
  );
  const located = useMemo(
    () =>
      review.suggestions
        .map((suggestion) => {
          const segment = segmentById.get(suggestion.segmentId);
          if (!segment || segment.pageNumber === null) return null;
          return {
            suggestion,
            documentId: segment.documentId,
            pageNumber: segment.pageNumber,
          };
        })
        .filter(
          (
            item,
          ): item is {
            suggestion: MaskSuggestion;
            documentId: string;
            pageNumber: number;
          } => item !== null,
        )
        .sort(
          (left, right) =>
            left.documentId.localeCompare(right.documentId) ||
            left.pageNumber - right.pageNumber ||
            left.suggestion.originalStart - right.suggestion.originalStart,
        ),
    [review.suggestions, segmentById],
  );
  const unresolved = located.filter(
    ({ suggestion }) =>
      suggestion.reviewStatus === "pending" ||
      suggestion.reviewStatus === "rejected",
  );
  const pendingAutomatic = unresolved.filter(
    ({ suggestion }) =>
      suggestion.reviewStatus === "pending" &&
      automaticIds.has(suggestion.id),
  );
  const reviewedCount = review.suggestions.filter((suggestion) =>
    ["approved", "edited"].includes(suggestion.reviewStatus),
  ).length;
  const focusedUnresolvedIndex = unresolved.findIndex(
    ({ suggestion }) => suggestion.id === focusedMaskId,
  );
  const privacyCheckPassed =
    review.reviewStatus === "approved" &&
    review.leakScanStatus === "passed" &&
    review.failedClasses.length === 0;
  const grouped = useMemo(() => {
    const groups = new Map<
      string,
      Map<number, typeof located>
    >();
    located.forEach((item) => {
      const pages = groups.get(item.documentId) ?? new Map<number, typeof located>();
      const pageItems = pages.get(item.pageNumber) ?? [];
      pageItems.push(item);
      pages.set(item.pageNumber, pageItems);
      groups.set(item.documentId, pages);
    });
    return groups;
  }, [located]);
  const summaryByClass = useMemo(() => {
    const counts = new Map<MaskClass, number>();
    pendingAutomatic.forEach(({ suggestion }) => {
      counts.set(
        suggestion.maskClass,
        (counts.get(suggestion.maskClass) ?? 0) + 1,
      );
    });
    return [...counts.entries()];
  }, [pendingAutomatic]);
  const pendingDocumentCount = new Set(
    pendingAutomatic.map((item) => item.documentId),
  ).size;
  const pendingPageCount = new Set(
    pendingAutomatic.map((item) => `${item.documentId}:${item.pageNumber}`),
  ).size;

  function navigateUnresolved(offset: -1 | 1) {
    if (unresolved.length === 0) return;
    const start =
      focusedUnresolvedIndex < 0
        ? offset === 1
          ? -1
          : 0
        : focusedUnresolvedIndex;
    const nextIndex =
      (start + offset + unresolved.length) % unresolved.length;
    const next = unresolved[nextIndex]!;
    onNavigate({
      documentId: next.documentId,
      maskId: next.suggestion.id,
      pageNumber: next.pageNumber,
    });
  }

  return (
    <section
      aria-labelledby="packet-mask-queue-heading"
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-2.5">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h4 className="font-serif text-base" id="packet-mask-queue-heading">
              Packet masking review
            </h4>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {reviewedCount} of {review.suggestions.length} reviewed
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Every recorded mask, grouped by its real document and page.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {unresolved.length > 1 ? (
            <>
              <button
                aria-label="Previous unresolved mask"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50"
                disabled={disabled}
                onClick={() => navigateUnresolved(-1)}
                type="button"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                aria-label="Next unresolved mask"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50"
                disabled={disabled}
                onClick={() => navigateUnresolved(1)}
                type="button"
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </>
          ) : null}
          {disabled ? (
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800"
              onClick={onRestore}
              type="button"
            >
              Restore PDFs to continue
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : pendingAutomatic.length > 0 ? (
            <button
              aria-haspopup="dialog"
              className="inline-flex min-h-8 items-center gap-1 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              onClick={() => setConfirmingBulk(true)}
              type="button"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Review & apply detected masks ({pendingAutomatic.length})
            </button>
          ) : unresolved.length > 0 ? (
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              onClick={() => navigateUnresolved(1)}
              type="button"
            >
              Open next unresolved mask ({unresolved.length})
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : privacyCheckPassed ? (
            <span className="inline-flex min-h-8 items-center gap-1 rounded-md border border-green-300 bg-green-50 px-3 text-xs font-semibold text-green-900">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Privacy check passed
            </span>
          ) : (
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              onClick={onComplete}
              type="button"
            >
              Run final privacy check
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {confirmingBulk ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-5"
        >
          <section
            aria-label="Confirm bulk mask approval"
            aria-modal="true"
            className="w-full max-w-xl rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-2xl"
            role="alertdialog"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-white">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg font-semibold">
                Review this automatic-detection summary
                </p>
                <p className="mt-1 text-xs leading-5">
                  This approves only the {pendingAutomatic.length} currently
                  detected pending suggestion
                  {pendingAutomatic.length === 1 ? "" : "s"} across{" "}
                  {pendingDocumentCount} document
                  {pendingDocumentCount === 1 ? "" : "s"} and{" "}
                  {pendingPageCount} page
                  {pendingPageCount === 1 ? "" : "s"}. Deterministic checks
                  can include false positives and can miss names or ambiguous
                  personal details. Review the black overlays and every page.
                </p>
                <ul
                  aria-label="Detected mask summary by identifier class"
                  className="mt-3 flex flex-wrap gap-1.5"
                >
                  {summaryByClass.map(([maskClass, count]) => (
                    <li
                      className="rounded-full border border-amber-300 bg-white px-2 py-1 text-[10px] font-semibold"
                      key={maskClass}
                    >
                      {MASK_CLASS_LABELS[maskClass]} · {count}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    autoFocus
                    className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                    onClick={() => {
                      onApplyAllDetected(
                        pendingAutomatic.map(
                          ({ suggestion }) => suggestion.id,
                        ),
                      );
                      setConfirmingBulk(false);
                    }}
                    type="button"
                  >
                    Apply all detected masks now
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-amber-100"
                    onClick={() => setConfirmingBulk(false)}
                    type="button"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {located.length === 0 ? (
        <p className="px-3 py-4 text-xs text-muted-foreground">
          No automatic or manual masks are recorded for this packet. This does
          not prove that the PDFs contain no personal information.
        </p>
      ) : (
        <div className="max-h-60 overflow-auto px-3 py-2">
          {[...grouped.entries()].map(([documentId, pages]) => (
            <div className="py-1.5" key={documentId}>
              <div className="truncate text-xs font-semibold">
                {documentById.get(documentId)?.fileName ?? documentId}
              </div>
              {[...pages.entries()].map(([pageNumber, items]) => (
                <div
                  className="mt-1 grid gap-1 sm:grid-cols-[4rem_minmax(0,1fr)]"
                  key={pageNumber}
                >
                  <div className="pt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    Page {pageNumber}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {items.map(({ suggestion }) => (
                      <button
                        aria-current={
                          focusedMaskId === suggestion.id ? "true" : undefined
                        }
                        className={`rounded-md border px-2 py-1 text-left text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)] ${
                          focusedMaskId === suggestion.id
                            ? "border-sky-500 bg-sky-50"
                            : suggestion.reviewStatus === "pending"
                              ? "border-amber-400 bg-amber-50"
                              : suggestion.reviewStatus === "rejected"
                                ? "border-red-300 bg-red-50"
                                : "border-border bg-background"
                        }`}
                        key={suggestion.id}
                        onClick={() =>
                          onNavigate({
                            documentId,
                            maskId: suggestion.id,
                            pageNumber,
                          })
                        }
                        type="button"
                      >
                        {MASK_CLASS_LABELS[suggestion.maskClass]} ·{" "}
                        {STATUS_LABELS[suggestion.reviewStatus]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
