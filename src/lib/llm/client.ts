// בחירת ספק LLM: LLM_PROVIDER מפורש מנצח; אחרת — OpenAI אם יש מפתח,
// עם נסיגה ל-Anthropic.

import type { LlmRequest } from "./core";
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

export async function callLlm(req: LlmRequest): Promise<string> {
  return resolveProvider() === "openai" ? callOpenAi(req) : callAnthropic(req);
}
