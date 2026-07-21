import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/supabase";
import { handleRouteError, parseBody, ApiError } from "@/lib/api";
import { FAB } from "@/lib/fabrication.config";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const profileId = url.searchParams.get("profileId");
    if (!profileId) throw new ApiError("missing_param", "profileId is required", 400);
    const { data, error } = await supabaseAdmin()
      .from("designs")
      .select("id, name, product_type, length_mm, width_mm, gap_mm, thickness_mm, current_version_id, created_at, updated_at")
      .eq("profile_id", profileId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ designs: data });
  } catch (err) {
    return handleRouteError(err);
  }
}

const createSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  productType: z.enum(["bracelet", "ring"]),
  lengthMm: z.number().positive().optional(),
  widthMm: z.number().positive().optional(),
  gapMm: z.number().positive().optional(),
  thicknessMm: z.number().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, createSchema);
    const p = FAB.products[body.productType];
    const insert = {
      profile_id: body.profileId,
      name: body.name ?? undefined,
      product_type: body.productType,
      length_mm: body.lengthMm ?? p.defaultLengthMm,
      width_mm: body.widthMm ?? p.defaultWidthMm,
      gap_mm: body.gapMm ?? p.defaultGapMm,
      thickness_mm: body.thicknessMm ?? FAB.defaultThicknessMm,
    };
    const { data, error } = await supabaseAdmin()
      .from("designs")
      .insert(insert)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ design: data }, { status: 201 });
  } catch (err) {
    return handleRouteError(err);
  }
}
