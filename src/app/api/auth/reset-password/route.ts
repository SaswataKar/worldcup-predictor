import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json();

  if (!phone || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const { data: user } = await supabaseServer
    .from("users")
    .select("id")
    .eq("phone", phone.trim())
    .single();

  if (!user) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabaseServer
    .from("users")
    .update({ password: hashedPassword })
    .eq("phone", phone.trim());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
