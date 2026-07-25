import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentCards } from "../../../features/documents";
import type { DocumentRecord } from "../../../lib/contracts";

const CASE_ID = "CFN-CASE-PREVIEW";
const SHA = "a".repeat(64);
const createObjectURL = vi.fn<(file: File) => string>();
const revokeObjectURL = vi.fn<(url: string) => void>();

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    destroy: vi.fn(async () => undefined),
    promise: Promise.resolve({
      getPage: async () => ({
        getViewport: () => ({ height: 900, width: 700 }),
        render: () => ({
          cancel: vi.fn(),
          promise: Promise.resolve(),
        }),
      }),
      numPages: 2,
    }),
  }),
}));

function page(
  documentId: string,
  pageNumber: number,
  availability: DocumentRecord["pages"][number]["availability"],
  extractedCharacterCount: number,
  expected = true,
): DocumentRecord["pages"][number] {
  return {
    id: `${documentId}-P${pageNumber}`,
    documentId,
    pageNumber,
    expected,
    availability,
    extractionStatus:
      availability === "available"
        ? "completed"
        : availability === "image_only"
          ? "warning"
          : "failed",
    extractedCharacterCount,
    ...(availability === "available"
      ? {}
      : { failureCode: "EXTRACTION_FAILED" as const }),
  };
}

function sourceDocument(
  id: string,
  fileName: string,
  pages: DocumentRecord["pages"],
): DocumentRecord {
  const knownPages = pages.filter((item) => item.expected);
  const available = pages.filter(
    (item) => item.availability === "available",
  ).length;
  return {
    id,
    caseId: CASE_ID,
    fixtureVersion: "1.0.0",
    fileName,
    displayName: fileName.replace(/\.pdf$/i, ""),
    sourceType: "other",
    dataOrigin: "browser_local",
    expectedPageCount: Math.max(1, knownPages.length),
    pages,
    provenanceStatus: "unverified",
    processingStatus:
      available === knownPages.length
        ? "completed"
        : available > 0
          ? "warning"
          : "failed",
    syntheticLabelPresent: false,
  };
}

function file(name: string, size = 8) {
  return new File([new Uint8Array(size)], name, {
    type: "application/pdf",
  });
}

beforeEach(() => {
  createObjectURL.mockReset();
  revokeObjectURL.mockReset();
  createObjectURL.mockImplementation(
    (selectedFile) => `http://localhost/preview-${selectedFile.name}`,
  );
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectURL,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DocumentCards dynamic Document View", () => {
  it("requires confirmation, renders the matching local PDF, and provides a Safari fallback", async () => {
    const user = userEvent.setup();
    const firstFile = file("first.pdf");
    const document = sourceDocument("D01", "first.pdf", [
      page("D01", 1, "available", 42),
    ]);
    render(
      <DocumentCards
        documentFiles={{ D01: firstFile }}
        documentMetadata={{
          D01: {
            documentId: "D01",
            fileName: firstFile.name,
            byteLength: firstFile.size,
            sha256: SHA,
          },
        }}
        documents={[document]}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Document View" }));

    expect(screen.queryByTitle(/Original unmasked PDF preview/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/displays the original PDF selected in this browser session/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/audited source-review/i)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "View original PDF" }),
    );

    const preview = screen.getByTitle(
      "Original unmasked PDF preview: first.pdf",
    );
    expect(preview).toHaveAttribute("role", "region");
    expect(preview).toHaveClass("overflow-y-auto");
    expect(await screen.findByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Original unmasked PDF preview: first.pdf, page 1",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open local PDF in a new tab" }),
    ).toHaveAttribute("href", "http://localhost/preview-first.pdf");
    expect(createObjectURL).toHaveBeenCalledWith(firstFile);
  });

  it("revokes blob URLs when switching documents, leaving the view tab, hiding the page, and unmounting", async () => {
    const user = userEvent.setup();
    const firstFile = file("first.pdf");
    const secondFile = file("second.pdf");
    const first = sourceDocument("D01", "first.pdf", [
      page("D01", 1, "available", 20),
    ]);
    const second = sourceDocument("D02", "second.pdf", [
      page("D02", 1, "available", 30),
    ]);
    const rendered = render(
      <DocumentCards
        documentFiles={{ D01: firstFile, D02: secondFile }}
        documents={[first, second]}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Document View" }));
    await user.click(
      screen.getByRole("button", { name: "View original PDF" }),
    );
    await user.click(screen.getByText("second.pdf"));
    expect(revokeObjectURL).toHaveBeenCalledWith(
      "http://localhost/preview-first.pdf",
    );

    await user.click(
      screen.getByRole("button", { name: "View original PDF" }),
    );
    const viewTab = screen.getByRole("tab", { name: "Document View" });
    viewTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("tab", { name: "Source Quality" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(revokeObjectURL).toHaveBeenCalledWith(
      "http://localhost/preview-second.pdf",
    );

    await user.keyboard("{ArrowLeft}");
    await user.click(
      screen.getByRole("button", { name: "View original PDF" }),
    );
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(revokeObjectURL).toHaveBeenCalledTimes(3);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    await user.click(
      screen.getByRole("button", { name: "View original PDF" }),
    );
    rendered.unmount();
    expect(revokeObjectURL).toHaveBeenCalledTimes(4);
  });

  it("offers a one-time file restore for older packets and restores preview when the File returns", async () => {
    const user = userEvent.setup();
    const onReselect = vi.fn();
    const document = sourceDocument("D01", "reloaded.pdf", [
      page("D01", 1, "available", 42),
    ]);
    const rendered = render(
      <DocumentCards
        documentFiles={{}}
        documents={[document]}
        onReselectPreview={onReselect}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Document View" }));
    expect(
      screen.getByText("This PDF is not available in browser storage yet."),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Choose PDF" }),
    );
    expect(onReselect).toHaveBeenCalledOnce();

    const reselectedFile = file("reloaded.pdf");
    rendered.rerender(
      <DocumentCards
        documentFiles={{ D01: reselectedFile }}
        documents={[document]}
        onReselectPreview={onReselect}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "View original PDF" }),
    );
    expect(
      screen.getByTitle("Original unmasked PDF preview: reloaded.pdf"),
    ).toBeInTheDocument();
  });
});

describe("DocumentCards extraction facts", () => {
  it("reports mixed readable, OCR-required, and failed pages without scoring credibility", async () => {
    const user = userEvent.setup();
    const document = sourceDocument("D01", "mixed.pdf", [
      page("D01", 1, "available", 100),
      page("D01", 2, "image_only", 0),
      page("D01", 3, "extraction_failed", 0),
    ]);
    render(
      <DocumentCards
        documentFiles={{ D01: file("mixed.pdf", 4096) }}
        documentMetadata={{
          D01: {
            documentId: "D01",
            fileName: "mixed.pdf",
            byteLength: 4096,
            sha256: SHA,
          },
        }}
        documents={[document]}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Source Quality" }));

    const qualityPanel = screen.getByRole("tabpanel");
    expect(
      within(qualityPanel).getByText("Extraction quality and coverage"),
    ).toBeInTheDocument();
    expect(within(qualityPanel).getByText("4.0 KB")).toBeInTheDocument();
    expect(within(qualityPanel).getByText(SHA)).toBeInTheDocument();
    expect(within(qualityPanel).getByText("33%")).toBeInTheDocument();
    expect(within(qualityPanel).getByText("100")).toBeInTheDocument();
    expect(
      within(qualityPanel).getByText(
        "Browser-local source · unverified provenance",
      ),
    ).toBeInTheDocument();
    expect(
      within(qualityPanel).getByText(
        /does not determine authenticity, credibility, factual accuracy, legal reliability, completeness, or case strength/i,
      ),
    ).toBeInTheDocument();
    expect(within(qualityPanel).queryByText(/confidence score/i)).not.toBeInTheDocument();
  });

  it("shows an unavailable page count when PDF.js could not open the document", async () => {
    const user = userEvent.setup();
    const document = sourceDocument("D01", "unopenable.pdf", [
      page("D01", 1, "extraction_failed", 0, false),
    ]);
    render(<DocumentCards documentFiles={{}} documents={[document]} />);

    expect(screen.getByText(/page count unavailable/i)).toBeInTheDocument();
    const pagesStat = screen.getByText("Pages").parentElement;
    expect(pagesStat).toHaveTextContent("Unavailable");

    await user.click(screen.getByRole("tab", { name: "Source Quality" }));
    expect(screen.getByText("Document-level extraction")).toBeInTheDocument();
    expect(
      screen.getByText(
        /PDF.js could not determine a page count, so no coverage percentage is calculated/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Page 1$/)).not.toBeInTheDocument();
  });
});

describe("DocumentCards source classification", () => {
  it("saves only the selected document and resets an unsaved draft when switching records", async () => {
    const user = userEvent.setup();
    const onUpdateSourceType = vi.fn();
    const first = sourceDocument("D01", "first.pdf", [
      page("D01", 1, "available", 42),
    ]);
    const second = sourceDocument("D02", "second.pdf", [
      page("D02", 1, "available", 36),
    ]);

    render(
      <DocumentCards
        documents={[first, second]}
        onUpdateSourceType={onUpdateSourceType}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Source Quality" }));
    const firstRole = screen.getByRole("combobox", {
      name: "Source role for D01",
    });
    await user.selectOptions(firstRole, "communication");
    await user.click(
      screen.getByRole("button", { name: "Save classification" }),
    );
    expect(onUpdateSourceType).toHaveBeenCalledWith("D01", "communication");

    await user.click(
      screen.getByRole("button", { name: /second\.pdf/i }),
    );
    const secondRole = screen.getByRole("combobox", {
      name: "Source role for D02",
    });
    expect(secondRole).toHaveValue("other");
    await user.selectOptions(secondRole, "travel_record");

    await user.click(
      screen.getByRole("button", { name: /first\.pdf/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /second\.pdf/i }),
    );
    expect(
      screen.getByRole("combobox", { name: "Source role for D02" }),
    ).toHaveValue("other");
    expect(onUpdateSourceType).toHaveBeenCalledTimes(1);
  });
});

describe("DocumentCards ingestion recovery", () => {
  it("shows unverified PDF metadata and exposes page retry and local OCR actions", async () => {
    const user = userEvent.setup();
    const onRetryPage = vi.fn();
    const onRunOcr = vi.fn();
    const document = sourceDocument("D01", "scan.pdf", [
      page("D01", 1, "image_only", 0),
    ]);
    render(
      <DocumentCards
        documents={[document]}
        onRetryPage={onRetryPage}
        onRunOcr={onRunOcr}
        runtimeMetadata={{
          D01: {
            documentId: "D01",
            pdfFormatVersion: "1.7",
            title: "Self-declared title",
            author: "Self-declared author",
            subject: null,
            keywords: null,
            creator: "Scanner",
            producer: null,
            creationDate: null,
            modificationDate: null,
            pageCount: 1,
            encryptionStatus: "not_encrypted",
            permissionFlags: null,
          },
        }}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Source Quality" }));
    expect(screen.getByText("Embedded PDF metadata")).toBeInTheDocument();
    expect(screen.getByText("Self-declared title")).toBeInTheDocument();
    expect(
      screen.getByText(/not evidence of authenticity/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Retry embedded text" }),
    );
    await user.click(screen.getByRole("button", { name: "Run local OCR" }));
    expect(onRetryPage).toHaveBeenCalledWith("D01", 1);
    expect(onRunOcr).toHaveBeenCalledWith("D01", 1);
  });

  it("keeps OCR draft text provisional until explicit verification", async () => {
    const user = userEvent.setup();
    const onVerifyOcr = vi.fn();
    const onRejectOcr = vi.fn();
    const document = sourceDocument("D01", "scan.pdf", [
      page("D01", 1, "image_only", 0),
    ]);
    render(
      <DocumentCards
        documents={[document]}
        ocrDrafts={{
          "D01-P1": {
            documentId: "D01",
            pageNumber: 1,
            text: "Locally recognized draft",
            confidence: 88,
            method: "ocr",
            items: [],
          },
        }}
        onRejectOcr={onRejectOcr}
        onVerifyOcr={onVerifyOcr}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Source Quality" }));
    expect(screen.getByText("Locally recognized draft")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Verify OCR text" }));
    expect(onVerifyOcr).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(onRejectOcr).toHaveBeenCalledWith("D01", 1);
  });
});
