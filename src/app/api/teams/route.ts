import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CACHE_TTL_HOURS = 24;

export async function GET() {
  try {
    // 1. CHECK SUPABASE CACHE FIRST
    const { data: cached } = await supabase
      .from("teams_cache")
      .select("data, cached_at")
      .eq("id", 1)
      .single();

    if (cached) {
      const ageHours =
        (Date.now() - new Date(cached.cached_at).getTime()) / (1000 * 60 * 60);

      if (ageHours < CACHE_TTL_HOURS) {
        // Serve from cache — no football-data.org call made
        return NextResponse.json(
          { success: true, teams: cached.data, fromCache: true },
          { status: 200 }
        );
      }
    }

    // 2. CACHE MISS OR STALE — fetch from football-data.org
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/WC/teams",
      {
        headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      // If fetch fails but we have stale cache, return it anyway
      if (cached) {
        console.warn("Football API failed — serving stale teams cache");
        return NextResponse.json(
          { success: true, teams: cached.data, fromCache: true, stale: true },
          { status: 200 }
        );
      }
      const text = await response.text();
      console.error("Teams API error:", text);
      return NextResponse.json(
        { success: false, error: "Football API request failed" },
        { status: 500 }
      );
    }

    const apiData = await response.json();
    const teams = apiData.teams ?? [];

    // 3. UPSERT INTO CACHE
    await supabase.from("teams_cache").upsert(
      { id: 1, data: teams, cached_at: new Date().toISOString() },
      { onConflict: "id" }
    );

    return NextResponse.json(
      { success: true, teams, fromCache: false },
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
