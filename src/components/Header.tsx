"use client";

import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import ISTClock from "./ISTClock";
import { useLocale, LOCALES } from "@/hooks/useLocale";

export default function Header({ user, hideNav }: { user?: any; hideNav?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeLeagueName, setActiveLeagueName] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale } = useLocale();

  // Don't render language label until locale is hydrated — prevents "English" flash
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const raw = Cookies.get("activeLeague");
    if (raw) {
      try { setActiveLeagueName(JSON.parse(raw).name ?? null); } catch {}
    } else {
      setActiveLeagueName(null);
    }
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const tabs = [
    { label: "Predictor", href: "/" },
    { label: "Fixtures", href: "/fixtures" },
    { label: "Teams", href: "/teams" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Leagues", href: "/leagues" },
  ];

  const currentLang = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const LangList = ({ onPick }: { onPick: () => void }) => (
    <>
      <div className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black border-b border-white/[0.06]">
        Language
      </div>
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => { setLocale(l.code); onPick(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold transition-colors text-left
            ${locale === l.code
              ? "bg-yellow-400/10 text-yellow-300"
              : "text-zinc-300 hover:bg-white/[0.05]"
            }`}
        >
          <span className="text-base">{l.flag}</span>
          <span>{l.label}</span>
          {locale === l.code && <span className="ml-auto text-yellow-400 text-xs">✓</span>}
        </button>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 mb-10">
      <div className="backdrop-blur-xl bg-black/60 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* ── ROW 1: logo + clock | lang + league chip + logout ── */}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          {/* LEFT: logo + clock */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="shrink-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight whitespace-nowrap flex items-center gap-2">
                <img src="/wc2026-loho.png" alt="FIFA WC 2026" className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-lg" />
                Pro Predictor
              </h1>
              <p className="text-zinc-400 text-xs mt-0.5">
                {user?.name ? `Welcome, ${user.name}` : "FIFA World Cup 2026"}
              </p>
            </div>
            <ISTClock locale={locale} />
          </div>

          {/* RIGHT: lang picker + league chip + logout */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Desktop language picker */}
            <div ref={langRef} className="relative hidden sm:block">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-white/[0.08]
                  text-xs font-black text-zinc-300 hover:bg-zinc-700 transition-all whitespace-nowrap"
                title="Change language"
              >
                <span>{mounted ? currentLang.flag : "🌐"}</span>
                <span className="text-zinc-400">{mounted ? currentLang.label : "…"}</span>
                <span className="text-zinc-600 text-[10px]">{langOpen ? "▲" : "▼"}</span>
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-white/[0.10] bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
                  <LangList onPick={() => setLangOpen(false)} />
                </div>
              )}
            </div>

            {/* Mobile language picker — globe icon */}
            <div className="relative sm:hidden">
              <button
                onClick={() => setMobileLangOpen((v) => !v)}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-800/80 border border-white/[0.08]
                  text-base hover:bg-zinc-700 transition-all"
                title="Change language"
              >
                {mounted ? currentLang.flag : "🌐"}
              </button>

              {mobileLangOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMobileLangOpen(false)}
                  />
                  {/* Sheet */}
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/[0.10] bg-zinc-900/98 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
                    <LangList onPick={() => setMobileLangOpen(false)} />
                  </div>
                </>
              )}
            </div>

            {!hideNav && activeLeagueName && (
              <Link
                href="/leagues?select=1"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-white/[0.08]
                  text-xs font-black text-zinc-300 hover:bg-zinc-700 transition-all whitespace-nowrap"
                title="Switch league"
              >
                <span className="text-zinc-500 text-[10px]">⚡</span>
                {activeLeagueName}
                <span className="text-zinc-600 text-[10px]">↻</span>
              </Link>
            )}
            <button
              onClick={() => {
                Cookies.remove("user");
                Cookies.remove("activeLeague");
                router.push("/login");
              }}
              className="shrink-0 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>

        {/* ── ROW 2: nav tabs ── */}
        {!hideNav && (
          <div className="border-t border-zinc-800/60 px-2 sm:px-3 py-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const active = pathname === tab.href || (tab.href === "/leagues" && pathname.startsWith("/leagues"));
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                      active
                        ? "bg-yellow-400 text-black shadow-lg scale-105"
                        : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
