import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;

    const { data: league, error: leagueErr } = await supabase
      .from("leagues")
      .select("*")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (leagueErr) return NextResponse.json({ success: false, error: leagueErr.message }, { status: 500 });
    if (!league) return NextResponse.json({ success: false, error: "League not found" }, { status: 404 });

    // Get all member user_ids
    const { data: members } = await supabase
      .from("league_members")
      .select("user_id, joined_at")
      .eq("league_id", league.id);

    const userIds = (members ?? []).map((m: any) => m.user_id);

    if (userIds.length === 0) {
      return NextResponse.json({ success: true, league, leaderboard: [] });
    }

    // Fetch leaderboard entries for these users only
    const { data: leaderboard } = await supabase
      .from("leaderboard")
      .select("*")
      .in("user_id", userIds)
      .order("total_points", { ascending: false });

    // Users with 0 points or not yet in leaderboard — fetch from users table
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, name")
      .in("id", userIds);

    // Build complete list: merge leaderboard data + fill missing users with 0 pts
    const leaderboardUserIds = new Set((leaderboard ?? []).map((e: any) => e.user_id));
    const zeroUsers = (allUsers ?? [])
      .filter((u: any) => !leaderboardUserIds.has(u.id))
      .map((u: any) => ({
        user_id: u.id,
        username: u.name,
        total_points: 0,
        exact_predictions: 0,
        correct_results: 0,
      }))
      .sort((a: any, b: any) => a.username.localeCompare(b.username));

    const scorers = (leaderboard ?? []).filter((e: any) => e.total_points > 0);
    const zeros = [
      ...(leaderboard ?? []).filter((e: any) => e.total_points === 0),
      ...zeroUsers,
    ].sort((a: any, b: any) => a.username.localeCompare(b.username));

    return NextResponse.json({
      success: true,
      league,
      leaderboard: [...scorers, ...zeros],
      memberCount: userIds.length,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// Leave league
export async function DELETE(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { userId } = await req.json();

    const { data: league } = await supabase
      .from("leagues")
      .select("id, created_by")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (!league) return NextResponse.json({ success: false, error: "League not found" }, { status: 404 });

    // Creator cannot leave — they must disband
    if (league.created_by === userId) {
      return NextResponse.json({ success: false, error: "As creator, use Disband to remove the league entirely" }, { status: 403 });
    }

    await supabase
      .from("league_members")
      .delete()
      .eq("league_id", league.id)
      .eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
