import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";
import { hashPhone } from "@/lib/hashPhone";

export async function POST(req: NextRequest) {
  const { phone, password, name } = await req.json();

  if (!phone || !password || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const cleanName = name.trim().toUpperCase();

  if (!/^[A-Za-z]+( [A-Za-z]+)*$/.test(cleanName)) {
    return NextResponse.json({ error: "Name can only contain letters and single spaces between words" }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  const phoneHash = hashPhone(phone);

  // Check both hashed and legacy plain phone to prevent duplicates during migration
  const { data: existingHashed } = await supabaseServer.from("users").select("id").eq("phone", phoneHash).single();
  const { data: existingPlain } = await supabaseServer.from("users").select("id").eq("phone", phone.trim()).single();

  if (existingHashed || existingPlain) {
    return NextResponse.json({ error: "Account already exists" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data: newUsers, error } = await supabaseServer
    .from("users")
    .insert([{ name: cleanName, phone: phoneHash, password: hashedPassword }])
    .select();

  if (error || !newUsers?.[0]) {
    return NextResponse.json({ error: error?.message ?? "Failed to create account" }, { status: 500 });
  }

  const newUser = newUsers[0];

  await supabaseServer.from("leaderboard").insert([{
    user_id: newUser.id,
    username: newUser.name,
    total_points: 0,
    exact_predictions: 0,
    correct_results: 0,
  }]);

  return NextResponse.json({ success: true });
}
