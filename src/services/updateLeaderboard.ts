import { supabase } from "@/lib/supabase";

export const updateLeaderboard =
  async () => {
    // GET USERS
    const {
      data: users,
    } = await supabase
      .from("users")
      .select("*");

    if (!users) return;

    for (const user of users) {
      // GET USER PREDICTIONS
      const {
        data: predictions,
      } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", user.id);

      if (!predictions)
        continue;

      let totalPoints = 0;

      let exactPredictions = 0;

      let correctResults = 0;

      predictions.forEach(
        (prediction) => {
          const points =
            prediction.points_awarded ||
            0;

          totalPoints +=
            points;

          // EXACT SCORE
          if (
            points >= 2
          ) {
            exactPredictions += 1;
          }

          // CORRECT RESULT
          else if (
            points === 1
          ) {
            correctResults += 1;
          }
        }
      );

      // UPSERT
      await supabase
        .from("leaderboard")
        .upsert(
          {
            user_id:
              user.id,

            username:
              user.username,

            total_points:
              totalPoints,

            exact_predictions:
              exactPredictions,

            correct_results:
              correctResults,

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id",
          }
        );
    }
  };