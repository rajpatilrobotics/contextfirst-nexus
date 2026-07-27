"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileText,
  FolderOpen,
  LoaderCircle,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
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
  clearBrowserCaseDocumentPacket,
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
  normalizeApprovedMaskOverlaps,
  removeMaskSuggestion,
  reviewMask,
  scanProviderPayload,
} from "../../lib/redaction";
import { DocumentCards } from "./document-cards";
import { DocumentPacketTools } from "./document-packet-tools";
import { MaskedPdfPreview } from "./masked-pdf-preview";
import { MaskingReviewPanel } from "./masking-review-panel";
import {
  PacketMaskReviewQueue,
  type MaskNavigationTarget,
} from "./packet-mask-review-queue";
import { localPdfSelectionIssueMessage } from "./pdf-selection-panel";

type SelectionMode = "add" | "initial" | "replace" | "reselect" | "upgrade";
type ProcessSources = (
  files: readonly File[],
  caseId: string,
  options?: LocalPdfProcessingOptions,
) => Promise<LocalPdfDocumentServiceResult>;

const DEFAULT_PROCESS_SOURCES: ProcessSources = (files, caseId, options) =>
  processLocalPdfSources(files, undefined, caseId, options);

const SYNTHETIC_PACKET_BASE_PATH =
  "/fixtures/cfn-nila-verin-packet" as const;
const SYNTHETIC_PACKET_FILES = [
  { fileName: "01_case_notice_and_packet_index.pdf", sourceType: "other" },
  { fileName: "02_job_advertisement.pdf", sourceType: "recruitment_record" },
  { fileName: "03_recruiter_messages.pdf", sourceType: "communication" },
  { fileName: "04_offer_letter_and_contract.pdf", sourceType: "recruitment_record" },
  { fileName: "05_identity_and_travel_extract.pdf", sourceType: "travel_record" },
  { fileName: "06_accommodation_and_movement_log.pdf", sourceType: "travel_record" },
  { fileName: "07_debt_and_wage_ledger.pdf", sourceType: "operational_financial_record" },
  { fileName: "08_synthetic_bank_statement.pdf", sourceType: "operational_financial_record" },
  { fileName: "09_task_and_penalty_log.pdf", sourceType: "operational_financial_record" },
  { fileName: "10_supervisor_messages.pdf", sourceType: "communication" },
  { fileName: "11_police_incident_record.pdf", sourceType: "proceeding_record" },
  { fileName: "12_practitioner_intake_note.pdf", sourceType: "practitioner_note" },
  { fileName: "13_support_and_health_note.pdf", sourceType: "support_provider_note" },
  { fileName: "14_hearing_and_charge_summary.pdf", sourceType: "proceeding_record" },
  { fileName: "scan_001.pdf", sourceType: "other" },
  { fileName: "attachment_02.pdf", sourceType: "other" },
  { fileName: "document_final.pdf", sourceType: "other" },
] as const satisfies readonly {
  fileName: string;
  sourceType: DocumentRecord["sourceType"];
}[];

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
  const [privacyActionFeedback, setPrivacyActionFeedback] = useState<{
    tone: "success" | "warning";
    message: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingSynthetic, setIsLoadingSynthetic] = useState(false);
  const [isRestoringFiles, setIsRestoringFiles] = useState(false);
  const [sourceChooserOpen, setSourceChooserOpen] = useState(false);
  const [syntheticReplaceConfirm, setSyntheticReplaceConfirm] = useState(false);
  const [pendingRemovalDocumentId, setPendingRemovalDocumentId] =
    useState<string | null>(null);
  const [bulkRemovalMode, setBulkRemovalMode] = useState<
    "select" | "all" | null
  >(null);
  const [bulkRemovalDocumentIds, setBulkRemovalDocumentIds] = useState<
    readonly string[]
  >([]);
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
  const [maskNavigationTarget, setMaskNavigationTarget] =
    useState<MaskNavigationTarget | null>(null);
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
  const automaticMaskSuggestionIds = useMemo(
    () =>
      runtimeResult
        ? detectMaskSuggestions(runtimeResult.segments).map(
            (suggestion) => suggestion.id,
          )
        : [],
    [runtimeResult],
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
    if (
      !record?.purposeBrief ||
      isProcessing ||
      isLoadingSynthetic ||
      isRestoringFiles
    ) {
      return;
    }
    setSourceChooserOpen(false);
    setSyntheticReplaceConfirm(false);
    selectionModeRef.current = mode;
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  async function processSelection(
    files: readonly File[],
    declaredSourceTypes: Readonly<
      Record<string, DocumentRecord["sourceType"]>
    > = {},
  ): Promise<boolean> {
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
      const resultFileMetadata = result.fileMetadata;
      const previousPacket = record.documentPacket;
      const previousSourceTypes = new Map(
        previousPacket?.fileMetadata.map((metadata, index) => [
          `${metadata.fileName}:${metadata.byteLength}`,
          previousPacket.documents[index]?.sourceType ?? "other",
        ]) ?? [],
      );
      result = {
        ...result,
        documents: result.documents.map((document, index) => {
          const metadata = resultFileMetadata[index];
          if (!metadata) return document;
          const sourceType =
            declaredSourceTypes[metadata.fileName] ??
            previousSourceTypes.get(
              `${metadata.fileName}:${metadata.byteLength}`,
            ) ??
            document.sourceType;
          return sourceType === document.sourceType
            ? document
            : { ...document, sourceType };
        }),
      };
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
      const mode = selectionModeRef.current;

      if (mode === "upgrade" && previousPacket) {
        const selectedFiles = new Map(
          resultFileMetadata.map((metadata) => [
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

  function openSourceChooser() {
    if (
      !record?.purposeBrief ||
      isProcessing ||
      isLoadingSynthetic ||
      isRestoringFiles
    ) {
      return;
    }
    setSyntheticReplaceConfirm(false);
    setSourceChooserOpen(true);
  }

  async function loadSyntheticPacket() {
    if (!record?.purposeBrief || isProcessing || isLoadingSynthetic) return;
    if (record.documentPacket && !syntheticReplaceConfirm) {
      setSyntheticReplaceConfirm(true);
      return;
    }

    setIsLoadingSynthetic(true);
    setNotice(null);
    try {
      const files = await Promise.all(
        SYNTHETIC_PACKET_FILES.map(async ({ fileName }) => {
          const response = await fetch(
            `${SYNTHETIC_PACKET_BASE_PATH}/${encodeURIComponent(fileName)}`,
          );
          if (!response.ok) throw new Error("synthetic_pdf_unavailable");
          return new File([await response.blob()], fileName, {
            type: "application/pdf",
            lastModified: 0,
          });
        }),
      );
      selectionModeRef.current = record.documentPacket ? "replace" : "initial";
      const processed = await processSelection(
        files,
        Object.fromEntries(
          SYNTHETIC_PACKET_FILES.map(({ fileName, sourceType }) => [
            fileName,
            sourceType,
          ]),
        ),
      );
      if (processed) {
        setSourceChooserOpen(false);
        setSyntheticReplaceConfirm(false);
        setNotice({
          tone: "success",
          title: "Synthetic demo packet loaded",
          detail:
            "Seventeen fictional PDFs were processed through the same browser-local extraction, coverage, and masking workflow as local uploads.",
        });
      }
    } catch {
      setNotice({
        tone: "warning",
        title: "Synthetic packet could not be loaded",
        detail:
          "The bundled PDF assets were unavailable. No case state was changed.",
      });
    } finally {
      setIsLoadingSynthetic(false);
    }
  }

  async function removeDocuments(documentIds: readonly string[]) {
    const currentPacket = record?.documentPacket;
    if (
      documentIds.length === 0 ||
      !currentPacket ||
      !runtimeResult?.fileMetadata ||
      isProcessing
    ) {
      return false;
    }

    const requestedIds = new Set(documentIds);
    const removalIndexes = new Set(
      runtimeResult.fileMetadata.flatMap((metadata, index) =>
        requestedIds.has(metadata.documentId) ? [index] : [],
      ),
    );
    const allSourcesAvailable =
      removalIndexes.size === requestedIds.size &&
      [...removalIndexes].every((index) => Boolean(runtimeFiles[index]));
    if (!allSourcesAvailable) {
      setNotice({
        tone: "warning",
        title: "Reselect the packet before removing PDFs",
        detail:
          "The saved metadata is available, but the browser does not currently hold every PDF byte needed to rebuild the remaining packet safely.",
      });
      return false;
    }

    const remainingFiles = runtimeFiles.filter(
      (_, index) => !removalIndexes.has(index),
    );
    if (remainingFiles.length > 0) {
      const sourceTypes = Object.fromEntries(
        currentPacket.fileMetadata.flatMap((metadata, index) => {
          if (removalIndexes.has(index)) return [];
          return [
            [
              metadata.fileName,
              currentPacket.documents[index]?.sourceType ?? "other",
            ],
          ];
        }),
      );
      selectionModeRef.current = "replace";
      const processed = await processSelection(remainingFiles, sourceTypes);
      if (processed) {
        setNotice({
          tone: "success",
          title:
            documentIds.length === 1 ? "PDF removed" : "Selected PDFs removed",
          detail:
            `${documentIds.length} PDF${documentIds.length === 1 ? " was" : "s were"} removed. The remaining packet was reprocessed and saved; previous analysis is no longer current.`,
        });
      }
      return processed;
    }

    const loaded = loadBrowserCaseRegistry(window.localStorage);
    if (!loaded.ok) {
      setStorageError(loaded.reason);
      return false;
    }
    const cleared = clearBrowserCaseDocumentPacket(
      loaded.registry,
      caseId,
    );
    if (!cleared.ok) {
      setStorageError(cleared.reason);
      return false;
    }
    const persisted = persistBrowserCaseRegistry(
      window.localStorage,
      cleared.registry,
    );
    if (!persisted.ok) {
      setStorageError(persisted.reason);
      return false;
    }
    try {
      await fileStore.save(caseId, []);
    } catch {
      setStorageError(
        "The packet was cleared, but browser file storage could not be cleaned. The saved case remains empty.",
      );
    }
    setRecord(cleared.record);
    setRuntimeFiles([]);
    setRuntimeResult(null);
    setIngestionManifest(null);
    setMaskNavigationTarget(null);
    setNotice({
      tone: "success",
      title: documentIds.length === 1 ? "PDF removed" : "All PDFs removed",
      detail:
        "The case now has an empty document packet. No PDF bytes remain in browser storage for this case.",
    });
    return true;
  }

  async function removeSelectedDocument() {
    const documentId = pendingRemovalDocumentId;
    if (!documentId) return;
    setPendingRemovalDocumentId(null);
    await removeDocuments([documentId]);
  }

  async function confirmBulkRemoval() {
    const documentIds =
      bulkRemovalMode === "all"
        ? displayedDocuments.map((document) => document.id)
        : bulkRemovalDocumentIds;
    if (documentIds.length === 0) return;
    const removed = await removeDocuments(documentIds);
    if (removed) {
      setBulkRemovalMode(null);
      setBulkRemovalDocumentIds([]);
    }
  }

  function openBulkRemoval(mode: "select" | "all") {
    setBulkRemovalDocumentIds([]);
    setBulkRemovalMode(mode);
  }

  function toggleBulkRemovalDocument(documentId: string) {
    setBulkRemovalDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
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
    setPrivacyActionFeedback(null);
    saveMasking(
      addMaskSuggestion(
        record.documentPacket.masking,
        makeManualSuggestion(input),
      ).review,
    );
  }

  function removeMask(maskId: string) {
    if (!record?.documentPacket) return;
    setPrivacyActionFeedback(null);
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
    setPrivacyActionFeedback(null);
    saveMasking(
      reviewMask(
        record.documentPacket.masking,
        maskId,
        reviewStatus,
        replacementToken,
      ).review,
    );
  }

  function applyAllDetectedMasks(requestedMaskIds: readonly string[]) {
    if (!runtimeResult || !record?.documentPacket) return;
    setPrivacyActionFeedback(null);
    const detectedIds = new Set(
      detectMaskSuggestions(runtimeResult.segments).map(
        (suggestion) => suggestion.id,
      ),
    );
    const requestedIds = new Set(requestedMaskIds);
    const eligible = record.documentPacket.masking.suggestions.filter(
      (suggestion) =>
        suggestion.reviewStatus === "pending" &&
        detectedIds.has(suggestion.id) &&
        requestedIds.has(suggestion.id),
    );
    if (eligible.length === 0) return;

    let nextReview = record.documentPacket.masking;
    eligible.forEach((suggestion) => {
      nextReview = reviewMask(
        nextReview,
        suggestion.id,
        "approved",
        suggestion.replacementToken,
      ).review;
    });

    const approval = approveMaskingReview(
      nextReview,
      runtimeResult.segments,
      new Date().toISOString(),
    );
    if (!approval.ok) {
      const saved = saveMasking(nextReview);
      const hasOverlappingRange = approval.issues.some(
        (issue) => issue.code === "overlapping_masks",
      );
      setPrivacyActionFeedback({
        tone: "warning",
        message: saved
          ? hasOverlappingRange
            ? "All detected masks were saved. Click “Run final privacy check” above once; it will safely refresh the older overlapping automatic range and scan the packet."
            : "Detected masks were saved. Use the single next-step button above to open and resolve the remaining mask."
          : "The detected-mask decisions could not be saved in browser storage.",
      });
      setNotice({
        tone: saved ? "neutral" : "warning",
        title: saved
          ? "Detected masks applied; review remains"
          : "Bulk mask decisions were not saved",
        detail: saved
          ? `${eligible.length} automatic suggestion${eligible.length === 1 ? " is" : "s are"} now approved. Resolve any remaining manual or needing-correction masks before the final leak scan can run.`
          : "Browser storage rejected the updated packet. No bulk decision was retained.",
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
    const saved = saveMasking(masking);
    setNotice({
      tone:
        saved && masking.leakScanStatus === "passed" ? "success" : "warning",
      title: !saved
        ? "Bulk mask decisions were not saved"
        : masking.leakScanStatus === "passed"
          ? "Detected masks applied and privacy check passed"
          : "Detected masks applied; privacy check needs attention",
      detail: !saved
        ? "Browser storage rejected the updated packet. No bulk decision was retained."
        : masking.leakScanStatus === "passed"
          ? `${eligible.length} automatic suggestion${eligible.length === 1 ? " is" : "s are"} approved. Review the black overlays; each mask remains editable or removable.`
          : "A supported identifier pattern remains in the masked text. Analysis stays blocked until it is corrected and the check passes.",
    });
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
    setPrivacyActionFeedback(null);
    if (!runtimeResult || !record?.documentPacket) {
      setPrivacyActionFeedback({
        tone: "warning",
        message:
          "Restore the saved PDFs before running the final privacy check.",
      });
      setNotice({
        tone: "warning",
        title: "Restore the document files",
        detail:
          "Choose the existing PDFs again once before completing privacy masking. Future reloads will restore browser-stored files automatically.",
      });
      return;
    }
    let reviewForApproval = record.documentPacket.masking;
    let approval = approveMaskingReview(
      record.documentPacket.masking,
      runtimeResult.segments,
      new Date().toISOString(),
    );
    let refreshedAutomaticRangeCount = 0;
    let normalizedOverlapCount = 0;

    if (!approval.ok) {
      const currentDetected = detectMaskSuggestions(runtimeResult.segments);
      const currentDetectedIds = new Set(
        currentDetected.map((suggestion) => suggestion.id),
      );
      const overlappingIds = new Set(
        approval.issues
          .filter((issue) => issue.code === "overlapping_masks")
          .map((issue) => issue.maskId)
          .filter((maskId): maskId is string => Boolean(maskId)),
      );
      const nextSuggestions = [...reviewForApproval.suggestions];

      overlappingIds.forEach((maskId) => {
        const staleIndex = nextSuggestions.findIndex(
          (suggestion) => suggestion.id === maskId,
        );
        const staleSuggestion = nextSuggestions[staleIndex];
        if (!staleSuggestion || currentDetectedIds.has(staleSuggestion.id)) {
          return;
        }
        const correctedSuggestion = currentDetected.find(
          (suggestion) =>
            suggestion.segmentId === staleSuggestion.segmentId &&
            suggestion.maskClass === staleSuggestion.maskClass &&
            suggestion.originalStart < staleSuggestion.originalEnd &&
            suggestion.originalEnd > staleSuggestion.originalStart,
        );
        if (!correctedSuggestion) return;

        const existingCorrectedIndex = nextSuggestions.findIndex(
          (suggestion) => suggestion.id === correctedSuggestion.id,
        );
        const refreshedSuggestion = {
          ...correctedSuggestion,
          replacementToken: staleSuggestion.replacementToken,
          redactedEnd:
            correctedSuggestion.redactedStart +
            staleSuggestion.replacementToken.length,
          reviewStatus: staleSuggestion.reviewStatus,
        };
        if (existingCorrectedIndex >= 0) {
          nextSuggestions[existingCorrectedIndex] = refreshedSuggestion;
          nextSuggestions.splice(staleIndex, 1);
        } else {
          nextSuggestions[staleIndex] = refreshedSuggestion;
        }
        refreshedAutomaticRangeCount += 1;
      });

      if (refreshedAutomaticRangeCount > 0) {
        reviewForApproval = {
          ...reviewForApproval,
          revision: reviewForApproval.revision + 1,
          reviewStatus: "invalidated",
          suggestions: nextSuggestions,
          reviewedBy: null,
          approvedAt: undefined,
          leakScanStatus: "not_run",
          failedClasses: [],
        };
        approval = approveMaskingReview(
          reviewForApproval,
          runtimeResult.segments,
          new Date().toISOString(),
        );
      }
    }

    if (
      !approval.ok &&
      approval.issues.some((issue) => issue.code === "overlapping_masks")
    ) {
      const normalized = normalizeApprovedMaskOverlaps(
        reviewForApproval,
        runtimeResult.segments,
      );
      if (normalized.normalizedCount > 0) {
        reviewForApproval = normalized.review;
        normalizedOverlapCount = normalized.normalizedCount;
        approval = approveMaskingReview(
          reviewForApproval,
          runtimeResult.segments,
          new Date().toISOString(),
        );
      }
    }

    if (!approval.ok) {
      const pendingCount = reviewForApproval.suggestions.filter(
        (suggestion) => suggestion.reviewStatus === "pending",
      ).length;
      const correctionCount = reviewForApproval.suggestions.filter(
        (suggestion) => suggestion.reviewStatus === "rejected",
      ).length;
      const locatedIssue = approval.issues.find(
        (issue) => issue.maskId && issue.segmentId,
      );
      const issueSuggestion = locatedIssue?.maskId
        ? reviewForApproval.suggestions.find(
            (suggestion) => suggestion.id === locatedIssue.maskId,
          )
        : undefined;
      const issueSegment = locatedIssue?.segmentId
        ? runtimeResult.segments.find(
            (segment) => segment.id === locatedIssue.segmentId,
          )
        : undefined;
      const issueDocument = issueSegment
        ? record.documentPacket.documents.find(
            (document) => document.id === issueSegment.documentId,
          )
        : undefined;
      const issueLabel =
        locatedIssue?.code === "overlapping_masks"
          ? "overlaps another approved mask"
          : locatedIssue?.code === "invalid_range"
            ? "no longer matches a valid source-text range"
            : locatedIssue?.code === "unsafe_replacement_token"
              ? "uses an unsafe replacement label"
              : locatedIssue?.code === "pending_mask"
                ? "still needs a review decision"
                : locatedIssue?.code === "rejected_mask"
                  ? "is marked as needing correction"
                  : "needs correction";
      const locatedFeedback =
        locatedIssue &&
        issueSuggestion &&
        issueSegment &&
        typeof issueSegment.pageNumber === "number"
          ? `Opened ${issueDocument?.fileName ?? issueSegment.documentId}, page ${issueSegment.pageNumber}. The highlighted ${issueSuggestion.maskClass.replaceAll("_", " ")} mask ${issueLabel}. Approve, adjust, or remove it, then run the check again.`
          : null;

      if (
        locatedFeedback &&
        locatedIssue?.maskId &&
        issueSegment &&
        typeof issueSegment.pageNumber === "number"
      ) {
        if (
          refreshedAutomaticRangeCount > 0 ||
          normalizedOverlapCount > 0
        ) {
          saveMasking(reviewForApproval);
        }
        navigateToMask({
          documentId: issueSegment.documentId,
          maskId: locatedIssue.maskId,
          pageNumber: issueSegment.pageNumber,
        });
      }
      const feedback =
        locatedFeedback ??
        (pendingCount > 0 || correctionCount > 0
          ? `Review ${pendingCount} pending and ${correctionCount} needing-correction mask${pendingCount + correctionCount === 1 ? "" : "s"} before approval.`
          : "The privacy check could not locate the invalid range in the current PDF view. Reprocess the packet to refresh its source mapping.");
      setPrivacyActionFeedback({ tone: "warning", message: feedback });
      setNotice({
        tone: "warning",
        title: "Mask review remains blocked",
        detail: locatedFeedback
          ? locatedFeedback
          : pendingCount > 0 || correctionCount > 0
            ? `Review ${pendingCount} pending and ${correctionCount} needing-correction mask${pendingCount + correctionCount === 1 ? "" : "s"}. Use the single next-step action at the top of Masking Status.`
            : "The invalid range could not be located in the current PDF view. Reprocess the packet to refresh its source mapping.",
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
      setPrivacyActionFeedback({
        tone: "warning",
        message:
          "The privacy result could not be saved in browser storage. Your previous masking state is unchanged.",
      });
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
    setPrivacyActionFeedback({
      tone: masking.leakScanStatus === "passed" ? "success" : "warning",
      message:
        masking.leakScanStatus === "passed"
          ? `${refreshedAutomaticRangeCount > 0 ? "An older automatic address range was safely refreshed. " : ""}${normalizedOverlapCount > 0 ? `${normalizedOverlapCount} overlapping mask range${normalizedOverlapCount === 1 ? " was" : "s were"} safely consolidated without exposing covered text. ` : ""}Privacy check passed and was saved. Analysis is now available.`
          : "The local scan still finds a supported identifier. Correct its mask and run the check again.",
    });
  }

  function focusFirstUnresolvedMask() {
    if (!runtimeResult || !record?.documentPacket) return;
    const suggestion = record.documentPacket.masking.suggestions.find(
      (candidate) =>
        candidate.reviewStatus === "pending" ||
        candidate.reviewStatus === "rejected",
    );
    if (!suggestion) {
      completeMasking();
      return;
    }
    const segment = runtimeResult.segments.find(
      (candidate) => candidate.id === suggestion.segmentId,
    );
    if (!segment || typeof segment.pageNumber !== "number") {
      setPrivacyActionFeedback({
        tone: "warning",
        message:
          "This unresolved mask has no usable page location. Remove it from the accessible mask list or reprocess the PDF.",
      });
      return;
    }

    navigateToMask({
      documentId: segment.documentId,
      maskId: suggestion.id,
      pageNumber: segment.pageNumber,
    });
  }

  function navigateToMask(target: MaskNavigationTarget) {
    const suggestion = record?.documentPacket?.masking.suggestions.find(
      (candidate) => candidate.id === target.maskId,
    );
    setMaskNavigationTarget(target);
    setPrivacyActionFeedback({
      tone: "warning",
      message: `Opened the ${suggestion?.maskClass.replaceAll("_", " ") ?? "selected"} mask in ${target.documentId}, page ${target.pageNumber}. Approve, correct, or remove it.`,
    });
    window.setTimeout(() => {
      const heading = document.getElementById("masked-preview-heading");
      if (heading && typeof heading.scrollIntoView === "function") {
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 0);
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
          disabled={!purposeComplete || isProcessing || isLoadingSynthetic}
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
                  disabled={
                    !purposeComplete || isProcessing || isLoadingSynthetic
                  }
                  onClick={openSourceChooser}
                  type="button"
                >
                  {isProcessing || isLoadingSynthetic
                    ? "Processing locally…"
                    : "Add PDFs"}
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
            maskingTarget={maskNavigationTarget}
            ocrDrafts={ocrDrafts}
            onAddSource={openSourceChooser}
            onRemove={setPendingRemovalDocumentId}
            onRemoveAll={() => openBulkRemoval("all")}
            onSelectForRemoval={() => openBulkRemoval("select")}
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
            packetPrimaryAction={
              analysisCorpusResult?.ok ? (
                <Link
                  aria-label="Continue to Structured Analysis from packet header"
                  className="inline-flex min-h-7 items-center gap-1 rounded-md border border-[var(--color-brand)] bg-[var(--color-brand)] px-2 py-1 text-xs font-semibold !text-white hover:bg-[var(--color-brand-hover)]"
                  href={`/case/${record.id}/analysis`}
                >
                  Continue to analysis
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <button
                  aria-label="Structured Analysis unavailable"
                  className="inline-flex min-h-7 items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground"
                  disabled
                  title="Complete source preparation and the final privacy check first."
                  type="button"
                >
                  Analysis blocked
                </button>
              )
            }
            qualityContent={
              <DocumentPacketTools
                analysisHref={`/case/${record.id}/analysis`}
                corpusResult={analysisCorpusResult}
                manifest={ingestionManifest}
                onDownloadReport={downloadIntegrityReport}
                runtimeAvailable={Boolean(runtimeResult)}
              />
            }
            renderMaskingContent={({ document, file, focusedMaskId }) => (
              <div className="grid gap-5">
                <PacketMaskReviewQueue
                  automaticSuggestionIds={automaticMaskSuggestionIds}
                  disabled={!runtimeResult}
                  documents={displayedDocuments}
                  focusedMaskId={maskNavigationTarget?.maskId}
                  onApplyAllDetected={applyAllDetectedMasks}
                  onComplete={completeMasking}
                  onNavigate={navigateToMask}
                  onRestore={() =>
                    openPicker(
                      runtimeFiles.length === 0 ? "upgrade" : "reselect",
                    )
                  }
                  review={packet.masking}
                  segments={runtimeResult?.segments ?? []}
                />
                {privacyActionFeedback ? (
                  <p
                    className={
                      privacyActionFeedback.tone === "success"
                        ? "rounded-md border border-[color-mix(in_oklab,var(--sage)_35%,transparent)] bg-[color-mix(in_oklab,var(--sage)_9%,transparent)] px-3 py-2 text-xs leading-5"
                        : "rounded-md border border-[color-mix(in_oklab,var(--rust)_35%,transparent)] bg-[color-mix(in_oklab,var(--rust)_8%,transparent)] px-3 py-2 text-xs leading-5"
                    }
                    role={
                      privacyActionFeedback.tone === "warning"
                        ? "alert"
                        : "status"
                    }
                  >
                    {privacyActionFeedback.message}
                  </p>
                ) : null}
                <MaskedPdfPreview
                  disabled={!runtimeResult}
                  document={document}
                  file={file}
                  focusedMaskId={focusedMaskId}
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
                    onReviewUnresolved={focusFirstUnresolvedMask}
                    onReview={reviewMaskDecision}
                    review={packet.masking}
                    sanitizedPdfState={sanitizedPdfState}
                    segmentIds={
                      runtimeResult?.segments.map((segment) => segment.id) ?? []
                    }
                    showPrimaryAction={false}
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

        {sourceChooserOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-5"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !isLoadingSynthetic) {
                setSourceChooserOpen(false);
                setSyntheticReplaceConfirm(false);
              }
            }}
          >
            <section
              aria-labelledby="pdf-source-heading"
              aria-modal="true"
              className="max-h-[calc(100vh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
              role="dialog"
            >
              <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Source intake
                  </p>
                  <h2 className="mt-1 font-serif text-xl" id="pdf-source-heading">
                    Add PDFs
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload a permitted local packet or explore the complete
                    fictional demonstration packet.
                  </p>
                </div>
                <button
                  aria-label="Close Add PDFs"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border hover:bg-muted"
                  disabled={isLoadingSynthetic}
                  onClick={() => {
                    setSourceChooserOpen(false);
                    setSyntheticReplaceConfirm(false);
                  }}
                  type="button"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </header>

              <div className="grid gap-3 p-5 md:grid-cols-2">
                <article className="flex min-h-64 flex-col rounded-xl border border-border bg-background p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/40">
                    <FolderOpen
                      aria-hidden="true"
                      className="h-4.5 w-4.5 text-muted-foreground"
                    />
                  </span>
                  <h3 className="mt-4 font-serif text-lg">
                    Upload from this device
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Choose one or multiple synthetic or authorized-public PDFs.
                    Files remain in this browser.
                  </p>
                  <button
                    className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
                    onClick={() =>
                      openPicker(
                        record.documentPacket
                          ? runtimeFiles.length === 0
                            ? "upgrade"
                            : "add"
                          : "initial",
                      )
                    }
                    type="button"
                  >
                    <UploadCloud aria-hidden="true" className="h-4 w-4" />
                    Choose local PDFs
                  </button>
                </article>

                <article className="flex min-h-64 flex-col rounded-xl border border-[color:var(--amber)]/45 bg-[color:var(--amber)]/5 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--amber)]/30 bg-[color:var(--amber)]/10">
                    <Sparkles
                      aria-hidden="true"
                      className="h-4.5 w-4.5 text-[color:var(--amber)]"
                    />
                  </span>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-lg">
                      Use synthetic demo packet
                    </h3>
                    <Chip tone="amber">Judge ready</Chip>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    17 fictional PDFs · 35 pages · 14 clearly named records and
                    3 generic-filename records.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Actual PDF bytes run through the same extraction, masking,
                    coverage, and analysis-input pipeline. No analysis result is
                    preloaded.
                  </p>
                  {syntheticReplaceConfirm ? (
                    <div
                      aria-label="Confirm synthetic packet replacement"
                      className="mt-auto rounded-lg border border-[color:var(--rust)]/30 bg-[color:var(--rust)]/5 p-3"
                      role="alert"
                    >
                      <p className="text-xs leading-5">
                        This will replace the current packet. Existing PDFs will
                        not be mixed with the synthetic demonstration.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="inline-flex min-h-9 items-center justify-center rounded-md bg-[color:var(--rust)] px-3 py-2 text-xs font-semibold text-white"
                          onClick={() => void loadSyntheticPacket()}
                          type="button"
                        >
                          Replace with synthetic packet
                        </button>
                        <button
                          className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold"
                          onClick={() => setSyntheticReplaceConfirm(false)}
                          type="button"
                        >
                          Keep current packet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[color:var(--amber)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                      disabled={isLoadingSynthetic}
                      onClick={() => void loadSyntheticPacket()}
                      type="button"
                    >
                      {isLoadingSynthetic ? (
                        <LoaderCircle
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin"
                        />
                      ) : (
                        <Sparkles aria-hidden="true" className="h-4 w-4" />
                      )}
                      {isLoadingSynthetic
                        ? "Loading synthetic packet…"
                        : record.documentPacket
                          ? "Replace with synthetic packet"
                          : "Load synthetic packet"}
                    </button>
                  )}
                </article>
              </div>

              <p className="border-t border-border px-5 py-3 text-xs leading-5 text-muted-foreground">
                Demonstration boundary: never upload confidential client or
                survivor records. Uploaded files are not transmitted to an AI
                provider during document processing.
              </p>
            </section>
          </div>
        ) : null}

        {bulkRemovalMode ? (
          <div className="fixed inset-0 z-[55] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-5">
            <section
              aria-labelledby="bulk-remove-pdf-heading"
              aria-modal="true"
              className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
              role="dialog"
            >
              <header className="flex items-start gap-3 border-b border-border p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--rust)]/30 bg-[color:var(--rust)]/5 text-[color:var(--rust)]">
                  <Trash2 aria-hidden="true" className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Packet management
                  </p>
                  <h2
                    className="mt-1 font-serif text-xl"
                    id="bulk-remove-pdf-heading"
                  >
                    {bulkRemovalMode === "all"
                      ? "Remove all PDFs?"
                      : "Select PDFs to remove"}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {bulkRemovalMode === "all"
                      ? `This will clear all ${displayedDocuments.length} PDFs from the current case.`
                      : "Choose one or more PDFs. Unselected files will be reprocessed as the current packet."}
                  </p>
                </div>
              </header>

              {bulkRemovalMode === "select" ? (
                <fieldset className="max-h-80 overflow-y-auto p-3">
                  <legend className="sr-only">PDFs selected for removal</legend>
                  <div className="grid gap-1">
                    {displayedDocuments.map((document) => {
                      const checked = bulkRemovalDocumentIds.includes(
                        document.id,
                      );
                      return (
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 ${
                            checked
                              ? "border-[color:var(--rust)]/40 bg-[color:var(--rust)]/5"
                              : "border-transparent hover:bg-muted/50"
                          }`}
                          key={document.id}
                        >
                          <input
                            checked={checked}
                            className="mt-0.5 h-4 w-4 accent-[color:var(--rust)]"
                            onChange={() =>
                              toggleBulkRemovalDocument(document.id)
                            }
                            type="checkbox"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">
                              {document.fileName}
                            </span>
                            <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                              {document.id} · {document.expectedPageCount} page
                              {document.expectedPageCount === 1 ? "" : "s"}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : (
                <div className="p-5">
                  <div className="rounded-lg border border-[color:var(--rust)]/25 bg-[color:var(--rust)]/5 p-3 text-sm leading-6">
                    Masking decisions, coverage, and current analysis derived
                    from this packet will no longer be current. You can add a
                    new packet afterward.
                  </div>
                </div>
              )}

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
                <span className="text-xs text-muted-foreground">
                  {bulkRemovalMode === "select"
                    ? `${bulkRemovalDocumentIds.length} selected`
                    : `${displayedDocuments.length} PDFs will be removed`}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
                    disabled={isProcessing}
                    onClick={() => {
                      setBulkRemovalMode(null);
                      setBulkRemovalDocumentIds([]);
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[color:var(--rust)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      isProcessing ||
                      (bulkRemovalMode === "select" &&
                        bulkRemovalDocumentIds.length === 0)
                    }
                    onClick={() => void confirmBulkRemoval()}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                    {bulkRemovalMode === "all"
                      ? `Remove all ${displayedDocuments.length} PDFs`
                      : `Remove selected (${bulkRemovalDocumentIds.length})`}
                  </button>
                </div>
              </footer>
            </section>
          </div>
        ) : null}

        {pendingRemovalDocumentId ? (
          <div className="fixed inset-0 z-[55] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-5">
            <section
              aria-labelledby="remove-pdf-heading"
              aria-modal="true"
              className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl"
              role="dialog"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--rust)]/30 bg-[color:var(--rust)]/5 text-[color:var(--rust)]">
                <Trash2 aria-hidden="true" className="h-4.5 w-4.5" />
              </span>
              <h2 className="mt-4 font-serif text-xl" id="remove-pdf-heading">
                Remove this PDF?
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {displayedDocuments.find(
                  (document) => document.id === pendingRemovalDocumentId,
                )?.fileName ?? pendingRemovalDocumentId}
              </p>
              <p className="mt-2 text-sm leading-6">
                The remaining files will be reprocessed. Masking, coverage,
                packet integrity, and analysis freshness will update to match
                the new packet.
              </p>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
                  onClick={() => setPendingRemovalDocumentId(null)}
                  type="button"
                >
                  Keep PDF
                </button>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[color:var(--rust)] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => void removeSelectedDocument()}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Remove PDF
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </BrowserCaseShell>
  );
}
