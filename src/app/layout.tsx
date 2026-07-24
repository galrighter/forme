import type { Metadata, Viewport } from "next";
import { he } from "@/i18n/he";
import { SITE } from "@/lib/site.config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: he.appTitle,
  description: he.site.heroSubtitle,
  applicationName: he.site.brand,
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: he.site.brand,
    title: `${he.site.brand} — ${he.site.tagline}`,
    description: he.site.heroSubtitle,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${he.site.brand} — ${he.site.tagline}`,
    description: he.site.heroSubtitle,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Assistant:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-porcelain text-graphite antialiased">{children}</body>
    </html>
  );
}
