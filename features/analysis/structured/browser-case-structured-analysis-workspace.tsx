"use client";

import Link from "next/link";
import { LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BrowserCaseShell } from "../../../components/shell/browser-case-shell";
import { CaseStateProvider } from "../../../components/shell";
import { Chip, SectionTitle } from "../../../components/lovable/nexus-ui";
import { Alert, Button, Skeleton } from "../../../components/ui";
import {
  type BrowserCaseRecord,
  findBrowserCase,
  loadBrowserCaseRegistry,
} from "../../../lib/cases";
import {
  browserCaseAnalysisStore,
  type BrowserCaseAnalysisStore,
} from "../../../lib/cases/browser-case-analysis-store";
import {
  browserCaseFileStore,
  type BrowserCaseFileStore,
} from "../../../lib/cases/browser-case-file-store";
import {
  AnalyzeAvailabilityResponseSchema,
  BrowserAnalyzeResponseSchema,
  type BrowserAnalysisIntent,
  type CaseState,
  type SourceSegment,
} from "../../../lib/contracts";
import {
  applyVerifiedOcrPage,
  prepareAnalysisCorpus,
  processLocalPdfSources,
  recognizePdfPageLocally,
  retryEmbeddedTextPage,
  type LocalPdfDocumentServiceResult,
} from "../../../lib/documents";
import { buildBrowserAnalysisIntent } from "../../../lib/analysis/browser-analysis-intent";
import { buildBrowserDeterministicAnalysis } from "../../../lib/analysis/browser-deterministic-analysis";
import { browserAnalysisSnapshotMatchesRecordMetadata } from "../../../lib/analysis/freshness";
import { createBrowserAnalysisCaseState } from "../../../lib/state/browser-case-analysis";
import type { CitationSourceContext } from "../../../lib/citations";
import { StructuredAnalysisWorkspace } from "./structured-analysis-workspace";

type ProcessSources = (
  files: readonly File[],
  caseId: string,
) => Promise<LocalPdfDocumentServiceResult>;

const DEFAULT_PROCESS_SOURCES: ProcessSources = (files, caseId) =>
  processLocalPdfSources(files, undefined, caseId);

export function BrowserCaseStructuredAnalysisWorkspace({
  caseId,
  fileStore = browserCaseFileStore,
  analysisStore = browserCaseAnalysisStore,
  processSources = DEFAULT_PROCESS_SOURCES,
}: {
  caseId: string;
  fileStore?: BrowserCaseFileStore;
  analysisStore?: BrowserCaseAnalysisStore;
  processSources?: ProcessSources;
}) {
  const [record, setRecord] = useState<BrowserCaseRecord | null>(null);
  const [runtimeResult, setRuntimeResult] =
    useState<LocalPdfDocumentServiceResult | null>(null);
  const [state, setState] = useState<CaseState | null>(null);
  const [status, setStatus] = useState<
    | "loading"
    | "missing"
    | "blocked"
    | "stale"
    | "ready"
    | "running"
    | "failed"
  >("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [serviceState, setServiceState] = useState<
    "loading" | "available" | "unavailable"
  >("loading");

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

      let saved: CaseState | null;
      try {
        saved = await analysisStore.load(caseId);
      } catch {
        if (!cancelled) {
          setMessage(
            "Browser analysis storage is unavailable. No analysis result was loaded or changed.",
          );
          setStatus("blocked");
        }
        return;
      }
      if (!current.documentPacket) {
        if (!cancelled) {
          setMessage("Process and approve a document packet before analysis.");
          setStatus("blocked");
        }
        return;
      }

      try {
        const files = await fileStore.load(caseId);
        if (files.length === 0) {
          if (!cancelled) {
            setMessage(
              "Open Documents and reselect the saved packet before starting analysis.",
            );
            setStatus("blocked");
          }
          return;
        }
        let result = await processSources(files, caseId);
        for (const verification of current.documentPacket.ocrVerifications) {
          const index = result.fileMetadata?.findIndex(
            (metadata) => metadata.documentId === verification.documentId,
          );
          const file = index === undefined || index < 0 ? undefined : files[index];
          if (!file) throw new Error("verified_ocr_file_missing");
          const verified =
            verification.method === "ocr"
              ? await recognizePdfPageLocally({
                  file,
                  documentId: verification.documentId,
                  pageNumber: verification.pageNumber,
                })
              : await retryEmbeddedTextPage({
                  file,
                  documentId: verification.documentId,
                  pageNumber: verification.pageNumber,
                });
          result = applyVerifiedOcrPage(result, verified);
        }
        if (
          result.documentSetDigest !==
          current.documentPacket.documentSetDigest
        ) {
          throw new Error("document_digest_mismatch");
        }
        const rebuilt = await buildBrowserAnalysisIntent({
          record: current,
          segments: result.segments,
        });
        if (!rebuilt.ok) throw new Error("analysis_input_rebuild_failed");
        const savedCurrent = Boolean(
          saved && snapshotMatchesRecord(saved, current, rebuilt.intent),
        );
        if (!cancelled) {
          setRuntimeResult(result);
          if (saved && savedCurrent) {
            setState(saved);
            setStatus("ready");
          } else if (saved) {
            setMessage(
              "Purpose, documents, source classification, or masking changed after the saved analysis. Start a new analysis from the current approved redacted input.",
            );
            setStatus("stale");
          } else {
            setStatus("ready");
          }
        }
      } catch {
        if (!cancelled) {
          setMessage(
            "The approved browser files could not be reconstructed. Return to Documents and verify the packet.",
          );
          setStatus("blocked");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [analysisStore, caseId, fileStore, processSources]);

  useEffect(() => {
    let cancelled = false;
    async function loadAvailability() {
      try {
        const response = await fetch("/api/analyze", {
          cache: "no-store",
        });
        const parsed = AnalyzeAvailabilityResponseSchema.safeParse(
          await response.json(),
        );
        const available =
          parsed.success &&
          parsed.data.liveAnalysisEnabled &&
          parsed.data.options.some(
            (option) =>
              option.mode === "live" &&
              option.selectable &&
              option.disclosure.allowedDataOrigins.includes("browser_local"),
          );
        if (!cancelled) {
          setServiceState(available ? "available" : "unavailable");
        }
      } catch {
        if (!cancelled) setServiceState("unavailable");
      }
    }
    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, []);

  const readiness = useMemo(() => {
    if (!record?.documentPacket || !runtimeResult) return null;
    return prepareAnalysisCorpus({
      documents: record.documentPacket.documents,
      segments: runtimeResult.segments,
      masking: record.documentPacket.masking,
    });
  }, [record, runtimeResult]);

  async function startLiveAnalysis() {
    if (!record || !runtimeResult || !acknowledged) return;
    setStatus("running");
    setMessage(null);
    const built = await buildBrowserAnalysisIntent({
      record,
      segments: runtimeResult.segments,
    });
    if (!built.ok) {
      setMessage(built.reason);
      setStatus("failed");
      return;
    }

    try {
      const response = await fetch("/api/analyze/browser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(built.intent),
      });
      const parsed = BrowserAnalyzeResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        setMessage("The analysis service returned an invalid safe response.");
        setStatus("failed");
        return;
      }
      if (parsed.data.outcome !== "succeeded") {
        setMessage(parsed.data.error.userMessage);
        setStatus("failed");
        return;
      }

      const sourceContext = localSourceContext(
        record,
        runtimeResult.segments,
      );
      const next = createBrowserAnalysisCaseState({
        record,
        sourceContext,
        response: parsed.data,
        approvedRedactedInputDigest:
          built.intent.approvedRedactedInputDigest,
      });
      await analysisStore.save(caseId, next);
      setState(next);
      setStatus("ready");
    } catch {
      setMessage(
        "The analysis request did not complete. No partial result was saved.",
      );
      setStatus("failed");
    }
  }

  async function startLocalAnalysis() {
    if (!record || !runtimeResult) return;
    setStatus("running");
    setMessage(null);
    const built = await buildBrowserAnalysisIntent({
      record,
      segments: runtimeResult.segments,
    });
    if (!built.ok) {
      setMessage(built.reason);
      setStatus("failed");
      return;
    }

    try {
      const sourceContext = localSourceContext(
        record,
        runtimeResult.segments,
      );
      const result = buildBrowserDeterministicAnalysis({
        caseId,
        approvedRedactedInputDigest:
          built.intent.approvedRedactedInputDigest,
        documents: sourceContext.documents,
        segments: sourceContext.segments.filter((segment) =>
          sourceContext.selectedSegmentIds.has(segment.id),
        ),
      });
      const next = createBrowserAnalysisCaseState({
        record,
        sourceContext,
        response: result,
        approvedRedactedInputDigest:
          built.intent.approvedRedactedInputDigest,
      });
      await analysisStore.save(caseId, next);
      setState(next);
      setStatus("ready");
    } catch {
      setMessage(
        "Browser-local analysis failed safely. No partial result was saved.",
      );
      setStatus("failed");
    }
  }

  if (status === "loading") {
    return <Skeleton label="Loading browser-created Structured Analysis" />;
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

  if (state) {
    return (
      <BrowserCaseShell activeStage="analysis" record={record}>
        <div className="space-y-4">
          {persistenceError ? (
            <Alert title="Analysis changes are not persisted" tone="warning">
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
                  "The current review remains visible in this tab, but browser storage rejected the update. Reloading may restore the previous saved analysis.",
                );
              }
            }}
            useSessionPersistence={false}
          >
            <StructuredAnalysisWorkspace
              documentsHref={`/case/${caseId}/documents`}
            />
          </CaseStateProvider>
        </div>
      </BrowserCaseShell>
    );
  }

  const corpusReady = readiness?.ok === true;
  return (
    <BrowserCaseShell activeStage="analysis" record={record}>
      <div className="space-y-5">
        <SectionTitle
          description="Analyze only the current approved redacted text. Browser-local rules create source-grounded review prompts without using an API or spending credits."
          eyebrow="Stage 3 · Analysis"
          title="Structured Analysis"
        />

        {message ? (
          <Alert
            title={
              status === "blocked"
                ? "Analysis prerequisites are incomplete"
                : status === "stale"
                  ? "Analysis needs rerun"
                : "Analysis did not start"
            }
            tone={
              status === "blocked" || status === "stale"
                ? "warning"
                : "danger"
            }
          >
            {message}
          </Alert>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck
                  aria-hidden="true"
                  className="h-5 w-5 text-[color:var(--sage)]"
                />
                <h2 className="font-serif text-xl">Approved analysis input</h2>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Raw PDFs and extracted text remain in this browser. The
                deterministic option checks transparent language patterns,
                creates exact source citations, and never makes a legal
                finding. An admitted live provider remains optional.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip tone={corpusReady ? "sage" : "amber"}>
                {corpusReady ? "Corpus ready" : "Corpus blocked"}
              </Chip>
              <Chip tone={serviceState === "available" ? "sage" : "amber"}>
                {serviceState === "loading"
                  ? "Checking live service"
                  : serviceState === "available"
                    ? "Live service ready"
                    : "Live service unavailable"}
              </Chip>
              <Chip tone="sage">Local analysis ready</Chip>
              <Chip tone="mute">
                {record.documentPacket?.documents.length ?? 0} documents
              </Chip>
              <Chip tone="mute">
                {readiness?.ok ? readiness.corpus.entries.length : 0} segments
              </Chip>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              disabled={
                !corpusReady ||
                status === "running" ||
                !runtimeResult
              }
              onClick={() => void startLocalAnalysis()}
            >
              {status === "running" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin"
                />
              ) : (
                <Sparkles aria-hidden="true" className="h-4 w-4" />
              )}
              {status === "running"
                ? "Analyzing safely…"
                : "Run browser-local analysis"}
            </Button>
            <Link
              className="text-sm font-medium underline"
              href={`/case/${caseId}/documents`}
            >
              Review Documents
            </Link>
          </div>

          <details className="mt-4 rounded-lg border border-border bg-background/60 p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Optional live-provider analysis
            </summary>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              A live provider can offer broader language interpretation, but
              only an admitted browser-upload release may receive approved
              redacted text. Raw PDFs are never sent.
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm">
              <input
                checked={acknowledged}
                className="mt-1 h-4 w-4"
                onChange={(event) => setAcknowledged(event.target.checked)}
                type="checkbox"
              />
              <span>
                I confirm this packet contains only synthetic or authorized
                public material, and I understand that its approved redacted
                text may be sent to the admitted live provider shown in the
                resulting provenance.
              </span>
            </label>
            {serviceState === "unavailable" ? (
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                No browser-upload-eligible release is currently admitted and
                enabled. No provider call or credit usage can occur.
              </p>
            ) : null}
            <Button
              className="mt-3"
              disabled={
                !corpusReady ||
                !acknowledged ||
                serviceState !== "available" ||
                status === "running" ||
                !runtimeResult
              }
              onClick={() => void startLiveAnalysis()}
              variant="secondary"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Start live analysis
            </Button>
          </details>
        </section>
      </div>
    </BrowserCaseShell>
  );
}

function snapshotMatchesRecord(
  state: CaseState,
  record: BrowserCaseRecord,
  intent: BrowserAnalysisIntent,
): boolean {
  const run = state.analysisRuns.find(
    (candidate) => candidate.id === state.activeAnalysisRunId,
  );
  return Boolean(
    run &&
      record.purposeBrief &&
      record.documentPacket &&
      browserAnalysisSnapshotMatchesRecordMetadata(state, record) &&
      run.inputState.approvedRedactedInputDigest ===
        intent.approvedRedactedInputDigest &&
      sameOrderedStrings(
        run.inputState.selectedSegmentIds,
        intent.segments.map((segment) => segment.segmentId),
      ),
  );
}

function sameOrderedStrings(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function localSourceContext(
  record: BrowserCaseRecord,
  segments: SourceSegment[],
): CitationSourceContext {
  const packet = record.documentPacket;
  if (!packet) throw new Error("browser_analysis_packet_missing");
  const corpus = prepareAnalysisCorpus({
    documents: packet.documents,
    segments,
    masking: packet.masking,
  });
  if (!corpus.ok) throw new Error(corpus.reason);
  const redactedById = new Map(
    corpus.corpus.entries.map((entry) => [entry.segmentId, entry.text]),
  );
  const approvedSegments = segments.map((segment) => {
    const redactedText = redactedById.get(segment.id);
    if (!redactedText) throw new Error("browser_analysis_segment_missing");
    return {
      ...segment,
      rawText: redactedText,
      redactedText,
    };
  });
  return {
    caseId: record.id,
    documents: packet.documents,
    segments: approvedSegments,
    selectedSegmentIds: new Set(approvedSegments.map((segment) => segment.id)),
  };
}
