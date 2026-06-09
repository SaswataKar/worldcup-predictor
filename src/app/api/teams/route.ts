import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CACHE_TTL_HOURS = 24;

export async function GET() {
  try {
    // 1. READ FROM SUPABASE CACHE
    const { data: cached, error: cacheError } = await supabase
      .from("teams_cache")
      .select("data, cached_at")
      .eq("id", 1)
      .maybeSingle(); // maybeSingle returns null (not error) when no row exists

    if (cacheError) {
      console.error("teams_cache read error:", cacheError.message);
    }

    if (cached?.data) {
      const ageHours =
        (Date.now() - new Date(cached.cached_at).getTime()) / (1000 * 60 * 60);

      console.log(`teams_cache hit — age: ${ageHours.toFixed(1)}h`);

      if (ageHours < CACHE_TTL_HOURS) {
        // Fresh cache — return immediately, zero football-data.org calls
        return NextResponse.json(
          { success: true, teams: cached.data, fromCache: true },
          { status: 200 }
        );
      }

      console.log("teams_cache stale — refreshing from football-data.org");
    } else {
      console.log("teams_cache empty — fetching from football-data.org");
    }

    // 2. CACHE MISS / STALE — fetch from football-data.org
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/WC/teams",
      {
        headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY! },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      // Fetch failed — serve stale cache if available rather than error
      if (cached?.data) {
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

    // 3. WRITE BACK TO CACHE
    const { error: upsertError } = await supabase
      .from("teams_cache")
      .upsert(
        { id: 1, data: teams, cached_at: new Date().toISOString() },
        { onConflict: "id" }
      );

    if (upsertError) {
      console.error("teams_cache upsert error:", upsertError.message);
    }

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
