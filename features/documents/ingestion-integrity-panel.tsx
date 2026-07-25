"use client";

import { Download, Fingerprint, Files, ScanSearch } from "lucide-react";
import type { ReactNode } from "react";
import { Chip } from "../../components/lovable/nexus-ui";
import type { DocumentIngestionManifest } from "../../lib/documents";

export function IngestionIntegrityPanel({
  embedded = false,
  manifest,
  onDownloadReport,
}: {
  embedded?: boolean;
  manifest: DocumentIngestionManifest | null;
  onDownloadReport: () => void;
}) {
  if (!manifest) {
    return (
      <section
        className={
          embedded
            ? "bg-card p-3"
            : "rounded-xl border border-border bg-card p-4"
        }
      >
        <p className="text-sm text-muted-foreground">
          Building browser-local packet fingerprints and duplicate diagnostics…
        </p>
      </section>
    );
  }

  const exactFiles = manifest.duplicates.filter(
    (duplicate) => duplicate.kind === "exact_file",
  );
  const exactPages = manifest.duplicates.filter(
    (duplicate) => duplicate.kind === "exact_page",
  );
  const nearPages = manifest.duplicates.filter(
    (duplicate) => duplicate.kind === "near_duplicate_page",
  );

  return (
    <section
      aria-labelledby="packet-integrity-heading"
      className={
        embedded
          ? "bg-card p-3"
          : "rounded-xl border border-border bg-card p-4"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-[color:var(--amber)]" />
            <h2
              className={`font-serif ${embedded ? "text-base" : "text-lg"}`}
              id="packet-integrity-heading"
            >
              Packet integrity
            </h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            Deterministic SHA-256 fingerprints identify exact duplicates.
            Near-duplicate pages are advisory text-overlap matches and require
            human review; they are never silently removed.
          </p>
        </div>
        <button
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
          onClick={onDownloadReport}
          type="button"
        >
          <Download className="h-3.5 w-3.5" />
          Download integrity report
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <IntegrityFact
          icon={<Files className="h-4 w-4" />}
          label="Documents"
          value={manifest.documents.length}
        />
        <IntegrityFact
          icon={<Fingerprint className="h-4 w-4" />}
          label="Exact file groups"
          value={exactFiles.length}
        />
        <IntegrityFact
          icon={<ScanSearch className="h-4 w-4" />}
          label="Exact page groups"
          value={exactPages.length}
        />
        <IntegrityFact
          icon={<ScanSearch className="h-4 w-4" />}
          label="Near page pairs"
          value={nearPages.length}
        />
      </div>

      {manifest.duplicates.length === 0 ? (
        <p className="mt-3 rounded-md border border-border bg-muted/25 px-3 py-2 text-xs">
          No exact or high-similarity duplicate was detected in readable page
          text.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 text-xs">
          {manifest.duplicates.map((duplicate, index) => (
            <li
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              key={`${duplicate.kind}-${index}`}
            >
              <span>
                {duplicate.kind === "exact_file"
                  ? `Exact file: ${duplicate.documentIds.join(", ")}`
                  : duplicate.kind === "exact_page"
                    ? `Exact pages: ${duplicate.pages
                        .map(
                          (page) =>
                            `${page.documentId} page ${page.pageNumber}`,
                        )
                        .join(", ")}`
                    : `Possible repeated content: ${duplicate.left.documentId} page ${duplicate.left.pageNumber} and ${duplicate.right.documentId} page ${duplicate.right.pageNumber}`}
              </span>
              <Chip tone={duplicate.kind === "near_duplicate_page" ? "amber" : "mute"}>
                {duplicate.kind === "near_duplicate_page"
                  ? `${duplicate.similarityPercent}% text overlap`
                  : "SHA-256 exact"}
              </Chip>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
        The downloadable JSON contains fingerprints, extraction counts,
        metadata, and status only. It excludes PDF bytes, extracted/OCR text,
        passwords, preview addresses, and search terms.
      </p>
    </section>
  );
}

function IntegrityFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
      <div className="mt-1 font-serif text-lg leading-none">{value}</div>
    </div>
  );
}
