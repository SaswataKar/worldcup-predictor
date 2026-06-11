"use client";

import {
  useEffect,
  useState,
} from "react";

import Cookies from "js-cookie";

import { useRouter } from "next/navigation";

import toast from "react-hot-toast";

function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Hide if already running as installed PWA
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    ) return;

    if (localStorage.getItem("install-dismissed")) return;

    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setVisible(true);

    // Capture prompt if Chrome offers it
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setVisible(false);
      // Try to switch to the installed PWA
      setTimeout(() => { window.location.href = "/"; }, 800);
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setVisible(false);
      setDeferredPrompt(null);
    }
  }

  return (
    <div className="w-full max-w-[420px] mb-5">
      <div className="relative rounded-3xl border border-yellow-500/30 bg-yellow-500/5 px-5 py-4
        shadow-[0_0_24px_4px_rgba(234,179,8,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <button
          onClick={() => { localStorage.setItem("install-dismissed", "1"); setVisible(false); }}
          className="absolute top-3 right-4 text-zinc-600 hover:text-zinc-400 text-lg leading-none"
        >✕</button>

        <div className="flex items-center gap-3 mb-3 pr-6">
          <img src="/icons/icon-192.png" className="w-10 h-10 rounded-2xl border border-white/[0.08] shrink-0" alt="" />
          <div>
            <div className="font-black text-sm text-yellow-300">Install WC Predictor</div>
            <div className="text-zinc-500 text-xs">Home screen icon + match notifications</div>
          </div>
        </div>

        {/* Android — prompt available */}
        {!isIos && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm py-2.5
              transition-all shadow-[0_0_16px_3px_rgba(234,179,8,0.3)]"
          >
            Install App
          </button>
        )}

        {/* Android — manual fallback (always shown alongside or when no prompt) */}
        {!isIos && !deferredPrompt && (
          <div className="space-y-1.5 text-xs text-zinc-300">
            <div>1. Tap <span className="font-black text-white">⋮</span> (Chrome menu, top right)</div>
            <div>2. Tap <span className="font-black text-white">Add to Home Screen</span></div>
            <div>3. Tap <span className="font-black text-white">Add</span></div>
          </div>
        )}

        {/* iOS */}
        {isIos && (
          <div className="space-y-1.5 text-xs text-zinc-300">
            <div>1. Tap <span className="font-black text-white">Share ⬆</span> at the bottom of Safari</div>
            <div>2. Tap <span className="font-black text-white">Add to Home Screen</span></div>
            <div>3. Tap <span className="font-black text-white">Add</span></div>
          </div>
        )}
      </div>
    </div>
  );
}


export default function LoginPage() {
  const router =
    useRouter();

  const [
    isSignup,
    setIsSignup,
  ] = useState(false);

  const [
    showForgotPassword,
    setShowForgotPassword,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  // CLEAR STALE USER COOKIE
  useEffect(() => {
    const verifyUser =
      async () => {
        const storedUser =
          Cookies.get(
            "user"
          );

        if (!storedUser)
          return;

        try {
          const parsedUser =
            JSON.parse(
              storedUser
            );

          const res = await fetch(`/api/auth/verify?userId=${parsedUser.id}`);
          if (!res.ok) {
            Cookies.remove("user");
          }
        } catch {
          Cookies.remove(
            "user"
          );
        }
      };

    verifyUser();
  }, []);

  // AUTH
  const handleSubmit =
    async () => {
      // BASIC VALIDATION
      if (!phone.trim()) {
        toast.error(
          "Enter phone number"
        );

        return;
      }

      if (!password.trim()) {
        toast.error(
          "Enter password"
        );

        return;
      }

      // SIGNUP
      if (isSignup) {
        // NAME REQUIRED
        if (!name.trim()) {
          toast.error(
            "Name is required"
          );

          return;
        }

        // Letters only, words separated by a single space, no leading/trailing spaces
        const validName = /^[A-Za-z]+( [A-Za-z]+)*$/.test(name.trim());

        if (!validName) {
          toast.error(
            "Name can only contain letters and single spaces between words"
          );

          return;
        }
        // Normalise before saving — trim any trailing space the user may have typed last
        const cleanName = name.trim().toUpperCase();

        // PASSWORD LENGTH
        if (
          password.length < 4
        ) {
          toast.error(
            "Password must be at least 4 characters"
          );

          return;
        }

        const signupRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim(), password, name: cleanName }),
        });
        const signupData = await signupRes.json();
        if (!signupRes.ok) {
          toast.error(signupData.error ?? "Failed to create account");
          return;
        }

        toast.success("Account created successfully ⚽");
        setIsSignup(false);
        setName("");
        setPhone("");
        setPassword("");
        return;
      }

      // FORGOT PASSWORD
      if (showForgotPassword) {
        const resetRes = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phone.trim(), password }),
        });
        const resetData = await resetRes.json();
        if (!resetRes.ok) {
          toast.error(resetData.error ?? "Failed to reset password");
          return;
        }

        toast.success("Password updated successfully 🔐");
        setShowForgotPassword(false);
        setPassword("");
        return;
      }

      // LOGIN
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        toast.error(loginData.error ?? "Login failed");
        return;
      }
      const { user } = loginData;

      // LOGIN SUCCESS
      Cookies.set("user", JSON.stringify(user), { expires: 30 });
      // Clear any stale active league so user picks fresh each session
      Cookies.remove("activeLeague");

      toast.success(
        `Welcome back ${user.name} ⚽`
      );

      router.push("/leagues?select=1");
    };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <InstallBanner />
      <div
        className="
          w-full
          max-w-[420px]
          rounded-[36px]
          border
          border-zinc-800
          bg-gradient-to-b
          from-zinc-900
          to-black
          p-10
          shadow-2xl
        "
      >
        {/* HERO */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 rounded-2xl mb-6">
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />

            <span className="text-yellow-300 font-bold uppercase tracking-[0.25em] text-sm">
              FIFA WORLD CUP 2026
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/wc2026-loho.png" alt="FIFA WC 2026" className="w-14 h-14 object-contain drop-shadow-xl" />
          </div>
          <h1 className="text-5xl font-black tracking-tight">
            Pro Predictor
          </h1>

          <p className="text-zinc-500 mt-4">
            Predict matches.
            Dominate leaderboards.
            Become legendary.
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-5">
          {isSignup && (
            <input
              className="
                w-full
                rounded-2xl
                bg-zinc-900
                border
                border-zinc-800
                px-5
                py-4
                outline-none
                focus:border-yellow-500
                transition-all
              "
              placeholder="Your Name"
              value={name}
              onChange={(e) => {
                // Strip anything that isn't a letter or space, collapse multiple spaces, no leading space, uppercase
                const sanitized = e.target.value
                  .replace(/[^A-Za-z ]/g, "")        // only letters + space
                  .replace(/ {2,}/g, " ")             // no double spaces
                  .replace(/^ /, "")                  // no leading space
                  .toUpperCase();                     // always uppercase
                setName(sanitized);
              }}
            />
          )}

          <input
            className="
              w-full
              rounded-2xl
              bg-zinc-900
              border
              border-zinc-800
              px-5
              py-4
              outline-none
              focus:border-yellow-500
              transition-all
            "
            placeholder="Phone Number"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target
                  .value
              )
            }
          />

          {/* PASSWORD */}
          <div className="relative">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              className="
                w-full
                rounded-2xl
                bg-zinc-900
                border
                border-zinc-800
                px-5
                py-4
                pr-16
                outline-none
                focus:border-yellow-500
                transition-all
              "
              placeholder={
                showForgotPassword
                  ? "New Password"
                  : "Password"
              }
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target
                    .value
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              className="
                absolute
                right-5
                top-1/2
                -translate-y-1/2
                text-zinc-500
                hover:text-white
                transition-all
                text-sm
                font-semibold
              "
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>

          <button
            onClick={
              handleSubmit
            }
            className="
              w-full
              rounded-2xl
              bg-yellow-400
              text-black
              font-black
              py-4
              hover:scale-[1.02]
              active:scale-[0.98]
              transition-all
            "
          >
            {isSignup
              ? "Create Account"
              : showForgotPassword
              ? "Reset Password"
              : "Login"}
          </button>
        </div>

        {/* ACTIONS */}
        <div className="mt-8 space-y-4 text-center">
          {!isSignup && (
            <button
              onClick={() =>
                setShowForgotPassword(
                  !showForgotPassword
                )
              }
              className="
                text-yellow-400
                hover:text-yellow-300
                transition-all
                text-sm
              "
            >
              {showForgotPassword
                ? "Back to Login"
                : "Forgot Password?"}
            </button>
          )}

          <button
            onClick={() => {
              setIsSignup(
                !isSignup
              );

              setShowForgotPassword(
                false
              );
            }}
            className="
              block
              w-full
              text-zinc-500
              hover:text-white
              transition-all
              text-sm
            "
          >
            {isSignup
              ? "Already have an account? Login"
              : "No account? Sign Up"}
          </button>
        </div>
      </div>
    </main>
  );
}
