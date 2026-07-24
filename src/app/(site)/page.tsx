import Link from "next/link";
import { he } from "@/i18n/he";

const s = he.site;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-5 pt-14 pb-10 sm:px-10 sm:pt-[88px] sm:pb-16">
        <div className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr] md:gap-16">
          <div>
            <div className="mb-6 font-display text-xs tracking-[0.28em] text-cobalt">
              {s.heroEyebrow}
            </div>
            <h1
              className="mb-5 text-[40px] font-semibold leading-[1.05] sm:text-[64px]"
              style={{ letterSpacing: "-1px", textWrap: "balance" }}
            >
              {s.heroTitleLine1}
              <br />
              {s.heroTitleLine2}
            </h1>
            <div className="mb-7 font-display text-[17px] tracking-wide text-ink60">
              {s.heroEnglishTagline}
            </div>
            <p className="mb-9 max-w-[440px] text-[18px] text-ink80" style={{ textWrap: "pretty" }}>
              {s.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href="/design"
                className="rounded-[2px] bg-graphite px-[34px] py-4 text-base font-semibold tracking-wide text-porcelain transition-colors hover:bg-graphite/90"
              >
                {s.heroCtaPrimary}
              </Link>
              <span className="text-sm text-mist">{s.heroPriceNote}</span>
            </div>
          </div>

          <div
            className="relative overflow-hidden border border-graphite/10"
            style={{ aspectRatio: "4 / 5" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/bracelet-hero.png"
              alt="צמיד פליז פתוח עם חיתוכי לייזר אלכסוניים על משטח בטון"
              className="block h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* איך מתחילים */}
      <section className="mx-auto max-w-[1200px] px-5 pt-6 pb-10 sm:px-10">
        <div className="mb-5 font-display text-xs tracking-[0.22em] text-mist">{s.startTitle}</div>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { n: "01", t: s.start1Title, b: s.start1Body },
            { n: "02", t: s.start2Title, b: s.start2Body },
            { n: "03", t: s.start3Title, b: s.start3Body },
          ].map((c) => (
            <Link
              key={c.n}
              href="/design"
              className="group border border-graphite/[0.14] bg-white p-8 transition-colors hover:border-cobalt"
            >
              <div className="mb-3.5 font-display text-[26px] text-cobalt">{c.n}</div>
              <div className="mb-2 text-xl font-semibold text-graphite">{c.t}</div>
              <p className="text-[15px] text-ink60">{c.b}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* רצועת תהליך */}
      <section className="mx-auto max-w-[1200px] border-t border-graphite/10 px-5 py-10 sm:px-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {s.proc.map((p) => (
            <div key={p.n}>
              <div className="mb-2.5 font-display text-[13px] tracking-[0.15em] text-mist">{p.n}</div>
              <div className="mb-1.5 text-base font-semibold text-graphite">{p.title}</div>
              <p className="text-sm text-ink60">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
