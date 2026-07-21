import { FAB } from "@/lib/fabrication.config";
import { validateDesign, type DesignDims } from "@/lib/geometry/validate";
import type { NormalizedDesign } from "@/lib/geometry/normalize";
import type { ValidationReport } from "@/lib/geometry/types";
import { callLlm } from "./client";
import type { LlmImage, LlmReply } from "./core";
import { buildSystemPrompt, buildGenerateUserText, buildRepairUserText, type PromptDims } from "./prompts";
import { convertTextRequests } from "@/lib/text/textToPath";

// לולאת יצירה + תיקון אוטומטית — סעיף 6.3:
// prompt → LLM → normalize → validate; אם fail → הודעת תיקון עם הדוח → LLM,
// עד MAX_REPAIR_ROUNDS. גם אם עדיין fail — מחזירים את התוצאה האחרונה.

export interface PipelineResult {
  svg: string;                    // ה-SVG הקנוני (או הגולמי אם הנרמול נכשל בכל הסבבים)
  report: ValidationReport;
  normalized: NormalizedDesign | null;
  repairRounds: number;           // כמה סבבי תיקון בוצעו בפועל
  source: "generate" | "edit" | "auto_repair";
  llm: Pick<LlmReply, "provider" | "model">;  // מי ענה בפועל (הקריאה האחרונה)
}

export async function runGeneratePipeline(opts: {
  dims: PromptDims;
  userPrompt: string;
  currentSvg: string | null;
  images: LlmImage[];
  hasAnnotation: boolean;
  hasInspiration: boolean;
}): Promise<PipelineResult> {
  const system = buildSystemPrompt(opts.dims);
  const vDims: DesignDims = {
    productType: opts.dims.productType,
    lengthMm: opts.dims.lengthMm,
    widthMm: opts.dims.widthMm,
    thicknessMm: opts.dims.thicknessMm,
  };
  const baseSource = opts.currentSvg ? "edit" : "generate";

  let reply = await callLlm({
    system,
    userText: buildGenerateUserText(opts.userPrompt, opts.currentSvg, opts.hasAnnotation, opts.hasInspiration),
    images: opts.images,
  });
  let raw = reply.text;

  let best: PipelineResult | null = null;
  for (let round = 0; round <= FAB.MAX_REPAIR_ROUNDS; round++) {
    const withText = await convertTextRequests(raw, vDims);
    const { report, normalized } = validateDesign(withText, vDims);
    const result: PipelineResult = {
      svg: normalized?.canonicalSvg ?? withText,
      report,
      normalized,
      repairRounds: round,
      source: round === 0 ? baseSource : "auto_repair",
      llm: { provider: reply.provider, model: reply.model },
    };
    if (report.status !== "fail") return result;
    best = result;
    if (round === FAB.MAX_REPAIR_ROUNDS) break;

    const failing = report.checks.filter((c) => c.status !== "pass");
    const explanation = failing
      .map((c) => `- [${c.check}] (${c.status}) ${c.details}`)
      .join("\n");
    reply = await callLlm({
      system,
      userText: buildRepairUserText(
        normalized?.canonicalSvg ?? raw,
        JSON.stringify({ status: report.status, checks: failing.map(({ check, status, details, locations }) => ({ check, status, details, locations })) }),
        explanation,
      ),
    });
    raw = reply.text;
  }
  return best!;
}
