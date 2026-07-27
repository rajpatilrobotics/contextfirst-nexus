# Offline browser-pipeline quality evaluation

- Status: **PASSED**
- Engine: `browser_local_deterministic`
- Adapter: `browser-deterministic-analysis-v5`
- Provider transmissions: no
- Network calls: 0
- Scenarios: 6/6 passed
- Checks: 43/43 passed
- Report digest: `7196b4b76532e046c44eaa3e9f20a7440a74471887a213c469fe6a339f4ee5e4`

| Scenario | Status | Candidates | Citations | Checks |
|---|---:|---:|---:|---:|
| Representative source-grounded three-lane packet | PASSED | 26 | 28 | 15/15 |
| Unrelated technical packet abstains | PASSED | 0 | 0 | 7/7 |
| Mixed packet cites only the relevant source | PASSED | 11 | 11 | 9/9 |
| Instruction-like advisory text cannot create evidence | PASSED | 0 | 0 | 8/8 |
| Incomplete masking review blocks analysis | PASSED | 0 | 0 | 2/2 |
| Failed deterministic leak scan blocks analysis | PASSED | 0 | 0 | 2/2 |

## Failed checks

- None.

## Limitations

- This suite evaluates frozen synthetic scenarios; it is not evidence of real-case, legal, or production validation.
- The deterministic engine is pattern-based and cannot replace qualified human review or semantic model evaluation.
- No live provider is called or admitted by this report. Live-provider quality and data-policy evaluation remain separate.
