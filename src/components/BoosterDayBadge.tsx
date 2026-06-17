"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Match } from "@/types";
import { BOOSTER_META } from "@/lib/boosterMeta";

const BOOSTERS = [
  {
    key: "2x",
    title: "Tiki Taka",
    description: "Double all points earned on every prediction this matchday.",
    color: "text-yellow-300",
    border: "border-yellow-500/50",
    glow: "shadow-[0_0_18px_4px_rgba(234,179,8,0.30)]",
    bg: "bg-yellow-500/10",
  },
  {
    key: "3x",
    title: "Hat Trick Hero",
    description: "Triple all points earned on every prediction this matchday.",
    color: "text-fuchsia-300",
    border: "border-fuchsia-500/50",
    glow: "shadow-[0_0_18px_4px_rgba(192,38,211,0.30)]",
    bg: "bg-fuchsia-500/10",
  },
  {
    key: "draw",
    title: "G.O.A.T",
    description: "Double jackpot points (exact score hits) on this matchday.",
    color: "text-emerald-300",
    border: "border-emerald-500/50",
    glow: "shadow-[0_0_18px_4px_rgba(34,197,94,0.30)]",
    bg: "bg-emerald-500/10",
  },
];

type Props = {
  date: string;
  groupLabel: string;
  dayBoosters: string[];
  usedBoosterTypes: string[];
  isEligible: boolean; // active or next matchday
  dayMatches: Match[];
  onActivate: (boosterType: string, date: string) => Promise<void>;
  onRemove: (boosterType: string) => Promise<void>;
};

export default function BoosterDayBadge({
  date,
  groupLabel,
  dayBoosters,
  usedBoosterTypes,
  isEligible,
  dayMatches,
  onActivate,
  onRemove,
}: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const now = new Date();

  const kickoffs = dayMatches
    .map((m) => (m.kickoff_time ? new Date(m.kickoff_time).getTime() : Infinity))
    .filter((t) => t !== Infinity);
  const firstKickoff = kickoffs.length ? new Date(Math.min(...kickoffs)) : null;

  const windowOpen = firstKickoff
    ? now < new Date(firstKickoff.getTime() - 60 * 1000)
    : true;

  const allConsumed =
    dayMatches.length > 0 &&
    dayMatches.every((m) => m.status === "FINISHED" && m.processed);

  const hasBooster = dayBoosters.length > 0;
  const activeKey = hasBooster ? dayBoosters[0] : null;
  const activeMeta = activeKey ? BOOSTERS.find((b) => b.key === activeKey) : null;
  const activeIcon = activeKey ? (BOOSTER_META[activeKey]?.icon ?? "⚡") : null;

  // Boosters not yet used (or already assigned to this day — can swap)
  const availableBoosters = BOOSTERS.filter(
    (b) => !usedBoosterTypes.includes(b.key) || dayBoosters.includes(b.key)
  );

  const closeModal = () => { setOpen(false); setConfirming(null); };

  // ── Badge appearance ──────────────────────────────────────────────────────
  // Don't render anything for past days with no booster
  if (!isEligible && !hasBooster) return null;

  const closeTimeStr = firstKickoff
    ? firstKickoff.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
    : null;

  let badgeClass = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black transition-all ";
  let badgeContent: React.ReactNode;
  let clickable = false;

  if (allConsumed && hasBooster) {
    // Consumed — greyed out, no interaction
    badgeClass += "border-zinc-700/50 bg-zinc-900/40 text-zinc-600 opacity-50 cursor-default";
    badgeContent = <><span>{activeIcon}</span><span>{activeMeta?.title} · Used</span></>;
  } else if (hasBooster && !windowOpen) {
    // Locked in — red glow
    badgeClass += "border-red-500/50 bg-red-500/10 text-red-300 shadow-[0_0_12px_3px_rgba(239,68,68,0.25)] cursor-pointer";
    badgeContent = <><span>{activeIcon}</span><span>{activeMeta?.title} · Locked</span></>;
    clickable = true;
  } else if (hasBooster && windowOpen) {
    // Active, window open — gold glow
    badgeClass += `border-yellow-500/60 bg-yellow-500/10 text-yellow-300 shadow-[0_0_14px_4px_rgba(234,179,8,0.30)] cursor-pointer`;
    badgeContent = (
      <>
        <span>{activeIcon}</span>
        <span>{activeMeta?.title}</span>
        {closeTimeStr && (
          <span className="text-yellow-600/80 text-[10px] font-semibold">· closes {closeTimeStr}</span>
        )}
      </>
    );
    clickable = true;
  } else if (isEligible && windowOpen) {
    // No booster yet, can add
    badgeClass += "border-zinc-700/50 bg-zinc-900/60 text-zinc-500 hover:text-zinc-200 hover:border-zinc-500 cursor-pointer";
    badgeContent = <><span className="text-zinc-600">⚡</span><span>Add booster</span></>;
    clickable = true;
  } else if (isEligible && !windowOpen) {
    // Eligible day but window closed, no booster applied
    badgeClass += "border-red-500/20 bg-transparent text-red-500/50 cursor-default";
    badgeContent = <><span>⚡</span><span>Window closed</span></>;
  } else {
    return null;
  }

  return (
    <>
      <button onClick={() => clickable && setOpen(true)} className={badgeClass}>
        {badgeContent}
      </button>

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-xs font-black z-10"
              >
                ✕
              </button>

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-zinc-800/60">
                <div className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black mb-1">
                  Power Booster
                </div>
                <div className="text-white font-black text-xl pr-8">{groupLabel}</div>
                {firstKickoff && windowOpen && (
                  <div className="text-amber-400 text-xs font-semibold mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                    Window closes when first match kicks off ·{" "}
                    {firstKickoff.toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                      timeZoneName: "short",
                    })}
                  </div>
                )}
                {!windowOpen && (
                  <div className="text-red-400 text-xs font-semibold mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                    Window closed — matches have started
                  </div>
                )}
              </div>

              <div className="px-6 py-5">
                {confirming ? (
                  /* ── Confirm screen ── */
                  (() => {
                    const b = BOOSTERS.find((x) => x.key === confirming)!;
                    const icon = BOOSTER_META[b.key]?.icon ?? "⚡";
                    return (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-2xl border ${b.border} ${b.bg}`}>
                          <div className="text-3xl mb-2">{icon}</div>
                          <div className={`font-black text-lg ${b.color}`}>{b.title}</div>
                          <div className="text-zinc-400 text-sm mt-1">{b.description}</div>
                        </div>
                        <div className="text-zinc-400 text-sm">
                          Apply <span className="text-white font-bold">{b.title}</span> to{" "}
                          <span className="text-white font-bold">{groupLabel}</span>?
                          <br />
                          <span className="text-zinc-500 text-xs">
                            Once the first match kicks off, this cannot be removed.
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setConfirming(null)}
                            className="flex-1 py-3 rounded-2xl border border-zinc-700 text-zinc-400 font-black text-sm hover:border-zinc-500 transition-colors"
                          >
                            Back
                          </button>
                          <button
                            disabled={loading}
                            onClick={async () => {
                              setLoading(true);
                              try {
                                await onActivate(confirming, date);
                                closeModal();
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className={`flex-1 py-3 rounded-2xl border ${b.border} ${b.color} ${b.bg} font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50`}
                          >
                            {loading ? "Applying…" : "Confirm →"}
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : hasBooster && windowOpen ? (
                  /* ── Manage existing (window open) ── */
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl border ${activeMeta?.border} ${activeMeta?.bg}`}>
                      <div className="text-2xl mb-1">{activeIcon}</div>
                      <div className={`font-black ${activeMeta?.color}`}>
                        {activeMeta?.title} — Active
                      </div>
                      <div className="text-zinc-400 text-sm mt-1">{activeMeta?.description}</div>
                    </div>

                    {/* Swap options */}
                    {availableBoosters.filter((b) => b.key !== activeKey).length > 0 && (
                      <div>
                        <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">
                          Swap for
                        </div>
                        <div className="flex flex-col gap-2">
                          {availableBoosters
                            .filter((b) => b.key !== activeKey)
                            .map((b) => {
                              const icon = BOOSTER_META[b.key]?.icon ?? "⚡";
                              return (
                                <button
                                  key={b.key}
                                  onClick={() => setConfirming(b.key)}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${b.border} ${b.bg} text-left hover:opacity-80 transition-opacity`}
                                >
                                  <span className="text-xl shrink-0">{icon}</span>
                                  <div className="min-w-0">
                                    <div className={`font-black text-sm ${b.color}`}>{b.title}</div>
                                    <div className="text-zinc-500 text-xs truncate">{b.description}</div>
                                  </div>
                                  <span className="ml-auto text-zinc-600 shrink-0">→</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    <button
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await onRemove(activeKey!);
                          closeModal();
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 font-black text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Removing…" : "✕ Remove booster"}
                    </button>
                  </div>
                ) : hasBooster && !windowOpen ? (
                  /* ── Locked in view ── */
                  <div className={`p-4 rounded-2xl border ${activeMeta?.border} ${activeMeta?.bg} opacity-70`}>
                    <div className="text-2xl mb-1">{activeIcon}</div>
                    <div className={`font-black ${activeMeta?.color}`}>
                      {activeMeta?.title} — Locked in
                    </div>
                    <div className="text-zinc-400 text-sm mt-1">
                      Points will be applied automatically when matches finish processing.
                    </div>
                  </div>
                ) : (
                  /* ── Pick a booster ── */
                  <div className="space-y-3">
                    <div className="text-zinc-400 text-sm">
                      Pick a booster for this matchday. One use per tournament — choose wisely.
                    </div>
                    {availableBoosters.map((b) => {
                      const icon = BOOSTER_META[b.key]?.icon ?? "⚡";
                      return (
                        <button
                          key={b.key}
                          onClick={() => setConfirming(b.key)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${b.border} ${b.bg} text-left hover:opacity-80 transition-opacity`}
                        >
                          <span className="text-2xl shrink-0">{icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className={`font-black ${b.color}`}>{b.title}</div>
                            <div className="text-zinc-500 text-xs mt-0.5">{b.description}</div>
                          </div>
                          <span className="text-zinc-500 shrink-0 text-lg">→</span>
                        </button>
                      );
                    })}
                    {availableBoosters.length === 0 && (
                      <div className="text-zinc-500 text-sm text-center py-6">
                        All boosters have been used for this tournament.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
