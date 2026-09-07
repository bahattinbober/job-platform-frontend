import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display face. Variable width axis lets headlines run narrow without a second file.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

const body = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

// Reserved for measurements: match scores, dates, counts.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inroads",
  description:
    "Find the roles that fit your CV, and the people you already know inside those companies.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}