import type {
  BrowserAnalysisIntent,
  SourceSegment,
} from "../contracts";
import type { BrowserCaseRecord } from "../cases";
import { prepareAnalysisCorpus } from "../documents";

export async function buildBrowserAnalysisIntent(input: {
  record: BrowserCaseRecord;
  segments: readonly SourceSegment[];
}): Promise<
  | { ok: true; intent: BrowserAnalysisIntent }
  | { ok: false; reason: string }
> {
  const purpose = input.record.purposeBrief;
  const packet = input.record.documentPacket;
  if (!purpose || purpose.status !== "complete") {
    return { ok: false, reason: "Complete Purpose before analysis." };
  }
  if (!packet) {
    return { ok: false, reason: "Process a document packet before analysis." };
  }
  if (
    packet.masking.reviewStatus !== "approved" ||
    packet.masking.leakScanStatus !== "passed"
  ) {
    return {
      ok: false,
      reason: "Approve the final privacy check before analysis.",
    };
  }
  if (packet.coverage.hasConsequentialOpenIssue) {
    return {
      ok: false,
      reason: "Review consequential source-coverage limitations first.",
    };
  }

  const corpus = prepareAnalysisCorpus({
    documents: packet.documents,
    segments: input.segments,
    masking: packet.masking,
  });
  if (!corpus.ok) {
    return {
      ok: false,
      reason:
        corpus.reason === "no_extractable_text"
          ? "No approved readable text is available for analysis."
          : "The approved analysis corpus could not be reconstructed safely.",
    };
  }
  const sourceById = new Map(
    input.segments.map((segment) => [segment.id, segment]),
  );
  const withoutDigest: Omit<
    BrowserAnalysisIntent,
    "approvedRedactedInputDigest"
  > = {
    schemaVersion: "1.0.0",
    caseId: input.record.id,
    dataOrigin: "browser_local",
    syntheticOrAuthorizedPublicDataAttested:
      purpose.authority.syntheticOrHarmlessDataAttested,
    providerDataFlowAcknowledged: true,
    purpose: {
      purposeBriefId: purpose.id,
      purposeBriefRevision: purpose.revision,
      practitionerRole: purpose.practitionerRole,
      jurisdictionCode: purpose.jurisdictionCode,
      requestedExport: purpose.requestedExport,
    },
    documentSetDigest: packet.documentSetDigest,
    maskingRevision: packet.masking.revision,
    leakScanStatus: "passed",
    segments: corpus.corpus.entries.map((entry) => {
      const source = sourceById.get(entry.segmentId);
      if (!source) throw new Error("analysis_source_segment_missing");
      return {
        segmentId: entry.segmentId,
        documentId: entry.documentId,
        pageNumber: entry.pageNumber,
        ordinal: entry.ordinal,
        redactedText: entry.text,
        boundingBoxes: source.boundingBoxes,
        sourceType: entry.sourceType,
        supportEligibility: entry.supportEligibility,
        instructionAdvisory: entry.instructionAdvisory,
        translationStatus: source.translationStatus,
      };
    }),
  };
  return {
    ok: true,
    intent: {
      ...withoutDigest,
      approvedRedactedInputDigest: await digestBrowserAnalysisIntent(
        withoutDigest,
      ),
    },
  };
}

export async function digestBrowserAnalysisIntent(
  intent: Omit<BrowserAnalysisIntent, "approvedRedactedInputDigest">,
): Promise<string> {
  const bytes = new TextEncoder().encode(
    canonicalJson({
      schemaVersion: intent.schemaVersion,
      caseId: intent.caseId,
      dataOrigin: intent.dataOrigin,
      purpose: intent.purpose,
      documentSetDigest: intent.documentSetDigest,
      maskingRevision: intent.maskingRevision,
      segments: intent.segments,
    }),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
