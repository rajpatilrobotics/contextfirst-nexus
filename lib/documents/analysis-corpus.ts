import type {
  DocumentRecord,
  MaskingReview,
  SourceSegment,
} from "../contracts";
import { buildRedactedSegments } from "../redaction";

export type AnalysisCorpusEntry = {
  segmentId: string;
  documentId: string;
  pageNumber: number;
  ordinal: number;
  text: string;
  characterCount: number;
  wordCount: number;
  sourceType: DocumentRecord["sourceType"];
  supportEligibility: SourceSegment["supportEligibility"];
  instructionAdvisory: SourceSegment["instructionAdvisory"];
};

export type AnalysisCorpus = {
  entries: AnalysisCorpusEntry[];
  summary: {
    documentCount: number;
    pageCount: number;
    segmentCount: number;
    wordCount: number;
    characterCount: number;
    candidateEligibleSegmentCount: number;
    evidenceOnlySegmentCount: number;
    advisorySegmentCount: number;
    classifiedDocumentCount: number;
    omittedPageCount: number;
  };
};

export type AnalysisCorpusResult =
  | { ok: true; corpus: AnalysisCorpus }
  | {
      ok: false;
      reason:
        | "privacy_review_incomplete"
        | "no_extractable_text"
        | "source_mapping_invalid";
    };

export type AnalysisCorpusSearchResult = {
  segmentId: string;
  documentId: string;
  pageNumber: number;
  sourceType: AnalysisCorpusEntry["sourceType"];
  supportEligibility: AnalysisCorpusEntry["supportEligibility"];
  instructionAdvisory: AnalysisCorpusEntry["instructionAdvisory"];
  snippet: string;
};

function countWords(text: string) {
  const normalized = text.trim();
  return normalized.length === 0 ? 0 : normalized.split(/\s+/u).length;
}

export function prepareAnalysisCorpus(input: {
  documents: readonly DocumentRecord[];
  segments: readonly SourceSegment[];
  masking: MaskingReview;
}): AnalysisCorpusResult {
  const redaction = buildRedactedSegments(input.segments, input.masking);
  if (!redaction.ok) {
    return { ok: false, reason: "privacy_review_incomplete" };
  }
  if (redaction.segments.length === 0) {
    return { ok: false, reason: "no_extractable_text" };
  }

  const documentsById = new Map(
    input.documents.map((document) => [document.id, document]),
  );
  const redactedById = new Map(
    redaction.segments.map((segment) => [segment.segmentId, segment.redactedText]),
  );
  const sourceMappingInvalid = input.segments.some((segment) => {
    const document = documentsById.get(segment.documentId);
    return (
      !document ||
      segment.pageNumber === undefined ||
      !document.pages.some((page) => page.pageNumber === segment.pageNumber) ||
      !redactedById.has(segment.id)
    );
  });
  if (sourceMappingInvalid) {
    return { ok: false, reason: "source_mapping_invalid" };
  }

  const entries = input.segments
    .map((segment) => {
      const text = redactedById.get(segment.id)?.trim() ?? "";
      const sourceType =
        documentsById.get(segment.documentId)?.sourceType ?? "other";
      return {
        segmentId: segment.id,
        documentId: segment.documentId,
        pageNumber: segment.pageNumber ?? 0,
        ordinal: segment.ordinal,
        text,
        characterCount: text.length,
        wordCount: countWords(text),
        sourceType,
        supportEligibility: segment.supportEligibility,
        instructionAdvisory: segment.instructionAdvisory,
      };
    })
    .filter((entry) => entry.text.length > 0)
    .sort(
      (left, right) =>
        left.documentId.localeCompare(right.documentId) ||
        left.pageNumber - right.pageNumber ||
        left.ordinal - right.ordinal ||
        left.segmentId.localeCompare(right.segmentId),
    );
  if (entries.length === 0) {
    return { ok: false, reason: "no_extractable_text" };
  }

  const documentIds = new Set(entries.map((entry) => entry.documentId));
  const pageIds = new Set(
    entries.map((entry) => `${entry.documentId}:${entry.pageNumber}`),
  );
  const totalPacketPages = input.documents.reduce(
    (total, document) => total + document.pages.length,
    0,
  );

  return {
    ok: true,
    corpus: {
      entries,
      summary: {
        documentCount: documentIds.size,
        pageCount: pageIds.size,
        segmentCount: entries.length,
        wordCount: entries.reduce((total, entry) => total + entry.wordCount, 0),
        characterCount: entries.reduce(
          (total, entry) => total + entry.characterCount,
          0,
        ),
        candidateEligibleSegmentCount: entries.filter(
          (entry) => entry.supportEligibility === "candidate_eligible",
        ).length,
        evidenceOnlySegmentCount: entries.filter(
          (entry) => entry.supportEligibility === "evidence_only",
        ).length,
        advisorySegmentCount: entries.filter(
          (entry) => entry.instructionAdvisory === "advisory_signal",
        ).length,
        classifiedDocumentCount: input.documents.filter(
          (document) =>
            documentIds.has(document.id) && document.sourceType !== "other",
        ).length,
        omittedPageCount: Math.max(0, totalPacketPages - pageIds.size),
      },
    },
  };
}

export function searchAnalysisCorpus(
  corpus: AnalysisCorpus,
  input: {
    query: string;
    documentId?: string;
    limit?: number;
  },
): AnalysisCorpusSearchResult[] {
  const tokens = input.query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/u)
    .filter(Boolean);
  if (tokens.length === 0) return [];

  const limit = Math.max(1, Math.min(input.limit ?? 20, 50));
  const results: AnalysisCorpusSearchResult[] = [];
  for (const entry of corpus.entries) {
    if (input.documentId && entry.documentId !== input.documentId) continue;
    const normalizedText = entry.text.toLocaleLowerCase();
    if (!tokens.every((token) => normalizedText.includes(token))) continue;

    const firstMatch = Math.min(
      ...tokens
        .map((token) => normalizedText.indexOf(token))
        .filter((index) => index >= 0),
    );
    const start = Math.max(0, firstMatch - 70);
    const end = Math.min(entry.text.length, firstMatch + 150);
    results.push({
      segmentId: entry.segmentId,
      documentId: entry.documentId,
      pageNumber: entry.pageNumber,
      sourceType: entry.sourceType,
      supportEligibility: entry.supportEligibility,
      instructionAdvisory: entry.instructionAdvisory,
      snippet: `${start > 0 ? "…" : ""}${entry.text.slice(start, end)}${
        end < entry.text.length ? "…" : ""
      }`,
    });
    if (results.length >= limit) break;
  }
  return results;
}
