import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function broadcast(title: string, body: string, url = "/") {
  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs?.length) return 0;
  const payload = JSON.stringify({ title, body, url });
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        })
    )
  );
  return results.filter((r) => r.status === "fulfilled").length;
}

export async function GET(req: NextRequest) {
  // Secure with a cron secret so only Vercel Cron can call it
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const window10min = 10 * 60 * 1000; // 10 minute tolerance window around each trigger point

  const { data: matches } = await supabase
    .from("matches")
    .select("id, team1, team2, kickoff_time, status")
    .not("kickoff_time", "is", null);

  if (!matches?.length) return NextResponse.json({ ok: true, notifications: 0 });

  const notifLog: string[] = [];

  for (const match of matches) {
    const kickoff = new Date(match.kickoff_time);
    const diffMs = kickoff.getTime() - now.getTime();

    // 24h before: prediction window opens
    if (Math.abs(diffMs - 24 * 60 * 60 * 1000) < window10min) {
      const n = await broadcast(
        "⚽ Prediction Window Open",
        `${match.team1} vs ${match.team2} — You can now submit your prediction!`,
        "/"
      );
      notifLog.push(`24h-open:${match.id}:${n}`);
    }

    // 1h warning before prediction closes
    if (Math.abs(diffMs - 60 * 60 * 1000) < window10min) {
      const n = await broadcast(
        "⏰ 1 Hour Left to Predict!",
        `${match.team1} vs ${match.team2} kicks off in 1 hour — don't miss your chance!`,
        "/"
      );
      notifLog.push(`1h-warn:${match.id}:${n}`);
    }

    // Kickoff — predictions now closed
    if (Math.abs(diffMs) < window10min) {
      const { data: already } = await supabase
        .from("push_notifications_sent")
        .select("id")
        .eq("match_id", match.id)
        .eq("type", "kickoff")
        .maybeSingle();

      if (!already) {
        const n = await broadcast(
          "🚨 Match Starting Now!",
          `${match.team1} vs ${match.team2} has kicked off — predictions are now closed.`,
          "/fixtures"
        );
        notifLog.push(`kickoff:${match.id}:${n}`);
        await supabase
          .from("push_notifications_sent")
          .insert({ match_id: match.id, type: "kickoff" });
      }
    }

    // Match finished — check for status change
    if (match.status === "FINISHED") {
      // Only notify once: check if we already sent a "finished" notification
      const { data: already } = await supabase
        .from("push_notifications_sent")
        .select("id")
        .eq("match_id", match.id)
        .eq("type", "finished")
        .maybeSingle();

      if (!already) {
        const n = await broadcast(
          "🏁 Match Finished",
          `${match.team1} vs ${match.team2} has ended. Check the scores!`,
          "/"
        );
        notifLog.push(`finished:${match.id}:${n}`);
        await supabase
          .from("push_notifications_sent")
          .insert({ match_id: match.id, type: "finished" });
      }
    }
  }

  // Points updated — check if leaderboard was refreshed in the last 10 min
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
  const { data: recentSync } = await supabase
    .from("push_notifications_sent")
    .select("id")
    .eq("type", "points_updated")
    .gte("created_at", tenMinAgo)
    .maybeSingle();

  if (!recentSync) {
    const { data: updatedPreds } = await supabase
      .from("predictions")
      .select("id")
      .gte("updated_at", tenMinAgo)
      .gt("points_awarded", 0)
      .limit(1);

    if (updatedPreds?.length) {
      const n = await broadcast(
        "🎯 Points Updated!",
        "Leaderboard has been refreshed — check your score!",
        "/leaderboard"
      );
      notifLog.push(`points:${n}`);
      await supabase.from("push_notifications_sent").insert({ type: "points_updated" });
    }
  }

  return NextResponse.json({ ok: true, notifications: notifLog });
}
