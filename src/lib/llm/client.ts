// בחירת ספק LLM: LLM_PROVIDER מפורש מנצח; אחרת — OpenAI אם יש מפתח,
// עם נסיגה ל-Anthropic.

import type { LlmReply, LlmRequest } from "./core";
import { anthropicModel, callAnthropic } from "./anthropic";
import { callOpenAi, hasOpenAiKey, openaiModel } from "./openai";

export type LlmProvider = "openai" | "anthropic";

export function resolveProvider(): LlmProvider {
  const p = (process.env.LLM_PROVIDER || "").trim().toLowerCase();
  if (p === "openai" || p === "anthropic") return p;
  return hasOpenAiKey() ? "openai" : "anthropic";
}

export function activeModel(): string {
  return resolveProvider() === "openai" ? openaiModel() : anthropicModel();
}

export async function callLlm(req: LlmRequest): Promise<LlmReply> {
  if (resolveProvider() !== "openai") {
    return { text: await callAnthropic(req), provider: "anthropic", model: anthropicModel() };
  }
  try {
    return { text: await callOpenAi(req), provider: "openai", model: openaiModel() };
  } catch (e) {
    // נסיגה ל-Anthropic על timeout/שגיאת שרת — עדיף תוצאה מספק אחר מכישלון
    if (process.env.ANTHROPIC_API_KEY) {
      const reason = e instanceof Error ? e.message : String(e);
      console.warn(`OpenAI failed, falling back to Anthropic: ${reason}`);
      return { text: await callAnthropic(req), provider: "anthropic", model: anthropicModel(), fallbackReason: reason };
    }
    throw e;
  }
}
