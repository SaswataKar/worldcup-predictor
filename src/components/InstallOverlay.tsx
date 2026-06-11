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
      // Try to redirect into the installed PWA — Chrome may intercept and open it
      setTimeout(() => {
        window.location.href = window.location.origin + "/";
      }, 800);
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
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black backdrop-blur-xl px-8">
        <div className="text-center max-w-sm w-full">
          <div className="text-6xl mb-5">🎉</div>
          <h2 className="text-3xl font-black mb-2">App Installed!</h2>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
            The app icon has been added to your home screen.
          </p>

          {/* Primary CTA — try to open in PWA */}
          <a
            href="/"
            className="block w-full rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-base py-4 mb-4
              shadow-[0_0_30px_6px_rgba(234,179,8,0.3)] transition-all"
          >
            Open App →
          </a>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-sm text-zinc-400 text-left space-y-2 mb-4">
            <div className="text-zinc-500 text-xs uppercase tracking-widest font-black mb-2">Can't find the icon?</div>
            <div>• Swipe up to open your <span className="text-white font-bold">App Drawer</span></div>
            <div>• Search for <span className="text-white font-bold">WC Predictor</span></div>
            <div>• Long press the icon → <span className="text-white font-bold">Add to Home Screen</span></div>
          </div>

          <button
            onClick={() => setJustInstalled(false)}
            className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-semibold transition-colors py-2"
          >
            Continue in browser instead
          </button>
        </div>
      </div>
    );
  }

  // ── iOS instructions ───────────────────────────────────────────────────────
  if (showIos) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)]">
        <div className="relative rounded-3xl border border-sky-500/20 backdrop-blur-xl px-5 py-4 flex flex-col gap-3"
          style={{ background: "rgba(9,9,11,0.97)" }}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent rounded-t-3xl" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-lg shrink-0">📲</div>
            <div className="flex-1">
              <div className="font-black text-sm">Add to Home Screen</div>
              <div className="text-zinc-500 text-xs">Quick access + match notifications</div>
            </div>
            <button onClick={dismiss} className="text-zinc-600 hover:text-zinc-400 text-lg leading-none px-1">✕</button>
          </div>
          <div className="space-y-1.5 text-xs text-zinc-300 bg-white/[0.03] rounded-2xl px-4 py-3 border border-white/[0.06]">
            <div>1. Tap <span className="font-black text-white">Share ⬆</span> at the bottom of Safari</div>
            <div>2. Tap <span className="font-black text-white">Add to Home Screen</span></div>
            <div>3. Tap <span className="font-black text-white">Add</span></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Android install prompt ─────────────────────────────────────────────────
  if (!prompt) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,420px)]">
      <div className="relative rounded-3xl border border-yellow-500/30 backdrop-blur-xl px-5 py-4 flex flex-col gap-3"
        style={{ background: "rgba(9,9,11,0.97)" }}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300/[0.15] to-transparent rounded-t-3xl" />
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" className="w-10 h-10 rounded-2xl border border-white/[0.08] shrink-0" alt="" />
          <div className="flex-1">
            <div className="font-black text-sm">Install WC Predictor</div>
            <div className="text-zinc-500 text-xs">Home screen icon + match notifications</div>
          </div>
          <button onClick={dismiss} className="text-zinc-600 hover:text-zinc-400 text-lg leading-none px-1">✕</button>
        </div>
        <button
          onClick={handleInstall}
          className="w-full rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm py-2.5
            transition-all shadow-[0_0_20px_4px_rgba(234,179,8,0.3)]"
        >
          Install App
        </button>
      </div>
    </div>
  );
}
