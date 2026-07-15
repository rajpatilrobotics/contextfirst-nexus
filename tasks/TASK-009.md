# TASK-009: Export gate and canonical manifest

## 1. Task metadata

- Status: Pending until coordinator marks ready.
- Stage: domain.
- Wave: 6.
- Risk: high.
- Suggested branch: `task/009-export-gate-manifest`.
- Depends on: TASK-002, TASK-005, TASK-006, TASK-007, TASK-008.
- Graph outcome: Implement every export blocker, gate freshness, full and safe-share projections, minimum necessity, single-run provenance, and deterministic canonical JSON.

## 2. Goal

Implement the pure export policy that evaluates every frozen blocker and builds one deterministic, versioned `ExportManifest` for the Purpose-selected handoff only when the current reviewed state is eligible.

## 3. Why this task exists

The product must prevent unsupported, unreviewed, stale, over-broad, or insufficiently redacted content from entering a handoff. This task creates the deterministic safety boundary consumed later by the export interface and both local renderers.

## 4. Dependencies and base requirement

- TASK-002 must be integrated so all canonical TypeScript and Zod contracts are imported from `lib/contracts/`.
- TASK-005 must be integrated so page coverage and consequential coverage issues are available.
- TASK-006 must be integrated so masking revisions, minimum-necessary redaction, and leak-scan results are available.
- TASK-007 must be integrated so only exact or manually resolved citations can be exported.
- TASK-008 must be integrated so individual review state and dependency invalidation are authoritative.
- Start from the coordinator branch after all five dependencies are integrated. The opening coordinator prompt must identify the base revision. Stop if the dependency state or base revision is missing or inconsistent.
- Use only dependencies already installed by TASK-001. This task does not own dependency or shared configuration files.

## 5. Required context

Read these sources before editing, in this order:

- `AGENTS.md`: Full.
- `tasks/TASK-009.md`: Full.
- `PLANS.md`: Full.
- `TASK_GRAPH.yaml`: Full, with special attention to TASK-009 ownership and verification.
- `docs/CONTEXT_INDEX.md`: Full.
- `PROJECT_BRIEF.md`: Sections `Hero artifact: Charge-Coercion Nexus`, `Prototype scope`, `Product principles`, and `Strongest demo moment`.
- `docs/SAFETY_AND_DATA.md`: Full.
- `docs/CONTRACTS.md`: Full, especially Sections 2, 5 through 10, 14, 15, 18 through 21, 25, 26, and 27.
- `docs/ARCHITECTURE.md`: Sections 8.6, 8.7, 10, 11, and 12.
- `docs/PRODUCT_SPEC.md`: Sections 6, 7.11 through 7.14, 10, and 12.
- `docs/DESIGN_SYSTEM.md`: Sections 9.11 and 9.14.
- `docs/DEMO_AND_FIXTURES.md`: Sections 7 through 11, 13, 16, and 17.
- `docs/TESTING_AND_EVALUATION.md`: Sections 2, 4, 7.1, 7.4, 8.6, 10, 14.3, 19, 21, and 22.
- `decision-log.md`: DEC-004 through DEC-010, DEC-013, DEC-015, DEC-017, and DEC-024 through DEC-026.

## 6. Exclusive write scope

- `lib/export/core/`
- `tests/unit/export/core/`

No other path may be created, modified, renamed, generated, or deleted by this task.

## 7. Read-only context allowed

- `lib/contracts/`
- `lib/documents/`
- `lib/redaction/`
- `lib/citations/`
- `lib/review/`
- `lib/fixtures/`
- `lib/guidance/`
- `fixtures/cases/`
- `fixtures/evals/definitions/`
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- All authoritative Markdown documents listed in Section 5.

Read-only inspection does not grant permission to repair or reformat these paths.

## 8. Out of scope

- PDF or JSON download rendering, route UI, semantic previews, and remediation navigation owned by TASK-022.
- Case reducer, audit mutation, persistence, replay loading, or checkpoint behavior owned by TASK-010.
- Review, citation, coverage, masking, or guidance rule changes.
- Analysis route, provider adapters, provider registry, prompts, model evaluation, or live provider calls.
- Shared contract, fixture, package, lockfile, framework configuration, environment, deployment, billing, quota, or cloud changes.
- Any critical export-gate override or bulk-review shortcut.

## 9. Frozen contracts and invariants

- Use `ExportGate`, `ExportBlocker`, `ExportBlockerCode`, `ExportManifest`, `ReviewedExportStateHashProjection`, `ExportKind`, `ExportSelection`, `MinimumNecessarySelection`, `SafeShareRecipientCategory`, and related canonical types from `lib/contracts/`. Do not create local competing contracts.
- Evaluate all frozen blocker codes: `PURPOSE_INCOMPLETE`, `AUTHORITY_INVALID`, `DATA_ORIGIN_PROHIBITED`, `REVIEW_INCOMPLETE`, `CITATION_UNRESOLVED`, `COVERAGE_CONSEQUENTIAL`, `JURISDICTION_UNVERIFIED`, `DEPENDENCY_UNRESOLVED`, `MASK_REVIEW_INCOMPLETE`, `PII_CHECK_FAILED`, `PROCESSING_FAILED`, `SAFETY_VALIDATION_FAILED`, `ANALYSIS_RUN_STALE`, `GATE_EVALUATION_STALE`, `MINIMUM_NECESSITY_UNCONFIRMED`, and `OUTSIDE_STATED_PURPOSE`. `DATA_ORIGIN_PROHIBITED`, `JURISDICTION_UNVERIFIED`, and initial `PURPOSE_INCOMPLETE` are defensive pure-evaluator or precondition tests because the enabled P0 fixture is bundled synthetic and Purpose completion normally precedes an export gate record.
- One blocker is sufficient to make the gate `blocked`. P0 has no blocker override.
- Only active candidates with `reviewRequirement: "individual"` participate in review completeness. A withdrawn candidate is excluded, while each active reachable dependant invalidated by that withdrawal requires renewed review.
- A ready gate is evaluated for the current case revision and must match the successful active analysis run plus that run's immutable input-state provenance: Purpose Brief ID and revision, masking revision, ordered selected segment IDs, approved-redacted-input digest, fixture binding, ruleset version, and normalized `ExportSelection` with its canonical digest. `sourceCaseRevision` remains terminal-response provenance only and does not stale a run after legitimate review. Any change to an analysis input or selection makes the prior gate stale.
- Re-evaluating the gate with the same normalized selection and unchanged inputs is revision-stable. It must not increment case revision or make the gate stale merely by evaluating it. If a current export already exists for the same revision and digest, preserve the exact ready gate object referenced by the manifest, including ID and evaluated time. A safe-share selection with `confirmed: false` is valid input and must produce `MINIMUM_NECESSITY_UNCONFIRMED`. Outside-purpose recipient category mismatch, candidate ineligibility for the Purpose `intendedRecipientCategory`, and missing-closure selections are also valid blocked-gate inputs, producing `OUTSIDE_STATED_PURPOSE` or `DEPENDENCY_UNRESOLVED`. A changed structurally valid minimum-necessary selection is a material scope change owned by TASK-010: after normalization and structural validation, revision increments, current export pointers clear, and the new gate is created at the resulting revision. Structurally invalid selections mutate nothing. Reorder-equivalent selections are revision-stable. `create_export` never increments case revision; it uses the current ready gate revision for the export record, manifest, and exported revision.
- Every included positive candidate is `human_accepted` or `human_edited`, has valid required citations, has no unresolved consequential coverage issue and no open unknown-consequence issue in its dependency closure, and passed prohibited-conclusion checks. A reviewed consequential limitation remains blocking. Reviewed coverage limitations preserve their linked decision, original and reviewed consequence, and qualified limitation text in the manifest. Limitations, gaps, and unknowns remain explicitly qualified.
- `ExportManifest.schemaVersion` is `1.0.0`. Its handoff kind exactly matches the current Purpose Brief. Full practitioner and minimum-necessary safe-share handoffs are separate purpose-bound projections.
- Every included candidate, citation, gap, and review decision belongs to the same successful `AnalysisRun` recorded in `runManifest`. Never merge outputs from separate live or replay runs.
- Preserve exact selected-run provenance, including mode, provider, release configuration, requested and returned model, service tier, adapter, disclosure, provider-transmission state, prompt, request, response, fixture, ruleset, recovery, checkpoint provenance where applicable, and immutable input-state provenance.
- The manifest labels are exactly `AI-assisted, human-reviewed case-preparation draft.`, `Synthetic case.`, `Not legal advice.`, and `Local legal verification required.`
- Safe-share excludes raw documents, rejected or unreviewed candidates, hidden prompts, provider logs, unnecessary audit detail, and seeded identifiers. It preserves only the selected and closure-required active candidate or Nexus dependency projections whose fixture-authored `safeShareRecipientCategories` include the Purpose `intendedRecipientCategory`, plus allowed source IDs, review meaning, limitations, and the applicable strict context-gap response or explanation after final redaction and minimum-necessity checks.
- Guidance is never case evidence. Stale, mismatched, or unverified guidance cannot support a domestic legal claim.
- `reviewedStateHash` uses only the canonical `ReviewedExportStateHashProjection` version `1.0.0`: it binds all reviewed export content and excludes only manifest ID, hash, and generated time. Normalize exactly the frozen candidate, citation, coverage, gap, guidance, review, audit, blocker, ID-list, and label order before hashing. The same eligible reviewed state and normalized generation inputs produce byte-identical canonical JSON. Serialized output contains no `undefined`, unstable key ordering, or nondeterministic collection ordering.
- The model never generates the final manifest and cannot set gate readiness.

## 10. Implementation steps

1. Inspect the integrated canonical contracts and dependency module APIs, then identify the smallest export-core interfaces needed without changing upstream code.
2. Implement pure blocker evaluators with deterministic blocker IDs, entity links, plain messages, and remediation text.
3. Implement current-versus-stale gate evaluation against case, run, Purpose Brief, masking, guidance, processing, review, citation, coverage, dependency, safety, and minimum-necessity state.
4. Implement separate full-practitioner and minimum-necessary safe-share projections that select only eligible records from one active successful run.
5. Implement deterministic manifest hashing and canonical JSON serialization with stable ordering.
6. Add focused tests for every blocker, freshness transition, projection rule, single-run rule, required label, redaction rule, and golden fixture transition.
7. Run the exact verification commands, inspect the diff for unowned files and secrets, and prepare the required handoff.

## 11. Acceptance criteria

- Each of the 16 `ExportBlockerCode` values has a positive test that blocks export and a negative test that proves the blocker clears only when its exact condition is resolved. Defensive blocker tests for `DATA_ORIGIN_PROHIBITED`, `JURISDICTION_UNVERIFIED`, and initial `PURPOSE_INCOMPLETE` may use pure evaluator inputs or precondition outputs instead of claiming they are reachable from the valid enabled P0 case.
- A single blocker always returns `status: "blocked"`, `severity: "blocking"`, affected entity IDs, actionable message text, and remediation text, with no override path.
- A fully eligible current state returns a ready gate whose revision, run, Purpose Brief, masking, and ruleset fields match the source state.
- Purpose, mask, evidence, review, guidance, active-run, or minimum-necessity changes stale the old gate and prevent it from authorizing a manifest. `PROCESSING_FAILED` applies only to required pre-gate processing stages and excludes `safety_export_gate_checks` itself.
- Re-evaluating the same normalized gate is revision-stable. Creating an export from a current ready gate does not increment revision, and the export remains current only when its record, manifest, exported revision, and case revision match. Re-evaluating after a current export exists preserves the exact ready gate object referenced by the manifest.
- Initial structurally valid safe-share selection creates a gate without incrementing revision. Reorder-equivalent safe-share selection does not increment. A changed structurally valid selection increments revision before the new gate is created. Structurally invalid selection leaves state unchanged. Unconfirmed minimum necessity blocks readiness.
- The initial judged export attempt identifies `CAND-SENDER-0402` and `CAND-URG-INTERPRETER` as the exact unresolved entity blockers.
- With all initial individual review complete, the gate becomes ready. With `CAND-TASK-0402` withdrawn, it becomes blocked and invalidated dependants require renewed review. After the normative renewed review, it becomes ready again.
- The Step 3 manifest does not claim that the 2025-04-02 alleged communication was linked to an assigned task and retains the reviewed gap, withdrawal history, changed Nexus support, and any qualified coverage limitation with its original and reviewed consequence.
- Full and safe-share projections use the current Purpose-selected normalized `ExportSelection`. Creation rejects any selection or digest that differs from the ready gate, so a broader or substituted safe-share scope cannot use a prior gate.
- `MINIMUM_NECESSITY_UNCONFIRMED` is reachable and tested through a valid safe-share selection whose `confirmed` field is false. A ready safe-share gate requires `confirmed: true`, equality with the Purpose `intendedRecipientCategory`, and candidate eligibility for that category.
- A minimum-necessary safe-share selection includes the active candidate and Nexus dependency closure of every selected item. A selected dependency target or required citation cannot be omitted; the gate returns `DEPENDENCY_UNRESOLVED` with an omission limitation instead of creating a dangling relationship. A selected candidate or closure dependency outside the Purpose recipient category returns `OUTSIDE_STATED_PURPOSE`.
- Every manifest record resolves to one successful active run, and a mixed-run fixture fails closed.
- Safe-share output contains none of the declared seeded identifiers and contains no raw source text, hidden prompt, provider body, rejected item, or unnecessary audit detail.
- The four required labels and complete selected-run provenance are present in both handoff projections.
- Repeated serialization of the same normalized manifest is byte-identical and valid JSON with no `undefined` values.
- All tests remain synthetic and no file outside Section 6 changes.

## 12. Verification commands

```text
npx vitest run tests/unit/export/core
npm run typecheck
```

Both commands must pass. Do not weaken an assertion, remove a fixture, or hide a failure.

## 13. Manual checks

1. Using the golden fixture builders in the focused tests, evaluate the early state and confirm the blocker output names `CAND-SENDER-0402` and `CAND-URG-INTERPRETER` with direct remediation entity IDs.
2. Evaluate the fully reviewed state, withdraw `CAND-TASK-0402`, and confirm the old gate is stale and export is blocked until both reachable Nexus rows receive renewed review.
3. Build a full practitioner manifest and a separate safe-share manifest from their matching Purpose Briefs. Confirm their kinds differ while each PDF and JSON consumer would receive one canonical manifest for that handoff.
4. Inspect the safe-share canonical JSON for every seeded identifier in `docs/DEMO_AND_FIXTURES.md` Section 7 and confirm none is present.
5. Serialize the same normalized manifest twice and confirm the byte strings are identical.
6. Select one candidate or Nexus whose active dependency target is excluded from a safe-share selection. Confirm the gate returns `DEPENDENCY_UNRESOLVED`, names the safe entity IDs, and creates no manifest.
7. Select one candidate or Nexus whose safe-share category does not match the Purpose `intendedRecipientCategory`. Confirm the gate returns `OUTSIDE_STATED_PURPOSE`, names safe entity IDs, and creates no manifest.
8. After a current export exists, re-evaluate the same normalized selection. Confirm the existing manifest still references the exact same ready gate ID and evaluated time.
9. Inspect the final diff and confirm it contains only the two paths in Section 6 and no secret, raw provider response, real case data, or unsupported public claim.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `feat: add canonical export gate and manifest`

## 15. Handoff requirements

- Report `Task: TASK-009` and outcome as Complete, Partial, or Blocked.
- List every changed file under the two owned paths.
- Summarize blocker evaluation, freshness, manifest projection, single-run provenance, safe-share minimization, and canonical JSON behavior.
- State how export, review, citation, redaction, guidance, and provider-provenance invariants were preserved.
- Report each Section 12 command and its pass or fail result.
- Report every Section 13 manual check and its result.
- Identify any unrun check, blocker, assumption, or coordinator follow-up.
- Include a commit hash only when the opening prompt authorized a commit and the exact message was used. Otherwise report `Not committed`.

## 16. Stop conditions

Stop and report to the coordinator if:

- Any dependency is not integrated, the base revision is not identified, or an expected canonical contract or fixture is missing.
- Implementation requires a write outside Section 6, including a change to contracts, fixtures, review, citation, masking, guidance, state, UI, package, lockfile, or test configuration.
- A new dependency, environment variable, export kind, blocker code, fixture ID, provider rule, route, persistence behavior, or cloud setting appears necessary.
- The required behavior would weaken review, citation, coverage, jurisdiction, dependency, masking, PII, safety, minimum-necessity, freshness, or single-run gates.
- The fixture, contract, provider provenance, or required label conflicts with an authoritative document.
- A live provider call, credential, billing action, deployment change, or production setting would be required.
- Existing user changes overlap the owned paths and cannot be preserved safely.
