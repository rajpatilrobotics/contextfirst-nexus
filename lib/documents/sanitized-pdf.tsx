import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { SanitizedTextPacket } from "./sanitized-document";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#101a33",
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.5,
    paddingBottom: 48,
    paddingHorizontal: 42,
    paddingTop: 42,
  },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 5 },
  subtitle: { color: "#526071", fontSize: 8, marginBottom: 12 },
  notice: {
    backgroundColor: "#f2f0ea",
    borderColor: "#d7d2c7",
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 14,
    padding: 8,
  },
  document: { marginBottom: 14 },
  documentTitle: {
    borderBottomColor: "#d7d2c7",
    borderBottomWidth: 1,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 7,
    paddingBottom: 3,
  },
  pageSection: { marginBottom: 10 },
  pageTitle: { color: "#526071", fontSize: 8, fontWeight: 700, marginBottom: 3 },
  body: { fontSize: 9 },
  limitation: { color: "#7a4f18", fontSize: 8, marginTop: 4 },
  footer: {
    bottom: 20,
    color: "#66727e",
    fontSize: 7,
    left: 42,
    position: "absolute",
    right: 42,
    textAlign: "center",
  },
});

export function SanitizedTextPdfDocument({
  packet,
}: {
  packet: SanitizedTextPacket;
}) {
  return (
    <Document title={`ContextFirst sanitized text ${packet.caseId}`}>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>ContextFirst Nexus sanitized text derivative</Text>
        <Text style={styles.subtitle}>
          Browser-local case {packet.caseId} · generated {packet.generatedAt} ·
          approved masks {packet.approvedMaskCount}
        </Text>
        <View style={styles.notice}>
          <Text>
            This new PDF contains approved redacted extracted text only. It does
            not modify the original PDF or preserve its exact visual layout.
            Pages without extractable text are omitted. Review this derivative
            before sharing.
          </Text>
        </View>

        {packet.documents.map((document) => (
          <View key={document.documentId} style={styles.document} wrap>
            <Text style={styles.documentTitle}>Document {document.documentId}</Text>
            {document.pages.map((page) => (
              <View key={page.pageNumber} style={styles.pageSection} wrap>
                <Text style={styles.pageTitle}>Source page {page.pageNumber}</Text>
                <Text style={styles.body}>{page.text}</Text>
              </View>
            ))}
            {document.omittedPageNumbers.length > 0 ? (
              <Text style={styles.limitation}>
                Omitted source pages without extractable text:{" "}
                {document.omittedPageNumbers.join(", ")}
              </Text>
            ) : null}
          </View>
        ))}

        <Text
          fixed
          render={({ pageNumber, totalPages }) =>
            `Sanitized text derivative · ${packet.caseId} · Page ${pageNumber} of ${totalPages}`
          }
          style={styles.footer}
        />
      </Page>
    </Document>
  );
}

export async function renderSanitizedTextPdf(
  packet: SanitizedTextPacket,
): Promise<Blob> {
  return pdf(<SanitizedTextPdfDocument packet={packet} />).toBlob();
}
