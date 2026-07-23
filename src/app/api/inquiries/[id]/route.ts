import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, handleRouteError } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { updateInquiryStatus } from "@/lib/db/inquiries";

const patchSchema = z.object({
  status: z.enum(["new", "contacted", "closed"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = await parseBody(req, patchSchema);
    const inquiry = await updateInquiryStatus(id, body.status);
    return NextResponse.json({ inquiry });
  } catch (err) {
    return handleRouteError(err);
  }
}
