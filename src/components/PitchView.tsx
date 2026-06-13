"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Match, ESPNGoal, ESPNBooking, ESPNSubstitution } from "@/types";

// ── Sound engine ────────────────────────────────────────────────────────────
function useSounds() {
  const ambient = useRef<HTMLAudioElement | null>(null);
  const soundLockedUntil = useRef<number>(0); // nothing plays while locked

  const fadeTo = useCallback((el: HTMLAudioElement, target: number, ms: number, done?: () => void) => {
    const steps = Math.max(1, ms / 50);
    const delta = (target - el.volume) / steps;
    let count = 0;
    const id = setInterval(() => {
      count++;
      el.volume = Math.min(1, Math.max(0, el.volume + delta));
      if (count >= steps) { el.volume = target; clearInterval(id); done?.(); }
    }, 50);
    return id;
  }, []);

  const startAmbient = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!ambient.current) {
      ambient.current = new Audio("/sounds/crowd-ambient.mp3");
      ambient.current.loop = true;
      ambient.current.volume = 0;
    }
    ambient.current.play().catch(() => {});
    fadeTo(ambient.current, 0.18, 2000);
  }, [fadeTo]);

  const stopAmbient = useCallback(() => {
    if (!ambient.current) return;
    const el = ambient.current;
    fadeTo(el, 0, 800, () => { el.pause(); el.currentTime = 0; });
  }, [fadeTo]);

  const setAmbientVol = useCallback((vol: number, ms = 500) => {
    if (!ambient.current) return;
    fadeTo(ambient.current, vol, ms);
  }, [fadeTo]);

  // Play a one-shot event sound, clipped to `clipMs` duration, then lock for `lockMs`.
  const playOneShot = useCallback((src: string, vol = 1, lockMs = 0, clipMs = 0) => {
    if (typeof window === "undefined") return;
    if (Date.now() < soundLockedUntil.current) return;
    if (lockMs > 0) soundLockedUntil.current = Date.now() + lockMs;
    const a = new Audio(src);
    a.volume = vol;
    a.play().catch(() => {});
    if (clipMs > 0) setTimeout(() => { a.pause(); a.currentTime = 0; }, clipMs);
  }, []);

  const playWhistle = useCallback((vol = 0.7) => {
    if (typeof window === "undefined") return;
    const a = new Audio("/sounds/whistle.mp3");
    a.volume = vol;
    a.play().catch(() => {});
  }, []);

  return { startAmbient, stopAmbient, setAmbientVol, playOneShot, playWhistle, ambient, soundLockedUntil };
}

// ── Pitch constants (FIFA metres as SVG units) ─────────────────────────────
const W = 105, H = 68;
const PENALTY_DEPTH = 16.5, PENALTY_H = 40.32;
const GOAL_DEPTH = 5.5, GOAL_H = 18.32;
const GOAL_WIDTH = 7.32;
const CENTER_R = 9.15;
const PENALTY_SPOT = 11;

// ── Formation positioning ──────────────────────────────────────────────────
function getYPositions(count: number): number[] {
  const pad = 5;
  return Array.from({ length: count }, (_, i) => pad + (i + 1) * (H - 2 * pad) / (count + 1));
}

function getPlayerPos(formation: string, place: number, side: "home" | "away") {
  if (place === 1) return { x: side === "home" ? 5 : W - 5, y: H / 2 };
  const lines = formation.split("-").map(Number).filter(Boolean);
  if (!lines.length) return { x: W / 2, y: H / 2 };
  let rem = place - 2, lineIdx = 0, posInLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (rem < lines[i]) { lineIdx = i; posInLine = rem; break; }
    rem -= lines[i];
    if (i === lines.length - 1) { lineIdx = i; posInLine = Math.min(rem, lines[i] - 1); }
  }
  const xFrac = (lineIdx + 0.5) / lines.length;
  const homeX = 15 + xFrac * 70;
  const x = side === "home" ? homeX : W - homeX;
  const ys = getYPositions(lines[lineIdx] ?? 1);
  return { x, y: ys[posInLine] ?? H / 2 };
}

// ── Seeded random for consistent scatter ──────────────────────────────────
function sr(seed: number) { const x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); }

// ── Event types ────────────────────────────────────────────────────────────
type PitchEvent = {
  id: string;
  minute: number;
  kind: "kickoff" | "halftime" | "fulltime" | "goal" | "booking" | "sub";
  team?: "home" | "away";
  label: string;
  sub?: string;
  ownGoal?: boolean;
  penalty?: boolean;
  cardType?: "Yellow" | "Red";
  x: number; y: number;
};

function buildEvents(match: Match): PitchEvent[] {
  const evs: PitchEvent[] = [];
  evs.push({ id: "ko", minute: 0, kind: "kickoff", label: "Kick Off", x: W / 2, y: H / 2 });
  evs.push({ id: "ht", minute: 45, kind: "halftime", label: "Half Time", x: W / 2, y: H / 2 });
  if (match.status === "FINISHED")
    evs.push({ id: "ft", minute: 90, kind: "fulltime", label: "Full Time", x: W / 2, y: H / 2 });

  const goals = (match.goals ?? []) as ESPNGoal[];
  goals.forEach((g, i) => {
    const min = parseInt(g.minute) || 0;
    const isHome = g.team === "home";
    let x: number, y: number;
    if (g.penalty) { x = isHome ? W - PENALTY_SPOT : PENALTY_SPOT; y = H / 2; }
    // OG: ball ends up in the conceding team's goal — opposite side from benefiting team
    else if (g.ownGoal) { x = isHome ? W - PENALTY_SPOT + 5 : PENALTY_SPOT - 5; y = H / 2 + (sr(i * 3) - 0.5) * 6; }
    else { x = isHome ? W - 8 + sr(i * 7) * 3 : 8 - sr(i * 7) * 3; y = H / 2 + (sr(i * 5 + 1) - 0.5) * 10; }
    evs.push({
      id: `g${i}`, minute: min, kind: "goal", team: g.team,
      label: g.scorer, sub: g.assist ? `Assist: ${g.assist}` : g.ownGoal ? "Own Goal" : g.penalty ? "Penalty" : undefined,
      ownGoal: g.ownGoal, penalty: g.penalty, x, y,
    });
  });

  const bookings = (match.bookings ?? []) as ESPNBooking[];
  bookings.forEach((b, i) => {
    const isHome = b.team === "home";
    const x = isHome ? 20 + sr(i * 11) * 25 : W - 20 - sr(i * 11) * 25;
    const y = 8 + sr(i * 13 + 2) * (H - 16);
    evs.push({
      id: `b${i}`, minute: parseInt(b.minute) || 0, kind: "booking", team: b.team,
      label: b.player, cardType: b.type, x, y,
    });
  });

  const subs = (match.substitutions ?? []) as ESPNSubstitution[];
  subs.forEach((s, i) => {
    const isHome = s.team === "home";
    const x = 38 + sr(i * 17 + 5) * 29;
    evs.push({
      id: `s${i}`, minute: parseInt(s.minute) || 0, kind: "sub", team: s.team,
      label: `${s.playerIn} ↑`, sub: `${s.playerOut} ↓`, x, y: isHome ? 1.5 : H - 1.5,
    });
  });

  return evs.sort((a, b) => a.minute - b.minute);
}

// ── Pitch SVG ──────────────────────────────────────────────────────────────
function PitchSVG() {
  const stripes = 7;
  const sw = W / stripes;
  return (
    <g>
      {/* Grass stripes */}
      {Array.from({ length: stripes }, (_, i) => (
        <rect key={i} x={i * sw} y={0} width={sw} height={H}
          fill={i % 2 === 0 ? "#1d5c2e" : "#195228"} />
      ))}
      {/* Boundary */}
      <rect x={0} y={0} width={W} height={H} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={0.4} />
      {/* Center line */}
      <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(255,255,255,0.75)" strokeWidth={0.4} />
      {/* Center circle */}
      <circle cx={W / 2} cy={H / 2} r={CENTER_R} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={0.4} />
      <circle cx={W / 2} cy={H / 2} r={0.5} fill="rgba(255,255,255,0.9)" />
      {/* Left penalty area */}
      <rect x={0} y={(H - PENALTY_H) / 2} width={PENALTY_DEPTH} height={PENALTY_H}
        fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={0.4} />
      {/* Left goal area */}
      <rect x={0} y={(H - GOAL_H) / 2} width={GOAL_DEPTH} height={GOAL_H}
        fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={0.4} />
      {/* Left penalty spot */}
      <circle cx={PENALTY_SPOT} cy={H / 2} r={0.4} fill="rgba(255,255,255,0.9)" />
      {/* Left goal */}
      <rect x={-2} y={(H - GOAL_WIDTH) / 2} width={2} height={GOAL_WIDTH}
        fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.9)" strokeWidth={0.5} />
      {/* Right penalty area */}
      <rect x={W - PENALTY_DEPTH} y={(H - PENALTY_H) / 2} width={PENALTY_DEPTH} height={PENALTY_H}
        fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={0.4} />
      {/* Right goal area */}
      <rect x={W - GOAL_DEPTH} y={(H - GOAL_H) / 2} width={GOAL_DEPTH} height={GOAL_H}
        fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={0.4} />
      {/* Right penalty spot */}
      <circle cx={W - PENALTY_SPOT} cy={H / 2} r={0.4} fill="rgba(255,255,255,0.9)" />
      {/* Right goal */}
      <rect x={W} y={(H - GOAL_WIDTH) / 2} width={2} height={GOAL_WIDTH}
        fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.9)" strokeWidth={0.5} />
      {/* Corner arcs (quarter circles r=1) */}
      {[[0,0,"0,1 1,0"],[W,0,"0,1 -1,0"],[0,H,"0,-1 1,0"],[W,H,"0,-1 -1,0"]].map(([cx,cy,d],i)=>(
        <path key={i} d={`M ${cx} ${(cy as number)+((i<2)?1:-1)} A 1 1 0 0 ${i%2===0?1:0} ${(cx as number)+((i%2===0||i===3)?1:-1)} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={0.4} />
      ))}
    </g>
  );
}

// ── Event marker on pitch ──────────────────────────────────────────────────
function EventMarker({ ev, isNew, onClick, selected }: {
  ev: PitchEvent; isNew: boolean; onClick: () => void; selected: boolean;
}) {
  if (ev.kind === "kickoff" || ev.kind === "halftime" || ev.kind === "fulltime") return null;

  const color = ev.team === "home" ? "#facc15" : "#60a5fa";
  let icon = "⚽";
  if (ev.kind === "booking") icon = ev.cardType === "Red" ? "🟥" : "🟨";
  else if (ev.kind === "sub") icon = "🔄";
  else if (ev.penalty) icon = "🎯";
  else if (ev.ownGoal) icon = "💀";

  return (
    <g
      style={{
        cursor: "pointer",
        animation: isNew ? "popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" : undefined,
      }}
      onClick={onClick}
    >
      {/* Glow ring when selected */}
      {selected && (
        <circle cx={ev.x} cy={ev.y} r={4.5} fill="none" stroke={color} strokeWidth={0.8} opacity={0.7} />
      )}
      {/* Goal flash ring */}
      {ev.kind === "goal" && isNew && (
        <circle cx={ev.x} cy={ev.y} r={6}
          fill="none" stroke={color} strokeWidth={0.6} opacity={0.4}
          style={{ animation: "ringPop 0.8s ease-out forwards" }} />
      )}
      <circle cx={ev.x} cy={ev.y} r={ev.kind === "goal" ? 3.2 : 2.4}
        fill={selected ? color : `${color}cc`}
        stroke={color} strokeWidth={0.5}
        style={{ filter: ev.kind === "goal" ? `drop-shadow(0 0 2px ${color})` : undefined }}
      />
      <text x={ev.x} y={ev.y + 0.8} textAnchor="middle" fontSize={ev.kind === "goal" ? 3.5 : 2.8}
        style={{ userSelect: "none" }}>
        {icon}
      </text>
      {/* Minute label */}
      <text x={ev.x} y={ev.y - 4} textAnchor="middle" fontSize={1.8}
        fill="white" fontWeight="bold" style={{ userSelect: "none" }}>
        {ev.minute}&apos;
      </text>
    </g>
  );
}

// ── Player dot ─────────────────────────────────────────────────────────────
function PlayerDot({ x, y, name, pos, color, dim }: {
  x: number; y: number; name: string; pos: string; color: string; dim: boolean;
}) {
  return (
    <g opacity={dim ? 0.35 : 1} style={{ transition: "opacity 0.5s" }}>
      <circle cx={x} cy={y} r={2.6} fill={color} stroke="rgba(255,255,255,0.5)" strokeWidth={0.4} />
      <text x={x} y={y + 0.9} textAnchor="middle" fontSize={2} fill="white" fontWeight="bold"
        style={{ userSelect: "none" }}>
        {pos}
      </text>
      <text x={x} y={y + 5} textAnchor="middle" fontSize={1.6} fill="rgba(255,255,255,0.85)"
        style={{ userSelect: "none" }}>
        {name.split(" ").slice(-1)[0]}
      </text>
    </g>
  );
}

// ── Stat bar ───────────────────────────────────────────────────────────────
function StatRow({ label, home, away }: { label: string; home: string; away: string }) {
  const hNum = parseFloat(home.replace("%", "")) || 0;
  const aNum = parseFloat(away.replace("%", "")) || 0;
  const total = hNum + aNum || 1;
  const homePct = (hNum / total) * 100;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-6 text-right font-black text-yellow-300 tabular-nums">{home}</span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden flex">
        <div className="h-full bg-yellow-400 transition-all duration-700" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-blue-400 transition-all duration-700" style={{ width: `${100 - homePct}%` }} />
      </div>
      <span className="w-6 text-left font-black text-blue-300 tabular-nums">{away}</span>
      <span className="text-zinc-600 text-[10px] w-16">{label}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
type CommentaryEntry = { minute: number; clock: string; text: string; period: number };

type ESPNDetail = {
  team1: { formation: string; players: { name: string; position: string; formationPlace: number }[] };
  team2: { formation: string; players: { name: string; position: string; formationPlace: number }[] };
  team1Stats: Record<string, string>;
  team2Stats: Record<string, string>;
  clock: string;
  state: string;
  commentary: CommentaryEntry[];
};

const MISS_KEYWORDS = /\b(miss|missed|wide|over the bar|off the post|off the crossbar|saved|great save|denied|blocked shot|shooting chance)\b/i;

export default function PitchView({ match }: { match: Match }) {
  const isLive = match.status === "IN_PLAY" || match.status === "LIVE";
  const isFinished = match.status === "FINISHED";


  const [espn, setEspn] = useState<ESPNDetail | null>(null);
  const [espnLoading, setEspnLoading] = useState(true);
  const [espnError, setEspnError] = useState(false);
  const [muted, setMuted] = useState(false);
  const snd = useSounds();

  const events = buildEvents(match);
  // For live: max grows as ESPN clock advances; don't pre-seed with 45 (HT event already covers finished)
  const [liveClockMinute, setLiveClockMinute] = useState(0);
  const maxMinute = isLive
    ? Math.max(...events.filter(e => e.kind !== "halftime" && e.kind !== "fulltime").map(e => e.minute), liveClockMinute, 1)
    : Math.max(...events.map(e => e.minute), 1);

  // Live: start at 0, ESPN clock sync will advance it. Finished: start at 0 for replay.
  const [minute, setMinute] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // minutes per second
  const [selected, setSelected] = useState<string | null>(null);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const prevEventCount = useRef(0);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commentaryEndRef = useRef<HTMLDivElement | null>(null);
  const prevCommentaryCount = useRef(0);

  // Fetch ESPN detail
  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/match-detail/${match.id}`, { cache: "no-store" });
      if (!res.ok) { setEspnError(true); return; }
      const data = await res.json();
      setEspn(data);
      setEspnError(false);
    } catch { setEspnError(true); }
    finally { setEspnLoading(false); }
  }, [match.id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(fetchDetail, 30000);
    return () => clearInterval(id);
  }, [isLive, fetchDetail]);

  // Start ambient on mount, stop on unmount
  useEffect(() => {
    if (!muted) snd.startAmbient();
    return () => snd.stopAmbient();
  }, []);

  // Mute toggle
  useEffect(() => {
    if (muted) snd.stopAmbient();
    else snd.startAmbient();
  }, [muted]);

  // Detect new events — flash animation + sounds
  // Sounds only fire when NOT auto-playing (prevents pile-up during scrub)
  // Exception: live matches always fire since minute advances are real-time
  useEffect(() => {
    const visible = events.filter(e => e.minute <= minute && e.kind !== "kickoff" && e.kind !== "halftime" && e.kind !== "fulltime");
    if (visible.length > prevEventCount.current) {
      const newEvs = visible.slice(prevEventCount.current);
      const newIds = new Set(newEvs.map(e => e.id));
      setNewEventIds(newIds);
      setTimeout(() => setNewEventIds(new Set()), 1000);

      const canPlaySound = !muted && (!playing || isLive);
      if (canPlaySound) {
        // Only play sound for the most significant new event (first goal > first booking)
        const goal = newEvs.find(e => e.kind === "goal");
        const booking = newEvs.find(e => e.kind === "booking");
        if (goal) {
          if (goal.ownGoal) {
            snd.soundLockedUntil.current = Date.now() + 7000;
            snd.setAmbientVol(0, 400);
            setTimeout(() => snd.playOneShot("/sounds/cricket.mp3", 0.9, 0, 5000), 600);
            setTimeout(() => snd.setAmbientVol(0.18, 2000), 6000);
          } else {
            snd.playOneShot("/sounds/crowd-goal.mp3", 1.0, 7000, 6000); // clip at 6s
            snd.setAmbientVol(0.4, 300);
            setTimeout(() => snd.setAmbientVol(0.18, 3000), 6000);
          }
        } else if (booking) {
          snd.playWhistle();
          setTimeout(() => snd.playOneShot("/sounds/crowd-boo.mp3", 0.8, 4000, 3500), 800); // clip at 3.5s
        }
      }
    }
    prevEventCount.current = visible.length;
  }, [minute, events.length]);

  // Kickoff and fulltime whistles — only when not auto-playing
  const prevMinute = useRef(-1);
  useEffect(() => {
    if (prevMinute.current < 0 && minute === 0) { prevMinute.current = 0; return; }
    if (!muted && (!playing || isLive)) {
      if (prevMinute.current <= 0 && minute === 1) snd.playWhistle();
      if (isFinished && prevMinute.current < 90 && minute >= 90) {
        snd.playWhistle();
        setTimeout(() => snd.playWhistle(), 800);
        setTimeout(() => snd.playWhistle(), 1600);
      }
    }
    prevMinute.current = minute;
  }, [minute]);

  // Miss detection — only when not auto-playing
  const prevCommCount = useRef(0);
  useEffect(() => {
    const visible = (espn?.commentary ?? []).filter(c => c.minute <= minute);
    if (visible.length > prevCommCount.current) {
      const newLines = visible.slice(prevCommCount.current);
      if (!muted && (!playing || isLive) && newLines.some(c => MISS_KEYWORDS.test(c.text)))
        snd.playOneShot("/sounds/crowd-aww.mp3", 0.8, 3000, 2500);
    }
    prevCommCount.current = visible.length;
  }, [minute, espn?.commentary?.length]);

  // Auto-advance for live — sync scrubber to ESPN clock, keep it at current live minute
  useEffect(() => {
    if (!isLive || !espn?.clock) return;
    const parsed = parseInt(espn.clock);
    if (!isNaN(parsed) && parsed > 0) {
      setLiveClockMinute(parsed);
      setMinute(parsed); // always track the live minute
    }
  }, [espn?.clock, isLive]);

  // Play button — advance 1 minute every (2000/speed)ms
  // 1× = 2s/min → 90 min takes 3 min | 2× = 1s/min → 1.5 min | 5× = 400ms/min → 36s
  useEffect(() => {
    if (playing) {
      const ms = Math.round(2000 / speed);
      playRef.current = setInterval(() => {
        setMinute(m => {
          if (m >= maxMinute) { setPlaying(false); return m; }
          return m + 1;
        });
      }, ms);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, maxMinute, speed]);

  // Live clock: display ticks every 60s between ESPN refreshes, and advances scrubber
  const [liveClock, setLiveClock] = useState("");
  useEffect(() => {
    if (espn?.clock) setLiveClock(espn.clock);
  }, [espn?.clock]);
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => {
      setLiveClockMinute(m => m + 1);
      setMinute(m => m + 1);
      setLiveClock(prev => {
        const n = parseInt(prev);
        return isNaN(n) ? prev : `${n + 1}'`;
      });
    }, 60000);
    return () => clearInterval(id);
  }, [isLive]);

  // Commentary filtered to current scrubber minute (displayValue already reflects true match minute)
  const visibleCommentary = (espn?.commentary ?? []).filter(c => c.minute <= minute);

  // Auto-scroll commentary to latest entry
  useEffect(() => {
    if (visibleCommentary.length !== prevCommentaryCount.current) {
      prevCommentaryCount.current = visibleCommentary.length;
      commentaryEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [visibleCommentary.length]);

  // Visible events up to current minute
  const visibleEvents = events.filter(e => e.minute <= minute);
  const currentScore = { home: 0, away: 0 };
  visibleEvents.forEach(e => {
    if (e.kind === "goal") {
      // e.team = the team that benefits (ESPN attributes OG to scoring team, not the OG player's team)
      if (e.team === "home") currentScore.home++;
      else currentScore.away++;
    }
  });

  const selectedEv = events.find(e => e.id === selected);

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-zinc-950/80 backdrop-blur-xl overflow-hidden">
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ringPop {
          0% { r: 4; opacity: 0.8; }
          100% { r: 12; opacity: 0; }
        }
      `}</style>

      {/* ── Score header ── */}
      <div className="px-5 py-4 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-white/[0.02]" style={{ position: "relative" }}>
        <button
          onClick={() => setMuted(m => !m)}
          title={muted ? "Unmute sounds" : "Mute sounds"}
          className="absolute top-3 right-3 text-lg opacity-50 hover:opacity-100 transition-opacity"
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <img src={match.team1_crest || "/placeholder-team.png"} className="w-8 h-8 object-contain" />
          <span className="font-black text-sm truncate text-yellow-300">{match.team1}</span>
        </div>
        <div className="text-center shrink-0">
          <div className="text-3xl font-black tabular-nums">
            <span className="text-yellow-300">{currentScore.home}</span>
            <span className="text-zinc-600 mx-2">–</span>
            <span className="text-blue-300">{currentScore.away}</span>
          </div>
          {isLive && (
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-black">{liveClock || "LIVE"}</span>
            </div>
          )}
          {isFinished && <div className="text-zinc-600 text-[10px] uppercase tracking-widest mt-1">Full Time</div>}
        </div>
        <div className="flex items-center gap-3 min-w-0 justify-end">
          <span className="font-black text-sm truncate text-blue-300">{match.team2}</span>
          <img src={match.team2_crest || "/placeholder-team.png"} className="w-8 h-8 object-contain" />
        </div>
      </div>

      {/* ── Pitch ── */}
      <div className="relative">
        <svg viewBox={`-2 -1 ${W + 4} ${H + 2}`} className="w-full" style={{ maxHeight: 420 }}>
          <PitchSVG />

          {/* Formation dots — visible at kickoff, fade out as match progresses */}
          {espn && !espnError && (
            <g style={{ opacity: minute <= 1 ? 1 : 0, transition: "opacity 0.8s ease" }} pointerEvents={minute <= 1 ? undefined : "none"}>
            <>
              {espn.team1.players.map((p, i) => {
                const { x, y } = getPlayerPos(espn.team1.formation, p.formationPlace ?? (i + 1), "home");
                return (
                  <PlayerDot key={i} x={x} y={y} name={p.name} pos={p.position} color="#b45309" dim={false} />
                );
              })}
              {espn.team2.players.map((p, i) => {
                const { x, y } = getPlayerPos(espn.team2.formation, p.formationPlace ?? (i + 1), "away");
                return (
                  <PlayerDot key={i} x={x} y={y} name={p.name} pos={p.position} color="#1d4ed8" dim={false} />
                );
              })}
            </>
            </g>
          )}

          {/* Event markers */}
          {visibleEvents.map(ev => (
            <EventMarker key={ev.id} ev={ev}
              isNew={newEventIds.has(ev.id)}
              selected={selected === ev.id}
              onClick={() => setSelected(prev => prev === ev.id ? null : ev.id)}
            />
          ))}

          {/* Formation badges */}
          {espn && !espnLoading && (
            <>
              <text x={4} y={3} fontSize={2.2} fill="rgba(250,204,21,0.7)" fontWeight="bold">{espn.team1.formation}</text>
              <text x={W - 4} y={3} fontSize={2.2} fill="rgba(96,165,250,0.7)" fontWeight="bold" textAnchor="end">{espn.team2.formation}</text>
            </>
          )}
        </svg>

        {/* Selected event tooltip */}
        {selectedEv && selectedEv.kind !== "kickoff" && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-zinc-900/95 border border-white/[0.12] backdrop-blur-xl text-center shadow-2xl pointer-events-none z-10">
            <div className="font-black text-sm">{selectedEv.label}</div>
            {selectedEv.sub && <div className="text-xs text-zinc-400 mt-0.5">{selectedEv.sub}</div>}
            <div className="text-xs text-zinc-600 mt-0.5">{selectedEv.minute}&apos; · {selectedEv.team === "home" ? match.team1 : match.team2}</div>
          </div>
        )}

        {espnLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <span className="text-sm font-black animate-pulse text-yellow-400">Loading lineups…</span>
          </div>
        )}
      </div>

      {/* ── Stats bar — live only ── */}
      {isLive && espn && !espnError && (
        <div className="px-5 py-4 border-t border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-600 font-black mb-3">
            <span className="text-yellow-300">{match.team1}</span>
            <span>Live Stats</span>
            <span className="text-blue-300">{match.team2}</span>
          </div>
          <StatRow label="Possession" home={espn.team1Stats.possession} away={espn.team2Stats.possession} />
          <StatRow label="Shots" home={espn.team1Stats.shots} away={espn.team2Stats.shots} />
          <StatRow label="On Target" home={espn.team1Stats.shotsOnTarget} away={espn.team2Stats.shotsOnTarget} />
          <StatRow label="Corners" home={espn.team1Stats.corners} away={espn.team2Stats.corners} />
          <StatRow label="Fouls" home={espn.team1Stats.fouls} away={espn.team2Stats.fouls} />
        </div>
      )}

      {/* ── Timeline scrubber ── */}
      <div className="px-5 pb-5 pt-3 border-t border-white/[0.06]">
        {/* Controls */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button
            onClick={() => { setMinute(0); setPlaying(false); }}
            className="text-zinc-500 hover:text-white transition-colors text-xs font-black px-2 py-1 rounded-lg hover:bg-zinc-800"
          >↩ Reset</button>
          <button
            onClick={() => setPlaying(p => !p)}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              playing ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-yellow-400 text-black"
            }`}
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
            {[1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  speed === s ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >{s}×</button>
            ))}
          </div>
          <span className="ml-auto font-black tabular-nums text-sm text-zinc-300">{minute}&apos;</span>
        </div>

        {/* Slider with event ticks */}
        <div className="relative">
          <div className="relative h-6 flex items-center">
            {/* Tick marks */}
            {events.filter(e => e.kind !== "kickoff" && e.kind !== "halftime" && e.kind !== "fulltime").map(ev => {
              const pct = (ev.minute / maxMinute) * 100;
              const color = ev.kind === "goal" ? "#facc15" : ev.cardType === "Red" ? "#ef4444" : ev.kind === "booking" ? "#fbbf24" : "#60a5fa";
              return (
                <div key={ev.id} className="absolute top-0 bottom-0 flex items-center"
                  style={{ left: `${pct}%`, transform: "translateX(-50%)" }}>
                  <div className="w-1 h-4 rounded-full" style={{ background: color, opacity: ev.minute <= minute ? 1 : 0.25 }} />
                </div>
              );
            })}
            {/* Halftime mark */}
            <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${(45 / maxMinute) * 100}%` }}>
              <div className="w-px h-3 bg-zinc-600" />
            </div>
            {/* 90' mark if match went beyond */}
            {maxMinute > 90 && (
              <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${(90 / maxMinute) * 100}%` }}>
                <div className="w-px h-3 bg-zinc-700" />
              </div>
            )}
            <input
              type="range" min={0} max={maxMinute} value={minute}
              onChange={e => { setMinute(Number(e.target.value)); setPlaying(false); }}
              className="w-full appearance-none bg-zinc-800 rounded-full h-1.5 cursor-pointer relative z-10"
              style={{ accentColor: "#facc15" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-700 mt-1 font-black">
            <span>0&apos;</span>
            <span>45&apos;</span>
            {maxMinute > 90 && <span>90&apos;</span>}
            <span>{maxMinute}&apos;</span>
          </div>
        </div>

        {/* Event log */}
        {visibleEvents.filter(e => e.kind !== "kickoff").length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleEvents.filter(e => e.kind !== "kickoff").map(ev => {
              const icon = ev.kind === "goal" ? (ev.ownGoal ? "💀" : ev.penalty ? "🎯" : "⚽") : ev.kind === "halftime" ? "⏸" : ev.kind === "fulltime" ? "🏁" : ev.cardType === "Red" ? "🟥" : ev.kind === "booking" ? "🟨" : "🔄";
              const teamColor = ev.team === "home" ? "text-yellow-300" : ev.team === "away" ? "text-blue-300" : "text-zinc-400";
              return (
                <button key={ev.id} onClick={() => setMinute(ev.minute)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black border transition-all
                    ${minute >= ev.minute ? "bg-zinc-800 border-zinc-700" : "bg-zinc-900/50 border-zinc-800/50 opacity-40"}`}>
                  <span>{icon}</span>
                  <span className={teamColor}>{ev.label.split(" ").slice(-1)[0]}</span>
                  <span className="text-zinc-600">{ev.minute}&apos;</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Commentary panel ── */}
      {espn && (espn.commentary?.length ?? 0) > 0 && (
        <div className="border-t border-white/[0.06]">
          <div className="px-5 py-3 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-black">Commentary</span>
            <span className="text-[10px] text-zinc-700">{visibleCommentary.length} / {espn.commentary.length}</span>
          </div>
          <div className="h-48 overflow-y-auto px-5 pb-5 space-y-2 scrollbar-none">
            {visibleCommentary.length === 0 ? (
              <p className="text-xs text-zinc-700 italic">No commentary yet — drag the scrubber forward.</p>
            ) : (
              visibleCommentary.map((c, i) => {
                const adjustedMin = c.minute;
                // Highlight goal-related lines
                const isGoal = /goal|scores?|penalty/i.test(c.text);
                const isCard = /yellow|red card|booking/i.test(c.text);
                const isSub = /substitut|comes on|replac/i.test(c.text);
                const isLatest = i === visibleCommentary.length - 1;
                return (
                  <div
                    key={i}
                    className={`flex gap-3 text-xs rounded-xl px-3 py-2 transition-all ${
                      isLatest ? "bg-white/[0.06] ring-1 ring-white/[0.08]" : "bg-transparent"
                    }`}
                  >
                    <span className={`shrink-0 font-black tabular-nums w-8 text-right ${
                      isGoal ? "text-yellow-400" : isCard ? "text-red-400" : isSub ? "text-blue-400" : "text-zinc-600"
                    }`}>
                      {adjustedMin}&apos;
                    </span>
                    <span className={`leading-relaxed ${
                      isGoal ? "text-yellow-200 font-black" : isCard ? "text-red-300" : isLatest ? "text-zinc-200" : "text-zinc-500"
                    }`}>
                      {isGoal && "⚽ "}{isCard && "🟨 "}{isSub && "🔄 "}{c.text}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={commentaryEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
