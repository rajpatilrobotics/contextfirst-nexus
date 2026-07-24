"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertOctagon,
  Ban,
  CheckSquare,
  FileQuestion,
  HandHelping,
  MessageSquare,
  NotebookPen,
  PhoneOff,
  Search,
} from "lucide-react";
import { Alert, Button, Input, Select, Textarea } from "../../components/ui";

type ChipTone = "neutral" | "warning" | "danger" | "success";

function PreviewChip({
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

function PreviewHeader({
  stage,
  title,
  description,
  icon: Icon,
}: {
  stage: string;
  title: string;
  description: string;
  icon: typeof AlertOctagon;
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
      <PreviewBoundary />
    </header>
  );
}

function PreviewBoundary({ children }: { children?: ReactNode }) {
  return (
    <div
      className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[var(--color-warning)] bg-[var(--color-warning-subtle)] p-3 text-sm"
      role="note"
    >
      <Ban aria-hidden="true" className="mt-0.5 shrink-0" size={16} />
      <p>
        <strong>UI preview · not yet connected.</strong>{" "}
        {children ??
          "Bundled fictional entries are for presentation only. Nothing here is saved, transmitted, added to audit history, or included in export."}
      </p>
    </div>
  );
}

const urgentNeeds = [
  {
    id: "UN-01",
    category: "Emergency accommodation",
    description:
      "Synthetic support-provider note indicates possible housing loss within seven days.",
    urgency: "Within 72 hours",
    status: "Open",
    source: "Synthetic DOC-07 support-provider note",
    consent: "Housing referrals permitted; do not contact family members.",
    contact: "SMS weekdays 10:00–17:00",
    assignee: "M. Chen",
    action: "Identify local emergency-accommodation options.",
    followUp: "Within 72 hours",
  },
] as const;

export function UrgentNeedsPreview() {
  return (
    <div className="grid gap-5">
      <PreviewHeader
        description="A compact view of bundled fictional example needs. This preview does not generate a risk score or contact emergency services."
        icon={AlertOctagon}
        stage="Stage 3 · Analysis"
        title="Urgent Needs"
      />
      <Alert title="If a person is in immediate danger" tone="danger">
        Contact appropriate local emergency services outside this workspace. ContextFirst Nexus does not contact emergency services.
      </Alert>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-3">
          {urgentNeeds.map((need) => (
            <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4" key={need.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">{need.id} · bundled synthetic fixture</p>
                  <h2 className="mt-1 font-serif text-xl">{need.category}</h2>
                  <p className="mt-2 text-sm">{need.description}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <PreviewChip tone="danger">{need.urgency}</PreviewChip>
                  <PreviewChip>{need.status}</PreviewChip>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Assigned", need.assignee],
                  ["Information source", need.source],
                  ["Consent / restrictions", need.consent],
                  ["Safe contact", need.contact],
                  ["Required action", need.action],
                  ["Follow-up", need.followUp],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="cfn-type-label">{label}</dt>
                    <dd className="mt-1">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
                <Button disabled variant="secondary">
                  <PhoneOff aria-hidden="true" size={15} />
                  Open referral · not connected
                </Button>
                <span className="text-xs text-[var(--color-ink-muted)]">No provider or person is contacted.</span>
              </div>
            </article>
          ))}
        </div>
        <aside className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="font-serif text-lg">Add a need</h2>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Form preview only</p>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="cfn-type-label">Category</span>
            <Select disabled><option>Emergency accommodation</option></Select>
          </label>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="cfn-type-label">Practitioner description</span>
            <Textarea disabled placeholder="Not yet connected" rows={4} />
          </label>
          <Button className="mt-3 w-full" disabled variant="primary">Record need · unavailable</Button>
        </aside>
      </div>
    </div>
  );
}

const questions = [
  {
    id: "Q-01",
    gap: "GAP-01",
    text: "Could you tell me, in your own words, how the placement was arranged before you travelled?",
    rationale: "Open prompt that does not lead toward a conclusion.",
    sensitivity: "Low",
    citation: "Synthetic DOC-01 · p. 2",
  },
  {
    id: "Q-02",
    gap: "GAP-02",
    text: "Were there documents about work or wages that you were given, kept, or not given?",
    rationale: "Asks about document access without assuming an outcome.",
    sensitivity: "Medium",
    citation: "Synthetic DOC-04 · p. 8",
  },
  {
    id: "Q-03",
    gap: "GAP-04",
    text: "If you feel comfortable, can you describe how you kept in touch with people outside the workplace?",
    rationale: "Uses comfort language and avoids accusatory framing.",
    sensitivity: "High",
    citation: "Synthetic DOC-02 · p. 3",
  },
] as const;

export function InterviewPlannerPreview() {
  const [selectedId, setSelectedId] = useState<string>(questions[0].id);
  const selected = questions.find((question) => question.id === selectedId) ?? questions[0];
  return (
    <div className="grid gap-5">
      <PreviewHeader
        description="Respectful, non-leading planning prompts tied to fictional gap references. These are aids, never a mandatory script."
        icon={MessageSquare}
        stage="Stage 4 · Planning"
        title="Interview Planner"
      />
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-serif text-lg">Session setup · preview</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Purpose", "Clarify recruitment and payment context"],
            ["Interviewer", "M. Chen"],
            ["Language", "Tagalog interpreter requested"],
            ["Accessibility", "Quiet room; extended time"],
            ["Safe contact", "SMS 10:00–17:00; no family calls"],
            ["Consent", "Confirmation required outside this preview"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="cfn-type-label">{label}</dt>
              <dd className="mt-1">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <div className="grid gap-4 lg:grid-cols-[minmax(240px,0.75fr)_minmax(0,1.4fr)]">
        <nav aria-label="Synthetic interview questions" className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <ul className="divide-y divide-[var(--color-border)]">
            {questions.map((question) => (
              <li key={question.id}>
                <button
                  aria-current={selected.id === question.id ? "true" : undefined}
                  className={`grid w-full gap-1 border-l-2 p-3 text-left ${
                    selected.id === question.id
                      ? "border-l-[var(--amber)] bg-[var(--color-surface-subtle)]"
                      : "border-l-transparent"
                  }`}
                  onClick={() => setSelectedId(question.id)}
                  type="button"
                >
                  <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{question.id} · {question.gap}</span>
                  <span className="text-sm font-semibold">{question.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">{selected.id} · addresses {selected.gap}</p>
          <h2 className="mt-2 font-serif text-xl">{selected.text}</h2>
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">{selected.rationale}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <PreviewChip>{selected.citation}</PreviewChip>
            <PreviewChip tone={selected.sensitivity === "High" ? "danger" : selected.sensitivity === "Medium" ? "warning" : "neutral"}>
              Sensitivity: {selected.sensitivity}
            </PreviewChip>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
            {["Keep", "Edit", "Remove", "Inappropriate", "Defer"].map((action) => (
              <Button disabled key={action} variant="secondary">{action}</Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">Question review decisions are not connected or saved.</p>
        </article>
      </div>
      <Alert title="Trauma-informed boundary" tone="neutral">
        Prefer open prompts; do not assume truth or falsity; do not treat uncertainty or inconsistent memory as dishonesty; a person may pause or stop.
      </Alert>
    </div>
  );
}

const referrals = [
  {
    id: "REF-01",
    name: "Fictional Harbor Legal Aid",
    type: "Legal aid",
    coverage: "Region A (demonstration)",
    hours: "Mon–Fri 09:00–17:00",
    languages: "English, Tagalog, Spanish",
    eligibility: "Adults in a forced-criminality matter",
    accessibility: "Wheelchair access; interpreter on request",
    reviewed: "Synthetic directory · 2026-07-15",
  },
  {
    id: "REF-02",
    name: "Fictional Meridian Trauma Support",
    type: "Mental-health support",
    coverage: "Region A (demonstration)",
    hours: "Mon–Sat 10:00–18:00",
    languages: "English, Tagalog",
    eligibility: "Adults; consent required",
    accessibility: "Remote sessions",
    reviewed: "Synthetic directory · 2026-06-30",
  },
  {
    id: "REF-03",
    name: "Fictional Bridgeway Interpreter Network",
    type: "Interpretation",
    coverage: "Multi-region (demonstration)",
    hours: "24/7",
    languages: "Tagalog, Ilocano, Mandarin, Spanish",
    eligibility: "Practitioner-initiated",
    accessibility: "Video relay",
    reviewed: "Synthetic directory · 2026-07-02",
  },
  {
    id: "REF-04",
    name: "Fictional Northline Emergency Housing",
    type: "Emergency accommodation",
    coverage: "Region A (demonstration)",
    hours: "24/7",
    languages: "English",
    eligibility: "Adults facing imminent housing loss",
    accessibility: "Step-free entry",
    reviewed: "Synthetic directory · 2026-07-10",
  },
] as const;

export function ServicesPreview() {
  const categories = ["All", ...new Set(referrals.map((referral) => referral.type))];
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(referrals[0].id);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = referrals.filter(
    (referral) =>
      (category === "All" || referral.type === category) &&
      (!normalizedQuery ||
        [
          referral.name,
          referral.type,
          referral.coverage,
          referral.languages,
          referral.eligibility,
        ].join(" ").toLowerCase().includes(normalizedQuery)),
  );
  const selected =
    visible.find((referral) => referral.id === selectedId) ?? visible[0] ?? null;
  return (
    <div className="grid gap-5">
      <PreviewHeader
        description="Browse fictional service-directory cards while preserving consent and safe-contact boundaries."
        icon={HandHelping}
        stage="Stage 4 · Planning"
        title="Services & Referrals"
      />
      <section
        aria-label="Service preview filters"
        className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 lg:grid-cols-[minmax(0,1fr)_16rem]"
      >
        <label className="relative">
          <span className="sr-only">Search fictional providers</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
            size={15}
          />
          <Input
            aria-label="Search fictional providers"
            className="pl-9"
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search providers, languages, eligibility"
            type="search"
            value={query}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="cfn-type-label">Service category</span>
          <Select
            onChange={(event) => setCategory(event.currentTarget.value)}
            value={category}
          >
            {categories.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </Select>
        </label>
        <p className="text-xs leading-5 text-[var(--color-ink-muted)] lg:col-span-2">
          Region A demonstration data only. Availability is unverified, consent is required outside this preview, safe-contact preferences are not transmitted, and no provider is contacted.
        </p>
      </section>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.4fr)]">
        <nav
          aria-label="Fictional providers"
          className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <div className="border-b border-[var(--color-border)] px-3 py-3">
            <h2 className="font-serif text-base">Providers ({visible.length})</h2>
          </div>
          {visible.length ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {visible.map((referral) => (
                <li key={referral.id}>
                  <button
                    aria-current={selected?.id === referral.id ? "true" : undefined}
                    className={`grid w-full gap-1 border-l-2 px-3 py-3 text-left ${
                      selected?.id === referral.id
                        ? "border-l-[var(--amber)] bg-[var(--color-surface-subtle)]"
                        : "border-l-transparent hover:bg-[var(--color-surface-subtle)]"
                    }`}
                    onClick={() => setSelectedId(referral.id)}
                    type="button"
                  >
                    <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{referral.id} · fictional provider</span>
                    <span className="font-semibold">{referral.name}</span>
                    <span className="text-xs text-[var(--color-ink-muted)]">{referral.type} · {referral.coverage}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Alert title="No fictional providers match" tone="neutral">
              Change the preview filters to show bundled examples.
            </Alert>
          )}
        </nav>

        {selected ? (
          <article
            aria-label={`Selected provider: ${selected.name}`}
            className="min-w-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <PreviewChip tone="warning">Fictional demonstration provider</PreviewChip>
                  <PreviewChip>Availability unverified</PreviewChip>
                  <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{selected.id}</span>
                </div>
                <h2 className="mt-2 font-serif text-2xl">{selected.name}</h2>
                <p className="text-sm text-[var(--color-ink-muted)]">{selected.type} · {selected.coverage}</p>
              </div>
              <Button disabled variant="secondary">Create referral · unavailable</Button>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Hours", selected.hours],
                ["Languages", selected.languages],
                ["Eligibility", selected.eligibility],
                ["Accessibility", selected.accessibility],
                ["Information source", selected.reviewed],
                ["Contact", "Not enabled in this preview"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="cfn-type-label">{label}</dt>
                  <dd className="mt-1">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 grid gap-2 border-t border-[var(--color-border)] pt-3 text-xs leading-5 text-[var(--color-ink-muted)]">
              <p>Consent must be confirmed outside this preview before any real referral or contact workflow.</p>
              <p>Safe-contact details are displayed as fictional examples only. No information is transmitted and no provider is contacted.</p>
              <p>Referral creation is explicitly unavailable in this UI preview.</p>
            </div>
          </article>
        ) : (
          <Alert title="No selected provider" tone="neutral">
            No preview provider is selected because the current filters hide every bundled fictional example.
          </Alert>
        )}
      </div>
    </div>
  );
}

const tasks = [
  ["TASK-01", "Request contract addendum", "GAP-01", "2026-08-05", "High", "To do", "Preview export blocker"],
  ["TASK-02", "Obtain unlocked wage record", "Synthetic DOC-05", "2026-08-01", "High", "Waiting", "Preview export blocker"],
  ["TASK-03", "Review OCR options for travel record", "Synthetic DOC-03", "2026-08-04", "Medium", "In progress", "Operational reminder"],
  ["TASK-04", "Identify accommodation options", "UN-01", "2026-07-25", "High", "In progress", "Safety-related"],
] as const;

export function TasksPreview() {
  const filters = ["All", "Waiting", "Export blockers", "Safety-related"];
  const [filter, setFilter] = useState("All");
  const visible = tasks.filter((task) => {
    if (filter === "Waiting") return task[5] === "Waiting";
    if (filter === "Export blockers") return task[6].includes("blocker");
    if (filter === "Safety-related") return task[6] === "Safety-related";
    return true;
  });
  return (
    <div className="grid gap-5">
      <PreviewHeader
        description="A presentation-only operational worklist. Dates shown here are fictional reminders, not legal deadlines."
        icon={CheckSquare}
        stage="Stage 4 · Planning"
        title="Case Tasks"
      />
      <div className="flex flex-wrap gap-1.5">
        {filters.map((value) => (
          <button
            aria-pressed={filter === value}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              filter === value
                ? "border-[var(--amber)] bg-[var(--color-warning-subtle)]"
                : "border-[var(--color-border)]"
            }`}
            key={value}
            onClick={() => setFilter(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {visible.map((task) => (
          <article className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" key={task[0]}>
            <div>
              <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">{task[0]} · linked {task[2]}</p>
              <h2 className="mt-1 font-semibold">{task[1]}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <PreviewChip tone={task[4] === "High" ? "danger" : "warning"}>{task[4]} priority</PreviewChip>
                <PreviewChip>Due {task[3]}</PreviewChip>
                <PreviewChip>{task[6]}</PreviewChip>
              </div>
            </div>
            <label className="grid gap-1 text-xs">
              <span className="cfn-type-label">Status · not connected</span>
              <Select disabled value={task[5]}><option>{task[5]}</option></Select>
            </label>
          </article>
        ))}
      </div>
      <Button disabled variant="primary">Create task · unavailable</Button>
    </div>
  );
}

const notes = [
  {
    id: "N-01",
    meta: "Review rationale · M. Chen · 2026-07-21 14:22 UTC",
    body: "Deferring acceptance of a synthetic isolation suggestion until the missing fixture pages are available. This commentary is not a finding.",
    linked: "Item OBS-05",
    handoff: false,
  },
  {
    id: "N-02",
    meta: "Safety note · M. Chen · 2026-07-22 09:10 UTC",
    body: "Fictional fixture states consent for housing referral research and a no-family-contact restriction.",
    linked: "Synthetic DOC-07 · UN-01",
    handoff: true,
  },
  {
    id: "N-03",
    meta: "Case strategy · M. Chen · 2026-07-22 11:02 UTC",
    body: "Preserve both conflicting fictional arrival dates rather than selecting one without source resolution.",
    linked: "GAP-03",
    handoff: false,
  },
] as const;

export function NotesPreview() {
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () =>
      notes.filter((note) =>
        `${note.id} ${note.meta} ${note.body} ${note.linked}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  return (
    <div className="grid gap-5">
      <PreviewHeader
        description="Practitioner reasoning and operational context shown separately from source evidence and canonical audit events."
        icon={NotebookPen}
        stage="Stage 4 · Planning"
        title="Notes & Journal"
      />
      <Alert title="Commentary is not evidence" tone="neutral">
        These bundled synthetic notes do not enter canonical candidates, audit history, export readiness, or handoff content.
      </Alert>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-3">
          <label className="relative">
            <span className="sr-only">Search preview notes</span>
            <Search aria-hidden="true" className="absolute left-3 top-3 text-[var(--color-ink-muted)]" size={16} />
            <input
              className="min-h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search synthetic preview notes"
              type="search"
              value={query}
            />
          </label>
          {visible.map((note) => (
            <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4" key={note.id}>
              <p className="font-mono text-[10px] text-[var(--color-ink-muted)]">{note.id} · {note.meta}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <PreviewChip>Commentary</PreviewChip>
                <PreviewChip>Visibility: team</PreviewChip>
                {note.handoff ? <PreviewChip tone="warning">Fixture says handoff; not connected here</PreviewChip> : null}
              </div>
              <p className="mt-3 text-sm">{note.body}</p>
              <p className="mt-3 border-t border-[var(--color-border)] pt-2 text-xs text-[var(--color-ink-muted)]">Preview link: {note.linked}</p>
            </article>
          ))}
          {!visible.length ? <p className="text-sm text-[var(--color-ink-muted)]">No preview notes match this search.</p> : null}
        </div>
        <aside className="h-fit rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="font-serif text-lg">New note</h2>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Not yet connected</p>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="cfn-type-label">Type</span>
            <Select disabled><option>Practitioner observation</option></Select>
          </label>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="cfn-type-label">Commentary</span>
            <Textarea disabled placeholder="Note persistence is unavailable" rows={6} />
          </label>
          <Button className="mt-3 w-full" disabled variant="primary">
            <FileQuestion aria-hidden="true" size={15} />
            Record note · unavailable
          </Button>
        </aside>
      </div>
    </div>
  );
}
