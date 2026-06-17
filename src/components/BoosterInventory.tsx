"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocaleCtx } from "@/context/LocaleContext";
import { getT } from "@/lib/translations";

type Props = {
  usedBoosterTypes: string[];
  activeDayBoosters: Record<string, string[]>;
  activeMatchday: string | null;
  activeMatchdayLabel: string | null;
  nextMatchday: string | null;
  nextMatchdayLabel: string | null;
  activeMatchdayFirstKickoff: Date | null;
  isMatchdayConsumed: boolean;
  onActivate: (boosterType: string, date: string) => Promise<void>;
  onRemove: (boosterType: string) => Promise<void>;
};

const BOOSTERS = [
  {
    key: "2x",
    icon: "⚽",
    title: "Tiki Taka",
    description: "Double points for every prediction on the chosen matchday.",
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
    description: "Triple points for every prediction on the chosen matchday.",
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
    description: "Doubles all jackpot (exact score) points on the chosen matchday.",
    glow: "from-emerald-500/20 to-lime-500/10",
    border: "border-emerald-500/40",
    text: "text-emerald-300",
    activeBg: "bg-emerald-500/10",
    dot: "bg-emerald-400",
  },
];

const formatDay = (dateStr: string, locale: string) =>
  new Date(dateStr + "T12:00:00").toLocaleDateString(locale, {
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

const isPastDate = (dateStr: string) => {
  const today = new Date().toISOString().split("T")[0];
  return dateStr < today;
};

export default function BoosterInventory({
  usedBoosterTypes,
  activeDayBoosters,
  activeMatchday,
  activeMatchdayLabel,
  nextMatchday,
  nextMatchdayLabel,
  activeMatchdayFirstKickoff,
  isMatchdayConsumed,
  onActivate,
  onRemove,
}: Props) {
  const { locale } = useLocaleCtx();
  const t = getT(locale);
  const [open, setOpen] = useState(false);

  const availableCount = BOOSTERS.filter((b) => !usedBoosterTypes.includes(b.key)).length;

  // Boosters assigned to today's active matchday (pending — not yet consumed)
  const pendingBoosters = activeMatchday
    ? (activeDayBoosters[activeMatchday] || []).filter(() => !isMatchdayConsumed)
    : [];

  // Boosters permanently consumed (on a past/locked day)
  const consumedBoosters = usedBoosterTypes.filter((type) => {
    const assignedDate = getDayAssigned(type, activeDayBoosters);
    if (!assignedDate) return false;
    if (assignedDate === activeMatchday) return isMatchdayConsumed;
    return isPastDate(assignedDate) || isMatchdayConsumed;
  });

  return (
    <div
      className={`mb-14 rounded-3xl border backdrop-blur-md overflow-hidden transition-all duration-300 relative
        ${open
          ? "border-yellow-500/25 shadow-[0_0_36px_8px_rgba(234,179,8,0.12),0_0_0_1px_rgba(234,179,8,0.22),inset_0_1px_0_rgba(255,255,255,0.07)]"
          : "border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/[0.12] hover:shadow-[0_0_20px_4px_rgba(255,255,255,0.05),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]"
        }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none z-10" />

      {/* HEADER — always visible, acts as toggle */}
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
            {availableCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                {availableCount} {t("booster.available")}
              </span>
            )}
            {pendingBoosters.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-black">
                {pendingBoosters.length} {t("booster.activated")}
              </span>
            )}
            {consumedBoosters.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-zinc-700/40 border border-zinc-600/40 text-zinc-400 text-xs font-black">
                {consumedBoosters.length} {t("booster.consumed")}
              </span>
            )}
          </div>

          <p className="text-zinc-500 text-sm mt-2">
            {activeMatchday ? (
              <>
                Active matchday:{" "}
                <span className="text-white font-bold">{activeMatchdayLabel ?? activeMatchday}</span>
                {!isMatchdayConsumed && activeMatchdayFirstKickoff && (
                  <span className="ml-2 text-amber-400 text-xs font-semibold">
                    · Window closes {activeMatchdayFirstKickoff.toLocaleTimeString(locale, {
                      hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short",
                    })}
                  </span>
                )}
                {isMatchdayConsumed && (
                  <span className="ml-2 text-red-400 text-xs font-bold">· Window closed</span>
                )}
              </>
            ) : (
              <span className="text-zinc-600">No matchday currently open for predictions</span>
            )}
          </p>
          {nextMatchday && nextMatchdayLabel && (
            <p className="text-zinc-600 text-xs mt-1">
              Next matchday:{" "}
              <span className="text-zinc-400 font-semibold">{nextMatchdayLabel}</span>
              {isMatchdayConsumed && <span className="text-zinc-600"> — pre-assign below</span>}
            </p>
          )}
        </div>

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
              {/* Hint */}
              <div className="flex items-center gap-2 mt-4 mb-5 px-4 py-3 rounded-2xl bg-yellow-500/8 border border-yellow-500/20">
                <span className="text-yellow-400 text-base shrink-0">⚡</span>
                <p className="text-yellow-300/80 text-xs font-semibold leading-snug">
                  To apply a booster, tap the <span className="text-yellow-300 font-black">Add booster</span> badge on any upcoming matchday header.
                  One use per tournament — locked once the first match kicks off.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                {BOOSTERS.map((booster) => {
                  const assignedDay = getDayAssigned(booster.key, activeDayBoosters);
                  const isAssigned = !!assignedDay;
                  const isAssignedPast = isAssigned && isPastDate(assignedDay!);
                  const isConsumed = isAssignedPast || (isAssigned && assignedDay === activeMatchday && isMatchdayConsumed);

                  const glowMap: Record<string, string> = {
                    "2x":  "shadow-[0_0_28px_6px_rgba(234,179,8,0.20),0_0_0_1px_rgba(234,179,8,0.30)]",
                    "3x":  "shadow-[0_0_28px_6px_rgba(192,38,211,0.20),0_0_0_1px_rgba(192,38,211,0.30)]",
                    draw:  "shadow-[0_0_28px_6px_rgba(34,197,94,0.20),0_0_0_1px_rgba(34,197,94,0.30)]",
                  };
                  let cardClass = "border-white/[0.08]";
                  if (isAssigned && !isConsumed) cardClass = `${booster.border} ${glowMap[booster.key] ?? ""}`;
                  if (isConsumed) cardClass = "border-white/[0.04] opacity-40 grayscale";

                  // Status label
                  let statusDot: React.ReactNode = null;
                  let statusText = "";
                  if (isConsumed) {
                    statusText = "Consumed";
                  } else if (isAssigned) {
                    const dayLabel = assignedDay === activeMatchday
                      ? (activeMatchdayLabel ?? activeMatchday ?? "")
                      : assignedDay === nextMatchday
                      ? (nextMatchdayLabel ?? assignedDay ?? "")
                      : (assignedDay ?? "");
                    statusDot = <span className={`w-1.5 h-1.5 rounded-full ${booster.dot} animate-pulse shrink-0`} />;
                    statusText = dayLabel;
                  } else {
                    statusText = "Available";
                  }

                  return (
                    <div
                      key={booster.key}
                      className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 flex flex-col transition-all duration-300 ${cardClass}`}
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                      <div className="relative z-10 flex flex-col flex-1">
                        <div className="flex items-start justify-between">
                          <div className="text-4xl">{booster.icon}</div>
                          {isConsumed ? (
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500">Consumed</span>
                          ) : isAssigned ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white">
                              {statusDot} Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400">Available</span>
                          )}
                        </div>

                        <div className={`mt-4 text-xl font-black ${booster.text}`}>{booster.title}</div>
                        <div className="mt-2 text-sm text-zinc-500 leading-relaxed flex-1">{booster.description}</div>

                        <div className="mt-4 pt-4 border-t border-white/[0.06]">
                          {isAssigned && !isConsumed ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${booster.text}`}>Applied to</span>
                              <span className="text-xs text-zinc-300 font-semibold truncate">{statusText}</span>
                            </div>
                          ) : isConsumed ? (
                            <span className="text-zinc-600 text-xs font-semibold">Used · points already applied</span>
                          ) : (
                            <span className="text-zinc-600 text-xs font-semibold">Tap ⚡ on a matchday header to apply</span>
                          )}
                        </div>
                      </div>
                    </div>
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
