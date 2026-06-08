import { supabase } from "@/lib/supabase";

export const processScores =
  async (
    matches: any[]
  ) => {
    try {
      for (const match of matches) {
        // ONLY PROCESS FINISHED MATCHES
        if (
          match.status !==
          "FINISHED"
        ) {
          continue;
        }

        const homeScore =
          match.team1_score;

        const awayScore =
          match.team2_score;

        // FETCH UNPROCESSED PREDICTIONS
        const {
          data: predictions,
          error:
            predictionError,
        } = await supabase
          .from(
            "predictions"
          )
          .select("*")
          .eq(
            "match_id",
            match.id
          )
          .eq(
            "processed",
            false
          );

        if (
          predictionError
        ) {
          console.error(
            predictionError
          );

          continue;
        }

        if (
          !predictions?.length
        ) {
          continue;
        }

        // MATCH DATE
        const matchDate =
          new Date(
            match.kickoff_time
          )
            .toISOString()
            .split("T")[0];

        // PROCESS EACH PREDICTION
        for (const prediction of predictions) {
          let points = 0;

          const predictedHome =
            prediction.predicted_team1_score;

          const predictedAway =
            prediction.predicted_team2_score;

          // RESULTS
          const actualResult =
            homeScore >
            awayScore
              ? "team1"
              : awayScore >
                homeScore
              ? "team2"
              : "draw";

          const predictedResult =
            predictedHome >
            predictedAway
              ? "team1"
              : predictedAway >
                predictedHome
              ? "team2"
              : "draw";

          const exactPrediction =
            predictedHome ===
              homeScore &&
            predictedAway ===
              awayScore;

          const correctResult =
            actualResult ===
            predictedResult;

          // POINTS
          if (
            exactPrediction
          ) {
            // EXACT 0-0
            if (
              homeScore === 0 &&
              awayScore === 0
            ) {
              points = 1;
            }

            // EXACT DRAW
            else if (
              homeScore ===
              awayScore
            ) {
              points = 2;
            }

            // EXACT WINNER
            else {
              points = 2;
            }
          }

          // CORRECT RESULT
          else if (
            correctResult
          ) {
            points = 1;
          }

          // GOAT BOOSTER
          const {
            data: goatData,
          } = await supabase
            .from(
              "daily_boosters"
            )
            .select("*")
            .eq(
              "user_id",
              prediction.user_id
            );

          const goatActive =
            goatData?.some(
              (
                booster
              ) => {
                const boosterDate =
                  new Date(
                    booster.active_date
                  )
                    .toISOString()
                    .split(
                      "T"
                    )[0];

                return (
                  boosterDate ===
                  matchDate
                );
              }
            );

          // GOAT ONLY DOUBLES JACKPOTS
          if (
            goatActive &&
            points === 2
          ) {
            points =
              points * 2;
          }

          // MATCH BOOSTERS
          if (
            prediction.booster_used ===
            "2x"
          ) {
            points =
              points * 2;
          }

          if (
            prediction.booster_used ===
            "3x"
          ) {
            points =
              points * 3;
          }

          // UPDATE PREDICTION
          const {
            error:
              predictionUpdateError,
          } = await supabase
            .from(
              "predictions"
            )
            .update({
              processed: true,

              awarded_points:
                points,
            })
            .eq(
              "id",
              prediction.id
            );

          if (
            predictionUpdateError
          ) {
            console.error(
              predictionUpdateError
            );

            continue;
          }

          // FETCH USER
          const {
            data: userData,
            error:
              userFetchError,
          } = await supabase
            .from("users")
            .select(
              "id,name,total_points"
            )
            .eq(
              "id",
              prediction.user_id
            )
            .single();

          if (
            userFetchError ||
            !userData
          ) {
            console.error(
              userFetchError
            );

            continue;
          }

          const updatedTotal =
            (userData.total_points ||
              0) +
            points;

          // UPDATE USER TOTAL
          const {
            error:
              userUpdateError,
          } = await supabase
            .from("users")
            .update({
              total_points:
                updatedTotal,
            })
            .eq(
              "id",
              prediction.user_id
            );

          if (
            userUpdateError
          ) {
            console.error(
              userUpdateError
            );

            continue;
          }

          // FETCH LEADERBOARD ENTRY
          const {
            data:
              leaderboardUser,
          } = await supabase
            .from(
              "leaderboard"
            )
            .select("*")
            .eq(
              "user_id",
              prediction.user_id
            )
            .single();

          // UPDATE LEADERBOARD
          if (
            leaderboardUser
          ) {
            const {
              error:
                leaderboardUpdateError,
            } = await supabase
              .from(
                "leaderboard"
              )
              .update({
                total_points:
                  updatedTotal,

                exact_predictions:
                  (
                    leaderboardUser.exact_predictions ||
                    0
                  ) +
                  (exactPrediction
                    ? 1
                    : 0),

                correct_results:
                  (
                    leaderboardUser.correct_results ||
                    0
                  ) +
                  (correctResult
                    ? 1
                    : 0),

                updated_at:
                  new Date().toISOString(),
              })
              .eq(
                "user_id",
                prediction.user_id
              );

            if (
              leaderboardUpdateError
            ) {
              console.error(
                leaderboardUpdateError
              );
            }
          }

          // CREATE LEADERBOARD ENTRY
          else {
            const {
              error:
                leaderboardInsertError,
            } = await supabase
              .from(
                "leaderboard"
              )
              .insert({
                user_id:
                  prediction.user_id,

                username:
                  userData.name,

                total_points:
                  updatedTotal,

                exact_predictions:
                  exactPrediction
                    ? 1
                    : 0,

                correct_results:
                  correctResult
                    ? 1
                    : 0,

                updated_at:
                  new Date().toISOString(),
              });

            if (
              leaderboardInsertError
            ) {
              console.error(
                leaderboardInsertError
              );
            }
          }

          console.log(
            `Processed prediction ${prediction.id}: +${points}`
          );
        }
      }
    } catch (error) {
      console.error(
        "Score Processing Error:",
        error
      );
    }
  };

