import { describe, expect, it } from "vitest";
import { buildVerifiedOcrPage } from "../../../lib/documents";

describe("browser OCR projection", () => {
  it("maps recognized words into deterministic source ranges and PDF geometry", () => {
    const page = buildVerifiedOcrPage({
      documentId: "D01",
      pageNumber: 2,
      confidence: 91.4,
      viewport: {
        convertToPdfPoint: (x, y) => [x / 2, 500 - y / 2],
      },
      blocks: [
        {
          paragraphs: [
            {
              lines: [
                {
                  words: [
                    {
                      text: "Hello",
                      confidence: 94,
                      bbox: { x0: 20, y0: 40, x1: 80, y1: 60 },
                    },
                    {
                      text: "world",
                      confidence: 90,
                      bbox: { x0: 90, y0: 40, x1: 150, y1: 60 },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    expect(page).toMatchObject({
      documentId: "D01",
      pageNumber: 2,
      text: "Hello world",
      confidence: 91.4,
      method: "ocr",
    });
    expect(page?.items).toMatchObject([
      { text: "Hello", originalStart: 0, originalEnd: 5 },
      { text: "world", originalStart: 6, originalEnd: 11 },
    ]);
  });

  it("does not create a usable page from an empty OCR result", () => {
    expect(
      buildVerifiedOcrPage({
        documentId: "D01",
        pageNumber: 1,
        confidence: 0,
        viewport: { convertToPdfPoint: (x, y) => [x, y] },
        blocks: [],
      }),
    ).toBeNull();
  });
});
