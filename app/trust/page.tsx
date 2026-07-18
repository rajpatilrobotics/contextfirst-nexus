import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { CaseStateProvider } from "../../components/shell/case-state-context";
import { Alert, Card, Separator } from "../../components/ui";
import {
  CaseTrustExperience,
  GuidanceCards,
  SafetyLab,
  SystemCardPanel,
} from "../../features/trust";
import { getTrustPageData } from "../../features/trust/trust-data.server";

export const metadata: Metadata = {
  title: "Trust and Safety | ContextFirst Nexus",
  description:
    "System Card, demo evaluation evidence, guidance provenance, safe audit history, and local-only unsafe-output reporting for ContextFirst Nexus.",
};

const SECTION_LINKS = [
  { href: "#system-card", label: "System Card" },
  { href: "#safety-lab", label: "Safety Lab" },
  { href: "#guidance", label: "Guidance" },
  { href: "#case-session", label: "Audit and report" },
] as const;

export default function TrustPage() {
  const data = getTrustPageData();

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-[var(--color-surface)] focus:px-4 focus:py-2"
        href="#trust-main"
      >
        Skip to Trust and Safety content
      </a>

      <div
        className="border-b border-[var(--color-warning)] bg-[var(--color-warning-subtle)] px-4 py-3 text-sm font-semibold text-[var(--color-warning)]"
        role="note"
      >
        Fictional hackathon demo only. Do not upload, paste, or enter real case, survivor, client, child, credential, or service data.
      </div>

      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link className="inline-flex min-h-11 items-center gap-2 font-semibold" href="/">
            <ArrowLeft aria-hidden="true" size={18} /> ContextFirst Nexus
          </Link>
          <nav aria-label="Trust page sections">
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {SECTION_LINKS.map((link) => (
                <li key={link.href}>
                  <a className="inline-flex min-h-11 items-center text-sm font-semibold" href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid min-w-0 max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 px-4 py-8 sm:px-6 lg:py-12" id="trust-main">
        <section aria-labelledby="trust-heading" className="grid gap-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-start">
            <div className="grid gap-4">
              <p className="cfn-type-label text-[var(--color-brand)]">Trust and Safety</p>
              <h1 className="cfn-type-display" id="trust-heading">Inspect the boundary, provenance, and evidence</h1>
              <p className="cfn-type-body max-w-3xl text-[var(--color-ink-muted)]">
                ContextFirst Nexus is a source-grounded case-preparation workspace for qualified practitioners using one fictional adult fixture. It organizes and suggests; a qualified practitioner makes every consequential decision.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="cfn-control-target inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold !text-white !no-underline hover:bg-[var(--color-brand-hover)]"
                  href="/case/demo/purpose"
                >
                  Open demo case
                </a>
                <a
                  className="cfn-control-target inline-flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
                  href="#safety-lab"
                >
                  Inspect measured evidence
                </a>
              </div>
            </div>

            <Card className="grid gap-3 border-[var(--color-brand)] bg-[var(--color-brand-subtle)]">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="text-[var(--color-brand)]" size={22} />
                <h2 className="cfn-type-heading-3">Public prototype boundary</h2>
              </div>
              <p>Working fictional-data hackathon prototype—not a legal service, production case system, survivor chatbot, reporting channel, emergency service, or validated intervention.</p>
              <p>No trafficking detection, victim identification, legal outcome, certification, endorsement, guaranteed anonymity, or production readiness is claimed.</p>
            </Card>
          </div>

          <Alert title="Affected stakeholder and future pilot" tone="neutral">
            <p className="mt-2">
              The person described in records is the primary affected stakeholder and is not a direct prototype user. Any supervised shadow pilot would first require partner governance, lived-experience input, domestic legal review, privacy and security review, authenticated access, retention and deletion rules, and incident response before real data could be considered.
            </p>
          </Alert>
        </section>

        <Separator />
        <SystemCardPanel card={data.systemCard} />
        <Separator />
        <SafetyLab
          definitions={data.evaluationDefinitions}
          deterministicHarnessResults={data.deterministicHarnessResults}
          measuredResults={data.systemCard.measuredResults}
          reports={data.systemCard.evaluationAdmissionReports}
        />
        <Separator />
        <GuidanceCards pack={data.guidancePack} />
        <Separator />

        <section aria-labelledby="case-session-heading" className="grid min-w-0 gap-5" id="case-session">
          <div className="grid gap-2">
            <p className="cfn-type-label text-[var(--color-brand)]">Case-linked local state</p>
            <h2 className="cfn-type-heading-1" id="case-session-heading">Session provenance, audit, and reporting</h2>
            <p className="cfn-reading-column text-[var(--color-ink-muted)]">
              This area reads only the validated demo case projection stored in this browser session. It performs no service, account, analytics, or external reporting request.
            </p>
          </div>
          <CaseStateProvider>
            <CaseTrustExperience
              checkpointReference={data.checkpointReference}
              providers={data.systemCard.providers}
            />
          </CaseStateProvider>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 text-sm text-[var(--color-ink-muted)]">
          <p>ContextFirst Nexus · fictional source-grounded practitioner demo</p>
          <p>Local legal verification required.</p>
        </div>
      </footer>
    </div>
  );
}
