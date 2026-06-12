"use client";

import Cookies from "js-cookie";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import Header from "@/components/Header";
import MatchCard from "@/components/MatchCard";
import BoosterInventory from "@/components/BoosterInventory";
import GroupCountdown from "@/components/GroupCountdown";
import HowItWorks from "@/components/HowItWorks";
import PageWrapper from "@/components/PageWrapper";

import { useLocaleCtx } from "@/context/LocaleContext";
import { groupMatches, buildGroupLabels, dateFromKey } from "@/lib/matchGroups";
import { getT } from "@/lib/translations";
import type { Match, Prediction, PredictedScore, User } from "@/types";

const BOOSTER_NAMES: Record<string, string> = {
  "2x": "⚽ Tiki Taka",
  "3x": "🔥 Hat Trick Hero",
  draw: "🐐 G.O.A.T",
};

const BOOSTER_ICONS: Record<string, string> = { "2x": "⚽", "3x": "🔥", draw: "🐐" };

// ─── Completed Days Section ───────────────────────────────────────────────────

function CompletedDays({
  completedGroups,
  groupLabels,
  predictions,
  activeDayBoosters,
}: {
  completedGroups: Record<string, Match[]>;
  groupLabels: Record<string, string>;
  predictions: Record<number, Prediction>;
  activeDayBoosters: Record<string, string[]>;
}) {
  const [open, setOpen] = useState(false);
  const { locale } = useLocaleCtx();
  const t = getT(locale);
  const entries = Object.entries(completedGroups);
  if (!entries.length) return null;

  const totalPoints = entries.flatMap(([, ms]) => ms).reduce((sum, m) => {
    const p = predictions[m.id];
    return sum + (p?.awarded_points ?? 0);
  }, 0);

  return (
    <div className="mb-12">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 mb-6 group"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl sm:text-3xl font-black text-zinc-400 group-hover:text-white transition-colors">
            ✅ Completed
          </span>
          {totalPoints > 0 && (
            <span className="px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 text-xs font-black">
              +{totalPoints} pts total
            </span>
          )}
          <span className="text-zinc-600 text-sm font-bold">{entries.length} day{entries.length > 1 ? "s" : ""}</span>
        </div>
        <span className={`text-zinc-500 text-2xl transition-transform duration-200 ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="space-y-8">
          {entries.map(([groupKey, dayMatches]) => {
            const label = groupLabels[groupKey] ?? groupKey;
            const utcDate = dateFromKey(groupKey);
            const dayBoosters = activeDayBoosters[utcDate] || [];

            return (
              <div key={groupKey}>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="text-sm font-black text-zinc-500 uppercase tracking-widest">{label}</span>
                  {dayBoosters.map((b) => (
                    <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-black">
                      {BOOSTER_ICONS[b]} {b === "2x" ? "2×" : b === "3x" ? "3×" : "G.O.A.T"} used
                    </span>
                  ))}
                </div>

                <div className="space-y-3">
                  {dayMatches.map((match) => {
                    const pred = predictions[match.id];
                    const isExact = pred &&
                      pred.predicted_team1_score === match.team1_score &&
                      pred.predicted_team2_score === match.team2_score;
                    const isCorrect = pred && !isExact && (() => {
                      const actual = (match.team1_score ?? 0) > (match.team2_score ?? 0) ? "team1"
                        : (match.team2_score ?? 0) > (match.team1_score ?? 0) ? "team2" : "draw";
                      const predicted = pred.predicted_team1_score > pred.predicted_team2_score ? "team1"
                        : pred.predicted_team2_score > pred.predicted_team1_score ? "team2" : "draw";
                      return actual === predicted;
                    })();

                    return (
                      <div
                        key={match.id}
                        className={`rounded-2xl border px-4 py-4 backdrop-blur-md
                          ${isExact ? "border-emerald-500/30 bg-emerald-500/5" :
                            isCorrect ? "border-blue-500/25 bg-blue-500/5" :
                            "border-white/[0.06] bg-white/[0.02]"}`}
                      >
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          {/* Teams + final score */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <img src={match.team1_crest || "/placeholder-team.png"} className="w-6 h-6 object-contain" />
                              <span className="text-sm font-black truncate max-w-[70px] sm:max-w-none">{match.team1}</span>
                            </div>
                            <span className="text-base font-black tabular-nums text-zinc-300">
                              {match.team1_score} – {match.team2_score}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <img src={match.team2_crest || "/placeholder-team.png"} className="w-6 h-6 object-contain" />
                              <span className="text-sm font-black truncate max-w-[70px] sm:max-w-none">{match.team2}</span>
                            </div>
                          </div>

                          {/* Prediction + result + points */}
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {pred ? (
                              <>
                                <span className="px-2.5 py-1 rounded-xl bg-zinc-800 border border-zinc-700 font-black tabular-nums">
                                  🎯 {pred.predicted_team1_score}–{pred.predicted_team2_score}
                                </span>
                                {isExact && (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-black">
                                    ✨ Exact!
                                  </span>
                                )}
                                {isCorrect && (
                                  <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400 font-black">
                                    ✅ Correct
                                  </span>
                                )}
                                {!isExact && !isCorrect && (
                                  <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 font-black">
                                    ✗ Wrong
                                  </span>
                                )}
                                {(pred.awarded_points ?? 0) > 0 && (
                                  <span className="px-2.5 py-1 rounded-xl bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 font-black">
                                    +{pred.awarded_points} 🏆
                                  </span>
                                )}
                                {dayBoosters.length > 0 && dayBoosters.map((b) => (
                                  <span key={b} className="text-base leading-none" title={BOOSTER_NAMES[b]}>{BOOSTER_ICONS[b]}</span>
                                ))}
                              </>
                            ) : (
                              <span className="text-zinc-600 font-bold">No prediction</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { locale } = useLocaleCtx();
  const t = getT(locale);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [predictedScores, setPredictedScores] = useState<Record<number, PredictedScore>>({});
  const [expandedMatches, setExpandedMatches] = useState<Record<number, boolean>>({});
  const [usedBoosterTypes, setUsedBoosterTypes] = useState<string[]>([]);
  const [activeDayBoosters, setActiveDayBoosters] = useState<Record<string, string[]>>({});

  const cancelledMatchIds = useRef<Set<number>>(new Set());

  // INIT
  useEffect(() => {
    const init = async () => {
      const storedUser = Cookies.get("user");
      if (!storedUser) {
        router.push("/login");
        return;
      }
      try {
        const parsedUser = JSON.parse(storedUser);
        const verifyRes = await fetch(`/api/auth/verify?userId=${parsedUser.id}`);
        if (!verifyRes.ok) {
          Cookies.remove("user");
          toast.error("Session expired. Please login again.");
          router.push("/login");
          return;
        }
        const { user: existingUser } = await verifyRes.json();

        // Require league selection before entering predictor
        const activeLeagueCookie = Cookies.get("activeLeague");
        if (!activeLeagueCookie) {
          router.push("/leagues?select=1");
          return;
        }
        setUser(existingUser);
        await fetchMatches();
        await fetchPredictions(existingUser.id);
        await fetchDailyBoosters(existingUser.id);
      } catch {
        Cookies.remove("user");
        router.push("/login");
      }
    };
    init();
  }, []);

  // AUTO REFRESH
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      await fetchMatches();
      await fetchPredictions(user.id);
      await fetchDailyBoosters(user.id);
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // FETCH MATCHES
  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/matches", { cache: "no-store" });
      const data = await response.json();
      setMatches((prev) => {
        const next = data.matches || [];
        if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
        return next;
      });
    } catch (error) {
      console.error("Fetch Matches Error:", error);
    }
  };

  // FETCH PREDICTIONS
  const fetchPredictions = async (userId: number) => {
    const res = await fetch(`/api/predictions?userId=${userId}`);
    if (!res.ok) return;
    const { predictions: data } = await res.json();
    if (!data) return;

    const serverMapped: Record<number, Prediction> = {};
    const serverScoreMap: Record<number, PredictedScore> = {};

    data.forEach((prediction: Prediction) => {
      if (cancelledMatchIds.current.has(prediction.match_id)) return;
      serverMapped[prediction.match_id] = prediction;
      serverScoreMap[prediction.match_id] = {
        home: prediction.predicted_team1_score,
        away: prediction.predicted_team2_score,
      };
    });

    setPredictions((prev) => {
      const merged = { ...serverMapped };
      Object.keys(prev).forEach((matchId) => {
        const id = Number(matchId);
        if (!(id in merged)) merged[id] = prev[id];
      });
      return merged;
    });

    setPredictedScores((prev) => {
      const updated = { ...prev };
      Object.keys(serverScoreMap).forEach((matchId) => {
        const id = Number(matchId);
        if (!prev[id]) updated[id] = serverScoreMap[id];
      });
      return updated;
    });
  };

  // FETCH DAILY BOOSTERS
  const fetchDailyBoosters = async (userId: number) => {
    const res = await fetch(`/api/boosters?userId=${userId}`);
    if (!res.ok) return;
    const { boosters: data } = await res.json();
    if (!data) return;

    const used = data.map((item: { booster_type: string; active_date: string }) => item.booster_type);
    const byDay: Record<string, string[]> = {};
    data.forEach((item: { booster_type: string; active_date: string }) => {
      const date = item.active_date.split("T")[0];
      byDay[date] = [...(byDay[date] || []), item.booster_type];
    });

    setUsedBoosterTypes(used);
    setActiveDayBoosters(byDay);
  };

  // ACTIVATE BOOSTER — one per type per tournament; moves if already assigned to another date
  const activateBooster = async (boosterType: string, date: string) => {
    if (!user) return;

    // Already on this date — no-op
    const existingDate = Object.entries(activeDayBoosters).find(([, types]) =>
      types.includes(boosterType)
    )?.[0] ?? null;
    if (existingDate === date) return;

    // Block if this matchday already has a different booster assigned
    const dayAlreadyHasBooster = (activeDayBoosters[date] || []).some((t) => t !== boosterType);
    if (dayAlreadyHasBooster) {
      toast.error("Only one booster can be active per matchday.");
      return;
    }

    const res = await fetch("/api/boosters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, boosterType, date }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "Failed to activate booster");
      throw new Error(error);
    }

    // Update state: keep used list unchanged (type was already tracked), update day map
    setUsedBoosterTypes((prev) => {
      const without = existingDate ? prev.filter((b) => b !== boosterType) : prev;
      return [...without, boosterType];
    });
    setActiveDayBoosters((prev) => {
      const next = { ...prev };
      if (existingDate) {
        next[existingDate] = (next[existingDate] || []).filter((b) => b !== boosterType);
        if (!next[existingDate].length) delete next[existingDate];
      }
      next[date] = [...(next[date] || []), boosterType];
      return next;
    });

    const action = existingDate ? "moved to today" : "activated";
    toast.success(`${BOOSTER_NAMES[boosterType] ?? boosterType} ${action}!`);
  };

  // REMOVE BOOSTER — returns it to inventory (only before first match of that day starts)
  const removeBooster = async (boosterType: string) => {
    if (!user) return;

    const assignedDate = Object.entries(activeDayBoosters).find(([, types]) =>
      types.includes(boosterType)
    )?.[0];

    if (!assignedDate) return;

    // Guard: booster is consumed once ANY match in that group has reached its close time
    const groupKey = Object.keys(visibleGroupedMatches).find(
      (k) => dateFromKey(k) === assignedDate
    );
    const dayMatches = groupKey ? visibleGroupedMatches[groupKey] : [];
    const now = new Date();
    const isConsumed = dayMatches.some((m) => {
      if (!m.kickoff_time) return false;
      const kickoff = new Date(m.kickoff_time);
      return now >= new Date(kickoff.getTime() - 60 * 1000);
    });

    if (isConsumed) {
      toast.error("Booster is consumed — a match on this day has already started.");
      return;
    }

    const res = await fetch("/api/boosters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, boosterType }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "Failed to remove booster");
      return;
    }

    setUsedBoosterTypes((prev) => prev.filter((b) => b !== boosterType));
    setActiveDayBoosters((prev) => {
      const updated = { ...prev };
      updated[assignedDate] = (updated[assignedDate] || []).filter((b) => b !== boosterType);
      if (updated[assignedDate].length === 0) delete updated[assignedDate];
      return updated;
    });

    toast.success("Booster returned to inventory");
  };

  // LOCK LOGIC — open exactly 24h before kickoff, closes 1 minute before kickoff
  const canPredict = (kickoffTime: string): boolean => {
    if (!kickoffTime) return false;
    const now = new Date();
    const kickoff = new Date(kickoffTime);
    if (isNaN(kickoff.getTime())) return false;
    const openTime = new Date(kickoff.getTime() - 24 * 60 * 60 * 1000);
    const closeTime = new Date(kickoff.getTime() - 60 * 1000);
    return now >= openTime && now < closeTime;
  };

  // ROLLING WINDOW — grouped by round+day, timezone-neutral
  const { visibleGroupedMatches, completedGroupedMatches, groupLabels } = useMemo(() => {
    const { grouped, sortedKeys } = groupMatches(
      matches.filter((m) => m.kickoff_time && !isNaN(new Date(m.kickoff_time).getTime()))
    );
    const labels = buildGroupLabels(sortedKeys);

    const now = Date.now();

    // A day is "completed" when ALL its matches are FINISHED + processed
    const isDayCompleted = (key: string) =>
      grouped[key].length > 0 &&
      grouped[key].every((m) => m.status === "FINISHED" && m.processed);

    // Anchor = earliest group still "active":
    //   live/in-play match, OR finished+unprocessed, OR future kickoff
    const anchorIdx = sortedKeys.findIndex((key) =>
      grouped[key].some((m) => {
        if (m.status === "IN_PLAY" || m.status === "LIVE" || m.status === "PAUSED") return true;
        if (m.status === "FINISHED" && !m.processed) return true;
        if (m.kickoff_time && new Date(m.kickoff_time).getTime() > now) return true;
        return false;
      })
    );
    const idx = anchorIdx === -1 ? Math.max(0, sortedKeys.length - 1) : anchorIdx;
    const windowKeys = sortedKeys.slice(idx, idx + 3);

    const visible: Record<string, Match[]> = {};
    windowKeys.forEach((key) => { visible[key] = grouped[key]; });

    // Completed = all days before the window that are fully done
    const completed: Record<string, Match[]> = {};
    sortedKeys.slice(0, idx).filter(isDayCompleted).forEach((key) => {
      completed[key] = grouped[key];
    });

    return { visibleGroupedMatches: visible, completedGroupedMatches: completed, groupLabels: labels };
  }, [matches]);

  // Group key of the currently active/upcoming round-day (has at least one predictable match)
  const activeMatchday = useMemo(() => {
    return (
      Object.entries(visibleGroupedMatches).find(([, dayMatches]) =>
        dayMatches.some((m) => canPredict(m.kickoff_time ?? ""))
      )?.[0] ?? null
    );
  }, [visibleGroupedMatches]);

  // UTC date of the active group (used for booster storage/lookup)
  const activeMatchdayDate = activeMatchday ? dateFromKey(activeMatchday) : null;

  // True once any match in the active group has reached its prediction-close window
  const isActiveMatchdayConsumed = useMemo(() => {
    if (!activeMatchday) return false;
    const dayMatches = visibleGroupedMatches[activeMatchday] || [];
    const now = new Date();
    return dayMatches.some((m) => {
      if (!m.kickoff_time) return false;
      const kickoff = new Date(m.kickoff_time);
      return now >= new Date(kickoff.getTime() - 60 * 1000);
    });
  }, [activeMatchday, visibleGroupedMatches]);

  // TBD MATCHES
  const tbdMatches = useMemo(() => {
    return matches.filter((match) => {
      if (!match.kickoff_time) return true;
      return isNaN(new Date(match.kickoff_time).getTime());
    });
  }, [matches]);

  // SUBMIT
  const submitPrediction = async (matchId: number) => {
    if (!user) return;
    const match = matches.find((m) => m.id === matchId);
    if (!match || !canPredict(match.kickoff_time ?? "")) {
      toast.error("Predictions are locked for this match");
      return;
    }

    const homeScore = predictedScores[matchId]?.home;
    const awayScore = predictedScores[matchId]?.away;

    if (homeScore === undefined || awayScore === undefined || homeScore === "" || awayScore === "") {
      toast.error("Enter score prediction");
      return;
    }

    let selectedResult = "draw";
    if (homeScore > awayScore) selectedResult = "team1";
    if (awayScore > homeScore) selectedResult = "team2";

    const payload: Prediction = {
      user_id: user.id,
      match_id: matchId,
      prediction_type: "standard",
      predicted_result: selectedResult,
      predicted_team1_score: Number(homeScore),
      predicted_team2_score: Number(awayScore),
      booster_used: "none",
      updated_at: new Date().toISOString(),
    };

    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        matchId,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
      }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      toast.error(error ?? "Failed to submit prediction");
      return;
    }

    cancelledMatchIds.current.delete(matchId);
    setPredictions({ ...predictions, [matchId]: payload });
    toast.success("Prediction submitted!");
  };

  // CANCEL
  const cancelPrediction = async (matchId: number) => {
    if (!user) return;
    const prediction = predictions[matchId];

    cancelledMatchIds.current.add(matchId);

    setPredictions((prev) => {
      const updated = { ...prev };
      delete updated[matchId];
      return updated;
    });

    setPredictedScores((prev) => {
      const updated = { ...prev };
      delete updated[matchId];
      return updated;
    });

    const res = await fetch("/api/predictions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, matchId }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      cancelledMatchIds.current.delete(matchId);
      setPredictions((prev) => ({ ...prev, [matchId]: prediction }));
      setPredictedScores((prev) => ({
        ...prev,
        [matchId]: {
          home: prediction.predicted_team1_score,
          away: prediction.predicted_team2_score,
        },
      }));
      toast.error(error ?? "Failed to cancel prediction");
      return;
    }

    toast.success("Prediction cancelled");
  };

  if (!user) return null;

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />

          <HowItWorks />

          <BoosterInventory
            usedBoosterTypes={usedBoosterTypes}
            activeDayBoosters={activeDayBoosters}
            activeMatchday={activeMatchdayDate}
            isMatchdayConsumed={isActiveMatchdayConsumed}
            onActivate={(boosterType, _groupKey) => activateBooster(boosterType, activeMatchdayDate ?? _groupKey)}
            onRemove={removeBooster}
          />

          {/* TBD */}
          {tbdMatches.length > 0 && (
            <div className="mb-16">
              <div className="text-3xl font-black mb-6">🕘 TBD Fixtures</div>
              <div className="space-y-4">
                {tbdMatches.map((match) => (
                  <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                    <div className="text-2xl font-black">{match.team1} vs {match.team2}</div>
                    <div className="text-zinc-500 mt-2">{t("match.tbdAnnounced")}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMPLETED DAYS */}
          {Object.keys(completedGroupedMatches).length > 0 && (
            <CompletedDays
              completedGroups={completedGroupedMatches}
              groupLabels={groupLabels}
              predictions={predictions}
              activeDayBoosters={activeDayBoosters}
            />
          )}

          {/* MATCH GROUPS */}
          <div className="space-y-12">
            {Object.entries(visibleGroupedMatches).map(([groupKey, dateMatches]) => {
              const utcDate = dateFromKey(groupKey);
              const dayBoosters = activeDayBoosters[utcDate] || [];
              const label = groupLabels[groupKey] ?? groupKey;
              // "Today" / "Tomorrow" check against the UTC date of the group
              const todayUTC = new Date().toISOString().split("T")[0];
              const tomorrowUTC = (() => { const d = new Date(); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().split("T")[0]; })();
              const isToday = utcDate === todayUTC;
              const isTomorrow = utcDate === tomorrowUTC;

              return (
              <div key={groupKey}>
                {/* SECTION HEADER */}
                <div className="relative mb-6">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800" />

                  <div className="relative flex items-center gap-3 flex-wrap">
                    {/* Round label chip */}
                    <div className="flex items-center gap-3 bg-zinc-950 pr-4 rounded-full border border-zinc-700/60 pl-3 py-1.5">
                      <div>
                        {(isToday || isTomorrow) && (
                          <div className="text-[10px] uppercase tracking-[0.2em] font-black leading-none mb-0.5 text-yellow-400">
                            {isToday ? t("time.today") : t("time.tomorrow")}
                          </div>
                        )}
                        <div className={`text-base font-black leading-none ${isToday ? "text-yellow-300" : "text-white"}`}>
                          {label}
                        </div>
                      </div>
                    </div>

                    {/* Match count */}
                    <div className="bg-zinc-900 border border-zinc-700/60 rounded-full px-3 py-1 text-xs font-black text-zinc-400">
                      {dateMatches.length} {dateMatches.length === 1 ? t("match.match") : t("match.matches")}
                    </div>

                    {/* Live prediction countdown */}
                    <GroupCountdown matches={dateMatches} />

                    {/* Active booster badges */}
                    {dayBoosters.map((b) => (
                      <span
                        key={b}
                        className="px-3 py-1 rounded-full border border-zinc-700 bg-zinc-900 text-xs font-black text-zinc-300"
                      >
                        {b === "2x" ? "⚽ 2×" : b === "3x" ? "🔥 3×" : "🐐 G.O.A.T"}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {dateMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      canPredict={canPredict}
                      predictions={predictions}
                      predictedScores={predictedScores}
                      setPredictedScores={setPredictedScores}
                      expandedMatches={expandedMatches}
                      setExpandedMatches={setExpandedMatches}
                      submitPrediction={submitPrediction}
                      cancelPrediction={cancelPrediction}
                      activeDayBoosters={activeDayBoosters}
                    />
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}
