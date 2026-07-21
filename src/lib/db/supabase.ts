import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// גישת DB רק מצד שרת, עם המפתח הסודי (service role). הקליינט לעולם לא מדבר
// עם Supabase ישירות — אין auth אמיתי בשלב 1.

let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SECRET_KEY are not configured");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const STORAGE_BUCKET = "studio";

let bucketEnsured = false;

/** יצירת ה-bucket אם אינו קיים (אידמפוטנטי). */
export async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;
  const sb = supabaseAdmin();
  const { error } = await sb.storage.createBucket(STORAGE_BUCKET, { public: false });
  // 409 = כבר קיים
  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(`Failed to ensure storage bucket: ${error.message}`);
  }
  bucketEnsured = true;
}

const SEED_PROFILES = [
  { name: "בודק 1", color: "#e05d5d" },
  { name: "בודק 2", color: "#e0a04d" },
  { name: "בודק 3", color: "#4da34d" },
  { name: "בודק 4", color: "#4d8fe0" },
  { name: "בודק 5", color: "#8a5de0" },
  { name: "בודק 6", color: "#d05da8" },
];

/** זריעת ששת הבודקים אם הטבלה ריקה (רשת ביטחון למקרה שה-seed במיגרציה לא רץ). */
export async function ensureProfilesSeeded(): Promise<void> {
  const sb = supabaseAdmin();
  const { count, error } = await sb
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(`profiles check failed: ${error.message}`);
  if ((count ?? 0) > 0) return;
  const { error: insErr } = await sb.from("profiles").insert(SEED_PROFILES);
  if (insErr && !/duplicate/i.test(insErr.message)) {
    throw new Error(`profiles seed failed: ${insErr.message}`);
  }
}
