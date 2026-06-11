"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "denied">("idle");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    )
      return;

    // Register SW
    navigator.serviceWorker.register("/sw.js").catch(console.error);

    const dismissed = localStorage.getItem("push-dismissed");
    if (dismissed) return;

    const permission = Notification.permission;
    if (permission === "granted") {
      subscribeIfNeeded();
      return;
    }
    if (permission === "denied") return;

    // Show prompt after 3 seconds
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  async function subscribeIfNeeded() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const user = Cookies.get("user");
      if (!user) return;
      const { id: userId } = JSON.parse(user);

      const sub = existing ?? (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      }));

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), userId }),
      });
    } catch (e) {
      console.error("Push subscribe error:", e);
    }
  }

  async function handleAllow() {
    setStatus("loading");
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeIfNeeded();
      setStatus("done");
      setTimeout(() => setShow(false), 1500);
    } else {
      setStatus("denied");
      localStorage.setItem("push-dismissed", "1");
      setTimeout(() => setShow(false), 2000);
    }
  }

  function handleDismiss() {
    localStorage.setItem("push-dismissed", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)]">
      <div
        className="relative rounded-3xl border border-white/[0.10] backdrop-blur-xl
          shadow-[0_0_40px_10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]
          px-6 py-5 flex flex-col gap-4"
        style={{ background: "rgba(9,9,11,0.92)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent rounded-t-3xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center text-xl shrink-0">
            🔔
          </div>
          <div className="flex-1">
            <div className="font-black text-base leading-tight mb-1">Match Notifications</div>
            <div className="text-zinc-400 text-sm leading-relaxed">
              Get notified when prediction windows open, 1 hour before kick-off, and when scores are updated.
            </div>
          </div>
        </div>

        {status === "done" && (
          <div className="text-emerald-400 text-sm font-bold text-center">✓ Notifications enabled!</div>
        )}
        {status === "denied" && (
          <div className="text-red-400 text-sm font-bold text-center">Notifications blocked in browser settings.</div>
        )}

        {status === "idle" && (
          <div className="flex gap-3">
            <button
              onClick={handleAllow}
              className="flex-1 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm py-3
                transition-all duration-200 shadow-[0_0_20px_4px_rgba(234,179,8,0.25)]"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 rounded-2xl border border-white/[0.10] text-zinc-400 hover:text-white
                font-bold text-sm py-3 transition-all duration-200 hover:border-white/[0.20]"
            >
              Not now
            </button>
          </div>
        )}

        {status === "loading" && (
          <div className="text-zinc-400 text-sm text-center font-semibold animate-pulse">Requesting permission…</div>
        )}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
