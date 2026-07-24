"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { he } from "@/i18n/he";
import { NAV } from "@/lib/site.config";
import Monogram from "./Monogram";

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
        className={`cursor-pointer transition-colors ${
          active ? "text-cobalt" : "text-graphite hover:text-cobalt"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {s[item.key]}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-20 border-b border-graphite/10 bg-porcelain/85 backdrop-blur-md">
      <nav className="flex items-center justify-between px-5 py-5 sm:px-10">
        {/* לוגו */}
        <Link href="/" className="flex items-center gap-3.5" onClick={() => setOpen(false)}>
          <Monogram />
          <span className="whitespace-nowrap font-display text-[15px] font-semibold tracking-[0.25em] text-graphite">
            {s.brand}
          </span>
        </Link>

        {/* ניווט דסקטופ */}
        <div className="hidden items-center gap-7 text-sm md:flex">
          {links}
          <Link
            href="/design"
            className="rounded-[2px] border border-graphite px-4 py-1.5 font-medium text-graphite transition-colors hover:border-cobalt hover:text-cobalt"
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
          className="flex h-10 w-10 items-center justify-center rounded-[2px] text-graphite hover:bg-graphite/5 md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
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
        <div className="border-t border-graphite/10 bg-porcelain md:hidden">
          <div className="flex flex-col gap-4 px-5 py-4 text-base sm:px-10">
            {links}
            <Link
              href="/design"
              onClick={() => setOpen(false)}
              className="rounded-[2px] bg-graphite px-4 py-2.5 text-center font-medium text-porcelain"
            >
              {s.ctaStart}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
