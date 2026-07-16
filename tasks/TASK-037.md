# TASK-037: Honor the approved external Playwright base URL

## 1. Task metadata

- Task ID: TASK-037
- Stage: release
- Status: Ready
- Wave: corrective release bridge before TASK-025 resumes
- Risk: high
- Suggested branch: `task/037-playwright-external-target`
- Depends on: TASK-024, TASK-036
- Graph outcome: Preserve the exact local Playwright behavior while allowing only the approved ContextFirst Nexus stable origin to omit the local web server for later explicitly approved verification.
- Suggested implementation commit message: `fix: honor approved Playwright base URL`

## 2. Goal

Make `PLAYWRIGHT_BASE_URL` a fail-closed, allowlisted configuration boundary. Preserve current local Playwright behavior when no external target is supplied, select only the approved ContextFirst Nexus stable origin when explicitly configured, omit the local web server for that external mode, and reject every other non-empty value before any browser or server starts.

TASK-037 changes configuration and tests only. It must not deploy, access the stable URL, exercise the recorded replay-only deployment approval, or perform stable-URL verification.

## 3. Confirmed defect

`playwright.config.ts` currently ignores `PLAYWRIGHT_BASE_URL`. It always sets `use.baseURL` to `http://127.0.0.1:${PORT}` and always starts the local `next start` web server. Therefore this required TASK-025 command would silently test localhost rather than the approved stable origin:

```text
PLAYWRIGHT_BASE_URL=https://contextfirst-nexus.vercel.app npx playwright test tests/e2e/demo-rehearsal.spec.ts --repeat-each=5
```

The configuration must make that target explicit and fail closed without accessing it during TASK-037.

## 4. Dependencies, approvals, and base requirement

- TASK-024 must be integrated and provide the production-like Playwright workflow, local `next start` behavior, E2E suite, restrictive headers, and security boundary.
- TASK-036 must be integrated and provide CSP-compatible local WebAssembly behavior plus the focused PDF CSP browser regression.
- Start from the exact pushed coordinator baseline on which TASK-037 is Ready and TASK-025 is Blocked only by TASK-037.
- The user has recorded approval for replay-only deployment after TASK-037 and for later stable-URL verification only after the approved replay-only build is confirmed deployed.
- Those approvals are dormant during TASK-037. Do not deploy, access the stable URL, start production verification, change Vercel, or modify production settings.
- Public live AI, live-provider calls, credential changes, billing changes, and every other Vercel or production-setting change remain rejected.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-037.md` in full.
3. `PLANS.md` in full.
4. The TASK-024, TASK-025, TASK-036, and TASK-037 entries in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `tasks/TASK-024.md`, `tasks/TASK-025.md`, and `tasks/TASK-036.md`, focusing on Playwright, approval, and stable-URL gates.
7. `docs/ARCHITECTURE.md`: browser verification, deployment, response-header, and provider-boundary sections.
8. `docs/SAFETY_AND_DATA.md`: credentials, live-provider, external transmission, and production-verification boundaries.
9. `docs/TESTING_AND_EVALUATION.md`: local production-like server, Playwright configuration, stable-target, and no-network listing requirements.
10. `docs/ORCHESTRATION_AND_INTEGRATION.md`: ownership transfer, worktree, verification, and integration sections.
11. `package.json`, `tsconfig.json`, `vitest.config.ts`, and all existing Playwright tests as read-only context.
12. Git status and the complete current contents of both Section 6 paths.

## 6. Exclusive write scope

- `playwright.config.ts`
- `tests/unit/config/playwright-external-target.test.ts`

No other path may be created, edited, renamed, generated, moved, or deleted.

## 7. Corrective ownership transfer

TASK-001 transfers corrective ownership of `playwright.config.ts` to TASK-037 through the integrated TASK-024 and TASK-036 dependency chain. The transfer is only for allowlisted base-URL selection and conditional local web-server omission.

TASK-037 receives ownership of the new exact unit test `tests/unit/config/playwright-external-target.test.ts`. TASK-025 remains blocked; none of its files, committed worktree state, release evidence, or rehearsal results may change.

## 8. Required behavior

### 8.1 Exact local fallback

When `PLAYWRIGHT_BASE_URL` is absent or empty, preserve the current local behavior exactly:

- `PLAYWRIGHT_PORT` defaults to `3000` and retains its current numeric parsing.
- `use.baseURL` remains `http://127.0.0.1:${PORT}`.
- `webServer.command` remains `npm run start -- --hostname 127.0.0.1 --port ${PORT}`.
- `webServer.url` remains the local base URL.
- `webServer.reuseExistingServer` remains `!process.env.CI`.
- `webServer.timeout` remains `120_000`.

Do not change local port selection, command construction, server startup, timeout, or reuse semantics.

### 8.2 Exact approved external target

When `PLAYWRIGHT_BASE_URL` is exactly:

```text
https://contextfirst-nexus.vercel.app
```

- Set `use.baseURL` to that exact origin.
- Omit the `webServer` configuration so Playwright does not start localhost.
- Do not normalize, redirect, probe, fetch, navigate to, resolve, or otherwise access the origin during configuration or TASK-037 verification.
- Do not accept a trailing slash, alternate scheme, alternate host, path, query, fragment, whitespace variant, localhost alias, environment interpolation, or any other value.

### 8.3 Reject every other external value

- Treat every other non-empty `PLAYWRIGHT_BASE_URL` value as unapproved.
- Throw a clear deterministic configuration error before a browser or web server starts.
- The error may identify the configuration variable and approved origin, but must contain no credential, secret, private endpoint, environment dump, or unrelated process value.
- Do not silently fall back to localhost for an unapproved non-empty value.

### 8.4 Preserve all unrelated Playwright behavior

- Preserve `testDir: "./tests"`, `fullyParallel: false`, CI `forbidOnly`, CI retry count, reporters, `trace: "on-first-retry"`, and the Chromium project using `Desktop Chrome` exactly.
- Preserve every existing timeout, project, reporter, retry, trace, device, test-directory, and local-server behavior not explicitly conditionalized in Sections 8.1 and 8.2.
- Do not change tests, application code, packages, fixtures, providers, deployment configuration, environment templates, or TASK-025 files.

## 9. Required unit tests

Add focused tests proving:

- With `PLAYWRIGHT_BASE_URL` absent, local `baseURL`, port, command, URL, timeout, and reuse behavior match the current configuration exactly.
- Local behavior still honors the existing `PLAYWRIGHT_PORT` and `CI` semantics.
- With the exact approved origin, `use.baseURL` equals that origin and `webServer` is omitted.
- An empty value follows the local fallback.
- Every other non-empty value tested—including alternate scheme, host, trailing slash, path, query, fragment, and whitespace variants—throws the clear configuration error.
- Projects, reporters, retries, trace behavior, timeouts, test directory, and devices remain unchanged in both accepted modes.
- Environment changes and module loading are isolated and restored after every test; no test performs DNS, HTTP, browser navigation, provider calls, deployment, or stable-URL access.

## 10. `--list` verification boundary

Run this exact command only after the unit and local suites pass:

```text
PLAYWRIGHT_BASE_URL=https://contextfirst-nexus.vercel.app npx playwright test tests/e2e/task-036-pdf-csp.spec.ts --list
```

The command validates configuration and test discovery only. It must omit the local web server, must not execute the listed test, and must not access the stable URL. If any server starts, request occurs, DNS lookup occurs, browser launches, or URL access is observed, stop and report it.

## 11. Frozen invariants and forbidden changes

- No deployment, stable-URL access, Vercel change, production-setting change, credential use, provider call, public live AI, billing change, or cloud action occurs.
- Recorded approval for replay-only deployment after TASK-037 and later stable-URL verification after confirmed deployment remains intact but unused.
- Public live AI, live-provider calls, credential changes, billing changes, and all other Vercel or production-setting changes remain rejected.
- Do not edit projects, reporters, retries, trace behavior, timeouts, test directories, devices, application code, tests outside the exact unit-test path, fixtures, providers, packages, lockfiles, scripts, deployment configuration, environment files, or TASK-025 files.
- Do not add a dependency, make network access part of configuration loading, read credential values, expose environment values, or create an alternate target allowlist.
- Do not claim the stable deployment exists, serves the approved build, passed verification, or is release-ready from a `--list` result.

## 12. Implementation steps

1. Confirm the TASK-037 worktree is clean, based on the exact pushed documentation baseline, and limited to Section 6 ownership.
2. Capture the current local config projection for default port, custom port, CI and non-CI reuse, command, URL, timeout, projects, reporters, retries, trace, and test directory.
3. Implement the smallest explicit allowlist branch for absent or empty local mode, exact approved external mode, and rejection of every other non-empty value.
4. Omit `webServer` only in approved external mode; preserve the complete local object byte-for-byte in behavior.
5. Add isolated unit tests for local fallback, approved target, web-server omission, invariant config fields, and rejected values without network access.
6. Run every Section 14 command in order. Treat the `--list` command as configuration-only evidence, never stable-URL evidence.
7. Inspect the complete diff for exactly two owned paths, no TASK-025 change, no generated artifact, no package change, and no production or network action.

## 13. Acceptance criteria

- Missing or empty `PLAYWRIGHT_BASE_URL` preserves the exact current local base URL, port, command, timeout, reuse behavior, and web server.
- Exact approved origin selects that `use.baseURL` and omits `webServer`.
- Every other non-empty value fails closed with a clear safe configuration error.
- Projects, reporters, retries, trace behavior, timeouts, test directory, devices, and all unrelated config remain unchanged.
- Unit tests cover local fallback, custom port, CI reuse, approved external target, server omission, invariant fields, and representative unapproved values without network access.
- Local E2E and repository verification pass unchanged.
- The exact external `--list` command lists the focused test without starting a server, browser, DNS, HTTP, or stable-URL access.
- Only the two owned paths change and no generated Playwright artifact remains.

## 14. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/unit/config/playwright-external-target.test.ts
npm run test:e2e
npm run verify
PLAYWRIGHT_BASE_URL=https://contextfirst-nexus.vercel.app npx playwright test tests/e2e/task-036-pdf-csp.spec.ts --list
git diff --check
```

All five commands must pass. The fourth command is discovery-only and must not access the stable URL.

## 15. Commit and handoff

- Commit only when the worker prompt explicitly authorizes it.
- Suggested implementation commit message: `fix: honor approved Playwright base URL`
- Report both changed paths, the exact local and external config projections, rejected-value cases, every command result, evidence that `--list` made no request and started no server, and confirmation that no TASK-025, package, application, deployment, provider, credential, billing, Vercel, production, or generated-artifact change occurred.
- Report whether TASK-025 can resume. Only coordinator integration and verification of TASK-037 satisfies the dependency.

## 16. Stop conditions

Stop and notify the coordinator if:

- TASK-024 or TASK-036 is not integrated; TASK-025 is not blocked only by TASK-037; the graph and packet disagree; or the TASK-037 worktree is not clean at launch.
- Preserving local behavior requires changing any frozen field, package, script, test, application path, deployment setting, or another unowned file.
- Approved external selection cannot omit the local web server, config loading performs network access, or `--list` starts a server, browser, DNS lookup, HTTP request, or stable-URL access.
- A value other than the exact approved origin is accepted, an unapproved value silently falls back, or a configuration error exposes sensitive environment data.
- Any local E2E, CSP, PDF, security, repository verification, or config invariant regresses.
- Any deployment, stable-URL access, Vercel change, production-setting change, public live AI, provider call, credential action, billing change, cloud action, or unsupported release claim appears.
