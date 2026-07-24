"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertOctagon,
  CheckSquare,
  FileQuestion,
  HandHelping,
  MessageSquare,
  NotebookPen,
  Search,
} from "lucide-react";
import { useCaseState } from "../../components/shell";
import { Alert, Button, Input, Select, Textarea } from "../../components/ui";
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
  serviceProviderDirectory,
  sourceLinkState,
} from "../../lib/planning";

type ChipTone = "neutral" | "warning" | "danger" | "success";

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

function PlanningChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: ChipTone;
}) {
  const classes = {
    neutral: "border-[var(--color-border)] bg-[var(--color-surface-subtle)]",
    warning: "border-[var(--color-warning)] bg-[var(--color-warning-subtle)]",
    danger: "border-[var(--color-danger)] bg-[var(--color-danger-subtle)]",
    success: "border-[var(--color-supported)] bg-[var(--color-supported-subtle)]",
  }[tone];
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${classes}`}>
      {children}
    </span>
  );
}

function PlanningHeader({
  stage,
  title,
  description,
  icon: Icon,
  boundary,
}: {
  stage: string;
  title: string;
  description: string;
  icon: typeof AlertOctagon;
  boundary: ReactNode;
}) {
  return (
    <header className="grid gap-3 border-b border-[var(--color-border)] pb-5">
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-1 shrink-0 text-[var(--amber)]" size={22} />
        <div>
          <p className="cfn-type-label text-[var(--color-ink-muted)]">{stage}</p>
          <h1 className="cfn-type-heading-1">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-ink-muted)]">
            {description}
          </p>
        </div>
      </div>
      <Alert title="Safety boundary" tone="neutral">{boundary}</Alert>
    </header>
  );
}

function readable(value: string) {
  return value.replaceAll("_", " ");
}

function pretty(value: string) {
  return readable(value).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status: string): ChipTone {
  if (["resolved", "completed", "approved", "planned_for_manual_follow_up"].includes(status)) return "success";
  if (["cancelled", "removed", "inappropriate"].includes(status)) return "danger";
  if (["waiting", "deferred", "draft", "todo"].includes(status)) return "warning";
  return "neutral";
}

function PlanningResult({ message }: { message: string | null }) {
  return message ? (
    <p className={message.includes("not accepted") ? "text-sm text-[var(--color-danger)]" : "text-sm text-[var(--color-supported)]"} role="status">
      {message}
    </p>
  ) : null;
}

function SourceLinkStateBadge({
  state,
  source,
}: {
  state: CaseState;
  source: { sourceType: string; sourceId: string | null; sourceAnalysisRunId: string | null; sourceCandidateRevision: number | null };
}) {
  const linkState = sourceLinkState(state, source);
  if (linkState === "not_run_scoped") return <PlanningChip>Manual planning record</PlanningChip>;
  return (
    <PlanningChip tone={linkState === "current" ? "success" : "warning"}>
      Source link {linkState}
    </PlanningChip>
  );
}

export function UrgentNeedsPreview() {
  const { state, dispatchCaseCommand } = useCaseState();
  const [status, setStatus] = useState<"all" | UrgentNeed["status"]>("all");
  const [urgency, setUrgency] = useState<"all" | UrgentNeed["urgency"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(state.urgentNeeds[0]?.id ?? null);
  const [category, setCategory] = useState<UrgentNeed["category"]>("emergency_accommodation");
  const [description, setDescription] = useState("");
  const [safeContact, setSafeContact] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const visible = state.urgentNeeds.filter(
    (need) =>
      (status === "all" || need.status === status) &&
      (urgency === "all" || need.urgency === urgency),
  );
  const selected = visible.find((need) => need.id === selectedId) ?? visible[0] ?? null;

  function createNeed() {
    setMessage(null);
    const result = dispatchCaseCommand({
      type: "create_urgent_need",
      meta: commandMeta(state, "create-urgent-need"),
      input: {
        category,
        description,
        urgency: "within_72_hours",
        owner: "M. Chen",
        safeContactConstraints: safeContact,
        nextAction,
        linkedCandidateIds: [],
        linkedCitationIds: [],
      },
    });
    if (!result.ok) {
      setMessage(`Need was not accepted: ${result.reason}.`);
      return;
    }
    const created = result.state.urgentNeeds.at(-1);
    setSelectedId(created?.id ?? null);
    setDescription("");
    setSafeContact("");
    setNextAction("");
    setMessage(`${created?.id ?? "Need"} saved in browser-session case state.`);
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
    <div className="grid gap-5">
      <PlanningHeader
        boundary="Urgent Needs are operational planning records only. They do not score danger, determine trafficking status, judge credibility, dispatch emergency services, or contact anyone."
        description="Practitioner-recorded operational needs stored in the canonical browser-session case state."
        icon={AlertOctagon}
        stage="Stage 3 · Analysis"
        title="Urgent Needs"
      />
      <Alert title="If a person is in immediate danger" tone="danger">
        Contact appropriate local emergency services outside this workspace. ContextFirst Nexus does not contact emergency services.
      </Alert>
      <section aria-label="Urgent need filters" className="grid gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs">
          <span className="cfn-type-label">Status</span>
          <Select onChange={(event) => setStatus(event.currentTarget.value as typeof status)} value={status}>
            <option value="all">All statuses</option>
            {["open", "in_progress", "waiting", "resolved", "cancelled"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="cfn-type-label">Urgency</span>
          <Select onChange={(event) => setUrgency(event.currentTarget.value as typeof urgency)} value={urgency}>
            <option value="all">All urgency windows</option>
            {["within_24_hours", "within_72_hours", "within_7_days", "routine"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
          </Select>
        </label>
      </section>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.3fr)_320px]">
        <nav aria-label="Operational needs" className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] px-3 py-3">
            <h2 className="font-serif text-base">Needs ({visible.length})</h2>
          </div>
          {visible.length ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {visible.map((need) => (
                <li key={need.id}>
                  <button
                    aria-current={selected?.id === need.id ? "true" : undefined}
                    className={`grid w-full gap-1 border-l-2 px-3 py-3 text-left ${selected?.id === need.id ? "border-l-[var(--amber)] bg-[var(--color-surface-subtle)]" : "border-l-transparent hover:bg-[var(--color-surface-subtle)]"}`}
                    onClick={() => setSelectedId(need.id)}
                    type="button"
                  >
                    <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{need.id} · {pretty(need.category)}</span>
                    <span className="font-semibold">{need.nextAction}</span>
                    <span className="flex flex-wrap gap-1.5">
                      <PlanningChip tone={need.urgency === "within_24_hours" || need.urgency === "within_72_hours" ? "danger" : "neutral"}>{pretty(need.urgency)}</PlanningChip>
                      <PlanningChip tone={statusTone(need.status)}>{pretty(need.status)}</PlanningChip>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Alert title="No operational needs match" tone="neutral">Change the filters or create a need.</Alert>
          )}
        </nav>
        {selected ? (
          <article aria-label={`Urgent need detail: ${selected.id}`} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">{selected.id} · {selected.origin === "bundled_synthetic" ? "Bundled fictional example" : "Human-created"}</p>
            <h2 className="mt-1 font-serif text-2xl">{pretty(selected.category)}</h2>
            <p className="mt-2 text-sm">{selected.description}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Owner", selected.owner],
                ["Safe-contact constraints", selected.safeContactConstraints],
                ["Next action", selected.nextAction],
                ["Follow-up", selected.followUpAt ?? "No date recorded"],
              ].map(([label, value]) => (
                <div key={label}><dt className="cfn-type-label">{label}</dt><dd className="mt-1">{value}</dd></div>
              ))}
            </dl>
            <label className="mt-4 grid gap-1 text-xs">
              <span className="cfn-type-label">Lifecycle status</span>
              <Select onChange={(event) => changeStatus(selected.id, event.currentTarget.value as UrgentNeed["status"])} value={selected.status}>
                {["open", "in_progress", "waiting", "resolved", "cancelled"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
              </Select>
            </label>
          </article>
        ) : (
          <Alert title="No selected need" tone="neutral">No need is visible under the current filters.</Alert>
        )}
        <aside className="h-fit rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="font-serif text-lg">Add a need</h2>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="cfn-type-label">Category</span>
            <Select onChange={(event) => setCategory(event.currentTarget.value as UrgentNeed["category"])} value={category}>
              {["emergency_accommodation", "legal_support", "mental_health_support", "interpretation", "documentation", "safe_contact", "other"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
            </Select>
          </label>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="cfn-type-label">Practitioner description</span>
            <Textarea onChange={(event) => setDescription(event.currentTarget.value)} value={description} />
          </label>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="cfn-type-label">Safe-contact constraints</span>
            <Textarea onChange={(event) => setSafeContact(event.currentTarget.value)} value={safeContact} />
          </label>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="cfn-type-label">Next action</span>
            <Input onChange={(event) => setNextAction(event.currentTarget.value)} value={nextAction} />
          </label>
          <Button className="mt-3 w-full" onClick={createNeed} variant="primary">Record need</Button>
          <PlanningResult message={message} />
        </aside>
      </div>
    </div>
  );
}

export function InterviewPlannerPreview() {
  const { state, dispatchCaseCommand } = useCaseState();
  const [statusFilter, setStatusFilter] = useState<"all" | InterviewQuestion["status"]>("all");
  const [gapFilter, setGapFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(state.interviewQuestions[0]?.id ?? null);
  const [setupDraft, setSetupDraft] = useState(state.interviewSetup);
  const setupSignatureRef = useRef(JSON.stringify(state.interviewSetup));
  const [body, setBody] = useState("");
  const [rationale, setRationale] = useState("");
  const [questionEdits, setQuestionEdits] = useState<Record<string, { body: string; rationale: string }>>({});
  const [message, setMessage] = useState<string | null>(null);
  const gapOptions = state.candidates.filter((candidate) => candidate.kind === "context_gap");
  const visible = state.interviewQuestions.filter(
    (question) =>
      (statusFilter === "all" || question.status === statusFilter) &&
      (gapFilter === "all" || question.linkedGapCandidateId === gapFilter),
  );
  const selected = visible.find((question) => question.id === selectedId) ?? visible[0] ?? null;
  const selectedQuestionEdit = selected ? questionEdits[selected.id] ?? { body: "", rationale: "" } : { body: "", rationale: "" };

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
    <div className="grid gap-5">
      <PlanningHeader
        boundary="Questions are trauma-informed planning aids. They are separate from evidence, candidate review, credibility judgments, and legal findings."
        description="Session setup and practitioner-reviewed questions stored in canonical browser-session state."
        icon={MessageSquare}
        stage="Stage 4 · Planning"
        title="Interview Planner"
      />
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg">Session setup</h2>
          <PlanningChip tone={state.interviewSetup.consentConfirmed ? "success" : "warning"}>{state.interviewSetup.consentConfirmed ? "Consent confirmed" : "Consent not confirmed"}</PlanningChip>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["purpose", "Purpose"],
            ["language", "Language"],
            ["interpreter", "Interpreter"],
            ["accessibility", "Accessibility"],
            ["safeContact", "Safe contact"],
          ].map(([field, label]) => (
            <label className="grid gap-1 text-sm" key={field}>
              <span className="cfn-type-label">{label}</span>
              <Input
                onChange={(event) => updateSetupDraft(field as keyof typeof setupDraft, event.currentTarget.value)}
                value={String(setupDraft[field as keyof typeof setupDraft])}
              />
            </label>
          ))}
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              checked={setupDraft.consentConfirmed}
              onChange={(event) => updateSetupDraft("consentConfirmed", event.currentTarget.checked)}
              type="checkbox"
            />
            <span>Consent confirmed for interview planning</span>
          </label>
        </div>
        <Button className="mt-3" onClick={saveSetup} variant="primary">Save session setup</Button>
      </section>
      <section aria-label="Interview question filters" className="grid gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs">
          <span className="cfn-type-label">Question status</span>
          <Select onChange={(event) => setStatusFilter(event.currentTarget.value as typeof statusFilter)} value={statusFilter}>
            <option value="all">All statuses</option>
            {["draft", "approved", "edited", "deferred", "removed", "inappropriate"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="cfn-type-label">Linked gap</span>
          <Select onChange={(event) => setGapFilter(event.currentTarget.value)} value={gapFilter}>
            <option value="all">All linked gaps</option>
            {gapOptions.map((gap) => <option key={gap.id} value={gap.id}>{gap.id}</option>)}
          </Select>
        </label>
      </section>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,0.75fr)_minmax(0,1.35fr)_320px]">
        <nav aria-label="Interview questions" className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {visible.length ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {visible.map((question) => (
                <li key={question.id}>
                  <button
                    aria-current={selected?.id === question.id ? "true" : undefined}
                    className={`grid w-full gap-1 border-l-2 p-3 text-left ${selected?.id === question.id ? "border-l-[var(--amber)] bg-[var(--color-surface-subtle)]" : "border-l-transparent hover:bg-[var(--color-surface-subtle)]"}`}
                    onClick={() => setSelectedId(question.id)}
                    type="button"
                  >
                    <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{question.id} · {question.linkedGapCandidateId ?? "manual"}</span>
                    <span className="text-sm font-semibold">{question.body}</span>
                    <PlanningChip tone={statusTone(question.status)}>{pretty(question.status)}</PlanningChip>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Alert title="No questions match" tone="neutral">Change filters or create a question.</Alert>
          )}
        </nav>
        {selected ? (
          <article aria-label={`Interview question detail: ${selected.id}`} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">{selected.id} · {selected.linkedGapCandidateId ?? "manual question"}</p>
            <h2 className="mt-2 font-serif text-xl">{selected.body}</h2>
            <p className="mt-3 text-sm text-[var(--color-ink-muted)]">{selected.rationale}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <PlanningChip tone={statusTone(selected.status)}>{pretty(selected.status)}</PlanningChip>
              <SourceLinkStateBadge source={selected.source} state={state} />
            </div>
	            <label className="mt-4 grid gap-1 text-sm">
	              <span className="cfn-type-label">Edit question wording</span>
	              <Textarea onChange={(event) => updateSelectedQuestionEdit(selected.id, { body: event.currentTarget.value })} placeholder={selected.body} value={selectedQuestionEdit.body} />
	            </label>
	            <label className="mt-3 grid gap-1 text-sm">
	              <span className="cfn-type-label">Edit rationale</span>
	              <Textarea onChange={(event) => updateSelectedQuestionEdit(selected.id, { rationale: event.currentTarget.value })} placeholder={selected.rationale} value={selectedQuestionEdit.rationale} />
	            </label>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
              {[
                ["approved", "Approve for use"],
                ["edited", "Save edit"],
                ["deferred", "Defer"],
                ["removed", "Remove"],
                ["inappropriate", "Mark inappropriate"],
              ].map(([value, label]) => (
                <Button key={value} onClick={() => updateQuestion(selected, value as InterviewQuestion["status"])} variant={value === "approved" ? "primary" : "secondary"}>
                  {label}
                </Button>
              ))}
            </div>
          </article>
        ) : (
          <Alert title="No selected question" tone="neutral">No question is visible under the current filters.</Alert>
        )}
        <aside className="h-fit rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="font-serif text-lg">New question</h2>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="cfn-type-label">Question</span>
            <Textarea onChange={(event) => setBody(event.currentTarget.value)} value={body} />
          </label>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="cfn-type-label">Rationale</span>
            <Textarea onChange={(event) => setRationale(event.currentTarget.value)} value={rationale} />
          </label>
          <Button className="mt-3 w-full" onClick={createQuestion} variant="primary">Create question</Button>
          <PlanningResult message={message} />
        </aside>
      </div>
      <Alert title="Trauma-informed boundary" tone="neutral">
        Prefer open prompts; do not assume truth or falsity; do not treat uncertainty, incomplete memory, hesitation, or refusal as dishonesty.
      </Alert>
    </div>
  );
}

export function ServicesPreview() {
  const { state, dispatchCaseCommand } = useCaseState();
  const categories = ["All", ...new Set(serviceProviderDirectory.map((provider) => provider.category))];
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(serviceProviderDirectory[0].id);
  const [consent, setConsent] = useState(false);
  const [safeContact, setSafeContact] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = serviceProviderDirectory.filter(
    (provider) =>
      (category === "All" || provider.category === category) &&
      (!normalizedQuery ||
        [
          provider.name,
          provider.category,
          provider.coverageArea,
          provider.languages.join(" "),
          provider.eligibilityCaveat,
        ].join(" ").toLowerCase().includes(normalizedQuery)),
  );
  const selected = visible.find((provider) => provider.id === selectedId) ?? visible[0] ?? null;
  const selectedProviderId = selected?.id ?? null;
  const selectedPlan = selected
    ? state.referralPlans.find((plan) => plan.providerId === selected.id && plan.planningStatus !== "cancelled") ?? null
    : null;

  useEffect(() => {
    setConsent(false);
    setSafeContact(false);
    setMessage(null);
  }, [selectedProviderId]);

  function selectProvider(providerId: string) {
    setSelectedId(providerId);
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
    <div className="grid gap-5">
      <PlanningHeader
        boundary="Providers are fictional and unverified. Listings do not guarantee eligibility, capacity, availability, or suitability. Saving a plan contacts no one and transmits nothing."
        description="Immutable fictional provider directory with local browser-session referral plans."
        icon={HandHelping}
        stage="Stage 4 · Planning"
        title="Services & Referrals"
      />
      <section aria-label="Service filters" className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <label className="relative">
          <span className="sr-only">Search fictional providers</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" size={15} />
          <Input aria-label="Search fictional providers" className="pl-9" onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search providers, languages, eligibility" type="search" value={query} />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="cfn-type-label">Service category</span>
          <Select onChange={(event) => setCategory(event.currentTarget.value)} value={category}>
            {categories.map((value) => <option key={value} value={value}>{value}</option>)}
          </Select>
        </label>
      </section>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.4fr)]">
        <nav aria-label="Fictional providers" className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] px-3 py-3"><h2 className="font-serif text-base">Providers ({visible.length})</h2></div>
          {visible.length ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {visible.map((provider) => (
                <li key={provider.id}>
                  <button
                    aria-current={selected?.id === provider.id ? "true" : undefined}
                    className={`grid w-full gap-1 border-l-2 px-3 py-3 text-left ${selected?.id === provider.id ? "border-l-[var(--amber)] bg-[var(--color-surface-subtle)]" : "border-l-transparent hover:bg-[var(--color-surface-subtle)]"}`}
                    onClick={() => selectProvider(provider.id)}
                    type="button"
                  >
                    <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{provider.id} · fictional provider</span>
                    <span className="font-semibold">{provider.name}</span>
                    <span className="text-xs text-[var(--color-ink-muted)]">{provider.category} · {provider.coverageArea}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Alert title="No fictional providers match" tone="neutral">Change the filters to show bundled examples.</Alert>
          )}
        </nav>
        {selected ? (
          <article aria-label={`Selected provider: ${selected.name}`} className="min-w-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <PlanningChip tone="warning">Fictional unverified provider</PlanningChip>
                  <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{selected.id}</span>
                </div>
                <h2 className="mt-2 font-serif text-2xl">{selected.name}</h2>
                <p className="text-sm text-[var(--color-ink-muted)]">{selected.category} · {selected.coverageArea}</p>
              </div>
              <PlanningChip tone={selectedPlan ? "success" : "neutral"}>{selectedPlan ? pretty(selectedPlan.planningStatus) : "No local plan"}</PlanningChip>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Hours", selected.hours],
                ["Languages", selected.languages.join(", ")],
                ["Eligibility caveat", selected.eligibilityCaveat],
                ["Accessibility", selected.accessibility],
                ["Safe-contact method", selected.safeContactMethodLabel],
                ["Fixture review date", selected.fixtureReviewDate],
              ].map(([label, value]) => <div key={label}><dt className="cfn-type-label">{label}</dt><dd className="mt-1">{value}</dd></div>)}
            </dl>
            <div className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input checked={consent} onChange={(event) => setConsent(event.currentTarget.checked)} type="checkbox" />
                <span>Consent confirmed for this synthetic demonstration</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input checked={safeContact} onChange={(event) => setSafeContact(event.currentTarget.checked)} type="checkbox" />
                <span>Safe-contact restrictions reviewed</span>
              </label>
              <Button disabled={!consent || !safeContact} onClick={() => savePlan(selected)} variant="primary">Save local referral plan</Button>
              {selectedPlan ? (
                <label className="grid gap-1 text-xs">
                  <span className="cfn-type-label">Local planning status</span>
                  <Select onChange={(event) => updatePlan(selectedPlan, event.currentTarget.value as ReferralPlan["planningStatus"])} value={selectedPlan.planningStatus}>
                    {["draft", "planned_for_manual_follow_up", "cancelled"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
                  </Select>
                </label>
              ) : null}
              <p className="text-xs leading-5 text-[var(--color-ink-muted)]">Contact status is always not contacted. Transmission status is always not transmitted. Practitioners must verify independently.</p>
              <PlanningResult message={message} />
            </div>
          </article>
        ) : (
          <Alert title="No selected provider" tone="neutral">No provider is visible under the current filters.</Alert>
        )}
      </div>
    </div>
  );
}

export function TasksPreview() {
  const { state, dispatchCaseCommand } = useCaseState();
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(state.caseTasks[0]?.id ?? null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const visible = state.caseTasks.filter((task) => {
    if (filter === "open") return !["completed", "cancelled"].includes(task.status);
    if (filter === "waiting") return task.status === "waiting";
    if (filter === "document") return task.kind === "document_request";
    if (filter === "safety") return task.origin === "urgent_need";
    return true;
  });
  const selected = visible.find((task) => task.id === selectedId) ?? visible[0] ?? null;

  function createTask() {
    const result = dispatchCaseCommand({
      type: "create_case_task",
      meta: commandMeta(state, "create-case-task"),
      input: {
        kind: "general_task",
        title,
        description,
        owner: "M. Chen",
        priority: "medium",
      },
    });
    if (!result.ok) {
      setMessage(`Task was not accepted: ${result.reason}.`);
      return;
    }
    const created = result.state.caseTasks.at(-1);
    setSelectedId(created?.id ?? null);
    setTitle("");
    setDescription("");
    setMessage(`${created?.id ?? "Task"} saved. Completing tasks does not resolve evidence gaps or export blockers.`);
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
    <div className="grid gap-5">
      <PlanningHeader
        boundary="Tasks are operational reminders. Completing a task does not resolve evidence gaps, confirm document receipt, change candidate review, or clear export blockers."
        description="Canonical browser-session worklist for document requests, source comparisons, and general planning tasks."
        icon={CheckSquare}
        stage="Stage 4 · Planning"
        title="Case Tasks"
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Task filters">
        {[
          ["all", "All"],
          ["open", "Open"],
          ["waiting", "Waiting"],
          ["document", "Document requests"],
          ["safety", "Safety-related"],
        ].map(([value, label]) => (
          <button
            aria-pressed={filter === value}
            className={`rounded-full border px-2.5 py-1 text-xs ${filter === value ? "border-[var(--amber)] bg-[var(--color-warning-subtle)]" : "border-[var(--color-border)]"}`}
            key={value}
            onClick={() => setFilter(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.3fr)_320px]">
        <nav aria-label="Case tasks" className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {visible.length ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {visible.map((task) => (
                <li key={task.id}>
                  <button
                    aria-current={selected?.id === task.id ? "true" : undefined}
                    className={`grid w-full gap-1 border-l-2 p-3 text-left ${selected?.id === task.id ? "border-l-[var(--amber)] bg-[var(--color-surface-subtle)]" : "border-l-transparent hover:bg-[var(--color-surface-subtle)]"}`}
                    onClick={() => setSelectedId(task.id)}
                    type="button"
                  >
                    <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{task.id} · {pretty(task.kind)}</span>
                    <span className="font-semibold">{task.title}</span>
                    <span className="flex flex-wrap gap-1.5">
                      <PlanningChip tone={task.priority === "high" ? "danger" : "warning"}>{pretty(task.priority)}</PlanningChip>
                      <PlanningChip tone={statusTone(task.status)}>{pretty(task.status)}</PlanningChip>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Alert title="No tasks match" tone="neutral">Change filters or create a task.</Alert>
          )}
        </nav>
        {selected ? (
          <article aria-label={`Task detail: ${selected.id}`} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">{selected.id} · {pretty(selected.kind)}</p>
            <h2 className="mt-1 font-serif text-2xl">{selected.title}</h2>
            <p className="mt-2 text-sm">{selected.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <PlanningChip tone={statusTone(selected.status)}>{pretty(selected.status)}</PlanningChip>
              <PlanningChip>{selected.dueDate ? `Operational due ${selected.dueDate}` : "No operational due date"}</PlanningChip>
              <SourceLinkStateBadge source={selected.source} state={state} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="cfn-type-label">Owner</dt><dd>{selected.owner}</dd></div>
              <div><dt className="cfn-type-label">Origin</dt><dd>{pretty(selected.origin)} {selected.originId ? `· ${selected.originId}` : ""}</dd></div>
            </dl>
            <label className="mt-4 grid gap-1 text-xs">
              <span className="cfn-type-label">Task status</span>
              <Select onChange={(event) => updateStatus(selected, event.currentTarget.value as CaseTask["status"])} value={selected.status}>
                {["todo", "in_progress", "waiting", "completed", "cancelled"].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}
              </Select>
            </label>
          </article>
        ) : (
          <Alert title="No selected task" tone="neutral">No task is visible under the current filters.</Alert>
        )}
        <aside className="h-fit rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="font-serif text-lg">Create task</h2>
          <label className="mt-3 grid gap-1 text-sm"><span className="cfn-type-label">Title</span><Input onChange={(event) => setTitle(event.currentTarget.value)} value={title} /></label>
          <label className="mt-3 grid gap-1 text-sm"><span className="cfn-type-label">Description</span><Textarea onChange={(event) => setDescription(event.currentTarget.value)} value={description} /></label>
          <Button className="mt-3 w-full" onClick={createTask} variant="primary">Create task</Button>
          <PlanningResult message={message} />
        </aside>
      </div>
    </div>
  );
}

export function NotesPreview() {
  const { state, dispatchCaseCommand } = useCaseState();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(state.practitionerNotes.find((note) => !note.archived)?.id ?? null);
  const [body, setBody] = useState("");
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const visible = useMemo(
    () =>
      state.practitionerNotes.filter(
        (note) =>
          !note.archived &&
          `${note.id} ${note.body} ${note.linkedEntityIds.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, state.practitionerNotes],
  );
  const selected = visible.find((note) => note.id === selectedId) ?? visible[0] ?? null;
  const selectedNoteEdit = selected ? noteEdits[selected.id] ?? "" : "";

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
    <div className="grid gap-5">
      <PlanningHeader
        boundary="Notes are practitioner commentary. They are not evidence, not audit records, excluded from analysis, and excluded from exports by default."
        description="Canonical browser-session practitioner journal kept separate from evidence and audit history."
        icon={NotebookPen}
        stage="Stage 4 · Planning"
        title="Notes & Journal"
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          <label className="relative">
            <span className="sr-only">Search notes</span>
            <Search aria-hidden="true" className="absolute left-3 top-3 text-[var(--color-ink-muted)]" size={16} />
            <input className="min-h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm" onChange={(event) => setQuery(event.target.value)} placeholder="Search practitioner commentary" type="search" value={query} />
          </label>
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
            <nav aria-label="Practitioner notes" className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {visible.length ? (
                <ul className="divide-y divide-[var(--color-border)]">
                  {visible.map((note) => (
                    <li key={note.id}>
                      <button className={`grid w-full gap-1 border-l-2 p-3 text-left ${selected?.id === note.id ? "border-l-[var(--amber)] bg-[var(--color-surface-subtle)]" : "border-l-transparent hover:bg-[var(--color-surface-subtle)]"}`} onClick={() => setSelectedId(note.id)} type="button">
                        <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{note.id} · {note.visibility}</span>
                        <span className="line-clamp-2 text-sm">{note.body}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <Alert title="No notes match" tone="neutral">Change the search or create a note.</Alert>
              )}
            </nav>
            {selected ? (
              <article aria-label={`Note detail: ${selected.id}`} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">{selected.id} · {noteAuthorLabel(selected)} · {selected.visibility}</p>
                <div className="mt-2 flex flex-wrap gap-1.5"><PlanningChip>Practitioner commentary</PlanningChip><PlanningChip>Not evidence</PlanningChip><PlanningChip>Excluded from export</PlanningChip></div>
                <p className="mt-3 text-sm">{selected.body}</p>
                <label className="mt-4 grid gap-1 text-sm"><span className="cfn-type-label">Edit commentary</span><Textarea onChange={(event) => {
                  const value = event.currentTarget.value;
                  setNoteEdits((drafts) => ({ ...drafts, [selected.id]: value }));
                }} placeholder={selected.body} value={selectedNoteEdit} /></label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={() => updateNote(selected)} variant="primary">Save note edit</Button>
                  <Button onClick={() => archiveNote(selected)} variant="secondary">Archive note</Button>
                </div>
              </article>
            ) : (
              <Alert title="No selected note" tone="neutral">No note is visible under the current search.</Alert>
            )}
          </div>
        </div>
        <aside className="h-fit rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="font-serif text-lg">New note</h2>
          <label className="mt-3 grid gap-1 text-sm"><span className="cfn-type-label">Commentary</span><Textarea onChange={(event) => setBody(event.currentTarget.value)} rows={6} value={body} /></label>
          <Button className="mt-3 w-full" onClick={createNote} variant="primary"><FileQuestion aria-hidden="true" size={15} />Record note</Button>
          <PlanningResult message={message} />
        </aside>
      </div>
    </div>
  );
}

export function PlanningCountProbe() {
  const { state } = useCaseState();
  const counts = derivePlanningDashboardCounts(state);
  return <span>{JSON.stringify(counts)}</span>;
}
