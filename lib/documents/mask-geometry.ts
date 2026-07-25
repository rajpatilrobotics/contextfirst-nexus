import type { IndexedPdfTextItem } from "./pdf-source-service";

export type PdfViewportLike = {
  convertToViewportPoint: (x: number, y: number) => number[];
};

export type MaskPlacementRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function rangesIntersect(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
) {
  return startA < endB && startB < endA;
}

export function pdfTextItemRect(
  item: IndexedPdfTextItem,
  viewport: PdfViewportLike,
): MaskPlacementRect {
  const x = item.transform[4] ?? 0;
  const y = item.transform[5] ?? 0;
  const axisX = item.transform[0] ?? 1;
  const axisY = item.transform[1] ?? 0;
  const axisLength = Math.max(1, Math.hypot(axisX, axisY));
  const width = Math.max(item.width, 1);
  const height = Math.max(
    item.height,
    Math.hypot(item.transform[2] ?? 0, item.transform[3] ?? 0),
    1,
  );
  const baseline = {
    x: (axisX / axisLength) * width,
    y: (axisY / axisLength) * width,
  };
  const vertical = {
    x: (-axisY / axisLength) * height,
    y: (axisX / axisLength) * height,
  };
  const points = [
    viewport.convertToViewportPoint(x, y),
    viewport.convertToViewportPoint(x + baseline.x, y + baseline.y),
    viewport.convertToViewportPoint(x + vertical.x, y + vertical.y),
    viewport.convertToViewportPoint(
      x + baseline.x + vertical.x,
      y + baseline.y + vertical.y,
    ),
  ];
  const horizontal = points.map((point) => point[0] ?? 0);
  const verticalPoints = points.map((point) => point[1] ?? 0);
  const left = Math.min(...horizontal);
  const top = Math.min(...verticalPoints);
  return {
    left,
    top,
    width: Math.max(2, Math.max(...horizontal) - left),
    height: Math.max(3, Math.max(...verticalPoints) - top),
  };
}

export function clippedPdfTextItemRect(
  item: IndexedPdfTextItem,
  viewport: PdfViewportLike,
  rangeStart: number,
  rangeEnd: number,
): MaskPlacementRect {
  const rect = pdfTextItemRect(item, viewport);
  const length = Math.max(1, item.originalEnd - item.originalStart);
  const overlapStart = Math.max(item.originalStart, rangeStart);
  const overlapEnd = Math.min(item.originalEnd, rangeEnd);
  const startRatio = (overlapStart - item.originalStart) / length;
  const endRatio = (overlapEnd - item.originalStart) / length;
  return {
    ...rect,
    left: rect.left + rect.width * startRatio,
    width: Math.max(3, rect.width * (endRatio - startRatio)),
  };
}
