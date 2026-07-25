import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleDot,
  Eye,
  EyeOff,
  FileText,
  FileWarning,
  HelpCircle,
  Info,
  Lock,
  ScanLine,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

type BadgeTone = "neutral" | "amber" | "sage" | "rust" | "ink" | "mute";

const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-secondary text-secondary-foreground border-border",
  amber:
    "bg-[color-mix(in_oklab,var(--amber)_18%,transparent)] text-[color:var(--ink)] border-[color-mix(in_oklab,var(--amber)_45%,transparent)]",
  sage:
    "bg-[color-mix(in_oklab,var(--sage)_16%,transparent)] text-[color:var(--ink)] border-[color-mix(in_oklab,var(--sage)_45%,transparent)]",
  rust:
    "bg-[color-mix(in_oklab,var(--rust)_14%,transparent)] text-[color:var(--rust)] border-[color-mix(in_oklab,var(--rust)_40%,transparent)]",
  ink: "bg-primary text-primary-foreground border-primary",
  mute: "bg-transparent text-muted-foreground border-border/70",
};

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Chip({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-tight",
        toneStyles[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function SyntheticBanner({
  compact = false,
  detail = "— not real case data. No documents were uploaded, analyzed, or transmitted.",
  label = "Synthetic training fixture",
}: {
  compact?: boolean;
  detail?: string;
  label?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 border-y border-[color-mix(in_oklab,var(--amber)_40%,transparent)] bg-[color-mix(in_oklab,var(--amber)_10%,transparent)] px-4 text-[color:var(--ink)]",
        compact ? "py-1 text-xs" : "py-2 text-xs sm:text-sm",
      )}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{detail}</span>
    </div>
  );
}

export function DemoOnlyNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <span className="mr-1 font-medium text-foreground">Demonstration only —</span>
      {children ?? "no processing, transmission, or persistence occurred."}
    </div>
  );
}

export function LimitationNotice({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-xs">
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Limitations
      </div>
      <ul className="space-y-0.5 text-foreground/90">
        {items.map((limitation) => (
          <li key={limitation}>· {limitation}</li>
        ))}
      </ul>
    </div>
  );
}

const provenanceMap: Record<
  string,
  { tone: BadgeTone; label: string; icon: ReactNode }
> = {
  source_extraction: {
    tone: "ink",
    label: "Source extraction",
    icon: <FileText className="h-3 w-3" />,
  },
  ai_suggestion: {
    tone: "amber",
    label: "Machine suggestion — unverified",
    icon: <Sparkles className="h-3 w-3" />,
  },
  human_created: {
    tone: "sage",
    label: "Practitioner-created",
    icon: <User className="h-3 w-3" />,
  },
  bundled_synthetic: {
    tone: "mute",
    label: "Prepared fixture",
    icon: <Info className="h-3 w-3" />,
  },
  fixture_reviewer: {
    tone: "mute",
    label: "Fixture reviewer",
    icon: <Info className="h-3 w-3" />,
  },
};

export function ProvenanceBadge({ origin }: { origin: string }) {
  const value = provenanceMap[origin] ?? provenanceMap.bundled_synthetic;
  return (
    <Chip tone={value.tone} icon={value.icon}>
      {value.label}
    </Chip>
  );
}

const evidenceNatureMap: Record<string, { tone: BadgeTone; label: string }> = {
  documented_in_source: { tone: "sage", label: "Documented" },
  reported_or_alleged_in_source: { tone: "amber", label: "Reported or alleged" },
  reviewer_supplied_context: { tone: "neutral", label: "Reviewer-supplied" },
  unknown: { tone: "mute", label: "Unknown" },
};

export function EvidenceNatureBadge({ nature }: { nature: string }) {
  const value = evidenceNatureMap[nature] ?? evidenceNatureMap.unknown;
  return (
    <Chip tone={value.tone} icon={<CircleDot className="h-3 w-3" />}>
      {value.label}
    </Chip>
  );
}

const supportStatusMap: Record<
  string,
  { tone: BadgeTone; label: string; icon: ReactNode }
> = {
  exact_source_supported: {
    tone: "sage",
    label: "Supported",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  partially_supported: {
    tone: "amber",
    label: "Partially supported",
    icon: <CircleDashed className="h-3 w-3" />,
  },
  insufficient_evidence: {
    tone: "neutral",
    label: "Insufficient",
    icon: <HelpCircle className="h-3 w-3" />,
  },
  conflicting: {
    tone: "rust",
    label: "Conflicting",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  citation_unresolved: {
    tone: "rust",
    label: "Citation unresolved",
    icon: <XCircle className="h-3 w-3" />,
  },
  not_processed: {
    tone: "mute",
    label: "Not processed",
    icon: <Circle className="h-3 w-3" />,
  },
  invalidated: {
    tone: "rust",
    label: "Invalidated",
    icon: <XCircle className="h-3 w-3" />,
  },
  withdrawn: {
    tone: "mute",
    label: "Withdrawn",
    icon: <Ban className="h-3 w-3" />,
  },
};

export function SupportStatusBadge({ support }: { support: string }) {
  const value = supportStatusMap[support] ?? supportStatusMap.not_processed;
  return (
    <Chip tone={value.tone} icon={value.icon}>
      {value.label}
    </Chip>
  );
}

const reviewStatusMap: Record<
  string,
  { tone: BadgeTone; label: string; icon: ReactNode }
> = {
  pending: {
    tone: "amber",
    label: "Pending review",
    icon: <CircleDashed className="h-3 w-3" />,
  },
  human_accepted: {
    tone: "sage",
    label: "Accepted",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  human_edited: {
    tone: "sage",
    label: "Edited",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    tone: "rust",
    label: "Rejected",
    icon: <XCircle className="h-3 w-3" />,
  },
  uncertain: {
    tone: "neutral",
    label: "Marked uncertain",
    icon: <HelpCircle className="h-3 w-3" />,
  },
  invalidated: {
    tone: "amber",
    label: "Renewed review",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  withdrawn: {
    tone: "mute",
    label: "Withdrawn",
    icon: <Ban className="h-3 w-3" />,
  },
};

export function ReviewStatusBadge({ review }: { review: string }) {
  const value = reviewStatusMap[review] ?? reviewStatusMap.pending;
  return (
    <Chip tone={value.tone} icon={value.icon}>
      {value.label}
    </Chip>
  );
}

const processingStatusMap: Record<
  string,
  { tone: BadgeTone; label: string; icon: ReactNode }
> = {
  completed: {
    tone: "sage",
    label: "Text extracted",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  active: {
    tone: "amber",
    label: "Processing",
    icon: <ScanLine className="h-3 w-3" />,
  },
  warning: {
    tone: "amber",
    label: "Manual review",
    icon: <FileWarning className="h-3 w-3" />,
  },
  failed: {
    tone: "rust",
    label: "Processing failed",
    icon: <XCircle className="h-3 w-3" />,
  },
  pending: {
    tone: "mute",
    label: "Unprocessed",
    icon: <EyeOff className="h-3 w-3" />,
  },
  image_only: {
    tone: "amber",
    label: "OCR required",
    icon: <ScanLine className="h-3 w-3" />,
  },
  unreadable: {
    tone: "rust",
    label: "Unreadable",
    icon: <Lock className="h-3 w-3" />,
  },
  available: {
    tone: "sage",
    label: "Readable",
    icon: <Eye className="h-3 w-3" />,
  },
};

export function ProcessingStatusBadge({ status }: { status: string }) {
  const value = processingStatusMap[status] ?? processingStatusMap.pending;
  return (
    <Chip tone={value.tone} icon={value.icon}>
      {value.label}
    </Chip>
  );
}

export function SourceCitation({
  docId,
  page,
  quote,
}: {
  docId: string;
  page?: number;
  quote?: string;
}) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1 rounded border border-border/80 bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] leading-tight">
      <FileText className="h-3 w-3 self-center text-muted-foreground" aria-hidden />
      <span className="font-medium text-foreground">{docId}</span>
      {page ? <span className="text-muted-foreground">· p.{page}</span> : null}
      {quote ? (
        <span
          className="ml-1 max-w-[24rem] truncate italic text-muted-foreground"
          title={quote}
        >
          &ldquo;{quote}&rdquo;
        </span>
      ) : null}
    </span>
  );
}

export function ExportStatusChip({
  state,
}: {
  state: "Blocked" | "Pending" | "Ready";
}) {
  const tone: BadgeTone =
    state === "Blocked" ? "rust" : state === "Pending" ? "amber" : "sage";
  const icon =
    state === "Blocked" ? (
      <XCircle className="h-3 w-3" />
    ) : state === "Pending" ? (
      <CircleDashed className="h-3 w-3" />
    ) : (
      <CheckCircle2 className="h-3 w-3" />
    );
  return (
    <Chip tone={tone} icon={icon}>
      Export {state}
    </Chip>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
      <div>
        {eyebrow ? (
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-1 font-serif text-2xl leading-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SummaryMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-serif text-2xl text-foreground">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
