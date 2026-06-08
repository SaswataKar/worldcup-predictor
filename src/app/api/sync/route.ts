import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabase =
  createClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET() {
  try {
    // FETCH FROM FOOTBALL DATA API
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

    let syncedCount = 0;

    // UPSERT MATCHES
    for (const match of apiData.matches) {
      // CHECK EXISTING MATCH
      const {
        data:
          existingMatch,
      } = await supabase
        .from("matches")
        .select(
          "id, processed"
        )
        .eq(
          "api_match_id",
          String(match.id)
        )
        .single();

      const payload = {
        api_match_id:
          String(match.id),

        team1:
          match.homeTeam
            ?.name || "TBD",

        team2:
          match.awayTeam
            ?.name || "TBD",

        team1_crest:
          match.homeTeam
            ?.crest || null,

        team2_crest:
          match.awayTeam
            ?.crest || null,

        kickoff_time:
          match.utcDate || null,

        status:
          match.status ||
          "SCHEDULED",

        team1_score:
          match.score
            ?.fullTime
            ?.home ?? null,

        team2_score:
          match.score
            ?.fullTime
            ?.away ?? null,

        matchday:
          match.stage ||
          "Group Stage",

        // PRESERVE PROCESSING STATE
        processed:
          existingMatch?.processed ||
          false,
      };

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
          "Supabase Match Upsert Error:",
          error
        );

        continue;
      }

      syncedCount++;
    }

    return NextResponse.json(
      {
        success: true,

        synced:
          syncedCount,

        total:
          apiData.matches
            .length,
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

