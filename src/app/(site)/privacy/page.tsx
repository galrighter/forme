import type { Metadata } from "next";
import { he } from "@/i18n/he";
import LegalPage from "@/components/site/LegalPage";

const pr = he.site.privacy;

export const metadata: Metadata = {
  title: `${pr.title} — ${he.site.brand}`,
};

export default function PrivacyPage() {
  return <LegalPage title={pr.title} intro={pr.intro} sections={pr.sections} />;
}
