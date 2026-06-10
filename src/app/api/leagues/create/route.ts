import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Unambiguous chars — no 0/O/1/I confusion
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(len = 6) {
  return Array.from({ length: len }, () =>
    CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join("");
}

export async function POST(req: Request) {
  try {
    const { name, userId } = await req.json();

    if (!name?.trim() || !userId) {
      return NextResponse.json({ success: false, error: "Name and userId required" }, { status: 400 });
    }

    // Generate a unique code (retry up to 5 times on collision)
    let code = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateCode();
      const { data } = await supabase
        .from("leagues")
        .select("id")
        .eq("code", candidate)
        .maybeSingle();
      if (!data) { code = candidate; break; }
    }
    if (!code) return NextResponse.json({ success: false, error: "Could not generate unique code" }, { status: 500 });

    // Create league
    const { data: league, error: leagueErr } = await supabase
      .from("leagues")
      .insert({ name: name.trim(), code, created_by: userId })
      .select()
      .single();

    if (leagueErr) return NextResponse.json({ success: false, error: leagueErr.message }, { status: 500 });

    // Auto-add creator as member
    await supabase.from("league_members").insert({ league_id: league.id, user_id: userId });

    return NextResponse.json({ success: true, league });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
