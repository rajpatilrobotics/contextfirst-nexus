import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export function MarketingShell({
  children,
  landing = false,
}: {
  children: ReactNode;
  landing?: boolean;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 -translate-y-0.5 rounded-full bg-[color:var(--amber)]"
            />
            <span className="font-serif text-lg tracking-tight">
              ContextFirst <span className="italic text-muted-foreground">Nexus</span>
            </span>
          </Link>
          <nav aria-label="Primary" className="flex shrink-0 items-center gap-1 text-sm">
            {!landing ? (
              <Link
                href="/dashboard"
                className="hidden rounded px-3 py-1.5 text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                Case Dashboard
              </Link>
            ) : null}
            <Link
              href="/trust"
              className="rounded px-3 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Trust &amp; Safety
            </Link>
          </nav>
        </div>
        <div className="border-t border-[color-mix(in_oklab,var(--amber)_40%,transparent)] bg-[color-mix(in_oklab,var(--amber)_10%,transparent)] px-6 py-1 text-center text-[11px] text-foreground/80">
          Browser-local fictional demonstration only. Do not enter real or private case
          data. No source documents are transmitted externally.
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="mt-24 border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-8 px-6 py-10 text-sm">
          <div className="max-w-md">
            <div className="font-serif text-lg">ContextFirst Nexus</div>
            <p className="mt-2 text-muted-foreground">
              A source-grounded case-preparation workspace for qualified practitioners.
              Browser-local fictional demonstration.
            </p>
          </div>
          <div className="flex flex-col gap-1 text-muted-foreground">
            <Link
              href="/trust"
              className="inline-flex items-center gap-1.5 hover:text-foreground"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Trust &amp; Safety
            </Link>
            {!landing ? (
              <Link href="/dashboard" className="hover:text-foreground">
                Case Dashboard
              </Link>
            ) : null}
            <span className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em]">
              Demonstration build · 2026
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
