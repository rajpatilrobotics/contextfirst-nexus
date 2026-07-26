"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  HelpCircle,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  Chip,
  LimitationNotice,
  SectionTitle,
} from "../../../components/lovable/nexus-ui";
import {
  ItemOriginStatus,
  ReviewStatusBadge,
  SupportStatusBadge,
} from "../../../components/status";
import { useCaseState } from "../../../components/shell";
import { Alert, Select } from "../../../components/ui";
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
import { DependencyChangePanel } from "../dependency";
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
  "NEXUS-RECRUITMENT": { x: 335, y: 150 },
  "NEXUS-MOVEMENT": { x: 335, y: 280 },
  "NEXUS-CONTROL": { x: 520, y: 170 },
  "NEXUS-COMPELLED-TASKS": { x: 520, y: 410 },
  "NEXUS-OFFENCE-TIMING": { x: 695, y: 290 },
  "NEXUS-URGENCY": { x: 820, y: 470 },
} satisfies Record<(typeof GoldenNexusIds)[number], { x: number; y: number }>;

const nexusSourceGroupLayout = {
  "NEXUS-RECRUITMENT": { x: 115, y: 80 },
  "NEXUS-MOVEMENT": { x: 115, y: 205 },
  "NEXUS-CONTROL": { x: 345, y: 45 },
  "NEXUS-COMPELLED-TASKS": { x: 350, y: 535 },
  "NEXUS-OFFENCE-TIMING": { x: 825, y: 145 },
  "NEXUS-URGENCY": { x: 885, y: 555 },
} satisfies Record<(typeof GoldenNexusIds)[number], { x: number; y: number }>;

const nexusCandidateLayout = [
  { x: 115, y: 335 },
  { x: 115, y: 455 },
  { x: 650, y: 65 },
  { x: 885, y: 340 },
];

const NEXUS_CATEGORY_META: Record<
  NexusRow["category"],
  { color: string; label: string; shortLabel: string }
> = {
  recruitment: {
    color: "#7d5a3c",
    label: "Recruitment",
    shortLabel: "Recruitment",
  },
  movement: {
    color: "#5c7c8a",
    label: "Movement",
    shortLabel: "Movement",
  },
  control: {
    color: "var(--rust)",
    label: "Control",
    shortLabel: "Control",
  },
  compelled_tasks: {
    color: "var(--amber)",
    label: "Compelled tasks",
    shortLabel: "Compelled",
  },
  offence_timing: {
    color: "#5c4a7c",
    label: "Offence timing",
    shortLabel: "Timing",
  },
  urgency: {
    color: "var(--sage)",
    label: "Urgency",
    shortLabel: "Urgency",
  },
};

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
  analysisHref = "/case/demo/analysis",
  documentsHref = "/case/demo/intake",
  kind,
  title,
}: {
  analysisHref?: string;
  documentsHref?: string;
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
      <h1 className="font-serif text-3xl leading-tight">{title}</h1>
      <Alert title={copy.heading} tone={copy.tone}>
        {copy.body}
      </Alert>
      <div className="flex flex-wrap gap-2">
        <a className="min-h-9 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 text-sm font-semibold" href={documentsHref}>
          Open Documents
        </a>
        <a className="min-h-9 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 text-sm font-semibold" href={analysisHref}>
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

export function EvidenceGapsWorkspace({
  analysisHref = "/case/demo/analysis",
  documentsHref = "/case/demo/intake",
  interviewHref = "/case/demo/interview",
  owner = "M. Chen",
  taskHref = "/case/demo/tasks",
}: {
  analysisHref?: string;
  documentsHref?: string;
  interviewHref?: string | null;
  owner?: string;
  taskHref?: string | null;
} = {}) {
  const { state, dispatchCaseCommand } = useCaseState();
  const destination = deriveReviewDestinationState(state);
  const [filter, setFilter] = useState<GapFilter>("all");
  const [query, setQuery] = useState("");
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const [sourceSelection, setSourceSelection] = useState<SourceSelection | null>(null);
  const sourceMode = useSourceMode();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const gaps = useMemo(
    () =>
      destination.kind === "ready"
        ? selectContextGaps(destination.state.candidates)
        : [],
    [destination.kind, state.activeAnalysisRunId, state.candidates],
  );

  useEffect(() => {
    function openGapFromHash() {
      if (typeof window === "undefined") return;
      const match = /^#candidate-(.+)$/.exec(window.location.hash);
      if (!match) return;
      const candidateId = decodeURIComponent(match[1]);
      if (!gaps.some((gap) => gap.id === candidateId)) return;
      setFilter("all");
      setQuery("");
      setRequestedId(candidateId);
      window.requestAnimationFrame(() => {
        const target = document.getElementById(`candidate-${candidateId}`);
        if (typeof target?.scrollIntoView === "function") {
          target.scrollIntoView({ block: "nearest" });
        }
      });
    }
    openGapFromHash();
    window.addEventListener("hashchange", openGapFromHash);
    return () => window.removeEventListener("hashchange", openGapFromHash);
  }, [gaps]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    workspace.inert = Boolean(sourceSelection && sourceMode === "mobile");
    return () => {
      workspace.inert = false;
    };
  }, [sourceMode, sourceSelection]);

  if (destination.kind !== "ready") {
    return (
      <DestinationBoundary
        analysisHref={analysisHref}
        documentsHref={documentsHref}
        kind={destination.kind}
        title="Evidence Gaps"
      />
    );
  }

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
  const preservedCount = gaps.filter(
    (gap) => gap.responseStatus === "preserved_unknown",
  ).length;
  const reviewNeededCount = gaps.filter(requiresGapReview).length;

  return (
    <div className={sourceMode === "desktop" && sourceSelection ? "flex items-start" : "relative"}>
      <div className="min-w-0 flex-1 space-y-3" ref={workspaceRef}>
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Stage 3 · Analysis
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-xl leading-tight text-foreground sm:text-2xl">
                Evidence Gaps
              </h1>
              <Chip tone="amber">
                <AlertTriangle aria-hidden="true" className="h-3 w-3" />
                {countFor("unanswered")} unresolved
              </Chip>
            </div>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">
              Turn missing, conflicting, weak, or unprocessed evidence into an
              accountable next-action plan.
            </p>
          </div>
        </header>

        <div className="flex items-start gap-2 rounded-md border border-[color-mix(in_oklab,var(--amber)_35%,transparent)] bg-[color-mix(in_oklab,var(--amber)_8%,transparent)] px-3 py-2 text-xs sm:text-sm">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--amber)]"
          />
          <div>
            <span className="font-medium">A gap is not proof</span>. Missing or
            unreadable information is not evidence that an event did not occur.
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {[
            {
              icon: <Activity aria-hidden="true" className="h-3.5 w-3.5 text-[color:var(--amber)]" />,
              label: "Open / active",
              value: countFor("unanswered"),
              hint: `${countFor("answered")} answered`,
            },
            {
              icon: <HelpCircle aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />,
              label: "Preserved unknown",
              value: preservedCount,
              hint: "Documented, not inferred",
            },
            {
              icon: <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5 text-[color:var(--rust)]" />,
              label: "Review needed",
              value: reviewNeededCount,
              hint: "Individual decisions",
            },
          ].map((metric) => (
            <div
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
              key={metric.label}
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted">
                {metric.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {metric.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-lg leading-none text-foreground">
                    {metric.value}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {metric.hint}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <section aria-label="Evidence gap filters" className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
          <div className="flex flex-1 flex-wrap items-center gap-1" role="group" aria-label="Gap filters">
            {(["all", "unanswered", "answered", "deferred", "review_required"] as const).map((value) => (
              <button
                aria-pressed={filter === value}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  filter === value
                    ? "border-primary bg-primary font-medium text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
                key={value}
                onClick={() => setFilter(value)}
                type="button"
              >
                <span>{value.replaceAll("_", " ")}</span>
                <span
                  className={`rounded-full px-1.5 py-[1px] font-mono text-[10px] ${
                    filter === value
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {countFor(value)}
                </span>
              </button>
            ))}
          </div>
          <label className="relative min-w-[180px] flex-1 lg:max-w-[280px]">
            <span className="sr-only">Search evidence gaps</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions, IDs, and wording"
              type="search"
              value={query}
            />
          </label>
        </section>

        {!gaps.length ? (
          <Alert title="No canonical context-gap candidates" tone="neutral">
            <span>
              The successful active run produced zero context gaps. This is not
              a claim that the packet is complete.{" "}
              <a className="font-semibold underline" href={analysisHref}>
                Review or rerun Structured Analysis.
              </a>
            </span>
          </Alert>
        ) : (
          <div className="grid min-w-0 gap-3 lg:grid-cols-[380px_1fr]">
            <nav aria-label="Evidence gap candidates" className="min-w-0">
              {visible.length ? (
                <ul className="space-y-2">
                  {visible.map((gap) => (
                    <li key={gap.id}>
                      <button
                        aria-current={selected?.id === gap.id ? "true" : undefined}
                        className={`block w-full rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          selected?.id === gap.id
                            ? "border-[color:var(--amber)] bg-card shadow-[inset_0_0_0_1px_var(--amber)]"
                            : "border-border bg-card hover:bg-muted/40"
                        }`}
                        onClick={() => setRequestedId(gap.id)}
                        type="button"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {gap.id} · {gap.responseStatus.replaceAll("_", " ")}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-sm font-medium">{gap.reviewQuestion}</span>
                        <span className="mt-1.5 flex flex-wrap gap-1">
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
                interviewHref={interviewHref}
                onCommand={dispatchCaseCommand}
                onOpenSource={setSourceSelection}
                owner={owner}
                state={destination.state}
                taskHref={taskHref}
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
  const duplicate = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
  if (duplicate.length) return `Duplicate: ${duplicate.join(", ")}`;

  const usesGoldenContract = rows.some((row) =>
    GoldenNexusIds.includes(row.id as (typeof GoldenNexusIds)[number]),
  );
  if (!usesGoldenContract) return null;

  const missing = GoldenNexusIds.filter((id) => !counts.has(id));
  const unexpected = rows
    .map((row) => row.id)
    .filter((id) => !GoldenNexusIds.includes(id as (typeof GoldenNexusIds)[number]));

  if (!missing.length && !duplicate.length && !unexpected.length && rows.length === GoldenNexusIds.length) {
    return null;
  }

  return [
    missing.length ? `Missing: ${missing.join(", ")}` : null,
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

function NexusVisualMap({
  rows,
  state,
  selectedId,
  onSelect,
  view,
}: {
  rows: NexusRow[];
  state: CaseState;
  selectedId: string | null;
  onSelect: (candidateId: string) => void;
  view: "graph" | "table";
}) {
  const usesGoldenLayout = rows.every((row) =>
    GoldenNexusIds.includes(row.id as (typeof GoldenNexusIds)[number]),
  );
  const genericX = (index: number, count: number) =>
    count <= 1 ? 500 : 130 + (740 * index) / (count - 1);
  const nexusPositions = new Map(
    rows.map((row, index) => [
      row.id,
      usesGoldenLayout
        ? nexusMapLayout[row.id as keyof typeof nexusMapLayout]
        : { x: genericX(index, rows.length), y: 300 },
    ]),
  );
  const visibleIds = new Set(rows.map((row) => row.id));
  const hubId =
    rows.reduce<NexusRow | null>((best, row) => {
      if (!best) return row;
      const rowLinks = row.dependencies.filter(
        (dependency) => dependency.kind === "nexus",
      ).length;
      const bestLinks = best.dependencies.filter(
        (dependency) => dependency.kind === "nexus",
      ).length;
      return rowLinks > bestLinks ? row : best;
    }, null)?.id ?? null;
  const sourceGroups = rows.flatMap((row) => {
    const dependencies = row.dependencies.filter(
      (
        dependency,
      ): dependency is Extract<EvidenceDependency, { kind: "source" }> =>
        dependency.kind === "source",
    );
    if (!dependencies.length) return [];
    return [
      {
        id: `source-group:${row.id}`,
        rowId: row.id,
        dependencies,
        position: usesGoldenLayout
          ? nexusSourceGroupLayout[
              row.id as keyof typeof nexusSourceGroupLayout
            ]
          : {
              x: nexusPositions.get(row.id)?.x ?? 500,
              y: 105,
            },
      },
    ];
  });
  const candidateIds = [
    ...new Set(
      rows.flatMap((row) =>
        row.dependencies.flatMap((dependency) =>
          dependency.kind === "candidate" ? [dependency.candidateId] : [],
        ),
      ),
    ),
  ];
  const candidateNodes = candidateIds.map((candidateId, index) => {
    const candidate = state.candidates.find((item) => item.id === candidateId);
    return {
      id: candidateId,
      label: candidate?.title ?? candidateId,
      position: usesGoldenLayout
        ? nexusCandidateLayout[index] ?? {
            x: 115 + (index % 2) * 770,
            y: 335 + Math.floor(index / 2) * 90,
          }
        : {
            x: genericX(index, candidateIds.length),
            y: 510,
          },
      active: rows.some((row) =>
        row.dependencies.some(
          (dependency) =>
            dependency.kind === "candidate" &&
            dependency.candidateId === candidateId &&
            dependency.active,
        ),
      ),
    };
  });
  const graphNodes = [
    ...rows.map((row) => ({
      id: row.id,
      kind: "nexus" as const,
      kicker: row.id.replace("NEXUS-", ""),
      label: row.title,
      position: nexusPositions.get(row.id) ?? { x: 500, y: 300 },
      color: NEXUS_CATEGORY_META[row.category].color,
      active: nexusNodeState(row) === "active",
      row,
    })),
    ...sourceGroups.map((group) => {
      const activeCount = group.dependencies.filter(
        (dependency) => dependency.active,
      ).length;
      return {
        id: group.id,
        kind: "source" as const,
        kicker: "SOURCE SET",
        label: `${activeCount} active · ${group.dependencies.length - activeCount} inactive`,
        position: group.position,
        color: "#5c7c8a",
        active: activeCount > 0,
        row: null,
      };
    }),
    ...candidateNodes.map((candidate) => ({
      ...candidate,
      kind: "candidate" as const,
      kicker: candidate.id,
      color: "var(--rust)",
      row: null,
    })),
  ];
  const graphEdges = [
    ...sourceGroups.map((group) => {
      const activeDependencies = group.dependencies.filter(
        (dependency) => dependency.active,
      );
      const relationship =
        group.dependencies.find(
          (dependency) => dependency.relationship === "contradicts",
        )?.relationship ??
        group.dependencies.find(
          (dependency) => dependency.relationship === "limits",
        )?.relationship ??
        group.dependencies[0].relationship;
      return {
        id: `${group.id}:edge`,
        from: group.id,
        to: group.rowId,
        relationship,
        active: activeDependencies.length > 0,
        partiallyInactive:
          activeDependencies.length > 0 &&
          activeDependencies.length < group.dependencies.length,
      };
    }),
    ...rows.flatMap((row) =>
      row.dependencies.flatMap((dependency) => {
        if (
          dependency.kind === "nexus" &&
          visibleIds.has(dependency.nexusCandidateId)
        ) {
          return [
            {
              id: dependency.id,
              from: dependency.nexusCandidateId,
              to: row.id,
              relationship: dependency.relationship,
              active: dependency.active,
              partiallyInactive: false,
            },
          ];
        }
        if (dependency.kind === "candidate") {
          return [
            {
              id: dependency.id,
              from: dependency.candidateId,
              to: row.id,
              relationship: dependency.relationship,
              active: dependency.active,
              partiallyInactive: false,
            },
          ];
        }
        return [];
      }),
    ),
  ];
  const graphNodeById = new Map(graphNodes.map((node) => [node.id, node]));
  const connectedIds = new Set(
    graphEdges
      .filter((edge) => edge.from === selectedId || edge.to === selectedId)
      .flatMap((edge) => [edge.from, edge.to]),
  );

  return (
    <section
      aria-labelledby="evidence-map-visual-heading"
      className="min-w-0 rounded-xl border border-border bg-card p-3"
    >
      <h2 className="sr-only" id="evidence-map-visual-heading">
        Canonical relationship map
      </h2>

      {rows.length ? (
        view === "graph" ? (
          <div className="overflow-x-auto">
            <svg
              aria-labelledby="evidence-map-svg-title evidence-map-svg-desc"
              className="h-[560px] min-w-[760px] w-full"
              role="img"
              viewBox="0 0 1000 600"
            >
              <title id="evidence-map-svg-title">
                Evidence Integrity Nexus map
              </title>
              <desc id="evidence-map-svg-desc">
                Canonical Nexus candidates, grouped source dependencies, and
                candidate dependencies from the current fresh analysis run.
                Inactive relationships remain visible.
              </desc>
              <defs>
                <marker
                  id="nexus-map-arrow"
                  markerHeight="5"
                  markerWidth="5"
                  orient="auto-start-reverse"
                  refX="10"
                  refY="5"
                  viewBox="0 0 10 10"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--slate-ink)" />
                </marker>
                <marker
                  id="nexus-map-arrow-rust"
                  markerHeight="5"
                  markerWidth="5"
                  orient="auto-start-reverse"
                  refX="10"
                  refY="5"
                  viewBox="0 0 10 10"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--rust)" />
                </marker>
              </defs>
              {graphEdges.map((edge) => {
                const from = graphNodeById.get(edge.from);
                const to = graphNodeById.get(edge.to);
                if (!from || !to) return null;
                const connected =
                  selectedId === edge.from || selectedId === edge.to;
                const adverse =
                  edge.relationship === "contradicts" || !edge.active;
                const limited =
                  edge.relationship === "limits" ||
                  edge.relationship === "context_only" ||
                  edge.partiallyInactive;
                const stroke = adverse
                  ? "var(--rust)"
                  : limited
                    ? "var(--amber)"
                    : "var(--slate-ink)";
                return (
                  <line
                    key={edge.id}
                    markerEnd={
                      adverse
                        ? "url(#nexus-map-arrow-rust)"
                        : "url(#nexus-map-arrow)"
                    }
                    opacity={selectedId && !connected ? 0.12 : 0.82}
                    stroke={stroke}
                    strokeDasharray={
                      !edge.active
                        ? "6 5"
                        : edge.relationship === "contradicts"
                          ? "2 4"
                          : limited
                            ? "4 3"
                            : undefined
                    }
                    strokeWidth={connected ? 2.4 : 1.2}
                    vectorEffect="non-scaling-stroke"
                    x1={from.position.x}
                    x2={to.position.x}
                    y1={from.position.y}
                    y2={to.position.y}
                  />
                );
              })}
              {graphNodes.map((node) => {
                const selected = node.id === selectedId;
                const dimmed =
                  Boolean(selectedId) &&
                  !selected &&
                  !connectedIds.has(node.id);
                const isHub = node.kind === "nexus" && node.id === hubId;
                const nodeState =
                  node.kind === "nexus" && node.row
                    ? nexusNodeState(node.row)
                    : node.active
                      ? "active"
                      : "invalidated";
                const interactive = node.kind === "nexus" && Boolean(node.row);
                const label =
                  node.label.length > 28
                    ? `${node.label.slice(0, 27)}…`
                    : node.label;
                return (
                  <g
                    aria-label={
                      interactive && node.row
                        ? `Select Nexus node ${node.row.id}: ${node.row.title}. ${nexusNodeStateLabel(node.row)}.`
                        : `${node.kicker}: ${node.label}`
                    }
                    aria-pressed={interactive ? selected : undefined}
                    className={
                      interactive
                        ? "cursor-pointer outline-none focus-visible:[&_rect]:stroke-[color:var(--amber)]"
                        : undefined
                    }
                    key={node.id}
                    id={interactive ? `candidate-${node.id}` : undefined}
                    onClick={
                      interactive ? () => onSelect(node.id) : undefined
                    }
                    onKeyDown={
                      interactive
                        ? (event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();
                              onSelect(node.id);
                            }
                          }
                        : undefined
                    }
                    opacity={dimmed ? 0.22 : node.kind === "source" ? 0.78 : 1}
                    role={interactive ? "button" : "img"}
                    tabIndex={interactive ? 0 : undefined}
                    transform={`translate(${node.position.x},${node.position.y})`}
                  >
                    <title>{`${node.kicker}: ${node.label}`}</title>
                    <rect
                      fill={
                        selected
                          ? "var(--paper)"
                          : nodeState === "active"
                            ? "var(--paper)"
                            : "var(--color-danger-subtle)"
                      }
                      height="44"
                      rx={isHub ? 22 : 8}
                      stroke={
                        selected
                          ? "var(--amber)"
                          : nodeState === "active"
                            ? node.color
                            : "var(--rust)"
                      }
                      strokeDasharray={
                        nodeState === "active" ? undefined : "7 4"
                      }
                      strokeWidth={selected ? 2.5 : isHub ? 2 : 1.4}
                      vectorEffect="non-scaling-stroke"
                      width="160"
                      x="-80"
                      y="-22"
                    />
                    <circle cx="-64" cy="0" fill={node.color} r="4" />
                    <text
                      className="font-mono"
                      fill="var(--muted-foreground)"
                      fontSize="8"
                      x="-54"
                      y="-4"
                    >
                      {node.kicker.length > 20
                        ? `${node.kicker.slice(0, 19)}…`
                        : node.kicker}
                    </text>
                    <text
                      fill="var(--ink)"
                      fontFamily="Libre Baskerville, serif"
                      fontSize="10.5"
                      x="-54"
                      y="9"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="max-h-[560px] overflow-auto">
            <table
              aria-label="Evidence map accessible relationships"
              className="w-full text-xs"
            >
              <thead className="sticky top-0 bg-card text-left font-mono uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="p-2">Node</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Relationships</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className="border-t border-border/60 align-top" key={row.id}>
                    <td className="p-2">
                      <button
                        className="font-medium underline decoration-dotted underline-offset-2"
                        onClick={() => onSelect(row.id)}
                        type="button"
                      >
                        {row.title}
                      </button>
                      <div className="text-[10px] text-muted-foreground">
                        {row.id} · {nexusNodeStateLabel(row)}
                      </div>
                    </td>
                    <td className="p-2 capitalize">{readable(row.category)}</td>
                    <td className="p-2">
                      <ul className="space-y-0.5">
                        {row.dependencies.map((dependency) => (
                          <li key={dependency.id}>
                            {readable(dependency.relationship)} →{" "}
                            <span className="italic">
                              {dependencyTarget(dependency)}
                            </span>{" "}
                            ({dependency.active ? "active" : "inactive"})
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <Alert title="No visible map nodes" tone="neutral">
          Change the filters to show canonical relationship nodes.
        </Alert>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[11px]">
        <div className="flex flex-wrap gap-3">
          <span>Solid · supports</span>
          <span>Dashed · limits or inactive</span>
          <span className="text-[color:var(--rust)]">Rust · conflict or invalidated</span>
        </div>
        <p className="text-muted-foreground">
          Selecting a node highlights its connected relationships.
        </p>
      </div>

      <details className="sr-only">
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
  onClear,
  onSelect,
  onWithdrawRequest,
}: {
  selected: NexusRow;
  state: CaseState;
  onOpenSource: (selection: SourceSelection) => void;
  onCommand: ReturnType<typeof useCaseState>["dispatchCaseCommand"];
  onClear: () => void;
  onSelect: (candidateId: string) => void;
  onWithdrawRequest: (candidate: NexusRow) => void;
}) {
  const sourceDependencies = selected.dependencies.filter(
    (
      dependency,
    ): dependency is Extract<EvidenceDependency, { kind: "source" }> =>
      dependency.kind === "source",
  );
  return (
    <article
      aria-label={`Evidence map detail: ${selected.id}`}
      className="min-w-0 rounded-xl border border-border bg-card p-4"
    >
      <header className="grid gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] text-muted-foreground">
              {selected.id} · {readable(selected.category)}
            </p>
            <h2 className="mt-0.5 font-serif text-lg">{selected.title}</h2>
          </div>
          <button
            aria-label="Close node detail"
            className="rounded-md border border-border p-1 text-muted-foreground hover:bg-muted"
            onClick={onClear}
            type="button"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ItemOriginStatus value={selected.itemOrigin} />
          <SupportStatusBadge value={selected.supportStatus} />
          <ReviewStatusBadge value={selected.reviewStatus} />
          <Chip
            className="border-dashed"
            tone={selected.inclusionStatus === "active" ? "sage" : "rust"}
          >
            Inclusion: {readable(selected.inclusionStatus)}
          </Chip>
        </div>
        <p className="text-sm">{selected.currentText}</p>
      </header>

      <div className="mt-3 grid gap-3">
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Citations
          </h3>
          {sourceDependencies.length ? (
            <ul className="mt-1 grid gap-1.5">
              {sourceDependencies.map((dependency) => (
                <li key={dependency.id}>
                  <CitationLink
                    candidateId={selected.id}
                    citationId={dependency.citationId}
                    onOpen={onOpenSource}
                    state={state}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              No source citation is attached to this relationship.
            </p>
          )}
        </section>

        <LimitationNotice
          items={
            selected.unknowns.length
              ? selected.unknowns
              : [
                  "No separate unknown is recorded beyond source and dependency limits.",
                ]
          }
        />

        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Relationships
          </h3>
          <ul className="mt-1 space-y-1 text-xs">
            {selected.dependencies.map((dependency) => {
              const target = dependencyTarget(dependency);
              const targetCandidate =
                dependency.kind === "source"
                  ? null
                  : state.candidates.find((candidate) => candidate.id === target);
              const tone =
                !dependency.active ||
                dependency.relationship === "contradicts"
                  ? "rust"
                  : dependency.relationship === "limits" ||
                      dependency.relationship === "context_only"
                    ? "amber"
                    : "mute";
              return (
                <li
                  className="flex flex-wrap items-center gap-1.5"
                  key={dependency.id}
                >
                  <Chip tone={tone}>
                    {readable(dependency.relationship)}
                    {!dependency.active ? " · inactive" : ""}
                  </Chip>
                  {dependency.kind === "nexus" ? (
                    <button
                      className="underline decoration-dotted underline-offset-2"
                      onClick={() => onSelect(dependency.nexusCandidateId)}
                      type="button"
                    >
                      {targetCandidate?.title ?? target}
                    </button>
                  ) : (
                    <span>{targetCandidate?.title ?? target}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="mt-3 grid gap-2 border-t border-border pt-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Practitioner actions
        </h3>
        <CandidateReviewActions
          allowWithdrawal
          candidate={selected}
          compact
          onCommand={onCommand}
          onWithdrawRequest={(candidate) =>
            onWithdrawRequest(candidate as NexusRow)
          }
          state={state}
        />
      </section>
    </article>
  );
}

export function EvidenceIntegrityWorkspace({
  analysisHref = "/case/demo/analysis",
  documentsHref = "/case/demo/intake",
}: {
  analysisHref?: string;
  documentsHref?: string;
} = {}) {
  const { state, dispatchCaseCommand } = useCaseState();
  const destination = deriveReviewDestinationState(state);
  const [category, setCategory] = useState<NexusFilter>("all");
  const [support, setSupport] = useState<"all" | SupportStatus>("all");
  const [query, setQuery] = useState("");
  const [requestedId, setRequestedId] = useState<string | null>(null);
  const [view, setView] = useState<"graph" | "table">("graph");
  const [withdrawalCandidateId, setWithdrawalCandidateId] = useState<
    string | null
  >(null);
  const [sourceSelection, setSourceSelection] = useState<SourceSelection | null>(null);
  const sourceMode = useSourceMode();
  const rows = useMemo(
    () => (destination.kind === "ready" ? currentRunNexusRows(state) : []),
    [destination.kind, state.activeAnalysisRunId, state.candidates],
  );

  useEffect(() => {
    function openNodeFromHash() {
      if (typeof window === "undefined") return;
      const match = /^#candidate-(.+)$/.exec(window.location.hash);
      if (!match) return;
      const candidateId = decodeURIComponent(match[1]);
      if (!rows.some((row) => row.id === candidateId)) return;
      setCategory("all");
      setSupport("all");
      setQuery("");
      setRequestedId(candidateId);
      window.requestAnimationFrame(() => {
        document.getElementById(`candidate-${candidateId}`)?.scrollIntoView({
          block: "nearest",
        });
      });
    }
    openNodeFromHash();
    window.addEventListener("hashchange", openNodeFromHash);
    return () => window.removeEventListener("hashchange", openNodeFromHash);
  }, [rows]);

  if (destination.kind !== "ready") {
    return (
      <DestinationBoundary
        analysisHref={analysisHref}
        documentsHref={documentsHref}
        kind={destination.kind}
        title="Evidence Integrity Map"
      />
    );
  }

  const contractError = nexusContractError(rows);
  const visible = rows.filter((row) => {
    if (category !== "all" && row.category !== category) return false;
    if (support !== "all" && row.supportStatus !== support) return false;
    return !query || `${row.id} ${row.title} ${row.currentText} ${row.relationshipSummary}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });
  const defaultSelected = visible.reduce<NexusRow | null>((best, row) => {
    if (!best) return row;
    const rowLinks = row.dependencies.filter(
      (dependency) => dependency.kind === "nexus",
    ).length;
    const bestLinks = best.dependencies.filter(
      (dependency) => dependency.kind === "nexus",
    ).length;
    return rowLinks > bestLinks ? row : best;
  }, null);
  const selected =
    requestedId === ""
      ? null
      : visible.find((row) => row.id === requestedId) ?? defaultSelected;
  const categories = [...new Set(rows.map((row) => row.category))];
  const supportStatuses = [...new Set(rows.map((row) => row.supportStatus))].sort();
  const withdrawalCandidate = withdrawalCandidateId
    ? rows.find((row) => row.id === withdrawalCandidateId) ?? null
    : null;

  return (
    <div className={sourceMode === "desktop" && sourceSelection ? "flex items-start" : "relative"}>
      <div className="min-w-0 flex-1 space-y-6">
        <SectionTitle
          description="Relationships among evidence, with citations, limitations, and human-review states preserved."
          eyebrow="Stage 5 · Review · Hero screen"
          title="Evidence Integrity Map"
        />

        <div className="rounded-md border border-[color-mix(in_oklab,var(--rust)_35%,transparent)] bg-[color-mix(in_oklab,var(--rust)_6%,transparent)] px-3 py-2 text-xs">
          <span className="font-medium">Relationship map only.</span> This view
          is not a trafficking determination, criminal-liability decision,
          legal opinion, or automated score.
        </div>

        <section
          aria-label="Evidence map filters"
          className="flex flex-nowrap items-center gap-2 overflow-x-auto"
        >
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              View
            </span>
            <div className="flex overflow-hidden rounded-md border border-border">
              <button
                className={`px-3 py-1 text-xs ${view === "graph" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                onClick={() => setView("graph")}
                type="button"
              >
                Graph
              </button>
              <button
                className={`px-3 py-1 text-xs ${view === "table" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                onClick={() => setView("table")}
                type="button"
              >
                Accessible table
              </button>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 flex-nowrap items-center justify-end gap-1">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Filter
            </span>
            <button
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${category === "all" ? "bg-card" : "opacity-40"}`}
              onClick={() => setCategory("all")}
              type="button"
            >
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full bg-[color:var(--ink)]"
              />
              All
            </button>
            {categories.map((value) => (
              <button
                aria-label={`Filter category: ${NEXUS_CATEGORY_META[value].label}`}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${category === value ? "bg-card" : "opacity-40"}`}
                key={value}
                onClick={() => setCategory(value)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: NEXUS_CATEGORY_META[value].color }}
                />
                {NEXUS_CATEGORY_META[value].shortLabel}
              </button>
            ))}
          </div>
          <label className="flex shrink-0 items-center gap-1 text-xs">
            <span className="sr-only">Support filter</span>
            <Select
              aria-label="Support filter"
              className="!h-8 !min-h-0 w-[7.25rem] !py-0 text-xs"
              onChange={(event) =>
                setSupport(event.target.value as typeof support)
              }
              value={support}
            >
              <option value="all">All support</option>
              {supportStatuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </Select>
          </label>
          <label className="relative w-28 shrink-0">
            <span className="sr-only">Search evidence map</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-xs"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              type="search"
              value={query}
            />
          </label>
        </section>

        {!rows.length ? (
          <Alert title="No canonical nexus candidates" tone="neutral">
            The successful active run produced zero nexus relationships. No conclusion is inferred.
          </Alert>
        ) : contractError ? (
          <Alert title="Nexus contract mismatch" tone="danger">
            The active canonical run contains malformed relationship records. {contractError}. The interface will not fabricate or deduplicate nodes.
          </Alert>
        ) : (
          <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_360px]">
            <NexusVisualMap
              onSelect={setRequestedId}
              rows={visible}
              selectedId={selected?.id ?? null}
              state={state}
              view={view}
            />
            {selected ? (
              <NexusMapDetail
                onCommand={dispatchCaseCommand}
                onClear={() => setRequestedId("")}
                onOpenSource={setSourceSelection}
                onSelect={setRequestedId}
                onWithdrawRequest={(candidate) =>
                  setWithdrawalCandidateId(candidate.id)
                }
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
        {withdrawalCandidate ? (
          <DependencyChangePanel
            candidateToWithdraw={withdrawalCandidate}
            onCancelWithdrawal={() => setWithdrawalCandidateId(null)}
            onCommand={dispatchCaseCommand}
            state={state}
          />
        ) : null}
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

export function TimelineWorkspace({
  analysisHref = "/case/demo/analysis",
  documentsHref = "/case/demo/intake",
}: {
  analysisHref?: string;
  documentsHref?: string;
} = {}) {
  const { state, dispatchCaseCommand } = useCaseState();
  const destination = deriveReviewDestinationState(state);

  if (destination.kind !== "ready") {
    return (
      <DestinationBoundary
        analysisHref={analysisHref}
        documentsHref={documentsHref}
        kind={destination.kind}
        title="Timeline"
      />
    );
  }

  const hasCoverageWarning = destination.state.coverage.issues.some(
    (issue) => issue.resolutionStatus === "open",
  );
  return (
    <div className="space-y-6">
      <SectionTitle
        description="Chronology reconstruction that preserves approximate, range, conflicting, and unknown dates."
        eyebrow="Stage 5 · Review"
        title="Timeline"
      />
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
