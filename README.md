# ContextFirst Nexus

ContextFirst Nexus is a synthetic-only hackathon prototype for source-grounded case preparation in trafficking-related forced criminality matters. It helps a qualified practitioner inspect sources, review AI-assisted suggestions, and prepare a local handoff. It does not decide victim status, guilt, credibility, legal eligibility, case outcome, or legal advice.

## Local Setup

Use Node `>=22.13.0 <27`.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

The local demo uses only the bundled fictional adult fixture `CFN-DEMO-001`, fixture version `1.0.0`. Do not upload, paste, or enter real case, survivor, client, child, credential, or provider data.

## Demo Flow

1. Open the synthetic case from the landing page.
2. Complete the Case Purpose Brief or load the prepared checkpoint.
3. Use `Load prepared checkpoint` for the local replay-based rehearsal.
4. Confirm the labels `Prepared synthetic review checkpoint` and `Bundled deterministic replay, not live AI`.
5. Review exact sources, complete individual decisions, show the blocked export, withdraw `CAND-TASK-0402`, renew the affected Nexus reviews, and create the local handoff.
6. Use `Reset Case` to clear the disclosed browser-session state and return to the synthetic demo start.

Exports are local browser downloads only. The app does not email, upload, file, refer, or otherwise transmit a handoff.

## Live Provider Boundary

Public live analysis is disabled by default. The prepared checkpoint and bundled replay make no provider transmission.

Optional live-provider configuration is server-side only. Environment names are documented so developers know where configuration belongs, but values must never be committed or placed in browser code:

- `ENABLE_LIVE_ANALYSIS`
- `NEXT_PUBLIC_ENABLE_LIVE_ANALYSIS`
- `NEXT_PUBLIC_ENABLE_DEMO_REPLAY`
- `ENABLE_OPENAI_ANALYSIS`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_REASONING_EFFORT`
- `ENABLE_GEMINI_ANALYSIS`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_SERVICE_TIER`
- `ENABLE_MISTRAL_ANALYSIS`
- `MISTRAL_API_KEY`
- `MISTRAL_MODEL`
- `MISTRAL_SERVICE_TIER`
- `MISTRAL_REASONING_EFFORT`

Do not put provider keys in source code, Git, URLs, logs, exports, or any `NEXT_PUBLIC_` variable. Mistral remains unavailable unless its exact release, static admission, and deployed-account availability gates pass.

## Useful Commands

```bash
npm run verify
npm run test:e2e
npm run test:a11y
npm run measure:performance -- --mode prepared-checkpoint
npm run build
```

The performance command measures the local prepared-checkpoint path with one warm-up and 20 measured samples. It reports median, p95, thresholds, fixture, checkpoint, replay provenance, environment, and pass or miss.

Do not run the stable-URL Playwright rehearsal unless deployment or production verification is separately approved and the approved build is confirmed at that URL.

## Current Limitations

- Synthetic fixture only; no real case data or child cases.
- No production authentication, database, durable case store, live investigation, scraping, biometrics, or external transmission.
- No production-readiness, WCAG conformance, legal-validation, guaranteed privacy, anonymity, zero-retention, or real-case readiness claim.
- Automated accessibility checks do not replace manual keyboard, VoiceOver, zoom, reflow, and reduced-motion review.
- Provider model availability, pricing, quotas, data-use terms, and hosting facts must be rechecked before any public provider enablement or deployment claim.
