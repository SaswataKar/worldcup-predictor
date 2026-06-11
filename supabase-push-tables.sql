-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  endpoint      TEXT NOT NULL UNIQUE,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);

-- Tracks which "finished" and "points_updated" notifications were already sent
CREATE TABLE IF NOT EXISTS push_notifications_sent (
  id         BIGSERIAL PRIMARY KEY,
  match_id   BIGINT,
  type       TEXT NOT NULL,  -- 'finished' | 'points_updated' | etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS push_notifications_sent_match_idx ON push_notifications_sent(match_id, type);

-- RLS: service role bypasses RLS, so no policies needed for server-side usage.
-- But block public access:
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications_sent ENABLE ROW LEVEL SECURITY;
