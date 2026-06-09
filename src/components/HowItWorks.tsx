"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    icon: "📅",
    title: "Prediction Window",
    color: "text-sky-300",
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    lines: [
      "Predictions open at midnight the day before each match.",
      "They close exactly 1 minute before kick-off — no late entries.",
      "You can edit or cancel any prediction while it's still open.",
    ],
  },
  {
    icon: "🎯",
    title: "Scoring",
    color: "text-yellow-300",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/10",
    lines: [
      "Exact score (e.g. 2–1): 2 pts. A 0–0 exact score gives 1 pt.",
      "Correct result (right winner/draw, wrong scoreline): 1 pt.",
      "Wrong result: 0 pts.",
      "Points are calculated once the match status becomes FINISHED.",
    ],
  },
  {
    icon: "⚡",
    title: "Power Boosters",
    color: "text-fuchsia-300",
    border: "border-fuchsia-500/30",
    bg: "bg-fuchsia-500/10",
    lines: [
      "Each booster is once-per-tournament — use it wisely.",
      "⚽ Tiki Taka (2×): doubles all points for every match that matchday.",
      "🔥 Hat Trick Hero (3×): triples all points for every match that matchday.",
      "🐐 G.O.A.T: doubles jackpot points (exact score, ≥2 pts) only.",
      "You can stack all three on the same day — order applied: G.O.A.T → 2× → 3×.",
      "A booster is consumed the moment any match on that day reaches kick-off.",
      "Cancel it before kick-off to return it to your inventory.",
    ],
  },
  {
    icon: "🏆",
    title: "Leaderboard",
    color: "text-emerald-300",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    lines: [
      "Rankings update automatically after every processed match.",
      "Leaderboard refreshes every 30 seconds — no manual reload needed.",
      "Exact predictions and correct results are tracked separately.",
    ],
  },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-12">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between group"
      >
        <div className="text-left">
          <div className="text-zinc-500 uppercase tracking-[0.35em] text-xs font-black mb-1">
            Game Guide
          </div>
          <h2 className="text-2xl font-black text-zinc-300 group-hover:text-white transition-colors">
            How it works
          </h2>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:border-zinc-700 transition-colors ml-4"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2.5}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="how-it-works"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {STEPS.map((step) => (
                <div
                  key={step.title}
                  className={`rounded-3xl border ${step.border} ${step.bg} p-6`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{step.icon}</span>
                    <span className={`text-base font-black ${step.color}`}>{step.title}</span>
                  </div>
                  <ul className="space-y-2">
                    {step.lines.map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-400 leading-relaxed">
                        <span className="text-zinc-600 mt-0.5 shrink-0">›</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
