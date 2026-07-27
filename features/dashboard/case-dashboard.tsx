"use client";

import { ArrowRight, FolderPlus, Plus, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  Chip,
  SummaryMetric,
} from "../../components/lovable/nexus-ui";
import { Button, FieldError, Input, Label } from "../../components/ui";
import {
  createBrowserCase,
  createEmptyBrowserCaseRegistry,
  loadBrowserCaseRegistry,
  persistBrowserCaseRegistry,
  type BrowserCaseRegistry,
} from "../../lib/cases";
import { browserCaseAnalysisStore } from "../../lib/cases/browser-case-analysis-store";
import type { CaseState } from "../../lib/contracts";
import { browserAnalysisSnapshotMatchesRecordMetadata } from "../../lib/analysis/freshness";
import { derivePlanningDashboardCounts } from "../../lib/planning";

type NewCaseDraft = {
  assignedPractitioner: string;
  displayReference: string;
  personAlias: string;
};

const EMPTY_DRAFT: NewCaseDraft = {
  assignedPractitioner: "",
  displayReference: "",
  personAlias: "",
};

export function CaseDashboard() {
  const router = useRouter();
  const [registry, setRegistry] = useState<BrowserCaseRegistry>(
    createEmptyBrowserCaseRegistry,
  );
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<NewCaseDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [storageMessage, setStorageMessage] = useState<string | null>(null);
  const [analysisSnapshots, setAnalysisSnapshots] = useState<
    Record<string, CaseState | null>
  >({});

  useEffect(() => {
    const loaded = loadBrowserCaseRegistry(window.localStorage);
    setRegistry(loaded.registry);
    if (!loaded.ok) {
      setStorageMessage(loaded.reason);
      persistBrowserCaseRegistry(window.localStorage, loaded.registry);
    }
    setHydrated(true);
    void Promise.all(
      loaded.registry.cases.map(async (record) => {
        try {
          return [record.id, await browserCaseAnalysisStore.load(record.id)] as const;
        } catch {
          return [record.id, null] as const;
        }
      }),
    ).then((entries) => setAnalysisSnapshots(Object.fromEntries(entries)));
  }, []);

  function closeModal() {
    setModalOpen(false);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
  }

  function submitNewCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const created = createBrowserCase(registry, draft);
    if (!created.ok) {
      setFormError(created.reason);
      return;
    }
    const persisted = persistBrowserCaseRegistry(
      window.localStorage,
      created.registry,
    );
    if (!persisted.ok) {
      setFormError(persisted.reason);
      return;
    }
    setRegistry(created.registry);
    closeModal();
    router.push(`/case/${created.record.id}/purpose`);
  }

  const completePurposeCount = registry.cases.filter(
    (record) => record.purposeBrief?.status === "complete",
  ).length;
  const documentCount = registry.cases.reduce(
    (total, record) =>
      total + (record.documentPacket?.documents.length ?? 0),
    0,
  );
  const currentAnalysisCount = registry.cases.filter((record) => {
    const snapshot = analysisSnapshots[record.id];
    return Boolean(
      snapshot &&
        browserAnalysisSnapshotMatchesRecordMetadata(snapshot, record),
    );
  }).length;
  const currentSnapshots = registry.cases.flatMap((record) => {
    const snapshot = analysisSnapshots[record.id];
    return snapshot &&
      browserAnalysisSnapshotMatchesRecordMetadata(snapshot, record)
      ? [snapshot]
      : [];
  });
  const activeUrgentNeedCount = currentSnapshots.reduce(
    (total, snapshot) =>
      total + derivePlanningDashboardCounts(snapshot).openUrgentNeeds,
    0,
  );
  const planningTaskCounts = currentSnapshots.reduce(
    (counts, snapshot) => {
      const planning = derivePlanningDashboardCounts(snapshot);
      return {
        open: counts.open + planning.openTasks,
        overdue: counts.overdue + planning.overdueTasks,
      };
    },
    { open: 0, overdue: 0 },
  );

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Case Dashboard
            </div>
            <h1 className="mt-1 font-serif text-3xl">
              Open cases &amp; readiness
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Create and reopen independent fictional cases stored only in this
              browser. Purpose Brief, browser-local Documents, and Structured
              Analysis are connected. Urgent Needs and Evidence Gaps use the
              same case state. Interview Planner, Services &amp; Referrals,
              Case Tasks, Notes &amp; Journal, review destinations, Export
              Gate, and Audit Trail are connected after a current analysis.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
            onClick={() => setModalOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New case
          </button>
        </div>

        {storageMessage ? (
          <p
            className="mt-5 rounded-lg border border-[color-mix(in_oklab,var(--rust)_35%,transparent)] bg-[color-mix(in_oklab,var(--rust)_8%,transparent)] px-4 py-3 text-sm"
            role="alert"
          >
            {storageMessage}
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryMetric label="Open cases" value={registry.cases.length} />
          <SummaryMetric
            label="Purpose complete"
            value={completePurposeCount}
          />
          <SummaryMetric label="Documents" value={documentCount} />
          <SummaryMetric label="Analysis complete" value={currentAnalysisCount} />
          <SummaryMetric
            label="Active urgent needs"
            value={activeUrgentNeedCount}
          />
          <SummaryMetric
            hint={`${planningTaskCounts.overdue} overdue`}
            label="Open tasks"
            value={planningTaskCounts.open}
          />
        </div>

        <section className="mt-8" aria-labelledby="recent-cases-heading">
          <h2
            className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            id="recent-cases-heading"
          >
            Recently active
          </h2>

          {!hydrated ? (
            <div
              className="min-h-64 animate-pulse rounded-xl border border-border bg-card"
              role="status"
            >
              <span className="sr-only">Loading browser-local cases</span>
            </div>
          ) : registry.cases.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-[color:var(--amber)]">
                <FolderPlus className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-serif text-xl">No cases yet</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Start with a fictional case reference and alias. The case will remain
                private to this browser and begin with an empty Purpose Brief.
              </p>
              <Button
                className="mt-5"
                onClick={() => setModalOpen(true)}
                variant="primary"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create first case
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {registry.cases.map((record) => {
                const analysis = analysisSnapshots[record.id];
                const analysisCurrent = Boolean(
                  analysis &&
                    browserAnalysisSnapshotMatchesRecordMetadata(
                      analysis,
                      record,
                    ),
                );
                const analysisHref = `/case/${record.id}/analysis`;
                const openGapCount =
                  analysisCurrent && analysis
                    ? analysis.candidates.filter(
                        (candidate) =>
                          candidate.kind === "context_gap" &&
                          candidate.inclusionStatus === "active" &&
                          candidate.responseStatus === "unanswered",
                      ).length
                    : 0;
                const documentsReady =
                  record.documentPacket?.masking.reviewStatus === "approved" &&
                  record.documentPacket.masking.leakScanStatus === "passed" &&
                  !record.documentPacket.coverage.hasConsequentialOpenIssue;
                const workspaceHref = analysisCurrent
                  ? analysisHref
                  : record.documentPacket
                    ? `/case/${record.id}/documents`
                    : `/case/${record.id}/purpose`;
                return (
                <a
                  aria-label={`Open workspace for ${record.personAlias} (${record.displayReference})`}
                  className="group flex cursor-pointer flex-col rounded-xl border border-border bg-card p-5 text-left no-underline transition hover:border-[color:var(--amber)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
                  href={workspaceHref}
                  key={record.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {record.displayReference}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-sm">
                        <User
                          className="h-3.5 w-3.5 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {record.personAlias}
                      </div>
                    </div>
                    <Chip tone={analysisCurrent || record.purposeBrief ? "sage" : "amber"}>
                      {analysisCurrent
                        ? "Analysis complete"
                        : record.purposeBrief
                          ? "Purpose complete"
                          : "Purpose not started"}
                    </Chip>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Assigned</dt>
                      <dd className="text-foreground">
                        {record.assignedPractitioner}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Purpose revision</dt>
                      <dd>{record.purposeBrief?.revision ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Documents</dt>
                      <dd>
                        {record.documentPacket
                          ? `${record.documentPacket.documents.length} source${record.documentPacket.documents.length === 1 ? "" : "s"}`
                          : record.purposeBrief
                            ? "Ready for intake"
                            : "Complete Purpose first"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Analysis</dt>
                      <dd>
                        {analysisCurrent && analysis
                          ? `${analysis.candidates.length} candidate${analysis.candidates.length === 1 ? "" : "s"} · ${openGapCount} open gap${openGapCount === 1 ? "" : "s"}`
                          : documentsReady
                            ? "Ready to start"
                            : "Complete Documents first"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="text-muted-foreground">
                      Browser-local · independent case
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground group-hover:text-[color:var(--amber)]">
                      Open workspace
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </a>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {modalOpen ? (
        <div
          aria-labelledby="new-case-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl" id="new-case-title">
                  New case
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use fictional or harmless demonstration data only.
                </p>
              </div>
              <button
                aria-label="Close new case dialog"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={closeModal}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form className="mt-5 space-y-4" noValidate onSubmit={submitNewCase}>
              {formError ? (
                <FieldError id="new-case-error">{formError}</FieldError>
              ) : null}
              <div className="grid gap-1.5">
                <Label htmlFor="new-case-reference">Case reference</Label>
                <Input
                  aria-describedby="new-case-reference-help"
                  autoComplete="off"
                  autoFocus
                  id="new-case-reference"
                  maxLength={44}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setDraft((current) => ({
                      ...current,
                      displayReference: value,
                    }));
                  }}
                  placeholder="For example: raj1"
                  value={draft.displayReference}
                />
                <p
                  className="text-xs text-muted-foreground"
                  id="new-case-reference-help"
                >
                  We automatically add REF- and capitalize it. References are
                  unique in this browser.
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-case-alias">Person alias</Label>
                <Input
                  autoComplete="off"
                  id="new-case-alias"
                  maxLength={80}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setDraft((current) => ({
                      ...current,
                      personAlias: value,
                    }));
                  }}
                  placeholder="J. Example"
                  value={draft.personAlias}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="new-case-practitioner">
                  Assigned practitioner
                </Label>
                <Input
                  autoComplete="off"
                  id="new-case-practitioner"
                  maxLength={80}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setDraft((current) => ({
                      ...current,
                      assignedPractitioner: value,
                    }));
                  }}
                  placeholder="Demo practitioner"
                  value={draft.assignedPractitioner}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={closeModal} type="button">
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create case
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
