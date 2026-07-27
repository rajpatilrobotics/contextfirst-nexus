import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PacketMaskReviewQueue } from "../../../features/documents";
import type {
  DocumentRecord,
  MaskingReview,
  SourceSegment,
} from "../../../lib/contracts";
import {
  createEmptyMaskingReview,
  makeManualSuggestion,
  reviewMask,
} from "../../../lib/redaction";

function sourceDocument(id: string, fileName: string): DocumentRecord {
  return {
    id,
    caseId: "CFN-CASE-MASK-QUEUE",
    fixtureVersion: "1.0.0",
    fileName,
    displayName: fileName,
    sourceType: "other",
    dataOrigin: "browser_local",
    expectedPageCount: 1,
    pages: [
      {
        id: `${id}-P1`,
        documentId: id,
        pageNumber: 1,
        expected: true,
        availability: "available",
        extractionStatus: "completed",
        extractedCharacterCount: 30,
      },
    ],
    provenanceStatus: "unverified",
    processingStatus: "completed",
    syntheticLabelPresent: false,
  };
}

function segment(documentId: string): SourceSegment {
  return {
    id: `${documentId}-P1-S1`,
    documentId,
    pageId: `${documentId}-P1`,
    pageNumber: 1,
    ordinal: 1,
    rawText: "Email reviewer@example.test",
    redactedText: "Email reviewer@example.test",
    boundingBoxes: [],
    sourceLanguage: "en",
    translationStatus: "original_language",
    extractionQuality: "machine_extracted",
    instructionAdvisory: "no_signal",
    modelVisibility: "not_sent",
    supportEligibility: "candidate_eligible",
  };
}

function packetReview(): MaskingReview {
  const first = makeManualSuggestion({
    segmentId: "D01-P1-S1",
    originalStart: 6,
    originalEnd: 27,
    maskClass: "email",
  });
  const second = makeManualSuggestion({
    segmentId: "D02-P1-S1",
    originalStart: 6,
    originalEnd: 27,
    maskClass: "email",
  });
  return reviewMask(
    {
      ...createEmptyMaskingReview(),
      suggestions: [first, second],
    },
    first.id,
    "approved",
    first.replacementToken,
  ).review;
}

describe("packet mask review queue", () => {
  it("offers one active restore action when runtime PDF data is unavailable", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();

    render(
      <PacketMaskReviewQueue
        automaticSuggestionIds={[]}
        disabled
        documents={[sourceDocument("D01", "first.pdf")]}
        onApplyAllDetected={vi.fn()}
        onComplete={vi.fn()}
        onNavigate={vi.fn()}
        onRestore={onRestore}
        review={createEmptyMaskingReview()}
        segments={[segment("D01")]}
      />,
    );

    const restore = screen.getByRole("button", {
      name: "Restore PDFs to continue",
    });
    expect(restore).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Run final privacy check" }),
    ).not.toBeInTheDocument();
    await user.click(restore);
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it("runs the final check from the single next-step action", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(
      <PacketMaskReviewQueue
        automaticSuggestionIds={[]}
        documents={[sourceDocument("D01", "first.pdf")]}
        onApplyAllDetected={vi.fn()}
        onComplete={onComplete}
        onNavigate={vi.fn()}
        review={createEmptyMaskingReview()}
        segments={[segment("D01")]}
      />,
    );

    const runCheck = screen.getByRole("button", {
      name: "Run final privacy check",
    });
    expect(runCheck).toBeEnabled();
    await user.click(runCheck);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("groups canonical masks, reports progress, and navigates pending items", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const review = packetReview();

    render(
      <PacketMaskReviewQueue
        automaticSuggestionIds={[]}
        documents={[
          sourceDocument("D01", "first.pdf"),
          sourceDocument("D02", "second.pdf"),
        ]}
        onApplyAllDetected={vi.fn()}
        onComplete={vi.fn()}
        onNavigate={onNavigate}
        review={review}
        segments={[segment("D01"), segment("D02")]}
      />,
    );

    expect(screen.getByText("1 of 2 reviewed")).toBeInTheDocument();
    expect(screen.getByText("first.pdf")).toBeInTheDocument();
    expect(screen.getByText("second.pdf")).toBeInTheDocument();
    expect(screen.getAllByText("Page 1")).toHaveLength(2);

    await user.click(
      screen.getByRole("button", {
        name: "Open next unresolved mask (1)",
      }),
    );
    expect(onNavigate).toHaveBeenCalledWith({
      documentId: "D02",
      maskId: review.suggestions[1]!.id,
      pageNumber: 1,
    });
  });

  it("requires confirmation and sends only pending automatic detections", async () => {
    const user = userEvent.setup();
    const onApplyAllDetected = vi.fn();
    const review = packetReview();
    const pending = review.suggestions[1]!;

    render(
      <PacketMaskReviewQueue
        automaticSuggestionIds={[pending.id]}
        documents={[
          sourceDocument("D01", "first.pdf"),
          sourceDocument("D02", "second.pdf"),
        ]}
        onApplyAllDetected={onApplyAllDetected}
        onComplete={vi.fn()}
        onNavigate={vi.fn()}
        review={review}
        segments={[segment("D01"), segment("D02")]}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Review & apply detected masks (1)",
      }),
    );
    expect(
      screen.getByRole("alertdialog", {
        name: "Confirm bulk mask approval",
      }),
    ).toHaveTextContent(/false positives.*miss names or ambiguous/i);
    expect(
      screen.getByRole("list", {
        name: "Detected mask summary by identifier class",
      }),
    ).toHaveTextContent("Emails · 1");

    await user.click(
      screen.getByRole("button", {
        name: "Apply all detected masks now",
      }),
    );
    expect(onApplyAllDetected).toHaveBeenCalledWith([pending.id]);
  });
});
