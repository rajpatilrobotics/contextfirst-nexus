import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContextFirst Nexus",
  description:
    "Source-grounded case preparation for trafficking-related forced criminality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
