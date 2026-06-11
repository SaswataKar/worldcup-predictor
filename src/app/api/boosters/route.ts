import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("daily_boosters")
    .select("*")
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ boosters: data });
}

export async function POST(req: NextRequest) {
  const { userId, boosterType, date } = await req.json();

  if (!userId || !boosterType || !date) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check for existing booster on this matchday (one booster per day)
  const { data: existing } = await supabaseServer
    .from("daily_boosters")
    .select("booster_type")
    .eq("user_id", userId)
    .eq("active_date", date);

  if (existing && existing.some((b: any) => b.booster_type !== boosterType)) {
    return NextResponse.json({ error: "Only one booster can be active per matchday." }, { status: 409 });
  }

  // Remove any existing assignment for this booster type (moving it to a new day)
  await supabaseServer
    .from("daily_boosters")
    .delete()
    .eq("user_id", userId)
    .eq("booster_type", boosterType);

  const { error } = await supabaseServer
    .from("daily_boosters")
    .insert([{ user_id: userId, booster_type: boosterType, active_date: date }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId, boosterType } = await req.json();

  if (!userId || !boosterType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("daily_boosters")
    .delete()
    .eq("user_id", userId)
    .eq("booster_type", boosterType);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
