export type BoosterKey = "2x" | "3x" | "draw";

export const BOOSTER_META: Record<string, { icon: string; label: string; multiplier: string }> = {
  "2x":   { icon: "⚽", label: "Tiki Taka",      multiplier: "2×" },
  "3x":   { icon: "🔥", label: "Hat Trick Hero",  multiplier: "3×" },
  "draw": { icon: "🐐", label: "G.O.A.T",         multiplier: "2× jackpot" },
  // alias — DB may store either key
  "goat": { icon: "🐐", label: "G.O.A.T",         multiplier: "2× jackpot" },
};

export const BOOSTER_ICON = (key: string) => BOOSTER_META[key]?.icon ?? "🎯";
export const BOOSTER_LABEL = (key: string) => BOOSTER_META[key]?.label ?? key;
