"use client";

import type { Match, Prediction, PredictedScore } from "@/types";
import { useLocaleCtx } from "@/context/LocaleContext";
import { getT } from "@/lib/translations";

type Props = {
  match: Match;
  locked: boolean;
  predictions: Record<number, Prediction>;
  predictedScores: Record<number, PredictedScore>;
  setPredictedScores: (scores: Record<number, PredictedScore>) => void;
  submitPrediction: (matchId: number) => void;
  cancelPrediction: (matchId: number) => void;
};

const KNOCKOUT_ROUNDS = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];

const getResult = (home: number | string, away: number | string) => {
  if (home === "" || away === "") return null;
  const h = Number(home);
  const a = Number(away);
  if (h > a) return "home";
  if (a > h) return "away";
  return "draw";
};

function ScoreInput({
  value,
  disabled,
  highlight,
  small,
  onChange,
}: {
  value: number | string;
  disabled: boolean;
  highlight: boolean;
  small?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative group">
      <div className={`absolute inset-0 rounded-2xl blur-md transition-opacity ${highlight ? "bg-yellow-400/20 opacity-100" : "opacity-0"}`} />
      <input
        type="number"
        min="0"
        max="30"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onWheel={(e) => e.currentTarget.blur()}
        onKeyDown={(e) => ["e", "E", "+", "-", "."].includes(e.key) && e.preventDefault()}
        placeholder="–"
        className={`
          relative ${small ? "w-12 h-12 text-2xl rounded-xl" : "w-16 h-16 md:w-20 md:h-20 text-4xl md:text-5xl rounded-2xl"}
          border text-center font-black tabular-nums outline-none transition-all bg-zinc-900
          placeholder:text-zinc-700 disabled:cursor-not-allowed
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
          ${disabled ? "border-zinc-800 text-zinc-500" : highlight ? "border-yellow-400/60 text-yellow-300 focus:border-yellow-400" : "border-zinc-700 text-white focus:border-zinc-500"}
        `}
      />
    </div>
  );
}

export default function PredictionControls({
  match,
  locked,
  predictions,
  predictedScores,
  setPredictedScores,
  submitPrediction,
  cancelPrediction,
}: Props) {
  const { locale } = useLocaleCtx();
  const t = getT(locale);
  const prediction = predictions[match.id];
  const predictionLocked = !!prediction?.match_id;
  const scoreData = predictedScores[match.id] || { home: "", away: "" };
  const result = getResult(scoreData.home, scoreData.away);
  const inputDisabled = locked || predictionLocked;
  const isKnockout = KNOCKOUT_ROUNDS.includes(match.matchday ?? "");
  const isDraw = result === "draw";
  const isPK = isKnockout && !!scoreData.penaltyShootout;
  const scoreDisabled = inputDisabled || isPK;
  const pkResult = getResult(scoreData.pkHome ?? "", scoreData.pkAway ?? "");

  const updateScore = (side: "home" | "away", value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    const num = value === "" ? "" : Math.min(30, Math.max(0, Number(value)));
    setPredictedScores({
      ...predictedScores,
      [match.id]: { ...scoreData, [side]: num },
    });
  };

  const updatePKScore = (side: "pkHome" | "pkAway", value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    const num = value === "" ? "" : Math.min(30, Math.max(0, Number(value)));
    setPredictedScores({
      ...predictedScores,
      [match.id]: { ...scoreData, [side]: num },
    });
  };

  const togglePK = () => {
    const turningOn = !scoreData.penaltyShootout;
    setPredictedScores({
      ...predictedScores,
      [match.id]: {
        ...scoreData,
        penaltyShootout: turningOn,
        ...(turningOn
          ? { home: 0, away: 0 }
          : { pkHome: "", pkAway: "", home: "", away: "" }),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* SCOREBOARD CARD — hidden when PK mode is active */}
      {!isPK && (
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">

        {/* LABEL */}
        <div className="px-8 pt-7 pb-0 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.35em] text-zinc-600 font-black">
            {t("pred.yourPred")}
          </span>
          {isKnockout && (
            <span className="text-[10px] uppercase tracking-widest text-zinc-700 font-black">
              Knockout
            </span>
          )}
        </div>

        {/* MAIN SCOREBOARD */}
        <div className="flex items-center px-6 py-8 gap-4">
          {/* HOME TEAM */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/5 blur-xl scale-150" />
              <img src={match.team1_crest || "/placeholder-team.png"} alt={match.team1} className="relative w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg" />
            </div>
            <span className={`text-sm md:text-base font-black text-center leading-tight transition-colors ${
              result === "home" ? "text-white" : result ? "text-zinc-500" : "text-zinc-300"
            }`}>
              {match.team1}
            </span>
          </div>

          {/* SCORE INPUTS */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <ScoreInput value={scoreData.home} disabled={scoreDisabled} highlight={result === "home"} onChange={(v) => updateScore("home", v)} />
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            </div>
            <ScoreInput value={scoreData.away} disabled={scoreDisabled} highlight={result === "away"} onChange={(v) => updateScore("away", v)} />
          </div>

          {/* AWAY TEAM */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/5 blur-xl scale-150" />
              <img src={match.team2_crest || "/placeholder-team.png"} alt={match.team2} className="relative w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg" />
            </div>
            <span className={`text-sm md:text-base font-black text-center leading-tight transition-colors ${
              result === "away" ? "text-white" : result ? "text-zinc-500" : "text-zinc-300"
            }`}>
              {match.team2}
            </span>
          </div>
        </div>

        {/* RESULT BANNER */}
        <div className={`px-8 py-4 border-t border-zinc-800/60 flex items-center justify-center transition-all ${result ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {result === "home" && (
            <div className="flex items-center gap-2 text-sm font-black text-yellow-300">
              <span>{match.team1} wins</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 font-semibold">{String(scoreData.home)} – {String(scoreData.away)}</span>
            </div>
          )}
          {result === "away" && (
            <div className="flex items-center gap-2 text-sm font-black text-yellow-300">
              <span>{match.team2} wins</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 font-semibold">{String(scoreData.home)} – {String(scoreData.away)}</span>
            </div>
          )}
          {isDraw && !isKnockout && (
            <div className="flex items-center gap-2 text-sm font-black text-zinc-300">
              <span>Draw</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-400 font-semibold">{String(scoreData.home)} – {String(scoreData.away)}</span>
            </div>
          )}
          {isKnockout && isDraw && (
            <div className="flex items-center gap-2 text-sm font-black text-red-400">
              <span>⚠️ Draws not allowed in knockout</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500 font-semibold text-xs">change score or toggle penalties ↓</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* PENALTY SHOOTOUT TOGGLE — knockout only */}
      {isKnockout && !inputDisabled && (
        <button
          onClick={togglePK}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl border text-sm font-black transition-all ${
            isPK
              ? "border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-[0_0_16px_3px_rgba(245,158,11,0.15)]"
              : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
          }`}
        >
          <span className="text-lg">⚽</span>
          <span>Penalty Shootout</span>
          <span className={`w-10 h-5 rounded-full relative transition-all ${isPK ? "bg-amber-500" : "bg-zinc-700"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isPK ? "left-5" : "left-0.5"}`} />
          </span>
        </button>
      )}
      {isKnockout && inputDisabled && isPK && (
        <div className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-black">
          <span>⚽</span> Penalty shootout predicted
        </div>
      )}

      {/* PK SCORE — shown when PK toggle is on */}
      {isPK && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
          <div className="px-6 pt-5 pb-0">
            <span className="text-[10px] uppercase tracking-[0.35em] text-amber-500/60 font-black">
              Penalty Score
            </span>
          </div>
          <div className="flex items-center justify-center gap-4 px-6 py-5">
            <div className="flex items-center gap-2">
              <img src={match.team1_crest || "/placeholder-team.png"} className="w-6 h-6 object-contain" />
              <span className="text-xs font-black text-zinc-300">{match.team1}</span>
            </div>
            <div className="flex items-center gap-2">
              <ScoreInput value={scoreData.pkHome ?? ""} disabled={inputDisabled} highlight={pkResult === "home"} small onChange={(v) => updatePKScore("pkHome", v)} />
              <div className="flex flex-col items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-zinc-600" />
                <div className="w-1 h-1 rounded-full bg-zinc-600" />
              </div>
              <ScoreInput value={scoreData.pkAway ?? ""} disabled={inputDisabled} highlight={pkResult === "away"} small onChange={(v) => updatePKScore("pkAway", v)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-zinc-300">{match.team2}</span>
              <img src={match.team2_crest || "/placeholder-team.png"} className="w-6 h-6 object-contain" />
            </div>
          </div>
          {pkResult === "draw" && (
            <div className="px-6 pb-4 text-center text-red-400 text-xs font-bold">
              ⚠️ Penalty score can&apos;t be a draw
            </div>
          )}
          {pkResult && pkResult !== "draw" && (
            <div className="px-6 pb-4 text-center text-amber-300 text-xs font-bold">
              {pkResult === "home" ? match.team1 : match.team2} wins on penalties ({String(scoreData.pkHome)}–{String(scoreData.pkAway)})
            </div>
          )}
        </div>
      )}

      {/* SUBMIT */}
      {!locked && !predictionLocked && (() => {
        const hasScore = !isPK && scoreData.home !== "" && scoreData.away !== "";
        const knockoutInvalid = isKnockout && !isPK && isDraw;
        const pkInvalid = isPK && (
          scoreData.pkHome === "" || scoreData.pkHome === undefined ||
          scoreData.pkAway === "" || scoreData.pkAway === undefined ||
          pkResult === "draw" || pkResult === null
        );
        const disabled = (!isPK && !hasScore) || knockoutInvalid || pkInvalid;
        return (
          <button
            onClick={() => submitPrediction(match.id)}
            disabled={disabled}
            className={`w-full py-5 rounded-3xl text-lg font-black active:scale-[0.98] transition-all ${
              disabled
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-yellow-400 text-black hover:bg-yellow-300"
            }`}
          >
            {t("pred.submit")}
          </button>
        );
      })()}

      {/* CANCEL */}
      {!locked && predictionLocked && (
        <button
          onClick={() => cancelPrediction(match.id)}
          className="px-8 py-4 rounded-3xl bg-red-500/10 border border-red-500/25 text-red-400 font-black hover:bg-red-500/20 transition-all"
        >
          ✕ {t("pred.cancel")}
        </button>
      )}
    </div>
  );
}
