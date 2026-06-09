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
  ];

  return (
    <header className="sticky top-0 z-50 mb-10">
      {/* TOP ROW: logo + clock + logout */}
      <div className="backdrop-blur-xl bg-black/60 border border-zinc-800 rounded-2xl px-6 py-4 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          {/* LEFT: logo + clock */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight whitespace-nowrap flex items-center gap-2">
                <img src="/wc2026-loho.png" alt="FIFA WC 2026" className="w-9 h-9 object-contain drop-shadow-lg" />
                Pro Predictor
              </h1>
              <p className="text-zinc-400 text-xs mt-0.5 truncate">
                {user?.name ? `Welcome, ${user.name}` : "FIFA World Cup 2026"}
              </p>
            </div>
            <ISTClock />
          </div>

          {/* RIGHT: nav + logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* NAV — hidden on very small screens, shown md+ */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
              {tabs.map((tab) => {
                const active = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
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

            <button
              onClick={() => {
                Cookies.remove("user");
                router.push("/login");
              }}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>

        {/* MOBILE NAV — shown only on small screens below the top row */}
        <div className="flex sm:hidden items-center gap-1 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 mt-3 overflow-x-auto">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-yellow-400 text-black shadow"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}