"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AnalyzeAvailabilityResponseSchema,
  type CasePurposeBrief,
} from "../../lib/contracts";
import {
  findBrowserCase,
  loadBrowserCaseRegistry,
  persistBrowserCaseRegistry,
  saveBrowserCasePurpose,
  type BrowserCaseRecord,
} from "../../lib/cases";
import { BrowserCaseShell } from "../../components/shell/browser-case-shell";
import {
  Chip,
  DemoOnlyNotice,
  SectionTitle,
} from "../../components/lovable/nexus-ui";
import { Alert, Skeleton } from "../../components/ui";
import { AnalysisServiceUnavailable } from "../analysis/provider-recovery";
import {
  resolveReplayAnalysisAvailability,
  type ReplayAnalysisAvailability,
} from "../analysis/provider-selection";
import { CasePurposeBriefForm } from "./case-purpose-brief-form";

export function BrowserCasePurposeWorkspace({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<BrowserCaseRecord | null>(null);
  const [caseState, setCaseState] = useState<"loading" | "ready" | "missing">(
    "loading",
  );
  const [caseError, setCaseError] = useState<string | null>(null);
  const [analysisAvailability, setAnalysisAvailability] =
    useState<ReplayAnalysisAvailability | null>(null);
  const [availabilityState, setAvailabilityState] = useState<
    "loading" | "ready" | "error"
  >("loading");

  useEffect(() => {
    const loaded = loadBrowserCaseRegistry(window.localStorage);
    if (!loaded.ok) {
      persistBrowserCaseRegistry(window.localStorage, loaded.registry);
      setCaseError(loaded.reason);
    }
    const current = findBrowserCase(loaded.registry, caseId);
    setRecord(current);
    setCaseState(current ? "ready" : "missing");
  }, [caseId]);

  const loadAvailability = useCallback(async () => {
    setAvailabilityState("loading");
    try {
      const response = await fetch("/api/analyze", {
        method: "GET",
        cache: "no-store",
      });
      const parsed = AnalyzeAvailabilityResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) throw new Error("invalid_availability_projection");
      setAnalysisAvailability(
        resolveReplayAnalysisAvailability(parsed.data.options),
      );
      setAvailabilityState("ready");
    } catch {
      setAnalysisAvailability(null);
      setAvailabilityState("error");
    }
  }, []);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  async function savePurpose(brief: CasePurposeBrief) {
    const loaded = loadBrowserCaseRegistry(window.localStorage);
    if (!loaded.ok) return loaded.reason;
    const saved = saveBrowserCasePurpose(loaded.registry, caseId, brief);
    if (!saved.ok) return saved.reason;
    const persisted = persistBrowserCaseRegistry(
      window.localStorage,
      saved.registry,
    );
    if (!persisted.ok) return persisted.reason;
    setRecord(saved.record);
    router.push(`/case/${caseId}/documents`);
    return null;
  }

  if (caseState === "loading") {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Skeleton label="Loading browser-local case" />
        </div>
      </div>
    );
  }

  if (caseState === "missing" || !record) {
    return (
      <div className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Browser-local case
          </div>
          <h1 className="mt-2 font-serif text-2xl">Case not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This case is not present in this browser. No legacy demonstration data was
            substituted.
          </p>
          {caseError ? (
            <p className="mt-3 text-sm text-[color:var(--rust)]" role="alert">
              {caseError}
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

  const replayOption =
    analysisAvailability?.status === "ready"
      ? analysisAvailability.option
      : null;

  return (
    <BrowserCaseShell record={record}>
      <div className="space-y-6">
        <SectionTitle
          description="Record why the review is being performed before any later stage. All fields are browser-local and demonstration-only."
          eyebrow="Stage 1 · Intake"
          title="Purpose Brief"
        />

        {caseError ? (
          <Alert title="Browser storage was reset safely" tone="warning">
            <p>{caseError}</p>
          </Alert>
        ) : null}

        {availabilityState === "loading" ? (
          <Skeleton label="Loading analysis availability" />
        ) : null}
        {availabilityState === "error" ? (
          <AnalysisServiceUnavailable onRetry={() => void loadAvailability()} />
        ) : null}
        {availabilityState === "ready" &&
        analysisAvailability?.status === "unavailable" ? (
          <AnalysisServiceUnavailable />
        ) : null}

        {availabilityState !== "loading" ? (
          <CasePurposeBriefForm
            analysisOption={replayOption}
            caseId={record.id}
            disabled={!replayOption}
            initialBrief={record.purposeBrief}
            key={`${record.purposeBrief?.id ?? "new"}-${record.purposeBrief?.revision ?? 0}-${replayOption?.releaseConfigurationId ?? "unavailable"}`}
            onSave={savePurpose}
            purposeBriefId={`PURPOSE-${record.id}`}
          />
        ) : null}

        <section
          aria-label="Browser-local workspace summary"
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
            <Chip tone="mute">{record.displayReference}</Chip>
            <span className="text-sm font-medium">{record.personAlias}</span>
            <span className="text-xs text-muted-foreground">
              Independent browser-local case · no fixture records
            </span>
          </div>
          <DemoOnlyNotice>
            Purpose persists in this browser. Documents opens with an empty source
            list; upload and processing are not connected yet. Analysis and later
            stages remain unavailable.
          </DemoOnlyNotice>
        </section>

        {record.purposeBrief?.status === "complete" ? (
          <Alert title="Saved purpose is complete">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="max-w-2xl">
                Revision {record.purposeBrief.revision} is saved only for{" "}
                {record.displayReference}. Reload or return from the Dashboard to
                continue editing it.
              </p>
              <Link
                className="min-h-9 inline-flex shrink-0 items-center justify-center rounded-md border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold !text-white hover:bg-[var(--color-brand-hover)]"
                href={`/case/${record.id}/documents`}
              >
                Continue to Documents
              </Link>
            </div>
          </Alert>
        ) : null}
      </div>
    </BrowserCaseShell>
  );
}
