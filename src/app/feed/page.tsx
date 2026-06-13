"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";

import Header from "@/components/Header";
import PageWrapper from "@/components/PageWrapper";
import PitchView from "@/components/PitchView";
import { userTZ } from "@/lib/utils";
import type { Match, ESPNGoal, ESPNBooking, ESPNSubstitution } from "@/types";

const REFRESH_INTERVAL = 30; // seconds

type UnifiedEvent =
  | { kind: "goal"; minute: string; team: "home" | "away"; scorer: string; assist: string | null; ownGoal: boolean; penalty: boolean }
  | { kind: "booking"; minute: string; team: "home" | "away"; player: string; cardType: "Yellow" | "Red" }
  | { kind: "sub"; minute: string; team: "home" | "away"; playerOut: string; playerIn: string };

function parseMinute(m: string) {
  const n = parseInt(m);
  return isNaN(n) ? 0 : n;
}

function buildEvents(match: Match): UnifiedEvent[] {
  const goals = (match.goals ?? []) as ESPNGoal[];
  const bookings = (match.bookings ?? []) as ESPNBooking[];
  const subs = (match.substitutions ?? []) as ESPNSubstitution[];
  const all: UnifiedEvent[] = [
    ...goals.map((g) => ({ kind: "goal" as const, ...g })),
    ...bookings.map((b) => ({ kind: "booking" as const, minute: b.minute, team: b.team, player: b.player, cardType: b.type })),
    ...subs.map((s) => ({ kind: "sub" as const, ...s })),
  ];
  return all.sort((a, b) => parseMinute(b.minute) - parseMinute(a.minute)); // newest first
}

function EventIcon({ ev }: { ev: UnifiedEvent }) {
  if (ev.kind === "goal") {
    if (ev.ownGoal) return <span className="text-xl">⚽🔴</span>;
    if (ev.penalty) return <span className="text-xl">⚽🎯</span>;
    return <span className="text-xl">⚽</span>;
  }
  if (ev.kind === "booking") {
    return <span className="text-xl">{ev.cardType === "Red" ? "🟥" : "🟨"}</span>;
  }
  return <span className="text-xl">🔄</span>;
}

function EventRow({ ev, homeTeam, awayTeam }: { ev: UnifiedEvent; homeTeam: string; awayTeam: string }) {
  const isHome = ev.team === "home";
  const teamName = isHome ? homeTeam : awayTeam;

  let main = "";
  let sub = "";
  if (ev.kind === "goal") {
    main = ev.scorer;
    sub = ev.assist ? `Assist: ${ev.assist}` : ev.ownGoal ? "Own Goal" : ev.penalty ? "Penalty" : "";
  } else if (ev.kind === "booking") {
    main = ev.player;
    sub = `${ev.cardType} Card`;
  } else {
    main = `${ev.playerIn} ↑`;
    sub = `${ev.playerOut} ↓`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0 ${isHome ? "" : "flex-row-reverse"}`}
    >
      <EventIcon ev={ev} />
      <div className={`flex-1 min-w-0 ${isHome ? "" : "text-right"}`}>
        <div className="font-black text-sm truncate">{main}</div>
        {sub && <div className="text-xs text-zinc-500 truncate">{sub}</div>}
        <div className="text-[10px] text-zinc-600 font-bold">{teamName}</div>
      </div>
      <div className="shrink-0 text-xs font-black tabular-nums text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg">
        {ev.minute}&apos;
      </div>
    </motion.div>
  );
}

function LiveMatchCard({ match, defaultCollapsed = false }: { match: Match; defaultCollapsed?: boolean }) {
  const [pitchOpen, setPitchOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const events = buildEvents(match);
  const isLive = match.status === "IN_PLAY" || match.status === "LIVE";
  const isFinished = match.status === "FINISHED";

  return (
    <div className={`rounded-3xl border backdrop-blur-md overflow-hidden
      ${isLive
        ? "border-red-500/30 shadow-[0_0_40px_8px_rgba(239,68,68,0.12),0_0_0_1px_rgba(239,68,68,0.20)]"
        : "border-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)]"
      }`}
    >
      {/* COLLAPSED ROW — always visible */}
      <button
        onClick={() => { setCollapsed(c => !c); if (pitchOpen) setPitchOpen(false); }}
        className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <img src={match.team1_crest || "/placeholder-team.png"} className="w-7 h-7 object-contain shrink-0" />
          <span className="font-black text-sm truncate">{match.team1}</span>
          <span className="font-black text-lg tabular-nums shrink-0 px-2">
            {match.team1_score ?? 0} <span className="text-zinc-600">–</span> {match.team2_score ?? 0}
          </span>
          <span className="font-black text-sm truncate">{match.team2}</span>
          <img src={match.team2_crest || "/placeholder-team.png"} className="w-7 h-7 object-contain shrink-0" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 text-[10px] font-black animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />LIVE
            </span>
          )}
          {isFinished && <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">FT</span>}
          <span className="text-zinc-600 text-sm">{collapsed ? "▸" : "▾"}</span>
        </div>
      </button>

      {/* EXPANDED CONTENT */}
      {!collapsed && !pitchOpen && (
        <>
          {/* EVENT TIMELINE */}
          {events.length > 0 ? (
            <div className="border-t border-white/[0.06] px-5 sm:px-8 py-2 max-h-72 overflow-y-auto">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-black py-2">Match Events</div>
              {events.map((ev, i) => (
                <EventRow key={i} ev={ev} homeTeam={match.team1} awayTeam={match.team2} />
              ))}
            </div>
          ) : (
            <div className="border-t border-white/[0.06] px-5 sm:px-8 py-6 text-center text-zinc-600 text-sm font-bold">
              {isLive ? "Waiting for first event…" : "No events recorded"}
            </div>
          )}
        </>
      )}

      {/* PITCH VIEW — replaces content */}
      {!collapsed && pitchOpen && (
        <div className="border-t border-white/[0.06] px-4 sm:px-6 pb-6 pt-4">
          <PitchView match={match} />
        </div>
      )}

      {/* BOTTOM BAR — pitch toggle, only when expanded */}
      {!collapsed && (
        <div className="border-t border-white/[0.06] px-5 sm:px-6 py-3 flex">
          <button
            onClick={() => setPitchOpen(o => !o)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              pitchOpen
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
            }`}
          >
            <span>🏟️</span>
            {pitchOpen ? "← Back to Events" : "View on Pitch"}
          </button>
        </div>
      )}
    </div>
  );
}

function UpcomingCard({ match }: { match: Match }) {
  const tz = userTZ();
  const kickoff = match.kickoff_time ? new Date(match.kickoff_time) : null;
  const timeStr = kickoff
    ? kickoff.toLocaleString("en", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true, weekday: "short", day: "numeric", month: "short" })
    : "TBD";

  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!kickoff) return;
    const tick = () => {
      const diff = kickoff.getTime() - Date.now();
      if (diff <= 0) { setCountdown("Starting soon"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [match.kickoff_time]);

  return (
    <div className="rounded-2xl border border-white/[0.07] px-5 py-4 flex items-center justify-between gap-4 flex-wrap backdrop-blur-md
      shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-center gap-3 min-w-0">
        <img src={match.team1_crest || "/placeholder-team.png"} className="w-8 h-8 object-contain" />
        <span className="font-black text-sm truncate">{match.team1}</span>
        <span className="text-zinc-600 font-black text-xs">vs</span>
        <span className="font-black text-sm truncate">{match.team2}</span>
        <img src={match.team2_crest || "/placeholder-team.png"} className="w-8 h-8 object-contain" />
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs text-zinc-400 font-bold">{timeStr}</div>
        <div className="text-yellow-400 font-black text-sm tabular-nums">{countdown}</div>
      </div>
    </div>
  );
}

function FinishedSection({ matches }: { matches: Match[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mb-12">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 mb-5 group"
      >
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">
          Finished Matches
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-zinc-700 bg-zinc-800 px-2 py-0.5 rounded-full">{matches.length}</span>
          <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors text-sm">{open ? "▾" : "▸"}</span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div className="space-y-4">
              {matches.map((m) => (
                <LiveMatchCard key={m.id} match={m} defaultCollapsed={true} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [secondsToRefresh, setSecondsToRefresh] = useState(REFRESH_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      const data = await res.json();
      setMatches(data.matches ?? []);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setSecondsToRefresh(REFRESH_INTERVAL);
    }
  }, []);

  useEffect(() => {
    const storedUser = Cookies.get("user");
    if (!storedUser) { router.push("/login"); return; }
    setUser(JSON.parse(storedUser));
    fetchMatches();
  }, []);

  // Auto-refresh countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsToRefresh((s) => {
        if (s <= 1) { fetchMatches(); return REFRESH_INTERVAL; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [fetchMatches]);

  const now = Date.now();
  const liveMatches = matches.filter((m) => m.status === "IN_PLAY" || m.status === "LIVE");
  const recentlyFinished = matches
    .filter((m) => m.status === "FINISHED" && m.kickoff_time)
    .sort((a, b) => new Date(b.kickoff_time!).getTime() - new Date(a.kickoff_time!).getTime());
  const upcoming = matches
    .filter((m) => {
      if (m.status === "FINISHED" || m.status === "IN_PLAY" || m.status === "LIVE") return false;
      if (!m.kickoff_time) return false;
      const diff = new Date(m.kickoff_time).getTime() - now;
      return diff > 0 && diff < 24 * 60 * 60 * 1000; // next 24h
    })
    .slice(0, 5);

  const hasAnything = liveMatches.length > 0 || recentlyFinished.length > 0 || upcoming.length > 0;

  // Progress ring
  const progress = (REFRESH_INTERVAL - secondsToRefresh) / REFRESH_INTERVAL;
  const r = 10;
  const circ = 2 * Math.PI * r;

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />

          {/* HERO */}
          <div className="mb-10 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-zinc-500 uppercase tracking-[0.3em] text-sm font-black mb-2">FIFA WORLD CUP 2026</div>
              <h1 className="text-4xl sm:text-6xl font-black leading-none">Live Feed</h1>
            </div>

            {/* Refresh ring */}
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={fetchMatches}
              title="Refresh now"
            >
              <svg width="28" height="28" viewBox="0 0 28 28" className="rotate-[-90deg]">
                <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle
                  cx="14" cy="14" r={r} fill="none"
                  stroke={liveMatches.length > 0 ? "#f87171" : "#facc15"}
                  strokeWidth="3"
                  strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - progress)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.9s linear" }}
                />
              </svg>
              <span className="text-zinc-500 text-xs font-black group-hover:text-white transition-colors">
                {secondsToRefresh}s
              </span>
              {lastUpdated && (
                <span className="text-zinc-700 text-[10px] hidden sm:block">
                  Updated {lastUpdated.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </div>
          </div>

          {loading && (
            <div className="text-center py-32 text-3xl font-black animate-pulse">Loading feed…</div>
          )}

          {!loading && !hasAnything && (
            <div className="rounded-3xl border border-white/[0.07] backdrop-blur-md p-16 text-center
              shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="text-6xl mb-6">📺</div>
              <div className="text-3xl font-black mb-3">No matches right now</div>
              <div className="text-zinc-500">Check back when a match is about to kick off.</div>
            </div>
          )}

          {/* LIVE */}
          {liveMatches.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                </span>
                <h2 className="text-xl font-black text-red-400 uppercase tracking-widest">Live Now</h2>
              </div>
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {liveMatches.map((m) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <LiveMatchCard match={m} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* RECENTLY FINISHED */}
          {recentlyFinished.length > 0 && (
            <FinishedSection matches={recentlyFinished} />
          )}

          {/* UPCOMING */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-5">Up Next — Today</h2>
              <div className="space-y-3">
                {upcoming.map((m) => (
                  <UpcomingCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </PageWrapper>
  );
}
