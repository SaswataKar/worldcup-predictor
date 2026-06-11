import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("predictions")
    .select("*")
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ predictions: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, matchId, homeScore, awayScore } = body;

  if (!userId || !matchId || homeScore == null || awayScore == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  let selectedResult = "draw";
  if (homeScore > awayScore) selectedResult = "team1";
  if (awayScore > homeScore) selectedResult = "team2";

  const { error } = await supabaseServer
    .from("predictions")
    .upsert(
      [{
        user_id: userId,
        match_id: matchId,
        predicted_team1_score: Number(homeScore),
        predicted_team2_score: Number(awayScore),
        predicted_result: selectedResult,
        prediction_type: "standard",
        booster_used: "none",
        updated_at: new Date().toISOString(),
      }],
      { onConflict: "user_id,match_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId, matchId } = await req.json();

  if (!userId || !matchId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("predictions")
    .delete()
    .eq("match_id", matchId)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
