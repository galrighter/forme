"use client";

import { useState } from "react";

// בק־אופיס לתכנון: מריץ את כל הצינור (הדמיה → קונדישנינג → טרייס → החלקה →
// שערי נאמנות) ומציג כל שלב וכל קובץ, עם סימון נקודות כשל. לא מקושר מהסטודיו.

type Stage = { name: string; status: string; detail: string };
type Candidate = {
  candidate_id: string; iou: number; mean_dev_mm: number; max_dev_mm: number;
  source_holes: number; vector_holes: number; anchors: number; topology_ok: boolean;
  score: number; rejected_reason: string | null; selected: boolean;
};
type Debug = {
  status: string; width_mm: number; height_mm: number; smooth_iters: number;
  gates: Record<string, number>;
  images: Record<string, string>;
  candidates: Candidate[];
  stages: Stage[];
  warnings: string[];
};

const STATUS_COLOR: Record<string, string> = {
  ok: "bg-green-100 text-green-800 border-green-300",
  skip: "bg-stone-100 text-stone-500 border-stone-300",
  warn: "bg-amber-100 text-amber-800 border-amber-300",
  fail: "bg-red-100 text-red-800 border-red-300",
};

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export default function DebugPage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [heightMm, setHeightMm] = useState(15);
  const [colorKey, setColorKey] = useState("warm");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [render, setRender] = useState<{ dataUrl: string; model: string | null } | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const debug = (result?.debug ?? null) as Debug | null;
  const svg = (result?.metal_svg ?? result?.cutouts_svg ?? null) as string | null;

  const run = async () => {
    setBusy(true);
    setError(null);
    setRender(null);
    setResult(null);
    try {
      const resp = await fetch("/api/debug/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: prompt || undefined, image: image ? { dataUrl: image } : null, heightMm, colorKey }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error?.message || data?.message || `HTTP ${resp.status}`);
      setRender(data.render);
      setResult(data.result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const img = (b64: string) => `data:image/png;base64,${b64}`;

  return (
    <div dir="rtl" className="mx-auto max-w-5xl p-4 text-sm">
      <h1 className="mb-3 text-lg font-bold">בק־אופיס — צינור תמונה→SVG</h1>

      <div className="mb-4 grid gap-2 rounded-xl border border-stone-200 bg-white p-3">
        <textarea
          className="min-h-16 w-full rounded-lg border border-stone-300 p-2"
          placeholder="פרומפט לעיצוב (למסלול טקסט→הדמיה)…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1">
            <span>תמונה:</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => {
              const f = e.target.files?.[0];
              setImage(f ? await fileToDataUrl(f) : null);
            }} />
          </label>
          <label className="flex items-center gap-1">רוחב (מ״מ):
            <input type="number" className="w-16 rounded border border-stone-300 p-1" value={heightMm}
              onChange={(e) => setHeightMm(Number(e.target.value))} />
          </label>
          <label className="flex items-center gap-1">צבע־מפתח:
            <select className="rounded border border-stone-300 p-1" value={colorKey} onChange={(e) => setColorKey(e.target.value)}>
              <option value="warm">warm (פליז)</option>
              <option value="dark">dark</option>
              <option value="saturation">saturation</option>
            </select>
          </label>
          <button className="rounded-lg bg-stone-900 px-4 py-1.5 text-white disabled:opacity-40" disabled={busy} onClick={() => void run()}>
            {busy ? "מריץ…" : "הרץ"}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}

      {debug && (
        <div className="grid gap-4">
          {/* timeline */}
          <div className="rounded-xl border border-stone-200 bg-white p-3">
            <div className="mb-2 font-semibold">
              שלבים — סטטוס כללי:{" "}
              <span className={`rounded border px-2 py-0.5 ${debug.status === "approved" ? STATUS_COLOR.ok : STATUS_COLOR.fail}`}>{debug.status}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {debug.stages.map((s, i) => (
                <div key={i} className={`rounded-lg border px-3 py-2 ${STATUS_COLOR[s.status] ?? ""}`}>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs opacity-80">{s.detail}</div>
                </div>
              ))}
            </div>
            {debug.warnings.length > 0 && (
              <div className="mt-2 text-xs text-amber-700">אזהרות: {debug.warnings.join(" · ")}</div>
            )}
            <div className="mt-2 text-xs text-stone-500">
              שערים: IoU≥{debug.gates.min_iou_hard} · סטייה ממוצעת≤{debug.gates.max_mean_deviation_mm}מ״מ · מקס≤{debug.gates.max_max_deviation_mm}מ״מ · החלקה x{debug.smooth_iters} · אורך נגזר {debug.width_mm}מ״מ
            </div>
          </div>

          {/* images */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {render?.dataUrl && <ImgCard title={`הדמיית AI${render.model ? ` (${render.model})` : ""}`} src={render.dataUrl} />}
            {debug.images.conditioned && <ImgCard title="דו־גוני (קונדישנינג)" src={img(debug.images.conditioned)} />}
            {debug.images.overlay && <ImgCard title="Overlay (טרייס מול מקור)" src={img(debug.images.overlay)} />}
            {debug.images.difference && <ImgCard title="Difference" src={img(debug.images.difference)} />}
            {debug.images.rendered && <ImgCard title="רינדור חוזר של ה-SVG" src={img(debug.images.rendered)} />}
            {svg && <SvgCard title="SVG סופי" svg={svg} />}
          </div>

          {/* candidates */}
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white p-3">
            <div className="mb-2 font-semibold">מועמדים ({debug.candidates.length})</div>
            <table className="w-full text-right text-xs">
              <thead className="text-stone-500">
                <tr>
                  <th className="p-1">מזהה</th><th className="p-1">IoU</th><th className="p-1">ממוצע</th><th className="p-1">מקס</th>
                  <th className="p-1">חורים (מקור/וקטור)</th><th className="p-1">טופולוגיה</th><th className="p-1">עוגנים</th>
                  <th className="p-1">ציון</th><th className="p-1">נדחה</th>
                </tr>
              </thead>
              <tbody>
                {debug.candidates.map((c) => (
                  <tr key={c.candidate_id} className={`border-t border-stone-100 ${c.selected ? "bg-green-50 font-medium" : ""}`}>
                    <td className="p-1">{c.candidate_id}{c.selected ? " ✓" : ""}</td>
                    <td className="p-1">{c.iou}</td>
                    <td className="p-1">{c.mean_dev_mm}</td>
                    <td className="p-1">{c.max_dev_mm}</td>
                    <td className="p-1">{c.source_holes}/{c.vector_holes}</td>
                    <td className="p-1">{c.topology_ok ? "✓" : "✗"}</td>
                    <td className="p-1">{c.anchors}</td>
                    <td className="p-1">{c.score}</td>
                    <td className="p-1 text-red-600">{c.rejected_reason ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ImgCard({ title, src }: { title: string; src: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-2">
      <div className="mb-1 text-xs font-medium text-stone-600">{title}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={title} className="w-full rounded bg-stone-50 object-contain" />
    </div>
  );
}

function SvgCard({ title, svg }: { title: string; svg: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-2">
      <div className="mb-1 text-xs font-medium text-stone-600">{title}</div>
      <div className="w-full rounded bg-stone-800 p-2 [&_svg]:w-full [&_svg]:fill-amber-400" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
