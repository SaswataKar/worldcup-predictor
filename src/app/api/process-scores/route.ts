import { NextRequest, NextResponse } from "next/server";

import { supabaseServer as supabase } from "@/lib/supabaseServer";

import { processScores } from "@/services/processScores";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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

