import type { Metadata } from "next";
import { he } from "@/i18n/he";
import { SITE } from "@/lib/site.config";
import ContactForm from "@/components/site/ContactForm";

const s = he.site;

export const metadata: Metadata = {
  title: `${s.contactTitle} — ${s.brand}`,
  description: s.contactSubtitle,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        {s.contactTitle}
      </h1>
      <p className="mt-3 text-lg text-stone-600">{s.contactSubtitle}</p>

      <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <ContactForm />
      </div>

      <p className="mt-6 text-sm text-stone-500">
        {s.contactOr}{" "}
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
