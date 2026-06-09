"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import Cookies from "js-cookie";

import { useRouter } from "next/navigation";

import toast from "react-hot-toast";

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

          const {
            data,
          } = await supabase
            .from("users")
            .select("*")
            .eq(
              "id",
              parsedUser.id
            )
            .single();

          if (!data) {
            Cookies.remove(
              "user"
            );
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

        // CHECK EXISTING USER
        const {
          data:
            existingUser,
        } = await supabase
          .from("users")
          .select("*")
          .eq(
            "phone",
            phone
          )
          .single();

        if (
          existingUser
        ) {
          toast.error(
            "Account already exists"
          );

          return;
        }

        // CREATE USER
        const {
          data: newUsers,
          error,
        } = await supabase
          .from("users")
          .insert([
            {
              name:
                cleanName,

              phone:
                phone.trim(),

              password,
            },
          ])
          .select();

        if (error) {
          toast.error(
            error.message
          );

          return;
        }

        const newUser =
          newUsers?.[0];

        // CREATE LEADERBOARD ENTRY
        if (newUser) {
          const {
            error:
              leaderboardError,
          } = await supabase
            .from(
              "leaderboard"
            )
            .insert([
              {
                user_id:
                  newUser.id,

                username:
                  newUser.name,

                total_points: 0,

                exact_predictions: 0,

                correct_results: 0,
              },
            ]);

          if (
            leaderboardError
          ) {
            console.error(
              leaderboardError
            );
          }
        }

        toast.success(
          "Account created successfully ⚽"
        );

        setIsSignup(
          false
        );

        setName("");

        setPhone("");

        setPassword("");

        return;
      }

      // FORGOT PASSWORD
      if (
        showForgotPassword
      ) {
        const {
          data: user,
        } = await supabase
          .from("users")
          .select("*")
          .eq(
            "phone",
            phone
          )
          .single();

        if (!user) {
          toast.error(
            "No account found"
          );

          return;
        }

        if (
          password.length < 4
        ) {
          toast.error(
            "Password must be at least 4 characters"
          );

          return;
        }

        const {
          error,
        } = await supabase
          .from("users")
          .update({
            password,
          })
          .eq(
            "phone",
            phone
          );

        if (error) {
          toast.error(
            error.message
          );

          return;
        }

        toast.success(
          "Password updated successfully 🔐"
        );

        setShowForgotPassword(
          false
        );

        setPassword("");

        return;
      }

      // LOGIN
      const {
        data: user,
      } = await supabase
        .from("users")
        .select("*")
        .eq(
          "phone",
          phone
        )
        .single();

      // USER NOT FOUND
      if (!user) {
        toast.error(
          "No account found. Please sign up."
        );

        return;
      }

      // WRONG PASSWORD
      if (
        user.password !==
        password
      ) {
        toast.error(
          "Incorrect password"
        );

        return;
      }

      // LOGIN SUCCESS
      Cookies.set(
        "user",
        JSON.stringify(
          user
        )
      );

      toast.success(
        `Welcome back ${user.name} ⚽`
      );

      router.push("/");
    };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
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
