"use client";

import { useEffect, useMemo, useState } from "react";

import Header from "@/components/Header";
import PageWrapper from "@/components/PageWrapper";

import Cookies from "js-cookie";

export default function FixturesPage() {
  const [matches, setMatches] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [user, setUser] =
    useState<any>(null);

  useEffect(() => {
    const storedUser =
      Cookies.get("user");

    if (storedUser) {
      setUser(
        JSON.parse(
          storedUser
        )
      );
    }

    fetchMatches();
  }, []);

  // FETCH MATCHES FROM DB API
  const fetchMatches =
    async () => {
      try {
        const response =
          await fetch(
            "/api/matches"
          );

        const data =
          await response.json();

        setMatches(
          data.matches || []
        );
      } catch (error) {
        console.error(
          "Fixtures Fetch Error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  // GROUP BY DATE
  const groupedMatches =
    useMemo(() => {
      const grouped: any = {};

      matches.forEach(
        (match) => {
          // TBD
          if (
            !match.kickoff_time
          ) {
            if (
              !grouped["TBD"]
            ) {
              grouped["TBD"] =
                [];
            }

            grouped[
              "TBD"
            ].push(match);

            return;
          }

          const kickoff =
            new Date(
              match.kickoff_time
            );

          // INVALID DATE
          if (
            isNaN(
              kickoff.getTime()
            )
          ) {
            if (
              !grouped["TBD"]
            ) {
              grouped["TBD"] =
                [];
            }

            grouped[
              "TBD"
            ].push(match);

            return;
          }

          const date =
            kickoff
              .toISOString()
              .split("T")[0];

          if (
            !grouped[date]
          ) {
            grouped[date] =
              [];
          }

          grouped[
            date
          ].push(match);
        }
      );

      return grouped;
    }, [matches]);

  // FORMAT DATE
  const formatDate = (
    dateString: string
  ) => {
    if (
      dateString === "TBD"
    ) {
      return "🕘 TBD Fixtures";
    }

    return new Date(
      dateString
    ).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",

        day: "numeric",

        month: "long",
      }
    );
  };

  // FORMAT TIME
  const formatTime = (
    utcTime: string
  ) => {
    if (!utcTime)
      return "TBD";

    const kickoff =
      new Date(utcTime);

    if (
      isNaN(
        kickoff.getTime()
      )
    ) {
      return "TBD";
    }

    return kickoff.toLocaleString(
      "en-IN",
      {
        timeZone:
          "Asia/Kolkata",

        dateStyle: "medium",

        timeStyle: "short",
      }
    );
  };

  // MATCH STATUS
  const getStatusBadge = (
    status: string
  ) => {
    switch (status) {
      case "FINISHED":
        return (
          <div className="bg-green-500/15 border border-green-500/30 text-green-300 px-4 py-2 rounded-2xl text-sm font-black">
            FT
          </div>
        );

      case "LIVE":
      case "IN_PLAY":
        return (
          <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-2 rounded-2xl text-sm font-black animate-pulse">
            LIVE
          </div>
        );

      case "TIMED":
      case "SCHEDULED":
        return (
          <div className="bg-blue-500/15 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-2xl text-sm font-black">
            UPCOMING
          </div>
        );

      default:
        return (
          <div className="bg-zinc-700 text-zinc-300 px-4 py-2 rounded-2xl text-sm font-black">
            {status}
          </div>
        );
    }
  };

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />

          {/* TITLE */}
          <div className="mb-14">
            <div className="text-zinc-500 uppercase tracking-[0.3em] text-sm font-black mb-3">
              FIFA WORLD CUP
              2026
            </div>

            <h1 className="text-6xl font-black leading-none">
              Tournament
              Fixtures
            </h1>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-32">
              <div className="text-3xl font-black animate-pulse">
                ⚽ Loading
                Fixtures...
              </div>
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            matches.length ===
              0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-16 text-center">
                <div className="text-6xl mb-6">
                  🏟️
                </div>

                <div className="text-3xl font-black mb-3">
                  No Fixtures
                  Available
                </div>

                <div className="text-zinc-500">
                  Sync the
                  football API
                  first.
                </div>
              </div>
            )}

          {/* GROUPED FIXTURES */}
          <div className="space-y-16">
            {Object.entries(
              groupedMatches
            ).map(
              ([
                date,
                dateMatches,
              ]: any) => (
                <div
                  key={date}
                >
                  {/* DATE HEADER */}
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-3xl px-8 py-5">
                      <div className="text-3xl">
                        🏆
                      </div>

                      <div className="text-3xl font-black">
                        {formatDate(
                          date
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MATCHES */}
                  <div className="space-y-6">
                    {dateMatches.map(
                      (
                        match: any
                      ) => (
                        <div
                          key={
                            match.id
                          }
                          className="
                            bg-gradient-to-b
                            from-zinc-900
                            to-black
                            border
                            border-zinc-800
                            rounded-[32px]
                            p-8
                            shadow-2xl
                          "
                        >
                          <div className="flex justify-between items-center gap-8 flex-wrap">
                            {/* LEFT */}
                            <div className="flex items-center gap-10 flex-wrap">
                              {/* TEAM 1 */}
                              <div className="flex items-center gap-4 min-w-[240px]">
                                <img
                                  src={
                                    match.team1_crest ||
                                    "/placeholder-team.png"
                                  }
                                  className="w-16 h-16 object-contain"
                                />

                                <div className="text-2xl font-black">
                                  {
                                    match.team1
                                  }
                                </div>
                              </div>

                              {/* SCORE / VS */}
                              <div className="flex flex-col items-center justify-center min-w-[140px]">
                                {match.status ===
                                  "FINISHED" ||
                                match.status ===
                                  "LIVE" ||
                                match.status ===
                                  "IN_PLAY" ? (
                                  <>
                                    <div className="text-5xl font-black">
                                      {
                                        match.team1_score
                                      }
                                      {" - "}
                                      {
                                        match.team2_score
                                      }
                                    </div>

                                    <div className="text-zinc-500 text-sm mt-2 uppercase tracking-[0.2em]">
                                      SCORE
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-4xl font-black text-zinc-600">
                                      VS
                                    </div>

                                    <div className="text-zinc-500 text-sm mt-2 uppercase tracking-[0.2em]">
                                      Upcoming
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* TEAM 2 */}
                              <div className="flex items-center gap-4 min-w-[240px] justify-end">
                                <div className="text-2xl font-black text-right">
                                  {
                                    match.team2
                                  }
                                </div>

                                <img
                                  src={
                                    match.team2_crest ||
                                    "/placeholder-team.png"
                                  }
                                  className="w-16 h-16 object-contain"
                                />
                              </div>
                            </div>

                            {/* RIGHT */}
                            <div className="flex flex-col items-end gap-4">
                              {getStatusBadge(
                                match.status
                              )}

                              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-right">
                                <div className="text-zinc-400 text-xs uppercase tracking-[0.2em] mb-1">
                                  Kickoff
                                </div>

                                <div className="font-black">
                                  {formatTime(
                                    match.kickoff_time
                                  )}
                                </div>
                              </div>

                              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-4 py-2 rounded-2xl text-sm font-black">
                                {
                                  match.matchday
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
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