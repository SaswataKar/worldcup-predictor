import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/WC/teams",
      {
        headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
        next: { revalidate: 3600 }, // cache for 1 hour — squad data doesn't change often
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Teams API error:", text);
      return NextResponse.json(
        { success: false, error: "Football API request failed" },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      { success: true, teams: data.teams || [], season: data.season || null },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Teams Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
