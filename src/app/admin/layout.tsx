import type { Metadata } from "next";
import Link from "next/link";
import { he } from "@/i18n/he";

export const metadata: Metadata = {
  title: `${he.site.adminTitle} — ${he.site.brand}`,
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <header className="border-b border-graphite/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-graphite">{he.site.brand}</span>
            <span className="text-xs text-mist">{he.site.adminTitle}</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
