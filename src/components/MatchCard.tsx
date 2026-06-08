"use client";

import { motion } from "framer-motion";

import PredictionControls from "./PredictionControls";

type MatchCardProps = {
  match: any;

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
  const expanded =
    expandedMatches[
      match.id
    ];

  const prediction =
    predictions[
      match.id
    ];

  // REAL-TIME LOCK
  const kickoffTime =
    match.kickoff_time
      ? new Date(
          match.kickoff_time
        )
      : null;

  const now =
    new Date();

  const hasStarted =
    kickoffTime
      ? now >= kickoffTime
      : false;

  const locked =
    hasStarted ||
    match.status ===
      "FINISHED" ||
    match.status ===
      "LIVE" ||
    match.status ===
      "IN_PLAY";

  const matchDate =
    match.kickoff_time
      ? new Date(
          match.kickoff_time
        )
          .toISOString()
          .split("T")[0]
      : null;

  const goatActive =
    matchDate &&
    goatDays.includes(
      matchDate
    );

  // COUNTDOWN
  const getCountdown =
    () => {
      if (
        !match.kickoff_time
      ) {
        return "TBD";
      }

      const now =
        new Date();

      const kickoff =
        new Date(
          match.kickoff_time
        );

      const diff =
        kickoff.getTime() -
        now.getTime();

      if (diff <= 0) {
        return match.status ===
          "FINISHED"
          ? "FULL TIME"
          : "LIVE / CLOSED";
      }

      const hours =
        Math.floor(
          diff /
            (1000 *
              60 *
              60)
        );

      const minutes =
        Math.floor(
          (diff %
            (1000 *
              60 *
              60)) /
            (1000 * 60)
        );

      return `${hours}h ${minutes}m`;
    };

  // IST TIME
  const getISTKickoff =
    () => {
      if (
        !match.kickoff_time
      ) {
        return "TBD";
      }

      return new Date(
        match.kickoff_time
      ).toLocaleString(
        "en-IN",
        {
          timeZone:
            "Asia/Kolkata",

          day: "numeric",

          month: "short",

          hour: "numeric",

          minute:
            "2-digit",

          hour12: true,
        }
      );
    };

  return (
    <motion.div
      layout
      transition={{
        duration: 0.35,
      }}
      className="
        overflow-hidden
        rounded-[32px]
        border
        border-zinc-800
        bg-gradient-to-b
        from-zinc-900
        to-black
        shadow-2xl
      "
    >
      {/* COLLAPSED */}
      <button
        onClick={() =>
          setExpandedMatches({
            ...expandedMatches,

            [match.id]:
              !expanded,
          })
        }
        className="
          w-full
          p-6
          text-left
          hover:bg-white/[0.02]
          transition-all
        "
      >
        <div className="flex justify-between items-center gap-6 flex-wrap">
          {/* LEFT */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* TEAM 1 */}
            <div className="flex items-center gap-3">
              <img
                src={
                  match.team1_crest ||
                  "/placeholder-team.png"
                }
                className="w-12 h-12 object-contain"
              />

              <div className="text-xl font-black">
                {match.team1}
              </div>
            </div>

            {/* SCORE */}
            <div className="min-w-[90px] flex justify-center">
              {match.status ===
                "FINISHED" ||
              match.status ===
                "LIVE" ||
              match.status ===
                "IN_PLAY" ? (
                <div className="text-3xl font-black">
                  {
                    match.team1_score
                  }
                  {" - "}
                  {
                    match.team2_score
                  }
                </div>
              ) : (
                <div className="text-zinc-600 font-black text-lg">
                  VS
                </div>
              )}
            </div>

            {/* TEAM 2 */}
            <div className="flex items-center gap-3">
              <img
                src={
                  match.team2_crest ||
                  "/placeholder-team.png"
                }
                className="w-12 h-12 object-contain"
              />

              <div className="text-xl font-black">
                {match.team2}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-sm font-semibold text-zinc-400 flex-wrap">
              {/* TIME */}
              <div>
                {getISTKickoff()}
              </div>

              <div className="text-zinc-700">
                •
              </div>

              {/* STATUS */}
              <div
                className={`
                  font-black

                  ${
                    match.status ===
                      "LIVE" ||
                    match.status ===
                      "IN_PLAY"
                      ? "text-red-400"
                      : match.status ===
                        "FINISHED"
                      ? "text-green-400"
                      : locked
                      ? "text-red-400"
                      : "text-emerald-400"
                  }
                `}
              >
                {match.status ===
                  "LIVE" ||
                match.status ===
                  "IN_PLAY"
                  ? "LIVE"
                  : match.status ===
                    "FINISHED"
                  ? "FT"
                  : locked
                  ? "LOCKED"
                  : "OPEN"}
              </div>

              {/* PREDICTION */}
              {prediction && (
                <>
                  <div className="text-zinc-700">
                    •
                  </div>

                  <div className="font-black text-white">
                    {
                      prediction.predicted_team1_score
                    }
                    -
                    {
                      prediction.predicted_team2_score
                    }
                  </div>
                </>
              )}

              {/* POINTS */}
              {prediction?.processed && (
                <>
                  <div className="text-zinc-700">
                    •
                  </div>

                  <div className="text-yellow-300 font-black">
                    +
                    {
                      prediction.awarded_points
                    }
                    🏆
                  </div>
                </>
              )}

              {/* BOOSTERS */}
              {(goatActive ||
                prediction?.booster_used !==
                  "none") &&
                prediction?.booster_used && (
                  <>
                    <div className="text-zinc-700">
                      •
                    </div>

                    <div className="flex items-center gap-1 text-lg">
                      {prediction?.booster_used ===
                        "2x" &&
                        "⚽"}

                      {prediction?.booster_used ===
                        "3x" &&
                        "🔥"}

                      {goatActive &&
                        "🐐"}
                    </div>
                  </>
                )}

              {/* COUNTDOWN */}
              <div className="text-zinc-700">
                •
              </div>

              <div
                className={
                  locked
                    ? "text-red-400 font-black"
                    : "text-zinc-500"
                }
              >
                ⏳{" "}
                {getCountdown()}
              </div>
            </div>

            {/* CHEVRON */}
            <motion.div
              animate={{
                rotate:
                  expanded
                    ? 180
                    : 0,
              }}
              transition={{
                duration: 0.25,
              }}
              className="text-2xl text-zinc-600"
            >
              ⌄
            </motion.div>
          </div>
        </div>
      </button>

      {/* EXPANDED */}
      {expanded && (
        <motion.div
          initial={{
            opacity: 0,
            height: 0,
          }}
          animate={{
            opacity: 1,
            height: "auto",
          }}
          transition={{
            duration: 0.3,
          }}
          className="
            border-t
            border-zinc-800
            p-8
          "
        >
          {/* MATCH INFO */}
          <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-zinc-500 text-sm uppercase tracking-[0.25em]">
                Match Kickoff
              </div>

              <div className="text-2xl font-black mt-2">
                🇮🇳{" "}
                {getISTKickoff()}
              </div>
            </div>

            <div
              className={`
                border
                px-5
                py-3
                rounded-2xl
                font-black

                ${
                  locked
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : "bg-black border-zinc-700"
                }
              `}
            >
              ⏳{" "}
              {getCountdown()}
            </div>
          </div>

          {/* CONTROLS */}
          <PredictionControls
            match={match}
            locked={locked}
            predictions={
              predictions
            }
            predictedScores={
              predictedScores
            }
            setPredictedScores={
              setPredictedScores
            }
            submitPrediction={
              submitPrediction
            }
            cancelPrediction={
              cancelPrediction
            }
            selectedInventoryBooster={
              selectedInventoryBooster
            }
            setSelectedInventoryBooster={
              setSelectedInventoryBooster
            }
            usedBoosters={
              usedBoosters
            }
          />
        </motion.div>
      )}
    </motion.div>
  );
}
