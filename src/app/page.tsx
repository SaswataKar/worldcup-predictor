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

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>({});
  const [predictedScores, setPredictedScores] = useState<any>({});
  const [expandedMatches, setExpandedMatches] = useState<any>({});
  const [selectedInventoryBooster, setSelectedInventoryBooster] = useState<any>(null);
  const [usedBoosters, setUsedBoosters] = useState<any[]>([]);
  const [goatDays, setGoatDays] = useState<any[]>([]);

  const cancelledMatchIds = useRef<Set<number>>(new Set());
  const cancelledBoosters = useRef<Set<string>>(new Set());

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
      } catch (error) {
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

    const serverMapped: any = {};
    const serverScoreMap: any = {};

    data.forEach((prediction) => {
      if (cancelledMatchIds.current.has(prediction.match_id)) return;

      serverMapped[prediction.match_id] = prediction;
      serverScoreMap[prediction.match_id] = {
        home: prediction.predicted_team1_score,
        away: prediction.predicted_team2_score,
      };
    });

    setPredictions((prev: any) => {
      const merged = { ...serverMapped };
      Object.keys(prev).forEach((matchId) => {
        if (!(matchId in merged)) {
          merged[matchId] = prev[matchId];
        }
      });
      return merged;
    });

    setPredictedScores((prev: any) => {
      const updated = { ...prev };
      Object.keys(serverScoreMap).forEach((matchId) => {
        if (!prev[matchId]) {
          updated[matchId] = serverScoreMap[matchId];
        }
      });
      return updated;
    });

    const used = data
      .map((p) => p.booster_used)
      .filter((b) => b && b !== "none")
      .filter((b) => !cancelledBoosters.current.has(b));

    setUsedBoosters(Array.from(new Set(used)));
  };

  // FETCH DAILY BOOSTERS
  const fetchDailyBoosters = async (userId: number) => {
    const { data, error } = await supabase
      .from("daily_boosters")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    if (data?.length) {
      setGoatDays(
        data.map((item) => new Date(item.active_date).toISOString().split("T")[0])
      );
    }
  };

  // GOAT ACTIVATION
  const activateGoat = async (activeDate: string) => {
    if (goatDays.length > 0) {
      toast.error("G.O.A.T already used");
      return;
    }

    const confirmed = window.confirm(
      "⚠️ G.O.A.T is a legendary one-time booster.\n\nOnce activated it can NEVER be used again.\n\nActivate for this matchday?"
    );

    if (!confirmed) return;

    const response = await supabase.from("daily_boosters").insert({
      user_id: user.id,
      booster_type: "draw",
      active_date: activeDate,
    });

    if (response.error) {
      toast.error(response.error.message);
      return;
    }

    setGoatDays([...goatDays, activeDate]);
    toast.success("🐐 G.O.A.T activated!");
  };

  // LOCK LOGIC — single source of truth
  // Open: from midnight the day before kickoff until 1 minute before kickoff
  // Everything else (too early, already started, finished) = locked
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
  // Anchor: closest matchday (today or nearest future date with matches)
  // Show: anchor + next 2 matchdays
  const visibleGroupedMatches = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    matches.forEach((match) => {
      if (!match.kickoff_time) return;
      const kickoff = new Date(match.kickoff_time);
      if (isNaN(kickoff.getTime())) return;
      const date = kickoff.toISOString().split("T")[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(match);
    });

    const today = new Date().toISOString().split("T")[0];

    // All matchdays sorted ascending
    const allDays = Object.keys(grouped).sort();

    // Anchor: today if it has matches, otherwise the next matchday from today
    const futureDays = allDays.filter((d) => d >= today);
    const anchor = futureDays[0] ?? allDays[allDays.length - 1];

    if (!anchor) return {};

    const anchorIndex = allDays.indexOf(anchor);
    const windowDays = allDays.slice(anchorIndex, anchorIndex + 3);

    const result: Record<string, any[]> = {};
    windowDays.forEach((day) => {
      result[day] = grouped[day];
    });

    return result;
  }, [matches]);

  // TBD MATCHES
  const tbdMatches = useMemo(() => {
    return matches.filter((match) => {
      if (!match.kickoff_time) return true;
      const kickoff = new Date(match.kickoff_time);
      return isNaN(kickoff.getTime());
    });
  }, [matches]);

  // SUBMIT
  const submitPrediction = async (matchId: number) => {
    const match = matches.find((m) => m.id === matchId);

    if (!match || !canPredict(match.kickoff_time)) {
      toast.error("Predictions are locked for this match");
      return;
    }

    const homeScore = predictedScores[matchId]?.home;
    const awayScore = predictedScores[matchId]?.away;

    if (
      homeScore === undefined ||
      awayScore === undefined ||
      homeScore === "" ||
      awayScore === ""
    ) {
      toast.error("Enter score prediction");
      return;
    }

    let selectedResult = "draw";
    if (homeScore > awayScore) selectedResult = "team1";
    if (awayScore > homeScore) selectedResult = "team2";

    const payload = {
      user_id: user.id,
      match_id: matchId,
      prediction_type: "standard",
      predicted_result: selectedResult,
      predicted_team1_score: Number(homeScore),
      predicted_team2_score: Number(awayScore),
      booster_used: selectedInventoryBooster || "none",
      updated_at: new Date().toISOString(),
    };

    const response = await supabase
      .from("predictions")
      .upsert(payload, { onConflict: "user_id,match_id" });

    if (response.error) {
      toast.error(response.error.message);
      return;
    }

    cancelledMatchIds.current.delete(matchId);

    if (selectedInventoryBooster) {
      cancelledBoosters.current.delete(selectedInventoryBooster);
      setUsedBoosters((prev) => [...new Set([...prev, selectedInventoryBooster])]);
      setSelectedInventoryBooster(null);
    }

    setPredictions({ ...predictions, [matchId]: payload });
    toast.success("Prediction submitted!");
  };

  // CANCEL
  const cancelPrediction = async (matchId: number) => {
    const prediction = predictions[matchId];
    const match = matches.find((m) => m.id === matchId);

    if (
      prediction?.booster_used &&
      prediction.booster_used !== "none" &&
      match &&
      canPredict(match.kickoff_time)
    ) {
      cancelledBoosters.current.add(prediction.booster_used);
      setUsedBoosters((prev) => prev.filter((b) => b !== prediction.booster_used));
    }

    cancelledMatchIds.current.add(matchId);

    setPredictions((prev: any) => {
      const updated = { ...prev };
      delete updated[matchId];
      return updated;
    });

    setPredictedScores((prev: any) => {
      const updated = { ...prev };
      delete updated[matchId];
      return updated;
    });

    const response = await supabase
      .from("predictions")
      .delete()
      .eq("match_id", matchId)
      .eq("user_id", user.id);

    if (response.error) {
      cancelledMatchIds.current.delete(matchId);
      if (prediction?.booster_used && prediction.booster_used !== "none") {
        cancelledBoosters.current.delete(prediction.booster_used);
        setUsedBoosters((prev) => [...new Set([...prev, prediction.booster_used])]);
      }
      setPredictions((prev: any) => ({ ...prev, [matchId]: prediction }));
      setPredictedScores((prev: any) => ({
        ...prev,
        [matchId]: {
          home: prediction.predicted_team1_score,
          away: prediction.predicted_team2_score,
        },
      }));
      toast.error(response.error.message);
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
            selectedInventoryBooster={selectedInventoryBooster}
            setSelectedInventoryBooster={setSelectedInventoryBooster}
            usedBoosters={usedBoosters}
            goatDays={goatDays}
          />

          {/* TBD */}
          {tbdMatches.length > 0 && (
            <div className="mb-16">
              <div className="text-3xl font-black mb-6">🕘 TBD Fixtures</div>
              <div className="space-y-4">
                {tbdMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
                  >
                    <div className="text-2xl font-black">
                      {match.team1} vs {match.team2}
                    </div>
                    <div className="text-zinc-500 mt-2">Kickoff time to be announced</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ROLLING 3-DAY WINDOW */}
          <div className="space-y-16">
            {Object.entries(visibleGroupedMatches).map(([date, dateMatches]: any) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-8">
                  <div className="text-4xl font-black">
                    {new Date(date).toLocaleDateString("en-IN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </div>

                  <button
                    disabled={goatDays.length > 0}
                    onClick={() => activateGoat(date)}
                    className="
                      px-6 py-4 rounded-2xl font-black
                      bg-white text-black
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    {goatDays.length > 0 ? "☠️ G.O.A.T USED" : "🐐 Activate G.O.A.T"}
                  </button>
                </div>

                <div className="space-y-6">
                  {dateMatches.map((match: any) => (
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
                      selectedInventoryBooster={selectedInventoryBooster}
                      setSelectedInventoryBooster={setSelectedInventoryBooster}
                      usedBoosters={usedBoosters}
                      setUsedBoosters={setUsedBoosters}
                      goatDays={goatDays}
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