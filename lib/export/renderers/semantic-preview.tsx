import type { ExportManifest } from "../../contracts";
import { buildExportDocumentSections } from "./document-model";

export function SemanticExportPreview({ manifest }: { manifest: ExportManifest }) {
  const sections = buildExportDocumentSections(manifest);

  return (
    <article aria-labelledby="semantic-export-title" className="grid gap-6">
      <header className="grid gap-2">
        <p className="cfn-type-label text-[var(--color-ink-muted)]">Canonical manifest {manifest.id}</p>
        <h3 className="cfn-type-heading-3" id="semantic-export-title">Semantic handoff preview</h3>
        <p className="cfn-type-body-small">
          This readable preview, structured JSON, and generated PDF use this same reviewed and redacted manifest.
        </p>
      </header>
      {sections.map((section) => (
        <section className="grid gap-2" id={section.id} key={section.id}>
          <h4 className="font-semibold">{section.title}</h4>
          <ul className="grid gap-2 pl-5">
            {section.items.map((item, index) => (
              <li className="break-words" key={`${section.id}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
