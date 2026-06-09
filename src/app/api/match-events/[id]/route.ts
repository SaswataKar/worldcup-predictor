import { NextResponse } from "next/server";

// Proxy the football-data.org match detail endpoint.
// On free tier this returns goals, bookings, substitutions for FINISHED matches.
// Lineups (homeTeam.lineup / bench) may be empty on free tier — test with a real match.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(
      `https://api.football-data.org/v4/matches/${id}`,
      {
        headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
        next: { revalidate: 60 }, // 60s cache — fine for post-match; live will re-fetch
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Match events API error:", text);
      return NextResponse.json(
        { success: false, error: "Football API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Shape only what the UI needs — avoids leaking full API response
    return NextResponse.json({
      success: true,
      status: data.status,
      score: data.score,
      goals: data.goals ?? [],
      bookings: data.bookings ?? [],
      substitutions: data.substitutions ?? [],
      homeLineup: data.homeTeam?.lineup ?? [],
      awayLineup: data.awayTeam?.lineup ?? [],
      homeBench: data.homeTeam?.bench ?? [],
      awayBench: data.awayTeam?.bench ?? [],
      homeTeam: { id: data.homeTeam?.id, name: data.homeTeam?.name, crest: data.homeTeam?.crest },
      awayTeam: { id: data.awayTeam?.id, name: data.awayTeam?.name, crest: data.awayTeam?.crest },
    });
  } catch (error: any) {
    console.error("Match Events Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
