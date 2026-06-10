"use client";

import { useEffect, useState } from "react";
import type { Match } from "@/types";

type Props = { matches: Match[] };

const OPEN_BEFORE = 24 * 60 * 60 * 1000; // 24 h
const CLOSE_BEFORE = 60 * 1000;           // 1 min

function fmt(ms: number): string {
  if (ms <= 0) return "0m";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function GroupCountdown({ matches }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Only consider matches with a valid kickoff
  const timed = matches
    .filter((m) => m.kickoff_time && !isNaN(new Date(m.kickoff_time).getTime()))
    .map((m) => new Date(m.kickoff_time!).getTime())
    .sort((a, b) => a - b);

  if (!timed.length) return null;

  const firstKickoff = timed[0];
  const openAt  = firstKickoff - OPEN_BEFORE;
  const closeAt = firstKickoff - CLOSE_BEFORE;

  // All matches already closed
  if (now >= closeAt) return null;

  if (now < openAt) {
    // Predictions not yet open
    const remaining = openAt - now;
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-[11px] font-black text-zinc-400 tabular-nums">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
        Opens in {fmt(remaining)}
      </span>
    );
  }

  // Predictions open — show closing countdown
  const remaining = closeAt - now;
  const urgent = remaining < 60 * 60 * 1000; // less than 1h
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black tabular-nums ${
      urgent
        ? "bg-red-500/10 border-red-500/30 text-red-400"
        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${urgent ? "bg-red-400" : "bg-emerald-400"}`} />
      {urgent ? "Closes in " : "Predict · "}{fmt(remaining)}
    </span>
  );
}
