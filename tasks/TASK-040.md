# TASK-040: Managed server-side provider routing and safe fallback

## 1. Task metadata

- Task ID: TASK-040
- Stage: contracts and provider orchestration
- Status: Blocked until TASK-039 is integrated
- Wave: 15
- Risk: critical
- Suggested branch: `task/040-managed-provider-routing`
- Depends on: TASK-006, TASK-011, TASK-015, TASK-016, TASK-026, TASK-038, TASK-039
- Graph outcome: Reconcile the live-analysis contracts and architecture, then replace browser-selected live providers with bounded admission-gated server routing that accepts one result, records safe provenance, and never uses replay as a live fallback.
- Suggested implementation commit message: `feat: add managed provider routing`

## 2. Goal

Replace the legacy browser-selected live-provider request with one provider-neutral analysis intent and a server-managed attempt sequence. Preserve the public replay-only deployment and global live-analysis gate. This task does not evaluate, implement, admit, configure, call, or deploy Groq.

## 3. Dependencies and launch gate

- TASK-006 supplies approved redaction and leak scanning.
- TASK-011 supplies the shared AI boundary, canonical prompt, registry, and post-validation.
- TASK-015 supplies the stateless API route.
- TASK-016 supplies evaluation evidence structure.
- TASK-026 supplies reviewed fail-closed static admission.
- TASK-038 supplies the exact server live-analysis policy.
- TASK-039 must first remove practitioner-facing provider/model selection and integrate the simplified replay-only flow.
- Do not create this worktree or begin reconciliation until TASK-039 is integrated and the coordinator marks TASK-040 Ready.

## 4. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-040.md` in full.
3. `PLANS.md` in full.
4. The TASK-006, TASK-011, TASK-015, TASK-016, TASK-026, TASK-038, TASK-039, and TASK-040 graph entries.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md`: DEC-024 through DEC-029 and DEC-045.
7. `PROJECT_BRIEF.md`: Approved analysis-entry direction.
8. `docs/SAFETY_AND_DATA.md` in full.
9. `docs/CONTRACTS.md` in full, beginning with Section 1.1.
10. `docs/ARCHITECTURE.md` in full, beginning with Section 1.1.
11. `docs/MODEL_ROUTING.md` in full.
12. `docs/PRODUCT_SPEC.md`: Sections 1.1 and 7.3 through 7.5.
13. `docs/TESTING_AND_EVALUATION.md`: Sections 1.1, 7, 9, 12, 14, and 19.
14. `docs/SOURCE_REGISTER.md` only for already registered provider facts; do not infer unregistered Groq claims.
15. `docs/ORCHESTRATION_AND_INTEGRATION.md`: contract-change and DEC-045 sequencing rules.
16. Git status and the complete current contents of every Section 5 path.

## 5. Exclusive write scope

### Contract and architecture reconciliation

- `docs/CONTRACTS.md`
- `docs/ARCHITECTURE.md`
- `lib/contracts/index.ts`
- `tests/contracts/shared/contracts.test.ts`

### Server-managed routing

- `app/api/analyze/route.ts`
- `lib/ai/server/canonical-input.ts`
- `lib/ai/server/errors.ts`
- `lib/ai/server/managed-routing.ts`
- `lib/ai/server/orchestrator.ts`
- `lib/ai/server/recovery.ts`
- `lib/ai/server/request-policy.ts`
- `lib/ai/server/registry.ts`
- `lib/ai/server/types.ts`
- `lib/security/provider-boundary.ts`
- `lib/security/safe-logging.ts`

### Browser intent and focused verification

- `features/analysis/run-controller/index.ts`
- `features/purpose/purpose-workspace.tsx`
- `tests/contracts/api/analyze-route.test.ts`
- `tests/components/provider/run-controller.test.ts`
- `tests/components/purpose/purpose-workspace.test.tsx`
- `tests/unit/ai/orchestration/orchestrator.test.ts`
- `tests/unit/ai/orchestration/managed-routing.test.ts`
- `tests/unit/ai/shared/shared-ai-boundary.test.ts`
- `tests/unit/security/managed-routing-boundary.test.ts`

No other path may be created, edited, moved, renamed, generated, or deleted.

## 6. Ownership transfer

- The coordinator transfers `docs/CONTRACTS.md` and `docs/ARCHITECTURE.md` only for the mandatory DEC-045 contract-and-architecture reconciliation at the start of this task.
- TASK-002 transfers shared contract implementation and tests only for the approved DEC-045 versioned migration.
- TASK-011 transfers the listed shared AI and security boundary paths only for bounded managed routing.
- TASK-015 and TASK-038 transfer the API route and contract test only while preserving their same-origin, body-limit, no-store, safe-error, and exact live-policy behavior.
- TASK-039 transfers the run controller, Purpose workspace orchestration, and focused tests only after TASK-039 is integrated. Provider/model controls must not return.
- Provider adapters, static admission records, evaluation artifacts, Trust UI, packages, environment files, and deployment paths are not transferred.

## 7. Mandatory first phase: contract and architecture reconciliation

Before editing runtime code:

1. Replace the legacy browser-selected live request with a versioned provider-neutral analysis intent.
2. Define an ordered managed-attempt projection and safe terminal response/provenance without exposing raw provider details to browser controls.
3. Define exact eligible and forbidden fallback classifications, hard maximum attempts, unknown-remote-execution stop behavior, and one-accepted-result semantics.
4. Define static-admission freshness and mismatch failure, final provider/release provenance, safe attempt metadata, and consolidated disclosure semantics.
5. Keep replay and checkpoint contracts separate from live routing.
6. Update contract tests before changing orchestration.

If the architecture cannot be reconciled inside Section 5 without a package, adapter, admission, provider, fixture, or deployment change, stop and report the blocker.

## 8. Required routing behavior

### 8.1 Candidate order and admission

- The frozen live order is OpenAI, Gemini, Mistral, then a separately evaluated and admitted fourth provider.
- Groq `openai/gpt-oss-120b` is only the current evaluation candidate. Do not add a Groq adapter, SDK, registry release, provider enum, credential, admission record, provider call, or selectable option in this task.
- Every attempted release must be configured, enabled by the global server policy, and backed by a current exact reviewed static admission record.
- Missing, stale, mismatched, incomplete, failed, or unreviewed admission fails closed.
- `ENABLE_LIVE_ANALYSIS` remains authoritative. The public deployment remains replay-only.

### 8.2 Attempt isolation and final result

- Construct one canonical approved redacted input and preserve it unchanged across eligible attempts.
- Enforce a hard maximum attempt count no greater than the number of admitted candidates.
- Invoke candidates sequentially and stop immediately after one result passes the complete shared schema, citation, semantic, privacy, and prohibited-output validation.
- Return and activate only one accepted result. Never merge, vote, compare, repair, or combine provider outputs.
- Never retry with multiple keys, accounts, projects, or credentials to evade quota or spend limits.
- Preserve exact final provider, release, model, adapter, service tier, and validation provenance.

### 8.3 Eligible operational fallback

Advance only for:

- provider not configured;
- authentication failure confirmed before processing;
- quota exhausted;
- rate limited;
- confirmed temporary provider unavailability;
- confirmed request not executed.

### 8.4 Forbidden fallback

Stop immediately for:

- privacy or leak-scan failure;
- prohibited input;
- provider refusal;
- unsafe output or prohibited conclusion;
- invalid citation;
- semantic validation failure;
- malformed structured output;
- prompt-injection propagation;
- timeout or transport failure with unknown remote execution;
- partial or accepted output;
- any attempt to bypass a safety decision.

Replay is a separate local action and is never attempted by the live router.

### 8.5 Safe metadata and disclosure

- Record only allowlisted operational attempt metadata: stable local IDs, provider/release IDs, safe classification, admission identity/digest, timestamps, and whether transmission/execution/output acceptance is known.
- Never log source text, redacted text, quotes, identifiers, prompts, request bodies, raw provider errors, response bodies, keys, tokens, account/project details, or credentials.
- Trust, audit, and exports retain final provider/release provenance and safe attempt history.
- Practitioner UI retains one plain-language analysis action and a consolidated data-flow disclosure; it never renders routing controls or trusts query/client-selected provider values.

## 9. Required regression tests

- Frozen order is deterministic regardless of registry insertion order.
- Only current statically admitted releases enter the attempt set.
- Every eligible operational classification advances exactly as allowed.
- Every forbidden classification stops without another adapter call.
- Unknown timeout/transport execution stops the chain.
- Attempts receive the same canonical approved redacted input and isolated abort/control state.
- One accepted result aborts the sequence and no later provider is invoked.
- Outputs are never merged and failed/partial output never enters candidates or export state.
- Hard maximum attempts and single-credential behavior hold.
- Safe logs and attempt projections contain no forbidden content.
- Missing, stale, failed, or mismatched admission fails closed.
- Disabled global live analysis rejects before orchestration and preserves selectable replay.
- Browser intent contains no provider/model selector and cannot choose routing order.
- No test performs a real provider request.

## 10. Frozen invariants and forbidden changes

- Do not edit provider adapters, `lib/ai/server/admission.ts`, evaluation definitions/results, fixtures, prompts, Trust components, export/state/review code, package files, lockfiles, environment files, deployment configuration, Vercel settings, or TASK-025 release evidence.
- Do not add Groq runtime code, a fourth-provider enum/registry entry, an SDK, credentials, spend, calls, admission, or deployment behavior.
- Do not enable public live AI, change environment values, call any provider, deploy, change billing/quota/firewall, or access production.
- Do not weaken same-origin, body size, canonical-input, masking, leak scan, schema, citation, semantic, prompt-injection, safe-error, audit, review, export, or admission controls.
- Do not use replay as live fallback or describe it as live provider output.
- Do not add automatic SDK retries, parallel provider calls, hedging, multi-key rotation, output merging, or browser-selected routing.

## 11. Implementation steps

1. Confirm TASK-039 is integrated, TASK-040 is Ready, and the worktree is clean at the exact pushed baseline.
2. Complete Section 7 contract and architecture reconciliation and focused contract tests first.
3. Stop and inspect the reconciliation before modifying runtime code.
4. Add pure managed-routing policy and tests for order, admission, classifications, bounds, and safe metadata.
5. Connect canonical input, orchestrator, route, and browser intent without restoring provider controls.
6. Add API, component, security, and orchestration regressions.
7. Run Section 13 in order and inspect the complete diff against Section 5.
8. Stop before committing unless the worker prompt explicitly authorizes it.

## 12. Acceptance criteria

- Contracts and architecture truthfully describe provider-neutral browser intent and bounded server routing before runtime changes.
- Practitioner UI has no provider/model control.
- Live routing uses the frozen admitted order, one canonical input, bounded sequential attempts, one accepted result, and exact final provenance.
- Eligible operational failures alone may advance; all forbidden and unknown-execution failures stop.
- Replay never enters the live chain.
- Missing or stale admission and disabled live policy fail closed.
- No output merging, quota evasion, raw logging, provider call in tests, Groq runtime work, package change, or deployment occurs.
- Only Section 5 paths change and every verification passes.

## 13. Verification commands

Run from the repository root in this order:

```text
npx vitest run tests/contracts/shared tests/contracts/api
npx vitest run tests/unit/ai/orchestration tests/unit/ai/shared tests/unit/security/managed-routing-boundary.test.ts
npx vitest run tests/components/provider/run-controller.test.ts tests/components/purpose/purpose-workspace.test.tsx
npm run typecheck
npm run lint
npm run build
npm run verify
git diff --check
```

All checks must use mocks or deterministic local paths and make zero real provider requests.

## 14. Commit and handoff

- Commit only when the worker prompt explicitly authorizes it.
- Suggested implementation commit message: `feat: add managed provider routing`
- Report the contract version migration, exact routing order, classifications, maximum attempts, admission behavior, safe metadata projection, zero provider calls, complete verification, and all changed paths.
- Deployment, credentials, spend, Groq evaluation, provider calls, admission promotion, public live AI, and production reconciliation require separate future approval and work.

## 15. Stop conditions

Stop if TASK-039 is not integrated, the graph and packet disagree, the baseline is dirty, contract reconciliation requires an unowned path, a real provider call would be needed, Groq runtime behavior would be required, or any safety/admission/deployment boundary cannot remain fail closed.
