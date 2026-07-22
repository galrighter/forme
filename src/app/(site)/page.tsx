import Link from "next/link";
import { he } from "@/i18n/he";
import PatternMark from "@/components/site/PatternMark";

const s = he.site;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 sm:pt-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-medium tracking-wide text-[#a5811b]">
              {s.tagline}
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl md:text-5xl">
              {s.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
              {s.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/studio"
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
              >
                {s.heroCtaPrimary}
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-100"
              >
                {s.heroCtaSecondary}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <PatternMark variant="hexagons" className="w-full drop-shadow-sm" />
            <PatternMark variant="waves" className="w-full drop-shadow-sm" />
            <PatternMark variant="circles" className="w-full drop-shadow-sm" />
          </div>
        </div>
      </section>

      {/* ערכים */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
          {s.valuesTitle}
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { t: s.value1Title, b: s.value1Body },
            { t: s.value2Title, b: s.value2Body },
            { t: s.value3Title, b: s.value3Body },
          ].map((v, i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9a227]/15 text-sm font-semibold text-[#a5811b]">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-stone-900">{v.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{v.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* חומר ומוצר */}
      <section className="bg-stone-100">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                {s.materialTitle}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
                {s.materialBody}
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-4 sm:max-w-md">
                {[
                  { k: s.materialSpecMaterial, v: s.materialSpecMaterialVal },
                  { k: s.materialSpecCut, v: s.materialSpecCutVal },
                  { k: s.materialSpecProducts, v: s.materialSpecProductsVal },
                  { k: s.materialSpecMade, v: s.materialSpecMadeVal },
                ].map((spec, i) => (
                  <div key={i} className="rounded-xl border border-stone-200 bg-white p-4">
                    <dt className="text-xs text-stone-400">{spec.k}</dt>
                    <dd className="mt-1 text-sm font-medium text-stone-900">{spec.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-col gap-4">
              <PatternMark variant="diamonds" className="w-full drop-shadow-sm" />
              <PatternMark variant="drops" className="w-full drop-shadow-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* איך זה עובד — תקציר */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              {s.howTitle}
            </h2>
            <p className="mt-2 text-stone-600">{s.howSubtitle}</p>
          </div>
          <Link
            href="/how-it-works"
            className="text-sm font-medium text-[#a5811b] hover:underline"
          >
            {s.navHowItWorks} →
          </Link>
        </div>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: s.step1Title, b: s.step1Body },
            { t: s.step2Title, b: s.step2Body },
            { t: s.step3Title, b: s.step3Body },
            { t: s.step4Title, b: s.step4Body },
          ].map((step, i) => (
            <li key={i} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <span className="text-2xl font-semibold text-stone-300">0{i + 1}</span>
              <h3 className="mt-3 text-base font-semibold text-stone-900">{step.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.b}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA סופי */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-stone-900 px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
            {s.ctaStartLong}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-stone-300">{s.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/studio"
              className="inline-block rounded-full bg-[#c9a227] px-7 py-3 text-sm font-semibold text-stone-900 transition-colors hover:bg-[#e6c766]"
            >
              {s.heroCtaPrimary}
            </Link>
            <Link
              href="/order"
              className="inline-block rounded-full border border-stone-600 px-7 py-3 text-sm font-medium text-stone-100 transition-colors hover:bg-stone-800"
            >
              {s.orderCta}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
