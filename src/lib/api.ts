import { NextResponse } from "next/server";
import { z } from "zod";

// פורמט שגיאות אחיד: { error: { code, message } }

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleRouteError(err: unknown) {
  if (err instanceof ApiError) return jsonError(err.code, err.message, err.status);
  if (err instanceof z.ZodError) {
    return jsonError("invalid_input", err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), 400);
  }
  console.error("API error:", err);
  const message = err instanceof Error ? err.message : "internal error";
  return jsonError("internal", message, 500);
}

export async function parseBody<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError("invalid_json", "Request body is not valid JSON", 400);
  }
  return schema.parse(raw);
}
