# TASK-007: Citation validation and source resolution

## 1. Task metadata

- Status: Pending
- Readiness rule: Only the coordinator may mark this task Ready after TASK-001, TASK-002, TASK-003, and TASK-006 are integrated into the assigned base.
- Stage: domain
- Wave: 5
- Risk: high
- Suggested branch: `task/007-citation-validation`
- Depends on: TASK-001, TASK-002, TASK-003, TASK-006
- Graph outcome: Implement exact codepoint matching, unique normalized lookup, bounded repeated-exact choices, unsafe-ambiguity quarantine, unavailable-source handling, and redacted-to-original browser highlighting.

## 2. Goal

Create a pure deterministic citation resolver that accepts exact or uniquely located normalized proposals, exposes only bounded repeated-exact ranges for explicit selection, quarantines unsafe ambiguity and unavailable content, returns a validated manual-resolution result when applicable, and maps safe quotes back to one browser-local source range without persisting or mutating `CaseState`.

## 3. Why this task exists

Source grounding is the core product control. A citation must prove that the displayed quote exists at a stable processed location without implying that the statement is true, authentic, credible, or legally sufficient. Ambiguous, fabricated, unavailable, or semantically upgraded citations must never enter accepted review or export.

## 4. Dependencies and base requirement

- TASK-001, TASK-002, TASK-003, and TASK-006 must be integrated into the coordinator branch and present in this worktree base.
- Citation, source, page, bounding-box, evidence-dependency, validation-status, safe-error, and quarantine contracts must be importable from `lib/contracts`.
- The complete canonical `CFN-DEMO-001` fixture, stable segment allowlist, page availability, model visibility, support eligibility, and digest must be available from TASK-003.
- Approved redacted derivatives and deterministic redacted-to-original range maps must be available from TASK-006.
- TASK-005 is not a graph dependency. This task must use canonical fixture and contract inputs and must not assume unintegrated document-service code.
- No live provider call, model retry, browser UI, cloud access, credential, or real source material is required.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-007.md` in full.
3. `PLANS.md` in full.
4. The `TASK-007` entry in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/SAFETY_AND_DATA.md` in full.
7. `docs/CONTRACTS.md` Sections 6, 7, 9, 10, and 26.
8. `docs/ARCHITECTURE.md` Sections 8.2, 8.5, and 12.
9. `docs/DEMO_AND_FIXTURES.md` Sections 6 through 9 and 14 through 16.
10. `docs/TESTING_AND_EVALUATION.md` Sections 8.1 and 14.2 through 14.3.
11. `docs/DESIGN_SYSTEM.md` Section 9.9 as read-only downstream source-display context.
12. `decision-log.md` decisions DEC-004, DEC-007, DEC-014, DEC-015, DEC-035, and DEC-039.
13. The integrated shared contracts, canonical fixture, redaction utilities and tests, every current owned file, and the current Git status.

## 6. Exclusive write scope

- `lib/citations/`
- `tests/unit/citations/`

## 7. Read-only context allowed

- `lib/contracts/`
- `lib/fixtures/`
- `lib/redaction/`
- `fixtures/cases/`
- `fixtures/evals/definitions/`
- `public/fixtures/cfn-demo-001/`
- `lib/documents/`
- `features/review/`
- `package.json`
- `vitest.config.ts`
- `tests/setup/`
- All coordinator-owned documentation and task packets

Unintegrated or downstream document and UI paths are reference only. Do not edit them or make their behavior a hidden prerequisite.

## 8. Out of scope

- PDF extraction, OCR, arbitrary upload, fixture generation, masking detection, redaction-map mutation, provider requests, model retries, review transitions, export gates, UI, source drawer focus behavior, persistence, or `CaseState` mutation.
- Fuzzy, semantic, case-insensitive, punctuation-insensitive, stemming, embedding, edit-distance, or model-based quote matching.
- Treating citation location as proof of truth, authenticity, admissibility, credibility, legal sufficiency, or evidence weight.
- Changing canonical source text, stable IDs, segment allowlists, page status, fixture digest, shared contracts, normalization rules, package files, test setup, or authoritative documentation.
- Revealing original unmasked text to a provider or including raw text in logs and safe errors.

## 9. Frozen contracts and invariants

- Validate only segment IDs in the server-selected canonical allowlist for `CFN-DEMO-001` fixture `1.0.0`. A model cannot create a source, document, page, or segment ID.
- The model proposal's quoted text is lookup input only. A validated `Citation.quotedText` is always the exact canonical slice from the approved redacted derivative at the resolved range. The interface never displays a normalized, reconstructed, or silently improved quote.
- Attempt exact codepoint matching first.
- The only fallback applies Unicode NFC, normalizes line endings, and collapses whitespace while preserving case, punctuation, words, and numbers. It passes only when exactly one match maps back to one exact redacted source range.
- Zero matches are `not_found`. Multiple bounded exact-codepoint occurrences inside the same known, available, allowlisted, candidate-eligible segment are `ambiguous_match` and may be offered for explicit manual resolution. Multiple normalized-only matches are unsafe ambiguity and return a quarantine outcome with no citation candidate. Neither form may be auto-selected.
- A successful exact or unique normalized lookup uses `validationStatus: exact_match`; its `resolutionMethod` records `exact_codepoint` or `normalized_unique_lookup` respectively.
- Manual resolution occurs only after an explicit practitioner selection between repeated exact-codepoint ranges in the citation's existing canonical segment. It uses `validationStatus: manually_resolved`, `resolutionMethod: manual_segment_selection`, and `resolvedBy: practitioner`.
- Manual resolution validates the selected segment and selected redacted range against canonical source data and returns a new validated result. It never persists that result, dispatches a state command, replaces a prior automatic result, or mutates `CaseState`.
- Normalization is a lookup method only. The model-proposed string is never promoted as citation text; the visible validated quote is the exact approved redacted source slice at the resolved range.
- Wrong document, wrong page, unknown segment, fabricated quote, wrong range, source-unavailable page, semantic mismatch, and evidence-nature upgrade remain distinct rejected or quarantined outcomes.
- Missing, unreadable, image-only, skipped, manually excluded, extraction-failed, or otherwise unavailable pages produce `source_unavailable` and cannot be manually treated as present text.
- Redacted ranges map deterministically through the approved `redactionMapVersion: 1.0.0` to one original browser-local range and available bounding boxes. An ambiguous, stale, or invalid map invalidates the citation.
- The source view is masked by default. The original range is browser-local highlighting metadata and is never returned to a provider, log, error, or export as unredacted text.
- An active source dependency that supports or contradicts a positive candidate requires `exact_match` or `manually_resolved`.
- Human acceptance cannot upgrade evidence nature. A documented location may still have unknown provenance or truth.
- D07-P2-S03 remains visible as untrusted content but has `supportEligibility: evidence_only`; any attempt to use it as candidate support is rejected or quarantined.
- Invalid, ambiguous, unavailable, or semantically mismatched citations cannot enter an accepted finding or export.
- Errors and quarantine records expose only safe IDs, status, and reason codes. They contain no raw source text beyond the already approved redacted quote needed for the citation object, no original identifier, prompt, provider body, key, or stack trace.

## 10. Implementation steps

1. Inspect Git status, integrated contracts, canonical fixture APIs, redaction mapping APIs, current owned files, and test setup.
2. Implement exact codepoint lookup over the approved redacted segment and preserve the exact source slice and range.
3. Implement the one conservative normalization function and a range-preserving unique lookup. Reject zero or unmappable matches, and quarantine multiple normalized-only matches without creating a citation candidate.
4. Validate document, logical page, segment, allowlist membership, page availability, quote range, redaction-map version, support eligibility, language, translation, extraction quality, and available bounding boxes.
5. Implement pure explicit manual segment resolution that validates the selected segment and redacted range and returns a new `manually_resolved` result without persistence or `CaseState` mutation.
6. Implement redacted-to-original browser-local highlighting metadata with stale, ambiguous, and invalid map rejection.
7. Implement safe semantic checks for evidence-nature upgrade, source mismatch, and `evidence_only` support attempts, returning canonical validation or quarantine states.
8. Add decision-table tests for exact, repeated exact within one eligible segment, normalized unique, duplicate normalized-only, Unicode, line ending, whitespace, wrong case, changed punctuation, wrong number, wrong page, wrong document, unknown segment, fabricated quote, unavailable page, semantic mismatch, evidence upgrade, D07 containment, manual resolution, range mapping, and safe error content.
9. Run the graph verification commands and inspect the final diff for unowned files, relaxed matching, raw-content logging, source mutation, provider behavior, or unsupported claims.

## 11. Acceptance criteria

- One exact codepoint occurrence resolves to the exact approved redacted slice, correct inclusive-start and exclusive-end range, `exact_match`, and `exact_codepoint`.
- A quote that differs only by permitted NFC, line-ending, or whitespace normalization resolves only when the normalized match is unique, records `normalized_unique_lookup`, and still displays the exact source slice.
- Case, punctuation, word, or number changes do not pass the normalization fallback.
- Zero matches, multiple normalized-only matches, wrong document, wrong page, unknown segment, fabricated quote, wrong range, and unavailable page all fail with the correct distinct status, quarantine outcome, or safe reason and do not create a reviewable citation.
- Multiple bounded exact-codepoint occurrences in one eligible segment remain blocked until an explicit practitioner range selection creates a separate `manually_resolved` result. The automatic result is never overwritten as exact.
- The manual resolver returns the validated `manually_resolved` result to its caller and performs no persistence, command dispatch, audit append, or `CaseState` mutation.
- Missing or unavailable source content cannot be manually reconstructed, guessed, or accepted.
- Every accepted source-supported dependency has an exact or manually resolved citation to an allowlisted, candidate-eligible segment.
- D07-P2-S03 can be located for safe inspection but cannot support a candidate or export statement.
- A model attempt to change reported evidence into documented evidence produces a semantic rejection or quarantine, not an upgraded dependency.
- Every successful redacted quote maps through redaction map `1.0.0` to exactly one browser-local original range and the correct available bounding boxes. Stale or ambiguous maps invalidate the citation.
- Provider-facing, logging, error, and export-safe outputs reveal no unmasked identifier or original source slice.
- No citation result or user-facing string claims truth, authenticity, admissibility, credibility, or legal sufficiency.
- Focused citation tests and TypeScript checking pass with no changes outside Section 6.

## 12. Verification commands

```text
npx vitest run tests/unit/citations
npm run typecheck
```

## 13. Manual checks

1. Resolve an exact quote from D05-P1-S05. Confirm the visible quote is the exact approved redacted slice, the range is exact, and the method is `exact_codepoint`.
2. Resolve a quote with only permitted Unicode, line-ending, and whitespace differences. Confirm one unique result, method `normalized_unique_lookup`, and unchanged displayed source wording.
3. Repeat with changed case, punctuation, one word, and one number. Confirm each is rejected rather than fuzzily matched.
4. Use an exact quote that occurs twice inside one eligible segment. Confirm `ambiguous_match`, two bounded exact-codepoint options, no selected range, and no candidate-acceptance eligibility. Then use a quote with multiple normalized-only matches and confirm quarantine with no citation candidate.
5. Explicitly select one allowlisted redacted range for the repeated exact-codepoint case. Confirm the pure resolver returns `manually_resolved`, practitioner provenance, and the exact selected range without changing the prior automatic result or any `CaseState` fixture.
6. Try D04-P3 and one unreadable, image-only, or failed page state. Confirm `source_unavailable` and no manual reconstruction path.
7. Map one approved redacted quote containing a mask back to the original browser-local range. Confirm exact highlighting metadata while all provider-facing and error outputs remain redacted.
8. Try using D07-P2-S03 as candidate support and try upgrading D04 reported evidence to documented. Confirm both are rejected or quarantined with safe reason codes.
9. Inspect error objects and logs for original text, identifiers, prompts, provider bodies, credentials, stack traces, and private paths. None may appear.
10. Review the final Git diff and confirm every changed path is in Section 6 and no fixture, redaction, contract, package, provider, review, component, route, or documentation file changed.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Message: `feat: add citation validation`

## 15. Handoff requirements

- Report Task ID `TASK-007` and outcome as Complete, Partial, or Blocked.
- List every changed citation and test file.
- Summarize exact lookup, normalized unique lookup, pure manual-result validation, unavailable-source behavior, semantic rejection, redacted-to-original mapping, and confirmation that no resolver path persists or mutates `CaseState`.
- Confirm the allowlist, ambiguity block, evidence-nature, D07 evidence-only, no-raw-log, masked-default, and no-truth-claim invariants.
- Report both Section 12 commands with pass or fail status and any manual check not completed.
- Report any normalization, Unicode, range, fixture, redaction-map, semantic, or contract uncertainty as a blocker or follow-up.
- Confirm no unowned file, dependency, provider, fixture, environment value, cloud setting, or secret changed.
- Include a commit hash only when the opening coordinator prompt authorized the commit; otherwise state `Not committed`.

## 16. Stop conditions

- Stop if TASK-001, TASK-002, TASK-003, or TASK-006 is not integrated, canonical segment or redaction-map data is unavailable, or another active task owns a path in Section 6.
- Stop if completing the task requires any file outside Section 6, a new dependency, package or test configuration change, contract change, fixture or digest change, redaction change, provider change, route change, or cloud change.
- Stop if an exact or normalized range cannot map uniquely, a page state conflicts with fixture truth, or manual resolution would require inventing unavailable source text.
- Stop if manual resolution would require persistence, command dispatch, audit mutation, or any `CaseState` write from `lib/citations/`.
- Stop if a requested behavior requires fuzzy or semantic matching, case or punctuation removal, model adjudication, evidence-nature upgrade, hidden ambiguity, raw original text outside the browser-local boundary, or treating a location match as truth.
- Stop if integration requires fixing TASK-005 or another unowned service. Report the exact missing interface to the coordinator for a scope decision.
- Stop before any provider call, model retry, real-data test, arbitrary upload, credential use, external upload, destructive command, global install, billing, quota, deployment, or production-setting action.
- Stop on any safety, contract, fixture, architecture, normalization, or testing conflict and report exact passages to the coordinator.
