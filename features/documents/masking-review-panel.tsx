"use client";

import {
  CheckCircle2,
  CircleDashed,
  Download,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { Chip } from "../../components/lovable/nexus-ui";
import type { CaseCommand, MaskClass, MaskingReview } from "../../lib/contracts";
import {
  DEFAULT_REPLACEMENT_TOKENS,
  SUPPORTED_MASK_CLASSES,
} from "../../lib/redaction";
import {
  Alert,
  Button,
  Card,
  Input,
  Label,
  Select,
} from "../../components/ui";

type MaskSuggestion = MaskingReview["suggestions"][number];
type MaskReviewStatus = Extract<
  CaseCommand,
  { type: "review_mask" }
>["reviewStatus"];
type ManualMaskInput = Extract<
  CaseCommand,
  { type: "add_mask_suggestion" }
>["input"];

const MASK_CLASS_LABELS: Record<MaskClass, string> = {
  person_name: "Person name",
  email: "Email",
  phone: "Phone",
  passport: "Passport",
  bank_account: "Bank account",
  address: "Address",
  date_of_birth: "Date of birth",
};

const DETECTION_LABELS: Record<MaskSuggestion["detectionMethod"], string> = {
  deterministic_pattern: "Deterministic local pattern",
  sensitive_term_list: "Ephemeral local sensitive-term match",
};

function SuggestionEditor({
  suggestion,
  disabled,
  onReview,
  onRemove,
}: {
  suggestion: MaskSuggestion;
  disabled: boolean;
  onReview: (
    maskId: string,
    reviewStatus: MaskReviewStatus,
    replacementToken: string,
  ) => void;
  onRemove: (maskId: string) => void;
}) {
  const [replacement, setReplacement] = useState(suggestion.replacementToken);
  const replacementReady = replacement.trim().length > 0;

  return (
    <li className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{MASK_CLASS_LABELS[suggestion.maskClass]}</p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            <span className="font-mono text-xs">{suggestion.segmentId}</span> · currently {suggestion.reviewStatus}
          </p>
        </div>
        <Button
          disabled={disabled || !replacementReady}
          onClick={() => onReview(suggestion.id, "approved", replacement.trim())}
          variant="primary"
        >
          Approve mask
        </Button>
      </div>

      <details>
        <summary className="cursor-pointer text-sm font-semibold text-[var(--color-brand)]">
          Edit or remove this suggestion
        </summary>
        <div className="mt-3 grid gap-3">
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Detected by</dt>
              <dd>{DETECTION_LABELS[suggestion.detectionMethod]}</dd>
            </div>
            <div>
              <dt className="font-semibold">Character range</dt>
              <dd>{suggestion.originalStart}–{suggestion.originalEnd}</dd>
            </div>
          </dl>
          <div>
            <Label htmlFor={`${suggestion.id}-replacement`}>
              Replacement shown in the redacted text
            </Label>
            <Input
              disabled={disabled}
              id={`${suggestion.id}-replacement`}
              onChange={(event) => setReplacement(event.currentTarget.value)}
              value={replacement}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={disabled || !replacementReady || replacement === suggestion.replacementToken}
              onClick={() => onReview(suggestion.id, "edited", replacement.trim())}
            >
              Save edited mask
            </Button>
            <Button
              disabled={disabled || !replacementReady}
              onClick={() => onReview(suggestion.id, "rejected", replacement.trim())}
            >
              Mark as needing correction
            </Button>
            <Button disabled={disabled} onClick={() => onRemove(suggestion.id)}>
              Remove false positive
            </Button>
          </div>
        </div>
      </details>
    </li>
  );
}

function ManualMaskForm({
  segmentIds,
  disabled,
  onAdd,
}: {
  segmentIds: string[];
  disabled: boolean;
  onAdd: (input: ManualMaskInput) => void;
}) {
  const [segmentId, setSegmentId] = useState(segmentIds[0] ?? "");
  const [maskClass, setMaskClass] = useState<MaskClass>("person_name");
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("1");
  const [replacement, setReplacement] = useState(
    DEFAULT_REPLACEMENT_TOKENS.person_name,
  );
  const startNumber = Number(start);
  const endNumber = Number(end);
  const effectiveSegmentId = segmentIds.includes(segmentId)
    ? segmentId
    : (segmentIds[0] ?? "");
  const ready =
    effectiveSegmentId.length > 0 &&
    Number.isInteger(startNumber) &&
    Number.isInteger(endNumber) &&
    startNumber >= 0 &&
    endNumber > startNumber &&
    replacement.trim().length > 0;

  function changeClass(nextClass: MaskClass) {
    setMaskClass(nextClass);
    setReplacement(DEFAULT_REPLACEMENT_TOKENS[nextClass]);
  }

  return (
    <details className="rounded-[var(--radius-control)] border border-[var(--color-border)] p-4">
      <summary className="cursor-pointer font-semibold">Add a range-based mask</summary>
      <p className="mt-2 text-sm leading-5 text-[var(--color-ink-muted)]">
        Select an existing demo segment and character range. Do not enter an identifier or case narrative.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="manual-mask-segment">Source segment</Label>
          <Select
            disabled={disabled || segmentIds.length === 0}
            id="manual-mask-segment"
            onChange={(event) => setSegmentId(event.currentTarget.value)}
            value={effectiveSegmentId}
          >
            {segmentIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="manual-mask-class">Identifier class</Label>
          <Select
            disabled={disabled}
            id="manual-mask-class"
            onChange={(event) => changeClass(event.currentTarget.value as MaskClass)}
            value={maskClass}
          >
            {SUPPORTED_MASK_CLASSES.map((item) => (
              <option key={item} value={item}>{MASK_CLASS_LABELS[item]}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="manual-mask-start">Start character</Label>
          <Input
            disabled={disabled}
            id="manual-mask-start"
            min={0}
            onChange={(event) => setStart(event.currentTarget.value)}
            type="number"
            value={start}
          />
        </div>
        <div>
          <Label htmlFor="manual-mask-end">End character</Label>
          <Input
            disabled={disabled}
            id="manual-mask-end"
            min={1}
            onChange={(event) => setEnd(event.currentTarget.value)}
            type="number"
            value={end}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="manual-mask-replacement">Readable replacement</Label>
          <Input
            disabled={disabled}
            id="manual-mask-replacement"
            onChange={(event) => setReplacement(event.currentTarget.value)}
            value={replacement}
          />
        </div>
      </div>
      <Button
        className="mt-3"
        disabled={disabled || !ready}
        onClick={() => onAdd({
          segmentId: effectiveSegmentId,
          originalStart: startNumber,
          originalEnd: endNumber,
          maskClass,
          replacementToken: replacement.trim(),
        })}
      >
        Add pending mask
      </Button>
    </details>
  );
}

export function MaskingReviewPanel({
  review,
  segmentIds,
  disabled = false,
  visualSelectionAvailable = false,
  onReview,
  onRemove,
  onAdd,
  onComplete,
  onDownloadSanitizedPdf,
  onDownloadVisualSanitizedPdf,
  sanitizedPdfState = "idle",
}: {
  review: MaskingReview;
  segmentIds: string[];
  disabled?: boolean;
  visualSelectionAvailable?: boolean;
  onReview: (
    maskId: string,
    reviewStatus: MaskReviewStatus,
    replacementToken: string,
  ) => void;
  onRemove: (maskId: string) => void;
  onAdd: (input: ManualMaskInput) => void;
  onComplete: () => void;
  onDownloadSanitizedPdf?: () => void;
  onDownloadVisualSanitizedPdf?: () => void;
  sanitizedPdfState?: "idle" | "generating_text" | "generating_visual";
}) {
  const pendingCount = review.suggestions.filter(
    (suggestion) => suggestion.reviewStatus === "pending",
  ).length;
  const rejectedCount = review.suggestions.filter(
    (suggestion) => suggestion.reviewStatus === "rejected",
  ).length;
  const hasProcessedSegments = segmentIds.length > 0;
  const readyToComplete =
    hasProcessedSegments && pendingCount === 0 && rejectedCount === 0;
  const unresolvedCount = pendingCount + rejectedCount;

  if (visualSelectionAvailable) {
    const scanPassed =
      review.reviewStatus === "approved" &&
      review.leakScanStatus === "passed" &&
      review.failedClasses.length === 0;
    const scanFailed =
      review.leakScanStatus === "failed" ||
      review.failedClasses.length > 0;
    const statusIcon = scanPassed ? (
      <CheckCircle2
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-[color:var(--sage)]"
      />
    ) : scanFailed || unresolvedCount > 0 ? (
      <TriangleAlert
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-[color:var(--rust)]"
      />
    ) : (
      <CircleDashed
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-[color:var(--amber)]"
      />
    );
    const statusCopy = !hasProcessedSegments
      ? "Process or restore the PDF packet before running the privacy check."
      : unresolvedCount > 0
        ? `Resolve ${pendingCount} pending and ${rejectedCount} needing-correction mask${unresolvedCount === 1 ? "" : "s"} first.`
        : scanFailed
          ? "The local scan still finds a supported identifier pattern. Add or correct its mask, then run the check again."
          : scanPassed
            ? "Passed and saved for the current packet. Changing a mask or replacing a PDF invalidates this result."
            : review.suggestions.length === 0
              ? "No supported pattern was found automatically. Complete a page-by-page visual review before approving."
              : "Every recorded mask is reviewed. Run the final browser-local privacy check.";

    return (
      <section
        aria-labelledby="privacy-gate-heading"
        className="rounded-xl border border-border bg-card px-3 py-2.5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--amber)_42%,transparent)] bg-[color-mix(in_oklab,var(--amber)_12%,transparent)]">
            <ShieldCheck
              aria-hidden="true"
              className="h-4 w-4 text-[color:var(--amber)]"
            />
          </span>

          <div className="min-w-[13rem] flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3
                className="font-serif text-base leading-tight"
                id="privacy-gate-heading"
              >
                Final privacy check
              </h3>
              <p className="text-[10px] leading-4 text-muted-foreground">
                Validate decisions and scan the masked text locally.
              </p>
            </div>
          </div>

          <div
            aria-label="Privacy check status"
            className="flex flex-wrap items-center gap-1.5"
            role="status"
          >
            <Chip tone="mute">
              {review.suggestions.length} suggestion
              {review.suggestions.length === 1 ? "" : "s"}
            </Chip>
            <Chip tone={unresolvedCount > 0 ? "rust" : "sage"}>
              {unresolvedCount > 0
                ? `${unresolvedCount} unresolved`
                : "Review complete"}
            </Chip>
            <Chip tone={scanPassed ? "sage" : scanFailed ? "rust" : "amber"}>
              Scan{" "}
              {scanPassed
                ? "passed"
                : scanFailed
                  ? "needs attention"
                  : "not run"}
            </Chip>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {scanPassed && onDownloadSanitizedPdf ? (
              <Button
                className="!min-h-0 !rounded-md !px-3 !py-1.5 !text-xs !shadow-none"
                disabled={disabled || sanitizedPdfState !== "idle"}
                onClick={onDownloadSanitizedPdf}
                variant="secondary"
              >
                {sanitizedPdfState === "generating_text" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="mr-1.5 h-3.5 w-3.5 animate-spin"
                  />
                ) : (
                  <Download
                    aria-hidden="true"
                    className="mr-1.5 h-3.5 w-3.5"
                  />
                )}
                {sanitizedPdfState === "generating_text"
                  ? "Preparing PDF"
                  : "Download sanitized text PDF"}
              </Button>
            ) : null}
            {scanPassed && onDownloadVisualSanitizedPdf ? (
              <Button
                className="!min-h-0 !rounded-md !px-3 !py-1.5 !text-xs !shadow-none"
                disabled={disabled || sanitizedPdfState !== "idle"}
                onClick={onDownloadVisualSanitizedPdf}
                variant="secondary"
              >
                {sanitizedPdfState === "generating_visual" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="mr-1.5 h-3.5 w-3.5 animate-spin"
                  />
                ) : (
                  <Download
                    aria-hidden="true"
                    className="mr-1.5 h-3.5 w-3.5"
                  />
                )}
                {sanitizedPdfState === "generating_visual"
                  ? "Flattening pages"
                  : "Download visual sanitized PDF"}
              </Button>
            ) : null}
            <Button
              className="!min-h-0 !rounded-md !px-3 !py-1.5 !text-xs !shadow-none"
              disabled={disabled || !readyToComplete}
              onClick={onComplete}
              variant="primary"
            >
              {!hasProcessedSegments
                ? "Restore PDFs first"
                : unresolvedCount > 0
                  ? `Review ${unresolvedCount} mask${unresolvedCount === 1 ? "" : "s"}`
                  : scanPassed
                    ? "Run check again"
                    : "Approve privacy check"}
            </Button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/70 pt-2 text-[11px] leading-4">
          {statusIcon}
          <p className="min-w-[16rem] flex-1 text-muted-foreground">
            {statusCopy}
            {scanPassed && onDownloadSanitizedPdf
              ? " The sanitized text derivative does not alter the original or preserve its exact visual layout. The visual derivative preserves page appearance as flattened images with approved black masks; review either file before sharing."
              : ""}
          </p>
          <details>
            <summary className="cursor-pointer whitespace-nowrap font-semibold text-foreground">
              Checked identifier types
            </summary>
            <ul
              aria-label="Declared supported mask classes"
              className="mt-2 flex flex-wrap gap-1.5"
            >
              {SUPPORTED_MASK_CLASSES.map((maskClass) => (
                <li key={maskClass}>
                  <Chip tone="mute">{MASK_CLASS_LABELS[maskClass]}</Chip>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </section>
    );
  }

  return (
    <Card className="grid gap-4 border-0 p-0 shadow-none">
      <div>
        <h3 className="font-serif text-lg leading-tight">Approve privacy masks</h3>
        <p className="text-sm leading-5 text-[var(--color-ink-muted)]">
          Confirm that each detected personal detail should be hidden. The final leak scan runs automatically after approval.
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-subtle)] p-2"><dt className="text-xs text-[var(--color-ink-muted)]">Suggestions</dt><dd className="font-semibold">{review.suggestions.length}</dd></div>
        <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-subtle)] p-2"><dt className="text-xs text-[var(--color-ink-muted)]">Pending</dt><dd className="font-semibold">{pendingCount}</dd></div>
        <div className="rounded-[var(--radius-control)] bg-[var(--color-surface-subtle)] p-2"><dt className="text-xs text-[var(--color-ink-muted)]">Privacy scan</dt><dd className="font-semibold capitalize">{review.leakScanStatus.replaceAll("_", " ")}</dd></div>
      </dl>

      {review.suggestions.length === 0 ? (
        <Alert
          title={hasProcessedSegments ? "No automatic mask suggestions" : "Mask suggestions not processed"}
          tone={hasProcessedSegments ? "neutral" : "warning"}
        >
          <p>
            {hasProcessedSegments
              ? visualSelectionAvailable
                ? "No supported pattern was found automatically. This does not mean the PDF contains no personal information. Review every page in the masked preview and select any personal detail the local detector missed."
                : "No supported personal-detail pattern was detected. You can still add a range-based mask; approving this check will run the deterministic leak scan."
              : "Process the PDFs locally before completing human masking review."}
          </p>
        </Alert>
      ) : visualSelectionAvailable ? (
        <Alert title="Review masks on the PDF" tone="neutral">
          <p>
            Use the colored overlays in the masked preview to approve, correct,
            or remove all {review.suggestions.length} suggestion(s). Select
            visible PDF text to add anything the local detector missed.
          </p>
        </Alert>
      ) : (
        <ul aria-label="Mask suggestions" className="grid gap-3">
          {review.suggestions.map((suggestion) => (
            <SuggestionEditor
              disabled={disabled}
              key={`${suggestion.id}-${suggestion.replacementToken}-${suggestion.reviewStatus}`}
              onRemove={onRemove}
              onReview={onReview}
              suggestion={suggestion}
            />
          ))}
        </ul>
      )}

      {visualSelectionAvailable ? null : (
        <ManualMaskForm disabled={disabled} onAdd={onAdd} segmentIds={segmentIds} />
      )}

      <details>
        <summary className="cursor-pointer text-sm font-semibold text-[var(--color-brand)]">
          What personal-detail types are checked?
        </summary>
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Declared supported mask classes">
          {SUPPORTED_MASK_CLASSES.map((maskClass) => (
            <li className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm" key={maskClass}>
              {MASK_CLASS_LABELS[maskClass]}
            </li>
          ))}
        </ul>
      </details>

      {!readyToComplete && review.suggestions.length > 0 ? (
        <Alert title="Mask review remains blocked" tone="warning">
          <p>
            Resolve {pendingCount} pending and {rejectedCount} rejected required suggestion(s), or remove a confirmed false positive. The deterministic leak scan runs only on completion.
          </p>
        </Alert>
      ) : null}

      {review.leakScanStatus === "failed" ? (
        <Alert title="Privacy scan found a remaining detail" tone="warning">
          <p>
            Analysis remains blocked. Add or correct a mask for the remaining supported identifier, then approve the privacy check again.
          </p>
        </Alert>
      ) : null}

      <div>
        <Button
          disabled={disabled || !readyToComplete}
          onClick={onComplete}
          variant="primary"
        >
          Approve privacy check and continue
        </Button>
      </div>
    </Card>
  );
}
