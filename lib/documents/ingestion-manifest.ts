import type {
  DocumentRecord,
  MaskingReview,
  SourceSegment,
} from "../contracts";

export const DOCUMENT_INGESTION_MANIFEST_VERSION = "1.0.0" as const;

export type PdfRuntimeMetadata = {
  documentId: string;
  pdfFormatVersion: string | null;
  title: string | null;
  author: string | null;
  subject: string | null;
  keywords: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modificationDate: string | null;
  pageCount: number | null;
  encryptionStatus: "not_encrypted" | "password_required" | "unlocked";
  permissionFlags: number[] | null;
};

export type PageFingerprintRecord = {
  documentId: string;
  pageNumber: number;
  segmentId: string;
  sha256: string;
  normalizedCharacterCount: number;
};

export type DuplicateRelation =
  | {
      kind: "exact_file";
      documentIds: string[];
      sha256: string;
    }
  | {
      kind: "exact_page";
      pages: { documentId: string; pageNumber: number }[];
      sha256: string;
    }
  | {
      kind: "near_duplicate_page";
      left: { documentId: string; pageNumber: number };
      right: { documentId: string; pageNumber: number };
      similarityPercent: number;
      method: "normalized_three_token_jaccard";
    };

export type DocumentIngestionManifest = {
  schemaVersion: typeof DOCUMENT_INGESTION_MANIFEST_VERSION;
  generatedAt: string;
  engineVersions: {
    pdfjs: "6.1.200";
    ocr: "tesseract.js-7.0.0-eng-best-int";
  };
  documents: {
    documentId: string;
    fileName: string;
    byteLength: number;
    sha256: string;
    sourceType: DocumentRecord["sourceType"];
    processingStatus: DocumentRecord["processingStatus"];
    expectedPageCount: number | null;
    readablePageCount: number;
    ocrRequiredPageCount: number;
    failedPageCount: number;
    metadata: PdfRuntimeMetadata | null;
  }[];
  pageFingerprints: PageFingerprintRecord[];
  duplicates: DuplicateRelation[];
  summary: {
    exactFileGroupCount: number;
    exactPageGroupCount: number;
    nearDuplicatePagePairCount: number;
    passwordRequiredDocumentCount: number;
    metadataAvailableDocumentCount: number;
  };
};

type FileMetadata = {
  documentId: string;
  fileName: string;
  byteLength: number;
  sha256: string;
};

function normalizePageText(text: string) {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

async function sha256(text: string) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function threeTokenShingles(text: string) {
  const tokens = text.split(" ").filter(Boolean);
  const shingles = new Set<string>();
  for (let index = 0; index <= tokens.length - 3; index += 1) {
    shingles.add(tokens.slice(index, index + 3).join(" "));
  }
  return shingles;
}

function jaccard(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

function safeMetadataValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const safe = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return safe.length > 0 ? safe.slice(0, 500) : null;
}

export function normalizePdfRuntimeMetadata(input: {
  documentId: string;
  info?: Record<string, unknown> | null;
  pageCount: number | null;
  encryptionStatus: PdfRuntimeMetadata["encryptionStatus"];
  permissionFlags?: number[] | null;
}): PdfRuntimeMetadata {
  const info = input.info ?? {};
  return {
    documentId: input.documentId,
    pdfFormatVersion: safeMetadataValue(info.PDFFormatVersion),
    title: safeMetadataValue(info.Title),
    author: safeMetadataValue(info.Author),
    subject: safeMetadataValue(info.Subject),
    keywords: safeMetadataValue(info.Keywords),
    creator: safeMetadataValue(info.Creator),
    producer: safeMetadataValue(info.Producer),
    creationDate: safeMetadataValue(info.CreationDate),
    modificationDate: safeMetadataValue(info.ModDate),
    pageCount: input.pageCount,
    encryptionStatus: input.encryptionStatus,
    permissionFlags: input.permissionFlags ?? null,
  };
}

export async function buildDocumentIngestionManifest(input: {
  documents: readonly DocumentRecord[];
  fileMetadata: readonly FileMetadata[];
  segments: readonly SourceSegment[];
  runtimeMetadata?: readonly PdfRuntimeMetadata[];
  generatedAt?: string;
}): Promise<DocumentIngestionManifest> {
  const fileByDocumentId = new Map(
    input.fileMetadata.map((file) => [file.documentId, file]),
  );
  const runtimeByDocumentId = new Map(
    (input.runtimeMetadata ?? []).map((metadata) => [
      metadata.documentId,
      metadata,
    ]),
  );

  const normalizedPages = input.segments
    .filter((segment) => segment.pageNumber !== undefined)
    .map((segment) => ({
      documentId: segment.documentId,
      pageNumber: segment.pageNumber!,
      segmentId: segment.id,
      normalizedText: normalizePageText(segment.rawText),
    }))
    .filter((page) => page.normalizedText.length > 0);
  const pageFingerprints = await Promise.all(
    normalizedPages.map(async (page) => ({
      documentId: page.documentId,
      pageNumber: page.pageNumber,
      segmentId: page.segmentId,
      sha256: await sha256(page.normalizedText),
      normalizedCharacterCount: page.normalizedText.length,
    })),
  );

  const duplicates: DuplicateRelation[] = [];
  const fileGroups = new Map<string, string[]>();
  for (const file of input.fileMetadata) {
    const group = fileGroups.get(file.sha256) ?? [];
    group.push(file.documentId);
    fileGroups.set(file.sha256, group);
  }
  for (const [fingerprint, documentIds] of fileGroups) {
    if (documentIds.length > 1) {
      duplicates.push({
        kind: "exact_file",
        documentIds: [...documentIds].sort(),
        sha256: fingerprint,
      });
    }
  }

  const pageGroups = new Map<
    string,
    { documentId: string; pageNumber: number }[]
  >();
  for (const page of pageFingerprints) {
    const group = pageGroups.get(page.sha256) ?? [];
    group.push({ documentId: page.documentId, pageNumber: page.pageNumber });
    pageGroups.set(page.sha256, group);
  }
  for (const [fingerprint, pages] of pageGroups) {
    if (pages.length > 1) {
      duplicates.push({
        kind: "exact_page",
        pages,
        sha256: fingerprint,
      });
    }
  }

  for (let leftIndex = 0; leftIndex < normalizedPages.length; leftIndex += 1) {
    const left = normalizedPages[leftIndex]!;
    const leftShingles = threeTokenShingles(left.normalizedText);
    if (leftShingles.size < 8) continue;
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < normalizedPages.length;
      rightIndex += 1
    ) {
      const right = normalizedPages[rightIndex]!;
      if (
        left.documentId === right.documentId &&
        left.pageNumber === right.pageNumber
      ) {
        continue;
      }
      const leftFingerprint = pageFingerprints[leftIndex]?.sha256;
      const rightFingerprint = pageFingerprints[rightIndex]?.sha256;
      if (leftFingerprint === rightFingerprint) continue;
      const similarity = jaccard(
        leftShingles,
        threeTokenShingles(right.normalizedText),
      );
      if (similarity >= 0.82) {
        duplicates.push({
          kind: "near_duplicate_page",
          left: {
            documentId: left.documentId,
            pageNumber: left.pageNumber,
          },
          right: {
            documentId: right.documentId,
            pageNumber: right.pageNumber,
          },
          similarityPercent: Math.round(similarity * 100),
          method: "normalized_three_token_jaccard",
        });
      }
    }
  }

  const documents = input.documents.map((document) => {
    const file = fileByDocumentId.get(document.id);
    return {
      documentId: document.id,
      fileName: file?.fileName ?? document.fileName,
      byteLength: file?.byteLength ?? 0,
      sha256: file?.sha256 ?? "",
      sourceType: document.sourceType,
      processingStatus: document.processingStatus,
      expectedPageCount: document.pages.some((page) => page.expected)
        ? document.expectedPageCount
        : null,
      readablePageCount: document.pages.filter(
        (page) => page.availability === "available",
      ).length,
      ocrRequiredPageCount: document.pages.filter((page) =>
        ["image_only", "unreadable"].includes(page.availability),
      ).length,
      failedPageCount: document.pages.filter(
        (page) => page.availability === "extraction_failed",
      ).length,
      metadata: runtimeByDocumentId.get(document.id) ?? null,
    };
  });

  return {
    schemaVersion: DOCUMENT_INGESTION_MANIFEST_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    engineVersions: {
      pdfjs: "6.1.200",
      ocr: "tesseract.js-7.0.0-eng-best-int",
    },
    documents,
    pageFingerprints,
    duplicates,
    summary: {
      exactFileGroupCount: duplicates.filter(
        (duplicate) => duplicate.kind === "exact_file",
      ).length,
      exactPageGroupCount: duplicates.filter(
        (duplicate) => duplicate.kind === "exact_page",
      ).length,
      nearDuplicatePagePairCount: duplicates.filter(
        (duplicate) => duplicate.kind === "near_duplicate_page",
      ).length,
      passwordRequiredDocumentCount: documents.filter(
        (document) =>
          document.metadata?.encryptionStatus === "password_required",
      ).length,
      metadataAvailableDocumentCount: documents.filter(
        (document) => document.metadata !== null,
      ).length,
    },
  };
}

export function createSafeIntegrityReport(input: {
  caseId: string;
  documentSetDigest: string;
  manifest: DocumentIngestionManifest;
  masking: MaskingReview;
}) {
  return {
    schemaVersion: "1.0.0",
    reportKind: "contextfirst_browser_local_document_integrity",
    caseId: input.caseId,
    documentSetDigest: input.documentSetDigest,
    generatedAt: input.manifest.generatedAt,
    engineVersions: input.manifest.engineVersions,
    documents: input.manifest.documents,
    pageFingerprints: input.manifest.pageFingerprints,
    duplicateDiagnostics: input.manifest.duplicates,
    masking: {
      revision: input.masking.revision,
      reviewStatus: input.masking.reviewStatus,
      leakScanStatus: input.masking.leakScanStatus,
      suggestionCount: input.masking.suggestions.length,
      failedClasses: input.masking.failedClasses,
    },
    exclusions: [
      "PDF bytes",
      "extracted text",
      "OCR text",
      "passwords",
      "blob URLs",
      "search queries",
    ],
  } as const;
}
