"use client";

import Cookies from "js-cookie";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import Header from "@/components/Header";
import MatchCard from "@/components/MatchCard";
import BoosterInventory from "@/components/BoosterInventory";
import PageWrapper from "@/components/PageWrapper";

import { supabase } from "@/lib/supabase";
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

  // ACTIVATE BOOSTER (any type, any day)
  const activateBooster = async (boosterType: string, date: string) => {
    if (!user) return;

    const { error } = await supabase.from("daily_boosters").insert({
      user_id: user.id,
      booster_type: boosterType,
      active_date: date,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    setUsedBoosterTypes((prev) => [...prev, boosterType]);
    setActiveDayBoosters((prev) => ({
      ...prev,
      [date]: [...(prev[date] || []), boosterType],
    }));

    toast.success(`${BOOSTER_NAMES[boosterType] ?? boosterType} activated!`);
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

  // ROLLING 3-DAY WINDOW
  const visibleGroupedMatches = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    matches.forEach((match) => {
      if (!match.kickoff_time) return;
      const kickoff = new Date(match.kickoff_time);
      if (isNaN(kickoff.getTime())) return;
      const date = kickoff.toISOString().split("T")[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(match);
    });

    const today = new Date().toISOString().split("T")[0];
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

  const visibleDays = useMemo(() => Object.keys(visibleGroupedMatches), [visibleGroupedMatches]);

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
      <main className="min-h-screen text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />

          <BoosterInventory
            usedBoosterTypes={usedBoosterTypes}
            activeDayBoosters={activeDayBoosters}
            visibleDays={visibleDays}
            onActivate={activateBooster}
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
          <div className="space-y-16">
            {Object.entries(visibleGroupedMatches).map(([date, dateMatches]) => (
              <div key={date}>
                {/* DATE HEADER */}
                <div className="flex items-center gap-4 mb-8 flex-wrap">
                  <div className="text-4xl font-black">
                    {new Date(date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </div>

                  {/* ACTIVE BOOSTER BADGES FOR THIS DAY */}
                  {(activeDayBoosters[date] || []).length > 0 && (
                    <div className="flex gap-2">
                      {(activeDayBoosters[date] || []).map((b) => (
                        <span
                          key={b}
                          className="px-3 py-1.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-sm font-black text-zinc-300"
                        >
                          {b === "2x" ? "⚽ 2x" : b === "3x" ? "🔥 3x" : "🐐 G.O.A.T"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
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
            ))}
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}
