import { Check, TriangleAlert } from "lucide-react";
import {
  DocumentRecordSchema,
  type DocumentRecord,
} from "../../lib/contracts";
import { cfnDemoFixture } from "../../lib/fixtures";

const SOURCE_TYPE_LABELS: Record<DocumentRecord["sourceType"], string> = {
  recruitment_record: "Recruitment record",
  communication: "Communication",
  travel_record: "Travel or transport record",
  practitioner_note: "Practitioner note of a reported account",
  operational_financial_record: "Operational or financial record",
  proceeding_record: "Alleged-offence and procedural record",
  support_provider_note: "Support-provider note",
};

const PAGE_AVAILABILITY_LABELS: Record<
  DocumentRecord["pages"][number]["availability"],
  string
> = {
  available: "Available",
  missing: "Unavailable, missing page",
  unreadable: "Unavailable, unreadable page",
  image_only: "Unavailable, image-only page; OCR is not supported",
  skipped: "Unavailable, skipped page",
  manually_excluded: "Unavailable, manually excluded page",
  extraction_failed: "Unavailable, extraction failed",
};

export function initialSyntheticDocuments(): DocumentRecord[] {
  return cfnDemoFixture.documents.map((document) =>
    DocumentRecordSchema.parse({
      ...document,
      processingStatus: "pending",
      pages: document.pages.map((page) => ({
        ...page,
        extractionStatus: page.availability === "missing" ? "warning" : "pending",
      })),
    }),
  );
}
export function DocumentCards({ documents }: { documents: DocumentRecord[] }) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="document-list-heading" className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="cfn-type-heading-3" id="document-list-heading">
            Documents ready
          </h3>
          <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
            {documents.length} PDFs processed in this browser.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-sm font-semibold text-[var(--color-brand)]">
          <Check aria-hidden="true" size={15} /> {documents.length} ready
        </span>
      </div>
      <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {documents.map((document) => (
          <li
            className="relative grid min-w-0 gap-2 px-3 py-2.5 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center"
            data-document-id={document.id}
            key={document.id}
          >
            <span className="cfn-type-code font-semibold text-[var(--color-brand)]">
              {document.id}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{document.displayName}</p>
              <p className="truncate text-xs text-[var(--color-ink-muted)]">
                {SOURCE_TYPE_LABELS[document.sourceType]} · {document.expectedPageCount} pages
              </p>
            </div>
            {document.pages.some((page) => page.availability !== "available") ? (
              <details className="sm:text-right">
                <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-[var(--color-warning)]">
                  <TriangleAlert aria-hidden="true" size={15} /> Page issue
                </summary>
                <ul
                  aria-label={`${document.id} page availability`}
                  className="mt-2 grid gap-1 text-left text-sm sm:absolute sm:right-8 sm:z-10 sm:w-72 sm:rounded-[var(--radius-control)] sm:border sm:border-[var(--color-border)] sm:bg-[var(--color-surface)] sm:p-3 sm:shadow-[var(--shadow-elevated)]"
                >
                  {document.pages.map((page) => (
                    <li className="flex justify-between gap-3" key={page.id}>
                      <span>Page {page.pageNumber}</span>
                      <span className={page.availability === "available" ? "" : "font-semibold text-[var(--color-warning)]"}>
                        {PAGE_AVAILABILITY_LABELS[page.availability]}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand)]">
                <Check aria-hidden="true" size={15} /> Ready
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
