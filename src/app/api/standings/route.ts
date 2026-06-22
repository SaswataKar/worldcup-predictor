import { NextResponse } from "next/server";

type ESPNStat = { name: string; value: number; displayValue: string };
type ESPNEntry = {
  team: { displayName: string; abbreviation: string; logos?: { href: string }[] };
  note?: { description?: string; color?: string; rank?: number };
  stats: ESPNStat[];
};

type GroupStanding = {
  group: string;
  teams: {
    name: string;
    abbr: string;
    logo: string;
    mp: number;
    w: number;
    d: number;
    l: number;
    gf: number;
    ga: number;
    gd: string;
    pts: number;
    qualified: boolean;
    note?: string;
  }[];
};

function getStat(entry: ESPNEntry, name: string): number {
  return entry.stats?.find((s) => s.name === name)?.value ?? 0;
}
function getDisplay(entry: ESPNEntry, name: string): string {
  return entry.stats?.find((s) => s.name === name)?.displayValue ?? "0";
}

export async function GET() {
  const res = await fetch(
    "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings",
    { next: { revalidate: 120 } }
  );
  if (!res.ok) return NextResponse.json({ error: "ESPN unavailable" }, { status: 502 });
  const data = await res.json();

  const groups: GroupStanding[] = (data.children ?? []).map((child: any) => ({
    group: child.name as string,
    teams: ((child.standings?.entries ?? []) as ESPNEntry[])
      .sort((a, b) => getStat(a, "rank") - getStat(b, "rank"))
      .map((entry) => ({
        name: entry.team.displayName,
        abbr: entry.team.abbreviation,
        logo: entry.team.logos?.[0]?.href ?? "",
        mp: getStat(entry, "gamesPlayed"),
        w: getStat(entry, "wins"),
        d: getStat(entry, "ties"),
        l: getStat(entry, "losses"),
        gf: getStat(entry, "pointsFor"),
        ga: getStat(entry, "pointsAgainst"),
        gd: getDisplay(entry, "pointDifferential"),
        pts: getStat(entry, "points"),
        qualified: getStat(entry, "advanced") === 1,
        note: entry.note?.description ?? undefined,
      })),
  }));

  return NextResponse.json({ groups });
}
