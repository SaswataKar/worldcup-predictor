import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

import { processScores } from "@/services/processScores";

export async function GET() {
  try {
    // Only fetch FINISHED matches that haven't been fully processed yet
    const {
      data: matches,
      error,
    } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "FINISHED")
      .eq("processed", false);

    if (error) {
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

    // PROCESS
    await processScores(
      matches || []
    );

    // If any matches were processed, immediately refresh the leaderboard
    if ((matches?.length ?? 0) > 0) {
      try {
        const { updateLeaderboard } = await import("@/services/updateLeaderboard");
        await updateLeaderboard();
      } catch (e) {
        console.error("Leaderboard refresh after scoring failed:", e);
      }
    }

    return NextResponse.json({
      success: true,

      processed:
        matches?.length ||
        0,
    });
  } catch (error: any) {
    console.error(error);

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

