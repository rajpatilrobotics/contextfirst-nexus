export function downloadLocalBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
export function exportFilename(kind: "pdf" | "json", manifestId: string) {
  const safeId = manifestId.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return `contextfirst-${safeId}.${kind}`;
}
