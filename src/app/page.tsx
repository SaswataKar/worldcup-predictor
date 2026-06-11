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

    data.forEach((prediction) => {
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

    const used = data.map((item) => item.booster_type);
    const byDay: Record<string, string[]> = {};
    data.forEach((item) => {
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
  const { visibleGroupedMatches, groupLabels } = useMemo(() => {
    const { grouped, sortedKeys } = groupMatches(
      matches.filter((m) => m.kickoff_time && !isNaN(new Date(m.kickoff_time).getTime()))
    );
    const labels = buildGroupLabels(sortedKeys);

    const now = Date.now();
    // Anchor = first group that has a future match (kickoff not yet passed)
    const anchorIdx = sortedKeys.findIndex((key) =>
      grouped[key].some((m) => new Date(m.kickoff_time!).getTime() > now)
    );
    const idx = anchorIdx === -1 ? Math.max(0, sortedKeys.length - 1) : anchorIdx;
    const windowKeys = sortedKeys.slice(idx, idx + 3);

    const visible: Record<string, Match[]> = {};
    windowKeys.forEach((key) => { visible[key] = grouped[key]; });
    return { visibleGroupedMatches: visible, groupLabels: labels };
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
        homeScore: payload.predicted_team1_score,
        awayScore: payload.predicted_team2_score,
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
