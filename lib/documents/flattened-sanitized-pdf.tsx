import { Document, Image, Page, pdf } from "@react-pdf/renderer";
import type {
  DocumentRecord,
  MaskingReview,
  SourceSegment,
} from "../contracts";
import { validateTransmissionReadiness } from "../redaction";
import {
  clippedPdfTextItemRect,
  rangesIntersect,
} from "./mask-geometry";
import {
  indexPdfTextItems,
  readBrowserPdfTextItems,
  type IndexedPdfTextItem,
  type PdfPageLike,
  type VerifiedOcrPage,
} from "./pdf-source-service";

type FlattenedPage = {
  documentId: string;
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
};

export type FlattenedSanitizedPdfResult =
  | { ok: true; blob: Blob; pageCount: number }
  | {
      ok: false;
      reason:
        | "privacy_review_incomplete"
        | "source_file_missing"
        | "mask_placement_unavailable"
        | "render_failed";
    };

function effectiveMasks(masking: MaskingReview, segmentId: string) {
  return masking.suggestions.filter(
    (suggestion) =>
      suggestion.segmentId === segmentId &&
      (suggestion.reviewStatus === "approved" ||
        suggestion.reviewStatus === "edited"),
  );
}

async function renderDocumentPages(input: {
  document: DocumentRecord;
  file: File;
  segments: readonly SourceSegment[];
  masking: MaskingReview;
  verifiedOcrPages: readonly VerifiedOcrPage[];
  password?: string;
}): Promise<FlattenedPage[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc =
    "/vendor/pdfjs/pdf.worker.legacy-6.1.200.min.mjs";
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await input.file.arrayBuffer()),
    ...(input.password ? { password: input.password } : {}),
  });
  const pages: FlattenedPage[] = [];

  try {
    const sourcePdf = await loadingTask.promise;
    for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber += 1) {
      const page = await sourcePdf.getPage(pageNumber);
      try {
        const pointViewport = page.getViewport({ scale: 1 });
        const renderViewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(renderViewport.width);
        canvas.height = Math.ceil(renderViewport.height);
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("flatten_canvas_unavailable");
        await page.render({
          canvas,
          canvasContext: context,
          viewport: renderViewport,
        }).promise;

        const segment = input.segments.find(
          (candidate) =>
            candidate.documentId === input.document.id &&
            candidate.pageNumber === pageNumber,
        );
        const masks = segment
          ? effectiveMasks(input.masking, segment.id)
          : [];
        if (masks.length > 0) {
          const embeddedItems = indexPdfTextItems(
            await readBrowserPdfTextItems(page as unknown as PdfPageLike),
          ).items;
          const items: IndexedPdfTextItem[] =
            input.verifiedOcrPages.find(
              (ocrPage) =>
                ocrPage.documentId === input.document.id &&
                ocrPage.pageNumber === pageNumber,
            )?.items ?? embeddedItems;
          for (const mask of masks) {
            const covered = items.filter((item) =>
              rangesIntersect(
                item.originalStart,
                item.originalEnd,
                mask.originalStart,
                mask.originalEnd,
              ),
            );
            if (covered.length === 0) {
              throw new Error("flatten_mask_placement_unavailable");
            }
            context.fillStyle = "#000000";
            for (const item of covered) {
              const rect = clippedPdfTextItemRect(
                item,
                renderViewport,
                mask.originalStart,
                mask.originalEnd,
              );
              context.fillRect(
                Math.max(0, rect.left - 1),
                Math.max(0, rect.top - 1),
                rect.width + 2,
                rect.height + 2,
              );
            }
          }
        }

        pages.push({
          documentId: input.document.id,
          pageNumber,
          dataUrl: canvas.toDataURL("image/png"),
          width: pointViewport.width,
          height: pointViewport.height,
        });
      } finally {
        page.cleanup();
      }
    }
    sourcePdf.cleanup();
    return pages;
  } finally {
    await loadingTask.destroy();
  }
}

function FlattenedPdfDocument({ pages }: { pages: readonly FlattenedPage[] }) {
  return (
    <Document title="ContextFirst visually sanitized PDF">
      {pages.map((page) => (
        <Page
          key={`${page.documentId}-${page.pageNumber}`}
          size={[page.width, page.height]}
          style={{ backgroundColor: "#ffffff", padding: 0 }}
        >
          <Image
            src={page.dataUrl}
            style={{ height: page.height, width: page.width }}
          />
        </Page>
      ))}
    </Document>
  );
}

export async function renderFlattenedSanitizedPdf(input: {
  documents: readonly DocumentRecord[];
  filesByDocumentId: Readonly<Record<string, File | undefined>>;
  segments: readonly SourceSegment[];
  masking: MaskingReview;
  verifiedOcrPages?: readonly VerifiedOcrPage[];
  passwordsByFileName?: Readonly<Record<string, string | undefined>>;
}): Promise<FlattenedSanitizedPdfResult> {
  if (!validateTransmissionReadiness(input.masking, input.segments).ok) {
    return { ok: false, reason: "privacy_review_incomplete" };
  }
  if (
    input.documents.some(
      (sourceDocument) => !input.filesByDocumentId[sourceDocument.id],
    )
  ) {
    return { ok: false, reason: "source_file_missing" };
  }

  try {
    const pages: FlattenedPage[] = [];
    for (const sourceDocument of input.documents) {
      const file = input.filesByDocumentId[sourceDocument.id]!;
      pages.push(
        ...(await renderDocumentPages({
          document: sourceDocument,
          file,
          segments: input.segments,
          masking: input.masking,
          verifiedOcrPages: input.verifiedOcrPages ?? [],
          password: input.passwordsByFileName?.[file.name],
        })),
      );
    }
    return {
      ok: true,
      blob: await pdf(<FlattenedPdfDocument pages={pages} />).toBlob(),
      pageCount: pages.length,
    };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error &&
        error.message === "flatten_mask_placement_unavailable"
          ? "mask_placement_unavailable"
          : "render_failed",
    };
  }
}
