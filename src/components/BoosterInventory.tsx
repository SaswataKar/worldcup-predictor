"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    dot: "bg-yellow-400",
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
    dot: "bg-fuchsia-400",
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
    dot: "bg-emerald-400",
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
  const [open, setOpen] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const availableCount = BOOSTERS.filter((b) => !usedBoosterTypes.includes(b.key)).length;

  // Boosters assigned to the active matchday that haven't been consumed yet
  const pendingBoosters = activeMatchday
    ? (activeDayBoosters[activeMatchday] || []).filter(() => !isMatchdayConsumed)
    : [];

  // Boosters that are permanently consumed (assigned to a past/locked day)
  const consumedBoosters = usedBoosterTypes.filter((type) => {
    const assignedDate = getDayAssigned(type, activeDayBoosters);
    if (!assignedDate) return false;
    // Consumed if it's on the active matchday and that day is consumed, or it's on a different (past) day
    if (assignedDate === activeMatchday) return isMatchdayConsumed;
    return true;
  });

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
    <div
      className={`mb-14 rounded-3xl border backdrop-blur-md overflow-hidden transition-all duration-300 relative
        ${open
          ? "border-yellow-500/25 shadow-[0_0_36px_8px_rgba(234,179,8,0.12),0_0_0_1px_rgba(234,179,8,0.22),inset_0_1px_0_rgba(255,255,255,0.07)]"
          : "border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/[0.12] hover:shadow-[0_0_20px_4px_rgba(255,255,255,0.05),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]"
        }`}
    >
      {/* top-edge glass highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none z-10" />

      {/* SECTION HEADER — always visible, acts as toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between group px-6 py-5"
      >
        <div className="text-left">
          <div className="text-zinc-500 uppercase tracking-[0.35em] text-xs font-black mb-1">
            Tournament Inventory
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-4xl md:text-5xl font-black">Power Boosters</h2>
            {/* Status chips inline with heading */}
            {availableCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                {availableCount} available
              </span>
            )}
            {pendingBoosters.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-black">
                {pendingBoosters.length} active
              </span>
            )}
            {consumedBoosters.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-zinc-700/40 border border-zinc-600/40 text-zinc-400 text-xs font-black">
                {consumedBoosters.length} consumed
              </span>
            )}
          </div>

          {/* Status line — always visible below heading */}
          <p className="text-zinc-500 text-sm mt-2">
            {activeMatchday ? (
              <>
                Active matchday:{" "}
                <span className="text-white font-bold">{formatDay(activeMatchday)}</span>
                {isMatchdayConsumed && (
                  <span className="ml-2 text-red-400 text-xs font-bold">· Boosters consumed</span>
                )}
              </>
            ) : (
              <span className="text-zinc-600">No matchday currently open for predictions</span>
            )}
          </p>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-md flex items-center justify-center text-zinc-500 group-hover:border-white/[0.14] group-hover:text-zinc-300 transition-colors ml-4"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2.5}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </button>

      {/* COLLAPSIBLE CARDS */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="booster-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-3 sm:px-6 pb-6">
            {/* One-per-day note */}
            <p className="text-zinc-600 text-xs font-semibold mt-4 mb-4">
              ⚡ One booster per matchday — swap freely before the first match kicks off.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
              {BOOSTERS.map((booster) => {
                const assignedDay = getDayAssigned(booster.key, activeDayBoosters);
                const isActiveToday = !!assignedDay && assignedDay === activeMatchday;
                const isUsedElsewhere = !!assignedDay && assignedDay !== activeMatchday;
                const isLoading = loadingKey === booster.key;

                // Is a DIFFERENT booster already active for today?
                const todayBoosterType = activeMatchday ? (activeDayBoosters[activeMatchday] || [])[0] ?? null : null;
                const isDayTakenByOther = !!todayBoosterType && !isActiveToday && !isUsedElsewhere;

                const glowMap: Record<string, string> = {
                  "2x":  "shadow-[0_0_28px_6px_rgba(234,179,8,0.20),0_0_0_1px_rgba(234,179,8,0.30),inset_0_1px_0_rgba(255,255,255,0.08)]",
                  "3x":  "shadow-[0_0_28px_6px_rgba(192,38,211,0.20),0_0_0_1px_rgba(192,38,211,0.30),inset_0_1px_0_rgba(255,255,255,0.08)]",
                  draw:  "shadow-[0_0_28px_6px_rgba(34,197,94,0.20),0_0_0_1px_rgba(34,197,94,0.30),inset_0_1px_0_rgba(255,255,255,0.08)]",
                };
                let cardClass = "border-white/[0.08] backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.04)]";
                if (isActiveToday) cardClass = `${booster.border} backdrop-blur-md ${glowMap[booster.key] ?? ""}`;
                if (isUsedElsewhere) cardClass = "border-white/[0.04] backdrop-blur-md opacity-40 grayscale";

                return (
                  <motion.div
                    key={booster.key}
                    whileHover={isUsedElsewhere ? {} : { scale: 1.02 }}
                    transition={{ duration: 0.15 }}
                    className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 flex flex-col h-full transition-all duration-300 ${cardClass}`}
                  >
                    {/* top-edge glass highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

                    <div className="relative z-10 flex flex-col flex-1">
                      <div className="flex items-start justify-between">
                        <div className="text-4xl">{booster.icon}</div>
                        {isActiveToday && !isMatchdayConsumed && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white">
                            <span className={`w-1.5 h-1.5 rounded-full ${booster.dot} animate-pulse`} />
                            Active
                          </span>
                        )}
                        {(isActiveToday && isMatchdayConsumed) || isUsedElsewhere ? (
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">
                            Consumed
                          </span>
                        ) : null}
                      </div>

                      <div className={`mt-4 text-xl font-black ${booster.text}`}>
                        {booster.title}
                      </div>

                      <div className="mt-2 text-sm text-zinc-500 leading-relaxed flex-1">
                        {booster.description}
                      </div>

                      <div className="mt-5">
                        {isUsedElsewhere ? (
                          <div className="flex flex-col gap-1">
                            <span className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] inline-block">
                              CONSUMED
                            </span>
                            <span className="text-zinc-500 text-xs font-semibold mt-1">
                              Used on {formatDay(assignedDay!)}
                            </span>
                          </div>
                        ) : isActiveToday && isMatchdayConsumed ? (
                          <div className="flex flex-col gap-1">
                            <span className="bg-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] inline-block">
                              CONSUMED
                            </span>
                            <span className={`text-xs font-semibold mt-1 ${booster.text}`}>
                              {formatDay(activeMatchday!)} · Match started
                            </span>
                          </div>
                        ) : isActiveToday ? (
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
                        ) : isDayTakenByOther ? (
                          // Different booster active today — offer swap
                          <button
                            onClick={() => handleToggle(booster.key, false)}
                            disabled={isLoading}
                            className={`w-full px-5 py-2.5 rounded-2xl text-sm font-black border ${booster.border} ${booster.text} bg-white/[0.04] hover:bg-white/[0.08] transition-all disabled:opacity-50`}
                          >
                            {isLoading ? "Swapping..." : "↔ Apply instead"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggle(booster.key, false)}
                            disabled={!activeMatchday || isLoading}
                            className="w-full px-5 py-2.5 rounded-2xl text-sm font-black bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
