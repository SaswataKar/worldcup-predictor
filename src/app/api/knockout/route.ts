import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const ROUND_ORDER = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];

export async function GET() {
  const { data, error } = await supabaseServer
    .from("matches")
    .select("id,team1,team2,team1_crest,team2_crest,team1_score,team2_score,matchday,status,kickoff_time")
    .in("matchday", ROUND_ORDER)
    .order("kickoff_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rounds: Record<string, typeof data> = {};
  for (const round of ROUND_ORDER) {
    rounds[round] = (data ?? []).filter((m) => m.matchday === round);
  }

  return NextResponse.json({ rounds });
}
