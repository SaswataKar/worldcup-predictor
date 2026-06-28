// Legacy football-data.org format (kept for type safety, events from free tier are always empty)
export type MatchEvent = {
  minute: number;
  extraTime?: number | null;
  type: string;
  detail?: string;
  team: { id: number; name: string } | null;
  player?: { id: number | null; name: string } | null;
  assist?: { id: number | null; name: string | null } | null;
};

// ESPN live event format (from /api/sync-live)
export type ESPNGoal = {
  minute: string;
  team: "home" | "away";
  scorer: string;
  assist: string | null;
  ownGoal: boolean;
  penalty: boolean;
};

export type ESPNBooking = {
  minute: string;
  team: "home" | "away";
  player: string;
  type: "Yellow" | "Red";
};

export type ESPNSubstitution = {
  minute: string;
  team: "home" | "away";
  playerOut: string;
  playerIn: string;
};

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
  goals: ESPNGoal[] | MatchEvent[] | null;
  bookings: ESPNBooking[] | MatchEvent[] | null;
  substitutions: ESPNSubstitution[] | MatchEvent[] | null;
  processed?: boolean;
};

export type Prediction = {
  id?: number;
  user_id: number;
  match_id: number;
  prediction_type?: string;
  predicted_result: string;
  predicted_team1_score: number;
  predicted_team2_score: number;
  predicted_penalty?: boolean;
  predicted_pk_team1_score?: number | null;
  predicted_pk_team2_score?: number | null;
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
  penaltyShootout?: boolean;
  pkHome?: number | string;
  pkAway?: number | string;
};
