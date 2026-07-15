# TASK-001: Dependency and verification bootstrap

## 1. Task metadata

- Status: Pending
- Readiness rule: Only the coordinator may mark this task Ready after all dependencies, approvals, and exact package-version decisions are integrated.
- Stage: foundation
- Wave: 1
- Risk: high
- Suggested branch: `task/001-dependency-bootstrap`
- Depends on: None
- Graph outcome: Install every approved dependency, configure all verification tools and scripts, and copy the pinned PDF.js worker locally without adding application behavior.

## 2. Goal

Create one reproducible, pinned dependency and verification foundation that later worktrees can consume without editing shared package or tool configuration.

## 3. Why this task exists

All later tasks depend on the same TypeScript, lint, test, browser-test, PDF, UI, export, validation, and provider SDK foundation. Completing this bootstrap once prevents concurrent package changes, keeps the MacBook Air M2 workflow lightweight, and makes every later verification command available from a clean checkout.

## 4. Dependencies and base requirement

- This task has no task dependency, but it must start from the coordinator-approved documentation base revision.
- The documentation package must be approved and pushed, as required by `TASK_GRAPH.yaml`.
- Before this task can be marked Ready, `decision-log.md` must record exact approved versions for the official OpenAI, `@google/genai`, and `@mistralai/mistralai` SDKs. The selected Mistral SDK version must also have a recorded result for advisory `GHSA-jgg6-4rpr-wfh7`.
- The base must retain the current Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4 application. This task does not migrate frameworks or move the root `app` directory.
- No provider credential, provider account access, cloud setting, billing change, or live model call is required.

## 5. Required context

Read in this order before editing:

1. `AGENTS.md` in full.
2. `tasks/TASK-001.md` in full.
3. `PLANS.md` in full.
4. The `TASK-001` entry in `TASK_GRAPH.yaml`.
5. `docs/CONTEXT_INDEX.md` in full.
6. `docs/ARCHITECTURE.md` Sections 3 through 7, 15, and 16.
7. `docs/TESTING_AND_EVALUATION.md` Sections 3, 4, 6, and 17.
8. `docs/MODEL_ROUTING.md` Section 12.
9. `docs/SOURCE_REGISTER.md` entries TECH-005, TECH-008 through TECH-013, TECH-019, TECH-024, TECH-027, and TECH-035, plus Section 11.
10. `decision-log.md` decisions DEC-011 through DEC-019 and Section 8, including the coordinator-recorded exact provider SDK versions and Mistral advisory result.
11. The current contents of every owned file and the current Git status.

## 6. Exclusive write scope

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next-env.d.ts`
- `eslint.config.mjs`
- `vitest.config.ts`
- `playwright.config.ts`
- `components.json`
- `postcss.config.mjs`
- `scripts/copy-pdfjs-assets.mjs`
- `public/vendor/pdfjs/`
- `tests/setup/`

## 7. Read-only context allowed

- `app/`
- `components/`
- `lib/`
- `features/`
- `fixtures/`
- `tests/` outside `tests/setup/`
- `.gitignore`
- All coordinator-owned documentation and task packets

Read-only inspection is allowed only to confirm current imports, framework style, and test-environment needs. It does not grant permission to fix application code.

## 8. Out of scope

- Application routes, pages, layouts, feature components, domain logic, shared contracts, fixtures, prompts, provider adapters, or exports.
- Adding a database, OCR, analytics, agent framework, Vercel AI SDK, vector search, chart library, or any other excluded technology.
- Creating shadcn feature components that belong to TASK-004.
- Adding or changing environment variables, `.env` files, provider credentials, Vercel settings, deployment targets, billing, quotas, or firewall rules.
- Running live provider evaluation or making any provider API call.
- Updating `decision-log.md` or another coordinator-owned document from this worktree.

## 9. Frozen contracts and invariants

- Use exact dependency versions, not ranges, for direct dependencies added or changed by this task.
- Preserve Node support `>=22.13.0 <27`; the deployment target remains Node 24.
- Preserve the documented versions `pdfjs-dist@6.1.200`, `zod@4.4.3`, `@react-pdf/renderer@4.5.1`, `lucide-react@1.24.0`, `vitest@4.1.10`, `@playwright/test@1.61.1`, `@axe-core/playwright@4.12.1`, `shadcn@4.13.0`, `server-only@0.0.1`, `@testing-library/react@16.3.2`, `@testing-library/jest-dom@6.9.1`, `@testing-library/user-event@14.6.1`, `jsdom@29.1.1`, `eslint@10.7.0`, and `eslint-config-next@16.2.10`.
- Preserve the existing approved Next.js, React, React DOM, Tailwind CSS, TypeScript, and type-package versions unless the coordinator records an approved change first.
- Install only official native OpenAI, Google GenAI, and Mistral SDKs at the exact versions already recorded by the coordinator. Do not use an aggregator or an OpenAI-compatible shortcut for Google or Mistral.
- API keys remain server-side and never appear in package scripts, tracked files, URLs, browser configuration, logs, test setup, or task output.
- `npm run verify` must contain deterministic checks and the production build. It must not make live provider calls or require credentials.
- The planned scripts must exist: `typecheck`, `lint`, `test:unit`, `test:contracts`, `test:components`, `test:e2e`, `test:a11y`, `eval`, `build`, `verify`, and `assets:pdfjs`.
- TypeScript strict mode remains enabled. ESLint must not ignore application errors merely to pass.
- Vitest must support pure domain, contract, and React component tests with the shared setup under `tests/setup/`.
- Playwright and axe configuration must target production-like browser checks without embedding secrets.
- The PDF.js worker must be copied from the pinned installed package into `public/vendor/pdfjs/pdf.worker.min.mjs` by a reviewed, deterministic, idempotent local script. No runtime CDN is permitted.
- Provider SDKs, PDF.js, and the PDF renderer must not be pulled into the landing-page browser bundle by bootstrap configuration.
- No high or critical dependency vulnerability affecting a deployed path may be ignored without a coordinator-recorded, time-bounded exception and mitigation.

## 10. Implementation steps

1. Inspect Git status, all owned files, current package versions, and existing scripts without modifying unowned work.
2. Confirm that every exact provider SDK version and the Mistral advisory result are already recorded in `decision-log.md`. Stop if they are absent.
3. Update the package manifest with only the approved pinned runtime and development dependencies, the supported Node range, and the frozen verification scripts.
4. Regenerate the npm lockfile from the approved manifest without installing global packages or changing package managers.
5. Configure strict TypeScript, Next.js ESLint, Vitest, Testing Library setup, Playwright, axe support, Tailwind PostCSS, and the local shadcn registry metadata within the owned files.
6. Implement the local PDF.js asset-copy script so it validates its source and destination and produces `public/vendor/pdfjs/pdf.worker.min.mjs` deterministically.
7. Run the graph verification commands in the listed order. Fix only bootstrap-owned causes.
8. Inspect the final diff for unowned files, dependency drift, secrets, disabled checks, generated noise, and application behavior.

## 11. Acceptance criteria

- A clean checkout can run `npm ci` successfully on the supported Node range with no package-manager change.
- Every direct dependency is exactly pinned and matches an authoritative approved version, including the three coordinator-recorded provider SDK versions.
- `package-lock.json` matches `package.json` and contains no unexplained duplicate runtime package for an already approved responsibility.
- All frozen verification scripts exist and point to real configuration or test locations. `verify` performs deterministic verification and a production build without live model evaluation.
- TypeScript strict checking, Next.js linting, Vitest, Testing Library, Playwright, and axe are configured without suppressing genuine application failures.
- `components.json` supports the existing root app and Tailwind setup without generating feature UI or changing design contracts.
- Running the asset script creates the exact same local PDF.js worker on repeated runs and never downloads a runtime asset from a CDN.
- `public/vendor/pdfjs/pdf.worker.min.mjs` exists after the asset step and comes from `pdfjs-dist@6.1.200`.
- No application route, page, component, domain module, fixture, prompt, environment file, or coordinator-owned document changes.
- No secret, key fragment, provider account detail, private URL, or raw environment value appears in the diff.
- Every graph verification command passes. Any unresolved high or critical vulnerability affecting a deployed path is reported as a blocker rather than hidden.

## 12. Verification commands

```text
npm ci
npm run assets:pdfjs
test -f public/vendor/pdfjs/pdf.worker.min.mjs
npm run typecheck
npm run lint
npm run build
```

## 13. Manual checks

1. Open `package.json` and confirm every direct dependency uses one exact version, the Node engine is `>=22.13.0 <27`, and no live evaluation is part of `verify`.
2. Compare the three provider SDK versions with the approved entries in `decision-log.md`; confirm the Mistral version has the recorded advisory check.
3. Inspect each shared configuration file and confirm it enables its check instead of ignoring errors, excluding application folders, or using credentials.
4. Run the PDF.js asset step twice and inspect the destination metadata or diff; the second run must produce no content change and the script must use only the installed local package.
5. Inspect the production build output and dependency graph for accidental client imports of server-only provider SDKs and for PDF.js or the PDF renderer in the landing-page initial bundle. Report uncertainty rather than making an unsupported bundle claim.
6. Review the final Git diff and confirm every changed path is in Section 6 and no application behavior was added.

## 14. Commit permission and message

- Permission: Yes only when the opening coordinator prompt explicitly authorizes the commit; otherwise leave a verified uncommitted diff.
- Message: `chore: bootstrap dependencies and verification`

## 15. Handoff requirements

- Report Task ID `TASK-001` and outcome as Complete, Partial, or Blocked.
- List every changed file and generated asset path exactly.
- List every installed direct dependency and exact version, including all three provider SDKs, without including account or credential details.
- State how the PDF.js worker is sourced and copied and whether the second asset run was unchanged.
- Report each Section 12 command with pass or fail status.
- Report any vulnerability review blocker, skipped check, assumption, or coordinator follow-up.
- Confirm that no application behavior, environment value, cloud setting, or unowned file changed.
- Include a commit hash only when the opening coordinator prompt authorized the commit; otherwise state `Not committed`.

## 16. Stop conditions

- Stop if the documentation base is not approved and integrated, or if another active task owns any path in Section 6.
- Stop if exact approved versions for any required package, especially the OpenAI, Google GenAI, or Mistral SDK, are absent or conflicting.
- Stop if the selected Mistral SDK advisory result is absent, affected without an approved safe version, or requires an unowned decision-log change.
- Stop if completing the task requires any file outside Section 6, a new unapproved dependency, a package-manager change, or a shared contract, fixture, prompt, provider, route, architecture, or design change.
- Stop if configuration would weaken strict checking, hide a failing test, remove an assertion, or make live provider evaluation part of deterministic verification.
- Stop if a command would require a secret, provider account, billing change, quota change, cloud change, deployment change, global install, `sudo`, or destructive action.
- Stop if a high or critical vulnerability affects the deployed path and no coordinator-recorded exception exists.
- Stop on any conflict among `AGENTS.md`, the authoritative documents, the task graph, and this packet. Report the exact passages to the coordinator.
