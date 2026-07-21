"use client";

import { useState } from "react";
import { he } from "@/i18n/he";
import { FAB } from "@/lib/fabrication.config";
import { useStudio, currentVersion } from "@/lib/client/store";
import { ConfirmModal } from "./Modal";

export function ParamsPanel() {
  const s = useStudio();
  const { design, paramsOpen, setParamsOpen } = s;
  const [pending, setPending] = useState<{ lengthMm?: number; widthMm?: number; gapMm?: number } | null>(null);
  if (!design) return null;

  const p = FAB.products[design.product_type];
  const hasVersion = currentVersion(s) !== null;

  const applyDim = (key: "lengthMm" | "widthMm" | "gapMm", value: number, range: readonly [number, number]) => {
    const clamped = Math.min(range[1], Math.max(range[0], value));
    if (Number.isNaN(clamped)) return;
    const current = { lengthMm: Number(design.length_mm), widthMm: Number(design.width_mm), gapMm: Number(design.gap_mm) };
    if (current[key] === clamped) return;
    const patch = { [key]: clamped };
    if (hasVersion) setPending(patch);
    else void s.updateDims(patch);
  };

  return (
    <section className="border-b border-stone-200 bg-white">
      <button
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium"
        onClick={() => setParamsOpen(!paramsOpen)}
      >
        <span>
          {he.parameters} · {design.product_type === "ring" ? he.ring : he.bracelet} ·{" "}
          {Number(design.length_mm)}×{Number(design.width_mm)} מ״מ
        </span>
        <span className="text-stone-400">{paramsOpen ? "▲" : "▼"}</span>
      </button>
      {paramsOpen && (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4">
          <label className="text-xs text-stone-600">
            {he.productType}
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
              value={design.product_type}
              disabled={hasVersion}
              onChange={(e) => {
                // שינוי סוג מוצר רק לעיצוב ריק — יוצר עיצוב חדש במקום
                void s.newDesign(e.target.value as "bracelet" | "ring");
              }}
            >
              <option value="bracelet">{he.bracelet}</option>
              <option value="ring">{he.ring}</option>
            </select>
          </label>
          <NumField
            label={he.lengthMm}
            value={Number(design.length_mm)}
            range={p.lengthRangeMm}
            onCommit={(v) => applyDim("lengthMm", v, p.lengthRangeMm)}
          />
          <NumField
            label={he.widthMm}
            value={Number(design.width_mm)}
            range={p.widthRangeMm}
            onCommit={(v) => applyDim("widthMm", v, p.widthRangeMm)}
          />
          <NumField
            label={he.gapMm}
            value={Number(design.gap_mm)}
            range={p.gapRangeMm}
            onCommit={(v) => applyDim("gapMm", v, p.gapRangeMm)}
          />
        </div>
      )}
      <ConfirmModal
        open={pending !== null}
        title={he.dimsChangeTitle}
        body={he.dimsChangeBody}
        onConfirm={() => {
          if (pending) void s.updateDims(pending);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </section>
  );
}

function NumField(props: {
  label: string;
  value: number;
  range: readonly [number, number];
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="text-xs text-stone-600">
      {props.label}
      <input
        type="number"
        inputMode="decimal"
        min={props.range[0]}
        max={props.range[1]}
        className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        value={draft ?? String(props.value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) props.onCommit(parseFloat(draft));
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
      />
      <span className="text-[10px] text-stone-400">
        {props.range[0]}–{props.range[1]}
      </span>
    </label>
  );
}
