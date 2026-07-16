import { FileText } from "lucide-react";
import {
  DocumentRecordSchema,
  type DocumentRecord,
} from "../../lib/contracts";
import { cfnDemoFixture } from "../../lib/fixtures";
import { Card } from "../../components/ui";

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
    return (
      <Card>
        <h3 className="cfn-type-heading-3">No synthetic documents available</h3>
        <p>The bundled fixture manifest did not provide a document record. Nothing was treated as processed.</p>
      </Card>
    );
  }

  return (
    <section aria-labelledby="document-list-heading" className="grid gap-4">
      <div>
        <h2 className="cfn-type-heading-2" id="document-list-heading">
          Bundled synthetic packet
        </h2>
        <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
          Seven application-managed, read-only PDFs. There is no upload or free-text case input.
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {documents.map((document) => (
          <Card className="grid min-w-0 gap-4" key={document.id}>
            <div className="flex items-start gap-3">
              <FileText aria-hidden="true" className="mt-1 shrink-0" size={20} />
              <div className="min-w-0">
                <p className="cfn-type-label text-[var(--color-warning)]">
                  Synthetic training record
                </p>
                <h3 className="cfn-type-heading-3 break-words">
                  <span className="cfn-type-code">{document.id}</span> · {document.displayName}
                </h3>
              </div>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="cfn-type-label">Source type</dt>
                <dd>{SOURCE_TYPE_LABELS[document.sourceType]}</dd>
              </div>
              <div>
                <dt className="cfn-type-label">Expected pages</dt>
                <dd>{document.expectedPageCount}</dd>
              </div>
              <div>
                <dt className="cfn-type-label">Language</dt>
                <dd>English (en), original language</dd>
              </div>
              <div>
                <dt className="cfn-type-label">Processing state</dt>
                <dd className="capitalize">{document.processingStatus}</dd>
              </div>
              <div>
                <dt className="cfn-type-label">Data origin</dt>
                <dd>Bundled synthetic fixture</dd>
              </div>
              <div>
                <dt className="cfn-type-label">Source copy</dt>
                <dd>Application-managed and read-only</dd>
              </div>
            </dl>

            <div>
              <h4 className="cfn-type-label">Page availability</h4>
              <ul className="mt-2 grid gap-2" aria-label={`${document.id} page availability`}>
                {document.pages.map((page) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 py-2 text-sm"
                    key={page.id}
                  >
                    <span>
                      Page {page.pageNumber} <span className="cfn-type-code">({page.id})</span>
                    </span>
                    <span className={page.availability === "available" ? "" : "font-semibold text-[var(--color-warning)]"}>
                      {PAGE_AVAILABILITY_LABELS[page.availability]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
