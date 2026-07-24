import type { Metadata } from "next";
import Link from "next/link";
import { he } from "@/i18n/he";
import { SITE } from "@/lib/site.config";
import FaqAccordion from "@/components/site/FaqAccordion";

const s = he.site;

export const metadata: Metadata = {
  title: `${s.faqTitle} — ${s.brand}`,
  description: s.faqSubtitle,
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        {s.faqTitle}
      </h1>
      <p className="mt-3 text-lg text-stone-600">{s.faqSubtitle}</p>

      <div className="mt-10">
        <FaqAccordion items={s.faqItems} />
      </div>

      <p className="mt-8 text-sm text-stone-500">
        {s.contactSubtitle}{" "}
        <Link href="/contact" className="font-medium text-[#a5811b] hover:underline">
          {s.navContact}
        </Link>{" "}
        ·{" "}
        <a
          href={`mailto:${SITE.contactEmail}`}
          dir="ltr"
          className="font-medium text-[#a5811b] hover:underline"
        >
          {SITE.contactEmail}
        </a>
      </p>
    </div>
  );
}
