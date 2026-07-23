import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, handleRouteError, ApiError } from "@/lib/api";
import { checkAdminToken, adminConfigured, adminCookieHeader } from "@/lib/admin";

const loginSchema = z.object({ token: z.string().min(1).max(500) });

const WEEK = 7 * 24 * 60 * 60;

export async function POST(req: Request) {
  try {
    if (!adminConfigured()) {
      throw new ApiError("admin_disabled", "Admin is not configured (set ADMIN_TOKEN)", 503);
    }
    const body = await parseBody(req, loginSchema);
    if (!checkAdminToken(body.token)) {
      throw new ApiError("unauthorized", "Invalid token", 401);
    }
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", adminCookieHeader(body.token, WEEK));
    return res;
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", adminCookieHeader("", 0));
  return res;
}
