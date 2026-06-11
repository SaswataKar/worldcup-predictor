import { supabaseServer as supabase } from "@/lib/supabaseServer";

export const updateLeaderboard = async () => {
  const { data: users } = await supabase.from("users").select("*");
  if (!users) return;

  for (const user of users) {
    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id);

    let totalPoints = 0;
    let exactPredictions = 0;
    let correctResults = 0;

    (predictions || []).forEach((prediction) => {
      const points = prediction.awarded_points || 0;
      totalPoints += points;
      if (points >= 2) exactPredictions += 1;
      else if (points === 1) correctResults += 1;
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
