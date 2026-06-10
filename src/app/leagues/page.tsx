"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import PageWrapper from "@/components/PageWrapper";
import toast from "react-hot-toast";

type League = {
  id: string;
  name: string;
  code: string;
  created_by: number;
  created_at: string;
  member_count?: number;
};

type LeaderEntry = {
  user_id: number;
  username: string;
  total_points: number;
  exact_predictions: number;
  correct_results: number;
};

// ── Rank colours ─────────────────────────────────────────────────────────────
const TROPHY: Record<number, string> = { 0: "🏆", 1: "🥈", 2: "🥉" };
const RANK_GLOW: Record<number, string> = {
  0: "border-yellow-500/30 shadow-[0_0_28px_5px_rgba(234,179,8,0.15),0_0_0_1px_rgba(234,179,8,0.25),inset_0_1px_0_rgba(255,255,255,0.07)]",
  1: "border-zinc-400/20 shadow-[0_0_20px_4px_rgba(161,161,170,0.10),0_0_0_1px_rgba(161,161,170,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]",
  2: "border-amber-700/25 shadow-[0_0_20px_4px_rgba(180,83,9,0.12),0_0_0_1px_rgba(180,83,9,0.20),inset_0_1px_0_rgba(255,255,255,0.06)]",
};
const DEFAULT_ROW = "border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/[0.12] hover:shadow-[0_0_16px_3px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.06)]";

// ── League Card ───────────────────────────────────────────────────────────────
function LeagueCard({
  league,
  isOwner,
  currentUserId,
  onSelect,
  onLeave,
  onDisband,
  selected,
  isSelectMode,
  isActive,
  onSelectPlay,
}: {
  league: League;
  isOwner: boolean;
  currentUserId: number;
  onSelect: () => void;
  onLeave: () => void;
  onDisband: () => void;
  selected: boolean;
  isSelectMode?: boolean;
  isActive?: boolean;
  onSelectPlay?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(league.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      whileHover={{ scale: selected ? 1 : 1.01 }}
      transition={{ duration: 0.15 }}
      onClick={onSelect}
      className={`relative overflow-hidden rounded-3xl border backdrop-blur-md cursor-pointer
        px-5 py-5 transition-all duration-300
        ${selected
          ? "border-yellow-500/30 shadow-[0_0_32px_6px_rgba(234,179,8,0.14),0_0_0_1px_rgba(234,179,8,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/[0.12] hover:shadow-[0_0_20px_4px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.07)]"
        }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-black text-lg truncate">{league.name}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-zinc-500 text-xs">
              {league.member_count ?? "?"} {(league.member_count ?? 0) === 1 ? "member" : "members"}
            </span>
            {isOwner && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 text-[10px] font-black">
                Owner
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Invite code chip */}
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-white/[0.08]
              text-xs font-black tracking-[0.12em] text-zinc-200 hover:bg-zinc-700 transition-all"
            title="Copy invite code"
          >
            <span className="font-mono">{league.code}</span>
            <span className="text-zinc-500 text-[10px]">{copied ? "✓" : "⧉"}</span>
          </button>

          {/* Leave (non-owners) or Disband (owner) */}
          {isOwner ? (
            <button
              onClick={(e) => { e.stopPropagation(); onDisband(); }}
              className="px-3 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400
                hover:bg-red-500/20 transition-all text-[10px] font-black whitespace-nowrap"
              title="Disband league"
            >
              Disband
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onLeave(); }}
              className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400
                hover:bg-red-500/20 transition-all text-xs font-black flex items-center justify-center"
              title="Leave league"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isSelectMode ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          {isActive ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-black">
              ✓ Currently Active
            </span>
          ) : (
            <span className="text-[11px] text-zinc-600 font-semibold">📅 Private league</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onSelectPlay?.(); }}
            className="px-4 py-2 rounded-2xl bg-yellow-400 text-black font-black text-xs hover:bg-yellow-300 transition-all shrink-0"
          >
            {isActive ? "Continue →" : "Play Here →"}
          </button>
        </div>
      ) : (
        <div className="mt-3 text-[11px] text-zinc-600 font-semibold">
          Tap to view standings →
        </div>
      )}
    </motion.div>
  );
}

// ── Mini Leaderboard ──────────────────────────────────────────────────────────
function MiniLeaderboard({
  league,
  leaderboard,
  memberCount,
  currentUsername,
  onClose,
}: {
  league: League;
  leaderboard: LeaderEntry[];
  memberCount: number;
  currentUsername: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(league.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-3xl border border-yellow-500/25 backdrop-blur-md overflow-hidden mb-8
        shadow-[0_0_48px_10px_rgba(234,179,8,0.10),0_0_0_1px_rgba(234,179,8,0.20),inset_0_1px_0_rgba(255,255,255,0.07)]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/[0.18] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-white/[0.07]">
        <div>
          <div className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black mb-1">Mini League</div>
          <h2 className="text-2xl font-black">{league.name}</h2>
          <div className="text-zinc-500 text-sm mt-1">{memberCount} {memberCount === 1 ? "member" : "members"}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copy}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-800 border border-white/[0.08]
              text-sm font-black tracking-wider text-zinc-200 hover:bg-zinc-700 transition-all"
          >
            <span className="font-mono text-yellow-300">{league.code}</span>
            <span className="text-zinc-500 text-xs">{copied ? "Copied ✓" : "Copy"}</span>
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center
              text-zinc-400 hover:text-white hover:border-white/[0.18] transition-all"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Leaderboard rows */}
      <div className="px-6 py-5 space-y-2">
        {leaderboard.length === 0 && (
          <div className="text-center py-10 text-zinc-600 font-bold">No predictions yet.</div>
        )}
        {leaderboard.map((entry, index) => {
          const hasPoints = entry.total_points > 0;
          const rankedIndex = hasPoints ? index : -1;
          const rowCls = RANK_GLOW[rankedIndex] ?? DEFAULT_ROW;
          const isMe = entry.username === currentUsername;

          return (
            <div
              key={entry.user_id}
              className={`relative overflow-hidden rounded-2xl border backdrop-blur-md
                px-4 py-3 flex items-center justify-between gap-4 transition-all duration-300 ${rowCls}
                ${isMe ? "ring-1 ring-emerald-500/30" : ""}`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent pointer-events-none" />
              <div className="flex items-center gap-3">
                {hasPoints ? (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0
                    bg-zinc-800/60 border border-white/[0.07]">
                    {rankedIndex < 3 ? TROPHY[rankedIndex] : <span className="text-sm font-black text-zinc-400">#{index + 1}</span>}
                  </div>
                ) : (
                  <div className="w-9 h-9 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base">{entry.username}</span>
                    {isMe && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[9px] font-black">
                        You
                      </span>
                    )}
                  </div>
                  {hasPoints && (
                    <div className="text-zinc-600 text-xs mt-0.5">
                      🎯 {entry.exact_predictions} exact · ✅ {entry.correct_results} correct
                    </div>
                  )}
                </div>
              </div>
              {hasPoints && (
                <div className={`text-3xl font-black tabular-nums ${rankedIndex === 0 ? "text-yellow-300" : rankedIndex === 1 ? "text-zinc-200" : rankedIndex === 2 ? "text-amber-400" : ""}`}>
                  {entry.total_points}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LeaguesPage() {
  return (
    <Suspense>
      <LeaguesPageInner />
    </Suspense>
  );
}

function LeaguesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSelectMode = searchParams.get("select") === "1";
  const [user, setUser] = useState<any>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  // Join form
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Active league
  const activeLeagueCookie = Cookies.get("activeLeague");
  const activeLeagueId = activeLeagueCookie ? JSON.parse(activeLeagueCookie).id : null;

  const selectAndPlay = (league: League | null) => {
    const payload = league
      ? { id: league.id, name: league.name }
      : { id: null, name: "Global" };
    Cookies.set("activeLeague", JSON.stringify(payload));
    router.push("/");
  };

  useEffect(() => {
    const stored = Cookies.get("user");
    if (!stored) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    setUser(u);
    fetchMyLeagues(u.id);
  }, []);

  const fetchMyLeagues = async (userId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leagues/mine?userId=${userId}`);
      const data = await res.json();
      if (data.success) setLeagues(data.leagues);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueBoard = async (league: League) => {
    setLeaderboardLoading(true);
    setSelectedLeague(league);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const res = await fetch(`/api/leagues/${league.code}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        setMemberCount(data.memberCount);
      }
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) { toast.error("Enter a league name"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/leagues/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim(), userId: user.id }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error); return; }
      toast.success(`League created! Code: ${data.league.code}`);
      setCreateName("");
      setShowCreate(false);
      fetchMyLeagues(user.id);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { toast.error("Enter an invite code"); return; }
    setJoining(true);
    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim(), userId: user.id }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error); return; }
      toast.success(`Joined ${data.league.name}!`);
      setJoinCode("");
      setShowJoin(false);
      fetchMyLeagues(user.id);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (league: League) => {
    try {
      const res = await fetch(`/api/leagues/${league.code}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error); return; }
      toast.success(`Left ${league.name}`);
      if (selectedLeague?.id === league.id) setSelectedLeague(null);
      fetchMyLeagues(user.id);
    } catch {
      toast.error("Failed to leave league");
    }
  };

  const handleDisband = async (league: League) => {
    if (!confirm(`Disband "${league.name}"? This will remove all members and delete the league permanently.`)) return;
    try {
      const res = await fetch(`/api/leagues/${league.code}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, disband: true }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error); return; }
      toast.success(`${league.name} disbanded`);
      if (selectedLeague?.id === league.id) setSelectedLeague(null);
      fetchMyLeagues(user.id);
    } catch {
      toast.error("Failed to disband league");
    }
  };

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} hideNav={isSelectMode} />

          {/* Active Mode Banner — always shown */}
          {activeLeagueCookie && (() => {
            const al = JSON.parse(activeLeagueCookie);
            const isGlobal = !al.id;
            return (
              <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-md px-5 py-4 mb-6 flex items-center justify-between gap-4
                ${isGlobal
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : "border-yellow-500/20 bg-yellow-500/[0.04]"
                }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">{isGlobal ? "🌍" : "⚡"}</span>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-black">Currently playing in</div>
                    <div className="font-black text-white truncate">{al.name}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      📅 Standard calendar-date matchdays
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isSelectMode && (
                    <button onClick={() => router.push("/")} className="px-3 py-1.5 rounded-xl bg-zinc-800 border border-white/[0.08] text-xs font-black text-zinc-300 hover:bg-zinc-700 transition-all whitespace-nowrap">
                      ← Predictor
                    </button>
                  )}
                  {isSelectMode ? (
                    <button
                      onClick={() => router.push("/")}
                      className="px-3 py-1.5 rounded-xl bg-zinc-700 border border-white/[0.08] text-xs font-black text-zinc-300 hover:bg-zinc-600 transition-all whitespace-nowrap"
                    >
                      ← Back
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/leagues?select=1")}
                      className="px-3 py-1.5 rounded-xl bg-zinc-700 border border-white/[0.08] text-xs font-black text-zinc-300 hover:bg-zinc-600 transition-all whitespace-nowrap"
                    >
                      Switch ↻
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* HERO */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 rounded-2xl mb-6">
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-300 font-bold uppercase tracking-[0.25em] text-sm">
                FIFA World Cup 2026
              </span>
            </div>
            {isSelectMode ? (
              <>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
                  Choose Your League
                </h1>
                <p className="text-zinc-400 text-lg max-w-xl">
                  Select a league to play in. Your matchday grouping, booster windows, and standings all follow your league's rules.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
                  Mini Leagues
                </h1>
                <p className="text-zinc-400 text-lg max-w-xl">
                  Compete with your friends in a private group. Create a league, share the code — only your crew sees the standings.
                </p>
              </>
            )}
          </div>

          {/* GLOBAL PLAY OPTION (always shown in select mode, or as a quick switch otherwise) */}
          {isSelectMode && (
            <div
              className="relative overflow-hidden rounded-3xl border backdrop-blur-md cursor-pointer mb-6
                border-emerald-500/25 shadow-[0_0_28px_5px_rgba(34,197,94,0.10),0_0_0_1px_rgba(34,197,94,0.18),inset_0_1px_0_rgba(255,255,255,0.07)]
                hover:shadow-[0_0_40px_8px_rgba(34,197,94,0.15)] transition-all duration-300"
              onClick={() => selectAndPlay(null)}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/[0.18] to-transparent pointer-events-none" />
              <div className="px-6 py-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black mb-1">No private league</div>
                  <div className="text-2xl font-black text-white">🌍 Play Globally</div>
                  <div className="text-zinc-400 text-sm mt-1">Standard calendar-date matchdays · you can still join private leagues anytime</div>
                </div>
                <div className="shrink-0 px-5 py-2.5 rounded-2xl bg-emerald-500 text-black font-black text-sm hover:bg-emerald-400 transition-all">
                  Play →
                </div>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {/* CREATE */}
            <div className={`relative overflow-hidden rounded-3xl border backdrop-blur-md transition-all duration-300
              ${showCreate
                ? "border-yellow-500/30 shadow-[0_0_28px_5px_rgba(234,179,8,0.12),0_0_0_1px_rgba(234,179,8,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]"
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/[0.15] to-transparent pointer-events-none" />
              <button
                onClick={() => { setShowCreate((v) => !v); setShowJoin(false); }}
                className="w-full px-6 py-5 text-left flex items-center justify-between group"
              >
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black mb-1">Start fresh</div>
                  <div className="text-xl font-black text-zinc-200 group-hover:text-white transition-colors">
                    🏟️ Create a League
                  </div>
                </div>
                <motion.span
                  animate={{ rotate: showCreate ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-zinc-500 text-lg"
                >
                  ↓
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {showCreate && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/[0.06] px-6 py-5 space-y-3">
                      <input
                        type="text"
                        placeholder="League name…"
                        value={createName}
                        maxLength={40}
                        onChange={(e) => setCreateName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        className="w-full backdrop-blur-md border border-white/[0.08] rounded-2xl px-4 py-3
                          text-white placeholder-zinc-600 font-semibold bg-transparent
                          focus:outline-none focus:border-yellow-400/40 transition-all"
                      />
                      <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="w-full py-3 rounded-2xl bg-yellow-400 text-black font-black hover:bg-yellow-300 transition-all disabled:opacity-50"
                      >
                        {creating ? "Creating…" : "Create League →"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* JOIN */}
            <div className={`relative overflow-hidden rounded-3xl border backdrop-blur-md transition-all duration-300
              ${showJoin
                ? "border-emerald-500/30 shadow-[0_0_28px_5px_rgba(34,197,94,0.10),0_0_0_1px_rgba(34,197,94,0.20),inset_0_1px_0_rgba(255,255,255,0.07)]"
                : "border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]"
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/[0.12] to-transparent pointer-events-none" />
              <button
                onClick={() => { setShowJoin((v) => !v); setShowCreate(false); }}
                className="w-full px-6 py-5 text-left flex items-center justify-between group"
              >
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-black mb-1">Have a code?</div>
                  <div className="text-xl font-black text-zinc-200 group-hover:text-white transition-colors">
                    🔑 Join a League
                  </div>
                </div>
                <motion.span
                  animate={{ rotate: showJoin ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-zinc-500 text-lg"
                >
                  ↓
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {showJoin && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/[0.06] px-6 py-5 space-y-3">
                      <input
                        type="text"
                        placeholder="Enter 6-char code…"
                        value={joinCode}
                        maxLength={6}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                        className="w-full backdrop-blur-md border border-white/[0.08] rounded-2xl px-4 py-3
                          text-white placeholder-zinc-600 font-black font-mono tracking-[0.3em] text-center bg-transparent
                          focus:outline-none focus:border-emerald-400/40 transition-all uppercase"
                      />
                      <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="w-full py-3 rounded-2xl bg-emerald-500 text-black font-black hover:bg-emerald-400 transition-all disabled:opacity-50"
                      >
                        {joining ? "Joining…" : "Join League →"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* SELECTED LEAGUE LEADERBOARD */}
          <AnimatePresence>
            {selectedLeague && (
              leaderboardLoading ? (
                <div className="text-center py-12 text-zinc-500 font-bold animate-pulse">
                  Loading standings…
                </div>
              ) : (
                <MiniLeaderboard
                  key={selectedLeague.id}
                  league={selectedLeague}
                  leaderboard={leaderboard}
                  memberCount={memberCount}
                  currentUsername={user?.name ?? ""}
                  onClose={() => setSelectedLeague(null)}
                />
              )
            )}
          </AnimatePresence>

          {/* MY LEAGUES */}
          {loading ? (
            <div className="text-center py-20 text-zinc-500 font-bold animate-pulse">
              ⚽ Loading your leagues…
            </div>
          ) : leagues.length === 0 ? (
            <div className="rounded-3xl border border-white/[0.07] backdrop-blur-md p-14 text-center
              shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="text-5xl mb-5">🏟️</div>
              <div className="text-2xl font-black mb-2">No private leagues yet</div>
              <div className="text-zinc-500">
                {isSelectMode
                  ? "Create or join a league above — or tap \"Play Globally\" to jump straight in. You can always join more leagues later."
                  : "Create one or join with a friend's code. You can be in multiple leagues at the same time."}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-end justify-between mb-4">
                <div className="text-zinc-500 uppercase tracking-[0.3em] text-xs font-black">
                  Your Leagues · {leagues.length}
                </div>
                {!isSelectMode && (
                  <div className="text-[11px] text-zinc-600">You can be in multiple leagues simultaneously</div>
                )}
              </div>
              <div className="space-y-3">
                {leagues.map((league) => (
                  <LeagueCard
                    key={league.id}
                    league={league}
                    isOwner={league.created_by === user?.id}
                    currentUserId={user?.id}
                    selected={selectedLeague?.id === league.id}
                    isSelectMode={isSelectMode}
                    isActive={activeLeagueId === league.id}
                    onSelectPlay={() => selectAndPlay(league)}
                    onSelect={() =>
                      isSelectMode
                        ? selectAndPlay(league)
                        : selectedLeague?.id === league.id
                          ? setSelectedLeague(null)
                          : fetchLeagueBoard(league)
                    }
                    onLeave={() => handleLeave(league)}
                    onDisband={() => handleDisband(league)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </PageWrapper>
  );
}
