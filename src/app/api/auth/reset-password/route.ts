import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";
import { hashPhone } from "@/lib/hashPhone";

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json();

  if (!phone || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const phoneHash = hashPhone(phone);

  // Support both hashed and legacy plain phone during migration
  let { data: user } = await supabaseServer.from("users").select("id").eq("phone", phoneHash).single();
  if (!user) {
    const { data: legacy } = await supabaseServer.from("users").select("id").eq("phone", phone.trim()).single();
    user = legacy;
  }

  if (!user) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabaseServer
    .from("users")
    .update({ password: hashedPassword, phone: phoneHash })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
