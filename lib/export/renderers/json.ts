import type { ExportManifest } from "../../contracts";
import { canonicalJson } from "../core";

export function renderExportJson(manifest: ExportManifest): string {
  return canonicalJson(manifest);
}
export function renderExportJsonBlob(manifest: ExportManifest): Blob {
  return new Blob([renderExportJson(manifest)], { type: "application/json;charset=utf-8" });
}
