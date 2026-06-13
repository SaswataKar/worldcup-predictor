import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const ESPN_NAME_MAP: Record<string, string> = {
  "United States": "USA",
  "South Korea": "Korea Republic",
  "Ivory Coast": "Côte d'Ivoire",
  "IR Iran": "Iran",
};
function normalize(n: string) { return (ESPN_NAME_MAP[n] ?? n).toLowerCase().trim(); }
function toESPNDate(kickoff: string) {
  const d = new Date(kickoff);
  const et = new Date(d.getTime() - 4 * 60 * 60 * 1000);
  return et.toISOString().slice(0, 10).replace(/-/g, "");
}

function extractRoster(raw: any) {
  const formation: string = raw?.formation ?? "4-3-3";
  const players = (raw?.roster ?? [])
    .filter((p: any) => p.starter !== false) // include starters + undefined
    .map((p: any) => ({
      name: p.athlete?.shortName ?? p.athlete?.displayName ?? "?",
      fullName: p.athlete?.displayName ?? "?",
      position: p.position?.abbreviation ?? "?",
      formationPlace: p.formationPlace ?? null,
      number: p.jersey ?? "",
    }))
    .sort((a: any, b: any) => (a.formationPlace ?? 99) - (b.formationPlace ?? 99))
    .slice(0, 11);
  return { formation, players };
}

function extractStats(statsArr: any[], homeAway: string) {
  const entry = statsArr.find((s: any) => s.homeAway === homeAway);
  const get = (name: string) =>
    entry?.statistics?.find((s: any) => s.name === name)?.displayValue ?? "-";
  return {
    possession: get("possessionPct"),
    shots: get("totalShots") || get("shots"),
    shotsOnTarget: get("shotsOnGoal") || get("shotsOnTarget"),
    corners: get("cornerKicks"),
    fouls: get("fouls"),
    offsides: get("offsides"),
    yellowCards: get("yellowCards"),
    redCards: get("redCards"),
  };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: match, error } = await supabaseServer
    .from("matches").select("*").eq("id", id).single();
  if (error || !match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (!match.kickoff_time) return NextResponse.json({ error: "No kickoff time" }, { status: 400 });

  const dateStr = toESPNDate(match.kickoff_time);
  const sbRes = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`,
    { cache: "no-store" }
  );
  if (!sbRes.ok) return NextResponse.json({ error: "ESPN scoreboard unavailable" }, { status: 502 });
  const sbData = await sbRes.json();

  // Find matching ESPN event
  let espnEventId: string | null = null;
  let espnHomeAway: "home" | "away" = "home"; // ESPN's home = our team1?
  for (const event of sbData.events ?? []) {
    const comp = event.competitions?.[0];
    const espnHome = comp?.competitors?.find((c: any) => c.homeAway === "home")?.team?.displayName ?? "";
    const espnAway = comp?.competitors?.find((c: any) => c.homeAway === "away")?.team?.displayName ?? "";
    const t1 = normalize(match.team1), t2 = normalize(match.team2);
    const eh = normalize(espnHome), ea = normalize(espnAway);
    if ((t1 === eh && t2 === ea) || (t1 === ea && t2 === eh)) {
      espnEventId = event.id;
      espnHomeAway = (t1 === eh) ? "home" : "away";
      break;
    }
  }
  if (!espnEventId) return NextResponse.json({ error: "ESPN event not found" }, { status: 404 });

  const sumRes = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${espnEventId}`,
    { cache: "no-store" }
  );
  if (!sumRes.ok) return NextResponse.json({ error: "ESPN summary unavailable" }, { status: 502 });
  const sumData = await sumRes.json();

  const rosters = sumData.rosters ?? [];
  // Map ESPN home/away to our team1/team2
  const team1IsESPNHome = espnHomeAway === "home";
  const homeRaw = rosters.find((r: any) => r.homeAway === "home");
  const awayRaw = rosters.find((r: any) => r.homeAway === "away");
  const team1Roster = extractRoster(team1IsESPNHome ? homeRaw : awayRaw);
  const team2Roster = extractRoster(team1IsESPNHome ? awayRaw : homeRaw);

  const statsArr = sumData.statistics ?? [];
  const team1Stats = extractStats(statsArr, team1IsESPNHome ? "home" : "away");
  const team2Stats = extractStats(statsArr, team1IsESPNHome ? "away" : "home");

  // Live clock
  const comp = sumData.header?.competitions?.[0];
  const clock = comp?.status?.displayClock ?? "";
  const state = comp?.status?.type?.state ?? "";
  const period = comp?.status?.period ?? 1;

  return NextResponse.json({
    espnEventId,
    team1: team1Roster,
    team2: team2Roster,
    team1Stats,
    team2Stats,
    clock,
    state,
    period,
  });
}
