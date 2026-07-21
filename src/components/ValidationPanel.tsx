"use client";

import { he } from "@/i18n/he";
import { useStudio, currentVersion } from "@/lib/client/store";

export function ValidationPanel() {
  const s = useStudio();
  const version = currentVersion(s);
  if (!version) return null;
  const report = version.validation_report;
  const issues = report.checks.filter((c) => c.status !== "pass");
  const title =
    report.status === "pass" ? he.validationPass : report.status === "warn" ? he.validationWarn : he.validationFail;
  const color =
    report.status === "pass" ? "text-green-700" : report.status === "warn" ? "text-orange-600" : "text-red-600";

  return (
    <section className="border-t border-stone-200 bg-white">
      <button
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium"
        onClick={() => s.setValidationOpen(!s.validationOpen)}
      >
        <span className={color}>
          {report.status === "pass" ? "✓ " : report.status === "warn" ? "⚠ " : "✕ "}
          {title}
          {issues.length > 0 && ` (${issues.length})`}
        </span>
        <span className="text-xs text-stone-500">
          {he.openAreaPct}: {report.metrics.openAreaPct.toFixed(1)}% · {he.estWeight}:{" "}
          {report.metrics.estWeightGrams.toFixed(1)} {he.grams}
        </span>
      </button>
      {s.validationOpen && issues.length > 0 && (
        <ul className="max-h-40 space-y-1 overflow-y-auto px-4 pb-3">
          {issues.map((c, i) => (
            <li key={i} className="flex items-start justify-between gap-2 text-sm">
              <span className={c.status === "fail" ? "text-red-700" : "text-orange-600"}>
                <b>{c.check}</b> — {c.message}
              </span>
              {c.locations.length > 0 && (
                <button
                  className="shrink-0 rounded-md bg-stone-100 px-2 py-0.5 text-xs hover:bg-stone-200"
                  onClick={() => s.requestFocus(c.locations[0].x, c.locations[0].y)}
                >
                  {he.focusOnIssue}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {s.validationOpen && report.status === "fail" && version.source === "auto_repair" && (
        <div className="px-4 pb-3 text-xs text-stone-500">
          <b>{he.repairFailedTitle}</b> — {he.repairFailedBody}
        </div>
      )}
    </section>
  );
}
