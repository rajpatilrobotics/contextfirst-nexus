import {
  indexPdfTextItems,
  readBrowserPdfTextItems,
  type PdfPageLike,
  type VerifiedOcrPage,
} from "./pdf-source-service";

export async function retryEmbeddedTextPage(input: {
  file: File;
  documentId: string;
  pageNumber: number;
  password?: string;
}): Promise<VerifiedOcrPage> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc =
    "/vendor/pdfjs/pdf.worker.legacy-6.1.200.min.mjs";
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await input.file.arrayBuffer()),
    disableFontFace: true,
    useSystemFonts: false,
    useWasm: false,
    useWorkerFetch: false,
    isOffscreenCanvasSupported: false,
    isImageDecoderSupported: false,
    ...(input.password ? { password: input.password } : {}),
  });
  let pdfDocument: Awaited<typeof loadingTask.promise> | undefined;
  let page: Awaited<ReturnType<Awaited<typeof loadingTask.promise>["getPage"]>> | undefined;
  try {
    pdfDocument = await loadingTask.promise;
    if (input.pageNumber < 1 || input.pageNumber > pdfDocument.numPages) {
      throw new Error("retry_page_out_of_range");
    }
    page = await pdfDocument.getPage(input.pageNumber);
    const indexed = indexPdfTextItems(
      await readBrowserPdfTextItems(page as unknown as PdfPageLike),
    );
    if (indexed.text.trim().length === 0 || indexed.items.length === 0) {
      throw new Error("retry_no_embedded_text");
    }
    return {
      documentId: input.documentId,
      pageNumber: input.pageNumber,
      text: indexed.text,
      confidence: 100,
      method: "embedded_text_retry",
      items: indexed.items,
    };
  } finally {
    page?.cleanup();
    pdfDocument?.cleanup();
    await loadingTask.destroy();
  }
}
