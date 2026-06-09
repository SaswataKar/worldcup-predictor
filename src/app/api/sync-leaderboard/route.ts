import { NextResponse } from "next/server";
import { updateLeaderboard } from "@/services/updateLeaderboard";

export async function GET() {
  try {
    await updateLeaderboard();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
