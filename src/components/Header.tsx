"use client";

import Cookies from "js-cookie";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function Header({
  user,
}: {
  user: any;
}) {
  const pathname =
    usePathname();

  const router = useRouter();

  const tabs = [
    {
      label: "Predictor",
      href: "/",
    },

    {
      label: "Fixtures",
      href: "/fixtures",
    },

    {
      label: "Leaderboard",
      href: "/leaderboard",
    },
  ];

  return (
    <header className="sticky top-0 z-50 mb-10">
      <div className="backdrop-blur-xl bg-black/60 border border-zinc-800 rounded-2xl px-6 py-4 flex justify-between items-center shadow-2xl">
        {/* LEFT */}
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            ⚽ Pro Predictor
          </h1>

          <p className="text-zinc-400 text-sm mt-1">
            Welcome, {user?.name}
          </p>
        </div>

        {/* CENTER NAV */}
        <div className="flex items-center gap-3 bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
          {tabs.map((tab) => {
            const active =
              pathname ===
              tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-5 py-2 rounded-xl font-bold transition-all duration-200 ${
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

        {/* RIGHT */}
        <button
          onClick={() => {
            Cookies.remove("user");

            router.push("/login");
          }}
          className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl font-bold transition-all duration-200 hover:scale-105"
        >
          Logout
        </button>
      </div>
    </header>
  );
}