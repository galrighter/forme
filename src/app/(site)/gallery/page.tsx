import type { Metadata } from "next";
import Link from "next/link";
import { he } from "@/i18n/he";
import PatternMark, { type PatternVariant } from "@/components/site/PatternMark";

const s = he.site;

export const metadata: Metadata = {
  title: `${s.galleryTitle} — ${s.brand}`,
  description: s.gallerySubtitle,
};

const VARIANTS: PatternVariant[] = [
  "hexagons",
  "waves",
  "circles",
  "diamonds",
  "drops",
  "stripes",
];

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-10">
      <h1 className="text-[32px] font-semibold tracking-tight text-graphite sm:text-[40px]">
        {s.galleryTitle}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink60">{s.gallerySubtitle}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {s.galleryItems.map((item, i) => (
          <figure key={i} className="overflow-hidden border border-graphite/10 bg-white">
            <div className="flex items-center justify-center bg-porcelain p-6">
              <PatternMark variant={VARIANTS[i]} className="w-full" />
            </div>
            <figcaption className="border-t border-graphite/10 p-5">
              <h2 className="text-base font-semibold text-graphite">{item.title}</h2>
              <p className="mt-1 text-sm text-ink60">{item.desc}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-8 text-sm text-mist">{s.galleryDisclaimer}</p>

      <div className="mt-10 text-center">
        <Link
          href="/design"
          className="inline-block rounded-[2px] bg-graphite px-8 py-3.5 text-sm font-semibold text-porcelain transition-colors hover:bg-graphite/90"
        >
          {s.galleryCta}
        </Link>
      </div>
    </div>
  );
}
