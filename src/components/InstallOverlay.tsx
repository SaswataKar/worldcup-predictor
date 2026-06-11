"use client";

import { useEffect, useState } from "react";
import { onInstallPromptChange, triggerInstall } from "@/lib/installPrompt";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallOverlay() {
  const [prompt, setPrompt] = useState<any>(null);
  const [showIos, setShowIos] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) return; // already in app — never show
    if (localStorage.getItem("install-dismissed")) return;

    if (isIos()) {
      setShowIos(true);
      return;
    }

    const unsub = onInstallPromptChange(setPrompt);

    window.addEventListener("appinstalled", () => {
      setPrompt(null);
      setJustInstalled(true);
    });

    return unsub;
  }, []);

  async function handleInstall() {
    const outcome = await triggerInstall();
    if (outcome === "dismissed") {
      localStorage.setItem("install-dismissed", "1");
      setPrompt(null);
    }
    // "accepted" → appinstalled fires → justInstalled = true
  }

  function dismiss() {
    localStorage.setItem("install-dismissed", "1");
    setPrompt(null);
    setShowIos(false);
  }

  // ── Just installed screen ──────────────────────────────────────────────────
  if (justInstalled) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl px-8">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-black mb-3">App Installed!</h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Find the <span className="text-white font-black">WC Predictor</span> icon on your home screen and open it to enable notifications.
          </p>
          <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/5 px-5 py-4 text-sm text-zinc-300 text-left space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">1.</span>
              <span>Press the <span className="font-black text-white">Home</span> button</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">2.</span>
              <span>Find the <span className="font-black text-white">WC Predictor</span> icon</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">3.</span>
              <span>Tap it to open — notifications prompt will appear</span>
            </div>
          </div>
          <button
            onClick={() => setJustInstalled(false)}
            className="w-full rounded-2xl border border-white/[0.12] text-zinc-400 font-bold py-3 text-sm hover:text-white transition-all"
          >
            Continue in browser
          </button>
        </div>
      </div>
    );
  }

  // ── iOS instructions ───────────────────────────────────────────────────────
  if (showIos) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)]">
        <div className="relative rounded-3xl border border-sky-500/20 backdrop-blur-xl px-6 py-5 flex flex-col gap-4"
          style={{ background: "rgba(9,9,11,0.95)" }}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent rounded-t-3xl" />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-xl shrink-0">📲</div>
            <div>
              <div className="font-black text-sm">Add to Home Screen</div>
              <div className="text-zinc-500 text-xs">Quick access + match notifications</div>
            </div>
          </div>
          <div className="space-y-2 text-sm text-zinc-300 bg-white/[0.03] rounded-2xl px-4 py-3 border border-white/[0.06]">
            <div>1. Tap <span className="font-black text-white">Share ⬆</span> at the bottom of Safari</div>
            <div>2. Tap <span className="font-black text-white">Add to Home Screen</span></div>
            <div>3. Tap <span className="font-black text-white">Add</span></div>
          </div>
          <button onClick={dismiss} className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-semibold transition-colors">
            Got it
          </button>
        </div>
      </div>
    );
  }

  // ── Android install prompt ─────────────────────────────────────────────────
  if (!prompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)]">
      <div className="relative rounded-3xl border border-yellow-500/25 backdrop-blur-xl px-6 py-5 flex flex-col gap-4"
        style={{ background: "rgba(9,9,11,0.95)" }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300/[0.12] to-transparent rounded-t-3xl" />
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" className="w-12 h-12 rounded-2xl border border-white/[0.08]" alt="" />
          <div>
            <div className="font-black text-sm">Install WC Predictor</div>
            <div className="text-zinc-500 text-xs">Home screen icon + match notifications</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleInstall}
            className="flex-1 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm py-3
              transition-all shadow-[0_0_20px_4px_rgba(234,179,8,0.3)]"
          >
            Install
          </button>
          <button
            onClick={dismiss}
            className="flex-1 rounded-2xl border border-white/[0.10] text-zinc-400 hover:text-white font-bold text-sm py-3 transition-all"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
