"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { he } from "@/i18n/he";
import { NAV } from "@/lib/site.config";

const s = he.site;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = NAV.map((item) => {
    const active = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={`transition-colors ${
          active ? "text-[#a5811b]" : "text-stone-600 hover:text-stone-900"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {s[item.key]}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="text-xl font-semibold tracking-tight text-stone-900">
            {s.brand}
          </span>
          <span className="text-sm text-stone-400">{s.brandHe}</span>
        </Link>

        {/* ניווט דסקטופ */}
        <div className="hidden items-center gap-7 text-sm md:flex">
          {links}
          <Link
            href="/studio"
            className="rounded-full bg-stone-900 px-4 py-2 font-medium text-stone-50 transition-colors hover:bg-stone-700"
          >
            {s.ctaStart}
          </Link>
        </div>

        {/* כפתור תפריט מובייל */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? s.closeMenu : s.openMenu}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-700 hover:bg-stone-200 md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* תפריט מובייל נפתח */}
      {open && (
        <div className="border-t border-stone-200 bg-stone-50 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 text-base sm:px-6">
            {links}
            <Link
              href="/studio"
              onClick={() => setOpen(false)}
              className="rounded-full bg-stone-900 px-4 py-2 text-center font-medium text-stone-50"
            >
              {s.ctaStart}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
