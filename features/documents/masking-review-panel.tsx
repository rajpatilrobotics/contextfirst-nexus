"use client";

import { useState } from "react";
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
    <li className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] p-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="cfn-type-label">Class</dt>
          <dd>{MASK_CLASS_LABELS[suggestion.maskClass]}</dd>
        </div>
        <div>
          <dt className="cfn-type-label">Source location</dt>
          <dd>
            <span className="cfn-type-code">{suggestion.segmentId}</span>, characters{" "}
            {suggestion.originalStart}–{suggestion.originalEnd}
          </dd>
        </div>
        <div>
          <dt className="cfn-type-label">Detection method</dt>
          <dd>{DETECTION_LABELS[suggestion.detectionMethod]}</dd>
        </div>
        <div>
          <dt className="cfn-type-label">Review state</dt>
          <dd className="capitalize">{suggestion.reviewStatus}</dd>
        </div>
      </dl>

      <div>
        <Label htmlFor={`${suggestion.id}-replacement`}>
          Readable replacement preview
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
          disabled={disabled || !replacementReady}
          onClick={() => onReview(suggestion.id, "approved", replacement.trim())}
          variant="primary"
        >
          Approve mask
        </Button>
        <Button
          disabled={disabled || !replacementReady || replacement === suggestion.replacementToken}
          onClick={() => onReview(suggestion.id, "edited", replacement.trim())}
        >
          Save edited replacement
        </Button>
        <Button
          disabled={disabled || !replacementReady}
          onClick={() => onReview(suggestion.id, "rejected", replacement.trim())}
        >
          Reject suggestion
        </Button>
        <Button disabled={disabled} onClick={() => onRemove(suggestion.id)}>
          Remove false positive
        </Button>
      </div>
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
      <p className="mt-2 cfn-type-body-small text-[var(--color-ink-muted)]">
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
  onReview,
  onRemove,
  onAdd,
  onComplete,
}: {
  review: MaskingReview;
  segmentIds: string[];
  disabled?: boolean;
  onReview: (
    maskId: string,
    reviewStatus: MaskReviewStatus,
    replacementToken: string,
  ) => void;
  onRemove: (maskId: string) => void;
  onAdd: (input: ManualMaskInput) => void;
  onComplete: () => void;
}) {
  const pendingCount = review.suggestions.filter(
    (suggestion) => suggestion.reviewStatus === "pending",
  ).length;
  const rejectedCount = review.suggestions.filter(
    (suggestion) => suggestion.reviewStatus === "rejected",
  ).length;
  const readyToComplete =
    review.suggestions.length > 0 && pendingCount === 0 && rejectedCount === 0;

  return (
    <Card className="grid gap-4">
      <div>
        <h2 className="cfn-type-heading-2">Human masking review</h2>
        <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
          Detection is limited to the seven classes listed below. This is identifier masking, not universal named-entity detection or anonymization.
        </p>
      </div>

      <div>
        <h3 className="cfn-type-label">Declared supported classes</h3>
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Declared supported mask classes">
          {SUPPORTED_MASK_CLASSES.map((maskClass) => (
            <li className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm" key={maskClass}>
              {MASK_CLASS_LABELS[maskClass]}
            </li>
          ))}
        </ul>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="cfn-type-label">Review</dt><dd className="capitalize">{review.reviewStatus}</dd></div>
        <div><dt className="cfn-type-label">Leak scan</dt><dd className="capitalize">{review.leakScanStatus.replaceAll("_", " ")}</dd></div>
        <div><dt className="cfn-type-label">Suggestions</dt><dd>{review.suggestions.length}</dd></div>
      </dl>

      {review.suggestions.length === 0 ? (
        <Alert title="Mask suggestions not processed" tone="warning">
          <p>Process the bundled PDFs locally before completing human masking review.</p>
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

      <ManualMaskForm disabled={disabled} onAdd={onAdd} segmentIds={segmentIds} />

      {!readyToComplete && review.suggestions.length > 0 ? (
        <Alert title="Mask review remains blocked" tone="warning">
          <p>
            Resolve {pendingCount} pending and {rejectedCount} rejected required suggestion(s), or remove a confirmed false positive. The deterministic leak scan runs only on completion.
          </p>
        </Alert>
      ) : null}

      <div>
        <Button
          disabled={disabled || !readyToComplete}
          onClick={onComplete}
          variant="primary"
        >
          Complete masking review and run leak scan
        </Button>
      </div>
    </Card>
  );
}
