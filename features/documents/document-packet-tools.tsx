"use client";

import { ChevronDown, Fingerprint, ShieldCheck } from "lucide-react";
import { Chip } from "../../components/lovable/nexus-ui";
import type {
  AnalysisCorpusResult,
  DocumentIngestionManifest,
} from "../../lib/documents";
import { AnalysisInputPreview } from "./analysis-input-preview";
import { IngestionIntegrityPanel } from "./ingestion-integrity-panel";

export function DocumentPacketTools({
  corpusResult,
  manifest,
  onDownloadReport,
  runtimeAvailable,
}: {
  corpusResult: AnalysisCorpusResult | null;
  manifest: DocumentIngestionManifest | null;
  onDownloadReport: () => void;
  runtimeAvailable: boolean;
}) {
  const duplicateCount = manifest?.duplicates.length ?? 0;
  const corpus = corpusResult?.ok ? corpusResult.corpus : null;

  return (
    <section
      aria-labelledby="packet-tools-heading"
      className="border-t border-border pt-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h5 className="font-serif text-base" id="packet-tools-heading">
            Packet-level tools
          </h5>
          <p className="text-[11px] text-muted-foreground">
            Technical checks for the current packet—not source credibility.
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
          Expand when needed
        </span>
      </div>

      <div className="mt-2 grid gap-2">
        <details className="group rounded-md border border-border bg-background">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)] focus-visible:ring-inset">
            <Fingerprint
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-[color:var(--amber)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold">
                Packet integrity
              </span>
              <span className="block truncate text-[10px] text-muted-foreground">
                Fingerprints, duplicate diagnostics, and safe JSON report
              </span>
            </span>
            <Chip tone={duplicateCount > 0 ? "amber" : "mute"}>
              {duplicateCount} duplicate signal
              {duplicateCount === 1 ? "" : "s"}
            </Chip>
            <ChevronDown
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-border">
            <IngestionIntegrityPanel
              embedded
              manifest={manifest}
              onDownloadReport={onDownloadReport}
            />
          </div>
        </details>

        <details className="group rounded-md border border-border bg-background">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)] focus-visible:ring-inset">
            <ShieldCheck
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-[color:var(--sage)]"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold">
                Analysis input preview
              </span>
              <span className="block truncate text-[10px] text-muted-foreground">
                Inspect the approved redacted corpus and exact citations
              </span>
            </span>
            <Chip tone={corpus ? "sage" : "amber"}>
              {corpus
                ? `${corpus.summary.segmentCount} segment${
                    corpus.summary.segmentCount === 1 ? "" : "s"
                  }`
                : "Blocked"}
            </Chip>
            <ChevronDown
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-border">
            <AnalysisInputPreview
              corpusResult={corpusResult}
              embedded
              runtimeAvailable={runtimeAvailable}
            />
          </div>
        </details>
      </div>
    </section>
  );
}
