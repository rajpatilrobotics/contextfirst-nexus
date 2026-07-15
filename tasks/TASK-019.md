# TASK-019: Intake, masking, processing, and coverage UI

## 1. Task metadata

- Task ID: TASK-019
- Stage: interface
- Status: Pending. Only the coordinator may mark this task Ready after every dependency is integrated.
- Wave: 10
- Risk: high
- Suggested branch: `task/019-intake-coverage-ui`
- Depends on: TASK-004, TASK-005, TASK-006, TASK-010, TASK-017, TASK-018

## 2. Goal

Implement the Documents route with the seven-document synthetic packet, browser-only source processing, explicit stage progress, page-level coverage, human-reviewed masking, redacted safe view, intentional source reveal, deterministic analysis-prerequisite status, and an explicit controller-backed Start analysis result flow.

## 3. Why this task exists

The practitioner must see exactly what entered the workflow, what was processed, what was unavailable, which identifiers were suggested for masking, and what still blocks analysis. Once every prerequisite is satisfied, the same route must offer one explicit Start analysis action and show its result without duplicating request or recovery policy. Hidden missingness or automatic masking would make later citations and review unsafe and impossible to explain.

## 4. Dependencies and base requirement

- TASK-004 must be integrated and provide accessible document, status, alert, progress, form, dialog, and responsive UI primitives.
- TASK-005 must be integrated and provide browser-only PDF extraction, canonical segment alignment, coverage issues, page status, same-origin PDF.js worker lifecycle, and no-OCR failure behavior.
- TASK-006 must be integrated and provide declared identifier detection, deterministic replacement tokens and range maps, masking review transitions, sensitive reveal support, and provider and export leak scans.
- TASK-010 must be integrated and provide canonical document, masking, coverage, processing, audit, persistence, and case-revision state commands.
- TASK-017 must be integrated and provide the case shell, persistent synthetic banner, Documents navigation state, case status, and Reset Case entry.
- TASK-018 must be integrated and provide the sole analysis run controller, minimized request construction, live lifecycle dispatch, terminal response mapping, local replay path, and recovery handoff.
- Create the worktree from the latest coordinator branch containing all six integrated dependencies and their passing verification. Do not duplicate a missing service in feature code.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-019.md` in full.
3. `PLANS.md` in full.
4. The TASK-019 entry in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md` in full.
7. `PROJECT_BRIEF.md`: The problem, The proposed solution, End-to-end prototype flow, Information labels, Prototype scope, Product principles, and Success criteria.
8. `docs/PRODUCT_SPEC.md`: Sections 4, 5, 6, 7.4, 7.5, 9, and 10.
9. `docs/CONTRACTS.md`: Sections 2, 4.6, 5, 6, 7, 8, 9, 16.6, 17, 18, 24, 25, and 26.
10. `docs/ARCHITECTURE.md`: Sections 4, 6, 7, 8.2 through 8.5, 11 through 13, and 16.
11. `docs/DESIGN_SYSTEM.md`: Sections 5 through 8, 9.1, 9.3 through 9.5, 10, 11, 12, and 13.
12. `docs/SAFETY_AND_DATA.md` in full.
13. `docs/DEMO_AND_FIXTURES.md`: Sections 3 through 8, 13, 14, 16, and 17.
14. `docs/TESTING_AND_EVALUATION.md`: Sections 5, 8.2, 8.3, 9, 10.1, 13, 14.1 through 14.4, 21, and 22.
15. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4, 6, 7, 9, 12, 13, and 16.
16. The current contents of every path in the Exclusive write scope.

## 6. Exclusive write scope

- `app/case/demo/intake/page.tsx`
- `features/documents/`
- `tests/components/documents/`

No other path may be created, edited, renamed, moved, or deleted.

## 7. Read-only context allowed

- `components/ui/`
- `components/status/`
- `components/shell/`
- `lib/contracts/`
- `lib/documents/`
- `lib/redaction/`
- `lib/state/`
- `lib/fixtures/`
- `fixtures/cases/`
- `public/fixtures/cfn-demo-001/`
- `public/vendor/pdfjs/`
- `app/case/demo/purpose/page.tsx`
- `features/purpose/`
- `features/analysis/provider-selection/`
- `features/analysis/provider-recovery/`
- `features/analysis/run-controller/`
- `package.json` and shared test configuration, only to understand installed interfaces and commands

All document services, redaction services, fixtures, assets, state logic, provider UI, and shared files are read-only.

## 8. Out of scope

- Editing PDF extraction, coverage, masking, leak-scan, state, fixture, contract, provider, replay, prompt, shell, or export logic.
- Adding OCR, image interpretation, upload, drag and drop, arbitrary files, real data, child cases, harmless-public material, source editing, or a second fixture.
- Building an `AnalyzeRequest` or model payload, calling `POST /api/analyze` directly, mapping terminal response unions, loading replay outside the TASK-018 controller, attaching recovery metadata, or implementing provider failure recovery.
- Treating a missing or unreadable page as empty success, guessing text, silently skipping a page, or claiming the packet is complete.
- Claiming anonymization, guaranteed de-identification, evidentiary authenticity, chain of custody, malware scanning, production security, or clinically validated trauma-informed design.
- Editing global styles, shared UI primitives, dependencies, worker-copy scripts, package files, test configuration, environment variables, deployment files, or cloud settings.

## 9. Frozen contracts and invariants

- The route exposes only `CFN-DEMO-001`, fixture version `1.0.0`, with seven visibly synthetic text PDFs D01 through D07. There is no arbitrary upload control.
- The source copy is application-managed and read-only. Processing creates or uses a separate working derivative and never modifies the original fixture.
- PDF.js runs in the browser through the pinned same-origin worker. Raw PDF bytes never enter state persistence, logs, provider requests, or server reconstruction inputs. Resources are released through the TASK-005 lifecycle.
- P0 has no OCR. Missing, unreadable, image-only, extraction-failed, skipped, manually excluded, and segment-mismatch states remain distinct and explicit.
- D04 has four expected pages and page `D04-P3` is shown as `Unavailable, missing page`. It is not rendered as blank, processed, or silently omitted. Its current non-consequential status remains visible without blocking unrelated findings.
- D07 segment `D07-P2-S03` is untrusted instruction-like source content. It may remain visible for inspection but is never executed, hidden, converted into an application command, used as candidate support, or exported.
- `CoverageSummary` is a set of counts and `CoverageIssue` records, not a completeness percentage or confidence score. Coverage consequence is exactly consequential, non-consequential, or unknown. Open unknown consequence fails closed until a qualified central coverage-review limitation records its explicit reviewed consequence. Consequential impact is scoped to reachable dependent findings.
- The exact processing stages are Intake validation, Text extraction, Coverage calculation, Identifier masking, Candidate extraction, Citation validation, Timeline and Nexus assembly, and Safety and export-gate checks.
- Each stage derives from canonical `StageStatus`: pending, active, completed, warning, or failed. Completed safe stages remain visible after a later failure. A retry targets only a safely retryable failed stage.
- Current selected provider and model for live mode, or replay mode label, remains visible when applicable. This task does not choose or switch a provider and reaches analysis only through the TASK-018 run controller.
- Declared `MaskClass` values are person name, email, phone, passport, bank account, address, and date of birth. The UI states exactly which classes are supported and does not claim universal named-entity detection.
- Each mask suggestion shows class, source location, proposed readable replacement, detection method, and review status. The practitioner can preview, approve, edit, or reject each suggestion before completing the review.
- Analysis prerequisites require an approved masking review and a passed deterministic leak scan. Changing a mask invalidates the review, increments the masking and case revisions, and stales dependent analysis and export state through canonical logic.
- The explicit Start analysis control is rendered only after purpose, source processing, masking review, and deterministic leak-scan prerequisites are complete. It invokes the TASK-018 run controller once and shows explicit pending, succeeded, failed, or rejected-before-run results from canonical state.
- A successful terminal result is read from the one canonical `CaseState.candidates: CaseCandidate[]` collection. Processing labels may summarize derived timeline and Nexus assembly, but this feature must not create, persist, or mutate parallel candidate, timeline, Nexus, or context-gap arrays.
- This feature never constructs the request, dispatches live lifecycle commands directly, validates recovery linkage, maps the API union, calls the live route, or implements recovery UI. Those responsibilities remain in TASK-018.
- The default source view uses the approved redacted derivative. Original synthetic text appears only after an intentional reveal action with a warning. Reveal uses the central `reveal_source` command and audit event.
- Grounding or source hashing never implies truth, authenticity, admissibility, completeness, tamper-proof storage, or chain of custody.
- Case, extracted, and instruction-like text is rendered as inert escaped React text. Do not use `dangerouslySetInnerHTML`.
- Safe errors and progress announcements contain document or page IDs, a safe code, and a next action, but no raw source text, exact quote, identifier, prompt, key, provider body, or stack trace.

## 10. Implementation steps

1. Inspect Git status, owned files, canonical document and masking contracts, TASK-005 service APIs, TASK-006 review and reveal APIs, and TASK-010 commands. Stop if an interface would need to be guessed.
2. Compose the Documents route from feature components without placing extraction, masking, coverage, or state policy inside the page file.
3. Implement source cards for all seven fixture documents with synthetic label, type, expected pages, language, processing state, and explicit page-level availability.
4. Implement `ProcessingStageList`, `CoverageManifest`, `MaskingReviewPanel`, and intentional `SensitiveReveal` behavior from canonical records. Keep safe view as the default and retain completed work after a later failure.
5. Wire intake, processing, ephemeral local sensitive-term suggestion refresh, safe mask add or removal, mask decisions, mask-review completion, retryable local stages, coverage limitation review, reveal, and analysis-prerequisite state through the integrated services and central commands. Never render, persist, log, or transmit entered sensitive terms outside the immediate browser-local detector action.
6. Render Start analysis only when all canonical prerequisites pass, invoke the TASK-018 run controller without building a payload or handling recovery locally, and render explicit pending, succeeded, failed, and rejected-before-run results.
7. Add focused component tests for document counts and metadata, D04 page 3, D07 instruction containment, every stage status, failed-stage persistence and retry, declared mask classes, mask editing and approval, leak-scan blocking, safe default and reveal, empty and unavailable extraction, inert rendering, hidden-until-ready Start analysis, one controller invocation, terminal results sourced from canonical `CaseCandidate[]` without mirrored arrays, and accessible progress or error announcements.
8. Run every verification command, complete the manual checks, and inspect the diff for unowned paths, source mutation, raw-content logging, upload controls, unsupported claims, secrets, debug output, direct API calls, local payload construction, or duplicated recovery behavior.

## 11. Acceptance criteria

- `/case/demo/intake` lists D01 through D07 with the correct source type, expected page count, English language metadata, synthetic identity, and current processing state.
- The route has no upload control and never asks the user to paste or enter narrative, identifiers, or real case material.
- Processing visibly represents all eight frozen stages and every canonical stage status. A later failure preserves completed safe stages and identifies the affected document or page without exposing its text.
- Coverage shows expected and available documents and pages plus distinct open issues. D04 page 3 is exactly identified as unavailable because it is missing, and no completeness score is displayed.
- D07's seeded instruction is visible only as untrusted evidence content, has no command effect, and cannot support analysis or export.
- Masking review exposes every declared supported class, source location, readable replacement, and review state; unreviewed or rejected required masks keep analysis prerequisites blocked.
- Provider or replay analysis remains blocked until purpose prerequisites exist, masking review is approved, and the deterministic leak scan passed. Only then does the UI render an explicit Start analysis control, which delegates once to the TASK-018 run controller.
- Starting analysis shows an explicit pending state and then the canonical succeeded, failed, or rejected-before-run result. This feature does not build the request, call the route directly, map response unions, validate recovery, or append or activate runs.
- Successful result presentation reads the canonical `CaseCandidate[]` collection and creates no mutable or persisted timeline, Nexus, context-gap, lane, queue, or blocker candidate copy.
- The redacted derivative is the default source view. Reveal requires an intentional action and warning, is audited through canonical state, and returns safely to the masked view.
- Missing, unreadable, image-only, failed, skipped, and excluded pages never render as successful or empty-complete states.
- Tests prove raw PDF bytes and seeded identifiers are not serialized into persisted state, UI errors, or any provider-boundary data produced by this feature.
- Loading, empty, partial, warning, blocked, failed, successful, unknown, and not-processed presentation is explicit where applicable; no blank panel means success.
- The route is keyboard operable, uses meaningful live-region announcements, and reflows at 320 CSS pixels and 200 percent zoom without essential horizontal scrolling.

## 12. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/components/documents
npm run build
```

## 13. Manual checks

1. Open `/case/demo/intake` from a completed synthetic Purpose Brief. Confirm seven document cards appear in D01 through D07 order with synthetic labels, types, page counts, language, and no upload or free-text case input.
2. Inspect Coverage. Confirm D04 expects four pages, page 3 reads as unavailable and missing, the issue remains visible, and unrelated document states are not marked failed.
3. Inspect the processing list while a local extraction failure fixture is active. Confirm completed stages remain visible, the failed stage names the affected document or page, only a permitted targeted retry is offered, and no blank panel or completion claim appears.
4. Review each declared mask class, edit one readable replacement, reject one optional suggestion, and leave one required suggestion pending. Confirm the review and analysis prerequisites remain blocked and Start analysis is not rendered until the required set is approved and leak scan passes.
5. Complete every prerequisite, choose an acknowledged analysis mode through the Purpose route, and return to Documents. Confirm Start analysis is now rendered, invokes the TASK-018 controller once, shows pending state, and then shows the canonical success, failure, or preflight-rejection result without exposing a request payload.
6. Open a masked segment. Confirm the redacted text appears first. Use the intentional reveal control, read the warning, reveal the synthetic original, close it with Escape or Close, and confirm focus returns to the invoking control.
7. Open D07 page 2 and inspect `D07-P2-S03`. Confirm it is visibly labelled untrusted content, its text is inert, and it creates no review decision, hidden contradiction, navigation, or other application action.
8. Complete the route by keyboard and inspect it at 320 CSS pixels and 200 percent zoom. Confirm document cards, progress, coverage issues, mask controls, Start analysis, results, warnings, and focus indicators remain readable and operable.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add intake masking and coverage UI`

## 15. Handoff requirements

Return a self-contained handoff containing:

- `Task: TASK-019, Intake, masking, processing, and coverage UI` and outcome `Complete`, `Partial`, or `Blocked`.
- Every changed path, listed exactly.
- The document, progress, coverage, masking, reveal, prerequisite, controller-backed Start analysis, and result behavior now observable.
- Confirmation that browser-only PDF processing, no OCR, immutable source, synthetic-only input, missing-page visibility, instruction containment, human-approved masking, no anonymization claim, controller-only analysis start, no local payload construction, and no duplicated recovery invariants were preserved.
- Each acceptance criterion with its result.
- Each required command and manual check with `PASS`, `FAIL`, or `NOT RUN` and a reason for any unrun check.
- Any fixture, extraction, coverage, redaction, state, or accessibility blocker that requires coordinator action.
- The commit hash only if commit permission was present and used; otherwise `Not committed`.

## 16. Stop conditions

Stop and notify the coordinator if:

- Any dependency is not integrated, an expected service or command is absent, or the base fails its existing verification.
- The task graph and this packet disagree about title, dependencies, owned paths, or verification commands.
- Completing the route requires editing a document service, redaction service, fixture, public PDF, state reducer, provider feature, route, contract, shell, UI primitive, package file, test configuration, or another unowned path.
- A new package, worker asset, source format, OCR capability, upload path, environment variable, provider call, fixture, contract value, or deployment setting appears necessary.
- Start analysis would require bypassing the TASK-018 controller, constructing a payload in this feature, calling the route directly, implementing response mapping or recovery, or dispatching run lifecycle commands from the Documents UI.
- D04 page 3, D07 instruction eligibility, the seven-document manifest, seeded identifier classes, or canonical mask and coverage behavior conflicts with the authoritative fixture or contract documents.
- The implementation would expose or persist raw PDF bytes, unmasked text, seeded identifiers, source quotes, prompts, credentials, private URLs, or raw diagnostics outside the approved browser-only view.
- Real, private, client, survivor, child, or otherwise prohibited data appears in the worktree.
- Verification reveals an upstream extraction, redaction, state, fixture, or shared-UI defect. Report the smallest safe reproduction and do not patch the dependency from this task.
