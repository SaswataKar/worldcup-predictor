"use client";

import { motion } from "framer-motion";
import PredictionControls from "./PredictionControls";

type MatchCardProps = {
  match: any;
  canPredict: (kickoffTime: string) => boolean;
  predictions: any;
  predictedScores: any;
  setPredictedScores: any;
  expandedMatches: any;
  setExpandedMatches: any;
  submitPrediction: any;
  cancelPrediction: any;
  selectedInventoryBooster: any;
  setSelectedInventoryBooster: any;
  usedBoosters: any;
  setUsedBoosters: any;
  goatDays: any[];
};

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
  selectedInventoryBooster,
  setSelectedInventoryBooster,
  usedBoosters,
  setUsedBoosters,
  goatDays,
}: MatchCardProps) {
  const expanded = expandedMatches[match.id];
  const prediction = predictions[match.id];

  const kickoffTime = match.kickoff_time ? new Date(match.kickoff_time) : null;
  const now = new Date();

  // Single source of truth for lock state:
  // locked = match has started/finished OR canPredict returns false
  const isOpen = canPredict(match.kickoff_time);
  const hasStarted = kickoffTime
    ? now >= new Date(kickoffTime.getTime() - 1 * 60 * 1000)
    : false;

  const locked =
    !isOpen ||
    hasStarted ||
    match.status === "FINISHED" ||
    match.status === "LIVE" ||
    match.status === "IN_PLAY";

  const matchDate = match.kickoff_time
    ? new Date(match.kickoff_time).toISOString().split("T")[0]
    : null;

  const goatActive = matchDate && goatDays.includes(matchDate);

  const getCountdown = () => {
    if (!match.kickoff_time) return "TBD";
    const diff = kickoffTime!.getTime() - now.getTime();
    if (diff <= 0) {
      return match.status === "FINISHED" ? "Full Time" : "Live / Closed";
    }
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

  const statusLabel =
    match.status === "LIVE" || match.status === "IN_PLAY"
      ? "Live"
      : match.status === "FINISHED"
      ? "FT"
      : hasStarted
      ? "Locked"
      : isOpen
      ? "Open"
      : "Locked";

  const statusPillClass =
    match.status === "LIVE" || match.status === "IN_PLAY"
      ? "border-red-500/40 bg-red-500/10 text-red-400"
      : match.status === "FINISHED"
      ? "border-zinc-700 bg-zinc-800/50 text-zinc-500"
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
        onClick={() =>
          setExpandedMatches({ ...expandedMatches, [match.id]: !expanded })
        }
        className="w-full px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* TEAMS + SCORE */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2">
              <img
                src={match.team1_crest || "/placeholder-team.png"}
                className="w-8 h-8 object-contain"
              />
              <span className="text-base font-black truncate">{match.team1}</span>
            </div>

            <div className="flex items-center justify-center min-w-[56px]">
              {match.status === "FINISHED" ||
              match.status === "LIVE" ||
              match.status === "IN_PLAY" ? (
                <span className="text-xl font-black tabular-nums">
                  {match.team1_score} – {match.team2_score}
                </span>
              ) : (
                <span className="text-zinc-600 font-black text-sm">VS</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <img
                src={match.team2_crest || "/placeholder-team.png"}
                className="w-8 h-8 object-contain"
              />
              <span className="text-base font-black truncate">{match.team2}</span>
            </div>
          </div>

          {/* META */}
          <div className="flex items-center gap-3 flex-wrap text-xs font-semibold">

            {/* STATUS PILL */}
            <span className={`px-2.5 py-1 rounded-full border text-[11px] font-black tracking-wide ${statusPillClass}`}>
              {statusLabel}
            </span>

            {/* KICKOFF */}
            <div className="text-zinc-400 hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[11px] text-zinc-600 uppercase tracking-widest">Match-Kickoff</span>
              <span>{getISTKickoff()}</span>
            </div>

            <div className="text-zinc-700 hidden sm:block">·</div>

            {/* CLOSE TIME */}
            <div className="text-zinc-400 hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[11px] text-zinc-600 uppercase tracking-widest">Prediction-Closes</span>
              <span className={locked ? "text-red-400" : "text-zinc-400"}>
                {getCloseTime()}
              </span>
            </div>

            <div className="text-zinc-700">·</div>

            {/* COUNTDOWN */}
            <span className={`tabular-nums ${locked ? "text-red-400" : "text-zinc-500"}`}>
              ⏳ {getCountdown()}
            </span>

            {/* PREDICTION SCORE */}
            {prediction && (
              <>
                <div className="text-zinc-700">·</div>
                <span className="text-white font-black">
                  {prediction.predicted_team1_score}–{prediction.predicted_team2_score}
                </span>
              </>
            )}

            {/* POINTS */}
            {prediction?.processed && (
              <>
                <div className="text-zinc-700">·</div>
                <span className="text-yellow-300 font-black">
                  +{prediction.awarded_points} 🏆
                </span>
              </>
            )}

            {/* BOOSTERS */}
            {prediction?.booster_used && prediction.booster_used !== "none" && (
              <>
                <div className="text-zinc-700">·</div>
                <span className="text-lg leading-none">
                  {prediction.booster_used === "2x" && "⚽"}
                  {prediction.booster_used === "3x" && "🔥"}
                </span>
              </>
            )}

            {goatActive && (
              <>
                <div className="text-zinc-700">·</div>
                <span className="text-lg leading-none">🐐</span>
              </>
            )}

            {/* CHEVRON */}
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
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                Kickoff
              </div>
              <div className="text-sm font-black">{getISTKickoff()}</div>
            </div>

            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                Predictions Close
              </div>
              <div className={`text-sm font-black ${locked ? "text-red-400" : ""}`}>
                {getCloseTime()}
              </div>
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

          {/* CONTROLS */}
          <PredictionControls
            match={match}
            locked={locked}
            predictions={predictions}
            predictedScores={predictedScores}
            setPredictedScores={setPredictedScores}
            submitPrediction={submitPrediction}
            cancelPrediction={cancelPrediction}
            selectedInventoryBooster={selectedInventoryBooster}
            setSelectedInventoryBooster={setSelectedInventoryBooster}
            usedBoosters={usedBoosters}
          />
        </motion.div>
      )}
    </motion.div>
  );
}