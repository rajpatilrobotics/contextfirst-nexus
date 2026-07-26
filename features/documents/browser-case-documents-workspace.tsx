"use client";

import Link from "next/link";
import { FileText, LoaderCircle, UploadCloud } from "lucide-react";
import {
  type DragEvent,
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BrowserCaseShell } from "../../components/shell/browser-case-shell";
import {
  Chip,
  SectionTitle,
} from "../../components/lovable/nexus-ui";
import { Alert, Skeleton } from "../../components/ui";
import {
  type BrowserCaseDocumentPacket,
  type BrowserCaseRecord,
  findBrowserCase,
  loadBrowserCaseRegistry,
  persistBrowserCaseRegistry,
  saveBrowserCaseDocumentPacket,
} from "../../lib/cases";
import {
  browserCaseFileStore,
  type BrowserCaseFileStore,
} from "../../lib/cases/browser-case-file-store";
import type {
  DocumentRecord,
  MaskClass,
  MaskingReview,
} from "../../lib/contracts";
import {
  applyVerifiedOcrPage,
  buildDocumentIngestionManifest,
  createSafeIntegrityReport,
  LOCAL_PDF_SELECTION_LIMITS,
  prepareAnalysisCorpus,
  processLocalPdfSources,
  prepareSanitizedTextPacket,
  recognizePdfPageLocally,
  retryEmbeddedTextPage,
  validateLocalPdfSelection,
  type BrowserOcrProgress,
  type DocumentIngestionManifest,
  type LocalPdfDocumentServiceResult,
  type LocalPdfProcessingOptions,
  type VerifiedOcrPage,
} from "../../lib/documents";
import {
  addMaskSuggestion,
  applyLeakScanResult,
  approveMaskingReview,
  buildSegmentRedaction,
  createEmptyMaskingReview,
  detectMaskSuggestions,
  makeManualSuggestion,
  removeMaskSuggestion,
  reviewMask,
  scanProviderPayload,
} from "../../lib/redaction";
import { DocumentCards } from "./document-cards";
import { DocumentPacketTools } from "./document-packet-tools";
import { MaskedPdfPreview } from "./masked-pdf-preview";
import { MaskingReviewPanel } from "./masking-review-panel";
import { localPdfSelectionIssueMessage } from "./pdf-selection-panel";

type SelectionMode = "add" | "initial" | "replace" | "reselect" | "upgrade";
type ProcessSources = (
  files: readonly File[],
  caseId: string,
  options?: LocalPdfProcessingOptions,
) => Promise<LocalPdfDocumentServiceResult>;

const DEFAULT_PROCESS_SOURCES: ProcessSources = (files, caseId, options) =>
  processLocalPdfSources(files, undefined, caseId, options);

function readableMegabytes(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function createPacket(
  result: LocalPdfDocumentServiceResult &
    Required<Pick<LocalPdfDocumentServiceResult, "fileMetadata">>,
  masking: MaskingReview,
  ocrVerifications: BrowserCaseDocumentPacket["ocrVerifications"] = [],
  updatedAt = new Date().toISOString(),
): BrowserCaseDocumentPacket {
  return {
    schemaVersion: "1.0.0",
    caseId: result.caseId,
    documentSetDigest: result.documentSetDigest,
    fileMetadata: result.fileMetadata,
    documents: result.documents,
    coverage: result.coverage,
    processing: result.processing,
    masking,
    ocrVerifications,
    contentPersistence: "browser_indexeddb",
    updatedAt,
  };
}

export function BrowserCaseDocumentsWorkspace({
  caseId,
  fileStore = browserCaseFileStore,
  processSources = DEFAULT_PROCESS_SOURCES,
}: {
  caseId: string;
  fileStore?: BrowserCaseFileStore;
  processSources?: ProcessSources;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionModeRef = useRef<SelectionMode>("initial");
  const passwordsByFileNameRef = useRef<Record<string, string>>({});
  const passwordUnlockDocumentRef = useRef<string | null>(null);
  const [record, setRecord] = useState<BrowserCaseRecord | null>(null);
  const [runtimeResult, setRuntimeResult] =
    useState<LocalPdfDocumentServiceResult | null>(null);
  const [runtimeFiles, setRuntimeFiles] = useState<readonly File[]>([]);
  const [loadState, setLoadState] = useState<
    "loading" | "missing" | "ready"
  >("loading");
  const [storageError, setStorageError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    tone: "neutral" | "warning" | "success";
    title: string;
    detail: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoringFiles, setIsRestoringFiles] = useState(false);
  const [sanitizedPdfState, setSanitizedPdfState] = useState<
    "idle" | "generating_text" | "generating_visual"
  >("idle");
  const [ingestionManifest, setIngestionManifest] =
    useState<DocumentIngestionManifest | null>(null);
  const [pageProgress, setPageProgress] = useState<
    Record<string, BrowserOcrProgress | undefined>
  >({});
  const [ocrDrafts, setOcrDrafts] = useState<
    Record<string, VerifiedOcrPage | undefined>
  >({});
  const documentFiles = useMemo(() => {
    const mapping: Record<string, File> = {};
    runtimeResult?.fileMetadata?.forEach((metadata, index) => {
      const file = runtimeFiles[index];
      if (file) mapping[metadata.documentId] = file;
    });
    return mapping;
  }, [runtimeFiles, runtimeResult]);
  const documentMetadata = useMemo(
    () =>
      Object.fromEntries(
        (record?.documentPacket?.fileMetadata ?? []).map((metadata) => [
          metadata.documentId,
          metadata,
        ]),
      ),
    [record?.documentPacket?.fileMetadata],
  );
  const runtimeMetadata = useMemo(
    () =>
      Object.fromEntries(
        (runtimeResult?.runtimeMetadata ?? []).map((metadata) => [
          metadata.documentId,
          metadata,
        ]),
      ),
    [runtimeResult?.runtimeMetadata],
  );
  const displayedDocuments = useMemo(
    () =>
      (runtimeResult?.documents ?? record?.documentPacket?.documents ?? []).map(
        (sourceDocument) => ({
          ...sourceDocument,
          sourceType:
            record?.documentPacket?.documents.find(
              (savedDocument) => savedDocument.id === sourceDocument.id,
            )?.sourceType ?? sourceDocument.sourceType,
        }),
      ),
    [record?.documentPacket?.documents, runtimeResult?.documents],
  );
  const analysisCorpusResult = useMemo(
    () =>
      runtimeResult && record?.documentPacket
        ? prepareAnalysisCorpus({
            documents: record.documentPacket.documents,
            segments: runtimeResult.segments,
            masking: record.documentPacket.masking,
          })
        : null,
    [record?.documentPacket, runtimeResult],
  );

  async function restoreVerifiedOcr(
    baseResult: LocalPdfDocumentServiceResult,
    files: readonly File[],
    verifications: BrowserCaseDocumentPacket["ocrVerifications"],
  ) {
    let nextResult = baseResult;
    for (const verification of verifications) {
      const metadata = baseResult.fileMetadata?.find(
        (item) => item.documentId === verification.documentId,
      );
      const fileIndex = baseResult.fileMetadata?.findIndex(
        (item) => item.documentId === verification.documentId,
      );
      const file = fileIndex === undefined || fileIndex < 0 ? undefined : files[fileIndex];
      if (!metadata || !file) throw new Error("ocr_source_file_missing");
      const pageKey = `${verification.documentId}-P${verification.pageNumber}`;
      const verifiedPage =
        verification.method === "ocr"
          ? await recognizePdfPageLocally({
              file,
              documentId: verification.documentId,
              pageNumber: verification.pageNumber,
              password: passwordsByFileNameRef.current[metadata.fileName],
              onProgress: (progress) =>
                setPageProgress((current) => ({
                  ...current,
                  [pageKey]: progress,
                })),
            })
          : await retryEmbeddedTextPage({
              file,
              documentId: verification.documentId,
              pageNumber: verification.pageNumber,
              password: passwordsByFileNameRef.current[metadata.fileName],
            });
      nextResult = applyVerifiedOcrPage(nextResult, verifiedPage);
      setPageProgress((current) => ({ ...current, [pageKey]: undefined }));
    }
    return nextResult;
  }

  function runDocumentProcessing(files: readonly File[]) {
    return Object.keys(passwordsByFileNameRef.current).length > 0
      ? processSources(files, caseId, {
          passwordsByFileName: passwordsByFileNameRef.current,
        })
      : processSources(files, caseId);
  }

  useEffect(() => {
    let cancelled = false;
    const loaded = loadBrowserCaseRegistry(window.localStorage);
    if (!loaded.ok) {
      persistBrowserCaseRegistry(window.localStorage, loaded.registry);
      setStorageError(loaded.reason);
    }
    const current = findBrowserCase(loaded.registry, caseId);
    setRecord(current);
    setLoadState(current ? "ready" : "missing");

    async function restoreFiles() {
      if (!current?.documentPacket) return;
      setIsRestoringFiles(true);
      try {
        const files = await fileStore.load(caseId);
        if (cancelled || files.length === 0) return;
        const baseResult = await runDocumentProcessing(files);
        const result =
          current.documentPacket.ocrVerifications.length > 0
            ? await restoreVerifiedOcr(
                baseResult,
                files,
                current.documentPacket.ocrVerifications,
              )
            : baseResult;
        if (
          cancelled ||
          result.documentSetDigest !== current.documentPacket.documentSetDigest
        ) {
          return;
        }
        setRuntimeFiles(files);
        setRuntimeResult(result);
      } catch {
        if (!cancelled) {
          setNotice({
            tone: "warning",
            title: "Saved browser files could not be restored",
            detail:
              "Choose the existing PDFs again once. No case state was changed.",
          });
        }
      } finally {
        if (!cancelled) setIsRestoringFiles(false);
      }
    }

    void restoreFiles();
    return () => {
      cancelled = true;
    };
  }, [caseId, fileStore, processSources]);

  useEffect(() => {
    let cancelled = false;
    if (!record?.documentPacket || !runtimeResult?.fileMetadata) {
      setIngestionManifest(null);
      return;
    }
    void buildDocumentIngestionManifest({
      documents: runtimeResult.documents,
      fileMetadata: runtimeResult.fileMetadata,
      segments: runtimeResult.segments,
      runtimeMetadata: runtimeResult.runtimeMetadata,
    }).then((manifest) => {
      if (!cancelled) setIngestionManifest(manifest);
    });
    return () => {
      cancelled = true;
    };
  }, [record?.documentPacket, runtimeResult]);

  function persistPacket(packet: BrowserCaseDocumentPacket) {
    const loaded = loadBrowserCaseRegistry(window.localStorage);
    if (!loaded.ok) {
      setStorageError(loaded.reason);
      return false;
    }
    const saved = saveBrowserCaseDocumentPacket(
      loaded.registry,
      caseId,
      packet,
    );
    if (!saved.ok) {
      setStorageError(saved.reason);
      return false;
    }
    const persisted = persistBrowserCaseRegistry(
      window.localStorage,
      saved.registry,
    );
    if (!persisted.ok) {
      setStorageError(persisted.reason);
      return false;
    }
    setRecord(saved.record);
    setStorageError(null);
    return true;
  }

  function openPicker(mode: SelectionMode) {
    if (!record?.purposeBrief || isProcessing || isRestoringFiles) return;
    selectionModeRef.current = mode;
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  async function processSelection(files: readonly File[]): Promise<boolean> {
    if (!record?.purposeBrief || files.length === 0 || isProcessing) return false;
    setIsProcessing(true);
    setNotice(null);

    const validation = await validateLocalPdfSelection(files);
    if (validation.status !== "verified") {
      setNotice({
        tone: "warning",
        title: "Review the selected PDFs",
        detail: validation.issues
          .map((issue) => localPdfSelectionIssueMessage(issue))
          .join(" "),
      });
      setIsProcessing(false);
      return false;
    }

    try {
      let result = await runDocumentProcessing(files);
      if (!result.fileMetadata) {
        throw new Error("document_metadata_missing");
      }
      if (
        passwordUnlockDocumentRef.current &&
        result.runtimeMetadata?.some(
          (metadata) =>
            metadata.documentId === passwordUnlockDocumentRef.current &&
            metadata.encryptionStatus === "password_required",
        )
      ) {
        throw new Error("pdf_password_rejected");
      }
      const previousPacket = record.documentPacket;
      const mode = selectionModeRef.current;

      if (mode === "upgrade" && previousPacket) {
        const selectedFiles = new Map(
          result.fileMetadata.map((metadata) => [
            `${metadata.fileName}:${metadata.byteLength}`,
            metadata,
          ]),
        );
        const missingExistingFile = previousPacket.fileMetadata.some(
          (metadata) =>
            !selectedFiles.has(`${metadata.fileName}:${metadata.byteLength}`),
        );
        if (missingExistingFile) {
          setNotice({
            tone: "warning",
            title: "Include the existing PDFs once",
            detail:
              "This older packet predates browser file storage. Select its existing PDFs together with any new PDFs so nothing is removed.",
          });
          return false;
        }
      }

      if (
        mode === "reselect" &&
        previousPacket &&
        result.documentSetDigest !== previousPacket.documentSetDigest
      ) {
        setNotice({
          tone: "warning",
          title: "The packet does not match",
          detail:
            "Reselect the same PDFs saved for this case. Their verified digest did not match, so no case state was changed.",
        });
        return false;
      }

      const preservingPacket =
        previousPacket?.documentSetDigest === result.documentSetDigest;
      if (preservingPacket && previousPacket.ocrVerifications.length > 0) {
        result = await restoreVerifiedOcr(
          result,
          files,
          previousPacket.ocrVerifications,
        );
      }
      if (!result.fileMetadata) {
        throw new Error("document_metadata_missing_after_recovery");
      }
      const masking = preservingPacket
        ? previousPacket.masking
        : {
            ...createEmptyMaskingReview(
              (previousPacket?.masking.revision ?? 0) + 1,
            ),
            suggestions: detectMaskSuggestions(result.segments),
          };
      const packet = createPacket(
        { ...result, fileMetadata: result.fileMetadata },
        masking,
        preservingPacket ? previousPacket.ocrVerifications : [],
      );

      if (!persistPacket(packet)) return false;
      let filesPersisted = true;
      try {
        await fileStore.save(caseId, files);
      } catch {
        filesPersisted = false;
      }
      setRuntimeResult(result);
      setRuntimeFiles(files);
      setNotice(
        filesPersisted
          ? null
          : {
              tone: "warning",
              title: "PDFs are available for this session only",
              detail:
                "Browser file storage was unavailable. The packet was processed, but its PDFs may need to be selected again after reload.",
            },
      );
      return true;
    } catch {
      setNotice({
        tone: "warning",
        title: "PDF processing could not finish",
        detail:
          "The browser-local extractor returned a safe failure. Retry the packet or replace it through source intake.",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files ?? []);
    void processSelection(
      selectionModeRef.current === "add"
        ? [...runtimeFiles, ...selected]
        : selected,
    );
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!record?.purposeBrief || isProcessing) return;
    selectionModeRef.current = record.documentPacket ? "replace" : "initial";
    void processSelection(Array.from(event.dataTransfer.files));
  }

  function saveMasking(masking: MaskingReview) {
    if (!record?.documentPacket) return false;
    return persistPacket({
      ...record.documentPacket,
      masking,
      updatedAt: new Date().toISOString(),
    });
  }

  function addMask(input: {
    segmentId: string;
    originalStart: number;
    originalEnd: number;
    maskClass: MaskClass;
    replacementToken: string;
  }) {
    if (!record?.documentPacket) return;
    saveMasking(
      addMaskSuggestion(
        record.documentPacket.masking,
        makeManualSuggestion(input),
      ).review,
    );
  }

  function removeMask(maskId: string) {
    if (!record?.documentPacket) return;
    saveMasking(
      removeMaskSuggestion(record.documentPacket.masking, maskId).review,
    );
  }

  function reviewMaskDecision(
    maskId: string,
    reviewStatus: "pending" | "approved" | "edited" | "rejected",
    replacementToken: string,
  ) {
    if (!record?.documentPacket) return;
    saveMasking(
      reviewMask(
        record.documentPacket.masking,
        maskId,
        reviewStatus,
        replacementToken,
      ).review,
    );
  }

  function updateSourceType(
    documentId: string,
    sourceType: DocumentRecord["sourceType"],
  ) {
    if (!record?.documentPacket) return;
    const currentDocument = record.documentPacket.documents.find(
      (document) => document.id === documentId,
    );
    if (!currentDocument || currentDocument.sourceType === sourceType) return;

    const saved = persistPacket({
      ...record.documentPacket,
      documents: record.documentPacket.documents.map((document) =>
        document.id === documentId ? { ...document, sourceType } : document,
      ),
      updatedAt: new Date().toISOString(),
    });
    setNotice(
      saved
        ? {
            tone: "success",
            title: "Source classification saved",
            detail:
              "The practitioner-supplied source role is now part of this browser-local document packet.",
          }
        : {
            tone: "warning",
            title: "Source classification was not saved",
            detail:
              "Browser storage rejected the packet update. The previous source role remains active.",
          },
    );
  }

  function sourceForDocument(documentId: string) {
    const fileIndex =
      runtimeResult?.fileMetadata?.findIndex(
        (metadata) => metadata.documentId === documentId,
      ) ?? -1;
    const metadata = runtimeResult?.fileMetadata?.[fileIndex];
    const file = fileIndex >= 0 ? runtimeFiles[fileIndex] : undefined;
    return { file, metadata };
  }

  function saveRecoveredPage(
    verifiedPage: VerifiedOcrPage,
    method: "ocr" | "embedded_text_retry",
  ) {
    if (!runtimeResult || !record?.documentPacket) return false;
    const nextResult = applyVerifiedOcrPage(runtimeResult, verifiedPage);
    if (nextResult === runtimeResult) return false;
    const nextMasking = {
      ...createEmptyMaskingReview(record.documentPacket.masking.revision + 1),
      suggestions: detectMaskSuggestions(nextResult.segments),
    };
    const nextVerification = {
      documentId: verifiedPage.documentId,
      pageNumber: verifiedPage.pageNumber,
      method,
      language: method === "ocr" ? ("eng" as const) : null,
      engineVersion:
        method === "ocr"
          ? ("tesseract.js-7.0.0" as const)
          : ("pdfjs-6.1.200" as const),
      verifiedAt: new Date().toISOString(),
    };
    const verifications = [
      ...record.documentPacket.ocrVerifications.filter(
        (item) =>
          item.documentId !== verifiedPage.documentId ||
          item.pageNumber !== verifiedPage.pageNumber,
      ),
      nextVerification,
    ];
    const saved = persistPacket({
      ...record.documentPacket,
      documents: nextResult.documents,
      coverage: nextResult.coverage,
      processing: nextResult.processing,
      masking: nextMasking,
      ocrVerifications: verifications,
      updatedAt: new Date().toISOString(),
    });
    if (!saved) return false;
    setRuntimeResult(nextResult);
    setOcrDrafts((current) => ({
      ...current,
      [`${verifiedPage.documentId}-P${verifiedPage.pageNumber}`]: undefined,
    }));
    setNotice({
      tone: "success",
      title:
        method === "ocr"
          ? "OCR text verified"
          : "Embedded text recovered",
      detail:
        "The page is now available to this case. Privacy masking was safely reset because the analysis input changed.",
    });
    return true;
  }

  async function retryPage(documentId: string, pageNumber: number) {
    const pageKey = `${documentId}-P${pageNumber}`;
    const { file, metadata } = sourceForDocument(documentId);
    if (!file || !metadata) {
      setNotice({
        tone: "warning",
        title: "Restore the PDF first",
        detail: "Reselect this packet before retrying a page.",
      });
      return;
    }
    setPageProgress((current) => ({
      ...current,
      [pageKey]: { status: "retrying embedded text", progress: 0.25 },
    }));
    try {
      const recovered = await retryEmbeddedTextPage({
        file,
        documentId,
        pageNumber,
        password: passwordsByFileNameRef.current[metadata.fileName],
      });
      saveRecoveredPage(recovered, "embedded_text_retry");
    } catch {
      setNotice({
        tone: "warning",
        title: "No embedded text was recovered",
        detail:
          "The page still has no readable embedded text. Run local OCR or replace the PDF.",
      });
    } finally {
      setPageProgress((current) => ({ ...current, [pageKey]: undefined }));
    }
  }

  async function runOcr(documentId: string, pageNumber: number) {
    const pageKey = `${documentId}-P${pageNumber}`;
    const { file, metadata } = sourceForDocument(documentId);
    if (!file || !metadata) {
      setNotice({
        tone: "warning",
        title: "Restore the PDF first",
        detail: "Reselect this packet before running local OCR.",
      });
      return;
    }
    setPageProgress((current) => ({
      ...current,
      [pageKey]: { status: "starting local OCR", progress: 0 },
    }));
    try {
      const draft = await recognizePdfPageLocally({
        file,
        documentId,
        pageNumber,
        password: passwordsByFileNameRef.current[metadata.fileName],
        onProgress: (progress) =>
          setPageProgress((current) => ({
            ...current,
            [pageKey]: progress,
          })),
      });
      setOcrDrafts((current) => ({ ...current, [pageKey]: draft }));
      setNotice({
        tone: "neutral",
        title: "OCR draft is ready for human verification",
        detail:
          "Review the extracted text in Page health. It will not become case input until you explicitly verify it.",
      });
    } catch {
      setNotice({
        tone: "warning",
        title: "Local OCR could not recover text",
        detail:
          "No OCR text was added. Try the page again or replace the source.",
      });
    } finally {
      setPageProgress((current) => ({ ...current, [pageKey]: undefined }));
    }
  }

  async function unlockDocument(documentId: string, password: string) {
    const source = sourceForDocument(documentId);
    if (!source.file || !source.metadata || !runtimeFiles.length) return false;
    passwordsByFileNameRef.current[source.metadata.fileName] = password;
    passwordUnlockDocumentRef.current = documentId;
    try {
      selectionModeRef.current = "reselect";
      const unlocked = await processSelection(runtimeFiles);
      if (unlocked) return true;
      throw new Error("password_unlock_failed");
    } catch {
      delete passwordsByFileNameRef.current[source.metadata.fileName];
      return false;
    } finally {
      passwordUnlockDocumentRef.current = null;
    }
  }

  function downloadIntegrityReport() {
    if (!record?.documentPacket || !ingestionManifest) return;
    const report = createSafeIntegrityReport({
      caseId,
      documentSetDigest: record.documentPacket.documentSetDigest,
      manifest: ingestionManifest,
      masking: record.documentPacket.masking,
    });
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    try {
      link.href = objectUrl;
      link.download = `${caseId.toLowerCase()}-document-integrity.json`;
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    }
  }

  function completeMasking() {
    if (!runtimeResult || !record?.documentPacket) {
      setNotice({
        tone: "warning",
        title: "Restore the document files",
        detail:
          "Choose the existing PDFs again once before completing privacy masking. Future reloads will restore browser-stored files automatically.",
      });
      return;
    }
    const approval = approveMaskingReview(
      record.documentPacket.masking,
      runtimeResult.segments,
      new Date().toISOString(),
    );
    if (!approval.ok) {
      setNotice({
        tone: "warning",
        title: "Mask review remains blocked",
        detail: "Resolve every pending or rejected mask before approval.",
      });
      return;
    }
    const redactedSegments = runtimeResult.segments.map((segment) => {
      const masks = approval.review.suggestions.filter(
        (suggestion) =>
          suggestion.segmentId === segment.id &&
          (suggestion.reviewStatus === "approved" ||
            suggestion.reviewStatus === "edited"),
      );
      return buildSegmentRedaction(segment, masks).redactedText;
    });
    const masking = applyLeakScanResult(
      approval.review,
      scanProviderPayload(redactedSegments.join("\n")),
    );
    if (!saveMasking(masking)) {
      setNotice({
        tone: "warning",
        title: "Privacy result was not saved",
        detail:
          "Browser storage rejected the updated packet. The previous masking state remains active; resolve the storage problem and run the check again.",
      });
      return;
    }
    setNotice({
      tone: masking.leakScanStatus === "passed" ? "success" : "warning",
      title:
        masking.leakScanStatus === "passed"
          ? "Privacy check passed"
          : "Privacy check needs attention",
      detail:
        masking.leakScanStatus === "passed"
          ? "The approved masked text passed the deterministic local leak scan."
          : "A supported identifier pattern remains. Correct the masking review and run the check again.",
    });
  }

  async function downloadSanitizedTextPdf() {
    if (
      !runtimeResult ||
      !record?.documentPacket ||
      sanitizedPdfState !== "idle"
    ) {
      setNotice({
        tone: "warning",
        title: "Sanitized PDF is not ready",
        detail:
          "Restore the current PDFs and pass the final privacy check before creating a sanitized derivative.",
      });
      return;
    }

    const prepared = prepareSanitizedTextPacket({
      caseId,
      documentSetDigest: record.documentPacket.documentSetDigest,
      documents: record.documentPacket.documents,
      segments: runtimeResult.segments,
      masking: record.documentPacket.masking,
    });
    if (!prepared.ok) {
      setNotice({
        tone: "warning",
        title: "Sanitized PDF is blocked",
        detail:
          prepared.reason === "no_extractable_text"
            ? "The packet has no approved extractable text to place in a sanitized derivative."
            : "The current packet, masking review, and privacy result no longer form one valid approved source. Run the final privacy check again.",
      });
      return;
    }

    setSanitizedPdfState("generating_text");
    try {
      const { renderSanitizedTextPdf } = await import(
        "../../lib/documents/sanitized-pdf"
      );
      const blob = await renderSanitizedTextPdf(prepared.packet);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      try {
        link.href = objectUrl;
        link.download = `${caseId.toLowerCase()}-sanitized-text.pdf`;
        link.hidden = true;
        document.body.appendChild(link);
        link.click();
      } finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      }
      setNotice({
        tone: "success",
        title: "Sanitized text PDF downloaded",
        detail:
          "A new browser-local PDF was created from approved redacted extracted text. The original files were not changed, uploaded, or transmitted.",
      });
    } catch {
      setNotice({
        tone: "warning",
        title: "Sanitized PDF could not be created",
        detail:
          "The browser did not create the derivative. No file was uploaded or transmitted; retry after confirming the current privacy check.",
      });
    } finally {
      setSanitizedPdfState("idle");
    }
  }

  async function downloadFlattenedSanitizedPdf() {
    if (
      !runtimeResult ||
      !record?.documentPacket ||
      sanitizedPdfState !== "idle"
    ) {
      setNotice({
        tone: "warning",
        title: "Visual sanitized PDF is not ready",
        detail:
          "Restore the current PDFs and pass the final privacy check first.",
      });
      return;
    }
    setSanitizedPdfState("generating_visual");
    try {
      const { renderFlattenedSanitizedPdf } = await import(
        "../../lib/documents/flattened-sanitized-pdf"
      );
      const result = await renderFlattenedSanitizedPdf({
        documents: runtimeResult.documents,
        filesByDocumentId: documentFiles,
        segments: runtimeResult.segments,
        masking: record.documentPacket.masking,
        verifiedOcrPages: runtimeResult.verifiedOcrPages,
        passwordsByFileName: passwordsByFileNameRef.current,
      });
      if (!result.ok) {
        setNotice({
          tone: "warning",
          title: "Visual sanitized PDF is blocked",
          detail:
            result.reason === "mask_placement_unavailable"
              ? "At least one approved mask could not be placed on its original page. No partial PDF was downloaded."
              : "The current files, approved mask review, and privacy result must all be available and current.",
        });
        return;
      }
      const objectUrl = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      try {
        link.href = objectUrl;
        link.download = `${caseId.toLowerCase()}-visually-sanitized.pdf`;
        link.hidden = true;
        document.body.appendChild(link);
        link.click();
      } finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      }
      setNotice({
        tone: "success",
        title: "Visual sanitized PDF downloaded",
        detail: `${result.pageCount} original-layout page${
          result.pageCount === 1 ? " was" : "s were"
        } flattened with approved black masks. Review the new PDF before sharing.`,
      });
    } catch {
      setNotice({
        tone: "warning",
        title: "Visual sanitized PDF could not be created",
        detail:
          "No partial file was downloaded. The original PDFs remain unchanged.",
      });
    } finally {
      setSanitizedPdfState("idle");
    }
  }

  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Skeleton label="Loading browser-local Documents" />
        </div>
      </div>
    );
  }

  if (loadState === "missing" || !record) {
    return (
      <div className="min-h-screen bg-background px-6 py-16 text-foreground">
        <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Browser-local case
          </div>
          <h1 className="mt-2 font-serif text-2xl">Case not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This case is not present in this browser. No legacy documents or
            demonstration records were substituted.
          </p>
          {storageError ? (
            <p className="mt-3 text-sm text-[color:var(--rust)]" role="alert">
              {storageError}
            </p>
          ) : null}
          <Link
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
            href="/dashboard"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const purposeComplete = record.purposeBrief?.status === "complete";
  const packet = record.documentPacket;

  return (
    <BrowserCaseShell activeStage="documents" record={record}>
      <div className="space-y-5">
        <SectionTitle
          description="Every source declares what was extracted, what needs OCR, and what remains unreadable. Nothing is silently pretended-processed."
          eyebrow="Stage 2 · Intake"
          title="Documents & Source Health"
        />

        <input
          accept="application/pdf,.pdf"
          aria-label="Select PDF documents"
          className="sr-only"
          disabled={!purposeComplete || isProcessing}
          multiple
          onChange={handleInput}
          ref={inputRef}
          type="file"
        />

        {storageError ? (
          <Alert title="Browser storage could not be updated" tone="warning">
            <p>{storageError}</p>
          </Alert>
        ) : null}
        {!purposeComplete ? (
          <Alert title="Purpose is required" tone="warning">
            <p>
              Complete the{" "}
              <Link
                className="font-semibold underline"
                href={`/case/${record.id}/purpose`}
              >
                Purpose Brief
              </Link>{" "}
              before document intake can begin.
            </p>
          </Alert>
        ) : null}
        {packet && !runtimeResult && !isRestoringFiles ? (
          <Alert title="Upgrade this older saved packet once" tone="neutral">
            <p>
              This packet was created before browser-local PDF storage was
              enabled. Select its existing PDFs together with any new PDFs
              once; future reloads will restore them automatically.{" "}
              <button
                className="font-semibold underline"
                onClick={() => openPicker("upgrade")}
                type="button"
              >
                Choose existing and additional PDFs
              </button>
            </p>
          </Alert>
        ) : null}
        {notice ? (
          <Alert
            title={notice.title}
            tone={notice.tone === "success" ? "neutral" : notice.tone}
          >
            <p>{notice.detail}</p>
          </Alert>
        ) : null}

        {!packet ? (
          <section
            aria-labelledby="empty-packet-heading"
            className="grid gap-4 lg:grid-cols-[380px_1fr]"
          >
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border p-3">
                <h2 className="font-serif text-base" id="empty-packet-heading">
                  Packet (0)
                </h2>
                <Chip tone="mute">Empty</Chip>
              </div>
              <div
                className={`m-3 flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed px-5 py-9 text-center transition-colors ${
                  isDragging
                    ? "border-[color:var(--amber)] bg-muted/60"
                    : "border-border bg-muted/20"
                }`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  if (purposeComplete) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                {isProcessing ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-8 w-8 animate-spin text-muted-foreground"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                    <UploadCloud className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
                <h3 className="mt-4 font-serif text-lg">Upload PDFs here</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Drag and drop, or choose one or more files.
                </p>
                <button
                  className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md bg-[color:var(--amber)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!purposeComplete || isProcessing}
                  onClick={() => openPicker("initial")}
                  type="button"
                >
                  {isProcessing ? "Processing locally…" : "Choose PDFs"}
                </button>
                <p className="mt-4 max-w-xs text-[11px] leading-5 text-muted-foreground">
                  1–{LOCAL_PDF_SELECTION_LIMITS.maxFiles} PDFs ·{" "}
                  {readableMegabytes(
                    LOCAL_PDF_SELECTION_LIMITS.maxBytesPerFile,
                  )}{" "}
                  each ·{" "}
                  {readableMegabytes(LOCAL_PDF_SELECTION_LIMITS.maxTotalBytes)}{" "}
                  total
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Source health
                  </div>
                  <h2 className="mt-1 font-serif text-xl">
                    No source selected
                  </h2>
                </div>
                <Chip tone="mute">Not processed</Chip>
              </div>
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <FileText
                    aria-hidden="true"
                    className="mx-auto h-7 w-7 text-muted-foreground"
                  />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Select a valid PDF packet to inspect page-level extraction,
                    coverage, source quality, and masking status.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <DocumentCards
            actionLabels={{
              add: "Add PDFs",
              replace: "Replace",
              retry: "Retry extraction",
            }}
            documentFiles={documentFiles}
            documentMetadata={documentMetadata}
            documents={displayedDocuments}
            maskingStatus={packet.masking.reviewStatus}
            ocrDrafts={ocrDrafts}
            onAddSource={() => {
              if (runtimeFiles.length === 0) {
                openPicker("upgrade");
              } else {
                openPicker("add");
              }
            }}
            onReplace={() => openPicker("replace")}
            onReselectPreview={() =>
              openPicker(runtimeFiles.length === 0 ? "upgrade" : "reselect")
            }
            onRetry={() => {
              if (runtimeFiles.length > 0) {
                selectionModeRef.current = "reselect";
                void processSelection(runtimeFiles);
              } else {
                openPicker("upgrade");
              }
            }}
            onRetryPage={(documentId, pageNumber) =>
              void retryPage(documentId, pageNumber)
            }
            onRunOcr={(documentId, pageNumber) =>
              void runOcr(documentId, pageNumber)
            }
            onVerifyOcr={(draft) => saveRecoveredPage(draft, "ocr")}
            onRejectOcr={(documentId, pageNumber) =>
              setOcrDrafts((current) => ({
                ...current,
                [`${documentId}-P${pageNumber}`]: undefined,
              }))
            }
            onUnlockDocument={unlockDocument}
            onUpdateSourceType={updateSourceType}
            pageProgress={pageProgress}
            qualityContent={
              <DocumentPacketTools
                analysisHref={`/case/${record.id}/analysis`}
                corpusResult={analysisCorpusResult}
                manifest={ingestionManifest}
                onDownloadReport={downloadIntegrityReport}
                runtimeAvailable={Boolean(runtimeResult)}
              />
            }
            renderMaskingContent={({ document, file }) => (
              <div className="grid gap-5">
                <MaskedPdfPreview
                  disabled={!runtimeResult}
                  document={document}
                  file={file}
                  onAdd={addMask}
                  onRemove={removeMask}
                  onReselect={() =>
                    openPicker(runtimeFiles.length === 0 ? "upgrade" : "reselect")
                  }
                  onReview={reviewMaskDecision}
                  review={packet.masking}
                  segments={runtimeResult?.segments ?? []}
                />
                <div className="rounded-xl border border-border bg-background p-4">
                  <MaskingReviewPanel
                    disabled={!runtimeResult}
                    onAdd={addMask}
                    onComplete={completeMasking}
                    onDownloadSanitizedPdf={downloadSanitizedTextPdf}
                    onDownloadVisualSanitizedPdf={
                      downloadFlattenedSanitizedPdf
                    }
                    onRemove={removeMask}
                    onReview={reviewMaskDecision}
                    review={packet.masking}
                    sanitizedPdfState={sanitizedPdfState}
                    segmentIds={
                      runtimeResult?.segments.map((segment) => segment.id) ?? []
                    }
                    visualSelectionAvailable
                  />
                </div>
              </div>
            )}
            runtimeMetadata={runtimeMetadata}
          />
        )}

        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
          Demonstration environment: use synthetic or authorized public PDFs
          only. Do not upload confidential client records. Uploaded PDFs are
          processed in this browser and are not transmitted to an AI provider.
          Image-only pages can use English browser-local OCR and remain excluded
          until a practitioner verifies the OCR draft. Handwriting and
          low-quality scans may still require replacement or manual review.
        </p>
      </div>
    </BrowserCaseShell>
  );
}
