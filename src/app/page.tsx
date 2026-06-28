"use client";

import Cookies from "js-cookie";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import Header from "@/components/Header";
import MatchCard from "@/components/MatchCard";
import BoosterInventory from "@/components/BoosterInventory";
import BoosterDayBadge from "@/components/BoosterDayBadge";
import GroupCountdown from "@/components/GroupCountdown";
import HowItWorks from "@/components/HowItWorks";
import PageWrapper from "@/components/PageWrapper";

import { useLocaleCtx } from "@/context/LocaleContext";
import { groupMatches, buildGroupLabels, dateFromKey } from "@/lib/matchGroups";
import { getT } from "@/lib/translations";
import type { Match, Prediction, PredictedScore, User } from "@/types";
import { BOOSTER_ICON, BOOSTER_LABEL } from "@/lib/boosterMeta";

const BOOSTER_ICONS: Record<string, string> = { "2x": BOOSTER_ICON("2x"), "3x": BOOSTER_ICON("3x"), draw: BOOSTER_ICON("draw") };
const BOOSTER_NAMES: Record<string, string> = { "2x": BOOSTER_LABEL("2x"), "3x": BOOSTER_LABEL("3x"), draw: BOOSTER_LABEL("draw") };

// ─── Results View ─────────────────────────────────────────────────────────────

function ResultOutcomeBadge({ match, pred }: { match: Match; pred: Prediction | undefined }) {
  if (!pred) return <span className="text-zinc-600 text-xs font-bold">No prediction</span>;
  const isExact = pred.predicted_team1_score === match.team1_score && pred.predicted_team2_score === match.team2_score;
  const actualResult = (match.team1_score ?? 0) > (match.team2_score ?? 0) ? "h" : (match.team2_score ?? 0) > (match.team1_score ?? 0) ? "a" : "d";
  const predResult = pred.predicted_team1_score > pred.predicted_team2_score ? "h" : pred.predicted_team2_score > pred.predicted_team1_score ? "a" : "d";
  const isCorrect = !isExact && actualResult === predResult;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${
      isExact ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
      isCorrect ? "bg-blue-500/15 border-blue-500/25 text-blue-400" :
      "bg-zinc-800 border-zinc-700 text-zinc-500"
    }`}>
      {isExact ? "✨ Exact" : isCorrect ? "✅ Correct" : "✗ Wrong"}
    </span>
  );
}

function ResultsView({
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
  const entries = Object.entries(completedGroups);
  const [selectedKey, setSelectedKey] = useState<string>(entries[entries.length - 1]?.[0] ?? "");

  if (!entries.length) return (
    <div className="text-center py-24 text-zinc-600 font-bold">No completed match days yet.</div>
  );

  const dayMatches = completedGroups[selectedKey] ?? [];
  const utcDate = dateFromKey(selectedKey);
  const dayBoosters = activeDayBoosters[utcDate] || [];
  const dayPoints = dayMatches.reduce((s, m) => s + (predictions[m.id]?.awarded_points ?? 0), 0);

  return (
    <div>
      {/* DAY SELECTOR */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <span className="text-xs uppercase tracking-widest text-zinc-500 font-black">Match Day</span>
        <div className="flex gap-2 flex-wrap">
          {entries.map(([key]) => (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                selectedKey === key
                  ? "bg-yellow-400 text-black shadow-[0_0_12px_3px_rgba(234,179,8,0.3)]"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
              }`}
            >
              {groupLabels[key] ?? key}
            </button>
          ))}
        </div>
        {dayPoints > 0 && (
          <span className="ml-auto px-3 py-1.5 rounded-xl bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 text-sm font-black">
            +{dayPoints} pts earned
          </span>
        )}
        {dayBoosters.length > 0 && (
          <div className="flex gap-1.5">
            {dayBoosters.map((b) => (
              <span key={b} className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-black text-zinc-300">
                {BOOSTER_ICONS[b]} {BOOSTER_LABEL(b)} used
              </span>
            ))}
          </div>
        )}
      </div>

      {/* MATCH CARDS */}
      <div className="space-y-5">
        {dayMatches.map((match) => {
          const pred = predictions[match.id];
          const goals = (match.goals ?? []) as any[];
          const bookings = (match.bookings ?? []) as any[];
          const subs = (match.substitutions ?? []) as any[];
          const homeGoals = goals.filter((g) => g.team === "home");
          const awayGoals = goals.filter((g) => g.team === "away");
          const homeBookings = bookings.filter((b) => b.team === "home");
          const awayBookings = bookings.filter((b) => b.team === "away");

          return (
            <div key={match.id} className="rounded-3xl border border-white/[0.08] backdrop-blur-md overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)]">

              {/* SCORE HEADER */}
              <div className="px-4 sm:px-6 py-5 bg-white/[0.02]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Teams + score */}
                  <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={match.team1_crest || "/placeholder-team.png"} className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" />
                      <span className="font-black text-sm sm:text-base truncate">{match.team1}</span>
                    </div>
                    <div className="shrink-0 text-center">
                      <div className="text-2xl sm:text-3xl font-black tabular-nums">
                        {match.team1_score} <span className="text-zinc-600">–</span> {match.team2_score}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-0.5">Final</div>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={match.team2_crest || "/placeholder-team.png"} className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" />
                      <span className="font-black text-sm sm:text-base truncate">{match.team2}</span>
                    </div>
                  </div>

                  {/* Prediction summary */}
                  <div className="flex items-center gap-2 flex-wrap text-xs shrink-0">
                    {pred && (
                      <span className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 font-black tabular-nums text-sm">
                        🎯 {pred.predicted_team1_score}–{pred.predicted_team2_score}
                      </span>
                    )}
                    <ResultOutcomeBadge match={match} pred={pred} />
                    {(pred?.awarded_points ?? 0) > 0 && (
                      <span className="px-3 py-1.5 rounded-xl bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 font-black text-sm">
                        +{pred!.awarded_points} 🏆
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* EVENTS — goals + cards */}
              {(goals.length > 0 || bookings.length > 0) && (
                <div className="border-t border-white/[0.06] px-4 sm:px-6 py-4 grid grid-cols-2 gap-4">
                  {/* HOME SIDE */}
                  <div className="space-y-1.5">
                    {homeGoals.map((g, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="shrink-0">{g.ownGoal ? "⚽🔴" : g.penalty ? "⚽🎯" : "⚽"}</span>
                        <span className="font-bold truncate">{g.scorer}</span>
                        <span className="text-zinc-600 shrink-0">{g.minute}</span>
                      </div>
                    ))}
                    {homeBookings.map((b, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="shrink-0">{b.type === "Red" ? "🟥" : "🟨"}</span>
                        <span className="font-bold truncate">{b.player}</span>
                        <span className="text-zinc-600 shrink-0">{b.minute}</span>
                      </div>
                    ))}
                    {subs.filter((s) => s.team === "home").map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <span className="shrink-0">🔄</span>
                        <span className="truncate"><span className="text-emerald-400">{s.playerIn}</span> / <span className="text-red-400">{s.playerOut}</span></span>
                        <span className="text-zinc-600 shrink-0">{s.minute}</span>
                      </div>
                    ))}
                  </div>

                  {/* AWAY SIDE */}
                  <div className="space-y-1.5">
                    {awayGoals.map((g, i) => (
                      <div key={i} className="flex items-center justify-end gap-1.5 text-xs">
                        <span className="text-zinc-600 shrink-0">{g.minute}</span>
                        <span className="font-bold truncate text-right">{g.scorer}</span>
                        <span className="shrink-0">{g.ownGoal ? "⚽🔴" : g.penalty ? "⚽🎯" : "⚽"}</span>
                      </div>
                    ))}
                    {awayBookings.map((b, i) => (
                      <div key={i} className="flex items-center justify-end gap-1.5 text-xs">
                        <span className="text-zinc-600 shrink-0">{b.minute}</span>
                        <span className="font-bold truncate text-right">{b.player}</span>
                        <span className="shrink-0">{b.type === "Red" ? "🟥" : "🟨"}</span>
                      </div>
                    ))}
                    {subs.filter((s) => s.team === "away").map((s, i) => (
                      <div key={i} className="flex items-center justify-end gap-1.5 text-xs text-zinc-500">
                        <span className="text-zinc-600 shrink-0">{s.minute}</span>
                        <span className="truncate text-right"><span className="text-emerald-400">{s.playerIn}</span> / <span className="text-red-400">{s.playerOut}</span></span>
                        <span className="shrink-0">🔄</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
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
        ...(prediction.predicted_penalty ? {
          penaltyShootout: true,
          pkHome: prediction.predicted_pk_team1_score ?? "",
          pkAway: prediction.predicted_pk_team2_score ?? "",
        } : {}),
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

  // ET date of the active group (used for booster storage/lookup)
  const activeMatchdayDate = activeMatchday ? dateFromKey(activeMatchday) : null;

  // Next upcoming matchday after the active one — used so users can pre-assign
  // their booster before the active matchday window closes (important for IST users
  // whose local midnight falls before the first ET kickoff).
  const nextMatchdayDate = useMemo(() => {
    const keys = Object.keys(visibleGroupedMatches);
    const activeIdx = activeMatchday ? keys.indexOf(activeMatchday) : -1;
    const nextKey = activeIdx >= 0 ? keys[activeIdx + 1] : keys[0];
    return nextKey ? dateFromKey(nextKey) : null;
  }, [activeMatchday, visibleGroupedMatches]);

  // Human-readable labels for active and next matchday (e.g. "Group Stage · Day 7")
  const activeMatchdayLabel = activeMatchday ? (groupLabels[activeMatchday] ?? null) : null;
  const nextMatchdayLabel = useMemo(() => {
    const keys = Object.keys(visibleGroupedMatches);
    const activeIdx = activeMatchday ? keys.indexOf(activeMatchday) : -1;
    const nextKey = activeIdx >= 0 ? keys[activeIdx + 1] : null;
    return nextKey ? (groupLabels[nextKey] ?? null) : null;
  }, [activeMatchday, visibleGroupedMatches, groupLabels]);

  // First kickoff of the active matchday — shown as the booster deadline in local TZ
  const activeMatchdayFirstKickoff = useMemo(() => {
    if (!activeMatchday) return null;
    const dayMatches = visibleGroupedMatches[activeMatchday] || [];
    const times = dayMatches
      .map((m) => m.kickoff_time ? new Date(m.kickoff_time).getTime() : Infinity)
      .filter((t) => t !== Infinity);
    return times.length ? new Date(Math.min(...times)) : null;
  }, [activeMatchday, visibleGroupedMatches]);

  // Booster window closes once the FIRST match on the matchday kicks off.
  // Activate and remove share the same threshold to prevent the trap where
  // you can activate but then can't undo (remove is blocked on first kickoff).
  const isActiveMatchdayConsumed = useMemo(() => {
    if (!activeMatchday) return false;
    const dayMatches = visibleGroupedMatches[activeMatchday] || [];
    const now = new Date();
    return dayMatches.some((m) => {
      if (!m.kickoff_time) return false;
      return now >= new Date(new Date(m.kickoff_time).getTime() - 60 * 1000);
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

    const isKnockout = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"]
      .includes(match.matchday ?? "");
    const isDraw = Number(homeScore) === Number(awayScore);
    const isPK = !!predictedScores[matchId]?.penaltyShootout;
    const pkHome = predictedScores[matchId]?.pkHome;
    const pkAway = predictedScores[matchId]?.pkAway;

    if (isKnockout && isDraw && !isPK) {
      toast.error("Draws not allowed in knockout — change score or toggle penalties");
      return;
    }

    if (isKnockout && isPK) {
      if (!isDraw) {
        toast.error("Score after extra time must be a draw when penalties is on");
        return;
      }
      if (pkHome === undefined || pkAway === undefined || pkHome === "" || pkAway === "") {
        toast.error("Enter the penalty shootout score");
        return;
      }
      if (Number(pkHome) === Number(pkAway)) {
        toast.error("Penalty score can't be a draw");
        return;
      }
    }

    let selectedResult = "draw";
    if (homeScore > awayScore) selectedResult = "team1";
    if (awayScore > homeScore) selectedResult = "team2";
    if (isKnockout && isPK) {
      selectedResult = Number(pkHome) > Number(pkAway) ? "team1" : "team2";
    }

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
        ...(isPK ? { penalty: true, pkHome: Number(pkHome), pkAway: Number(pkAway) } : {}),
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

  const [activeTab, setActiveTab] = useState<"predict" | "results">("predict");
  const hasCompleted = Object.keys(completedGroupedMatches).length > 0;

  if (!user) return null;

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />

          <HowItWorks />

          {/* TAB TOGGLE */}
          <div className="flex items-center gap-2 mb-8 p-1 rounded-2xl bg-zinc-900/70 border border-zinc-800 w-fit">
            <button
              onClick={() => setActiveTab("predict")}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === "predict"
                  ? "bg-yellow-400 text-black shadow-[0_0_14px_3px_rgba(234,179,8,0.35)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🎯 Predict
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all relative ${
                activeTab === "results"
                  ? "bg-yellow-400 text-black shadow-[0_0_14px_3px_rgba(234,179,8,0.35)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              📋 Results
              {hasCompleted && activeTab !== "results" && (
                <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-yellow-400 border-2 border-zinc-900" />
              )}
            </button>
          </div>

          {activeTab === "results" ? (
            <ResultsView
              completedGroups={completedGroupedMatches}
              groupLabels={groupLabels}
              predictions={predictions}
              activeDayBoosters={activeDayBoosters}
            />
          ) : (
            <>
          <BoosterInventory
            usedBoosterTypes={usedBoosterTypes}
            activeDayBoosters={activeDayBoosters}
            activeMatchday={activeMatchdayDate}
            activeMatchdayLabel={activeMatchdayLabel}
            nextMatchday={nextMatchdayDate}
            nextMatchdayLabel={nextMatchdayLabel}
            activeMatchdayFirstKickoff={activeMatchdayFirstKickoff}
            isMatchdayConsumed={isActiveMatchdayConsumed}
            onActivate={(boosterType, date) => activateBooster(boosterType, date)}
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
            {Object.entries(visibleGroupedMatches).map(([groupKey, dateMatches], groupIdx) => {
              const utcDate = dateFromKey(groupKey);
              const dayBoosters = activeDayBoosters[utcDate] || [];
              const label = groupLabels[groupKey] ?? groupKey;
              const visibleKeys = Object.keys(visibleGroupedMatches);
              // Eligible for booster = any matchday visible on the predictor screen
              const isEligibleForBooster = true;
              // "Today" / "Tomorrow" label — compare ET date
              const etToday = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
              const etTomorrow = (() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
              })();
              const isToday = utcDate === etToday;
              const isTomorrow = utcDate === etTomorrow;

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

                    {/* Booster badge — interactive for active/next day, display-only otherwise */}
                    {user && (
                      <BoosterDayBadge
                        date={utcDate}
                        groupLabel={label}
                        dayBoosters={dayBoosters}
                        usedBoosterTypes={usedBoosterTypes}
                        isEligible={isEligibleForBooster}
                        dayMatches={dateMatches}
                        onActivate={activateBooster}
                        onRemove={removeBooster}
                      />
                    )}
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
          </>
          )}
        </div>
      </main>
    </PageWrapper>
  );
}
