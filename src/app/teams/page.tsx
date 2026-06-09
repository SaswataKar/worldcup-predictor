"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import PageWrapper from "@/components/PageWrapper";

// ─── Types ────────────────────────────────────────────────────────────────────

type Player = {
  id: number;
  name: string;
  position: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  shirtNumber: number | null;
};

type Coach = {
  id: number | null;
  name: string | null;
  nationality: string | null;
  dateOfBirth: string | null;
};

type Team = {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  venue: string | null;
  founded: number | null;
  clubColors: string | null;
  website: string | null;
  coach: Coach | null;
  squad: Player[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POSITION_ORDER = ["Goalkeeper", "Defence", "Midfield", "Offence"];
const POSITION_LABELS: Record<string, string> = {
  Goalkeeper: "Goalkeepers",
  Defence: "Defenders",
  Midfield: "Midfielders",
  Offence: "Forwards",
};
const POSITION_COLORS: Record<string, string> = {
  Goalkeeper: "text-yellow-300 border-yellow-500/30",
  Defence: "text-sky-300 border-sky-500/30",
  Midfield: "text-emerald-300 border-emerald-500/30",
  Offence: "text-red-300 border-red-500/30",
};

function getAge(dob: string | null) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function groupByPosition(squad: Player[]) {
  const groups: Record<string, Player[]> = {};
  for (const pos of POSITION_ORDER) groups[pos] = [];
  for (const player of squad) {
    const pos = player.position ?? "Offence";
    if (groups[pos]) groups[pos].push(player);
    else groups["Offence"].push(player);
  }
  return groups;
}

// ─── Team Card (collapsed) ────────────────────────────────────────────────────

function TeamCard({
  team,
  selected,
  onClick,
}: {
  team: Team;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: selected ? 1 : 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`w-full text-left rounded-3xl p-6 flex flex-col items-center gap-4
        backdrop-blur-md border transition-all duration-300 relative overflow-hidden
        ${
          selected
            ? "border-yellow-500/35 shadow-[0_0_36px_8px_rgba(234,179,8,0.18),0_0_0_1px_rgba(234,179,8,0.28),inset_0_1px_0_rgba(255,255,255,0.09)]"
            : "border-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/[0.13] hover:shadow-[0_0_24px_5px_rgba(255,255,255,0.07),0_0_0_1px_rgba(255,255,255,0.11),inset_0_1px_0_rgba(255,255,255,0.07)]"
        }`}
    >
      {/* top glass highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.10] to-transparent pointer-events-none" />

      <img
        src={team.crest}
        alt={team.name}
        className="w-16 h-16 object-contain drop-shadow-lg"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <div className="text-center">
        <div className="font-black text-base leading-tight">{team.name}</div>
        <div className="text-zinc-500 text-xs font-bold mt-1 tracking-widest uppercase">
          {team.tla}
        </div>
      </div>
      {team.coach?.name && (
        <div className="text-xs text-zinc-600 font-semibold truncate w-full text-center">
          🧢 {team.coach.name}
        </div>
      )}
      <div className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest mt-auto">
        {team.squad.length} players →
      </div>
    </motion.button>
  );
}

// ─── Team Detail Panel ────────────────────────────────────────────────────────

function TeamDetail({ team, onClose }: { team: Team; onClose: () => void }) {
  const grouped = useMemo(() => groupByPosition(team.squad), [team]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-3xl border border-yellow-500/25 backdrop-blur-md overflow-hidden mb-10
        shadow-[0_0_48px_12px_rgba(234,179,8,0.12),0_0_0_1px_rgba(234,179,8,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      {/* top glass highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-300/[0.15] to-transparent pointer-events-none z-10" />

      {/* HEADER */}
      <div className="relative flex items-center gap-6 px-8 py-8 border-b border-white/[0.07]">
        <img
          src={team.crest}
          alt={team.name}
          className="w-20 h-20 object-contain drop-shadow-2xl shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mb-1">
            {team.tla}
          </div>
          <h2 className="text-4xl font-black leading-tight">{team.name}</h2>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-400">
            {team.coach?.name && (
              <span className="flex items-center gap-1.5">
                <span className="text-zinc-600">🧢</span>
                <span className="font-semibold">{team.coach.name}</span>
                {team.coach.nationality && (
                  <span className="text-zinc-600">· {team.coach.nationality}</span>
                )}
              </span>
            )}
            {team.venue && (
              <span className="flex items-center gap-1.5 text-zinc-500">
                <span>🏟️</span> {team.venue}
              </span>
            )}
            {team.founded && (
              <span className="text-zinc-600">Est. {team.founded}</span>
            )}
            {team.clubColors && (
              <span className="text-zinc-600">🎨 {team.clubColors}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.10] backdrop-blur-md
            flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/[0.20] transition-all"
        >
          ✕
        </button>
      </div>

      {/* SQUAD */}
      <div className="px-8 py-8">
        <div className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mb-6">Squad</div>
        <div className="space-y-8">
          {POSITION_ORDER.map((pos) => {
            const players = grouped[pos];
            if (!players?.length) return null;
            return (
              <div key={pos}>
                {/* Position heading */}
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black mb-4 ${POSITION_COLORS[pos]}`}
                >
                  {POSITION_LABELS[pos]} · {players.length}
                </div>

                {/* Player rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {players
                    .sort((a, b) => (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99))
                    .map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl
                          border border-white/[0.06] backdrop-blur-sm
                          shadow-[0_0_0_1px_rgba(255,255,255,0.03),inset_0_1px_0_rgba(255,255,255,0.05)]
                          hover:border-white/[0.11] hover:shadow-[0_0_14px_3px_rgba(255,255,255,0.05),inset_0_1px_0_rgba(255,255,255,0.07)]
                          transition-all duration-200"
                      >
                        {/* Shirt number */}
                        <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xs font-black text-zinc-400 shrink-0">
                          {player.shirtNumber ?? "–"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm truncate">{player.name}</div>
                          <div className="text-xs text-zinc-600 truncate">
                            {player.nationality}
                            {player.dateOfBirth && (
                              <span className="ml-2 text-zinc-700">
                                age {getAge(player.dateOfBirth)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    const stored = Cookies.get("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(stored));

    fetch("/api/teams", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const sorted = (data.teams as Team[]).sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setTeams(sorted);
        } else {
          setError(data.error ?? "Failed to load teams");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.tla.toLowerCase().includes(q) ||
        t.shortName?.toLowerCase().includes(q)
    );
  }, [teams, search]);

  const handleSelectTeam = (team: Team) => {
    if (selectedTeam?.id === team.id) {
      setSelectedTeam(null);
    } else {
      setSelectedTeam(team);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <PageWrapper>
      <main className="min-h-screen text-white p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <Header user={user} />

          {/* HERO */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 rounded-2xl mb-6">
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-300 font-bold uppercase tracking-[0.25em] text-sm">
                FIFA World Cup 2026
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">Teams</h1>
            <p className="text-zinc-400 text-lg max-w-2xl">
              All {teams.length || 48} participating nations — squads, coaches and player details.
            </p>
          </div>

          {/* SEARCH */}
          {!loading && teams.length > 0 && (
            <div className="relative mb-8 max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search teams…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedTeam(null);
                }}
                className="w-full backdrop-blur-md border border-white/[0.08] rounded-2xl pl-11 pr-4 py-3
                  text-white placeholder-zinc-600 font-semibold
                  shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]
                  focus:outline-none focus:border-white/[0.18] focus:shadow-[0_0_20px_4px_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.14)]
                  transition-all duration-300"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="text-center py-32">
              <div className="text-4xl font-black animate-pulse">⚽ Loading teams…</div>
            </div>
          )}

          {/* ERROR */}
          {error && !loading && (
            <div className="backdrop-blur-md border border-red-500/25 rounded-3xl p-10 text-center
              shadow-[0_0_28px_6px_rgba(239,68,68,0.10),0_0_0_1px_rgba(239,68,68,0.18)]">
              <div className="text-3xl mb-4">⚠️</div>
              <div className="text-red-300 font-black text-xl mb-2">Failed to load teams</div>
              <div className="text-red-400/70 text-sm">{error}</div>
            </div>
          )}

          {/* SELECTED TEAM DETAIL */}
          <AnimatePresence>
            {selectedTeam && (
              <TeamDetail
                key={selectedTeam.id}
                team={selectedTeam}
                onClose={() => setSelectedTeam(null)}
              />
            )}
          </AnimatePresence>

          {/* TEAM GRID */}
          {!loading && !error && (
            <>
              {filtered.length === 0 && (
                <div className="text-center py-20 text-zinc-600 font-bold">
                  No teams match &quot;{search}&quot;
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filtered.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    selected={selectedTeam?.id === team.id}
                    onClick={() => handleSelectTeam(team)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </PageWrapper>
  );
}
