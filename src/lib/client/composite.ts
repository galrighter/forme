"use client";

import type { Annotation, Design, Version } from "./types";

// יצירת PNG קומפוזיטי (עיצוב + סימונים, רקע לבן) ברזולוציית 4px/מ"מ — סעיף 8.

const PX_PER_MM = 4;

export async function buildCompositePng(
  design: Design,
  version: Version,
  annotations: Annotation[],
): Promise<string> {
  const L = Number(design.length_mm);
  const W = Number(design.width_mm);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(L * PX_PER_MM);
  canvas.height = Math.round(W * PX_PER_MM);
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // רנדור ה-SVG הקנוני (cutouts בשחור) לתמונה
  const svgBlob = new Blob([version.svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = await loadImage(url);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }

  // מסגרת הרצועה
  ctx.strokeStyle = "#888888";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // סימונים באדום
  ctx.strokeStyle = "#e11d48";
  ctx.fillStyle = "#e11d48";
  ctx.lineWidth = Math.max(2, PX_PER_MM * 0.5);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const S = PX_PER_MM;
  for (const a of annotations) {
    switch (a.type) {
      case "pen": {
        ctx.beginPath();
        a.points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x * S, y * S) : ctx.lineTo(x * S, y * S)));
        ctx.stroke();
        break;
      }
      case "arrow": {
        const [x1, y1] = [a.from[0] * S, a.from[1] * S];
        const [x2, y2] = [a.to[0] * S, a.to[1] * S];
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const hs = 4 * S;
        ctx.beginPath();
        ctx.moveTo(x2 - hs * Math.cos(ang - 0.45), y2 - hs * Math.sin(ang - 0.45));
        ctx.lineTo(x2, y2);
        ctx.lineTo(x2 - hs * Math.cos(ang + 0.45), y2 - hs * Math.sin(ang + 0.45));
        ctx.stroke();
        break;
      }
      case "ellipse": {
        ctx.beginPath();
        ctx.ellipse(
          ((a.x0 + a.x1) / 2) * S,
          ((a.y0 + a.y1) / 2) * S,
          (Math.abs(a.x1 - a.x0) / 2) * S,
          (Math.abs(a.y1 - a.y0) / 2) * S,
          0, 0, Math.PI * 2,
        );
        ctx.stroke();
        break;
      }
      case "text": {
        ctx.font = `${3 * S}px sans-serif`;
        ctx.fillText(a.text, a.x * S, a.y * S);
        break;
      }
    }
  }

  return canvas.toDataURL("image/png");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to render design SVG to image"));
    img.src = url;
  });
}

/** קריאת קובץ תמונה שהמשתמש העלה כ-data URL, עם הקטנה ל-1568px מקסימום */
export async function fileToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("read failed"));
    fr.readAsDataURL(file);
  });
  const img = await loadImage(raw);
  const maxDim = 1568;
  if (Math.max(img.width, img.height) <= maxDim) return raw;
  const f = maxDim / Math.max(img.width, img.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * f);
  canvas.height = Math.round(img.height * f);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}
