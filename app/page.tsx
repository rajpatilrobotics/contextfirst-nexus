import {
  ArrowRight,
  Ban,
  Compass,
  Eye,
  FileText,
  GitBranch,
  Layers3,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { MarketingShell } from "../components/marketing";

const capabilities = [
  {
    icon: FileText,
    title: "Truthful source health",
    description:
      "Every source declares what was processed, what remains unreadable, and which limitations require human attention.",
  },
  {
    icon: Layers3,
    title: "Structured analysis",
    description:
      "Candidate observations retain exact citations, provenance, contradictions, and review status.",
  },
  {
    icon: Compass,
    title: "Evidence gaps",
    description:
      "Missing, conflicting, and insufficient information stays visible instead of becoming a silent conclusion.",
  },
  {
    icon: Eye,
    title: "Consequential human review",
    description:
      "The system organizes and suggests. A qualified practitioner decides what is accepted, changed, or rejected.",
  },
  {
    icon: GitBranch,
    title: "Dependency-aware context",
    description:
      "Withdrawing support invalidates only the reachable downstream record and immediately changes readiness.",
  },
  {
    icon: LockKeyhole,
    title: "Purpose-bound handoff",
    description:
      "The Export Gate fails closed until citation, coverage, privacy, review, and minimum-necessity checks pass.",
  },
] as const;

const workflow = [
  ["Purpose", "Record authority, recipient, jurisdiction, exclusions, and intended handoff."],
  ["Documents", "Inspect the bundled packet, source health, coverage, and masking."],
  ["Analysis", "Review source-linked candidate observations and unresolved context."],
  ["Planning", "Turn confirmed gaps into accountable practitioner actions in a later slice."],
  ["Review", "Inspect relationships, chronology, limitations, and dependency changes."],
  ["Export", "Create a full or minimum-necessary handoff only when every gate passes."],
] as const;

export default function Home() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(1000px 480px at 10% -10%, color-mix(in oklab, var(--amber) 13%, transparent), transparent 62%), radial-gradient(800px 420px at 96% 12%, color-mix(in oklab, var(--sage) 11%, transparent), transparent 64%)",
          }}
        />
        <div
          aria-hidden="true"
          className="cfn-editorial-grid pointer-events-none absolute inset-0 -z-10 opacity-50"
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.14fr_0.86fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_78%,transparent)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--amber)]" />
              For qualified legal and anti-trafficking practitioners
            </p>
            <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Source-grounded case preparation for{" "}
              <span className="relative inline-block italic text-[var(--slate-ink)]">
                forced-criminality
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-1 h-1.5 rounded-full bg-[color-mix(in_oklab,var(--amber)_45%,transparent)]"
                />
              </span>{" "}
              matters.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-ink-muted)]">
              Understand what the fictional case packet documents, what remains uncertain, and
              what requires human review before a safe handoff.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                aria-label="Start demonstration"
                className="cfn-control-target group inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand)] px-5 py-3 font-semibold !text-white no-underline shadow-sm hover:bg-[var(--color-brand-hover)] hover:shadow-md"
                href="/dashboard"
              >
                Start demonstration
                <ArrowRight
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                  size={17}
                />
              </a>
              <a
                className="cfn-control-target inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
                href="/trust"
              >
                <ShieldCheck aria-hidden="true" size={17} />
                How safety works
              </a>
              <a
                className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[var(--color-ink-muted)] underline-offset-4 hover:text-[var(--color-ink)]"
                href="/dashboard"
              >
                Open case dashboard
              </a>
            </div>
            <p className="mt-5 max-w-xl text-xs leading-5 text-[var(--color-ink-muted)]">
              The complete judge workflow uses only fictional adult fixture CFN-DEMO-001.
              Do not upload, paste, or enter real case data.
            </p>
          </div>

          <aside className="relative" aria-label="Core product promise">
            <div
              aria-hidden="true"
              className="absolute -inset-5 -z-10 rounded-3xl bg-[color-mix(in_oklab,var(--amber)_12%,transparent)] blur-2xl"
            />
            <div className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_92%,transparent)] p-6 shadow-[var(--shadow-elevated)] backdrop-blur">
              <div className="flex items-baseline justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
                <span>Core promise</span>
                <span>REF-2024-0047-SYN</span>
              </div>
              <blockquote className="mt-4 font-serif text-2xl leading-tight sm:text-[28px]">
                “Context <em className="not-italic text-[var(--amber)]">before</em> conclusion.”
              </blockquote>
              <div className="mt-6 grid gap-2.5 text-sm sm:grid-cols-2">
                {[
                  "Exact sources visible",
                  "Unknown preserved",
                  "Contradictions retained",
                  "Human review consequential",
                  "Replay clearly labelled",
                  "Export fails closed",
                ].map((promise) => (
                  <div
                    className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2"
                    key={promise}
                  >
                    {promise}
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-[var(--color-border)] pt-4 text-xs leading-5 text-[var(--color-ink-muted)]">
                A workbench, not an oracle. It does not decide trafficking status,
                credibility, guilt, eligibility, priority, or case strength.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
              Designed for
            </p>
            <h2 className="mt-2 text-2xl">Qualified practitioners preparing complex cases.</h2>
            <p className="mt-4 max-w-xl leading-7 text-[var(--color-ink-muted)]">
              Legal-aid and defence practitioners, trained NGO caseworkers, victim-support
              practitioners, supervisors, and designated reviewers.
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
              Explicitly not
            </p>
            <h2 className="mt-2 text-2xl">A hotline, investigation platform, or AI lawyer.</h2>
            <p className="mt-4 flex max-w-xl items-start gap-2 leading-7 text-[var(--color-ink-muted)]">
              <Ban aria-hidden="true" className="mt-1 shrink-0 text-[var(--rust)]" size={17} />
              Not survivor-facing crisis support, automated legal advice, credibility scoring,
              law-enforcement intake, or a replacement for safeguarding professionals.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8" aria-labelledby="capabilities-heading">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
          Core capabilities
        </p>
        <h2 className="mt-2 text-3xl" id="capabilities-heading">
          Six ways the workspace holds context steady.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, description }, index) => (
            <article
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_1px_0_0_var(--color-border)]"
              key={title}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] text-[var(--slate-ink)]">
                  <Icon aria-hidden="true" size={18} />
                </span>
                <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--color-ink-muted)]">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-muted)]">
            Six-stage workflow
          </p>
          <h2 className="mt-2 text-3xl">From stated purpose to safe handoff.</h2>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {workflow.map(([stage, description], index) => (
              <li
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)] p-4"
                key={stage}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand)] font-mono text-[10px] text-white">
                    {index + 1}
                  </span>
                  <span className="font-serif text-lg">{stage}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--color-ink-muted)]">{description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
            <p className="font-serif text-2xl">Explore the complete fictional M. Chen workflow.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-muted)]">
              The Dashboard separates the one functional judge case from read-only case summaries.
            </p>
            <a
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand)] px-5 py-3 font-semibold !text-white no-underline hover:bg-[var(--color-brand-hover)]"
              href="/dashboard"
            >
              Open Case Dashboard
              <ArrowRight aria-hidden="true" size={17} />
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
