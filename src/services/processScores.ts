import { supabase } from "@/lib/supabase";
import { getGamedayKey } from "@/lib/utils";

export const processScores = async (matches: any[]) => {
  try {
    for (const match of matches) {
      // Caller already filters for FINISHED+unprocessed, but guard here too
      if (match.status !== "FINISHED") continue;

      const homeScore = match.team1_score;
      const awayScore = match.team2_score;

      const { data: predictions, error: predictionError } = await supabase
        .from("predictions")
        .select("*")
        .eq("match_id", match.id)
        .eq("processed", false);

      if (predictionError) { console.error(predictionError); continue; }
      if (!predictions?.length) continue;

      const matchDateStandard = new Date(match.kickoff_time).toISOString().split("T")[0];
      const matchDateWindow = getGamedayKey(match.kickoff_time);

      for (const prediction of predictions) {
        // Determine which matchday key this user's league uses
        const { data: memberships } = await supabase
          .from("league_members")
          .select("leagues(matchday_mode)")
          .eq("user_id", prediction.user_id);
        const usesWindow = (memberships ?? []).some((m: any) => m.leagues?.matchday_mode === "gameday_window");
        const matchDate = usesWindow ? matchDateWindow : matchDateStandard;
        const predictedHome = prediction.predicted_team1_score;
        const predictedAway = prediction.predicted_team2_score;

        const actualResult =
          homeScore > awayScore ? "team1" : awayScore > homeScore ? "team2" : "draw";
        const predictedResult =
          predictedHome > predictedAway ? "team1" : predictedAway > predictedHome ? "team2" : "draw";

        const exactPrediction = predictedHome === homeScore && predictedAway === awayScore;
        const correctResult = actualResult === predictedResult;

        let points = 0;
        if (exactPrediction) {
          points = homeScore === 0 && awayScore === 0 ? 1 : 2;
        } else if (correctResult) {
          points = 1;
        }

        // FETCH ALL DAY BOOSTERS FOR THIS USER
        const { data: dayBoostersData } = await supabase
          .from("daily_boosters")
          .select("booster_type, active_date")
          .eq("user_id", prediction.user_id);

        const dayBoosters = (dayBoostersData || []).filter((b) => {
          return b.active_date.split("T")[0] === matchDate;
        });

        const boosterTypes = dayBoosters.map((b) => b.booster_type);

        // G.O.A.T only doubles jackpots (exact score, points === 2)
        if (boosterTypes.includes("draw") && points === 2) points *= 2;
        // 2x and 3x apply to all points
        if (boosterTypes.includes("2x")) points *= 2;
        if (boosterTypes.includes("3x")) points *= 3;

        // UPDATE PREDICTION
        const { error: predictionUpdateError } = await supabase
          .from("predictions")
          .update({ processed: true, awarded_points: points })
          .eq("id", prediction.id);

        if (predictionUpdateError) { console.error(predictionUpdateError); continue; }

        // UPDATE USER TOTAL POINTS
        const { data: userData, error: userFetchError } = await supabase
          .from("users")
          .select("id,name,total_points")
          .eq("id", prediction.user_id)
          .single();

        if (userFetchError || !userData) { console.error(userFetchError); continue; }

        const updatedTotal = (userData.total_points || 0) + points;

        const { error: userUpdateError } = await supabase
          .from("users")
          .update({ total_points: updatedTotal })
          .eq("id", prediction.user_id);

        if (userUpdateError) { console.error(userUpdateError); continue; }

        // UPDATE LEADERBOARD
        const { data: leaderboardUser } = await supabase
          .from("leaderboard")
          .select("*")
          .eq("user_id", prediction.user_id)
          .single();

        // exact scores are NOT also counted as correct results (mutually exclusive buckets)
        const isCorrectOnly = correctResult && !exactPrediction;

        if (leaderboardUser) {
          await supabase
            .from("leaderboard")
            .update({
              total_points: updatedTotal,
              exact_predictions: (leaderboardUser.exact_predictions || 0) + (exactPrediction ? 1 : 0),
              correct_results: (leaderboardUser.correct_results || 0) + (isCorrectOnly ? 1 : 0),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", prediction.user_id);
        } else {
          await supabase.from("leaderboard").insert({
            user_id: prediction.user_id,
            username: userData.name,
            total_points: updatedTotal,
            exact_predictions: exactPrediction ? 1 : 0,
            correct_results: isCorrectOnly ? 1 : 0,
            updated_at: new Date().toISOString(),
          });
        }

        console.log(`Processed prediction ${prediction.id}: +${points}`);
      }

      // Mark match as fully processed so future cron runs skip it immediately
      await supabase
        .from("matches")
        .update({ processed: true })
        .eq("id", match.id);

      console.log(`Match ${match.id} marked as processed.`);
    }
  } catch (error) {
    console.error("Score Processing Error:", error);
  }
};
