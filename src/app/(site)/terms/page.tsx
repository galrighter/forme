import type { Metadata } from "next";
import { he } from "@/i18n/he";
import LegalPage from "@/components/site/LegalPage";

const t = he.site.terms;

export const metadata: Metadata = {
  title: `${t.title} — ${he.site.brand}`,
};

export default function TermsPage() {
  return <LegalPage title={t.title} intro={t.intro} sections={t.sections} />;
}
