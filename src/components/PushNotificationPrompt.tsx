"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

type Step = "install-android" | "install-ios" | "notify" | "done";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

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
  const [step, setStep] = useState<Step | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [notifStatus, setNotifStatus] = useState<"idle" | "loading" | "done" | "denied">("idle");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(console.error);

    const standalone = isInStandaloneMode();
    const installDismissed = localStorage.getItem("install-dismissed");
    const notifyDismissed = localStorage.getItem("push-dismissed");

    if (standalone) {
      // Running as installed PWA — only show notification prompt here
      if (Notification.permission === "granted") {
        subscribeIfNeeded();
      } else if (Notification.permission === "denied") {
        // Always re-show settings instructions inside the app, even if dismissed before
        setTimeout(() => setStep("notify"), 1500);
      } else if (!notifyDismissed) {
        setTimeout(() => setStep("notify"), 1500);
      }
      return;
    }

    // Running in browser — only show install prompts, never notification prompt
    if (isIos()) {
      if (!installDismissed) setTimeout(() => setStep("install-ios"), 2000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!installDismissed) setTimeout(() => setStep("install-android"), 1500);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setStep(null);
      localStorage.removeItem("install-dismissed");
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstallAndroid() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setStep(null);
    } else {
      localStorage.setItem("install-dismissed", "1");
      setStep(null);
      // Still offer notifications
      if (Notification.permission !== "denied") {
        setTimeout(() => setStep("notify"), 500);
      }
    }
  }

  function dismissInstall() {
    localStorage.setItem("install-dismissed", "1");
    setStep(null);
    if (Notification.permission !== "denied" && Notification.permission !== "granted") {
      setTimeout(() => setStep("notify"), 400);
    }
  }

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

  async function handleAllowNotifications() {
    setNotifStatus("loading");
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeIfNeeded();
      setNotifStatus("done");
      setTimeout(() => setStep("done"), 1400);
    } else {
      setNotifStatus("denied");
      localStorage.setItem("push-dismissed", "1");
      setTimeout(() => setStep("done"), 2000);
    }
  }

  function dismissNotify() {
    localStorage.setItem("push-dismissed", "1");
    setStep("done");
  }

  if (!step || step === "done") return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)]">
      <div
        className="relative rounded-3xl border border-white/[0.10] backdrop-blur-xl
          shadow-[0_0_40px_10px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]
          px-6 py-5 flex flex-col gap-4"
        style={{ background: "rgba(9,9,11,0.93)" }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent rounded-t-3xl pointer-events-none" />

        {/* ── Android install ── */}
        {step === "install-android" && (
          <>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center text-xl shrink-0">
                📲
              </div>
              <div className="flex-1">
                <div className="font-black text-base leading-tight mb-1">Add to Home Screen</div>
                <div className="text-zinc-400 text-sm leading-relaxed">
                  Install the app for quick access — no browser, no link, just tap the icon.
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleInstallAndroid}
                className="flex-1 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm py-3
                  transition-all duration-200 shadow-[0_0_20px_4px_rgba(234,179,8,0.25)]"
              >
                Install App
              </button>
              <button
                onClick={dismissInstall}
                className="flex-1 rounded-2xl border border-white/[0.10] text-zinc-400 hover:text-white
                  font-bold text-sm py-3 transition-all duration-200 hover:border-white/[0.20]"
              >
                Not now
              </button>
            </div>
          </>
        )}

        {/* ── iOS install instructions ── */}
        {step === "install-ios" && (
          <>
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-xl shrink-0">
                🍎
              </div>
              <div className="flex-1">
                <div className="font-black text-base leading-tight mb-1">Add to Home Screen</div>
                <div className="text-zinc-400 text-sm leading-relaxed">
                  Install for quick access and match notifications.
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 space-y-2 text-sm text-zinc-300">
              <div className="flex items-center gap-3">
                <span className="text-lg">1.</span>
                <span>Tap the <span className="font-black text-white">Share</span> button <span className="inline-block bg-white/10 px-1.5 py-0.5 rounded text-xs">⬆</span> at the bottom of Safari</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">2.</span>
                <span>Scroll down and tap <span className="font-black text-white">Add to Home Screen</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">3.</span>
                <span>Tap <span className="font-black text-white">Add</span> — done!</span>
              </div>
            </div>
            <button
              onClick={dismissInstall}
              className="w-full rounded-2xl border border-white/[0.10] text-zinc-400 hover:text-white
                font-bold text-sm py-3 transition-all duration-200 hover:border-white/[0.20]"
            >
              Got it
            </button>
          </>
        )}

        {/* ── Notification permission ── */}
        {step === "notify" && (
          <>
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

            {/* Previously blocked — guide to settings */}
            {Notification.permission === "denied" ? (
              <>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 space-y-2 text-sm text-zinc-300">
                  <div className="text-amber-400 font-black text-xs uppercase tracking-widest mb-2">Notifications were blocked</div>
                  <div className="flex items-start gap-2"><span>1.</span><span>Open your phone <span className="font-black text-white">Settings</span></span></div>
                  <div className="flex items-start gap-2"><span>2.</span><span>Go to <span className="font-black text-white">Apps</span> → find this app (WC Predictor)</span></div>
                  <div className="flex items-start gap-2"><span>3.</span><span>Tap <span className="font-black text-white">Notifications</span> and turn it on</span></div>
                  <div className="flex items-start gap-2"><span>4.</span><span>Come back and reopen the app</span></div>
                </div>
                <button
                  onClick={dismissNotify}
                  className="w-full rounded-2xl border border-white/[0.10] text-zinc-400 hover:text-white
                    font-bold text-sm py-3 transition-all duration-200 hover:border-white/[0.20]"
                >
                  Dismiss
                </button>
              </>
            ) : (
              <>
                {notifStatus === "done" && (
                  <div className="text-emerald-400 text-sm font-bold text-center">✓ Notifications enabled!</div>
                )}
                {notifStatus === "loading" && (
                  <div className="text-zinc-400 text-sm text-center font-semibold animate-pulse">Requesting permission…</div>
                )}
                {notifStatus === "idle" && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleAllowNotifications}
                      className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm py-3
                        transition-all duration-200 shadow-[0_0_20px_4px_rgba(34,197,94,0.25)]"
                    >
                      Enable
                    </button>
                    <button
                      onClick={dismissNotify}
                      className="flex-1 rounded-2xl border border-white/[0.10] text-zinc-400 hover:text-white
                        font-bold text-sm py-3 transition-all duration-200 hover:border-white/[0.20]"
                    >
                      Not now
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
