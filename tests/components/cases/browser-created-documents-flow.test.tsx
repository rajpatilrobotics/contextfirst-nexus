import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserCaseDocumentsWorkspace } from "../../../features/documents";
import { BrowserCasePurposeWorkspace } from "../../../features/purpose";
import { trustedPurposeBrief } from "../../../lib/analysis/replay";
import {
  BROWSER_CASE_REGISTRY_STORAGE_KEY,
  createBrowserCase,
  createEmptyBrowserCaseRegistry,
  persistBrowserCaseRegistry,
  restoreBrowserCaseRegistry,
  saveBrowserCaseDocumentPacket,
  saveBrowserCasePurpose,
} from "../../../lib/cases";
import type { BrowserCaseFileStore } from "../../../lib/cases/browser-case-file-store";
import type { LocalPdfDocumentServiceResult } from "../../../lib/documents";
import {
  removeMaskSuggestion,
  reviewMask,
} from "../../../lib/redaction";
import { replayOnlyProviderOptions } from "../provider/fixtures";

const CASE_ID = "CFN-CASE-ALPHA";
const DISPLAY_REFERENCE = "REF-2026-ALPHA-SYN";
const NOW = "2026-07-25T09:00:00.000Z";
const routerPush = vi.fn();
const DIGEST = "b".repeat(64);

function createMemoryFileStore(): BrowserCaseFileStore {
  const packets = new Map<string, readonly File[]>();
  return {
    async load(caseId) {
      return packets.get(caseId) ?? [];
    },
    async save(caseId, files) {
      packets.set(caseId, Array.from(files));
    },
  };
}

function makePdfFile(name = "authorized-public-record.pdf") {
  return new File(
    [new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])],
    name,
    { type: "application/pdf" },
  );
}

function processedPacket(
  files: readonly File[],
  caseId: string,
  rawText = "Authorized public text with a browser-local layer.",
): LocalPdfDocumentServiceResult {
  return {
    caseId,
    fixtureVersion: "1.0.0",
    documentSetDigest: DIGEST,
    fileMetadata: files.map((file, index) => ({
      documentId: `D${String(index + 1).padStart(2, "0")}`,
      fileName: file.name,
      byteLength: file.size,
      sha256: DIGEST,
    })),
    documents: files.map((file, index) => {
      const documentId = `D${String(index + 1).padStart(2, "0")}`;
      return {
        id: documentId,
        caseId,
        fixtureVersion: "1.0.0",
        fileName: file.name,
        displayName: "Authorized public record",
        sourceType: "other",
        dataOrigin: "browser_local",
        expectedPageCount: 1,
        pages: [
          {
            id: `${documentId}-P1`,
            documentId,
            pageNumber: 1,
            expected: true,
            availability: "available",
            extractionStatus: "completed",
            extractedCharacterCount: rawText.length,
          },
        ],
        provenanceStatus: "unverified",
        processingStatus: "completed",
        syntheticLabelPresent: false,
      };
    }),
    segments: files.map((_, index) => {
      const documentId = `D${String(index + 1).padStart(2, "0")}`;
      return {
        id: `${documentId}-P1-S1`,
        documentId,
        pageId: `${documentId}-P1`,
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
    }),
    coverage: {
      expectedDocuments: files.length,
      processedDocuments: files.length,
      expectedPages: files.length,
      availablePages: files.length,
      issues: [],
      hasConsequentialOpenIssue: false,
    },
    processing: [],
    selectedSegmentIds: files.map(
      (_, index) => `D${String(index + 1).padStart(2, "0")}-P1-S1`,
    ),
  };
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

function availabilityResponse() {
  return new Response(
    JSON.stringify({
      schemaVersion: "1.0.0",
      liveAnalysisEnabled: false,
      replayEnabled: true,
      options: replayOnlyProviderOptions(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function storeCase({ withPurpose = false }: { withPurpose?: boolean } = {}) {
  const created = createBrowserCase(
    createEmptyBrowserCaseRegistry(),
    {
      assignedPractitioner: "Demo practitioner",
      displayReference: DISPLAY_REFERENCE,
      personAlias: "J. Example",
    },
    { idNonce: "ALPHA", now: NOW },
  );
  if (!created.ok) throw new Error(created.reason);

  let registry = created.registry;
  if (withPurpose) {
    const source = trustedPurposeBrief();
    const saved = saveBrowserCasePurpose(registry, CASE_ID, {
      ...source,
      id: `PURPOSE-${CASE_ID}`,
      caseId: CASE_ID,
      sourceMaterialClassification: "user_attested_synthetic",
      authority: {
        ...source.authority,
        basis: "user_attested_synthetic_material",
        consentStatus: "not_applicable_synthetic_material",
      },
      createdAt: NOW,
      updatedAt: NOW,
    });
    if (!saved.ok) throw new Error(saved.reason);
    registry = saved.registry;
  }
  const persisted = persistBrowserCaseRegistry(window.localStorage, registry);
  if (!persisted.ok) throw new Error(persisted.reason);
}

beforeEach(() => {
  window.localStorage.clear();
  routerPush.mockClear();
  vi.stubGlobal("fetch", vi.fn(async () => availabilityResponse()));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("browser-created Purpose to Documents flow", () => {
  it("saves first, preserves the case ID, then navigates to dynamic Documents", async () => {
    storeCase({ withPurpose: true });
    const user = userEvent.setup();
    render(<BrowserCasePurposeWorkspace caseId={CASE_ID} />);
    expect(
      await screen.findByText(/Planning and local handoff routes use the current reviewed analysis state/i),
    ).toBeInTheDocument();

    await user.click(
      await screen.findByRole("button", {
        name: "Save Case Purpose Brief",
      }),
    );

    await waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith(
        `/case/${CASE_ID}/documents`,
      ),
    );
    expect(routerPush).not.toHaveBeenCalledWith("/case/demo/documents");

    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.ok).toBe(true);
    expect(restored.registry.cases[0]?.purposeBrief).toMatchObject({
      caseId: CASE_ID,
      id: `PURPOSE-${CASE_ID}`,
      revision: 2,
      statedPurpose: trustedPurposeBrief().statedPurpose,
    });
  });

  it("keeps an invalid form on Purpose and shows the existing validation feedback", async () => {
    storeCase();
    const user = userEvent.setup();
    render(<BrowserCasePurposeWorkspace caseId={CASE_ID} />);

    await user.click(
      await screen.findByRole("button", {
        name: "Save Case Purpose Brief",
      }),
    );

    expect(
      screen.getByRole("alert", { name: "Review the Purpose Brief" }),
    ).toBeInTheDocument();
    expect(routerPush).not.toHaveBeenCalled();
    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.registry.cases[0]?.purposeBrief).toBeNull();
  });

  it("loads a truthful empty Documents page and retains Purpose across remounts", async () => {
    storeCase({ withPurpose: true });
    const firstRender = render(
      <BrowserCaseDocumentsWorkspace caseId={CASE_ID} />,
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Documents & Source Health",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Packet (0)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add PDFs" }),
    ).toBeEnabled();
    expect(screen.getByText("Upload PDFs here")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /1Purpose, completed/i }),
    ).toHaveAttribute("href", `/case/${CASE_ID}/purpose`);
    expect(
      screen.getByRole("link", { name: /2Documents, active/i }),
    ).toHaveAttribute("href", `/case/${CASE_ID}/documents`);
    expect(
      screen.queryByText(/M\. Chen|REF-2024-0047-SYN|seven selected demo PDFs/i),
    ).not.toBeInTheDocument();

    firstRender.unmount();
    render(<BrowserCaseDocumentsWorkspace caseId={CASE_ID} />);
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Documents & Source Health",
      }),
    ).toBeInTheDocument();
    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.registry.cases[0]?.purposeBrief?.statedPurpose).toBe(
      trustedPurposeBrief().statedPurpose,
    );
    expect(screen.getByText(DISPLAY_REFERENCE)).toBeInTheDocument();
  });

  it("processes a real packet, stores its files outside localStorage, and restores it after reload", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId),
    );
    const user = userEvent.setup();
    const firstRender = render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    const file = makePdfFile();
    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      file,
    );

    expect(
      await screen.findByRole("heading", {
        name: "authorized-public-record.pdf",
      }),
    ).toBeInTheDocument();
    expect(processSources).toHaveBeenCalledWith([file], CASE_ID);
    expect(screen.getByText("Packet (1)")).toBeInTheDocument();
    expect(screen.getByText("Browser-local demonstration")).toBeInTheDocument();
    expect(screen.queryByText(/No documents were uploaded/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/M\. Chen|REF-2024-0047-SYN/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Document View" }));
    expect(
      screen.getByRole("button", { name: "View original PDF" }),
    ).toBeInTheDocument();

    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.ok).toBe(true);
    expect(restored.registry.cases[0]?.documentPacket).toMatchObject({
      caseId: CASE_ID,
      documentSetDigest: DIGEST,
      contentPersistence: "browser_indexeddb",
      fileMetadata: [
        {
          fileName: "authorized-public-record.pdf",
          sha256: DIGEST,
        },
      ],
    });
    expect(JSON.stringify(restored.registry)).not.toContain(
      "Authorized public text with a browser-local layer.",
    );

    firstRender.unmount();
    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );
    await waitFor(() => expect(processSources).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Packet (1)")).toBeInTheDocument();
    expect(
      screen.queryByText("Upgrade this older saved packet once"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Document View" }));
    expect(
      screen.getByRole("button", { name: "View original PDF" }),
    ).toBeInTheDocument();
  });

  it("persists practitioner source classification and projects it into approved analysis input", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId),
    );
    const user = userEvent.setup();
    const firstRender = render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      makePdfFile(),
    );
    await screen.findByText("Packet (1)");
    await user.click(screen.getByRole("tab", { name: "Source Quality" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Source role for D01" }),
      "communication",
    );
    await user.click(
      screen.getByRole("button", { name: "Save classification" }),
    );
    expect(
      await screen.findByRole("region", {
        name: "Source classification saved",
      }),
    ).toBeInTheDocument();

    let restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(
      restored.registry.cases[0]?.documentPacket?.documents[0]?.sourceType,
    ).toBe("communication");

    await user.click(screen.getByRole("tab", { name: "Masking Status" }));
    await user.click(
      await screen.findByRole("button", { name: "Run final privacy check" }),
    );
    await user.click(screen.getByRole("tab", { name: "Source Quality" }));
    await user.click(
      screen
        .getByText("Inspect the approved redacted corpus and exact citations")
        .closest("summary")!,
    );
    expect(
      await screen.findByText("1/1 sources classified"),
    ).toBeInTheDocument();

    firstRender.unmount();
    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );
    await waitFor(() => expect(processSources).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("tab", { name: "Source Quality" }));
    expect(
      screen.getByRole("combobox", { name: "Source role for D01" }),
    ).toHaveValue("communication");
    restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(
      restored.registry.cases[0]?.documentPacket?.documents[0]?.sourceType,
    ).toBe("communication");
  });

  it("keeps the previous source role when browser storage rejects classification", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId),
    );
    const user = userEvent.setup();
    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      makePdfFile(),
    );
    await screen.findByText("Packet (1)");
    await user.click(screen.getByRole("tab", { name: "Source Quality" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Source role for D01" }),
      "travel_record",
    );
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Storage unavailable", "QuotaExceededError");
      });
    await user.click(
      screen.getByRole("button", { name: "Save classification" }),
    );

    expect(
      await screen.findByRole("region", {
        name: "Source classification was not saved",
      }),
    ).toHaveTextContent(/previous source role remains active/i);
    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(
      restored.registry.cases[0]?.documentPacket?.documents[0]?.sourceType,
    ).toBe("other");
    setItem.mockRestore();
  });

  it("adds multiple PDFs to a restored packet instead of replacing it", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId),
    );
    const user = userEvent.setup();
    const firstRender = render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      makePdfFile("first-public-record.pdf"),
    );
    await screen.findByText("Packet (1)");
    firstRender.unmount();

    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );
    await waitFor(() => expect(processSources).toHaveBeenCalledTimes(2));

    await user.click(screen.getByRole("button", { name: "Add PDFs" }));
    const chooser = screen.getByRole("dialog", { name: "Add PDFs" });
    expect(
      within(chooser).getByRole("button", {
        name: "Replace with synthetic packet",
      }),
    ).toBeInTheDocument();
    await user.click(
      within(chooser).getByRole("button", { name: "Choose local PDFs" }),
    );
    await user.upload(
      screen.getByLabelText("Select PDF documents"),
      [
        makePdfFile("second-public-record.pdf"),
        makePdfFile("third-public-record.pdf"),
      ],
    );

    expect(await screen.findByText("Packet (3)")).toBeInTheDocument();
    expect(processSources).toHaveBeenLastCalledWith(
      [
        expect.objectContaining({ name: "first-public-record.pdf" }),
        expect.objectContaining({ name: "second-public-record.pdf" }),
        expect.objectContaining({ name: "third-public-record.pdf" }),
      ],
      CASE_ID,
    );
  });

  it("loads the real bundled synthetic PDFs through the normal processing pipeline", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId),
    );
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/fixtures/cfn-nila-verin-packet/")) {
        const uniqueBody = new TextEncoder().encode(`%PDF-1.7\n${url}`);
        return {
          ok: true,
          blob: async () =>
            new Blob([uniqueBody], { type: "application/pdf" }),
        } as Response;
      }
      return availabilityResponse();
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Add PDFs" }));
    const chooser = screen.getByRole("dialog", { name: "Add PDFs" });
    expect(within(chooser).getByText(/17 fictional PDFs/i)).toBeInTheDocument();
    expect(
      within(chooser).getByText(/No analysis result is preloaded/i),
    ).toBeInTheDocument();
    await user.click(
      within(chooser).getByRole("button", { name: "Load synthetic packet" }),
    );

    await waitFor(() => expect(processSources).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Packet (17)")).toBeInTheDocument();
    const [files, processedCaseId] = processSources.mock.calls[0]!;
    expect(processedCaseId).toBe(CASE_ID);
    expect(files).toHaveLength(17);
    expect(files.map((file) => file.name)).toEqual(
      expect.arrayContaining([
        "01_case_notice_and_packet_index.pdf",
        "14_hearing_and_charge_summary.pdf",
        "scan_001.pdf",
        "attachment_02.pdf",
        "document_final.pdf",
      ]),
    );
    expect(fetchMock).toHaveBeenCalledTimes(17);

    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.registry.cases[0]?.documentPacket?.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fileName: "02_job_advertisement.pdf",
          sourceType: "recruitment_record",
        }),
        expect.objectContaining({
          fileName: "scan_001.pdf",
          sourceType: "other",
        }),
      ]),
    );
    expect(await fileStore.load(CASE_ID)).toHaveLength(17);
  });

  it("requires confirmation before replacing an existing packet with the synthetic packet", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId),
    );
    const user = userEvent.setup();
    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      makePdfFile("existing-record.pdf"),
    );
    await screen.findByText("Packet (1)");
    processSources.mockClear();

    await user.click(screen.getByRole("button", { name: "Add PDFs" }));
    const chooser = screen.getByRole("dialog", { name: "Add PDFs" });
    await user.click(
      within(chooser).getByRole("button", {
        name: "Replace with synthetic packet",
      }),
    );

    expect(
      within(chooser).getByRole("alert", {
        name: "Confirm synthetic packet replacement",
      }),
    ).toHaveTextContent(/will replace the current packet/i);
    expect(processSources).not.toHaveBeenCalled();

    await user.click(
      within(chooser).getByRole("button", { name: "Keep current packet" }),
    );
    expect(screen.getByText("Packet (1)")).toBeInTheDocument();
    expect(processSources).not.toHaveBeenCalled();
  });

  it("removes individual PDFs and returns to an empty packet after the last removal", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId),
    );
    const user = userEvent.setup();
    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      [
        makePdfFile("first-public-record.pdf"),
        makePdfFile("second-public-record.pdf"),
      ],
    );
    expect(await screen.findByText("Packet (2)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove PDF" }));
    let confirmation = screen.getByRole("dialog", {
      name: "Remove this PDF?",
    });
    expect(confirmation).toHaveTextContent("first-public-record.pdf");
    await user.click(
      within(confirmation).getByRole("button", { name: "Remove PDF" }),
    );

    expect(await screen.findByText("Packet (1)")).toBeInTheDocument();
    expect(processSources).toHaveBeenLastCalledWith(
      [expect.objectContaining({ name: "second-public-record.pdf" })],
      CASE_ID,
    );
    expect(screen.queryByText("first-public-record.pdf")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove PDF" }));
    confirmation = screen.getByRole("dialog", {
      name: "Remove this PDF?",
    });
    await user.click(
      within(confirmation).getByRole("button", { name: "Remove PDF" }),
    );

    expect(await screen.findByText("Packet (0)")).toBeInTheDocument();
    expect(await fileStore.load(CASE_ID)).toEqual([]);
    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.registry.cases[0]?.documentPacket).toBeNull();
  });

  it("selectively removes multiple PDFs and can clear the complete packet", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId),
    );
    const user = userEvent.setup();
    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      [
        makePdfFile("first-public-record.pdf"),
        makePdfFile("second-public-record.pdf"),
        makePdfFile("third-public-record.pdf"),
      ],
    );
    expect(await screen.findByText("Packet (3)")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "More PDF removal options" }),
    );
    const removalMenu = screen.getByRole("menu", {
      name: "PDF removal options",
    });
    await user.click(
      within(removalMenu).getByRole("menuitem", {
        name: "Select PDFs to remove",
      }),
    );

    let bulkDialog = screen.getByRole("dialog", {
      name: "Select PDFs to remove",
    });
    await user.click(
      within(bulkDialog).getByText("first-public-record.pdf"),
    );
    await user.click(
      within(bulkDialog).getByText("third-public-record.pdf"),
    );
    await user.click(
      within(bulkDialog).getByRole("button", {
        name: "Remove selected (2)",
      }),
    );

    expect(await screen.findByText("Packet (1)")).toBeInTheDocument();
    expect(processSources).toHaveBeenLastCalledWith(
      [expect.objectContaining({ name: "second-public-record.pdf" })],
      CASE_ID,
    );
    expect(screen.queryByText("first-public-record.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("third-public-record.pdf")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "More PDF removal options" }),
    );
    await user.click(
      screen.getByRole("menuitem", { name: "Remove all PDFs" }),
    );
    bulkDialog = screen.getByRole("dialog", { name: "Remove all PDFs?" });
    await user.click(
      within(bulkDialog).getByRole("button", {
        name: "Remove all 1 PDFs",
      }),
    );

    expect(await screen.findByText("Packet (0)")).toBeInTheDocument();
    expect(await fileStore.load(CASE_ID)).toEqual([]);
    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.registry.cases[0]?.documentPacket).toBeNull();
  });

  it("runs, persists, and restores the final browser-local privacy check", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId),
    );
    const user = userEvent.setup();
    const firstRender = render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      makePdfFile(),
    );
    await screen.findByText("Packet (1)");
    await user.click(screen.getByRole("tab", { name: "Masking Status" }));
    await user.click(
      await screen.findByRole("button", { name: "Run final privacy check" }),
    );

    expect(
      await screen.findByRole("region", { name: "Privacy check passed" }),
    ).toHaveTextContent(/deterministic local leak scan/i);
    expect(
      screen.getByRole("link", {
        name: "Continue to Structured Analysis from packet header",
      }),
    ).toHaveAttribute("href", `/case/${CASE_ID}/analysis`);
    let restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.registry.cases[0]?.documentPacket?.masking).toMatchObject({
      reviewStatus: "approved",
      leakScanStatus: "passed",
      failedClasses: [],
    });

    firstRender.unmount();
    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );
    await waitFor(() => expect(processSources).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("tab", { name: "Masking Status" }));
    expect(
      screen.getByRole("status", { name: "Privacy check status" }),
    ).toHaveTextContent(/Scan passed/i);
    expect(screen.getByText("Privacy check passed")).toBeInTheDocument();

    restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(restored.registry.cases[0]?.documentPacket?.masking.leakScanStatus).toBe(
      "passed",
    );
  });

  it("applies every current automatic detection and runs the final leak scan", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const rawText =
      "Contact first@example.test or second@example.test before sharing.";
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId, rawText),
    );
    const user = userEvent.setup();

    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );
    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      makePdfFile(),
    );
    await screen.findByText("Packet (1)");
    await user.click(screen.getByRole("tab", { name: "Masking Status" }));

    expect(screen.getByText("0 of 2 reviewed")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Review & apply detected masks (2)",
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Apply all detected masks now",
      }),
    );

    expect(
      await screen.findByRole("region", {
        name: "Detected masks applied and privacy check passed",
      }),
    ).toHaveTextContent(/each mask remains editable or removable/i);
    expect(screen.getByText("2 of 2 reviewed")).toBeInTheDocument();

    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    const masking = restored.registry.cases[0]?.documentPacket?.masking;
    expect(masking).toMatchObject({
      reviewStatus: "approved",
      leakScanStatus: "passed",
      failedClasses: [],
    });
    expect(masking?.suggestions).toEqual([
      expect.objectContaining({ reviewStatus: "approved" }),
      expect.objectContaining({ reviewStatus: "approved" }),
    ]);
  });

  it("persists a failed leak scan when an unmasked supported identifier remains", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const rawText =
      "Contact first@example.test or second@example.test before sharing.";
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId, rawText),
    );
    const user = userEvent.setup();
    const firstRender = render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      makePdfFile(),
    );
    await screen.findByText("Packet (1)");

    const restored = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    const packet = restored.registry.cases[0]?.documentPacket;
    if (!packet || packet.masking.suggestions.length !== 2) {
      throw new Error("expected two deterministic email suggestions");
    }
    const [firstMask, secondMask] = packet.masking.suggestions;
    if (!firstMask || !secondMask) {
      throw new Error("expected two mask records");
    }
    let masking = reviewMask(
      packet.masking,
      firstMask.id,
      "approved",
      firstMask.replacementToken,
    ).review;
    masking = removeMaskSuggestion(masking, secondMask.id).review;
    const saved = saveBrowserCaseDocumentPacket(
      restored.registry,
      CASE_ID,
      {
        ...packet,
        masking,
        updatedAt: "2026-07-25T09:05:00.000Z",
      },
    );
    if (!saved.ok) throw new Error(saved.reason);
    expect(
      persistBrowserCaseRegistry(window.localStorage, saved.registry).ok,
    ).toBe(true);

    firstRender.unmount();
    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );
    await waitFor(() => expect(processSources).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("tab", { name: "Masking Status" }));
    await user.click(
      screen.getByRole("button", { name: "Run final privacy check" }),
    );

    expect(
      await screen.findByRole("region", {
        name: "Privacy check needs attention",
      }),
    ).toHaveTextContent(/supported identifier pattern remains/i);
    const afterScan = restoreBrowserCaseRegistry(
      window.localStorage.getItem(BROWSER_CASE_REGISTRY_STORAGE_KEY),
    );
    expect(afterScan.registry.cases[0]?.documentPacket?.masking).toMatchObject({
      reviewStatus: "approved",
      leakScanStatus: "failed",
      failedClasses: ["email"],
    });
  });

  it("never reports success when browser storage rejects the privacy result", async () => {
    storeCase({ withPurpose: true });
    const fileStore = createMemoryFileStore();
    const processSources = vi.fn(async (files: readonly File[], caseId: string) =>
      processedPacket(files, caseId),
    );
    const user = userEvent.setup();
    render(
      <BrowserCaseDocumentsWorkspace
        caseId={CASE_ID}
        fileStore={fileStore}
        processSources={processSources}
      />,
    );

    await user.upload(
      await screen.findByLabelText("Select PDF documents"),
      makePdfFile(),
    );
    await screen.findByText("Packet (1)");
    await user.click(screen.getByRole("tab", { name: "Masking Status" }));
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Storage unavailable", "QuotaExceededError");
      });

    await user.click(
      screen.getByRole("button", { name: "Run final privacy check" }),
    );

    expect(
      await screen.findByRole("region", {
        name: "Privacy result was not saved",
      }),
    ).toHaveTextContent(/previous masking state remains active/i);
    expect(
      screen.getByRole("region", {
        name: "Browser storage could not be updated",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Privacy check passed" }),
    ).not.toBeInTheDocument();
    setItem.mockRestore();
  });

  it("fails safely for an unknown or deleted case ID", async () => {
    render(
      <BrowserCaseDocumentsWorkspace caseId="CFN-CASE-DOES-NOT-EXIST" />,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Case not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No legacy documents or demonstration records/i)).toBeInTheDocument();
    expect(screen.queryByText(/M\. Chen|REF-2024-0047-SYN/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
