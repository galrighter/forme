import Link from "next/link";
import { he } from "@/i18n/he";
import { NAV, SITE } from "@/lib/site.config";

const s = he.site;

export default function SiteFooter() {
  const year = 2026; // סטטי — הרנדר בצד שרת ללא תלות בשעון

  return (
    <footer className="mt-24 border-t border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-stone-900">{s.brand}</span>
              <span className="text-sm text-stone-400">{s.brandHe}</span>
            </div>
            <p className="mt-2 text-sm text-stone-500">{s.footerTagline}</p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-stone-600 transition-colors hover:text-stone-900"
              >
                {s[item.key]}
              </Link>
            ))}
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="text-stone-600 transition-colors hover:text-stone-900"
              dir="ltr"
            >
              {SITE.contactEmail}
            </a>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-1 border-t border-stone-200 pt-6 text-xs text-stone-400 sm:flex-row sm:justify-between">
          <span>
            © {year} {s.brand} · {s.footerRights}
          </span>
          <span>{s.footerBuiltWith}</span>
        </div>
      </div>
    </footer>
  );
}
