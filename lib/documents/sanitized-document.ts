import type {
  DocumentRecord,
  MaskingReview,
  SourceSegment,
} from "../contracts";
import {
  buildRedactedSegments,
  validateTransmissionReadiness,
} from "../redaction";

export type SanitizedTextPage = {
  pageNumber: number;
  text: string;
};

export type SanitizedTextDocument = {
  documentId: string;
  pages: SanitizedTextPage[];
  omittedPageNumbers: number[];
};

export type SanitizedTextPacket = {
  caseId: string;
  documentSetDigest: string;
  generatedAt: string;
  approvedMaskCount: number;
  documents: SanitizedTextDocument[];
};

export type SanitizedTextPacketResult =
  | { ok: true; packet: SanitizedTextPacket }
  | {
      ok: false;
      reason:
        | "privacy_review_incomplete"
        | "no_extractable_text"
        | "source_mapping_invalid";
    };

export function prepareSanitizedTextPacket(input: {
  caseId: string;
  documentSetDigest: string;
  documents: readonly DocumentRecord[];
  segments: readonly SourceSegment[];
  masking: MaskingReview;
  generatedAt?: string;
}): SanitizedTextPacketResult {
  if (!validateTransmissionReadiness(input.masking, input.segments).ok) {
    return { ok: false, reason: "privacy_review_incomplete" };
  }

  const redaction = buildRedactedSegments(input.segments, input.masking);
  if (!redaction.ok) {
    return { ok: false, reason: "privacy_review_incomplete" };
  }
  if (redaction.segments.length === 0) {
    return { ok: false, reason: "no_extractable_text" };
  }

  const documentIds = new Set(input.documents.map((document) => document.id));
  if (
    input.segments.some(
      (segment) =>
        !documentIds.has(segment.documentId) ||
        !Number.isInteger(segment.pageNumber) ||
        (segment.pageNumber ?? 0) < 1,
    )
  ) {
    return { ok: false, reason: "source_mapping_invalid" };
  }

  const redactedById = new Map(
    redaction.segments.map((segment) => [segment.segmentId, segment.redactedText]),
  );
  const documents = input.documents.map((document) => {
    const pageText = new Map<number, string[]>();
    input.segments
      .filter((segment) => segment.documentId === document.id)
      .sort(
        (left, right) =>
          (left.pageNumber ?? 0) - (right.pageNumber ?? 0) ||
          left.ordinal - right.ordinal,
      )
      .forEach((segment) => {
        const redactedText = redactedById.get(segment.id);
        if (redactedText === undefined || segment.pageNumber === undefined) return;
        const existing = pageText.get(segment.pageNumber) ?? [];
        existing.push(redactedText);
        pageText.set(segment.pageNumber, existing);
      });

    const pages = [...pageText.entries()]
      .map(([pageNumber, text]) => ({
        pageNumber,
        text: text.join("\n\n").trim(),
      }))
      .filter((page) => page.text.length > 0)
      .sort((left, right) => left.pageNumber - right.pageNumber);
    const exportedPageNumbers = new Set(pages.map((page) => page.pageNumber));

    return {
      documentId: document.id,
      pages,
      omittedPageNumbers: document.pages
        .map((page) => page.pageNumber)
        .filter((pageNumber) => !exportedPageNumbers.has(pageNumber)),
    };
  });

  if (documents.every((document) => document.pages.length === 0)) {
    return { ok: false, reason: "no_extractable_text" };
  }

  return {
    ok: true,
    packet: {
      caseId: input.caseId,
      documentSetDigest: input.documentSetDigest,
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      approvedMaskCount: input.masking.suggestions.filter(
        (suggestion) =>
          suggestion.reviewStatus === "approved" ||
          suggestion.reviewStatus === "edited",
      ).length,
      documents,
    },
  };
}
