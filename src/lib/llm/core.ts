// טיפוסים ושגיאות משותפים לכל ספקי ה-LLM (Anthropic / OpenAI).

export interface LlmImage {
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  base64: string;
}

export interface LlmRequest {
  system: string;
  userText: string;
  images?: LlmImage[];
  maxTokens?: number;
}

export const LLM_TIMEOUT_MS = 120_000;

export class LlmError extends Error {
  constructor(message: string, public retriable: boolean) {
    super(message);
  }
}
