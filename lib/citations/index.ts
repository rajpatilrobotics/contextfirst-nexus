import type {
  Citation,
  CitationResolutionDecision,
  EvidenceNature,
  SourceSegment,
} from "../contracts";
import { cfnDemoFixture, getCfnDemoSelectedSegmentIds } from "../fixtures";
import {
  REDACTION_MAP_VERSION,
  mapRedactedOffsetToOriginal,
  type SegmentRedactionMap,
} from "../redaction";

type CharacterRange = NonNullable<Citation["redactedSegmentRange"]>;
type CitationValidationStatus = Citation["validationStatus"];
type ResolutionMethod = "exact_codepoint" | "normalized_unique_lookup";

export type CitationPurpose = "supporting_candidate" | "evidence_only";

export type CitationProposal = {
  id?: string;
  analysisRunId: string;
  candidateId?: string;
  quotedText: string;
  documentId?: string;
  pageNumber?: number;
  pageId?: string;
  segmentId?: string;
  purpose?: CitationPurpose;
  claimedEvidenceNature?: EvidenceNature;
  sourceEvidenceNature?: EvidenceNature;
  segmentRedactionMaps?: Record<string, SegmentRedactionMap>;
  now?: string;
};

export type AmbiguityOption = {
  documentId: string;
  pageNumber?: number;
  pageId?: string;
  segmentId: string;
  redactedSegmentRange: CharacterRange;
  quotedText: string;
};

export type CitationFailureReason =
  | "empty_quote"
  | "unknown_segment"
  | "unknown_document"
  | "unknown_page"
  | "segment_not_allowlisted"
  | "location_mismatch"
  | "source_unavailable"
  | "support_not_candidate_eligible"
  | "evidence_nature_upgrade"
  | "quote_not_found"
  | "ambiguous_exact_match"
  | "unsafe_normalized_ambiguity"
  | "invalid_redaction_map"
  | "invalid_manual_selection";

export type CitationResolutionResult = {
  citation: Citation;
  ok: boolean;
  reason: CitationFailureReason | null;
  ambiguityOptions: AmbiguityOption[];
};

export type ManualCitationSelection = {
  decisionId: string;
  analysisRunId: string;
  candidateId: string;
  citationId: string;
  selectedSegmentId: string;
  selectedRedactedSegmentRange: CharacterRange;
  segmentRedactionMaps?: Record<string, SegmentRedactionMap>;
  now?: string;
};

const CASE_ID = "CFN-DEMO-001" as const;
const DEFAULT_NOW = "2026-07-16T00:00:00Z";
const TOKEN_PATTERN = /\[[A-Z0-9_]+\]/g;

const selectedSegmentIds = new Set(getCfnDemoSelectedSegmentIds());
const segments = cfnDemoFixture.segments as SourceSegment[];
const documents = cfnDemoFixture.documents;

function citationId(proposal: Pick<CitationProposal, "id" | "candidateId">): string {
  return proposal.id ?? `CITATION-${proposal.candidateId ?? "UNASSIGNED"}`;
}

function normalizeQuote(text: string): string {
  return text.normalize("NFC").replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();
}

function findAll(text: string, needle: string): CharacterRange[] {
  const ranges: CharacterRange[] = [];
  if (needle.length === 0) {
    return ranges;
  }

  let cursor = 0;
  while (cursor <= text.length) {
    const start = text.indexOf(needle, cursor);
    if (start === -1) {
      break;
    }
    ranges.push({ start, end: start + needle.length });
    cursor = start + Math.max(needle.length, 1);
  }

  return ranges;
}

function findNormalizedMatches(text: string, quote: string): CharacterRange[] {
  const normalizedQuote = normalizeQuote(quote);
  const matches: CharacterRange[] = [];

  for (let start = 0; start < text.length; start += 1) {
    for (let end = start + 1; end <= text.length; end += 1) {
      if (normalizeQuote(text.slice(start, end)) === normalizedQuote) {
        matches.push({ start, end });
      }
    }
  }

  return matches;
}

function pageForSegment(segment: SourceSegment) {
  if (!segment.pageId) {
    return null;
  }

  return (
    documents
      .find((document) => document.id === segment.documentId)
      ?.pages.find((page) => page.id === segment.pageId) ?? null
  );
}

function isSourceUnavailable(segment: SourceSegment): boolean {
  const page = pageForSegment(segment);
  return (
    segment.extractionQuality === "unavailable" ||
    !segment.pageId ||
    !page ||
    page.availability !== "available"
  );
}

function matchesClaimedLocation(segment: SourceSegment, proposal: CitationProposal): boolean {
  return (
    (!proposal.documentId || proposal.documentId === segment.documentId) &&
    (!proposal.pageId || proposal.pageId === segment.pageId) &&
    (!proposal.pageNumber || proposal.pageNumber === segment.pageNumber) &&
    (!proposal.segmentId || proposal.segmentId === segment.id)
  );
}

function baseCitation(
  proposal: CitationProposal,
  segment: SourceSegment | null,
  status: CitationValidationStatus,
): Omit<Citation, "validationStatus"> & { validationStatus: CitationValidationStatus } {
  return {
    id: citationId(proposal),
    caseId: CASE_ID,
    analysisRunId: proposal.analysisRunId,
    documentId: segment?.documentId ?? proposal.documentId ?? "D00",
    pageNumber: segment?.pageNumber ?? proposal.pageNumber,
    segmentId: segment?.id ?? proposal.segmentId ?? "D00-P0-S0",
    quotedText: "",
    normalizedQuotedText: "",
    quoteForm: "approved_redacted_derivative",
    redactionMapVersion: REDACTION_MAP_VERSION,
    sourceLanguage: "en",
    translationStatus: segment?.translationStatus ?? "unknown",
    extractionQuality: segment?.extractionQuality ?? "unavailable",
    validationStatus: status,
    redactedSegmentRange: null,
    sourceSegmentRange: null,
    boundingBoxes: [],
    resolutionMethod: null,
    resolvedBy: null,
  };
}

function failedCitation(
  proposal: CitationProposal,
  segment: SourceSegment | null,
  status: Exclude<CitationValidationStatus, "exact_match" | "manually_resolved">,
  reason: CitationFailureReason,
  ambiguityOptions: AmbiguityOption[] = [],
): CitationResolutionResult {
  return {
    ok: false,
    reason,
    ambiguityOptions,
    citation: baseCitation(proposal, segment, status) as Citation,
  };
}

function deriveSegmentMap(segment: SourceSegment): SegmentRedactionMap | null {
  if (segment.rawText === segment.redactedText) {
    return {
      version: REDACTION_MAP_VERSION,
      segmentId: segment.id,
      originalLength: segment.rawText.length,
      redactedLength: segment.redactedText.length,
      entries: [],
    };
  }

  const entries: SegmentRedactionMap["entries"] = [];
  let rawCursor = 0;
  let redactedCursor = 0;
  const tokens = [...segment.redactedText.matchAll(TOKEN_PATTERN)];

  for (const token of tokens) {
    const tokenStart = token.index;
    if (tokenStart === undefined) {
      return null;
    }

    const literalBefore = segment.redactedText.slice(redactedCursor, tokenStart);
    if (!segment.rawText.startsWith(literalBefore, rawCursor)) {
      return null;
    }
    rawCursor += literalBefore.length;

    const tokenText = token[0];
    const tokenEnd = tokenStart + tokenText.length;
    const nextToken = tokens[entries.length + 1];
    const nextLiteralEnd = nextToken?.index ?? segment.redactedText.length;
    const literalAfter = segment.redactedText.slice(tokenEnd, nextLiteralEnd);
    const nextLiteralStart =
      literalAfter.length === 0 ? segment.rawText.length : segment.rawText.indexOf(literalAfter, rawCursor);

    if (nextLiteralStart < rawCursor) {
      return null;
    }

    entries.push({
      maskId: `fixture-${segment.id}-${entries.length + 1}`,
      segmentId: segment.id,
      maskClass: maskClassForToken(tokenText),
      originalRange: { start: rawCursor, end: nextLiteralStart },
      redactedRange: { start: tokenStart, end: tokenEnd },
      replacementToken: tokenText,
    });

    rawCursor = nextLiteralStart;
    redactedCursor = tokenEnd;
  }

  if (!segment.rawText.endsWith(segment.redactedText.slice(redactedCursor))) {
    return null;
  }

  return {
    version: REDACTION_MAP_VERSION,
    segmentId: segment.id,
    originalLength: segment.rawText.length,
    redactedLength: segment.redactedText.length,
    entries,
  };
}

function maskClassForToken(token: string): SegmentRedactionMap["entries"][number]["maskClass"] {
  if (token.startsWith("[PASSPORT_")) {
    return "passport";
  }
  if (token.startsWith("[BANK_ACCOUNT_")) {
    return "bank_account";
  }
  if (token.startsWith("[EMAIL_")) {
    return "email";
  }
  if (token.startsWith("[PHONE_")) {
    return "phone";
  }
  if (token.startsWith("[ADDRESS_")) {
    return "address";
  }
  if (token.startsWith("[DATE_OF_BIRTH_")) {
    return "date_of_birth";
  }
  return "person_name";
}

function mapRange(
  segment: SourceSegment,
  range: CharacterRange,
  maps: Record<string, SegmentRedactionMap> = {},
): CharacterRange | null {
  const map = maps[segment.id] ?? deriveSegmentMap(segment);
  if (
    !map ||
    map.version !== REDACTION_MAP_VERSION ||
    map.segmentId !== segment.id ||
    map.redactedLength !== segment.redactedText.length ||
    map.originalLength !== segment.rawText.length
  ) {
    return null;
  }

  const start = mapRedactedOffsetToOriginal(map, range.start);
  const end = mapRedactedOffsetToOriginal(map, range.end);
  const sourceStart = start.kind === "point" ? start.offset : start.range.start;
  const sourceEnd = end.kind === "point" ? end.offset : end.range.end;

  if (sourceEnd <= sourceStart || sourceStart < 0 || sourceEnd > segment.rawText.length) {
    return null;
  }

  return { start: sourceStart, end: sourceEnd };
}

function successCitation(
  proposal: CitationProposal,
  segment: SourceSegment,
  range: CharacterRange,
  method: ResolutionMethod | "manual_segment_selection",
): CitationResolutionResult {
  const sourceSegmentRange = mapRange(segment, range, proposal.segmentRedactionMaps);
  if (!sourceSegmentRange || segment.boundingBoxes.length === 0) {
    return failedCitation(proposal, segment, "invalidated", "invalid_redaction_map");
  }

  const manual = method === "manual_segment_selection";
  return {
    ok: true,
    reason: null,
    ambiguityOptions: [],
    citation: {
      id: citationId(proposal),
      caseId: CASE_ID,
      analysisRunId: proposal.analysisRunId,
      documentId: segment.documentId,
      pageNumber: segment.pageNumber,
      segmentId: segment.id,
      quotedText: segment.redactedText.slice(range.start, range.end),
      normalizedQuotedText: normalizeQuote(segment.redactedText.slice(range.start, range.end)),
      quoteForm: "approved_redacted_derivative",
      redactionMapVersion: REDACTION_MAP_VERSION,
      sourceLanguage: "en",
      translationStatus: segment.translationStatus,
      extractionQuality: segment.extractionQuality,
      validationStatus: manual ? "manually_resolved" : "exact_match",
      redactedSegmentRange: range,
      sourceSegmentRange,
      boundingBoxes: segment.boundingBoxes,
      resolutionMethod: method,
      resolvedBy: manual ? "practitioner" : "system",
      validatedAt: proposal.now ?? DEFAULT_NOW,
    } as Citation,
  };
}

function eligibleSegments(proposal: CitationProposal): SourceSegment[] {
  if (proposal.segmentId) {
    const segment = segments.find((item) => item.id === proposal.segmentId);
    return segment ? [segment] : [];
  }

  return segments.filter((segment) => matchesClaimedLocation(segment, proposal));
}

function validateSegment(
  proposal: CitationProposal,
  segment: SourceSegment,
): CitationFailureReason | null {
  if (!selectedSegmentIds.has(segment.id)) {
    return "segment_not_allowlisted";
  }
  if (!matchesClaimedLocation(segment, proposal)) {
    return "location_mismatch";
  }
  if (isSourceUnavailable(segment)) {
    return "source_unavailable";
  }
  if ((proposal.purpose ?? "supporting_candidate") === "supporting_candidate" && segment.supportEligibility !== "candidate_eligible") {
    return "support_not_candidate_eligible";
  }
  if (
    proposal.claimedEvidenceNature === "documented_in_source" &&
    proposal.sourceEvidenceNature === "reported_or_alleged_in_source"
  ) {
    return "evidence_nature_upgrade";
  }

  return null;
}

export function resolveCitation(proposal: CitationProposal): CitationResolutionResult {
  const quote = proposal.quotedText;
  if (quote.trim().length === 0) {
    return failedCitation(proposal, null, "not_found", "empty_quote");
  }
  if (proposal.documentId && !documents.some((document) => document.id === proposal.documentId)) {
    return failedCitation(proposal, null, "source_unavailable", "unknown_document");
  }
  if (proposal.pageId) {
    const page = documents.flatMap((document) => document.pages).find((item) => item.id === proposal.pageId);
    if (!page || page.availability !== "available") {
      return failedCitation(proposal, null, "source_unavailable", page ? "source_unavailable" : "unknown_page");
    }
  }

  const candidates = eligibleSegments(proposal);
  if (proposal.segmentId && candidates.length === 0) {
    return failedCitation(proposal, null, "source_unavailable", "unknown_segment");
  }

  const exactMatches = candidates.flatMap((segment) =>
    findAll(segment.redactedText, quote).map((range) => ({ segment, range })),
  );
  const viableExactMatches = exactMatches.filter(({ segment }) => validateSegment(proposal, segment) === null);

  if (viableExactMatches.length === 1) {
    return successCitation(proposal, viableExactMatches[0].segment, viableExactMatches[0].range, "exact_codepoint");
  }

  if (viableExactMatches.length > 1) {
    const segmentIds = new Set(viableExactMatches.map(({ segment }) => segment.id));
    if (segmentIds.size === 1) {
      const ambiguityOptions = viableExactMatches.map(({ segment, range }) => ({
        documentId: segment.documentId,
        pageNumber: segment.pageNumber,
        pageId: segment.pageId,
        segmentId: segment.id,
        redactedSegmentRange: range,
        quotedText: segment.redactedText.slice(range.start, range.end),
      }));
      return failedCitation(
        proposal,
        viableExactMatches[0].segment,
        "ambiguous_match",
        "ambiguous_exact_match",
        ambiguityOptions,
      );
    }

    return failedCitation(proposal, viableExactMatches[0].segment, "ambiguous_match", "unsafe_normalized_ambiguity");
  }

  const firstExact = exactMatches[0]?.segment ?? candidates[0] ?? null;
  if (firstExact) {
    const segmentFailure = validateSegment(proposal, firstExact);
    if (segmentFailure) {
      const status = segmentFailure === "source_unavailable" ? "source_unavailable" : "semantic_mismatch";
      return failedCitation(proposal, firstExact, status, segmentFailure);
    }
  }

  const normalizedMatches = candidates.flatMap((segment) =>
    findNormalizedMatches(segment.redactedText, quote).map((range) => ({ segment, range })),
  );
  const viableNormalizedMatches = normalizedMatches.filter(
    ({ segment }) => validateSegment(proposal, segment) === null,
  );

  if (viableNormalizedMatches.length === 1) {
    return successCitation(
      proposal,
      viableNormalizedMatches[0].segment,
      viableNormalizedMatches[0].range,
      "normalized_unique_lookup",
    );
  }

  if (viableNormalizedMatches.length > 1) {
    return failedCitation(
      proposal,
      viableNormalizedMatches[0].segment,
      "ambiguous_match",
      "unsafe_normalized_ambiguity",
    );
  }

  return failedCitation(proposal, firstExact, "not_found", "quote_not_found");
}

export function resolveManualCitation(
  previous: CitationResolutionResult,
  selection: ManualCitationSelection,
): { citation: Citation; decision: CitationResolutionDecision } | { citation: Citation; reason: CitationFailureReason } {
  const selected = previous.ambiguityOptions.find(
    (option) =>
      option.segmentId === selection.selectedSegmentId &&
      option.redactedSegmentRange.start === selection.selectedRedactedSegmentRange.start &&
      option.redactedSegmentRange.end === selection.selectedRedactedSegmentRange.end,
  );
  const segment = segments.find((item) => item.id === selection.selectedSegmentId) ?? null;

  if (!selected || !segment || previous.citation.validationStatus !== "ambiguous_match") {
    return {
      citation: baseCitation(
        {
          id: selection.citationId,
          analysisRunId: selection.analysisRunId,
          segmentId: selection.selectedSegmentId,
          segmentRedactionMaps: selection.segmentRedactionMaps,
          quotedText: "",
          now: selection.now,
        },
        segment,
        "invalidated",
      ) as Citation,
      reason: "invalid_manual_selection",
    };
  }

  const resolved = successCitation(
    {
      id: selection.citationId,
      analysisRunId: selection.analysisRunId,
      segmentId: selection.selectedSegmentId,
      quotedText: selected.quotedText,
      segmentRedactionMaps: selection.segmentRedactionMaps,
      purpose: "supporting_candidate",
      now: selection.now,
    },
    segment,
    selection.selectedRedactedSegmentRange,
    "manual_segment_selection",
  );

  if (!resolved.ok) {
    return { citation: resolved.citation, reason: resolved.reason ?? "invalid_manual_selection" };
  }

  return {
    citation: resolved.citation,
    decision: {
      id: selection.decisionId,
      caseId: CASE_ID,
      analysisRunId: selection.analysisRunId,
      candidateId: selection.candidateId,
      citationId: selection.citationId,
      previousValidationStatus: "ambiguous_match",
      selectedSegmentId: selection.selectedSegmentId,
      selectedRedactedSegmentRange: selection.selectedRedactedSegmentRange,
      resultingValidationStatus: "manually_resolved",
      resolutionMethod: "manual_segment_selection",
      actor: "current_practitioner",
      createdAt: selection.now ?? DEFAULT_NOW,
    },
  };
}
