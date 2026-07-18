"use client";

import {
  Check,
  Circle,
  FileCheck2,
  FileText,
  LoaderCircle,
  Replace,
  Trash2,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useRef,
  useState,
} from "react";
import { Alert, Button, Card } from "../../components/ui";
import {
  validateCfnDemoPdfSelection,
  type CfnDemoPdfSelectionIssue,
  type CfnDemoPdfSelectionValidation,
} from "../../lib/documents";

export const PDF_SELECTION_STAGES = [
  "selected",
  "verified",
  "processing",
  "ready",
] as const;

export type PdfSelectionStage = (typeof PDF_SELECTION_STAGES)[number];

export type ReadyPdfBatch = {
  files: readonly File[];
  totalBytes: number;
};

export type PdfBatchReadyHandler = (
  batch: ReadyPdfBatch,
) => Promise<void> | void;

export type PdfSelectionValidator = (
  files: readonly File[],
) => Promise<CfnDemoPdfSelectionValidation>;

export type PdfSelectionProcessor = (
  files: readonly File[],
) => Promise<void>;

type SelectedPdf = {
  id: string;
  file: File;
  stage: PdfSelectionStage | "error";
  error?: string;
};

const STAGE_LABELS: Record<PdfSelectionStage, string> = {
  selected: "Selected",
  verified: "Verified",
  processing: "Processing",
  ready: "Ready",
};

function fileId(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

function readableSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayFileName(name: string) {
  return name
    .replace(/synthetic[_-]?/gi, "")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function issueMessage(issue: CfnDemoPdfSelectionIssue) {
  const messages: Record<CfnDemoPdfSelectionIssue["code"], string> = {
    wrong_file_count: "Select the complete seven-file demo set.",
    duplicate_file_name: "Remove the duplicate file and select the set again.",
    unknown_file_name: "This file is not part of the hackathon demo set.",
    invalid_file_type: "Choose the original PDF version of this demo file.",
    invalid_pdf_header: "This file does not contain a valid PDF header.",
    invalid_file_size: "This demo file does not match the expected file size.",
    digest_mismatch: "This demo file did not pass integrity verification.",
  };
  return messages[issue.code];
}

function StageTrail({ current }: { current: PdfSelectionStage }) {
  const currentIndex = PDF_SELECTION_STAGES.indexOf(current);

  return (
    <ol
      aria-label={`File status: ${STAGE_LABELS[current]}`}
      className="grid grid-cols-4 gap-1"
    >
      {PDF_SELECTION_STAGES.map((stage, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li className="min-w-0" key={stage}>
            <div
              aria-hidden="true"
              className={`mb-2 h-1 rounded-full ${
                complete || active
                  ? "bg-[var(--color-brand)]"
                  : "bg-[var(--color-border)]"
              }`}
            />
            <div
              className={`flex items-center gap-1 text-xs sm:text-sm ${
                active
                  ? "font-semibold text-[var(--color-ink)]"
                  : complete
                    ? "text-[var(--color-brand)]"
                    : "text-[var(--color-ink-muted)]"
              }`}
            >
              {complete ? (
                <Check aria-hidden="true" className="shrink-0" size={14} />
              ) : active && stage === "processing" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="shrink-0 animate-spin"
                  size={14}
                />
              ) : (
                <Circle aria-hidden="true" className="shrink-0" size={12} />
              )}
              <span className="truncate">{STAGE_LABELS[stage]}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function PdfSelectionPanel({
  onClear,
  onReset,
  onReady,
  processFiles,
  replaceAllowed = true,
  validateSelection = validateCfnDemoPdfSelection,
}: {
  onClear?: () => void;
  onReset?: () => void;
  onReady?: PdfBatchReadyHandler;
  processFiles: PdfSelectionProcessor;
  replaceAllowed?: boolean;
  validateSelection?: PdfSelectionValidator;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<SelectedPdf[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [announcement, setAnnouncement] = useState(
    "No documents selected.",
  );
  const [selectionError, setSelectionError] = useState<string | null>(null);

  function clearDocuments() {
    setDocuments([]);
    setSelectionError(null);
    setAnnouncement("Document selection cleared.");
    onClear?.();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function selectFiles(fileList: FileList | readonly File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    onReset?.();

    const selected = files.map((file, index) => ({
      id: fileId(file, index),
      file,
      stage: "selected" as const,
    }));
    setDocuments(selected);
    setSelectionError(null);
    setAnnouncement(
      `${files.length} PDF ${files.length === 1 ? "file" : "files"} selected. Verifying now.`,
    );

    const validation = await validateSelection(files);
    if (validation.status !== "verified") {
      const issueByName = new Map(
        validation.issues
          .filter((issue) => issue.fileName)
          .map((issue) => [issue.fileName as string, issue]),
      );
      setDocuments((current) =>
        current.map((document) => {
          const issue = issueByName.get(document.file.name);
          return issue
            ? { ...document, stage: "error", error: issueMessage(issue) }
            : document;
        }),
      );
      setSelectionError(
        validation.issues.some((issue) => issue.code === "wrong_file_count")
          ? "Select all seven demo PDFs together, then try again."
          : "The selected set did not pass browser verification. Review the highlighted files and replace the set.",
      );
      setAnnouncement("The selected PDF set did not pass verification.");
      return;
    }

    const verifiedNames = new Set(
      validation.files
        .filter(
          (file) =>
            file.selectionStatus === "selected" &&
            file.verificationStatus === "verified" &&
            file.readinessStatus === "ready",
        )
        .map((file) => file.fileName as string),
    );
    setDocuments((current) =>
      current.map((document) =>
        verifiedNames.has(document.file.name)
          ? { ...document, stage: "verified" }
          : document,
      ),
    );
    setAnnouncement(`${validation.files.length} demo PDFs verified.`);

    await Promise.resolve();
    setDocuments((current) =>
      current.map((document) =>
        document.stage === "verified"
          ? { ...document, stage: "processing" }
          : document,
      ),
    );
    setAnnouncement(
      `${validation.files.length} verified PDFs are processing in this browser.`,
    );

    const readyFiles = validation.files.map((file) => file.file);
    try {
      await processFiles(readyFiles);
      setDocuments((current) =>
        current.map((document) =>
          document.stage === "processing"
            ? { ...document, stage: "ready" }
            : document,
        ),
      );
      await onReady?.({
        files: readyFiles,
        totalBytes: readyFiles.reduce((total, file) => total + file.size, 0),
      });
      setAnnouncement(`${readyFiles.length} of ${files.length} files are ready.`);
    } catch {
      setDocuments((current) =>
        current.map((document) =>
          document.stage === "processing"
            ? {
                ...document,
                stage: "error",
                error: "Browser processing could not finish. Replace the set and try again.",
              }
            : document,
        ),
      );
      setSelectionError(
        "The verified PDFs could not be processed in this browser. No file was marked ready.",
      );
      setAnnouncement("PDF processing failed safely.");
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files) {
      void selectFiles(event.currentTarget.files);
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    void selectFiles(event.dataTransfer.files);
  }

  const readyCount = documents.filter(
    (document) => document.stage === "ready",
  ).length;

  return (
    <section aria-labelledby="pdf-intake-heading" className="grid gap-4">
      <Card className="grid gap-5 p-5 sm:p-6">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-[var(--color-brand)]">
            <FileCheck2 aria-hidden="true" size={20} />
            <p className="cfn-type-label">Hackathon demo · demo-only data</p>
          </div>
          <h2 className="cfn-type-heading-2" id="pdf-intake-heading">
            Add case documents
          </h2>
          <p className="max-w-2xl text-[var(--color-ink-muted)]">
            Start with an empty workspace. Choose the seven demo PDFs to see
            each file move through intake. Do not upload real or sensitive data.
          </p>
        </div>

        <div
          className={`grid min-h-48 place-items-center rounded-[var(--radius-card)] border-2 border-dashed p-6 text-center transition-colors ${
            isDragging
              ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)]"
              : "border-[var(--color-control-border)] bg-[var(--color-surface-subtle)]"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="grid justify-items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-brand)] shadow-sm">
              <Upload aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="font-semibold">Drop PDFs here</p>
              <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
                or choose multiple files from your Mac
              </p>
            </div>
            <Button
              onClick={() => inputRef.current?.click()}
              variant="primary"
            >
              Choose PDF files
            </Button>
            <input
              accept="application/pdf,.pdf"
              aria-label="Choose PDF files"
              className="sr-only"
              multiple
              onChange={handleInputChange}
              ref={inputRef}
              type="file"
            />
          </div>
        </div>

        <p aria-atomic="true" aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {selectionError ? (
          <Alert title="Document set needs attention" tone="danger">
            <p>{selectionError}</p>
          </Alert>
        ) : null}

        {documents.length === 0 ? (
          <Alert title="No documents selected yet">
            <p>
              The document list is empty. Nothing has been pre-filled or marked
              as processed.
            </p>
          </Alert>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="cfn-type-heading-3">Selected documents</h3>
                <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
                  {readyCount} of {documents.length} ready
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {replaceAllowed ? (
                  <Button onClick={() => inputRef.current?.click()}>
                    <Replace aria-hidden="true" size={16} />
                    Replace files
                  </Button>
                ) : null}
                <Button onClick={clearDocuments} variant="danger">
                  <Trash2 aria-hidden="true" size={16} />
                  Reset document intake
                </Button>
              </div>
            </div>

            <ul aria-label="Selected PDF files" className="grid gap-3">
              {documents.map((document) => (
                <li
                  className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  key={document.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[var(--color-brand)]"
                      size={20}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {displayFileName(document.file.name)}
                      </p>
                      <p className="cfn-type-body-small text-[var(--color-ink-muted)]">
                        PDF · {readableSize(document.file.size)}
                      </p>
                    </div>
                  </div>

                  {document.stage === "error" ? (
                    <Alert
                      title={`${displayFileName(document.file.name)} needs attention`}
                      tone="danger"
                    >
                      <p>{document.error}</p>
                    </Alert>
                  ) : (
                    <StageTrail current={document.stage} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </section>
  );
}
