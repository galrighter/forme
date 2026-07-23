"use client";

import { useEffect, useRef, useState } from "react";

// בק־אופיס לתכנון: מריץ את כל הצינור (הדמיה → קונדישנינג → טרייס → החלקה →
// שערי נאמנות) ומציג כל שלב וכל קובץ, עם סימון נקודות כשל. לא מקושר מהסטודיו.

type Stage = { name: string; status: string; detail: string };
type Candidate = {
  candidate_id: string; iou: number; mean_dev_mm: number; max_dev_mm: number;
  source_holes: number; vector_holes: number; anchors: number; topology_ok: boolean;
  score: number; rejected_reason: string | null; selected: boolean;
};
type Debug = {
  status: string; width_mm: number; height_mm: number; smooth_iters: number; color_key: string | null;
  gates: Record<string, number>;
  images: Record<string, string>;
  candidates: Candidate[];
  stages: Stage[];
  warnings: string[];
};

type LogItem = {
  versionId: string; designId: string; designName: string; widthMm: number;
  versionNo: number; status: string; createdAt: string; prompt: string | null;
  renderUrl: string | null; svg: string;
  metrics: { iou?: number; holes?: number; meanDeviationMm?: number } | null;
};

const STATUS_COLOR: Record<string, string> = {
  ok: "bg-green-100 text-green-800 border-green-300",
  pass: "bg-green-100 text-green-800 border-green-300",
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
  const [imageName, setImageName] = useState<string | null>(null);
  const [heightMm, setHeightMm] = useState(15);
  const [colorKey, setColorKey] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [render, setRender] = useState<{ dataUrl: string; model: string | null } | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<"run" | "log">("run");
  const [log, setLog] = useState<LogItem[] | null>(null);
  const [logBusy, setLogBusy] = useState(false);

  const debug = (result?.debug ?? null) as Debug | null;
  const svg = (result?.metal_svg ?? result?.cutouts_svg ?? null) as string | null;

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  const run = async (override?: { image?: string; prompt?: string }) => {
    const useImage = override?.image ?? image;
    const usePrompt = override?.prompt ?? prompt;
    setView("run");
    setBusy(true);
    setElapsed(0);
    setError(null);
    setRender(null);
    setResult(null);
    try {
      const resp = await fetch("/api/debug/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: usePrompt || undefined, image: useImage ? { dataUrl: useImage } : null, heightMm, colorKey }),
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

  const loadLog = async () => {
    setLogBusy(true);
    try {
      const resp = await fetch("/api/debug/log");
      const data = await resp.json();
      setLog(data.items ?? []);
    } catch {
      setLog([]);
    } finally {
      setLogBusy(false);
    }
  };

  const openInDebug = async (renderUrl: string) => {
    try {
      const blob = await (await fetch(renderUrl)).blob();
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
      setImage(dataUrl);
      setImageName("מהיומן");
      void run({ image: dataUrl, prompt: "" });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const img = (b64: string) => `data:image/png;base64,${b64}`;

  return (
    <div dir="rtl" className="mx-auto max-w-5xl p-4 text-sm">
      <h1 className="mb-3 text-lg font-bold">בק־אופיס — צינור תמונה→SVG</h1>

      <div className="mb-4 flex gap-2">
        <button className={`rounded-lg px-4 py-1.5 ${view === "run" ? "bg-stone-900 text-white" : "border border-stone-300"}`}
          onClick={() => setView("run")}>הרצה</button>
        <button className={`rounded-lg px-4 py-1.5 ${view === "log" ? "bg-stone-900 text-white" : "border border-stone-300"}`}
          onClick={() => { setView("log"); if (!log) void loadLog(); }}>יומן יצירות</button>
      </div>

      {view === "log" && (
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-stone-300 px-3 py-1 text-xs hover:bg-stone-100" onClick={() => void loadLog()}>רענון</button>
            {logBusy && <span className="text-xs text-stone-500">טוען…</span>}
          </div>
          {(log ?? []).map((it) => (
            <div key={it.versionId} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-2">
              {it.renderUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.renderUrl} alt="" className="h-14 w-24 shrink-0 rounded bg-stone-50 object-contain" />
              ) : (
                <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded bg-stone-100 text-[10px] text-stone-400">אין הדמיה</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{it.designName} · v{it.versionNo}</span>
                  <span className={`rounded border px-1.5 text-xs ${STATUS_COLOR[it.status] ?? ""}`}>{it.status}</span>
                  {it.metrics?.iou != null && <span className="text-xs text-stone-500">IoU {it.metrics.iou.toFixed(3)} · {it.metrics.holes} חורים</span>}
                </div>
                {it.prompt && <div className="truncate text-xs text-stone-600">{it.prompt}</div>}
                <div className="text-[10px] text-stone-400">{new Date(it.createdAt).toLocaleString("he-IL")}</div>
              </div>
              {it.renderUrl && (
                <button className="shrink-0 rounded-lg border border-amber-400 bg-amber-50 px-3 py-1 text-xs text-amber-800 hover:bg-amber-100"
                  onClick={() => void openInDebug(it.renderUrl!)}>פתח בדיבוג</button>
              )}
            </div>
          ))}
          {log && log.length === 0 && !logBusy && <div className="text-stone-400">אין יצירות עדיין.</div>}
        </div>
      )}

      {view === "run" && <div className="mb-4 grid gap-2 rounded-xl border border-stone-200 bg-white p-3">
        <textarea
          className="min-h-16 w-full rounded-lg border border-stone-300 p-2"
          placeholder="פרומפט לעיצוב (למסלול טקסט→הדמיה)…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              setImage(f ? await fileToDataUrl(f) : null);
              setImageName(f ? f.name : null);
            }} />
          <button type="button" className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 hover:bg-stone-100"
            onClick={() => fileRef.current?.click()}>
            📎 העלאת תמונה
          </button>
          {imageName && (
            <span className="text-xs text-stone-600">{imageName}
              <button className="ms-1 text-rose-600" onClick={() => { setImage(null); setImageName(null); if (fileRef.current) fileRef.current.value = ""; }}>✕</button>
            </span>
          )}
          <label className="flex items-center gap-1">רוחב (מ״מ):
            <input type="number" className="w-16 rounded border border-stone-300 p-1" value={heightMm}
              onChange={(e) => setHeightMm(Number(e.target.value))} />
          </label>
          <label className="flex items-center gap-1">צבע:
            <select className="rounded border border-stone-300 p-1" value={colorKey} onChange={(e) => setColorKey(e.target.value)}>
              <option value="auto">אוטומטי</option>
              <option value="warm">warm (פליז)</option>
              <option value="dark">dark</option>
              <option value="saturation">saturation</option>
            </select>
          </label>
          <button className="rounded-lg bg-stone-900 px-5 py-1.5 text-white disabled:opacity-60" disabled={busy} onClick={() => void run()}>
            {busy ? `מריץ… ${elapsed}s` : "הרץ"}
          </button>
        </div>
        {busy && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
            מייצר הדמיה וממיר ל-SVG… זה לוקח בערך 30–60 שניות, אל תסגור את הדף.
          </div>
        )}
      </div>}

      {view === "run" && error && <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">שגיאה: {error}</div>}

      {view === "run" && debug && (
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
              צבע־מפתח: {debug.color_key ?? "—"} · שערים: IoU≥{debug.gates.min_iou_hard} · סטייה ממוצעת≤{debug.gates.max_mean_deviation_mm}מ״מ · מקס≤{debug.gates.max_max_deviation_mm}מ״מ · החלקה x{debug.smooth_iters} · אורך נגזר {debug.width_mm}מ״מ
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
