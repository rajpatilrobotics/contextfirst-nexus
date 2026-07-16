import guidancePack from "../../fixtures/guidance/guidance-pack.json";

export const bundledGuidancePack = guidancePack;

export function getGuidanceCardBySourceRegisterId(sourceRegisterId: string) {
  return (
    bundledGuidancePack.cards.find((card) => card.sourceRegisterId === sourceRegisterId) ?? null
  );
}
