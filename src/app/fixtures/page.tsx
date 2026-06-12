"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";

import Header from "@/components/Header";
import PageWrapper from "@/components/PageWrapper";
import type { Match } from "@/types";
import { userTZ, tzLabel } from "@/lib/utils";
import { useLocaleCtx } from "@/context/LocaleContext";
import { getT } from "@/lib/translations";
import { ROUND_LABELS, roundFromKey, groupMatches, buildGroupLabels } from "@/lib/matchGroups";

// Stage sort order
const STAGE_ORDER = [
  "GROUP_STAGE",
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

export default function FixturesPage() {
  const { locale } = useLocaleCtx();
  const t = getT(locale);
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [openStages, setOpenStages] = useState<Record<string, boolean>>({});
  const [selectedDay, setSelectedDay] = useState<Record<string, string>>({});

  useEffect(() => {
    const storedUser = Cookies.get("user");
    if (!storedUser) { router.push("/login"); return; }
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

  // Group by stage → day
  const stageData = useMemo(() => {
    const timedMatches = matches.filter((m) => m.kickoff_time && !isNaN(new Date(m.kickoff_time).getTime()));
    const tbdMatches = matches.filter((m) => !m.kickoff_time || isNaN(new Date(m.kickoff_time).getTime()));

    const { grouped, sortedKeys } = groupMatches(timedMatches);
    if (tbdMatches.length) {
      grouped["TBD__TBD"] = tbdMatches;
      sortedKeys.push("TBD__TBD");
    }
    const dayLabels = buildGroupLabels(sortedKeys);

    // Group day-keys by stage
    const byStage: Record<string, string[]> = {};
    sortedKeys.forEach((key) => {
      const stage = roundFromKey(key);
      if (!byStage[stage]) byStage[stage] = [];
      byStage[stage].push(key);
    });

    // Sort stages
    const sortedStages = Object.keys(byStage).sort((a, b) => {
      const ai = STAGE_ORDER.indexOf(a);
      const bi = STAGE_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    return { grouped, byStage, sortedStages, dayLabels };
  }, [matches]);

  // Auto-open the current/next active stage
  useEffect(() => {
    if (!stageData.sortedStages.length) return;
    const now = Date.now();
    // Find the first stage that has any upcoming or live match
    let activeStage = stageData.sortedStages[0];
    for (const stage of stageData.sortedStages) {
      const keys = stageData.byStage[stage];
      const hasLiveOrUpcoming = keys.some((key) =>
        (stageData.grouped[key] ?? []).some((m) => {
          if (m.status === "IN_PLAY" || m.status === "LIVE") return true;
          if (m.status !== "FINISHED" && m.kickoff_time) {
            return new Date(m.kickoff_time).getTime() > now - 2 * 60 * 60 * 1000;
          }
          return false;
        })
      );
      if (hasLiveOrUpcoming) { activeStage = stage; break; }
    }
    setOpenStages({ [activeStage]: true });

    // Auto-select sensible day per stage
    const todayUTC = new Date().toISOString().split("T")[0];
    const initial: Record<string, string> = {};
    stageData.sortedStages.forEach((stage) => {
      const keys = stageData.byStage[stage] ?? [];
      const todayKey = keys.find((k) => k.includes(todayUTC));
      const upcomingKey = keys.find((k) =>
        (stageData.grouped[k] ?? []).some((m) => m.status !== "FINISHED" && m.kickoff_time && new Date(m.kickoff_time).getTime() > now - 2 * 60 * 60 * 1000)
      );
      initial[stage] = todayKey ?? upcomingKey ?? keys[keys.length - 1] ?? "";
    });
    setSelectedDay(initial);
  }, [stageData.sortedStages.join(",")]);

  const toggleStage = (stage: string) =>
    setOpenStages((prev) => ({ ...prev, [stage]: !prev[stage] }));

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
    if (diff <= 0) return status === "FINISHED" ? t("status.ft") : t("fix.liveClosed");
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const statusPill = (status: string) => {
    if (status === "LIVE" || status === "IN_PLAY")
      return { label: t("status.live"), cls: "border-red-500/40 bg-red-500/10 text-red-400", live: true };
    if (status === "FINISHED")
      return { label: t("status.ft"), cls: "border-zinc-700 bg-zinc-800/50 text-zinc-500", live: false };
    return { label: t("fix.upcoming"), cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400", live: false };
  };

  // Count live matches in a stage
  const stageLiveCount = (stage: string) =>
    (stageData.byStage[stage] ?? []).reduce((sum, key) =>
      sum + (stageData.grouped[key] ?? []).filter((m) => m.status === "IN_PLAY" || m.status === "LIVE").length, 0);

  const stageMatchCount = (stage: string) =>
    (stageData.byStage[stage] ?? []).reduce((sum, key) =>
      sum + (stageData.grouped[key] ?? []).length, 0);

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />

          <div className="mb-14">
            <div className="text-zinc-500 uppercase tracking-[0.3em] text-sm font-black mb-3">FIFA WORLD CUP 2026</div>
            <h1 className="text-4xl sm:text-6xl font-black leading-none">{t("fix.title")}</h1>
          </div>

          {loading && (
            <div className="text-center py-32">
              <div className="text-3xl font-black animate-pulse">{t("fix.loading")}</div>
            </div>
          )}

          {!loading && matches.length === 0 && (
            <div className="bg-white/[0.04] backdrop-blur-md border border-zinc-700/30 rounded-3xl p-16 text-center">
              <div className="text-6xl mb-6">🏟️</div>
              <div className="text-3xl font-black mb-3">{t("fix.empty")}</div>
              <div className="text-zinc-500">Sync the football API first.</div>
            </div>
          )}

          <div className="space-y-4">
            {stageData.sortedStages.map((stage) => {
              const isOpen = !!openStages[stage];
              const stageLabel = stage === "TBD" ? t("page.tbdFixtures") : (ROUND_LABELS[stage] ?? stage.replace(/_/g, " "));
              const liveCount = stageLiveCount(stage);
              const totalCount = stageMatchCount(stage);
              const dayKeys = stageData.byStage[stage] ?? [];

              return (
                <div
                  key={stage}
                  className={`rounded-3xl border backdrop-blur-md transition-all duration-300 overflow-hidden
                    ${liveCount > 0
                      ? "border-red-500/30 shadow-[0_0_24px_4px_rgba(239,68,68,0.12),0_0_0_1px_rgba(239,68,68,0.20)]"
                      : "border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]"
                    }`}
                >
                  {/* STAGE HEADER — clickable */}
                  <button
                    onClick={() => toggleStage(stage)}
                    className="w-full px-5 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xl sm:text-3xl font-black">{stageLabel}</span>
                      {liveCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 text-[11px] font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                          {liveCount} LIVE
                        </span>
                      )}
                      <span className="text-zinc-600 text-sm font-bold">{totalCount} matches</span>
                    </div>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                      className="text-zinc-500 text-2xl leading-none shrink-0"
                    >
                      ⌄
                    </motion.span>
                  </button>

                  {/* STAGE CONTENT */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="pb-6 border-t border-white/[0.06] pt-6">
                          {/* DATE PILLS — only shown when stage has many days */}
                          {dayKeys.length > 3 && (
                            <div className="relative mb-6">
                              <div className="overflow-x-auto scrollbar-none">
                                <div className="flex gap-2 px-4 sm:px-6 pb-3 w-max min-w-full">
                              {dayKeys.map((key) => {
                                const rawLabel = key === "TBD__TBD"
                                  ? "TBD"
                                  : stageData.dayLabels[key] ?? key;
                                const short = rawLabel.includes(" · ")
                                  ? rawLabel.split(" · ").slice(1).join(" · ")
                                  : rawLabel;
                                // Extract just date portion for ultra-compact pill
                                const dateStr = key.split("__")[1];
                                const pillDate = dateStr && dateStr !== "TBD"
                                  ? new Date(dateStr).toLocaleDateString(locale, { month: "short", day: "numeric", timeZone: "UTC" })
                                  : short;
                                const dayMs = (stageData.grouped[key] ?? []).filter((m) => m.status === "IN_PLAY" || m.status === "LIVE").length;
                                const isSelected = selectedDay[stage] === key;
                                return (
                                  <button
                                    key={key}
                                    onClick={() => setSelectedDay((prev) => ({ ...prev, [stage]: key }))}
                                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap relative ${
                                      isSelected
                                        ? "bg-yellow-400 text-black shadow-[0_0_10px_2px_rgba(234,179,8,0.3)]"
                                        : "bg-zinc-900 border border-zinc-700/60 text-zinc-400 hover:text-white hover:border-zinc-500"
                                    }`}
                                  >
                                    {pillDate}
                                    {dayMs > 0 && (
                                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    )}
                                  </button>
                                );
                              })}
                                </div>
                              </div>
                              {/* right fade hint */}
                              <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-12 bg-gradient-to-l from-zinc-950 to-transparent" />
                            </div>
                          )}

                          {/* MATCHES for active day (or all days if few) */}
                          {(dayKeys.length > 3 ? [selectedDay[stage] ?? dayKeys[0]] : dayKeys).filter(Boolean).map((dayKey) => {
                            const dayMatches = stageData.grouped[dayKey] ?? [];
                            const dayLabel = dayKey === "TBD__TBD"
                              ? t("page.tbdFixtures")
                              : stageData.dayLabels[dayKey] ?? dayKey;
                            const shortDayLabel = dayLabel.includes(" · ")
                              ? dayLabel.split(" · ").slice(1).join(" · ")
                              : dayLabel;

                            return (
                              <div key={dayKey} className="px-4 sm:px-6">
                                {dayKeys.length <= 3 && (
                                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-black mb-4">
                                  {shortDayLabel}
                                </div>
                                )}
                                <div className="space-y-3">
                                  {dayMatches.map((match) => {
                                    const { label, cls, live } = statusPill(match.status);
                                    const hasScore = match.team1_score != null;
                                    const isLiveOrFinished = match.status === "FINISHED" || match.status === "LIVE" || match.status === "IN_PLAY";
                                    const countdown = getCountdown(match.kickoff_time, match.status);
                                    const countdownRed = match.status === "LIVE" || match.status === "IN_PLAY" || match.status === "FINISHED";

                                    return (
                                      <div
                                        key={match.id}
                                        className={`relative overflow-hidden rounded-2xl border px-3 sm:px-5 py-4
                                          backdrop-blur-md transition-all duration-300
                                          ${live
                                            ? "border-red-500/30 shadow-[0_0_16px_3px_rgba(239,68,68,0.10)]"
                                            : "border-white/[0.07] hover:border-white/[0.13] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]"
                                          }`}
                                      >
                                        {live && (
                                          <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                                          </span>
                                        )}

                                        <div className="flex items-center justify-between gap-4 flex-wrap">
                                          {/* TEAMS + SCORE */}
                                          <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <img src={match.team1_crest || "/placeholder-team.png"} className="w-7 h-7 object-contain" />
                                              <span className="text-sm font-black truncate max-w-[90px] sm:max-w-none">{match.team1}</span>
                                            </div>
                                            <div className="flex items-center justify-center min-w-[52px]">
                                              {(isLiveOrFinished || hasScore) ? (
                                                <span className={`text-lg font-black tabular-nums ${live ? "text-red-300" : ""}`}>
                                                  {match.team1_score ?? "?"} – {match.team2_score ?? "?"}
                                                </span>
                                              ) : (
                                                <span className="text-zinc-600 font-black text-xs">VS</span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <img src={match.team2_crest || "/placeholder-team.png"} className="w-7 h-7 object-contain" />
                                              <span className="text-sm font-black truncate max-w-[90px] sm:max-w-none">{match.team2}</span>
                                            </div>
                                          </div>

                                          {/* META */}
                                          <div className="flex items-center gap-2.5 flex-wrap text-xs">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-black ${cls}`}>
                                              {live && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block shrink-0" />}
                                              {label}
                                            </span>
                                            <span className="text-zinc-500 hidden sm:block">{getLocalKickoff(match.kickoff_time)}</span>
                                            <span className="text-zinc-700 hidden sm:block">·</span>
                                            <span className={`tabular-nums ${countdownRed ? "text-red-400" : "text-zinc-500"}`}>
                                              ⏳ {countdown}
                                            </span>
                                          </div>
                                        </div>

                                        {/* MOBILE kickoff */}
                                        <div className="mt-2 sm:hidden text-[11px] text-zinc-600">
                                          {getLocalKickoff(match.kickoff_time)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}
