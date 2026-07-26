"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { CaseCandidate, CaseState, EvidenceDependency } from "../../../lib/contracts";
import { selectTimeline } from "../../../lib/review";
import {
  Chip,
  ProvenanceBadge,
  ReviewStatusBadge as LovableReviewStatusBadge,
  SourceCitation,
  SupportStatusBadge as LovableSupportStatusBadge,
} from "../../../components/lovable/nexus-ui";
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

function dateQualificationLabel(event: TimelineEvent) {
  if (event.datePrecision === "day") return "Exact date";
  if (event.datePrecision === "date_range") return "Date range";
  if (event.datePrecision === "approximate") return "Approximate date";
  if (event.datePrecision === "conflicting") return "Conflicting dates";
  return "Unknown date · outside exact chronology";
}

function SourceDependency({
  dependency,
  event,
  state,
  onOpen,
  showAction = true,
}: {
  dependency: Extract<EvidenceDependency, { kind: "source" }>;
  event: TimelineEvent;
  state: CaseState;
  onOpen: (selection: SourceSelection) => void;
  showAction?: boolean;
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
      {showAction ? (
        <CitationLink
          candidateId={event.id}
          citationId={dependency.citationId}
          onOpen={onOpen}
          state={state}
        />
      ) : null}
    </li>
  );
}

export function TimelineEventCard({
  event,
  state,
  onOpen,
  showDateLabel = true,
  embedded = false,
}: {
  event: TimelineEvent;
  state: CaseState;
  onOpen: (selection: SourceSelection) => void;
  showDateLabel?: boolean;
  embedded?: boolean;
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
  const primarySource = sourceDependencies[0] ?? null;

  return (
    <article
      className={
        embedded
          ? "grid gap-3"
          : "grid gap-3 rounded-xl border border-border bg-card p-4"
      }
    >
      <div>
        {embedded ? (
          <p className="font-mono text-[10px] text-muted-foreground">
            {event.id}
          </p>
        ) : showDateLabel ? (
          <p className="text-sm font-semibold text-[var(--color-ink-muted)]">{dateLabel(event)}</p>
        ) : null}
        <h3 className="mt-1 font-serif text-lg leading-tight">
          {event.title}
        </h3>
        <p className="mt-2 text-sm">{event.currentText}</p>
        {event.datePrecision === "conflicting" ? (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-[color-mix(in_oklab,var(--rust)_40%,transparent)] bg-[color-mix(in_oklab,var(--rust)_10%,transparent)] px-3 py-2 text-xs leading-relaxed text-[color:var(--rust)]">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Conflicting source dates remain visible for practitioner review.</span>
          </div>
        ) : null}
        {event.datePrecision === "approximate" ? <p className="mt-2 text-xs text-muted-foreground">Date remains approximate.</p> : null}
        {event.datePrecision === "unknown" ? <p className="mt-2 text-xs text-muted-foreground">Date is unknown from the available packet.</p> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {showDateLabel ? (
          <Chip tone="amber">
            {embedded ? `Date: ${dateLabel(event)}` : dateQualificationLabel(event)}
          </Chip>
        ) : null}
        <ItemOriginStatus value={event.itemOrigin} />
        <SupportStatusBadge value={event.supportStatus} />
        <ReviewStatusBadge value={event.reviewStatus} />
      </div>

      {embedded && primarySource ? (
        <div className="border-t border-border pt-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Source action
          </div>
          <CitationLink
            candidateId={event.id}
            citationId={primarySource.citationId}
            onOpen={onOpen}
            state={state}
          />
        </div>
      ) : null}

      {embedded ? (
        <details className="rounded-md border border-border/70 bg-background/40">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium">
            Evidence details and dependencies ({sourceDependencies.length})
          </summary>
          <div className="grid gap-3 border-t border-border/70 p-3">
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
                <h4 className="text-sm font-semibold">Unknowns</h4>
                <ul className="list-disc pl-5 text-sm">{event.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul>
              </div>
            ) : null}
            {limitingDependencies.length ? <p className="text-sm">Limiting or contrary source evidence is listed with its relationship below.</p> : null}
            <div>
              <h4 className="mb-2 text-sm font-semibold">Source dependencies</h4>
              {sourceDependencies.length ? (
                <ul className="grid gap-2">
                  {sourceDependencies.map((dependency) => (
                    <SourceDependency
                      dependency={dependency}
                      event={event}
                      key={dependency.id}
                      onOpen={onOpen}
                      showAction={dependency.id !== primarySource?.id}
                      state={state}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm">Reviewer-authored event; no source citation is available.</p>
              )}
            </div>
          </div>
        </details>
      ) : (
        <>
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
              <h4 className="text-sm font-semibold">Unknowns</h4>
              <ul className="list-disc pl-5 text-sm">{event.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul>
            </div>
          ) : null}
          {limitingDependencies.length ? <p className="text-sm">Limiting or contrary source evidence is listed with its relationship below.</p> : null}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Source dependencies</h4>
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
        </>
      )}
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
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const events = useMemo(() => selectTimeline(state.candidates), [state.candidates]);
  const filtered = events.filter(
    (event) =>
      (filter === "all" || categoryFor(event) === filter) &&
      (!conflictsOnly ||
        event.datePrecision === "conflicting" ||
        event.supportStatus === "conflicting") &&
      (!pendingOnly ||
        event.reviewStatus === "pending" ||
        event.reviewStatus === "invalidated"),
  );
  const selected =
    filtered.find((event) => event.id === selectedId) ?? filtered[0] ?? null;
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    function openEventFromHash() {
      if (typeof window === "undefined") return;
      const match = /^#candidate-(.+)$/.exec(window.location.hash);
      if (!match) return;
      const eventId = decodeURIComponent(match[1]);
      if (!events.some((event) => event.id === eventId)) return;
      setFilter("all");
      setConflictsOnly(false);
      setPendingOnly(false);
      setSelectedId(eventId);
      window.requestAnimationFrame(() => {
        const target = document.getElementById(`candidate-${eventId}`);
        if (typeof target?.scrollIntoView === "function") {
          target.scrollIntoView({ block: "nearest" });
        }
      });
    }
    openEventFromHash();
    window.addEventListener("hashchange", openEventFromHash);
    return () => window.removeEventListener("hashchange", openEventFromHash);
  }, [events]);

  useEffect(() => {
    if (!filtered.length) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((event) => event.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  function moveSelection(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const next =
      event.key === "ArrowDown"
        ? Math.min(filtered.length - 1, index + 1)
        : Math.max(0, index - 1);
    const id = filtered[next]?.id;
    if (id) {
      setSelectedId(id);
      cardRefs.current[id]?.focus();
    }
  }

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
    <section aria-labelledby="timeline-heading" className="space-y-6">
      <h2 className="sr-only" id="timeline-heading">
        Source-linked timeline
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          {(
            [
              "all",
              "recruitment",
              "movement",
              "control",
              "alleged_conduct",
              "legal_process",
              "protection",
            ] as TimelineFilter[]
          ).map((value) => (
            <button
              className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${
                filter === value
                  ? "border-[color:var(--amber)] bg-[color-mix(in_oklab,var(--amber)_15%,transparent)]"
                  : "border-border hover:bg-muted"
              }`}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {value === "all" ? "All events" : value.replaceAll("_", " ")}
            </button>
          ))}
        </div>
        <label className="ml-auto inline-flex items-center gap-2 text-xs">
          <input
            checked={conflictsOnly}
            onChange={(event) => setConflictsOnly(event.target.checked)}
            type="checkbox"
          />
          Conflicts only
        </label>
        <label className="inline-flex items-center gap-2 text-xs">
          <input
            checked={pendingOnly}
            onChange={(event) => setPendingOnly(event.target.checked)}
            type="checkbox"
          />
          Pending review only
        </label>
        <label className="sr-only" htmlFor="timeline-filter">
          Filter timeline
          <Select
            id="timeline-filter"
            onChange={(event) =>
              setFilter(event.target.value as TimelineFilter)
            }
            value={filter}
          >
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
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <ol className="flex flex-col gap-6 sm:gap-7" aria-label="Qualified timeline events">
            {filtered.map((event, index) => {
              const isSelected = selected?.id === event.id;
              const isConflicting =
                event.datePrecision === "conflicting" ||
                event.supportStatus === "conflicting";
              const compactCitations = event.dependencies
                .filter(
                  (
                    dependency,
                  ): dependency is Extract<
                    EvidenceDependency,
                    { kind: "source" }
                  > => dependency.kind === "source",
                )
                .map((dependency) =>
                  state.citations.find(
                    (citation) => citation.id === dependency.citationId,
                  ),
                )
                .filter(
                  (
                    citation,
                  ): citation is NonNullable<typeof citation> =>
                    Boolean(citation),
                );
              return (
                <li
                  aria-label={`Timeline event: ${event.id}`}
                  className="grid grid-cols-[1fr] gap-3 sm:grid-cols-[8.5rem_1.25rem_1fr] sm:gap-4"
                  id={`candidate-${event.id}`}
                  key={event.id}
                >
                  <div className="sm:pt-4 sm:text-right">
                    <p className="font-mono text-sm text-foreground">
                      {dateLabel(event)}
                    </p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                      {dateQualificationLabel(event)}
                    </p>
                  </div>
                  <div className="relative hidden sm:block">
                    <div
                      aria-hidden="true"
                      className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border"
                    />
                    <span
                      aria-hidden="true"
                      className={`absolute left-1/2 top-5 h-3 w-3 -translate-x-1/2 rounded-full ring-2 ring-background ${
                        isConflicting
                          ? "bg-[color:var(--rust)]"
                          : event.datePrecision === "day"
                            ? "bg-[color:var(--sage)]"
                            : event.datePrecision === "unknown"
                              ? "bg-muted-foreground/40"
                              : "bg-[color:var(--amber)]"
                      }`}
                    />
                  </div>
                  <article
                    className={`group w-full rounded-xl border bg-card p-5 transition hover:border-foreground/30 hover:shadow-sm ${
                      isSelected
                        ? "border-[color:var(--amber)] shadow-sm ring-1 ring-[color-mix(in_oklab,var(--amber)_35%,transparent)]"
                        : "border-border"
                    }`}
                  >
                    <button
                      aria-pressed={isSelected}
                      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() => setSelectedId(event.id)}
                      onKeyDown={(keyboardEvent) =>
                        moveSelection(keyboardEvent, index)
                      }
                      ref={(element) => {
                        cardRefs.current[event.id] = element;
                      }}
                      type="button"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-serif text-base leading-snug text-foreground">
                          {event.title}
                        </h3>
                        <Chip tone="mute">
                          {categoryFor(event).replaceAll("_", " ")}
                        </Chip>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Chip
                          tone={
                            isConflicting
                              ? "rust"
                              : event.datePrecision === "day"
                                ? "sage"
                                : event.datePrecision === "unknown"
                                  ? "mute"
                                  : "amber"
                          }
                        >
                          {dateQualificationLabel(event)}
                        </Chip>
                        <LovableSupportStatusBadge support={event.supportStatus} />
                        <LovableReviewStatusBadge review={event.reviewStatus} />
                        <ProvenanceBadge origin={event.itemOrigin} />
                      </div>
                      {compactCitations.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {compactCitations.map((citation) => (
                            <SourceCitation
                              docId={citation.documentId}
                              key={citation.id}
                              page={citation.pageNumber ?? undefined}
                            />
                          ))}
                        </div>
                      ) : null}
                      {isConflicting ? (
                        <div className="mt-3 flex items-start gap-2 rounded-md border border-[color-mix(in_oklab,var(--rust)_40%,transparent)] bg-[color-mix(in_oklab,var(--rust)_10%,transparent)] px-3 py-2 text-xs leading-relaxed text-[color:var(--rust)]">
                          <AlertTriangle
                            aria-hidden="true"
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          />
                          Conflicting sources are kept visible for practitioner
                          review.
                        </div>
                      ) : event.unknowns.length ? (
                        <p className="mt-3 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                            Limitations —
                          </span>{" "}
                          {event.unknowns.join("; ")}.
                        </p>
                      ) : null}
                    </button>
                  </article>
                </li>
              );
            })}
          </ol>
          <aside
            aria-label="Selected timeline event detail"
            className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4 lg:self-start"
            role="region"
          >
            {selected ? (
              <TimelineEventCard
                embedded
                event={selected}
                onOpen={onOpenSource}
                state={state}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a timeline event to see citations, limitations, and
                actions.
              </p>
            )}
          </aside>
        </div>
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
