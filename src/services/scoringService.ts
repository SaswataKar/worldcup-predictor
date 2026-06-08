export const calculatePredictionPoints =
  async ({
    prediction,
    match,
    goatActive,
  }: any) => {
    const predictedHome =
      prediction.predicted_team1_score;

    const predictedAway =
      prediction.predicted_team2_score;

    const actualHome =
      match.team1_score;

    const actualAway =
      match.team2_score;

    // MATCH NOT FINISHED
    if (
      actualHome === null ||
      actualAway === null
    ) {
      return 0;
    }

    let points = 0;

    const predictedResult =
      predictedHome >
      predictedAway
        ? "team1"
        : predictedAway >
          predictedHome
        ? "team2"
        : "draw";

    const actualResult =
      actualHome > actualAway
        ? "team1"
        : actualAway >
          actualHome
        ? "team2"
        : "draw";

    const exactScore =
      predictedHome ===
        actualHome &&
      predictedAway ===
        actualAway;

    // EXACT NON-DRAW
    if (
      exactScore &&
      actualResult !== "draw"
    ) {
      points = 2;
    }

    // EXACT DRAW
    else if (
      exactScore &&
      actualResult === "draw"
    ) {
      points = 1;
    }

    // CORRECT RESULT
    else if (
      predictedResult ===
      actualResult
    ) {
      points = 1;
    }

    // MATCH BOOSTERS
    if (
      prediction.booster_used ===
      "double"
    ) {
      points *= 2;
    }

    if (
      prediction.booster_used ===
      "triple"
    ) {
      points *= 3;
    }

    // GOAT BOOSTER
    // ONLY doubles jackpot values
    if (
      goatActive &&
      exactScore
    ) {
      points *= 2;
    }

    return points;
  };