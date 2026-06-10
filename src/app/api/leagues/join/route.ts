import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { code, userId } = await req.json();

    if (!code?.trim() || !userId) {
      return NextResponse.json({ success: false, error: "Code and userId required" }, { status: 400 });
    }

    // Find league
    const { data: league, error: leagueErr } = await supabase
      .from("leagues")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (leagueErr) return NextResponse.json({ success: false, error: leagueErr.message }, { status: 500 });
    if (!league) return NextResponse.json({ success: false, error: "No league found with that code" }, { status: 404 });

    // Check already a member
    const { data: existing } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", league.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) return NextResponse.json({ success: false, error: "You are already in this league" }, { status: 409 });

    // Join
    const { error: joinErr } = await supabase
      .from("league_members")
      .insert({ league_id: league.id, user_id: userId });

    if (joinErr) return NextResponse.json({ success: false, error: joinErr.message }, { status: 500 });

    return NextResponse.json({ success: true, league });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
