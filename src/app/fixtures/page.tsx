"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import Header from "@/components/Header";
import PageWrapper from "@/components/PageWrapper";
import type { Match } from "@/types";
import { toLocalDateKey, userTZ, tzLabel } from "@/lib/utils";
import { useLocaleCtx } from "@/context/LocaleContext";

export default function FixturesPage() {
  const locale = useLocaleCtx();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = Cookies.get("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/matches", { cache: "no-store" });
      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error("Fixtures Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedMatches = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    matches.forEach((match) => {
      if (!match.kickoff_time) {
        grouped["TBD"] = [...(grouped["TBD"] || []), match];
        return;
      }
      const kickoff = new Date(match.kickoff_time);
      if (isNaN(kickoff.getTime())) {
        grouped["TBD"] = [...(grouped["TBD"] || []), match];
        return;
      }
      const date = toLocalDateKey(kickoff);
      grouped[date] = [...(grouped[date] || []), match];
    });
    return grouped;
  }, [matches]);

  const formatDate = (dateString: string) => {
    if (dateString === "TBD") return "🕘 TBD Fixtures";
    return new Date(dateString + "T12:00:00").toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const getLocalKickoff = (kickoffTime: string | null) => {
    if (!kickoffTime) return "TBD";
    const d = new Date(kickoffTime);
    if (isNaN(d.getTime())) return "TBD";
    return d.toLocaleString(locale, {
      timeZone: userTZ(),
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCountdown = (kickoffTime: string | null, status: string) => {
    if (!kickoffTime) return "TBD";
    const kickoff = new Date(kickoffTime);
    if (isNaN(kickoff.getTime())) return "TBD";
    const diff = kickoff.getTime() - Date.now();
    if (diff <= 0) return status === "FINISHED" ? "Full Time" : "Live / Closed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const statusPill = (status: string) => {
    if (status === "LIVE" || status === "IN_PLAY")
      return { label: "Live", cls: "border-red-500/40 bg-red-500/10 text-red-400" };
    if (status === "FINISHED")
      return { label: "FT", cls: "border-zinc-700 bg-zinc-800/50 text-zinc-500" };
    return { label: "Upcoming", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" };
  };

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />

          {/* TITLE */}
          <div className="mb-14">
            <div className="text-zinc-500 uppercase tracking-[0.3em] text-sm font-black mb-3">
              FIFA WORLD CUP 2026
            </div>
            <h1 className="text-4xl sm:text-6xl font-black leading-none">Tournament Fixtures</h1>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-32">
              <div className="text-3xl font-black animate-pulse">⚽ Loading Fixtures...</div>
            </div>
          )}

          {/* EMPTY */}
          {!loading && matches.length === 0 && (
            <div className="bg-white/[0.04] backdrop-blur-md border border-zinc-700/30 rounded-3xl p-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="text-6xl mb-6">🏟️</div>
              <div className="text-3xl font-black mb-3">No Fixtures Available</div>
              <div className="text-zinc-500">Sync the football API first.</div>
            </div>
          )}

          {/* GROUPED FIXTURES */}
          <div className="space-y-16">
            {Object.entries(groupedMatches).map(([date, dateMatches]) => (
              <div key={date}>
                {/* DATE HEADER */}
                <div className="text-2xl sm:text-4xl font-black mb-5 sm:mb-8">{formatDate(date)}</div>

                <div className="space-y-4">
                  {dateMatches.map((match) => {
                    const { label, cls } = statusPill(match.status);
                    const isLiveOrFinished =
                      match.status === "FINISHED" ||
                      match.status === "LIVE" ||
                      match.status === "IN_PLAY";
                    const countdown = getCountdown(match.kickoff_time, match.status);
                    const countdownRed =
                      match.status === "LIVE" ||
                      match.status === "IN_PLAY" ||
                      match.status === "FINISHED";

                    return (
                      <div
                        key={match.id}
                        className="overflow-hidden rounded-3xl border border-white/[0.07] px-3 sm:px-6 py-4 sm:py-5
                          backdrop-blur-md transition-all duration-300
                          shadow-[0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.06)]
                          hover:border-white/[0.13] hover:shadow-[0_0_22px_4px_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.10),inset_0_1px_0_rgba(255,255,255,0.08)]"
                      >
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          {/* TEAMS + SCORE */}
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="flex items-center gap-2">
                              <img
                                src={match.team1_crest || "/placeholder-team.png"}
                                className="w-8 h-8 object-contain"
                              />
                              <span className="text-base font-black truncate">{match.team1}</span>
                            </div>

                            <div className="flex items-center justify-center min-w-[56px]">
                              {isLiveOrFinished ? (
                                <span className="text-xl font-black tabular-nums">
                                  {match.team1_score} – {match.team2_score}
                                </span>
                              ) : (
                                <span className="text-zinc-600 font-black text-sm">VS</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <img
                                src={match.team2_crest || "/placeholder-team.png"}
                                className="w-8 h-8 object-contain"
                              />
                              <span className="text-base font-black truncate">{match.team2}</span>
                            </div>
                          </div>

                          {/* META */}
                          <div className="flex items-center gap-3 flex-wrap text-xs font-semibold">
                            <span className={`px-2.5 py-1 rounded-full border text-[11px] font-black tracking-wide ${cls}`}>
                              {label}
                            </span>

                            <div className="text-zinc-400 hidden sm:flex flex-col items-end leading-tight">
                              <span className="text-[11px] text-zinc-600 uppercase tracking-widest">
                                Kickoff ({tzLabel()})
                              </span>
                              <span>{getLocalKickoff(match.kickoff_time)}</span>
                            </div>

                            {match.matchday && (
                              <>
                                <div className="text-zinc-700 hidden sm:block">·</div>
                                <span className="text-[11px] text-yellow-400 font-black hidden sm:block">
                                  {match.matchday}
                                </span>
                              </>
                            )}

                            <div className="text-zinc-700">·</div>

                            <span className={`tabular-nums ${countdownRed ? "text-red-400" : "text-zinc-500"}`}>
                              ⏳ {countdown}
                            </span>
                          </div>
                        </div>

                        {/* MOBILE kickoff row */}
                        <div className="flex items-center gap-4 mt-3 sm:hidden text-xs text-zinc-500 font-semibold">
                          <div className="flex flex-col leading-tight">
                            <span className="text-[10px] text-zinc-700 uppercase tracking-widest">
                              Kickoff ({tzLabel()})
                            </span>
                            <span>{getLocalKickoff(match.kickoff_time)}</span>
                          </div>
                          {match.matchday && (
                            <>
                              <div className="text-zinc-700">·</div>
                              <span className="text-yellow-400 font-black">{match.matchday}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}
