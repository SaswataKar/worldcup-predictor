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

    // FETCH EXISTING MATCHES ONCE
    const {
      data:
        existingMatches,
      error:
        existingError,
    } = await supabase
      .from("matches")
      .select(
        "api_match_id, processed"
      );

    if (
      existingError
    ) {
      console.error(
        existingError
      );

      return NextResponse.json(
        {
          success: false,

          error:
            existingError.message,
        },
        {
          status: 500,
        }
      );
    }

    // CREATE LOOKUP MAP
    const processedMap =
      new Map();

    existingMatches?.forEach(
      (match) => {
        processedMap.set(
          match.api_match_id,
          match.processed
        );
      }
    );

    // BUILD BULK PAYLOAD
    const payload =
      apiData.matches.map(
        (match: any) => ({
          api_match_id:
            String(match.id),

          team1:
            match.homeTeam
              ?.name ||
            "TBD",

          team2:
            match.awayTeam
              ?.name ||
            "TBD",

          team1_crest:
            match.homeTeam
              ?.crest ||
            null,

          team2_crest:
            match.awayTeam
              ?.crest ||
            null,

          kickoff_time:
            match.utcDate ||
            null,

          status:
            match.status ||
            "SCHEDULED",

          team1_score:
            match.score
              ?.fullTime
              ?.home ??
            null,

          team2_score:
            match.score
              ?.fullTime
              ?.away ??
            null,

          matchday:
            match.stage ||
            "Group Stage",

          // MATCH EVENTS — stored as-is from the API
          goals: match.goals ?? [],
          bookings: match.bookings ?? [],
          substitutions: match.substitutions ?? [],

          // PRESERVE PROCESSED STATE
          processed:
            processedMap.get(
              String(
                match.id
              )
            ) || false,
        })
      );

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