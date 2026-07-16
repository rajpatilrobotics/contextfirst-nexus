import {
  CaseStatusSchema,
  EvidenceNatureSchema,
  ItemOriginSchema,
  ReviewStatusSchema,
  StageStatusSchema,
  SupportStatusSchema,
  type CaseStatus,
  type EvidenceNature,
  type ItemOrigin,
  type ReviewStatus,
  type StageStatus,
  type SupportStatus,
} from "../../lib/contracts";

export type PresentationTone =
  | "neutral"
  | "brand"
  | "supported"
  | "warning"
  | "conflict"
  | "danger";

export type PresentationIcon =
  | "alert-triangle"
  | "ban"
  | "check"
  | "circle-dot"
  | "clock"
  | "file-check"
  | "file-question"
  | "link-check"
  | "link-off"
  | "minus-circle"
  | "pen"
  | "quote"
  | "refresh"
  | "scissors"
  | "sparkle"
  | "user-pen"
  | "x";

export type PresentationPattern = "solid" | "dashed";

export type StatusPresentation = {
  label: string;
  description: string;
  tone: PresentationTone;
  icon: PresentationIcon;
  pattern: PresentationPattern;
};

const documented = {
  label: "Documented in source",
  description: "Dependency-level source nature; not a truth ranking.",
  tone: "neutral",
  icon: "file-check",
  pattern: "solid",
} as const satisfies StatusPresentation;

export const evidenceNaturePresentation = {
  documented_in_source: documented,
  reported_or_alleged_in_source: {
    label: "Reported or alleged in source",
    description: "Dependency-level reported or alleged account.",
    tone: "neutral",
    icon: "quote",
    pattern: "solid",
  },
  reviewer_supplied_context: {
    label: "Reviewer-supplied context",
    description: "Context entered by a qualified reviewer.",
    tone: "neutral",
    icon: "user-pen",
    pattern: "solid",
  },
  unknown: {
    label: "Unknown",
    description: "The evidence nature is not established.",
    tone: "neutral",
    icon: "file-question",
    pattern: "dashed",
  },
} satisfies Record<EvidenceNature, StatusPresentation>;

export const itemOriginPresentation = {
  source_extraction: {
    label: "Source extraction",
    description: "Originated from processed source text.",
    tone: "neutral",
    icon: "scissors",
    pattern: "solid",
  },
  ai_suggestion: {
    label: "AI suggestion",
    description: "AI provenance only; not a reliability judgment.",
    tone: "brand",
    icon: "sparkle",
    pattern: "solid",
  },
  human_created: {
    label: "Human-created",
    description: "Created by a practitioner or fixture reviewer.",
    tone: "neutral",
    icon: "user-pen",
    pattern: "solid",
  },
} satisfies Record<ItemOrigin, StatusPresentation>;

export const supportStatusPresentation = {
  exact_source_supported: {
    label: "Exact-source supported",
    description: "Supported by an exact source citation.",
    tone: "supported",
    icon: "link-check",
    pattern: "solid",
  },
  partially_supported: {
    label: "Partially supported",
    description: "Some support exists, but review limits remain.",
    tone: "warning",
    icon: "circle-dot",
    pattern: "solid",
  },
  conflicting: {
    label: "Conflicting",
    description: "Sources conflict or need reconciliation.",
    tone: "conflict",
    icon: "refresh",
    pattern: "solid",
  },
  insufficient_evidence: {
    label: "Insufficient evidence",
    description: "Cannot support a positive finding.",
    tone: "neutral",
    icon: "circle-dot",
    pattern: "dashed",
  },
  citation_unresolved: {
    label: "Citation unresolved",
    description: "Citation must be resolved before positive acceptance.",
    tone: "danger",
    icon: "link-off",
    pattern: "solid",
  },
  not_processed: {
    label: "Not processed",
    description: "Processing has not produced this support result.",
    tone: "neutral",
    icon: "minus-circle",
    pattern: "dashed",
  },
} satisfies Record<SupportStatus, StatusPresentation>;

export const reviewStatusPresentation = {
  pending: {
    label: "Pending",
    description: "Awaiting individual practitioner review.",
    tone: "warning",
    icon: "clock",
    pattern: "solid",
  },
  human_accepted: {
    label: "Human accepted",
    description: "Accepted by a human reviewer.",
    tone: "supported",
    icon: "check",
    pattern: "solid",
  },
  human_edited: {
    label: "Human edited",
    description: "Edited and accepted by a human reviewer.",
    tone: "supported",
    icon: "pen",
    pattern: "solid",
  },
  rejected: {
    label: "Rejected",
    description: "Rejected by a human reviewer.",
    tone: "neutral",
    icon: "x",
    pattern: "solid",
  },
  uncertain: {
    label: "Uncertain",
    description: "Preserved as uncertain rather than resolved.",
    tone: "neutral",
    icon: "file-question",
    pattern: "dashed",
  },
  invalidated: {
    label: "Invalidated",
    description: "Invalidated by a dependency or review change.",
    tone: "danger",
    icon: "alert-triangle",
    pattern: "solid",
  },
} satisfies Record<ReviewStatus, StatusPresentation>;

export const caseStatusPresentation = {
  draft: {
    label: "Draft",
    description: "Purpose or source processing has not started.",
    tone: "neutral",
    icon: "file-question",
    pattern: "dashed",
  },
  processing: {
    label: "Processing",
    description: "Processing is in progress.",
    tone: "brand",
    icon: "clock",
    pattern: "solid",
  },
  review_required: {
    label: "Review required",
    description: "Human review is required before export.",
    tone: "warning",
    icon: "alert-triangle",
    pattern: "solid",
  },
  blocked: {
    label: "Blocked",
    description: "A blocking reason must be resolved.",
    tone: "danger",
    icon: "ban",
    pattern: "solid",
  },
  ready_to_export: {
    label: "Ready to export",
    description: "Reviewed state currently satisfies export checks.",
    tone: "supported",
    icon: "check",
    pattern: "solid",
  },
  exported: {
    label: "Exported",
    description: "A reviewed export was generated.",
    tone: "supported",
    icon: "file-check",
    pattern: "solid",
  },
  processing_failed: {
    label: "Processing failed",
    description: "Processing failed; this is distinct from Blocked.",
    tone: "danger",
    icon: "alert-triangle",
    pattern: "dashed",
  },
} satisfies Record<CaseStatus, StatusPresentation>;

export const navigationProgressPresentation = {
  pending: {
    label: "Not started",
    description: "This step has not started.",
    tone: "neutral",
    icon: "minus-circle",
    pattern: "dashed",
  },
  active: {
    label: "In progress",
    description: "This step is in progress.",
    tone: "brand",
    icon: "clock",
    pattern: "solid",
  },
  completed: {
    label: "Complete",
    description: "This step is complete.",
    tone: "supported",
    icon: "check",
    pattern: "solid",
  },
  warning: {
    label: "Needs review",
    description: "This step needs review.",
    tone: "warning",
    icon: "alert-triangle",
    pattern: "solid",
  },
  failed: {
    label: "Blocked",
    description: "This step is blocked or failed.",
    tone: "danger",
    icon: "ban",
    pattern: "solid",
  },
} satisfies Record<StageStatus, StatusPresentation>;

export function assertPresentationCoverage() {
  return {
    evidenceNature: EvidenceNatureSchema.options.every(
      (value) => value in evidenceNaturePresentation,
    ),
    itemOrigin: ItemOriginSchema.options.every((value) => value in itemOriginPresentation),
    supportStatus: SupportStatusSchema.options.every(
      (value) => value in supportStatusPresentation,
    ),
    reviewStatus: ReviewStatusSchema.options.every((value) => value in reviewStatusPresentation),
    caseStatus: CaseStatusSchema.options.every((value) => value in caseStatusPresentation),
    stageStatus: StageStatusSchema.options.every(
      (value) => value in navigationProgressPresentation,
    ),
  };
}

