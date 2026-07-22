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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        {s.galleryTitle}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-stone-600">{s.gallerySubtitle}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {s.galleryItems.map((item, i) => (
          <figure
            key={i}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-center bg-stone-100 p-6">
              <PatternMark variant={VARIANTS[i]} className="w-full drop-shadow-sm" />
            </div>
            <figcaption className="border-t border-stone-200 p-5">
              <h2 className="text-base font-semibold text-stone-900">{item.title}</h2>
              <p className="mt-1 text-sm text-stone-600">{item.desc}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-8 text-sm text-stone-400">{s.galleryDisclaimer}</p>

      <div className="mt-10 text-center">
        <Link
          href="/studio"
          className="inline-block rounded-full bg-stone-900 px-7 py-3 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
        >
          {s.galleryCta}
        </Link>
      </div>
    </div>
  );
}
