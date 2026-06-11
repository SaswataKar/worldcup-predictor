import re

with open('src/components/MatchCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = content[content.index('// ─── Event Timeline'):content.index('\nexport default function MatchCard')]

new = '''// ─── Event Timeline (ESPN format) ────────────────────────────────────────────

function parseMinute(m: string): number {
  const clean = m.replace("'", "");
  const parts = clean.split("+").map(Number);
  return (parts[0] || 0) + (parts[1] || 0);
}

type UnifiedEvent =
  | { kind: "goal"; minute: string; team: "home" | "away"; scorer: string; assist: string | null; ownGoal: boolean; penalty: boolean }
  | { kind: "booking"; minute: string; team: "home" | "away"; player: string; cardType: "Yellow" | "Red" }
  | { kind: "sub"; minute: string; team: "home" | "away"; playerOut: string; playerIn: string };

function buildEvents(match: Match): UnifiedEvent[] {
  const goals = (match.goals ?? []) as ESPNGoal[];
  const bookings = (match.bookings ?? []) as ESPNBooking[];
  const subs = (match.substitutions ?? []) as ESPNSubstitution[];

  const all: UnifiedEvent[] = [
    ...goals.map((g) => ({ kind: "goal" as const, minute: g.minute, team: g.team, scorer: g.scorer, assist: g.assist, ownGoal: g.ownGoal, penalty: g.penalty })),
    ...bookings.map((b) => ({ kind: "booking" as const, minute: b.minute, team: b.team, player: b.player, cardType: b.type })),
    ...subs.map((s) => ({ kind: "sub" as const, minute: s.minute, team: s.team, playerOut: s.playerOut, playerIn: s.playerIn })),
  ];

  return all.sort((a, b) => parseMinute(a.minute) - parseMinute(b.minute));
}

function EventTimeline({ match, eventsLabel }: { match: Match; eventsLabel: string }) {
  const events = buildEvents(match);
  if (!events.length) return null;

  return (
    <div className="mt-8 pt-6 border-t border-zinc-800/60">
      <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black mb-4">
        {eventsLabel}
      </div>
      <div className="space-y-2">
        {events.map((ev, i) => {
          const isHome = ev.team === "home";
          let icon = "";
          let mainText = "";
          let subText: string | null = null;

          if (ev.kind === "goal") {
            icon = ev.ownGoal ? "⚽🔴" : ev.penalty ? "⚽🎯" : "⚽";
            mainText = ev.scorer;
            if (ev.ownGoal) subText = "Own Goal";
            else if (ev.penalty) subText = "Penalty";
            else if (ev.assist) subText = `Assist: ${ev.assist}`;
          } else if (ev.kind === "booking") {
            icon = ev.cardType === "Red" ? "🟥" : "🟨";
            mainText = ev.player;
            subText = ev.cardType === "Red" ? "Red Card" : "Yellow Card";
          } else {
            icon = "🔄";
          }

          return (
            <div key={i} className={`flex items-center gap-2 ${isHome ? "flex-row" : "flex-row-reverse"}`}>
              <div className="shrink-0 w-10 text-center">
                <span className="text-[11px] font-black text-zinc-500 tabular-nums">{ev.minute}</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 min-w-0 max-w-[220px] ${isHome ? "" : "flex-row-reverse"}`}>
                <span className="shrink-0 text-sm leading-none">{icon}</span>
                <div className={`min-w-0 ${isHome ? "text-left" : "text-right"}`}>
                  {ev.kind === "sub" ? (
                    <div className="leading-tight">
                      <span className="text-emerald-400 font-bold text-xs truncate block">↑ {ev.playerIn}</span>
                      <span className="text-red-400 font-bold text-xs truncate block">↓ {ev.playerOut}</span>
                    </div>
                  ) : (
                    <div className="leading-tight">
                      <span className="font-bold text-xs truncate block">{mainText}</span>
                      {subText && <span className="text-zinc-500 text-[10px]">{subText}</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

'''

content = content.replace(old, new)

with open('src/components/MatchCard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
