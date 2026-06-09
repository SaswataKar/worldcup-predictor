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
    <div className="space-y-8">
      {/* SCORE SECTION */}
      <div className="bg-black/40 border border-zinc-800 rounded-[32px] p-8 md:p-10">
        <div className="text-sm uppercase tracking-[0.35em] text-zinc-400 font-black mb-10">
          Exact Score Prediction
        </div>

        <div className="flex items-center justify-center gap-10 md:gap-14 flex-wrap">
          {/* HOME */}
          <div className="flex flex-col items-center">
            <img
              src={match.team1_crest || "/placeholder-team.png"}
              alt={match.team1}
              className="w-20 h-20 md:w-24 md:h-24 object-contain mb-4"
            />
            <div className="text-2xl md:text-3xl font-black mb-6 text-center">{match.team1}</div>
            <input
              type="number"
              min="0"
              disabled={locked || predictionLocked}
              value={scoreData.home}
              onChange={(e) => updateScore("home", e.target.value)}
              className="w-24 h-24 md:w-32 md:h-32 rounded-[28px] bg-zinc-900 border border-zinc-700 text-center text-5xl md:text-6xl font-black outline-none focus:border-yellow-400 disabled:opacity-60"
            />
          </div>

          <div className="text-5xl md:text-7xl font-black text-zinc-700">-</div>

          {/* AWAY */}
          <div className="flex flex-col items-center">
            <img
              src={match.team2_crest || "/placeholder-team.png"}
              alt={match.team2}
              className="w-20 h-20 md:w-24 md:h-24 object-contain mb-4"
            />
            <div className="text-2xl md:text-3xl font-black mb-6 text-center">{match.team2}</div>
            <input
              type="number"
              min="0"
              disabled={locked || predictionLocked}
              value={scoreData.away}
              onChange={(e) => updateScore("away", e.target.value)}
              className="w-24 h-24 md:w-32 md:h-32 rounded-[28px] bg-zinc-900 border border-zinc-700 text-center text-5xl md:text-6xl font-black outline-none focus:border-yellow-400 disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* SUBMIT */}
      {!locked && !predictionLocked && (
        <div className="flex gap-5 flex-wrap">
          <button
            onClick={() => submitPrediction(match.id)}
            className="px-10 py-5 rounded-[24px] bg-yellow-400 text-black text-xl md:text-2xl font-black hover:scale-105 active:scale-[0.98] transition-all"
          >
            Submit Prediction
          </button>
        </div>
      )}

      {/* CANCEL */}
      {!locked && predictionLocked && (
        <div className="flex gap-5 flex-wrap">
          <button
            onClick={() => cancelPrediction(match.id)}
            className="px-8 py-5 rounded-[24px] bg-red-500/15 border border-red-500/30 text-red-300 text-xl md:text-2xl font-black"
          >
            ❌ Cancel
          </button>
        </div>
      )}
    </div>
  );
}
