"use client";

import Cookies from "js-cookie";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ISTClock from "./ISTClock";

export default function Header({ user }: { user?: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { label: "Predictor", href: "/" },
    { label: "Fixtures", href: "/fixtures" },
    { label: "Teams", href: "/teams" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Leagues", href: "/leagues" },
  ];

  return (
    <header className="sticky top-0 z-50 mb-10">
      <div className="backdrop-blur-xl bg-black/60 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* ── ROW 1: logo + clock | logout ── */}
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          {/* LEFT: logo + clock — never shrinks */}
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
            <ISTClock />
          </div>

          {/* RIGHT: logout only */}
          <button
            onClick={() => {
              Cookies.remove("user");
              router.push("/login");
            }}
            className="shrink-0 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 whitespace-nowrap"
          >
            Logout
          </button>
        </div>

        {/* ── ROW 2: nav tabs — full width, always visible ── */}
        <div className="border-t border-zinc-800/60 px-2 sm:px-3 py-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
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

      </div>
    </header>
  );
}
