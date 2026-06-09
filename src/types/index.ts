export type Match = {
  id: number;
  team1: string;
  team2: string;
  team1_crest: string | null;
  team2_crest: string | null;
  kickoff_time: string | null;
  status: string;
  team1_score: number | null;
  team2_score: number | null;
  matchday: string | null;
};

export type Prediction = {
  id?: number;
  user_id: number;
  match_id: number;
  prediction_type?: string;
  predicted_result: string;
  predicted_team1_score: number;
  predicted_team2_score: number;
  booster_used: string;
  processed?: boolean;
  awarded_points?: number;
  updated_at?: string;
};

export type User = {
  id: number;
  name: string;
  username: string;
  total_points: number;
};

export type PredictedScore = {
  home: number | string;
  away: number | string;
};
