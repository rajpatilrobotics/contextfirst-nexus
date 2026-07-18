"use client";

import { useEffect, useState } from "react";
import { GitMerge, Link2, Scale, TriangleAlert } from "lucide-react";
import type { CaseCandidate, CaseState, EvidenceDependency } from "../../../lib/contracts";
import { selectNexus } from "../../../lib/review";
import {
  EvidenceNatureStatus,
  ItemOriginStatus,
  ReviewStatusBadge,
  SupportStatusBadge,
} from "../../../components/status";
import { Alert, Skeleton, Table } from "../../../components/ui";
import { CandidateReviewActions } from "../candidate";
import {
  CitationLink,
  type CaseCommandDispatcher,
  type SourceSelection,
} from "../source";

type NexusRow = Extract<CaseCandidate, { kind: "nexus_relationship" }>;
type NexusPresentation = "auto" | "desktop" | "mobile";

export type NexusDataState =
  | { kind: "ready" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "blocked"; message: string }
  | { kind: "partial"; message: string };

function useNexusPresentation(requested: NexusPresentation) {
  const [detected, setDetected] = useState<"desktop" | "mobile">("mobile");
  useEffect(() => {
    if (requested !== "auto") return;
    if (typeof window.matchMedia !== "function") {
      setDetected(window.innerWidth >= 768 ? "desktop" : "mobile");
      return;
    }
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setDetected(query.matches ? "desktop" : "mobile");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [requested]);
  return requested === "auto" ? detected : requested;
}

function readable(value: string) {
  return value.replaceAll("_", " ");
}

function dependencyTarget(dependency: EvidenceDependency) {
  if (dependency.kind === "source") return dependency.sourceSegmentId;
  if (dependency.kind === "candidate") return dependency.candidateId;
  return dependency.nexusCandidateId;
}

function NexusDependencies({
  row,
  state,
  onOpenSource,
}: {
  row: NexusRow;
  state: CaseState;
  onOpenSource: (selection: SourceSelection) => void;
}) {
  return (
    <ul className="grid gap-2">
      {row.dependencies.map((dependency) => (
        <li
          className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] p-2 text-sm"
          key={dependency.id}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="cfn-type-code">{dependencyTarget(dependency)}</span>
            <span>{readable(dependency.relationship)}</span>
            <span>{dependency.active ? "Active" : "Inactive after recalculation"}</span>
          </div>
          {dependency.kind === "source" ? (
            <>
              <EvidenceNatureStatus value={dependency.evidenceNature} />
              <CitationLink
                candidateId={row.id}
                citationId={dependency.citationId}
                onOpen={onOpenSource}
                state={state}
              />
            </>
          ) : (
            <a className="font-semibold" href={`#candidate-${dependencyTarget(dependency)}`}>
              Open related candidate
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function NexusLimitations({ row }: { row: NexusRow }) {
  const limiting = row.dependencies.filter(
    (dependency) =>
      dependency.relationship === "limits" ||
      dependency.relationship === "contradicts" ||
      !dependency.active,
  );
  return (
    <div className="grid gap-2 text-sm">
      {row.unknowns.length ? (
        <ul className="list-disc pl-5">
          {row.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}
        </ul>
      ) : (
        <p>Unknowns: none added beyond the listed source and dependency limits.</p>
      )}
      {limiting.length ? (
        <p>Limiting or changed dependencies: {limiting.map(dependencyTarget).join(", ")}.</p>
      ) : (
        <p>All listed dependencies remain active; source provenance and coverage qualifications still apply.</p>
      )}
      {row.supportStatus === "insufficient_evidence" ? (
        <Alert title="Insufficient evidence" tone="warning">
          Only an explicit limitation may complete renewed review. Positive acceptance is unavailable.
        </Alert>
      ) : null}
    </div>
  );
}

function NexusRowIdentity({ row }: { row: NexusRow }) {
  return (
    <div className="grid gap-2">
      <span className="cfn-type-code text-[var(--color-ink-muted)]">{row.id}</span>
      <span className="font-semibold">{row.title}</span>
      <span className="text-sm">{row.reviewQuestion}</span>
      <span className="text-sm text-[var(--color-ink-muted)]">Category: {readable(row.category)}</span>
    </div>
  );
}

function NexusWording({ row }: { row: NexusRow }) {
  const wasEdited = row.proposedText.trim() !== row.currentText.trim();
  return (
    <div className="grid gap-3 text-sm">
      <div>
        <p className="cfn-type-label">
          Original suggestion{wasEdited ? " — superseded, not a current finding" : ""}
        </p>
        <p>{row.proposedText}</p>
      </div>
      <section aria-label="Current reviewed relationship">
        <h3 className="cfn-type-label">Current reviewed relationship</h3>
        <p>{row.currentText}</p>
      </section>
    </div>
  );
}

function DesktopNexus({
  rows,
  state,
  onCommand,
  onOpenSource,
}: {
  rows: NexusRow[];
  state: CaseState;
  onCommand: CaseCommandDispatcher;
  onOpenSource: (selection: SourceSelection) => void;
}) {
  return (
    <Table className="text-left align-top">
      <caption className="pb-3 text-left text-sm text-[var(--color-ink-muted)]">
        Six source-linked relationship questions. This matrix organizes review and does not produce a score or legal conclusion.
      </caption>
      <thead>
        <tr className="border-b border-[var(--color-border-strong)]">
          <th className="w-[20%] p-3 align-top" scope="col">Relationship question</th>
          <th className="w-[30%] p-3 align-top" scope="col">Support and dependencies</th>
          <th className="w-[20%] p-3 align-top" scope="col">Limits and unknowns</th>
          <th className="w-[30%] p-3 align-top" scope="col">Review status and action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            className="scroll-mt-6 border-b border-[var(--color-border)]"
            id={`nexus-row-${row.id}`}
            key={row.id}
            tabIndex={-1}
          >
            <th className="p-3 align-top" scope="row">
              <NexusRowIdentity row={row} />
            </th>
            <td className="p-3 align-top">
              <div className="mb-3 flex flex-wrap gap-2">
                <ItemOriginStatus value={row.itemOrigin} />
                <SupportStatusBadge value={row.supportStatus} />
              </div>
              <div className="mb-3"><NexusWording row={row} /></div>
              <NexusDependencies onOpenSource={onOpenSource} row={row} state={state} />
            </td>
            <td className="p-3 align-top"><NexusLimitations row={row} /></td>
            <td className="p-3 align-top">
              <div className="mb-3"><ReviewStatusBadge value={row.reviewStatus} /></div>
              <CandidateReviewActions candidate={row} compact onCommand={onCommand} state={state} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function MobileNexus({
  rows,
  state,
  onCommand,
  onOpenSource,
}: {
  rows: NexusRow[];
  state: CaseState;
  onCommand: CaseCommandDispatcher;
  onOpenSource: (selection: SourceSelection) => void;
}) {
  return (
    <ol aria-label="Charge-Coercion Nexus rows" className="grid gap-4">
      {rows.map((row) => (
        <li key={row.id}>
          <article
            className="grid scroll-mt-6 gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            id={`nexus-row-${row.id}`}
            tabIndex={-1}
          >
            <NexusRowIdentity row={row} />
            <div className="flex flex-wrap gap-2">
              <ItemOriginStatus value={row.itemOrigin} />
              <SupportStatusBadge value={row.supportStatus} />
              <ReviewStatusBadge value={row.reviewStatus} />
            </div>
            <NexusWording row={row} />
            <section aria-label="Support and dependencies" className="grid gap-2">
              <h3 className="cfn-type-label">Support and dependencies</h3>
              <NexusDependencies onOpenSource={onOpenSource} row={row} state={state} />
            </section>
            <section aria-label="Limits and unknowns" className="grid gap-2">
              <h3 className="cfn-type-label">Limits and unknowns</h3>
              <NexusLimitations row={row} />
            </section>
            <section aria-label="Review action" className="grid gap-2 border-t border-[var(--color-border)] pt-3">
              <h3 className="cfn-type-label">Review status and action</h3>
              <CandidateReviewActions candidate={row} onCommand={onCommand} state={state} />
            </section>
          </article>
        </li>
      ))}
    </ol>
  );
}

export function NexusMatrix({
  state,
  onCommand,
  onOpenSource,
  presentation = "auto",
  dataState = { kind: "ready" },
}: {
  state: CaseState;
  onCommand: CaseCommandDispatcher;
  onOpenSource: (selection: SourceSelection) => void;
  presentation?: NexusPresentation;
  dataState?: NexusDataState;
}) {
  const resolvedPresentation = useNexusPresentation(presentation);
  const rows = selectNexus(state.candidates);
  const duplicateCount = rows.length - new Set(rows.map((row) => row.id)).size;

  return (
    <section aria-labelledby="nexus-heading" className="grid gap-4" id="nexus">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <p className="cfn-type-label text-[var(--color-ink-muted)]">Hero artifact</p>
          <h2 className="cfn-type-heading-2" id="nexus-heading">Charge-Coercion Nexus</h2>
          <p className="max-w-3xl text-sm text-[var(--color-ink-muted)]">
            Six relationship questions keep alleged conduct, possible control, timing, source support, and missingness inspectable. A qualified practitioner decides what can be relied on.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-brand)] bg-[var(--color-brand-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-brand)]">
          <Scale aria-hidden="true" size={17} />
          No score · no legal conclusion
        </div>
      </div>

      <Alert title="Review boundary" tone="neutral">
        Source links show where text occurs. They do not establish truth, authenticity, guilt, status, causation, or legal eligibility.
      </Alert>

      {dataState.kind === "loading" ? (
        <div className="grid gap-3"><Skeleton label="Loading Nexus" /><Skeleton label="Loading Nexus rows" /></div>
      ) : dataState.kind === "error" || dataState.kind === "blocked" ? (
        <Alert title={dataState.kind === "error" ? "Nexus unavailable" : "Nexus blocked"} tone="danger">
          {dataState.message}
        </Alert>
      ) : !rows.length ? (
        <Alert title="No Nexus rows" tone="neutral">
          The active canonical run contains no Nexus relationship records. No successful analysis is inferred.
        </Alert>
      ) : duplicateCount > 0 || rows.length !== 6 ? (
        <Alert title="Nexus contract mismatch" tone="danger">
          The canonical run must contain exactly six unique Nexus rows. Review is blocked rather than fabricating or deduplicating records in the interface.
        </Alert>
      ) : (
        <>
          {dataState.kind === "partial" ? <Alert title="Nexus has limitations" tone="warning">{dataState.message}</Alert> : null}
          <div className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
            <GitMerge aria-hidden="true" size={17} />
            <span>Dependencies are read from the canonical candidate collection.</span>
            <Link2 aria-hidden="true" size={17} />
          </div>
          {resolvedPresentation === "desktop" ? (
            <DesktopNexus onCommand={onCommand} onOpenSource={onOpenSource} rows={rows} state={state} />
          ) : (
            <MobileNexus onCommand={onCommand} onOpenSource={onOpenSource} rows={rows} state={state} />
          )}
        </>
      )}

      <p className="flex items-start gap-2 text-sm text-[var(--color-ink-muted)]">
        <TriangleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
        International guidance can frame review questions but is not case evidence or domestic law. Local legal verification is required.
      </p>
    </section>
  );
}
