# TASK-036: Restore CSP-compatible local PDF generation

## 1. Task metadata

- Task ID: TASK-036
- Stage: quality
- Status: Ready
- Wave: corrective security bridge before TASK-025 resumes
- Risk: high
- Suggested branch: `task/036-pdf-csp-wasm`
- Depends on: TASK-022, TASK-024
- Graph outcome: Reproduce and correct the WebAssembly CSP boundary blocking local PDF generation using only the narrow `wasm-unsafe-eval` token, while preserving every other security directive and application boundary.
- Suggested implementation commit message: `fix: restore CSP-compatible local PDF generation`

## 2. Goal

Restore local PDF generation after TASK-024 introduced restrictive response headers. Confirm that browser WebAssembly compilation is the actual failure boundary, then add only the narrowly scoped CSP capability required by `@react-pdf/renderer` and `yoga-layout`. Do not encode PDF failure as expected release behavior and do not weaken any unrelated security control.

## 3. Root evidence and investigation gate

- PDF generation passed before TASK-024 security headers.
- The current flow reaches the canonical immutable export manifest and then enters `PDF generation failed`.
- `@react-pdf/renderer` uses `yoga-layout`, which loads WebAssembly.
- The current application `script-src` does not include the narrow `'wasm-unsafe-eval'` capability.

This evidence is a hypothesis that must be reproduced under the actual application response CSP before changing the policy. If browser evidence does not show WebAssembly compilation blocked by CSP, stop and report the exact browser error, console message, rejected operation, route, and reproduction steps. Do not add any CSP token speculatively.

## 4. Dependencies and base requirement

- TASK-022 must be integrated and provide immutable-manifest local PDF generation, JSON parity, local download behavior, export gates, and renderer boundaries.
- TASK-024 must be integrated and provide the central security header definition, restrictive CSP, provider-origin restrictions, framing protection, permissions policy, local blob allowance, security tests, and production-like Playwright server.
- Start from the exact pushed coordinator baseline on which TASK-036 is Ready and TASK-025 is Blocked only by TASK-036.
- Use the installed browser, Playwright, application server, and existing packages. Do not add or update a dependency.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-036.md` in full.
3. `PLANS.md` in full.
4. The TASK-022, TASK-024, TASK-025, and TASK-036 entries in `TASK_GRAPH.yaml` in full.
5. `docs/CONTEXT_INDEX.md` in full.
6. `tasks/TASK-022.md` and `tasks/TASK-024.md` in full, focusing on renderer and security-header ownership.
7. `docs/ARCHITECTURE.md`: export renderer, browser boundary, response header, worker, and local-download sections.
8. `docs/CONTRACTS.md`: immutable export manifest, renderer parity, export gate, and local output sections.
9. `docs/SAFETY_AND_DATA.md`: browser execution, local-only output, provider boundaries, CSP, and prohibited transmission sections.
10. `docs/TESTING_AND_EVALUATION.md`: production-like browser, security, export, failure evidence, and regression requirements.
11. `docs/ORCHESTRATION_AND_INTEGRATION.md`: ownership transfer, worktree, verification, and integration sections.
12. The current CSP response from the production-like local server and the exact browser console error from the failing PDF path.
13. The installed `@react-pdf/renderer` and `yoga-layout` package implementation as read-only dependency context.
14. Git status and the complete current contents of all three Section 6 paths.

## 6. Exclusive write scope

- `lib/security/http-headers.ts`
- `tests/security/security-boundaries.test.ts`
- `tests/e2e/task-036-pdf-csp.spec.ts`

No other path may be created, edited, renamed, generated, moved, or deleted.

## 7. Corrective ownership transfer

TASK-024 transfers corrective ownership of `lib/security/http-headers.ts` and `tests/security/security-boundaries.test.ts` to TASK-036 solely for the verified WebAssembly CSP correction and its security assertions. TASK-036 receives ownership of the new exact focused browser test `tests/e2e/task-036-pdf-csp.spec.ts`.

TASK-022 remains the integrated owner of the PDF renderer and Export experience; those paths are read-only. TASK-025 remains blocked and none of its files or local evidence may change.

## 8. Required behavior

### 8.1 Reproduce before changing policy

- Run the application through the actual production-like Playwright server and response headers.
- Reproduce a minimal `WebAssembly.compile` operation under the current application CSP.
- Capture the actual browser rejection and confirm it is a CSP restriction on WebAssembly compilation rather than a renderer, manifest, fixture, browser, package, worker, or application error.
- Preserve the failing evidence in the worker handoff without including private data or credentials.
- If the failure is not caused by WebAssembly CSP, stop without changing the policy and report the exact browser error.

### 8.2 Narrow CSP correction

- Only after confirmed reproduction, add exactly `'wasm-unsafe-eval'` to the existing `script-src` directive.
- Never add broad `'unsafe-eval'`.
- Preserve every other CSP directive, directive order, source token, provider-origin restriction, wildcard prohibition, `frame-ancestors` restriction, object restriction, permissions policy, referrer policy, MIME protection, and local `blob:` allowance.
- Do not broaden `connect-src`, worker sources, frame sources, style sources, image sources, font sources, or any provider/browser boundary.

### 8.3 Security assertions

Update the existing focused security test to prove:

- `script-src` contains the exact `'wasm-unsafe-eval'` token.
- Parsed `script-src` tokens and the complete parsed CSP do not contain broad
  standalone token `'unsafe-eval'`; do not use a substring check that would
  misclassify `'wasm-unsafe-eval'`.
- OpenAI, Google Gemini, and Mistral browser origins remain absent.
- Wildcard sources remain absent.
- Existing frame, MIME, referrer, permissions, object, connection, worker, and local blob assertions remain passing and are not weakened.

### 8.4 Browser regression

- Add one focused Playwright file at `tests/e2e/task-036-pdf-csp.spec.ts`.
- Load a real application route through the production-like server and use the actual response CSP.
- Compile a minimal valid WebAssembly module in the page context and assert compilation succeeds after the narrow policy change.
- Also assert the response contains `'wasm-unsafe-eval'`, omits broad standalone token `'unsafe-eval'`, provider origins, and wildcard sources, and retains the required local restrictions using token-aware checks.
- Do not mock away the response headers, disable CSP, inject a permissive policy, change Playwright configuration, or call a provider.

## 9. Frozen invariants

- One canonical immutable manifest continues to drive JSON, preview, and local PDF generation.
- Export gates, withdrawal behavior, limitations, citation provenance, minimum-necessary selection, renderer parity, and local-only downloads remain unchanged.
- No provider request, credential, external transmission, automatic recovery, or safety-gate bypass is introduced.
- Browser provider origins stay prohibited and no wildcard source is added.
- The CSP remains restrictive except for the one verified WebAssembly compilation token.
- TASK-025 must record working local PDF generation truthfully; it must not treat the current failure as accepted release behavior.

## 10. Forbidden changes

- Broad `'unsafe-eval'`, a wildcard, a provider origin, a data-source expansion, or any unrelated CSP relaxation.
- Editing the PDF renderer, export core, application UI, fixtures, replay, contracts, providers, packages, lockfiles, scripts, Playwright configuration, Next.js configuration, deployment configuration, environment files, or TASK-025 files.
- Changing the canonical manifest, PDF content, output labels, export gate, withdrawal behavior, local-download semantics, or provider admission.
- Adding a dependency, credential, live-provider call, remote asset, external transmission, suppression, skipped test, weakened assertion, or test-only production branch.
- Claiming production security, universal browser compatibility, CSP completeness, privacy guarantees, accessibility conformance, or release readiness from this focused correction.

## 11. Implementation steps

1. Confirm the TASK-036 worktree is clean, based on the exact pushed documentation baseline, and limited to Section 6 ownership.
2. Build and serve the current application with its actual TASK-024 headers, reproduce minimal WebAssembly compilation failure, and capture the exact safe browser evidence.
3. If and only if the evidence confirms WebAssembly CSP blocking, add exactly `'wasm-unsafe-eval'` to `script-src` without changing any other directive or token.
4. Add the focused security assertions for the narrow token, broad-token absence, provider-origin absence, wildcard absence, and all preserved controls.
5. Add the focused production-like Playwright regression proving minimal WebAssembly compilation under the actual response CSP.
6. Run every Section 13 command in order.
7. Inspect the complete diff for exactly three owned paths, the one-token policy delta, no broad relaxation, no generated artifacts, and no TASK-025 or deployment change.

## 12. Acceptance criteria

- Safe browser evidence proves the original failure is WebAssembly compilation blocked by the actual application CSP.
- The only CSP policy addition is exact token `'wasm-unsafe-eval'` in `script-src`.
- Broad `'unsafe-eval'`, wildcards, and provider origins remain absent.
- Every pre-existing header directive, restriction, and local blob allowance remains unchanged.
- The security suite asserts the narrow capability and preserved restrictions without weakening prior coverage.
- The focused browser test compiles a minimal valid WebAssembly module under the actual application response CSP.
- PDF renderer, UI, fixtures, providers, packages, Playwright configuration, TASK-025 files, and deployment configuration remain unchanged.
- All seven required verification commands pass, only the three owned paths change, and no Playwright artifact is committed.

## 13. Verification commands

Run from the repository root in this exact order:

```text
npx vitest run tests/security
npm run build
npx playwright test tests/e2e/task-036-pdf-csp.spec.ts
npm run test:e2e
npm run verify
node scripts/verify-boundaries.mjs
git diff --check
```

All seven commands must pass. A failure remains visible and does not authorize broader CSP changes.

## 14. Commit and handoff

- Commit only when the worker prompt explicitly authorizes it.
- Suggested implementation commit message: `fix: restore CSP-compatible local PDF generation`
- Report the exact pre-change browser error, the minimal reproduction, all three changed paths, the exact CSP token delta, every command result, and confirmation that no broad token, provider origin, wildcard, package, renderer, UI, fixture, provider, Playwright-config, TASK-025, deployment, or generated-artifact change occurred.
- Report whether TASK-025 can resume. Only coordinator integration and verification of TASK-036 satisfies the dependency.

## 15. Stop conditions

Stop and notify the coordinator if:

- TASK-022 or TASK-024 is not integrated; TASK-025 is not blocked only by TASK-036; the graph and packet disagree; or the TASK-036 worktree is not clean at launch.
- The current application CSP does not reproduce a WebAssembly compilation block or the exact browser evidence identifies a different cause.
- Success requires broad `'unsafe-eval'`, a wildcard, provider origin, unrelated CSP relaxation, package change, renderer change, UI change, fixture change, provider change, Playwright configuration change, or another unowned path.
- Any prior header, provider boundary, export gate, withdrawal behavior, manifest parity, local-output behavior, security test, E2E test, build, or repository verification regresses.
- A credential, private data, live-provider call, external transmission, cloud change, deployment action, stable-URL access, production-setting change, or unsupported security, privacy, accessibility, or release claim appears.
