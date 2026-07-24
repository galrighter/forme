"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: string };

export default function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {items.map((item, i) => {
        const open = openIdx === i;
        return (
          <div key={i}>
            <h3>
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-right transition-colors hover:bg-stone-50"
              >
                <span className="text-base font-medium text-stone-900">{item.q}</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={`shrink-0 text-stone-400 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </h3>
            {open && (
              <div className="px-6 pb-5 text-sm leading-relaxed text-stone-600">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
