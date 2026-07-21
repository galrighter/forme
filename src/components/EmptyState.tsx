"use client";

import { he } from "@/i18n/he";

export function EmptyState({ onExample }: { onExample: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-xl font-semibold">{he.emptyTitle}</h2>
      <p className="max-w-md text-sm text-stone-600">{he.emptyBody}</p>
      <div className="flex flex-col gap-2">
        {he.examplePrompts.map((p) => (
          <button
            key={p}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            onClick={() => onExample(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
