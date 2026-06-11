"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Only show inside the installed app, never in the browser
    if (!isInStandaloneMode()) return;

    if (Notification.permission === "granted") {
      subscribeIfNeeded();
      return;
    }

    // Show prompt — even if previously dismissed, re-show if denied so user can see settings instructions
    const notifyDismissed = localStorage.getItem("push-dismissed");
    if (!notifyDismissed || Notification.permission === "denied") {
      setTimeout(() => setShow(true), 1500);
    }
  }, []);

  async function subscribeIfNeeded() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const user = Cookies.get("user");
      if (!user) return;
      const { id: userId } = JSON.parse(user);
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
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

  async function handleEnable() {
    setStatus("loading");
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeIfNeeded();
      setStatus("done");
      setTimeout(() => setShow(false), 1400);
    } else {
      // Permission denied — show settings instructions instead
      setStatus("idle");
    }
  }

  function dismiss() {
    localStorage.setItem("push-dismissed", "1");
    setShow(false);
  }

  if (!show) return null;

  const isDenied = Notification.permission === "denied";

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)]">
      <div
        className="relative rounded-3xl border border-white/[0.10] backdrop-blur-xl
          shadow-[0_0_40px_10px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]
          px-6 py-5 flex flex-col gap-4"
        style={{ background: "rgba(9,9,11,0.93)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent rounded-t-3xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xl shrink-0">
            🔔
          </div>
          <div className="flex-1">
            <div className="font-black text-base leading-tight mb-1">Enable Notifications</div>
            <div className="text-zinc-400 text-sm leading-relaxed">
              Get alerts when predictions open, 1 hour before kick-off, when a match starts, and when scores update.
            </div>
          </div>
        </div>

        {isDenied ? (
          <>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 space-y-1.5 text-sm text-zinc-300">
              <div className="text-amber-400 font-black text-xs uppercase tracking-widest mb-2">Notifications were blocked</div>
              <div>1. Open phone <span className="font-black text-white">Settings</span></div>
              <div>2. <span className="font-black text-white">Apps</span> → WC Predictor → <span className="font-black text-white">Notifications</span></div>
              <div>3. Turn it on, then reopen the app</div>
            </div>
            <button onClick={dismiss} className="w-full rounded-2xl border border-white/[0.10] text-zinc-400 hover:text-white font-bold text-sm py-3 transition-all">
              Dismiss
            </button>
          </>
        ) : (
          <>
            {status === "done" && (
              <div className="text-emerald-400 text-sm font-bold text-center">✓ Notifications enabled!</div>
            )}
            {status === "loading" && (
              <div className="text-zinc-400 text-sm text-center font-semibold animate-pulse">Requesting permission…</div>
            )}
            {status === "idle" && (
              <div className="flex gap-3">
                <button
                  onClick={handleEnable}
                  className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm py-3
                    transition-all shadow-[0_0_20px_4px_rgba(34,197,94,0.25)]"
                >
                  Enable
                </button>
                <button
                  onClick={dismiss}
                  className="flex-1 rounded-2xl border border-white/[0.10] text-zinc-400 hover:text-white font-bold text-sm py-3 transition-all"
                >
                  Not now
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
