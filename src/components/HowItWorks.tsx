"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocaleCtx } from "@/context/LocaleContext";
import { getT } from "@/lib/translations";

const STEP_META = [
  { icon: "📅", color: "text-sky-300", border: "border-sky-500/30", bg: "bg-sky-500/10", titleKey: "hiw.p1title" as const, bodyKey: "hiw.p1body" as const },
  { icon: "🎯", color: "text-yellow-300", border: "border-yellow-500/30", bg: "bg-yellow-500/10", titleKey: "hiw.p2title" as const, bodyKey: "hiw.p2body" as const },
  { icon: "⚡", color: "text-fuchsia-300", border: "border-fuchsia-500/30", bg: "bg-fuchsia-500/10", titleKey: "hiw.p3title" as const, bodyKey: "hiw.p3body" as const },
  { icon: "🏆", color: "text-emerald-300", border: "border-emerald-500/30", bg: "bg-emerald-500/10", titleKey: "hiw.p4title" as const, bodyKey: "hiw.p4body" as const },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(false);
  const { locale } = useLocaleCtx();
  const t = getT(locale);

  return (
    <div
      className={`mb-12 rounded-3xl border backdrop-blur-md overflow-hidden transition-all duration-300
        ${open
          ? "border-sky-500/25 shadow-[0_0_32px_6px_rgba(56,189,248,0.10),0_0_0_1px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.07)]"
          : "border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/[0.12] hover:shadow-[0_0_20px_4px_rgba(255,255,255,0.05),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]"
        }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between group px-6 py-5"
      >
        <div className="text-left">
          <div className="text-zinc-500 uppercase tracking-[0.35em] text-xs font-black mb-1">
            Game Guide
          </div>
          <h2 className="text-2xl font-black text-zinc-300 group-hover:text-white transition-colors">
            {t("hiw.title")}
          </h2>
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
            <div className="border-t border-white/[0.06] px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {STEP_META.map((step) => (
                  <div
                    key={step.titleKey}
                    className={`rounded-2xl border ${step.border} backdrop-blur-md p-5
                      shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.07)]`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{step.icon}</span>
                      <span className={`text-base font-black ${step.color}`}>{t(step.titleKey)}</span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{t(step.bodyKey)}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
