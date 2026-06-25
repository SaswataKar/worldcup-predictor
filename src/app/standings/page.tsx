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

type PlayerEntry = {
  name: string;
  shortName: string;
  headshot: string;
  jersey: string;
  team: string;
  teamLogo: string;
  goals: number;
  assists: number;
  appearances: number;
};

type StatCategory = {
  category: string;
  players: PlayerEntry[];
};

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

function KOMatchCard({ match, compact }: { match: KOMatch; compact?: boolean }) {
  const isTBD = match.team1 === "TBD" && match.team2 === "TBD";
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "IN_PLAY" || match.status === "LIVE";
  const hasScore = match.team1_score != null && match.team2_score != null;

  const t1Won = hasScore && (match.team1_score ?? 0) > (match.team2_score ?? 0);
  const t2Won = hasScore && (match.team2_score ?? 0) > (match.team1_score ?? 0);

  const localTime = new Date(match.kickoff_time).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });

  const py = compact ? "py-1" : "py-2";
  const iconSize = compact ? "w-4 h-4" : "w-5 h-5";
  const fontSize = compact ? "text-[11px]" : "text-xs";

  return (
    <div className={`${compact ? "rounded-xl" : "rounded-2xl"} border overflow-hidden transition-all h-full flex flex-col ${
      isLive
        ? "border-red-500/40 shadow-[0_0_12px_3px_rgba(239,68,68,0.20)]"
        : isFinished
        ? "border-white/[0.07] bg-zinc-950/60"
        : "border-white/[0.06] border-dashed bg-zinc-950/30"
    }`}>
      {/* Team 1 */}
      <div className={`flex items-center gap-1.5 px-2 ${py} flex-1 ${
        isFinished && t1Won ? "bg-emerald-500/8" : isFinished && t2Won ? "opacity-40" : ""
      }`}>
        {match.team1_crest ? (
          <img src={match.team1_crest} className={`${iconSize} object-contain shrink-0`} />
        ) : (
          <div className={`${iconSize} rounded-full bg-zinc-800 shrink-0`} />
        )}
        <span className={`${fontSize} font-bold flex-1 truncate ${isTBD ? "text-zinc-600" : "text-zinc-200"}`}>
          {match.team1}
        </span>
        {hasScore && (
          <span className={`${compact ? "text-xs" : "text-sm"} font-black tabular-nums ${
            isLive ? "text-red-300" : t1Won ? "text-white" : "text-zinc-500"
          }`}>
            {match.team1_score}
          </span>
        )}
      </div>

      <div className="h-px bg-white/[0.04]" />

      {/* Team 2 */}
      <div className={`flex items-center gap-1.5 px-2 ${py} flex-1 ${
        isFinished && t2Won ? "bg-emerald-500/8" : isFinished && t1Won ? "opacity-40" : ""
      }`}>
        {match.team2_crest ? (
          <img src={match.team2_crest} className={`${iconSize} object-contain shrink-0`} />
        ) : (
          <div className={`${iconSize} rounded-full bg-zinc-800 shrink-0`} />
        )}
        <span className={`${fontSize} font-bold flex-1 truncate ${isTBD ? "text-zinc-600" : "text-zinc-200"}`}>
          {match.team2}
        </span>
        {hasScore && (
          <span className={`${compact ? "text-xs" : "text-sm"} font-black tabular-nums ${
            isLive ? "text-red-300" : t2Won ? "text-white" : "text-zinc-500"
          }`}>
            {match.team2_score}
          </span>
        )}
      </div>

      {/* Footer — hidden in compact bracket mode */}
      {!compact && (
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
          ) : isFinished ? "FT" : localTime}
        </div>
      )}
    </div>
  );
}

// ─── Full Bracket with absolute positioning ──────────────────────────────────

const CARD_W = 148;
const CARD_H = 48;
const COL_GAP = 48;
const ROW_GAP = 4;
const LABEL_H = 36;

const ROUND_ICONS = ["⚔️", "🎯", "🔥", "⭐", "🏆"];

function cardY(roundIndex: number, matchIndex: number): number {
  const step = (CARD_H + ROW_GAP) * Math.pow(2, roundIndex);
  const start = (step - CARD_H) / 2;
  return start + matchIndex * step;
}

function colX(roundIndex: number): number {
  return roundIndex * (CARD_W + COL_GAP);
}

function getWinnerIdx(m: KOMatch): 0 | 1 | null {
  if (m.status !== "FINISHED" || m.team1_score == null || m.team2_score == null) return null;
  if (m.team1_score > m.team2_score) return 0;
  if (m.team2_score > m.team1_score) return 1;
  return null;
}

function KnockoutBracket({ rounds }: { rounds: KORounds }) {
  const allRounds: KOMatch[][] = [
    rounds.LAST_32 ?? [],
    rounds.LAST_16 ?? [],
    rounds.QUARTER_FINALS ?? [],
    rounds.SEMI_FINALS ?? [],
    rounds.FINAL ?? [],
  ];
  const third = rounds.THIRD_PLACE ?? [];
  const labels = ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"];

  const r0Count = allRounds[0].length || 16;
  const totalH = cardY(0, r0Count - 1) + CARD_H;
  const totalW = colX(allRounds.length - 1) + CARD_W;

  const hasAnyTeam = allRounds.some((r) => r.some((m) => m.team1 !== "TBD" || m.team2 !== "TBD"));

  const finalY = allRounds[4]?.length ? cardY(4, 0) : 0;
  const thirdY = finalY + CARD_H + 32;
  const FINAL_W = 180;
  const FINAL_H = 60;

  return (
    <div>
      <div className="overflow-x-auto pb-6 -mx-3 px-3">
        <div
          className="relative"
          style={{
            width: Math.max(totalW, colX(4) + FINAL_W),
            height: LABEL_H + Math.max(totalH, thirdY + (third.length ? CARD_H + 28 : 0)),
            minWidth: Math.max(totalW, colX(4) + FINAL_W),
          }}
        >
          {/* ── 6. Pair grouping bands on R32 ── */}
          {allRounds[0].map((_, mi) => {
            if (mi % 2 !== 0) return null;
            const pairIdx = Math.floor(mi / 2);
            const isOdd = pairIdx % 2 === 1;
            if (!isOdd) return null;
            const y1 = cardY(0, mi);
            const y2 = cardY(0, mi + 1) + CARD_H;
            return (
              <div
                key={`band-${mi}`}
                className="absolute rounded-lg"
                style={{
                  left: colX(0) - 4,
                  top: LABEL_H + y1 - 2,
                  width: CARD_W + 8,
                  height: y2 - y1 + 4,
                  background: "rgba(255,255,255,0.02)",
                }}
              />
            );
          })}

          {/* ── 4. Round header pills ── */}
          {labels.map((label, ri) => {
            if (!allRounds[ri]?.length) return null;
            const isFinal = ri === 4;
            return (
              <div
                key={ri}
                className="absolute flex items-center justify-center"
                style={{
                  left: isFinal ? colX(ri) + (FINAL_W - CARD_W) / 2 : colX(ri),
                  top: 0,
                  width: isFinal ? FINAL_W : CARD_W,
                }}
              >
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-black
                  ${isFinal
                    ? "bg-yellow-500/15 border border-yellow-500/30 text-yellow-400"
                    : "bg-zinc-900 border border-zinc-700/60 text-zinc-500"
                  }`}>
                  <span>{ROUND_ICONS[ri]}</span>
                  <span>{label}</span>
                </span>
              </div>
            );
          })}

          {/* ── SVG connectors with winner glow ── */}
          <svg
            className="absolute pointer-events-none"
            style={{ top: LABEL_H, left: 0, width: Math.max(totalW, colX(4) + FINAL_W), height: totalH }}
          >
            {/* Glow filter for winner paths */}
            <defs>
              <filter id="winGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {allRounds.map((matches, ri) => {
              if (ri >= allRounds.length - 1) return null;
              const next = allRounds[ri + 1];
              if (!next?.length) return null;

              return matches.map((m, mi) => {
                if (mi % 2 !== 0) return null;
                const pairIdx = Math.floor(mi / 2);
                if (mi + 1 >= matches.length || pairIdx >= next.length) return null;

                const topMatch = matches[mi];
                const botMatch = matches[mi + 1];
                const topWinner = getWinnerIdx(topMatch);
                const botWinner = getWinnerIdx(botMatch);

                const y1 = cardY(ri, mi) + CARD_H / 2;
                const y2 = cardY(ri, mi + 1) + CARD_H / 2;
                const yNext = cardY(ri + 1, pairIdx) + CARD_H / 2;

                const x1 = colX(ri) + CARD_W;
                const xMid = x1 + COL_GAP / 2;
                const isFinalCol = ri + 1 === 4;
                const x2 = isFinalCol ? colX(ri + 1) + (FINAL_W - CARD_W) / 2 : colX(ri + 1);

                const dim = "rgba(113,113,122,0.18)";
                const active = "rgba(52,211,153,0.7)";

                // Top match won → its line glows green
                const topFinished = topMatch.status === "FINISHED";
                const topIsWinner = topWinner !== null;
                // Bot match won → its line glows green
                const botFinished = botMatch.status === "FINISHED";
                const botIsWinner = botWinner !== null;

                // The advancing line from midpoint to next round
                const advancerIsTop = topFinished && topIsWinner;
                const advancerIsBot = botFinished && botIsWinner;
                const hasAdvancer = advancerIsTop || advancerIsBot;

                return (
                  <g key={`c-${ri}-${mi}`}>
                    {/* Top match horizontal */}
                    <line x1={x1} y1={y1} x2={xMid} y2={y1}
                      stroke={topFinished && topIsWinner ? active : dim} strokeWidth={topFinished && topIsWinner ? 2 : 1}
                      filter={topFinished && topIsWinner ? "url(#winGlow)" : undefined} />
                    {/* Bot match horizontal */}
                    <line x1={x1} y1={y2} x2={xMid} y2={y2}
                      stroke={botFinished && botIsWinner ? active : dim} strokeWidth={botFinished && botIsWinner ? 2 : 1}
                      filter={botFinished && botIsWinner ? "url(#winGlow)" : undefined} />
                    {/* Vertical bar — dim unless one side has advanced */}
                    <line x1={xMid} y1={y1} x2={xMid} y2={y2}
                      stroke={hasAdvancer ? "rgba(52,211,153,0.3)" : dim} strokeWidth={1} />
                    {/* Center to next round */}
                    <line x1={xMid} y1={yNext} x2={x2} y2={yNext}
                      stroke={hasAdvancer ? active : dim} strokeWidth={hasAdvancer ? 2 : 1}
                      filter={hasAdvancer ? "url(#winGlow)" : undefined} />
                  </g>
                );
              });
            })}
          </svg>

          {/* ── Match cards ── */}
          {allRounds.map((matches, ri) =>
            matches.map((m, mi) => {
              const isFinal = ri === 4;
              const w = isFinal ? FINAL_W : CARD_W;
              const h = isFinal ? FINAL_H : CARD_H;
              const adjustedY = isFinal ? cardY(ri, mi) - (FINAL_H - CARD_H) / 2 : cardY(ri, mi);
              const adjustedX = isFinal ? colX(ri) + (FINAL_W - CARD_W) / 2 : colX(ri);
              return (
                <div
                  key={m.id}
                  className={`absolute ${isFinal ? "z-10" : ""}`}
                  style={{ left: adjustedX, top: LABEL_H + adjustedY, width: w, height: h }}
                >
                  {/* 3. Grand Final glow */}
                  {isFinal && (
                    <div className="absolute -inset-3 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 shadow-[0_0_40px_8px_rgba(234,179,8,0.15)] -z-10" />
                  )}
                  <KOMatchCard match={m} compact={!isFinal} />
                </div>
              );
            })
          )}

          {/* ── 3rd Place match — below Final ── */}
          {third.length > 0 && (
            <div
              className="absolute"
              style={{
                left: colX(4) + (FINAL_W - CARD_W) / 2,
                top: LABEL_H + thirdY,
                width: FINAL_W,
              }}
            >
              <div className="text-[9px] uppercase tracking-widest font-black text-zinc-500 text-center mb-1.5 flex items-center justify-center gap-1">
                <span>🥉</span> 3rd Place
              </div>
              <div style={{ height: CARD_H }}>
                <KOMatchCard match={third[0]} compact />
              </div>
            </div>
          )}
        </div>
      </div>

      {!hasAnyTeam && (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">🏆</div>
          <div className="text-zinc-400 font-bold">Knockout stage hasn't started yet</div>
          <div className="text-zinc-600 text-sm mt-1">Matchups will appear as teams qualify from the group stage</div>
        </div>
      )}
    </div>
  );
}

// ─── Player Stats Section ─────────────────────────────────────────────────────

const STAT_ICONS: Record<string, string> = {
  Goals: "⚽",
  Assists: "🅰️",
};

function PlayerStatsView({ categories }: { categories: StatCategory[] }) {
  if (!categories.length) {
    return (
      <div className="text-center py-12">
        <div className="text-zinc-500 font-bold">No player stats available yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {categories.map((cat) => (
        <motion.div
          key={cat.category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{STAT_ICONS[cat.category] ?? "📊"}</span>
            <h3 className="text-xl font-black text-white">Top {cat.category}</h3>
          </div>

          <div className="rounded-3xl border border-white/[0.07] overflow-hidden backdrop-blur-md
            shadow-[0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-500 font-black text-[10px] uppercase tracking-widest border-b border-white/[0.06]">
                    <th className="text-left pl-4 py-3 w-8">#</th>
                    <th className="text-left py-3">Player</th>
                    <th className="text-center py-3 w-12">MP</th>
                    <th className="text-center py-3 w-12">
                      {cat.category === "Assists" ? "A" : "G"}
                    </th>
                    {cat.category === "Goals" && (
                      <th className="text-center py-3 pr-4 w-12">A</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {cat.players.map((player, i) => {
                    const isTop3 = i < 3;
                    const statValue = cat.category === "Assists" ? player.assists : player.goals;

                    return (
                      <tr
                        key={`${player.name}-${i}`}
                        className={`border-b border-white/[0.03] last:border-0 transition-colors hover:bg-white/[0.03]
                          ${isTop3 ? "bg-yellow-500/5" : ""}`}
                      >
                        <td className="pl-4 py-2.5">
                          <span className={`font-black text-sm tabular-nums ${
                            i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-600" : "text-zinc-600"
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2.5">
                            {player.headshot ? (
                              <img
                                src={player.headshot}
                                alt={player.name}
                                className="w-8 h-8 rounded-full object-cover bg-zinc-800 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-600 text-xs font-bold">
                                {player.jersey || "?"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-200 text-sm truncate">{player.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {player.teamLogo && (
                                  <img src={player.teamLogo} className="w-3.5 h-3.5 object-contain" />
                                )}
                                <span className="text-zinc-500 text-[11px] font-semibold truncate">{player.team}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center text-zinc-400 tabular-nums">{player.appearances}</td>
                        <td className="text-center tabular-nums">
                          <span className={`font-black text-sm ${isTop3 ? "text-white" : "text-zinc-300"}`}>
                            {statValue}
                          </span>
                        </td>
                        {cat.category === "Goals" && (
                          <td className="text-center pr-4 text-zinc-500 tabular-nums">{player.assists}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabKey = "groups" | "knockout" | "players";

export default function StandingsPage() {
  const [tab, setTab] = useState<TabKey>("groups");
  const [groups, setGroups] = useState<GroupStanding[]>([]);
  const [koRounds, setKoRounds] = useState<KORounds>({});
  const [playerStats, setPlayerStats] = useState<StatCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/standings").then((r) => r.json()),
      fetch("/api/knockout").then((r) => r.json()),
      fetch("/api/player-stats").then((r) => r.json()),
    ])
      .then(([standingsData, koData, statsData]) => {
        setGroups(standingsData.groups ?? []);
        setKoRounds(koData.rounds ?? {});
        setPlayerStats(statsData.categories ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "groups", label: "Group Stage" },
    { key: "knockout", label: "Knockout" },
    { key: "players", label: "Player Stats" },
  ];

  return (
    <PageWrapper>
      <Header />
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8">
        <div className="mb-8">
          <div className="text-zinc-500 uppercase tracking-[0.35em] text-xs font-black mb-1">
            FIFA World Cup 2026
          </div>
          <h1 className="text-4xl sm:text-5xl font-black">Standings</h1>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${
                tab === t.key
                  ? "bg-white text-black shadow-[0_0_20px_4px_rgba(255,255,255,0.15)]"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
              }`}
            >
              {t.label}
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
        ) : tab === "knockout" ? (
          <KnockoutBracket rounds={koRounds} />
        ) : (
          <PlayerStatsView categories={playerStats} />
        )}
      </div>
    </PageWrapper>
  );
}
