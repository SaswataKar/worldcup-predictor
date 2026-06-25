"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageWrapper from "@/components/PageWrapper";

// ─── Types ────────────────────────────────────────────────────────────────────

type Team = {
  name: string;
  abbr: string;
  logo: string;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: string;
  pts: number;
  qualified: boolean;
};

type GroupStanding = { group: string; teams: Team[] };

type KOMatch = {
  id: number;
  team1: string;
  team2: string;
  team1_crest: string | null;
  team2_crest: string | null;
  team1_score: number | null;
  team2_score: number | null;
  matchday: string;
  status: string;
  kickoff_time: string;
};

type KORounds = Record<string, KOMatch[]>;

const ROUND_LABELS: Record<string, string> = {
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "3rd Place",
  FINAL: "Final",
};
const ROUND_ORDER = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];

// ─── Group Table ──────────────────────────────────────────────────────────────

function GroupTable({ g, delay }: { g: GroupStanding; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-3xl border border-white/[0.07] overflow-hidden backdrop-blur-md
        shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <span className="text-base font-black text-white">{g.group}</span>
        <span className="text-zinc-600 text-xs font-semibold">{g.teams[0]?.mp ?? 0} MP</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-500 font-black text-[10px] uppercase tracking-widest border-b border-white/[0.04]">
              <th className="text-left pl-4 py-2.5">Team</th>
              <th className="text-center py-2.5 w-7">MP</th>
              <th className="text-center py-2.5 w-7">W</th>
              <th className="text-center py-2.5 w-7">D</th>
              <th className="text-center py-2.5 w-7">L</th>
              <th className="text-center py-2.5 w-7 hidden sm:table-cell">GF</th>
              <th className="text-center py-2.5 w-7 hidden sm:table-cell">GA</th>
              <th className="text-center py-2.5 w-9">GD</th>
              <th className="text-center py-2.5 pr-4 w-9">Pts</th>
            </tr>
          </thead>
          <tbody>
            {g.teams.map((team, ti) => {
              let rowBg = "";
              if (team.qualified) rowBg = "bg-emerald-500/8";
              else if (ti < 2) rowBg = "bg-emerald-500/5";
              else if (ti === 2) rowBg = "bg-yellow-500/5";

              return (
                <tr
                  key={team.abbr}
                  className={`border-b border-white/[0.03] last:border-0 transition-colors hover:bg-white/[0.03] ${rowBg}`}
                >
                  <td className="pl-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600 font-black w-4 text-center text-[10px]">{ti + 1}</span>
                      <img src={team.logo} alt={team.abbr} className="w-5 h-5 object-contain shrink-0" />
                      <span className="font-bold text-zinc-200 truncate">{team.name}</span>
                      {team.qualified && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400" title="Qualified" />
                      )}
                    </div>
                  </td>
                  <td className="text-center text-zinc-400 tabular-nums">{team.mp}</td>
                  <td className="text-center text-zinc-300 font-bold tabular-nums">{team.w}</td>
                  <td className="text-center text-zinc-400 tabular-nums">{team.d}</td>
                  <td className="text-center text-zinc-400 tabular-nums">{team.l}</td>
                  <td className="text-center text-zinc-400 tabular-nums hidden sm:table-cell">{team.gf}</td>
                  <td className="text-center text-zinc-400 tabular-nums hidden sm:table-cell">{team.ga}</td>
                  <td className={`text-center tabular-nums font-bold ${
                    team.gd.startsWith("+") ? "text-emerald-400" : team.gd.startsWith("-") ? "text-red-400" : "text-zinc-500"
                  }`}>
                    {team.gd}
                  </td>
                  <td className="text-center pr-4 text-white font-black tabular-nums text-sm">{team.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-white/[0.04] flex items-center gap-3 text-[10px] text-zinc-600 font-semibold">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Qualified
        </span>
      </div>
    </motion.div>
  );
}

// ─── Knockout Match Card ──────────────────────────────────────────────────────

function KOMatchCard({ match }: { match: KOMatch }) {
  const isTBD = match.team1 === "TBD" && match.team2 === "TBD";
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "IN_PLAY" || match.status === "LIVE";
  const hasScore = match.team1_score != null && match.team2_score != null;

  const t1Won = hasScore && (match.team1_score ?? 0) > (match.team2_score ?? 0);
  const t2Won = hasScore && (match.team2_score ?? 0) > (match.team1_score ?? 0);

  const localTime = new Date(match.kickoff_time).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isLive
        ? "border-red-500/40 shadow-[0_0_12px_3px_rgba(239,68,68,0.20)]"
        : isFinished
        ? "border-white/[0.07]"
        : "border-white/[0.05] border-dashed"
    }`}>
      {/* Team 1 */}
      <div className={`flex items-center gap-2 px-3 py-2 ${
        isFinished && t1Won ? "bg-emerald-500/8" : isFinished && t2Won ? "opacity-50" : ""
      }`}>
        {match.team1_crest ? (
          <img src={match.team1_crest} className="w-5 h-5 object-contain shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-zinc-800 shrink-0" />
        )}
        <span className={`text-xs font-bold flex-1 truncate ${isTBD ? "text-zinc-600" : "text-zinc-200"}`}>
          {match.team1}
        </span>
        {hasScore && (
          <span className={`text-sm font-black tabular-nums ${
            isLive ? "text-red-300" : t1Won ? "text-white" : "text-zinc-500"
          }`}>
            {match.team1_score}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.04]" />

      {/* Team 2 */}
      <div className={`flex items-center gap-2 px-3 py-2 ${
        isFinished && t2Won ? "bg-emerald-500/8" : isFinished && t1Won ? "opacity-50" : ""
      }`}>
        {match.team2_crest ? (
          <img src={match.team2_crest} className="w-5 h-5 object-contain shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-zinc-800 shrink-0" />
        )}
        <span className={`text-xs font-bold flex-1 truncate ${isTBD ? "text-zinc-600" : "text-zinc-200"}`}>
          {match.team2}
        </span>
        {hasScore && (
          <span className={`text-sm font-black tabular-nums ${
            isLive ? "text-red-300" : t2Won ? "text-white" : "text-zinc-500"
          }`}>
            {match.team2_score}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className={`px-3 py-1.5 border-t text-[10px] font-semibold ${
        isLive
          ? "border-red-500/20 bg-red-500/5 text-red-400"
          : isFinished
          ? "border-white/[0.04] text-zinc-600"
          : "border-white/[0.03] text-zinc-600"
      }`}>
        {isLive ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
          </span>
        ) : isFinished ? (
          "FT"
        ) : (
          localTime
        )}
      </div>
    </div>
  );
}

// ─── Bracket Connector Lines ──────────────────────────────────────────────────

function BracketConnectors({ pairCount, height }: { pairCount: number; height: number }) {
  const pairH = height / pairCount;
  return (
    <div className="w-6 shrink-0 relative" style={{ height }}>
      {Array.from({ length: pairCount }).map((_, i) => {
        const topY = i * pairH + pairH * 0.25;
        const botY = i * pairH + pairH * 0.75;
        const midY = (topY + botY) / 2;
        return (
          <svg key={i} className="absolute inset-0 overflow-visible" style={{ width: 24, height }}>
            {/* top match → vertical */}
            <line x1={0} y1={topY} x2={12} y2={topY} stroke="rgba(113,113,122,0.4)" strokeWidth={1} />
            {/* bottom match → vertical */}
            <line x1={0} y1={botY} x2={12} y2={botY} stroke="rgba(113,113,122,0.4)" strokeWidth={1} />
            {/* vertical bar */}
            <line x1={12} y1={topY} x2={12} y2={botY} stroke="rgba(113,113,122,0.4)" strokeWidth={1} />
            {/* center → next round */}
            <line x1={12} y1={midY} x2={24} y2={midY} stroke="rgba(113,113,122,0.4)" strokeWidth={1} />
          </svg>
        );
      })}
    </div>
  );
}

// ─── Bracket Column ───────────────────────────────────────────────────────────

function BracketColumn({
  matches,
  label,
  height,
}: {
  matches: KOMatch[];
  label: string;
  height: number;
}) {
  return (
    <div className="flex flex-col shrink-0" style={{ width: 160 }}>
      <div className="text-[10px] uppercase tracking-widest font-black text-zinc-600 mb-2 text-center truncate px-1">
        {label}
      </div>
      <div className="flex flex-col justify-around" style={{ height }}>
        {matches.map((m) => (
          <KOMatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

// ─── Half Bracket (8 R32 → 4 R16 → 2 QF → 1 SF) ─────────────────────────────

function HalfBracket({
  r32,
  r16,
  qf,
  sf,
  height,
}: {
  r32: KOMatch[];
  r16: KOMatch[];
  qf: KOMatch[];
  sf: KOMatch[];
  height: number;
}) {
  return (
    <div className="flex items-start">
      <BracketColumn matches={r32} label="Round of 32" height={height} />
      <BracketConnectors pairCount={r32.length / 2} height={height} />
      <BracketColumn matches={r16} label="Round of 16" height={height} />
      <BracketConnectors pairCount={r16.length / 2} height={height} />
      <BracketColumn matches={qf} label="Quarter-finals" height={height} />
      <BracketConnectors pairCount={qf.length / 2} height={height} />
      <BracketColumn matches={sf} label="Semi-final" height={height} />
    </div>
  );
}

// ─── Knockout Bracket Section ─────────────────────────────────────────────────

function KnockoutBracket({ rounds }: { rounds: KORounds }) {
  const r32 = rounds.LAST_32 ?? [];
  const r16 = rounds.LAST_16 ?? [];
  const qf = rounds.QUARTER_FINALS ?? [];
  const sf = rounds.SEMI_FINALS ?? [];
  const final = rounds.FINAL ?? [];
  const third = rounds.THIRD_PLACE ?? [];

  const hasAnyTeam = [...r32, ...r16, ...qf, ...sf, ...final].some(
    (m) => m.team1 !== "TBD" || m.team2 !== "TBD"
  );

  // Split each round into top/bottom halves
  const half = <T,>(arr: T[]) => [arr.slice(0, Math.ceil(arr.length / 2)), arr.slice(Math.ceil(arr.length / 2))];
  const [topR32, botR32] = half(r32);
  const [topR16, botR16] = half(r16);
  const [topQF, botQF] = half(qf);
  const [topSF, botSF] = half(sf);

  // Height calculation: each match ~52px, R32 of 8 matches needs ~460px
  const MATCH_H = 52;
  const r32Count = Math.max(topR32.length, botR32.length, 1);
  const bracketH = r32Count * MATCH_H + (r32Count - 1) * 8;

  return (
    <div className="space-y-8">
      {/* Top half bracket */}
      <div>
        <div className="overflow-x-auto pb-4 -mx-3 px-3">
          <div style={{ minWidth: 740 }}>
            <HalfBracket
              r32={topR32}
              r16={topR16}
              qf={topQF}
              sf={topSF}
              height={bracketH}
            />
          </div>
        </div>
      </div>

      {/* Final + Third Place — center */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {final.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-yellow-400">🏆 Final</span>
            <div style={{ width: 180 }}>
              <KOMatchCard match={final[0]} />
            </div>
          </div>
        )}
        {third.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500">🥉 3rd Place</span>
            <div style={{ width: 180 }}>
              <KOMatchCard match={third[0]} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom half bracket */}
      <div>
        <div className="overflow-x-auto pb-4 -mx-3 px-3">
          <div style={{ minWidth: 740 }}>
            <HalfBracket
              r32={botR32}
              r16={botR16}
              qf={botQF}
              sf={botSF}
              height={bracketH}
            />
          </div>
        </div>
      </div>

      {!hasAnyTeam && (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">🏆</div>
          <div className="text-zinc-400 font-bold">Knockout stage hasn't started yet</div>
          <div className="text-zinc-600 text-sm mt-1">
            Matchups will appear as teams qualify from the group stage
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StandingsPage() {
  const [tab, setTab] = useState<"groups" | "knockout">("groups");
  const [groups, setGroups] = useState<GroupStanding[]>([]);
  const [koRounds, setKoRounds] = useState<KORounds>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/standings").then((r) => r.json()),
      fetch("/api/knockout").then((r) => r.json()),
    ])
      .then(([standingsData, koData]) => {
        setGroups(standingsData.groups ?? []);
        setKoRounds(koData.rounds ?? {});
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageWrapper>
      <Header />
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <div className="text-zinc-500 uppercase tracking-[0.35em] text-xs font-black mb-1">
            FIFA World Cup 2026
          </div>
          <h1 className="text-4xl sm:text-5xl font-black">Standings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(["groups", "knockout"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${
                tab === t
                  ? "bg-white text-black shadow-[0_0_20px_4px_rgba(255,255,255,0.15)]"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
              }`}
            >
              {t === "groups" ? "Group Stage" : "Knockout"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-yellow-400 rounded-full animate-spin" />
          </div>
        ) : tab === "groups" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map((g, gi) => (
              <GroupTable key={g.group} g={g} delay={gi * 0.04} />
            ))}
          </div>
        ) : (
          <KnockoutBracket rounds={koRounds} />
        )}
      </div>
    </PageWrapper>
  );
}
