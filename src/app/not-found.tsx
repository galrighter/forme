import Link from "next/link";
import { he } from "@/i18n/he";

const s = he.site;

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-24 text-center">
      <span className="text-6xl font-semibold text-[#c9a227]">404</span>
      <h1 className="mt-4 text-2xl font-semibold text-stone-900">{s.notFoundTitle}</h1>
      <p className="mt-2 max-w-sm text-stone-600">{s.notFoundBody}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
        >
          {s.notFoundHome}
        </Link>
        <Link
          href="/studio"
          className="rounded-full border border-stone-300 px-6 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
        >
          {s.ctaStart}
        </Link>
      </div>
    </div>
  );
}
