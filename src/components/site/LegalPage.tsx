import { he } from "@/i18n/he";

const s = he.site;

export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: readonly { h: string; p: string }[];
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-stone-400">{s.legalUpdated}</p>
      <p className="mt-6 leading-relaxed text-stone-700">{intro}</p>

      <div className="mt-8 flex flex-col gap-6">
        {sections.map((sec, i) => (
          <section key={i}>
            <h2 className="text-lg font-semibold text-stone-900">{sec.h}</h2>
            <p className="mt-1 leading-relaxed text-stone-600">{sec.p}</p>
          </section>
        ))}
      </div>

      <p className="mt-12 rounded-xl border border-stone-200 bg-stone-100 p-4 text-xs text-stone-500">
        {s.legalNote}
      </p>
    </div>
  );
}
