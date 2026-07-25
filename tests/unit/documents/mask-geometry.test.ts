import { describe, expect, it } from "vitest";
import {
  clippedPdfTextItemRect,
  pdfTextItemRect,
} from "../../../lib/documents";

const identityViewport = {
  convertToViewportPoint: (x: number, y: number) => [x, y],
};

describe("PDF mask geometry", () => {
  it("places and clips horizontal PDF text deterministically", () => {
    const item = {
      text: "private",
      originalStart: 10,
      originalEnd: 17,
      transform: [1, 0, 0, 10, 20, 30],
      width: 70,
      height: 10,
    };
    expect(pdfTextItemRect(item, identityViewport)).toEqual({
      left: 20,
      top: 30,
      width: 70,
      height: 10,
    });
    const clipped = clippedPdfTextItemRect(
      item,
      identityViewport,
      12,
      15,
    );
    expect(clipped.left).toBe(40);
    expect(clipped.width).toBeCloseTo(30);
  });

  it("keeps rotated text inside a non-zero visual bounding box", () => {
    const rect = pdfTextItemRect(
      {
        text: "rotated",
        originalStart: 0,
        originalEnd: 7,
        transform: [0, 1, -12, 0, 100, 200],
        width: 60,
        height: 12,
      },
      identityViewport,
    );
    expect(rect).toMatchObject({ left: 88, top: 200, width: 12, height: 60 });
  });
});
