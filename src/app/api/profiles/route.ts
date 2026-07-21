import { NextResponse } from "next/server";
import { supabaseAdmin, ensureProfilesSeeded } from "@/lib/db/supabase";
import { handleRouteError } from "@/lib/api";

export async function GET() {
  try {
    await ensureProfilesSeeded();
    const { data, error } = await supabaseAdmin()
      .from("profiles")
      .select("id, name, color")
      .order("name");
    if (error) throw new Error(error.message);
    return NextResponse.json({ profiles: data });
  } catch (err) {
    return handleRouteError(err);
  }
}
