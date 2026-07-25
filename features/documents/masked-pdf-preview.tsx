"use client";

import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist/types/src/display/api";
import { Check, Eye, MousePointer2, ShieldCheck, TriangleAlert } from "lucide-react";
import type {
  DocumentRecord,
  MaskClass,
  MaskingReview,
  SourceSegment,
} from "../../lib/contracts";
import {
  indexPdfTextItems,
  clippedPdfTextItemRect,
  pdfTextItemRect,
  rangesIntersect,
  readBrowserPdfTextItems,
  type IndexedPdfTextItem,
  type PdfPageLike,
} from "../../lib/documents";
import {
  DEFAULT_REPLACEMENT_TOKENS,
  SUPPORTED_MASK_CLASSES,
} from "../../lib/redaction";

type MaskSuggestion = MaskingReview["suggestions"][number];
type MaskReviewStatus = MaskSuggestion["reviewStatus"];
type Viewport = ReturnType<PDFPageProxy["getViewport"]>;

type PageModel = {
  page: PDFPageProxy;
  pageNumber: number;
  segment: SourceSegment | null;
  textItems: IndexedPdfTextItem[];
  viewport: Viewport;
  placementReady: boolean;
};

type TextSelection = {
  segmentId: string;
  pageNumber: number;
  originalStart: number;
  originalEnd: number;
  text: string;
};

const MASK_CLASS_LABELS: Record<MaskClass, string> = {
  person_name: "Person name",
  email: "Email",
  phone: "Phone",
  passport: "Passport",
  bank_account: "Bank account",
  address: "Address",
  date_of_birth: "Date of birth",
};

const STATUS_LABELS: Record<MaskReviewStatus, string> = {
  pending: "Awaiting review",
  approved: "Approved",
  edited: "Approved with edited label",
  rejected: "Needs correction",
};

export function splitIndexedPdfTextItems(
  items: readonly IndexedPdfTextItem[],
): IndexedPdfTextItem[] {
  return items.flatMap((item) => {
    const words = Array.from(item.text.matchAll(/\S+/g));
    if (words.length <= 1) return [item];

    const textLength = Math.max(1, item.text.length);
    const angle = Math.atan2(item.transform[1] ?? 0, item.transform[0] ?? 1);
    return words.map((match) => {
      const text = match[0];
      const relativeStart = match.index ?? 0;
      const startRatio = relativeStart / textLength;
      const widthRatio = text.length / textLength;
      const transform = [...item.transform];
      const distance = item.width * startRatio;
      transform[4] = (transform[4] ?? 0) + Math.cos(angle) * distance;
      transform[5] = (transform[5] ?? 0) + Math.sin(angle) * distance;
      return {
        ...item,
        text,
        originalStart: item.originalStart + relativeStart,
        originalEnd: item.originalStart + relativeStart + text.length,
        transform,
        width: item.width * widthRatio,
      };
    });
  });
}

function rectStyle(rect: ReturnType<typeof pdfTextItemRect>): CSSProperties {
  return {
    height: `${rect.height}px`,
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
  };
}

function maskOverlayClass(status: MaskReviewStatus, selected: boolean) {
  const selectedClass = selected
    ? " ring-2 ring-sky-400 ring-offset-1 ring-offset-white"
    : "";
  if (status === "approved" || status === "edited") {
    return `border border-slate-950 bg-slate-950 text-white shadow-sm${selectedClass}`;
  }
  if (status === "rejected") {
    return `border-2 border-red-600 bg-red-100/70 text-red-950${selectedClass}`;
  }
  return `border-2 border-amber-500 bg-amber-300/75 text-slate-950${selectedClass}`;
}

function CanvasPage({ page, viewport }: { page: PDFPageProxy; viewport: Viewport }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const outputScale = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const transform =
      outputScale === 1
        ? undefined
        : ([outputScale, 0, 0, outputScale, 0, 0] as [
            number,
            number,
            number,
            number,
            number,
            number,
          ]);
    let renderTask: RenderTask | undefined;
    try {
      renderTask = page.render({ canvas, transform, viewport });
      void renderTask.promise.catch(() => undefined);
    } catch {
      renderTask = undefined;
    }
    return () => renderTask?.cancel();
  }, [page, viewport]);

  return (
    <canvas
      aria-label={`Masked PDF page ${page.pageNumber}`}
      className="block bg-white"
      ref={canvasRef}
      role="img"
    />
  );
}

function MaskedPage({
  model,
  suggestions,
  draft,
  selectedMaskId,
  onSelectItem,
  onSelectMask,
}: {
  model: PageModel;
  suggestions: MaskSuggestion[];
  draft: TextSelection | null;
  selectedMaskId: string | null;
  onSelectItem: (
    item: IndexedPdfTextItem,
    segment: SourceSegment,
    pageNumber: number,
    extend: boolean,
  ) => void;
  onSelectMask: (maskId: string) => void;
}) {
  const pageSuggestions = model.segment
    ? suggestions.filter(
        (suggestion) => suggestion.segmentId === model.segment?.id,
      )
    : [];

  return (
    <figure className="mx-auto grid w-max gap-2">
      <figcaption className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        <span>Page {model.pageNumber}</span>
        <span>
          {model.placementReady
            ? `${pageSuggestions.length} mask${pageSuggestions.length === 1 ? "" : "s"}`
            : "Mask placement unavailable"}
        </span>
      </figcaption>
      <div
        className="relative overflow-hidden rounded-sm bg-white shadow-[0_2px_14px_rgba(15,23,42,0.18)]"
        style={{
          height: `${model.viewport.height}px`,
          width: `${model.viewport.width}px`,
        }}
      >
        <CanvasPage page={model.page} viewport={model.viewport} />
        {model.placementReady && model.segment ? (
          <div
            aria-label={`Selectable extracted text for page ${model.pageNumber}`}
            className="absolute inset-0"
            role="group"
          >
            {model.textItems.map((item, itemIndex) => {
              const rect = pdfTextItemRect(item, model.viewport);
              const selected =
                draft !== null &&
                draft.segmentId === model.segment?.id &&
                rangesIntersect(
                  item.originalStart,
                  item.originalEnd,
                  draft.originalStart,
                  draft.originalEnd,
                );
              return (
                <button
                  aria-label={`Select “${item.text.slice(0, 80)}” on page ${model.pageNumber}`}
                  className={`absolute cursor-crosshair rounded-[2px] border transition ${
                    selected
                      ? "border-sky-500 bg-sky-300/45"
                      : "border-transparent bg-transparent hover:border-sky-400 hover:bg-sky-200/25 focus-visible:border-sky-500 focus-visible:bg-sky-200/30 focus-visible:outline-none"
                  }`}
                  key={`${item.originalStart}-${itemIndex}`}
                  onClick={(event) =>
                    onSelectItem(
                      item,
                      model.segment!,
                      model.pageNumber,
                      event.shiftKey,
                    )
                  }
                  style={rectStyle(rect)}
                  title="Select this text to create a privacy mask. Shift-click to extend the selection."
                  type="button"
                >
                  <span className="sr-only">{item.text}</span>
                </button>
              );
            })}

            {pageSuggestions.flatMap((suggestion) =>
              model.textItems
                .filter((item) =>
                  rangesIntersect(
                    item.originalStart,
                    item.originalEnd,
                    suggestion.originalStart,
                    suggestion.originalEnd,
                  ),
                )
                .map((item, itemIndex) => {
                  const rect = clippedPdfTextItemRect(
                    item,
                    model.viewport,
                    suggestion.originalStart,
                    suggestion.originalEnd,
                  );
                  const firstCoveredItem = !model.textItems.some(
                    (candidate) =>
                      candidate.originalStart < item.originalStart &&
                      rangesIntersect(
                        candidate.originalStart,
                        candidate.originalEnd,
                        suggestion.originalStart,
                        suggestion.originalEnd,
                      ),
                  );
                  return (
                    <button
                      aria-label={`${STATUS_LABELS[suggestion.reviewStatus]} ${MASK_CLASS_LABELS[suggestion.maskClass]} mask on page ${model.pageNumber}`}
                      className={`absolute z-10 overflow-hidden rounded-[2px] text-left text-[8px] font-bold leading-none focus-visible:outline-none ${maskOverlayClass(
                        suggestion.reviewStatus,
                        selectedMaskId === suggestion.id,
                      )}`}
                      key={`${suggestion.id}-${itemIndex}`}
                      onClick={() => onSelectMask(suggestion.id)}
                      style={rectStyle(rect)}
                      title={`${STATUS_LABELS[suggestion.reviewStatus]}: ${MASK_CLASS_LABELS[suggestion.maskClass]}`}
                      type="button"
                    >
                      {firstCoveredItem && rect.width > 42 ? (
                        <span className="block truncate px-1">
                          {MASK_CLASS_LABELS[suggestion.maskClass]}
                        </span>
                      ) : null}
                    </button>
                  );
                }),
            )}
          </div>
        ) : (
          <div className="absolute inset-x-4 bottom-4 rounded-md border border-amber-300 bg-amber-50/95 p-3 text-xs text-amber-950 shadow">
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                PDF.js could not verify a matching embedded-text layer for this
                page. No visual masks are drawn. Image-only pages require OCR,
                which is unavailable in this demonstration.
              </span>
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}

export function MaskedPdfPreview({
  document,
  file,
  review,
  segments,
  disabled = false,
  onAdd,
  onReview,
  onRemove,
  onReselect,
}: {
  document: DocumentRecord;
  file?: File;
  review: MaskingReview;
  segments: SourceSegment[];
  disabled?: boolean;
  onAdd: (input: {
    segmentId: string;
    originalStart: number;
    originalEnd: number;
    maskClass: MaskClass;
    replacementToken: string;
  }) => void;
  onReview: (
    maskId: string,
    reviewStatus: MaskReviewStatus,
    replacementToken: string,
  ) => void;
  onRemove: (maskId: string) => void;
  onReselect?: () => void;
}) {
  const [pages, setPages] = useState<PageModel[]>([]);
  const [loadingState, setLoadingState] = useState<
    "idle" | "loading" | "ready" | "failed"
  >("idle");
  const [draft, setDraft] = useState<TextSelection | null>(null);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [maskClass, setMaskClass] = useState<MaskClass>("person_name");
  const [replacement, setReplacement] = useState(
    DEFAULT_REPLACEMENT_TOKENS.person_name,
  );
  const [selectedReplacement, setSelectedReplacement] = useState("");
  const documentSegments = useMemo(
    () =>
      segments
        .filter((segment) => segment.documentId === document.id)
        .sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0)),
    [document.id, segments],
  );
  const documentSuggestions = useMemo(
    () =>
      review.suggestions.filter((suggestion) =>
        documentSegments.some((segment) => segment.id === suggestion.segmentId),
      ),
    [documentSegments, review.suggestions],
  );
  const selectedSuggestion =
    documentSuggestions.find(
      (suggestion) => suggestion.id === selectedMaskId,
    ) ?? null;
  const draftOverlapsExisting =
    draft !== null &&
    review.suggestions.some(
      (suggestion) =>
        suggestion.segmentId === draft.segmentId &&
        rangesIntersect(
          suggestion.originalStart,
          suggestion.originalEnd,
          draft.originalStart,
          draft.originalEnd,
        ),
    );

  useEffect(() => {
    setDraft(null);
    setSelectedMaskId(null);
  }, [document.id, file]);

  useEffect(() => {
    setSelectedReplacement(selectedSuggestion?.replacementToken ?? "");
  }, [selectedSuggestion?.id, selectedSuggestion?.replacementToken]);

  useEffect(() => {
    if (!file) {
      setPages([]);
      setLoadingState("idle");
      return;
    }

    let disposed = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    let pdfDocument: PDFDocumentProxy | undefined;

    async function loadPages() {
      setPages([]);
      setLoadingState("loading");
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc =
          "/vendor/pdfjs/pdf.worker.legacy-6.1.200.min.mjs";
        const bytes = new Uint8Array(await file!.arrayBuffer());
        if (disposed) return;
        loadingTask = pdfjs.getDocument({ data: bytes });
        pdfDocument = await loadingTask.promise;
        if (disposed) return;

        const nextPages: PageModel[] = [];
        for (
          let pageNumber = 1;
          pageNumber <= pdfDocument.numPages;
          pageNumber += 1
        ) {
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.25 });
          let indexed = { text: "", items: [] as IndexedPdfTextItem[] };
          try {
            indexed = indexPdfTextItems(
              await readBrowserPdfTextItems(
                page as unknown as PdfPageLike,
              ),
            );
          } catch {
            indexed = { text: "", items: [] };
          }
          const segment =
            documentSegments.find(
              (candidate) => candidate.pageNumber === pageNumber,
            ) ?? null;
          nextPages.push({
            page,
            pageNumber,
            segment,
            textItems: splitIndexedPdfTextItems(indexed.items),
            viewport,
            placementReady:
              indexed.items.length > 0 &&
              segment !== null &&
              indexed.text === segment.rawText,
          });
        }
        if (!disposed) {
          setPages(nextPages);
          setLoadingState("ready");
        }
      } catch {
        if (!disposed) {
          setPages([]);
          setLoadingState("failed");
        }
      }
    }

    void loadPages();
    return () => {
      disposed = true;
      setPages([]);
      void pdfDocument?.cleanup();
      void loadingTask?.destroy();
    };
  }, [documentSegments, file]);

  function selectItem(
    item: IndexedPdfTextItem,
    segment: SourceSegment,
    pageNumber: number,
    extend: boolean,
  ) {
    setSelectedMaskId(null);
    setDraft((current) => {
      const adjacent =
        current?.segmentId === segment.id &&
        item.originalStart <= current.originalEnd + 1 &&
        item.originalEnd >= current.originalStart - 1;
      if ((!extend && !adjacent) || current?.segmentId !== segment.id) {
        return {
          segmentId: segment.id,
          pageNumber,
          originalStart: item.originalStart,
          originalEnd: item.originalEnd,
          text: segment.rawText.slice(item.originalStart, item.originalEnd),
        };
      }
      const originalStart = Math.min(
        current.originalStart,
        item.originalStart,
      );
      const originalEnd = Math.max(current.originalEnd, item.originalEnd);
      return {
        segmentId: segment.id,
        pageNumber,
        originalStart,
        originalEnd,
        text: segment.rawText.slice(originalStart, originalEnd),
      };
    });
  }

  function changeClass(nextClass: MaskClass) {
    setMaskClass(nextClass);
    setReplacement(DEFAULT_REPLACEMENT_TOKENS[nextClass]);
  }

  if (!file) {
    return (
      <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
        <Eye className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <h4 className="mt-3 font-serif text-lg">Restore this local PDF</h4>
        <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
          The saved mask decisions remain available, but the browser needs the
          verified PDF bytes to reconstruct their visual placement.
        </p>
        {onReselect ? (
          <button
            className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
            onClick={onReselect}
            type="button"
          >
            Reselect and verify PDF
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <section aria-labelledby="masked-preview-heading" className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[color:var(--amber)]" aria-hidden="true" />
            <h4 className="font-serif text-xl" id="masked-preview-heading">
              Browser-local masked preview
            </h4>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            This is a working copy of your real PDF. Yellow boxes need review;
            black boxes are approved masks. Click any missed personal detail
            to add a mask. The original PDF is never changed.
          </p>
          <p className="mt-1 max-w-4xl text-[11px] leading-4 text-muted-foreground">
            Automatic checks cover email, phone, labelled passport, account and
            birth-date values, plus common street-address formats. Names and
            ambiguous details require manual selection. Image-only pages must
            complete browser-local OCR and human verification before they can
            appear here.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="rounded-full border border-amber-400 bg-amber-100 px-2 py-1 font-semibold text-amber-950">
            {documentSuggestions.filter((item) => item.reviewStatus === "pending").length} pending
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-950 px-2 py-1 font-semibold text-white">
            {documentSuggestions.filter((item) =>
              item.reviewStatus === "approved" || item.reviewStatus === "edited",
            ).length} approved
          </span>
          <span className="rounded-full border border-red-300 bg-red-50 px-2 py-1 font-semibold text-red-900">
            {documentSuggestions.filter((item) => item.reviewStatus === "rejected").length} needs correction
          </span>
        </div>
      </div>

      <div className="grid gap-3">
        <div
          aria-label={`Masked PDF preview: ${document.fileName}`}
          className="h-[42rem] overflow-auto rounded-xl border border-border bg-slate-200/60 p-4"
          role="region"
          tabIndex={0}
        >
          {loadingState === "loading" ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground" role="status">
              Rendering real PDF pages and verified text coordinates…
            </div>
          ) : null}
          {loadingState === "failed" ? (
            <div className="grid h-full place-items-center p-8 text-center text-sm text-red-900" role="alert">
              This PDF could not be rendered safely. Use Document View to open
              the original file or replace it through source intake.
            </div>
          ) : null}
          {loadingState === "ready" ? (
            <div className="grid min-w-max gap-6">
              {pages.map((page) => (
                <MaskedPage
                  draft={draft}
                  key={page.pageNumber}
                  model={page}
                  onSelectItem={selectItem}
                  onSelectMask={setSelectedMaskId}
                  selectedMaskId={selectedMaskId}
                  suggestions={documentSuggestions}
                />
              ))}
            </div>
          ) : null}
        </div>

        <aside className="order-first grid content-start gap-2 rounded-xl border border-border bg-background p-2.5 lg:grid-cols-[14rem_minmax(0,1fr)_13rem] lg:items-start">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 lg:col-span-2 lg:row-start-1 lg:flex-nowrap">
            <div className="flex shrink-0 items-center gap-2 font-semibold">
              <MousePointer2 className="h-4 w-4" aria-hidden="true" />
              Review visible text
            </div>
            <p className="text-[10px] leading-4 text-muted-foreground">
              Click a word, extend with adjacent words or Shift-click, then
              choose a type and add the mask.
            </p>
          </div>

          {draft ? (
            <div className="grid gap-1.5 rounded-md border border-sky-200 bg-sky-50/40 p-1.5 lg:col-span-3 lg:row-start-2 lg:grid-cols-[minmax(8rem,1fr)_10rem_minmax(12rem,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-sky-900">
                  New mask · Page {draft.pageNumber}
                </div>
                <p
                  className="mt-0.5 truncate rounded bg-white/70 px-2 py-1 text-[11px]"
                  title={draft.text}
                >
                  “{draft.text}”
                </p>
              </div>
              <label className="grid gap-0.5 text-[10px] font-semibold">
                Identifier type
                <select
                  className="min-h-7 rounded border border-border/80 bg-background px-2 text-[11px]"
                  disabled={disabled}
                  onChange={(event) =>
                    changeClass(event.currentTarget.value as MaskClass)
                  }
                  value={maskClass}
                >
                  {SUPPORTED_MASK_CLASSES.map((item) => (
                    <option key={item} value={item}>
                      {MASK_CLASS_LABELS[item]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-0.5 text-[10px] font-semibold">
                Replacement label
                <input
                  className="min-h-7 rounded border border-border/80 bg-background px-2 text-[11px]"
                  disabled={disabled}
                  onChange={(event) => setReplacement(event.currentTarget.value)}
                  value={replacement}
                />
              </label>
              <div className="flex flex-wrap gap-1.5 lg:flex-nowrap">
                <button
                  className="inline-flex min-h-7 items-center whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  disabled={
                    disabled || !replacement.trim() || draftOverlapsExisting
                  }
                  onClick={() => {
                    onAdd({
                      segmentId: draft.segmentId,
                      originalStart: draft.originalStart,
                      originalEnd: draft.originalEnd,
                      maskClass,
                      replacementToken: replacement.trim(),
                    });
                    setDraft(null);
                  }}
                  type="button"
                >
                  Add pending mask
                </button>
                <button
                  className="min-h-7 rounded border border-border px-2 py-1 text-[10px] font-semibold hover:bg-muted"
                  onClick={() => setDraft(null)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
              {draftOverlapsExisting ? (
                <p
                  className="text-xs font-medium text-red-800 lg:col-span-4"
                  role="alert"
                >
                  This selection overlaps an existing mask. Review or remove
                  that mask instead of creating a conflicting range.
                </p>
              ) : null}
            </div>
          ) : null}

          {selectedSuggestion ? (
            <div className="grid gap-1.5 rounded-md border border-border bg-muted/20 p-1.5 lg:col-span-3 lg:row-start-2 lg:grid-cols-[10rem_minmax(12rem,1fr)_auto] lg:items-end">
              <div className="min-w-0">
                <div className="font-semibold">
                  {MASK_CLASS_LABELS[selectedSuggestion.maskClass]}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {STATUS_LABELS[selectedSuggestion.reviewStatus]}
                </div>
              </div>
              <label className="grid gap-0.5 text-[10px] font-semibold">
                Replacement label
                <input
                  className="min-h-7 rounded border border-border/80 bg-background px-2 text-[11px]"
                  disabled={disabled}
                  onChange={(event) =>
                    setSelectedReplacement(event.currentTarget.value)
                  }
                  value={selectedReplacement}
                />
              </label>
              <div className="flex flex-wrap gap-1.5 lg:flex-nowrap">
                <button
                  aria-label="Approve this mask"
                  className="inline-flex min-h-7 items-center justify-center gap-1 whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  onClick={() =>
                    onReview(
                      selectedSuggestion.id,
                      "approved",
                      selectedReplacement.trim(),
                    )
                  }
                  disabled={disabled || !selectedReplacement.trim()}
                  type="button"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Approve
                </button>
                <button
                  aria-label="Save edited label"
                  className="min-h-7 whitespace-nowrap rounded border border-border px-2 py-1 text-[10px] font-semibold hover:bg-muted disabled:opacity-50"
                  disabled={
                    disabled ||
                    !selectedReplacement.trim() ||
                    selectedReplacement.trim() ===
                      selectedSuggestion.replacementToken
                  }
                  onClick={() =>
                    onReview(
                      selectedSuggestion.id,
                      "edited",
                      selectedReplacement.trim(),
                    )
                  }
                  type="button"
                >
                  Save label
                </button>
                <button
                  aria-label="Mark as needing correction"
                  className="min-h-7 whitespace-nowrap rounded border border-red-300 px-2 py-1 text-[10px] font-semibold text-red-900 hover:bg-red-50 disabled:opacity-50"
                  disabled={disabled || !selectedReplacement.trim()}
                  onClick={() =>
                    onReview(
                      selectedSuggestion.id,
                      "rejected",
                      selectedReplacement.trim(),
                    )
                  }
                  type="button"
                >
                  Needs correction
                </button>
                <button
                  aria-label="Remove false positive"
                  className="min-h-7 whitespace-nowrap rounded border border-border px-2 py-1 text-[10px] font-semibold hover:bg-muted disabled:opacity-50"
                  disabled={disabled}
                  onClick={() => {
                    onRemove(selectedSuggestion.id);
                    setSelectedMaskId(null);
                  }}
                  type="button"
                >
                  Remove
                </button>
              </div>
              <p className="text-[10px] leading-4 text-muted-foreground lg:col-span-3">
                To change the identifier type, remove this suggestion and
                select the visible text again with the correct type.
              </p>
            </div>
          ) : null}

          <details className="rounded-lg border border-border p-2 lg:col-start-3 lg:row-start-1">
            <summary className="cursor-pointer text-xs font-semibold">
              Accessible mask list ({documentSuggestions.length})
            </summary>
            {documentSuggestions.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                No automatic or manual masks are recorded for this document.
              </p>
            ) : (
              <ul className="mt-2 grid gap-1.5">
                {documentSuggestions.map((suggestion) => {
                  const sourceSegment = documentSegments.find(
                    (segment) => segment.id === suggestion.segmentId,
                  );
                  return (
                    <li key={suggestion.id}>
                      <button
                        className="w-full rounded-md border border-border px-2 py-2 text-left text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amber)]"
                        onClick={() => {
                          setDraft(null);
                          setSelectedMaskId(suggestion.id);
                        }}
                        type="button"
                      >
                        <span className="block font-semibold">
                          {MASK_CLASS_LABELS[suggestion.maskClass]} · Page{" "}
                          {sourceSegment?.pageNumber ?? "unavailable"}
                        </span>
                        <span className="text-muted-foreground">
                          {STATUS_LABELS[suggestion.reviewStatus]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </details>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2 text-[10px] leading-4 text-muted-foreground lg:col-span-3 lg:row-start-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-amber-300 ring-1 ring-amber-500" />
              Awaiting human review
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-slate-950" />
              Approved and visually obscured
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm border-2 border-red-600 bg-red-100" />
              Needs correction
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
