import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabase =
  createClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // FETCH WORLD CUP MATCHES
    const response =
      await fetch(
        "https://api.football-data.org/v4/competitions/WC/matches",
        {
          headers: {
            "X-Auth-Token":
              process.env
                .FOOTBALL_DATA_API_KEY!,
          },

          cache:
            "no-store",
        }
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Football API Error:",
        errorText
      );

      return NextResponse.json(
        {
          success: false,

          error:
            "Football API request failed",
        },
        {
          status: 500,
        }
      );
    }

    const apiData =
      await response.json();

    if (
      !apiData.matches
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "No matches found",
        },
        {
          status: 500,
        }
      );
    }

    // FETCH EXISTING MATCHES ONCE — need processed + live status to avoid clobbering ESPN data
    const { data: existingMatches, error: existingError } = await supabase
      .from("matches")
      .select("api_match_id, processed, status");

    if (existingError) {
      console.error(existingError);
      return NextResponse.json({ success: false, error: existingError.message }, { status: 500 });
    }

    // Lookup maps — force string keys to avoid number/string type mismatch
    const processedMap = new Map<string, boolean>();
    const statusMap = new Map<string, string>();
    existingMatches?.forEach((m) => {
      const key = String(m.api_match_id);
      processedMap.set(key, m.processed);
      statusMap.set(key, m.status);
    });

    const LIVE_STATUSES = new Set(["IN_PLAY", "LIVE", "PAUSED", "FINISHED"]);

    // BUILD BULK PAYLOAD — skip live/finished matches entirely to avoid nulling ESPN data
    const payload = apiData.matches
      .filter((match: any) => {
        const currentStatus = statusMap.get(String(match.id)) ?? "";
        return !LIVE_STATUSES.has(currentStatus);
      })
      .map((match: any) => ({
        api_match_id: String(match.id),
        team1: match.homeTeam?.name || "TBD",
        team2: match.awayTeam?.name || "TBD",
        team1_crest: match.homeTeam?.crest || null,
        team2_crest: match.awayTeam?.crest || null,
        kickoff_time: match.utcDate || null,
        matchday: match.stage || "Group Stage",
        processed: processedMap.get(String(match.id)) || false,
        status: match.status || "SCHEDULED",
        team1_score: match.score?.fullTime?.home ?? null,
        team2_score: match.score?.fullTime?.away ?? null,
        goals: match.goals ?? [],
        bookings: match.bookings ?? [],
        substitutions: match.substitutions ?? [],
      }));

    // SINGLE BULK UPSERT
    const { error } =
      await supabase
        .from("matches")
        .upsert(
          payload,
          {
            onConflict:
              "api_match_id",
          }
        );

    if (error) {
      console.error(
        "Bulk Upsert Error:",
        error
      );

      return NextResponse.json(
        {
          success: false,

          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        synced:
          payload.length,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error(
      "Sync Route Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}