"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CaseCandidate, CaseState, EvidenceDependency } from "../../../lib/contracts";
import { selectTimeline } from "../../../lib/review";
import {
  EvidenceNatureStatus,
  ItemOriginStatus,
  ReviewStatusBadge,
  SupportStatusBadge,
} from "../../../components/status";
import { Alert, Button, Select, Skeleton } from "../../../components/ui";
import {
  CitationLink,
  SourceDrawer,
  type CaseCommandDispatcher,
  type SourceMode,
  type SourceSelection,
} from "../source";

type TimelineEvent = Extract<CaseCandidate, { kind: "timeline_event" }>;
type TimelineFilter = "all" | "recruitment" | "movement" | "control" | "alleged_conduct" | "legal_process" | "protection";

export type TimelineDataState =
  | { kind: "ready" }
  | { kind: "loading" }
  | { kind: "error"; message: string; onRetry?: () => void }
  | { kind: "partial"; message: string }
  | { kind: "blocked"; message: string };

function categoryFor(event: TimelineEvent): Exclude<TimelineFilter, "all"> {
  const sourceIds = event.dependencies
    .filter((dependency): dependency is Extract<EvidenceDependency, { kind: "source" }> => dependency.kind === "source")
    .map((dependency) => dependency.sourceSegmentId);
  const title = `${event.title} ${event.currentText}`.toLowerCase();
  if (event.lane === "protection_remedy_urgency") return "protection";
  if (sourceIds.some((id) => id.startsWith("D06")) && /hearing|detain|proceed|alleg/.test(title)) {
    return /alleged communication|allegation/.test(title) ? "alleged_conduct" : "legal_process";
  }
  if (sourceIds.some((id) => id.startsWith("D03"))) return "movement";
  if (sourceIds.some((id) => id.startsWith("D01"))) return "recruitment";
  if (sourceIds.some((id) => id.startsWith("D02") || id.startsWith("D04") || id.startsWith("D05"))) return "control";
  return "legal_process";
}

function dateLabel(event: TimelineEvent) {
  if (event.datePrecision === "day") return event.dateStart ?? "Date unknown";
  if (event.datePrecision === "date_range") return `${event.dateStart ?? "Unknown"} to ${event.dateEnd ?? "unknown"}`;
  if (event.datePrecision === "approximate") return `Approximately ${event.dateStart ?? "unknown date"}`;
  if (event.datePrecision === "conflicting") {
    return `Conflicting dates: ${event.dateAlternatives.map((alternative) => alternative.label).join("; ") || "details unavailable"}`;
  }
  return "Date unknown from the available packet";
}

function SourceDependency({
  dependency,
  event,
  state,
  onOpen,
}: {
  dependency: Extract<EvidenceDependency, { kind: "source" }>;
  event: TimelineEvent;
  state: CaseState;
  onOpen: (selection: SourceSelection) => void;
}) {
  const citation = state.citations.find((item) => item.id === dependency.citationId);
  const segment = state.segments.find((item) => item.id === dependency.sourceSegmentId);
  const document = segment ? state.documents.find((item) => item.id === segment.documentId) : null;

  return (
    <li className="grid gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <EvidenceNatureStatus value={dependency.evidenceNature} />
        <span className="text-sm">{dependency.relationship.replaceAll("_", " ")}</span>
      </div>
      <p className="text-sm text-[var(--color-ink-muted)]">
        {document?.displayName ?? dependency.sourceSegmentId}
        {citation?.pageNumber ? `, page ${citation.pageNumber}` : ""} · {dependency.sourceSegmentId}
      </p>
      <CitationLink candidateId={event.id} citationId={dependency.citationId} onOpen={onOpen} state={state} />
    </li>
  );
}

export function TimelineEventCard({
  event,
  state,
  onOpen,
}: {
  event: TimelineEvent;
  state: CaseState;
  onOpen: (selection: SourceSelection) => void;
}) {
  const sourceDependencies = event.dependencies.filter(
    (dependency): dependency is Extract<EvidenceDependency, { kind: "source" }> => dependency.kind === "source",
  );
  const limitingDependencies = sourceDependencies.filter(
    (dependency) => dependency.relationship === "limits" || dependency.relationship === "contradicts",
  );
  const provenanceWarnings = sourceDependencies
    .map((dependency) => state.segments.find((segment) => segment.id === dependency.sourceSegmentId))
    .filter((segment): segment is NonNullable<typeof segment> => Boolean(segment))
    .map((segment) => state.documents.find((document) => document.id === segment.documentId))
    .filter((document): document is NonNullable<typeof document> => Boolean(document && document.provenanceStatus !== "fixture_verified"));

  return (
    <article className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="grid gap-2">
        <p className="cfn-type-label text-[var(--color-ink-muted)]">{dateLabel(event)}</p>
        <h3 className="cfn-type-heading-3">{event.title}</h3>
        <p>{event.currentText}</p>
        {event.datePrecision === "conflicting" ? (
          <Alert title="Conflicting date information" tone="warning">
            {event.dateAlternatives.map((alternative) => alternative.label).join("; ") || "No single date is selected."}
          </Alert>
        ) : null}
        {event.datePrecision === "approximate" ? <p className="text-sm">Date remains approximate.</p> : null}
        {event.datePrecision === "unknown" ? <p className="text-sm">Date is unknown from the available packet.</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <ItemOriginStatus value={event.itemOrigin} />
        <SupportStatusBadge value={event.supportStatus} />
        <ReviewStatusBadge value={event.reviewStatus} />
      </div>

      {event.locationLabel ? <p className="text-sm text-[var(--color-ink-muted)]">Context: {event.locationLabel}</p> : null}
      {event.actorLabels.length ? <p className="text-sm text-[var(--color-ink-muted)]">People or sources: {event.actorLabels.join(", ")}</p> : null}

      {provenanceWarnings.length ? (
        <Alert title="Provenance limitation" tone="warning">
          {provenanceWarnings.map((document) => `${document.displayName}: ${document.provenanceStatus.replaceAll("_", " ")}`).join(". ")}. Source location does not establish authenticity.
        </Alert>
      ) : null}

      {event.relatedCoverageIssueIds.length ? (
        <Alert title="Coverage limitation" tone="warning">
          Related coverage issue: {event.relatedCoverageIssueIds.join(", ")}.
        </Alert>
      ) : null}

      {event.unknowns.length ? (
        <div>
          <h4 className="cfn-type-label">Unknowns</h4>
          <ul className="list-disc pl-5 text-sm">{event.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul>
        </div>
      ) : null}

      {limitingDependencies.length ? <p className="text-sm">Limiting or contrary source evidence is listed with its relationship below.</p> : null}

      <div>
        <h4 className="cfn-type-label mb-2">Source dependencies</h4>
        {sourceDependencies.length ? (
          <ul className="grid gap-2">
            {sourceDependencies.map((dependency) => (
              <SourceDependency dependency={dependency} event={event} key={dependency.id} onOpen={onOpen} state={state} />
            ))}
          </ul>
        ) : (
          <p className="text-sm">Reviewer-authored event; no source citation is available.</p>
        )}
      </div>
    </article>
  );
}

export function Timeline({
  state,
  dataState = { kind: "ready" },
  onOpenSource,
}: {
  state: CaseState;
  dataState?: TimelineDataState;
  onOpenSource: (selection: SourceSelection) => void;
}) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const events = useMemo(() => selectTimeline(state.candidates), [state.candidates]);
  const filtered = events.filter((event) => filter === "all" || categoryFor(event) === filter);

  if (dataState.kind === "loading") {
    return <section aria-label="Source-linked timeline" className="grid gap-3"><Skeleton label="Loading timeline" /><Skeleton label="Loading timeline event" /></section>;
  }
  if (dataState.kind === "error" || dataState.kind === "blocked") {
    return (
      <Alert title={dataState.kind === "error" ? "Timeline unavailable" : "Timeline blocked"} tone="danger">
        <p>{dataState.message}</p>
        {dataState.kind === "error" && dataState.onRetry ? <Button onClick={dataState.onRetry} variant="secondary">Retry timeline</Button> : null}
      </Alert>
    );
  }

  return (
    <section aria-labelledby="timeline-heading" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="cfn-type-label text-[var(--color-ink-muted)]">Qualified chronology</p>
          <h2 className="cfn-type-heading-2" id="timeline-heading">Source-linked timeline</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">Dates, reports, allegations, conflicts, and unknowns remain qualified.</p>
        </div>
        <label className="grid gap-1 text-sm" htmlFor="timeline-filter">
          <span className="cfn-type-label">Filter timeline</span>
          <Select id="timeline-filter" onChange={(event) => setFilter(event.target.value as TimelineFilter)} value={filter}>
            <option value="all">All events</option>
            <option value="recruitment">Recruitment</option>
            <option value="movement">Movement</option>
            <option value="control">Control</option>
            <option value="alleged_conduct">Alleged conduct</option>
            <option value="legal_process">Legal process</option>
            <option value="protection">Protection</option>
          </Select>
        </label>
      </div>
      {dataState.kind === "partial" ? <Alert title="Timeline has limitations" tone="warning">{dataState.message}</Alert> : null}
      {!filtered.length ? (
        <Alert title="No timeline events" tone="neutral">No canonical events match this filter. This does not mean the packet contains no relevant information.</Alert>
      ) : (
        <ol className="grid gap-4" aria-label="Qualified timeline events">
          {filtered.map((event) => <li key={event.id}><TimelineEventCard event={event} onOpen={onOpenSource} state={state} /></li>)}
        </ol>
      )}
    </section>
  );
}

function useSourceMode(): SourceMode {
  const [mode, setMode] = useState<SourceMode>("mobile");
  useEffect(() => {
    const update = () => setMode(window.innerWidth >= 1280 ? "desktop" : window.innerWidth >= 768 ? "tablet" : "mobile");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return mode;
}

export function TimelineSourceExperience({
  state,
  onCommand,
  dataState,
  sourceMode,
}: {
  state: CaseState;
  onCommand: CaseCommandDispatcher;
  dataState?: TimelineDataState;
  sourceMode?: SourceMode;
}) {
  const detectedMode = useSourceMode();
  const mode = sourceMode ?? detectedMode;
  const [selection, setSelection] = useState<SourceSelection | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    timeline.inert = Boolean(selection && mode === "mobile");
    return () => { timeline.inert = false; };
  }, [mode, selection]);

  return (
    <div className={mode === "desktop" && selection ? "flex items-start" : "relative"}>
      <div aria-hidden={selection && mode === "mobile" ? "true" : undefined} className="min-w-0 flex-1" ref={timelineRef}>
        <Timeline dataState={dataState} onOpenSource={setSelection} state={state} />
      </div>
      <SourceDrawer mode={mode} onClose={() => setSelection(null)} onCommand={onCommand} selection={selection} state={state} />
    </div>
  );
}
