import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json();

  if (!phone || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: user, error } = await supabaseServer
    .from("users")
    .select("*")
    .eq("phone", phone.trim())
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "No account found. Please sign up." }, { status: 404 });
  }

  if (user.password !== password) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
