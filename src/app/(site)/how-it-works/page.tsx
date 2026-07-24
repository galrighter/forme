import type { Metadata } from "next";
import Link from "next/link";
import { he } from "@/i18n/he";
import PatternMark, { type PatternVariant } from "@/components/site/PatternMark";

const s = he.site;

export const metadata: Metadata = {
  title: `${s.howTitle} — ${s.brand}`,
  description: s.howSubtitle,
};

const STEPS: { t: string; b: string; v: PatternVariant }[] = [
  { t: s.step1Title, b: s.step1Body, v: "stripes" },
  { t: s.step2Title, b: s.step2Body, v: "hexagons" },
  { t: s.step3Title, b: s.step3Body, v: "diamonds" },
  { t: s.step4Title, b: s.step4Body, v: "waves" },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        {s.howTitle}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-stone-600">{s.howSubtitle}</p>

      <ol className="mt-12 flex flex-col gap-10">
        {STEPS.map((step, i) => (
          <li
            key={i}
            className="grid items-center gap-6 sm:grid-cols-[auto_1fr] sm:gap-8"
          >
            <div className="flex items-center gap-4 sm:flex-col sm:items-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-900 text-lg font-semibold text-stone-50">
                {i + 1}
              </span>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-stone-900">{step.t}</h2>
              <p className="mt-2 leading-relaxed text-stone-600">{step.b}</p>
              <PatternMark variant={step.v} className="mt-5 w-full max-w-md drop-shadow-sm" />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-14 text-center">
        <Link
          href="/studio"
          className="inline-block rounded-full bg-stone-900 px-7 py-3 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
        >
          {s.heroCtaPrimary}
        </Link>
      </div>
    </div>
  );
}
