"use client";

import Cookies from "js-cookie";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "@/components/Header";
import MatchCard from "@/components/MatchCard";
import BoosterInventory from "@/components/BoosterInventory";
import PageWrapper from "@/components/PageWrapper";

import { supabase } from "@/lib/supabase";

export default function Home() {
  const router =
    useRouter();

  const [user, setUser] =
    useState<any>(null);

  const [matches, setMatches] =
    useState<any[]>([]);

  const [predictions, setPredictions] =
    useState<any>({});

  const [
    predictedScores,
    setPredictedScores,
  ] = useState<any>({});

  const [
    expandedMatches,
    setExpandedMatches,
  ] = useState<any>({});

  const [
    selectedInventoryBooster,
    setSelectedInventoryBooster,
  ] = useState<any>(null);

  const [
    usedBoosters,
    setUsedBoosters,
  ] = useState<any[]>([]);

  const [
    goatDays,
    setGoatDays,
  ] = useState<any[]>([]);

  // INIT
  useEffect(() => {
    const init =
      async () => {
        const storedUser =
          Cookies.get(
            "user"
          );

        // NO COOKIE
        if (!storedUser) {
          router.push(
            "/login"
          );

          return;
        }

        try {
          const parsedUser =
            JSON.parse(
              storedUser
            );

          // VERIFY USER STILL EXISTS
          const {
            data:
              existingUser,
          } = await supabase
            .from("users")
            .select("*")
            .eq(
              "id",
              parsedUser.id
            )
            .single();

          // USER DELETED
          if (
            !existingUser
          ) {
            Cookies.remove(
              "user"
            );

            toast.error(
              "Session expired. Please login again."
            );

            router.push(
              "/login"
            );

            return;
          }

          // VALID SESSION
          setUser(
            existingUser
          );

          await fetchMatches();

          await fetchPredictions(
            existingUser.id
          );

          await fetchDailyBoosters(
            existingUser.id
          );
        } catch (error) {
          Cookies.remove(
            "user"
          );

          router.push(
            "/login"
          );
        }
      };

    init();
  }, []);
  
  // AUTO REFRESH
  useEffect(() => {
    if (!user) return;

    const interval =
      setInterval(async () => {
        await fetchMatches();

        await fetchPredictions(
          user.id
        );

        await fetchDailyBoosters(
          user.id
        );
      }, 10000);

    return () =>
      clearInterval(
        interval
      );
  }, [user]);

  // FETCH MATCHES
  const fetchMatches =
    async () => {
      try {
        const response =
          await fetch(
            "/api/matches",
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        setMatches((prev) => {
          const next =
            data.matches || [];

          if (
            JSON.stringify(prev) ===
            JSON.stringify(next)
          ) {
            return prev;
          }

          return next;
        });
      } catch (error) {
        console.error(
          "Fetch Matches Error:",
          error
        );
      }
    };



  // FETCH PREDICTIONS
  const fetchPredictions =
    async (userId: number) => {
      const {
        data,
        error,
      } = await supabase
        .from("predictions")
        .select("*")
        .eq(
          "user_id",
          userId
        );

      if (
        !error &&
        data
      ) {
        const mapped: any =
          {};

        const scoreMap: any =
          {};

        data.forEach(
          (
            prediction
          ) => {
            mapped[
              prediction.match_id
            ] =
              prediction;

            scoreMap[
              prediction.match_id
            ] = {
              home:
                prediction.predicted_team1_score,

              away:
                prediction.predicted_team2_score,
            };
          }
        );

        setPredictions(
          mapped
        );


        setPredictedScores(
          (prev: any) => {
            const updated = {
              ...prev,
            };

            Object.keys(
              scoreMap
            ).forEach(
              (matchId) => {
                // ONLY UPDATE IF USER HASN'T STARTED TYPING
                if (
                  !prev[
                    matchId
                  ]
                ) {
                  updated[
                    matchId
                  ] =
                    scoreMap[
                      matchId
                    ];
                }
              }
            );

            return updated;
          }
        );



        const used =
          data
            .map(
              (
                prediction
              ) =>
                prediction.booster_used
            )
            .filter(
              (
                booster
              ) =>
                booster &&
                booster !==
                  "none"
            );

        setUsedBoosters(
          Array.from(
            new Set(used)
          )
        );
      }
    };

  // FETCH GOAT
  const fetchDailyBoosters =
    async (userId: number) => {
      const {
        data,
        error,
      } = await supabase
        .from(
          "daily_boosters"
        )
        .select("*")
        .eq(
          "user_id",
          userId
        );

      if (error) {
        console.error(
          error
        );

        return;
      }

      if (
        data?.length
      ) {
        setGoatDays(
          data.map(
            (item) =>
              new Date(
                item.active_date
              )
                .toISOString()
                .split(
                  "T"
                )[0]
          )
        );
      }
    };

  // GOAT ACTIVATION
  const activateGoat =
    async (
      activeDate: string
    ) => {
      if (
        goatDays.length >
        0
      ) {
        toast.error(
          "G.O.A.T already used"
        );

        return;
      }

      const confirmed =
        window.confirm(
          "⚠️ G.O.A.T is a legendary one-time booster.\n\nOnce activated it can NEVER be used again.\n\nActivate for this matchday?"
        );

      if (!confirmed)
        return;

      const response =
        await supabase
          .from(
            "daily_boosters"
          )
          .insert({
            user_id:
              user.id,

            booster_type:
              "draw",

            active_date:
              activeDate,
          });

      if (
        response.error
      ) {
        toast.error(
          response.error
            .message
        );

        return;
      }

      setGoatDays([
        ...goatDays,
        activeDate,
      ]);

      toast.success(
        "🐐 G.O.A.T activated!"
      );
    };

  // GROUP MATCHES
  const groupedMatches =
    useMemo(() => {
      const grouped: any =
        {};

      matches.forEach(
        (match) => {
          if (
            !match.kickoff_time
          ) {
            return;
          }

          const kickoff =
            new Date(
              match.kickoff_time
            );

          if (
            isNaN(
              kickoff.getTime()
            )
          ) {
            return;
          }

          const date =
            kickoff
              .toISOString()
              .split(
                "T"
              )[0];

          if (
            !grouped[
              date
            ]
          ) {
            grouped[
              date
            ] = [];
          }

          grouped[
            date
          ].push(match);
        }
      );

      return grouped;
    }, [matches]);

  // TBD MATCHES
  const tbdMatches =
    useMemo(() => {
      return matches.filter(
        (match) => {
          if (
            !match.kickoff_time
          ) {
            return true;
          }

          const kickoff =
            new Date(
              match.kickoff_time
            );

          return isNaN(
            kickoff.getTime()
          );
        }
      );
    }, [matches]);

  // LOCK LOGIC
  const canPredict = (
    kickoffTime: string
  ) => {
    if (!kickoffTime)
      return false;

    const now =
      new Date();

    const kickoff =
      new Date(
        kickoffTime
      );

    if (
      isNaN(
        kickoff.getTime()
      )
    ) {
      return false;
    }

    const openTime =
      new Date(
        kickoff
      );

    openTime.setDate(
      openTime.getDate() -
        1
    );

    openTime.setHours(
      0,
      0,
      0,
      0
    );

    const closeTime =
      new Date(
        kickoff.getTime() -
          1 *
            60 *
            1000
      );

    return (
      now >= openTime &&
      now < closeTime
    );
  };

  // SUBMIT
  const submitPrediction =
    async (
      matchId: number
    ) => {
      // LOCK CHECK
      const match =
        matches.find(
          (m) =>
            m.id ===
            matchId
        );

      if (
        !match ||
        !canPredict(
          match.kickoff_time
        )
      ) {
        toast.error(
          "Predictions are locked for this match"
        );

        return;
      }

      const homeScore =
        predictedScores[
          matchId
        ]?.home;

      const awayScore =
        predictedScores[
          matchId
        ]?.away;

      // VALIDATION
      if (
        homeScore ===
          undefined ||
        awayScore ===
          undefined ||
        homeScore ===
          "" ||
        awayScore ===
          ""
      ) {
        toast.error(
          "Enter score prediction"
        );

        return;
      }

      let selectedResult =
        "draw";

      if (
        homeScore >
        awayScore
      ) {
        selectedResult =
          "team1";
      }

      if (
        awayScore >
        homeScore
      ) {
        selectedResult =
          "team2";
      }

      const payload = {
        user_id:
          user.id,

        match_id:
          matchId,

        prediction_type:
          "standard",

        predicted_result:
          selectedResult,

        predicted_team1_score:
          Number(
            homeScore
          ),

        predicted_team2_score:
          Number(
            awayScore
          ),

        booster_used:
          selectedInventoryBooster ||
          "none",

        updated_at:
          new Date().toISOString(),
      };

      const response =
        await supabase
          .from(
            "predictions"
          )
          .upsert(
            payload,
            {
              onConflict:
                "user_id,match_id",
            }
          );

      if (
        response.error
      ) {
        toast.error(
          response.error
            .message
        );

        return;
      }

      // UPDATE LOCAL STATE
      setPredictions({
        ...predictions,

        [matchId]:
          payload,
      });

      // UPDATE BOOSTERS
      if (
        selectedInventoryBooster
      ) {
        setUsedBoosters(
          (prev) => [
            ...new Set([
              ...prev,
              selectedInventoryBooster,
            ]),
          ]
        );

        setSelectedInventoryBooster(
          null
        );
      }

      toast.success(
        "Prediction submitted!"
      );
    };

  // CANCEL
  const cancelPrediction =
    async (
      matchId: number
    ) => {
      const prediction =
        predictions[
          matchId
        ];

      const match =
        matches.find(
          (m) =>
            m.id ===
            matchId
        );

      if (
        prediction?.booster_used &&
        prediction.booster_used !==
          "none" &&
        match &&
        canPredict(
          match.kickoff_time
        )
      ) {
        setUsedBoosters(
          (prev) =>
            prev.filter(
              (
                booster
              ) =>
                booster !==
                prediction.booster_used
            )
        );
      }

      const response =
        await supabase
          .from(
            "predictions"
          )
          .delete()
          .eq(
            "match_id",
            matchId
          )
          .eq(
            "user_id",
            user.id
          );

      if (
        response.error
      ) {
        toast.error(
          response.error
            .message
        );

        return;
      }

      const updated = {
        ...predictions,
      };

      delete updated[
        matchId
      ];

      setPredictions(
        updated
      );

      toast.success(
        "Prediction cancelled"
      );
    };

  if (!user) {
    return null;
  }

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />

          <BoosterInventory
            selectedInventoryBooster={
              selectedInventoryBooster
            }
            setSelectedInventoryBooster={
              setSelectedInventoryBooster
            }
            usedBoosters={
              usedBoosters
            }
            goatDays={
              goatDays
            }
          />

          {/* TBD */}
          {tbdMatches.length >
            0 && (
            <div className="mb-16">
              <div className="text-3xl font-black mb-6">
                🕘 TBD Fixtures
              </div>

              <div className="space-y-4">
                {tbdMatches.map(
                  (
                    match
                  ) => (
                    <div
                      key={
                        match.id
                      }
                      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
                    >
                      <div className="text-2xl font-black">
                        {
                          match.team1
                        }{" "}
                        vs{" "}
                        {
                          match.team2
                        }
                      </div>

                      <div className="text-zinc-500 mt-2">
                        Kickoff
                        time to be
                        announced
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* GROUPED */}
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
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-4xl font-black">
                      {new Date(
                        date
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          weekday:
                            "long",

                          day: "numeric",

                          month:
                            "long",
                        }
                      )}
                    </div>

                    <button
                      disabled={
                        goatDays.length >
                        0
                      }
                      onClick={() =>
                        activateGoat(
                          date
                        )
                      }
                      className="
                        px-6
                        py-4
                        rounded-2xl
                        font-black
                        bg-white
                        text-black
                        disabled:opacity-40
                        disabled:cursor-not-allowed
                      "
                    >
                      {goatDays.length >
                      0
                        ? "☠️ G.O.A.T USED"
                        : "🐐 Activate G.O.A.T"}
                    </button>
                  </div>

                  <div className="space-y-6">
                    {dateMatches.map(
                      (
                        match: any
                      ) => (
                        <MatchCard
                          key={
                            match.id
                          }
                          match={
                            match
                          }
                          predictions={
                            predictions
                          }
                          predictedScores={
                            predictedScores
                          }
                          setPredictedScores={
                            setPredictedScores
                          }
                          expandedMatches={
                            expandedMatches
                          }
                          setExpandedMatches={
                            setExpandedMatches
                          }
                          submitPrediction={
                            submitPrediction
                          }
                          cancelPrediction={
                            cancelPrediction
                          }
                          selectedInventoryBooster={
                            selectedInventoryBooster
                          }
                          setSelectedInventoryBooster={
                            setSelectedInventoryBooster
                          }
                          usedBoosters={
                            usedBoosters
                          }
                          setUsedBoosters={
                            setUsedBoosters
                          }
                          goatDays={
                            goatDays
                          }
                        />
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
