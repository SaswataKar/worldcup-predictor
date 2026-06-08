import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

import { processScores } from "@/services/processScores";

export async function GET() {
  try {
    // FETCH MATCHES
    const {
      data: matches,
      error,
    } = await supabase
      .from("matches")
      .select("*");

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

