import { NextResponse } from "next/server";

type PlayerEntry = {
  name: string;
  shortName: string;
  headshot: string;
  jersey: string;
  team: string;
  teamLogo: string;
  goals: number;
  assists: number;
  appearances: number;
};

type StatCategory = {
  category: string;
  players: PlayerEntry[];
};

function parseEntry(e: any): PlayerEntry {
  const getStat = (name: string) =>
    e.athlete?.statistics?.find((s: any) => s.name === name)?.value ?? 0;

  return {
    name: e.athlete?.displayName ?? "Unknown",
    shortName: e.athlete?.shortName ?? "Unknown",
    headshot: e.athlete?.headshot?.href ?? "",
    jersey: e.athlete?.jersey ?? "",
    team: e.athlete?.team?.displayName ?? "",
    teamLogo: e.athlete?.team?.logos?.[0]?.href ?? "",
    goals: getStat("totalGoals"),
    assists: getStat("goalAssists"),
    appearances: getStat("appearances"),
  };
}

export async function GET() {
  const res = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/statistics",
    { next: { revalidate: 120 } }
  );
  if (!res.ok) return NextResponse.json({ error: "ESPN unavailable" }, { status: 502 });
  const data = await res.json();

  const categories: StatCategory[] = (data.stats ?? []).map((s: any) => ({
    category: s.displayName ?? s.name ?? "Unknown",
    players: (s.leaders ?? []).slice(0, 20).map(parseEntry),
  }));

  return NextResponse.json({ categories });
}
