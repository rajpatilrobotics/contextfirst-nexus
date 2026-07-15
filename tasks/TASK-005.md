# TASK-005: PDF source service and coverage engine

## 1. Task metadata

- Status: Pending
- Readiness rule: Only the coordinator may mark this task Ready after TASK-001, TASK-002, and TASK-003 are integrated into the assigned base.
- Stage: domain
- Wave: 4
- Risk: high
- Suggested branch: `task/005-pdf-coverage`
- Depends on: TASK-001, TASK-002, TASK-003
- Graph outcome: Implement browser-only PDF.js extraction, canonical segment alignment, page status, coverage issues, worker cleanup, and explicit no-OCR failure behavior.

## 2. Goal

Provide a browser-only source service that reads the bundled PDFs through the pinned same-origin PDF.js worker, aligns available text to canonical fixture segments, and reports honest page and coverage states without guessing missing content.

## 3. Why this task exists

Exact citations and safe review depend on knowing what was actually processed. This service makes missing, unreadable, image-only, failed, and mismatched content observable and prevents an empty extraction or missing page from being treated as successful evidence.

## 4. Dependencies and base requirement

- TASK-001, TASK-002, and TASK-003 must be integrated into the coordinator branch and present in this worktree base.
- `pdfjs-dist@6.1.200` and `public/vendor/pdfjs/pdf.worker.min.mjs` must exist from TASK-001.
- Canonical `DocumentRecord`, `PageRecord`, `SourceSegment`, `CoverageIssue`, `CoverageSummary`, and safe-error contracts must be importable from `lib/contracts`.
- The complete `CFN-DEMO-001` fixture manifest, digest, D01 through D07 assets, stable logical pages and segments, and D04-P3 missing state must be importable from TASK-003.
- The task runs entirely against bundled synthetic local assets. It requires no upload, OCR service, live provider, credential, network API, or cloud change.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-005.md` in full.
3. `PLANS.md` in full.
4. The `TASK-005` entry in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/SAFETY_AND_DATA.md` in full.
7. `docs/ARCHITECTURE.md` Sections 4, 7, 8.2, 12, and 16.
8. `docs/CONTRACTS.md` Sections 6, 8, and 9.
9. `docs/DEMO_AND_FIXTURES.md` Sections 6 through 8.
10. `docs/TESTING_AND_EVALUATION.md` Sections 6 and 8.3.
11. `docs/DESIGN_SYSTEM.md` Sections 9.4 and 9.9 as read-only downstream presentation context.
12. `decision-log.md` decisions DEC-004, DEC-014, and DEC-015.
13. The integrated shared contracts, PDF.js asset, fixture manifest and public assets, every current owned file, and the current Git status.

## 6. Exclusive write scope

- `lib/documents/`
- `tests/unit/documents/`

## 7. Read-only context allowed

- `lib/contracts/`
- `lib/fixtures/`
- `fixtures/cases/`
- `public/fixtures/cfn-demo-001/`
- `public/vendor/pdfjs/`
- `scripts/copy-pdfjs-assets.mjs`
- `package.json`
- `vitest.config.ts`
- `tests/setup/`
- `features/documents/`
- All coordinator-owned documentation and task packets

Downstream feature paths are read-only and may be inspected only to provide a clean service interface. Do not integrate the service into a route or component in this task.

## 8. Out of scope

- Arbitrary upload, drag and drop, real or private files, child cases, OCR, scanned-document interpretation, image forensics, malware scanning, or chain-of-custody claims.
- Masking, leak scanning, citation validation, review rules, dependency invalidation, provider payload construction, persistence, export gating, UI rendering, or source-drawer interaction.
- Changing PDFs, fixture manifests, digests, stable IDs, page expectations, shared contracts, PDF.js version, worker location, package files, test configuration, or authoritative documents.
- Runtime CDN assets, browser-to-provider connections, raw PDF transmission, analytics, telemetry, or server-side document storage.

## 9. Frozen contracts and invariants

- Load only the allowlisted bundled `CFN-DEMO-001` assets under `public/fixtures/cfn-demo-001/`.
- PDF parsing occurs in the browser using `pdfjs-dist@6.1.200` and the same-origin worker at `/vendor/pdfjs/pdf.worker.min.mjs`. No runtime CDN or OCR is permitted.
- The original PDF bytes and canonical fixture source remain unchanged. Raw PDF bytes never enter a provider request, log, export, or persisted case state.
- The canonical fixture manifest, not PDF.js text-item grouping, controls document ID, logical page number, stable segment ID, expected page count, original range, and expected normalized text.
- Map available extracted text to canonical segments deterministically. A zero, duplicate, missing, or incompatible alignment becomes a `segment_mismatch` issue rather than silently creating or moving a segment.
- Preserve logical source-page identity even when physical PDF item ordering differs. Never renumber stable IDs based on extraction order.
- D04-P3 is `availability: missing`, not an empty successful page. D04 pages 1, 2, and 4 retain their logical identities.
- Missing, unreadable, image-only, skipped, manually excluded, extraction-failed, and segment-mismatch states remain distinct and use the exact contract values.
- An image-only, malformed, empty, failed, unavailable, or unmatched page cannot support a candidate.
- Every expected document and page contributes to `CoverageSummary`. Coverage is a set of facts and issues, never a misleading percentage.
- A non-consequential issue remains visible without blocking unrelated findings. A consequential issue blocks only affected findings and export. Unknown consequence remains a visible fail-closed review issue until the central coverage-review command records a qualified limitation and explicit reviewed consequence.
- Page and document processing use explicit pending, active, completed, warning, or failed states. Empty output is never completed success.
- Source hashing may support synthetic fixture integrity but must not be described as authenticity, evidentiary immutability, tamper proofing, or chain of custody.
- PDF.js loading must be route-friendly, avoid top-level browser-only access in server contexts, use one same-origin worker per active service as designed, release page and document resources, terminate workers, revoke object URLs, and clear caches on cleanup.
- Browser rendering of source text uses escaped text. This service must not introduce `dangerouslySetInnerHTML`.
- Errors expose safe codes, document and page IDs, and stage only. They never expose raw source text, quotes, PDF bytes, stack traces, credentials, or private paths.

## 10. Implementation steps

1. Inspect Git status, integrated contracts and fixture APIs, PDF.js worker availability, current owned files, and unit-test environment.
2. Define a browser-only PDF source-service boundary with injectable loading for deterministic unit tests and no eager PDF.js import in server code.
3. Load only allowlisted fixture URLs, configure the local worker, extract page text and available positions, and preserve logical fixture page identity.
4. Align extracted text with canonical page and segment definitions. Emit explicit page, stage, and coverage records for every expected page and every mismatch or failure.
5. Implement deterministic coverage aggregation for document counts, page counts, distinct issue kinds, consequence, resolution state, and `hasConsequentialOpenIssue`.
6. Implement cleanup for documents, pages, workers, object URLs, and in-memory caches, including partial-failure cleanup and idempotent repeated cleanup.
7. Add focused unit fixtures and tests for the golden packet, D04-P3, empty text, malformed data, image-only state, unreadable state, extraction failure, stable segment alignment, segment mismatch, consequence scoping, safe errors, and cleanup.
8. Run the graph verification commands and inspect the final diff for unowned files, raw-content logging, OCR or upload behavior, server imports, runtime CDN use, and changed fixture truth.

## 11. Acceptance criteria

- The service loads only the seven bundled synthetic PDFs and uses the pinned same-origin worker without a runtime network dependency.
- Every D01 through D07 document and every expected logical page produces one typed record with the correct stable ID and explicit availability and processing status.
- D04-P3 is reported as missing and unavailable. It is never represented as extracted, empty success, skipped by default, or synthesized.
- Available pages align to the canonical stable segments and preserve expected ranges and text-position metadata. Zero or multiple alignment matches produce a visible `segment_mismatch` issue.
- Missing, unreadable, image-only, skipped, manually excluded, extraction-failed, and segment-mismatch tests produce distinct contract values.
- Empty extraction, malformed input, worker failure, and unmatched pages cannot become candidate-eligible source content or completed success.
- Coverage totals are correct, every issue remains visible, the golden D04-P3 issue does not block unrelated findings, and a consequential fixture issue blocks only its affected dependency path.
- The service exposes enough safe metadata for later source and coverage UI without exposing raw content in errors or logs.
- Cleanup releases every allocated PDF.js document, page resource, worker, object URL, and cache even after a failed extraction, and repeated cleanup is safe.
- No OCR, arbitrary upload, provider call, raw PDF transmission, persistent storage, chain-of-custody claim, or source mutation is implemented.
- Focused document tests and TypeScript checking pass with no changes outside Section 6.

## 12. Verification commands

```text
npx vitest run tests/unit/documents
npm run typecheck
```

## 13. Manual checks

1. Exercise the source service with the golden manifest and inspect the returned records. Confirm D01 through D07 are present and D04 logical pages are 1, 2, missing 3, and 4.
2. Inspect D04-P3 and confirm its availability is `missing`, its issue is `missing_page`, it has no extracted text or candidate support, and the summary still shows the issue when non-consequential.
3. Exercise one empty page, one image-only page, one unreadable page, one extraction failure, and one segment mismatch. Confirm each produces its exact distinct state and never completed success.
4. Exercise non-consequential, consequential, and unknown-consequence issues tied to one dependency. Confirm the first remains visible without global blocking, the second blocks only the affected path and summary, and the unknown issue fails closed until the central coverage-review transition records its limitation.
5. Start and clean up a successful load, a partial failure, and a repeated cleanup. Confirm no live worker, document handle, page resource, object URL, or cache entry remains.
6. Inspect browser network behavior while loading a fixture. Confirm the PDF and worker requests are same-origin and there is no OCR, provider, analytics, or CDN request.
7. Review safe error objects and logs. Confirm they contain no raw PDF bytes, source text, quote, identifier, stack trace, credential, or private filesystem path.
8. Review the final Git diff and confirm every changed path is in Section 6 and no fixture, package, contract, component, route, provider, or documentation file changed.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Message: `feat: add PDF source and coverage services`

## 15. Handoff requirements

- Report Task ID `TASK-005` and outcome as Complete, Partial, or Blocked.
- List every changed document-service and test file.
- Summarize extraction, canonical alignment, coverage aggregation, safe failure, and cleanup behavior.
- Confirm the D04-P3 missing state, distinct failure states, no-OCR boundary, raw-content boundary, same-origin worker rule, and no-chain-of-custody claim.
- Report both Section 12 commands with pass or fail status and every manual check not completed.
- Report any fixture, worker, browser-test, cleanup, mapping, or consequence uncertainty as a blocker or follow-up.
- Confirm no unowned file, dependency, provider, fixture, environment value, cloud setting, or secret changed.
- Include a commit hash only when the opening coordinator prompt authorized the commit; otherwise state `Not committed`.

## 16. Stop conditions

- Stop if TASK-001, TASK-002, or TASK-003 is not integrated, the local PDF.js worker is missing, canonical fixture data is unavailable, or another active task owns a path in Section 6.
- Stop if the fixture asset, manifest, digest, page count, logical page mapping, stable segment ID, or shared source contract disagrees with an authoritative document.
- Stop if completing the task requires any file outside Section 6, a new dependency, package or test configuration change, contract change, fixture change, provider change, route change, or cloud change.
- Stop if a browser-only implementation cannot avoid server import, runtime CDN access, raw PDF transmission, logging source content, or persisting unmasked source text.
- Stop if a failure state would need to be hidden, treated as empty success, filled with OCR or invented content, or broadened into a global blocker without a dependency basis.
- Stop before any arbitrary upload, real-data test, OCR service, provider call, credential use, external upload, destructive command, global install, billing, quota, deployment, or production-setting action.
- Stop on any contract, fixture, safety, architecture, or testing conflict and report the exact passages to the coordinator.
