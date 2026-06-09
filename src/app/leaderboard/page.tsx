"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import Header from "@/components/Header";
import PageWrapper from "@/components/PageWrapper";

import { supabase } from "@/lib/supabase";

type LeaderEntry = {
  id: number;
  user_id: number;
  username: string;
  total_points: number;
  exact_predictions: number;
  correct_results: number;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = Cookies.get("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    // Sync all users into leaderboard before fetching
    await fetch("/api/sync-leaderboard", { cache: "no-store" });

    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("total_points", { ascending: false });

    if (!error && data) setLeaders(data);
    setLoading(false);
  };

  const rankStyle = (index: number) => {
    if (index === 0) return "bg-yellow-500/20 text-yellow-300";
    if (index === 1) return "bg-zinc-500/20 text-zinc-200";
    if (index === 2) return "bg-amber-800/30 text-amber-400";
    return "bg-zinc-800 text-zinc-300";
  };

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-6">
        <div className="max-w-6xl mx-auto">
          <Header user={user} />

          {/* HERO */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 rounded-2xl mb-6">
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-300 font-bold uppercase tracking-[0.25em] text-sm">
                Global Rankings
              </span>
            </div>

            <h1 className="text-6xl font-black tracking-tight leading-none">Leaderboard</h1>

            <p className="text-zinc-400 text-lg mt-4 max-w-2xl">
              Climb the rankings, dominate matchdays and become the ultimate predictor.
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-32">
              <div className="text-3xl font-black animate-pulse">⚽ Loading Rankings...</div>
            </div>
          )}

          {/* TABLE */}
          {!loading && (
            <div className="space-y-4">
              {leaders.map((leader, index) => (
                <div
                  key={leader.id}
                  className="overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-950 shadow-xl px-6 py-5 flex items-center justify-between flex-wrap gap-6"
                >
                  {/* LEFT */}
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${rankStyle(index)}`}
                    >
                      #{index + 1}
                    </div>

                    <div>
                      <div className="text-2xl font-black">{leader.username}</div>
                      <div className="flex items-center gap-4 text-zinc-500 text-sm mt-1">
                        <span>🎯 {leader.exact_predictions} exact</span>
                        <span className="text-zinc-700">·</span>
                        <span>✅ {leader.correct_results} correct</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="text-right">
                    <div className="text-[11px] text-zinc-600 uppercase tracking-widest mb-1">
                      Total Points
                    </div>
                    <div className="text-5xl font-black">{leader.total_points}</div>
                  </div>
                </div>
              ))}

              {leaders.length === 0 && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 text-center">
                  <div className="text-6xl mb-6">🏆</div>
                  <div className="text-3xl font-black mb-3">No rankings yet</div>
                  <div className="text-zinc-500">Start predicting to appear here.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </PageWrapper>
  );
}
