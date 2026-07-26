"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  AlertOctagon,
  CheckSquare,
  Clock3,
  FileText,
  HandHelping,
  HelpCircle,
  Home,
  MessageSquare,
  Network,
  NotebookPen,
  Search,
  Send,
  ShieldCheck,
  ScrollText,
} from "lucide-react";
import { Chip, SyntheticBanner } from "../lovable/nexus-ui";
import type { BrowserCaseRecord } from "../../lib/cases";

type NavigationIcon = ComponentType<{
  "aria-hidden"?: boolean | "true";
  className?: string;
}>;

const STAGES = [
  { id: "purpose", label: "Purpose", index: 1 },
  { id: "documents", label: "Documents", index: 2 },
  { id: "analysis", label: "Analysis", index: 3 },
  { id: "planning", label: "Planning", index: 4 },
  { id: "review", label: "Review", index: 5 },
  { id: "export", label: "Export", index: 6 },
] as const;

const DISABLED_NAVIGATION: Array<{
  group: "Intake" | "Analysis" | "Planning" | "Review" | "Export";
  icon: NavigationIcon;
  label: string;
}> = [
  { group: "Analysis", icon: Search, label: "Structured Analysis" },
  { group: "Analysis", icon: AlertOctagon, label: "Urgent Needs" },
  { group: "Analysis", icon: HelpCircle, label: "Evidence Gaps" },
  { group: "Planning", icon: MessageSquare, label: "Interview Planner" },
  { group: "Planning", icon: HandHelping, label: "Services & Referrals" },
  { group: "Planning", icon: CheckSquare, label: "Case Tasks" },
  { group: "Planning", icon: NotebookPen, label: "Notes & Journal" },
  { group: "Review", icon: Network, label: "Charge–Coercion Nexus" },
  { group: "Review", icon: Clock3, label: "Timeline" },
  { group: "Export", icon: Send, label: "Export Gate" },
  { group: "Export", icon: ScrollText, label: "Audit Trail" },
];

const GROUPS = ["Intake", "Analysis", "Planning", "Review", "Export"] as const;

export function BrowserCaseShell({
  activeStage = "purpose",
  children,
  record,
}: {
  activeStage?: "analysis" | "documents" | "purpose";
  children: ReactNode;
  record: BrowserCaseRecord;
}) {
  const purposeComplete = record.purposeBrief?.status === "complete";
  const purposeHref = `/case/${record.id}/purpose`;
  const documentsHref = `/case/${record.id}/documents`;
  const analysisHref = `/case/${record.id}/analysis`;
  const analysisReady =
    Boolean(record.documentPacket) &&
    record.documentPacket?.masking.reviewStatus === "approved" &&
    record.documentPacket.masking.leakScanStatus === "passed" &&
    !record.documentPacket.coverage.hasConsequentialOpenIssue &&
    record.documentPacket.coverage.processedDocuments > 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2"
        href="#case-workspace"
      >
        Skip to case workspace
      </a>
      <SyntheticBanner
        compact
        detail="— use synthetic or authorized public data only. Files stay in this browser and are not sent to an AI provider."
        label="Browser-local demonstration"
      />
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 -translate-y-0.5 rounded-full bg-[color:var(--amber)]"
              />
              <span className="font-serif text-base">
                ContextFirst{" "}
                <span className="italic text-muted-foreground">Nexus</span>
              </span>
            </Link>
            <span className="hidden text-border sm:inline">·</span>
            <div className="hidden text-xs sm:block">
              <span className="font-mono text-foreground">
                {record.displayReference}
              </span>
              <span className="mx-2 text-border">·</span>
              <span className="text-muted-foreground">Alias</span>{" "}
              {record.personAlias}
              <span className="mx-2 text-border">·</span>
              <span className="text-muted-foreground">Assigned</span>{" "}
              {record.assignedPractitioner}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Chip tone="mute">Browser local</Chip>
            <Link
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              href="/dashboard"
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" /> Dashboard
            </Link>
            <Link
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              href="/trust"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Trust
            </Link>
          </div>
        </div>

        <section
          aria-label="Six-stage case progress"
          className="max-w-full overflow-hidden sm:overflow-x-auto"
        >
          <ol className="mx-auto grid grid-cols-3 gap-x-3 gap-y-2 px-6 pb-3 sm:flex sm:w-max sm:min-w-full sm:flex-nowrap sm:items-center sm:gap-2">
            {STAGES.map((stage, index) => {
              const current = stage.id === activeStage;
              const complete =
                (stage.id === "purpose" && purposeComplete) ||
                (stage.id === "documents" && analysisReady);
              const available =
                stage.id === "purpose" ||
                (stage.id === "documents" && purposeComplete) ||
                (stage.id === "analysis" && analysisReady);
              const stageBody = (
                <>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border font-mono text-[10px] ${
                      complete
                        ? "border-[color:var(--sage)] bg-[color-mix(in_oklab,var(--sage)_20%,transparent)] text-foreground"
                        : current
                          ? "border-[color:var(--amber)] bg-[color-mix(in_oklab,var(--amber)_20%,transparent)] text-foreground"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {stage.index}
                  </span>
                  <span
                    className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
                      current ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="sr-only">
                    ,{" "}
                    {complete
                      ? "completed"
                      : current
                        ? "active"
                        : available
                          ? "available"
                          : "unavailable"}
                  </span>
                </>
              );
              return (
                <li className="flex min-w-0 items-center gap-2" key={stage.id}>
                  {available ? (
                    <Link
                      aria-current={current ? "step" : undefined}
                      className="flex items-center gap-2"
                      href={
                        stage.id === "analysis"
                          ? analysisHref
                          : stage.id === "documents"
                            ? documentsHref
                            : purposeHref
                      }
                    >
                      {stageBody}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center gap-2"
                      title="Not yet available for browser-created cases"
                    >
                      {stageBody}
                    </span>
                  )}
                  {index < STAGES.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="mx-1 hidden h-px w-8 bg-border sm:block"
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      </header>

      <div className="border-b border-border bg-muted/40 px-6 py-2 text-xs text-muted-foreground lg:hidden">
        {analysisReady
          ? "Planning, review, and export stages are not yet available for browser-created cases."
          : "Approve the document privacy check to unlock Structured Analysis. Later workspace stages are not yet available."}
      </div>

      <div className="mx-auto grid grid-cols-1 gap-0 lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-border bg-card/40 lg:min-h-[calc(100vh-140px)]">
          <nav aria-label="Case workspace" className="p-3">
            {GROUPS.map((group) => (
              <div className="mb-4" key={group}>
                <div className="mb-1 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {group}
                </div>
                <ul className="space-y-0.5">
                  {group === "Intake" ? (
                    <>
                      <li>
                        <Link
                          aria-current={
                            activeStage === "purpose" ? "page" : undefined
                          }
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                            activeStage === "purpose"
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground/80 hover:bg-muted"
                          }`}
                          href={purposeHref}
                        >
                          <FileText
                            className="h-4 w-4 opacity-80"
                            aria-hidden="true"
                          />
                          <span>Purpose Brief</span>
                        </Link>
                      </li>
                      <li>
                        {purposeComplete ? (
                          <Link
                            aria-current={
                              activeStage === "documents" ? "page" : undefined
                            }
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                              activeStage === "documents"
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground/80 hover:bg-muted"
                            }`}
                            href={documentsHref}
                          >
                            <FileText
                              className="h-4 w-4 opacity-80"
                              aria-hidden="true"
                            />
                            <span>Documents</span>
                          </Link>
                        ) : (
                          <span
                            aria-disabled="true"
                            className="flex cursor-not-allowed items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground opacity-65"
                            title="Complete Purpose before opening Documents"
                          >
                            <span className="flex items-center gap-2">
                              <FileText
                                className="h-4 w-4 opacity-80"
                                aria-hidden="true"
                              />
                              <span>Documents</span>
                            </span>
                            <span className="font-mono text-[8px] uppercase tracking-[0.1em]">
                              Unavailable
                            </span>
                          </span>
                        )}
                      </li>
                    </>
                  ) : null}
                  {group === "Analysis" ? (
                    <li>
                      {analysisReady ? (
                        <Link
                          aria-current={
                            activeStage === "analysis" ? "page" : undefined
                          }
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                            activeStage === "analysis"
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground/80 hover:bg-muted"
                          }`}
                          href={analysisHref}
                        >
                          <Search
                            className="h-4 w-4 opacity-80"
                            aria-hidden="true"
                          />
                          <span>Structured Analysis</span>
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          className="flex cursor-not-allowed items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground opacity-65"
                          title="Approve the document privacy check before analysis"
                        >
                          <span className="flex items-center gap-2">
                            <Search
                              className="h-4 w-4 opacity-80"
                              aria-hidden="true"
                            />
                            <span>Structured Analysis</span>
                          </span>
                          <span className="font-mono text-[8px] uppercase tracking-[0.1em]">
                            Unavailable
                          </span>
                        </span>
                      )}
                    </li>
                  ) : null}
                  {DISABLED_NAVIGATION.filter(
                    (item) =>
                      item.group === group &&
                      item.label !== "Structured Analysis",
                  ).map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label}>
                        <span
                          aria-disabled="true"
                          className="flex cursor-not-allowed items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground opacity-65"
                          title="Not yet available for browser-created cases"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Icon
                              className="h-4 w-4 shrink-0 opacity-80"
                              aria-hidden="true"
                            />
                            <span>{item.label}</span>
                          </span>
                          <span className="font-mono text-[8px] uppercase tracking-[0.1em]">
                            Unavailable
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 px-6 py-6" id="case-workspace">
          {children}
        </main>
      </div>
    </div>
  );
}
