import type { SafeLogMetadata } from "../ai/server/types";

const ALLOWED_KEYS = new Set<keyof SafeLogMetadata>([
  "requestId",
  "runId",
  "providerId",
  "releaseConfigurationId",
  "stage",
  "code",
  "availabilityStatus",
  "evaluationStatus",
]);

const PROHIBITED_VALUE = /(sk-[a-z0-9_-]+|api[_-]?key|secret|token|cookie|-----BEGIN|SYSTEM OVERRIDE|hide contradictions|provider body|rawText|redactedText|review reason)/i;

export function safeLogMetadata(input: Record<string, unknown>): SafeLogMetadata {
  const output: SafeLogMetadata = {};
  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED_KEYS.has(key as keyof SafeLogMetadata) || typeof value !== "string") {
      continue;
    }
    if (PROHIBITED_VALUE.test(value)) {
      continue;
    }
    output[key as keyof SafeLogMetadata] = value as never;
  }
  return output;
}

export function safeLogEvent(event: string, metadata: Record<string, unknown>) {
  return {
    event: PROHIBITED_VALUE.test(event) ? "ai_boundary_event" : event,
    metadata: safeLogMetadata(metadata),
  };
}
