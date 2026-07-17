import "server-only";

export function isLiveAnalysisEnabled(): boolean {
  return process.env.ENABLE_LIVE_ANALYSIS === "true";
}
