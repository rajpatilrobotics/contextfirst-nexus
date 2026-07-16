# TASK-031: Audit and guidance truth bridge

## 1. Task metadata

- Task ID: TASK-031
- Stage: integration bridge
- Status: Ready
- Wave: bridge before TASK-022 and TASK-023 resume
- Risk: high
- Suggested branch: `task/031-audit-guidance-truth`
- Depends on: TASK-003, TASK-009, TASK-010, TASK-016, TASK-026, TASK-027, TASK-030
- Graph outcome: Restore exactly-once safe canonical audit events for export, unsafe-output reporting, and reset commands, and rebuild the six-card guidance pack from the registered official primary sources without inventing evidence or legal conclusions.

## 2. Goal

Correct the remaining truth and provenance gaps at the central state and guidance boundaries. Every covered state command must append exactly one safe canonical audit event through the existing state owner, while the six guidance cards must reproduce the registered official-source metadata and verified short passages with a deterministic pack digest.

## 3. Why this task exists

The integrated central reducer still suppresses or mishandles required audit events for export-gate evaluation, export creation, unsafe-output reporting, and case reset. Separately, the integrated guidance pack contains placeholder content and `example.org` URLs rather than the six official primary sources already frozen in `docs/SOURCE_REGISTER.md`. TASK-022 and TASK-023 must not build export or trust presentation on those incorrect upstream records.

This is a bounded dependency-ordered bridge. It must repair the existing canonical state and guidance owners without adding a second audit mechanism, changing export truth, fabricating evaluation evidence, or turning guidance into case evidence or legal advice.

## 4. Dependencies and base requirement

- TASK-003 must be integrated and provide the guidance generator, six-card pack, guidance loader, and guidance tests.
- TASK-009 must be integrated and provide canonical export-gate and manifest behavior used by state commands and the focused export-core regression suite.
- TASK-010 must be integrated and provide the central `CaseState` reducer, commands, audit history, idempotency, reset behavior, export lifecycle, and state tests.
- TASK-016 must be integrated and provide the genuine deterministic evaluation and admission-report artifacts whose truth must not be altered or embellished.
- TASK-026 must be integrated and provide the fail-closed static provider-admission handoff whose evidence must remain unchanged.
- TASK-027 must be integrated and provide the shared state dispatcher, export contract bridge, audit-safe manual citation resolution, and current export provenance behavior.
- TASK-030 must be integrated and provide renewed-review reconciliation plus audited non-material source reveal through the canonical state owner.
- Start from the pushed coordinator baseline on which TASK-031 is Ready and TASK-022 and TASK-023 are blocked by it.
- Use only existing contracts and installed dependencies. Do not change evaluation artifacts, provider admission, shared contracts, package files, routes, UI, or deployment configuration.

## 5. Required context

Read these sources before editing, in this order:

1. `AGENTS.md` in full.
2. `tasks/TASK-031.md` in full.
3. `PLANS.md` in full.
4. The TASK-031 entry and TASK-003, TASK-009, TASK-010, TASK-016, TASK-022, TASK-023, TASK-026, TASK-027, and TASK-030 entries in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/CONTRACTS.md`: the complete `AuditEvent`, `AuditEventType`, `CaseCommand`, `CaseState`, `ExportGate`, `ExportManifest`, `UnsafeOutputReport`, `GuidanceCard`, guidance-pack digest, idempotency, reset, and canonical JSON sections.
7. `docs/SOURCE_REGISTER.md`: the complete registered entries for INT-002, INT-004, HR-002, IND-001, FC-002, and SEC-001, including issuer, title, date or version, allowed use, limitation, URL, locator, and last-verified date.
8. `docs/SAFETY_AND_DATA.md`: audit minimization, unsafe-output reporting, guidance separation, legal-verification, provenance, and safe-summary requirements.
9. `docs/ARCHITECTURE.md`: central state, audit, export, fixtures, guidance, and deterministic-generation sections.
10. `docs/PRODUCT_SPEC.md`: export, Trust, Safety Lab, guidance, audit, and unsafe-output-reporting requirements.
11. `docs/DEMO_AND_FIXTURES.md`: canonical export flow, audit history, guidance, and fixture-integrity sections.
12. `docs/TESTING_AND_EVALUATION.md`: state, export, guidance, deterministic fixture, safety, and regression requirements.
13. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4 through 9, 12, 13, and 16.
14. `tasks/TASK-003.md`, `tasks/TASK-009.md`, `tasks/TASK-010.md`, `tasks/TASK-016.md`, `tasks/TASK-026.md`, `tasks/TASK-027.md`, and `tasks/TASK-030.md`, with attention to original ownership and frozen invariants.
15. The current contents and Git status of every path in Section 6.

## 6. Exclusive write scope

- `lib/state/index.ts`
- `scripts/generate-synthetic-fixtures.mjs`
- `fixtures/guidance/guidance-pack.json`
- `lib/guidance/index.ts`
- `tests/unit/state/case-state.test.ts`
- `tests/unit/guidance/`

No other path may be created, edited, renamed, generated, moved, or deleted by this task.

## 7. Dependency-ordered ownership transfer

The coordinator explicitly transfers corrective ownership as follows:

- From TASK-010 and its later bridges TASK-027 and TASK-030 to TASK-031: `lib/state/index.ts` and `tests/unit/state/case-state.test.ts` for the audit corrections and focused state regressions only.
- From TASK-003 to TASK-031: `scripts/generate-synthetic-fixtures.mjs`, `fixtures/guidance/guidance-pack.json`, `lib/guidance/index.ts`, and `tests/unit/guidance/` for the registered-source guidance rebuild, deterministic digest, validation, and focused tests only.
- TASK-009's `tests/unit/export/core/` remains read-only verification context. TASK-031 may run that suite but may not edit export-core production or test files.
- TASK-016 and TASK-026 artifacts remain read-only truth inputs. TASK-031 must not rewrite evaluation evidence, admission reports, static admission, or provider selectability.

All seven dependencies are integrated and must not be active while TASK-031 runs. This is a bounded transfer, not concurrent shared ownership. Preserve every unrelated behavior established by the original owners.

## 8. Read-only context allowed

- `lib/contracts/`
- `lib/export/core/`
- `tests/unit/export/core/`
- `lib/evaluation/`
- `fixtures/evals/results/`
- `lib/ai/server/admission.ts`
- `fixtures/cases/`
- `fixtures/replay/`
- `docs/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- The dependency packets listed in Section 5

Read-only inspection does not grant permission to repair, regenerate, reformat, or modify these paths. `docs/SOURCE_REGISTER.md` is authoritative and read-only. If a verified source-register error is discovered, stop and report it before proposing any register change.

## 9. Required audit corrections

### 9.1 Export-gate evaluation

- Every successful `evaluate_export_gate` command must append exactly one canonical audit event.
- Use `export_gate_evaluated` when the resulting gate is ready and `export_blocked` when blockers remain.
- Preserve the current gate calculation, blocker set, case-revision binding, stale-state handling, provenance, and non-material revision behavior.
- The event must describe only the safe event type, stable IDs, and an allowlisted reason code. It must contain no source text, quote, identifier, purpose narrative, provider content, prompt, secret, or raw diagnostic.

### 9.2 Export creation

- Every successful `create_export` command must append exactly one safe `export_created` audit event.
- Preserve export-gate enforcement, manifest correctness, minimum-necessary selection, revision behavior, export identity, and provenance.
- Existing command idempotency must prevent a duplicate command from adding a second export or second audit event.

### 9.3 Unsafe-output reporting

- Every successful `report_unsafe_output` command must append exactly one safe `unsafe_output_reported` audit event.
- Preserve the existing safe-category and entity-ID boundary, local-only behavior, report persistence, and non-material revision behavior where applicable.
- Existing command idempotency must prevent duplicate reports and duplicate audit events.
- The audit event must not contain pasted content, source text, exact quotes, identifiers, prompt text, model bodies, free-text sensitive details, or raw diagnostics.

### 9.4 Case reset

- Every successful `reset_case` command must return the new initial state with exactly one safe `case_reset` audit event appended to that new state.
- Preserve reset cleanup, initial-state correctness, persistence behavior, case identity rules, revision rules, and removal of prior case material.
- The reset event must not copy prior source, candidate, citation, purpose, provider, report, export, or sensitive content into the new state.
- Existing idempotency protection must reject a duplicate reset command without a duplicate event or additional mutation.

### 9.5 Canonical audit ownership and safety

- Use the existing central reducer, command dispatcher, safe-summary policy, and canonical `commit` or equivalent state boundary.
- Do not create a feature-local audit append, second audit owner, alternate state collection, direct UI-owned log, or parallel persistence path.
- Audit summaries may contain only safe event types, stable IDs, and allowlisted reason codes.
- Each covered successful command appends exactly one required event—never zero and never more than one.
- Preserve unrelated command validation, revision increments, non-material behavior, gate and manifest correctness, replay, persistence, reset, reporting, source reveal, review, and export behavior.

## 10. Required guidance corrections

### 10.1 Canonical six-card set

- Rebuild all six guidance cards from the authoritative registered entries in `docs/SOURCE_REGISTER.md` in this exact preserved order:
  1. INT-002
  2. INT-004
  3. HR-002
  4. IND-001
  5. FC-002
  6. SEC-001
- Preserve exactly six cards and `localLegalVerificationRequired: true` for every card.
- Use the exact registered issuer, title, date or version, allowed use, limitation, official URL, and last-verified date for each source.

### 10.2 Primary-source verification

- Verify each short passage and precise locator against the official primary source already registered.
- Do not invent, reconstruct from memory, paraphrase as a direct quote, or silently expand a quotation.
- Keep every direct excerpt short and within the registered allowed-use boundary.
- Remove every `example.org` URL and every generic placeholder passage from generated and runtime guidance data.
- If an official primary source cannot be accessed or the registered metadata conflicts with it, stop and report the exact source ID and discrepancy. Do not guess and do not edit `docs/SOURCE_REGISTER.md`.

### 10.3 Guidance boundary and deterministic digest

- Guidance remains separate from case evidence, candidate support, factual corroboration, domestic legal conclusions, eligibility decisions, certification, endorsement, or individual advice.
- Preserve canonical `GuidanceCard` validation and deterministic generation.
- Recompute the complete guidance-pack digest deterministically from the canonical guidance-pack projection after the six cards are corrected.
- Repeated generation and `--check` must reproduce byte-equivalent canonical content and the same lowercase digest.
- Object insertion order or filesystem enumeration must not affect the digest; the six-card array order remains contract-significant and preserved.
- Do not change case fixture, evaluation, replay, provider-binding, or approved-redacted-input digests.

## 11. Required regression tests

Add focused tests proving:

- A ready `evaluate_export_gate` command appends exactly one safe `export_gate_evaluated` event.
- A blocked `evaluate_export_gate` command appends exactly one safe `export_blocked` event with the real gate and blockers unchanged.
- `create_export` appends exactly one safe `export_created` event and preserves the canonical manifest and gate requirements.
- `report_unsafe_output` appends exactly one safe `unsafe_output_reported` event and preserves local report data within its allowlisted boundary.
- `reset_case` returns the new initial state with exactly one safe `case_reset` event and no prior sensitive case material.
- Revision behavior remains material or non-material exactly as required for each command.
- Replaying each covered command ID through existing idempotency protection cannot duplicate events, exports, reports, or reset effects.
- Every covered audit summary contains only the allowed event type, stable IDs, and allowlisted reason code and excludes source content, quotes, identifiers, prompt or provider bodies, secrets, and raw diagnostics.
- Existing export gate, manifest, source reveal, review, persistence, and unrelated reducer behavior remain passing.
- The guidance pack contains exactly the six required IDs in the preserved order.
- Each guidance card exactly matches the corresponding registered issuer, title, date or version, allowed use, limitation, official URL, and last-verified date.
- No guidance URL uses `example.org`, no placeholder passage remains, and each short passage and locator is non-empty and bound to the registered official source.
- Every card requires local legal verification and remains structurally separate from case evidence and domestic legal conclusions.
- The guidance-pack digest recomputes exactly from the canonical projection, is stable across generation and insertion-order permutations, and changes when a bound guidance field changes.
- The canonical fixture, approved-redacted-input, evaluation-definition, evaluation-result, and provider-admission artifacts remain unchanged.

## 12. Out of scope

- Editing shared contracts, export-core production or tests, evaluation code or artifacts, provider admission or registry, source register, case fixtures, replay, routes, components, Trust UI, Export UI, package files, environment files, configuration, or deployment files.
- Adding an audit event type, state owner, feature-local audit log, second dispatcher, new persistence store, new guidance card, new source, dependency, backend, network reporting action, provider call, or live evaluation.
- Weakening an export gate, fabricating a manifest, hiding a blocker, changing provider status, creating a failed Safety Lab result, or altering measured evidence.
- Treating guidance as evidence, domestic law, legal advice, certification, endorsement, partnership, factual corroboration, or an individual conclusion.
- Broad refactoring, optional cleanup, production hardening, cloud changes, credentials, or real/private data.

## 13. Implementation steps

1. Confirm the worktree is clean, based on the pushed TASK-031 documentation baseline, and limited to Section 6 ownership.
2. Add focused failing state regressions for all four command families, exact event counts and types, safe metadata, revision behavior, gate/manifest preservation, and duplicate idempotency.
3. Make the smallest central reducer and safe-summary corrections so each covered successful command appends exactly one canonical event.
4. Compare the six registered source entries with the official primary sources and stop on any unresolved discrepancy.
5. Replace only the six owned guidance records and generator inputs with verified registered metadata, short passages, precise locators, and official URLs in the preserved order.
6. Recompute the deterministic guidance-pack digest through the existing generator and update the canonical runtime loader or validator only as required by the corrected pack.
7. Add the focused guidance regressions and confirm unrelated fixture and evaluation bindings remain unchanged.
8. Run every Section 15 command in order, inspect the complete diff for exclusive ownership and sensitive content, and prepare the handoff without committing unless explicitly authorized.

## 14. Acceptance criteria

- Each successful covered state command appends exactly one event of the required canonical type.
- Ready and blocked export-gate outcomes select the correct event type without changing gate truth.
- Export creation and unsafe reporting retain their real records, and duplicate commands cannot duplicate records or events.
- Reset produces a clean initial state containing exactly one safe reset event and no prior case material.
- Audit metadata contains only safe event types, IDs, and allowlisted reason codes through the existing central state owner.
- Material and non-material revision behavior, gate correctness, manifest correctness, replay, persistence, review, and source reveal remain intact.
- The guidance pack contains exactly INT-002, INT-004, HR-002, IND-001, FC-002, and SEC-001 in that order.
- Every required guidance field and official URL matches the registered and verified primary source; no `example.org` or placeholder passage remains.
- Direct excerpts are short, precise locators are present, and no quotation is invented.
- All cards require local legal verification and remain separate from evidence and domestic legal conclusions.
- The guidance-pack digest is canonical, deterministic, reproducible, and sensitive to bound-field changes.
- Only Section 6 paths change and every Section 15 command passes.

## 15. Verification commands

Run from the repository root in this exact order:

```text
node scripts/generate-synthetic-fixtures.mjs --check
npx vitest run tests/unit/state tests/unit/guidance tests/unit/export/core
npm run typecheck
npm run build
git diff --check
```

All five commands must pass. Do not run live evaluation or any provider command.

## 16. Manual checks

1. Inspect each covered command's before and after state. Confirm one required safe event, correct revision behavior, and no duplicate record or event.
2. Inspect reset output. Confirm prior case material is absent and the new initial state contains exactly one safe `case_reset` event.
3. Inspect safe summaries and metadata for source text, quotations, identifiers, prompt or provider content, secrets, and raw diagnostics; none may appear.
4. Compare all six cards field by field with `docs/SOURCE_REGISTER.md` and the official primary sources, including the passage locator and direct URL.
5. Confirm there are exactly six cards in the required order, all require local legal verification, and no `example.org` or placeholder passage remains.
6. Regenerate twice and confirm byte-equivalent pack output and an identical deterministic digest.
7. Confirm evaluation, provider admission, case, replay, package, environment, report, and deployment files are unchanged.

## 17. Commit and handoff

- Do not commit unless the worker prompt explicitly authorizes it and supplies or confirms the implementation commit message.
- Return every changed path, verification result, exact event behavior, guidance source IDs, digest result, source-verification limitation, and any stop condition.
- Report whether TASK-022 and TASK-023 can resume; only coordinator integration of TASK-031 satisfies their dependency.

## 18. Stop conditions

Stop and notify the coordinator if:

- Any dependency is not integrated, the task graph and packet disagree, the worktree is dirty before implementation, or an owned path overlaps active work.
- A required fix needs a contract, export-core, evaluation, provider, UI, package, configuration, deployment, or source-register edit.
- An official source is inaccessible, the registered source conflicts with the primary source, a passage or locator cannot be verified, or compliant short quotation requires invention.
- Correct audit behavior would require weakening a gate, changing a manifest, exposing sensitive data, adding a second audit owner, or bypassing idempotency.
- Any real/private data, credential, unsupported legal conclusion, fabricated evaluation state, provider call, live evaluation, or cloud change appears.
