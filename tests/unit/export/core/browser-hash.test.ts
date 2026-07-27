import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { sha256TextHex } from "../../../../lib/crypto/sha256";
import { canonicalJson, sha256Hex } from "../../../../lib/export/core";

describe("browser-safe SHA-256", () => {
  it.each([
    ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
    [
      "ContextFirst Nexus — browser-safe",
      createHash("sha256")
        .update("ContextFirst Nexus — browser-safe", "utf8")
        .digest("hex"),
    ],
  ])("matches the SHA-256 reference for %j", (value, expected) => {
    expect(sha256TextHex(value)).toBe(expected);
  });

  it("preserves canonical export-selection digests", () => {
    const projection = {
      kind: "minimum_necessary_safe_share",
      minimumNecessarySelection: {
        confirmed: true,
        intendedRecipientCategory: "legal_aid_team",
        selectedCandidateIds: ["CAND-2", "CAND-1"],
        excludedCandidateIds: [],
      },
    };
    expect(sha256Hex(projection)).toBe(
      createHash("sha256")
        .update(canonicalJson(projection), "utf8")
        .digest("hex"),
    );
  });
});
