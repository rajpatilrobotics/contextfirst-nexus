import Link from "next/link";
import {
  Ban,
  Compass,
  Eye,
  FileText,
  GitBranch,
  Layers,
  Lock,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MarketingShell } from "../components/marketing";

export default function LandingPage() {
  return (
    <MarketingShell landing>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(1200px 500px at 15% -10%, color-mix(in oklab, var(--amber) 10%, transparent), transparent 60%), radial-gradient(900px 400px at 95% 10%, color-mix(in oklab, var(--sage) 10%, transparent), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--border) 60%, transparent) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
        />

        <div className="mx-auto max-w-7xl px-6 pt-16 pb-20 sm:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--amber)]" />
                For qualified legal &amp; anti-trafficking practitioners
              </div>
              <h1 className="mt-5 font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Source-grounded case preparation for{" "}
                <span className="relative inline-block italic text-[color:var(--slate-ink)]">
                  forced-criminality
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-1 h-[6px] rounded-full"
                    style={{
                      background:
                        "color-mix(in oklab, var(--amber) 45%, transparent)",
                    }}
                  />
                </span>{" "}
                matters.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Understand what the case packet documents, what remains uncertain,
                and what requires human review — before a safe handoff.
              </p>
              <p className="mt-6 max-w-md text-xs text-muted-foreground">
                Browser-local fictional demonstration. Do not enter real or private
                case data, and no source documents are transmitted externally.
              </p>
            </div>

            <aside className="relative">
              <div
                aria-hidden
                className="absolute -inset-4 -z-10 rounded-3xl opacity-60 blur-2xl"
                style={{
                  background:
                    "color-mix(in oklab, var(--amber) 12%, transparent)",
                }}
              />
              <div className="rounded-2xl border border-border bg-card/90 p-6 shadow-[0_1px_0_0_var(--border),0_20px_60px_-30px_color-mix(in_oklab,var(--ink)_45%,transparent)] backdrop-blur">
                <div className="flex items-baseline justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Core promise
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    REF-2024-0047-SYN
                  </div>
                </div>
                <blockquote className="mt-3 font-serif text-2xl leading-tight sm:text-[26px]">
                  &ldquo;Context{" "}
                  <em className="text-[color:var(--amber)] not-italic">before</em>{" "}
                  conclusion.&rdquo;
                </blockquote>
                <div className="mt-5 grid grid-cols-2 gap-2.5 text-xs">
                  {[
                    ["Exact sources visible", FileText],
                    ["Unknown preserved", Eye],
                    ["Contradictions kept", GitBranch],
                    ["Human review consequential", ShieldCheck],
                    ["Machine assistance never silent", Sparkles],
                    ["Export fails closed", Lock],
                  ].map(([label, Icon]) => {
                    const PromiseIcon = Icon as typeof FileText;
                    return (
                      <div
                        key={label as string}
                        className="flex items-center gap-2 rounded-md border border-border/70 bg-background px-2.5 py-2 transition hover:border-foreground/30"
                      >
                        <PromiseIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{label as string}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                  A workbench, not an oracle. The system does not decide trafficking
                  status, credibility, guilt, or eligibility.
                </div>
              </div>
            </aside>
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md"
            >
              Start Demonstration
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-2">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Who it is for
            </div>
            <h2 className="mt-2 font-serif text-2xl">
              Qualified practitioners preparing complex cases.
            </h2>
            <ul className="mt-4 space-y-1.5 text-sm text-foreground/90">
              {[
                "Legal-aid lawyers & defence practitioners",
                "Public defenders",
                "Trained anti-trafficking practitioners",
                "NGO caseworkers",
                "Victim-support practitioners",
                "Supervisors & designated reviewers",
              ].map((role) => (
                <li key={role} className="flex items-start gap-2">
                  <span className="mt-1 h-1 w-1 rounded-full bg-foreground/40" />
                  <span>{role}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Who it is not for
            </div>
            <h2 className="mt-2 font-serif text-2xl">
              Never used as a hotline, oracle, or investigative tool.
            </h2>
            <ul className="mt-4 space-y-1.5 text-sm text-foreground/90">
              {[
                "Not a survivor-facing crisis service",
                "Not a law-enforcement investigation platform",
                "Not an AI lawyer or legal decision-maker",
                "Not a credibility or risk-scoring system",
                "Not a replacement for safeguarding professionals",
              ].map((boundary) => (
                <li key={boundary} className="flex items-start gap-2">
                  <Ban className="mt-0.5 h-3.5 w-3.5 text-[color:var(--rust)]" />
                  <span>{boundary}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Core capabilities
            </div>
            <h2 className="mt-2 font-serif text-3xl">
              Six ways the workspace holds context steady.
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              i: FileText,
              t: "Truthful Source Health",
              d: "Every document declares what was extracted, what needed OCR, and which pages remain unreadable or missing. Nothing is silently pretended-processed.",
            },
            {
              i: Layers,
              t: "Structured Analysis",
              d: "Candidate observations arrive with exact citations, provenance, contradictions, and dependencies. A suggestion is never a finding.",
            },
            {
              i: Compass,
              t: "Evidence Gaps",
              d: "Missing, conflicting, insufficient, and unprocessed evidence become an accountable next-action plan — never used as proof an event did not occur.",
            },
            {
              i: Eye,
              t: "Trauma-Informed Planning",
              d: "Draft respectful, non-leading follow-up questions tied to gaps, with sensitivity notes and pause guidance.",
            },
            {
              i: GitBranch,
              t: "Evidence Integrity Map",
              d: "See recruitment, movement, control, compelled tasks, alleged conduct, and protection needs — with relationships and limitations exposed.",
            },
            {
              i: Send,
              t: "Purpose-Bound Handoff",
              d: "The Export Gate refuses unsafe or excessive disclosure. Handoffs carry declared purpose, minimum scope, and preserved limitations.",
            },
          ].map(({ i: Icon, t, d }, index) => (
            <article
              key={t}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_12px_30px_-18px_color-mix(in_oklab,var(--ink)_50%,transparent)]"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px opacity-0 transition group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(to right, transparent, color-mix(in oklab, var(--amber) 60%, transparent), transparent)",
                }}
              />
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-[color:var(--slate-ink)]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">
                  0{index + 1}
                </div>
              </div>
              <h3 className="mt-4 font-serif text-lg">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Six-stage workflow
            </div>
            <h2 className="mt-2 font-serif text-3xl">
              From packet to purpose-bound handoff.
            </h2>
          </div>
          <ol className="relative grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-[22px] hidden h-px lg:block"
              style={{
                background:
                  "linear-gradient(to right, transparent, var(--border) 8%, var(--border) 92%, transparent)",
              }}
            />
            {["Purpose", "Documents", "Analysis", "Planning", "Review", "Export"].map(
              (stage, index) => (
                <li
                  key={stage}
                  className="relative rounded-lg border border-border bg-background p-4 transition hover:border-foreground/25"
                >
                  <div className="flex items-center gap-2">
                    <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary font-mono text-[10px] text-primary-foreground ring-4 ring-[color:var(--background)]">
                      {index + 1}
                    </span>
                    <span className="font-serif text-lg">{stage}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {
                      [
                        "Record the authorized purpose and acknowledgements.",
                        "Declare what each source actually documents.",
                        "Review candidate observations with citations and limitations.",
                        "Plan interviews, referrals, and tasks — trauma-informed.",
                        "Inspect the Evidence Integrity Map and timeline.",
                        "Pass the Export Gate — or don’t, and see why.",
                      ][index]
                    }
                  </p>
                </li>
              ),
            )}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--sage)]" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Assists with
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              "Organizing source-linked candidate observations",
              "Suggesting evidence gaps and follow-up actions",
              "Supporting chronology organization",
              "Identifying possible contradictions for review",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-[color:var(--sage)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--rust)]" />
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Prohibited from
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              "Determining trafficking status",
              "Judging credibility or guilt",
              "Determining legal eligibility",
              "Recommending prosecution or sentence",
              "Replacing practitioner judgment",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Ban className="mt-0.5 h-3.5 w-3.5 text-[color:var(--rust)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-border bg-background">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 md:grid-cols-4">
          {[
            [
              ShieldCheck,
              "Human oversight",
              "A machine suggestion never silently becomes a finding.",
            ],
            [
              FileText,
              "Source citations",
              "Every material observation links to an exact page.",
            ],
            [
              ScrollText,
              "Synthetic evaluation",
              "A held-out challenge set with planted errors is shown in Trust & Safety.",
            ],
            [
              Lock,
              "No external transmission",
              "The bundled replay does not transmit case sources to a provider.",
            ],
          ].map(([Icon, title, description]) => {
            const TrustIcon = Icon as typeof FileText;
            return (
              <div key={title as string} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-[color:var(--slate-ink)]">
                  <TrustIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-serif text-base">{title as string}</div>
                  <div className="text-xs leading-relaxed text-muted-foreground">
                    {description as string}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(600px 240px at 50% 20%, color-mix(in oklab, var(--amber) 12%, transparent), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-serif text-4xl leading-tight">
            Begin with an empty browser-local case list.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Create a fictional case, record its Purpose Brief, and reopen the
            independent workspace after navigation or reload.
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              href="/trust"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm transition hover:bg-muted"
            >
              Read the system card
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
