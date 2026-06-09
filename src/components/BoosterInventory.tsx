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
  const [loading, setLoading] = useState(false);

  const activeBooster = BOOSTERS.find((b) => b.key === assigning);

  const handleStamp = async (date: string) => {
    if (!assigning) return;
    setLoading(true);
    await onActivate(assigning, date);
    setAssigning(null);
    setLoading(false);
  };

  return (
    <div className="mb-14">
      {/* HEADER */}
      <div className="mb-8">
        <div className="text-zinc-500 uppercase tracking-[0.35em] text-xs font-black mb-3">
          Tournament Inventory
        </div>
        <h2 className="text-4xl md:text-5xl font-black">Power Boosters</h2>
      </div>

      {/* CARD GRID — always 3 equal columns, never broken by the picker */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        {BOOSTERS.map((booster) => {
          const used = usedBoosterTypes.includes(booster.key);
          const assignedDay = getDayAssigned(booster.key, activeDayBoosters);
          const isAssigning = assigning === booster.key;

          return (
            <motion.div
              key={booster.key}
              whileHover={used ? {} : { scale: 1.02 }}
              transition={{ duration: 0.15 }}
              className={`relative overflow-hidden rounded-3xl border p-6 flex flex-col h-full transition-all duration-300 ${
                used
                  ? "opacity-50 grayscale border-zinc-800 bg-zinc-950 cursor-not-allowed"
                  : isAssigning
                  ? `${booster.activeBorder} bg-gradient-to-br ${booster.glow} shadow-2xl`
                  : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
              }`}
            >
              {/* DOT TEXTURE */}
              <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="relative z-10 flex flex-col flex-1">
                <div className="text-4xl">{booster.icon}</div>

                <div className={`mt-4 text-xl font-black ${booster.text}`}>
                  {booster.title}
                </div>

                <div className="mt-2 text-sm text-zinc-500 leading-relaxed flex-1">
                  {booster.description}
                </div>

                <div className="mt-6">
                  {used ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em]">
                        STAMPED
                      </span>
                      {assignedDay && (
                        <span className="text-zinc-500 text-xs font-semibold">
                          {formatDay(assignedDay)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setAssigning(isAssigning ? null : booster.key)}
                      className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${
                        isAssigning
                          ? "bg-white text-black"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {isAssigning ? "✕ Cancel" : "Stamp to Day →"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* DAY PICKER — full-width panel below the grid, only shown when assigning */}
      <AnimatePresence>
        {assigning && activeBooster && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`mt-4 rounded-3xl border p-6 bg-gradient-to-br ${activeBooster.glow} ${activeBooster.activeBorder}`}
          >
            <div className={`text-xs font-black uppercase tracking-[0.25em] mb-4 ${activeBooster.text}`}>
              {activeBooster.icon} Pick a matchday for {activeBooster.title}
            </div>

            {visibleDays.length === 0 ? (
              <div className="text-zinc-500 text-sm">No matchdays available in the current window.</div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {visibleDays.map((date) => {
                  const alreadyActive = activeDayBoosters[date]?.includes(activeBooster.key);
                  return (
                    <button
                      key={date}
                      disabled={alreadyActive || loading}
                      onClick={() => handleStamp(date)}
                      className={`px-6 py-3 rounded-2xl border text-sm font-black transition-all ${
                        alreadyActive
                          ? "opacity-40 cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500"
                          : loading
                          ? "opacity-60 cursor-wait " + activeBooster.pill
                          : activeBooster.pill
                      }`}
                    >
                      {loading ? "Stamping..." : `${activeBooster.icon} ${formatDay(date)}`}
                      {alreadyActive && <span className="ml-2 text-[10px] opacity-60">Active</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
