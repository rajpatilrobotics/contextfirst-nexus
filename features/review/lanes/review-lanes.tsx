"use client";

import { BookOpenCheck, HeartHandshake, SearchCheck } from "lucide-react";
import type { CaseCandidate, CaseState, ReviewLane } from "../../../lib/contracts";
import { selectReviewLanes } from "../../../lib/review";
import { ReviewStatusBadge, SupportStatusBadge } from "../../../components/status";
import { Alert, Skeleton } from "../../../components/ui";

const laneConfig: Record<
  ReviewLane,
  {
    label: string;
    eyebrow: string;
    boundary: string;
    icon: typeof SearchCheck;
  }
> = {
  trafficking_indicators: {
    label: "Trafficking indicators for review",
    eyebrow: "Lane A",
    boundary:
      "Indicators prompt further qualified assessment and do not determine trafficking or victim status.",
    icon: SearchCheck,
  },
  non_punishment_relevance: {
    label: "Non-punishment relevance for review",
    eyebrow: "Lane B",
    boundary:
      "This lane organizes relevance questions, not eligibility. Domestic legal verification is required.",
    icon: BookOpenCheck,
  },
  protection_remedy_urgency: {
    label: "Protection, remedy, and procedural urgency",
    eyebrow: "Lane C",
    boundary:
      "These are questions for qualified action. The workspace never contacts a court, service, police agency, or other recipient automatically.",
    icon: HeartHandshake,
  },
};

export type LanesDataState =
  | { kind: "ready" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "blocked"; message: string };

function LaneCandidate({ candidate }: { candidate: CaseCandidate }) {
  const activeDependencies = candidate.dependencies.filter((dependency) => dependency.active);
  return (
    <li>
      <article className="grid gap-3 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="cfn-type-code text-[var(--color-ink-muted)]">{candidate.id}</p>
            <h4 className="font-semibold">{candidate.title}</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <SupportStatusBadge value={candidate.supportStatus} />
            <ReviewStatusBadge value={candidate.reviewStatus} />
          </div>
        </div>
        <p className="text-sm">{candidate.currentText}</p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {activeDependencies.length} active {activeDependencies.length === 1 ? "dependency" : "dependencies"} · {candidate.unknowns.length} {candidate.unknowns.length === 1 ? "unknown" : "unknowns"}
        </p>
        <a className="font-semibold" href={`#candidate-${candidate.id}`}>
          Open canonical candidate
        </a>
      </article>
    </li>
  );
}

export function ReviewLanePanel({
  lane,
  candidates,
}: {
  lane: ReviewLane;
  candidates: CaseCandidate[];
}) {
  const config = laneConfig[lane];
  const Icon = config.icon;
  const headingId = `review-lane-${lane}-heading`;
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-[var(--color-surface-subtle)] p-4 sm:p-5"
      id={`review-lane-${lane}`}
    >
      <header className="grid gap-2">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[var(--color-brand-subtle)] p-2 text-[var(--color-brand)]">
            <Icon aria-hidden="true" size={20} />
          </span>
          <div>
            <p className="cfn-type-label text-[var(--color-ink-muted)]">{config.eyebrow}</p>
            <h3 className="cfn-type-heading-3" id={headingId}>{config.label}</h3>
          </div>
        </div>
        <p className="text-sm">{config.boundary}</p>
      </header>
      {candidates.length ? (
        <ul className="grid gap-3">
          {candidates.map((candidate) => <LaneCandidate candidate={candidate} key={candidate.id} />)}
        </ul>
      ) : (
        <Alert title="No candidates in this lane" tone="neutral">
          The active canonical run contains no candidates for this lane. No favourable or adverse conclusion is inferred.
        </Alert>
      )}
    </section>
  );
}

export function ReviewLanes({
  state,
  dataState = { kind: "ready" },
}: {
  state: CaseState;
  dataState?: LanesDataState;
}) {
  const lanes = selectReviewLanes(state.candidates);
  return (
    <section aria-labelledby="review-lanes-heading" className="grid gap-4" id="review-lanes">
      <div>
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Separate practitioner questions</p>
        <h2 className="cfn-type-heading-2" id="review-lanes-heading">Three review lanes</h2>
        <p className="max-w-3xl text-sm text-[var(--color-ink-muted)]">
          Shared evidence can appear in more than one lane, while each canonical candidate and its individual review decision remain separate.
        </p>
      </div>
      {dataState.kind === "loading" ? (
        <div className="grid gap-3"><Skeleton label="Loading review lanes" /><Skeleton label="Loading lane candidates" /></div>
      ) : dataState.kind === "error" || dataState.kind === "blocked" ? (
        <Alert title={dataState.kind === "error" ? "Review lanes unavailable" : "Review lanes blocked"} tone="danger">
          {dataState.message}
        </Alert>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <ReviewLanePanel candidates={lanes.trafficking_indicators} lane="trafficking_indicators" />
          <ReviewLanePanel candidates={lanes.non_punishment_relevance} lane="non_punishment_relevance" />
          <ReviewLanePanel candidates={lanes.protection_remedy_urgency} lane="protection_remedy_urgency" />
        </div>
      )}
      <Alert title="Cooperation-neutral analysis" tone="neutral">
        Cooperation status is preserved as an unknown procedural fact and does not change evidence, Nexus, or protection results.
      </Alert>
    </section>
  );
}
