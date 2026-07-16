import guidancePack from "../../fixtures/guidance/guidance-pack.json";
import { GuidancePackSchema, type GuidanceCard } from "../contracts";

function compareUnicodeCodePoints(left: string, right: string) {
  const leftPoints = Array.from(left);
  const rightPoints = Array.from(right);
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    const difference = leftPoints[index].codePointAt(0)! - rightPoints[index].codePointAt(0)!;
    if (difference !== 0) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort(compareUnicodeCodePoints)
      .map((key) => `${JSON.stringify(key)}:${canonicalize((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  if (value === undefined) throw new Error("Canonical JSON does not permit undefined values.");
  return JSON.stringify(value);
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function guidancePackDigestProjection(cards: GuidanceCard[]) {
  return {
    schemaVersion: "1.0.0" as const,
    cards: [...cards].sort((left, right) => compareUnicodeCodePoints(left.id, right.id)),
  };
}

export async function computeGuidancePackDigest(cards: GuidanceCard[]) {
  return sha256Hex(canonicalize(guidancePackDigestProjection(cards)));
}

export const bundledGuidancePack = GuidancePackSchema.parse(guidancePack);

export function getGuidanceCardBySourceRegisterId(sourceRegisterId: string) {
  return (
    bundledGuidancePack.cards.find((card) => card.sourceRegisterId === sourceRegisterId) ?? null
  );
}
