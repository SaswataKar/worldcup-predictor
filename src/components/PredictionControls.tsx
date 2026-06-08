"use client";

import { motion } from "framer-motion";

type Props = {
  match: any;

  locked: boolean;

  predictions: any;

  predictedScores: any;

  setPredictedScores: any;

  submitPrediction: any;

  cancelPrediction: any;

  selectedInventoryBooster: any;

  setSelectedInventoryBooster: any;

  usedBoosters: any;
};

export default function PredictionControls({
  match,

  locked,

  predictions,

  predictedScores,

  setPredictedScores,

  submitPrediction,

  cancelPrediction,

  selectedInventoryBooster,

  setSelectedInventoryBooster,

  usedBoosters,
}: Props) {
  const prediction =
    predictions[
      match.id
    ];

  const scoreData =
    predictedScores[
      match.id
    ] || {
      home: "",

      away: "",
    };

  const boosterOptions = [
    {
      key: "2x",

      icon: "⚽",

      title:
        "TIKI TAKA",

      description:
        "Double Points",

      glow:
        "from-yellow-500/20 to-orange-500/10",

      border:
        "border-yellow-500/40",

      text:
        "text-yellow-300",
    },

    {
      key: "3x",

      icon: "🔥",

      title:
        "HAT TRICK HERO",

      description:
        "Triple Points",

      glow:
        "from-fuchsia-500/20 to-purple-500/10",

      border:
        "border-fuchsia-500/40",

      text:
        "text-fuchsia-300",
    },
  ].filter(
    (booster) =>
      !usedBoosters.includes(
        booster.key
      ) ||
      prediction
        ?.booster_used ===
        booster.key
  );

  const updateScore = (
    side:
      | "home"
      | "away",
    value: string
  ) => {
    if (
      value !== "" &&
      Number(value) < 0
    ) {
      return;
    }

    setPredictedScores({
      ...predictedScores,

      [match.id]: {
        ...scoreData,

        [side]:
          value === ""
            ? ""
            : Number(
                value
              ),
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* SCORE SECTION */}
      <div className="bg-black/40 border border-zinc-800 rounded-[32px] p-8 md:p-10">
        <div className="text-sm uppercase tracking-[0.35em] text-zinc-400 font-black mb-10">
          Exact Score
          Prediction
        </div>

        <div className="flex items-center justify-center gap-10 md:gap-14 flex-wrap">
          {/* HOME */}
          <div className="flex flex-col items-center">
            <img
              src={
                match.team1_crest ||
                "/placeholder-team.png"
              }
              alt={
                match.team1
              }
              className="w-20 h-20 md:w-24 md:h-24 object-contain mb-4"
            />

            <div className="text-2xl md:text-3xl font-black mb-6 text-center">
              {match.team1}
            </div>

            <input
              type="number"
              min="0"
              disabled={
                locked
              }
              value={
                scoreData.home
              }
              onChange={(
                e
              ) =>
                updateScore(
                  "home",
                  e.target
                    .value
                )
              }
              className="
                w-24
                h-24
                md:w-32
                md:h-32
                rounded-[28px]
                bg-zinc-900
                border
                border-zinc-700
                text-center
                text-5xl
                md:text-6xl
                font-black
                outline-none
                focus:border-yellow-400
              "
            />
          </div>

          {/* DASH */}
          <div className="text-5xl md:text-7xl font-black text-zinc-700">
            -
          </div>

          {/* AWAY */}
          <div className="flex flex-col items-center">
            <img
              src={
                match.team2_crest ||
                "/placeholder-team.png"
              }
              alt={
                match.team2
              }
              className="w-20 h-20 md:w-24 md:h-24 object-contain mb-4"
            />

            <div className="text-2xl md:text-3xl font-black mb-6 text-center">
              {match.team2}
            </div>

            <input
              type="number"
              min="0"
              disabled={
                locked
              }
              value={
                scoreData.away
              }
              onChange={(
                e
              ) =>
                updateScore(
                  "away",
                  e.target
                    .value
                )
              }
              className="
                w-24
                h-24
                md:w-32
                md:h-32
                rounded-[28px]
                bg-zinc-900
                border
                border-zinc-700
                text-center
                text-5xl
                md:text-6xl
                font-black
                outline-none
                focus:border-yellow-400
              "
            />
          </div>
        </div>
      </div>

      {/* BOOSTERS */}
      {!locked && (
        <div className="bg-black/40 border border-zinc-800 rounded-[32px] p-8">
          <div className="text-sm uppercase tracking-[0.35em] text-zinc-400 font-black mb-8">
            Match Boosters
          </div>

          <div className="flex gap-6 flex-wrap">
            {boosterOptions.map(
              (
                booster
              ) => {
                const selected =
                  selectedInventoryBooster ===
                  booster.key;

                return (
                  <motion.button
                    whileHover={{
                      scale: 1.03,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    key={
                      booster.key
                    }
                    disabled={
                      locked
                    }
                    onClick={() =>
                      setSelectedInventoryBooster(
                        selected
                          ? null
                          : booster.key
                      )
                    }
                    className={`
                      relative
                      overflow-hidden
                      rounded-[28px]
                      border
                      px-6
                      py-6
                      min-w-[280px]
                      text-left
                      transition-all
                      duration-300

                      ${
                        selected
                          ? `${booster.border} bg-gradient-to-br ${booster.glow} shadow-2xl`
                          : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                      }
                    `}
                  >
                    <div className="relative z-10">
                      <div
                        className={`flex items-center gap-3 text-xl font-black tracking-[0.15em] ${booster.text}`}
                      >
                        <span className="text-3xl">
                          {
                            booster.icon
                          }
                        </span>

                        {
                          booster.title
                        }
                      </div>

                      <div className="mt-4 text-zinc-400">
                        {
                          booster.description
                        }
                      </div>

                      {selected && (
                        <div className="mt-5 inline-flex items-center gap-2 bg-white text-black px-3 py-1 rounded-xl text-xs font-black">
                          ACTIVE
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      {!locked && (
        <div className="flex gap-5 flex-wrap">
          <button
            onClick={() =>
              submitPrediction(
                match.id
              )
            }
            className="
              px-10
              py-5
              rounded-[24px]
              bg-yellow-400
              text-black
              text-xl
              md:text-2xl
              font-black
              hover:scale-105
              active:scale-[0.98]
              transition-all
            "
          >
            Submit
            Prediction
          </button>

          {prediction && (
            <button
              onClick={() =>
                cancelPrediction(
                  match.id
                )
              }
              className="
                px-8
                py-5
                rounded-[24px]
                bg-red-500/15
                border
                border-red-500/30
                text-red-300
                text-xl
                md:text-2xl
                font-black
              "
            >
              ❌ Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
