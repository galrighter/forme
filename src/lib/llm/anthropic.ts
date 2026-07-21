// קריאות Anthropic API מצד שרת בלבד. בלי SDK — fetch ישיר, שליטה מלאה ב-timeout.

import { LLM_TIMEOUT_MS, LlmError, type LlmRequest } from "./core";

export function anthropicModel(): string {
  return process.env.LLM_MODEL || "claude-sonnet-4-6";
}

export async function callAnthropic(req: LlmRequest): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new LlmError("ANTHROPIC_API_KEY is not configured", false);

  const content: unknown[] = [];
  for (const img of req.images ?? []) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.base64 },
    });
  }
  content.push({ type: "text", text: req.userText });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: anthropicModel(),
        max_tokens: req.maxTokens ?? 8192,
        system: req.system,
        messages: [{ role: "user", content }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const retriable = res.status === 429 || res.status >= 500;
      throw new LlmError(`Anthropic API ${res.status}: ${body.slice(0, 300)}`, retriable);
    }
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    if (!text.trim()) throw new LlmError("LLM returned empty response", true);
    return text;
  } catch (e) {
    if (e instanceof LlmError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new LlmError("LLM request timed out after 120s", true);
    }
    throw new LlmError(`LLM request failed: ${e instanceof Error ? e.message : e}`, true);
  } finally {
    clearTimeout(timer);
  }
}
