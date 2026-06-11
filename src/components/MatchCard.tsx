"use client";

import { motion, AnimatePresence } from "framer-motion";
import PredictionControls from "./PredictionControls";
import type { Match, Prediction, PredictedScore, ESPNGoal, ESPNBooking, ESPNSubstitution } from "@/types";
import { toLocalDateKey, userTZ, tzLabel } from "@/lib/utils";
import { useLocaleCtx } from "@/context/LocaleContext";
import { getT } from "@/lib/translations";

type MatchCardProps = {
  match: Match;
  canPredict: (kickoffTime: string) => boolean;
  predictions: Record<number, Prediction>;
  predictedScores: Record<number, PredictedScore>;
  setPredictedScores: (scores: Record<number, PredictedScore>) => void;
  expandedMatches: Record<number, boolean>;
  setExpandedMatches: (expanded: Record<number, boolean>) => void;
  submitPrediction: (matchId: number) => void;
  cancelPrediction: (matchId: number) => void;
  activeDayBoosters: Record<string, string[]>;
};

const BOOSTER_ICONS: Record<string, string> = { "2x": "⚽", "3x": "🔥", draw: "🐐" };

// Subtle football pitch SVG rendered inside each card
function PitchBackground() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 800 160"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grass tint */}
      <rect width="800" height="160" fill="rgba(0,30,8,0.18)" />
      {/* Grass stripes */}
      <rect x="0" y="0"   width="800" height="20" fill="rgba(0,255,80,0.02)" />
      <rect x="0" y="40"  width="800" height="20" fill="rgba(0,255,80,0.02)" />
      <rect x="0" y="80"  width="800" height="20" fill="rgba(0,255,80,0.02)" />
      <rect x="0" y="120" width="800" height="20" fill="rgba(0,255,80,0.02)" />
      {/* Outer border */}
      <rect x="16" y="10" width="768" height="140" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      {/* Halfway line */}
      <line x1="400" y1="10" x2="400" y2="150" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      {/* Center circle */}
      <circle cx="400" cy="80" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      {/* Center spot */}
      <circle cx="400" cy="80" r="3" fill="rgba(255,255,255,0.07)" />
      {/* Left penalty area */}
      <rect x="16" y="36" width="90" height="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.2" />
      {/* Left goal area */}
      <rect x="16" y="54" width="34" height="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      {/* Left penalty spot */}
      <circle cx="76" cy="80" r="2.5" fill="rgba(255,255,255,0.05)" />
      {/* Right penalty area */}
      <rect x="694" y="36" width="90" height="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.2" />
      {/* Right goal area */}
      <rect x="750" y="54" width="34" height="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      {/* Right penalty spot */}
      <circle cx="724" cy="80" r="2.5" fill="rgba(255,255,255,0.05)" />
      {/* Corner arcs */}
      <path d="M16,10 Q26,10 26,20"   fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <path d="M784,10 Q774,10 774,20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <path d="M16,150 Q26,150 26,140" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      <path d="M784,150 Q774,150 774,140" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    </svg>
  );
}

// ─── Event Timeline (ESPN format) ────────────────────────────────────────────

function parseMinute(m: string): number {
  const clean = m.replace("'", "");
  const parts = clean.split("+").map(Number);
  return (parts[0] || 0) + (parts[1] || 0);
}

type UnifiedEvent =
  | { kind: "goal"; minute: string; team: "home" | "away"; scorer: string; assist: string | null; ownGoal: boolean; penalty: boolean }
  | { kind: "booking"; minute: string; team: "home" | "away"; player: string; cardType: "Yellow" | "Red" }
  | { kind: "sub"; minute: string; team: "home" | "away"; playerOut: string; playerIn: string };

function buildEvents(match: Match): UnifiedEvent[] {
  const goals = (match.goals ?? []) as ESPNGoal[];
  const bookings = (match.bookings ?? []) as ESPNBooking[];
  const subs = (match.substitutions ?? []) as ESPNSubstitution[];

  const all: UnifiedEvent[] = [
    ...goals.map((g) => ({ kind: "goal" as const, minute: g.minute, team: g.team, scorer: g.scorer, assist: g.assist, ownGoal: g.ownGoal, penalty: g.penalty })),
    ...bookings.map((b) => ({ kind: "booking" as const, minute: b.minute, team: b.team, player: b.player, cardType: b.type })),
    ...subs.map((s) => ({ kind: "sub" as const, minute: s.minute, team: s.team, playerOut: s.playerOut, playerIn: s.playerIn })),
  ];

  return all.sort((a, b) => parseMinute(a.minute) - parseMinute(b.minute));
}

function EventTimeline({ match, eventsLabel }: { match: Match; eventsLabel: string }) {
  const events = buildEvents(match);
  if (!events.length) return null;

  return (
    <div className="mt-8 pt-6 border-t border-zinc-800/60">
      <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black mb-4">
        {eventsLabel}
      </div>
      <div className="space-y-2">
        {events.map((ev, i) => {
          const isHome = ev.team === "home";
          let icon = "";
          let mainText = "";
          let subText: string | null = null;

          if (ev.kind === "goal") {
            icon = ev.ownGoal ? "⚽🔴" : ev.penalty ? "⚽🎯" : "⚽";
            mainText = ev.scorer;
            if (ev.ownGoal) subText = "Own Goal";
            else if (ev.penalty) subText = "Penalty";
            else if (ev.assist) subText = `Assist: ${ev.assist}`;
          } else if (ev.kind === "booking") {
            icon = ev.cardType === "Red" ? "🟥" : "🟨";
            mainText = ev.player;
            subText = ev.cardType === "Red" ? "Red Card" : "Yellow Card";
          } else {
            icon = "🔄";
          }

          return (
            <div key={i} className={`flex items-center gap-2 ${isHome ? "flex-row" : "flex-row-reverse"}`}>
              <div className="shrink-0 w-10 text-center">
                <span className="text-[11px] font-black text-zinc-500 tabular-nums">{ev.minute}</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 min-w-0 max-w-[220px] ${isHome ? "" : "flex-row-reverse"}`}>
                <span className="shrink-0 text-sm leading-none">{icon}</span>
                <div className={`min-w-0 ${isHome ? "text-left" : "text-right"}`}>
                  {ev.kind === "sub" ? (
                    <div className="leading-tight">
                      <span className="text-emerald-400 font-bold text-xs truncate block">&#8593; {ev.playerIn}</span>
                      <span className="text-red-400 font-bold text-xs truncate block">&#8595; {ev.playerOut}</span>
                    </div>
                  ) : (
                    <div className="leading-tight">
                      <span className="font-bold text-xs truncate block">{mainText}</span>
                      {subText && <span className="text-zinc-500 text-[10px]">{subText}</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default function MatchCard({
  match,
  canPredict,
  predictions,
  predictedScores,
  setPredictedScores,
  expandedMatches,
  setExpandedMatches,
  submitPrediction,
  cancelPrediction,
  activeDayBoosters,
}: MatchCardProps) {
  const { locale } = useLocaleCtx();
  const t = getT(locale);
  const expanded = expandedMatches[match.id];
  const prediction = predictions[match.id];

  const kickoffTime = match.kickoff_time ? new Date(match.kickoff_time) : null;
  const now = new Date();

  const isOpen = canPredict(match.kickoff_time ?? "");
  const hasStarted = kickoffTime
    ? now >= new Date(kickoffTime.getTime() - 1 * 60 * 1000)
    : false;

  const isLive = match.status === "LIVE" || match.status === "IN_PLAY" || match.status === "PAUSED";
  const isFinished = match.status === "FINISHED";
  const isPostponed = match.status === "POSTPONED";
  const isSuspended = match.status === "SUSPENDED";

  const locked =
    !isOpen ||
    hasStarted ||
    isFinished ||
    isLive ||
    isPostponed ||
    isSuspended;

  const matchDate = match.kickoff_time
    ? toLocalDateKey(new Date(match.kickoff_time))
    : null;

  const activeBoosters = matchDate ? (activeDayBoosters[matchDate] || []) : [];

  const getCountdown = () => {
    if (!match.kickoff_time) return t("match.tbd");
    if (isPostponed) return t("status.postponed");
    if (isSuspended) return t("status.suspended");
    if (isFinished) return t("status.ft");
    if (isLive) return match.status === "PAUSED" ? t("status.halftime") : t("status.live");
    const diff = kickoffTime!.getTime() - now.getTime();
    if (diff <= 0) return t("status.closed");
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getLocalKickoff = () => {
    if (!match.kickoff_time) return t("match.tbd");
    return new Date(match.kickoff_time).toLocaleString(locale, {
      timeZone: userTZ(),
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCloseTime = () => {
    if (!match.kickoff_time) return t("match.tbd");
    return new Date(kickoffTime!.getTime() - 1 * 60 * 1000).toLocaleString(locale, {
      timeZone: userTZ(),
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const statusLabel = isLive
    ? t("status.live")
    : isFinished
    ? t("status.ft")
    : isPostponed
    ? t("status.postponed")
    : isSuspended
    ? t("status.suspended")
    : hasStarted
    ? t("status.locked")
    : isOpen
    ? t("status.open")
    : t("status.locked");

  const statusPillClass = isLive
    ? "border-red-500/40 bg-red-500/10 text-red-400"
    : isFinished
    ? "border-zinc-700 bg-zinc-800/50 text-zinc-500"
    : isPostponed
    ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
    : isSuspended
    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
    : isOpen
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
    : "border-red-500/40 bg-red-500/10 text-red-400";

  // Left accent border colour
  const cardAccent = isLive
    ? "border-l-red-500/70"
    : isFinished && prediction && !prediction.processed
    ? "border-l-yellow-500/70"
    : prediction?.processed
    ? "border-l-emerald-500/50"
    : isOpen
    ? "border-l-emerald-500/70"
    : "border-l-zinc-600/40";

  // Gradient glow — brighter when expanded, based on match status
  const cardGlow = isLive
    ? expanded
      ? "shadow-[0_0_40px_10px_rgba(239,68,68,0.30),0_0_0_1px_rgba(239,68,68,0.40),inset_0_1px_0_rgba(255,255,255,0.09)]"
      : "shadow-[0_0_24px_4px_rgba(239,68,68,0.18),0_0_0_1px_rgba(239,68,68,0.25),inset_0_1px_0_rgba(255,255,255,0.07)]"
    : isFinished && prediction && !prediction.processed
    ? expanded
      ? "shadow-[0_0_40px_10px_rgba(234,179,8,0.26),0_0_0_1px_rgba(234,179,8,0.36),inset_0_1px_0_rgba(255,255,255,0.09)]"
      : "shadow-[0_0_24px_4px_rgba(234,179,8,0.15),0_0_0_1px_rgba(234,179,8,0.22),inset_0_1px_0_rgba(255,255,255,0.07)]"
    : prediction?.processed
    ? expanded
      ? "shadow-[0_0_36px_8px_rgba(34,197,94,0.22),0_0_0_1px_rgba(34,197,94,0.30),inset_0_1px_0_rgba(255,255,255,0.08)]"
      : "shadow-[0_0_20px_3px_rgba(34,197,94,0.13),0_0_0_1px_rgba(34,197,94,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]"
    : isOpen
    ? expanded
      ? "shadow-[0_0_36px_8px_rgba(34,197,94,0.18),0_0_0_1px_rgba(34,197,94,0.26),inset_0_1px_0_rgba(255,255,255,0.08)]"
      : "shadow-[0_0_20px_3px_rgba(34,197,94,0.10),0_0_0_1px_rgba(34,197,94,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]"
    : expanded
    ? "shadow-[0_0_28px_6px_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,255,255,0.14),inset_0_1px_0_rgba(255,255,255,0.07)]"
    : "shadow-[0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_0_20px_4px_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.10),inset_0_1px_0_rgba(255,255,255,0.06)]";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-l-4 ${cardAccent} ${cardGlow}
        backdrop-blur-md border border-white/[0.07]
        transition-all duration-300`}
    >
      {/* LIVE / STARTED HEARTBEAT INDICATOR */}
      {isLive && (
        <span className="absolute top-3 right-3 z-10 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}
      {!isLive && !isFinished && hasStarted && (
        <span className="absolute top-3 right-3 z-10 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
        </span>
      )}
      <div>

      {/* COLLAPSED ROW */}
      <button
        onClick={() => {
          const isCurrentlyOpen = !!expandedMatches[match.id];
          const next: Record<number, boolean> = {};
          if (!isCurrentlyOpen) next[match.id] = true;
          setExpandedMatches(next);
        }}
        className="w-full px-3 sm:px-6 py-4 sm:py-5 text-left"
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          {/* TEAMS + SCORE */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <img src={match.team1_crest || "/placeholder-team.png"} className="w-6 h-6 sm:w-8 sm:h-8 object-contain shrink-0" />
              <span className="text-sm sm:text-base font-black truncate max-w-[80px] sm:max-w-none">{match.team1}</span>
            </div>

            <div className="flex items-center justify-center shrink-0 min-w-[44px] sm:min-w-[56px]">
              {(isFinished || isLive || match.team1_score != null) ? (
                <span className={`text-base sm:text-xl font-black tabular-nums ${isLive ? "text-red-300" : ""}`}>
                  {match.team1_score ?? "?"}–{match.team2_score ?? "?"}
                </span>
              ) : (
                <span className="text-zinc-600 font-black text-xs sm:text-sm">VS</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <img src={match.team2_crest || "/placeholder-team.png"} className="w-6 h-6 sm:w-8 sm:h-8 object-contain shrink-0" />
              <span className="text-sm sm:text-base font-black truncate max-w-[80px] sm:max-w-none">{match.team2}</span>
            </div>
          </div>

          {/* META */}
          <div className="flex items-center gap-3 flex-wrap text-xs font-semibold">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black tracking-wide ${statusPillClass}`}>
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block shrink-0" />}
              {statusLabel}
            </span>

            <div className="text-zinc-400 hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[11px] text-zinc-600 uppercase tracking-widest">{t("match.kickoff")} ({tzLabel()})</span>
              <span>{getLocalKickoff()}</span>
            </div>

            <div className="text-zinc-700 hidden sm:block">·</div>

            <div className="text-zinc-400 hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[11px] text-zinc-600 uppercase tracking-widest">{t("match.predCloses")}</span>
              <span className={locked ? "text-red-400" : "text-zinc-400"}>{getCloseTime()}</span>
            </div>

            <div className="text-zinc-700">·</div>

            <span className={`tabular-nums ${locked ? "text-red-400" : "text-zinc-500"}`}>
              ⏳ {getCountdown()}
            </span>

            {prediction && (
              <>
                <div className="text-zinc-700">·</div>
                {/* Predicted score badge — stands out from surrounding meta */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-black text-xs tabular-nums">
                  🎯 {prediction.predicted_team1_score}–{prediction.predicted_team2_score}
                </span>
              </>
            )}

            {prediction?.processed && (
              <>
                <div className="text-zinc-700">·</div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 font-black text-xs">
                  +{prediction.awarded_points} 🏆
                </span>
              </>
            )}

            {/* Live / waiting-for-scores indicators in collapsed row */}
            {prediction && !prediction.processed && isLive && (
              <>
                <div className="text-zinc-700">·</div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                  {t("status.live")}
                </span>
              </>
            )}

            {prediction && !prediction.processed && isFinished && (
              <>
                <div className="text-zinc-700">·</div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-yellow-400">
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Waiting for scores
                </span>
              </>
            )}

            {/* ACTIVE DAY BOOSTERS */}
            {activeBoosters.length > 0 && (
              <>
                <div className="text-zinc-700">·</div>
                <span className="flex gap-1">
                  {activeBoosters.map((b) => (
                    <span key={b} className="text-lg leading-none">{BOOSTER_ICONS[b] ?? b}</span>
                  ))}
                </span>
              </>
            )}

            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-zinc-500 text-lg leading-none ml-1"
            >
              ⌄
            </motion.span>
          </div>
        </div>

        {/* MOBILE: kickoff + close time row */}
        <div className="flex items-center gap-4 mt-3 sm:hidden text-xs text-zinc-500 font-semibold">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-zinc-700 uppercase tracking-widest">{t("match.kickoff")} ({tzLabel()})</span>
            <span>{getLocalKickoff()}</span>
          </div>
          <div className="text-zinc-700">·</div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-zinc-700 uppercase tracking-widest">{t("match.predClosesShort")}</span>
            <span className={locked ? "text-red-400" : ""}>{getCloseTime()}</span>
          </div>
        </div>
      </button>

      {/* EXPANDED */}
      <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          key="panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: "hidden" }}
        >
        <div className="border-t border-white/[0.07] px-3 sm:px-6 py-4 sm:py-6">
          {/* TIMING STRIP */}
          <div className="grid grid-cols-2 sm:flex sm:items-stretch gap-2 sm:gap-3 mb-5">
            <div className="border border-white/[0.07] rounded-2xl px-3 sm:px-5 py-3 sm:py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{t("match.kickoff")}</div>
              <div className="text-xs sm:text-sm font-black">{getLocalKickoff()}</div>
            </div>
            <div className="border border-white/[0.07] rounded-2xl px-3 sm:px-5 py-3 sm:py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{t("match.predClosesShort")}</div>
              <div className={`text-xs sm:text-sm font-black ${locked ? "text-red-400" : ""}`}>{getCloseTime()}</div>
            </div>
            <div
              className={`col-span-2 sm:col-span-1 sm:flex-1 flex items-center justify-center px-4 py-3 rounded-2xl border font-black text-sm ${
                locked
                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}
            >
              ⏳ {getCountdown()}
            </div>
          </div>

          {/* MATCH STATUS BANNER */}
          {isLive && prediction && !prediction.processed && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse shrink-0" />
              <div>
                <div className="text-red-300 font-black text-sm">
                  {match.status === "PAUSED" ? t("match.halftimeBreak") : t("match.inProgress")}
                </div>
                <div className="text-red-400/70 text-xs mt-0.5">{t("match.lockedIn")}</div>
              </div>
            </div>
          )}

          {isFinished && prediction && !prediction.processed && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 mb-6">
              <svg className="w-4 h-4 text-yellow-400 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
              </svg>
              <div>
                <div className="text-yellow-300 font-black text-sm">{t("match.waitingScores")}</div>
                <div className="text-yellow-400/70 text-xs mt-0.5">{t("match.pointsAppear")}</div>
              </div>
            </div>
          )}

          {isPostponed && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-6">
              <span className="text-orange-400 text-lg shrink-0">📅</span>
              <div>
                <div className="text-orange-300 font-black text-sm">{t("match.postponedMsg")}</div>
                <div className="text-orange-400/70 text-xs mt-0.5">{t("match.postponedDetail")}</div>
              </div>
            </div>
          )}

          {isSuspended && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
              <span className="text-amber-400 text-lg shrink-0">⚠️</span>
              <div>
                <div className="text-amber-300 font-black text-sm">{t("match.suspendedMsg")}</div>
                <div className="text-amber-400/70 text-xs mt-0.5">{t("match.suspendedDetail")}</div>
              </div>
            </div>
          )}

          {/* ACTIVE BOOSTERS STRIP */}
          {activeBoosters.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {activeBoosters.map((b) => (
                <div
                  key={b}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-700 text-sm font-black"
                >
                  <span>{BOOSTER_ICONS[b] ?? b}</span>
                  <span className="text-zinc-300">
                    {b === "2x" ? t("booster.tikiActive") : b === "3x" ? t("booster.hatActive") : t("booster.goatActive")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <PredictionControls
            match={match}
            locked={locked}
            predictions={predictions}
            predictedScores={predictedScores}
            setPredictedScores={setPredictedScores}
            submitPrediction={submitPrediction}
            cancelPrediction={cancelPrediction}
          />

          {/* MATCH EVENTS TIMELINE — shown whenever there are events */}
          {((match.goals?.length ?? 0) > 0 || (match.bookings?.length ?? 0) > 0 || (match.substitutions?.length ?? 0) > 0) && (
            <EventTimeline match={match} eventsLabel={t("match.events")} />
          )}
        </div>
        </motion.div>
      )}
      </AnimatePresence>
      </div>{/* end z-10 content wrapper */}
    </div>
  );
}