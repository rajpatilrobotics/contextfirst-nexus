"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BrowserCaseShell } from "../../components/shell/browser-case-shell";
import { CaseStateProvider } from "../../components/shell";
import { Alert, Skeleton } from "../../components/ui";
import {
  InterviewPlannerPreview,
  NotesPreview,
  ServicesPreview,
  TasksPreview,
  UrgentNeedsPreview,
} from "../previews";
import {
  EvidenceGapsWorkspace,
  EvidenceIntegrityWorkspace,
  TimelineWorkspace,
} from "../review/destinations";
import { ExportWorkspace } from "../export";
import { AuditWorkspace } from "../trust";
import { browserAnalysisSnapshotMatchesRecordMetadata } from "../../lib/analysis/freshness";
import {
  findBrowserCase,
  loadBrowserCaseRegistry,
  type BrowserCaseRecord,
} from "../../lib/cases";
import {
  browserCaseAnalysisStore,
  type BrowserCaseAnalysisStore,
} from "../../lib/cases/browser-case-analysis-store";
import type { CaseState } from "../../lib/contracts";

type BrowserAnalysisDestination =
  | "audit"
  | "evidence-gaps"
  | "export"
  | "interview"
  | "nexus"
  | "notes"
  | "services"
  | "tasks"
  | "timeline"
  | "urgent-needs";

export function BrowserCaseCurrentAnalysisWorkspace({
  activeDestination,
  analysisStore = browserCaseAnalysisStore,
  caseId,
}: {
  activeDestination: BrowserAnalysisDestination;
  analysisStore?: BrowserCaseAnalysisStore;
  caseId: string;
}) {
  const [record, setRecord] = useState<BrowserCaseRecord | null>(null);
  const [state, setState] = useState<CaseState | null>(null);
  const [status, setStatus] = useState<
    "loading" | "missing" | "not_started" | "stale" | "ready"
  >("loading");
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const registry = loadBrowserCaseRegistry(window.localStorage);
      const current = findBrowserCase(registry.registry, caseId);
      if (!current) {
        if (!cancelled) setStatus("missing");
        return;
      }
      if (!cancelled) setRecord(current);

      try {
        const saved = await analysisStore.load(caseId);
        if (!saved) {
          if (!cancelled) setStatus("not_started");
          return;
        }
        if (!browserAnalysisSnapshotMatchesRecordMetadata(saved, current)) {
          if (!cancelled) setStatus("stale");
          return;
        }
        if (!cancelled) {
          setState(saved);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("not_started");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [analysisStore, caseId]);

  if (status === "loading") {
    return <Skeleton label="Loading current browser-created analysis" />;
  }

  if (status === "missing" || !record) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Alert title="Case not found" tone="warning">
          This browser-local case no longer exists.
        </Alert>
        <Link className="mt-4 inline-flex underline" href="/dashboard">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (status !== "ready" || !state) {
    const stale = status === "stale";
    return (
      <BrowserCaseShell activeStage={activeDestination} record={record}>
        <Alert
          title={stale ? "Analysis needs rerun" : "Complete Structured Analysis first"}
          tone="warning"
        >
          {stale
            ? "The saved analysis no longer matches the current Purpose or document packet. Rerun Structured Analysis before using this destination."
            : "This destination uses a current successful canonical analysis run. No planning or gap state was created."}
        </Alert>
        <Link
          className="mt-4 inline-flex rounded-md border border-border px-3 py-2 text-sm font-semibold"
          href={`/case/${caseId}/analysis`}
        >
          Open Structured Analysis
        </Link>
      </BrowserCaseShell>
    );
  }

  return (
    <BrowserCaseShell
      activeStage={activeDestination}
      analysisCurrent
      record={record}
    >
      <div className="space-y-4">
        {persistenceError ? (
          <Alert title="Changes are not persisted" tone="warning">
            {persistenceError}
          </Alert>
        ) : null}
        <CaseStateProvider
          initialState={state}
          onStateChange={async (next) => {
            try {
              await analysisStore.save(caseId, next);
              setPersistenceError(null);
            } catch {
              setPersistenceError(
                "The change remains visible in this tab, but browser storage rejected it. Reloading may restore the previous saved state.",
              );
            }
          }}
          useSessionPersistence={false}
        >
          {activeDestination === "urgent-needs" ? (
            <UrgentNeedsPreview owner={record.assignedPractitioner} />
          ) : activeDestination === "evidence-gaps" ? (
            <EvidenceGapsWorkspace
              analysisHref={`/case/${caseId}/analysis`}
              documentsHref={`/case/${caseId}/documents`}
              interviewHref={`/case/${caseId}/interview`}
              owner={record.assignedPractitioner}
              taskHref={`/case/${caseId}/tasks`}
            />
          ) : activeDestination === "interview" ? (
            <InterviewPlannerPreview
              evidenceGapsHref={`/case/${caseId}/gaps`}
            />
          ) : activeDestination === "tasks" ? (
            <TasksPreview
              evidenceGapsHref={`/case/${caseId}/gaps`}
              owner={record.assignedPractitioner}
            />
          ) : activeDestination === "services" ? (
            <ServicesPreview />
          ) : activeDestination === "notes" ? (
            <NotesPreview />
          ) : activeDestination === "nexus" ? (
            <EvidenceIntegrityWorkspace
              analysisHref={`/case/${caseId}/analysis`}
              documentsHref={`/case/${caseId}/documents`}
            />
          ) : activeDestination === "export" ? (
            <ExportWorkspace caseBasePath={`/case/${caseId}`} />
          ) : activeDestination === "audit" ? (
            <AuditWorkspace />
          ) : (
            <TimelineWorkspace
              analysisHref={`/case/${caseId}/analysis`}
              documentsHref={`/case/${caseId}/documents`}
            />
          )}
        </CaseStateProvider>
      </div>
    </BrowserCaseShell>
  );
}
