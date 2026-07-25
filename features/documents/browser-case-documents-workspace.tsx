"use client";

import Link from "next/link";
import { FileText, Lock, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { BrowserCaseShell } from "../../components/shell/browser-case-shell";
import {
  Chip,
  DemoOnlyNotice,
  SectionTitle,
} from "../../components/lovable/nexus-ui";
import { Alert, Skeleton } from "../../components/ui";
import {
  findBrowserCase,
  loadBrowserCaseRegistry,
  persistBrowserCaseRegistry,
  type BrowserCaseRecord,
} from "../../lib/cases";

const DOCUMENT_STEPS = [
  [1, "Choose PDFs"],
  [2, "Process locally"],
  [3, "Required checks"],
  [4, "Start analysis"],
] as const;

export function BrowserCaseDocumentsWorkspace({ caseId }: { caseId: string }) {
  const [record, setRecord] = useState<BrowserCaseRecord | null>(null);
  const [loadState, setLoadState] = useState<
    "loading" | "missing" | "ready"
  >("loading");
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadBrowserCaseRegistry(window.localStorage);
    if (!loaded.ok) {
      persistBrowserCaseRegistry(window.localStorage, loaded.registry);
      setStorageError(loaded.reason);
    }
    const current = findBrowserCase(loaded.registry, caseId);
    setRecord(current);
    setLoadState(current ? "ready" : "missing");
  }, [caseId]);

  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Skeleton label="Loading browser-local Documents" />
        </div>
      </div>
    );
  }

  if (loadState === "missing" || !record) {
    return (
      <div className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Browser-local case
          </div>
          <h1 className="mt-2 font-serif text-2xl">Case not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This case is not present in this browser. No legacy documents or
            demonstration records were substituted.
          </p>
          {storageError ? (
            <p className="mt-3 text-sm text-[color:var(--rust)]" role="alert">
              {storageError}
            </p>
          ) : null}
          <Link
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
            href="/dashboard"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const purposeComplete = record.purposeBrief?.status === "complete";

  return (
    <BrowserCaseShell activeStage="documents" record={record}>
      <div className="space-y-6">
        <SectionTitle
          description="Every source declares what was extracted, what needs OCR, and what remains unreadable. Nothing is silently pretended-processed."
          eyebrow="Stage 2 · Intake"
          title="Documents & Source Health"
        />

        {storageError ? (
          <Alert title="Browser storage was reset safely" tone="warning">
            <p>{storageError}</p>
          </Alert>
        ) : null}

        <nav aria-label="Document preparation progress">
          <ol className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {DOCUMENT_STEPS.map(([step, label]) => (
              <li
                aria-current={step === 1 ? "step" : undefined}
                className={`flex items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-sm ${
                  step === 1
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] font-semibold"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)]"
                }`}
                key={step}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    step === 1
                      ? "bg-[var(--color-brand)] text-white"
                      : "bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]"
                  }`}
                >
                  {step}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
        </nav>

        {!purposeComplete ? (
          <Alert title="Purpose is required" tone="warning">
            <p>
              Complete the{" "}
              <Link
                className="font-semibold underline"
                href={`/case/${record.id}/purpose`}
              >
                Purpose Brief
              </Link>{" "}
              before document intake can begin.
            </p>
          </Alert>
        ) : null}

        <section
          aria-labelledby="empty-packet-heading"
          className="grid gap-4 lg:grid-cols-[380px_1fr]"
        >
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border p-3">
              <h2 className="font-serif text-base" id="empty-packet-heading">
                Packet (0)
              </h2>
              <Chip tone="mute">Empty</Chip>
            </div>
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-serif text-lg">No documents yet</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                This independent case starts empty. No bundled or legacy fixture
                documents were copied into it.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Source health
                </div>
                <h2 className="mt-1 font-serif text-xl">
                  No source selected
                </h2>
              </div>
              <Chip tone="mute">Not processed</Chip>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border bg-background p-3">
                <dt className="text-xs text-muted-foreground">PDFs</dt>
                <dd className="mt-1 font-serif text-xl">0</dd>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <dt className="text-xs text-muted-foreground">
                  Readable pages
                </dt>
                <dd className="mt-1 font-serif text-xl">0</dd>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <dt className="text-xs text-muted-foreground">Coverage</dt>
                <dd className="mt-1">Not evaluated</dd>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <dt className="text-xs text-muted-foreground">Privacy masking</dt>
                <dd className="mt-1">Not started</dd>
              </div>
            </dl>

            <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/30 p-5 text-center">
              <UploadCloud
                className="mx-auto h-6 w-6 text-muted-foreground"
                aria-hidden="true"
              />
              <button
                className="mt-3 inline-flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-border bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground"
                disabled
                type="button"
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                Upload PDFs — unavailable
              </button>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Upload and browser-local processing are not connected to
                browser-created cases in this slice.
              </p>
            </div>
          </div>
        </section>

        <DemoOnlyNotice>
          this page reflects the current independent case and contains no fixture
          sources. Document intake, processing, coverage, masking, and analysis
          controls are intentionally unavailable.
        </DemoOnlyNotice>
      </div>
    </BrowserCaseShell>
  );
}
