import "server-only";

import crypto from "node:crypto";

import {
  BrowserAnalysisIntentSchema,
  DocumentRecordSchema,
  SourceSegmentSchema,
  type BrowserAnalysisIntent,
  type DocumentRecord,
  type SourceSegment,
} from "../../contracts";
import type { CitationSourceContext } from "../../citations";
import { scanProviderPayload } from "../../redaction";
import { makePreflightError } from "./errors";

const MAX_DYNAMIC_INPUT_BYTES = 128_000;

export type DynamicCanonicalAnalysisInput = {
  intent: BrowserAnalysisIntent;
  serializedEvidence: string;
  inputByteLength: number;
  providerSegmentCount: number;
  sourceContext: CitationSourceContext;
};

export function buildDynamicCanonicalAnalysisInput(value: unknown):
  | { ok: true; input: DynamicCanonicalAnalysisInput }
  | { ok: false; error: ReturnType<typeof makePreflightError> } {
  const parsed = BrowserAnalysisIntentSchema.safeParse(value);
  if (!parsed.success) {
    return {
      ok: false,
      error: makePreflightError("INVALID_REQUEST", "dynamic_request"),
    };
  }

  const expectedDigest = digestDynamicApprovedInput(parsed.data);
  if (expectedDigest !== parsed.data.approvedRedactedInputDigest) {
    return {
      ok: false,
      error: makePreflightError("INVALID_REQUEST", "dynamic_input_digest"),
    };
  }

  const providerSegments = parsed.data.segments.filter(
    (segment) => segment.supportEligibility === "candidate_eligible",
  );
  if (providerSegments.length === 0) {
    return {
      ok: false,
      error: makePreflightError(
        "SOURCE_UNAVAILABLE",
        "dynamic_candidate_sources",
      ),
    };
  }

  const serializedEvidence = serializeDynamicEvidence(
    parsed.data,
    providerSegments,
  );
  const inputByteLength = Buffer.byteLength(serializedEvidence, "utf8");
  if (inputByteLength > MAX_DYNAMIC_INPUT_BYTES) {
    return {
      ok: false,
      error: makePreflightError("PAYLOAD_TOO_LARGE", "dynamic_input"),
    };
  }

  const leakScan = scanProviderPayload(serializedEvidence);
  if (leakScan.leakScanStatus !== "passed") {
    return {
      ok: false,
      error: makePreflightError("PII_LEAK_DETECTED", "dynamic_server_leak_scan"),
    };
  }

  return {
    ok: true,
    input: {
      intent: parsed.data,
      serializedEvidence,
      inputByteLength,
      providerSegmentCount: providerSegments.length,
      sourceContext: buildDynamicCitationSourceContext(
        parsed.data,
        new Set(providerSegments.map((segment) => segment.segmentId)),
      ),
    },
  };
}

export function digestDynamicApprovedInput(
  intent: Omit<BrowserAnalysisIntent, "approvedRedactedInputDigest">,
): string {
  return crypto
    .createHash("sha256")
    .update(
      canonicalJson({
        schemaVersion: intent.schemaVersion,
        caseId: intent.caseId,
        dataOrigin: intent.dataOrigin,
        purpose: intent.purpose,
        documentSetDigest: intent.documentSetDigest,
        maskingRevision: intent.maskingRevision,
        segments: intent.segments,
      }),
      "utf8",
    )
    .digest("hex");
}

export function serializeDynamicEvidence(
  intent: BrowserAnalysisIntent,
  providerSegments = intent.segments.filter(
    (segment) => segment.supportEligibility === "candidate_eligible",
  ),
): string {
  return canonicalJson({
    schemaVersion: intent.schemaVersion,
    dataOrigin: intent.dataOrigin,
    caseId: intent.caseId,
    purpose: intent.purpose,
    documentSetDigest: intent.documentSetDigest,
    maskingRevision: intent.maskingRevision,
    candidateSources: providerSegments.map((segment) => ({
      segmentId: segment.segmentId,
      documentId: segment.documentId,
      pageNumber: segment.pageNumber,
      redactedText: segment.redactedText,
      sourceType: segment.sourceType,
      supportEligibility: segment.supportEligibility,
      instructionAdvisory: segment.instructionAdvisory,
      translationStatus: segment.translationStatus,
    })),
  });
}

function buildDynamicCitationSourceContext(
  intent: BrowserAnalysisIntent,
  providerSegmentIds: ReadonlySet<string>,
): CitationSourceContext {
  const segments = intent.segments.map((segment) =>
    SourceSegmentSchema.parse({
      id: segment.segmentId,
      documentId: segment.documentId,
      pageId: `${segment.documentId}-P${segment.pageNumber}`,
      pageNumber: segment.pageNumber,
      ordinal: segment.ordinal,
      // Only the approved derivative exists at this boundary.
      rawText: segment.redactedText,
      redactedText: segment.redactedText,
      boundingBoxes: segment.boundingBoxes,
      sourceLanguage: "en",
      translationStatus: segment.translationStatus,
      extractionQuality: "machine_extracted",
      instructionAdvisory: segment.instructionAdvisory,
      modelVisibility: providerSegmentIds.has(segment.segmentId)
        ? "visible_as_untrusted_content"
        : "not_sent",
      supportEligibility: segment.supportEligibility,
    }),
  ) as SourceSegment[];

  const documents = documentsFromSegments(intent, segments);
  return {
    caseId: intent.caseId,
    documents,
    segments,
    // Keep all packet segments locally, but allowlist only the exact provider
    // projection for model citations.
    selectedSegmentIds: new Set(providerSegmentIds),
  };
}

function documentsFromSegments(
  intent: BrowserAnalysisIntent,
  segments: SourceSegment[],
): DocumentRecord[] {
  const byDocument = new Map<
    string,
    { sourceType: BrowserAnalysisIntent["segments"][number]["sourceType"]; pages: Set<number> }
  >();
  for (const segment of intent.segments) {
    const current = byDocument.get(segment.documentId) ?? {
      sourceType: segment.sourceType,
      pages: new Set<number>(),
    };
    current.pages.add(segment.pageNumber);
    byDocument.set(segment.documentId, current);
  }

  return [...byDocument.entries()].map(([documentId, value]) => {
    const pageNumbers = [...value.pages].sort((left, right) => left - right);
    const expectedPageCount = Math.max(...pageNumbers);
    return DocumentRecordSchema.parse({
      id: documentId,
      caseId: intent.caseId,
      fixtureVersion: "1.0.0",
      fileName: `${documentId}.pdf`,
      displayName: documentId,
      sourceType: value.sourceType,
      dataOrigin: "browser_local",
      expectedPageCount,
      pages: pageNumbers.map((pageNumber) => ({
        id: `${documentId}-P${pageNumber}`,
        documentId,
        pageNumber,
        expected: true,
        availability: "available",
        extractionStatus: "completed",
        extractedCharacterCount: segments
          .filter(
            (segment) =>
              segment.documentId === documentId &&
              segment.pageNumber === pageNumber,
          )
          .reduce((total, segment) => total + segment.redactedText.length, 0),
      })),
      provenanceStatus: "unverified",
      processingStatus: "completed",
      syntheticLabelPresent: false,
    });
  });
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [
          key,
          canonicalize((value as Record<string, unknown>)[key]),
        ]),
    );
  }
  return value;
}
