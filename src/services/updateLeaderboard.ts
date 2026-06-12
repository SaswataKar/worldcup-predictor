import { supabaseServer as supabase } from "@/lib/supabaseServer";

export const updateLeaderboard = async () => {
  const { data: users } = await supabase.from("users").select("*");
  if (!users) return;

  // Fetch all processed matches once for score lookups
  const { data: matches } = await supabase
    .from("matches")
    .select("id, team1_score, team2_score")
    .eq("processed", true);

  const matchScoreMap = new Map<number, { h: number; a: number }>();
  (matches || []).forEach((m) => {
    if (m.team1_score != null && m.team2_score != null) {
      matchScoreMap.set(m.id, { h: m.team1_score, a: m.team2_score });
    }
  });

  for (const user of users) {
    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id)
      .eq("processed", true);

    let totalPoints = 0;
    let exactPredictions = 0;
    let correctResults = 0;

    (predictions || []).forEach((pred) => {
      totalPoints += pred.awarded_points || 0;

      const score = matchScoreMap.get(pred.match_id);
      if (!score) return;

      const isExact =
        pred.predicted_team1_score === score.h &&
        pred.predicted_team2_score === score.a;

      if (isExact) {
        exactPredictions += 1;
      } else {
        const actualResult = score.h > score.a ? "h" : score.a > score.h ? "a" : "d";
        const predResult = pred.predicted_team1_score > pred.predicted_team2_score ? "h"
          : pred.predicted_team2_score > pred.predicted_team1_score ? "a" : "d";
        if (actualResult === predResult) correctResults += 1;
      }
    });

    await supabase.from("leaderboard").upsert(
      {
        user_id: user.id,
        username: user.username || user.name,
        total_points: totalPoints,
        exact_predictions: exactPredictions,
        correct_results: correctResults,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }
};
