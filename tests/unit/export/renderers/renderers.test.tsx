import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { ExportManifestSchema } from "../../../../lib/contracts";
import {
  buildExportDocumentSections,
  renderExportJson,
  SemanticExportPreview,
} from "../../../../lib/export/renderers";
import { renderExportPdf } from "../../../../lib/export/renderers/pdf";
import {
  createPostWithdrawalManifest,
  createReadyManifest,
} from "./manifest-fixture";

const REQUIRED_LABELS = [
  "AI-assisted, human-reviewed case-preparation draft.",
  "Synthetic case.",
  "Not legal advice.",
  "Local legal verification required.",
];

const DECLARED_DIRECT_IDENTIFIERS = [
  "Maya K.",
  "maya.k@example.test",
  "+1 202-555-0147",
  "X0000007",
  "000123456789",
  "18 Example Lane, Sample City",
  "1997-08-14",
];

async function extractPdf(blob: Blob) {
  const loadingTask = getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
    // The legacy runtime accepts this Node-side worker override, although its current type omits it.
    disableWorker: true,
  } as Parameters<typeof getDocument>[0]);
  const document = await loadingTask.promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
  }
  await loadingTask.destroy();
  return { pageCount: pages.length, text: pages.join("\n") };
}

describe("TASK-022 canonical export renderers", () => {
  it("renders deterministic, valid canonical JSON without declared direct identifiers", () => {
    const manifest = createReadyManifest();
    const first = renderExportJson(manifest);
    const second = renderExportJson(manifest);
    const parsed = ExportManifestSchema.parse(JSON.parse(first));

    expect(first).toBe(second);
    expect(parsed).toEqual(manifest);
    expect(Object.keys(JSON.parse(first))).toEqual([...Object.keys(JSON.parse(first))].sort());
    for (const identifier of DECLARED_DIRECT_IDENTIFIERS) expect(first).not.toContain(identifier);
    for (const label of REQUIRED_LABELS) expect(first).toContain(label);
  });

  it("builds a semantic preview with distinct reviewed, gap, coverage, guidance, audit, and run sections", () => {
    const manifest = createReadyManifest();
    const sections = buildExportDocumentSections(manifest);
    const markup = renderToStaticMarkup(<SemanticExportPreview manifest={manifest} />);

    expect(sections.map((section) => section.id)).toEqual(expect.arrayContaining([
      "reviewed-findings",
      "reviewed-gaps",
      "citations",
      "coverage",
      "limitations",
      "guidance",
      "review-actions",
      "audit-provenance",
      "run-provenance",
    ]));
    expect(markup).toContain(manifest.id);
    expect(markup).toContain(manifest.reviewedStateHash);
    expect(markup).toContain(manifest.runManifest.id);
    expect(markup).toContain("Reviewed unknowns and gaps");
    expect(markup).not.toContain("dangerouslySetInnerHTML");
    for (const label of REQUIRED_LABELS) expect(markup).toContain(label);
    for (const identifier of DECLARED_DIRECT_IDENTIFIERS) expect(markup).not.toContain(identifier);
  });

  it("produces readable local PDF text with stable pagination and manifest parity", async () => {
    const manifest = createReadyManifest();
    const first = await extractPdf(await renderExportPdf(manifest));
    const second = await extractPdf(await renderExportPdf(manifest));

    expect(first.pageCount).toBeGreaterThan(1);
    expect(first.pageCount).toBe(second.pageCount);
    expect(first.text).toContain(manifest.id);
    expect(first.text).toContain(manifest.reviewedStateHash);
    expect(first.text).toContain(manifest.runManifest.id);
    expect(first.text).toContain("Single-run provenance");
    for (const label of REQUIRED_LABELS) expect(first.text).toContain(label);
    for (const candidate of manifest.includedCandidates) expect(first.text).toContain(candidate.candidateId);
    for (const gap of manifest.reviewedGaps) expect(first.text).toContain(gap.candidateId);
    for (const identifier of DECLARED_DIRECT_IDENTIFIERS) expect(first.text).not.toContain(identifier);
  }, 20_000);

  it("keeps post-withdrawal limitation and safe audit provenance while excluding the withdrawn positive item", () => {
    const manifest = createPostWithdrawalManifest();
    const json = renderExportJson(manifest);
    const text = buildExportDocumentSections(manifest).flatMap((section) => section.items).join("\n");
    const limitation = "Insufficient evidence to support a link between the 2025-04-02 alleged communication and an assigned task.";

    expect(manifest.includedCandidates.map((candidate) => candidate.candidateId)).not.toContain("CAND-TASK-0402");
    expect(manifest.includedCandidates).toContainEqual(expect.objectContaining({
      candidateId: "NEXUS-OFFENCE-TIMING",
      assertionMode: "limitation",
      effectiveReviewedText: limitation,
    }));
    expect(manifest.limitations).toContain(limitation);
    expect(manifest.auditEvents.map((event) => event.eventType)).toContain("evidence_withdrawn");
    expect(json).toContain(limitation);
    expect(text).toContain("evidence_withdrawn");
  });

  it("keeps the PDF package behind the explicit dynamic import boundary", () => {
    const source = readFileSync(join(process.cwd(), "features/export/export-workspace.tsx"), "utf8");
    expect(source).toContain('await import("../../lib/export/renderers/pdf")');
    expect(source).not.toMatch(/from\s+["']\.\.\/\.\.\/lib\/export\/renderers\/pdf["']/);
  });
});
