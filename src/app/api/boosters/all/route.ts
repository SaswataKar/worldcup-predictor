import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Returns a map of user_id → array of booster_types they've assigned
export async function GET() {
  const { data, error } = await supabaseServer
    .from("daily_boosters")
    .select("user_id, booster_type");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byUser: Record<number, string[]> = {};
  (data ?? []).forEach(({ user_id, booster_type }: { user_id: number; booster_type: string }) => {
    if (!byUser[user_id]) byUser[user_id] = [];
    byUser[user_id].push(booster_type);
  });

  return NextResponse.json({ boosters: byUser });
}
