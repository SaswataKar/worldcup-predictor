"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  usedBoosterTypes: string[];
  activeDayBoosters: Record<string, string[]>;
  visibleDays: string[];
  onActivate: (boosterType: string, date: string) => Promise<void>;
};

const BOOSTERS = [
  {
    key: "2x",
    icon: "⚽",
    title: "Tiki Taka",
    description: "Double points for every prediction on the selected matchday.",
    glow: "from-yellow-500/20 to-orange-500/10",
    border: "border-yellow-500/40",
    activeBorder: "border-yellow-500",
    text: "text-yellow-300",
    pill: "bg-yellow-500/15 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/25",
  },
  {
    key: "3x",
    icon: "🔥",
    title: "Hat Trick Hero",
    description: "Triple points for every prediction on the selected matchday.",
    glow: "from-fuchsia-500/20 to-purple-500/10",
    border: "border-fuchsia-500/40",
    activeBorder: "border-fuchsia-500",
    text: "text-fuchsia-300",
    pill: "bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/25",
  },
  {
    key: "draw",
    icon: "🐐",
    title: "G.O.A.T",
    description: "Doubles all jackpot (exact score) points on the selected matchday.",
    glow: "from-emerald-500/20 to-lime-500/10",
    border: "border-emerald-500/40",
    activeBorder: "border-emerald-500",
    text: "text-emerald-300",
    pill: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25",
  },
];

const formatDay = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const getDayAssigned = (key: string, activeDayBoosters: Record<string, string[]>) => {
  for (const [date, types] of Object.entries(activeDayBoosters)) {
    if (types.includes(key)) return date;
  }
  return null;
};

export default function BoosterInventory({
  usedBoosterTypes,
  activeDayBoosters,
  visibleDays,
  onActivate,
}: Props) {
  const [assigning, setAssigning] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleStamp = async (boosterKey: string, date: string) => {
    setLoading(boosterKey);
    await onActivate(boosterKey, date);
    setAssigning(null);
    setLoading(null);
  };

  return (
    <div className="mb-14">
      <div className="mb-8">
        <div className="text-zinc-500 uppercase tracking-[0.35em] text-xs font-black mb-3">
          Tournament Inventory
        </div>
        <h2 className="text-4xl md:text-5xl font-black">Power Boosters</h2>
      </div>

      <div className="flex flex-wrap gap-5">
        {BOOSTERS.map((booster) => {
          const used = usedBoosterTypes.includes(booster.key);
          const assignedDay = getDayAssigned(booster.key, activeDayBoosters);
          const isAssigning = assigning === booster.key;

          return (
            <div key={booster.key} className="flex flex-col gap-3 w-full sm:w-[220px]">
              <motion.div
                layout
                className={`relative overflow-hidden rounded-[28px] border p-5 text-left transition-all duration-300 ${
                  used
                    ? "opacity-50 grayscale border-zinc-800 bg-zinc-950 cursor-not-allowed"
                    : isAssigning
                    ? `${booster.activeBorder} bg-gradient-to-br ${booster.glow} shadow-2xl`
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                {/* DOT TEXTURE */}
                <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10">
                  <div className="text-4xl">{booster.icon}</div>

                  <div className={`mt-5 text-2xl leading-tight font-black ${booster.text}`}>
                    {booster.title}
                  </div>

                  <div className="mt-3 text-sm text-zinc-500 leading-relaxed">
                    {booster.description}
                  </div>

                  <div className="mt-6 flex justify-between items-end">
                    {used ? (
                      <div className="flex flex-col gap-1">
                        <div className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-xl text-[10px] font-black tracking-[0.2em] inline-block">
                          STAMPED
                        </div>
                        {assignedDay && (
                          <div className="text-zinc-500 text-xs font-semibold">
                            {formatDay(assignedDay)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigning(isAssigning ? null : booster.key)}
                        className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                          isAssigning
                            ? "bg-white text-black"
                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        {isAssigning ? "Cancel" : "Stamp to Day"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* DAY PICKER */}
              <AnimatePresence>
                {isAssigning && !used && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-2"
                  >
                    {visibleDays.length === 0 ? (
                      <div className="text-zinc-600 text-xs px-1">No matchdays available</div>
                    ) : (
                      visibleDays.map((date) => {
                        const alreadyHasThisBooster = activeDayBoosters[date]?.includes(booster.key);
                        return (
                          <button
                            key={date}
                            disabled={!!alreadyHasThisBooster || loading === booster.key}
                            onClick={() => handleStamp(booster.key, date)}
                            className={`w-full px-4 py-3 rounded-2xl border text-sm font-black text-left transition-all ${
                              alreadyHasThisBooster
                                ? "opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500"
                                : booster.pill
                            } border`}
                          >
                            {loading === booster.key ? (
                              <span className="opacity-60">Stamping...</span>
                            ) : (
                              <>
                                {booster.icon} {formatDay(date)}
                                {alreadyHasThisBooster && (
                                  <span className="ml-2 text-[10px] opacity-60">Already active</span>
                                )}
                              </>
                            )}
                          </button>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
