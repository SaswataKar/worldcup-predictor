"use client";

import { useEffect, useState } from "react";

import Header from "@/components/Header";
import PageWrapper from "@/components/PageWrapper";

import { supabase } from "@/lib/supabase";

export default function LeaderboardPage() {
  const [leaders, setLeaders] =
    useState<any[]>([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard =
    async () => {
      const {
        data,
        error,
      } = await supabase
        .from("leaderboard")
        .select("*")
        .order(
          "total_points",
          {
            ascending:
              false,
          }
        );

      if (!error && data) {
        setLeaders(data);
      }
    };

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-6">
        <div className="max-w-6xl mx-auto">
          <Header />

          {/* HERO */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 rounded-2xl mb-6">
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />

              <span className="text-yellow-300 font-bold uppercase tracking-[0.25em] text-sm">
                Global Rankings
              </span>
            </div>

            <h1 className="text-6xl font-black tracking-tight leading-none">
              Leaderboard
            </h1>

            <p className="text-zinc-400 text-lg mt-4 max-w-2xl">
              Climb the rankings,
              dominate matchdays
              and become the
              ultimate predictor.
            </p>
          </div>

          {/* TABLE */}
          <div className="space-y-5">
            {leaders.map(
              (
                leader,
                index
              ) => (
                <div
                  key={
                    leader.id
                  }
                  className="
                    rounded-[32px]
                    border
                    border-zinc-800
                    bg-gradient-to-b
                    from-zinc-900
                    to-black
                    p-8
                    flex
                    items-center
                    justify-between
                    flex-wrap
                    gap-6
                  "
                >
                  {/* LEFT */}
                  <div className="flex items-center gap-6">
                    {/* RANK */}
                    <div
                      className={`
                        w-16
                        h-16
                        rounded-2xl
                        flex
                        items-center
                        justify-center
                        text-2xl
                        font-black

                        ${
                          index === 0
                            ? `
                              bg-yellow-500/20
                              text-yellow-300
                            `
                            : index === 1
                            ? `
                              bg-zinc-500/20
                              text-zinc-200
                            `
                            : index === 2
                            ? `
                              bg-amber-800/30
                              text-amber-400
                            `
                            : `
                              bg-zinc-800
                              text-zinc-300
                            `
                        }
                      `}
                    >
                      #
                      {index + 1}
                    </div>

                    {/* USER */}
                    <div>
                      <div className="text-3xl font-black">
                        {
                          leader.username
                        }
                      </div>

                      <div className="text-zinc-500 mt-2">
                        🎯{" "}
                        {
                          leader.exact_predictions
                        }{" "}
                        exact predictions
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="text-right">
                    <div className="text-zinc-500 uppercase tracking-[0.25em] text-xs">
                      Total Points
                    </div>

                    <div className="text-6xl font-black mt-2">
                      {
                        leader.total_points
                      }
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}