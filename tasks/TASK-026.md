# TASK-026: Static provider admission handoff

## 1. Task metadata

- Task ID: TASK-026
- Status: Pending. Only the coordinator may mark this task Ready after TASK-016 is integrated.
- Stage: providers
- Wave: 9
- Risk: high
- Suggested branch: `task/026-provider-admission`
- Depends on: TASK-016

## 2. Goal

Review the integrated TASK-016 provider admission reports and make the narrow version-controlled static handoff in `lib/ai/server/admission.ts` without changing cloud or provider accounts. Verify every evidence binding exactly, record failed or incomplete evidence conservatively, and keep every release non-selectable unless all required static evidence is present.

## 3. Why this task exists

Evaluation artifacts must not promote a provider automatically at runtime. A separate, reviewable handoff keeps evaluation generation independent from runtime admission, makes the accepted report identity and digest visible in version control, and prevents environment values, result-file changes, or provider responses from silently making a release selectable.

## 4. Dependencies and base requirement

- TASK-016 must be integrated with versioned `ProviderEvaluationAdmissionReport` artifacts, canonical report digests, complete gate evidence, exact release provenance, and its passing deterministic verification.
- TASK-011 is a transitive dependency through TASK-016 and must already provide the typed fail-closed static admission record and a registry that derives evaluation and selectability from it.
- This task receives exclusive ownership of `lib/ai/server/admission.ts` only after TASK-011 and TASK-016 are integrated. TASK-011 and TASK-026 must never be active concurrently, and no other task may edit that file during the handoff.
- The canonical admission, provider release, fixture binding, inference setting, evaluation report, and safe deployed-account availability contracts must be integrated and unchanged.
- Start from the coordinator branch after TASK-016 is integrated. The opening coordinator prompt must identify the base revision and the TASK-016 handoff. Stop if the dependency state or base revision is inconsistent.
- No cloud access, provider credential, account inspection, account setting change, live evaluation, provider request, billing action, or deployment action is required or permitted.

## 5. Required context

Read these sources before editing, in this order:

1. `AGENTS.md` in full.
2. `tasks/TASK-026.md` in full.
3. `PLANS.md` in full.
4. The TASK-026 entry in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `PROJECT_BRIEF.md`: Prototype scope, Product principles, and Success criteria.
7. `docs/SAFETY_AND_DATA.md`: Provider boundaries, secrets, logging, synthetic data, and public claims sections.
8. `docs/CONTRACTS.md`: Provider release, admission, fixture binding, option projection, evaluation result, and evaluation admission report sections.
9. `docs/ARCHITECTURE.md`: Server-only provider boundary, runtime configuration, evaluation, and deployment boundaries.
10. `docs/MODEL_ROUTING.md`: Frozen release registry, availability, evaluation, admission, Mistral restrictions, and recommendation rules.
11. `docs/TESTING_AND_EVALUATION.md`: Frozen evaluation sets, blocking gates, report artifacts, canonical digest, and admission handoff requirements.
12. `docs/DEMO_AND_FIXTURES.md`: Evaluation fixture register, versions, and exact bundled fixture binding.
13. `decision-log.md`: DEC-004, DEC-020 through DEC-029, DEC-036, DEC-042, DEC-043, and every coordinator-recorded evaluation or deployed-account availability fact for the exact releases.
14. The integrated TASK-016 handoff and every `ProviderEvaluationAdmissionReport` artifact under `fixtures/evals/results/`.
15. The current Git status and the current contents of every path in the Exclusive write scope.

## 6. Exclusive write scope

- `lib/ai/server/admission.ts`
- `tests/unit/ai/admission/`

No other path may be created, modified, renamed, generated, or deleted by this task.

## 7. Read-only context allowed

- `lib/ai/server/registry.ts`
- `lib/ai/server/types.ts`
- `lib/ai/server/index.ts`
- `lib/contracts/`
- `lib/evaluation/`
- `fixtures/evals/results/`
- `tests/unit/ai/shared/`
- `tests/contracts/api/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vitest.config.ts`
- `decision-log.md`
- All authoritative Markdown documents listed in Section 5.

These paths are evidence or verification context only. Do not edit a report, registry, contract, result, decision record, package file, or shared test to make admission pass. Never inspect `.env.local`, a credential store, provider console, cloud console, billing page, or account setting.

## 8. Out of scope

- Generating, editing, rerunning, repairing, or deleting evaluation definitions, results, admission reports, canonical report digests, expected answers, gate outcomes, or held-out evidence.
- Editing the runtime registry, provider adapters, orchestration, prompt, response schema, ruleset, fixture binding, environment template, state, route, UI, or deployment configuration.
- Loading evaluation reports dynamically at runtime, watching result directories, fetching an admission decision, or promoting a release from an environment value, credential, provider response, account probe, or test-only override.
- Inspecting or changing a provider account, model entitlement, service tier, training-use setting, retention setting, quota, billing, project, workspace, firewall, secret, or deployment setting.
- Making a live provider request, running live evaluation, enabling public live analysis, recommending a provider, comparing general provider quality, or changing provider order.
- Adding a dependency, environment variable, release, model, fixture, status, fallback, retry, tool, or external service.
- Recording secret values, account details, private endpoints, raw provider diagnostics, source text, prompts, model bodies, or real-person data.

## 9. Frozen contracts and invariants

- `lib/ai/server/admission.ts` is the version-controlled static runtime admission source for the three frozen live release configurations. It does not load or parse `fixtures/evals/results/` at runtime.
- The static record uses the canonical typed admission contract and preserves exact release IDs. Local `prepared-replay-v1` remains governed by its separate replay contract and cannot be promoted by a live-provider report.
- Review each versioned `ProviderEvaluationAdmissionReport` and recompute or verify its canonical digest using the integrated deterministic report rules before recording its identity.
- Exact matching is required for report ID, canonical digest, release configuration and requested model, adapter version, service tier, disclosure version, inference settings, fixture ID, fixture version, canonical fixture digest, evaluation-definition-set digest, evaluated-configuration digest, prompt version, response schema version, ruleset version, each strict evaluation definition, every required live-model and deterministic-control evidence record, and every blocking gate.
- A schema-valid complete report with any failed blocking gate maps that exact release to `evaluationStatus: failed` and preserves the exact report ID and digest as failed evidence.
- Missing, incomplete, stale, duplicate, unknown, internally inconsistent, or mismatched report evidence maps to `evaluationStatus: not_evaluated`, null report identity and digest, and a non-selectable release. It is never guessed, repaired, or treated as failed proof of a completed run.
- A release maps to `evaluationStatus: passed` only when one exact, schema-valid, complete report has a valid canonical digest, matches every frozen binding, derives every evidence and gate status correctly, contains three genuine transmitted live runs for every model-output definition, contains only exact declared deterministic controls for control definitions, and shows every required blocking gate passed.
- A passed Mistral evaluation is still non-selectable unless the static record also contains coordinator-recorded safe evidence that the exact `mistral-small-2603` release is available to the deployed account. Without that record, availability remains `not_verified` and selectability remains false.
- Mistral deployed-account evidence is accepted only from an already integrated coordinator record that contains the canonical safe status, evidence ID, and verification time. This task never opens an account console, tests entitlement, makes a request, or records account details.
- Environment enablement, model values, credentials, configuration state, result-file presence, provider responses, and runtime report loading cannot change evaluation status or selectability.
- The registry remains read-only and derives its public evaluation status and selectability from the static admission record only after exact report, admission, and registry evaluated-configuration projection equality and digest recomputation. Tests may verify that integration but cannot edit or replace registry behavior.
- Incomplete evidence is a valid fail-closed handoff outcome. This task may be Complete with `not_evaluated` records when it has reviewed the available evidence, preserved the reason in the handoff, and made no unsupported promotion.
- Admission records and tests contain only safe identifiers, versions, digests, statuses, and timestamps. They contain no credential, account detail, private URL, raw result body, source text, prompt content, provider diagnostic, or real-person data.

## 10. Implementation steps

1. Inspect Git status, the integrated static admission record, registry derivation, canonical contracts, TASK-016 handoff, report artifacts, and decision records. Stop only if safe fail-closed behavior cannot be represented within Section 6.
2. Validate every available report against the canonical `ProviderEvaluationAdmissionReport` contract and verify its report ID, version, canonical digest using the frozen algorithm, strict definition-set digest and sort rules, complete gate set, status derivation, and exact release, adapter, disclosure version, settings, evaluated-configuration digest, fixture, prompt, response schema, and ruleset bindings. Independently derive the expected evaluated configuration from the integrated registry and static admission configuration, recompute its digest, and compare it to the report field before accepting evidence.
3. Classify each live release independently: incomplete, mismatched, mock-for-live, wrong-control, or status-inconsistent evidence becomes `not_evaluated`, a complete report with any failed gate becomes `failed`, and only a complete exact all-pass report becomes `passed`.
4. For Mistral, inspect only already integrated coordinator-recorded safe availability evidence. Record `available` only when it matches the exact snapshot and required safe fields; otherwise retain `not_verified` or the exact recorded safe unavailable state and keep the release non-selectable.
5. Update only the typed static values in `lib/ai/server/admission.ts`. Do not add a runtime report reader, environment branch, provider probe, network path, or mutable admission API.
6. Add focused tests for exact report binding, canonical digest matching, evaluated-configuration digest equality across report, static admission, and registry projection, all-pass admission, failed-gate mapping, incomplete and mismatched fail-closed mapping, environment independence, no dynamic loading, registry derivation, and the additional Mistral availability gate.
7. Run the exact verification commands and inspect the final diff for unowned files, altered evidence, runtime loading, cloud or account behavior, secret material, and unsupported admission claims.

## 11. Acceptance criteria

- Every live release has one canonical typed static admission record with the exact frozen release configuration ID.
- Each recorded report reference matches the exact report ID and canonical digest and binds to the exact release, adapter, disclosure version, settings, evaluated-configuration digest, fixture, prompt, response schema, ruleset, and blocking-gate evidence.
- A complete report with any failed gate produces `failed`; missing, incomplete, stale, duplicate, unknown, mismatched, mock-for-live, wrong-control, or status-inconsistent evidence produces `not_evaluated`; only complete exact all-pass evidence produces `passed`.
- A `not_evaluated` fail-closed result is an acceptable Complete outcome when available evidence is incomplete. The handoff states the exact safe reason without inventing report evidence.
- OpenAI and Gemini selectability follows their exact static evaluation record plus the existing enabled, configured, fixture, origin, and disclosure gates.
- Mistral remains non-selectable unless its exact evaluation is passed and coordinator-recorded safe deployed-account availability is `available`. Missing availability evidence never becomes an entitlement or opt-out claim.
- The registry exposes evaluation and selectability derived from the static record and cannot be promoted by environment values, credentials, provider responses, dynamic report reads, or test overrides.
- No runtime module reads `fixtures/evals/results/`, and no mutable admission endpoint, watcher, loader, or background process exists.
- Tests detect a changed report ID, digest, release, adapter, disclosure version, setting, evaluated-configuration digest, fixture, prompt, schema, ruleset, definition-set digest, live-model provenance, control scenario, check-derived status, gate result, or Mistral availability record.
- No report, registry, contract, decision record, environment file, package file, cloud setting, provider account, or file outside Section 6 changes.
- All tests use committed synthetic artifacts and safe metadata. No live provider call, credential, account inspection, or external access occurs.

## 12. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/unit/ai/admission tests/unit/ai/shared tests/contracts/api
npm run typecheck
npm run build
```

All three commands must pass. Do not weaken a report check, alter evidence, add an environment override, or hide a non-selectable result.

## 13. Manual checks

1. Inspect every static live-release record and confirm its release ID, evaluation status, report ID, report digest, deployed-account availability status, and recorded time match the reviewed safe evidence.
2. Recompute or verify each accepted report canonical digest and compare exact release, model, adapter, service tier, disclosure version, inference settings, evaluated-configuration digest, fixture ID, fixture version, fixture digest, prompt version, response schema version, ruleset version, and every blocking gate.
3. Remove or mismatch one required field in a focused test fixture. Confirm the release becomes `not_evaluated`, its report reference is not accepted, and the registry remains non-selectable.
4. Use a complete report with one failed gate. Confirm the release becomes `failed`, the failed evidence remains visible, and no environment configuration can change it to passed.
5. Use a complete exact all-pass report. Confirm `passed` is recorded only for that exact release and digest and no other release changes.
6. For Mistral, test a passed report with missing safe deployed-account availability. Confirm evaluation may show passed while availability remains `not_verified` and selectability remains false. Test `available` only with an already integrated matching coordinator record.
7. Search runtime admission and registry code for result-directory reads, dynamic imports, filesystem reads, environment-based evaluation status, provider probes, and mutable admission updates. Confirm none exists.
8. Inspect the final diff and confirm only the two paths in Section 6 changed and no report, registry, contract, decision record, account detail, credential, private URL, raw provider output, or cloud setting changed.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `chore: record provider admission evidence`

## 15. Handoff requirements

- Report `Task: TASK-026, Static provider admission handoff` and outcome as Complete, Partial, or Blocked.
- List every changed file under the two owned paths.
- For each live release, report only the safe static evaluation status, accepted report ID and digest or their absence, and safe deployed-account availability status.
- Summarize exact report verification across release, adapter, disclosure version, settings, evaluated-configuration digest, fixture, prompt, response schema, ruleset, canonical digest, and every blocking gate.
- State how incomplete evidence mapped to `not_evaluated`, failed evidence mapped to `failed`, passed evidence required every exact match, and Mistral remained additionally availability-gated.
- Confirm the registry remained read-only, no runtime report or environment promotion path was added, no account was inspected or changed, and no secret or private account evidence was recorded.
- Report each Section 12 command and Section 13 manual check with PASS, FAIL, or NOT RUN and a reason for any unrun check.
- Identify every evidence mismatch, incomplete report, missing coordinator availability record, blocker, assumption, or follow-up without exposing raw result or account content.
- Include a commit hash only when the opening coordinator prompt authorized the commit and the exact message was used. Otherwise report `Not committed`.

## 16. Stop conditions

Stop and report to the coordinator if:

- TASK-016 is not integrated, the base revision is not identified, the canonical admission contract or static file is absent, or another active task owns a path in Section 6.
- Safe fail-closed `not_evaluated` or `failed` state cannot be represented without changing the registry, contracts, reports, evaluation harness, environment, package files, or another unowned path.
- A requested passed status would require accepting a mismatched digest, release, model, adapter, disclosure version, setting, evaluated-configuration digest, fixture, prompt, response schema, ruleset, missing gate, changed denominator, or hidden failure.
- Mistral selectability would require guessing deployed-account availability, reading a credential, opening a provider or cloud console, probing the model, or changing an account setting.
- A runtime report reader, environment-driven promotion, provider response promotion, mutable admission endpoint, watcher, background process, new dependency, new environment variable, or test-only bypass appears necessary.
- A live provider call, credential use, provider-account action, training-use or retention change, billing or quota action, firewall or deployment change, public live enablement, push, merge, or destructive command would be required.
- Existing user changes overlap the owned paths and cannot be preserved safely.

Do not stop merely because report evidence is incomplete or a report failed. Record the required fail-closed static status, verify it, and complete the handoff when no other blocker exists.
