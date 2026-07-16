# Trusted replay fixtures

TASK-010 keeps replay and checkpoint payloads in a compile-time registry at
`lib/analysis/replay.ts`. This directory is intentionally present only as the
owned fixture namespace for the task; browser and persisted data cannot extend
the registry.
