"use client";

import { motion } from "framer-motion";
import PredictionControls from "./PredictionControls";
import type { Match, Prediction, PredictedScore, MatchEvent } from "@/types";

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

// ─── Event Timeline ───────────────────────────────────────────────────────────

function eventIcon(type: string, detail?: string) {
  if (type === "GOAL") {
    if (detail === "Own Goal") return "⚽🔴";
    if (detail === "Penalty") return "⚽🎯";
    return "⚽";
  }
  if (type === "CARD") {
    if (detail === "Red Card" || detail === "RED_CARD") return "🟥";
    if (detail === "Yellow-Red Card" || detail === "YELLOW_RED_CARD") return "🟨🟥";
    return "🟨";
  }
  if (type === "SUBSTITUTION") return "🔄";
  return "•";
}

function minuteLabel(event: MatchEvent) {
  const extra = event.extraTime ? `+${event.extraTime}` : "";
  return `${event.minute}${extra}'`;
}

function EventTimeline({ match }: { match: Match }) {
  // Merge all events and sort by minute
  const allEvents: MatchEvent[] = [
    ...(match.goals ?? []),
    ...(match.bookings ?? []),
    ...(match.substitutions ?? []),
  ].sort((a, b) => a.minute - b.minute || 0);

  if (!allEvents.length) return null;

  return (
    <div className="mt-8 pt-6 border-t border-zinc-800/60">
      <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black mb-4">
        Match Events
      </div>
      <div className="space-y-2">
        {allEvents.map((event, i) => {
          const isHome = event.team?.name === match.team1;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 ${isHome ? "flex-row" : "flex-row-reverse"}`}
            >
              {/* Minute badge */}
              <div className="shrink-0 w-12 text-center">
                <span className="text-[11px] font-black text-zinc-500 tabular-nums">
                  {minuteLabel(event)}
                </span>
              </div>

              {/* Event pill */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm min-w-0 ${
                  isHome ? "" : "flex-row-reverse"
                }`}
              >
                <span className="shrink-0 text-base leading-none">
                  {eventIcon(event.type, event.detail)}
                </span>
                <div className={`min-w-0 ${isHome ? "text-left" : "text-right"}`}>
                  {event.type === "SUBSTITUTION" ? (
                    <div className="leading-tight">
                      <span className="text-emerald-400 font-bold text-xs truncate block">
                        ↑ {event.assist?.name ?? "–"}
                      </span>
                      <span className="text-red-400 font-bold text-xs truncate block">
                        ↓ {event.player?.name ?? "–"}
                      </span>
                    </div>
                  ) : (
                    <div className="leading-tight">
                      <span className="font-bold text-xs truncate block">
                        {event.player?.name ?? "–"}
                      </span>
                      {event.detail && (
                        <span className="text-zinc-600 text-[10px]">{event.detail}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Spacer to push home events left, away events right */}
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
    ? new Date(match.kickoff_time).toISOString().split("T")[0]
    : null;

  const activeBoosters = matchDate ? (activeDayBoosters[matchDate] || []) : [];

  const getCountdown = () => {
    if (!match.kickoff_time) return "TBD";
    if (isPostponed) return "Postponed";
    if (isSuspended) return "Suspended";
    if (isFinished) return "Full Time";
    if (isLive) return match.status === "PAUSED" ? "Half-time" : "Live";
    const diff = kickoffTime!.getTime() - now.getTime();
    if (diff <= 0) return "Closed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getISTKickoff = () => {
    if (!match.kickoff_time) return "TBD";
    return new Date(match.kickoff_time).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCloseTime = () => {
    if (!match.kickoff_time) return "TBD";
    return new Date(kickoffTime!.getTime() - 1 * 60 * 1000).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const statusLabel = isLive
    ? "Live"
    : isFinished
    ? "FT"
    : isPostponed
    ? "Postponed"
    : isSuspended
    ? "Suspended"
    : hasStarted
    ? "Locked"
    : isOpen
    ? "Open"
    : "Locked";

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

  return (
    <motion.div
      layout
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-950 shadow-xl"
    >
      {/* COLLAPSED ROW */}
      <button
        onClick={() => setExpandedMatches({ ...expandedMatches, [match.id]: !expanded })}
        className="w-full px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* TEAMS + SCORE */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2">
              <img src={match.team1_crest || "/placeholder-team.png"} className="w-8 h-8 object-contain" />
              <span className="text-base font-black truncate">{match.team1}</span>
            </div>

            <div className="flex items-center justify-center min-w-[56px]">
              {isFinished || isLive ? (
                <span className={`text-xl font-black tabular-nums ${isLive ? "text-red-300" : ""}`}>
                  {match.team1_score} – {match.team2_score}
                </span>
              ) : (
                <span className="text-zinc-600 font-black text-sm">VS</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <img src={match.team2_crest || "/placeholder-team.png"} className="w-8 h-8 object-contain" />
              <span className="text-base font-black truncate">{match.team2}</span>
            </div>
          </div>

          {/* META */}
          <div className="flex items-center gap-3 flex-wrap text-xs font-semibold">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black tracking-wide ${statusPillClass}`}>
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block shrink-0" />}
              {statusLabel}
            </span>

            <div className="text-zinc-400 hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[11px] text-zinc-600 uppercase tracking-widest">Match-Kickoff</span>
              <span>{getISTKickoff()}</span>
            </div>

            <div className="text-zinc-700 hidden sm:block">·</div>

            <div className="text-zinc-400 hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[11px] text-zinc-600 uppercase tracking-widest">Prediction-Closes</span>
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
                  Live
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
              transition={{ duration: 0.2 }}
              className="text-zinc-600 text-lg leading-none ml-1"
            >
              ⌄
            </motion.span>
          </div>
        </div>

        {/* MOBILE: kickoff + close time row */}
        <div className="flex items-center gap-4 mt-3 sm:hidden text-xs text-zinc-500 font-semibold">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-zinc-700 uppercase tracking-widest">Match-Kickoff</span>
            <span>{getISTKickoff()}</span>
          </div>
          <div className="text-zinc-700">·</div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-zinc-700 uppercase tracking-widest">Prediction-Closes</span>
            <span className={locked ? "text-red-400" : ""}>{getCloseTime()}</span>
          </div>
        </div>
      </button>

      {/* EXPANDED */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25 }}
          className="border-t border-zinc-800/60 px-6 py-6"
        >
          {/* TIMING STRIP */}
          <div className="flex items-stretch gap-3 mb-6">
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Kickoff</div>
              <div className="text-sm font-black">{getISTKickoff()}</div>
            </div>
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Predictions Close</div>
              <div className={`text-sm font-black ${locked ? "text-red-400" : ""}`}>{getCloseTime()}</div>
            </div>
            <div
              className={`flex items-center justify-center px-5 rounded-2xl border font-black text-sm ${
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
                  {match.status === "PAUSED" ? "Half-time break" : "Match in progress"}
                </div>
                <div className="text-red-400/70 text-xs mt-0.5">Your prediction is locked in — wait for the final whistle.</div>
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
                <div className="text-yellow-300 font-black text-sm">Waiting for scores</div>
                <div className="text-yellow-400/70 text-xs mt-0.5">Your points will appear as soon as processing completes — leaderboard updates automatically.</div>
              </div>
            </div>
          )}

          {isPostponed && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-6">
              <span className="text-orange-400 text-lg shrink-0">📅</span>
              <div>
                <div className="text-orange-300 font-black text-sm">Match postponed</div>
                <div className="text-orange-400/70 text-xs mt-0.5">This match has been moved to a later date. Predictions are closed.</div>
              </div>
            </div>
          )}

          {isSuspended && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
              <span className="text-amber-400 text-lg shrink-0">⚠️</span>
              <div>
                <div className="text-amber-300 font-black text-sm">Match suspended</div>
                <div className="text-amber-400/70 text-xs mt-0.5">This match has been suspended. Check back later for updates.</div>
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
                    {b === "2x" ? "Tiki Taka Active" : b === "3x" ? "Hat Trick Active" : "G.O.A.T Active"}
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

          {/* MATCH EVENTS TIMELINE — shown for live and finished matches */}
          {(isLive || isFinished) && <EventTimeline match={match} />}
        </motion.div>
      )}
    </motion.div>
  );
}
