"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    icon: "📅",
    color: "text-sky-300",
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    glow: "shadow-[0_0_20px_4px_rgba(56,189,248,0.10)]",
    title: "When can I predict?",
    body: "The prediction window opens 24 hours before each match kicks off and locks exactly 1 minute before kickoff. You can edit your prediction any time while the window is open — just re-submit and it overwrites the old one.",
    example: "Match kicks off at 9:00 PM → window opens 9:00 PM the day before and locks at 8:59 PM on match day.",
  },
  {
    icon: "🎯",
    color: "text-yellow-300",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/10",
    glow: "shadow-[0_0_20px_4px_rgba(234,179,8,0.10)]",
    title: "How are points scored?",
    body: "You earn points based on how accurate your prediction is. There are two ways to score:",
    bullets: [
      { label: "Exact score", detail: "You predicted the precise final score → 2 points", tag: "2 pts", tagColor: "bg-yellow-500/20 text-yellow-300" },
      { label: "Correct result", detail: "Right winner (or draw) but wrong scoreline → 1 point", tag: "1 pt", tagColor: "bg-sky-500/20 text-sky-300" },
      { label: "Wrong result", detail: "Predicted the wrong winner → 0 points", tag: "0 pts", tagColor: "bg-zinc-700/60 text-zinc-400" },
    ],
    example: "You predict 2–1. Final score is 2–1 → 2 pts. If final is 3–1 → 1 pt. If final is 1–2 → 0 pts.",
  },
  {
    icon: "⚔️",
    color: "text-amber-300",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    glow: "shadow-[0_0_20px_4px_rgba(245,158,11,0.10)]",
    title: "Knockout predictions",
    body: "From the Round of 32 onwards, matches must have a winner. You can predict a decisive score or toggle Penalty Shootout if you think it'll go to pens.",
    bullets: [
      { label: "Decisive score", detail: "Predict a non-draw score (e.g. 2–1) — normal scoring applies", tag: "Normal", tagColor: "bg-sky-500/20 text-sky-300" },
      { label: "⚽ Penalty Shootout", detail: "Toggle on → predict the ET draw score AND the PK score", tag: "Bonus", tagColor: "bg-amber-500/20 text-amber-300" },
      { label: "Exact PK score", detail: "Nail the exact penalty score → 3 bonus points (jackpot)", tag: "3 pts", tagColor: "bg-yellow-500/20 text-yellow-300" },
      { label: "Correct PK winner", detail: "Right team wins on pens but wrong PK score → 1 point", tag: "1 pt", tagColor: "bg-sky-500/20 text-sky-300" },
    ],
    example: "You predict 1–1 AET, penalties 5–3 for Brazil. Actual: 1–1 AET, pens 5–3 Brazil → 2 pts (exact ET score) + 3 pts (exact PK score) = 5 pts!",
  },
  {
    icon: "⚡",
    color: "text-fuchsia-300",
    border: "border-fuchsia-500/30",
    bg: "bg-fuchsia-500/10",
    glow: "shadow-[0_0_20px_4px_rgba(192,38,211,0.10)]",
    title: "What are Power Boosters?",
    body: "You get 3 boosters for the entire tournament — one of each type. Assign a booster to any matchday before the first match of that day starts. You can move it freely until then.",
    bullets: [
      { label: "⚽ Tiki Taka", detail: "All your predictions that day score 2× points", tag: "2×", tagColor: "bg-yellow-500/20 text-yellow-300" },
      { label: "🔥 Hat Trick Hero", detail: "All your predictions that day score 3× points", tag: "3×", tagColor: "bg-fuchsia-500/20 text-fuchsia-300" },
      { label: "🐐 G.O.A.T", detail: "Exact score (jackpot) points are doubled that day", tag: "2× jackpot", tagColor: "bg-emerald-500/20 text-emerald-300" },
    ],
    example: "Hat Trick Hero on a 3-match day: predict all 3 correctly → 9 pts instead of 3. Use boosters on days with the most matches for maximum impact.",
  },
  {
    icon: "🏆",
    color: "text-emerald-300",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    glow: "shadow-[0_0_20px_4px_rgba(34,197,94,0.10)]",
    title: "Leaderboard & Leagues",
    body: "All players compete on the global leaderboard. You can also create or join a private league with a 6-character code to compete in a smaller group — your friends, your office, whoever.",
    bullets: [
      { label: "Global leaderboard", detail: "Everyone on the app ranks here by total points", tag: "Public", tagColor: "bg-sky-500/20 text-sky-300" },
      { label: "Private leagues", detail: "Share a code, your group gets their own ranking", tag: "Invite only", tagColor: "bg-fuchsia-500/20 text-fuchsia-300" },
    ],
    example: "Points update automatically after each match result is confirmed. Go to Leagues in the header to create or join a private league.",
  },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("hiw-seen");
    if (!seen) {
      setIsNew(true);
      setOpen(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("hiw-seen", "1");
    setIsNew(false);
    setOpen(false);
  }

  return (
    <div
      className={`mb-12 rounded-3xl border backdrop-blur-md overflow-hidden transition-all duration-300 relative
        ${open
          ? "border-sky-500/25 shadow-[0_0_32px_6px_rgba(56,189,248,0.10),0_0_0_1px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.07)]"
          : "border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/[0.12]"
        }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none z-10" />

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between group px-6 py-5"
      >
        <div className="text-left">
          <div className="text-zinc-500 uppercase tracking-[0.35em] text-xs font-black mb-1">Game Guide</div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-black text-zinc-300 group-hover:text-white transition-colors">
              How It Works
            </h2>
            {isNew && (
              <span className="px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                New — read me
              </span>
            )}
          </div>
        </div>

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-500 group-hover:border-white/[0.14] group-hover:text-zinc-300 transition-colors ml-4"
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
            <div className="border-t border-white/[0.06] px-4 sm:px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {STEPS.map((step, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border ${step.border} backdrop-blur-md p-5 flex flex-col gap-3
                      shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.07)] ${step.glow}`}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center text-xl shrink-0`}>
                        {step.icon}
                      </div>
                      <span className={`text-base font-black ${step.color}`}>{step.title}</span>
                    </div>

                    {/* Body */}
                    <p className="text-sm text-zinc-400 leading-relaxed">{step.body}</p>

                    {/* Bullets */}
                    {step.bullets && (
                      <div className="space-y-2">
                        {step.bullets.map((b, j) => (
                          <div key={j} className="flex items-start gap-3">
                            <span className={`mt-0.5 shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-black ${b.tagColor}`}>
                              {b.tag}
                            </span>
                            <div>
                              <span className="text-xs font-black text-white">{b.label} </span>
                              <span className="text-xs text-zinc-500">{b.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Example */}
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Example</div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{step.example}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Got it button — only shown on first open */}
              {isNew && (
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={dismiss}
                    className="px-8 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-black text-sm transition-all
                      shadow-[0_0_20px_6px_rgba(56,189,248,0.25)]"
                  >
                    Got it, let's predict! ⚽
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
