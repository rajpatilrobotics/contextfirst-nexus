import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContextFirst Nexus",
  description:
    "Synthetic source-grounded case preparation for qualified practitioners reviewing trafficking-related forced criminality.",
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
