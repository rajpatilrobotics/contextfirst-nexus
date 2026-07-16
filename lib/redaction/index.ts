import type { MaskClass, MaskingReview, SourceSegment } from "../contracts";

type MaskSuggestion = MaskingReview["suggestions"][number];

export const REDACTION_MAP_VERSION = "1.0.0" as const;

export const SUPPORTED_MASK_CLASSES = [
  "person_name",
  "email",
  "phone",
  "passport",
  "bank_account",
  "address",
  "date_of_birth",
] as const satisfies readonly MaskClass[];

export const DEFAULT_REPLACEMENT_TOKENS: Record<MaskClass, string> = {
  person_name: "[Person name masked]",
  email: "[Email masked]",
  phone: "[Phone masked]",
  passport: "[Passport masked]",
  bank_account: "[Bank account masked]",
  address: "[Address masked]",
  date_of_birth: "[Date of birth masked]",
};

export type DetectionMethod = MaskSuggestion["detectionMethod"];
export type MaskReviewStatus = MaskSuggestion["reviewStatus"];

export type RedactionRange = {
  start: number;
  end: number;
};

export type RedactionMapEntry = {
  maskId: string;
  segmentId: string;
  maskClass: MaskClass;
  originalRange: RedactionRange;
  redactedRange: RedactionRange;
  replacementToken: string;
};

export type SegmentRedactionMap = {
  version: typeof REDACTION_MAP_VERSION;
  segmentId: string;
  originalLength: number;
  redactedLength: number;
  entries: RedactionMapEntry[];
};

export type RedactedSegment = {
  segmentId: string;
  rawText: string;
  redactedText: string;
  map: SegmentRedactionMap;
};

export type SafeIssue = {
  code:
    | "invalid_range"
    | "unsupported_class"
    | "unsafe_replacement_token"
    | "overlapping_masks"
    | "pending_mask"
    | "rejected_mask"
    | "mask_review_not_approved"
    | "leak_scan_not_passed";
  maskId?: string;
  segmentId?: string;
  maskClass?: MaskClass;
  range?: RedactionRange;
  checkName: string;
};

export type BuildRedactionResult =
  | {
      ok: true;
      segments: RedactedSegment[];
    }
  | {
      ok: false;
      issues: SafeIssue[];
    };

export type OffsetMappingResult =
  | {
      kind: "point";
      offset: number;
    }
  | {
      kind: "masked";
      maskId: string;
      range: RedactionRange;
    };

export type ReviewInvalidation = {
  maskingRevisionDelta: 1;
  caseRevisionDelta: 1;
  staleAnalysis: true;
  staleExport: true;
  staleGate: true;
};

export type ReviewMutationResult = {
  review: MaskingReview;
  invalidation: ReviewInvalidation;
};

export type LeakCheckName = "provider_payload" | "safe_share";

export type LeakFinding = {
  checkName: LeakCheckName;
  checkKind: "supported_pattern" | "sensitive_term_list" | "policy_disallowed_literal";
  maskClass?: MaskClass;
  segmentId?: string;
  range: RedactionRange;
};

export type LeakScanResult =
  | {
      ok: true;
      checkName: LeakCheckName;
      leakScanStatus: "passed";
      failedClasses: [];
      findings: [];
    }
  | {
      ok: false;
      checkName: LeakCheckName;
      leakScanStatus: "failed";
      failedClasses: MaskClass[];
      findings: LeakFinding[];
    };

export type LeakScanOptions = {
  sensitiveTerms?: readonly string[];
  policyDisallowedLiterals?: readonly string[];
};

type SegmentInput = Pick<SourceSegment, "id" | "rawText">;
type PatternDetector = {
  maskClass: Exclude<MaskClass, "person_name">;
  pattern: RegExp;
};

const PATTERN_DETECTORS: PatternDetector[] = [
  {
    maskClass: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(?:test|org|com|net)\b/g,
  },
  {
    maskClass: "phone",
    pattern: /(?:\+1\s*)?\b\d{3}-555-\d{4}\b/g,
  },
  {
    maskClass: "passport",
    pattern: /\b[A-Z]\d{7}\b/g,
  },
  {
    maskClass: "bank_account",
    pattern: /\b\d{12}\b/g,
  },
  {
    maskClass: "address",
    pattern: /\b\d{1,5}\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+(?:Lane|Street|Road|Avenue),\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\b/g,
  },
  {
    maskClass: "date_of_birth",
    pattern: /\b1997-08-14\b/g,
  },
];

const INVALIDATION: ReviewInvalidation = {
  maskingRevisionDelta: 1,
  caseRevisionDelta: 1,
  staleAnalysis: true,
  staleExport: true,
  staleGate: true,
};

export function createEmptyMaskingReview(revision = 0): MaskingReview {
  return {
    redactionMapVersion: REDACTION_MAP_VERSION,
    revision,
    reviewStatus: "pending",
    suggestions: [],
    declaredSupportedClasses: [...SUPPORTED_MASK_CLASSES],
    reviewedBy: null,
    leakScanStatus: "not_run",
    failedClasses: [],
  };
}

export function detectMaskSuggestions(
  segments: readonly SegmentInput[],
  options: { sensitiveTerms?: readonly string[] } = {},
): MaskSuggestion[] {
  const suggestions: MaskSuggestion[] = [];
  const normalizedTerms = uniqueStrings(options.sensitiveTerms ?? []);

  for (const segment of segments) {
    for (const detector of PATTERN_DETECTORS) {
      suggestions.push(
        ...detectPattern(segment, detector.maskClass, detector.pattern, "deterministic_pattern"),
      );
    }

    for (const term of normalizedTerms) {
      suggestions.push(...detectLiteral(segment, "person_name", term, "sensitive_term_list"));
    }
  }

  return stableUniqueSuggestions(suggestions);
}

export function makeManualSuggestion(input: {
  segmentId: string;
  originalStart: number;
  originalEnd: number;
  maskClass: MaskClass;
  replacementToken?: string;
  reviewStatus?: MaskReviewStatus;
}): MaskSuggestion {
  const replacementToken = input.replacementToken ?? DEFAULT_REPLACEMENT_TOKENS[input.maskClass];
  return {
    id: makeSuggestionId(input.segmentId, input.maskClass, input.originalStart, input.originalEnd),
    segmentId: input.segmentId,
    maskClass: input.maskClass,
    originalStart: input.originalStart,
    originalEnd: input.originalEnd,
    redactedStart: input.originalStart,
    redactedEnd: input.originalStart + replacementToken.length,
    replacementToken,
    detectionMethod: "deterministic_pattern",
    reviewStatus: input.reviewStatus ?? "pending",
  };
}

export function approveMaskingReview(
  review: MaskingReview,
  segments: readonly SegmentInput[],
  approvedAt = "2026-07-16T00:00:00.000Z",
): { ok: true; review: MaskingReview } | { ok: false; issues: SafeIssue[] } {
  const validation = validateEffectiveMasks(review.suggestions, segments, {
    requireReviewed: true,
  });

  if (validation.length > 0) {
    return { ok: false, issues: validation };
  }

  return {
    ok: true,
    review: {
      ...review,
      reviewStatus: "approved",
      reviewedBy: "current_practitioner",
      approvedAt,
      leakScanStatus: "not_run",
      failedClasses: [],
    },
  };
}

export function reviewMask(
  review: MaskingReview,
  maskId: string,
  reviewStatus: MaskReviewStatus,
  replacementToken?: string,
): ReviewMutationResult {
  const suggestions = review.suggestions.map((suggestion) => {
    if (suggestion.id !== maskId) {
      return suggestion;
    }

    const nextToken = replacementToken ?? suggestion.replacementToken;
    return {
      ...suggestion,
      reviewStatus,
      replacementToken: nextToken,
      redactedEnd: suggestion.redactedStart + nextToken.length,
    };
  });

  return invalidateReview({ ...review, suggestions });
}

export function addMaskSuggestion(
  review: MaskingReview,
  suggestion: MaskSuggestion,
): ReviewMutationResult {
  return invalidateReview({
    ...review,
    suggestions: stableUniqueSuggestions([...review.suggestions, suggestion]),
  });
}

export function removeMaskSuggestion(review: MaskingReview, maskId: string): ReviewMutationResult {
  return invalidateReview({
    ...review,
    suggestions: review.suggestions.filter((suggestion) => suggestion.id !== maskId),
  });
}

export function buildRedactedSegments(
  segments: readonly SegmentInput[],
  review: MaskingReview,
): BuildRedactionResult {
  const preflight = validateTransmissionReadiness(review, segments);
  if (!preflight.ok) {
    return { ok: false, issues: preflight.issues };
  }

  const redactedSegments = segments.map((segment) =>
    buildSegmentRedaction(segment, effectiveSuggestionsForSegment(review.suggestions, segment.id)),
  );

  return { ok: true, segments: redactedSegments };
}

export function buildSegmentRedaction(
  segment: SegmentInput,
  masks: readonly MaskSuggestion[],
): RedactedSegment {
  const sortedMasks = [...masks].sort(compareSuggestions);
  let cursor = 0;
  let redactedText = "";
  const entries: RedactionMapEntry[] = [];

  for (const mask of sortedMasks) {
    redactedText += segment.rawText.slice(cursor, mask.originalStart);
    const redactedStart = redactedText.length;
    redactedText += mask.replacementToken;
    const redactedEnd = redactedText.length;
    cursor = mask.originalEnd;
    entries.push({
      maskId: mask.id,
      segmentId: segment.id,
      maskClass: mask.maskClass,
      originalRange: { start: mask.originalStart, end: mask.originalEnd },
      redactedRange: { start: redactedStart, end: redactedEnd },
      replacementToken: mask.replacementToken,
    });
  }

  redactedText += segment.rawText.slice(cursor);

  return {
    segmentId: segment.id,
    rawText: segment.rawText,
    redactedText,
    map: {
      version: REDACTION_MAP_VERSION,
      segmentId: segment.id,
      originalLength: segment.rawText.length,
      redactedLength: redactedText.length,
      entries,
    },
  };
}

export function mapOriginalOffsetToRedacted(
  map: SegmentRedactionMap,
  originalOffset: number,
): OffsetMappingResult {
  let delta = 0;

  for (const entry of map.entries) {
    if (originalOffset < entry.originalRange.start) {
      return { kind: "point", offset: originalOffset + delta };
    }

    if (originalOffset < entry.originalRange.end) {
      return { kind: "masked", maskId: entry.maskId, range: entry.redactedRange };
    }

    delta += rangeLength(entry.redactedRange) - rangeLength(entry.originalRange);
  }

  return { kind: "point", offset: originalOffset + delta };
}

export function mapRedactedOffsetToOriginal(
  map: SegmentRedactionMap,
  redactedOffset: number,
): OffsetMappingResult {
  let delta = 0;

  for (const entry of map.entries) {
    if (redactedOffset < entry.redactedRange.start) {
      return { kind: "point", offset: redactedOffset - delta };
    }

    if (redactedOffset < entry.redactedRange.end) {
      return { kind: "masked", maskId: entry.maskId, range: entry.originalRange };
    }

    delta += rangeLength(entry.redactedRange) - rangeLength(entry.originalRange);
  }

  return { kind: "point", offset: redactedOffset - delta };
}

export function validateTransmissionReadiness(
  review: MaskingReview,
  segments: readonly SegmentInput[],
): { ok: true } | { ok: false; issues: SafeIssue[] } {
  const issues: SafeIssue[] = [];

  if (review.reviewStatus !== "approved") {
    issues.push({ code: "mask_review_not_approved", checkName: "review_status" });
  }

  if (review.leakScanStatus !== "passed" || review.failedClasses.length !== 0) {
    issues.push({ code: "leak_scan_not_passed", checkName: "leak_scan_status" });
  }

  issues.push(...validateEffectiveMasks(review.suggestions, segments, { requireReviewed: true }));

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true };
}

export function scanProviderPayload(
  serializedText: string,
  options: LeakScanOptions = {},
): LeakScanResult {
  return scanSerializedText("provider_payload", serializedText, options);
}

export function scanSafeShare(
  serializedText: string,
  options: LeakScanOptions = {},
): LeakScanResult {
  return scanSerializedText("safe_share", serializedText, options);
}

export function applyLeakScanResult(review: MaskingReview, result: LeakScanResult): MaskingReview {
  return {
    ...review,
    leakScanStatus: result.leakScanStatus,
    failedClasses: result.failedClasses,
  };
}

function detectPattern(
  segment: SegmentInput,
  maskClass: Exclude<MaskClass, "person_name">,
  pattern: RegExp,
  detectionMethod: DetectionMethod,
): MaskSuggestion[] {
  const suggestions: MaskSuggestion[] = [];
  const detector = new RegExp(pattern.source, pattern.flags);

  for (const match of segment.rawText.matchAll(detector)) {
    if (typeof match.index !== "number") {
      continue;
    }

    suggestions.push(
      makeDetectedSuggestion(segment.id, maskClass, match.index, match.index + match[0].length, detectionMethod),
    );
  }

  return suggestions;
}

function detectLiteral(
  segment: SegmentInput,
  maskClass: MaskClass,
  literal: string,
  detectionMethod: DetectionMethod,
): MaskSuggestion[] {
  const suggestions: MaskSuggestion[] = [];
  const normalizedLiteral = literal.trim();
  if (normalizedLiteral.length === 0) {
    return suggestions;
  }

  let cursor = 0;
  while (cursor < segment.rawText.length) {
    const index = segment.rawText.indexOf(normalizedLiteral, cursor);
    if (index === -1) {
      break;
    }

    suggestions.push(
      makeDetectedSuggestion(segment.id, maskClass, index, index + normalizedLiteral.length, detectionMethod),
    );
    cursor = index + normalizedLiteral.length;
  }

  return suggestions;
}

function makeDetectedSuggestion(
  segmentId: string,
  maskClass: MaskClass,
  originalStart: number,
  originalEnd: number,
  detectionMethod: DetectionMethod,
): MaskSuggestion {
  const replacementToken = DEFAULT_REPLACEMENT_TOKENS[maskClass];
  return {
    id: makeSuggestionId(segmentId, maskClass, originalStart, originalEnd),
    segmentId,
    maskClass,
    originalStart,
    originalEnd,
    redactedStart: originalStart,
    redactedEnd: originalStart + replacementToken.length,
    replacementToken,
    detectionMethod,
    reviewStatus: "pending",
  };
}

function makeSuggestionId(segmentId: string, maskClass: MaskClass, start: number, end: number): string {
  return `mask-${segmentId}-${maskClass}-${start}-${end}`;
}

function validateEffectiveMasks(
  suggestions: readonly MaskSuggestion[],
  segments: readonly SegmentInput[],
  options: { requireReviewed: boolean },
): SafeIssue[] {
  const issues: SafeIssue[] = [];
  const segmentById = new Map(segments.map((segment) => [segment.id, segment]));

  for (const suggestion of suggestions) {
    if (!isSupportedMaskClass(suggestion.maskClass)) {
      issues.push(maskIssue("unsupported_class", suggestion, "supported_class"));
      continue;
    }

    const segment = segmentById.get(suggestion.segmentId);
    if (
      !segment ||
      suggestion.originalStart < 0 ||
      suggestion.originalEnd <= suggestion.originalStart ||
      suggestion.originalEnd > segment.rawText.length
    ) {
      issues.push(maskIssue("invalid_range", suggestion, "original_range"));
    }

    if (!isAllowedReplacementToken(suggestion.maskClass, suggestion.replacementToken)) {
      issues.push(maskIssue("unsafe_replacement_token", suggestion, "replacement_token"));
    }

    if (options.requireReviewed && suggestion.reviewStatus === "pending") {
      issues.push(maskIssue("pending_mask", suggestion, "review_status"));
    }

    if (options.requireReviewed && suggestion.reviewStatus === "rejected") {
      issues.push(maskIssue("rejected_mask", suggestion, "review_status"));
    }
  }

  for (const segment of segments) {
    const effective = effectiveSuggestionsForSegment(suggestions, segment.id);
    for (let index = 1; index < effective.length; index += 1) {
      const previous = effective[index - 1];
      const current = effective[index];
      if (previous && current && current.originalStart < previous.originalEnd) {
        issues.push({
          code: "overlapping_masks",
          maskId: current.id,
          segmentId: segment.id,
          maskClass: current.maskClass,
          range: { start: current.originalStart, end: current.originalEnd },
          checkName: "approved_mask_overlap",
        });
      }
    }
  }

  return issues;
}

function effectiveSuggestionsForSegment(
  suggestions: readonly MaskSuggestion[],
  segmentId: string,
): MaskSuggestion[] {
  return suggestions
    .filter(
      (suggestion) =>
        suggestion.segmentId === segmentId &&
        (suggestion.reviewStatus === "approved" || suggestion.reviewStatus === "edited"),
    )
    .sort(compareSuggestions);
}

function compareSuggestions(left: MaskSuggestion, right: MaskSuggestion): number {
  return (
    left.originalStart - right.originalStart ||
    left.originalEnd - right.originalEnd ||
    left.id.localeCompare(right.id)
  );
}

function maskIssue(
  code: SafeIssue["code"],
  suggestion: MaskSuggestion,
  checkName: string,
): SafeIssue {
  return {
    code,
    maskId: suggestion.id,
    segmentId: suggestion.segmentId,
    maskClass: suggestion.maskClass,
    range: { start: suggestion.originalStart, end: suggestion.originalEnd },
    checkName,
  };
}

function isSupportedMaskClass(maskClass: string): maskClass is MaskClass {
  return SUPPORTED_MASK_CLASSES.includes(maskClass as MaskClass);
}

function isAllowedReplacementToken(maskClass: MaskClass, token: string): boolean {
  if (token === DEFAULT_REPLACEMENT_TOKENS[maskClass]) {
    return true;
  }

  return /^\[[A-Za-z][A-Za-z0-9 -]{1,58} masked(?: [1-9][0-9]{0,2})?\]$/.test(token);
}

function invalidateReview(review: MaskingReview): ReviewMutationResult {
  return {
    review: {
      ...review,
      revision: review.revision + 1,
      reviewStatus: "invalidated",
      approvedAt: undefined,
      reviewedBy: null,
      leakScanStatus: "not_run",
      failedClasses: [],
    },
    invalidation: INVALIDATION,
  };
}

function scanSerializedText(
  checkName: LeakCheckName,
  serializedText: string,
  options: LeakScanOptions,
): LeakScanResult {
  const findings: LeakFinding[] = [];

  for (const detector of PATTERN_DETECTORS) {
    const matches = detectPattern(
      { id: "D00-P1-S01", rawText: serializedText },
      detector.maskClass,
      detector.pattern,
      "deterministic_pattern",
    );
    findings.push(
      ...matches.map((match) => ({
        checkName,
        checkKind: "supported_pattern" as const,
        maskClass: match.maskClass,
        range: { start: match.originalStart, end: match.originalEnd },
      })),
    );
  }

  for (const sensitiveTerm of uniqueStrings(options.sensitiveTerms ?? [])) {
    findings.push(
      ...findLiteralRanges(serializedText, sensitiveTerm).map((range) => ({
        checkName,
        checkKind: "sensitive_term_list" as const,
        maskClass: "person_name" as const,
        range,
      })),
    );
  }

  if (checkName === "safe_share") {
    for (const literal of uniqueStrings(options.policyDisallowedLiterals ?? [])) {
      findings.push(
        ...findLiteralRanges(serializedText, literal).map((range) => ({
          checkName,
          checkKind: "policy_disallowed_literal" as const,
          range,
        })),
      );
    }
  }

  if (findings.length === 0) {
    return {
      ok: true,
      checkName,
      leakScanStatus: "passed",
      failedClasses: [],
      findings: [],
    };
  }

  return {
    ok: false,
    checkName,
    leakScanStatus: "failed",
    failedClasses: uniqueMaskClasses(
      findings.flatMap((finding) => (finding.maskClass ? [finding.maskClass] : [])),
    ),
    findings,
  };
}

function findLiteralRanges(text: string, literal: string): RedactionRange[] {
  const ranges: RedactionRange[] = [];
  const normalizedLiteral = literal.trim();
  if (normalizedLiteral.length === 0) {
    return ranges;
  }

  let cursor = 0;
  while (cursor < text.length) {
    const index = text.indexOf(normalizedLiteral, cursor);
    if (index === -1) {
      break;
    }

    ranges.push({ start: index, end: index + normalizedLiteral.length });
    cursor = index + normalizedLiteral.length;
  }

  return ranges;
}

function stableUniqueSuggestions(suggestions: readonly MaskSuggestion[]): MaskSuggestion[] {
  const byId = new Map<string, MaskSuggestion>();
  for (const suggestion of suggestions) {
    byId.set(suggestion.id, suggestion);
  }

  return [...byId.values()].sort(compareSuggestions);
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function uniqueMaskClasses(values: readonly MaskClass[]): MaskClass[] {
  return [...new Set(values)].sort(
    (left, right) => SUPPORTED_MASK_CLASSES.indexOf(left) - SUPPORTED_MASK_CLASSES.indexOf(right),
  );
}

function rangeLength(range: RedactionRange): number {
  return range.end - range.start;
}
