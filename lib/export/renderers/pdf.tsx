import { Document, Font, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { ExportManifest } from "../../contracts";
import { buildExportDocumentSections } from "./document-model";

// Move long IDs and hashes as whole words so extracted PDF text preserves parity values exactly.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    color: "#17202a",
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.45,
    paddingBottom: 52,
    paddingHorizontal: 42,
    paddingTop: 42,
  },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
  subtitle: { color: "#465666", fontSize: 9, marginBottom: 16 },
  section: { marginBottom: 12 },
  sectionTitle: { borderBottomColor: "#cbd5df", borderBottomWidth: 1, fontSize: 12, fontWeight: 700, marginBottom: 5, paddingBottom: 3 },
  item: { marginBottom: 3 },
  footer: { bottom: 22, color: "#5f6d78", fontSize: 8, left: 42, position: "absolute", right: 42, textAlign: "center" },
});

export function ExportPdfDocument({ manifest }: { manifest: ExportManifest }) {
  const sections = buildExportDocumentSections(manifest);
  return (
    <Document title={`ContextFirst Nexus handoff ${manifest.id}`}>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.title}>ContextFirst Nexus practitioner handoff</Text>
        <Text style={styles.subtitle}>Canonical manifest {manifest.id} · reviewed-state hash {manifest.reviewedStateHash}</Text>
        {sections.map((section) => (
          <View key={section.id} style={styles.section} wrap>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, index) => (
              <Text key={`${section.id}-${index}`} style={styles.item}>• {item}</Text>
            ))}
          </View>
        ))}
        <Text
          fixed
          render={({ pageNumber, totalPages }) => `Synthetic case · ${manifest.id} · Page ${pageNumber} of ${totalPages}`}
          style={styles.footer}
        />
      </Page>
    </Document>
  );
}

export async function renderExportPdf(manifest: ExportManifest): Promise<Blob> {
  return pdf(<ExportPdfDocument manifest={manifest} />).toBlob();
}
