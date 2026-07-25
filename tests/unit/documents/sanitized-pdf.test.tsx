import { describe, expect, it } from "vitest";
import { renderSanitizedTextPdf } from "../../../lib/documents/sanitized-pdf";
import { renderFlattenedSanitizedPdf } from "../../../lib/documents";
import { createEmptyMaskingReview } from "../../../lib/redaction";

describe("sanitized text PDF renderer", () => {
  it("creates a real PDF blob from the safe derivative model", async () => {
    const blob = await renderSanitizedTextPdf({
      caseId: "CFN-CASE-SANITIZED",
      documentSetDigest: "d".repeat(64),
      generatedAt: "2026-07-25T12:30:00.000Z",
      approvedMaskCount: 1,
      documents: [
        {
          documentId: "D01",
          pages: [
            {
              pageNumber: 1,
              text: "Contact [Email masked] for the approved record.",
            },
          ],
          omittedPageNumbers: [2],
        },
      ],
    });

    const header = new TextDecoder().decode(
      new Uint8Array(await blob.arrayBuffer()).slice(0, 5),
    );
    expect(blob.type).toBe("application/pdf");
    expect(header).toBe("%PDF-");
  });

  it("fails closed before a current approved privacy review", async () => {
    const result = await renderFlattenedSanitizedPdf({
      documents: [],
      filesByDocumentId: {},
      segments: [],
      masking: createEmptyMaskingReview(),
    });
    expect(result).toEqual({
      ok: false,
      reason: "privacy_review_incomplete",
    });
  });
});
