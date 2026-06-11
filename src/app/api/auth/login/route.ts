import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";
import { hashPhone } from "@/lib/hashPhone";

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json();

  if (!phone || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const phoneHash = hashPhone(phone);

  // Try hashed phone first, fall back to plain text (legacy migration)
  let { data: user } = await supabaseServer
    .from("users")
    .select("*")
    .eq("phone", phoneHash)
    .single();

  let isLegacyPhone = false;
  if (!user) {
    const { data: legacyUser } = await supabaseServer
      .from("users")
      .select("*")
      .eq("phone", phone.trim())
      .single();
    if (legacyUser) {
      user = legacyUser;
      isLegacyPhone = true;
    }
  }

  if (!user) {
    return NextResponse.json({ error: "No account found. Please sign up." }, { status: 404 });
  }

  const isPasswordHashed = user.password.startsWith("$2");
  let valid = false;

  if (isPasswordHashed) {
    valid = await bcrypt.compare(password, user.password);
  } else {
    valid = user.password === password;
  }

  if (!valid) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Silently upgrade legacy plain-text phone and/or password to hashed versions
  const updates: Record<string, string> = {};
  if (isLegacyPhone) updates.phone = phoneHash;
  if (!isPasswordHashed) updates.password = await bcrypt.hash(password, 10);
  if (Object.keys(updates).length > 0) {
    await supabaseServer.from("users").update(updates).eq("id", user.id);
  }

  return NextResponse.json({ user });
}
