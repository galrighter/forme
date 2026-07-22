import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, handleRouteError, ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import {
  createInquiry,
  listInquiries,
  countRecentFromEmail,
  type InquiryStatus,
} from "@/lib/db/inquiries";

const MAX_PER_EMAIL_PER_DAY = 10;

const createSchema = z.object({
  kind: z.enum(["order", "contact"]).default("order"),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  productType: z.enum(["bracelet", "ring"]).optional(),
  message: z.string().trim().min(1).max(4000),
  // honeypot נגד בוטים — אמור להישאר ריק; אם מולא, מתייחסים כבוט
  company: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, createSchema);

    // בוט מילא את ה-honeypot: מחזירים הצלחה בלי לשמור
    if (body.company) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const recent = await countRecentFromEmail(body.email);
    if (recent >= MAX_PER_EMAIL_PER_DAY) {
      throw new ApiError("rate_limited", "Too many requests from this email today", 429);
    }

    const inquiry = await createInquiry({
      kind: body.kind,
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      product_type: body.productType ?? null,
      message: body.message,
    });

    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET(req: Request) {
  try {
    requireAdmin(req);
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status") as InquiryStatus | null;
    const valid: InquiryStatus[] = ["new", "contacted", "closed"];
    const status = statusParam && valid.includes(statusParam) ? statusParam : undefined;
    const inquiries = await listInquiries(status);
    return NextResponse.json({ inquiries });
  } catch (err) {
    return handleRouteError(err);
  }
}
