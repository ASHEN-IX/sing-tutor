import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VocalAI — AI-Powered Singing Coach",
  description: "An AI-powered singing coach designed for teenagers, offering visual song learning, real-time feedback, and engaging gamification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
