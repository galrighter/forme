import type { Metadata } from "next";
import { he } from "@/i18n/he";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

const s = he.site;

export const metadata: Metadata = {
  title: `${s.brand} — ${s.tagline}`,
  description: s.heroSubtitle,
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
