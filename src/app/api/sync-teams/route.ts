import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Force-refresh the teams cache from football-data.org.
// Call this manually when squads change (injury replacements, etc.)
// e.g. GET /api/sync-teams
export async function GET(req: NextRequest) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/WC/teams",
      {
        headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { success: false, error: text },
        { status: 500 }
      );
    }

    const apiData = await response.json();
    const teams = apiData.teams ?? [];

    const { error } = await supabase.from("teams_cache").upsert(
      { id: 1, data: teams, cached_at: new Date().toISOString() },
      { onConflict: "id" }
    );

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, synced: teams.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
