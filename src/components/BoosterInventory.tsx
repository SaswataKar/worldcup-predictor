"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  usedBoosterTypes: string[];
  activeDayBoosters: Record<string, string[]>;
  activeMatchday: string | null;
  isMatchdayConsumed: boolean;
  onActivate: (boosterType: string, date: string) => Promise<void>;
  onRemove: (boosterType: string) => Promise<void>;
};

const BOOSTERS = [
  {
    key: "2x",
    icon: "⚽",
    title: "Tiki Taka",
    description: "Double points for every prediction on the active matchday.",
    glow: "from-yellow-500/20 to-orange-500/10",
    border: "border-yellow-500/40",
    text: "text-yellow-300",
    activeBg: "bg-yellow-500/10",
  },
  {
    key: "3x",
    icon: "🔥",
    title: "Hat Trick Hero",
    description: "Triple points for every prediction on the active matchday.",
    glow: "from-fuchsia-500/20 to-purple-500/10",
    border: "border-fuchsia-500/40",
    text: "text-fuchsia-300",
    activeBg: "bg-fuchsia-500/10",
  },
  {
    key: "draw",
    icon: "🐐",
    title: "G.O.A.T",
    description: "Doubles all jackpot (exact score) points on the active matchday.",
    glow: "from-emerald-500/20 to-lime-500/10",
    border: "border-emerald-500/40",
    text: "text-emerald-300",
    activeBg: "bg-emerald-500/10",
  },
];

const formatDay = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
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
  activeMatchday,
  isMatchdayConsumed,
  onActivate,
  onRemove,
}: Props) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const handleToggle = async (boosterKey: string, isActive: boolean) => {
    setLoadingKey(boosterKey);
    try {
      if (isActive) {
        await onRemove(boosterKey);
      } else if (activeMatchday) {
        await onActivate(boosterKey, activeMatchday);
      }
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="mb-14">
      {/* HEADER */}
      <div className="mb-8">
        <div className="text-zinc-500 uppercase tracking-[0.35em] text-xs font-black mb-3">
          Tournament Inventory
        </div>
        <h2 className="text-4xl md:text-5xl font-black">Power Boosters</h2>
        {activeMatchday ? (
          <p className="text-zinc-500 text-sm mt-2">
            Active matchday: <span className="text-white font-bold">{formatDay(activeMatchday)}</span>
          </p>
        ) : (
          <p className="text-zinc-600 text-sm mt-2">No matchday currently open for predictions.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        {BOOSTERS.map((booster) => {
          const assignedDay = getDayAssigned(booster.key, activeDayBoosters);
          const isActiveToday = !!assignedDay && assignedDay === activeMatchday;
          const isUsedElsewhere = !!assignedDay && assignedDay !== activeMatchday;
          const isLoading = loadingKey === booster.key;

          // Card appearance
          let cardClass = "border-zinc-800 bg-zinc-900";
          if (isActiveToday) cardClass = `${booster.border} bg-gradient-to-br ${booster.glow} shadow-2xl`;
          if (isUsedElsewhere) cardClass = "border-zinc-800 bg-zinc-950 opacity-50 grayscale";

          return (
            <motion.div
              key={booster.key}
              whileHover={isUsedElsewhere ? {} : { scale: 1.02 }}
              transition={{ duration: 0.15 }}
              className={`relative overflow-hidden rounded-3xl border p-6 flex flex-col h-full transition-all duration-300 ${cardClass}`}
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
                  {isUsedElsewhere ? (
                    /* Stamped on a past/locked day — consumed, no action */
                    <div className="flex flex-col gap-1">
                      <span className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] inline-block">
                        CONSUMED
                      </span>
                      <span className="text-zinc-500 text-xs font-semibold mt-1">
                        {formatDay(assignedDay!)}
                      </span>
                    </div>
                  ) : isActiveToday && isMatchdayConsumed ? (
                    /* Active on today but match has started — consumed, no cancel */
                    <div className="flex flex-col gap-1">
                      <span className="bg-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] inline-block">
                        CONSUMED
                      </span>
                      <span className={`text-xs font-semibold mt-1 ${booster.text}`}>
                        {formatDay(activeMatchday!)} · Match started
                      </span>
                    </div>
                  ) : isActiveToday ? (
                    /* Active on today's matchday — cancellable */
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em]">
                          ACTIVE
                        </span>
                        <span className={`text-xs font-semibold ${booster.text}`}>
                          {formatDay(activeMatchday!)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggle(booster.key, true)}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-2xl text-sm font-black bg-zinc-800/80 text-zinc-300 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 border border-transparent transition-all disabled:opacity-50"
                      >
                        {isLoading ? "Removing..." : "✕ Cancel"}
                      </button>
                    </div>
                  ) : (
                    /* Available — apply to active matchday */
                    <button
                      onClick={() => handleToggle(booster.key, false)}
                      disabled={!activeMatchday || isLoading}
                      className="px-5 py-2.5 rounded-2xl text-sm font-black bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isLoading
                        ? "Applying..."
                        : !activeMatchday
                        ? "No active matchday"
                        : "Apply to Today →"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
