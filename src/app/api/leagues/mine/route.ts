import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });

    // Get all leagues this user belongs to
    const { data: memberships, error } = await supabase
      .from("league_members")
      .select("league_id, leagues(id, name, code, created_by, created_at)")
      .eq("user_id", Number(userId));

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const leagues = (memberships ?? []).map((m: any) => m.leagues).filter(Boolean);

    // Get member counts for each league
    const leaguesWithCounts = await Promise.all(
      leagues.map(async (league: any) => {
        const { count } = await supabase
          .from("league_members")
          .select("*", { count: "exact", head: true })
          .eq("league_id", league.id);
        return { ...league, member_count: count ?? 0 };
      })
    );

    return NextResponse.json({ success: true, leagues: leaguesWithCounts });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
