"use client";

import type { Match, Prediction, PredictedScore } from "@/types";

type Props = {
  match: Match;
  locked: boolean;
  predictions: Record<number, Prediction>;
  predictedScores: Record<number, PredictedScore>;
  setPredictedScores: (scores: Record<number, PredictedScore>) => void;
  submitPrediction: (matchId: number) => void;
  cancelPrediction: (matchId: number) => void;
};

const getResult = (home: number | string, away: number | string) => {
  if (home === "" || away === "") return null;
  const h = Number(home);
  const a = Number(away);
  if (h > a) return "home";
  if (a > h) return "away";
  return "draw";
};

export default function PredictionControls({
  match,
  locked,
  predictions,
  predictedScores,
  setPredictedScores,
  submitPrediction,
  cancelPrediction,
}: Props) {
  const prediction = predictions[match.id];
  const predictionLocked = !!prediction?.match_id;
  const scoreData = predictedScores[match.id] || { home: "", away: "" };
  const result = getResult(scoreData.home, scoreData.away);
  const inputDisabled = locked || predictionLocked;

  const updateScore = (side: "home" | "away", value: string) => {
    if (value !== "" && Number(value) < 0) return;
    setPredictedScores({
      ...predictedScores,
      [match.id]: {
        ...scoreData,
        [side]: value === "" ? "" : Number(value),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* SCOREBOARD CARD */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">

        {/* LABEL */}
        <div className="px-8 pt-7 pb-0">
          <span className="text-[10px] uppercase tracking-[0.35em] text-zinc-600 font-black">
            Predict the Score
          </span>
        </div>

        {/* MAIN SCOREBOARD */}
        <div className="flex items-center px-6 py-8 gap-4">

          {/* HOME TEAM */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/5 blur-xl scale-150" />
              <img
                src={match.team1_crest || "/placeholder-team.png"}
                alt={match.team1}
                className="relative w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg"
              />
            </div>
            <span
              className={`text-sm md:text-base font-black text-center leading-tight transition-colors ${
                result === "home" ? "text-white" : result ? "text-zinc-500" : "text-zinc-300"
              }`}
            >
              {match.team1}
            </span>
          </div>

          {/* SCORE INPUTS */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            {/* HOME INPUT */}
            <div className="relative group">
              <div
                className={`absolute inset-0 rounded-2xl blur-md transition-opacity ${
                  result === "home" ? "bg-yellow-400/20 opacity-100" : "opacity-0"
                }`}
              />
              <input
                type="number"
                min="0"
                disabled={inputDisabled}
                value={scoreData.home}
                onChange={(e) => updateScore("home", e.target.value)}
                placeholder="–"
                className={`
                  relative w-16 h-16 md:w-20 md:h-20
                  rounded-2xl border text-center
                  text-4xl md:text-5xl font-black tabular-nums
                  outline-none transition-all
                  bg-zinc-900
                  placeholder:text-zinc-700
                  disabled:cursor-not-allowed
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  ${
                    inputDisabled
                      ? "border-zinc-800 text-zinc-500"
                      : result === "home"
                      ? "border-yellow-400/60 text-yellow-300 focus:border-yellow-400"
                      : "border-zinc-700 text-white focus:border-zinc-500"
                  }
                `}
              />
            </div>

            {/* SEPARATOR */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            </div>

            {/* AWAY INPUT */}
            <div className="relative group">
              <div
                className={`absolute inset-0 rounded-2xl blur-md transition-opacity ${
                  result === "away" ? "bg-yellow-400/20 opacity-100" : "opacity-0"
                }`}
              />
              <input
                type="number"
                min="0"
                disabled={inputDisabled}
                value={scoreData.away}
                onChange={(e) => updateScore("away", e.target.value)}
                placeholder="–"
                className={`
                  relative w-16 h-16 md:w-20 md:h-20
                  rounded-2xl border text-center
                  text-4xl md:text-5xl font-black tabular-nums
                  outline-none transition-all
                  bg-zinc-900
                  placeholder:text-zinc-700
                  disabled:cursor-not-allowed
                  [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  ${
                    inputDisabled
                      ? "border-zinc-800 text-zinc-500"
                      : result === "away"
                      ? "border-yellow-400/60 text-yellow-300 focus:border-yellow-400"
                      : "border-zinc-700 text-white focus:border-zinc-500"
                  }
                `}
              />
            </div>
          </div>

          {/* AWAY TEAM */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/5 blur-xl scale-150" />
              <img
                src={match.team2_crest || "/placeholder-team.png"}
                alt={match.team2}
                className="relative w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg"
              />
            </div>
            <span
              className={`text-sm md:text-base font-black text-center leading-tight transition-colors ${
                result === "away" ? "text-white" : result ? "text-zinc-500" : "text-zinc-300"
              }`}
            >
              {match.team2}
            </span>
          </div>
        </div>

        {/* RESULT BANNER */}
        <div
          className={`px-8 py-4 border-t border-zinc-800/60 flex items-center justify-center transition-all ${
            result ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {result === "home" && (
            <div className="flex items-center gap-2 text-sm font-black text-yellow-300">
              <span>{match.team1} wins</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 font-semibold">
                {String(scoreData.home)} – {String(scoreData.away)}
              </span>
            </div>
          )}
          {result === "away" && (
            <div className="flex items-center gap-2 text-sm font-black text-yellow-300">
              <span>{match.team2} wins</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 font-semibold">
                {String(scoreData.home)} – {String(scoreData.away)}
              </span>
            </div>
          )}
          {result === "draw" && (
            <div className="flex items-center gap-2 text-sm font-black text-zinc-300">
              <span>Draw</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 font-semibold">
                {String(scoreData.home)} – {String(scoreData.away)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SUBMIT */}
      {!locked && !predictionLocked && (
        <button
          onClick={() => submitPrediction(match.id)}
          className="w-full py-5 rounded-3xl bg-yellow-400 text-black text-lg font-black hover:bg-yellow-300 active:scale-[0.98] transition-all"
        >
          Submit Prediction
        </button>
      )}

      {/* CANCEL */}
      {!locked && predictionLocked && (
        <button
          onClick={() => cancelPrediction(match.id)}
          className="px-8 py-4 rounded-3xl bg-red-500/10 border border-red-500/25 text-red-400 font-black hover:bg-red-500/20 transition-all"
        >
          ✕ Cancel Prediction
        </button>
      )}
    </div>
  );
}
