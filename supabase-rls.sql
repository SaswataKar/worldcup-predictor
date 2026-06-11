-- Run this in the Supabase SQL Editor to lock down public access.
-- All sensitive tables: deny anonymous reads/writes.
-- matches and leaderboard: allow public read (served via API routes anyway).

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Deny all direct access to sensitive tables via anon key
CREATE POLICY "users_deny_anon" ON users FOR ALL USING (false);
CREATE POLICY "predictions_deny_anon" ON predictions FOR ALL USING (false);
CREATE POLICY "daily_boosters_deny_anon" ON daily_boosters FOR ALL USING (false);
CREATE POLICY "leagues_deny_anon" ON leagues FOR ALL USING (false);

-- Public read for matches and leaderboard (already served through API, but harmless to allow)
CREATE POLICY "matches_public_read" ON matches FOR SELECT USING (true);
CREATE POLICY "leaderboard_public_read" ON leaderboard FOR SELECT USING (true);

-- Booster uniqueness constraint (one booster per matchday per user)
ALTER TABLE daily_boosters ADD CONSTRAINT daily_boosters_user_id_active_date_key UNIQUE (user_id, active_date);
