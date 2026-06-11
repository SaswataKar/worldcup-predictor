"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import Header from "@/components/Header";
import PageWrapper from "@/components/PageWrapper";

import { useLocaleCtx } from "@/context/LocaleContext";
import { getT } from "@/lib/translations";

type LeaderEntry = {
  id: number;
  user_id: number;
  username: string;
  total_points: number;
  exact_predictions: number;
  correct_results: number;
};

type ActiveLeague = { id: string | null; name: string; code: string | null };

const RANK_CONFIG: Record<number, { glow: string; border: string; badge: string }> = {
  0: {
    badge: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    border: "border-yellow-500/30",
    glow: "shadow-[0_0_36px_8px_rgba(234,179,8,0.18),0_0_0_1px_rgba(234,179,8,0.30),inset_0_1px_0_rgba(255,255,255,0.08)]",
  },
  1: {
    badge: "bg-zinc-400/10 text-zinc-200 border border-zinc-400/25",
    border: "border-zinc-400/20",
    glow: "shadow-[0_0_28px_6px_rgba(161,161,170,0.12),0_0_0_1px_rgba(161,161,170,0.22),inset_0_1px_0_rgba(255,255,255,0.07)]",
  },
  2: {
    badge: "bg-amber-700/20 text-amber-400 border border-amber-700/30",
    border: "border-amber-700/25",
    glow: "shadow-[0_0_28px_6px_rgba(180,83,9,0.15),0_0_0_1px_rgba(180,83,9,0.25),inset_0_1px_0_rgba(255,255,255,0.07)]",
  },
};

const DEFAULT_ROW = {
  badge: "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40",
  border: "border-white/[0.07]",
  glow: "shadow-[0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/[0.12] hover:shadow-[0_0_20px_4px_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.10),inset_0_1px_0_rgba(255,255,255,0.06)]",
};

const TROPHY_ICONS: Record<number, string> = { 0: "🏆", 1: "🥈", 2: "🥉" };
const TROPHY_SIZES: Record<number, string> = {
  0: "text-3xl drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]",
  1: "text-2xl drop-shadow-[0_0_6px_rgba(161,161,170,0.5)]",
  2: "text-2xl drop-shadow-[0_0_6px_rgba(180,83,9,0.5)]",
};

function sortLeaders(data: LeaderEntry[]): LeaderEntry[] {
  const scorers = data.filter((e) => e.total_points > 0);
  const zeros = data
    .filter((e) => e.total_points === 0)
    .sort((a, b) => a.username.localeCompare(b.username));
  return [...scorers, ...zeros];
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { locale } = useLocaleCtx();
  const t = getT(locale);

  const [user, setUser] = useState<any>(null);
  const [activeLeague, setActiveLeague] = useState<ActiveLeague | null>(null);
  const [tab, setTab] = useState<"league" | "global">("global");

  const [globalLeaders, setGlobalLeaders] = useState<LeaderEntry[]>([]);
  const [leagueLeaders, setLeagueLeaders] = useState<LeaderEntry[]>([]);
  const [leagueMemberCount, setLeagueMemberCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const initialSyncDone = useRef(false);

  useEffect(() => {
    const storedUser = Cookies.get("user");
    if (!storedUser) { router.push("/login"); return; }
    const u = JSON.parse(storedUser);
    setUser(u);

    const leagueCookie = Cookies.get("activeLeague");
    const al: ActiveLeague | null = leagueCookie ? JSON.parse(leagueCookie) : null;
    setActiveLeague(al);

    // Default to league tab if in a private league
    if (al?.id) setTab("league");

    fetchAll(al);
    const interval = setInterval(() => fetchAll(al), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async (al: ActiveLeague | null) => {
    if (!initialSyncDone.current) {
      initialSyncDone.current = true;
      fetch("/api/sync-leaderboard", { cache: "no-store" });
    }

    const [globalRes, leagueRes] = await Promise.all([
      fetch("/api/leaderboard", { cache: "no-store" }),
      al?.code ? fetch(`/api/leagues/${al.code}`) : Promise.resolve(null),
    ]);

    const globalJson = await globalRes.json();
    if (globalRes.ok && globalJson.leaderboard) {
      setGlobalLeaders(sortLeaders(globalJson.leaderboard));
    }

    if (leagueRes) {
      const leagueJson = await leagueRes.json();
      if (leagueRes.ok && leagueJson.leaderboard) {
        setLeagueLeaders(sortLeaders(leagueJson.leaderboard));
        setLeagueMemberCount(leagueJson.memberCount ?? 0);
      }
    }

    setLastUpdated(new Date());
    setLoading(false);
  };

  const leaders = tab === "league" ? leagueLeaders : globalLeaders;
  const inPrivateLeague = !!activeLeague?.code;

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />

          {/* HERO */}
          <div className="mb-8">
            <div className="flex items-center gap-3 flex-wrap mb-5">
              <div className="inline-flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 rounded-2xl">
                <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-yellow-300 font-bold uppercase tracking-[0.25em] text-sm">
                  {t("lb.globalRankings")}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-2xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span className="text-emerald-400 text-xs font-bold">{t("lb.liveUpdates")}</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">{t("lb.title")}</h1>

            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {lastUpdated && (
                <span className="text-zinc-600 text-xs">
                  {t("lb.lastRefreshed")}{" "}
                  {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2 mb-8 p-1 rounded-2xl bg-zinc-900/60 border border-white/[0.06] w-fit">
            {inPrivateLeague && (
              <button
                onClick={() => setTab("league")}
                className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                  tab === "league"
                    ? "bg-yellow-400 text-black shadow-[0_0_16px_4px_rgba(234,179,8,0.25)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ⚡ {activeLeague?.name}
                <span className="ml-2 text-[10px] font-black opacity-70">
                  {leagueMemberCount} members
                </span>
              </button>
            )}
            <button
              onClick={() => setTab("global")}
              className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                tab === "global"
                  ? "bg-white text-black shadow-[0_0_16px_4px_rgba(255,255,255,0.12)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              🌍 Global
              <span className="ml-2 text-[10px] font-black opacity-70">
                {globalLeaders.length} players
              </span>
            </button>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-32">
              <div className="text-3xl font-black animate-pulse">{t("lb.loading")}</div>
            </div>
          )}

          {/* TABLE */}
          {!loading && (
            <div className="space-y-3">
              {leaders.map((leader, index) => {
                const hasPoints = leader.total_points > 0;
                const rankedIndex = hasPoints ? index : -1;
                const cfg = RANK_CONFIG[rankedIndex] ?? DEFAULT_ROW;
                const isMe = leader.username === user?.name;

                const meCls = isMe
                  ? "shadow-[0_0_28px_6px_rgba(34,197,94,0.14),0_0_0_1px_rgba(34,197,94,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] border-emerald-500/30"
                  : `${cfg.glow} ${cfg.border}`;

                return (
                  <div
                    key={leader.user_id}
                    className={`relative overflow-hidden rounded-3xl border backdrop-blur-md
                      px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-wrap gap-4 sm:gap-6
                      transition-all duration-300 ${meCls}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent pointer-events-none" />

                    <div className="flex items-center gap-5">
                      {hasPoints && (
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${cfg.badge ?? DEFAULT_ROW.badge}`}>
                          {rankedIndex < 3 ? (
                            <span className={`${TROPHY_SIZES[rankedIndex]} leading-none`}>
                              {TROPHY_ICONS[rankedIndex]}
                            </span>
                          ) : (
                            <span className="text-xl font-black">#{index + 1}</span>
                          )}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg sm:text-2xl font-black">{leader.username}</span>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                              You
                            </span>
                          )}
                        </div>
                        {hasPoints && (
                          <div className="flex items-center gap-4 text-zinc-500 text-sm mt-1">
                            <span>🎯 {leader.exact_predictions} {t("lb.exact")}</span>
                            <span className="text-zinc-700">·</span>
                            <span>✅ {leader.correct_results} {t("lb.correct")}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {hasPoints && (
                      <div className="text-right">
                        <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-1">
                          {t("lb.totalPoints")}
                        </div>
                        <div className={`text-3xl sm:text-5xl font-black tabular-nums ${
                          rankedIndex === 0 ? "text-yellow-300"
                          : rankedIndex === 1 ? "text-zinc-200"
                          : rankedIndex === 2 ? "text-amber-400"
                          : ""
                        }`}>
                          {leader.total_points}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {leaders.length === 0 && (
                <div className="rounded-3xl border border-white/[0.07] backdrop-blur-md p-16 text-center
                  shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="text-6xl mb-6">🏆</div>
                  <div className="text-3xl font-black mb-3">
                    {tab === "league" ? "No predictions yet in this league" : t("lb.noRankings")}
                  </div>
                  <div className="text-zinc-500">
                    {tab === "league" ? "Members need to submit predictions for points to appear here." : t("lb.noRankingsDetail")}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </PageWrapper>
  );
}
