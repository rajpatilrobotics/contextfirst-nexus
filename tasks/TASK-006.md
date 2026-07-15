# TASK-006: Masking, redaction mapping, and leak scanning

## 1. Task metadata

- Status: Pending
- Readiness rule: Only the coordinator may mark this task Ready after TASK-001, TASK-002, and TASK-003 are integrated into the assigned base.
- Stage: domain
- Wave: 4
- Risk: high
- Suggested branch: `task/006-masking-redaction`
- Depends on: TASK-001, TASK-002, TASK-003
- Graph outcome: Implement supported identifier detection, human-reviewed masking, deterministic replacement tokens, browser-local range maps, and provider and export leak scans.

## 2. Goal

Create deterministic, human-reviewable masking and redaction utilities that remove every declared seeded identifier from provider and safe-share text while preserving exact browser-local source mapping and honest support limits.

## 3. Why this task exists

The prototype must minimize data before provider transmission or export without claiming guaranteed anonymization. Practitioners need to inspect, edit, approve, and invalidate masks, while later citation code needs a deterministic way to map approved redacted quotes back to the read-only synthetic source.

## 4. Dependencies and base requirement

- TASK-001, TASK-002, and TASK-003 must be integrated into the coordinator branch and present in this worktree base.
- Canonical `MaskClass`, `MaskSuggestion`, `MaskingReview`, `SourceSegment`, request-mask, range, safe-error, case-revision, and data-origin contracts must be importable from `lib/contracts`.
- The complete `CFN-DEMO-001` canonical segments and exact seeded identifiers must be available from TASK-003.
- Shared test tooling must be available from TASK-001. This task must not add a detection, NLP, OCR, provider, or logging dependency.
- No provider call, export generation, UI, cloud access, credential, or real case material is required.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-006.md` in full.
3. `PLANS.md` in full.
4. The `TASK-006` entry in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/SAFETY_AND_DATA.md` in full.
7. `docs/CONTRACTS.md` Sections 6, 7, 9, 19, and 20.
8. `docs/ARCHITECTURE.md` Sections 8.3 and 12.
9. `docs/DEMO_AND_FIXTURES.md` Section 7.
10. `docs/TESTING_AND_EVALUATION.md` Sections 8.2 and 14.3.
11. `docs/DESIGN_SYSTEM.md` Sections 9.5 and 11 as read-only downstream interaction context.
12. `decision-log.md` decisions DEC-004, DEC-007, DEC-015, DEC-022, DEC-023, and DEC-027.
13. The integrated shared contracts and canonical fixture, every current owned file, and the current Git status.

## 6. Exclusive write scope

- `lib/redaction/`
- `tests/unit/redaction/`

## 7. Read-only context allowed

- `lib/contracts/`
- `lib/fixtures/`
- `fixtures/cases/`
- `public/fixtures/cfn-demo-001/`
- `package.json`
- `vitest.config.ts`
- `tests/setup/`
- `features/documents/`
- `lib/citations/`
- `lib/export/`
- `lib/ai/server/`
- All coordinator-owned documentation and task packets

Downstream paths are read-only and may be inspected only to define narrow reusable inputs and outputs. Do not integrate provider, citation, export, or UI behavior in this task.

## 8. Out of scope

- Arbitrary upload, real or private material, child cases, universal named-entity recognition, ML-based anonymization, OCR, biometrics, re-identification, or guaranteed de-identification.
- Provider requests, export manifests, PDF or JSON rendering, citation matching, source drawer behavior, case reducer integration, UI controls, logging, analytics, persistence, or cloud storage.
- Changing the source fixture, shared contracts, supported mask classes, provider payload contract, fixture digest, package files, test setup, environment variables, or authoritative documentation.
- Detecting unsupported demographic, health, immigration, disability, trauma, or identity attributes.
- Sending original values, redaction maps, raw source text, or browser-local sensitive-term lists to a provider.

## 9. Frozen contracts and invariants

- Support exactly these `MaskClass` values: `person_name`, `email`, `phone`, `passport`, `bank_account`, `address`, and `date_of_birth`.
- Deterministic patterns may detect email, phone, passport, bank account, address, and date of birth only to the extent covered by declared fixture tests. Person names require the explicit practitioner-supplied sensitive-term list.
- Never claim anonymization, complete PII detection, universal named-entity recognition, or support for a class that is not declared and tested.
- Seeded values are exactly `Maya K.`, `maya.k@example.test`, `+1 202-555-0147`, `X0000007`, `000123456789`, `18 Example Lane, Sample City`, `1997-08-14`, and policy-sensitive `CFN-DEMO-001` where a safe-share policy supplies it as a disallowed literal.
- Use readable deterministic default tokens exactly: `[Person name masked]`, `[Email masked]`, `[Phone masked]`, `[Passport masked]`, `[Bank account masked]`, `[Address masked]`, and `[Date of birth masked]`.
- Character intervals use inclusive start and exclusive end. Applying masks must preserve deterministic original and redacted range mapping across length changes.
- Overlapping approved spans must never be applied ambiguously. Flag the overlap for human resolution and keep review or leak scan blocked until one non-overlapping approved set exists.
- The source fixture and original `rawText` remain read-only and unchanged. Redaction creates a derivative plus a browser-local range map.
- Suggestions expose class, source location, replacement token, detection method, and review state. Automated detection is always a suggestion.
- Provider transmission and every export require `MaskingReview.reviewStatus: approved` and `leakScanStatus: passed`. A rejected, pending, overlapping, invalid, or unapproved mask blocks transmission.
- When leak scan passes, `failedClasses` is empty. A failure reports only safe class and location metadata and must not echo the leaked value in logs or errors.
- A mask change invalidates approval, increments masking revision and case revision through the consuming reducer, and stales dependent analysis, gate, and export records. This module returns the deterministic invalidation information but does not edit case state directly.
- Provider scanning and safe-share scanning are separate named checks over their final serialized text inputs. Neither scanner performs a provider call or creates an export.
- Safe-share applies the stricter minimum-necessary policy. `CFN-DEMO-001` is scanned as a policy-supplied sensitive literal only when the export policy marks it sensitive; do not invent a new `MaskClass`.
- Redaction maps, original identifiers, original source ranges, and sensitive-term lists stay browser-local. Provider inputs contain only approved redacted text and approved non-sensitive metadata.
- Raw identifiers, source quotes, prompts, payloads, provider bodies, and secrets never enter application logs, error strings, test snapshots intended for public output, or telemetry.

## 10. Implementation steps

1. Inspect Git status, integrated contracts and fixture data, current owned files, and the focused test environment.
2. Implement small deterministic detectors for each declared class, with explicit sensitive-term input for `person_name`, stable suggestion IDs, exact ranges, and no unsupported claims.
3. Implement deterministic token selection, suggestion review, edit and reject handling, overlap detection, and validation of one non-overlapping approved mask set.
4. Build the redacted derivative without modifying source text and produce a versioned browser-local map between original and redacted ranges, including reverse mapping for later source highlighting.
5. Implement masking-review state helpers that fail closed, enforce passed-scan invariants, and report required revision invalidation to consuming code.
6. Implement separate provider-payload and safe-share leak scanners for declared seeded identifiers, supported patterns, practitioner terms, and policy-supplied disallowed literals. Return safe findings without including leaked text.
7. Add decision-table tests for detection and non-detection, boundary positions, Unicode and punctuation, repeated values, overlap, edit, rejection, token replacement, range mapping, mutation invalidation, provider serialization, safe-share serialization, and safe error content.
8. Run the graph verification commands and inspect the final diff for unowned files, source mutation, raw-value logging, unsupported detection claims, dependency changes, or provider and export behavior.

## 11. Acceptance criteria

- Each declared seeded class is detected at the exact source range, produces the exact class token, and remains pending until an explicit human review action.
- A practitioner-supplied `Maya K.` term is detected as `person_name`; without that supplied term, the implementation does not claim name detection.
- Unsupported and near-match values are not silently classified as a supported class, and the declared support list is available for honest UI disclosure.
- Overlapping spans, invalid ranges, and non-allowlisted replacement tokens fail closed and cannot produce an approved provider derivative.
- Applying an approved mask set leaves the original fixture text byte-for-byte unchanged and creates one deterministic redacted derivative.
- Original-to-redacted and redacted-to-original range mapping is correct before, inside, and after shorter or longer replacement tokens and for repeated masks.
- Editing, rejecting, adding, or removing a mask invalidates prior approval and scan status and returns the required revision and stale-dependency signal.
- Every declared seeded identifier is absent from representative live-provider serialized text after approval and from safe-share serialized text after the stricter scan.
- A pending, rejected, invalid, overlapping, or leaking mask produces a blocked result. A passed result has an empty `failedClasses` array.
- Leak findings and errors identify only safe class, segment, range, and check metadata, never the original leaked value, full source text, provider payload, prompt, credential, or stack trace.
- `CFN-DEMO-001` can be blocked by a policy-supplied safe-share literal without adding a new mask class or blocking allowed non-sensitive metadata by default.
- No provider call, export creation, real-data handling, persistent original-text storage, source mutation, or anonymization claim is implemented.
- Focused redaction tests and TypeScript checking pass with no changes outside Section 6.

## 12. Verification commands

```text
npx vitest run tests/unit/redaction
npm run typecheck
```

## 13. Manual checks

1. Run detection over the canonical seeded segments with `Maya K.` supplied as a sensitive term. Confirm all seven declared classes resolve to exact inclusive-start, exclusive-end ranges and exact readable tokens.
2. Repeat name detection without a sensitive-term list. Confirm the result does not claim universal name coverage and reports `person_name` support honestly.
3. Approve a non-overlapping set, inspect the redacted derivative, and confirm all declared seeded identifiers are absent while surrounding source wording is unchanged.
4. Map a redacted range before, inside, and after each replacement back to the original. Confirm one deterministic source range and no original value in any provider-facing result.
5. Create overlapping suggestions and confirm approval and both leak-scan passes remain blocked until the overlap is resolved explicitly.
6. Change one approved token and reject another. Confirm masking review becomes invalidated, revisions need incrementing, and downstream analysis and export are reported stale.
7. Scan representative provider and safe-share serializations, including policy-sensitive `CFN-DEMO-001`. Confirm a failure names the safe class or policy check but never echoes the value.
8. Inspect logs, thrown errors, and snapshots for original identifiers, source text, redaction maps, sensitive-term lists, prompts, provider bodies, keys, and private paths. None may appear.
9. Review the final Git diff and confirm every changed path is in Section 6 and no fixture, contract, package, provider, export, component, route, or documentation file changed.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Message: `feat: add masking and leak scanning`

## 15. Handoff requirements

- Report Task ID `TASK-006` and outcome as Complete, Partial, or Blocked.
- List every changed redaction and test file.
- Summarize supported detection, explicit name-term handling, human review, overlap behavior, deterministic tokens, range mapping, invalidation, and both leak scans.
- Confirm the original-source immutability, browser-local map, no-anonymization-claim, no-raw-log, approved-mask, passed-scan, and synthetic-only invariants.
- Report both Section 12 commands with pass or fail status and any manual check not completed.
- Report any range, overlap, serialization, fixture, contract, or policy uncertainty as a blocker or follow-up.
- Confirm no unowned file, dependency, provider, fixture, environment value, cloud setting, or secret changed.
- Include a commit hash only when the opening coordinator prompt authorized the commit; otherwise state `Not committed`.

## 16. Stop conditions

- Stop if TASK-001, TASK-002, or TASK-003 is not integrated, declared fixture values or shared masking contracts are missing, or another active task owns a path in Section 6.
- Stop if completing the task requires any file outside Section 6, a new dependency, package or test configuration change, contract change, fixture or digest change, provider change, export contract change, route change, or cloud change.
- Stop if an overlap cannot be resolved without silently selecting one identifier, if a range map is ambiguous, or if a scanner must expose a raw leaked value to explain failure.
- Stop if the implementation would send original text, identifiers, redaction maps, or sensitive-term lists to a provider or persist them outside the approved browser-local boundary.
- Stop if a requested behavior requires real data, arbitrary upload, OCR, universal NER, biometrics, re-identification, guaranteed anonymization, a new mask class, or an unsupported identifier claim.
- Stop before any provider call, export transmission, credential use, external upload, destructive command, global install, billing, quota, deployment, or production-setting action.
- Stop on any safety, contract, fixture, architecture, or testing conflict and report exact passages to the coordinator.
