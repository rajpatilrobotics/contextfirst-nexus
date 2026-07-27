import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MaskedPdfPreview } from "../../../features/documents";
import { splitIndexedPdfTextItems } from "../../../features/documents/masked-pdf-preview";
import type {
  DocumentRecord,
  MaskingReview,
  SourceSegment,
} from "../../../lib/contracts";
import {
  createEmptyMaskingReview,
  makeManualSuggestion,
} from "../../../lib/redaction";

const RAW_TEXT = "Contact reviewer@support.in";

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    destroy: vi.fn(async () => undefined),
    promise: Promise.resolve({
      cleanup: vi.fn(async () => undefined),
      getPage: async (pageNumber: number) => ({
        pageNumber,
        getTextContent: async () => ({
          items: [
            {
              str: "Contact",
              transform: [1, 0, 0, 10, 20, 760],
              width: 52,
              height: 10,
            },
            {
              str: "reviewer@support.in",
              transform: [1, 0, 0, 10, 78, 760],
              width: 128,
              height: 10,
            },
          ],
        }),
        getViewport: () => ({
          height: 820,
          scale: 1.25,
          width: 620,
          convertToViewportPoint: (x: number, y: number) => [x, 820 - y],
        }),
        render: () => ({
          cancel: vi.fn(),
          promise: Promise.resolve(),
        }),
      }),
      numPages: 1,
    }),
  }),
}));

function sourceDocument(): DocumentRecord {
  return {
    id: "D01",
    caseId: "CFN-CASE-MASK",
    fixtureVersion: "1.0.0",
    fileName: "mask-me.pdf",
    displayName: "Mask me",
    sourceType: "other",
    dataOrigin: "browser_local",
    expectedPageCount: 1,
    pages: [
      {
        id: "D01-P1",
        documentId: "D01",
        pageNumber: 1,
        expected: true,
        availability: "available",
        extractionStatus: "completed",
        extractedCharacterCount: RAW_TEXT.length,
      },
    ],
    provenanceStatus: "unverified",
    processingStatus: "completed",
    syntheticLabelPresent: false,
  };
}

function segment(rawText = RAW_TEXT): SourceSegment {
  return {
    id: "D01-P1-S1",
    documentId: "D01",
    pageId: "D01-P1",
    pageNumber: 1,
    ordinal: 1,
    rawText,
    redactedText: rawText,
    boundingBoxes: [],
    sourceLanguage: "en",
    translationStatus: "original_language",
    extractionQuality: "machine_extracted",
    instructionAdvisory: "no_signal",
    modelVisibility: "not_sent",
    supportEligibility: "candidate_eligible",
  };
}

function review(): MaskingReview {
  return {
    ...createEmptyMaskingReview(),
    suggestions: [
      makeManualSuggestion({
        segmentId: "D01-P1-S1",
        originalStart: 8,
        originalEnd: 27,
        maskClass: "email",
      }),
    ],
  };
}

function pdfFile() {
  return new File([new Uint8Array([37, 80, 68, 70, 45])], "mask-me.pdf", {
    type: "application/pdf",
  });
}

describe("browser-local masked PDF preview", () => {
  it("splits real PDF text runs into precise canonical word selections", () => {
    const words = splitIndexedPdfTextItems([
      {
        text: "Maya K. called",
        originalStart: 12,
        originalEnd: 26,
        transform: [1, 0, 0, 10, 100, 700],
        width: 140,
        height: 10,
      },
    ]);

    expect(words.map(({ text, originalStart, originalEnd }) => ({
      text,
      originalStart,
      originalEnd,
    }))).toEqual([
      { text: "Maya", originalStart: 12, originalEnd: 16 },
      { text: "K.", originalStart: 17, originalEnd: 19 },
      { text: "called", originalStart: 20, originalEnd: 26 },
    ]);
    expect(words[1]!.transform[4]).toBeGreaterThan(words[0]!.transform[4]!);
  });

  it("renders canonical overlays and connects visual review and text selection actions", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const onReview = vi.fn();

    render(
      <MaskedPdfPreview
        document={sourceDocument()}
        file={pdfFile()}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onReview={onReview}
        review={review()}
        segments={[segment()]}
      />,
    );

    const overlay = await screen.findByRole("button", {
      name: "Awaiting review Email mask on page 1",
    });
    expect(
      screen.getByText(/The original PDF is never changed/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Names and ambiguous details require manual selection/i),
    ).toBeInTheDocument();
    const preview = screen.getByRole("region", {
      name: "Masked PDF preview: mask-me.pdf",
    });
    const reviewControls = screen
      .getByText("Review visible text")
      .closest("aside");
    expect(reviewControls?.parentElement).toBe(preview.parentElement);
    expect(reviewControls).toHaveClass("order-first");

    await user.click(overlay);
    await user.click(
      screen.getByRole("button", { name: "Approve this mask" }),
    );
    expect(onReview).toHaveBeenCalledWith(
      "mask-D01-P1-S1-email-8-27",
      "approved",
      "[Email masked]",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Select “Contact” on page 1",
      }),
    );
    expect(screen.getByText("“Contact”")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Add pending mask" }),
    );
    expect(onAdd).toHaveBeenCalledWith({
      segmentId: "D01-P1-S1",
      originalStart: 0,
      originalEnd: 7,
      maskClass: "person_name",
      replacementToken: "[Person name masked]",
    });
  });

  it("opens a packet-queue target on its exact highlighted PDF page", async () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLDivElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    const masking = review();
    const maskId = masking.suggestions[0]!.id;

    render(
      <MaskedPdfPreview
        document={sourceDocument()}
        file={pdfFile()}
        focusedMaskId={maskId}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onReview={vi.fn()}
        review={masking}
        segments={[segment()]}
      />,
    );

    const overlay = await screen.findByRole("button", {
      name: "Awaiting review Email mask on page 1",
    });
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: "smooth" }),
      ),
    );
    expect(overlay).toHaveClass("ring-2", "ring-sky-400");
    expect(screen.getByDisplayValue("[Email masked]")).toBeInTheDocument();
  });

  it("extends an ordinary selection across adjacent visible words", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();

    render(
      <MaskedPdfPreview
        document={sourceDocument()}
        file={pdfFile()}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onReview={vi.fn()}
        review={createEmptyMaskingReview()}
        segments={[segment()]}
      />,
    );

    await user.click(
      await screen.findByRole("button", {
        name: "Select “Contact” on page 1",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Select “reviewer@support.in” on page 1",
      }),
    );

    expect(screen.getByText(`“${RAW_TEXT}”`)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Add pending mask" }),
    );
    expect(onAdd).toHaveBeenCalledWith({
      segmentId: "D01-P1-S1",
      originalStart: 0,
      originalEnd: RAW_TEXT.length,
      maskClass: "person_name",
      replacementToken: "[Person name masked]",
    });
  });

  it("fails closed when visual text cannot be matched to the canonical extracted page", async () => {
    render(
      <MaskedPdfPreview
        document={sourceDocument()}
        file={pdfFile()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onReview={vi.fn()}
        review={review()}
        segments={[segment("Different canonical text")]}
      />,
    );

    expect(
      await screen.findByText(/No visual masks are drawn/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Select “Contact” on page 1",
      }),
    ).not.toBeInTheDocument();
  });

  it("restores the preview only from verified browser-local file bytes", async () => {
    const user = userEvent.setup();
    const onReselect = vi.fn();
    render(
      <MaskedPdfPreview
        document={sourceDocument()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onReselect={onReselect}
        onReview={vi.fn()}
        review={review()}
        segments={[segment()]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Reselect and verify PDF" }),
    );
    expect(onReselect).toHaveBeenCalledOnce();
  });
});
