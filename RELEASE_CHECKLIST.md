# Release Checklist

Status: Local release preparation is complete, but final TASK-025 production deployment is not yet confirmed. Stable-URL access and five prepared-checkpoint production rehearsals have not yet run, and this checklist does not claim the current stable site contains the final build.

## Passed

- `npm ci`: Passed locally from the existing lockfile. No dependency or lockfile edit was made. npm reported two moderate advisories for later review; no fix command was run.
- TASK-037 integration: Passed by rebase onto `origin/main` at `e4c4d055943fefa2fc481fd528a713d512cdd704`.
- `npm run verify`: Passed locally after TASK-037 rebase and TASK-025 checklist reconciliation. It ran typecheck, lint, unit tests, contract tests, component tests, and build.
- `npm run test:e2e`: Passed locally. 12 Playwright tests passed, including the TASK-036 PDF CSP check and the TASK-025 prepared-checkpoint rehearsal.
- `npm run test:a11y`: Passed locally. 9 automated Playwright/axe checks passed. This is automated evidence only, not a WCAG conformance claim.
- `npm run measure:performance -- --mode prepared-checkpoint`: Passed locally with one warm-up and 20 measured samples. No provider transmission occurred.
- `npm run build`: Passed locally.
- `git diff --check`: Passed.
- `npx vitest run --config tests/performance/vitest.config.ts`: Passed locally after TASK-036 reconciliation. The tests cover mode selection, warm-up exclusion, sample-count enforcement, p95 calculation, threshold misses, checkpoint provenance, replay provenance, and zero provider transmission.
- External stable target selection: Passed by `PLAYWRIGHT_BASE_URL=https://contextfirst-nexus.vercel.app npx playwright test tests/e2e/demo-rehearsal.spec.ts --list`. It listed one TASK-025 rehearsal test and did not run the browser test, start the local web server, or make a stable-URL request.
- `vercel.json` absence: Passed by local filesystem inspection. The file remains absent.
- Local-only release boundary: Passed by owned-file review. No deployment, push, Vercel setting, production setting, credential action, spend, stable-URL access, or live provider call was performed.
- Package script scope: Passed by diff review. `package.json` adds only `"measure:performance": "node scripts/measure-performance.mjs"` and `package-lock.json` is unchanged.
- README release-boundary review: Passed by line-by-line local review. It documents beginner setup, synthetic-only scope, server-side provider environment names without values, local commands, and limitations without claiming production readiness, WCAG conformance, legal validation, guaranteed privacy, zero retention, or real-case readiness.
- Browser PDF generation in the prepared-checkpoint E2E rehearsal: Passed after fast-forwarding to integrated TASK-036. The prior local TASK-025 run reached the ready gate and canonical handoff but entered `PDF generation failed`; the current reconciled rehearsal requires the ready status, requires `Download PDF locally`, and requires the `PDF generation failed` heading to be absent.
- Generated Playwright artifacts: Passed final local inspection. `test-results/` and `playwright-report/` are absent after cleanup of generated run metadata.

## Failed

- None in current TASK-025 local verification after TASK-036 reconciliation.

## Not Run

- Stable production URL rehearsal: Not run. Stable-URL access is approved only after the final build is confirmed deployed; the external-target `--list` command was discovery-only and did not execute the rehearsal.
- Replay-only production deployment through the existing connected project: Not run. It is approved, but final TASK-025 production deployment is not yet confirmed.
- Vercel project, environment, firewall, billing, quota, or other production-setting changes: Not run and explicitly not approved.
- Public live AI analysis: Not run and unapproved.
- Live provider evaluation or provider-account checks: Not run; no credential, spend, or account action was approved.
- TASK-024 manual production or stable-URL checks: Not run in TASK-025. No complete TASK-024 handoff artifact was present in this worktree, so unverifiable manual NOT RUN evidence is preserved as not run rather than promoted from local automation.
- Manual VoiceOver check: Not run in TASK-025.
- Manual 200 percent zoom check: Not run in TASK-025.
- Manual 320 CSS pixel reflow check: Not run manually in TASK-025. Automated 320px reflow test passed under `npm run test:a11y`.
- Manual reduced-motion check: Not run manually in TASK-025. Automated reduced-motion smoke coverage remains from `npm run test:e2e`.
- Manual full-practitioner and minimum-necessary safe-share off-camera purpose rehearsal: Not run in TASK-025.
- Manual stopwatch five-run stable URL rehearsal: Not run. Five prepared-checkpoint production rehearsals are approved only after the final build is confirmed deployed.

## Required Local Verification Results

- `npm run verify`: Passed.
- `npm run test:e2e`: Passed.
- `npm run test:a11y`: Passed.
- `npm run measure:performance -- --mode prepared-checkpoint`: Passed.
- `npm run build`: Passed.
- `npx vitest run --config tests/performance/vitest.config.ts`: Passed.
- `PLAYWRIGHT_BASE_URL=https://contextfirst-nexus.vercel.app npx playwright test tests/e2e/demo-rehearsal.spec.ts --list`: Passed; listed one test without stable-URL access.
- `git diff --check`: Passed.

## Performance Evidence

Final ordered prepared-checkpoint measurement:

- Environment: local MacBook Air M2 baseline requested by packet, macOS Darwin arm64, Node `v26.0.0`.
- Fixture: `CFN-DEMO-001`, fixture version `1.0.0`.
- Fixture digest: `ede4457873700cc4bce1bb5fad29c89a4e25d2e6ca7ccd33c323a2ce8ac5809c`.
- Checkpoint: `DEMO-CHECKPOINT-REVIEW`, version `1.0.0`, `Prepared synthetic review checkpoint`.
- Replay: `prepared-replay-v1`, version `1.0.0`, `Bundled deterministic replay, not live AI`.
- Warm-up: 1 excluded.
- Measured samples: 20.
- Provider transmission: false.
- Stable URL accessed: false.
- Live provider calls: false.
- Result: Passed all measured thresholds.

| Operation | Median | p95 | Threshold | Result |
|---|---:|---:|---:|---|
| Loaded local review action feedback | 1.40 ms | 2.43 ms | 100.00 ms | Pass |
| Source drawer open and exact segment focus | 1.31 ms | 1.98 ms | 300.00 ms | Pass |
| Dependency recalculation and blocker update | 1.40 ms | 2.25 ms | 300.00 ms | Pass |
| Seven-document fixture extraction after assets load | 13.17 ms | 17.54 ms | 5000.00 ms | Pass |
| Prepared review checkpoint load | 1.48 ms | 2.43 ms | 1500.00 ms | Pass |
| Export preview after approved state | 2.09 ms | 3.35 ms | 2000.00 ms | Pass |
| Deterministic replay completion | 0.49 ms | 0.70 ms | 8000.00 ms | Pass |

## Manual Checks

- README beginner setup and limitations: Passed by line-by-line local review.
- README environment names and provider boundaries: Passed by line-by-line local review; names only, no values.
- Performance output consistency: Passed by final ordered measurement review.
- TASK-037 external-target selection: Passed by `--list`; stable target selection is configured and discoverable without executing the stable rehearsal.
- Local prepared checkpoint judged sequence: Passed by local Playwright E2E rehearsal, including successful local PDF generation after TASK-036 reconciliation.
- Full-practitioner and minimum-necessary safe-share separate off-camera purposes: Not run.
- Checklist evidence review: Passed after final command output update.
- `vercel.json` absence and deployment state: Passed locally; final replay-only production deployment remains not run and not yet confirmed.
- Stable URL and stable System Card comparison: Not run. Stable-URL access is approved only after the final build is confirmed deployed.
- Final git status and diff scope review: Passed. Current uncommitted follow-up diff is limited to `RELEASE_CHECKLIST.md`.
- Generated Playwright artifact review: Passed. No generated Playwright artifact folder remains.

## Approval Gates

Approved:
- Main push for the final replay-only build
- Replay-only production deployment through the existing connected project
- Stable-URL access after the final build is confirmed deployed
- Five prepared-checkpoint production rehearsals

Explicitly not approved:
- Public live AI
- Live provider calls or evaluation
- Credential or provider-account changes
- Billing or spend changes
- Firewall, quota, or other Vercel/production-setting changes

Current execution state:
- Final TASK-025 production deployment is not yet confirmed.
- Stable-URL access and five rehearsals have not yet run.
- Do not convert those execution results to PASS yet.
- Do not claim the current stable site contains the final build.
- Commit approval: Present for `docs: record approved production rehearsal gate`.
