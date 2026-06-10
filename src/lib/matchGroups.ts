import type { Match } from "@/types";

export const ROUND_LABELS: Record<string, string> = {
  GROUP_STAGE:    "Group Stage",
  LAST_32:        "Round of 32",
  LAST_16:        "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS:    "Semi-finals",
  THIRD_PLACE:    "Third Place Play-off",
  FINAL:          "Final",
};

// Canonical group key: round + ET date (America/New_York)
// All FIFA WC 2026 times are published in ET — using ET date ensures
// late-night matches (22:00–23:00 ET = next day UTC) land on the correct FIFA day.
export const getGroupKey = (match: Match): string => {
  const round = match.matchday ?? "TBD";
  const date = match.kickoff_time
    ? new Date(match.kickoff_time).toLocaleDateString("en-CA", {
        timeZone: "America/New_York",
      })
    : "TBD";
  return `${round}__${date}`;
};

// Extract just the UTC date from a group key
export const dateFromKey = (key: string): string => key.split("__")[1] ?? "TBD";

// Extract just the round from a group key
export const roundFromKey = (key: string): string => key.split("__")[0] ?? "TBD";

export type GroupedMatches = Record<string, Match[]>;

// Group matches and return them sorted by earliest kickoff within each group
export const groupMatches = (matches: Match[]): {
  grouped: GroupedMatches;
  sortedKeys: string[];
} => {
  const grouped: GroupedMatches = {};

  matches.forEach((m) => {
    const key = getGroupKey(m);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  // Sort groups by the earliest kickoff time in each group
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const earliest = (key: string) =>
      grouped[key].reduce((min, m) => {
        const t = m.kickoff_time ? new Date(m.kickoff_time).getTime() : Infinity;
        return Math.min(min, t);
      }, Infinity);
    return earliest(a) - earliest(b);
  });

  return { grouped, sortedKeys };
};

// Build human-readable labels e.g. "Group Stage · Day 1", "Round of 32 · Day 2", "Final"
export const buildGroupLabels = (sortedKeys: string[]): Record<string, string> => {
  // Collect keys per round in sorted order
  const roundKeys: Record<string, string[]> = {};
  sortedKeys.forEach((key) => {
    const round = roundFromKey(key);
    if (!roundKeys[round]) roundKeys[round] = [];
    roundKeys[round].push(key);
  });

  const labels: Record<string, string> = {};
  sortedKeys.forEach((key) => {
    const round = roundFromKey(key);
    const roundLabel = ROUND_LABELS[round] ?? round.replace(/_/g, " ");
    const keysInRound = roundKeys[round];
    if (keysInRound.length === 1) {
      labels[key] = roundLabel;
    } else {
      const dayNum = keysInRound.indexOf(key) + 1;
      labels[key] = `${roundLabel} · Day ${dayNum}`;
    }
  });

  return labels;
};
