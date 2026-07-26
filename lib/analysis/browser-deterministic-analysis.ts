import {
  AnalysisExecutionResultSchema,
  CaseCandidateSchema,
  CitationSchema,
  type AnalysisExecutionResult,
  type CaseCandidate,
  type Citation,
  type DocumentRecord,
  type ReviewLane,
  type SourceSegment,
} from "../contracts";

const VERSION = "1.0.0" as const;
const MAX_CANDIDATES = 30;
const MAX_QUOTE_LENGTH = 320;

type ReviewRule = {
  code: string;
  lane: ReviewLane;
  title: string;
  patterns: readonly RegExp[];
  reviewQuestion: string;
};

const REVIEW_RULES: readonly ReviewRule[] = [
  {
    code: "A-RECRUITMENT",
    lane: "trafficking_indicators",
    title: "Recruitment or deception language",
    patterns: [
      /\brecruit(?:ed|er|ers|ing|ment)?\b/i,
      /\bjob offer\b/i,
      /\bfalse promis(?:e|es)\b/i,
      /\bmisled\b/i,
      /\bdecei(?:ve|ved|ving|t|ts|ption)\b/i,
      /\badvertis(?:e|ed|ement|ements|ing)\b/i,
    ],
    reviewQuestion:
      "Does this source language warrant practitioner review for recruitment or deception context?",
  },
  {
    code: "A-MOVEMENT",
    lane: "trafficking_indicators",
    title: "Movement, travel, or accommodation language",
    patterns: [
      /\btravel(?:led|ed|ing)?\b/i,
      /\btransport(?:ed|ation|ing)?\b/i,
      /\bpassport\b/i,
      /\bborder\b/i,
      /\bshared housing\b/i,
      /\baccommodation\b/i,
      /\bmoved (?:me|them|us)\b/i,
    ],
    reviewQuestion:
      "What context, if any, connects this movement, travel, or accommodation language to the stated purpose?",
  },
  {
    code: "A-CONTROL",
    lane: "trafficking_indicators",
    title: "Restriction, threat, or control language",
    patterns: [
      /\bthreat(?:en|ened|ening|ens|s)?\b/i,
      /\bcoerc(?:e|ed|ion|ive)\b/i,
      /\brestrict(?:ed|ing|ion|ions)\b/i,
      /\bconfin(?:e|ed|ement)\b/i,
      /\blocked (?:in|inside)\b/i,
      /\bwithheld\b/i,
      /\bretained? (?:my |the )?passport\b/i,
      /\bnot allowed to leave\b/i,
      /\bcould not leave\b/i,
      /\bdebt(?:s| bondage)?\b/i,
    ],
    reviewQuestion:
      "Does the surrounding source context support retaining this as a possible restriction, threat, or control indicator?",
  },
  {
    code: "A-WORK",
    lane: "trafficking_indicators",
    title: "Work-condition or withheld-payment language",
    patterns: [
      /\bforced to work\b/i,
      /\bmade (?:me|them|us) work\b/i,
      /\bworking without pay\b/i,
      /\bunpaid wages?\b/i,
      /\bwages? (?:were )?withheld\b/i,
      /\bexcessive hours?\b/i,
      /\bpay deduction(?:s)?\b/i,
    ],
    reviewQuestion:
      "Does the source provide enough context for a practitioner to assess this work-condition or payment language?",
  },
  {
    code: "B-COMPELLED",
    lane: "non_punishment_relevance",
    title: "Compelled-conduct language",
    patterns: [
      /\b(?:ordered|instructed|forced|compelled|required) (?:me|them|us|the person)? ?to\b/i,
      /\bmade (?:me|them|us) (?:send|transfer|carry|sign|open|withdraw|deposit|message)\b/i,
      /\btold (?:me|them|us) to (?:send|transfer|carry|sign|open|withdraw|deposit|message)\b/i,
    ],
    reviewQuestion:
      "What, if any, relationship does the source describe between this conduct and pressure or compulsion?",
  },
  {
    code: "B-PROCEEDING",
    lane: "non_punishment_relevance",
    title: "Proceeding or alleged-offence language",
    patterns: [
      /\barrest(?:ed|s)?\b/i,
      /\bcharg(?:e|ed|es|ing)\b/i,
      /\boffen[cs]e(?:s)?\b/i,
      /\bprosecut(?:e|ed|ion|ing)\b/i,
      /\bdetain(?:ed|ment)\b/i,
      /\billegal\b/i,
      /\bfraud(?:ulent)?\b/i,
      /\bpolice\b/i,
    ],
    reviewQuestion:
      "Is this proceeding or alleged-offence language relevant to a qualified non-punishment review without determining eligibility?",
  },
  {
    code: "C-SAFETY",
    lane: "protection_remedy_urgency",
    title: "Immediate safety or retaliation language",
    patterns: [
      /\burgent(?:ly)?\b/i,
      /\bimmediate danger\b/i,
      /\bunsafe\b/i,
      /\bviolence\b/i,
      /\bretaliat(?:e|ed|ion|ory)\b/i,
      /\binjur(?:y|ies|ed)\b/i,
      /\bthreat(?:en|ened|ening|ens|s)?\b/i,
      /\bhomeless\b/i,
      /\bemergency shelter\b/i,
    ],
    reviewQuestion:
      "Does this source language indicate a safety question that requires prompt practitioner review?",
  },
  {
    code: "C-ACCESS",
    lane: "protection_remedy_urgency",
    title: "Health, interpretation, or accessibility language",
    patterns: [
      /\bmedical\b/i,
      /\bhospital\b/i,
      /\bmedication\b/i,
      /\bmental health\b/i,
      /\bcounsell?ing\b/i,
      /\binterpreter\b/i,
      /\btranslation support\b/i,
      /\blanguage support\b/i,
      /\bdisabilit(?:y|ies)\b/i,
      /\baccessibility\b/i,
    ],
    reviewQuestion:
      "What support, if any, should a practitioner verify in response to this health, interpretation, or accessibility language?",
  },
  {
    code: "C-PROCEDURAL",
    lane: "protection_remedy_urgency",
    title: "Time-sensitive support language",
    patterns: [
      /\bcourt date\b/i,
      /\bhearing\b/i,
      /\bdeadline\b/i,
      /\blegal aid\b/i,
      /\blawyer\b/i,
      /\bsafe contact\b/i,
      /\bchildcare\b/i,
      /\bhousing\b/i,
      /\bfood support\b/i,
    ],
    reviewQuestion:
      "Does this source language identify a time-sensitive support or procedural question for practitioner review?",
  },
] as const;

export type BrowserDeterministicAnalysisResult = {
  run: AnalysisExecutionResult;
  candidates: CaseCandidate[];
  citations: Citation[];
};

export function buildBrowserDeterministicAnalysis(input: {
  caseId: string;
  approvedRedactedInputDigest: string;
  documents: readonly DocumentRecord[];
  segments: readonly SourceSegment[];
  runId?: string;
  completedAt?: string;
}): BrowserDeterministicAnalysisResult {
  const completedAt = input.completedAt ?? new Date().toISOString();
  const runId =
    input.runId ??
    `RUN-LOCAL-${input.approvedRedactedInputDigest.slice(0, 12).toUpperCase()}`;
  const documentsById = new Map(
    input.documents.map((document) => [document.id, document]),
  );
  const candidates: CaseCandidate[] = [];
  const citations: Citation[] = [];
  const eligibleSegments = [...input.segments]
    .filter(
      (segment) =>
        segment.supportEligibility === "candidate_eligible" &&
        segment.instructionAdvisory !== "advisory_signal" &&
        segment.extractionQuality !== "unavailable" &&
        segment.redactedText.trim().length > 0,
    )
    .sort(compareSegments);

  for (const segment of eligibleSegments) {
    if (!documentsById.has(segment.documentId)) {
      throw new Error(
        `Source segment ${segment.id} does not reference an available document.`,
      );
    }
    for (const rule of REVIEW_RULES) {
      const matched = firstRuleMatch(segment.redactedText, rule);
      if (!matched) continue;
      const quote = exactReviewExcerpt(
        segment.redactedText,
        matched.index,
        matched.length,
      );
      const ordinal = candidates.length + 1;
      const suffix = String(ordinal).padStart(4, "0");
      const candidateId = `CAND-LOCAL-${rule.code}-${suffix}`;
      const citationId = `CIT-LOCAL-${rule.code}-${suffix}`;
      const dependencyId = `DEP-LOCAL-${rule.code}-${suffix}`;
      const pageLabel = segment.pageNumber
        ? ` · page ${segment.pageNumber}`
        : "";

      citations.push(
        CitationSchema.parse({
          id: citationId,
          caseId: input.caseId,
          analysisRunId: runId,
          documentId: segment.documentId,
          ...(segment.pageNumber ? { pageNumber: segment.pageNumber } : {}),
          segmentId: segment.id,
          quotedText: quote.text,
          normalizedQuotedText: normalizeQuotedText(quote.text),
          quoteForm: "approved_redacted_derivative",
          redactionMapVersion: VERSION,
          sourceLanguage: segment.sourceLanguage,
          translationStatus: segment.translationStatus,
          extractionQuality: segment.extractionQuality,
          validationStatus: "exact_match",
          redactedSegmentRange: {
            start: quote.start,
            end: quote.end,
          },
          sourceSegmentRange: {
            start: quote.start,
            end: quote.end,
          },
          boundingBoxes: segment.boundingBoxes,
          resolutionMethod: "exact_codepoint",
          resolvedBy: "system",
          validatedAt: completedAt,
        }),
      );
      candidates.push(
        CaseCandidateSchema.parse({
          id: candidateId,
          revision: 0,
          caseId: input.caseId,
          analysisRunId: runId,
          kind: "review_lane_item",
          lane: rule.lane,
          title: `${rule.title}${pageLabel}`,
          proposedText:
            `The approved source contains language matching the transparent browser-local review rule for ${rule.title.toLowerCase()}. This is a review prompt, not a finding.`,
          currentText:
            `The approved source contains language matching the transparent browser-local review rule for ${rule.title.toLowerCase()}. This is a review prompt, not a finding.`,
          currentTextOrigin: "source_extraction",
          itemOrigin: "source_extraction",
          assertionMode: "neutral_procedural_fact",
          reviewRequirement: "individual",
          inclusionStatus: "active",
          supportStatus: "exact_source_supported",
          reviewStatus: "pending",
          dependencies: [
            {
              id: dependencyId,
              kind: "source",
              sourceSegmentId: segment.id,
              citationId,
              evidenceNature: "documented_in_source",
              relationship: "context_only",
              active: true,
            },
          ],
          relatedCoverageIssueIds: [],
          unknowns: [
            "The meaning, surrounding context, and legal relevance of this language have not been determined.",
            "Browser-local deterministic review is pattern-based, not semantic AI analysis, and is capped at 30 review prompts per run.",
          ],
          reviewQuestion: rule.reviewQuestion,
          consequential: false,
          prohibitedConclusionCheck: "passed",
          safeShareRecipientCategories: [],
          createdAt: completedAt,
        }),
      );
      if (candidates.length >= MAX_CANDIDATES) break;
    }
    if (candidates.length >= MAX_CANDIDATES) break;
  }

  const run = AnalysisExecutionResultSchema.parse({
    id: runId,
    mode: "deterministic_replay",
    provider: {
      providerId: "local_replay",
      releaseConfigurationId: "prepared-replay-v1",
      requestedModel: "frozen_replay_output",
      serviceTier: "local",
      adapterVersion: "browser-deterministic-analysis-v1",
      returnedModel: null,
      inferenceSetting: { kind: "not_applicable", value: "not_applicable" },
      disclosureVersion: VERSION,
      providerTransmission: false,
    },
    promptVersion: VERSION,
    requestSchemaVersion: VERSION,
    responseSchemaVersion: VERSION,
    fixtureVersion: VERSION,
    rulesetVersion: VERSION,
    checkpointProvenance: null,
    startedAt: completedAt,
    completedAt,
    durationMs: 0,
    inputSegmentCount: eligibleSegments.length,
    candidateCount: candidates.length,
    citationCount: citations.length,
    quarantinedCount: 0,
    status: "succeeded",
    failure: null,
  });

  return { run, candidates, citations };
}

function compareSegments(left: SourceSegment, right: SourceSegment) {
  const documentOrder = left.documentId.localeCompare(right.documentId);
  if (documentOrder !== 0) return documentOrder;
  const pageOrder =
    (left.pageNumber ?? Number.MAX_SAFE_INTEGER) -
    (right.pageNumber ?? Number.MAX_SAFE_INTEGER);
  if (pageOrder !== 0) return pageOrder;
  const ordinalOrder = left.ordinal - right.ordinal;
  return ordinalOrder !== 0 ? ordinalOrder : left.id.localeCompare(right.id);
}

function firstRuleMatch(text: string, rule: ReviewRule) {
  const matches = rule.patterns
    .map((pattern) => {
      const match = pattern.exec(text);
      return match
        ? { index: match.index, length: match[0].length }
        : null;
    })
    .filter(
      (match): match is { index: number; length: number } => match !== null,
    )
    .sort((left, right) => left.index - right.index);
  return matches[0] ?? null;
}

function exactReviewExcerpt(
  text: string,
  matchStart: number,
  matchLength: number,
) {
  const sentenceStart = Math.max(
    text.lastIndexOf(".", matchStart - 1),
    text.lastIndexOf("!", matchStart - 1),
    text.lastIndexOf("?", matchStart - 1),
    text.lastIndexOf("\n", matchStart - 1),
  );
  const nextBoundaries = [".", "!", "?", "\n"]
    .map((delimiter) => text.indexOf(delimiter, matchStart + matchLength))
    .filter((index) => index >= 0);
  const sentenceEnd = nextBoundaries.length
    ? Math.min(...nextBoundaries) + 1
    : text.length;
  let start = sentenceStart < 0 ? 0 : sentenceStart + 1;
  let end = sentenceEnd;
  while (start < end && /\s/.test(text[start] ?? "")) start += 1;
  while (end > start && /\s/.test(text[end - 1] ?? "")) end -= 1;

  if (end - start > MAX_QUOTE_LENGTH) {
    const radius = Math.floor(MAX_QUOTE_LENGTH / 2);
    start = Math.max(start, matchStart - radius);
    end = Math.min(end, start + MAX_QUOTE_LENGTH);
    if (end < matchStart + matchLength) {
      end = matchStart + matchLength;
      start = Math.max(0, end - MAX_QUOTE_LENGTH);
    }
    while (start < matchStart && /\s/.test(text[start] ?? "")) start += 1;
    while (end > matchStart + matchLength && /\s/.test(text[end - 1] ?? "")) {
      end -= 1;
    }
  }

  return { start, end, text: text.slice(start, end) };
}

function normalizeQuotedText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
