# TASK-029: Evaluation digest and runner wiring bridge

## 1. Task metadata

- Task ID: TASK-029
- Stage: integration bridge
- Status: Ready after the coordinator-owned packet and graph update are pushed.
- Wave: bridge before TASK-016 resumes.
- Risk: high.
- Suggested branch: `task-029-evaluation-digest-runner-bridge`.
- Depends on: TASK-001, TASK-003, TASK-011, TASK-018, TASK-028.
- Graph outcome: Correct all canonical evaluation digests, align the server-side definition-set binding, and point `npm eval` at the real TASK-016 harness entry without creating a placeholder harness or changing runtime provider admission.

## 2. Goal

Make every generated evaluation packet, control fixture, and definition-set digest exactly reproducible from the frozen contract projections; bind the AI boundary to the regenerated artifact; prepare the package script to invoke the real TASK-016 evaluation harness once TASK-016 creates it; and narrowly repair the pre-existing TypeScript typing in two TASK-018 tests without changing their behavior or any production code.

## 3. Why this task exists

TASK-016 preflight confirmed three digest-projection defects and one runner-wiring defect. Packet digests currently add fields outside `EvaluationInputPacketDigestProjection`, control fixtures hash only `controlPayload`, the definition-set digest uses the wrong projection shape and normalization, and `npm eval` points at an empty test path with `--passWithNoTests`. TASK-029 preflight also exposed pre-existing TypeScript failures in two integrated TASK-018 test files because fetch, transport-table, and purpose-save mocks infer signatures too loosely. The shared evaluation inputs and those test-only typing defects must be corrected before the evaluation harness can produce trustworthy verification evidence.

## 4. Dependencies and base requirement

- TASK-001 must be integrated and provide exclusive package-script ownership history and the installed verification toolchain.
- TASK-003 must be integrated and provide all 14 frozen evaluation definitions, canonical fixture binding, approved-redacted-input binding, generator, and generated definition artifact.
- TASK-011 must be integrated and provide the server-only AI boundary constant and shared-AI regression suite.
- TASK-018 must be integrated and provide the browser run controller, `RunControllerOptions`, canonical Purpose form callback, and the two focused component tests transferred for typing repair.
- TASK-028 must be integrated and provide the latest canonical generator and fixture baseline while preserving source-content and provider bindings.
- Start from the coordinator branch after TASK-029 is marked Ready and its packet and graph update are pushed.
- TASK-016 remains blocked until TASK-029 is integrated and verified. TASK-019 and TASK-022 are independent and unchanged.
- Use only installed dependencies and frozen shared contracts. Do not run live evaluation, call a provider, or change admission/selectability.

## 5. Required context

Read these sources before editing, in this order:

1. `AGENTS.md` in full.
2. `tasks/TASK-029.md` in full.
3. `PLANS.md` in full.
4. The TASK-029 entry and TASK-001, TASK-003, TASK-011, TASK-016, TASK-018, and TASK-028 entries in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/CONTRACTS.md`: the canonical JSON rules and complete `EvaluationInputPacket`, `EvaluationInputPacketDigestProjection`, `EvaluationControlFixture`, `EvaluationControlFixtureDigestProjection`, `EvaluationDefinition`, `EvaluationDefinitionSetDigestProjection`, `EvaluationVariantId`, and `EvaluationAdmissionGateName` sections.
7. `docs/DEMO_AND_FIXTURES.md`: evaluation definition, fixture-binding, digest, and frozen variant sections.
8. `docs/TESTING_AND_EVALUATION.md`: deterministic harness, definition validation, canonical digest, admission evidence, and zero-network sections.
9. `docs/ARCHITECTURE.md`: evaluation, provider boundary, static admission, and runner sections.
10. `docs/MODEL_ROUTING.md`: frozen release binding and static admission sections.
11. `docs/SAFETY_AND_DATA.md` in full.
12. `docs/ORCHESTRATION_AND_INTEGRATION.md`: Sections 4 through 9, 12, 13, and 16.
13. `tasks/TASK-001.md`, `tasks/TASK-003.md`, `tasks/TASK-011.md`, `tasks/TASK-016.md`, `tasks/TASK-018.md`, and `tasks/TASK-028.md`, with attention to original ownership and frozen invariants.
14. The current contents and Git status of every path in Section 6.

## 6. Exclusive write scope

- `package.json`
- `scripts/generate-synthetic-fixtures.mjs`
- `fixtures/evals/definitions/`
- `lib/ai/server/types.ts`
- `tests/unit/fixtures/`
- `tests/unit/ai/shared/`
- `tests/components/provider/run-controller.test.ts`
- `tests/components/purpose/purpose-form.test.tsx`

No other path may be created, edited, renamed, generated, moved, or deleted by this task.

## 7. Dependency-ordered ownership transfer

The coordinator explicitly transfers corrective ownership as follows:

- From TASK-001 to TASK-029: `package.json` for the `eval` script only.
- From TASK-003 to TASK-029: `fixtures/evals/definitions/` and the evaluation-definition generation contract.
- From TASK-011 to TASK-029: `lib/ai/server/types.ts` and `tests/unit/ai/shared/` for the definition-set binding only.
- From TASK-018 to TASK-029: `tests/components/provider/run-controller.test.ts` and `tests/components/purpose/purpose-form.test.tsx` for the narrow test-only TypeScript repair only.
- From TASK-028 to TASK-029: `scripts/generate-synthetic-fixtures.mjs` and `tests/unit/fixtures/`.

TASK-001, TASK-003, TASK-011, TASK-018, and TASK-028 are integrated and must not be active while TASK-029 runs. This is a bounded ownership transfer for digest, runner wiring, and the two test-only typing repairs, not concurrent shared ownership.

## 8. Read-only context allowed

- `lib/contracts/`
- `lib/fixtures/`
- `fixtures/cases/cfn-demo-001.json`
- `fixtures/evals/results/`
- `lib/ai/server/admission.ts`
- `lib/ai/server/registry.ts`
- `lib/ai/server/canonical-input.ts`
- `lib/ai/server/evaluation-entry.ts`
- `features/analysis/run-controller/`
- `features/purpose/`
- `scripts/run-evaluation.mjs` if it exists after TASK-016; TASK-029 must not create or edit it.
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- The authoritative documents and packets listed in Section 5.

Read-only inspection does not grant permission to repair, reformat, generate, or modify these paths.

## 9. Canonical digest requirements

### 9.1 Evaluation packet digest

- For each of the 14 strict `EvaluationInputPacket` values, create `EvaluationInputPacketDigestProjection` by omitting only `packetDigest` from that packet.
- Compute `packetDigest` as lowercase SHA-256 of the UTF-8 canonical JSON encoding of exactly that projection.
- Do not add `canonicalFixtureDigest`, a second `variantId`, a control scenario, an opaque source-packet field, or any other field outside the packet projection.
- Recursively sort object keys by Unicode codepoint. Preserve every array in its contract-required order, especially `selectedSegmentIds`.
- Recomputing the projection from the generated artifact must reproduce each stored digest exactly.

### 9.2 Control-fixture digest

- For every deterministic control scenario, create `EvaluationControlFixtureDigestProjection` by omitting only `controlFixtureDigest` from the complete `EvaluationControlFixture`.
- Compute `controlFixtureDigest` as lowercase SHA-256 of the UTF-8 canonical JSON encoding of that complete projection.
- The digest must bind `schemaVersion`, control fixture ID and version, the complete branch-valid `controlInput`, and the complete non-empty `controlPayload`.
- Do not hash `controlPayload` alone and do not omit, rebuild, reinterpret, or duplicate any control-fixture field.
- Recomputing the projection from the generated artifact must reproduce every stored control-fixture digest exactly.

### 9.3 Evaluation-definition-set digest

- Normalize all 14 strict definitions and compute `evaluationDefinitionSetDigest` from exactly:

```json
{
  "schemaVersion": "1.0.0",
  "definitions": "normalizedDefinitions"
}
```

- `definitions` is the normalized definition array, not a `variants` property and not the complete outer generated artifact.
- Use the declared `EvaluationVariantId` order: `EVAL-001`, `EVAL-002`, `EVAL-003`, `EVAL-004`, `EVAL-005A`, `EVAL-005B`, `EVAL-006`, `EVAL-007`, `EVAL-008`, `EVAL-009`, `EVAL-010`, `EVAL-011`, `EVAL-012A`, `EVAL-012B`.
- Within each definition:
  - Preserve the frozen `selectedSegmentIds` order.
  - Sort `expectedChecks` by `name`.
  - Sort `gateNames` by declared `EvaluationAdmissionGateName` order.
  - Sort `requiredControlScenarios` by `scenarioId`.
  - Preserve `requiredRepetitions` tuple order.
  - Preserve `allowedTerminalStatuses` declaration order.
- Recursively sort every object key by Unicode codepoint while preserving the normalized array orders above.
- Filesystem enumeration and object insertion order must not affect the digest. Reordering a contract-significant preserved array is a bound-field change and must change or invalidate the digest.

## 10. Regeneration and frozen bindings

- Regenerate all 14 packet digests, every control-fixture digest, and the final definition-set digest in `fixtures/evals/definitions/` through the canonical generator.
- Preserve `canonicalFixtureDigest` exactly as `ede4457873700cc4bce1bb5fad29c89a4e25d2e6ca7ccd33c323a2ce8ac5809c`.
- Preserve `approvedRedactedInputDigest` exactly as `430b6bd635d101340c52c41e65d66b55c8d443fbff4a252748dab504845e18ee`.
- Preserve all 14 definitions' substantive fields, variant membership, split, expected values, control payloads, fixture identity/version, selected segment order, execution requirements, repetitions, execution sources, transmission expectations, and allowed terminal statuses.
- Do not change source PDFs, source segments, canonical review definitions, guidance, replay/checkpoint data, prompt/schema/ruleset versions, release configurations, provider fixture binding, or evaluated provider evidence.

## 11. AI-boundary alignment

- Update only `EVALUATION_DEFINITION_SET_DIGEST` in `lib/ai/server/types.ts` to the newly generated canonical definition-set digest.
- Add a focused shared-AI test that imports the generated evaluation artifact and proves exact equality with the AI-boundary constant.
- Preserve `CFN_DEMO_FIXTURE_BINDING`, all provider release configurations, registry order, disclosures, admission records, environment behavior, and fail-closed selectability.
- Do not edit `lib/ai/server/admission.ts`, mark an evaluation passed, admit a release, or make any provider selectable.

## 12. npm evaluation wiring

- Change only the `eval` script in `package.json` to exactly:

```text
node scripts/run-evaluation.mjs
```

- Remove `tests/evals` and `--passWithNoTests` from the script.
- Do not create `scripts/run-evaluation.mjs`, a fake harness, a placeholder success result, an empty artifact, or a test-only substitute. TASK-016 exclusively creates the real runner after TASK-029 integrates.
- Do not run `npm run eval` during TASK-029 because the real TASK-016 runner does not yet exist. TASK-029 verifies the exact wiring structurally; TASK-016 verifies execution.
- Do not edit `package-lock.json` or any other package script.

## 13. Required regression tests

Add focused tests proving:

- All 14 packet digests recompute exactly from the complete packet with only `packetDigest` omitted.
- Every deterministic control-fixture digest recomputes exactly from the complete control fixture with only `controlFixtureDigest` omitted.
- The definition-set digest recomputes exactly from `{ schemaVersion: "1.0.0", definitions: normalizedDefinitions }`.
- Permuting object insertion order, definition input order before normalization, expected-check input order, gate input order, or control-scenario input order does not change canonical results.
- Changing any bound packet field, complete control-input or control-payload field, definition field, or contract-significant preserved array changes the applicable digest or fails validation.
- The AI-boundary definition-set constant exactly equals the generated artifact.
- `package.json` targets `node scripts/run-evaluation.mjs` and contains neither `tests/evals` nor `--passWithNoTests` in the `eval` script.
- Tests use an independent canonical recomputation path or explicit projection helpers whose behavior is exercised for key order and bound-field sensitivity; they must not merely compare a value to itself.

### 13.1 Narrow TASK-018 test-typing repair

- In `tests/components/provider/run-controller.test.ts`, give every fetch mock the exact non-null `RunControllerOptions["fetchImpl"]` signature so `RequestInfo | URL`, optional `RequestInit`, the request body, and the `Promise<Response | null | undefined>` result are safely typed.
- Type the transport-failure table explicitly with the canonical transport reason type and exact fetch callback type so its async callbacks do not infer recursive or implicit `any`.
- Preserve the existing start-before-POST, one-request, request-body privacy, terminal-union mapping, transport-failure, no-invented-run, pending-state, and replay assertions.
- In `tests/components/purpose/purpose-form.test.tsx`, give each `onSave` mock the exact `CasePurposeBrief` callback signature accepted by `CasePurposeBriefFormProps`.
- Prove the expected mock call exists before accessing its captured `CasePurposeBrief`; use a safe guard or equivalent typed narrowing rather than unchecked indexed access.
- Preserve every existing Purpose form submission, exclusion, acknowledgement, identity, creation-time, revision, release-change, and accessibility expectation.
- Do not use explicit or implicit `any`, `@ts-ignore`, `@ts-expect-error`, assertion removal, expectation weakening, unsafe mock-call access, production-code edits, or unrelated test rewrites.
- Keep every original TASK-029 digest, regeneration, AI-boundary, and `npm eval` requirement unchanged.

## 14. Out of scope

- Creating or implementing the TASK-016 evaluation harness, runner, evidence, admission reports, result artifacts, live guard, or provider calls.
- Editing `scripts/run-evaluation.mjs`, `lib/evaluation/`, `fixtures/evals/results/`, `tests/unit/evaluation/`, provider adapters, admission records, registry, route, prompt, contracts, package lockfile, or shared configuration.
- Editing `features/analysis/run-controller/`, `features/purpose/`, or any other production path to accommodate test typing.
- Changing runtime admission status, selectability, provider order, model or release identity, disclosure, inference settings, fixture binding, environment values, credentials, billing, quota, deployment, or cloud configuration.
- Changing canonical fixture or redacted-input digests, substantive evaluation definitions, expected answers, split, denominator, control behavior, or failure visibility merely to make a digest or later evaluation pass.
- Adding a dependency, fake runner, placeholder output, aggregate score, broad cleanup, optional refactor, or production hardening.

## 15. Implementation steps

1. Confirm the worktree is clean and based on the pushed TASK-029 documentation baseline; record all current digest and package-script values.
2. Implement explicit canonical projection helpers and normalization in the generator without changing substantive definitions.
3. Regenerate the owned evaluation-definition artifact and verify frozen fixture and redacted-input digests remain exact.
4. Update the one AI-boundary digest constant to the regenerated definition-set value.
5. Change only the package `eval` script to the exact TASK-016 runner command.
6. Add the digest regressions in Section 13 under the original owned unit-test paths.
7. Apply only the Section 13.1 type annotations and safe mock-call narrowing in the two transferred TASK-018 test files, preserving every existing behavior assertion.
8. Run only the exact Section 17 verification, inspect the owned-path diff, and prepare the handoff.

## 16. Acceptance criteria

- Every packet, control fixture, and definition-set digest is canonical, reproducible, lowercase SHA-256, insertion-order independent where normalization applies, and sensitive to every bound field.
- Packet projections omit only `packetDigest`; control-fixture projections omit only `controlFixtureDigest`; the set projection is exactly `{ schemaVersion, definitions }`.
- All 14 definitions remain substantively unchanged and in the frozen declared variant order after normalization.
- Canonical fixture and approved-redacted-input digests remain unchanged.
- The AI-boundary definition-set constant exactly matches the generated artifact without changing admission or selectability.
- `npm eval` points exactly to the future TASK-016 runner and contains no empty-test success bypass.
- Both transferred TASK-018 tests use exact production callback signatures, safely narrow captured calls, contain no `any` or suppression, and preserve all existing expectations without production changes.
- No fake runner or placeholder result exists.
- Only Section 6 paths change and every Section 17 command passes.

## 17. Verification commands

```text
node scripts/generate-synthetic-fixtures.mjs --check
npx vitest run tests/unit/fixtures tests/unit/ai/shared
npx vitest run tests/components/provider/run-controller.test.ts tests/components/purpose/purpose-form.test.tsx
npm run typecheck
npm run build
```

All five commands must pass. Do not run `npm run eval` or any live-provider command.

## 18. Manual checks

1. Confirm the diff contains only Section 6 paths and no lockfile, runner, result, admission, registry, contract, fixture-source, or configuration change.
2. Independently recompute all packet, control-fixture, and definition-set digests from the generated artifact and compare exact values.
3. Confirm the definition-set normalization uses declared enum order and the set projection property is `definitions`.
4. Confirm canonical fixture and approved-redacted-input digests are unchanged.
5. Confirm the AI-boundary constant equals the artifact and all admission/selectability values are unchanged.
6. Confirm `package.json` contains exactly the new `eval` command and no fake runner file was created.
7. Confirm the run-controller fetch mocks and transport table use the exact callback and reason types, and that request-body and transport assertions are unchanged.
8. Confirm the Purpose `onSave` mocks use the exact `CasePurposeBrief` callback and safely prove each captured call exists before access, with all original expectations unchanged.
9. Search the two transferred tests for `any`, TypeScript suppression comments, removed assertions, weakened expectations, or production-code workarounds. None may be present.
10. Inspect for credentials, real-person data, raw provider content, hidden passing results, aggregate scores, or unsupported provider claims. None may be present.

## 19. Commit permission and message

- Do not commit unless the coordinator explicitly authorizes the implementation commit.
- Exact implementation commit message: `fix: align evaluation digests and runner script`

## 20. Handoff requirements

- Report `Task: TASK-029` and outcome as Complete, Partial, or Blocked.
- List every changed file and confirm each is within Section 6.
- Report old/new packet, control-fixture, definition-set, and AI-boundary digest evidence plus unchanged canonical fixture and redacted-input digests.
- Report the exact `eval` script and confirm no runner or placeholder was created.
- Report the exact fetch, transport-table, and Purpose-save mock typing used, plus confirmation that the original test behavior and expectations remain unchanged.
- Report every Section 17 command and Section 18 manual check.
- Identify any unrun check, blocker, assumption, or coordinator follow-up.
- Include a commit SHA only if the coordinator authorized the exact Section 19 commit; otherwise report `Not committed`.

## 21. Stop conditions

Stop and report to the coordinator if:

- Any dependency is not integrated or the worktree is not based on the pushed documentation baseline.
- A correct digest requires a field, order, or projection that conflicts with the frozen contracts.
- Any canonical fixture, approved-redacted-input, source-content, provider-binding, substantive definition, expected answer, split, or denominator would change.
- Implementation requires any write outside Section 6, including the future runner, evaluation results, admission, registry, contracts, package lockfile, configuration, or provider code.
- Repairing the two transferred tests would require a production-code change, `any`, a TypeScript suppression, unsafe captured-call access, assertion removal, expectation weakening, or behavior change.
- A fake runner, placeholder result, empty-test bypass, live provider call, credential, billing action, or selectability change appears necessary.
- Existing user changes overlap an owned path and cannot be preserved safely.
- Verification exposes an unrelated failure that cannot be resolved inside the exclusive scope without broad refactoring or hardening.
