"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Info,
  Pencil,
  Phone,
  Plus,
  User,
} from "lucide-react";
import {
  Chip,
  DemoOnlyNotice,
  SectionTitle,
} from "../../components/lovable/nexus-ui";
import { useCaseState } from "../../components/shell";
import { Button, Select } from "../../components/ui";
import type {
  CaseCommand,
  CaseState,
  CaseTask,
  InterviewQuestion,
  PractitionerNote,
  ReferralPlan,
  ServiceProviderDirectoryRecord,
  UrgentNeed,
} from "../../lib/contracts";
import {
  derivePlanningDashboardCounts,
  deriveServiceResourceMatches,
  deriveUrgentNeedSuggestions,
  serviceProviderDirectory,
  sourceLinkState,
} from "../../lib/planning";

type NexusChipTone = "neutral" | "amber" | "sage" | "rust" | "ink" | "mute";

function commandMeta(state: CaseState, prefix: string): CaseCommand["meta"] {
  const createdAt = new Date().toISOString();
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    commandId: `${prefix}-${suffix}`,
    idempotencyKey: `${prefix}-idem-${suffix}`,
    expectedCaseRevision: state.caseRevision,
    actor: "current_practitioner",
    createdAt,
  };
}

function readable(value: string) {
  return value.replaceAll("_", " ");
}

function pretty(value: string) {
  return readable(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function nexusStatusTone(status: string): NexusChipTone {
  if (["resolved", "completed", "approved", "edited", "planned_for_manual_follow_up"].includes(status)) return "sage";
  if (["cancelled", "removed", "inappropriate"].includes(status)) return "rust";
  if (["waiting", "deferred", "draft", "todo", "in_progress"].includes(status)) return "amber";
  return "mute";
}

function PlanningResult({ message }: { message: string | null }) {
  return message ? (
    <p className={message.includes("not accepted") ? "text-sm text-[var(--color-danger)]" : "text-sm text-[var(--color-supported)]"} role="status">
      {message}
    </p>
  ) : null;
}

function PlanningComposeDialog({
  children,
  description,
  onClose,
  onSubmit,
  open,
  submitLabel,
  title,
}: {
  children: ReactNode;
  description: string;
  onClose: () => void;
  onSubmit: () => void;
  open: boolean;
  submitLabel: string;
  title: string;
}) {
  return (
    <aside
      aria-label={title}
      aria-modal={open || undefined}
      className={open ? "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" : undefined}
      hidden={!open}
      role={open ? "dialog" : undefined}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-serif text-xl leading-tight">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          {open ? (
            <button
              aria-label="Close"
              className="rounded-md border border-transparent px-2 py-1 text-lg leading-none text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 p-4 text-sm">{children}</div>
        <div className="flex justify-end gap-2 border-t border-border bg-muted/20 px-4 py-3">
          {open ? (
            <button
              className="rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-muted"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
          ) : null}
          <button
            className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            onClick={onSubmit}
            type="button"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </aside>
  );
}

function SourceLinkStateBadge({
  state,
  source,
}: {
  state: CaseState;
  source: { sourceType: string; sourceId: string | null; sourceAnalysisRunId: string | null; sourceCandidateRevision: number | null };
}) {
  const linkState = sourceLinkState(state, source);
  if (linkState === "not_run_scoped") return <Chip tone="mute">Manual planning record</Chip>;
  return (
    <Chip tone={linkState === "current" ? "sage" : "amber"}>
      Source link {linkState}
    </Chip>
  );
}

function PlanningField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function InterviewField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function InterviewFilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      aria-pressed={active}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-muted"}`}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className={active ? "opacity-90" : "text-muted-foreground"}>{count}</span>
      ) : null}
    </button>
  );
}

function InterviewReviewChip({
  status,
}: {
  status: InterviewQuestion["status"];
}) {
  const values: Record<
    InterviewQuestion["status"],
    { tone: NexusChipTone; label: string; icon: ReactNode }
  > = {
    draft: {
      tone: "amber",
      label: "Pending Review",
      icon: <Clock className="h-3 w-3" />,
    },
    approved: {
      tone: "sage",
      label: "Approved for Use",
      icon: <Check className="h-3 w-3" />,
    },
    edited: {
      tone: "neutral",
      label: "Edited",
      icon: <Pencil className="h-3 w-3" />,
    },
    deferred: {
      tone: "mute",
      label: "Deferred",
      icon: <Clock className="h-3 w-3" />,
    },
    removed: {
      tone: "rust",
      label: "Removed",
      icon: <Ban className="h-3 w-3" />,
    },
    inappropriate: {
      tone: "rust",
      label: "Inappropriate",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };
  const value = values[status];
  return <Chip icon={value.icon} tone={value.tone}>{value.label}</Chip>;
}

function InterviewAction({
  children,
  icon,
  onClick,
  tone,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
  tone?: "sage" | "rust";
}) {
  const classes = tone === "sage"
    ? "border-[color-mix(in_oklab,var(--sage)_45%,transparent)] bg-[color-mix(in_oklab,var(--sage)_16%,transparent)]"
    : tone === "rust"
      ? "border-[color-mix(in_oklab,var(--rust)_40%,transparent)] bg-[color-mix(in_oklab,var(--rust)_10%,transparent)] text-[color:var(--rust)]"
      : "border-border bg-background";
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring ${classes}`}
      onClick={onClick}
      type="button"
    >
      {icon}{children}
    </button>
  );
}

function InterviewTrace({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-background/40 p-3">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function resourceTypeLabel(resource: ServiceProviderDirectoryRecord) {
  if (resource.resourceType === "official_directory") return "Official directory";
  if (resource.resourceType === "official_locator") return "Official locator";
  if (resource.resourceType === "official_roster") return "Official roster";
  return "Navigation service";
}

function ServiceFilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const active = value !== "Any" && value !== "All";
  return (
    <label className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${active ? "border-[color:var(--amber)] bg-[color-mix(in_oklab,var(--amber)_10%,transparent)]" : "border-border bg-background"}`}>
      <span className="text-muted-foreground">{label}</span>
      <select
        aria-label={label}
        className="bg-transparent text-foreground focus:outline-none"
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function UrgentNeedsPreview({
  owner = "M. Chen",
}: {
  owner?: string;
}) {
  const { state, dispatchCaseCommand } = useCaseState();
  const [category, setCategory] = useState<UrgentNeed["category"]>("emergency_accommodation");
  const [urgency, setUrgency] = useState<UrgentNeed["urgency"]>("routine");
  const [description, setDescription] = useState("");
  const [safeContact, setSafeContact] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [linkedCandidateIds, setLinkedCandidateIds] = useState<string[]>([]);
  const [linkedCitationIds, setLinkedCitationIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const sourceSuggestions = deriveUrgentNeedSuggestions(state);
  const activeNeeds = state.urgentNeeds.filter(
    (need) => !["resolved", "cancelled"].includes(need.status),
  );
  const hasBundledExamples = state.urgentNeeds.some(
    (need) => need.origin === "bundled_synthetic",
  );

  function createNeed() {
    setMessage(null);
    const result = dispatchCaseCommand({
      type: "create_urgent_need",
      meta: commandMeta(state, "create-urgent-need"),
      input: {
        category,
        description,
        urgency,
        owner,
        safeContactConstraints: safeContact,
        nextAction,
        linkedCandidateIds,
        linkedCitationIds,
      },
    });
    if (!result.ok) {
      setMessage(`Need was not accepted: ${result.reason}.`);
      return;
    }
    const created = result.state.urgentNeeds.at(-1);
    setDescription("");
    setSafeContact("");
    setNextAction("");
    setLinkedCandidateIds([]);
    setLinkedCitationIds([]);
    setMessage(`${created?.id ?? "Need"} saved in browser-local case state.`);
  }

  function useSuggestion(suggestion: ReturnType<typeof deriveUrgentNeedSuggestions>[number]) {
    setCategory(suggestion.category);
    setDescription(suggestion.description);
    setNextAction(suggestion.nextAction);
    setLinkedCandidateIds([suggestion.candidateId]);
    setLinkedCitationIds(suggestion.linkedCitationIds);
    setMessage("Planning prompt loaded. Confirm the need, urgency, and safe-contact constraints before saving.");
  }

  function changeStatus(needId: string, nextStatus: UrgentNeed["status"]) {
    const result = dispatchCaseCommand({
      type: "update_urgent_need_status",
      meta: commandMeta(state, `urgent-need-${needId.toLowerCase()}`),
      needId,
      status: nextStatus,
    });
    setMessage(result.ok ? `${needId} status updated.` : `Need status was not accepted: ${result.reason}.`);
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        actions={<Chip tone="rust">{activeNeeds.length} active urgent {activeNeeds.length === 1 ? "need" : "needs"}</Chip>}
        description={
          hasBundledExamples
            ? "Review bundled fictional examples and record practitioner-written operational needs. This screen never generates a risk score for a person."
            : "Record practitioner-written operational needs for this browser-local case. This screen never generates a risk score for a person."
        }
        eyebrow="Stage 3 · Analysis"
        title="Urgent Needs"
      />
      <div className="rounded-lg border border-[color-mix(in_oklab,var(--rust)_30%,transparent)] bg-[color-mix(in_oklab,var(--rust)_6%,transparent)] p-4">
        <div className="flex items-start gap-3">
          <AlertOctagon className="mt-0.5 h-5 w-5 text-[color:var(--rust)]" />
          <div className="text-sm">
            <div className="font-serif text-base">If a person is in immediate danger</div>
            <p className="mt-1 text-muted-foreground">
              Contact appropriate local emergency services outside this workspace. This system does not contact emergency services.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="font-serif text-lg">Add an urgent need</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Record a practitioner-confirmed operational need. Nothing is sent or actioned automatically.
                </p>
              </div>
              <button
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                onClick={createNeed}
                type="button"
              >
                Record need
              </button>
            </div>
            <div className="mt-3 grid gap-x-3 gap-y-2 sm:grid-cols-2">
              <label className="block text-xs text-muted-foreground">
                Category
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(event) => setCategory(event.currentTarget.value as UrgentNeed["category"])}
                  value={category}
                >
                  {["emergency_accommodation", "legal_support", "mental_health_support", "interpretation", "documentation", "safe_contact", "other"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                </select>
              </label>
              <label className="block text-xs text-muted-foreground">
                Practitioner-confirmed urgency
                <select
                  aria-label="Practitioner-confirmed urgency"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(event) => setUrgency(event.currentTarget.value as UrgentNeed["urgency"])}
                  value={urgency}
                >
                  {["routine", "within_7_days", "within_72_hours", "within_24_hours"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                </select>
              </label>
              <label className="block text-xs text-muted-foreground sm:col-span-2">
                Practitioner description
                <textarea
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(event) => setDescription(event.currentTarget.value)}
                  rows={2}
                  value={description}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Safe-contact constraints
                <textarea
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(event) => setSafeContact(event.currentTarget.value)}
                  rows={2}
                  value={safeContact}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Next action
                <input
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(event) => setNextAction(event.currentTarget.value)}
                  value={nextAction}
                />
              </label>
            </div>
            <PlanningResult message={message} />
          </div>

          {state.urgentNeeds.map((need) => (
            <article key={need.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {need.id} · {need.origin === "bundled_synthetic" ? "Bundled fictional example" : "Human-created"}
                  </div>
                  <h2 className="mt-0.5 font-serif text-xl">{pretty(need.category)}</h2>
                  <p className="mt-2 text-sm">{need.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Chip tone={need.urgency === "within_24_hours" || need.urgency === "within_72_hours" ? "rust" : "amber"}>
                    {pretty(need.urgency)}
                  </Chip>
                  <Chip tone={nexusStatusTone(need.status)}>Status: {pretty(need.status)}</Chip>
                </div>
              </div>
              <dl className="mt-4 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                <PlanningField label="Assigned">{need.owner}</PlanningField>
                <PlanningField label="Information source">
                  {need.origin === "bundled_synthetic" ? "Bundled fictional example" : "Current practitioner"}
                </PlanningField>
                <PlanningField label="Consent / contact restrictions">{need.safeContactConstraints}</PlanningField>
                <PlanningField label="Required action">{need.nextAction}</PlanningField>
                <PlanningField label="Follow-up">{need.followUpAt ?? "No follow-up recorded"}</PlanningField>
                <PlanningField label="Source-linked planning prompt">
                  {need.linkedCandidateIds.length
                    ? `${need.linkedCandidateIds.join(", ")} · ${need.linkedCitationIds.length} citation ${need.linkedCitationIds.length === 1 ? "link" : "links"}`
                    : "None — practitioner-authored without an analysis link"}
                </PlanningField>
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs opacity-60" disabled type="button">
                  <Phone className="h-3.5 w-3.5" />Open referral
                </button>
                <span className="text-xs text-muted-foreground">The system does not contact any provider on your behalf.</span>
                <label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
                  Status
                  <select
                    aria-label={`Lifecycle status for ${need.id}`}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
                    onChange={(event) => changeStatus(need.id, event.currentTarget.value as UrgentNeed["status"])}
                    value={need.status}
                  >
                    {["open", "in_progress", "waiting", "resolved", "cancelled"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                  </select>
                </label>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-3">
          {sourceSuggestions.length ? (
            <div className="rounded-xl border border-[color-mix(in_oklab,var(--amber)_32%,transparent)] bg-[color-mix(in_oklab,var(--amber)_7%,transparent)] p-4">
              <h2 className="font-serif text-base">Source-linked planning prompts</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                These are questions from active Lane C analysis—not confirmed needs, urgency assessments, or recommendations.
              </p>
              <div className="mt-3 space-y-2">
                {sourceSuggestions.map((suggestion) => (
                  <button
                    className="w-full rounded-md border border-border bg-background p-2.5 text-left text-xs hover:bg-muted/50"
                    key={suggestion.id}
                    onClick={() => useSuggestion(suggestion)}
                    type="button"
                  >
                    <span className="font-medium">{pretty(suggestion.category)}</span>
                    <span className="mt-1 block text-muted-foreground">{suggestion.candidateId}</span>
                    <span className="mt-1 block font-medium text-foreground">Use planning prompt</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <DemoOnlyNotice>
            {hasBundledExamples
              ? "Bundled examples are fictional; practitioner updates remain browser-local planning records and contact no one."
              : "Practitioner-written needs remain browser-local planning records and contact no one."}
          </DemoOnlyNotice>
        </aside>
      </div>
    </div>
  );
}

export function InterviewPlannerPreview({
  evidenceGapsHref = "/case/demo/gaps",
}: {
  evidenceGapsHref?: string;
} = {}) {
  const { state, dispatchCaseCommand } = useCaseState();
  const [statusFilter, setStatusFilter] = useState<"all" | InterviewQuestion["status"]>("all");
  const [gapFilter, setGapFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(state.interviewQuestions[0]?.id ?? null);
  const [setupDraft, setSetupDraft] = useState(state.interviewSetup);
  const setupSignatureRef = useRef(JSON.stringify(state.interviewSetup));
  const [setupOpen, setSetupOpen] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [detailView, setDetailView] = useState<"detail" | "readiness" | "coverage" | "sequence">("detail");
  const [addOpen, setAddOpen] = useState(false);
  const [body, setBody] = useState("");
  const [rationale, setRationale] = useState("");
  const [questionEdits, setQuestionEdits] = useState<Record<string, { body: string; rationale: string }>>({});
  const [message, setMessage] = useState<string | null>(null);
  const gapOptions = state.candidates.filter((candidate) => candidate.kind === "context_gap");
  const visible = state.interviewQuestions.filter(
    (question) =>
      (statusFilter === "all"
        ? question.status !== "removed"
        : question.status === statusFilter) &&
      (gapFilter === "all" || question.linkedGapCandidateId === gapFilter),
  );
  const selected = visible.find((question) => question.id === selectedId) ?? visible[0] ?? null;
  const selectedQuestionEdit = selected ? questionEdits[selected.id] ?? { body: "", rationale: "" } : { body: "", rationale: "" };
  const questionCounts = useMemo(() => {
    const result: Record<"all" | InterviewQuestion["status"], number> = {
      all: state.interviewQuestions.filter((question) => question.status !== "removed").length,
      draft: 0,
      approved: 0,
      edited: 0,
      deferred: 0,
      removed: 0,
      inappropriate: 0,
    };
    for (const question of state.interviewQuestions) result[question.status] += 1;
    return result;
  }, [state.interviewQuestions]);
  const coveredGapIds = useMemo(
    () => new Set(
      state.interviewQuestions
        .filter((question) => ["approved", "edited"].includes(question.status))
        .map((question) => question.linkedGapCandidateId)
        .filter((id): id is string => Boolean(id)),
    ),
    [state.interviewQuestions],
  );

  useEffect(() => {
    const hash = globalThis.location?.hash ?? "";
    if (!hash.startsWith("#question-")) return;
    const questionId = decodeURIComponent(hash.slice("#question-".length));
    const targetQuestion = state.interviewQuestions.find((question) => question.id === questionId);
    if (!targetQuestion) return;
    setStatusFilter(targetQuestion.status === "removed" ? "removed" : "all");
    setGapFilter("all");
    setDetailView("detail");
    setSelectedId(questionId);
  }, [state.interviewQuestions]);

  useEffect(() => {
    const nextSignature = JSON.stringify(state.interviewSetup);
    if (nextSignature === setupSignatureRef.current) return;
    setupSignatureRef.current = nextSignature;
    setSetupDraft(state.interviewSetup);
  }, [state.interviewSetup]);

  function updateSetupDraft(field: keyof typeof setupDraft, value: string | boolean) {
    setSetupDraft((draft) => ({ ...draft, [field]: value }));
  }

  function updateSelectedQuestionEdit(questionId: string, patch: Partial<{ body: string; rationale: string }>) {
    setQuestionEdits((drafts) => ({
      ...drafts,
      [questionId]: {
        body: drafts[questionId]?.body ?? "",
        rationale: drafts[questionId]?.rationale ?? "",
        ...patch,
      },
    }));
  }

  function saveSetup() {
    const result = dispatchCaseCommand({
      type: "save_interview_setup",
      meta: commandMeta(state, "save-interview-setup"),
      input: {
        purpose: setupDraft.purpose,
        language: setupDraft.language,
        interpreter: setupDraft.interpreter,
        accessibility: setupDraft.accessibility,
        safeContact: setupDraft.safeContact,
        consentConfirmed: setupDraft.consentConfirmed,
      },
    });
    setMessage(result.ok ? "Interview setup saved." : `Interview setup was not accepted: ${result.reason}.`);
  }

  function createQuestion() {
    const result = dispatchCaseCommand({
      type: "create_interview_question",
      meta: commandMeta(state, "create-interview-question"),
      input: { body, rationale },
    });
    if (!result.ok) {
      setMessage(`Question was not accepted: ${result.reason}.`);
      return;
    }
    const created = result.state.interviewQuestions.at(-1);
    setSelectedId(created?.id ?? null);
    setBody("");
    setRationale("");
    setAddOpen(false);
    setMessage(`${created?.id ?? "Question"} saved for practitioner review.`);
  }

  function updateQuestion(question: InterviewQuestion, status: InterviewQuestion["status"]) {
    const edit = questionEdits[question.id] ?? { body: "", rationale: "" };
    const result = dispatchCaseCommand({
      type: "update_interview_question",
      meta: commandMeta(state, `question-${question.id.toLowerCase()}`),
      input: {
        questionId: question.id,
        body: edit.body || question.body,
        rationale: edit.rationale || question.rationale,
        status,
      },
    });
    setMessage(result.ok ? `${question.id} updated.` : `Question update was not accepted: ${result.reason}.`);
    if (result.ok) {
      setQuestionEdits((drafts) => {
        const next = { ...drafts };
        delete next[question.id];
        return next;
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Stage 4 · Planning</div>
          <h1 className="mt-0.5 font-serif text-2xl leading-tight text-foreground">Interview Planner</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Prepare respectful, non-leading follow-up questions connected to evidence gaps. Questions are planning aids, not mandatory scripts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone="amber" icon={<Clock className="h-3 w-3" />}>{questionCounts.draft} Pending Review</Chip>
          <Chip tone="sage" icon={<Check className="h-3 w-3" />}>{questionCounts.approved} Approved for Use</Chip>
          <Chip tone="neutral" icon={<CheckCircle2 className="h-3 w-3" />}>{coveredGapIds.size} Gaps Covered</Chip>
          <Chip tone="rust" icon={<AlertTriangle className="h-3 w-3" />}>{Math.max(gapOptions.length - coveredGapIds.size, 0)} Gaps Uncovered</Chip>
          <button
            className="ml-2 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setAddOpen(true)}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" /> Add Question
          </button>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card">
        <button
          aria-expanded={setupOpen}
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setSetupOpen((open) => !open)}
          type="button"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Session setup</span>
            <span><b>Purpose:</b> {state.interviewSetup.purpose}</span>
            <span className="text-muted-foreground">·</span>
            <span>{state.interviewSetup.language}</span>
            <span className="text-muted-foreground">·</span>
            <span>{state.interviewSetup.interpreter}</span>
            <span className="text-muted-foreground">·</span>
            <span>{state.interviewSetup.accessibility}</span>
            <span className="text-muted-foreground">·</span>
            <span>{state.interviewSetup.safeContact}</span>
            <span className="text-muted-foreground">·</span>
            <span>{state.interviewSetup.consentConfirmed ? "Consent recorded" : "Consent not recorded"}</span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
            {setupOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {setupOpen ? "Hide" : "Edit setup"}
          </span>
        </button>
        {setupOpen ? (
          <div className="grid gap-3 border-t border-border p-3 text-sm sm:grid-cols-2">
            <InterviewField label="Purpose">
              <input className="ip-input" onChange={(event) => updateSetupDraft("purpose", event.currentTarget.value)} value={setupDraft.purpose} />
            </InterviewField>
            <InterviewField label="Language">
              <input className="ip-input" onChange={(event) => updateSetupDraft("language", event.currentTarget.value)} value={setupDraft.language} />
            </InterviewField>
            <InterviewField label="Interpreter">
              <input className="ip-input" onChange={(event) => updateSetupDraft("interpreter", event.currentTarget.value)} value={setupDraft.interpreter} />
            </InterviewField>
            <InterviewField label="Accessibility">
              <input className="ip-input" onChange={(event) => updateSetupDraft("accessibility", event.currentTarget.value)} value={setupDraft.accessibility} />
            </InterviewField>
            <InterviewField label="Safe contact">
              <input className="ip-input" onChange={(event) => updateSetupDraft("safeContact", event.currentTarget.value)} value={setupDraft.safeContact} />
            </InterviewField>
            <label className="flex items-center gap-2 text-sm">
              <input checked={setupDraft.consentConfirmed} onChange={(event) => updateSetupDraft("consentConfirmed", event.currentTarget.checked)} type="checkbox" />
              <span>Consent confirmed for interview planning</span>
            </label>
            <button className="w-fit rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90" onClick={saveSetup} type="button">
              Save session setup
            </button>
          </div>
        ) : (
          <div className="sr-only">
            <InterviewField label="Purpose">
              <input onChange={(event) => updateSetupDraft("purpose", event.currentTarget.value)} value={setupDraft.purpose} />
            </InterviewField>
            <InterviewField label="Language">
              <input onChange={(event) => updateSetupDraft("language", event.currentTarget.value)} value={setupDraft.language} />
            </InterviewField>
            <InterviewField label="Interpreter">
              <input onChange={(event) => updateSetupDraft("interpreter", event.currentTarget.value)} value={setupDraft.interpreter} />
            </InterviewField>
            <InterviewField label="Accessibility">
              <input onChange={(event) => updateSetupDraft("accessibility", event.currentTarget.value)} value={setupDraft.accessibility} />
            </InterviewField>
            <InterviewField label="Safe contact">
              <input onChange={(event) => updateSetupDraft("safeContact", event.currentTarget.value)} value={setupDraft.safeContact} />
            </InterviewField>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-[color-mix(in_oklab,var(--amber)_8%,transparent)]">
        <button
          aria-expanded={guidanceOpen}
          className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setGuidanceOpen((open) => !open)}
          type="button"
        >
          <div className="flex items-start gap-2 text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ink)]" aria-hidden />
            <span>Every suggested question requires practitioner review. Hesitation, uncertainty, incomplete memory, or refusal to answer does not indicate dishonesty.</span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium">
            {guidanceOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {guidanceOpen ? "Hide" : "More guidance"}
          </span>
        </button>
        {guidanceOpen ? (
          <ul className="space-y-1 border-t border-border/60 px-3 py-2 text-xs text-foreground/90">
            <li>· Do not use accusatory, coercive, or leading questions.</li>
            <li>· Do not assume an allegation is true or false.</li>
            <li>· Prefer open prompts.</li>
            <li>· Do not repeatedly request traumatic detail without a defined purpose.</li>
            <li>· Uncertainty or inconsistent memory must not be treated as dishonesty.</li>
            <li>· The person may pause or stop the interview at any time.</li>
          </ul>
        ) : null}
      </section>

      <div className="space-y-1.5" aria-label="Interview question filters">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Status</span>
          {([
            ["all", "All"],
            ["draft", "Pending Review"],
            ["approved", "Approved for Use"],
            ["edited", "Edited"],
            ["deferred", "Deferred"],
            ["removed", "Removed"],
            ["inappropriate", "Inappropriate"],
          ] as const).map(([value, label]) => (
            <InterviewFilterPill
              active={statusFilter === value}
              count={questionCounts[value]}
              key={value}
              label={label}
              onClick={() => setStatusFilter(value)}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Evidence gap</span>
          <InterviewFilterPill active={gapFilter === "all"} label="All" onClick={() => setGapFilter("all")} />
          {gapOptions.map((gap) => (
            <InterviewFilterPill active={gapFilter === gap.id} key={gap.id} label={gap.id} onClick={() => setGapFilter(gap.id)} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[36%_1fr]">
        <nav aria-label="Interview questions">
          <ul className="max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-card">
            {visible.length === 0 ? (
              <li className="p-6 text-center text-xs text-muted-foreground">No questions match these filters.</li>
            ) : null}
            {visible.map((question) => {
              const active = selected?.id === question.id;
              return (
                <li id={`question-${question.id}`} key={question.id}>
                  <button
                    aria-current={active ? "true" : undefined}
                    className={`block w-full border-b border-border/60 p-3 text-left last:border-0 focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-muted/60" : "hover:bg-muted/40"}`}
                    onClick={() => setSelectedId(question.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{question.id}</span>
                      <InterviewReviewChip status={question.status} />
                    </div>
                    <div className="mt-1 line-clamp-2 font-serif text-sm leading-snug text-foreground">{question.body}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Chip tone="mute">{question.linkedGapCandidateId ?? "Manual question"}</Chip>
                      <Chip tone={question.origin === "human_created" ? "sage" : "mute"} icon={<User className="h-3 w-3" />}>
                        {question.origin === "human_created" ? "Human-created" : "Prepared fixture"}
                      </Chip>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="rounded-lg border border-border bg-card">
          <div role="tablist" aria-label="Detail view" className="flex flex-wrap items-center gap-1 border-b border-border p-2">
            {(["detail", "readiness", "coverage", "sequence"] as const).map((view) => (
              <button
                aria-selected={detailView === view}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring ${detailView === view ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}
                key={view}
                onClick={() => setDetailView(view)}
                role="tab"
                type="button"
              >
                {view === "detail" ? "Question detail" : view === "readiness" ? "Session readiness" : view === "coverage" ? "Gap coverage" : "Sequence"}
              </button>
            ))}
          </div>

          {detailView === "detail" && selected ? (
            <article aria-label={`Interview question detail: ${selected.id}`} className="space-y-4 p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] text-muted-foreground">{selected.id}</span>
                <InterviewReviewChip status={selected.status} />
                <Chip tone="mute">{selected.linkedGapCandidateId ?? "Manual question"}</Chip>
                <SourceLinkStateBadge source={selected.source} state={state} />
                <Chip tone="amber" icon={<AlertTriangle className="h-3 w-3" />}>Human review required</Chip>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <InterviewAction tone="sage" icon={<Check className="h-3.5 w-3.5" />} onClick={() => updateQuestion(selected, "approved")}>Approve for use</InterviewAction>
                <InterviewAction icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => updateQuestion(selected, "edited")}>Save edit</InterviewAction>
                <InterviewAction icon={<Clock className="h-3.5 w-3.5" />} onClick={() => updateQuestion(selected, "deferred")}>Defer</InterviewAction>
                <InterviewAction tone="rust" icon={<AlertTriangle className="h-3.5 w-3.5" />} onClick={() => updateQuestion(selected, "inappropriate")}>Mark inappropriate</InterviewAction>
                <InterviewAction tone="rust" icon={<Ban className="h-3.5 w-3.5" />} onClick={() => updateQuestion(selected, "removed")}>Remove</InterviewAction>
              </div>
              <InterviewTrace title="A · Neutral suggested wording">
                <div className="font-serif text-base leading-snug">{selected.body}</div>
                <label className="mt-3 grid gap-1 text-sm">
                  <span className="text-xs text-muted-foreground">Edit question wording</span>
                  <textarea className="ip-input min-h-[72px]" onChange={(event) => updateSelectedQuestionEdit(selected.id, { body: event.currentTarget.value })} placeholder={selected.body} value={selectedQuestionEdit.body} />
                </label>
                <div className="mt-2 text-xs italic text-muted-foreground">This wording is a starting point. Adapt it to the person&apos;s language, pace, accessibility needs, and circumstances.</div>
              </InterviewTrace>
              <InterviewTrace title="B · Why this question may help">
                <p className="text-sm text-foreground/90">{selected.rationale}</p>
                <label className="mt-3 grid gap-1 text-sm">
                  <span className="text-xs text-muted-foreground">Edit rationale</span>
                  <textarea className="ip-input min-h-[60px]" onChange={(event) => updateSelectedQuestionEdit(selected.id, { rationale: event.currentTarget.value })} placeholder={selected.rationale} value={selectedQuestionEdit.rationale} />
                </label>
                <p className="mt-1 text-xs text-muted-foreground">The question is not proof, and it does not assume any allegation is true.</p>
              </InterviewTrace>
              <InterviewTrace title="C · Evidence and Nexus linkage">
                <ul className="space-y-1 text-sm">
                  <li>
                    <span className="text-muted-foreground">Evidence Gap:</span>{" "}
                    {selected.linkedGapCandidateId ? (
                      <a
                        className="font-mono font-semibold underline underline-offset-2"
                        href={`${evidenceGapsHref}#candidate-${selected.linkedGapCandidateId}`}
                      >
                        {selected.linkedGapCandidateId}
                      </a>
                    ) : (
                      "No gap linked"
                    )}
                  </li>
                  <li><span className="text-muted-foreground">Source type:</span> {pretty(selected.source.sourceType)}</li>
                  <li><span className="text-muted-foreground">Source record:</span> {selected.source.sourceId ?? "Manual planning record"}</li>
                  <li><span className="text-muted-foreground">Source link:</span> {sourceLinkState(state, selected.source)}</li>
                </ul>
              </InterviewTrace>
              <InterviewTrace title="D · Sensitivity and safe framing">
                <p className="text-sm text-foreground/90">Use trauma-informed pacing, avoid assumptions, and let the person pause or decline.</p>
              </InterviewTrace>
            </article>
          ) : null}
          {detailView === "detail" && !selected ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No question is visible under the current filters.</div>
          ) : null}
          {detailView === "readiness" ? (
            <div className="p-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Session readiness</div>
              <ul className="space-y-1.5">
                {[
                  [state.interviewSetup.consentConfirmed, "Consent confirmed"],
                  [Boolean(state.interviewSetup.interpreter && state.interviewSetup.accessibility), "Interpreter / accessibility recorded"],
                  [Boolean(state.interviewSetup.safeContact), "Safe-contact constraints recorded"],
                  [questionCounts.draft === 0, `${questionCounts.draft} questions remain pending review`],
                ].map(([ready, label]) => (
                  <li className="flex items-start gap-2 text-sm" key={String(label)}>
                    {ready ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--sage)]" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--rust)]" />}
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Readiness is a transparent checklist, not a numerical score.</p>
            </div>
          ) : null}
          {detailView === "coverage" ? (
            <div className="p-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Gap-to-question coverage</div>
              <ul className="divide-y divide-border/60 rounded-md border border-border">
                {gapOptions.map((gap) => {
                  const linked = state.interviewQuestions.filter((question) => question.linkedGapCandidateId === gap.id);
                  const approved = linked.filter((question) => ["approved", "edited"].includes(question.status));
                  return (
                    <li className="flex items-center justify-between gap-3 p-3 text-sm" key={gap.id}>
                      <button className="font-mono text-xs font-semibold hover:underline" onClick={() => { setGapFilter(gap.id); setDetailView("detail"); }} type="button">{gap.id}</button>
                      <span className="text-xs text-muted-foreground">{linked.length} linked · {approved.length} approved</span>
                      <Chip tone={approved.length ? "sage" : "rust"}>{approved.length ? "Covered" : "Uncovered"}</Chip>
                    </li>
                  );
                })}
                {!gapOptions.length ? <li className="p-3 text-xs text-muted-foreground">No current analysis gaps are available.</li> : null}
              </ul>
            </div>
          ) : null}
          {detailView === "sequence" ? (
            <div className="space-y-3 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Approved-question sequence</div>
              <ul className="space-y-1">
                {state.interviewQuestions.filter((question) => ["approved", "edited"].includes(question.status)).map((question) => (
                  <li className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" key={question.id}>
                    <span className="mr-1 font-mono text-[10px] text-muted-foreground">{question.id}</span>{question.body}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Sequence is a read-only projection of canonical approved questions.</p>
            </div>
          ) : null}
        </section>
      </div>

      <DemoOnlyNotice>Questions and setup are stored in canonical browser-session state; nothing is transmitted.</DemoOnlyNotice>
      <PlanningResult message={message} />

      <PlanningComposeDialog
        description="Human-created questions start as drafts pending practitioner review."
        onClose={() => setAddOpen(false)}
        onSubmit={createQuestion}
        open={addOpen}
        submitLabel="Create question"
        title="New question"
      >
        <InterviewField label="Question">
          <textarea className="ip-input min-h-[112px]" onChange={(event) => setBody(event.currentTarget.value)} value={body} />
        </InterviewField>
        <InterviewField label="Rationale">
          <textarea className="ip-input min-h-[88px]" onChange={(event) => setRationale(event.currentTarget.value)} value={rationale} />
        </InterviewField>
      </PlanningComposeDialog>

      <style>{`.ip-input { border: 1px solid var(--border); background: var(--background); border-radius: 6px; padding: 6px 10px; font-size: 13px; width: 100%; }`}</style>
    </div>
  );
}

export function ServicesPreview() {
  const { state, dispatchCaseCommand } = useCaseState();
  const resourceMatches = deriveServiceResourceMatches(state);
  const resources = resourceMatches.map(({ resource }) => resource);
  const categories = ["All", ...new Set(serviceProviderDirectory.map((provider) => provider.category))];
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("Any");
  const [language, setLanguage] = useState("Any");
  const [accessibility, setAccessibility] = useState("Any");
  const [format, setFormat] = useState("Any");
  const [hours, setHours] = useState("Any");
  const [eligibility, setEligibility] = useState("Any");
  const [safeMethod, setSafeMethod] = useState("Any");
  const [selectedId, setSelectedId] = useState<string>(resources[0].id);
  const [consent, setConsent] = useState(false);
  const [safeContact, setSafeContact] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const locations = ["Any", ...new Set(serviceProviderDirectory.map((provider) => provider.coverageArea))];
  const languages = ["Any", ...new Set(serviceProviderDirectory.flatMap((provider) => provider.languages))];
  const visible = resources.filter(
    (provider) =>
      (category === "All" || provider.category === category) &&
      (location === "Any" || provider.coverageArea === location) &&
      (language === "Any" || provider.languages.includes(language)) &&
      (accessibility === "Any" || provider.accessibility.toLowerCase().includes(accessibility.toLowerCase())) &&
      (format === "Any" || resourceTypeLabel(provider) === format) &&
      (hours === "Any" || provider.hours.toLowerCase().includes(hours.toLowerCase())) &&
      (eligibility === "Any" || provider.eligibilityCaveat.toLowerCase().includes(eligibility.toLowerCase())) &&
      (safeMethod === "Any" || provider.safeContactMethodLabel.toLowerCase().includes(safeMethod.toLowerCase())) &&
      (!normalizedQuery ||
        [
          provider.name,
          provider.category,
          provider.coverageArea,
          provider.languages.join(" "),
          provider.eligibilityCaveat,
          provider.sourceLabel,
        ].join(" ").toLowerCase().includes(normalizedQuery)),
  );
  const selected = visible.find((provider) => provider.id === selectedId) ?? visible[0] ?? null;
  const selectedProviderId = selected?.id ?? null;
  const selectedPlan = selected
    ? state.referralPlans.find((plan) => plan.providerId === selected.id && plan.planningStatus !== "cancelled") ?? null
    : null;
  const activeFilterCount = [
    category !== "All",
    location !== "Any",
    language !== "Any",
    accessibility !== "Any",
    format !== "Any",
    hours !== "Any",
    eligibility !== "Any",
    safeMethod !== "Any",
    normalizedQuery !== "",
  ].filter(Boolean).length;

  useEffect(() => {
    setConsent(false);
    setSafeContact(false);
    setMessage(null);
  }, [selectedProviderId]);

  function selectProvider(providerId: string) {
    setSelectedId(providerId);
  }

  function clearFilters() {
    setQuery("");
    setCategory("All");
    setLocation("Any");
    setLanguage("Any");
    setAccessibility("Any");
    setFormat("Any");
    setHours("Any");
    setEligibility("Any");
    setSafeMethod("Any");
  }

  function onProviderListKey(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const currentIndex = visible.findIndex((provider) => provider.id === selected?.id);
    if (currentIndex < 0) return;
    const nextIndex = event.key === "ArrowDown"
      ? Math.min(visible.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    selectProvider(visible[nextIndex].id);
  }

  function savePlan(provider: ServiceProviderDirectoryRecord) {
    setMessage(null);
    if (!consent || !safeContact) {
      setMessage("Referral plan was not accepted: consent and safe-contact confirmations are required.");
      return;
    }
    const result = dispatchCaseCommand({
      type: "create_referral_plan",
      meta: commandMeta(state, `referral-${provider.id.toLowerCase()}`),
      input: {
        providerId: provider.id,
        planningStatus: "draft",
        consentConfirmed: true,
        safeContactAcknowledged: true,
      },
    });
    if (result.ok) {
      setConsent(false);
      setSafeContact(false);
      setMessage("Local referral plan saved. No contact was made and no information was transmitted.");
      return;
    }
    setMessage(`Referral plan was not accepted: ${result.reason}.`);
  }

  function updatePlan(plan: ReferralPlan, planningStatus: ReferralPlan["planningStatus"]) {
    const result = dispatchCaseCommand({
      type: "update_referral_plan_status",
      meta: commandMeta(state, `referral-status-${plan.id.toLowerCase()}`),
      referralPlanId: plan.id,
      planningStatus,
    });
    setMessage(result.ok ? `${plan.id} status updated.` : `Referral status was not accepted: ${result.reason}.`);
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        description="Browse curated official U.S. resource finders and create consent-confirmed local follow-up plans. The workspace never contacts a service or transmits case information."
        eyebrow="Stage 4 · Planning"
        title="Services & Referrals"
      />

      <section aria-label="Resource filters" className="rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <input
              aria-label="Search official resources"
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search official resources…"
              type="search"
              value={query}
            />
          </div>
          <ServiceFilterSelect label="Category" onChange={setCategory} options={categories} value={category} />
          <ServiceFilterSelect label="Location" onChange={setLocation} options={locations} value={location} />
          <ServiceFilterSelect label="Language" onChange={setLanguage} options={languages} value={language} />
          <ServiceFilterSelect label="Accessibility" onChange={setAccessibility} options={["Any", "language", "accommodation", "accessibility"]} value={accessibility} />
          <ServiceFilterSelect label="Resource type" onChange={setFormat} options={["Any", "Official directory", "Official locator", "Official roster", "Navigation service"]} value={format} />
          <ServiceFilterSelect label="Hours" onChange={setHours} options={["Any", "online", "vary"]} value={hours} />
          <ServiceFilterSelect label="Eligibility" onChange={setEligibility} options={["Any", "eligibility", "capacity", "representation"]} value={eligibility} />
          <ServiceFilterSelect label="Safe use" onChange={setSafeMethod} options={["Any", "manually", "consent", "transmitted"]} value={safeMethod} />
          <button
            className="rounded-md border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-40"
            disabled={activeFilterCount === 0}
            onClick={clearFilters}
            type="button"
          >
            Clear filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,36%)_1fr]">
        <nav
          aria-label="Official service resources"
          className="max-h-[70vh] space-y-2 overflow-y-auto pr-1 focus:outline-none"
          onKeyDown={onProviderListKey}
          tabIndex={0}
        >
          {!visible.length ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
              <div className="font-serif text-base">No resources match these filters</div>
              <div className="mt-1 text-xs text-muted-foreground">Try clearing a filter or broadening the search.</div>
              <button className="mt-3 rounded-md border border-border px-3 py-1 text-xs hover:bg-muted" onClick={clearFilters} type="button">Clear filters</button>
            </div>
          ) : null}
          {visible.map((provider) => {
            const isSelected = selected?.id === provider.id;
            const resourceMatch = resourceMatches.find(({ resource }) => resource.id === provider.id);
            return (
              <button
                aria-current={isSelected ? "true" : undefined}
                aria-selected={isSelected}
                className={`w-full rounded-xl border p-3 text-left transition ${isSelected ? "border-[color:var(--amber)] bg-[color-mix(in_oklab,var(--amber)_10%,transparent)] shadow-sm" : "border-border bg-card hover:bg-muted/40"}`}
                key={provider.id}
                onClick={() => selectProvider(provider.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-serif text-sm">{provider.name}</div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{provider.category} · {provider.coverageArea}</div>
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{provider.id}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{resourceTypeLabel(provider)}</span>
                  <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Availability not verified</span>
                  {provider.languages[0] ? <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">{provider.languages[0]}{provider.languages.length > 1 ? ` +${provider.languages.length - 1}` : ""}</span> : null}
                  {resourceMatch?.matchedNeedIds.length ? (
                    <span className="rounded-full border border-[color:var(--sage)] bg-[color-mix(in_oklab,var(--sage)_12%,transparent)] px-1.5 py-0.5 text-[10px] text-[color:var(--sage)]">
                      Matches {resourceMatch.matchedNeedIds.length} recorded need {resourceMatch.matchedNeedIds.length === 1 ? "category" : "categories"}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </nav>
        {selected ? (
          <article aria-label={`Selected resource: ${selected.name}`} className="min-w-0 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone="sage">Official source verified</Chip>
                  <Chip tone="amber">Availability not verified</Chip>
                  <span className="font-mono text-[10px] text-muted-foreground">{selected.id}</span>
                </div>
                <h2 className="mt-1 font-serif text-2xl">{selected.name}</h2>
                <div className="mt-0.5 text-xs text-muted-foreground">{selected.category} · {selected.coverageArea}</div>
              </div>
              <Chip tone={selectedPlan ? "sage" : "mute"}>{selectedPlan ? pretty(selectedPlan.planningStatus) : "No local plan"}</Chip>
            </div>
            <dl className="mt-4 grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2 md:grid-cols-3">
              <PlanningField label="Hours">{selected.hours}</PlanningField>
              <PlanningField label="Resource type">{resourceTypeLabel(selected)}</PlanningField>
              <PlanningField label="Languages">{selected.languages.length ? selected.languages.join(", ") : "Verify with the selected organization"}</PlanningField>
              <PlanningField label="Accessibility">{selected.accessibility}</PlanningField>
              <PlanningField label="Eligibility">{selected.eligibilityCaveat}</PlanningField>
              <PlanningField label="Safe-contact options">{selected.safeContactMethodLabel}</PlanningField>
              <PlanningField label="Location / coverage">{selected.coverageArea}</PlanningField>
              <PlanningField label="Information source">
                <a className="font-medium underline underline-offset-2" href={selected.sourceUrl} rel="noreferrer" target="_blank">
                  {selected.sourceLabel}
                </a>
              </PlanningField>
              <PlanningField label="Source checked">{selected.lastVerifiedDate}</PlanningField>
              <PlanningField label="Matched practitioner needs">
                {resourceMatches.find(({ resource }) => resource.id === selected.id)?.matchedNeedIds.join(", ") || "No active matching need recorded"}
              </PlanningField>
            </dl>
            <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
              Source verification means the official resource page was checked; it does not verify any listed organization&apos;s availability, eligibility, capacity, quality, or endorsement. Practitioners must verify details independently.
            </div>
            <div className="mt-4 grid gap-3 border-t border-border pt-3">
              <label className="inline-flex items-center gap-2 text-sm" htmlFor={`consent-${selected.id}`}>
                <input checked={consent} id={`consent-${selected.id}`} onChange={(event) => setConsent(event.currentTarget.checked)} type="checkbox" />
                <span>Consent confirmed for this resource follow-up</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input checked={safeContact} onChange={(event) => setSafeContact(event.currentTarget.checked)} type="checkbox" />
                <span>Safe-contact restrictions reviewed</span>
              </label>
              <Button disabled={!consent || !safeContact} onClick={() => savePlan(selected)} variant="primary">Save local referral plan</Button>
              {selectedPlan ? (
                <label className="grid gap-1 text-xs">
                  <span className="text-muted-foreground">Local planning status</span>
                  <Select onChange={(event) => updatePlan(selectedPlan, event.currentTarget.value as ReferralPlan["planningStatus"])} value={selectedPlan.planningStatus}>
                    {["draft", "planned_for_manual_follow_up", "cancelled"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                  </Select>
                </label>
              ) : null}
              <p className="text-xs leading-5 text-muted-foreground">Contact status is always not contacted. Transmission status is always not transmitted. Opening an official source is a manual browser action and sends no case data from this workspace.</p>
              <PlanningResult message={message} />
            </div>
            <div className="mt-3">
              <DemoOnlyNotice>
                Official source links are curated, but current service availability is not verified. Referral plans remain browser-local records; no organization is contacted.
              </DemoOnlyNotice>
            </div>
          </article>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">Select a resource to view details.</div>
        )}
      </div>
    </div>
  );
}

export function TasksPreview({
  evidenceGapsHref = "/case/demo/gaps",
  owner = "M. Chen",
}: {
  evidenceGapsHref?: string;
  owner?: string;
} = {}) {
  const { state, dispatchCaseCommand } = useCaseState();
  const [filter, setFilter] = useState("All");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const visible = state.caseTasks.filter((task) => {
    const dueAt = task.dueDate ? Date.parse(`${task.dueDate}T23:59:59.999Z`) : null;
    const now = Date.now();
    if (filter === "Removed") return task.status === "cancelled";
    if (task.status === "cancelled") return false;
    if (filter === "My tasks") return task.owner === owner;
    if (filter === "Due soon") {
      return dueAt !== null &&
        dueAt >= now &&
        dueAt <= now + 7 * 24 * 60 * 60 * 1000 &&
        !["completed", "cancelled"].includes(task.status);
    }
    if (filter === "Overdue") return dueAt !== null && dueAt < now && !["completed", "cancelled"].includes(task.status);
    if (filter === "Waiting") return task.status === "waiting";
    if (filter === "Safety-related") return task.origin === "urgent_need";
    if (filter === "Completed") return task.status === "completed";
    return true;
  });

  function closeTaskComposer() {
    setCreateOpen(false);
    setEditingTaskId(null);
    setTitle("");
    setDescription("");
  }

  function openNewTaskComposer() {
    setEditingTaskId(null);
    setTitle("");
    setDescription("");
    setCreateOpen(true);
  }

  function openTaskEditor(task: CaseTask) {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setCreateOpen(true);
  }

  function saveTask() {
    const existingTask = editingTaskId
      ? state.caseTasks.find((task) => task.id === editingTaskId)
      : null;
    const result = dispatchCaseCommand({
      ...(existingTask
        ? {
            type: "update_case_task" as const,
            meta: commandMeta(state, `update-${existingTask.id.toLowerCase()}`),
            input: {
              taskId: existingTask.id,
              title,
              description,
            },
          }
        : {
            type: "create_case_task" as const,
            meta: commandMeta(state, "create-case-task"),
            input: {
              kind: "general_task" as const,
              title,
              description,
              owner,
              priority: "medium" as const,
            },
          }),
    });
    if (!result.ok) {
      setMessage(`Task was not accepted: ${result.reason}.`);
      return;
    }
    const savedTask = existingTask
      ? result.state.caseTasks.find((task) => task.id === existingTask.id)
      : result.state.caseTasks.at(-1);
    closeTaskComposer();
    setMessage(
      existingTask
        ? `${savedTask?.id ?? "Task"} updated without changing evidence.`
        : `${savedTask?.id ?? "Task"} saved. Completing tasks does not resolve evidence gaps or export blockers.`,
    );
  }

  function updateStatus(task: CaseTask, status: CaseTask["status"]) {
    const result = dispatchCaseCommand({
      type: "update_case_task_status",
      meta: commandMeta(state, `task-${task.id.toLowerCase()}`),
      taskId: task.id,
      status,
    });
    setMessage(result.ok ? `${task.id} status updated without changing evidence.` : `Task status was not accepted: ${result.reason}.`);
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        actions={(
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={openNewTaskComposer}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Create task
          </button>
        )}
        description="Operational actions. Operational reminders are not legal deadlines; do not treat them as such."
        eyebrow="Stage 4 · Planning"
        title="Case Tasks"
      />
      <div className="flex flex-wrap gap-1" role="group" aria-label="Task filters">
        {["All", "My tasks", "Due soon", "Overdue", "Waiting", "Safety-related", "Completed", "Removed"].map((value) => (
          <button
            aria-pressed={filter === value}
            className={`rounded-full border px-2 py-0.5 text-[11px] ${filter === value ? "border-[color:var(--amber)] bg-[color-mix(in_oklab,var(--amber)_15%,transparent)]" : "border-border hover:bg-muted"}`}
            key={value}
            onClick={() => setFilter(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
      <PlanningResult message={message} />
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Task</th>
              <th className="p-3">Source</th>
              <th className="p-3">Due</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
              <th className="p-3">Flags</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((task) => (
              <tr
                className="border-t border-border/60 align-top target:bg-[color-mix(in_oklab,var(--amber)_12%,transparent)]"
                id={`task-${task.id}`}
                key={task.id}
              >
                <td className="p-3 font-mono text-xs">{task.id}</td>
                <td className="p-3">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground">{task.description}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Linked:{" "}
                    {task.origin === "context_gap" && task.originId ? (
                      <a
                        className="font-mono font-semibold underline underline-offset-2"
                        href={`${evidenceGapsHref}#candidate-${task.originId}`}
                      >
                        {task.originId}
                      </a>
                    ) : (
                      <span className="font-mono">
                        {task.originId ?? "manual planning record"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-xs">{pretty(task.origin)}</td>
                <td className="p-3 font-mono text-xs">{task.dueDate ?? "—"}</td>
                <td className="p-3"><Chip tone={task.priority === "high" ? "rust" : task.priority === "medium" ? "amber" : "mute"}>{task.priority}</Chip></td>
                <td className="p-3">
                  <select
                    aria-label={`Task status for ${task.id}`}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    onChange={(event) => updateStatus(task, event.currentTarget.value as CaseTask["status"])}
                    value={task.status}
                  >
                    {["todo", "in_progress", "waiting", "completed", "cancelled"].map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Chip tone="mute">Operational reminder</Chip>
                    {sourceLinkState(state, task.source) !== "current" && sourceLinkState(state, task.source) !== "not_run_scoped"
                      ? <Chip tone="amber">Source {sourceLinkState(state, task.source)}</Chip>
                      : null}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={task.status === "cancelled"}
                      onClick={() => openTaskEditor(task)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Remove task ${task.id}`}
                      className="rounded-md border border-[color-mix(in_oklab,var(--rust)_35%,transparent)] px-2 py-1 text-xs text-[color:var(--rust)] hover:bg-[color-mix(in_oklab,var(--rust)_8%,transparent)] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={task.status === "cancelled"}
                      onClick={() => updateStatus(task, "cancelled")}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!visible.length ? (
              <tr><td className="p-6 text-center text-xs text-muted-foreground" colSpan={8}>No tasks match this filter.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <PlanningComposeDialog
        description="Operational reminder only. Completing a task never changes evidence, candidate review, or export readiness."
        onClose={closeTaskComposer}
        onSubmit={saveTask}
        open={createOpen}
        submitLabel={editingTaskId ? "Save task changes" : "Create task"}
        title={editingTaskId ? "Edit task" : "Create task"}
      >
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Title</span>
          <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" onChange={(event) => setTitle(event.currentTarget.value)} value={title} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Description</span>
          <textarea className="min-h-[144px] rounded-md border border-input bg-background px-3 py-2 text-sm" onChange={(event) => setDescription(event.currentTarget.value)} value={description} />
        </label>
      </PlanningComposeDialog>
    </div>
  );
}

export function NotesPreview() {
  const { state, dispatchCaseCommand } = useCaseState();
  const [selectedId, setSelectedId] = useState<string | null>(state.practitionerNotes.find((note) => !note.archived)?.id ?? null);
  const [body, setBody] = useState("");
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const visible = useMemo(
    () => state.practitionerNotes.filter((note) => !note.archived),
    [state.practitionerNotes],
  );
  const selected = visible.find((note) => note.id === selectedId) ?? visible[0] ?? null;

  function noteAuthorLabel(note: PractitionerNote) {
    return note.origin === "bundled_synthetic" || note.author === "fixture_reviewer"
      ? "Bundled fixture reviewer"
      : "Current practitioner";
  }

  function createNote() {
    const result = dispatchCaseCommand({
      type: "create_practitioner_note",
      meta: commandMeta(state, "create-note"),
      input: { body, visibility: "team", linkedEntityIds: [] },
    });
    if (!result.ok) {
      setMessage(`Note was not accepted: ${result.reason}.`);
      return;
    }
    const created = result.state.practitionerNotes.at(-1);
    setSelectedId(created?.id ?? null);
    setBody("");
    setNewNoteOpen(false);
    setMessage(`${created?.id ?? "Note"} saved as practitioner commentary.`);
  }

  function updateNote(note: PractitionerNote) {
    const result = dispatchCaseCommand({
      type: "update_practitioner_note",
      meta: commandMeta(state, `note-${note.id.toLowerCase()}`),
      input: {
        noteId: note.id,
        body: (noteEdits[note.id] ?? "") || note.body,
        visibility: note.visibility,
        linkedEntityIds: note.linkedEntityIds,
      },
    });
    setMessage(result.ok ? `${note.id} updated. Note text is not copied into audit summaries.` : `Note update was not accepted: ${result.reason}.`);
    if (result.ok) {
      setNoteEdits((drafts) => {
        const next = { ...drafts };
        delete next[note.id];
        return next;
      });
    }
  }

  function archiveNote(note: PractitionerNote) {
    const result = dispatchCaseCommand({
      type: "archive_practitioner_note",
      meta: commandMeta(state, `archive-${note.id.toLowerCase()}`),
      noteId: note.id,
    });
    setMessage(result.ok ? `${note.id} archived.` : `Note archive was not accepted: ${result.reason}.`);
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        actions={(
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setNewNoteOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            New note
          </button>
        )}
        description="Record reasoning or operational context. A practitioner note never silently becomes a verified fact."
        eyebrow="Stage 4 · Planning"
        title="Notes & Journal"
      />
      <p className="text-xs text-muted-foreground">
        Notes are practitioner commentary. They are not evidence, not audit records, and are excluded from analysis and exports by default.
      </p>
      <PlanningResult message={message} />
      <nav aria-label="Practitioner notes" className="space-y-3">
          {visible.map((note) => {
            const isSelected = selected?.id === note.id;
            const edit = noteEdits[note.id] ?? "";
            return (
              <article
                aria-label={`Note detail: ${note.id}`}
                className={`rounded-xl border bg-card p-4 ${isSelected ? "border-[color:var(--amber)]" : "border-border"}`}
                key={note.id}
              >
                <button className="block w-full text-left" onClick={() => setSelectedId(note.id)} type="button">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {note.id} · {isSelected ? noteAuthorLabel(note) : note.origin === "bundled_synthetic" ? "Fixture reviewer" : noteAuthorLabel(note)} · {new Date(note.createdAt).toLocaleString()}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Chip tone="mute">practitioner commentary</Chip>
                        <Chip tone="mute">visibility: {note.visibility}</Chip>
                        <Chip tone="amber">not evidence</Chip>
                        <Chip tone="mute">excluded from export</Chip>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm">{note.body}</p>
                  {note.linkedEntityIds.length ? (
                    <div className="mt-3 flex flex-wrap gap-1 border-t border-border/60 pt-2 text-[11px]">
                      {note.linkedEntityIds.map((id) => <Chip key={id} tone="mute">item {id}</Chip>)}
                    </div>
                  ) : null}
                </button>
                {isSelected ? (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <label className="grid gap-1 text-sm">
                      <span className="text-xs text-muted-foreground">Edit commentary</span>
                      <textarea
                        className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          setNoteEdits((drafts) => ({ ...drafts, [note.id]: value }));
                        }}
                        placeholder={note.body}
                        rows={3}
                        value={edit}
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90" onClick={() => updateNote(note)} type="button">Save note edit</button>
                      <button className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted" onClick={() => archiveNote(note)} type="button">Archive note</button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
          {!visible.length ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">No active practitioner notes.</div>
          ) : null}
      </nav>
      <PlanningComposeDialog
        description="Practitioner commentary only. Notes are excluded from evidence, analysis, audit summaries, and exports."
        onClose={() => setNewNoteOpen(false)}
        onSubmit={createNote}
        open={newNoteOpen}
        submitLabel="Record note"
        title="New note"
      >
          <label className="block text-xs text-muted-foreground">
            Commentary
            <textarea
              className="mt-1 min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={(event) => setBody(event.currentTarget.value)}
              placeholder="Describe reasoning or context (not evidence)."
              value={body}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input checked disabled readOnly type="checkbox" />
            Classify as practitioner commentary—not evidence
          </label>
      </PlanningComposeDialog>
    </div>
  );
}

export function PlanningCountProbe() {
  const { state } = useCaseState();
  const counts = derivePlanningDashboardCounts(state);
  return <span>{JSON.stringify(counts)}</span>;
}
