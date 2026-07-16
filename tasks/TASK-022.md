# TASK-022: Export experience and local renderers

## 1. Task metadata

- Task ID: TASK-022
- Stage: interface
- Status: Blocked until TASK-027 and TASK-028 are integrated. Only the coordinator may then mark this task Ready.
- Wave: 9
- Risk: high
- Suggested branch: `task/022-export-renderers`
- Depends on: TASK-004, TASK-009, TASK-010, TASK-017, TASK-027, TASK-028

## 2. Goal

Implement the Export route with an actionable non-bypassable gate, purpose-bound minimum-necessary selection, semantic preview, canonical structured JSON, lazy local PDF generation, manifest parity, local downloads, required labels, and truthful provenance and limitations.

## 3. Why this task exists

The final handoff is the point where unsupported, unreviewed, stale, over-broad, or identifying content could become durable and leave the application. The export experience must make blockers understandable, allow only the purpose-approved reviewed snapshot, and generate both formats from one safe manifest without automatic transmission.

## 4. Dependencies and base requirement

- TASK-004 must be integrated and provide accessible panels, alerts, tabs, forms, dialogs, status, responsive layout, and focus foundations.
- TASK-009 must be integrated and provide the complete canonical export gate, freshness rules, full and safe-share projections, minimum-necessity rules, single-run provenance, and deterministic manifest serialization.
- TASK-010 must be integrated and provide central gate evaluation, export creation, case revision, current-export state, audit events, purpose-change invalidation, and replay or run provenance.
- TASK-017 must be integrated and provide the case shell, Export navigation state, case status, persistent synthetic banner, and stable blocker-navigation context.
- TASK-027 must be integrated and provide shared route-visible case state, corrected export-input freshness, revision-before-gate behavior, and the complete manifest limitation union.
- TASK-028 must be integrated and provide the exact canonical review candidate, dependency, replay, and checkpoint fixture projections consumed by export.
- TASK-010 provides audit and current-run provenance state, while TASK-004 provides reusable accessible limitation and disclosure surfaces. The full Trust and Safety Lab page remains independent in TASK-023.
- Create the worktree from the latest coordinator branch containing all six integrated dependencies and their passing verification. Do not recreate gate or manifest logic in a component or renderer.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-022.md` in full.
3. `PLANS.md` in full.
4. The TASK-022 entry in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md` in full.
7. `PROJECT_BRIEF.md`: The problem, The proposed solution, End-to-end prototype flow, Prototype scope, Product principles, Strongest demo moment, and Success criteria.
8. `docs/PRODUCT_SPEC.md`: Sections 5, 6, 7.12 through 7.15, 9, 10, and 11.
9. `docs/CONTRACTS.md`: Sections 2, 3, 4.7, 5, 7 through 9, 14, 15, 18 through 23, 24, 25, and 26.
10. `docs/ARCHITECTURE.md`: Sections 4, 6, 7, 8.6, 8.7, 11 through 13, and 16.
11. `docs/DESIGN_SYSTEM.md`: Sections 5 through 8, 9.10, 9.11, 9.14, 9.15, 10, 11, 12, and 13.
12. `docs/SAFETY_AND_DATA.md` in full.
13. `docs/DEMO_AND_FIXTURES.md`: Sections 3, 4, 7, 9, 11, 13, 16, and 17.
14. `docs/TESTING_AND_EVALUATION.md`: Sections 7.4, 8.2, 8.5, 8.6, 9, 10, 13, 14.3, 19, 21, and 22.
15. `docs/SOURCE_REGISTER.md`: Sections 4 through 7 and 9.
16. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4, 6, 7, 9, 12, 13, and 16.
17. The current contents of every path in the Exclusive write scope.

## 6. Exclusive write scope

- `app/case/demo/export/page.tsx`
- `features/export/`
- `lib/export/renderers/`
- `tests/unit/export/renderers/`
- `tests/components/export/`

No other path may be created, edited, renamed, moved, or deleted.

## 7. Read-only context allowed

- `components/ui/`
- `components/status/`
- `components/shell/`
- `lib/contracts/`
- `lib/export/core/`
- `lib/redaction/`
- `lib/review/`
- `lib/state/`
- `lib/guidance/`
- `lib/fixtures/`
- `fixtures/cases/`
- `fixtures/replay/`
- `features/trust/`
- `features/review/`
- `app/case/demo/purpose/page.tsx`
- `package.json` and shared test configuration, only to understand installed renderer and command interfaces

The export core, state, review, redaction, guidance, fixtures, trust components, Purpose route, and shared files are read-only.

## 8. Out of scope

- Editing the export gate, manifest builder, canonical JSON rules, review engine, reducer, purpose contract, masking or leak scanner, fixture, guidance pack, shared contracts, or stable IDs.
- Implementing or changing review decisions, provider selection or recovery, source processing, Trust page data, or system-card contracts.
- Adding server-side export generation, cloud storage, email, upload, filing, reporting, referral, share links, automatic transmission, telemetry, or downstream deletion claims.
- Adding a critical-gate override, weakening a blocker, exporting pending, rejected, uncertain, invalidated, withdrawn, unreviewed, unsupported positive, stale, or cross-run content.
- Generating PDF and JSON from separate data queries, merging runs, treating them as separate handoff purposes, or allowing a handoff-kind switch without returning to Purpose.
- Claiming PDF/UA, tagged-PDF accessibility, legal validation, evidentiary authenticity, production readiness, guaranteed anonymity, or zero retention.
- Changing packages, shared test configuration, global styles, UI primitives, environment variables, deployment files, or cloud settings.

## 9. Frozen contracts and invariants

- The current Case Purpose Brief selects exactly one `ExportKind`: `full_practitioner_handoff` or `minimum_necessary_safe_share`. PDF and JSON are two formats of that one purpose-bound handoff.
- Changing handoff kind returns to Purpose, increments case revision, invalidates the current gate, and requires scope review. Export UI must not silently broaden the approved purpose.
- The Export action remains operable when blocked. Activating it opens `ExportGatePanel`; an unexplained disabled button is not the blocked experience.
- Every blocker has severity Blocking, a canonical `ExportBlockerCode`, affected entity IDs, plain-language message, remediation, and a stable link to the exact purpose, review, citation, coverage, jurisdiction, dependency, masking, processing, safety, freshness, or minimum-necessity target.
- Any single blocker keeps the gate Blocked. There is no critical override, bypass parameter, hidden action, or direct-render path.
- The gate checks incomplete purpose or authority, prohibited origin, incomplete individual review, unresolved citation, consequential coverage, unverified jurisdiction for a domestic claim, unresolved dependency, incomplete mask review, PII failure, processing or safety failure, stale run or gate, unconfirmed minimum necessity, outside-purpose recipient category mismatch, and category-ineligible content.
- The first judged export attempt names exactly `CAND-SENDER-0402` and `CAND-URG-INTERPRETER` as the unresolved blockers supplied by canonical state.
- A ready gate is bound to case revision, one successful analysis run, purpose revision, masking revision, and ruleset version. Any relevant material change makes it stale.
- One immutable canonical `ExportManifest` version `1.0.0` is the sole input to semantic HTML, structured JSON, and PDF renderers. Renderers do not query case state independently or decide inclusion.
- Every included positive candidate is Human accepted or Human edited, active, from the same successful run, exactly cited where source-supported, redacted, purpose-bound, and eligible under the canonical projection.
- Pending, rejected, uncertain, invalidated, withdrawn, unreviewed, and unsupported positive candidates are excluded. Reviewed unknowns, limitations, gaps, coverage issues, and contrary evidence appear only in their appropriate labelled sections.
- The manifest preserves single-run provider or replay provenance, release configuration, requested and returned model when known, service tier, adapter, disclosure, prompt, contract, fixture, ruleset, checkpoint, transmission, and recovery linkage. Outputs from separate runs are never combined.
- `minimum_necessary_safe_share` allows an unconfirmed `MinimumNecessarySelection` as a visible blocked state. It becomes ready only after confirmation, when the selected recipient category equals the Purpose `intendedRecipientCategory`, and when every selected or closure-required item is eligible for that category. It excludes raw documents and unnecessary identifiers or audit detail, and preserves allowed source IDs, reviews, dependencies, gaps, limitations, and provenance.
- Provider payload, canonical manifest, PDF text, and JSON pass the declared identifier leak scan. Raw full documents, unreviewed items, hidden prompts, provider logs, raw provider bodies, and unnecessary identifiers are absent.
- All exports contain these exact labels: `AI-assisted, human-reviewed case-preparation draft.`, `Synthetic case.`, `Not legal advice.`, and `Local legal verification required.`
- Guidance includes issuer, source, version, scope, limitation, and local-verification notice. It never becomes case evidence or an unverified domestic legal conclusion.
- The semantic HTML preview and structured JSON summary are available before PDF generation. A PDF iframe or canvas is never the only preview.
- `@react-pdf/renderer` is loaded only after an explicit PDF generation action on this route. Landing and other initial bundles must not eagerly load it.
- PDF and JSON downloads are initiated locally by the practitioner. No route emails, uploads, files, reports, refers, shares, or otherwise transmits an export.
- The P0 PDF is not claimed to be PDF/UA or tagged accessible. The structured JSON is the machine-readable companion. Both represent the same reviewed snapshot and parity is testable.
- After the hero withdrawal and renewed review, the handoff excludes a positive 2025-04-02 assignment link, includes the reviewed gap and changed dependency limitation, and retains the withdrawal and renewed-review audit explanation.

## 10. Implementation steps

1. Inspect Git status, owned files, TASK-009 gate and manifest interfaces, TASK-010 export commands and current state, purpose-selected handoff kind, renderer dependency, and TASK-023 closing components. Stop if a renderer would need to infer policy.
2. Compose `/case/demo/export` with gate status, actionable blocker panel, stable remediation links, selected handoff identity, minimum-necessary selection, and canonical create-export action.
3. Implement semantic HTML and structured JSON previews directly from one immutable ready manifest. Keep unknowns, limitations, coverage, guidance, provenance, review, and required labels explicit.
4. Implement the PDF and JSON renderers as pure consumers of the same manifest. Lazy-load PDF generation only on user action and create local downloads without server transmission.
5. Add focused tests for every blocker presentation, direct bypass prevention at the UI boundary, blocker focus navigation, purpose-kind staleness, minimum necessity, inclusion and exclusion, single-run provenance, exact labels, semantic preview, lazy loading, deterministic JSON, PDF readable text and pagination, redaction, and PDF or JSON parity.
6. Add golden and post-withdrawal renderer fixtures that prove the two early blockers, final limitation, no positive assignment link, and audit provenance without editing canonical fixture expectations.
7. Run every verification command, complete the manual checks, inspect generated content only with synthetic fixture data, and inspect the final diff for unowned paths, PII, raw content, cross-run merging, hidden transmission, unsupported accessibility or legal claims, secrets, debug output, and eager renderer loading.

## 11. Acceptance criteria

- `/case/demo/export` clearly identifies the Purpose-selected handoff and current gate state. A blocked Export action opens an accessible panel rather than doing nothing.
- Every canonical blocker renders its code-derived plain-language reason, affected IDs, remediation, and stable focusable destination; no override or direct-generation control exists.
- The golden early state shows exactly `CAND-SENDER-0402` and `CAND-URG-INTERPRETER` as the unresolved review blockers supplied by core state.
- A handoff-kind change returns to Purpose and stales the gate. The Export route cannot preview or generate the unapproved kind.
- Safe-share generation remains blocked with `MINIMUM_NECESSITY_UNCONFIRMED` until minimum necessity is confirmed and its included and excluded candidate IDs are visible for review. Recipient category mismatch or category-ineligible content remains blocked as `OUTSIDE_STATED_PURPOSE`.
- A ready canonical manifest produces a semantic HTML preview and structured JSON summary before PDF generation. Unknowns, limitations, contrary evidence, coverage, guidance scope, review actions, and run provenance remain distinguishable.
- PDF generation is lazy and user initiated. PDF and JSON download locally and trigger no application upload, email, file, report, referral, or external transmission.
- PDF and JSON derive from the exact same manifest ID, reviewed-state hash, case revision, run, included candidates, citations, gaps, labels, limitations, and redaction result.
- All four exact labels occur in both formats. The UI makes no PDF/UA, tagged-PDF, legal-validation, production-readiness, anonymity, or zero-retention claim.
- Pending, rejected, uncertain, invalidated, withdrawn, stale, cross-run, raw-document, hidden-prompt, provider-log, and unnecessary-identifier content is absent from both formats.
- The post-withdrawal manifest contains the changed gap and limitation, excludes a positive link between the alleged communication and assigned task, and preserves safe withdrawal and renewed-review provenance.
- The renderer tests verify readable PDF text, stable pagination for the fixture, valid structured JSON, deterministic canonical output, declared-identifier absence, and parity without weakening TASK-009 policy.
- Blocker focus, tabs, selection, generation, and download controls are keyboard operable and reflow at 320 CSS pixels and 200 percent zoom without essential horizontal scrolling.

## 12. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/unit/export/renderers tests/components/export
npm run build
```

## 13. Manual checks

1. Open `/case/demo/export` in the golden early state. Activate Export and confirm the panel names `CAND-SENDER-0402` and `CAND-URG-INTERPRETER`, explains each blocker, provides a stable remediation link, moves focus correctly, and offers no override.
2. Activate each blocker link. Confirm navigation preserves blocker context, focuses the exact destination heading or candidate, and browser Back returns to the blocker panel without losing its state.
3. From a ready full-practitioner state, inspect semantic HTML and structured JSON. Confirm both represent the selected full handoff, all four labels are visible, and the minimum, unknown, limitation, citation, coverage, guidance, review, audit, and run sections are clearly distinguishable.
4. Generate the PDF, then download PDF and JSON. Confirm generation begins only after the explicit action, both files are local, no transmission action appears, the PDF text is readable, and the JSON parses as the same manifest.
5. Compare the two formats for manifest ID, reviewed-state hash, case revision, run ID, included candidate IDs, citation IDs, gap IDs, labels, limitations, and redaction status. Confirm no seeded identifier, rejected item, hidden instruction, raw document, provider log, or cross-run content appears.
6. Load the post-withdrawal ready state. Confirm both formats omit a positive 2025-04-02 assignment link, include the reviewed Insufficient evidence limitation and gap, and retain safe withdrawal and renewed-review history.
7. Start a separate safe-share scenario selected in Purpose. Confirm included and excluded IDs are reviewed before generation, minimum necessity must be confirmed, the selected recipient category must match the Purpose `intendedRecipientCategory`, category-ineligible content is blocked, and PDF and JSON contain only the selected recipient-appropriate projection.
8. Attempt to change handoff kind from Export. Confirm the flow returns to Purpose, increments or reflects a new case revision through state, and does not generate the newly selected kind until the gate is current again.
9. Complete blocked and ready flows by keyboard, then inspect them at 320 CSS pixels and 200 percent zoom. Confirm blocker focus, tabs, selection, labels, preview, and download controls remain operable and semantic content does not depend on a PDF canvas.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add export experience and local renderers`

## 15. Handoff requirements

Return a self-contained handoff containing:

- `Task: TASK-022, Export experience and local renderers` and outcome `Complete`, `Partial`, or `Blocked`.
- Every changed path, listed exactly.
- The blocked, remediation, selection, preview, generation, download, and parity behavior now observable.
- Confirmation that one manifest, one run, reviewed and redacted content only, no override, purpose binding, minimum necessity, four labels, local-only download, no PDF/UA claim, and no external transmission invariants were preserved.
- Each acceptance criterion with its result.
- Each required command and manual check with `PASS`, `FAIL`, or `NOT RUN` and a reason for any unrun check.
- The manifest ID, reviewed-state hash, run ID, included candidate IDs, and parity result used for renderer verification, without including source text or identifiers.
- Any export-core, state, fixture, trust, renderer, accessibility, or parity blocker requiring coordinator action.
- The commit hash only if commit permission was present and used; otherwise `Not committed`.

## 16. Stop conditions

Stop and notify the coordinator if:

- Any dependency is not integrated, the canonical gate or manifest interface is absent, or the base fails existing verification.
- The task graph and this packet disagree about title, dependencies, owned paths, or verification commands.
- Completing the experience requires editing the export core, state reducer, review engine, purpose route, redaction logic, fixture, trust feature, contract, shell, UI primitive, package file, test configuration, or another unowned path.
- A blocker, manifest field, export label, fixture expectation, run-provenance rule, handoff-kind rule, or PII policy conflicts with a higher-authority document.
- A new dependency, server renderer, storage service, route, environment variable, provider behavior, cloud setting, or deployment change appears necessary.
- The implementation would bypass a gate, infer inclusion in a renderer, merge runs, show unmasked or unreviewed material, generate formats from different snapshots, transmit an export, or claim unsupported accessibility, legal, privacy, or production properties.
- Any real or private data, credential, private URL, raw provider diagnostic, unnecessary identifier, or unsupported claim appears.
- Verification reveals an upstream export-core, state, review, redaction, fixture, or shared-UI defect. Report the smallest safe reproduction and do not patch the dependency from this task.
