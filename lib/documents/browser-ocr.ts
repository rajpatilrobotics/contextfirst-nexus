import type { VerifiedOcrPage } from "./pdf-source-service";

export type BrowserOcrProgress = {
  status: string;
  progress: number;
};

type OcrWord = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

type OcrBlock = {
  paragraphs: {
    lines: {
      words: OcrWord[];
    }[];
  }[];
};

export function buildVerifiedOcrPage(input: {
  documentId: string;
  pageNumber: number;
  confidence: number;
  blocks: readonly OcrBlock[];
  viewport: {
    convertToPdfPoint: (x: number, y: number) => number[];
  };
}): VerifiedOcrPage | null {
  let text = "";
  const items: VerifiedOcrPage["items"] = [];
  for (const block of input.blocks) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        const words = line.words.filter((word) => word.text.trim().length > 0);
        words.forEach((word, wordIndex) => {
          if (wordIndex > 0) text += " ";
          const originalStart = text.length;
          const wordText = word.text.trim();
          text += wordText;
          const originalEnd = text.length;
          const [left, bottom] = input.viewport.convertToPdfPoint(
            word.bbox.x0,
            word.bbox.y1,
          );
          const [right, top] = input.viewport.convertToPdfPoint(
            word.bbox.x1,
            word.bbox.y0,
          );
          items.push({
            text: wordText,
            originalStart,
            originalEnd,
            transform: [1, 0, 0, Math.abs(top - bottom), left, bottom],
            width: Math.abs(right - left),
            height: Math.abs(top - bottom),
          });
        });
        if (words.length > 0) text += "\n";
      }
      if (text.endsWith("\n")) text += "\n";
    }
  }
  text = text.trim();
  if (text.length === 0 || items.length === 0) return null;
  return {
    documentId: input.documentId,
    pageNumber: input.pageNumber,
    text,
    confidence: Math.max(0, Math.min(100, input.confidence)),
    method: "ocr",
    items,
  };
}

export async function recognizePdfPageLocally(input: {
  file: File;
  documentId: string;
  pageNumber: number;
  password?: string;
  onProgress?: (progress: BrowserOcrProgress) => void;
}): Promise<VerifiedOcrPage> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc =
    "/vendor/pdfjs/pdf.worker.legacy-6.1.200.min.mjs";
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    ...(input.password ? { password: input.password } : {}),
  });
  let pdfDocument: Awaited<typeof loadingTask.promise> | undefined;
  let page: Awaited<ReturnType<Awaited<typeof loadingTask.promise>["getPage"]>> | undefined;
  let worker: Awaited<
    ReturnType<typeof import("tesseract.js")["createWorker"]>
  > | null = null;

  try {
    pdfDocument = await loadingTask.promise;
    if (input.pageNumber < 1 || input.pageNumber > pdfDocument.numPages) {
      throw new Error("ocr_page_out_of_range");
    }
    page = await pdfDocument.getPage(input.pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("ocr_canvas_unavailable");
    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const tesseract = await import("tesseract.js");
    worker = await tesseract.createWorker("eng", tesseract.OEM.LSTM_ONLY, {
      workerPath: "/vendor/tesseract/worker.min.js",
      corePath: "/vendor/tesseract/core",
      langPath: "/vendor/tesseract/lang",
      logger: (message) =>
        input.onProgress?.({
          status: message.status,
          progress: message.progress,
        }),
    });
    const result = await worker.recognize(
      canvas,
      {},
      { text: true, blocks: true },
    );
    const verified = buildVerifiedOcrPage({
      documentId: input.documentId,
      pageNumber: input.pageNumber,
      confidence: result.data.confidence,
      blocks: result.data.blocks ?? [],
      viewport,
    });
    if (!verified) throw new Error("ocr_no_text");
    return verified;
  } finally {
    await worker?.terminate();
    page?.cleanup();
    pdfDocument?.cleanup();
    await loadingTask.destroy();
  }
}
