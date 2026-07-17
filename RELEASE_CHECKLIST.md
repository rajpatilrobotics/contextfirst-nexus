# Release Checklist

Status: Final replay-only production verification passed for the exact `55bb075df19c6046143a37d2cfd8bc2388f18f2d` build. TASK-025 evidence is ready for integration. Public live AI remains disabled and unapproved, and this checklist makes no blanket production-security, privacy, accessibility-conformance, legal-validity, or real-case-readiness claim.

## Passed

- `npm ci`: Passed locally from the existing lockfile. No dependency or lockfile edit was made. npm reported two moderate advisories for later review; no fix command was run.
- TASK-037 integration: Passed by rebase onto `origin/main` at `e4c4d055943fefa2fc481fd528a713d512cdd704`.
- TASK-038 integration: Passed on `origin/main` at `55bb075df19c6046143a37d2cfd8bc2388f18f2d`. The API and Trust page share the exact server-only live-analysis policy, disabled POST requests stop before orchestration, and prepared replay remains available.
- Exact production deployment: Passed by read-only Vercel metadata. Deployment `dpl_A5ffvLw9YeEVAipid1R8jkFfq8vE` is `READY`, targets production, carries Git SHA `55bb075df19c6046143a37d2cfd8bc2388f18f2d` on `main`, and owns the stable alias `https://contextfirst-nexus.vercel.app`.
- Production availability GET: Passed with HTTP 200 and `Cache-Control: no-store`. `liveAnalysisEnabled` is `false`; OpenAI, Google Gemini, and Mistral each report `availabilityStatus: disabled` and `selectable: false`; prepared local replay reports `availabilityStatus: available`, `selectable: true`, and `providerTransmission: false`.
- Five serial stable rehearsals: Passed with `--workers=1` and no local Playwright web server. Individual results were Run 1 `6.6s` Pass, Run 2 `2.0s` Pass, Run 3 `2.0s` Pass, Run 4 `2.1s` Pass, and Run 5 `2.2s` Pass; total runner time was `17.2s`.
- Replay-only transmission boundary: Passed for this verification workflow. The coordinator issued one GET to `/api/analyze`, issued zero POST requests, initiated zero live-provider calls, and the rehearsal asserted prepared replay plus `providerTransmission: false` in the canonical handoff.
- `npm run verify`: Passed locally after TASK-038 integration. It ran typecheck, lint, 179 passing unit tests with 1 skipped, 31 contract tests, 127 component tests, and the production build.
- `npm run test:e2e`: Passed locally. 12 Playwright tests passed, including the TASK-036 PDF CSP check and the TASK-025 prepared-checkpoint rehearsal.
- `npm run test:a11y`: Passed locally. 9 automated Playwright/axe checks passed. This is automated evidence only, not a WCAG conformance claim.
- `npm run measure:performance -- --mode prepared-checkpoint`: Passed locally with one excluded warm-up and 20 measured samples for every operation. No provider transmission or stable-URL access occurred during this local measurement.
- `npm run build`: Passed locally.
- `git diff --check`: Passed.
- `npx vitest run --config tests/performance/vitest.config.ts`: Passed locally after TASK-036 reconciliation. The tests cover mode selection, warm-up exclusion, sample-count enforcement, p95 calculation, threshold misses, checkpoint provenance, replay provenance, and zero provider transmission.
- External stable target selection: Passed by `PLAYWRIGHT_BASE_URL=https://contextfirst-nexus.vercel.app npx playwright test tests/e2e/demo-rehearsal.spec.ts --list`. It listed one TASK-025 rehearsal test and did not run the browser test, start the local web server, or make a stable-URL request.
- `vercel.json` absence: Passed by local filesystem inspection. The file remains absent.
- Approved release boundary: Passed. The existing Git-connected production deployment and stable alias were used without changing Vercel settings, environments, credentials, billing, quotas, firewall, domains, or provider configuration. No live provider call occurred.
- Package script scope: Passed by diff review. `package.json` adds only `"measure:performance": "node scripts/measure-performance.mjs"` and `package-lock.json` is unchanged.
- README release-boundary review: Passed by line-by-line local review. It documents beginner setup, synthetic-only scope, server-side provider environment names without values, local commands, and limitations without claiming production readiness, WCAG conformance, legal validation, guaranteed privacy, zero retention, or real-case readiness.
- Browser PDF generation in the prepared-checkpoint E2E rehearsal: Passed after fast-forwarding to integrated TASK-036. The prior local TASK-025 run reached the ready gate and canonical handoff but entered `PDF generation failed`; the current reconciled rehearsal requires the ready status, requires `Download PDF locally`, and requires the `PDF generation failed` heading to be absent.
- Generated Playwright artifacts: Passed final inspection after the generated `.last-run.json` metadata was reviewed and removed; `test-results/` and `playwright-report/` are absent and no artifact is committed.

## Failed

- None in final TASK-025 replay-only production reconciliation.

## Not Run

- Vercel project, environment, firewall, billing, quota, or other production-setting changes: Not run and explicitly not approved.
- Public live AI analysis: Not run and unapproved.
- Live provider evaluation or provider-account checks: Not run; no credential, spend, or account action was approved.
- TASK-024 manual production or stable-URL checks: Not run in TASK-025. No complete TASK-024 handoff artifact was present in this worktree, so unverifiable manual NOT RUN evidence is preserved as not run rather than promoted from local automation.
- Manual VoiceOver check: Not run in TASK-025.
- Manual 200 percent zoom check: Not run in TASK-025.
- Manual 320 CSS pixel reflow check: Not run manually in TASK-025. Automated 320px reflow test passed under `npm run test:a11y`.
- Manual reduced-motion check: Not run manually in TASK-025. Automated reduced-motion smoke coverage remains from `npm run test:e2e`.
- Manual full-practitioner and minimum-necessary safe-share off-camera purpose rehearsal: Not run in TASK-025.
- Manual stopwatch five-run stable URL rehearsal: Not run. The required five serial Playwright rehearsals ran and recorded individual durations, but no separate human stopwatch exercise was performed.
- Manual stable System Card comparison: Not run. The stable automated rehearsal verified Trust evidence, but no separate manual page-by-page comparison was performed.

## Required Local Verification Results

- `npm run verify`: Passed.
- `npm run test:e2e`: Passed.
- `npm run test:a11y`: Passed.
- `npm run measure:performance -- --mode prepared-checkpoint`: Passed.
- `npm run build`: Passed.
- `npx vitest run --config tests/performance/vitest.config.ts`: Passed.
- `PLAYWRIGHT_BASE_URL=https://contextfirst-nexus.vercel.app npx playwright test tests/e2e/demo-rehearsal.spec.ts --list`: Passed; listed one test without stable-URL access.
- `PLAYWRIGHT_BASE_URL=https://contextfirst-nexus.vercel.app npx playwright test tests/e2e/demo-rehearsal.spec.ts --repeat-each=5 --workers=1`: Passed; five serial production rehearsals completed in `6.6s`, `2.0s`, `2.0s`, `2.1s`, and `2.2s`, with no local web server.
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
| Loaded local review action feedback | 1.42 ms | 2.49 ms | 100.00 ms | Pass |
| Source drawer open and exact segment focus | 1.29 ms | 2.02 ms | 300.00 ms | Pass |
| Dependency recalculation and blocker update | 1.47 ms | 2.25 ms | 300.00 ms | Pass |
| Seven-document fixture extraction after assets load | 12.98 ms | 18.21 ms | 5000.00 ms | Pass |
| Prepared review checkpoint load | 1.52 ms | 2.26 ms | 1500.00 ms | Pass |
| Export preview after approved state | 2.22 ms | 3.60 ms | 2000.00 ms | Pass |
| Deterministic replay completion | 0.51 ms | 0.84 ms | 8000.00 ms | Pass |

## Manual Checks

- README beginner setup and limitations: Passed by line-by-line local review.
- README environment names and provider boundaries: Passed by line-by-line local review; names only, no values.
- Performance output consistency: Passed by final ordered measurement review.
- TASK-037 external-target selection: Passed by `--list`; stable target selection is configured and discoverable without executing the stable rehearsal.
- Local prepared checkpoint judged sequence: Passed by local Playwright E2E rehearsal, including successful local PDF generation after TASK-036 reconciliation.
- TASK-038 replay-only public gate: Passed by exact production GET and five stable rehearsals; live availability is disabled, prepared replay is selectable, and no POST or provider call occurred.
- Stable prepared-checkpoint judged sequence: Passed five times serially through the exact stable alias, including blocked export, evidence withdrawal, renewed Nexus review, exact limitation preservation, local PDF generation, Trust evidence, and zero provider transmission.
- Full-practitioner and minimum-necessary safe-share separate off-camera purposes: Not run.
- Checklist evidence review: Passed after final command output update.
- `vercel.json` absence and deployment state: Passed. `vercel.json` remains absent, and read-only metadata confirms the exact production deployment ID, Git SHA, `READY` state, and stable alias.
- Stable URL and stable System Card comparison: Not run manually. The automated stable rehearsal verified Trust evidence, but that does not replace the separate manual comparison.
- Final git status and diff scope review: Passed. Current uncommitted follow-up diff is limited to `RELEASE_CHECKLIST.md`.
- Generated Playwright artifact review: Passed. No generated Playwright artifact folder remains.

## Approval Gates

Approved:
- Main push for the final replay-only build
- Replay-only production deployment through the existing connected project
- Stable-URL access after the final build is confirmed deployed
- Five prepared-checkpoint production rehearsals

Approved and performed within that scope:
- Exact replay-only production deployment confirmation for Git SHA `55bb075df19c6046143a37d2cfd8bc2388f18f2d`
- One read-only `GET /api/analyze`
- Five serial stable prepared-checkpoint rehearsals

Explicitly not approved:
- Public live AI
- Live provider calls or evaluation
- Credential or provider-account changes
- Billing or spend changes
- Firewall, quota, or other Vercel/production-setting changes

Current execution state:
- Exact replay-only production deployment is confirmed `READY` for Git SHA `55bb075df19c6046143a37d2cfd8bc2388f18f2d` at the stable alias.
- Production availability and five serial rehearsals passed with public live AI disabled and prepared replay selectable.
- TASK-025 is ready for integration after this truthful checklist evidence commit.
- Manual checks listed under Not Run remain unperformed and must not be promoted.
- Commit approval: Present for `docs: finalize replay-only production verification`.
