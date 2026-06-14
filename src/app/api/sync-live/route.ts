import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// ESPN team name → our DB team name overrides (add more if names diverge)
const ESPN_NAME_MAP: Record<string, string> = {
  "United States": "USA",
  "South Korea": "Korea Republic",
  "Ivory Coast": "Côte d'Ivoire",
  "IR Iran": "Iran",
};

function normalize(name: string): string {
  return (ESPN_NAME_MAP[name] ?? name).toLowerCase().trim();
}

function mapStatus(espnStatusName: string, espnState: string): string {
  // Primary: use state ("pre" / "in" / "post") — more reliable across ESPN API versions
  if (espnState === "in") return "IN_PLAY";
  if (espnState === "post") return "FINISHED";
  if (espnState === "pre") return "TIMED";

  // Fallback: full status name
  const MAP: Record<string, string> = {
    STATUS_SCHEDULED: "TIMED",
    STATUS_IN_PROGRESS: "IN_PLAY",
    STATUS_HALFTIME: "IN_PLAY",
    STATUS_FINAL: "FINISHED",
    STATUS_FULL_TIME: "FINISHED",
    STATUS_END_PERIOD: "IN_PLAY",
    STATUS_POSTPONED: "POSTPONED",
    STATUS_SUSPENDED: "SUSPENDED",
    STATUS_CANCELLED: "CANCELLED",
  };
  return MAP[espnStatusName] ?? "TIMED";
}

export async function GET(req: NextRequest) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - 210 * 60 * 1000); // 210 min ago (90 + 30 ET + 30 pens + buffer)
  const windowEnd = new Date(now.getTime() + 10 * 60 * 1000);    // 10 min ahead

  // Fetch matches in the active window PLUS any that are still stuck as IN_PLAY/LIVE
  // (catches matches the cron missed while they ran long)
  const { data: windowMatches, error: dbError } = await supabaseServer
    .from("matches")
    .select("*")
    .gte("kickoff_time", windowStart.toISOString())
    .lte("kickoff_time", windowEnd.toISOString())
    .neq("status", "FINISHED");

  const { data: stuckMatches } = await supabaseServer
    .from("matches")
    .select("*")
    .in("status", ["IN_PLAY", "LIVE"]);

  // Merge, deduplicating by id
  const seen = new Set<string>();
  const liveMatches: typeof windowMatches = [];
  for (const m of [...(windowMatches ?? []), ...(stuckMatches ?? [])]) {
    if (!seen.has(m.id)) { seen.add(m.id); liveMatches.push(m); }
  }

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  if (!liveMatches?.length) {
    return NextResponse.json({ success: true, message: "No live matches", updated: 0 });
  }

  // Get unique ESPN dates — ESPN uses Eastern Time for WC 2026 dates.
  // A match at 2026-06-12T02:00Z = 2026-06-11T22:00 ET, so ESPN lists it under June 11.
  // Also include the day before UTC to catch late-night matches.
  const toESPNDate = (kickoff: string) => {
    const d = new Date(kickoff);
    // Shift to ET (UTC-4 during EDT) for date bucketing
    const etOffset = 4 * 60 * 60 * 1000;
    const etDate = new Date(d.getTime() - etOffset);
    return etDate.toISOString().slice(0, 10).replace(/-/g, "");
  };
  const dates = [...new Set(liveMatches.map((m) => toESPNDate(m.kickoff_time)))];

  let updated = 0;

  for (const dateStr of dates) {
    const espnRes = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`,
      { cache: "no-store" }
    );

    if (!espnRes.ok) continue;
    const espnData = await espnRes.json();

    for (const event of espnData.events ?? []) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      const homeComp = comp.competitors?.find((c: any) => c.homeAway === "home");
      const awayComp = comp.competitors?.find((c: any) => c.homeAway === "away");
      const espnHome = homeComp?.team?.displayName ?? "";
      const espnAway = awayComp?.team?.displayName ?? "";
      const espnStatus = event.status?.type?.name ?? "";
      const espnState = event.status?.type?.state ?? "";

      // Match to our DB by team names (order-independent)
      const dbMatch = liveMatches.find((m) => {
        const t1 = normalize(m.team1);
        const t2 = normalize(m.team2);
        const eh = normalize(espnHome);
        const ea = normalize(espnAway);
        return (t1 === eh && t2 === ea) || (t1 === ea && t2 === eh);
      });

      if (!dbMatch) continue;

      // Determine if ESPN home == our DB team1
      const dbHomeIsESPNHome = normalize(dbMatch.team1) === normalize(espnHome);
      const homeTeamId = homeComp?.team?.id;

      const goals: any[] = [];
      const bookings: any[] = [];
      const substitutions: any[] = [];

      for (const detail of comp.details ?? []) {
        const minute = detail.clock?.displayValue ?? "";
        const players: any[] = detail.athletesInvolved ?? [];
        const isESPNHome = detail.team?.id === homeTeamId;
        const team = dbHomeIsESPNHome
          ? (isESPNHome ? "home" : "away")
          : (isESPNHome ? "away" : "home");

        const typeId = String(detail.type?.id ?? "");
        const typeText: string = detail.type?.text ?? "";

        // Goal type IDs: 70=Goal, 137=Header Goal, 98=Penalty Goal, 99=Own Goal, and others
        const isGoal = typeId === "70" || typeId === "137" || typeId === "98" || typeId === "99"
          || typeText.toLowerCase().includes("goal");

        if (isGoal) {
          goals.push({
            minute,
            team,
            scorer: players[0]?.displayName ?? "Unknown",
            assist: players[1]?.displayName ?? null,
            ownGoal: detail.ownGoal || typeId === "99",
            penalty: detail.penaltyKick || typeId === "98",
          });
        } else if (detail.yellowCard || typeText === "Yellow Card") {
          bookings.push({
            minute,
            team,
            player: players[0]?.displayName ?? "Unknown",
            type: "Yellow",
          });
        } else if (detail.redCard || typeText === "Red Card") {
          bookings.push({
            minute,
            team,
            player: players[0]?.displayName ?? "Unknown",
            type: "Red",
          });
        } else if (typeId === "58" || typeText.toLowerCase().includes("sub")) {
          substitutions.push({
            minute,
            team,
            playerOut: players[0]?.displayName ?? "Unknown",
            playerIn: players[1]?.displayName ?? "Unknown",
          });
        }
      }

      const homeScore = homeComp?.score != null ? Number(homeComp.score) : null;
      const awayScore = awayComp?.score != null ? Number(awayComp.score) : null;

      await supabaseServer
        .from("matches")
        .update({
          status: mapStatus(espnStatus, espnState),
          team1_score: dbHomeIsESPNHome ? homeScore : awayScore,
          team2_score: dbHomeIsESPNHome ? awayScore : homeScore,
          goals,
          bookings,
          substitutions,
        })
        .eq("id", dbMatch.id);

      updated++;
    }
  }

  return NextResponse.json({ success: true, updated, liveMatchCount: liveMatches.length });
}
