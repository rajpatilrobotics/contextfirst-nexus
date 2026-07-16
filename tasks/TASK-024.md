# TASK-024: Security, accessibility, and end-to-end integration

## 1. Task metadata

- Task ID: TASK-024
- Stage: quality
- Status: Ready
- Wave: 12
- Risk: high
- Suggested branch: `task/024-security-a11y-e2e`
- Depends on: TASK-015, TASK-016, TASK-018, TASK-019, TASK-021, TASK-022, TASK-023, TASK-026

## 2. Goal

Add restrictive response headers, safe global application states, automated boundary scans, full browser flows, accessibility scans, security and privacy tests, direct gate-bypass tests, log and secret checks, keyboard verification, and explicit provider-recovery coverage across the integrated prototype.

## 3. Why this task exists

Unit and feature tests cannot prove that the complete browser flow preserves the same safety, privacy, review, source, export, provider, and accessibility boundaries after integration. This task verifies those boundaries at their real seams and blocks release when an integrated feature leaks data, bypasses a gate, loses provenance, or becomes inaccessible.

## 4. Dependencies and base requirement

- TASK-015 must be integrated and provide the complete safe analysis API, common validation, provider failure mapping, no-automatic-recovery behavior, and server boundary.
- TASK-016 and TASK-026 must be integrated and provide deterministic evaluation evidence, the reviewed static admission handoff, and measured result projections used by Trust and release tests.
- TASK-018, TASK-019, TASK-021, TASK-022, and TASK-023 must be integrated and provide the complete Purpose, provider recovery, Documents, Review, Export, Trust, audit, and Safety Lab user flows.
- Every transitive foundation, domain, state, shell, provider, fixture, replay, and renderer dependency must already be present through those integrated tasks.
- Create the worktree from the latest coordinator branch containing all eight direct dependencies and their passing verification. If an integrated feature fails and its implementation path is unowned here, report it instead of patching it.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-024.md` in full.
3. `PLANS.md` in full.
4. The TASK-024 entry in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `decision-log.md` in full.
7. `PROJECT_BRIEF.md` in full.
8. `docs/PRODUCT_SPEC.md`: Sections 6 through 12.
9. `docs/CONTRACTS.md`: Sections 2 through 9, 14 through 20, 22 through 27.
10. `docs/ARCHITECTURE.md`: Sections 3 through 9, 11 through 16, and 18.
11. `docs/MODEL_ROUTING.md`: Sections 5 through 11 and 13.
12. `docs/DESIGN_SYSTEM.md`: Sections 2 through 14.
13. `docs/SAFETY_AND_DATA.md` in full.
14. `docs/DEMO_AND_FIXTURES.md` in full.
15. `docs/TESTING_AND_EVALUATION.md` in full.
16. `docs/SOURCE_REGISTER.md`: SEC-001, TECH-005 through TECH-013, TECH-020, TECH-024, TECH-027, TECH-035, STD-001, and Section 9.
17. `docs/ORCHESTRATION_AND_INTEGRATION.md` in full.
18. The current contents of every path in the Exclusive write scope.

## 6. Exclusive write scope

- `next.config.ts`
- `vitest.config.ts`
- `app/error.tsx`
- `app/global-error.tsx`
- `app/loading.tsx`
- `app/not-found.tsx`
- `lib/security/http-headers.ts`
- `scripts/verify-boundaries.mjs`
- `tests/e2e/`
- `tests/a11y/`
- `tests/security/`

Within `vitest.config.ts`, TASK-024 may only add the exact glob
`tests/security/**/*.test.{ts,tsx}` to the existing Vitest include list. Preserve
every existing include, setup file, environment, and exclusion. Do not change
reporters, environments, timeouts, aliases, coverage, or otherwise weaken test
discovery.

No other path may be created, edited, renamed, moved, or deleted.

## 7. Read-only context allowed

- `app/`
- `components/`
- `features/`
- `lib/`
- `prompts/`
- `fixtures/`
- `public/fixtures/`
- `public/vendor/pdfjs/`
- `.env.example`
- `.gitignore`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- shared lint, Playwright, and test setup files

All read-only application, domain, fixture, configuration, dependency, and setup paths must remain unchanged even when a test exposes a defect there.

## 8. Out of scope

- Fixing feature, domain, contract, fixture, provider, state, renderer, UI primitive, global-style, package, lockfile, or shared test-configuration defects outside this task's owned paths.
- Adding a dependency, changing test assertions to accommodate unsafe behavior, deleting a failing fixture, changing expected results, suppressing accessibility violations without a documented approved basis, or weakening a release gate.
- Running live provider evaluation, making unmocked paid model calls, adding credentials, checking provider accounts, enabling public live analysis, or changing provider admission.
- Deploying, pushing, changing Vercel settings, changing billing, quota, firewall, rate controls, environments, production secrets, or deployment targets.
- Adding middleware, authentication, a database, analytics, external logging, an error-reporting service, upload, real data, or child-case behavior.
- Claiming penetration testing, production security, complete accessibility, WCAG conformance, guaranteed privacy, perfect injection protection, or legal validation.

## 9. Frozen contracts and invariants

- Tests use only committed visibly synthetic fixtures. No real person, survivor, client, child, private record, social profile, credential, or private URL enters tests, logs, screenshots, traces, or reports.
- Browser bundles contain no server-only provider SDK, prompt, API key, secret value, provider endpoint, or raw environment value. The browser never connects directly to OpenAI, Google Gemini, or Mistral.
- Raw PDF bytes, unmasked text, seeded identifiers, exact evidence quotes, prompts, model bodies, provider bodies, cookies, review-reason text, and export content do not enter logs, console output, telemetry stubs, errors, or traces.
- All case, document, and model text renders as inert escaped React text. No application surface uses `dangerouslySetInnerHTML` for case content. Embedded HTML, scripts, event handlers, Markdown links, URL-like strings, and D07 instructions never execute.
- Restrictive headers allow only the minimum behavior required by the integrated Next.js application, same-origin PDF worker, and local blob previews or downloads. They do not allow provider browser connections, broad wildcard origins, framing, camera, microphone, or geolocation.
- Header policy includes a restrictive Content Security Policy, clickjacking protection through `frame-ancestors` or an equivalent frozen response, MIME-sniffing protection, a restrictive Referrer Policy, and a Permissions Policy disabling unneeded capabilities. Any framework-required allowance is narrow, explained in code, and covered by a test.
- Safe global error surfaces expose a plain category, local reference or recovery path where applicable, and a safe retry or navigation action. They never expose stack traces, component stacks, raw exceptions, source text, keys, internal endpoints, account details, or provider diagnostics.
- The complete golden flow uses `CFN-DEMO-001` and preserves Purpose blocking, seven documents, D04 page 3, D07 instruction containment, human-approved masking, exact citations, six Nexus rows, three lanes, individual review, two exact early blockers, local export, audit, and Trust evidence.
- The hero flow uses only `CAND-TASK-0402` and invalidates exactly it, `NEXUS-COMPELLED-TASKS`, and `NEXUS-OFFENCE-TIMING`, preserves unrelated decisions, blocks export, and requires renewed review.
- Negative and failure flows preserve abstention, conflicts, incomplete coverage, invalid citations, cooperation parity, provider timeout, invalid structured response, stale gate, replay version mismatch, and Reset Case behavior.
- No provider or replay starts automatically. Operational recovery follows safe options in OpenAI, Gemini, Mistral, replay order; an alternate live release requires acknowledgement and a separate linked run; outputs never merge.
- Replay and checkpoint UI dispatch only their fixed trusted bundle IDs. There is no browser bundle, file, URL, paste, persistence, environment, or provider-output import path. A test-only corrupted trusted entry fails atomically without partial purpose, mask, run, candidate, citation, or review state.
- Refusal, privacy, citation, injection, prohibited-output, schema, and semantic-safety failures do not expose provider switching as a bypass.
- Free Gemini and free Mistral reject any request not matching the exact allowlisted bundled fixture and digest. Mistral remains unselectable until its exact release passes admission.
- Direct invocation of export functions or route boundaries cannot bypass the central export gate. Any one blocker prevents manifest creation and renderer output.
- PDF and JSON come from one manifest, contain the four exact labels, omit declared identifiers and prohibited content, and preserve one-run provenance and post-withdrawal limitations.
- Automated axe coverage spans landing, Purpose errors, coverage warning, masking, processing success and failure, Review, open source, review dialog, blocked export, invalidated dependency, export preview, System Card, and Safety Lab.
- The target is WCAG 2.2 Level AA. Automated scans alone do not establish conformance; keyboard, VoiceOver, zoom, reflow, focus, semantic representation, and reduced-motion checks remain required.
- The boundary verification script reports a failing exit for prohibited imports, secret-like tracked content, unsafe case rendering, or other frozen boundary violations. It does not modify files or hide findings.
- A failed test remains visible. This task must not weaken, delete, skip, quarantine, or relabel it merely to obtain a green command.

## 10. Implementation steps

1. Inspect Git status, all owned files, integrated routes and contracts, existing scripts and test configuration, and current response behavior. Confirm every dependency is present before adding tests. Make the only permitted `vitest.config.ts` change by adding `tests/security/**/*.test.{ts,tsx}` to the existing include list without changing any other Vitest behavior.
2. Implement a central immutable header definition in `lib/security/http-headers.ts` and apply it through `next.config.ts`, using the narrowest policy compatible with the documented same-origin worker and local blob needs.
3. Implement accessible safe root loading, not-found, route error, and global error surfaces with no sensitive diagnostics, one clear heading, safe next action, focus behavior, and no unsupported completion claim.
4. Implement `scripts/verify-boundaries.mjs` as a deterministic read-only scan for server-only imports in client surfaces, provider or secret exposure, unsafe case rendering, and frozen forbidden patterns that can be established statically.
5. Add security and privacy tests for headers, provider boundary, request minimization, exact-fixture gates, injection and XSS containment, redaction and output scans, direct export bypass, logs, errors, tracked-secret absence, and provider-recovery safety rules.
6. Add Playwright flows for the complete golden path, hero withdrawal, blocked export, full and safe-share outputs, negative and failure states, provider recovery and no-auto behavior, ID-only replay and prepared checkpoint, atomic checkpoint failure, unsafe reporting, browser refresh, Reset Case, and safe global states against the production-like configuration.
7. Add automated accessibility scans for every enumerated core state and browser assertions for landmarks, headings, names, status text, error focus, drawer or dialog focus, blocker focus, semantic source and export representations, and no color-only state.
8. Run every verification command exactly, perform the complete manual checklist, inspect logs and artifacts for synthetic-only safety, and review the final diff for unowned paths, weakened assertions, secret-like values, unsupported security or accessibility claims, debug output, and cloud changes.

## 11. Acceptance criteria

- Every application response receives the tested restrictive header set, and the policy blocks framing and unnecessary capabilities while allowing only documented same-origin and local blob behavior.
- Global loading, not-found, route-error, and global-error states are accessible, actionable, and free of raw exception, source, provider, credential, account, project, billing, endpoint, and stack details.
- The boundary scan fails on a controlled fixture for client-side provider imports, secret-like tracked content, or unsafe case HTML rendering and passes the integrated repository without modifying it.
- Security tests prove minimum-necessary provider payloads, server-only keys, exact-fixture enforcement, common provider controls, inert document rendering, D07 containment, safe logs and errors, declared-identifier absence, and central export-gate enforcement.
- `npx vitest run tests/security` discovers the security tests through the exact added include glob, while every pre-existing include, setup file, environment, exclusion, reporter, timeout, alias, and coverage setting remains unchanged.
- Direct export bypass attempts cannot create a manifest, PDF, or JSON while any blocker is active.
- End-to-end tests complete the full golden flow, exact early blocker flow, hero withdrawal and renewed review, full handoff, separate safe-share handoff, audit and Trust checks, ID-only replay and checkpoint provenance, atomic corrupted-bundle rejection, Reset Case, and negative or failure paths.
- Provider recovery tests prove no automatic attempt, frozen option order, new acknowledgement, separate linked run, failed-run preservation, no output merging, and no switching bypass for safety failures. Transport tests prove that network loss and invalid response envelopes clear pending state, preserve the prior active run, show unknown remote outcome, and create no run or recovery link.
- Automated accessibility scans report zero unwaived violations for the installed A and AA rules on every enumerated core state.
- Browser assertions prove the active step, form error summary, source drawer modes, modal containment, focus restoration, dependency focus, blocker focus, semantic Nexus, semantic source, semantic export, status text, and reduced-motion behavior.
- Captured server logs, browser console, error responses, Playwright traces, and test reports contain no raw case content, exact quote, seeded identifier, prompt, model body, API key, cookie, export content, or sensitive review reason.
- No test uses a real or private record, makes a live provider call, changes cloud state, or claims broader security, privacy, accessibility, or legal assurance than was actually verified.
- Every required command passes without skipped critical tests, hidden fixtures, weakened assertions, or unowned implementation edits.

## 12. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/security
npm run build
npx playwright test tests/e2e
npm run test:a11y
npm run verify
```

## 13. Manual checks

1. Inspect response headers for `/`, `/case/demo/purpose`, `/case/demo/intake`, `/case/demo/review`, `/case/demo/export`, and `/trust` in the production-like local browser. Confirm the same restrictive policy is present, framing and camera or microphone or geolocation are denied, no provider origin is allowed in browser connections, and same-origin PDF worker plus local blob preview or download still function.
2. Trigger route and global error fixtures containing a fake stack, key-like value, provider body, account detail, and source quote. Confirm only safe copy and safe actions render, focus reaches the error heading, and none of the seeded diagnostics reaches the DOM or console.
3. Complete the judged flow by keyboard only. Confirm skip link, landmarks, one page heading, Purpose errors, document controls, source opening, review actions, dependency summary, blocker links, preview tabs, downloads, Trust content, and Reset Case are all reachable with visible focus and no trap.
4. Use VoiceOver with Safari on macOS through the Purpose error state, D04 coverage warning, one timeline citation, desktop and mobile source modes, one candidate edit, Nexus table and mobile cards, blocked export, invalidated dependency, export preview, and Safety Lab. Confirm names, roles, states, headings, table relationships, and announcements are understandable.
5. Inspect every core route at 200 percent zoom and at 320 CSS pixels. Confirm content reflows, no essential horizontal scrolling appears, sticky regions do not hide focus, tables have card equivalents, and primary and destructive actions remain separated.
6. Enable reduced motion and repeat source opening, dependency invalidation, processing progress, and error transitions. Confirm non-essential motion is removed and no status depends on animation.
7. Exercise desktop source opening at 1440 by 900 and mobile source opening below 768 pixels. Confirm non-modal versus modal behavior, Escape, Close, focus containment where required, focus restoration, preserved context, and semantic masked source text without the canvas.
8. Run the golden early export, hero withdrawal, full handoff, and separate safe-share flow. Confirm exact blockers, reachable-only invalidation, four export labels, one-manifest parity, no declared identifiers, local-only downloads, audit explanation, and system-card provenance.
9. Exercise an operational provider timeout and a semantic-safety failure using deterministic mocks. Confirm the timeout offers explicit eligible options in frozen order without starting one, while the safety failure offers no provider-switch bypass.
10. Inspect captured logs, browser console, error bodies, traces, and reports after all checks. Confirm they contain only allowed operational metadata and no raw packet, quote, identifier, prompt, model body, key, cookie, export content, or human review reason.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Exact commit message: `test: add security accessibility and end-to-end integration`

## 15. Handoff requirements

Return a self-contained handoff containing:

- `Task: TASK-024, Security, accessibility, and end-to-end integration` and outcome `Complete`, `Partial`, or `Blocked`.
- Every changed path, listed exactly.
- The headers, global states, boundary scans, browser flows, accessibility scans, and security checks added.
- Confirmation that synthetic-only fixtures, server-only providers, inert rendering, safe logs, exact-fixture gates, no automatic recovery, no safety bypass, central export gate, local-only output, and no unsupported conformance claim invariants were preserved.
- Each acceptance criterion with its result.
- Each required command and manual check with `PASS`, `FAIL`, or `NOT RUN` and a reason for any unrun check.
- Every failing test or scan with its ID, expected and observed result, affected owned or unowned path, and whether any unsafe content reached review or export.
- Any issue requiring an upstream feature or shared-interface task. Do not include raw sensitive fixture text in the report.
- The commit hash only if commit permission was present and used; otherwise `Not committed`.

## 16. Stop conditions

Stop and notify the coordinator if:

- Any dependency is not integrated, the complete route set is absent, or the base fails required dependency verification before this task's changes.
- The task graph and this packet disagree about title, dependencies, owned paths, or verification commands.
- A failing check requires editing any feature, domain, fixture, contract, state, provider, renderer, primitive, global style, package, lockfile, or shared test configuration outside the Exclusive write scope.
- A required header cannot be applied through the owned configuration without middleware, a package, a cloud setting, or another unowned file.
- A contract, fixture, provider behavior, stable ID, recovery rule, safety gate, accessibility behavior, or expected result conflicts with a higher-authority document.
- A new dependency, environment variable, live-provider call, credential, account check, external scanner, telemetry service, cloud change, deployment, billing, quota, firewall, or production setting appears necessary.
- Any real or private data, credential, private URL, raw provider diagnostic, secret-like value, unsafe trace, or unsupported security, accessibility, privacy, legal, or production claim appears.
- A command fails because of an upstream defect. Preserve the failure, report the smallest synthetic reproduction and owning path, and do not weaken the assertion or patch the unowned implementation.
