import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildBrowserDeterministicAnalysis } from "../../../lib/analysis/browser-deterministic-analysis";
import {
  CFN_DEMO_PDF_ALLOWLIST,
  CfnDemoPdfSourceService,
} from "../../../lib/documents";

function bundledPdfFiles() {
  return CFN_DEMO_PDF_ALLOWLIST.map((entry) => {
    const bytes = readFileSync(
      join(
        process.cwd(),
        "public",
        "fixtures",
        "cfn-demo-001",
        entry.fileName,
      ),
    );
    return {
      name: entry.fileName,
      size: bytes.byteLength,
      type: "application/pdf",
      async arrayBuffer() {
        return bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ) as ArrayBuffer;
      },
    } as File;
  });
}

describe("browser deterministic analysis with representative PDFs", () => {
  it("extracts the bundled synthetic packet and keeps contextual source-grounded review prompts", async () => {
    const service = new CfnDemoPdfSourceService();
    try {
      const packet = await service.processSelectedFiles(bundledPdfFiles());
      const selected = new Set(packet.selectedSegmentIds);
      const result = buildBrowserDeterministicAnalysis({
        caseId: packet.caseId,
        approvedRedactedInputDigest: packet.canonicalFixtureDigest,
        safeShareRecipientCategory: "legal_aid_team",
        documents: packet.documents,
        segments: packet.segments.filter((segment) =>
          selected.has(segment.id),
        ),
        completedAt: "2026-07-26T12:00:00.000Z",
      });
      const laneItems = result.candidates.filter(
        (candidate) => candidate.kind === "review_lane_item",
      );

      expect(laneItems.length).toBeGreaterThan(0);
      const lanes = new Set(laneItems.map((candidate) => candidate.lane));
      expect(lanes.has("trafficking_indicators")).toBe(true);
      expect(lanes.has("protection_remedy_urgency")).toBe(true);
      expect(
        laneItems.every(
          (candidate) =>
            candidate.deterministicMatch?.exactPhrase &&
            candidate.deterministicMatch.rationale.includes(
              "browser-local",
            ),
        ),
      ).toBe(true);
      expect(
        result.citations.every(
          (citation) => citation.validationStatus === "exact_match",
        ),
      ).toBe(true);
    } finally {
      await service.cleanup();
    }
  });
});
