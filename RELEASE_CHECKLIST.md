# Release Checklist

Status: Local release preparation only. TASK-025 cannot be marked complete until separately approved stable-URL production rehearsal is performed against the confirmed approved build.

## Passed

- `npm ci`: Passed locally from the existing lockfile. No dependency or lockfile edit was made. npm reported two moderate advisories for later review; no fix command was run.
- `npm run verify`: Passed locally after TASK-036 fast-forward and TASK-025 reconciliation. It ran typecheck, lint, unit tests, contract tests, component tests, and build.
- `npm run test:e2e`: Passed locally. 12 Playwright tests passed, including the TASK-036 PDF CSP check and the TASK-025 prepared-checkpoint rehearsal.
- `npm run test:a11y`: Passed locally. 9 automated Playwright/axe checks passed. This is automated evidence only, not a WCAG conformance claim.
- `npm run measure:performance -- --mode prepared-checkpoint`: Passed locally with one warm-up and 20 measured samples. No provider transmission occurred.
- `npm run build`: Passed locally.
- `git diff --check`: Passed.
- `npx vitest run --config tests/performance/vitest.config.ts`: Passed locally after TASK-036 reconciliation. The tests cover mode selection, warm-up exclusion, sample-count enforcement, p95 calculation, threshold misses, checkpoint provenance, replay provenance, and zero provider transmission.
- `vercel.json` absence: Passed by local filesystem inspection. The file remains absent.
- Local-only release boundary: Passed by owned-file review. No deployment, push, Vercel setting, production setting, credential action, spend, stable-URL access, or live provider call was performed.
- Package script scope: Passed by diff review. `package.json` adds only `"measure:performance": "node scripts/measure-performance.mjs"` and `package-lock.json` is unchanged.
- README release-boundary review: Passed by line-by-line local review. It documents beginner setup, synthetic-only scope, server-side provider environment names without values, local commands, and limitations without claiming production readiness, WCAG conformance, legal validation, guaranteed privacy, zero retention, or real-case readiness.
- Browser PDF generation in the prepared-checkpoint E2E rehearsal: Passed after fast-forwarding to integrated TASK-036. The prior local TASK-025 run reached the ready gate and canonical handoff but entered `PDF generation failed`; the current reconciled rehearsal requires the ready status, requires `Download PDF locally`, and requires the `PDF generation failed` heading to be absent.
- Generated Playwright artifacts: Passed final local inspection. `test-results/` and `playwright-report/` are absent after cleanup of generated run metadata.

## Failed

- None in current TASK-025 local verification after TASK-036 reconciliation.

## Not Run

- Stable production URL rehearsal: Not run. The URL `https://contextfirst-nexus.vercel.app` was not accessed because deployment or production verification approval was not present.
- Deployment: Not run and unapproved.
- Vercel project, environment, firewall, billing, quota, or production-setting checks: Not run and unapproved.
- Public live AI analysis: Not run and unapproved.
- Live provider evaluation or provider-account checks: Not run; no credential, spend, or account action was approved.
- TASK-024 manual production or stable-URL checks: Not run in TASK-025. No complete TASK-024 handoff artifact was present in this worktree, so unverifiable manual NOT RUN evidence is preserved as not run rather than promoted from local automation.
- Manual VoiceOver check: Not run in TASK-025.
- Manual 200 percent zoom check: Not run in TASK-025.
- Manual 320 CSS pixel reflow check: Not run manually in TASK-025. Automated 320px reflow test passed under `npm run test:a11y`.
- Manual reduced-motion check: Not run manually in TASK-025. Automated reduced-motion smoke coverage remains from `npm run test:e2e`.
- Manual full-practitioner and minimum-necessary safe-share off-camera purpose rehearsal: Not run in TASK-025.
- Manual stopwatch five-run stable URL rehearsal: Not run and unapproved.

## Required Local Verification Results

- `npm run verify`: Passed.
- `npm run test:e2e`: Passed.
- `npm run test:a11y`: Passed.
- `npm run measure:performance -- --mode prepared-checkpoint`: Passed.
- `npm run build`: Passed.
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
| Loaded local review action feedback | 1.43 ms | 3.02 ms | 100.00 ms | Pass |
| Source drawer open and exact segment focus | 1.37 ms | 1.71 ms | 300.00 ms | Pass |
| Dependency recalculation and blocker update | 1.60 ms | 2.12 ms | 300.00 ms | Pass |
| Seven-document fixture extraction after assets load | 15.16 ms | 20.94 ms | 5000.00 ms | Pass |
| Prepared review checkpoint load | 1.76 ms | 2.68 ms | 1500.00 ms | Pass |
| Export preview after approved state | 2.61 ms | 3.08 ms | 2000.00 ms | Pass |
| Deterministic replay completion | 0.54 ms | 0.94 ms | 8000.00 ms | Pass |

## Manual Checks

- README beginner setup and limitations: Passed by line-by-line local review.
- README environment names and provider boundaries: Passed by line-by-line local review; names only, no values.
- Performance output consistency: Passed by final ordered measurement review.
- Local prepared checkpoint judged sequence: Passed by local Playwright E2E rehearsal, including successful local PDF generation after TASK-036 reconciliation.
- Full-practitioner and minimum-necessary safe-share separate off-camera purposes: Not run.
- Checklist evidence review: Passed after final command output update.
- `vercel.json` absence and deployment state: Passed locally; deployment checks remain not run and unapproved.
- Stable URL and stable System Card comparison: Not run and unapproved.
- Final git status and diff scope review: Passed. Current uncommitted diff is limited to `README.md`, `RELEASE_CHECKLIST.md`, `package.json`, `scripts/measure-performance.mjs`, `tests/e2e/demo-rehearsal.spec.ts`, and `tests/performance/`.
- Generated Playwright artifact review: Passed. No generated Playwright artifact folder remains.

## Approval Gates

- Deployment approval: Absent.
- Production verification or stable-URL access approval: Absent.
- Public live analysis approval: Absent.
- Credential or provider-account action approval: Absent.
- Spend approval: Absent.
- Push approval: Absent.
- Commit approval: Present in the follow-up TASK-025 commit request for message `chore: prepare performance and release readiness`.
