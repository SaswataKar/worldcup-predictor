import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

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

  const isHashed = user.password.startsWith("$2");
  let valid = false;

  if (isHashed) {
    valid = await bcrypt.compare(password, user.password);
  } else {
    // Legacy plain text — compare then silently upgrade
    valid = user.password === password;
    if (valid) {
      const hashed = await bcrypt.hash(password, 10);
      await supabaseServer.from("users").update({ password: hashed }).eq("id", user.id);
    }
  }

  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
