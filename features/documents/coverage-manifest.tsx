"use client";

import { useState } from "react";
import type { CoverageSummary } from "../../lib/contracts";
import { Alert, Button, Card, Label, Select, Textarea } from "../../components/ui";

type CoverageConsequence = "consequential" | "non_consequential";

function labelValue(value: string) {
  return value.replaceAll("_", " ");
}

function CoverageIssueReview({
  issueId,
  disabled,
  onReview,
}: {
  issueId: string;
  disabled: boolean;
  onReview: (
    issueId: string,
    reviewedConsequence: CoverageConsequence,
    limitationText: string,
    reason: string,
  ) => void;
}) {
  const [consequence, setConsequence] = useState<CoverageConsequence>("non_consequential");
  const [limitation, setLimitation] = useState("");
  const [reason, setReason] = useState("");
  const ready = limitation.trim().length > 0 && reason.trim().length > 0;

  return (
    <div className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-control-border)] p-3">
      <p className="cfn-type-label">Qualified coverage limitation review</p>
      <div>
        <Label htmlFor={`${issueId}-consequence`}>Reviewed consequence</Label>
        <Select
          disabled={disabled}
          id={`${issueId}-consequence`}
          onChange={(event) => setConsequence(event.currentTarget.value as CoverageConsequence)}
          value={consequence}
        >
          <option value="non_consequential">Non-consequential</option>
          <option value="consequential">Consequential</option>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${issueId}-limitation`}>Demo-file limitation</Label>
        <Textarea
          disabled={disabled}
          id={`${issueId}-limitation`}
          onChange={(event) => setLimitation(event.currentTarget.value)}
          value={limitation}
        />
      </div>
      <div>
        <Label htmlFor={`${issueId}-reason`}>Review reason</Label>
        <Textarea
          disabled={disabled}
          id={`${issueId}-reason`}
          onChange={(event) => setReason(event.currentTarget.value)}
          value={reason}
        />
      </div>
      <div>
        <Button
          disabled={disabled || !ready}
          onClick={() => onReview(issueId, consequence, limitation.trim(), reason.trim())}
        >
          Record reviewed limitation
        </Button>
      </div>
    </div>
  );
}

export function CoverageManifest({
  coverage,
  disabled = false,
  onReviewIssue,
}: {
  coverage: CoverageSummary;
  disabled?: boolean;
  onReviewIssue?: (
    issueId: string,
    reviewedConsequence: CoverageConsequence,
    limitationText: string,
    reason: string,
  ) => void;
}) {
  return (
    <Card className="grid gap-4">
      <div>
        <h2 className="cfn-type-heading-2">Coverage manifest</h2>
        <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
          Coverage is reported as counts and explicit issues, never as a completeness or confidence score.
        </p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="cfn-type-label">Expected documents</dt><dd>{coverage.expectedDocuments}</dd></div>
        <div><dt className="cfn-type-label">Processed documents</dt><dd>{coverage.processedDocuments}</dd></div>
        <div><dt className="cfn-type-label">Expected pages</dt><dd>{coverage.expectedPages}</dd></div>
        <div><dt className="cfn-type-label">Available pages</dt><dd>{coverage.availablePages}</dd></div>
      </dl>

      {coverage.expectedDocuments === 0 ? (
        <Alert title="Coverage not processed" tone="warning">
          <p>No source pages have been reported as processed.</p>
        </Alert>
      ) : null}

      {coverage.issues.length === 0 && coverage.expectedDocuments > 0 ? (
        <Alert title="No open coverage issue records">
          <p>All expected coverage facts are represented without an open issue record.</p>
        </Alert>
      ) : null}

      {coverage.issues.length > 0 ? (
        <ul aria-label="Coverage issues" className="grid gap-3">
          {coverage.issues.map((issue) => (
            <li className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-warning)] bg-[var(--color-warning-subtle)] p-4" key={issue.id}>
              <div>
                <p className="font-semibold">
                  {issue.pageId ? `${issue.pageId}: ` : `${issue.documentId}: `}
                  {issue.kind === "missing_page" ? "Unavailable, missing page" : labelValue(issue.kind)}
                </p>
                <p className="cfn-type-body-small">{issue.rationale}</p>
              </div>
              <dl className="grid gap-2 text-sm sm:grid-cols-3">
                <div><dt className="cfn-type-label">Initial consequence</dt><dd>{labelValue(issue.initialConsequence)}</dd></div>
                <div><dt className="cfn-type-label">Active consequence</dt><dd>{labelValue(issue.activeConsequence)}</dd></div>
                <div><dt className="cfn-type-label">Resolution</dt><dd>{labelValue(issue.resolutionStatus)}</dd></div>
              </dl>
              {issue.resolutionStatus === "open" && onReviewIssue ? (
                <CoverageIssueReview
                  disabled={disabled}
                  issueId={issue.id}
                  onReview={onReviewIssue}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
