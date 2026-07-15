# TASK-020: Timeline and source drawer

## 1. Task metadata

- Task ID: TASK-020
- Stage: interface
- Status: Pending. Only the coordinator may mark this task Ready after every dependency is integrated.
- Wave: 9
- Risk: medium
- Suggested branch: `task/020-timeline-source-drawer`
- Depends on: TASK-004, TASK-005, TASK-007, TASK-010, TASK-017

## 2. Goal

Implement an accessible qualified timeline and exact-citation source experience with visible uncertainty and conflict, desktop non-modal source access, mobile modal source access, exact masked highlighting, manual ambiguity handoff, and reliable focus restoration.

## 3. Why this task exists

Source-linked review is only trustworthy when the practitioner can see where a statement came from, how its date and evidence nature are qualified, and what a citation match does not prove. This task provides that inspectable evidence surface without implementing review decisions or route composition.

## 4. Dependencies and base requirement

- TASK-004 must be integrated and provide accessible list, card, status, sheet, dialog, link, and focus foundations.
- TASK-005 must be integrated and provide browser-only source access, canonical page and segment records, masked semantic source text, PDF resource lifecycle, and coverage state.
- TASK-007 must be integrated and provide canonical citation validation, exact and unique normalized resolution, redacted-to-original range mapping, ambiguity handling, and source-highlight data.
- TASK-010 must be integrated and provide canonical timeline, citation, reveal, audit, and active-run state with no cross-run output merging.
- TASK-017 must be integrated and provide the case shell dimensions, responsive breakpoints, persistent boundary, and status context.
- Create the worktree from the latest coordinator branch containing all five integrated dependencies and their passing verification. Do not implement a replacement citation resolver or state store inside this feature.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-020.md` in full.
3. `PLANS.md` in full.
4. The TASK-020 entry in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md` in full.
7. `PROJECT_BRIEF.md`: The problem, Hero artifact, End-to-end prototype flow, Information labels, Product principles, and Success criteria.
8. `docs/PRODUCT_SPEC.md`: Sections 5, 6, 7.7, 7.10, 9, and 10.
9. `docs/CONTRACTS.md`: Sections 2, 3, 4.1 through 4.4, 6, 8, 9, 11, 15, 17, 18, 25, and 26.
10. `docs/ARCHITECTURE.md`: Sections 6, 7, 8.2, 8.5, 8.6, 11, 12, and 16.
11. `docs/DESIGN_SYSTEM.md`: Sections 5 through 8, 9.7, 9.9, 10, 11, 12, and 13.
12. `docs/SAFETY_AND_DATA.md` in full.
13. `docs/DEMO_AND_FIXTURES.md`: Sections 3 through 9, 11, 13, and 17.
14. `docs/TESTING_AND_EVALUATION.md`: Sections 8.1, 8.3, 9, 10.1, 13, 14.2, 21, and 22.
15. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4, 6, 7, 9, 12, 13, and 16.
16. The current contents of every path in the Exclusive write scope.

## 6. Exclusive write scope

- `features/review/timeline/`
- `features/review/source/`
- `tests/components/review/timeline/`
- `tests/components/review/source/`

No other path may be created, edited, renamed, moved, or deleted.

## 7. Read-only context allowed

- `components/ui/`
- `components/status/`
- `components/shell/`
- `lib/contracts/`
- `lib/documents/`
- `lib/citations/`
- `lib/state/`
- `lib/fixtures/`
- `fixtures/cases/`
- `public/fixtures/cfn-demo-001/`
- `app/case/demo/review/`
- `features/review/`
- `package.json` and shared test configuration, only to understand installed interfaces and commands

The Review route, other review components, state, services, fixtures, public assets, and shared files are read-only.

## 8. Out of scope

- Composing `/case/demo/review`; implementing candidate decisions, Nexus rows, review lanes, queue, context gaps, dependency withdrawal, audit history, export blockers, or exports.
- Editing canonical timeline, citation, coverage, PDF, reveal, state, reducer, fixture, or contract logic.
- Resolving a citation locally, upgrading its validation status, writing a returned resolver result directly into component state, rewriting a quote, selecting one conflicting date, or treating source location as proof of truth or authenticity.
- Adding OCR, upload, a graph or chart library, another source viewer, raw PDF transmission, browser provider access, or direct source editing.
- Exposing unmasked content by default, logging source text, using `dangerouslySetInnerHTML`, or hiding untrusted instruction-like content.
- Changing global styles, shell layout, UI primitives, package files, test configuration, environment variables, deployment files, or cloud settings.

## 9. Frozen contracts and invariants

- Timeline records use canonical `TimelineEvent` and `TimelinePrecision`: day, date range, approximate, conflicting, or unknown. Sorting never resolves a conflict or removes qualification.
- The timeline is an accessible ordered list, not a decorative line implying false certainty. Filters may use recruitment, movement, control, alleged conduct, legal process, and protection without changing the underlying records.
- Each source dependency displays its own `EvidenceNature`; item origin, support status, and review status remain separate. Allegations remain allegations, reported material remains reported, and reviewer-authored content is labelled separately.
- Every displayed source event has an exact or manually resolved canonical citation, or is clearly labelled reviewer-authored. An invalid, unavailable, unresolved, or ambiguous citation cannot masquerade as a working source link.
- The fixture chronology remains qualified: D03 documents arrival and transfer; D04 reports a later worksite-arrival recollection; these create a clarification question rather than an automatic contradiction. D05 provenance remains unknown. D06 records an allegation, not guilt. The 2025-04-02 overlap never implies causation.
- A citation carries document ID, page when available, segment ID, approved redacted exact quote, range, language, translation, extraction quality, validation status, resolution method, and provenance limitation.
- Resolution first uses an exact codepoint match. Its only normalized fallback applies the frozen conservative normalization and succeeds only for one unique match. The proposal string is lookup input only; a validated citation shows the exact canonical source slice at the resolved range.
- Default source text is the approved masked derivative. An intentional synthetic-source reveal uses canonical browser-local behavior; no original unmasked source text is persisted or sent to a provider by this component.
- `D07-P2-S03` remains visible as untrusted evidence content when opened but cannot support a candidate or export statement and is never executed as a command.
- Source display states clearly that an exact location proves only that text occurs in the processed source. It does not prove truth, authenticity, admissibility, completeness, credibility, or legal sufficiency.
- Desktop at 1280 pixels and wider uses a 400-pixel non-modal complementary region. Focus moves to the drawer heading or quote, is not trapped, Escape and Close work, and close restores the invoking citation control.
- Tablet uses an overlay source drawer. Below 768 pixels the source opens as a modal dialog or sheet with contained focus, Escape and Close behavior, and focus restoration.
- Semantic DOM text for the exact masked segment is always present even when a PDF canvas supports visual inspection. A canvas is never the only source representation.
- Opening or closing a source preserves timeline scroll, filter state, active event context, and the exact invoking control. Required information is not hidden in a tooltip.
- Ambiguous matching UI exists only for repeated bounded exact-codepoint ranges inside the citation's existing eligible canonical segment. The segment is fixed, and multiple normalized-only or cross-segment ambiguity offers no selector. The UI dispatches the canonical `resolve_citation` command with `candidateId`, `citationId`, the existing `selectedSegmentId`, and one recomputed `selectedRedactedSegmentRange`. The canonical state path invokes the TASK-007 manual resolver, validates the returned result, and updates `CaseState`; the UI never marks a citation valid directly.
- A final source link becomes enabled only after updated canonical state contains the validated `manually_resolved` citation for the same candidate and citation IDs. A resolver return value, optimistic component state, or successful dispatch alone cannot enable it.
- Source and case text is rendered as inert escaped React text. HTML, scripts, Markdown links, URLs, and instruction-like content remain text.

## 10. Implementation steps

1. Inspect Git status, owned files, canonical timeline and citation records, TASK-005 source service, TASK-007 resolver and highlight interfaces, TASK-010 state selectors, and shell breakpoint contracts. Stop if manual resolution or focus context would need an invented API.
2. Implement timeline presentation as accessible ordered content with exact evidence, origin, support, review, date-precision, conflict, provenance, coverage, and source-link labels.
3. Implement source opening state and `CitationLink` integration so event filters and scroll context are preserved and one stable invoking control is retained for focus restoration.
4. Implement desktop non-modal, tablet overlay, and mobile modal `SourceDrawer` behavior with semantic masked text, exact highlight, citation metadata, provenance limitation, safe reveal integration, Escape and Close actions, and ambiguity handoff through `resolve_citation` with `candidateId`, `citationId`, `selectedSegmentId`, and `selectedRedactedSegmentRange`.
5. Keep ambiguous citation controls blocked after dispatch and enable the final source link only when updated canonical state exposes the validated `manually_resolved` citation for the same IDs.
6. Add focused tests for fixture chronology, approximate and conflicting dates, allegations, unknown provenance, citation statuses, exact highlighted text, command payload, no optimistic validity, canonical-state source-link enablement, D07 inert rendering, desktop and mobile focus behavior, Escape, focus restoration, semantic source text, and state preservation.
7. Run every verification command, complete the manual checks using the owned component render fixtures, and inspect the diff for unowned files, source-text leakage, local citation mutation, unsafe markup, unsupported truth claims, debug output, and new dependencies.

## 11. Acceptance criteria

- The timeline component renders canonical events in a qualified chronological order and visibly preserves approximate dates, date ranges, conflicts, allegations, reported accounts, unknown provenance, missing coverage, and unknown states.
- The D03 arrival and D04 worksite-arrival records remain distinct, the 2025-04-02 overlap does not claim causation, D05 remains unauthenticated, and D06 does not imply guilt.
- Every source-supported event exposes a citation control for its current valid or manually resolved citation; unresolved and unavailable citations display an explicit blocked state instead of opening a false location.
- Opening a valid citation shows the correct document, page, segment, exact approved masked quote, language, translation, extraction quality, validation status, and provenance limitation.
- The exact quote is highlighted from canonical ranges. A normalized lookup never changes displayed characters, case, punctuation, words, or numbers.
- Ambiguous citations dispatch `resolve_citation` with the exact `candidateId`, `citationId`, `selectedSegmentId`, and `selectedRedactedSegmentRange`. They remain unresolved until updated canonical state contains the validated manual result; the component never changes validation status or enables the final source link itself.
- At desktop width the source region is non-modal, does not trap focus, closes with Escape and Close, and restores focus to the exact invoking citation while preserving timeline state.
- Below 768 pixels the source is modal, contains focus, closes with Escape and Close, has no hidden focus beneath it, and restores the invoking control.
- Semantic masked source text is usable without PDF canvas rendering. Original synthetic text is not shown without intentional reveal and warning.
- D07 instruction-like text is inert and visibly untrusted. HTML-like, script-like, Markdown-like, and URL-like fixture text never executes or becomes a link unless the application supplied a separate trusted control.
- Component tests cover loading, empty, partial, unavailable, unresolved, ambiguous, error, and successful source states with no blank success.
- The components remain keyboard operable and usable at 320 CSS pixels and 200 percent zoom without essential horizontal scrolling.

## 12. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/components/review/timeline tests/components/review/source
npm run typecheck
```

## 13. Manual checks

1. In the focused timeline component render, load the golden fixture and inspect the D03 arrival, D04 reported worksite arrival, D05 provenance, and D06 allegation. Confirm every qualification is visible and the sequence makes no truth, guilt, authenticity, or causation claim.
2. At 1440 by 900 pixels, open `CAND-TASK-0402` at `D05-P1-S05`. Confirm the 400-pixel source region is complementary and non-modal, focus moves to its heading or exact quote, timeline filters and scroll remain unchanged, and background controls remain keyboard reachable.
3. Close that source with Escape, reopen it, and close with the explicit Close control. Confirm focus returns to the exact citation control both times.
4. At a viewport below 768 pixels, open the same citation. Confirm the source is modal, focus remains inside, no control behind it receives focus, Escape and Close work, and focus returns to the invoking control.
5. Inspect the semantic source representation with PDF canvas unavailable. Confirm document, page, segment, exact masked quote, language, translation, extraction quality, validation, and the source-location limitation remain available.
6. Present a citation whose exact quote occurs twice in its existing eligible canonical segment and choose one recomputed redacted range without changing the segment. Confirm the citation remains unresolved before selection, the component dispatches `resolve_citation` with `candidateId`, `citationId`, the existing `selectedSegmentId`, and `selectedRedactedSegmentRange`, and neither dispatch nor resolver return enables the final source link. Confirm only the updated canonical state containing the validated `manually_resolved` record enables it. Then present multiple normalized-only matches and confirm no selector appears.
7. Open `D07-P2-S03`. Confirm instruction-like, HTML-like, Markdown-like, and URL-like text remains inert and cannot hide evidence, navigate, create an action, or support a candidate.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add timeline and source drawer`

## 15. Handoff requirements

Return a self-contained handoff containing:

- `Task: TASK-020, Timeline and source drawer` and outcome `Complete`, `Partial`, or `Blocked`.
- Every changed path, listed exactly.
- The timeline qualification, citation opening, highlighting, exact `resolve_citation` payload, canonical-state-only ambiguity completion, responsive source mode, and focus behavior now observable.
- Confirmation that evidence dimensions, exact citations, masked default, no truth claim, inert rendering, no OCR, no local citation mutation, and single-run state invariants were preserved.
- Each acceptance criterion with its result.
- Each required command and manual check with `PASS`, `FAIL`, or `NOT RUN` and a reason for any unrun check.
- The viewport and citation ID used for each focus and responsive manual check.
- Any source-service, citation-resolver, state, fixture, or accessibility blocker requiring coordinator action.
- The commit hash only if commit permission was present and used; otherwise `Not committed`.

## 16. Stop conditions

Stop and notify the coordinator if:

- Any dependency is not integrated, the citation or source interface is absent, or the base fails existing verification.
- The task graph and this packet disagree about title, dependencies, owned paths, or verification commands.
- Completing the feature requires editing the Review route, state reducer, citation resolver, PDF service, fixture, public asset, contract, shell, UI primitive, package file, test configuration, or another unowned path.
- The canonical `resolve_citation` action or any required `candidateId`, `citationId`, `selectedSegmentId`, `selectedRedactedSegmentRange`, updated-state selector, exact highlight mapping, source lifecycle, focus context, or breakpoint contract is missing or contradictory.
- A new dependency, OCR path, upload path, fixture, source schema, provider call, environment variable, or deployment setting appears necessary.
- The implementation would rewrite a quote, silently select a conflicting date, upgrade evidence nature, show unmasked text by default, execute source content, log source text, or claim truth, authenticity, admissibility, or legal sufficiency.
- Any real or private data, credential, private URL, raw provider diagnostic, or unsupported claim appears.
- Verification reveals an upstream source, citation, state, fixture, or shared-UI defect. Report the smallest safe reproduction and do not patch the dependency from this task.
