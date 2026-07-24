import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-control)] focus:bg-[var(--color-surface)] focus:px-4 focus:py-2"
        href="#main-content"
      >
        Skip to main content
      </a>
      <div
        className="border-b border-[color-mix(in_oklab,var(--amber)_42%,transparent)] bg-[color-mix(in_oklab,var(--amber)_11%,transparent)] px-4 py-2 text-center text-xs text-[var(--color-ink)]"
        role="note"
      >
        <strong>Bundled fictional adult fixture only.</strong>{" "}
        Do not enter real case data. ContextFirst Nexus is a practitioner workbench, not a decision-maker.
      </div>
      <header className="border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_88%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <a
            className="inline-flex items-baseline gap-2 text-[var(--color-ink)] no-underline"
            href="/"
          >
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 -translate-y-px rounded-full bg-[var(--amber)]"
            />
            <span className="font-serif text-lg font-semibold">
              ContextFirst <em className="font-normal text-[var(--color-ink-muted)]">Nexus</em>
            </span>
          </a>
          <nav aria-label="Primary navigation">
            <ul className="flex items-center gap-2 text-sm">
              <li>
                <a
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-3 font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
                  href="/dashboard"
                >
                  Case Dashboard
                </a>
              </li>
              <li>
                <a
                  className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 font-semibold text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-subtle)]"
                  href="/trust"
                >
                  <ShieldCheck aria-hidden="true" size={16} />
                  Trust &amp; Safety
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-[var(--color-ink-muted)] sm:px-8">
          <p>ContextFirst Nexus · Responsible-AI hackathon demonstration</p>
          <p>Source-grounded. Human-reviewed. Purpose-bound.</p>
        </div>
      </footer>
    </div>
  );
}
