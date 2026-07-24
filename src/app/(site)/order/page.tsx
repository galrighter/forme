import type { Metadata } from "next";
import { he } from "@/i18n/he";
import { SITE } from "@/lib/site.config";
import OrderForm from "@/components/site/OrderForm";

const s = he.site;

export const metadata: Metadata = {
  title: `${s.orderTitle} — ${s.brand}`,
  description: s.orderSubtitle,
};

export default function OrderPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10">
      <h1 className="text-[32px] font-semibold tracking-tight text-graphite sm:text-[40px]">
        {s.orderTitle}
      </h1>
      <p className="mt-3 text-lg text-ink60">{s.orderSubtitle}</p>

      <div className="mt-10 border border-graphite/10 bg-white p-6 sm:p-8">
        <OrderForm />
      </div>

      <p className="mt-6 text-sm text-ink60">
        {s.contactOr}{" "}
        <a
          href={`mailto:${SITE.contactEmail}`}
          dir="ltr"
          className="font-medium text-cobalt hover:underline"
        >
          {SITE.contactEmail}
        </a>
      </p>
    </div>
  );
}
