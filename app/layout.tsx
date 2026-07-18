import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContextFirst Nexus",
  description:
    "Fictional, source-grounded case preparation demo for qualified practitioners reviewing trafficking-related forced criminality.",
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
