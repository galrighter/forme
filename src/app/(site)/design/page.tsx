"use client";

import { useState } from "react";
import Link from "next/link";
import { he } from "@/i18n/he";

const d = he.design;

type Screen = "product" | "sizes" | "idea" | "chat" | "suggestions" | "edit" | "final";
type Product = "bracelet" | "ring" | null;
type Fit = "tight" | "regular" | "loose";
type Style = "geometric" | "organic" | "mixed";
type Sym = "symmetric" | "asymmetric";
type Weight = "delicate" | "balanced" | "massive";
type FileItem = { name: string; kind: string };
type Msg = { role: "ai" | "user"; text: string };
type Edit = {
  widthMm: number;
  elementSize: number;
  density: number;
  gapMm: number;
  symmetry: boolean;
  corners: number;
  repeats: number;
};

const ORDER: Screen[] = ["product", "sizes", "idea", "chat", "suggestions", "edit", "final"];

const GRAPHITE = "#202326";
const PORCELAIN = "#f4f1eb";
const COBALT = "#315bff";

function densToNum(h: string): number {
  if (h === d.densities[3]) return 3;
  if (h === d.densities[1]) return 1;
  return 2;
}

export default function DesignPage() {
  const [screen, setScreen] = useState<Screen>("product");
  const [product, setProduct] = useState<Product>(null);

  // sizes
  const [sizePreset, setSizePreset] = useState("M");
  const [fit, setFit] = useState<Fit>("regular");
  const [widthMm, setWidthMm] = useState(8);
  const [gapMm, setGapMm] = useState(18);
  const [circ, setCirc] = useState("");

  // idea
  const [ideaText, setIdeaText] = useState("");
  const [style, setStyle] = useState<Style>("geometric");
  const [symmetry, setSymmetry] = useState<Sym>("symmetric");
  const [density, setDensity] = useState(2);
  const [elementSize, setElementSize] = useState(2);
  const [weight, setWeight] = useState<Weight>("balanced");
  const [textOnItem, setTextOnItem] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [rightsOk, setRightsOk] = useState(false);

  // chat
  const [messages, setMessages] = useState<Msg[]>([{ role: "ai", text: d.chatFirstMsg }]);
  const [chatInput, setChatInput] = useState("");

  // suggestions / edit
  const [selected, setSelected] = useState<string | null>(null);
  const [edit, setEdit] = useState<Edit>({
    widthMm: 8,
    elementSize: 2,
    density: 2,
    gapMm: 3,
    symmetry: true,
    corners: 1,
    repeats: 6,
  });
  const [aiReq, setAiReq] = useState("");

  // final
  const [finalView, setFinalView] = useState<"flat" | "rolled" | "body">("flat");

  const go = (s: Screen) => {
    setScreen(s);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const productLabel = product === "ring" ? d.productLabels.ring : d.productLabels.bracelet;
  const cur = ORDER.indexOf(screen);

  // pricing
  const base = product === "ring" ? 240 : 320;
  const complexityAdd = ({ 1: 0, 2: 40, 3: 95 } as Record<number, number>)[edit.density] || 0;
  const widthAdd = Math.max(0, edit.widthMm - 8) * 12;
  const subtotal = Math.round(base + complexityAdd + widthAdd);
  const packaging = 25;
  const shipping = 35;
  const tax = Math.round((subtotal + packaging + shipping) * 0.17);
  const total = subtotal + packaging + shipping + tax;

  const sel = d.suggestions.find((x) => x.id === selected) ?? null;
  const editName = sel ? sel.name : d.suggestions[0].name;

  const g = Math.max(2, edit.gapMm);
  const editStripBg = `repeating-linear-gradient(${edit.symmetry ? 90 : 82}deg, ${GRAPHITE} 0 ${g}px, ${PORCELAIN} ${g}px ${g + edit.elementSize + 1}px)`;
  const finalStripBg = `repeating-linear-gradient(90deg, ${GRAPHITE} 0 ${g}px, ${PORCELAIN} ${g}px ${g + edit.elementSize + 1}px)`;

  const sendChat = () => {
    const t = chatInput.trim();
    if (!t) return;
    const n = messages.filter((m) => m.role === "user").length;
    const reply = d.chatReplies[Math.min(n, d.chatReplies.length - 1)];
    setMessages([...messages, { role: "user", text: t }, { role: "ai", text: reply }]);
    setChatInput("");
  };

  const addFile = () => {
    const n = d.sampleFileNames[files.length % d.sampleFileNames.length];
    setFiles([...files, { name: n, kind: (n.split(".").pop() || "").toUpperCase() }]);
  };

  const pickSuggestion = (x: (typeof d.suggestions)[number]) => {
    setSelected(x.id);
    setEdit((e) => ({ ...e, density: densToNum(x.density), gapMm: x.gap, repeats: Math.round(x.cuts / 4) }));
    go("edit");
  };

  const applyAi = () => {
    if (!aiReq.trim()) return;
    setEdit((e) => ({ ...e, repeats: Math.min(14, e.repeats + 1), gapMm: Math.max(2, e.gapMm - 1) }));
    setAiReq("");
  };

  const canSubmitIdea = (ideaText.trim().length > 0 || files.length > 0) && rightsOk;
  const sizeOutlier = circ !== "" && (+circ < 140 || +circ > 210);

  return (
    <div className="mx-auto w-full">
      {/* Step rail */}
      <div className="z-[2] flex items-center gap-2 overflow-x-auto border-b border-graphite/[0.08] bg-porcelain/90 px-5 py-4 sm:px-10">
        {ORDER.map((key, i) => {
          const done = cur > i;
          const active = cur === i;
          return (
            <div key={key} className="flex items-center gap-2">
              <button
                onClick={() => go(key)}
                className="flex cursor-pointer items-center gap-2 whitespace-nowrap"
                style={{ opacity: done || active ? 1 : 0.45 }}
              >
                <span
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full font-display text-xs font-semibold"
                  style={{
                    border: `1.5px solid ${active ? COBALT : done ? GRAPHITE : "#aab4b8"}`,
                    background: active ? COBALT : done ? GRAPHITE : "transparent",
                    color: active || done ? PORCELAIN : "#aab4b8",
                  }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-[13px] tracking-[0.02em]"
                  style={{ fontWeight: active ? 600 : 400 }}
                >
                  {d.steps[key]}
                </span>
              </button>
              {i < ORDER.length - 1 && <span className="h-px w-[22px] bg-graphite/20" />}
            </div>
          );
        })}
      </div>

      {/* Screen */}
      <div key={screen} className="rm-fade">
        {screen === "product" && (
          <section className="mx-auto max-w-[1100px] px-5 py-16 sm:px-10">
            <Eyebrow>{d.productEyebrow}</Eyebrow>
            <h2 className="mb-2 text-[32px] font-semibold sm:text-[38px]">{d.productTitle}</h2>
            <p className="mb-10 max-w-[520px] text-[17px] text-ink60">{d.productSubtitle}</p>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Bracelet */}
              <button
                onClick={() => {
                  setProduct("bracelet");
                  go("sizes");
                }}
                className="group block border border-graphite/[0.16] bg-white text-start transition-all hover:-translate-y-[3px] hover:border-cobalt"
              >
                <div className="relative overflow-hidden border-b border-graphite/10" style={{ aspectRatio: "16 / 10" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/bracelet-hero.png"
                    alt={d.braceletName}
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "center 62%" }}
                  />
                </div>
                <ProductBody
                  name={d.braceletName}
                  price={d.braceletPrice}
                  desc={d.braceletDesc}
                  meta={d.braceletMeta}
                />
              </button>
              {/* Ring */}
              <button
                onClick={() => {
                  setProduct("ring");
                  go("sizes");
                }}
                className="group block border border-graphite/[0.16] bg-white text-start transition-all hover:-translate-y-[3px] hover:border-cobalt"
              >
                <div
                  className="relative border-b border-graphite/10"
                  style={{
                    aspectRatio: "16 / 10",
                    background: "repeating-linear-gradient(115deg,#d8d2c8 0 2px,#e3ddd3 2px 14px)",
                  }}
                >
                  <span className="absolute bottom-3 end-3.5 bg-porcelain/85 px-[7px] py-[3px] font-mono text-[11px] text-ink60">
                    {d.ringPlaceholderLabel}
                  </span>
                </div>
                <ProductBody
                  name={d.ringName}
                  price={d.ringPrice}
                  desc={d.ringDesc}
                  meta={d.ringMeta}
                />
              </button>
            </div>
          </section>
        )}

        {screen === "sizes" && (
          <section className="mx-auto max-w-[1100px] px-5 py-16 sm:px-10">
            <div className="grid items-start gap-10 md:grid-cols-[1.3fr_1fr] md:gap-14">
              <div>
                <Eyebrow>{`${d.sizesEyebrow} · ${productLabel}`}</Eyebrow>
                <h2 className="mb-8 text-[32px] font-semibold sm:text-[38px]">{d.sizesTitle}</h2>

                <FieldLabel>{d.sizesStandard}</FieldLabel>
                <div className="mb-8 flex gap-3">
                  {(["S", "M", "L"] as const).map((v) => {
                    const on = sizePreset === v;
                    const sub =
                      product === "ring"
                        ? { S: "52 מ״מ", M: "56 מ״מ", L: "60 מ״מ" }[v]
                        : { S: "150 מ״מ", M: "170 מ״מ", L: "185 מ״מ" }[v];
                    return (
                      <button
                        key={v}
                        onClick={() => setSizePreset(v)}
                        className="flex-1 rounded-[2px] p-[18px] text-center"
                        style={{
                          border: `1.5px solid ${on ? COBALT : "rgba(32,35,38,0.2)"}`,
                          background: on ? "rgba(49,91,255,0.06)" : "#fff",
                        }}
                      >
                        <div className="font-display text-xl font-semibold">{v}</div>
                        <div className="mt-1 text-xs opacity-70">{sub}</div>
                      </button>
                    );
                  })}
                </div>

                <FieldLabel>{d.sizesCircLabel}</FieldLabel>
                <input
                  value={circ}
                  onChange={(e) => setCirc(e.target.value)}
                  placeholder={d.sizesCircPlaceholder}
                  className="mb-2 w-full rounded-[2px] border border-graphite/20 bg-white px-4 py-3.5 text-base"
                />
                {sizeOutlier && <div className="mb-6 text-[13px] text-cobalt">{d.sizesOutlier}</div>}

                <div className="mt-6">
                  <FieldLabel>{`${d.sizesWidthLabel} — ${widthMm} ${d.mm}`}</FieldLabel>
                  <input
                    type="range"
                    min={4}
                    max={16}
                    value={widthMm}
                    onChange={(e) => setWidthMm(+e.target.value)}
                    className="mb-7 w-full"
                    style={{ accentColor: COBALT }}
                  />
                </div>

                <FieldLabel>{`${d.sizesGapLabel} — ${gapMm} ${d.mm}`}</FieldLabel>
                <input
                  type="range"
                  min={6}
                  max={36}
                  value={gapMm}
                  onChange={(e) => setGapMm(+e.target.value)}
                  className="mb-7 w-full"
                  style={{ accentColor: COBALT }}
                />

                <FieldLabel>{d.sizesFitLabel}</FieldLabel>
                <div className="flex gap-3">
                  {(Object.keys(d.fits) as Fit[]).map((v) => {
                    const on = fit === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setFit(v)}
                        className="flex-1 rounded-[2px] p-3 text-center text-sm"
                        style={{
                          border: `1.5px solid ${on ? COBALT : "rgba(32,35,38,0.2)"}`,
                          background: on ? "rgba(49,91,255,0.06)" : "#fff",
                        }}
                      >
                        {d.fits[v]}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-10">
                  <PrimaryBtn onClick={() => go("idea")}>{d.sizesSave}</PrimaryBtn>
                </div>
              </div>

              <div className="border border-graphite/10 bg-white p-7 md:sticky md:top-[140px]">
                <CardLabel>{d.sizesHowTitle}</CardLabel>
                <div
                  className="mb-4 flex items-center justify-center border border-graphite/10"
                  style={{
                    aspectRatio: "4 / 3",
                    background: "repeating-linear-gradient(135deg,#d8d2c8 0 2px,#e3ddd3 2px 12px)",
                  }}
                >
                  <span className="bg-porcelain/85 px-2 py-1 font-mono text-[11px] text-ink60">
                    {d.sizesDiagramLabel}
                  </span>
                </div>
                <p className="text-sm text-ink60" style={{ textWrap: "pretty" }}>
                  {d.sizesHowBody}
                </p>
              </div>
            </div>
          </section>
        )}

        {screen === "idea" && (
          <section className="mx-auto max-w-[1100px] px-5 py-16 sm:px-10">
            <Eyebrow>{d.ideaEyebrow}</Eyebrow>
            <h2 className="mb-2 text-[32px] font-semibold sm:text-[38px]">{d.ideaTitle}</h2>
            <p className="mb-10 max-w-[560px] text-[17px] text-ink60">{d.ideaSubtitle}</p>

            <div className="grid items-start gap-10 md:grid-cols-[1.2fr_1fr]">
              <div>
                <textarea
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder={d.ideaPlaceholder}
                  className="w-full resize-y rounded-[2px] border border-graphite/20 bg-white p-4 text-base leading-relaxed"
                  style={{ minHeight: 150 }}
                />

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={addFile}
                    className="rounded-[2px] border border-dashed border-graphite/35 bg-white px-[22px] py-3.5 text-[15px] text-graphite"
                  >
                    {d.ideaUpload}
                  </button>
                  <span className="text-[13px] text-mist">{d.ideaFormats}</span>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-[2px] border border-graphite/[0.14] bg-white px-3.5 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="rounded-[2px] border border-cobalt px-1.5 py-[3px] font-display text-[11px] font-semibold text-cobalt">
                            {f.kind}
                          </span>
                          <span className="text-sm">{f.name}</span>
                        </div>
                        <button
                          onClick={() => setFiles(files.filter((_, j) => j !== i))}
                          className="cursor-pointer text-lg text-mist"
                          aria-label="הסרה"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setRightsOk((v) => !v)}
                  className="mt-7 flex cursor-pointer items-start gap-3 text-start"
                >
                  <span
                    className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-[2px] text-[13px] text-white"
                    style={{
                      border: `1.5px solid ${rightsOk ? COBALT : "rgba(32,35,38,0.3)"}`,
                      background: rightsOk ? COBALT : "#fff",
                    }}
                  >
                    {rightsOk ? "✓" : ""}
                  </span>
                  <span className="text-sm text-ink80" style={{ textWrap: "pretty" }}>
                    {d.ideaRights}
                  </span>
                </button>

                <div className="mt-8">
                  <button
                    onClick={() => go("chat")}
                    className="rounded-[2px] px-[34px] py-3.5 text-base font-semibold text-porcelain"
                    style={{ background: canSubmitIdea ? GRAPHITE : "rgba(32,35,38,0.25)" }}
                  >
                    {d.ideaSubmit}
                  </button>
                </div>
              </div>

              <div className="border border-graphite/10 bg-white p-[26px]">
                <CardLabel>{d.ideaAttrsTitle}</CardLabel>

                <ChipGroup label={d.ideaStyleLabel}>
                  {(Object.keys(d.styles) as Style[]).map((v) => (
                    <Chip key={v} on={style === v} onClick={() => setStyle(v)}>
                      {d.styles[v]}
                    </Chip>
                  ))}
                </ChipGroup>

                <ChipGroup label={d.ideaSymmetryLabel}>
                  {(Object.keys(d.syms) as Sym[]).map((v) => (
                    <Chip key={v} on={symmetry === v} onClick={() => setSymmetry(v)}>
                      {d.syms[v]}
                    </Chip>
                  ))}
                </ChipGroup>

                <ChipGroup label={d.ideaDensityLabel}>
                  {[1, 2, 3].map((n) => (
                    <Chip key={n} on={density === n} onClick={() => setDensity(n)}>
                      {d.densities[n]}
                    </Chip>
                  ))}
                </ChipGroup>

                <ChipGroup label={d.ideaElementLabel}>
                  {[1, 2, 3].map((n) => (
                    <Chip key={n} on={elementSize === n} onClick={() => setElementSize(n)}>
                      {d.elements[n]}
                    </Chip>
                  ))}
                </ChipGroup>

                <ChipGroup label={d.ideaWeightLabel}>
                  {(Object.keys(d.weights) as Weight[]).map((v) => (
                    <Chip key={v} on={weight === v} onClick={() => setWeight(v)}>
                      {d.weights[v]}
                    </Chip>
                  ))}
                </ChipGroup>

                <FieldLabel small>{d.ideaTextLabel}</FieldLabel>
                <input
                  value={textOnItem}
                  onChange={(e) => setTextOnItem(e.target.value)}
                  placeholder={d.ideaTextPlaceholder}
                  className="w-full rounded-[2px] border border-graphite/20 bg-porcelain px-3.5 py-[11px] text-sm"
                />
              </div>
            </div>
          </section>
        )}

        {screen === "chat" && (
          <section className="mx-auto max-w-[1100px] px-5 py-12 sm:px-10">
            <Eyebrow>{d.chatEyebrow}</Eyebrow>
            <h2 className="mb-7 text-[28px] font-semibold sm:text-[34px]">{d.chatTitle}</h2>
            <div className="grid items-start gap-8 md:grid-cols-[1.4fr_1fr]">
              <div className="flex flex-col border border-graphite/10 bg-white" style={{ height: 520 }}>
                <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-[22px]">
                  {messages.map((m, i) => {
                    const mine = m.role === "user";
                    return (
                      <div key={i} className="flex" style={{ justifyContent: mine ? "flex-end" : "flex-start" }}>
                        <div
                          className="text-[15px] leading-[1.55]"
                          style={{
                            maxWidth: "78%",
                            background: mine ? GRAPHITE : "#fff",
                            color: mine ? PORCELAIN : GRAPHITE,
                            border: mine ? "none" : "1px solid rgba(32,35,38,0.1)",
                            padding: "13px 16px",
                            borderRadius: 3,
                          }}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2.5 border-t border-graphite/10 p-3.5">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    placeholder={d.chatInputPlaceholder}
                    className="flex-1 rounded-[2px] border border-graphite/20 bg-porcelain px-3.5 py-3 text-[15px]"
                  />
                  <button
                    onClick={sendChat}
                    className="rounded-[2px] bg-cobalt px-6 text-[15px] font-semibold text-white"
                  >
                    {d.chatSend}
                  </button>
                </div>
              </div>

              <div className="border border-graphite/10 bg-white p-6 md:sticky md:top-[140px]">
                <CardLabel>{d.chatSummaryTitle}</CardLabel>
                <div className="flex flex-col">
                  {[
                    { k: d.chatSummaryKeys.type, v: productLabel },
                    { k: d.chatSummaryKeys.size, v: `${sizePreset} · ${d.fits[fit]}` },
                    { k: d.chatSummaryKeys.style, v: d.styles[style] },
                    { k: d.chatSummaryKeys.symmetry, v: d.syms[symmetry] },
                    { k: d.chatSummaryKeys.density, v: d.densities[density] },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="flex justify-between border-b border-graphite/[0.08] py-[11px] text-sm"
                    >
                      <span className="text-ink60">{row.k}</span>
                      <span className="font-semibold">{row.v}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => go("suggestions")}
                  className="mt-[22px] w-full rounded-[2px] bg-graphite py-3.5 text-[15px] font-semibold text-porcelain"
                >
                  {d.chatConfirm}
                </button>
                <button
                  onClick={() => go("idea")}
                  className="mt-3 w-full cursor-pointer text-center text-[13px] text-ink60"
                >
                  {d.chatBack}
                </button>
              </div>
            </div>
          </section>
        )}

        {screen === "suggestions" && (
          <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-10">
            <div className="mb-9 flex items-end justify-between gap-4">
              <div>
                <Eyebrow>{d.sugEyebrow}</Eyebrow>
                <h2 className="text-[32px] font-semibold sm:text-[38px]">{d.sugTitle}</h2>
              </div>
              <button
                onClick={() => go("chat")}
                className="whitespace-nowrap rounded-[2px] border border-graphite px-[22px] py-3 text-sm"
              >
                {d.sugRegen}
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {d.suggestions.map((c) => {
                const high = (c.complexity as string) === d.complexities.high;
                const stripBg = `repeating-linear-gradient(${90 + c.tilt}deg, ${GRAPHITE} 0 ${c.gap}px, ${PORCELAIN} ${c.gap}px ${c.gap + 2}px)`;
                return (
                  <div key={c.id} className="flex flex-col border border-graphite/[0.16] bg-white">
                    <div className="relative border-b border-graphite/10" style={{ height: 110, background: stripBg }}>
                      <span className="absolute bottom-2 end-2.5 bg-porcelain/90 px-1.5 py-0.5 font-mono text-[10px] text-graphite">
                        {d.sugFlatLabel}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-center border-b border-graphite/10"
                      style={{ height: 130, background: "repeating-linear-gradient(135deg,#d8d2c8 0 2px,#e3ddd3 2px 12px)" }}
                    >
                      <span className="bg-porcelain/90 px-1.5 py-0.5 font-mono text-[10px] text-ink60">
                        {d.sugRolledLabel}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-[22px]">
                      <div className="flex items-baseline justify-between">
                        <div className="font-display text-xl font-semibold">{c.name}</div>
                        <div className="text-sm text-ink60">{c.hebrew}</div>
                      </div>
                      <p className="my-2.5 flex-1 text-sm text-ink60" style={{ textWrap: "pretty" }}>
                        {c.desc}
                      </p>
                      <div className="mb-3.5 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-ink60">
                        <span>{productLabel}</span>
                        <span>· מידה {sizePreset}</span>
                        <span>· {d.sugDensityLabel} {c.density}</span>
                        <span>· {d.sugComplexityLabel} {c.complexity}</span>
                      </div>
                      <div className="mb-4 flex items-center gap-2">
                        <span
                          className="h-[7px] w-[7px] rounded-full"
                          style={{ background: high ? COBALT : "#4a8f5c" }}
                        />
                        <span className="text-xs" style={{ color: high ? COBALT : "#4a8f5c" }}>
                          {high ? d.sugStatusReview : d.sugStatusOk}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-graphite/10 pt-4">
                        <div className="font-display text-xl font-semibold">₪{c.price}</div>
                        <button
                          onClick={() => pickSuggestion(c)}
                          className="rounded-[2px] bg-graphite px-[22px] py-[11px] text-sm font-semibold text-porcelain"
                        >
                          {d.sugPick}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => go("chat")} className="mt-7 w-full cursor-pointer text-center text-sm text-ink60">
              {d.sugBack}
            </button>
          </section>
        )}

        {screen === "edit" && (
          <section className="mx-auto max-w-[1200px] px-5 py-12 sm:px-10">
            <Eyebrow>{`${d.editEyebrow} · ${editName}`}</Eyebrow>
            <h2 className="mb-7 text-[28px] font-semibold sm:text-[34px]">{d.editTitle}</h2>
            <div className="grid items-start gap-8 md:grid-cols-[1.5fr_1fr]">
              <div>
                <div className="flex items-center justify-center border border-graphite/10 bg-white p-10" style={{ minHeight: 280 }}>
                  <div
                    className="w-full border border-graphite/15"
                    style={{
                      maxWidth: 520,
                      height: 18 + edit.widthMm * 4,
                      background: editStripBg,
                      borderRadius: edit.corners * 4,
                    }}
                  />
                </div>
                <div className="mt-3.5 flex gap-2">
                  {[d.editRollLabel, d.editHandLabel].map((lbl) => (
                    <div
                      key={lbl}
                      className="flex flex-1 items-center justify-center border border-graphite/10"
                      style={{ height: 100, background: "repeating-linear-gradient(135deg,#d8d2c8 0 2px,#e3ddd3 2px 12px)" }}
                    >
                      <span className="bg-porcelain/90 px-1.5 py-0.5 font-mono text-[10px] text-ink60">{lbl}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3.5 flex items-center gap-2.5 border border-graphite/10 bg-white p-4">
                  <input
                    value={aiReq}
                    onChange={(e) => setAiReq(e.target.value)}
                    placeholder={d.editAiPlaceholder}
                    className="flex-1 rounded-[2px] border border-graphite/20 bg-porcelain px-3.5 py-[11px] text-sm"
                  />
                  <button onClick={applyAi} className="rounded-[2px] bg-cobalt px-5 py-[11px] text-sm font-semibold text-white">
                    {d.editApply}
                  </button>
                </div>
              </div>

              <div className="border border-graphite/10 bg-white p-6">
                <CardLabel>{d.editParamsTitle}</CardLabel>
                <EditSlider label={`${d.editWidthLabel} — ${edit.widthMm} ${d.mm}`} min={4} max={16} value={edit.widthMm} onChange={(v) => setEdit((e) => ({ ...e, widthMm: v }))} />
                <EditSlider label={`${d.editElementLabel} — ${edit.elementSize}`} min={1} max={8} value={edit.elementSize} onChange={(v) => setEdit((e) => ({ ...e, elementSize: v }))} />
                <EditSlider label={`${d.editGapLabel} — ${edit.gapMm} ${d.mm}`} min={2} max={16} value={edit.gapMm} onChange={(v) => setEdit((e) => ({ ...e, gapMm: v }))} />
                <EditSlider label={`${d.editRepeatsLabel} — ${edit.repeats}`} min={2} max={14} value={edit.repeats} onChange={(v) => setEdit((e) => ({ ...e, repeats: v }))} />
                <EditSlider label={`${d.editCornersLabel} — ${edit.corners}`} min={0} max={6} value={edit.corners} onChange={(v) => setEdit((e) => ({ ...e, corners: v }))} />

                <div className="mb-2 flex items-center justify-between border-t border-graphite/10 py-3">
                  <span className="text-sm font-semibold">{edit.symmetry ? d.syms.symmetric : d.syms.asymmetric}</span>
                  <button
                    onClick={() => setEdit((e) => ({ ...e, symmetry: !e.symmetry }))}
                    className="relative cursor-pointer rounded-full transition-colors"
                    style={{ width: 42, height: 24, background: edit.symmetry ? COBALT : "#aab4b8" }}
                    aria-pressed={edit.symmetry}
                  >
                    <span
                      className="absolute rounded-full bg-white transition-all"
                      style={{ top: 2, insetInlineStart: edit.symmetry ? 20 : 2, width: 20, height: 20 }}
                    />
                  </button>
                </div>

                <div className="mt-3.5 flex gap-2.5">
                  <button className="flex-1 rounded-[2px] border border-graphite/25 py-[11px] text-[13px]">{d.editUndo}</button>
                  <button className="flex-1 rounded-[2px] border border-graphite/25 py-[11px] text-[13px]">{d.editPrevVersion}</button>
                </div>
                <button onClick={() => go("final")} className="mt-3 w-full rounded-[2px] bg-graphite py-3.5 text-[15px] font-semibold text-porcelain">
                  {d.editSave}
                </button>
              </div>
            </div>
          </section>
        )}

        {screen === "final" && (
          <section className="mx-auto max-w-[1200px] px-5 py-12 sm:px-10">
            <Eyebrow>{d.finalEyebrow}</Eyebrow>
            <h2 className="mb-7 text-[32px] font-semibold sm:text-[38px]">{d.finalTitle}</h2>
            <div className="grid items-start gap-8 md:grid-cols-[1.5fr_1fr]">
              <div>
                <div className="mb-3.5 flex gap-2">
                  {([
                    { v: "flat", label: d.viewFlat },
                    { v: "rolled", label: d.viewRolled },
                    { v: "body", label: d.viewBody },
                  ] as const).map((t) => {
                    const on = finalView === t.v;
                    return (
                      <button
                        key={t.v}
                        onClick={() => setFinalView(t.v)}
                        className="rounded-[2px] border border-graphite px-[18px] py-2.5 text-sm"
                        style={{ background: on ? GRAPHITE : "transparent", color: on ? PORCELAIN : GRAPHITE }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center border border-graphite/10 bg-white p-10" style={{ minHeight: 300 }}>
                  {finalView === "flat" ? (
                    <div className="w-full border border-graphite/15" style={{ maxWidth: 520, height: 60, background: finalStripBg }} />
                  ) : (
                    <div
                      className="flex items-center justify-center border border-graphite/10"
                      style={{ width: "100%", maxWidth: 420, aspectRatio: "4 / 3", background: "repeating-linear-gradient(135deg,#d8d2c8 0 2px,#e3ddd3 2px 12px)" }}
                    >
                      <span className="bg-porcelain/90 px-2 py-1 font-mono text-[11px] text-ink60">
                        {finalView === "rolled" ? d.finalRolledLabel : d.finalBodyLabel}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                  {d.checks.map((ch) => (
                    <div key={ch.title} className="border border-graphite/10 bg-white p-[18px]">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold">{ch.title}</span>
                        <span className="flex items-center gap-1.5 text-[13px] text-successgreen">
                          <span className="h-[7px] w-[7px] rounded-full bg-successgreen" />
                          {ch.status}
                        </span>
                      </div>
                      {ch.items.map((it) => (
                        <div key={it} className="py-[3px] text-[13px] text-ink60">
                          ✓ {it}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mt-3.5 text-[13px] text-mist" style={{ textWrap: "pretty" }}>
                  {d.finalDisclaimer}
                </p>
              </div>

              <div className="md:sticky md:top-[140px]">
                <div className="mb-4 border border-graphite/10 bg-white p-6">
                  <CardLabel>{d.specTitle}</CardLabel>
                  {[
                    { k: d.specKeys.type, v: productLabel },
                    { k: d.specKeys.size, v: sizePreset },
                    { k: d.specKeys.width, v: `${edit.widthMm} ${d.mm}` },
                    { k: d.specKeys.material, v: d.specMaterialVal },
                    { k: d.specKeys.thickness, v: d.specThicknessVal },
                    { k: d.specKeys.finish, v: d.specFinishVal },
                    { k: d.specKeys.gap, v: `${gapMm} ${d.mm}` },
                  ].map((row) => (
                    <div key={row.k} className="flex justify-between border-b border-graphite/[0.07] py-2.5 text-sm">
                      <span className="text-ink60">{row.k}</span>
                      <span className="font-semibold">{row.v}</span>
                    </div>
                  ))}
                </div>

                <div className="border border-graphite/10 bg-white p-6">
                  <CardLabel>{d.priceTitle}</CardLabel>
                  {[
                    { k: d.priceBase, v: base },
                    { k: d.priceComplexity, v: complexityAdd },
                    { k: d.priceWidth, v: Math.round(widthAdd) },
                    { k: d.pricePackaging, v: packaging },
                    { k: d.priceShipping, v: shipping },
                    { k: d.priceVat, v: tax },
                  ].map((row) => (
                    <div key={row.k} className="flex justify-between py-[7px] text-sm text-ink60">
                      <span>{row.k}</span>
                      <span>₪{row.v}</span>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t border-graphite/15 pt-3.5">
                    <span className="text-base font-semibold">{d.priceTotal}</span>
                    <span className="font-display text-2xl font-bold">₪{total}</span>
                  </div>
                  <Link
                    href="/order"
                    className="mt-[18px] block rounded-[2px] bg-cobalt py-3.5 text-center text-base font-semibold text-white"
                  >
                    {d.finalOrder}
                  </Link>
                  <button onClick={() => go("edit")} className="mt-3 w-full cursor-pointer text-center text-[13px] text-ink60">
                    {d.finalBack}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ===== קומפוננטות עזר ===== */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 font-display text-xs tracking-[0.22em] text-mist">{children}</div>;
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 font-display text-xs tracking-[0.15em] text-mist">{children}</div>;
}

function FieldLabel({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div className={`mb-3 font-semibold text-ink60 ${small ? "text-[13px]" : "text-sm"}`}>{children}</div>
  );
}

function PrimaryBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-[2px] bg-graphite px-[34px] py-3.5 text-base font-semibold text-porcelain">
      {children}
    </button>
  );
}

function ProductBody({ name, price, desc, meta }: { name: string; price: string; desc: string; meta: readonly string[] }) {
  return (
    <div className="p-[26px]">
      <div className="mb-2.5 flex items-baseline justify-between">
        <div className="text-[22px] font-semibold">{name}</div>
        <div className="font-display text-sm text-cobalt">{price}</div>
      </div>
      <p className="mb-4 text-[15px] text-ink60">{desc}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink60">
        {meta.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2.5 text-[13px] font-semibold text-ink60">{label}</div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-[2px] p-[9px] text-center text-[13px]"
      style={{
        border: `1px solid ${on ? COBALT : "rgba(32,35,38,0.2)"}`,
        background: on ? COBALT : "#fff",
        color: on ? "#fff" : GRAPHITE,
      }}
    >
      {children}
    </button>
  );
}

function EditSlider({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-semibold text-ink60">{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="mb-[18px] w-full"
        style={{ accentColor: COBALT }}
      />
    </div>
  );
}
