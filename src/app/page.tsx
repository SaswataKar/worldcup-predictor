"use client";

import Cookies from "js-cookie";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import Header from "@/components/Header";
import MatchCard from "@/components/MatchCard";
import BoosterInventory from "@/components/BoosterInventory";
import HowItWorks from "@/components/HowItWorks";
import PageWrapper from "@/components/PageWrapper";

import { supabase } from "@/lib/supabase";
import { getGamedayKey } from "@/lib/utils";
import type { Match, Prediction, PredictedScore, User } from "@/types";

const BOOSTER_NAMES: Record<string, string> = {
  "2x": "⚽ Tiki Taka",
  "3x": "🔥 Hat Trick Hero",
  draw: "🐐 G.O.A.T",
};

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [predictedScores, setPredictedScores] = useState<Record<number, PredictedScore>>({});
  const [expandedMatches, setExpandedMatches] = useState<Record<number, boolean>>({});
  const [usedBoosterTypes, setUsedBoosterTypes] = useState<string[]>([]);
  const [activeDayBoosters, setActiveDayBoosters] = useState<Record<string, string[]>>({});
  const [useGamedayWindow, setUseGamedayWindow] = useState(false);

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
        const { data: existingUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", parsedUser.id)
          .single();

        if (!existingUser) {
          Cookies.remove("user");
          toast.error("Session expired. Please login again.");
          router.push("/login");
          return;
        }

        setUser(existingUser);
        await fetchMatches();
        await fetchPredictions(existingUser.id);
        await fetchDailyBoosters(existingUser.id);
        await fetchLeagueMode(existingUser.id);
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
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", userId);

    if (error || !data) return;

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
    const { data, error } = await supabase
      .from("daily_boosters")
      .select("*")
      .eq("user_id", userId);

    if (error || !data) return;

    const used = data.map((item) => item.booster_type);
    const byDay: Record<string, string[]> = {};
    data.forEach((item) => {
      const date = new Date(item.active_date).toISOString().split("T")[0];
      byDay[date] = [...(byDay[date] || []), item.booster_type];
    });

    setUsedBoosterTypes(used);
    setActiveDayBoosters(byDay);
  };

  // FETCH LEAGUE MODE — if user belongs to any gameday_window league, use that grouping
  const fetchLeagueMode = async (userId: number) => {
    try {
      const res = await fetch(`/api/leagues/mine?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        const hasWindow = (data.leagues ?? []).some((l: any) => l.matchday_mode === "gameday_window");
        setUseGamedayWindow(hasWindow);
      }
    } catch {}
  };

  // ACTIVATE BOOSTER — one per day; swaps if a different booster is already set
  const activateBooster = async (boosterType: string, date: string) => {
    if (!user) return;

    const existingType = (activeDayBoosters[date] || [])[0] ?? null;
    if (existingType === boosterType) return; // already active, no-op

    // If swapping, remove the old one first
    if (existingType) {
      const { error: delError } = await supabase
        .from("daily_boosters")
        .delete()
        .eq("user_id", user.id)
        .eq("booster_type", existingType);
      if (delError) { toast.error(delError.message); throw delError; }
    }

    const { error } = await supabase.from("daily_boosters").insert({
      user_id: user.id,
      booster_type: boosterType,
      active_date: date,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    // Update state: return old type to inventory, mark new type as used
    setUsedBoosterTypes((prev) => {
      const without = existingType ? prev.filter((b) => b !== existingType) : prev;
      return [...without, boosterType];
    });
    setActiveDayBoosters((prev) => ({
      ...prev,
      [date]: [boosterType], // only one per day
    }));

    const action = existingType ? "swapped to" : "activated";
    toast.success(`${BOOSTER_NAMES[boosterType] ?? boosterType} ${action}!`);
  };

  // REMOVE BOOSTER — returns it to inventory (only before first match of that day starts)
  const removeBooster = async (boosterType: string) => {
    if (!user) return;

    const assignedDate = Object.entries(activeDayBoosters).find(([, types]) =>
      types.includes(boosterType)
    )?.[0];

    if (!assignedDate) return;

    // Guard: booster is consumed once ANY match on that day has reached its close time
    const dayMatches = visibleGroupedMatches[assignedDate] || [];
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

    const { error } = await supabase
      .from("daily_boosters")
      .delete()
      .eq("user_id", user.id)
      .eq("booster_type", boosterType);

    if (error) {
      toast.error(error.message);
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

  // LOCK LOGIC — open from midnight the day before kickoff until 1 minute before kickoff
  const canPredict = (kickoffTime: string): boolean => {
    if (!kickoffTime) return false;
    const now = new Date();
    const kickoff = new Date(kickoffTime);
    if (isNaN(kickoff.getTime())) return false;
    const openTime = new Date(kickoff);
    openTime.setDate(openTime.getDate() - 1);
    openTime.setHours(0, 0, 0, 0);
    const closeTime = new Date(kickoff.getTime() - 1 * 60 * 1000);
    return now >= openTime && now < closeTime;
  };

  const matchdayKey = (kickoffTime: string) =>
    useGamedayWindow ? getGamedayKey(kickoffTime) : new Date(kickoffTime).toISOString().split("T")[0];

  const todayKey = () =>
    useGamedayWindow ? getGamedayKey(new Date().toISOString()) : new Date().toISOString().split("T")[0];

  // ROLLING 3-DAY WINDOW
  const visibleGroupedMatches = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    matches.forEach((match) => {
      if (!match.kickoff_time) return;
      const kickoff = new Date(match.kickoff_time);
      if (isNaN(kickoff.getTime())) return;
      const date = matchdayKey(match.kickoff_time);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(match);
    });

    const today = todayKey();
    const allDays = Object.keys(grouped).sort();
    const futureDays = allDays.filter((d) => d >= today);
    const anchor = futureDays[0] ?? allDays[allDays.length - 1];
    if (!anchor) return {};

    const anchorIndex = allDays.indexOf(anchor);
    const windowDays = allDays.slice(anchorIndex, anchorIndex + 3);

    const result: Record<string, Match[]> = {};
    windowDays.forEach((day) => { result[day] = grouped[day]; });
    return result;
  }, [matches]);

  // The matchday currently open for predictions (has at least one predictable match)
  const activeMatchday = useMemo(() => {
    return (
      Object.entries(visibleGroupedMatches).find(([, dayMatches]) =>
        dayMatches.some((m) => canPredict(m.kickoff_time ?? ""))
      )?.[0] ?? null
    );
  }, [visibleGroupedMatches]);

  // True once the first match of the active matchday reaches its close window —
  // any applied booster is now permanently consumed and cannot be cancelled
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

    const { error } = await supabase
      .from("predictions")
      .upsert(payload, { onConflict: "user_id,match_id" });

    if (error) {
      toast.error(error.message);
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

    const { error } = await supabase
      .from("predictions")
      .delete()
      .eq("match_id", matchId)
      .eq("user_id", user.id);

    if (error) {
      cancelledMatchIds.current.delete(matchId);
      setPredictions((prev) => ({ ...prev, [matchId]: prediction }));
      setPredictedScores((prev) => ({
        ...prev,
        [matchId]: {
          home: prediction.predicted_team1_score,
          away: prediction.predicted_team2_score,
        },
      }));
      toast.error(error.message);
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
            activeMatchday={activeMatchday}
            isMatchdayConsumed={isActiveMatchdayConsumed}
            onActivate={activateBooster}
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
                    <div className="text-zinc-500 mt-2">Kickoff time to be announced</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROLLING 3-DAY WINDOW */}
          <div className="space-y-12">
            {Object.entries(visibleGroupedMatches).map(([date, dateMatches]) => {
              const dayBoosters = activeDayBoosters[date] || [];
              const isToday = date === todayKey();
              const hasTomorrow = (() => {
                const d = new Date(); d.setDate(d.getDate() + 1);
                return date === (useGamedayWindow ? getGamedayKey(d.toISOString()) : d.toISOString().split("T")[0]);
              })();

              return (
              <div key={date}>
                {/* DATE SECTION HEADER */}
                <div className="relative mb-6">
                  {/* Full-width divider line */}
                  <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800" />

                  <div className="relative flex items-center gap-3 flex-wrap">
                    {/* Date chip — sits on the line */}
                    <div className="flex items-center gap-3 bg-zinc-950 pr-4 rounded-full border border-zinc-700/60 pl-1 py-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                        isToday ? "bg-yellow-400 text-black" :
                        hasTomorrow ? "bg-zinc-700 text-white" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {new Date(date).getDate()}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black leading-none mb-0.5">
                          {isToday ? "Today" : hasTomorrow ? "Tomorrow" : new Date(date).toLocaleDateString("en-IN", { weekday: "long" })}
                        </div>
                        <div className="text-base font-black leading-none">
                          {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                        </div>
                      </div>
                    </div>

                    {/* Match count */}
                    <div className="bg-zinc-900 border border-zinc-700/60 rounded-full px-3 py-1 text-xs font-black text-zinc-400">
                      {dateMatches.length} {dateMatches.length === 1 ? "match" : "matches"}
                    </div>

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
