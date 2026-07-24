import type { Metadata } from "next";
import {
  IBM_Plex_Sans,
  JetBrains_Mono,
  Libre_Baskerville,
} from "next/font/google";
import "./globals.css";

const sansFont = IBM_Plex_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-cfn-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const displayFont = Libre_Baskerville({
  display: "swap",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cfn-display",
  weight: ["400", "700"],
});

const monoFont = JetBrains_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-cfn-mono",
  weight: ["400", "500"],
});

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
      <body className={`${sansFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
