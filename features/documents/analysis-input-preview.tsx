"use client";

import { Search, ShieldCheck, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Chip } from "../../components/lovable/nexus-ui";
import { Input, Label, Select } from "../../components/ui";
import type { DocumentRecord } from "../../lib/contracts";
import type {
  AnalysisCorpusResult,
} from "../../lib/documents";
import { searchAnalysisCorpus } from "../../lib/documents";

const SOURCE_TYPE_LABELS: Record<DocumentRecord["sourceType"], string> = {
  recruitment_record: "Recruitment record",
  communication: "Communication",
  travel_record: "Travel record",
  practitioner_note: "Practitioner note",
  operational_financial_record: "Operational / financial",
  proceeding_record: "Proceeding record",
  support_provider_note: "Support-provider note",
  other: "Unclassified PDF",
};

function readableNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function AnalysisInputPreview({
  corpusResult,
  embedded = false,
  runtimeAvailable,
}: {
  corpusResult: AnalysisCorpusResult | null;
  embedded?: boolean;
  runtimeAvailable: boolean;
}) {
  const [query, setQuery] = useState("");
  const [documentId, setDocumentId] = useState("");
  const corpus = corpusResult?.ok ? corpusResult.corpus : null;
  const documentIds = useMemo(
    () =>
      corpus
        ? [...new Set(corpus.entries.map((entry) => entry.documentId))].sort()
        : [],
    [corpus],
  );
  const results = useMemo(
    () =>
      corpus
        ? searchAnalysisCorpus(corpus, {
            query,
            documentId: documentId || undefined,
          })
        : [],
    [corpus, documentId, query],
  );

  const blockedCopy = !runtimeAvailable
    ? "Restore the saved PDFs in this browser to reconstruct the current approved redacted corpus."
    : corpusResult?.ok === false &&
        corpusResult.reason === "no_extractable_text"
      ? "No extractable approved redacted text is available. Image-only pages require OCR."
      : corpusResult?.ok === false &&
          corpusResult.reason === "source_mapping_invalid"
        ? "The current extracted text no longer maps safely to this packet. Reprocess the PDFs."
        : "Complete mask review and pass the final local privacy check before inspecting analysis input.";

  return (
    <section
      aria-labelledby="analysis-input-preview-heading"
      className={
        embedded
          ? "bg-card px-3 py-3"
          : "rounded-xl border border-border bg-card px-4 py-3"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
              corpus
                ? "border-[color-mix(in_oklab,var(--sage)_42%,transparent)] bg-[color-mix(in_oklab,var(--sage)_12%,transparent)]"
                : "border-[color-mix(in_oklab,var(--amber)_42%,transparent)] bg-[color-mix(in_oklab,var(--amber)_12%,transparent)]"
            }`}
          >
            {corpus ? (
              <ShieldCheck
                aria-hidden="true"
                className="h-4 w-4 text-[color:var(--sage)]"
              />
            ) : (
              <TriangleAlert
                aria-hidden="true"
                className="h-4 w-4 text-[color:var(--amber)]"
              />
            )}
          </span>
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h2
                className={`font-serif leading-tight ${
                  embedded ? "text-base" : "text-lg"
                }`}
                id="analysis-input-preview-heading"
              >
                Analysis input preview
              </h2>
              <Chip tone={corpus ? "sage" : "amber"}>
                {corpus ? "Approved corpus ready" : "Blocked"}
              </Chip>
              {corpus ? (
                <Chip
                  tone={
                    corpus.summary.classifiedDocumentCount ===
                    corpus.summary.documentCount
                      ? "sage"
                      : "mute"
                  }
                >
                  {corpus.summary.classifiedDocumentCount}/
                  {corpus.summary.documentCount} sources classified
                </Chip>
              ) : null}
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              {corpus
                ? "This is the current approved redacted text projection. It stays in this browser and is not sent to a model. The deterministic scan cannot prove that every name or ambiguous personal detail was found. Structured Analysis for browser-created cases remains unavailable."
                : blockedCopy}
            </p>
          </div>
        </div>
      </div>

      {corpus ? (
        <>
          <dl
            className={`mt-3 grid grid-cols-2 gap-1.5 ${
              embedded ? "sm:grid-cols-4" : "sm:grid-cols-4 xl:grid-cols-8"
            }`}
          >
            {[
              ["Documents", corpus.summary.documentCount],
              ["Readable pages", corpus.summary.pageCount],
              ["Segments", corpus.summary.segmentCount],
              ["Words", corpus.summary.wordCount],
              ["Characters", corpus.summary.characterCount],
              ["Candidate eligible", corpus.summary.candidateEligibleSegmentCount],
              ["Evidence only", corpus.summary.evidenceOnlySegmentCount],
              ["Advisory signals", corpus.summary.advisorySegmentCount],
            ].map(([label, value]) => (
              <div
                className="rounded-md border border-border bg-muted/20 px-2.5 py-2"
                key={label}
              >
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-0.5 font-serif text-lg leading-none">
                  {readableNumber(Number(value))}
                </dd>
              </div>
            ))}
          </dl>

          {corpus.summary.omittedPageCount > 0 ? (
            <p className="mt-2 text-[11px] leading-4 text-[color:var(--rust)]">
              {corpus.summary.omittedPageCount} packet page
              {corpus.summary.omittedPageCount === 1 ? "" : "s"} omitted because
              no extractable text was available.
            </p>
          ) : null}

          <div className="mt-3 border-t border-border/70 pt-3">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem]">
              <div>
                <Label htmlFor="analysis-corpus-search">
                  Search approved redacted analysis text
                </Label>
                <div className="relative mt-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    className="pl-9"
                    id="analysis-corpus-search"
                    maxLength={120}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    placeholder="Search the approved redacted projection"
                    value={query}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="analysis-corpus-document">Document</Label>
                <Select
                  id="analysis-corpus-document"
                  onChange={(event) => setDocumentId(event.currentTarget.value)}
                  value={documentId}
                >
                  <option value="">All documents</option>
                  {documentIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {query.trim().length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Enter a term to inspect exact approved redacted document, page, and
                segment matches. Searches are not saved.
              </p>
            ) : results.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                No approved corpus matches this search.
              </p>
            ) : (
              <ol
                aria-label="Approved analysis corpus search results"
                className="mt-2 grid max-h-72 gap-2 overflow-y-auto pr-1"
              >
                {results.map((result) => (
                  <li
                    className="rounded-lg border border-border bg-background px-3 py-2"
                    key={result.segmentId}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {result.documentId} · page {result.pageNumber} ·{" "}
                        {result.segmentId}
                      </span>
                      <Chip
                        tone={
                          result.supportEligibility === "candidate_eligible"
                            ? "sage"
                            : "mute"
                        }
                      >
                        {result.supportEligibility === "candidate_eligible"
                          ? "Candidate eligible"
                          : "Evidence only"}
                      </Chip>
                      <Chip tone={result.sourceType === "other" ? "mute" : "sage"}>
                        {SOURCE_TYPE_LABELS[result.sourceType]}
                      </Chip>
                      {result.instructionAdvisory === "advisory_signal" ? (
                        <Chip tone="amber">Instruction-like advisory</Chip>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-foreground">
                      {result.snippet}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
