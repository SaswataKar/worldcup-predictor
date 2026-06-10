/**
 * Gameday window key: each Gameday opens at 9:30 PM IST (= 16:00 UTC).
 * Subtract 16 h from UTC kickoff so all matches in the same overnight window
 * share a single date string (the evening the window opened).
 */
export function getGamedayKey(kickoffTime: string): string {
  const shifted = new Date(new Date(kickoffTime).getTime() - 16 * 60 * 60 * 1000);
  return shifted.toISOString().split("T")[0];
}
