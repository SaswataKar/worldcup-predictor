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
    // FETCH MATCHES
    const {
      data: matches,
      error,
    } = await supabase
      .from("matches")
      .select("*")
      .order(
        "kickoff_time",
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        "Matches Fetch Error:",
        error
      );

      return NextResponse.json(
        {
          success: false,

          error:
            error.message,

          matches: [],
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        matches:
          matches || [],
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
      "Matches Route Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error.message,

        matches: [],
      },
      {
        status: 500,
      }
    );
  }
}

