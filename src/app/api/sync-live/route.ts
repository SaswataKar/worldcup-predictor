import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Fallback name map — only used when espn_event_id not yet stored
const ESPN_NAME_MAP: Record<string, string> = {
  "United States": "USA",
  "South Korea": "Korea Republic",
  "Ivory Coast": "Côte d'Ivoire",
  "IR Iran": "Iran",
  "Türkiye": "Turkey",
  "Cape Verde": "Cape Verde Islands",
};
function normalize(name: string): string {
  return (ESPN_NAME_MAP[name] ?? name).toLowerCase().trim();
}

function mapStatus(espnStatusName: string, espnState: string): string {
  if (espnState === "in") return "IN_PLAY";
  if (espnState === "post") return "FINISHED";
  if (espnState === "pre") return "TIMED";
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

function extractMatchData(comp: any, homeTeamId: string, dbHomeIsESPNHome: boolean) {
  const homeComp = comp.competitors?.find((c: any) => c.homeAway === "home");
  const awayComp = comp.competitors?.find((c: any) => c.homeAway === "away");
  const goals: any[] = [], bookings: any[] = [], substitutions: any[] = [];

  for (const detail of comp.details ?? []) {
    const minute = detail.clock?.displayValue ?? "";
    const players: any[] = detail.athletesInvolved ?? [];
    const isESPNHome = detail.team?.id === homeTeamId;
    const team = dbHomeIsESPNHome
      ? (isESPNHome ? "home" : "away")
      : (isESPNHome ? "away" : "home");
    const typeId = String(detail.type?.id ?? "");
    const typeText: string = detail.type?.text ?? "";
    const isGoal = typeId === "70" || typeId === "137" || typeId === "98" || typeId === "99"
      || typeText.toLowerCase().includes("goal");

    if (isGoal) {
      goals.push({ minute, team, scorer: players[0]?.displayName ?? "Unknown",
        assist: players[1]?.displayName ?? null,
        ownGoal: detail.ownGoal || typeId === "99", penalty: detail.penaltyKick || typeId === "98" });
    } else if (detail.yellowCard || typeText === "Yellow Card") {
      bookings.push({ minute, team, player: players[0]?.displayName ?? "Unknown", type: "Yellow" });
    } else if (detail.redCard || typeText === "Red Card") {
      bookings.push({ minute, team, player: players[0]?.displayName ?? "Unknown", type: "Red" });
    } else if (typeId === "58" || typeText.toLowerCase().includes("sub")) {
      substitutions.push({ minute, team,
        playerOut: players[0]?.displayName ?? "Unknown", playerIn: players[1]?.displayName ?? "Unknown" });
    }
  }

  return {
    homeScore: homeComp?.score != null ? Number(homeComp.score) : null,
    awayScore: awayComp?.score != null ? Number(awayComp.score) : null,
    goals, bookings, substitutions,
  };
}

export async function GET(req: NextRequest) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - 210 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 10 * 60 * 1000);

  const { data: windowMatches, error: dbError } = await supabaseServer
    .from("matches").select("*")
    .gte("kickoff_time", windowStart.toISOString())
    .lte("kickoff_time", windowEnd.toISOString())
    .neq("status", "FINISHED");

  const { data: stuckMatches } = await supabaseServer
    .from("matches").select("*")
    .in("status", ["IN_PLAY", "LIVE"]);

  const seen = new Set<string>();
  const liveMatches: typeof windowMatches = [];
  for (const m of [...(windowMatches ?? []), ...(stuckMatches ?? [])]) {
    if (!seen.has(m.id)) { seen.add(m.id); liveMatches.push(m); }
  }

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  if (!liveMatches?.length) return NextResponse.json({ success: true, message: "No live matches", updated: 0 });

  // Split into: already have ESPN ID vs need name-matching
  const withId = liveMatches.filter(m => m.espn_event_id);
  const withoutId = liveMatches.filter(m => !m.espn_event_id);

  let updated = 0;

  // ── Path 1: direct ESPN event ID lookup (no name matching needed) ──
  for (const dbMatch of withId) {
    const espnRes = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${dbMatch.espn_event_id}`,
      { cache: "no-store" }
    );
    if (!espnRes.ok) continue;
    const espnData = await espnRes.json();

    const comp = espnData.header?.competitions?.[0];
    if (!comp) continue;

    const espnStatus = comp.status?.type?.name ?? "";
    const espnState = comp.status?.type?.state ?? "";
    const homeComp = comp.competitors?.find((c: any) => c.homeAway === "home");
    const awayComp = comp.competitors?.find((c: any) => c.homeAway === "away");
    const homeTeamId = homeComp?.team?.id;

    // Determine home/away orientation using stored ESPN ID match
    const espnHomeName = homeComp?.team?.displayName ?? "";
    const dbHomeIsESPNHome = normalize(dbMatch.team1) === normalize(espnHomeName)
      || homeComp?.team?.id === espnData.rosters?.find((r: any) => r.homeAway === "home")?.team?.id;

    // Fetch scoreboard using ET date (ESPN organises events by ET, not UTC).
    // Iran at 01:00 UTC Jun 16 = ET Jun 15 — using raw UTC date misses it entirely.
    const etDate = (() => {
      const d = new Date(dbMatch.kickoff_time);
      const et = new Date(d.getTime() - 4 * 60 * 60 * 1000);
      return et.toISOString().slice(0, 10).replace(/-/g, "");
    })();
    const scoreboard = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${etDate}`,
      { cache: "no-store" }
    ).then(r => r.json()).catch(() => null);

    const sbEvent = scoreboard?.events?.find((e: any) => e.id === dbMatch.espn_event_id);
    const sbComp = sbEvent?.competitions?.[0];

    if (sbComp) {
      const { homeScore, awayScore, goals, bookings, substitutions } =
        extractMatchData(sbComp, homeTeamId, dbHomeIsESPNHome);

      await supabaseServer.from("matches").update({
        status: mapStatus(espnStatus, espnState),
        team1_score: dbHomeIsESPNHome ? homeScore : awayScore,
        team2_score: dbHomeIsESPNHome ? awayScore : homeScore,
        goals, bookings, substitutions,
      }).eq("id", dbMatch.id);
      updated++;
    } else {
      // Scoreboard lookup failed (e.g. cross-midnight UTC/ET edge case) but we still
      // have status + score from the summary header — update those at minimum so the
      // match doesn't stay stuck as IN_PLAY.
      const homeScore = homeComp?.score != null ? Number(homeComp.score) : null;
      const awayScore = awayComp?.score != null ? Number(awayComp.score) : null;
      await supabaseServer.from("matches").update({
        status: mapStatus(espnStatus, espnState),
        team1_score: dbHomeIsESPNHome ? homeScore : awayScore,
        team2_score: dbHomeIsESPNHome ? awayScore : homeScore,
      }).eq("id", dbMatch.id);
      updated++;
    }
  }

  // ── Path 2: name-match once, store ESPN ID for future runs ──
  if (withoutId.length > 0) {
    const toESPNDate = (kickoff: string) => {
      const d = new Date(kickoff);
      const etDate = new Date(d.getTime() - 4 * 60 * 60 * 1000);
      return etDate.toISOString().slice(0, 10).replace(/-/g, "");
    };
    const dates = [...new Set(withoutId.map(m => toESPNDate(m.kickoff_time)))];

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

        const dbMatch = withoutId.find(m => {
          const t1 = normalize(m.team1), t2 = normalize(m.team2);
          const eh = normalize(espnHome), ea = normalize(espnAway);
          return (t1 === eh && t2 === ea) || (t1 === ea && t2 === eh);
        });
        if (!dbMatch) continue;

        const dbHomeIsESPNHome = normalize(dbMatch.team1) === normalize(espnHome);
        const homeTeamId = homeComp?.team?.id;
        const { homeScore, awayScore, goals, bookings, substitutions } =
          extractMatchData(comp, homeTeamId, dbHomeIsESPNHome);

        await supabaseServer.from("matches").update({
          status: mapStatus(espnStatus, espnState),
          espn_event_id: event.id, // store for future direct lookups
          team1_score: dbHomeIsESPNHome ? homeScore : awayScore,
          team2_score: dbHomeIsESPNHome ? awayScore : homeScore,
          goals, bookings, substitutions,
        }).eq("id", dbMatch.id);

        updated++;
      }
    }
  }

  return NextResponse.json({ success: true, updated, liveMatchCount: liveMatches.length });
}
