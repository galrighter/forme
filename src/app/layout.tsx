import type { Metadata, Viewport } from "next";
import { he } from "@/i18n/he";
import "./globals.css";

export const metadata: Metadata = {
  title: he.appTitle,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
