"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GitBranch, Search, ShieldAlert } from "lucide-react";
import {
  ItemOriginStatus,
  ReviewStatusBadge,
  SupportStatusBadge,
} from "../../../components/status";
import { useCaseState } from "../../../components/shell";
import { Alert, Button, Select } from "../../../components/ui";
import type {
  CaseCandidate,
  CaseState,
  EvidenceDependency,
  SupportStatus,
} from "../../../lib/contracts";
import { GoldenNexusIds } from "../../../lib/contracts";
import { selectContextGaps, selectNexus } from "../../../lib/review";
import { CandidateReviewActions } from "../candidate";
import { ContextGapPanel } from "../context-gaps";
import {
  CitationLink,
  SourceDrawer,
  type SourceMode,
  type SourceSelection,
} from "../source";
import { TimelineSourceExperience } from "../timeline";
import { deriveReviewDestinationState } from "./review-destination-state";

type ContextGap = Extract<CaseCandidate, { kind: "context_gap" }>;
type NexusRow = Extract<CaseCandidate, { kind: "nexus_relationship" }>;
type GapFilter = "all" | "unanswered" | "answered" | "deferred" | "review_required";
type NexusFilter = "all" | NexusRow["category"];

const nexusMapLayout = {
  "NEXUS-RECRUITMENT": { x: 120, y: 82 },
  "NEXUS-MOVEMENT": { x: 120, y: 238 },
  "NEXUS-CONTROL": { x: 350, y: 82 },
  "NEXUS-COMPELLED-TASKS": { x: 350, y: 238 },
  "NEXUS-OFFENCE-TIMING": { x: 590, y: 160 },
  "NEXUS-URGENCY": { x: 590, y: 292 },
} satisfies Record<(typeof GoldenNexusIds)[number], { x: number; y: number }>;

function useSourceMode(): SourceMode {
  const [mode, setMode] = useState<SourceMode>("mobile");
  useEffect(() => {
    const update = () =>
      setMode(
        window.innerWidth >= 1280
          ? "desktop"
          : window.innerWidth >= 768
            ? "tablet"
            : "mobile",
      );
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return mode;
}

function DestinationBoundary({
  kind,
  title,
}: {
  kind: Exclude<ReturnType<typeof deriveReviewDestinationState>["kind"], "ready">;
  title: string;
}) {
  const copy = {
    running: {
      heading: `${title} is preparing`,
      body: "Analysis is still pending or running. Only the last stable canonical state is available.",
      tone: "neutral" as const,
    },
    not_started: {
      heading: `${title} has not started`,
      body: "Complete Purpose and Documents, then begin analysis. An empty view does not imply that no relevant information exists.",
      tone: "neutral" as const,
    },
    failed: {
      heading: `${title} is unavailable`,
      body: "The active analysis run failed safely and produced no accepted output for this view.",
      tone: "danger" as const,
    },
    stale: {
      heading: `${title} needs a rerun`,
      body: "The successful analysis no longer matches the current Purpose, masking, selected segments, fixture, or guidance provenance.",
      tone: "warning" as const,
    },
  }[kind];

  return (
    <section aria-label={`${title} state`} className="grid gap-4">
      <h1 className="cfn-type-heading-1">{title}</h1>
      <Alert title={copy.heading} tone={copy.tone}>
        {copy.body}
      </Alert>
      <div className="flex flex-wrap gap-2">
        <a className="cfn-control-target rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 text-sm font-semibold" href="/case/demo/intake">
          Open Documents
        </a>
        <a className="cfn-control-target rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 text-sm font-semibold" href="/case/demo/analysis">
          Open Structured Analysis
        </a>
      </div>
    </section>
  );
}

function requiresGapReview(gap: ContextGap) {
  return (
    gap.reviewRequirement === "individual" &&
    !["human_accepted", "human_edited", "rejected"].includes(gap.reviewStatus)
  );
}

export function EvidenceGapsWorkspace() {
  const { state, dispatchCaseCommand } = useCaseState();
  const destination = deriveReviewDestinationState(state);
  const [filter, setFilter] = useState<GapFilter>("all");
  const [query, setQuery] = useState("");
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const [sourceSelection, setSourceSelection] = useState<SourceSelection | null>(null);
  const sourceMode = useSourceMode();
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    workspace.inert = Boolean(sourceSelection && sourceMode === "mobile");
    return () => {
      workspace.inert = false;
    };
  }, [sourceMode, sourceSelection]);

  if (destination.kind !== "ready") {
    return <DestinationBoundary kind={destination.kind} title="Evidence Gaps" />;
  }

  const gaps = selectContextGaps(destination.state.candidates);
  const visible = gaps.filter((gap) => {
    if (
      query &&
      !`${gap.id} ${gap.title} ${gap.reviewQuestion} ${gap.currentText}`
        .toLowerCase()
        .includes(query.toLowerCase())
    ) {
      return false;
    }
    if (filter === "unanswered") return gap.responseStatus === "unanswered";
    if (filter === "answered") return gap.responseStatus === "answered";
    if (filter === "deferred") {
      return ["deferred", "outside_scope", "preserved_unknown"].includes(
        gap.responseStatus,
      );
    }
    if (filter === "review_required") return requiresGapReview(gap);
    return true;
  });
  const selected =
    visible.find((gap) => gap.id === requestedId) ?? visible[0] ?? null;
  const countFor = (value: GapFilter) =>
    gaps.filter((gap) => {
      if (value === "unanswered") return gap.responseStatus === "unanswered";
      if (value === "answered") return gap.responseStatus === "answered";
      if (value === "deferred") {
        return ["deferred", "outside_scope", "preserved_unknown"].includes(
          gap.responseStatus,
        );
      }
      if (value === "review_required") return requiresGapReview(gap);
      return true;
    }).length;

  return (
    <div className={sourceMode === "desktop" && sourceSelection ? "flex items-start" : "relative"}>
      <div className="grid min-w-0 flex-1 gap-5" ref={workspaceRef}>
        <header className="grid gap-3 border-b border-[var(--color-border)] pb-5">
          <div>
            <p className="cfn-type-label text-[var(--color-ink-muted)]">Stage 3 · Analysis</p>
            <h1 className="cfn-type-heading-1">Evidence Gaps</h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--color-ink-muted)]">
              Canonical missing, conflicting, and unknown context from the active analysis run. Responses add practitioner context; they never rewrite source evidence.
            </p>
          </div>
          <Alert title="A gap is not proof" tone="warning">
            Missing or unreadable information is not evidence that an event did not occur.
          </Alert>
        </header>

        <section aria-label="Evidence gap filters" className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <label className="relative min-w-0">
            <span className="sr-only">Search evidence gaps</span>
            <Search aria-hidden="true" className="absolute left-3 top-3 text-[var(--color-ink-muted)]" size={16} />
            <input
              className="min-h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] pl-9 pr-3 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions, IDs, and wording"
              type="search"
              value={query}
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "unanswered", "answered", "deferred", "review_required"] as const).map((value) => (
              <button
                aria-pressed={filter === value}
                className={`cfn-control-target rounded-full border px-2.5 py-1 text-xs ${
                  filter === value
                    ? "border-[var(--amber)] bg-[var(--color-warning-subtle)]"
                    : "border-[var(--color-border)]"
                }`}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                {value.replaceAll("_", " ")} ({countFor(value)})
              </button>
            ))}
          </div>
        </section>

        {!gaps.length ? (
          <Alert title="No canonical context-gap candidates" tone="neutral">
            The successful active run produced zero context gaps. This is not a claim that the packet is complete.
          </Alert>
        ) : (
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(240px,0.7fr)_minmax(0,1.6fr)]">
            <nav aria-label="Evidence gap candidates" className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {visible.length ? (
                <ul className="divide-y divide-[var(--color-border)]">
                  {visible.map((gap) => (
                    <li key={gap.id}>
                      <button
                        aria-current={selected?.id === gap.id ? "true" : undefined}
                        className={`grid w-full gap-1 border-l-2 p-3 text-left ${
                          selected?.id === gap.id
                            ? "border-l-[var(--amber)] bg-[var(--color-surface-subtle)]"
                            : "border-l-transparent"
                        }`}
                        onClick={() => setRequestedId(gap.id)}
                        type="button"
                      >
                        <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">
                          {gap.id} · {gap.responseStatus.replaceAll("_", " ")}
                        </span>
                        <span className="text-sm font-semibold">{gap.reviewQuestion}</span>
                        <span className="flex flex-wrap gap-1 pt-1">
                          <SupportStatusBadge value={gap.supportStatus} />
                          <ReviewStatusBadge value={gap.reviewStatus} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-4 text-sm text-[var(--color-ink-muted)]">
                  No canonical gaps match these filters.
                </p>
              )}
            </nav>
            {selected ? (
              <ContextGapPanel
                gap={selected}
                onCommand={dispatchCaseCommand}
                onOpenSource={setSourceSelection}
                state={destination.state}
              />
            ) : (
              <Alert title="No visible gap detail" tone="neutral">
                Clear or change the current filters to select a canonical gap.
              </Alert>
            )}
          </div>
        )}
      </div>
      <SourceDrawer
        mode={sourceMode}
        onClose={() => setSourceSelection(null)}
        onCommand={dispatchCaseCommand}
        selection={sourceSelection}
        state={state}
      />
    </div>
  );
}

function dependencyTarget(dependency: EvidenceDependency) {
  if (dependency.kind === "source") return dependency.sourceSegmentId;
  if (dependency.kind === "candidate") return dependency.candidateId;
  return dependency.nexusCandidateId;
}

function readable(value: string) {
  return value.replaceAll("_", " ");
}

function currentRunNexusRows(state: CaseState) {
  const activeRunId = state.activeAnalysisRunId;
  return selectNexus(state.candidates).filter(
    (row) => row.analysisRunId === activeRunId,
  );
}

function nexusContractError(rows: NexusRow[]) {
  if (!rows.length) return null;
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.id, (counts.get(row.id) ?? 0) + 1);
  const missing = GoldenNexusIds.filter((id) => !counts.has(id));
  const duplicate = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  const unexpected = rows
    .map((row) => row.id)
    .filter((id) => !GoldenNexusIds.includes(id as (typeof GoldenNexusIds)[number]));

  if (!missing.length && !duplicate.length && !unexpected.length && rows.length === GoldenNexusIds.length) {
    return null;
  }

  return [
    missing.length ? `Missing: ${missing.join(", ")}` : null,
    duplicate.length ? `Duplicate: ${duplicate.join(", ")}` : null,
    unexpected.length ? `Unexpected: ${unexpected.join(", ")}` : null,
  ].filter(Boolean).join(". ");
}

function nexusNodeState(row: NexusRow) {
  if (row.inclusionStatus === "withdrawn") return "withdrawn";
  if (row.reviewStatus === "invalidated") return "invalidated";
  return "active";
}

function nexusNodeStateLabel(row: NexusRow) {
  const state = nexusNodeState(row);
  if (state === "active") return "Active";
  if (state === "withdrawn") return "Withdrawn";
  return "Invalidated";
}

function shortNexusLabel(row: NexusRow) {
  if (row.category === "compelled_tasks") return "Compelled tasks";
  if (row.category === "offence_timing") return "Offence timing";
  return readable(row.category).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function NexusVisualMap({
  rows,
  selectedId,
  onSelect,
}: {
  rows: NexusRow[];
  selectedId: string | null;
  onSelect: (candidateId: string) => void;
}) {
  const visibleIds = new Set(rows.map((row) => row.id));
  const nexusEdges = rows.flatMap((row) =>
    row.dependencies
      .filter(
        (
          dependency,
        ): dependency is Extract<EvidenceDependency, { kind: "nexus" }> =>
          dependency.kind === "nexus" && visibleIds.has(dependency.nexusCandidateId),
      )
      .map((dependency) => ({
        id: dependency.id,
        from: dependency.nexusCandidateId as keyof typeof nexusMapLayout,
        to: row.id as keyof typeof nexusMapLayout,
        relationship: dependency.relationship,
        active: dependency.active,
      })),
  );

  return (
    <section
      aria-labelledby="evidence-map-visual-heading"
      className="min-w-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] pb-3">
        <GitBranch aria-hidden="true" size={17} />
        <h2 className="font-semibold" id="evidence-map-visual-heading">
          Canonical relationship map
        </h2>
        <span className="ml-auto font-mono text-xs">
          {rows.length}/{GoldenNexusIds.length} visible
        </span>
      </div>

      {rows.length ? (
        <div className="overflow-x-auto rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)]">
          <svg
            aria-labelledby="evidence-map-svg-title evidence-map-svg-desc"
            className="min-w-[720px]"
            height="390"
            viewBox="0 0 720 390"
            width="100%"
          >
            <title id="evidence-map-svg-title">Evidence Integrity Nexus map</title>
            <desc id="evidence-map-svg-desc">
              Six canonical Nexus relationship nodes with active and inactive dependencies from the current fresh analysis run.
            </desc>
            <defs>
              <marker
                id="nexus-map-arrow-active"
                markerHeight="8"
                markerWidth="8"
                orient="auto"
                refX="7"
                refY="4"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-brand)" />
              </marker>
              <marker
                id="nexus-map-arrow-inactive"
                markerHeight="8"
                markerWidth="8"
                orient="auto"
                refX="7"
                refY="4"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-ink-muted)" />
              </marker>
            </defs>
            {nexusEdges.map((edge) => {
              const from = nexusMapLayout[edge.from];
              const to = nexusMapLayout[edge.to];
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              return (
                <g key={edge.id}>
                  <line
                    markerEnd={
                      edge.active
                        ? "url(#nexus-map-arrow-active)"
                        : "url(#nexus-map-arrow-inactive)"
                    }
                    stroke={edge.active ? "var(--color-brand)" : "var(--color-ink-muted)"}
                    strokeDasharray={edge.active ? undefined : "6 6"}
                    strokeWidth={edge.active ? 2.5 : 2}
                    vectorEffect="non-scaling-stroke"
                    x1={from.x + 74}
                    x2={to.x - 76}
                    y1={from.y}
                    y2={to.y}
                  />
                  <rect
                    fill="var(--color-canvas)"
                    height="20"
                    rx="10"
                    width="122"
                    x={midX - 61}
                    y={midY - 18}
                  />
                  <text
                    fill="var(--color-ink-muted)"
                    fontSize="10"
                    textAnchor="middle"
                    x={midX}
                    y={midY - 4}
                  >
                    {readable(edge.relationship)} · {edge.active ? "active" : "inactive"}
                  </text>
                </g>
              );
            })}
            {rows.map((row) => {
              const position = nexusMapLayout[row.id as keyof typeof nexusMapLayout];
              const selected = row.id === selectedId;
              const stateLabel = nexusNodeStateLabel(row);
              const inactiveDependencies = row.dependencies.filter((dependency) => !dependency.active).length;
              const nodeState = nexusNodeState(row);
              return (
                <g
                  aria-label={`Select Nexus node ${row.id}: ${row.title}. ${stateLabel}. ${inactiveDependencies} inactive dependencies.`}
                  aria-pressed={selected}
                  className="cursor-pointer outline-none"
                  key={row.id}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(row.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <title>{`${row.id}: ${row.title}`}</title>
                  <rect
                    fill={
                      selected
                        ? "var(--color-warning-subtle)"
                        : nodeState === "active"
                          ? "var(--color-surface)"
                          : "var(--color-danger-subtle)"
                    }
                    height="92"
                    rx="8"
                    stroke={
                      selected
                        ? "var(--amber)"
                        : nodeState === "active"
                          ? "var(--color-border-strong)"
                          : "var(--color-danger)"
                    }
                    strokeDasharray={nodeState === "active" ? undefined : "7 4"}
                    strokeWidth={selected ? 3 : 1.5}
                    vectorEffect="non-scaling-stroke"
                    width="150"
                    x={position.x - 75}
                    y={position.y - 46}
                  />
                  <text
                    fill="var(--color-ink-muted)"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                    x={position.x}
                    y={position.y - 25}
                  >
                    {row.id.replace("NEXUS-", "")}
                  </text>
                  <text
                    fill="var(--color-ink)"
                    fontSize="13"
                    fontWeight="700"
                    textAnchor="middle"
                    x={position.x}
                    y={position.y - 5}
                  >
                    {shortNexusLabel(row)}
                  </text>
                  <text
                    fill={nodeState === "active" ? "var(--color-brand)" : "var(--color-danger)"}
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                    x={position.x}
                    y={position.y + 17}
                  >
                    {stateLabel}
                  </text>
                  <text
                    fill="var(--color-ink-muted)"
                    fontSize="10"
                    textAnchor="middle"
                    x={position.x}
                    y={position.y + 34}
                  >
                    {row.dependencies.filter((dependency) => dependency.active).length} active · {inactiveDependencies} inactive
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <Alert title="No visible map nodes" tone="neutral">
          Change the filters to show canonical relationship nodes.
        </Alert>
      )}

      <div className="mt-3 grid gap-2 text-xs text-[var(--color-ink-muted)] sm:grid-cols-3">
        <p><span className="font-semibold text-[var(--color-ink)]">Solid</span> nodes and edges are active.</p>
        <p><span className="font-semibold text-[var(--color-ink)]">Dashed</span> nodes or edges are withdrawn, invalidated, or inactive after recalculation.</p>
        <p>Selection changes only the local detail panel; review actions still use canonical commands.</p>
      </div>

      <details className="mt-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 text-sm">
        <summary className="cursor-pointer font-semibold">Text relationship list</summary>
        <ul aria-label="Evidence map text relationships" className="mt-3 grid gap-2">
          {rows.map((row) => (
            <li key={row.id}>
              <span className="font-mono text-xs">{row.id}</span>
              {": "}
              {row.title}. {nexusNodeStateLabel(row)}. Dependencies:{" "}
              {row.dependencies.map((dependency) =>
                `${dependencyTarget(dependency)} ${readable(dependency.relationship)} ${dependency.active ? "active" : "inactive"}`,
              ).join("; ")}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function NexusMapDetail({
  selected,
  state,
  onOpenSource,
  onCommand,
}: {
  selected: NexusRow;
  state: CaseState;
  onOpenSource: (selection: SourceSelection) => void;
  onCommand: ReturnType<typeof useCaseState>["dispatchCaseCommand"];
}) {
  return (
    <article
      aria-label={`Evidence map detail: ${selected.id}`}
      className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <header className="grid gap-2 border-b border-[var(--color-border)] p-4">
        <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">
          {selected.id} · {readable(selected.category)}
        </p>
        <h2 className="font-serif text-2xl">{selected.title}</h2>
        <p className="text-sm">{selected.currentText}</p>
        <div className="flex flex-wrap gap-1.5">
          <ItemOriginStatus value={selected.itemOrigin} />
          <SupportStatusBadge value={selected.supportStatus} />
          <ReviewStatusBadge value={selected.reviewStatus} />
          <span className="cfn-status-token" data-pattern="dashed" data-tone={selected.inclusionStatus === "active" ? "supported" : "danger"}>
            Inclusion: {readable(selected.inclusionStatus)}
          </span>
        </div>
      </header>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <section>
          <h3 className="cfn-type-label">Relationship summary</h3>
          <p className="mt-1 text-sm">{selected.relationshipSummary}</p>
          <h3 className="cfn-type-label mt-4">Limitations and unknowns</h3>
          {selected.unknowns.length ? (
            <ul className="mt-1 list-disc pl-5 text-sm">
              {selected.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">No separate unknown is recorded beyond source and dependency limits.</p>
          )}
        </section>
        <section>
          <h3 className="cfn-type-label">Canonical dependencies and citations</h3>
          <ul className="mt-2 grid gap-2">
            {selected.dependencies.map((dependency) => (
              <li
                className={`grid gap-2 rounded-[var(--radius-control)] border p-3 text-sm ${
                  dependency.active
                    ? "border-[var(--color-border)]"
                    : "border-dashed border-[var(--color-danger)] bg-[var(--color-danger-subtle)]"
                }`}
                key={dependency.id}
              >
                <p>
                  <span className="font-mono text-xs">{dependencyTarget(dependency)}</span>
                  {" · "}{readable(dependency.relationship)}
                  {" · "}{dependency.active ? "active" : "inactive after recalculation"}
                </p>
                {dependency.kind === "source" ? (
                  <CitationLink
                    candidateId={selected.id}
                    citationId={dependency.citationId}
                    onOpen={onOpenSource}
                    state={state}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="grid gap-2 border-t border-[var(--color-border)] p-4">
        <h3 className="cfn-type-label">Human review action</h3>
        <CandidateReviewActions candidate={selected} onCommand={onCommand} state={state} />
      </section>
    </article>
  );
}

export function EvidenceIntegrityWorkspace() {
  const { state, dispatchCaseCommand } = useCaseState();
  const destination = deriveReviewDestinationState(state);
  const [category, setCategory] = useState<NexusFilter>("all");
  const [support, setSupport] = useState<"all" | SupportStatus>("all");
  const [query, setQuery] = useState("");
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const [sourceSelection, setSourceSelection] = useState<SourceSelection | null>(null);
  const sourceMode = useSourceMode();

  if (destination.kind !== "ready") {
    return <DestinationBoundary kind={destination.kind} title="Evidence Integrity Map" />;
  }

  const rows = currentRunNexusRows(state);
  const contractError = nexusContractError(rows);
  const visible = rows.filter((row) => {
    if (category !== "all" && row.category !== category) return false;
    if (support !== "all" && row.supportStatus !== support) return false;
    return !query || `${row.id} ${row.title} ${row.currentText} ${row.relationshipSummary}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });
  const selected =
    visible.find((row) => row.id === requestedId) ?? visible[0] ?? null;
  const categories = [...new Set(rows.map((row) => row.category))].sort();
  const supportStatuses = [...new Set(rows.map((row) => row.supportStatus))].sort();

  return (
    <div className={sourceMode === "desktop" && sourceSelection ? "flex items-start" : "relative"}>
      <div className="grid min-w-0 flex-1 gap-5">
        <header className="grid gap-3 border-b border-[var(--color-border)] pb-5">
          <div>
            <p className="cfn-type-label text-[var(--color-ink-muted)]">Stage 5 · Review</p>
            <h1 className="cfn-type-heading-1">Evidence Integrity Map</h1>
            <p className="mt-1 max-w-3xl text-sm text-[var(--color-ink-muted)]">
              Charge-coercion relationships projected only from canonical nexus candidates, citations, and dependency recalculation state.
            </p>
          </div>
          <Alert title="Relationship map only" tone="warning">
            This view is not a trafficking determination, criminal-liability decision, legal opinion, or automated score.
          </Alert>
        </header>

        <section aria-label="Evidence map filters" className="grid gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="relative">
            <span className="sr-only">Search evidence map</span>
            <Search aria-hidden="true" className="absolute left-3 top-3 text-[var(--color-ink-muted)]" size={16} />
            <input
              className="min-h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] pl-9 pr-3 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search relationships"
              type="search"
              value={query}
            />
          </label>
          <label className="grid gap-1 text-xs">
            <span className="cfn-type-label">Category</span>
            <Select onChange={(event) => setCategory(event.target.value as NexusFilter)} value={category}>
              <option value="all">All categories</option>
              {categories.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </Select>
          </label>
          <label className="grid gap-1 text-xs">
            <span className="cfn-type-label">Support</span>
            <Select onChange={(event) => setSupport(event.target.value as typeof support)} value={support}>
              <option value="all">All support states</option>
              {supportStatuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </Select>
          </label>
        </section>

        {!rows.length ? (
          <Alert title="No canonical nexus candidates" tone="neutral">
            The successful active run produced zero nexus relationships. No conclusion is inferred.
          </Alert>
        ) : contractError ? (
          <Alert title="Nexus contract mismatch" tone="danger">
            The active canonical run must contain six unique required relationship records. {contractError}. The interface will not fabricate or deduplicate nodes.
          </Alert>
        ) : (
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <NexusVisualMap onSelect={setRequestedId} rows={visible} selectedId={selected?.id ?? null} />
            {selected ? (
              <NexusMapDetail
                onCommand={dispatchCaseCommand}
                onOpenSource={setSourceSelection}
                selected={selected}
                state={state}
              />
            ) : (
              <Alert title="No visible map detail" tone="neutral">
                Change the filters to select a canonical relationship.
              </Alert>
            )}
          </div>
        )}
        <p className="flex items-start gap-2 text-xs text-[var(--color-ink-muted)]">
          <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
          Guidance may frame review questions but is not case evidence or domestic law. Local legal verification is required.
        </p>
      </div>
      <SourceDrawer
        mode={sourceMode}
        onClose={() => setSourceSelection(null)}
        onCommand={dispatchCaseCommand}
        selection={sourceSelection}
        state={state}
      />
    </div>
  );
}

export function TimelineWorkspace() {
  const { state, dispatchCaseCommand } = useCaseState();
  const destination = deriveReviewDestinationState(state);

  if (destination.kind !== "ready") {
    return <DestinationBoundary kind={destination.kind} title="Timeline" />;
  }

  const hasCoverageWarning = destination.state.coverage.issues.some(
    (issue) => issue.resolutionStatus === "open",
  );
  return (
    <div className="grid gap-5">
      <header className="border-b border-[var(--color-border)] pb-5">
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Stage 5 · Review</p>
        <h1 className="cfn-type-heading-1">Timeline</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--color-ink-muted)]">
          Canonical chronology with exact, approximate, range, conflicting, and unknown date states kept visible.
        </p>
      </header>
      <TimelineSourceExperience
        dataState={
          hasCoverageWarning
            ? {
                kind: "partial",
                message:
                  "One or more source-coverage limitations remain visible. Missing content is not inferred.",
              }
            : { kind: "ready" }
        }
        onCommand={dispatchCaseCommand}
        state={destination.state}
      />
    </div>
  );
}
