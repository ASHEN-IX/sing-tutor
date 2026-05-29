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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
